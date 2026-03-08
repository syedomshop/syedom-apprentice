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
    if (tokensUsed / dailyLimit > 0.95) {
      return new Response(JSON.stringify({ error: "Critical mode: AI paused" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini API
    const prompt = `Generate exactly 10 beginner-to-intermediate programming internship tasks for web development interns.
For each task, provide a JSON array with objects containing:
- title (string)
- description (string, 2-3 sentences)
- difficulty (string: "Beginner" or "Intermediate")
- estimated_time (string, e.g. "45 min")
- learning_objective (string, one sentence)
- youtube_link (string, a relevant YouTube tutorial URL)

Return ONLY valid JSON array, no markdown or extra text.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const tokensInResponse = geminiData.usageMetadata?.totalTokenCount || 500;

    // Parse tasks from response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (tasks.length > 0) {
      const { error } = await supabase.from("tasks").insert(
        tasks.map((t: any) => ({
          title: t.title,
          description: t.description,
          difficulty: t.difficulty,
          estimated_time: t.estimated_time,
          learning_objective: t.learning_objective,
          youtube_link: t.youtube_link,
        }))
      );
      if (error) throw error;
    }

    // Update AI usage
    await supabase.from("ai_usage").upsert(
      {
        date: today,
        tokens_used: tokensUsed + tokensInResponse,
        api_calls: (usage?.api_calls || 0) + 1,
      },
      { onConflict: "date" }
    );

    return new Response(JSON.stringify({ success: true, tasks_generated: tasks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
