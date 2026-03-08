import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, CheckCircle, Activity, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ interns: 0, tasks: 0, submissions: 0, tokenPct: 0 });
  const [recentSubs, setRecentSubs] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const [{ count: internCount }, { count: taskCount }, { count: subCount }, { data: usage }] = await Promise.all([
        supabase.from("intern_profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("tasks").select("*", { count: "exact", head: true }),
        supabase.from("submissions").select("*", { count: "exact", head: true }),
        supabase.from("ai_usage").select("*").eq("date", new Date().toISOString().split("T")[0]).maybeSingle(),
      ]);

      const dailyLimit = 10000;
      const tokensToday = usage?.data?.tokens_used || 0;

      setStats({
        interns: internCount || 0,
        tasks: taskCount || 0,
        submissions: subCount || 0,
        tokenPct: Math.round((tokensToday / dailyLimit) * 100),
      });

      // Recent submissions
      const { data: subs } = await supabase
        .from("submissions")
        .select("*, intern_profiles(name), tasks(title)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentSubs(subs || []);
    };
    fetch();
  }, []);

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-tasks");
      if (error) throw error;
      toast({ title: "Tasks generated", description: "New AI-generated tasks added to the pool." });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const statCards = [
    { label: "Active Interns", value: String(stats.interns), icon: Users, color: "text-primary" },
    { label: "Total Tasks", value: String(stats.tasks), icon: ListTodo, color: "text-info" },
    { label: "Total Submissions", value: String(stats.submissions), icon: CheckCircle, color: "text-success" },
    { label: "AI Tokens Used", value: `${stats.tokenPct}%`, icon: Activity, color: "text-warning" },
  ];

  return (
    <PortalLayout role="admin">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview of internship operations</p>
          </div>
          <Button size="sm" onClick={handleGenerateTasks} disabled={generating}>
            <Bot className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Generate Tasks"}
          </Button>
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
            <CardTitle className="text-base">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSubs.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-foreground">{sub.intern_profiles?.name}</h3>
                      <p className="text-xs text-muted-foreground">{sub.tasks?.title}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {sub.ai_score != null ? (
                        <span className={`text-sm font-semibold ${sub.ai_score >= 8 ? "text-success" : "text-warning"}`}>
                          {sub.ai_score}/10
                        </span>
                      ) : (
                        <span className="portal-badge-warning">Pending</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
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

export default AdminDashboard;
