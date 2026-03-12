import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: pendingOffers } = await supabase
      .from("pending_offers").select("*").eq("status", "pending").lte("send_after", new Date().toISOString());

    if (!pendingOffers || pendingOffers.length === 0) {
      return new Response(JSON.stringify({ message: "No pending offers" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sent = 0;
    for (const offer of pendingOffers) {
      const { data: profile } = await supabase.from("intern_profiles").select("start_date").eq("id", offer.intern_profile_id).single();
      const startDate = profile?.start_date || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Syedom Labs <noreply@syedom.com>",
          to: offer.email,
          subject: `Offer Letter — ${offer.field} Intern at Syedom Labs`,
          html: `<div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;border:4px double #1a365d;">
            <div style="text-align:center;margin-bottom:30px;">
              <h1 style="color:#1a365d;font-size:28px;margin:0;">Syedom Labs</h1>
              <p style="color:#718096;font-size:14px;">Technology & Innovation</p>
            </div>
            <h2 style="text-align:center;color:#2563eb;font-size:22px;">OFFICIAL OFFER LETTER</h2>
            <p>Dear <strong>${offer.name}</strong>,</p>
            <p>We are pleased to offer you the position of <strong>${offer.field} Intern</strong> at Syedom Labs.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#718096;">Intern ID</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;">${offer.intern_id}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#718096;">Position</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;">${offer.field} Intern</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#718096;">Start Date</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;">${startDate}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#718096;">Duration</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;">8 Weeks</td></tr>
            </table>
            <p>Please log in to your dashboard to begin your tasks once your start date arrives.</p>
            <p style="color:#718096;font-size:12px;">© Syedom Labs. All rights reserved.</p>
          </div>`,
        }),
      });

      if (res.ok) {
        await supabase.from("pending_offers").update({ status: "sent" }).eq("id", offer.id);
        sent++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: unknown) {
    console.error("process-pending-offers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
