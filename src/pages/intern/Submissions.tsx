import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const InternSubmissions = () => {
  const { internProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [taskId, setTaskId] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const profileId = internProfile?.id;

  const fetchData = async () => {
    if (!profileId) return;
    const [{ data: taskData }, { data: subData }] = await Promise.all([
      supabase.from("intern_tasks").select("*, tasks(*)").eq("intern_id", profileId),
      supabase
        .from("submissions")
        .select("*, tasks(title, deadline, week_number), grades(score, feedback)")
        .eq("intern_id", profileId)
        .order("created_at", { ascending: false }),
    ]);
    setTasks(taskData || []);
    setSubmissions(subData || []);
  };

  useEffect(() => { fetchData(); }, [profileId]);

  const submittedTaskIds = new Set(submissions.map(s => s.task_id));
  const availableTasks = tasks.filter(t => !submittedTaskIds.has(t.task_id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !taskId || !repoLink.trim()) {
      toast({ title: "Missing fields", description: "Select a task and provide a GitHub repo link.", variant: "destructive" });
      return;
    }

    if (!repoLink.trim().startsWith("http")) {
      toast({ title: "Invalid link", description: "Please provide a valid URL starting with http.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const selectedTask = tasks.find(t => t.task_id === taskId);
      const deadline = selectedTask?.tasks?.deadline;
      let timeliness = "on_time";
      if (deadline && new Date() > new Date(deadline)) {
        timeliness = "late";
      }

      const { error } = await supabase.from("submissions").insert({
        intern_id: profileId,
        task_id: taskId,
        repo_link: repoLink.trim(),
        intern_comment: comment.trim() || null,
        timeliness,
      });
      if (error) throw error;

      // Mark task as completed in intern_tasks
      await supabase
        .from("intern_tasks")
        .update({ status: "completed" })
        .eq("intern_id", profileId)
        .eq("task_id", taskId);

      // Send email confirmation to intern (fire-and-forget)
      if (internProfile?.email && internProfile?.name) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-admin-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              recipients: [{ name: internProfile.name, email: internProfile.email }],
              subject: `Submission Received: ${selectedTask?.tasks?.title || "Task"}`,
              message: `Hi ${internProfile.name},\n\nYour submission for "${selectedTask?.tasks?.title}" has been received${timeliness === "late" ? " (marked as late)" : ""}.\n\nRepo: ${repoLink.trim()}\n\nOur team will review your submission and provide feedback soon.\n\n— Syedom Labs Team`,
            }),
          });
        } catch (emailErr) {
          console.warn("Submission email failed (non-critical):", emailErr);
        }
      }

      toast({
        title: "Submitted!",
        description: timeliness === "late"
          ? "Submission received but marked as late (past deadline)."
          : "Submission received on time. We'll review it soon.",
      });
      setTaskId("");
      setRepoLink("");
      setComment("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (score: number) =>
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

  return (
    <PortalLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Submit Assignment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your GitHub repo link. You'll receive an email confirmation and feedback once reviewed.
          </p>
        </div>

        {/* Submission Form */}
        {availableTasks.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Task <span className="text-destructive">*</span></Label>
                  <Select value={taskId} onValueChange={setTaskId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task to submit" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((t) => (
                        <SelectItem key={t.task_id} value={t.task_id}>
                          Week {t.tasks?.week_number}: {t.tasks?.title}
                          {t.tasks?.deadline && new Date() > new Date(t.tasks.deadline) ? " ⚠️ (Past deadline)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>GitHub Repository Link <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="https://github.com/username/repo"
                    value={repoLink}
                    onChange={(e) => setRepoLink(e.target.value)}
                    required
                    data-testid="input-repo-link"
                  />
                  <p className="text-xs text-muted-foreground">Must be a public GitHub repository</p>
                </div>

                <div className="space-y-2">
                  <Label>Comments / Notes (optional)</Label>
                  <Textarea
                    placeholder="Describe your approach, challenges faced, or anything you want the reviewer to know..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    data-testid="input-comment"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !taskId || !repoLink.trim()}
                  className="w-full"
                  data-testid="button-submit"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {loading ? "Submitting..." : "Submit Assignment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">All tasks submitted!</p>
              <p className="text-xs text-muted-foreground mt-1">You have submitted all your assigned tasks. Check your grades below.</p>
            </CardContent>
          </Card>
        )}

        {/* Previous Submissions */}
        {submissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.map((s) => {
                  const grade = Array.isArray(s.grades) ? s.grades[0] : s.grades;
                  return (
                    <div key={s.id} className="p-4 rounded-lg border border-border space-y-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.tasks?.title || "Task"}</p>
                          <p className="text-xs text-muted-foreground">Week {s.tasks?.week_number}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {grade?.score != null && (
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              Score: {grade.score}/100
                            </Badge>
                          )}
                          <Badge variant={s.timeliness === "late" ? "destructive" : "secondary"}>
                            {s.timeliness === "late" ? (
                              <><Clock className="h-3 w-3 mr-1" />Late</>
                            ) : (
                              <><CheckCircle className="h-3 w-3 mr-1" />On Time</>
                            )}
                          </Badge>
                        </div>
                      </div>
                      <a
                        href={s.repo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 break-all"
                      >
                        {s.repo_link} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                      {s.intern_comment && (
                        <p className="text-xs text-muted-foreground italic">"{s.intern_comment}"</p>
                      )}
                      {grade?.feedback && (
                        <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10">
                          <p className="text-xs font-medium text-primary mb-1">Feedback</p>
                          <p className="text-xs text-foreground">{grade.feedback}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default InternSubmissions;
