import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, CheckCircle, Clock, Star } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalTasks: number;
  submitted: number;
  pending: number;
  avgScore: number;
}

const InternDashboard = () => {
  const { internProfile } = useAuth();

  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    submitted: 0,
    pending: 0,
    avgScore: 0,
  });

  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const profileId = internProfile?.id;
  const startDate = internProfile?.start_date;

  // refresh countdown every minute
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [tasksRes, subsRes, gradesRes] = await Promise.all([
          supabase
            .from("intern_tasks")
            .select("*, tasks(*)")
            .eq("intern_id", profileId)
            .order("assigned_date", { ascending: false }),

          supabase
            .from("submissions")
            .select("task_id")
            .eq("intern_id", profileId),

          supabase
            .from("grades")
            .select("score")
            .eq("intern_id", profileId),
        ]);

        const allTasks = tasksRes.data || [];
        const allSubs = subsRes.data || [];
        const allGrades = gradesRes.data || [];

        const submittedIds = new Set(allSubs.map((s: any) => s.task_id));

        const avgScore = allGrades.length
          ? Math.round(
              allGrades.reduce((a: number, g: any) => a + (g.score || 0), 0) /
                allGrades.length
            )
          : 0;

        setStats({
          totalTasks: allTasks.length,
          submitted: submittedIds.size,
          pending: allTasks.length - submittedIds.size,
          avgScore,
        });

        setRecentTasks(allTasks.slice(0, 5));
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileId]);

  // calculate deadline from week number
  const calculateDeadline = (week: number) => {
    if (!startDate) return null;

    const start = new Date(startDate);
    const deadline = new Date(start);

    deadline.setDate(start.getDate() + (week - 1) * 7);

    return deadline;
  };

  const getDeadlineInfo = (task: any) => {
    const week = task.tasks?.week_number;

    if (!week) return null;

    const deadline = calculateDeadline(week);

    if (!deadline) return null;

    const diff = deadline.getTime() - Date.now();

    if (diff <= 0)
      return {
        text: "Expired",
        color: "text-destructive",
      };

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (diff < 86400000)
      return {
        text: `${hours}h left`,
        color: "text-destructive",
      };

    if (diff < 172800000)
      return {
        text: `${days}d ${hours}h`,
        color: "text-warning",
      };

    return {
      text: `${days}d ${hours}h`,
      color: "text-muted-foreground",
    };
  };

  const statCards = [
    { label: "Total Tasks", value: stats.totalTasks, icon: ListTodo, color: "text-primary" },
    { label: "Submitted", value: stats.submitted, icon: CheckCircle, color: "text-success" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
    {
      label: "Avg Score",
      value: stats.avgScore > 0 ? `${stats.avgScore}%` : "—",
      icon: Star,
      color: "text-info",
    },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">
            Welcome, {internProfile?.name || "Intern"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {internProfile?.field} · ID: {internProfile?.intern_id}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks assigned yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((t) => {
                  const dl = getDeadlineInfo(t);

                  return (
                    <div
                      key={`${t.intern_id}-${t.task_id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {t.tasks?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.tasks?.field} · Week {t.tasks?.week_number}
                        </p>
                      </div>

                      {dl && (
                        <span
                          className={`text-xs font-medium ${dl.color}`}
                        >
                          {dl.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default InternDashboard;
