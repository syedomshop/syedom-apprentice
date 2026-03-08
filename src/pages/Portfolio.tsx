import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Github, Rocket, User, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const Portfolio = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: prof } = await supabase
        .from("intern_profiles")
        .select("id, name, username, field, status, intern_id, start_date")
        .eq("username", username)
        .maybeSingle();

      if (!prof) { setLoading(false); return; }
      setProfile(prof);

      const [{ data: subs }, { data: cert }] = await Promise.all([
        supabase.from("submissions").select("repo_link, ai_score, ai_feedback, created_at, tasks(title, week_number)").eq("intern_id", prof.id).not("ai_score", "is", null).order("created_at", { ascending: true }),
        supabase.from("certificates").select("certificate_code, average_score, issued_at").eq("intern_id", prof.id).eq("status", "issued").maybeSingle(),
      ]);

      setSubmissions(subs || []);
      setCertificate(cert);
      setLoading(false);
    };
    fetchData();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <User className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-semibold text-foreground">Intern Not Found</h1>
        <Link to="/" className="text-primary hover:underline text-sm">← Back to home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-foreground">Syedom Labs</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl py-12 px-4 space-y-8">
        {/* Profile Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="text-muted-foreground">{profile.field} Intern · @{profile.username}</p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant={profile.status === "active" ? "default" : "secondary"}>
              {profile.status === "active" ? "Active" : profile.status === "completed" ? "Completed" : profile.status}
            </Badge>
            <Badge variant="outline">ID: {profile.intern_id}</Badge>
          </div>
        </div>

        {/* Certificate */}
        {certificate && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-6 flex items-center gap-4">
              <Award className="h-10 w-10 text-success flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Certified — {certificate.average_score}/100</h3>
                <p className="text-sm text-muted-foreground">Issued on {new Date(certificate.issued_at).toLocaleDateString()}</p>
              </div>
              <Link to={`/verify/${certificate.certificate_code}`} className="text-primary hover:underline text-sm">
                Verify →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Projects ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="portal-badge-info text-xs">Week {sub.tasks?.week_number}</span>
                        <h3 className="text-sm font-medium text-foreground">{sub.tasks?.title}</h3>
                      </div>
                      {sub.repo_link && (
                        <a href={sub.repo_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Github className="h-3 w-3" /> {sub.repo_link.replace("https://github.com/", "")}
                        </a>
                      )}
                    </div>
                    <span className={`text-lg font-semibold ${sub.ai_score >= 70 ? "text-success" : sub.ai_score >= 50 ? "text-warning" : "text-destructive"}`}>
                      {sub.ai_score}<span className="text-xs text-muted-foreground">/100</span>
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
