import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { Download, RefreshCw, Search, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, intern_profiles(name, email, field, intern_id), tasks(title, week_number, deadline)")
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

  const filtered = submissions.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.intern_profiles?.name?.toLowerCase().includes(q) ||
      s.intern_profiles?.email?.toLowerCase().includes(q) ||
      s.intern_profiles?.field?.toLowerCase().includes(q) ||
      s.tasks?.title?.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      s.timeliness === statusFilter ||
      (statusFilter === "graded" && s.ai_score != null);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: submissions.length,
    onTime: submissions.filter(s => s.timeliness !== "late").length,
    late: submissions.filter(s => s.timeliness === "late").length,
    graded: submissions.filter(s => s.ai_score != null).length,
  };

  const downloadExcel = () => {
    if (filtered.length === 0) {
      toast({ title: "No data", description: "No submissions to export.", variant: "destructive" });
      return;
    }

    const rows = filtered.map((s) => ({
      intern_id: s.intern_profiles?.intern_id || "",
      student_name: s.intern_profiles?.name || "",
      student_email: s.intern_profiles?.email || "",
      role: s.intern_profiles?.field || "",
      task_title: s.tasks?.title || "",
      week: s.tasks?.week_number || "",
      repo_link: s.repo_link || "",
      comment: s.intern_comment || "",
      timeliness: s.timeliness || "on_time",
      ai_score: s.ai_score ?? "",
      ai_feedback: s.ai_feedback || "",
      submitted_at: s.created_at ? new Date(s.created_at).toLocaleString() : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, `submissions_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Downloaded", description: `${filtered.length} submissions exported.` });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
            <p className="text-muted-foreground text-sm mt-1">Review and manage all intern assignment submissions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadExcel} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">On Time</p>
                <p className="text-xl font-bold text-success">{stats.onTime}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-xl font-bold text-destructive">{stats.late}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">AI Graded</p>
                <p className="text-xl font-bold text-foreground">{stats.graded}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, role, task..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="on_time">On Time</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="graded">AI Graded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
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
                      <TableHead>Week</TableHead>
                      <TableHead>Repo Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                          {search || statusFilter !== "all" ? "No submissions match your filters" : "No submissions yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-foreground">{s.intern_profiles?.name}</p>
                              <p className="text-xs text-muted-foreground">{s.intern_profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{s.intern_profiles?.field}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{s.tasks?.title}</TableCell>
                          <TableCell className="text-xs text-center">
                            {s.tasks?.week_number ? <Badge variant="secondary">W{s.tasks.week_number}</Badge> : "—"}
                          </TableCell>
                          <TableCell>
                            <a href={s.repo_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                              {s.repo_link?.replace("https://github.com/", "github/") || "—"}
                            </a>
                          </TableCell>
                          <TableCell>
                            <Badge variant={s.timeliness === "late" ? "destructive" : "secondary"}>
                              {s.timeliness === "late" ? "Late" : "On Time"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {s.ai_score != null ? (
                              <span className={`font-medium text-sm ${s.ai_score >= 70 ? "text-success" : s.ai_score >= 50 ? "text-warning" : "text-destructive"}`}>
                                {s.ai_score}%
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {filtered.length > 0 && (
                  <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                    Showing {filtered.length} of {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubmissions;
