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

    // Validate GitHub repo if provided
    let repoValid = true;
    let repoInfo = "";
    if (repo_link) {
      const repoMatch = repo_link.match(/github\.com\/([^\/]+\/[^\/]+)/);
      if (repoMatch) {
        try {
          const ghRes = await fetch(`https://api.github.com/repos/${repoMatch[1]}`, {
            headers: { "User-Agent": "SyedomLabs-Grader" },
          });
          if (!ghRes.ok) {
            repoValid = false;
            repoInfo = "Repository not found or private.";
          }
        } catch {
          repoInfo = "Could not verify repository.";
        }
      }
    }

    const { data: task } = await supabase.from("tasks").select("title, description, learning_objective, deliverable").eq("id", task_id).single();

    const prompt = `You are a senior software engineer reviewing an intern's project submission.

Task: ${task?.title || "Unknown"}
Description: ${task?.description || ""}
Learning Objective: ${task?.learning_objective || ""}
Expected Deliverable: ${task?.deliverable || ""}
GitHub: ${repo_link || "Not provided"}${!repoValid ? " (WARNING: Repository not accessible)" : ""}
Student Explanation: ${explanation}

Evaluate based on:
1. Code structure and organization
2. Documentation quality
3. Functionality and completeness
4. Difficulty and effort level
5. Best practices followed

ANTI-CHEAT: Check if the explanation seems generic, copied from common tutorials, or shows no understanding. Penalize submissions that appear to be directly copied without modification.

Return ONLY JSON: {"score": number (0-100), "feedback": "detailed explanation", "strengths": "what was done well", "improvements": "specific suggestions", "plagiarism_flag": boolean}`;

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
    let score = Math.min(100, Math.max(0, Math.round(result.score)));

    // Penalize if repo is invalid
    if (!repoValid && repo_link) score = Math.min(score, 40);
    // Penalize if plagiarism detected
    if (result.plagiarism_flag) score = Math.max(0, score - 25);

    const feedback = `${result.feedback}\n\n**Strengths:** ${result.strengths || "N/A"}\n\n**Improvements:** ${result.improvements || "N/A"}${result.plagiarism_flag ? "\n\n⚠️ Possible plagiarism detected — score reduced." : ""}${!repoValid && repo_link ? "\n\n⚠️ GitHub repository could not be verified." : ""}`;

    await supabase.from("submissions").update({ ai_score: score, ai_feedback: feedback, status: "graded" }).eq("intern_id", intern_id).eq("task_id", task_id).order("created_at", { ascending: false }).limit(1);

    // Track AI usage
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase.from("ai_usage").select("*").eq("date", today).maybeSingle();
    await supabase.from("ai_usage").upsert({ date: today, tokens_used: (usage?.tokens_used || 0) + text.length * 2, api_calls: (usage?.api_calls || 0) + 1 }, { onConflict: "date" });

    // Check completion — issue certificate or send rejection
    const { data: allSubs } = await supabase.from("submissions").select("ai_score").eq("intern_id", intern_id).not("ai_score", "is", null);
    const { count: total } = await supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", intern_id);
    const { count: done } = await supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", intern_id).eq("status", "completed");

    if (done === total && total && total > 0 && allSubs && allSubs.length >= 8) {
      const avg = Math.round(allSubs.reduce((a, b) => a + (b.ai_score || 0), 0) / allSubs.length);
      const { data: profile } = await supabase.from("intern_profiles").select("email, name, field, intern_id").eq("id", intern_id).single();
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (avg >= 50) {
        // Issue certificate
        const certCode = `SYD-CERT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
        await supabase.from("certificates").insert({
          intern_id,
          certificate_code: certCode,
          student_name: profile?.name || "",
          field: profile?.field || "",
          average_score: avg,
          tasks_completed: done,
        });

        // Send certificate + brand growth email
        if (RESEND_API_KEY && profile) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Syedom Labs <noreply@syedomlabs.com>",
              to: profile.email,
              subject: "🎉 Congratulations! Your Certificate is Ready — Syedom Labs",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #1a365d;">Syedom Labs</h1>
                  <h2 style="color: #2563eb;">Congratulations, ${profile.name}! 🎉</h2>
                  <p>You have successfully completed the <strong>${profile.field}</strong> internship program with an average score of <strong>${avg}/100</strong>.</p>
                  <p><strong>Certificate Code:</strong> ${certCode}</p>
                  <p>Log in to your dashboard to download your certificate.</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                  <h3 style="color: #1a365d;">📢 Share Your Achievement!</h3>
                  <ul>
                    <li>🔗 Add this internship to your <strong>LinkedIn Experience</strong></li>
                    <li>👥 Follow <strong>Syedom Labs</strong> on LinkedIn</li>
                    <li>📜 Share your certificate with your network</li>
                    <li>🌐 Your portfolio: syedomlabs.com/intern/${profile.name.toLowerCase().replace(/\s+/g, "-")}</li>
                  </ul>
                  <p style="color: #718096; font-size: 12px;">Syedom Labs · CEO: Syed Hasnat Ali · HR: M. Sohaib Ali</p>
                </div>
              `,
            }),
          });
        }
      } else {
        // Send rejection email
        if (RESEND_API_KEY && profile) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Syedom Labs <noreply@syedomlabs.com>",
              to: profile.email,
              subject: "Internship Completion — Certificate Status",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #1a365d;">Syedom Labs</h1>
                  <p>Dear ${profile.name},</p>
                  <p>Your average score of <strong>${avg}/100</strong> does not meet the 50/100 minimum for certification.</p>
                  <p>You may reapply after <strong>14 days</strong>.</p>
                  <p>We encourage you to review the feedback on each submission and improve your skills.</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                  <p style="color: #718096; font-size: 12px;">Syedom Labs · CEO: Syed Hasnat Ali · HR: M. Sohaib Ali</p>
                </div>
              `,
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
