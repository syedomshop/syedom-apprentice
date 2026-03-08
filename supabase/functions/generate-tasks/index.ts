import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIELDS = ["Web Development", "Python / Backend", "Data Science", "Flutter Developer"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase.from("ai_usage").select("*").eq("date", today).maybeSingle();
    if ((usage?.tokens_used || 0) / 10000 > 0.95) {
      return new Response(JSON.stringify({ error: "Critical mode: AI paused" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let totalInserted = 0;

    for (const field of FIELDS) {
      const { data: existing } = await supabase.from("tasks").select("week_number").eq("field", field);
      const existingWeeks = new Set((existing || []).map(t => t.week_number));
      const missingWeeks = Array.from({ length: 8 }, (_, i) => i + 1).filter(w => !existingWeeks.has(w));
      if (missingWeeks.length === 0) continue;

      const prompt = `Generate ${missingWeeks.length} programming internship tasks for a "${field}" intern. Weeks: ${missingWeeks.join(", ")}. Progress from beginner (week 1) to advanced (week 8) with real-world projects.

Each task MUST follow this exact structure:
- "title": concise project title
- "description": 2-3 sentences describing the task
- "difficulty": "Beginner" (weeks 1-3), "Intermediate" (weeks 4-6), or "Advanced" (weeks 7-8)
- "week_number": the week number
- "estimated_time": e.g. "4-6 hours"
- "learning_objective": what the student will learn
- "mentor_explanation": a 2-3 sentence explanation of why this skill matters in real SaaS/industry apps
- "youtube_link": a real YouTube tutorial URL relevant to the task topic
- "deliverable": what the student must submit (e.g. "GitHub repository with README and screenshots")

Return ONLY a JSON array. No markdown, no code fences.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } }),
      });

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      const tasks = JSON.parse(jsonMatch[0]);
      const rows = tasks.map((t: any) => ({
        title: t.title,
        description: t.description,
        difficulty: t.difficulty || "Beginner",
        week_number: t.week_number,
        field,
        youtube_link: t.youtube_link || null,
        estimated_time: t.estimated_time || null,
        learning_objective: t.learning_objective || null,
        mentor_explanation: t.mentor_explanation || null,
        deliverable: t.deliverable || "GitHub repository with README",
      }));

      const { error } = await supabase.from("tasks").insert(rows);
      if (!error) totalInserted += rows.length;

      await supabase.from("ai_usage").upsert({
        date: today,
        tokens_used: (usage?.tokens_used || 0) + text.length * 2,
        api_calls: (usage?.api_calls || 0) + 1,
      }, { onConflict: "date" });
    }

    return new Response(JSON.stringify({ success: true, inserted: totalInserted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
