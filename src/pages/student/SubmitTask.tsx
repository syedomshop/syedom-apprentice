import { useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateCache } from "@/lib/cache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { TTL } from "@/lib/cache";

const SubmitTask = () => {
  const { internProfile } = useAuth();
  const [taskId, setTaskId] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const profileId = internProfile?.id;

  const { data: tasks, refetch } = useCachedQuery<any[]>(
    `submit_tasks_${profileId}`,
    async () => {
      const { data } = await supabase
        .from("intern_tasks")
        .select("*, tasks(*)")
        .eq("intern_id", profileId)
        .in("status", ["pending", "in_progress"]);
      return data || [];
    },
    { ttl: TTL.SHORT, enabled: !!profileId }
  );

  const selectedTask = tasks?.find((t) => t.task_id === taskId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internProfile || !submissionText.trim()) {
      toast({ title: "Submission text required", description: "Please write your assignment response.", variant: "destructive" });
      return;
    }
    if (!taskId) {
      toast({ title: "Select a task", description: "Please choose which task you're submitting.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.from("submissions").insert({
        intern_id: internProfile.id,
        task_id: taskId,
        repo_link: submissionText.trim(),
        intern_comment: null,
      });
      if (error) throw error;

      await supabase.from("intern_tasks").update({ status: "completed" }).eq("intern_id", internProfile.id).eq("task_id", taskId);

      // Trigger AI grading with text submission
      supabase.functions.invoke("grade-submission", {
        body: {
          submission_text: submissionText.trim(),
          task_id: taskId,
          intern_id: internProfile.id,
        },
      }).catch(() => {});

      // Invalidate caches
      invalidateCache(`dashboard_${profileId}`);
      invalidateCache(`tasks_${profileId}`);
      invalidateCache(`progress_${profileId}`);
      invalidateCache(`certificate_${profileId}`);
      invalidateCache(`submit_tasks_${profileId}`);

      toast({ title: "Task submitted!", description: "Your work will be evaluated by AI shortly. Check your progress page for results." });

      setTaskId("");
      setSubmissionText("");
      refetch();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Submit Task</h1>
          <p className="text-sm text-muted-foreground mt-1">Write and submit your assignment response for AI evaluation</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Task</Label>
                <Select value={taskId} onValueChange={setTaskId} required>
                  <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                  <SelectContent>
                    {(tasks || []).map((t) => (
                      <SelectItem key={t.task_id} value={t.task_id}>
                        Week {t.tasks?.week_number}: {t.tasks?.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTask && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  <h3 className="text-sm font-medium text-foreground">{selectedTask.tasks?.title}</h3>
                  <p className="text-xs text-muted-foreground">{selectedTask.tasks?.description}</p>
                  {selectedTask.tasks?.deliverable && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Expected Output:</strong> {selectedTask.tasks.deliverable}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="submission">
                  Your Submission <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="submission"
                  placeholder="Write your assignment response here. Be thorough and detailed..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={10}
                  required
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground text-right">{submissionText.length} characters</p>
              </div>

              <Button type="submit" disabled={loading || !tasks?.length || !submissionText.trim() || !taskId} className="w-full">
                <Upload className="h-4 w-4 mr-2" /> {loading ? "Submitting..." : "Submit Task"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default SubmitTask;
