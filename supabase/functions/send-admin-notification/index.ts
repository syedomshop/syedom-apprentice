import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, message, intern_ids } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // If intern_ids provided, send to those interns; otherwise send to all active
    let emails: string[] = [];
    if (intern_ids && intern_ids.length > 0) {
      const { data } = await supabase
        .from("intern_profiles")
        .select("email")
        .in("id", intern_ids);
      emails = (data || []).map((d: any) => d.email);
    } else {
      const { data } = await supabase
        .from("intern_profiles")
        .select("email")
        .eq("status", "active");
      emails = (data || []).map((d: any) => d.email);
    }

    let sent = 0;
    for (const email of emails) {
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
                <h1 style="color: #1a365d;">Syedom Labs</h1>
                <div>${message || ""}</div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #718096; font-size: 12px;">© Syedom Labs. All rights reserved.</p>
              </div>
            `,
          }),
        });
        if (res.ok) sent++;
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err);
      }
    }

    // Also create in-app notifications if intern_ids provided
    if (intern_ids && intern_ids.length > 0) {
      const notifications = intern_ids.map((id: string) => ({
        intern_id: id,
        title: subject || "Admin Notification",
        message: message || "",
        type: "info",
      }));
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ success: true, sent, total: emails.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    console.error("send-admin-notification error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
