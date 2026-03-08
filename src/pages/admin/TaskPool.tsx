import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const diffBadge = (d: string) => {
  if (d === "Intermediate") return "portal-badge-warning";
  if (d === "Advanced") return "portal-badge-destructive";
  return "portal-badge-info";
};

const TaskPool = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-tasks");
      if (error) throw error;
      toast({ title: "Tasks generated", description: "New tasks added." });
      fetchTasks();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PortalLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Task Pool</h1>
            <p className="text-sm text-muted-foreground mt-1">{tasks.length} tasks available</p>
          </div>
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            <Bot className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Generate New Tasks"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Title</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Difficulty</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Est. Time</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Objective</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : tasks.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tasks yet. Generate some!</td></tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                        <td className="px-4 py-3"><span className={diffBadge(task.difficulty)}>{task.difficulty}</span></td>
                        <td className="px-4 py-3 text-muted-foreground">{task.estimated_time}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{task.learning_objective}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(task.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default TaskPool;
