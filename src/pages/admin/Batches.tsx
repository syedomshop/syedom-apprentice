import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      toast({ title: "Created", description: `Batch ${newBatch.batch_number} created successfully` });
      setCreateOpen(false);
      setNewBatch(emptyBatch);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBatch = async () => {
    if (!editBatch) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("batches").update({
        title: editBatch.title,
        max_seats: editBatch.max_seats,
        start_date: editBatch.start_date,
        end_date: editBatch.end_date,
        status: editBatch.status,
      }).eq("id", editBatch.id);
      if (error) throw error;
      toast({ title: "Updated", description: `Batch ${editBatch.batch_number} updated` });
      setEditOpen(false);
      setEditBatch(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
            <h1 className="text-2xl font-bold text-foreground">Batch & Waitlist Control</h1>
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
                      <Input type="number" value={newBatch.batch_number || ""} onChange={(e) => setNewBatch({ ...newBatch, batch_number: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Seats</Label>
                      <Input type="number" value={newBatch.max_seats} onChange={(e) => setNewBatch({ ...newBatch, max_seats: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newBatch.title} onChange={(e) => setNewBatch({ ...newBatch, title: e.target.value })} placeholder="e.g. Batch 2 — Summer 2026" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={newBatch.start_date} onChange={(e) => setNewBatch({ ...newBatch, start_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={newBatch.end_date} onChange={(e) => setNewBatch({ ...newBatch, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newBatch.status} onValueChange={(v) => setNewBatch({ ...newBatch, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateBatch} disabled={saving}>{saving ? "Creating..." : "Create Batch"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Batch #{editBatch?.batch_number}</DialogTitle>
            </DialogHeader>
            {editBatch && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editBatch.title} onChange={(e) => setEditBatch({ ...editBatch, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Seats</Label>
                  <Input type="number" value={editBatch.max_seats} onChange={(e) => setEditBatch({ ...editBatch, max_seats: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={editBatch.start_date} onChange={(e) => setEditBatch({ ...editBatch, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={editBatch.end_date} onChange={(e) => setEditBatch({ ...editBatch, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editBatch.status} onValueChange={(v) => setEditBatch({ ...editBatch, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateBatch} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="batches">
          <TabsList>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist ({waitlist.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="batches">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Interns</TableHead>
                        <TableHead>Max Seats</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No batches found</TableCell>
                        </TableRow>
                      ) : (
                        batches.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-bold">#{b.batch_number}</TableCell>
                            <TableCell>{b.title}</TableCell>
                            <TableCell><Badge variant={statusColor(b.status) as any}>{b.status}</Badge></TableCell>
                            <TableCell>
                              <span className={b.intern_count! >= b.max_seats ? "text-destructive font-medium" : "text-foreground"}>
                                {b.intern_count}/{b.max_seats}
                              </span>
                            </TableCell>
                            <TableCell>{b.max_seats}</TableCell>
                            <TableCell className="text-xs">{b.start_date}</TableCell>
                            <TableCell className="text-xs">{b.end_date}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => { setEditBatch(b); setEditOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waitlist">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitlist.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Waitlist is empty</TableCell>
                        </TableRow>
                      ) : (
                        waitlist.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="font-medium">{w.name}</TableCell>
                            <TableCell className="text-xs">{w.email}</TableCell>
                            <TableCell>{w.field}</TableCell>
                            <TableCell className="text-xs">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => removeFromWaitlist(w.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminBatches;
