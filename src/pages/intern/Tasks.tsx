import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const difficultyColor = (d: string) => {
  if (d === "Intermediate") return "portal-badge-warning";
  if (d === "Advanced") return "portal-badge-destructive";
  return "portal-badge-info";
};

const statusColor = (s: string) => {
  if (s === "completed") return "portal-badge-success";
  if (s === "in_progress") return "portal-badge-info";
  return "portal-badge-warning";
};

const InternTasks = () => {
  const { internProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!internProfile) return;
    const fetch = async () => {
      // Get assigned tasks
      let { data } = await supabase
        .from("intern_tasks")
        .select("*, tasks(*)")
        .eq("intern_id", internProfile.id)
        .order("assigned_date", { ascending: false });

      // If no tasks assigned, auto-assign from pool
      if (!data || data.length === 0) {
        const { data: available } = await supabase
          .from("tasks")
          .select("id")
          .limit(5);

        if (available && available.length > 0) {
          const inserts = available.map((t) => ({
            intern_id: internProfile.id,
            task_id: t.id,
          }));
          await supabase.from("intern_tasks").insert(inserts);

          // Re-fetch
          const { data: refreshed } = await supabase
            .from("intern_tasks")
            .select("*, tasks(*)")
            .eq("intern_id", internProfile.id)
            .order("assigned_date", { ascending: false });
          setTasks(refreshed || []);
        }
      } else {
        setTasks(data);
      }
      setLoading(false);
    };
    fetch();
  }, [internProfile]);

  return (
    <PortalLayout role="intern">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Your assigned development tasks</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks available yet. Check back later!</p>
        ) : (
          <div className="grid gap-4">
            {tasks.map((it) => (
              <Card key={it.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground">{it.tasks?.title}</h3>
                        <span className={statusColor(it.status)}>
                          {it.status === "in_progress" ? "In Progress" : it.status.charAt(0).toUpperCase() + it.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{it.tasks?.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className={difficultyColor(it.tasks?.difficulty || "Beginner")}>{it.tasks?.difficulty}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" /> {it.tasks?.estimated_time}
                        </span>
                        {it.tasks?.learning_objective && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <BookOpen className="h-3 w-3" /> {it.tasks.learning_objective}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {it.tasks?.youtube_link && (
                        <a href={it.tasks.youtube_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" /> Tutorial
                          </Button>
                        </a>
                      )}
                      {it.status !== "completed" && (
                        <Button size="sm" className="text-xs" onClick={() => navigate("/intern/submit")}>
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default InternTasks;
