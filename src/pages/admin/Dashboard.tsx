import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { Users, Award, Clock, TrendingUp, Mail, DollarSign } from "lucide-react";

interface Stats {
  totalInterns: number;
  activeInterns: number;
  completedInterns: number;
  totalCertificates: number;
  paidCertificates: number;
  unpaidCertificates: number;
  pendingOffers: number;
  waitlistCount: number;
  avgScore: number;
  activeBatch: string | null;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalInterns: 0,
    activeInterns: 0,
    completedInterns: 0,
    totalCertificates: 0,
    paidCertificates: 0,
    unpaidCertificates: 0,
    pendingOffers: 0,
    waitlistCount: 0,
    avgScore: 0,
    activeBatch: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: totalInterns },
          { count: activeInterns },
          { count: completedInterns },
          { data: certs },
          { count: pendingOffers },
          { count: waitlistCount },
          { data: submissions },
          { data: batches },
        ] = await Promise.all([
          supabase.from("intern_profiles").select("*", { count: "exact", head: true }),
          supabase.from("intern_profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("intern_profiles").select("*", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("certificates").select("payment_status"),
          supabase.from("pending_offers").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("waitlist").select("*", { count: "exact", head: true }),
          supabase.from("submissions").select("ai_score").not("ai_score", "is", null),
          supabase.from("batches").select("title, batch_number").eq("status", "active").limit(1),
        ]);

        const totalCertificates = certs?.length || 0;
        const paidCertificates = certs?.filter((c) => c.payment_status === "paid").length || 0;
        const avgScore = submissions?.length
          ? Math.round(submissions.reduce((sum, s) => sum + (s.ai_score || 0), 0) / submissions.length)
          : 0;

        setStats({
          totalInterns: totalInterns || 0,
          activeInterns: activeInterns || 0,
          completedInterns: completedInterns || 0,
          totalCertificates,
          paidCertificates,
          unpaidCertificates: totalCertificates - paidCertificates,
          pendingOffers: pendingOffers || 0,
          waitlistCount: waitlistCount || 0,
          avgScore,
          activeBatch: batches?.[0] ? `Batch ${batches[0].batch_number}` : "None",
        });
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Active Interns", value: stats.activeInterns, icon: Users, color: "text-primary" },
    { title: "Total Interns", value: stats.totalInterns, icon: Users, color: "text-muted-foreground" },
    { title: "Completed", value: stats.completedInterns, icon: TrendingUp, color: "text-success" },
    { title: "Avg Score", value: `${stats.avgScore}%`, icon: TrendingUp, color: "text-info" },
    { title: "Certificates Issued", value: stats.totalCertificates, icon: Award, color: "text-warning" },
    { title: "Paid Certificates", value: stats.paidCertificates, icon: DollarSign, color: "text-success" },
    { title: "Unpaid Certificates", value: stats.unpaidCertificates, icon: DollarSign, color: "text-destructive" },
    { title: "Pending Offers", value: stats.pendingOffers, icon: Mail, color: "text-warning" },
    { title: "Waitlist", value: stats.waitlistCount, icon: Clock, color: "text-muted-foreground" },
    { title: "Active Batch", value: stats.activeBatch, icon: TrendingUp, color: "text-primary" },
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
          <p className="text-muted-foreground text-sm mt-1">
            Overview of the internship program
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
