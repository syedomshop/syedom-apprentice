import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const InternSubmissions = () => {
  const { internProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [taskId, setTaskId] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const { toast } = useToast();
  const profileId = internProfile?.id;

  const fetchData = async () => {
    if (!profileId) return;

    try {
      // 1️⃣ Fetch active batch
      const { data: batchData } = await supabase
        .from("batches")
        .select("*")
        .eq("is_active", true)
        .single();
      setActiveBatch(batchData);

      // 2️⃣ Fetch tasks and submissions
      const [{ data: taskData }, { data: subData }] = await Promise.all([
        supabase.from("intern_tasks").select("*, tasks(*)").eq("intern_id", profileId),
        supabase.from("submissions").select("*, tasks(title, week_number)").eq("intern_id", profileId).order("created_at", { ascending: false }),
      ]);

      setTasks(taskData || []);
      setSubmissions(subData || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, [profileId]);

  // Filter out already-submitted tasks
  const submittedTaskIds = new Set(submissions.map(s => s.task_id));
  const availableTasks = tasks.filter(t => !submittedTaskIds.has(t.task_id));

  // Flexible date parser
  const parseDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    if (dateStr.includes("/")) { // MM/DD/YYYY
      const [month, day, year] = dateStr.split("/").map(Number);
      return new Date(year, month - 1, day);
    } else if (dateStr.includes("-")) { // MM-DD-YYYY or YYYY-MM-DD
      const parts = dateStr.split("-").map(Number);
      if (parts[0] > 31) { // assume YYYY-MM-DD
        return new Date(parts[0], parts[1] - 1, parts[2]);
      } else { // MM-DD-YYYY
        return new Date(parts[2], parts[0] - 1, parts[1]);
      }
    }
    return new Date(dateStr); // fallback
  };

  // Compute dynamic deadline based on batch start date
  const computeDeadline = (weekNumber: number | null) => {
    if (!weekNumber || !activeBatch?.start_date) return null;
    const start = parseDate(activeBatch.start_date);
    if (!start) return null;
    start.setDate(start.getDate() + (weekNumber - 1) * 7);
    return start;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !taskId || !repoLink.trim()) {
      toast({ title: "Missing fields", description: "Select a task and provide a GitHub repo link.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const selectedTask = tasks.find(t => t.task_id === taskId);
      const deadlineDate = computeDeadline(selectedTask?.tasks?.week_number);
      let timeliness = "on_time";
      if (deadlineDate && new Date() > deadlineDate) timeliness = "late";

      const { error } = await supabase.from("submissions").insert({
        intern_id: profileId,
        task_id: taskId,
        repo_link: repoLink.trim(),
        intern_comment: comment.trim() || null,
        timeliness,
      });
      if (error) throw error;

      // Update task status
      await supabase.from("intern_tasks").update({ status: "completed" }).eq("intern_id", profileId).eq("task_id", taskId);

      toast({
        title: "Submitted!",
        description: timeliness === "late" ? "Submission marked as late (past deadline)." : "Submission received on time."
      });

      setTaskId("");
      setRepoLink("");
      setComment("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Submit Assignment</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit your GitHub repo link and optional comments</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Task</Label>
                <Select value={taskId} onValueChange={setTaskId}>
                  <SelectTrigger><SelectValue placeholder="Select a task" /></SelectTrigger>
                  <SelectContent>
                    {availableTasks.map((t) => (
                      <SelectItem key={t.task_id} value={t.task_id}>
                        Week {t.tasks?.week_number}: {t.tasks?.title}
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
                />
              </div>

              <div className="space-y-2">
                <Label>Comments (optional)</Label>
                <Textarea
                  placeholder="Any notes about your submission..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={loading || !taskId || !repoLink.trim()} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Submitting..." : "Submit Assignment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Submissions */}
        {submissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{s.tasks?.title || "Task"}</p>
                      <Badge variant={s.timeliness === "late" ? "destructive" : "secondary"}>
                        {s.timeliness === "late" ? "Late" : "On Time"}
                      </Badge>
                    </div>
                    <a href={s.repo_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                      {s.repo_link}
                    </a>
                    {s.intern_comment && <p className="text-xs text-muted-foreground">{s.intern_comment}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default InternSubmissions;
