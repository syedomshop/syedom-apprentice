import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Zap, AlertTriangle, Shield } from "lucide-react";

const usageData = [
  { date: "2026-03-07", tokens: 4200, calls: 38 },
  { date: "2026-03-06", tokens: 5800, calls: 52 },
  { date: "2026-03-05", tokens: 3900, calls: 35 },
  { date: "2026-03-04", tokens: 6100, calls: 55 },
  { date: "2026-03-03", tokens: 4500, calls: 41 },
];

const tokenUsagePercent = 62;
const dailyLimit = 10000;
const tokensUsedToday = 6200;

const getMode = (percent: number) => {
  if (percent > 95) return { label: "Critical", color: "text-destructive", bg: "portal-badge-destructive", icon: AlertTriangle };
  if (percent > 80) return { label: "Warning", color: "text-warning", bg: "portal-badge-warning", icon: AlertTriangle };
  return { label: "Normal", color: "text-success", bg: "portal-badge-success", icon: Shield };
};

const AIUsage = () => {
  const mode = getMode(tokenUsagePercent);

  return (
    <PortalLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Usage Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">Track Gemini API consumption and safety status</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="portal-stat">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Safety Mode</span>
              <mode.icon className={`h-4 w-4 ${mode.color}`} />
            </div>
            <span className={mode.bg}>{mode.label}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {tokenUsagePercent > 95 ? "Non-critical AI tasks paused" : tokenUsagePercent > 80 ? "Reduced AI grading operations" : "All AI systems operational"}
            </p>
          </div>
          <div className="portal-stat">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tokens Used Today</span>
              <Zap className="h-4 w-4 text-warning" />
            </div>
            <span className="text-2xl font-semibold text-foreground">{tokensUsedToday.toLocaleString()}</span>
            <div className="space-y-1">
              <Progress value={tokenUsagePercent} className="h-2" />
              <span className="text-xs text-muted-foreground">{tokenUsagePercent}% of {dailyLimit.toLocaleString()} limit</span>
            </div>
          </div>
          <div className="portal-stat">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Calls Today</span>
              <Activity className="h-4 w-4 text-info" />
            </div>
            <span className="text-2xl font-semibold text-foreground">{usageData[0].calls}</span>
          </div>
        </div>

        {/* Usage History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage History (Last 5 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usageData.map((day) => {
                const pct = Math.round((day.tokens / dailyLimit) * 100);
                const dayMode = getMode(pct);
                return (
                  <div key={day.date} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                    <span className="text-sm text-muted-foreground w-24">{day.date}</span>
                    <div className="flex-1">
                      <Progress value={pct} className="h-2" />
                    </div>
                    <span className="text-sm font-medium text-foreground w-20 text-right">{day.tokens.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{day.calls} calls</span>
                    <span className={dayMode.bg}>{dayMode.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Safety Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Token Safety Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                <Shield className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Normal Mode</span>
                  <span className="text-muted-foreground"> — &lt;80% usage. All AI operations run normally.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Warning Mode</span>
                  <span className="text-muted-foreground"> — 80–95% usage. AI grading operations reduced.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Critical Mode</span>
                  <span className="text-muted-foreground"> — &gt;95% usage. Non-critical AI tasks paused. Only task generation and grading remain active.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default AIUsage;
