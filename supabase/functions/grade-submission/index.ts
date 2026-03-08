import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { repo_link, explanation, task_id, intern_id } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: task } = await supabase.from("tasks").select("title, description, learning_objective").eq("id", task_id).single();

    const prompt = `Evaluate this internship submission (score 0-100):

Task: ${task?.title || "Unknown"}
Description: ${task?.description || ""}
Learning Objective: ${task?.learning_objective || ""}
GitHub: ${repo_link || "Not provided"}
Explanation: ${explanation}

Return ONLY JSON: {"score": number, "feedback": "string", "improvements": "string"}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }),
    });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    const result = JSON.parse(jsonMatch[0]);
    const score = Math.min(100, Math.max(0, Math.round(result.score)));
    const feedback = `${result.feedback}\n\nSuggestions: ${result.improvements || "N/A"}`;

    await supabase.from("submissions").update({ ai_score: score, ai_feedback: feedback, status: "graded" }).eq("intern_id", intern_id).eq("task_id", task_id).order("created_at", { ascending: false }).limit(1);

    // Track AI usage
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase.from("ai_usage").select("*").eq("date", today).maybeSingle();
    await supabase.from("ai_usage").upsert({ date: today, tokens_used: (usage?.tokens_used || 0) + text.length * 2, api_calls: (usage?.api_calls || 0) + 1 }, { onConflict: "date" });

    // Check completion — send rejection email if avg < 50
    const { data: allSubs } = await supabase.from("submissions").select("ai_score").eq("intern_id", intern_id).not("ai_score", "is", null);
    const { count: total } = await supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", intern_id);
    const { count: done } = await supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", intern_id).eq("status", "completed");

    if (done === total && total && total > 0 && allSubs) {
      const avg = allSubs.reduce((a, b) => a + (b.ai_score || 0), 0) / allSubs.length;
      if (avg < 50) {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const { data: profile } = await supabase.from("intern_profiles").select("email, name").eq("id", intern_id).single();
        if (RESEND_API_KEY && profile) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Syedom Labs <noreply@syedomlabs.com>",
              to: profile.email,
              subject: "Internship Completion — Certificate Status",
              html: `<p>Dear ${profile.name},</p><p>Your average score of <strong>${Math.round(avg)}/100</strong> does not meet the 50/100 minimum for certification. You may reapply after 14 days.</p><p>— Syedom Labs</p>`,
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, score }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
