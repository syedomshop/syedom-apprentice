import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const submissions = [
  { task: "Create a Todo App", score: 9, feedback: "Excellent implementation with clean code structure.", date: "2026-03-05" },
  { task: "Build a REST API Client", score: 7, feedback: "Good work. Consider adding error handling for edge cases.", date: "2026-03-04" },
  { task: "CSS Grid Layout Challenge", score: 8, feedback: "Well structured layout. Mobile responsiveness could be improved.", date: "2026-03-03" },
  { task: "React State Management", score: 10, feedback: "Perfect! Great use of context and custom hooks.", date: "2026-03-02" },
];

const InternProgress = () => {
  const avgScore = (submissions.reduce((a, b) => a + b.score, 0) / submissions.length).toFixed(1);
  const completionRate = 75;

  return (
    <PortalLayout role="intern">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your internship progress and scores</p>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Average Score</span>
            <span className="text-3xl font-semibold text-foreground">{avgScore}<span className="text-base text-muted-foreground">/10</span></span>
          </div>
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Tasks Completed</span>
            <span className="text-3xl font-semibold text-foreground">{submissions.length}</span>
          </div>
          <div className="portal-stat">
            <span className="text-sm text-muted-foreground">Completion Rate</span>
            <div className="space-y-2">
              <span className="text-3xl font-semibold text-foreground">{completionRate}%</span>
              <Progress value={completionRate} className="h-2" />
            </div>
          </div>
        </div>

        {/* Submission History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.map((sub, i) => (
                <div key={i} className="flex items-start justify-between p-4 rounded-lg border border-border">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground">{sub.task}</h3>
                    <p className="text-xs text-muted-foreground">{sub.feedback}</p>
                    <span className="text-xs text-muted-foreground">{sub.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-lg font-semibold ${sub.score >= 8 ? "text-success" : sub.score >= 6 ? "text-warning" : "text-destructive"}`}>
                      {sub.score}
                    </span>
                    <span className="text-xs text-muted-foreground">/10</span>
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

export default InternProgress;
