import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, field, intern_id } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Syedom Labs <noreply@syedomlabs.com>",
        to: email,
        subject: "Application Received — Syedom Labs Internship",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a365d;">Syedom Labs</h1>
            <h2>Application Received</h2>
            <p>Dear ${name},</p>
            <p>Thank you for applying to the <strong>${field}</strong> internship at Syedom Labs.</p>
            <p>Your application is under review by our team. You will receive your official offer letter within the next few hours.</p>
            <p><strong>Intern ID:</strong> ${intern_id}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #718096; font-size: 12px;">© Syedom Labs. All rights reserved.</p>
          </div>
        `,
      }),
    });

    const delayMs = (Math.random() * 2 + 1) * 60 * 60 * 1000;
    const sendAfter = new Date(Date.now() + delayMs).toISOString();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile } = await supabase
      .from("intern_profiles")
      .select("id")
      .eq("intern_id", intern_id)
      .single();

    if (profile) {
      await supabase.from("pending_offers").insert({
        intern_profile_id: profile.id,
        name,
        email,
        field,
        intern_id,
        send_after: sendAfter,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-confirmation error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
