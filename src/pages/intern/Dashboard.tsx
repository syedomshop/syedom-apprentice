import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, CheckCircle, Clock, TrendingUp } from "lucide-react";

const stats = [
  { label: "Today's Tasks", value: "3", icon: ListTodo, color: "text-primary" },
  { label: "Completed", value: "12", icon: CheckCircle, color: "text-success" },
  { label: "Pending", value: "5", icon: Clock, color: "text-warning" },
  { label: "Avg Score", value: "8.2", icon: TrendingUp, color: "text-info" },
];

const todayTasks = [
  {
    id: 1,
    title: "Build a responsive navigation component",
    difficulty: "Beginner",
    estimatedTime: "45 min",
    status: "pending",
    youtubeLink: "https://youtube.com",
  },
  {
    id: 2,
    title: "Implement form validation with Zod",
    difficulty: "Intermediate",
    estimatedTime: "60 min",
    status: "in-progress",
    youtubeLink: "https://youtube.com",
  },
  {
    id: 3,
    title: "Create a reusable card component",
    difficulty: "Beginner",
    estimatedTime: "30 min",
    status: "completed",
    youtubeLink: "https://youtube.com",
  },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <span className="portal-badge-success">Completed</span>;
    case "in-progress":
      return <span className="portal-badge-info">In Progress</span>;
    default:
      return <span className="portal-badge-warning">Pending</span>;
  }
};

const difficultyBadge = (difficulty: string) => {
  switch (difficulty) {
    case "Intermediate":
      return <span className="portal-badge-warning">{difficulty}</span>;
    case "Advanced":
      return <span className="portal-badge-destructive">{difficulty}</span>;
    default:
      return <span className="portal-badge-info">{difficulty}</span>;
  }
};

const InternDashboard = () => {
  return (
    <PortalLayout role="intern">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back, Intern</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's your progress overview for today</p>
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

        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                    <div className="flex items-center gap-3">
                      {difficultyBadge(task.difficulty)}
                      <span className="text-xs text-muted-foreground">⏱ {task.estimatedTime}</span>
                      <a
                        href={task.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        📹 Tutorial
                      </a>
                    </div>
                  </div>
                  {statusBadge(task.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default InternDashboard;
