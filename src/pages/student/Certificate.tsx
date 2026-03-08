import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2, ExternalLink, Lock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Certificate = () => {
  const { internProfile } = useAuth();
  const [avgScore, setAvgScore] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!internProfile) return;
    const fetchData = async () => {
      const [{ data: subs }, { count: total }, { count: completed }, { data: cert }] = await Promise.all([
        supabase.from("submissions").select("ai_score").eq("intern_id", internProfile.id).not("ai_score", "is", null),
        supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", internProfile.id),
        supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", internProfile.id).eq("status", "completed"),
        supabase.from("certificates").select("*").eq("intern_id", internProfile.id).eq("status", "issued").maybeSingle(),
      ]);

      const avg = subs && subs.length > 0 ? subs.reduce((a, b) => a + (b.ai_score || 0), 0) / subs.length : 0;
      setAvgScore(Math.round(avg));
      setTotalTasks(total || 0);
      setCompletedTasks(completed || 0);
      setCertificate(cert);
      setLoading(false);
    };
    fetchData();
  }, [internProfile]);

  const eligible = certificate || (avgScore >= 50 && completedTasks >= totalTasks && totalTasks >= 8);
  const isPaid = certificate?.payment_status === "paid";
  const certCode = certificate?.certificate_code || "";

  const handlePayment = () => {
    // Open payment link (PKR 50) — in production, integrate with JazzCash/EasyPaisa/Stripe
    toast({
      title: "Payment Required — PKR 50",
      description: "Please send PKR 50 to the payment details shared on your email. Once confirmed, your certificate will be unlocked.",
    });
  };

  const handlePrint = () => {
    if (!isPaid) {
      handlePayment();
      return;
    }
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Certificate - ${internProfile?.name}</title><style>
      body { font-family: Georgia, serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
      .cert { border: 8px double #1a365d; padding: 60px; max-width: 800px; text-align: center; background: white; }
      .cert h1 { color: #1a365d; font-size: 36px; margin-bottom: 8px; }
      .cert h2 { color: #2563eb; font-size: 20px; margin: 20px 0; }
      .cert .name { font-size: 28px; color: #1a365d; font-weight: bold; margin: 20px 0; border-bottom: 2px solid #2563eb; display: inline-block; padding-bottom: 4px; }
      .cert p { color: #4a5568; font-size: 14px; line-height: 1.8; }
      .cert .code { color: #2563eb; font-size: 12px; margin-top: 15px; }
      .sigs { display: flex; justify-content: space-around; margin-top: 50px; }
      .sig { text-align: center; }
      .sig img { height: 60px; margin-bottom: 4px; }
      .sig .line { width: 180px; border-top: 1px solid #1a365d; margin-bottom: 4px; }
      .sig .title { font-size: 12px; color: #718096; }
      @media print { body { background: white; } }
    </style></head><body>
      <div class="cert">
        <h1>Syedom Labs</h1>
        <h2>Certificate of Completion</h2>
        <p>This is to certify that</p>
        <div class="name">${internProfile?.name}</div>
        <p>has successfully completed the <strong>${internProfile?.field}</strong> internship program<br/>
        with an average score of <strong>${avgScore}/100</strong>.</p>
        <p>Intern ID: ${internProfile?.intern_id} · Duration: 8 Weeks${certificate?.batch_number ? ` · Batch ${certificate.batch_number}` : ""}</p>
        ${certCode ? `<p class="code">Certificate Code: ${certCode}<br/>Verify at: syedomlabs.com/verify/${certCode}</p>` : ""}
        <div class="sigs">
          <div class="sig">
            <img src="/images/m.sohaib_ali_sign.png" alt="HR Signature" />
            <div class="line"></div>
            <strong>M. Sohaib Ali</strong>
            <div class="title">HR Manager</div>
          </div>
          <div class="sig">
            <img src="/images/syed_hasnat_ali_sign.png" alt="CEO Signature" />
            <div class="line"></div>
            <strong>Syed Hasnat Ali</strong>
            <div class="title">CEO</div>
          </div>
        </div>
      </div>
      <script>setTimeout(() => window.print(), 500);</script>
    </body></html>`);
    w.document.close();
  };

  const shareLinkedIn = () => {
    const url = encodeURIComponent("https://syedomlabs.com");
    const title = encodeURIComponent(`Completed ${internProfile?.field} Internship at Syedom Labs`);
    const summary = encodeURIComponent(`I completed an 8-week ${internProfile?.field} internship at Syedom Labs with an average score of ${avgScore}/100! Certificate: ${certCode}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, "_blank");
  };

  if (loading) return <PortalLayout><p className="text-sm text-muted-foreground">Loading...</p></PortalLayout>;

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Certificate</h1>
          <p className="text-sm text-muted-foreground mt-1">Download your completion certificate</p>
        </div>

        {eligible ? (
          <>
            {/* Payment Gate */}
            {!isPaid && (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-warning" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Certificate Locked — PKR 50 Payment Required</p>
                      <p className="text-xs text-muted-foreground">Complete payment to unlock your certificate download</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={handlePayment}>Pay PKR 50</Button>
                </CardContent>
              </Card>
            )}

            <Card id="certificate-card" className={!isPaid ? "opacity-60 pointer-events-none select-none" : ""}>
              <CardContent className="p-8 text-center space-y-4">
                <Award className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Certificate of Completion</h2>
                <p className="text-muted-foreground">Awarded to</p>
                <p className="text-2xl font-bold text-foreground">{internProfile?.name}</p>
                <p className="text-muted-foreground">
                  For successfully completing the <strong>{internProfile?.field}</strong> internship program
                  with an average score of <strong>{avgScore}/100</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Intern ID: {internProfile?.intern_id} · Duration: 8 Weeks
                  {certificate?.batch_number && ` · Batch ${certificate.batch_number}`}
                </p>
                {certCode && (
                  <p className="text-xs text-primary">Certificate Code: {certCode}</p>
                )}
                <div className="flex justify-around pt-8">
                  <div className="text-center">
                    <img src="/images/m.sohaib_ali_sign.png" alt="HR Signature" className="h-12 mx-auto mb-1" />
                    <div className="border-t border-foreground w-40 mb-1 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">M. Sohaib Ali</p>
                    <p className="text-xs text-muted-foreground">HR Manager</p>
                  </div>
                  <div className="text-center">
                    <img src="/images/syed_hasnat_ali_sign.png" alt="CEO Signature" className="h-12 mx-auto mb-1" />
                    <div className="border-t border-foreground w-40 mb-1 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Syed Hasnat Ali</p>
                    <p className="text-xs text-muted-foreground">CEO</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handlePrint} className="flex-1" disabled={!isPaid}>
                <Download className="h-4 w-4 mr-2" /> {isPaid ? "Download / Print" : "Pay to Unlock"}
              </Button>
              <Button variant="outline" onClick={shareLinkedIn} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" /> Share on LinkedIn
              </Button>
            </div>

            {internProfile?.username && (
              <div className="text-center">
                <a href={`/intern/${internProfile.username}`} className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
                  <ExternalLink className="h-3 w-3" /> View your public portfolio
                </a>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Award className="h-16 w-16 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">Not Yet Eligible</h2>
              <p className="text-muted-foreground">
                Complete all <strong>8 tasks</strong> with an average score of at least <strong>50/100</strong> to receive your certificate.
              </p>
              <p className="text-sm text-muted-foreground">
                Current: {avgScore}/100 · {completedTasks}/{totalTasks} tasks completed
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default Certificate;
