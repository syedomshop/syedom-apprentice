import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Award, Search, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface CertificateData {
  certificate_code: string;
  student_name: string;
  field: string;
  average_score: number;
  tasks_completed: number;
  issued_at: string;
}

const VerifyCertificate = () => {
  const { code } = useParams<{ code?: string }>();
  const [searchCode, setSearchCode] = useState(code || "");
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (certCode?: string) => {
    const q = (certCode || searchCode).trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setSearched(true);

    const { data } = await supabase
      .from("certificates")
      .select("certificate_code, student_name, field, average_score, tasks_completed, issued_at")
      .eq("certificate_code", q)
      .eq("status", "issued")
      .maybeSingle();

    setCert(data);
    setLoading(false);
  };

  useEffect(() => {
    if (code) handleSearch(code);
  }, [code]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-semibold text-lg text-foreground">Syedom Labs</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-xl py-16 px-4 space-y-8">
        <div className="text-center space-y-2">
          <Award className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Verify Certificate</h1>
          <p className="text-sm text-muted-foreground">Enter a certificate code to verify its authenticity</p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="e.g. SYD-CERT-A1B2C3"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={() => handleSearch()} disabled={loading}>
            <Search className="h-4 w-4 mr-1" /> Verify
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground text-center">Checking...</p>}

        {searched && !loading && (
          cert ? (
            <Card className="border-success/30">
              <CardContent className="p-6 text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-success mx-auto" />
                <h2 className="text-lg font-bold text-foreground">Certificate Verified ✅</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> <strong className="text-foreground">{cert.student_name}</strong></p>
                  <p><span className="text-muted-foreground">Program:</span> <strong className="text-foreground">{cert.field} Intern</strong></p>
                  <p><span className="text-muted-foreground">Score:</span> <strong className="text-foreground">{cert.average_score}/100</strong></p>
                  <p><span className="text-muted-foreground">Tasks Completed:</span> <strong className="text-foreground">{cert.tasks_completed}</strong></p>
                  <p><span className="text-muted-foreground">Issued:</span> <strong className="text-foreground">{new Date(cert.issued_at).toLocaleDateString()}</strong></p>
                  <p><span className="text-muted-foreground">Code:</span> <strong className="text-foreground">{cert.certificate_code}</strong></p>
                </div>
                <p className="text-xs text-muted-foreground">This certificate was issued by Syedom Labs and is authentic.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-destructive/30">
              <CardContent className="p-6 text-center space-y-3">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-lg font-bold text-foreground">Certificate Not Found</h2>
                <p className="text-sm text-muted-foreground">No valid certificate matches this code. Please check and try again.</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
