import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, BookOpen } from "lucide-react";

const tasks = [
  {
    id: 1,
    title: "Build a responsive navigation component",
    description: "Create a navigation bar that adapts to different screen sizes using CSS flexbox and media queries. Include a hamburger menu for mobile views.",
    difficulty: "Beginner",
    estimatedTime: "45 min",
    learningObjective: "Understanding responsive design patterns",
    youtubeLink: "https://youtube.com",
    status: "pending",
  },
  {
    id: 2,
    title: "Implement form validation with Zod",
    description: "Build a registration form with proper validation using Zod schema library. Handle error states and display meaningful messages.",
    difficulty: "Intermediate",
    estimatedTime: "60 min",
    learningObjective: "Schema validation in TypeScript",
    youtubeLink: "https://youtube.com",
    status: "in-progress",
  },
  {
    id: 3,
    title: "Create a reusable card component",
    description: "Design and implement a flexible card component that supports different variants: default, outlined, and elevated.",
    difficulty: "Beginner",
    estimatedTime: "30 min",
    learningObjective: "Component composition patterns",
    youtubeLink: "https://youtube.com",
    status: "completed",
  },
  {
    id: 4,
    title: "Build a custom hook for API fetching",
    description: "Create a reusable React hook that handles data fetching, loading states, and error handling with proper TypeScript types.",
    difficulty: "Intermediate",
    estimatedTime: "50 min",
    learningObjective: "Custom hooks and data fetching",
    youtubeLink: "https://youtube.com",
    status: "pending",
  },
];

const difficultyColor = (d: string) => {
  if (d === "Intermediate") return "portal-badge-warning";
  if (d === "Advanced") return "portal-badge-destructive";
  return "portal-badge-info";
};

const statusColor = (s: string) => {
  if (s === "completed") return "portal-badge-success";
  if (s === "in-progress") return "portal-badge-info";
  return "portal-badge-warning";
};

const InternTasks = () => {
  return (
    <PortalLayout role="intern">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Your assigned development tasks</p>
        </div>

        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                      <span className={statusColor(task.status)}>
                        {task.status === "in-progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={difficultyColor(task.difficulty)}>{task.difficulty}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" /> {task.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen className="h-3 w-3" /> {task.learningObjective}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a href={task.youtubeLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" /> Tutorial
                      </Button>
                    </a>
                    {task.status !== "completed" && (
                      <Button size="sm" className="text-xs">Submit</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
};

export default InternTasks;
