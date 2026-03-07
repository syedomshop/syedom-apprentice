import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCw } from "lucide-react";

const taskPool = [
  { id: 1, title: "Build a responsive navigation component", difficulty: "Beginner", estimatedTime: "45 min", usedBy: 8, createdAt: "2026-03-06" },
  { id: 2, title: "Implement form validation with Zod", difficulty: "Intermediate", estimatedTime: "60 min", usedBy: 12, createdAt: "2026-03-06" },
  { id: 3, title: "Create a reusable card component", difficulty: "Beginner", estimatedTime: "30 min", usedBy: 15, createdAt: "2026-03-05" },
  { id: 4, title: "Build a custom hook for API fetching", difficulty: "Intermediate", estimatedTime: "50 min", usedBy: 6, createdAt: "2026-03-05" },
  { id: 5, title: "Implement dark mode toggle", difficulty: "Beginner", estimatedTime: "40 min", usedBy: 20, createdAt: "2026-03-04" },
  { id: 6, title: "Build a pagination component", difficulty: "Intermediate", estimatedTime: "55 min", usedBy: 10, createdAt: "2026-03-04" },
];

const diffBadge = (d: string) => {
  if (d === "Intermediate") return "portal-badge-warning";
  if (d === "Advanced") return "portal-badge-destructive";
  return "portal-badge-info";
};

const TaskPool = () => {
  return (
    <PortalLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Task Pool</h1>
            <p className="text-sm text-muted-foreground mt-1">{taskPool.length} AI-generated tasks available</p>
          </div>
          <Button size="sm">
            <Bot className="h-4 w-4 mr-2" />
            Generate New Tasks
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">#</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Title</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Difficulty</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Est. Time</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Used By</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {taskPool.map((task) => (
                    <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{task.id}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                      <td className="px-4 py-3"><span className={diffBadge(task.difficulty)}>{task.difficulty}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{task.estimatedTime}</td>
                      <td className="px-4 py-3 text-foreground">{task.usedBy} interns</td>
                      <td className="px-4 py-3 text-muted-foreground">{task.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default TaskPool;
