import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, CheckCircle, Clock, TrendingUp, Linkedin, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { TTL } from "@/lib/cache";

interface DashboardData {
  tasks: any[];
  total: number;
  completed: number;
  pending: number;
  avgScore: number;
}

const StudentDashboard = () => {
  const { internProfile } = useAuth();
  const profileId = internProfile?.id;

  const { data, loading } = useCachedQuery<DashboardData>(
    `dashboard_${profileId}`,
    async () => {
      const [tasksRes, totalRes, completedRes, pendingRes, subsRes] = await Promise.all([
        supabase.from("intern_tasks").select("*, tasks(*)").eq("intern_id", profileId).order("assigned_date", { ascending: false }).limit(5),
        supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", profileId),
        supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", profileId).eq("status", "completed"),
        supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", profileId).in("status", ["pending", "in_progress"]),
        supabase.from("submissions").select("ai_score").eq("intern_id", profileId).not("ai_score", "is", null),
      ]);

      const subs = subsRes.data || [];
      const avg = subs.length > 0 ? parseFloat((subs.reduce((a, b) => a + (b.ai_score || 0), 0) / subs.length).toFixed(1)) : 0;

      return {
        tasks: tasksRes.data || [],
        total: totalRes.count || 0,
        completed: completedRes.count || 0,
        pending: pendingRes.count || 0,
        avgScore: avg,
      };
    },
    { ttl: TTL.MEDIUM, enabled: !!profileId }
  );

  const stats = data || { tasks: [], total: 0, completed: 0, pending: 0, avgScore: 0 };
  const tasks = data?.tasks || [];

  const currentWeek = internProfile?.start_date
    ? Math.min(8, Math.max(1, Math.ceil((Date.now() - new Date(internProfile.start_date).getTime()) / (7 * 86400000))))
    : 1;

  const eligible = stats.avgScore >= 50 && stats.completed >= 8;

  const statCards = [
    { label: "Current Week", value: `${currentWeek} / 8`, icon: Clock, color: "text-primary" },
    { label: "Tasks Completed", value: String(stats.completed), icon: CheckCircle, color: "text-success" },
    { label: "Pending", value: String(stats.pending), icon: ListTodo, color: "text-warning" },
    { label: "Avg Score", value: `${stats.avgScore}/100`, icon: TrendingUp, color: eligible ? "text-success" : "text-info" },
  ];

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome, {internProfile?.name || "Student"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {internProfile?.field} Intern · ID: {internProfile?.intern_id}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="portal-stat">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className="text-2xl font-semibold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>

        <Card className={eligible ? "border-success/30 bg-success/5" : "border-border"}>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className={`h-5 w-5 ${eligible ? "text-success" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {eligible ? "🎉 You're eligible for certification!" : "Certificate Eligibility"}
              </p>
              <p className="text-xs text-muted-foreground">
                {eligible
                  ? "Complete your payment to download your certificate."
                  : `Complete all 8 tasks with avg score ≥ 50. Current: ${stats.completed}/8 tasks, ${stats.avgScore} avg.`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Linkedin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Boost your profile!</p>
                <p className="text-xs text-muted-foreground">Add this internship to LinkedIn & follow Syedom Labs</p>
              </div>
            </div>
            <a
              href="https://www.linkedin.com/company/syedom-labs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Follow <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks assigned yet. Your tasks will appear once your internship starts.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-foreground">{it.tasks?.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Week {it.tasks?.week_number}</span>
                        <span>{it.tasks?.difficulty}</span>
                      </div>
                    </div>
                    <span className={`portal-badge-${it.status === "completed" ? "success" : it.status === "in_progress" ? "info" : "warning"}`}>
                      {it.status === "in_progress" ? "In Progress" : it.status.charAt(0).toUpperCase() + it.status.slice(1)}
                    </span>
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

export default StudentDashboard;
