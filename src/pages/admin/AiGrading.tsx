import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseClient";
import { Brain, CheckCircle, XCircle, RefreshCw, AlertTriangle, Users, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Intern {
  id: string;
  name: string;
  email: string;
  field: string;
  intern_id: string;
}

interface Batch {
  id: string;
  batch_number: number;
  title: string;
  status: string;
}

interface AiResult {
  id: string;
  intern_id: string;
  task_id: string;
  ai_score: number;
  ai_grade: string;
  ai_feedback: string;
  ai_strengths: string;
  ai_improvements: string;
  status: string;
  created_at: string;
  intern_profiles: { name: string; email: string; field: string } | null;
  tasks: { title: string; week_number: number } | null;
}

const AdminAiGrading = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [gradeAll, setGradeAll] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<AiResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const [{ data: batchData }, { data: internData }] = await Promise.all([
        supabase.from("batches").select("id, batch_number, title, status").order("batch_number", { ascending: false }),
        supabase.from("intern_profiles").select("id, name, email, field, intern_id").eq("status", "active").order("name"),
      ]);
      setBatches(batchData || []);
      setInterns(internData || []);
    };
    fetch();
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const { data } = await supabase
        .from("ai_grading_results")
        .select("*, intern_profiles(name, email, field), tasks(title, week_number)")
        .order("created_at", { ascending: false });
      setResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleStartGrading = async () => {
    if (!selectedBatch && gradeAll) {
      toast({ title: "Select a batch", description: "Choose a batch to grade, or select specific interns.", variant: "destructive" });
      return;
    }
    if (!gradeAll && selectedInterns.length === 0) {
      toast({ title: "No interns selected", description: "Select at least one intern to grade.", variant: "destructive" });
      return;
    }

    setRunning(true);
    try {
      const body: Record<string, any> = {};
      if (selectedBatch) body.batch_id = selectedBatch;
      if (!gradeAll && selectedInterns.length > 0) body.intern_ids = selectedInterns;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-grade-submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI grading failed");

      toast({
        title: "AI Grading Complete",
        description: `${data.graded} submissions graded, ${data.skipped || 0} skipped. Review results below before applying.`,
      });
      fetchResults();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleApprove = async (result: AiResult) => {
    setApproving(result.id);
    try {
      // Apply to grades table
      const { error: gradeError } = await supabase.from("grades").upsert(
        {
          intern_id: result.intern_id,
          task_id: result.task_id,
          score: result.ai_score,
          feedback: `${result.ai_feedback}\n\nStrengths: ${result.ai_strengths}\n\nImprovements: ${result.ai_improvements}`,
          graded_at: new Date().toISOString(),
        },
        { onConflict: "intern_id,task_id" }
      );
      if (gradeError) throw gradeError;

      // Mark result as approved
      await supabase.from("ai_grading_results").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", result.id);

      setResults(prev => prev.map(r => r.id === result.id ? { ...r, status: "approved" } : r));
      toast({ title: "Approved", description: `Grade applied for ${result.intern_profiles?.name}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id: string) => {
    setApproving(id);
    try {
      await supabase.from("ai_grading_results").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
      setResults(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      toast({ title: "Rejected", description: "AI result discarded. Grade not applied." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setApproving(null);
    }
  };

  const handleApproveAll = async () => {
    const pending = results.filter(r => r.status === "pending");
    if (pending.length === 0) return;
    setRunning(true);
    try {
      for (const result of pending) {
        await supabase.from("grades").upsert(
          {
            intern_id: result.intern_id,
            task_id: result.task_id,
            score: result.ai_score,
            feedback: `${result.ai_feedback}\n\nStrengths: ${result.ai_strengths}\n\nImprovements: ${result.ai_improvements}`,
            graded_at: new Date().toISOString(),
          },
          { onConflict: "intern_id,task_id" }
        );
        await supabase.from("ai_grading_results").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", result.id);
      }
      toast({ title: "All Approved", description: `${pending.length} AI grades applied.` });
      fetchResults();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const toggleIntern = (id: string) => {
    setSelectedInterns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const pendingCount = results.filter(r => r.status === "pending").length;
  const approvedCount = results.filter(r => r.status === "approved").length;

  const scoreColor = (score: number) =>
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

  const gradeColor = (grade: string) => {
    if (grade === "A") return "bg-success/10 text-success border-success/20";
    if (grade === "B") return "bg-primary/10 text-primary border-primary/20";
    if (grade === "C") return "bg-warning/10 text-warning border-warning/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> AI Grading System
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI grades are optional and require admin approval before being applied to student records.
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>AI grading is a secondary tool.</strong> Results must be reviewed and approved by admin before being applied. Manual grading always takes precedence.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="start">
          <TabsList>
            <TabsTrigger value="start">Start AI Grading</TabsTrigger>
            <TabsTrigger value="review">
              Review Results {pendingCount > 0 && <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">{pendingCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Configure AI Grading Run
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Batch selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Select Batch</label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Choose a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map(b => (
                        <SelectItem key={b.id} value={b.id}>Batch {b.batch_number} — {b.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grade all vs selected */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Scope</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={gradeAll} onChange={() => setGradeAll(true)} className="text-primary" />
                      <span className="text-sm text-foreground">Grade all interns in selected batch</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!gradeAll} onChange={() => setGradeAll(false)} className="text-primary" />
                      <span className="text-sm text-foreground">Grade specific interns</span>
                    </label>
                  </div>
                </div>

                {/* Intern picker */}
                {!gradeAll && (
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {selectedInterns.length} selected
                      </span>
                    </div>
                    {interns.map(intern => (
                      <div key={intern.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer border-b last:border-b-0" onClick={() => toggleIntern(intern.id)}>
                        <Checkbox checked={selectedInterns.includes(intern.id)} onCheckedChange={() => toggleIntern(intern.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{intern.name}</p>
                          <p className="text-xs text-muted-foreground">{intern.field}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{intern.intern_id}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={handleStartGrading} disabled={running} className="gap-2">
                  <Brain className="h-4 w-4" />
                  {running ? "Running AI Grading..." : "Start AI Grading"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{results.length} total</Badge>
                {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pending review</Badge>}
                {approvedCount > 0 && <Badge className="bg-success/10 text-success border-success/20">{approvedCount} approved</Badge>}
              </div>
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <Button size="sm" onClick={handleApproveAll} disabled={running} className="gap-1">
                    <CheckCircle className="h-4 w-4" /> Approve All Pending ({pendingCount})
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={fetchResults} disabled={loadingResults}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loadingResults ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingResults ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No AI grading results yet. Start AI grading to generate results.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Intern</TableHead>
                          <TableHead>Task</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Feedback</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map(r => (
                          <TableRow key={r.id} className={r.status === "pending" ? "bg-warning/5" : ""}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium text-foreground">{r.intern_profiles?.name}</p>
                                <p className="text-xs text-muted-foreground">{r.intern_profiles?.field}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm text-foreground">{r.tasks?.title}</p>
                                <p className="text-xs text-muted-foreground">Week {r.tasks?.week_number}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={gradeColor(r.ai_grade)}>{r.ai_grade}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`font-bold text-lg ${scoreColor(r.ai_score)}`}>{r.ai_score}</span>
                            </TableCell>
                            <TableCell className="max-w-[250px]">
                              <p className="text-xs text-muted-foreground line-clamp-2">{r.ai_feedback}</p>
                              {r.ai_strengths && (
                                <p className="text-xs text-success mt-1 line-clamp-1">+ {r.ai_strengths}</p>
                              )}
                              {r.ai_improvements && (
                                <p className="text-xs text-warning mt-1 line-clamp-1">→ {r.ai_improvements}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {r.status === "pending" && <Badge variant="outline" className="text-warning border-warning/30">Pending Review</Badge>}
                              {r.status === "approved" && <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>}
                              {r.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                            </TableCell>
                            <TableCell>
                              {r.status === "pending" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs gap-1"
                                    onClick={() => handleApprove(r)}
                                    disabled={approving === r.id}
                                  >
                                    <CheckCircle className="h-3 w-3" /> Apply
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 px-2 text-xs gap-1"
                                    onClick={() => handleReject(r.id)}
                                    disabled={approving === r.id}
                                  >
                                    <XCircle className="h-3 w-3" /> Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
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

export default AdminAiGrading;
