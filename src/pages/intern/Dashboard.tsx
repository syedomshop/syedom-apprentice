import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const statusBadge = (status: string) => {
  switch (status) {
    case "completed": return <span className="portal-badge-success">Completed</span>;
    case "in_progress": return <span className="portal-badge-info">In Progress</span>;
    default: return <span className="portal-badge-warning">Pending</span>;
  }
};

const difficultyBadge = (difficulty: string) => {
  switch (difficulty) {
    case "Intermediate": return <span className="portal-badge-warning">{difficulty}</span>;
    case "Advanced": return <span className="portal-badge-destructive">{difficulty}</span>;
    default: return <span className="portal-badge-info">{difficulty}</span>;
  }
};

const InternDashboard = () => {
  const { internProfile, user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!internProfile) return;
    const fetchData = async () => {
      // Fetch assigned tasks with task details
      const { data: internTasks } = await supabase
        .from("intern_tasks")
        .select("*, tasks(*)")
        .eq("intern_id", internProfile.id)
        .order("assigned_date", { ascending: false })
        .limit(5);

      setTasks(internTasks || []);

      // Count stats
      const { count: totalCount } = await supabase
        .from("intern_tasks")
        .select("*", { count: "exact", head: true })
        .eq("intern_id", internProfile.id);

      const { count: completedCount } = await supabase
        .from("intern_tasks")
        .select("*", { count: "exact", head: true })
        .eq("intern_id", internProfile.id)
        .eq("status", "completed");

      const { count: pendingCount } = await supabase
        .from("intern_tasks")
        .select("*", { count: "exact", head: true })
        .eq("intern_id", internProfile.id)
        .in("status", ["pending", "in_progress"]);

      // Avg score
      const { data: subs } = await supabase
        .from("submissions")
        .select("ai_score")
        .eq("intern_id", internProfile.id)
        .not("ai_score", "is", null);

      const avg = subs && subs.length > 0
        ? (subs.reduce((a, b) => a + (b.ai_score || 0), 0) / subs.length).toFixed(1)
        : "0";

      setStats({
        total: totalCount || 0,
        completed: completedCount || 0,
        pending: pendingCount || 0,
        avgScore: parseFloat(avg),
      });
      setLoading(false);
    };
    fetchData();
  }, [internProfile]);

  const statCards = [
    { label: "Total Tasks", value: String(stats.total), icon: ListTodo, color: "text-primary" },
    { label: "Completed", value: String(stats.completed), icon: CheckCircle, color: "text-success" },
    { label: "Pending", value: String(stats.pending), icon: Clock, color: "text-warning" },
    { label: "Avg Score", value: String(stats.avgScore), icon: TrendingUp, color: "text-info" },
  ];

  return (
    <PortalLayout role="intern">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, {internProfile?.name || "Intern"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Intern ID: {internProfile?.intern_id} — Here's your progress overview
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks assigned yet. Check back soon!</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-medium text-foreground">{it.tasks?.title}</h3>
                      <div className="flex items-center gap-3">
                        {difficultyBadge(it.tasks?.difficulty || "Beginner")}
                        <span className="text-xs text-muted-foreground">⏱ {it.tasks?.estimated_time}</span>
                        {it.tasks?.youtube_link && (
                          <a href={it.tasks.youtube_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                            📹 Tutorial
                          </a>
                        )}
                      </div>
                    </div>
                    {statusBadge(it.status)}
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

export default InternDashboard;
