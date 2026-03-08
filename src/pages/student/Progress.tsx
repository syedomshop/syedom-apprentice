import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { TTL } from "@/lib/cache";

interface ProgressData {
  submissions: any[];
  totalTasks: number;
  completedTasks: number;
}

const Progress = () => {
  const { internProfile } = useAuth();
  const profileId = internProfile?.id;

  const { data, loading } = useCachedQuery<ProgressData>(
    `progress_${profileId}`,
    async () => {
      const [subsRes, totalRes, completedRes] = await Promise.all([
        supabase.from("submissions").select("*, tasks(title, week_number)").eq("intern_id", profileId).order("created_at", { ascending: false }),
        supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", profileId),
        supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", profileId).eq("status", "completed"),
      ]);
      return {
        submissions: subsRes.data || [],
        totalTasks: totalRes.count || 0,
        completedTasks: completedRes.count || 0,
      };
    },
    { ttl: TTL.SHORT, enabled: !!profileId }
  );

  const submissions = data?.submissions || [];
  const totalTasks = data?.totalTasks || 0;
  const completedTasks = data?.completedTasks || 0;

  const scored = submissions.filter(s => s.ai_score != null);
  const avgScore = scored.length > 0 ? (scored.reduce((a, b) => a + (b.ai_score || 0), 0) / scored.length).toFixed(1) : "0";
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const eligible = parseFloat(avgScore) >= 50 && completedTasks >= 8;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your scores and certification eligibility</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Weekly Average</span>
            <span className="text-3xl font-semibold text-foreground">{avgScore}<span className="text-base text-muted-foreground">/100</span></span>
          </div>
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Completion</span>
            <div className="space-y-2">
              <span className="text-3xl font-semibold text-foreground">{completedTasks}/{totalTasks}</span>
              <ProgressBar value={completionRate} className="h-2" />
            </div>
          </div>
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Certificate Eligibility</span>
            <span className={`text-lg font-semibold ${eligible ? "text-success" : "text-destructive"}`}>
              {eligible ? "✅ Eligible (avg ≥ 50 + all tasks)" : `❌ Not Eligible`}
            </span>
            {!eligible && <p className="text-xs text-muted-foreground">Need avg ≥ 50 and all 8 tasks completed</p>}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="flex items-start justify-between p-4 rounded-lg border border-border">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="portal-badge-info text-xs">Week {sub.tasks?.week_number}</span>
                        <h3 className="text-sm font-medium text-foreground">{sub.tasks?.title}</h3>
                      </div>
                      {sub.instructor_comment && <p className="text-xs text-foreground font-medium">📝 Feedback: {sub.instructor_comment}</p>}
                      {sub.intern_comment && <p className="text-xs text-muted-foreground italic">You: {sub.intern_comment}</p>}
                      <span className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {sub.ai_score != null ? (
                        <>
                          <span className={`text-lg font-semibold ${sub.ai_score >= 70 ? "text-success" : sub.ai_score >= 50 ? "text-warning" : "text-destructive"}`}>
                            {sub.ai_score}
                          </span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </>
                      ) : (
                        <span className="portal-badge-warning">Under Review</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Progress;
