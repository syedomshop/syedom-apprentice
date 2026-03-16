import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, Trash2, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Batch {
  id: string;
  batch_number: number;
  title: string;
  max_seats: number;
  start_date: string;
  end_date: string;
  status: string;
  tasks_generated: boolean;
  intern_count?: number;
}

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  field: string;
  created_at: string;
}

const emptyBatch = {
  batch_number: 0,
  title: "",
  max_seats: 600,
  start_date: "",
  end_date: "",
  status: "upcoming" as string,
};

const AdminBatches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [newBatch, setNewBatch] = useState(emptyBatch);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);

    try {
      const [{ data: batchData }, { data: waitlistData }] = await Promise.all([
        supabase.from("batches").select("*").order("batch_number", { ascending: false }),
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
      ]);

      const enriched = await Promise.all(
        (batchData || []).map(async (b) => {
          const { count } = await supabase
            .from("intern_profiles")
            .select("*", { count: "exact", head: true })
            .eq("batch_id", b.id);

          return { ...b, intern_count: count || 0 };
        })
      );

      setBatches(enriched);
      setWaitlist(waitlistData || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ==============================
     TASK GENERATION FOR BATCH
  ============================== */

  const assignTasksToBatchInterns = async (batchId: string) => {
    try {

      const { data: interns, error } = await supabase
        .from("intern_profiles")
        .select("id, field")
        .eq("batch_id", batchId);

      if (error) throw error;
      if (!interns || interns.length === 0) return;

      for (const intern of interns) {

        const { data: tasks } = await supabase
          .from("tasks")
          .select("id")
          .eq("field", intern.field);

        if (!tasks) continue;

        await supabase.from("intern_tasks").upsert(
          tasks.map((t) => ({
            intern_id: intern.id,
            task_id: t.id,
          })),
          { onConflict: "intern_id,task_id" }
        );
      }

      toast({
        title: "Tasks Generated",
        description: "Tasks assigned to interns in this batch",
      });

    } catch (err: any) {

      toast({
        title: "Task Generation Failed",
        description: err.message,
        variant: "destructive",
      });

    }
  };

  /* ==============================
     CREATE BATCH
  ============================== */

  const handleCreateBatch = async () => {
    setSaving(true);

    try {

      const { error } = await supabase.from("batches").insert({
        batch_number: newBatch.batch_number,
        title: newBatch.title,
        max_seats: newBatch.max_seats,
        start_date: newBatch.start_date,
        end_date: newBatch.end_date,
        status: newBatch.status,
      });

      if (error) throw error;

      toast({
        title: "Created",
        description: `Batch ${newBatch.batch_number} created successfully`
      });

      setCreateOpen(false);
      setNewBatch(emptyBatch);
      fetchData();

    } catch (err: any) {

      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });

    } finally {
      setSaving(false);
    }
  };

  /* ==============================
     UPDATE BATCH
  ============================== */

  const handleUpdateBatch = async () => {

    if (!editBatch) return;

    setSaving(true);

    try {

      const { error } = await supabase
        .from("batches")
        .update({
          title: editBatch.title,
          max_seats: editBatch.max_seats,
          start_date: editBatch.start_date,
          end_date: editBatch.end_date,
          status: editBatch.status,
        })
        .eq("id", editBatch.id);

      if (error) throw error;

      /* If admin sets batch ACTIVE → generate tasks */

      if (editBatch.status === "active") {
        await assignTasksToBatchInterns(editBatch.id);
      }

      toast({
        title: "Updated",
        description: `Batch ${editBatch.batch_number} updated`
      });

      setEditOpen(false);
      setEditBatch(null);
      fetchData();

    } catch (err: any) {

      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });

    } finally {
      setSaving(false);
    }
  };

  const removeFromWaitlist = async (id: string) => {
    const { error } = await supabase.from("waitlist").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to remove", variant: "destructive" });
    } else {
      setWaitlist((prev) => prev.filter((w) => w.id !== id));
      toast({ title: "Removed", description: "Entry removed from waitlist" });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "completed": return "secondary";
      case "upcoming": return "outline";
      default: return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Batch & Waitlist Control
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {batches.length} batches · {waitlist.length} on waitlist
            </p>
          </div>

          <div className="flex gap-2">

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Batch
                </Button>
              </DialogTrigger>

              <DialogContent>

                <DialogHeader>
                  <DialogTitle>Create New Batch</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">

                  <div className="grid grid-cols-2 gap-4">

                    <div className="space-y-2">
                      <Label>Batch Number</Label>
                      <Input
                        type="number"
                        value={newBatch.batch_number || ""}
                        onChange={(e) =>
                          setNewBatch({
                            ...newBatch,
                            batch_number: parseInt(e.target.value) || 0
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Seats</Label>
                      <Input
                        type="number"
                        value={newBatch.max_seats}
                        onChange={(e) =>
                          setNewBatch({
                            ...newBatch,
                            max_seats: parseInt(e.target.value) || 0
                          })
                        }
                      />
                    </div>

                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newBatch.title}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, title: e.target.value })
                      }
                      placeholder="Batch Title"
                    />
                  </div>

                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>

                  <Button onClick={handleCreateBatch} disabled={saving}>
                    {saving ? "Creating..." : "Create Batch"}
                  </Button>
                </DialogFooter>

              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminBatches;
