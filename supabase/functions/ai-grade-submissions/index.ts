import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { batch_id, intern_ids } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Build query for submissions to grade
    let query = supabase
      .from("submissions")
      .select("id, intern_id, task_id, repo_link, intern_comment, tasks(title, description, learning_objective, deliverable)")
      .order("created_at", { ascending: false });

    if (intern_ids && intern_ids.length > 0) {
      query = query.in("intern_id", intern_ids);
    }

    if (batch_id) {
      // Get intern IDs in this batch
      const { data: batchInterns } = await supabase
        .from("intern_profiles")
        .select("id")
        .eq("batch_id", batch_id);
      const ids = (batchInterns || []).map((i: any) => i.id);
      if (ids.length === 0) {
        return new Response(JSON.stringify({ success: true, graded: 0, message: "No interns in this batch" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.in("intern_id", ids);
    }

    const { data: submissions, error: subError } = await query;
    if (subError) throw subError;

    if (!submissions || submissions.length === 0) {
      return new Response(JSON.stringify({ success: true, graded: 0, message: "No submissions to grade" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let graded = 0;
    let skipped = 0;

    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase.from("ai_usage").select("*").eq("date", today).maybeSingle();
    let tokensUsed = usage?.tokens_used || 0;
    let apiCalls = usage?.api_calls || 0;

    for (const sub of submissions) {
      try {
        const task = (sub as any).tasks;
        const repoUrl = sub.repo_link || "";
        const comment = sub.intern_comment || "No comments provided";

        const prompt = `You are evaluating an intern's GitHub repository submission for an internship task.

Task: ${task?.title || "Unknown"}
Description: ${task?.description || ""}
Learning Objective: ${task?.learning_objective || ""}
Expected Output: ${task?.deliverable || "GitHub repository with README"}

Student's GitHub Repository: ${repoUrl}
Student's Comment/Explanation: ${comment}

Evaluate based on:
1. Repository link validity and professionalism
2. Task relevance (does the repo name/URL suggest correct work?)
3. Quality of student's explanation
4. Effort and completeness indicated by the comment
5. GitHub best practices

Return ONLY valid JSON (no markdown):
{
  "score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "feedback": "<2-3 sentence evaluation>",
  "strengths": "<what was done well>",
  "improvements": "<specific improvement suggestions>"
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
          }),
        });

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          skipped++;
          continue;
        }

        const result = JSON.parse(jsonMatch[0]);
        const score = Math.min(100, Math.max(0, Math.round(result.score || 50)));
        const grade = result.grade || (score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F");

        // Upsert to ai_grading_results (pending admin approval)
        await supabase.from("ai_grading_results").upsert({
          submission_id: sub.id,
          intern_id: sub.intern_id,
          task_id: sub.task_id,
          ai_score: score,
          ai_grade: grade,
          ai_feedback: result.feedback || "",
          ai_strengths: result.strengths || "",
          ai_improvements: result.improvements || "",
          status: "pending",
          batch_id: batch_id || null,
          created_at: new Date().toISOString(),
        }, { onConflict: "intern_id,task_id" });

        tokensUsed += text.length * 2;
        apiCalls += 1;
        graded++;

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error grading submission ${sub.id}:`, err);
        skipped++;
      }
    }

    // Update AI usage
    await supabase.from("ai_usage").upsert({
      date: today,
      tokens_used: tokensUsed,
      api_calls: apiCalls,
    }, { onConflict: "date" });

    return new Response(
      JSON.stringify({ success: true, graded, skipped, total: submissions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    console.error("ai-grade-submissions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
