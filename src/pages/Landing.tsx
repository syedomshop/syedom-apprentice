import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Brain, BarChart3, Smartphone, CheckCircle, ArrowRight, Shield } from "lucide-react";

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

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-semibold text-lg text-foreground">Syedom Labs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/verify">
              <Button variant="ghost" size="sm"><Shield className="h-4 w-4 mr-1" /> Verify Certificate</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Apply Now <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-6">
            <img src="/images/syedom-labs-logo.png" alt="" className="h-4 w-4 rounded" /> Now Accepting Applications — Batch Starting Soon
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            Launch Your Tech Career with{" "}
            <span className="text-primary">Syedom Labs</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            A 3-month intensive internship with 8 weeks of real-world projects, expert evaluation, and industry-recognized certification. Apply today and begin your journey.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="text-base px-8">Apply Now</Button>
            </Link>
            <a href="#roles">
              <Button variant="outline" size="lg" className="text-base">View Roles</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 px-4 bg-muted/40">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Available Internship Roles</h2>
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

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-4xl font-bold text-primary/20 mb-3">{s.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Why Syedom Labs?</h2>
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
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Start?</h2>
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
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link to="/verify" className="hover:text-foreground transition-colors">Verify Certificate</Link>
          </div>
          <p>© {new Date().getFullYear()} Syedom Labs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
