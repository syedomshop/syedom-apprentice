const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, field, intern_id } = await req.json();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    const endDateStr = endDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Georgia', serif; max-width: 700px; margin: 0 auto; padding: 40px; color: #1a1a1a;">
  <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
    <h1 style="margin: 0; font-size: 28px; color: #2563eb;">SYEDOM LABS</h1>
    <p style="margin: 5px 0 0; font-size: 12px; letter-spacing: 3px; color: #666;">TECHNOLOGY &amp; INNOVATION</p>
  </div>

  <h2 style="text-align: center; font-size: 22px; color: #1a1a1a; margin-bottom: 30px;">INTERNSHIP OFFER LETTER</h2>

  <p>Date: ${today}</p>
  <p>Dear <strong>${name}</strong>,</p>

  <p>We are pleased to offer you the position of <strong>${field} Internee</strong> at Syedom Labs. This letter confirms the terms of your internship engagement.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Intern ID</td><td style="padding: 10px; border: 1px solid #ddd;">${intern_id}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Position</td><td style="padding: 10px; border: 1px solid #ddd;">${field} Internee</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Duration</td><td style="padding: 10px; border: 1px solid #ddd;">3 Months (${today} — ${endDateStr})</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Type</td><td style="padding: 10px; border: 1px solid #ddd;">Remote / Virtual Internship</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Company</td><td style="padding: 10px; border: 1px solid #ddd;">Syedom Labs</td></tr>
  </table>

  <p>You will be assigned daily tasks through the Syedom Labs Internee Portal. Each task must be submitted via the portal and will be reviewed by our AI-powered grading system.</p>

  <p>We look forward to working with you and wish you a productive internship.</p>

  <div style="margin-top: 50px;">
    <div style="display: inline-block; width: 45%; vertical-align: top;">
      <p style="border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 40px;">
        <strong>M. Sohaib Ali</strong><br/>
        <span style="color: #666;">HR Department</span>
      </p>
    </div>
    <div style="display: inline-block; width: 45%; vertical-align: top; text-align: right;">
      <p style="border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 40px;">
        <strong>Syed Hasnat Ali</strong><br/>
        <span style="color: #666;">CEO, Syedom Labs</span>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999;">
    <p>This is an official document from Syedom Labs. © ${new Date().getFullYear()} Syedom Labs. All rights reserved.</p>
  </div>
</body>
</html>`;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Syedom Labs <onboarding@resend.dev>",
        to: [email],
        subject: `Internship Offer Letter — Syedom Labs (${field})`,
        html: htmlContent,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      throw new Error(resData.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
