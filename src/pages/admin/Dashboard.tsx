import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { Users, BookOpen, FileText, Star } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ interns: 0, tasks: 0, submissions: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [
          { count: interns },
          { count: tasks },
          { count: submissions },
          { data: grades },
        ] = await Promise.all([
          supabase.from("intern_profiles").select("*", { count: "exact", head: true }),
          supabase.from("tasks").select("*", { count: "exact", head: true }),
          supabase.from("submissions").select("*", { count: "exact", head: true }),
          supabase.from("grades").select("score"),
        ]);

        const avg = grades?.length
          ? Math.round(grades.reduce((a, g) => a + g.score, 0) / grades.length)
          : 0;

        setStats({
          interns: interns || 0,
          tasks: tasks || 0,
          submissions: submissions || 0,
          avgScore: avg,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
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
