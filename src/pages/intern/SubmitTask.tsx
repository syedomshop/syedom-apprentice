import { useState, useEffect } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const SubmitTask = () => {
  const { internProfile } = useAuth();
  const [taskId, setTaskId] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!internProfile) return;
    // Fetch non-completed assigned tasks
    supabase
      .from("intern_tasks")
      .select("*, tasks(*)")
      .eq("intern_id", internProfile.id)
      .in("status", ["pending", "in_progress"])
      .then(({ data }) => setTasks(data || []));
  }, [internProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internProfile) return;
    setLoading(true);

    try {
      // Find the intern_task to get the actual task_id
      const internTask = tasks.find((t) => t.task_id === taskId);
      if (!internTask) throw new Error("Task not found");

      // Create submission
      const { error } = await supabase.from("submissions").insert({
        intern_id: internProfile.id,
        task_id: taskId,
        repo_link: repoLink,
        explanation,
      });

      if (error) throw error;

      // Update intern_task status
      await supabase
        .from("intern_tasks")
        .update({ status: "completed" })
        .eq("intern_id", internProfile.id)
        .eq("task_id", taskId);

      // Trigger AI grading (fire and forget)
      supabase.functions.invoke("grade-submission", {
        body: { repo_link: repoLink, explanation, task_id: taskId, intern_id: internProfile.id },
      }).catch(() => {});

      toast({
        title: "Task submitted",
        description: "Your submission is being reviewed by AI. Check back soon for your score.",
      });

      setTaskId("");
      setRepoLink("");
      setExplanation("");
      // Refresh tasks
      const { data: refreshed } = await supabase
        .from("intern_tasks")
        .select("*, tasks(*)")
        .eq("intern_id", internProfile.id)
        .in("status", ["pending", "in_progress"]);
      setTasks(refreshed || []);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout role="intern">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Submit Task</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit your completed work for AI grading</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Task</Label>
                <Select value={taskId} onValueChange={setTaskId} required>
                  <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                  <SelectContent>
                    {tasks.map((t) => (
                      <SelectItem key={t.task_id} value={t.task_id}>
                        {t.tasks?.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo">GitHub Repository Link</Label>
                <Input id="repo" type="url" placeholder="https://github.com/username/repo" value={repoLink} onChange={(e) => setRepoLink(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="explanation">Brief Explanation</Label>
                <Textarea id="explanation" placeholder="Describe your approach and what you learned..." value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={4} required />
              </div>
              <Button type="submit" disabled={loading || tasks.length === 0} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Submitting..." : "Submit Task"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default SubmitTask;
