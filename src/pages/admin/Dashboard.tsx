import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, handleSupabaseResult } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { Users, BookOpen, FileText, Star, AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ interns: 0, tasks: 0, submissions: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [rlsWarning, setRlsWarning] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [internsRes, tasksRes, submissionsRes, gradesRes] = await Promise.all([
          supabase.from("intern_profiles").select("*", { count: "exact", head: true }),
          supabase.from("tasks").select("*", { count: "exact", head: true }),
          supabase.from("submissions").select("*", { count: "exact", head: true }),
          supabase.from("grades").select("score"),
        ]);

        // Log each error for debugging
        if (internsRes.error) console.warn("[Admin] intern_profiles query error:", internsRes.error.message);
        if (tasksRes.error) console.warn("[Admin] tasks query error:", tasksRes.error.message);
        if (submissionsRes.error) console.warn("[Admin] submissions query error:", submissionsRes.error.message);
        if (gradesRes.error) console.warn("[Admin] grades query error:", gradesRes.error.message);

        // If any query returns 0 due to missing admin RLS policies, warn the user
        const anyError = internsRes.error || tasksRes.error || submissionsRes.error || gradesRes.error;
        if (anyError) setRlsWarning(true);

        const grades = gradesRes.data || [];
        const avg = grades.length
          ? Math.round(grades.reduce((a: number, g: any) => a + (g.score || 0), 0) / grades.length)
          : 0;

        setStats({
          interns: internsRes.count || 0,
          tasks: tasksRes.count || 0,
          submissions: submissionsRes.count || 0,
          avgScore: avg,
        });
      } catch (err) {
        console.error("[Admin] Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Interns", value: stats.interns, icon: Users, color: "text-primary" },
    { title: "Tasks Uploaded", value: stats.tasks, icon: BookOpen, color: "text-info" },
    { title: "Submissions", value: stats.submissions, icon: FileText, color: "text-warning" },
    { title: "Avg Grade", value: stats.avgScore > 0 ? `${stats.avgScore}%` : "—", icon: Star, color: "text-success" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of the internship program</p>
        </div>

        {rlsWarning && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30 text-warning-foreground">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-warning">Database permissions not yet configured</p>
              <p className="text-muted-foreground mt-1">
                Run <code className="bg-muted px-1 rounded text-xs">supabase/migrations/20260315_fix_admin_rls_and_schema.sql</code> in
                your Supabase dashboard SQL editor to grant admin access to all tables.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </CardTitle>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
