import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Batch {
  id: string;
  batch_number: number;
  title: string;
  max_seats: number;
  start_date: string;
  end_date: string;
  status: string;
  intern_count?: number;
}

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  field: string;
  created_at: string;
}

const AdminBatches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: batchData }, { data: waitlistData }] = await Promise.all([
        supabase.from("batches").select("*").order("batch_number", { ascending: false }),
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
      ]);

      // Enrich batches with intern count
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

  useEffect(() => {
    fetchData();
  }, []);

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
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="batches">
          <TabsList>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="waitlist">
              Waitlist ({waitlist.length})
            </TabsTrigger>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No batches found
                          </TableCell>
                        </TableRow>
                      ) : (
                        batches.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-bold">#{b.batch_number}</TableCell>
                            <TableCell>{b.title}</TableCell>
                            <TableCell>
                              <Badge variant={statusColor(b.status) as any}>{b.status}</Badge>
                            </TableCell>
                            <TableCell>{b.intern_count}</TableCell>
                            <TableCell>{b.max_seats}</TableCell>
                            <TableCell className="text-xs">{b.start_date}</TableCell>
                            <TableCell className="text-xs">{b.end_date}</TableCell>
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
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Waitlist is empty
                          </TableCell>
                        </TableRow>
                      ) : (
                        waitlist.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="font-medium">{w.name}</TableCell>
                            <TableCell className="text-xs">{w.email}</TableCell>
                            <TableCell>{w.field}</TableCell>
                            <TableCell className="text-xs">
                              {new Date(w.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromWaitlist(w.id)}
                              >
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
