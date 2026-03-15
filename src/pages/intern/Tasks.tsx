import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const InternTasks = () => {
  const { internProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const profileId = internProfile?.id;

  useEffect(() => {
    if (!profileId) return;
    const fetch = async () => {
      try {
        let { data } = await supabase
          .from("intern_tasks")
          .select("*, tasks(*)")
          .eq("intern_id", profileId)
          .order("assigned_date", { ascending: true });

        // Auto-assign tasks if none exist
        if (!data || data.length === 0) {
          const { data: available } = await supabase
            .from("tasks")
            .select("id")
            .eq("field", internProfile!.field);

          if (available && available.length > 0) {
            await supabase.from("intern_tasks").insert(
              available.map((t) => ({ intern_id: profileId, task_id: t.id }))
            );
            const { data: refreshed } = await supabase
              .from("intern_tasks")
              .select("*, tasks(*)")
              .eq("intern_id", profileId)
              .order("assigned_date", { ascending: true });
            data = refreshed;
          }
        }

        // Check which tasks have submissions
        const { data: subs } = await supabase
          .from("submissions")
          .select("task_id")
          .eq("intern_id", profileId);
        const submittedSet = new Set((subs || []).map(s => s.task_id));

        setTasks((data || []).map(t => ({ ...t, hasSubmission: submittedSet.has(t.task_id) })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [profileId]);

  const getCountdown = (deadline: string | null) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { text: "Deadline passed", color: "text-destructive", bg: "bg-destructive/10" };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    let text = days > 0 ? `${days}d ${hours}h remaining` : `${hours}h ${mins}m remaining`;
    if (diff < 86400000) return { text, color: "text-destructive", bg: "bg-destructive/10" };
    if (diff < 172800000) return { text, color: "text-warning", bg: "bg-warning/10" };
    return { text, color: "text-success", bg: "bg-success/10" };
  };

  // Auto-update countdown every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">View assigned tasks, download instructions, and track deadlines</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
        ) : (
          <div className="grid gap-4">
            {tasks.map((it) => {
              const countdown = getCountdown(it.tasks?.deadline);
              return (
                <Card key={it.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">Week {it.tasks?.week_number}</Badge>
                          <h3 className="text-sm font-medium text-foreground">{it.tasks?.title}</h3>
                          {it.hasSubmission && (
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Submitted</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{it.tasks?.description}</p>
                        {it.tasks?.deliverable && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Expected Output:</strong> {it.tasks.deliverable}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Countdown Timer */}
                    {countdown && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${countdown.bg}`}>
                        <Clock className={`h-4 w-4 ${countdown.color}`} />
                        <span className={`text-sm font-medium ${countdown.color}`}>{countdown.text}</span>
                      </div>
                    )}

                    {/* Task File Download */}
                    {it.tasks?.task_file_url && (
                      <a href={it.tasks.task_file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          {it.tasks.task_file_url.startsWith("http") ? (
                            <><ExternalLink className="h-4 w-4" /> View Task File</>
                          ) : (
                            <><Download className="h-4 w-4" /> Download Task File</>
                          )}
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default InternTasks;
