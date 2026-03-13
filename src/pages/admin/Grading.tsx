import { useState, useRef } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ParsedGrade {
  student_email: string;
  task_title: string;
  score: number;
  feedback: string;
  valid: boolean;
  error?: string;
}

const COLUMN_MAP: Record<string, string> = {
  student_email: "student_email",
  email: "student_email",
  task_title: "task_title",
  task: "task_title",
  score: "score",
  feedback: "feedback",
  comment: "feedback",
};

const AdminGrading = () => {
  const [parsed, setParsed] = useState<ParsedGrade[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) {
          toast({ title: "Empty file", variant: "destructive" });
          return;
        }

        const colMapping: Record<string, string> = {};
        Object.keys(raw[0]).forEach((key) => {
          const lower = key.toLowerCase().trim();
          if (COLUMN_MAP[lower]) colMapping[key] = COLUMN_MAP[lower];
        });

        const grades: ParsedGrade[] = raw.map((row) => {
          const mapped: any = {};
          Object.entries(colMapping).forEach(([orig, target]) => {
            mapped[target] = String(row[orig] || "").trim();
          });

          const score = parseInt(mapped.score);
          const errors: string[] = [];
          if (!mapped.student_email) errors.push("Missing email");
          if (!mapped.task_title) errors.push("Missing task title");
          if (isNaN(score) || score < 0 || score > 100) errors.push("Invalid score (0-100)");

          return {
            student_email: mapped.student_email || "",
            task_title: mapped.task_title || "",
            score: isNaN(score) ? 0 : score,
            feedback: mapped.feedback || "",
            valid: errors.length === 0,
            error: errors.length > 0 ? errors.join(", ") : undefined,
          };
        });

        setParsed(grades);
        const validCount = grades.filter((g) => g.valid).length;
        toast({ title: `Parsed ${grades.length} rows`, description: `${validCount} valid` });
      } catch (err: any) {
        toast({ title: "Parse error", description: err.message, variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    const valid = parsed.filter((g) => g.valid);
    if (valid.length === 0) {
      toast({ title: "No valid grades", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Fetch intern profiles and tasks for matching
      const { data: profiles } = await supabase.from("intern_profiles").select("id, email");
      const { data: tasks } = await supabase.from("tasks").select("id, title");

      const profileMap = new Map((profiles || []).map(p => [p.email.toLowerCase(), p.id]));
      const taskMap = new Map((tasks || []).map(t => [t.title.toLowerCase(), t.id]));

      let successCount = 0;
      let failCount = 0;

      for (const grade of valid) {
        const internId = profileMap.get(grade.student_email.toLowerCase());
        const taskId = taskMap.get(grade.task_title.toLowerCase());

        if (!internId || !taskId) {
          failCount++;
          continue;
        }

        // Upsert grade (update if exists)
        const { error } = await supabase.from("grades").upsert(
          {
            intern_id: internId,
            task_id: taskId,
            score: grade.score,
            feedback: grade.feedback,
            graded_at: new Date().toISOString(),
          },
          { onConflict: "intern_id,task_id" }
        );

        if (error) {
          console.error("Grade upsert error:", error);
          failCount++;
        } else {
          successCount++;
        }
      }

      toast({
        title: "Grading complete",
        description: `${successCount} grades uploaded${failCount > 0 ? `, ${failCount} failed (no matching intern/task)` : ""}`,
      });

      setParsed([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const validCount = parsed.filter((g) => g.valid).length;
  const invalidCount = parsed.length - validCount;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload Grades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload a graded Excel file to assign scores to interns
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Grading Excel Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Required columns: <strong>student_email</strong>, <strong>task_title</strong>, <strong>score</strong>, <strong>feedback</strong>
            </p>

            <div className="space-y-2">
              <Label>Excel File</Label>
              <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="max-w-sm" />
            </div>

            {parsed.length > 0 && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary">{parsed.length} rows</Badge>
                  <Badge className="bg-success/10 text-success border-success/20">{validCount} valid</Badge>
                  {invalidCount > 0 && <Badge variant="destructive">{invalidCount} invalid</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => { setParsed([]); setFileName(""); }}>
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>

                <div className="overflow-x-auto max-h-80 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsed.map((g, i) => (
                        <TableRow key={i} className={g.valid ? "" : "bg-destructive/5"}>
                          <TableCell className="text-xs">{i + 1}</TableCell>
                          <TableCell>
                            {g.valid ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-destructive">
                                <AlertTriangle className="h-3 w-3" /> {g.error}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{g.student_email}</TableCell>
                          <TableCell className="text-xs">{g.task_title}</TableCell>
                          <TableCell className="text-xs font-medium">{g.score}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{g.feedback}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button onClick={handleUpload} disabled={uploading || validCount === 0}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : `Upload ${validCount} Grades`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminGrading;
