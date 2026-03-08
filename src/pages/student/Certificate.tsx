import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const Certificate = () => {
  const { internProfile } = useAuth();
  const [avgScore, setAvgScore] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!internProfile) return;
    const fetchData = async () => {
      const { data: subs } = await supabase.from("submissions").select("ai_score").eq("intern_id", internProfile.id).not("ai_score", "is", null);
      const avg = subs && subs.length > 0 ? subs.reduce((a, b) => a + (b.ai_score || 0), 0) / subs.length : 0;
      setAvgScore(Math.round(avg));

      const { count: total } = await supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", internProfile.id);
      const { count: completed } = await supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", internProfile.id).eq("status", "completed");
      setTotalTasks(total || 0);
      setCompletedTasks(completed || 0);
      setLoading(false);
    };
    fetchData();
  }, [internProfile]);

  const eligible = avgScore >= 50 && completedTasks >= totalTasks && totalTasks > 0;

  const handlePrint = () => {
    const cert = document.getElementById("certificate-card");
    if (!cert) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Certificate - ${internProfile?.name}</title><style>
      body { font-family: Georgia, serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
      .cert { border: 8px double #1a365d; padding: 60px; max-width: 800px; text-align: center; background: white; }
      .cert h1 { color: #1a365d; font-size: 36px; margin-bottom: 8px; }
      .cert h2 { color: #2563eb; font-size: 20px; margin: 20px 0; }
      .cert .name { font-size: 28px; color: #1a365d; font-weight: bold; margin: 20px 0; border-bottom: 2px solid #2563eb; display: inline-block; padding-bottom: 4px; }
      .cert p { color: #4a5568; font-size: 14px; line-height: 1.8; }
      .sigs { display: flex; justify-content: space-around; margin-top: 50px; }
      .sig { text-align: center; }
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
        <p>Intern ID: ${internProfile?.intern_id}<br/>Duration: 8 Weeks</p>
        <div class="sigs">
          <div class="sig"><div class="line"></div><strong>M. Sohaib Ali</strong><div class="title">HR Manager</div></div>
          <div class="sig"><div class="line"></div><strong>Syed Hasnat Ali</strong><div class="title">CEO</div></div>
        </div>
      </div>
      <script>setTimeout(() => window.print(), 500);</script>
    </body></html>`);
    w.document.close();
  };

  const shareLinkedIn = () => {
    const url = encodeURIComponent("https://syedomlabs.com");
    const title = encodeURIComponent(`Completed ${internProfile?.field} Internship at Syedom Labs`);
    const summary = encodeURIComponent(`I completed an 8-week ${internProfile?.field} internship at Syedom Labs with an average score of ${avgScore}/100!`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, "_blank");
  };

  if (loading) {
    return (
      <PortalLayout>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Certificate</h1>
          <p className="text-sm text-muted-foreground mt-1">Download your completion certificate</p>
        </div>

        {eligible ? (
          <>
            <Card id="certificate-card">
              <CardContent className="p-8 text-center space-y-4">
                <Award className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Certificate of Completion</h2>
                <p className="text-muted-foreground">Awarded to</p>
                <p className="text-2xl font-bold text-foreground">{internProfile?.name}</p>
                <p className="text-muted-foreground">
                  For successfully completing the <strong>{internProfile?.field}</strong> internship program
                  with an average score of <strong>{avgScore}/100</strong>.
                </p>
                <p className="text-sm text-muted-foreground">Intern ID: {internProfile?.intern_id} · Duration: 8 Weeks</p>
                <div className="flex justify-around pt-8">
                  <div className="text-center">
                    <div className="border-t border-foreground w-40 mb-1 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">M. Sohaib Ali</p>
                    <p className="text-xs text-muted-foreground">HR Manager</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-foreground w-40 mb-1 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Syed Hasnat Ali</p>
                    <p className="text-xs text-muted-foreground">CEO</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handlePrint} className="flex-1">
                <Download className="h-4 w-4 mr-2" /> Download / Print
              </Button>
              <Button variant="outline" onClick={shareLinkedIn} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" /> Share on LinkedIn
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Award className="h-16 w-16 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">Not Yet Eligible</h2>
              <p className="text-muted-foreground">
                You need an average score of at least <strong>50/100</strong> and all tasks completed to receive your certificate.
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
