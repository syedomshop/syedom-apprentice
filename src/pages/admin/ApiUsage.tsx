import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, Cpu, Zap, BarChart3, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UsageRecord {
  id: string;
  date: string;
  tokens_used: number;
  api_calls: number;
}

const DAILY_TOKEN_LIMIT = 1_000_000;
const DAILY_CALL_LIMIT = 500;

const AdminApiUsage = () => {
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiPaused, setAiPaused] = useState(false);
  const { toast } = useToast();

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_usage")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      setUsage(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load API usage", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsage(); }, []);

  const today = usage[0];
  const todayTokens = today?.tokens_used || 0;
  const todayCalls = today?.api_calls || 0;
  const tokenPercent = Math.min(100, (todayTokens / DAILY_TOKEN_LIMIT) * 100);
  const callPercent = Math.min(100, (todayCalls / DAILY_CALL_LIMIT) * 100);
  const totalTokens = usage.reduce((sum, u) => sum + u.tokens_used, 0);
  const totalCalls = usage.reduce((sum, u) => sum + u.api_calls, 0);

  const toggleAi = () => {
    setAiPaused(!aiPaused);
    toast({
      title: aiPaused ? "Grading Resumed" : "Grading Paused",
      description: aiPaused ? "Grading operations have been resumed." : "Grading operations have been paused.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">API Usage & Limits</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor grading and email API usage</p>
          </div>
          <div className="flex gap-2">
            <Button variant={aiPaused ? "default" : "destructive"} size="sm" onClick={toggleAi}>
              {aiPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {aiPaused ? "Resume Grading" : "Pause Grading"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchUsage} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Tokens</CardTitle>
              <Cpu className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{todayTokens.toLocaleString()}</p>
              <Progress value={tokenPercent} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{tokenPercent.toFixed(1)}% of {(DAILY_TOKEN_LIMIT / 1000).toFixed(0)}K limit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's API Calls</CardTitle>
              <Zap className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{todayCalls}</p>
              <Progress value={callPercent} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{callPercent.toFixed(1)}% of {DAILY_CALL_LIMIT} limit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tokens (30d)</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{totalTokens.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grading Status</CardTitle>
              {aiPaused ? <Pause className="h-4 w-4 text-destructive" /> : <Play className="h-4 w-4 text-success" />}
            </CardHeader>
            <CardContent>
              <Badge variant={aiPaused ? "destructive" : "default"} className="text-sm">
                {aiPaused ? "Paused" : "Active"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {aiPaused ? "Grading operations are paused" : "Grading is running normally"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Usage History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : usage.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No usage data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Tokens Used</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">API Calls</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Token Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.map((u) => {
                      const pct = Math.min(100, (u.tokens_used / DAILY_TOKEN_LIMIT) * 100);
                      return (
                        <tr key={u.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 text-foreground">{u.date}</td>
                          <td className="p-4 text-foreground">{u.tokens_used.toLocaleString()}</td>
                          <td className="p-4 text-foreground">{u.api_calls}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-12">{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminApiUsage;
