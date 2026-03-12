import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { submission_text, task_id, intern_id } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: task } = await supabase.from("tasks").select("title, description, learning_objective, deliverable").eq("id", task_id).single();

    const prompt = `You are a senior instructor evaluating a student's written assignment submission for an internship program.

Task: ${task?.title || "Unknown"}
Description: ${task?.description || ""}
Learning Objective: ${task?.learning_objective || ""}
Expected Output: ${task?.deliverable || ""}

Student's Submission:
---
${submission_text || "No submission text provided"}
---

Evaluate the submission based on:
1. Relevance to the task description
2. Completeness and depth of response
3. Technical accuracy
4. Clarity and organization
5. Effort and original thinking

Return ONLY valid JSON (no markdown fences):
{
  "score": <number 0-100>,
  "instructor_comment": "<brief feedback, max 100 characters>",
  "feedback": "<detailed evaluation paragraph>",
  "strengths": "<what was done well>",
  "improvements": "<specific suggestions for improvement>"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Gemini API error:", JSON.stringify(data));
      throw new Error(`Gemini API error: ${data.error?.message || res.statusText}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Gemini raw response:", text.slice(0, 500));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response: " + text.slice(0, 200));

    const result = JSON.parse(jsonMatch[0]);
    const score = Math.min(100, Math.max(0, Math.round(result.score)));
    const instructorComment = (result.instructor_comment || "Good submission.").slice(0, 100);
    const feedback = `${result.feedback}\n\n**Strengths:** ${result.strengths || "N/A"}\n\n**Improvements:** ${result.improvements || "N/A"}`;

    await supabase.from("submissions").update({
      ai_score: score,
      instructor_comment: instructorComment,
      ai_feedback: feedback,
      status: "graded",
    }).eq("intern_id", intern_id).eq("task_id", task_id).order("created_at", { ascending: false }).limit(1);

    // Track AI usage
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase.from("ai_usage").select("*").eq("date", today).maybeSingle();
    await supabase.from("ai_usage").upsert({ date: today, tokens_used: (usage?.tokens_used || 0) + text.length * 2, api_calls: (usage?.api_calls || 0) + 1 }, { onConflict: "date" });

    // Check completion — issue certificate if all tasks done
    const { data: allSubs } = await supabase.from("submissions").select("ai_score").eq("intern_id", intern_id).not("ai_score", "is", null);
    const { count: total } = await supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", intern_id);
    const { count: done } = await supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", intern_id).eq("status", "completed");

    if (done === total && total && total > 0 && allSubs && allSubs.length >= 8) {
      const avg = Math.round(allSubs.reduce((a, b) => a + (b.ai_score || 0), 0) / allSubs.length);
      const { data: profile } = await supabase.from("intern_profiles").select("email, name, field, intern_id, batch_id").eq("id", intern_id).single();
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      let batchNumber = null;
      if (profile?.batch_id) {
        const { data: batch } = await supabase.from("batches").select("batch_number").eq("id", profile.batch_id).single();
        batchNumber = batch?.batch_number;
      }

      if (avg >= 50) {
        const certCode = `SYD-CERT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
        await supabase.from("certificates").insert({
          intern_id,
          certificate_code: certCode,
          student_name: profile?.name || "",
          field: profile?.field || "",
          batch_number: batchNumber,
          average_score: avg,
          tasks_completed: done,
          payment_status: "unpaid",
        });

        if (RESEND_API_KEY && profile) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Syedom Labs <noreply@syedom.com>",
              to: profile.email,
              subject: "🎉 You're Eligible for Certification — Syedom Labs",
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h1 style="color:#1a365d;">Syedom Labs</h1>
                <h2 style="color:#2563eb;">Congratulations, ${profile.name}! 🎉</h2>
                <p>You have completed the <strong>${profile.field}</strong> internship with an average score of <strong>${avg}/100</strong>.</p>
                <p><strong>Certificate Code:</strong> ${certCode}</p>
                <p>To download your certificate, complete the PKR 50 payment from your dashboard.</p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
                <p style="color:#718096;font-size:12px;">© Syedom Labs. All rights reserved.</p>
              </div>`,
            }),
          });
        }
      } else {
        if (RESEND_API_KEY && profile) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Syedom Labs <noreply@syedom.com>",
              to: profile.email,
              subject: "Internship Completion — Certificate Status",
              html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h1 style="color:#1a365d;">Syedom Labs</h1>
                <p>Dear ${profile.name},</p>
                <p>Your average score of <strong>${avg}/100</strong> does not meet the 50/100 minimum for certification.</p>
                <p>You may reapply in the <strong>next batch</strong>.</p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
                <p style="color:#718096;font-size:12px;">© Syedom Labs. All rights reserved.</p>
              </div>`,
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, score }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: unknown) {
    console.error("grade-submission error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
