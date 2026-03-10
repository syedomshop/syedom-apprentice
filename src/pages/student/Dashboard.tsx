import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, CheckCircle, Clock, TrendingUp, Linkedin, ExternalLink, Trophy, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { TTL } from "@/lib/cache";
import { useState, useEffect } from "react";

const WHATSAPP_LINK = "https://chat.whatsapp.com/Lc3xd1RHwCQC9ZKXCBG6Xu?mode=gi_t";

interface DashboardData {
  tasks: any[];
  total: number;
  completed: number;
  pending: number;
  avgScore: number;
}

interface LeaderEntry {
  name: string;
  avg_score: number;
  field: string;
}

const StudentDashboard = () => {
  const { internProfile } = useAuth();
  const profileId = internProfile?.id;
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);

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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data: subs } = await supabase
          .from("submissions")
          .select("intern_id, ai_score, intern_profiles(name, field)")
          .not("ai_score", "is", null);

        if (subs && subs.length > 0) {
          const internMap = new Map<string, { name: string; field: string; scores: number[] }>();
          subs.forEach((s: any) => {
            if (!internMap.has(s.intern_id)) {
              internMap.set(s.intern_id, { name: s.intern_profiles?.name || "Unknown", field: s.intern_profiles?.field || "", scores: [] });
            }
            internMap.get(s.intern_id)!.scores.push(s.ai_score);
          });
          const sorted = Array.from(internMap.values())
            .map((e) => ({ ...e, avg_score: Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length) }))
            .sort((a, b) => b.avg_score - a.avg_score)
            .slice(0, 5);
          setLeaderboard(sorted);
        }
      } catch {}
    };
    fetchLeaderboard();
  }, []);

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
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Welcome, {internProfile?.name || "Student"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {internProfile?.field} Intern · ID: {internProfile?.intern_id}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="portal-stat">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className="text-xl md:text-2xl font-semibold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>

        <Card className={eligible ? "border-success/30 bg-success/5" : "border-border"}>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className={`h-5 w-5 flex-shrink-0 ${eligible ? "text-success" : "text-muted-foreground"}`} />
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

        {/* WhatsApp + LinkedIn row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block">
            <Card className="border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Join WhatsApp Group</p>
                  <p className="text-xs text-muted-foreground">Connect with fellow interns & get updates</p>
                </div>
              </CardContent>
            </Card>
          </a>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Linkedin className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Boost your profile!</p>
                  <p className="text-xs text-muted-foreground">Follow Syedom Labs on LinkedIn</p>
                </div>
              </div>
              <a
                href="https://www.linkedin.com/company/syedom-labs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0"
              >
                Follow <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Mini Leaderboard */}
        {leaderboard.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <CardTitle className="text-base">Top Performers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className={`font-bold w-5 text-center ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-orange-400" : "text-muted-foreground"}`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate text-foreground">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">{entry.field}</span>
                    <span className="font-semibold text-primary">{entry.avg_score}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                  <div key={it.id} className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">{it.tasks?.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Week {it.tasks?.week_number}</span>
                        <span>{it.tasks?.difficulty}</span>
                      </div>
                    </div>
                    <span className={`portal-badge-${it.status === "completed" ? "success" : it.status === "in_progress" ? "info" : "warning"} flex-shrink-0 ml-2`}>
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
