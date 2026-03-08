import { useState, useEffect } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateCache } from "@/lib/cache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { TTL } from "@/lib/cache";

const SubmitTask = () => {
  const { internProfile } = useAuth();
  const [taskId, setTaskId] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [internComment, setInternComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [repoStatus, setRepoStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
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

  const validateRepo = async (url: string) => {
    if (!url) { setRepoStatus("idle"); return; }
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) { setRepoStatus("invalid"); return; }
    setRepoStatus("checking");
    try {
      const res = await fetch(`https://api.github.com/repos/${match[1].replace(/\.git$/, "")}`);
      setRepoStatus(res.ok ? "valid" : "invalid");
    } catch { setRepoStatus("invalid"); }
  };

  useEffect(() => {
    const timer = setTimeout(() => validateRepo(repoLink), 800);
    return () => clearTimeout(timer);
  }, [repoLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internProfile || !repoLink) {
      toast({ title: "GitHub repo required", description: "Please provide your GitHub repository link.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.from("submissions").insert({
        intern_id: internProfile.id,
        task_id: taskId,
        repo_link: repoLink,
        intern_comment: internComment || null,
      });
      if (error) throw error;

      await supabase.from("intern_tasks").update({ status: "completed" }).eq("intern_id", internProfile.id).eq("task_id", taskId);

      supabase.functions.invoke("grade-submission", {
        body: { repo_link: repoLink, intern_comment: internComment, task_id: taskId, intern_id: internProfile.id },
      }).catch(() => {});

      // Invalidate all related caches so next visit fetches fresh data
      invalidateCache(`dashboard_${profileId}`);
      invalidateCache(`tasks_${profileId}`);
      invalidateCache(`progress_${profileId}`);
      invalidateCache(`certificate_${profileId}`);
      invalidateCache(`submit_tasks_${profileId}`);

      toast({ title: "Task submitted!", description: "Your work will be evaluated shortly. Check your progress page for results." });

      setTaskId("");
      setRepoLink("");
      setInternComment("");
      setRepoStatus("idle");
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
          <p className="text-sm text-muted-foreground mt-1">Submit your GitHub repository for evaluation</p>
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
              <div className="space-y-2">
                <Label htmlFor="repo">GitHub Repository Link <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input id="repo" type="url" placeholder="https://github.com/username/repo" value={repoLink} onChange={(e) => setRepoLink(e.target.value)} required />
                  {repoStatus === "valid" && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />}
                  {repoStatus === "invalid" && <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
                </div>
                {repoStatus === "invalid" && <p className="text-xs text-destructive">Repository not found or not accessible. Please check the URL.</p>}
                {repoStatus === "checking" && <p className="text-xs text-muted-foreground">Verifying repository...</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Comment <span className="text-muted-foreground">(optional, max 100 chars)</span></Label>
                <Input id="comment" placeholder="Brief note about your approach..." value={internComment} onChange={(e) => setInternComment(e.target.value.slice(0, 100))} maxLength={100} />
                <p className="text-xs text-muted-foreground text-right">{internComment.length}/100</p>
              </div>
              <Button type="submit" disabled={loading || !tasks?.length || !repoLink} className="w-full">
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
