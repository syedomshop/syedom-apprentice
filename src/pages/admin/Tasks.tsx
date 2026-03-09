import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateTaskDialog from "@/components/admin/CreateTaskDialog";

interface Task {
  id: string;
  title: string;
  field: string;
  week_number: number;
  difficulty: string;
  batch_id: string | null;
  submissions_count: number;
  graded_count: number;
  avg_score: number;
}

interface Batch {
  id: string;
  batch_number: number;
  title: string;
}

const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedField, setSelectedField] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: batchData }, { data: taskData }, { data: subData }] = await Promise.all([
        supabase.from("batches").select("id, batch_number, title").order("batch_number", { ascending: false }),
        supabase.from("tasks").select("*").order("week_number"),
        supabase.from("submissions").select("task_id, ai_score, status"),
      ]);

      setBatches(batchData || []);

      const enriched = (taskData || []).map((t) => {
        const subs = (subData || []).filter((s) => s.task_id === t.id);
        const graded = subs.filter((s) => s.status === "graded");
        const scores = subs.filter((s) => s.ai_score != null).map((s) => s.ai_score!);
        return {
          ...t,
          submissions_count: subs.length,
          graded_count: graded.length,
          avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        };
      });

      setTasks(enriched);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load tasks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fields = [...new Set(tasks.map((t) => t.field))];
  const filtered = tasks.filter((t) => {
    if (selectedBatch !== "all" && t.batch_id !== selectedBatch) return false;
    if (selectedField !== "all" && t.field !== selectedField) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Task Management</h1>
            <p className="text-muted-foreground text-sm mt-1">{tasks.length} total tasks</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex gap-3">
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>Batch {b.batch_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              {fields.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Graded</TableHead>
                      <TableHead>Avg Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No tasks found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Badge variant="outline">W{task.week_number}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{task.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>{task.field}</TableCell>
                          <TableCell>
                            <Badge variant={task.difficulty === "Beginner" ? "secondary" : task.difficulty === "Advanced" ? "destructive" : "default"}>
                              {task.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.submissions_count}</TableCell>
                          <TableCell>{task.graded_count}</TableCell>
                          <TableCell>
                            <span className={task.avg_score >= 70 ? "text-success font-medium" : "text-muted-foreground"}>
                              {task.avg_score > 0 ? `${task.avg_score}%` : "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;
