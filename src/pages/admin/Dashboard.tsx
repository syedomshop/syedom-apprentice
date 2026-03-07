import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, CheckCircle, Activity, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total Interns", value: "24", icon: Users, color: "text-primary" },
  { label: "Active Tasks", value: "18", icon: ListTodo, color: "text-info" },
  { label: "Submissions Today", value: "9", icon: CheckCircle, color: "text-success" },
  { label: "AI Tokens Used", value: "62%", icon: Activity, color: "text-warning" },
];

const recentSubmissions = [
  { intern: "Ali Hassan", task: "Build navigation component", score: 8, time: "2 hours ago" },
  { intern: "Sara Khan", task: "Form validation with Zod", score: 9, time: "3 hours ago" },
  { intern: "Usman Ahmed", task: "Custom hook for API", score: 7, time: "5 hours ago" },
  { intern: "Fatima Noor", task: "CSS Grid layout", score: 10, time: "6 hours ago" },
];

const AdminDashboard = () => {
  return (
    <PortalLayout role="admin">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview of internship operations</p>
          </div>
          <Button size="sm">
            <Bot className="h-4 w-4 mr-2" />
            Generate Tasks
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="portal-stat">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className="text-2xl font-semibold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Recent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground">{sub.intern}</h3>
                    <p className="text-xs text-muted-foreground">{sub.task}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold ${sub.score >= 8 ? "text-success" : "text-warning"}`}>
                      {sub.score}/10
                    </span>
                    <span className="text-xs text-muted-foreground">{sub.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default AdminDashboard;
