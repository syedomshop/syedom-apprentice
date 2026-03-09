import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const FIELDS = ["Web Development", "Python / Backend", "Data Science", "Flutter Developer"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

interface Props {
  batches: { id: string; batch_number: number; title: string }[];
  onCreated: () => void;
}

const CreateTaskDialog = ({ batches, onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    field: "",
    difficulty: "Beginner",
    week_number: "1",
    batch_id: "",
    estimated_time: "",
    learning_objective: "",
    deliverable: "GitHub repository with README",
    youtube_links: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        title: form.title,
        description: form.description,
        field: form.field,
        difficulty: form.difficulty,
        week_number: parseInt(form.week_number),
        batch_id: form.batch_id || null,
        estimated_time: form.estimated_time || null,
        learning_objective: form.learning_objective || null,
        deliverable: form.deliverable,
        youtube_links: form.youtube_links ? form.youtube_links.split(",").map(l => l.trim()) : [],
      });
      if (error) throw error;
      toast({ title: "Task created", description: `"${form.title}" has been added.` });
      setOpen(false);
      setForm({ title: "", description: "", field: "", difficulty: "Beginner", week_number: "1", batch_id: "", estimated_time: "", learning_objective: "", deliverable: "GitHub repository with README", youtube_links: "" });
      onCreated();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Create Task</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} required placeholder="Build a REST API" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe the task..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Field</Label>
              <Select value={form.field} onValueChange={v => update("field", v)} required>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  {FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={v => update("difficulty", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Week (1-8)</Label>
              <Input type="number" min={1} max={8} value={form.week_number} onChange={e => update("week_number", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={form.batch_id} onValueChange={v => update("batch_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map(b => <SelectItem key={b.id} value={b.id}>Batch {b.batch_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estimated Time</Label>
            <Input value={form.estimated_time} onChange={e => update("estimated_time", e.target.value)} placeholder="4-6 hours" />
          </div>
          <div className="space-y-2">
            <Label>Learning Objective</Label>
            <Input value={form.learning_objective} onChange={e => update("learning_objective", e.target.value)} placeholder="What the intern will learn" />
          </div>
          <div className="space-y-2">
            <Label>YouTube Links (comma-separated)</Label>
            <Input value={form.youtube_links} onChange={e => update("youtube_links", e.target.value)} placeholder="https://youtube.com/..., https://youtube.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Deliverable</Label>
            <Input value={form.deliverable} onChange={e => update("deliverable", e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
