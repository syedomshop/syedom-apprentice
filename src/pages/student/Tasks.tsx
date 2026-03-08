import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const StudentTasks = () => {
  const { internProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!internProfile) return;

    const fetchTasks = async () => {
      // Get assigned tasks
      let { data } = await supabase
        .from("intern_tasks")
        .select("*, tasks(*)")
        .eq("intern_id", internProfile.id)
        .order("assigned_date", { ascending: true });

      // If no tasks, auto-assign from task pool for current week
      if (!data || data.length === 0) {
        const currentWeek = Math.min(8, Math.max(1, Math.ceil((Date.now() - new Date(internProfile.start_date).getTime()) / (7 * 86400000))));

        const { data: available } = await supabase
          .from("tasks")
          .select("id")
          .eq("field", internProfile.field)
          .lte("week_number", currentWeek);

        if (available && available.length > 0) {
          const inserts = available.map((t) => ({ intern_id: internProfile.id, task_id: t.id }));
          await supabase.from("intern_tasks").insert(inserts);

          const { data: refreshed } = await supabase
            .from("intern_tasks")
            .select("*, tasks(*)")
            .eq("intern_id", internProfile.id)
            .order("assigned_date", { ascending: true });
          setTasks(refreshed || []);
        }
      } else {
        setTasks(data);
      }
      setLoading(false);
    };
    fetchTasks();
  }, [internProfile]);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Weekly Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete your assigned tasks each week</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks available yet. Tasks will be assigned when your internship starts.</p>
        ) : (
          <div className="grid gap-4">
            {tasks.map((it) => (
              <Card key={it.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="portal-badge-info">Week {it.tasks?.week_number}</span>
                        <h3 className="text-sm font-medium text-foreground">{it.tasks?.title}</h3>
                        <span className={`portal-badge-${it.status === "completed" ? "success" : it.status === "in_progress" ? "info" : "warning"}`}>
                          {it.status === "in_progress" ? "In Progress" : it.status.charAt(0).toUpperCase() + it.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{it.tasks?.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{it.tasks?.difficulty}</span>
                        {it.tasks?.estimated_time && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" /> {it.tasks.estimated_time}
                          </span>
                        )}
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
                        <Button size="sm" className="text-xs" onClick={() => navigate("/submit")}>Submit</Button>
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

export default StudentTasks;
