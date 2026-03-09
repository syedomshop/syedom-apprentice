import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Activity, Database, Cpu, CheckCircle, XCircle, RefreshCw, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HealthCheck {
  name: string;
  status: "ok" | "error" | "testing";
  latency?: number;
  message?: string;
}

interface EdgeFnTest {
  name: string;
  status: "idle" | "testing" | "pass" | "fail";
  response?: string;
  latency?: number;
}

const EDGE_FUNCTIONS = [
  { name: "generate-tasks", body: {} },
  { name: "grade-submission", body: { test: true } },
  { name: "send-confirmation", body: { test: true } },
  { name: "process-pending-offers", body: {} },
  { name: "send-admin-notification", body: { test: true } },
];

const SystemHealth = () => {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [edgeFns, setEdgeFns] = useState<EdgeFnTest[]>(EDGE_FUNCTIONS.map(f => ({ name: f.name, status: "idle" })));
  const [uptime, setUptime] = useState<string>("—");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runHealthChecks = async () => {
    setLoading(true);
    const results: HealthCheck[] = [];

    // DB connectivity
    const dbStart = Date.now();
    try {
      const { error } = await supabase.from("batches").select("id").limit(1);
      results.push({ name: "Database Connection", status: error ? "error" : "ok", latency: Date.now() - dbStart, message: error?.message });
    } catch (e: any) {
      results.push({ name: "Database Connection", status: "error", latency: Date.now() - dbStart, message: e.message });
    }

    // Auth service
    const authStart = Date.now();
    try {
      const { error } = await supabase.auth.getSession();
      results.push({ name: "Auth Service", status: error ? "error" : "ok", latency: Date.now() - authStart, message: error?.message });
    } catch (e: any) {
      results.push({ name: "Auth Service", status: "error", latency: Date.now() - authStart, message: e.message });
    }

    // Table checks
    const tables = ["intern_profiles", "tasks", "submissions", "certificates", "notifications", "ai_usage"];
    for (const table of tables) {
      const start = Date.now();
      try {
        const { error } = await supabase.from(table).select("id", { count: "exact", head: true });
        results.push({ name: `Table: ${table}`, status: error ? "error" : "ok", latency: Date.now() - start, message: error?.message });
      } catch (e: any) {
        results.push({ name: `Table: ${table}`, status: "error", latency: Date.now() - start, message: e.message });
      }
    }

    setChecks(results);
    setLoading(false);

    // Calculate "uptime" from results
    const okCount = results.filter(r => r.status === "ok").length;
    setUptime(`${Math.round((okCount / results.length) * 100)}%`);
  };

  const testEdgeFunction = async (index: number) => {
    const fn = EDGE_FUNCTIONS[index];
    setEdgeFns(prev => prev.map((f, i) => i === index ? { ...f, status: "testing" } : f));

    const start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke(fn.name, { body: fn.body });
      const latency = Date.now() - start;
      setEdgeFns(prev => prev.map((f, i) =>
        i === index ? {
          ...f,
          status: error ? "fail" : "pass",
          latency,
          response: error ? error.message : JSON.stringify(data).slice(0, 100),
        } : f
      ));
    } catch (e: any) {
      setEdgeFns(prev => prev.map((f, i) =>
        i === index ? { ...f, status: "fail", latency: Date.now() - start, response: e.message } : f
      ));
    }
  };

  const testAllFunctions = async () => {
    for (let i = 0; i < EDGE_FUNCTIONS.length; i++) {
      await testEdgeFunction(i);
    }
    toast({ title: "Tests complete", description: "All edge functions have been tested" });
  };

  useEffect(() => { runHealthChecks(); }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "ok": case "pass": return <CheckCircle className="h-4 w-4 text-success" />;
      case "error": case "fail": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Health</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor and test system components</p>
          </div>
          <Button variant="outline" size="sm" onClick={runHealthChecks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Re-check
          </Button>
        </div>

        {/* Uptime Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="h-5 w-5 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">System Health</p>
                <p className="text-xl font-bold text-foreground">{uptime}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">DB Checks</p>
                <p className="text-xl font-bold text-foreground">{checks.filter(c => c.status === "ok").length}/{checks.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Cpu className="h-5 w-5 text-info" />
              <div>
                <p className="text-xs text-muted-foreground">Edge Functions</p>
                <p className="text-xl font-bold text-foreground">{edgeFns.filter(f => f.status === "pass").length}/{edgeFns.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" />Infrastructure Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {checks.map((check) => (
              <div key={check.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  {statusIcon(check.status)}
                  <span className="text-sm font-medium text-foreground">{check.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {check.latency != null && (
                    <span className="text-xs text-muted-foreground">{check.latency}ms</span>
                  )}
                  <Badge variant={check.status === "ok" ? "default" : "destructive"}>
                    {check.status === "ok" ? "Healthy" : "Error"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Edge Function Tests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4" />Edge Function Tests</CardTitle>
            <Button size="sm" variant="outline" onClick={testAllFunctions}>
              Test All
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {edgeFns.map((fn, i) => (
              <div key={fn.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  {statusIcon(fn.status)}
                  <div>
                    <span className="text-sm font-medium text-foreground font-mono">{fn.name}</span>
                    {fn.response && (
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-sm truncate">{fn.response}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {fn.latency != null && <span className="text-xs text-muted-foreground">{fn.latency}ms</span>}
                  <Button size="sm" variant="ghost" onClick={() => testEdgeFunction(i)} disabled={fn.status === "testing"}>
                    {fn.status === "testing" ? "Testing..." : "Test"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SystemHealth;
