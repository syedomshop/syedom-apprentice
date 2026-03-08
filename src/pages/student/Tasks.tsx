import { useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Target, Play } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { TTL, invalidateCache } from "@/lib/cache";

const StudentTasks = () => {
  const { internProfile } = useAuth();
  const [expandedYoutube, setExpandedYoutube] = useState<string | null>(null);
  const navigate = useNavigate();
  const profileId = internProfile?.id;

  const { data: tasks, loading, refetch } = useCachedQuery<any[]>(
    `tasks_${profileId}`,
    async () => {
      let { data } = await supabase
        .from("intern_tasks")
        .select("*, tasks(*)")
        .eq("intern_id", profileId)
        .order("assigned_date", { ascending: true });

      if (!data || data.length === 0) {
        const currentWeek = Math.min(8, Math.max(1, Math.ceil((Date.now() - new Date(internProfile!.start_date).getTime()) / (7 * 86400000))));
        const { data: available } = await supabase.from("tasks").select("id").eq("field", internProfile!.field).lte("week_number", currentWeek);

        if (available && available.length > 0) {
          await supabase.from("intern_tasks").insert(available.map((t) => ({ intern_id: profileId, task_id: t.id })));
          const { data: refreshed } = await supabase.from("intern_tasks").select("*, tasks(*)").eq("intern_id", profileId).order("assigned_date", { ascending: true });
          // Also invalidate dashboard cache since tasks changed
          invalidateCache("dashboard_");
          return refreshed || [];
        }
      }
      return data || [];
    },
    { ttl: TTL.MEDIUM, enabled: !!profileId }
  );

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Weekly Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete your assigned tasks each week — submit GitHub repos only</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        ) : !tasks || tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks available yet. Tasks will be assigned when your internship starts.</p>
        ) : (
          <div className="grid gap-4">
            {tasks.map((it) => {
              const youtubeLinks: string[] = it.tasks?.youtube_links || (it.tasks?.youtube_link ? [it.tasks.youtube_link] : []);
              const isExpanded = expandedYoutube === it.id;

              return (
                <Card key={it.id}>
                  <CardContent className="p-5">
                    <div className="space-y-3">
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

                          {it.tasks?.mentor_explanation && (
                            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                              💡 {it.tasks.mentor_explanation}
                            </p>
                          )}

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
                            {it.tasks?.deliverable && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Target className="h-3 w-3" /> {it.tasks.deliverable}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {youtubeLinks.length > 0 && (
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => setExpandedYoutube(isExpanded ? null : it.id)}>
                              <Play className="h-3 w-3 mr-1" /> Tutorials ({youtubeLinks.length})
                            </Button>
                          )}
                          {it.status !== "completed" && (
                            <Button size="sm" className="text-xs" onClick={() => navigate("/submit")}>Submit</Button>
                          )}
                        </div>
                      </div>

                      {isExpanded && youtubeLinks.length > 0 && (
                        <div className="grid gap-3 pt-2 border-t border-border">
                          {youtubeLinks.map((link: string, idx: number) => {
                            const embedUrl = getYoutubeEmbedUrl(link);
                            if (!embedUrl) return null;
                            return (
                              <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-muted">
                                <iframe src={embedUrl} title={`Tutorial ${idx + 1}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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

export default StudentTasks;
