import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, RefreshCw, Settings, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InternLimitsPanel from "@/components/admin/InternLimitsPanel";

interface Intern {
  id: string;
  name: string;
  email: string;
  username: string;
  intern_id: string;
  field: string;
  status: string;
  start_date: string | null;
  github_username: string | null;
  batch_id: string | null;
  avg_score?: number;
  has_certificate?: boolean;
}

const AdminInterns = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("intern_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch scores and certificate status
      const enriched = await Promise.all(
        (profiles || []).map(async (p) => {
          const { data: subs } = await supabase
            .from("submissions")
            .select("ai_score")
            .eq("intern_id", p.id)
            .not("ai_score", "is", null);

          const { data: cert } = await supabase
            .from("certificates")
            .select("id")
            .eq("intern_id", p.id)
            .maybeSingle();

          const scores = subs?.map((s) => s.ai_score || 0) || [];
          const avg = scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

          return { ...p, avg_score: avg, has_certificate: !!cert };
        })
      );

      setInterns(enriched);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load interns", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  const filtered = interns.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.intern_id.toLowerCase().includes(search.toLowerCase()) ||
      i.field.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "completed": return "secondary";
      case "removed": return "destructive";
      default: return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Intern Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {interns.length} total interns
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInterns} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="interns" className="w-full">
          <TabsList>
            <TabsTrigger value="interns" className="gap-2">
              <Users className="h-4 w-4" />
              Interns
            </TabsTrigger>
            <TabsTrigger value="limits" className="gap-2">
              <Settings className="h-4 w-4" />
              Limits & Caps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="limits" className="mt-4">
            <InternLimitsPanel />
          </TabsContent>

          <TabsContent value="interns" className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, ID, or field..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
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
                      <TableHead>Intern ID</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Avg Score</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No interns found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((intern) => (
                        <TableRow key={intern.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{intern.name}</p>
                              <p className="text-xs text-muted-foreground">{intern.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{intern.intern_id}</TableCell>
                          <TableCell>{intern.field}</TableCell>
                          <TableCell>
                            <Badge variant={statusColor(intern.status) as any}>
                              {intern.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={intern.avg_score! >= 70 ? "text-success font-medium" : "text-muted-foreground"}>
                              {intern.avg_score}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {intern.has_certificate ? (
                              <Badge variant="secondary">Issued</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {intern.start_date || "—"}
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminInterns;
