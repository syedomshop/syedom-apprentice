import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repo_link, explanation, task_id, intern_id } = await req.json();

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check AI usage safety
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase
      .from("ai_usage")
      .select("*")
      .eq("date", today)
      .maybeSingle();

    const dailyLimit = 10000;
    const tokensUsed = usage?.tokens_used || 0;

    // Even in warning mode, grading is still allowed
    if (tokensUsed / dailyLimit > 0.95) {
      // In critical mode, still allow grading but flag it
      console.log("Critical mode: grading proceeding as essential operation");
    }

    // Get task details
    const { data: task } = await supabase
      .from("tasks")
      .select("title, description, learning_objective")
      .eq("id", task_id)
      .single();

    const prompt = `You are an AI grading assistant for a software development internship at Syedom Labs.

Grade the following submission:

Task: ${task?.title || "Unknown"}
Task Description: ${task?.description || "N/A"}
Learning Objective: ${task?.learning_objective || "N/A"}
Repository Link: ${repo_link}
Student Explanation: ${explanation}

Evaluate based on:
1. Code quality and structure
2. Completion of requirements
3. Understanding demonstrated in explanation
4. Best practices

Return ONLY valid JSON with:
{
  "score": <number 0-10>,
  "feedback": "<2-3 sentences of feedback>",
  "improvements": "<specific improvement suggestions>"
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const tokensInResponse = geminiData.usageMetadata?.totalTokenCount || 300;

    // Parse result
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 5, feedback: "Unable to parse AI response." };

    // Update submission
    await supabase
      .from("submissions")
      .update({
        ai_score: result.score,
        ai_feedback: `${result.feedback}\n\nImprovements: ${result.improvements || "N/A"}`,
        status: "graded",
      })
      .eq("intern_id", intern_id)
      .eq("task_id", task_id)
      .order("created_at", { ascending: false })
      .limit(1);

    // Update AI usage
    await supabase.from("ai_usage").upsert(
      {
        date: today,
        tokens_used: tokensUsed + tokensInResponse,
        api_calls: (usage?.api_calls || 0) + 1,
      },
      { onConflict: "date" }
    );

    return new Response(JSON.stringify({ success: true, score: result.score }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
