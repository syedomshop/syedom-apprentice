import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, User, Github, Calendar, Award, TrendingUp, ExternalLink } from "lucide-react";

interface InternProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  intern_id: string;
  field: string;
  status: string;
  start_date: string | null;
  github_username: string | null;
  batch_id: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  repo_link: string;
  ai_score: number | null;
  instructor_comment: string | null;
  ai_feedback: string | null;
  status: string;
  created_at: string;
  task: {
    title: string;
    week_number: number;
    field: string;
    difficulty: string;
  } | null;
}

const InternDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [intern, setIntern] = useState<InternProfile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [profileRes, subsRes, taskCountRes, completedRes] = await Promise.all([
          supabase.from("intern_profiles").select("*").eq("id", id).single(),
          supabase.from("submissions").select("*, task:tasks(title, week_number, field, difficulty)").eq("intern_id", id).order("created_at", { ascending: false }),
          supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", id),
          supabase.from("intern_tasks").select("*", { count: "exact", head: true }).eq("intern_id", id).eq("status", "completed"),
        ]);

        setIntern(profileRes.data);
        setSubmissions(subsRes.data || []);
        setTaskStats({
          total: taskCountRes.count || 0,
          completed: completedRes.count || 0,
          pending: (taskCountRes.count || 0) - (completedRes.count || 0),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const avgScore = submissions.filter(s => s.ai_score != null).length > 0
    ? Math.round(submissions.filter(s => s.ai_score != null).reduce((a, s) => a + (s.ai_score || 0), 0) / submissions.filter(s => s.ai_score != null).length)
    : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!intern) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Intern not found</p>
          <Link to="/admin/interns"><Button variant="outline" className="mt-4">Back to Interns</Button></Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/interns">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{intern.name}</h1>
            <p className="text-sm text-muted-foreground">{intern.intern_id} · {intern.field}</p>
          </div>
          <Badge variant={intern.status === "active" ? "default" : intern.status === "completed" ? "secondary" : "destructive"} className="ml-auto">
            {intern.status}
          </Badge>
        </div>

        {/* Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{intern.email}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Github className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">GitHub</p>
                {intern.github_username ? (
                  <a href={`https://github.com/${intern.github_username}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                    {intern.github_username} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Not provided</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium text-foreground">{intern.start_date || "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className={`text-sm font-medium ${avgScore >= 70 ? "text-success" : avgScore >= 50 ? "text-warning" : "text-destructive"}`}>{avgScore}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" /> Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completed: {taskStats.completed}/{taskStats.total}</span>
              <span className="text-muted-foreground">Pending: {taskStats.pending}</span>
            </div>
            <Progress value={taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0} className="h-2" />
          </CardContent>
        </Card>

        {/* Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submissions ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Repo</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No submissions yet</TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium text-foreground">{sub.task?.title || "—"}</TableCell>
                        <TableCell><Badge variant="outline">W{sub.task?.week_number}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={sub.task?.difficulty === "Beginner" ? "secondary" : sub.task?.difficulty === "Advanced" ? "destructive" : "default"}>
                            {sub.task?.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a href={sub.repo_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${(sub.ai_score || 0) >= 70 ? "text-success" : (sub.ai_score || 0) >= 50 ? "text-warning" : "text-destructive"}`}>
                            {sub.ai_score != null ? `${sub.ai_score}%` : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.status === "graded" ? "default" : "secondary"}>{sub.status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                          {sub.instructor_comment || sub.ai_feedback?.slice(0, 80) || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default InternDetail;
