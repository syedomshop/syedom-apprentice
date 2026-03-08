import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResumeUploaderProps {
  onExtracted: (text: string) => void;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(" "));
  }

  return pages.join("\n\n");
}

async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return extractPdfText(file);
  }

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return file.text();
  }

  throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
}

const ResumeUploader = ({ onExtracted }: ResumeUploaderProps) => {
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setFileName(file.name);

    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        toast({ title: "No text found", description: "The file appears to be empty or image-based.", variant: "destructive" });
        setFileName("");
        return;
      }
      setExtractedText(text);
      onExtracted(text);
      toast({ title: "Resume parsed", description: "Text extracted successfully." });
    } catch (err: any) {
      toast({ title: "Parse error", description: err.message, variant: "destructive" });
      setFileName("");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setExtractedText("");
    setFileName("");
    onExtracted("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>Resume <span className="text-muted-foreground">(optional — PDF or TXT)</span></Label>

      {!fileName ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload your resume</p>
          <p className="text-xs text-muted-foreground/60 mt-1">PDF or TXT, max 5MB</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">{fileName}</span>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {extractedText && (
        <Textarea
          value={extractedText}
          readOnly
          rows={4}
          className="text-xs text-muted-foreground resize-none"
          placeholder="Extracted resume text..."
        />
      )}
    </div>
  );
};

export default ResumeUploader;
