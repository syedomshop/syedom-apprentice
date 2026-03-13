import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Brain, BarChart3, Smartphone, CheckCircle, ArrowRight, Shield, Trophy, Users, MessageCircle, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const WHATSAPP_LINK = "https://chat.whatsapp.com/Lc3xd1RHwCQC9ZKXCBG6Xu?mode=gi_t";

const roles = [
  { icon: Code, title: "Web Development Intern", desc: "Build modern web applications with React, Node.js, and more" },
  { icon: Brain, title: "Python / Backend Intern", desc: "Master backend systems, APIs, and server-side programming" },
  { icon: BarChart3, title: "Data Science Intern", desc: "Analyze data, build ML models, and derive insights" },
  { icon: Smartphone, title: "Flutter Developer Intern", desc: "Create cross-platform mobile apps with Flutter & Dart" },
];

const steps = [
  { step: "01", title: "Apply Online", desc: "Fill out the application form with your details" },
  { step: "02", title: "Get Your Offer", desc: "Receive your official offer letter via email" },
  { step: "03", title: "Complete Tasks", desc: "Work through 8 weeks of real-world projects" },
  { step: "04", title: "Get Certified", desc: "Earn your verifiable certificate upon completion" },
];

interface LeaderboardEntry {
  name: string;
  field: string;
  avg_score: number;
  completed: number;
}

interface BatchStats {
  enrolled: number;
  active: number;
  completed: number;
  batches: number;
}

const Landing = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<BatchStats>({ enrolled: 0, active: 0, completed: 0, batches: 0 });
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leaderboard — top 10 by average score
        const { data: subs } = await supabase
          .from("submissions")
          .select("intern_id, ai_score, intern_profiles(name, field)")
          .not("ai_score", "is", null)
          .order("ai_score", { ascending: false });

        if (subs && subs.length > 0) {
          const internMap = new Map<string, { name: string; field: string; scores: number[]; completed: number }>();
          subs.forEach((s: any) => {
            const id = s.intern_id;
            if (!internMap.has(id)) {
              internMap.set(id, {
                name: s.intern_profiles?.name || "Unknown",
                field: s.intern_profiles?.field || "",
                scores: [],
                completed: 0,
              });
            }
            const entry = internMap.get(id)!;
            entry.scores.push(s.ai_score);
            entry.completed++;
          });
          const sorted = Array.from(internMap.values())
            .map((e) => ({ ...e, avg_score: Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length) }))
            .sort((a, b) => b.avg_score - a.avg_score)
            .slice(0, 10);
          setLeaderboard(sorted);
        }

        // Fetch batch stats
        const [{ count: enrolled }, { count: active }, { count: completedCount }, { count: batchCount }] = await Promise.all([
          supabase.from("intern_profiles").select("*", { count: "exact", head: true }),
          supabase.from("intern_profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("intern_profiles").select("*", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("batches").select("*", { count: "exact", head: true }),
        ]);
        setStats({
          enrolled: enrolled || 0,
          active: active || 0,
          completed: completedCount || 0,
          batches: batchCount || 0,
        });
      } catch (err) {
        console.error("Landing data fetch:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-semibold text-lg text-foreground">Syedom Labs</span>
          </div>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/verify">
              <Button variant="ghost" size="sm"><Shield className="h-4 w-4 mr-1" /> Verify Certificate</Button>
            </Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                <MessageCircle className="h-4 w-4 mr-1" /> Join WhatsApp
              </Button>
            </a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Apply Now <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>
          {/* Mobile hamburger */}
          <button className="md:hidden text-foreground" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {/* Mobile nav dropdown */}
        {mobileNav && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2">
            <Link to="/verify" className="block" onClick={() => setMobileNav(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start"><Shield className="h-4 w-4 mr-2" /> Verify Certificate</Button>
            </Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="ghost" size="sm" className="w-full justify-start text-green-600">
                <MessageCircle className="h-4 w-4 mr-2" /> Join WhatsApp Group
              </Button>
            </a>
            <Link to="/login" className="block" onClick={() => setMobileNav(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">Sign In</Button>
            </Link>
            <Link to="/register" className="block" onClick={() => setMobileNav(false)}>
              <Button size="sm" className="w-full">Apply Now</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-6">
            <img src="/images/syedom-labs-logo.png" alt="" className="h-4 w-4 rounded" /> Now Accepting Applications — Batch Starting Soon
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            Launch Your Tech Career with{" "}
            <span className="text-primary">Syedom Labs</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            A 3-month intensive internship with 8 weeks of real-world projects, expert evaluation, and industry-recognized certification. Apply today and begin your journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="text-base px-8 w-full sm:w-auto">Apply Now</Button>
            </Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="text-base gap-2 w-full sm:w-auto">
                <MessageCircle className="h-5 w-5 text-green-600" /> Join WhatsApp Group
              </Button>
            </a>
          </div>
        </div>
      </section>



      {/* Roles */}
      <section id="roles" className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Available Internship Roles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <Card key={role.title} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <role.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{role.title}</h3>
                    <p className="text-sm text-muted-foreground">{role.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Top Performers</h2>
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 md:p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold flex-shrink-0",
                    idx === 0 ? "bg-yellow-500/20 text-yellow-600" :
                    idx === 1 ? "bg-gray-300/30 text-gray-500" :
                    idx === 2 ? "bg-orange-400/20 text-orange-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.field}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary">{entry.avg_score}/100</p>
                    <p className="text-xs text-muted-foreground">{entry.completed} tasks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary/20 mb-3">{s.step}</div>
                <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">{s.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">Why Syedom Labs?</h2>
          <div className="space-y-4">
            {[
              "Expert project evaluation with detailed feedback from our team",
              "8 weeks of structured, real-world tasks with tutorials",
              "Verifiable completion certificate with unique code",
              "Public portfolio page to showcase your work",
              "GitHub-based submissions — no file uploads needed",
              "3-month structured batch system with cohort-based learning",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span className="text-sm md:text-base text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-12 px-4 bg-green-50 dark:bg-green-950/20 border-y border-green-200 dark:border-green-900/30">
        <div className="container mx-auto text-center max-w-2xl">
          <MessageCircle className="h-10 w-10 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Join Our WhatsApp Community</h2>
          <p className="text-sm text-muted-foreground mb-6">Get instant updates, connect with fellow interns, and stay informed about new batches.</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white text-base gap-2">
              <MessageCircle className="h-5 w-5" /> Join WhatsApp Group
            </Button>
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8">Limited seats available. Apply now and begin your journey in tech.</p>
          <Link to="/register">
            <Button size="lg" className="text-base px-8">Apply for Internship</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-6 w-6 rounded" />
            <span className="font-medium text-foreground">Syedom Labs</span>
          </div>
          <div className="flex items-center justify-center gap-4 mb-2 flex-wrap">
            <Link to="/verify" className="hover:text-foreground transition-colors">Verify Certificate</Link>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">WhatsApp Group</a>
          </div>
          <p>© {new Date().getFullYear()} Syedom Labs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default Landing;
