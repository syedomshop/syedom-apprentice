import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import ResumeUploader from "@/components/ResumeUploader";

const ROLES = [
  "Web Development",
  "Python / Backend",
  "Data Science",
  "Flutter Developer",
];

const LEVELS = [
  { value: "beginner", label: "Beginner — Just getting started" },
  { value: "intermediate", label: "Intermediate — Some project experience" },
  { value: "expert", label: "Expert — Professional level" },
];

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    field: "",
    github_username: "",
    resume_text: "",
    experience_level: "",
    experience_description: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // 1. Check seat availability
      const { data: seatCheck } = await supabase.rpc("check_seat_available");
      if (!seatCheck) {
        toast({ title: "Applications closed", description: "This batch is full. You've been added to the waitlist.", variant: "destructive" });
        await supabase.from("waitlist").insert({ name: form.name, email: form.email, field: form.field });
        setLoading(false);
        return;
      }

      // 2. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: form.name },
        },
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes("rate limit") || authError.status === 429) {
          toast({ title: "Too many attempts", description: "Please wait a few minutes before trying again.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (authError.message?.toLowerCase().includes("already registered") || authError.message?.toLowerCase().includes("already been registered")) {
          toast({ title: "Account exists", description: "This email is already registered. Try signing in instead.", variant: "destructive" });
          setLoading(false);
          return;
        }
        throw authError;
      }

      if (!authData.user) throw new Error("Signup failed — please try again");

      const userId = authData.user.id;
      const internId = `SL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const startDateStr = startDate.toISOString().split("T")[0];

      // 3. Get active batch
      const { data: activeBatch } = await supabase.rpc("get_active_batch");

      // 4. Create intern profile
      const { error: profileError } = await supabase.from("intern_profiles").insert({
        user_id: userId,
        name: form.name,
        username: form.username,
        email: form.email,
        intern_id: internId,
        field: form.field,
        github_username: form.github_username || null,
        batch_id: activeBatch || null,
        start_date: startDateStr,
      });

      if (profileError) {
        if (profileError.message?.includes("duplicate") || profileError.message?.includes("unique")) {
          toast({ title: "Profile conflict", description: "This username or email is already taken. Try a different one.", variant: "destructive" });
          setLoading(false);
          return;
        }
        throw profileError;
      }

      // 5. Assign role
      await supabase.from("user_roles").insert({ user_id: userId, role: "intern" });

      // 6. Send confirmation email (fire-and-forget)
      supabase.functions.invoke("send-confirmation", {
        body: { name: form.name, email: form.email, field: form.field, intern_id: internId },
      }).catch(() => {});

      toast({
        title: "Application submitted!",
        description: `Your Intern ID is ${internId}. Check your email — your offer letter will arrive shortly.`,
      });

      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.message?.toLowerCase?.() || "";
      if (msg.includes("rate limit") || msg.includes("too many")) {
        toast({ title: "Too many attempts", description: "Please wait a few minutes before trying again.", variant: "destructive" });
      } else {
        toast({ title: "Registration failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-12 w-12 rounded-xl mx-auto mb-4 object-cover" />
          <h1 className="text-2xl font-semibold text-foreground">Syedom Labs</h1>
          <p className="text-sm text-muted-foreground mt-1">Internship Program</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Apply for Internship</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="johndoe" value={form.username} onChange={(e) => updateField("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} required minLength={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => updateField("password", e.target.value)} required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Internship Role</Label>
                <Select value={form.field} onValueChange={(v) => updateField("field", v)} required>
                  <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={form.experience_level} onValueChange={(v) => updateField("experience_level", v)}>
                  <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_desc">Tell us about your experience <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  id="experience_desc"
                  placeholder="Share your background, projects you've worked on, or what you hope to learn..."
                  value={form.experience_description}
                  onChange={(e) => updateField("experience_description", e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Username <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="github" placeholder="johndoe" value={form.github_username} onChange={(e) => updateField("github_username", e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} />
              </div>
              <ResumeUploader onExtracted={(text) => updateField("resume_text", text)} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
            <p className="text-sm text-center text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
