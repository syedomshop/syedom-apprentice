import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Intern {
  id: string;
  name: string;
  email: string;
  intern_id: string;
  field: string;
  status: string;
  start_date: string | null;
}

const AdminInterns = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("intern_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setInterns(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load interns", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterns(); }, []);

  const toggleStatus = async (intern: Intern) => {
    const newStatus = intern.status === "active" ? "removed" : "active";
    const { error } = await supabase.from("intern_profiles").update({ status: newStatus }).eq("id", intern.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `${intern.name} is now ${newStatus}` });
      fetchInterns();
    }
  };

  const filtered = interns.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.field.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Intern Management</h1>
            <p className="text-muted-foreground text-sm mt-1">{interns.length} total interns</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInterns} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or field..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No interns found</TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((intern) => (
                        <TableRow key={intern.id}>
                          <TableCell className="font-medium text-foreground">{intern.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{intern.email}</TableCell>
                          <TableCell>{intern.field}</TableCell>
                          <TableCell>
                            <Badge variant={intern.status === "active" ? "default" : "destructive"}>
                              {intern.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{intern.start_date || "—"}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => toggleStatus(intern)}>
                              {intern.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
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

export default AdminInterns;
