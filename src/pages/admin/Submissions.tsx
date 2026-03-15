import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, intern_profiles(name, email, field), tasks(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const downloadExcel = () => {
    if (submissions.length === 0) {
      toast({ title: "No data", description: "No submissions to export.", variant: "destructive" });
      return;
    }

    const rows = submissions.map((s) => ({
      student_name: s.intern_profiles?.name || "",
      student_email: s.intern_profiles?.email || "",
      role: s.intern_profiles?.field || "",
      task_title: s.tasks?.title || "",
      repo_link: s.repo_link || "",
      comment: s.intern_comment || "",
      submitted_at: s.created_at ? new Date(s.created_at).toLocaleString() : "",
      status: s.timeliness || "on_time",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, `submissions_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Downloaded", description: "Submissions Excel exported." });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
            <p className="text-muted-foreground text-sm mt-1">{submissions.length} total submissions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadExcel} size="sm">
              <Download className="h-4 w-4 mr-2" /> Download Excel
            </Button>
            <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
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
                      <TableHead>Student</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Repo Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No submissions yet</TableCell>
                      </TableRow>
                    ) : (
                      submissions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-foreground">{s.intern_profiles?.name}</p>
                              <p className="text-xs text-muted-foreground">{s.intern_profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{s.intern_profiles?.field}</TableCell>
                          <TableCell className="text-sm">{s.tasks?.title}</TableCell>
                          <TableCell>
                            <a href={s.repo_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                              {s.repo_link?.replace("https://github.com/", "") || "—"}
                            </a>
                          </TableCell>
                          <TableCell>
                            <Badge variant={s.timeliness === "late" ? "destructive" : "secondary"}>
                              {s.timeliness === "late" ? "Late" : "On Time"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
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

export default AdminSubmissions;
