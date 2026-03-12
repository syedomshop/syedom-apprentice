import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ParsedTask {
  role: string;
  week: number;
  title: string;
  description: string;
  expected_output: string;
  valid: boolean;
  error?: string;
}

interface Props {
  batches: { id: string; batch_number: number; title: string }[];
  onUploaded: () => void;
}

const COLUMN_MAP: Record<string, string> = {
  role: "role",
  field: "role",
  week: "week",
  week_number: "week",
  "week number": "week",
  title: "title",
  "task title": "title",
  "task name": "title",
  description: "description",
  "task description": "description",
  "expected output": "expected_output",
  expected_output: "expected_output",
  deliverable: "expected_output",
};

const ExcelTaskUpload = ({ batches, onUploaded }: Props) => {
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [batchId, setBatchId] = useState("");
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
          toast({ title: "Empty file", description: "No rows found.", variant: "destructive" });
          return;
        }

        const colMapping: Record<string, string> = {};
        Object.keys(raw[0]).forEach((originalKey) => {
          const lower = originalKey.toLowerCase().trim();
          if (COLUMN_MAP[lower]) colMapping[originalKey] = COLUMN_MAP[lower];
        });

        const tasks: ParsedTask[] = raw.map((row) => {
          const mapped: any = {};
          Object.entries(colMapping).forEach(([orig, target]) => {
            mapped[target] = String(row[orig] || "").trim();
          });

          const week = parseInt(mapped.week);
          const errors: string[] = [];
          if (!mapped.role) errors.push("Missing role/field");
          if (!mapped.title) errors.push("Missing title");
          if (isNaN(week) || week < 1 || week > 8) errors.push("Invalid week (1-8)");

          return {
            role: mapped.role || "",
            week: isNaN(week) ? 0 : week,
            title: mapped.title || "",
            description: mapped.description || "",
            expected_output: mapped.expected_output || "",
            valid: errors.length === 0,
            error: errors.length > 0 ? errors.join(", ") : undefined,
          };
        });

        setParsedTasks(tasks);
        const validCount = tasks.filter((t) => t.valid).length;
        toast({ title: `Parsed ${tasks.length} rows`, description: `${validCount} valid, ${tasks.length - validCount} invalid` });
      } catch (err: any) {
        toast({ title: "Parse error", description: err.message, variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    const valid = parsedTasks.filter((t) => t.valid);
    if (valid.length === 0) {
      toast({ title: "No valid tasks", variant: "destructive" });
      return;
    }
    if (!batchId) {
      toast({ title: "Select a batch", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const rows = valid.map((t) => ({
        title: t.title,
        description: t.description,
        field: t.role,
        week_number: t.week,
        batch_id: batchId,
        difficulty: t.week <= 3 ? "Beginner" : t.week <= 6 ? "Intermediate" : "Advanced",
        deliverable: t.expected_output || null,
      }));

      const { error } = await supabase.from("tasks").insert(rows);
      if (error) throw error;

      toast({ title: "Tasks uploaded!", description: `${rows.length} tasks inserted.` });
      setParsedTasks([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const validCount = parsedTasks.filter((t) => t.valid).length;
  const invalidCount = parsedTasks.length - validCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Tasks via Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Columns: <strong>Role</strong>, <strong>Week</strong>, <strong>Task Title</strong>, <strong>Task Description</strong>, <strong>Expected Output</strong>
        </p>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-2">
            <Label>Excel File</Label>
            <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="max-w-xs" />
          </div>
          <div className="space-y-2">
            <Label>Target Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select batch" /></SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>Batch {b.batch_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {parsedTasks.length > 0 && (
          <>
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary">{parsedTasks.length} rows</Badge>
              <Badge className="bg-success/10 text-success border-success/20">{validCount} valid</Badge>
              {invalidCount > 0 && <Badge variant="destructive">{invalidCount} invalid</Badge>}
              <Button variant="ghost" size="sm" onClick={() => { setParsedTasks([]); setFileName(""); }}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>

            <div className="overflow-x-auto max-h-80 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedTasks.map((t, i) => (
                    <TableRow key={i} className={t.valid ? "" : "bg-destructive/5"}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell>
                        {t.valid ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" /> {t.error}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{t.role}</TableCell>
                      <TableCell className="text-xs">{t.week || "—"}</TableCell>
                      <TableCell className="text-xs font-medium">{t.title}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{t.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button onClick={handleUpload} disabled={uploading || validCount === 0 || !batchId} className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : `Upload ${validCount} Tasks`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelTaskUpload;
