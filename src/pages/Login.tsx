import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAdminEmail } from "@/lib/adminConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    console.log("[Login] Attempting sign in for:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error("[Login] Error:", error.message, error.status);
      const msg =
        error.status === 400 ? "Invalid email or password." :
        error.status === 422 ? "Email format is invalid." :
        error.message || "Login failed. Please try again.";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!data.user) {
      console.error("[Login] No user returned from signInWithPassword");
      toast({ title: "Login failed", description: "Unexpected error. Please try again.", variant: "destructive" });
      setLoading(false);
      return;
    }

    console.log("[Login] Signed in as:", data.user.email, "uid:", data.user.id);

    // Check intern profile status (admins won't have a profile — that's fine)
    const { data: profile, error: profileErr } = await supabase
      .from("intern_profiles")
      .select("status")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profileErr) {
      console.warn("[Login] Could not read profile (RLS or missing):", profileErr.message);
    }

    if (profile && profile.status !== "active") {
      await supabase.auth.signOut();
      toast({
        title: "Access denied",
        description: "Your internship has been completed or removed.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Route based on admin email list
    const userIsAdmin = isAdminEmail(data.user.email);
    console.log("[Login] User is admin:", userIsAdmin);

    if (userIsAdmin) {
      navigate("/admin/dashboard");
    } else {
      navigate("/intern/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-12 w-12 rounded-xl mx-auto mb-4 object-cover" />
          <h1 className="text-2xl font-semibold text-foreground">Syedom Labs</h1>
          <p className="text-sm text-muted-foreground mt-1">Internship Program</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>Access your internship dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="button-signin">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="text-sm text-center text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">Apply now</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
