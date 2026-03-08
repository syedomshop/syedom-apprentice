import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const InternProgress = () => {
  const { internProfile } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!internProfile) return;
    const fetch = async () => {
      const { data: subs } = await supabase
        .from("submissions")
        .select("*, tasks(title)")
        .eq("intern_id", internProfile.id)
        .order("created_at", { ascending: false });
      setSubmissions(subs || []);

      const { count: total } = await supabase
        .from("intern_tasks")
        .select("*", { count: "exact", head: true })
        .eq("intern_id", internProfile.id);

      const { count: completed } = await supabase
        .from("intern_tasks")
        .select("*", { count: "exact", head: true })
        .eq("intern_id", internProfile.id)
        .eq("status", "completed");

      setTotalTasks(total || 0);
      setCompletedTasks(completed || 0);
      setLoading(false);
    };
    fetch();
  }, [internProfile]);

  const avgScore = submissions.length > 0
    ? (submissions.filter(s => s.ai_score != null).reduce((a, b) => a + (b.ai_score || 0), 0) / (submissions.filter(s => s.ai_score != null).length || 1)).toFixed(1)
    : "0";
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <PortalLayout role="intern">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your internship progress and scores</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Average Score</span>
            <span className="text-3xl font-semibold text-foreground">{avgScore}<span className="text-base text-muted-foreground">/10</span></span>
          </div>
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Tasks Completed</span>
            <span className="text-3xl font-semibold text-foreground">{completedTasks}</span>
          </div>
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Completion Rate</span>
            <div className="space-y-2">
              <span className="text-3xl font-semibold text-foreground">{completionRate}%</span>
              <Progress value={completionRate} className="h-2" />
            </div>
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
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-foreground">{sub.tasks?.title}</h3>
                      <p className="text-xs text-muted-foreground">{sub.ai_feedback || "Awaiting AI review..."}</p>
                      <span className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {sub.ai_score != null ? (
                        <>
                          <span className={`text-lg font-semibold ${sub.ai_score >= 8 ? "text-success" : sub.ai_score >= 6 ? "text-warning" : "text-destructive"}`}>
                            {sub.ai_score}
                          </span>
                          <span className="text-xs text-muted-foreground">/10</span>
                        </>
                      ) : (
                        <span className="portal-badge-warning">Pending</span>
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

export default InternProgress;
