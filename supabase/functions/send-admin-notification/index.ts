// Send admin notification emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { recipients, subject, message } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("No recipients provided");
    }

    const results = [];
    for (const { name, email } of recipients) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Syedom Labs <noreply@syedomlabs.com>",
            to: email,
            subject: subject || "Notification from Syedom Labs",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #1a365d; font-size: 24px;">Syedom Labs</h1>
                <h2 style="color: #2d3748; font-size: 18px;">${subject}</h2>
                <p>Dear ${name},</p>
                <div style="background: #f7fafc; border-left: 4px solid #3182ce; padding: 16px; margin: 16px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #2d3748;">${message}</p>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #718096; font-size: 12px;">© Syedom Labs. All rights reserved.</p>
              </div>
            `,
          }),
        });
        const data = await res.text();
        results.push({ email, success: res.ok, data });
      } catch (e: unknown) {
        results.push({ email, success: false, error: e instanceof Error ? e.message : "Unknown error" });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-admin-notification error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
