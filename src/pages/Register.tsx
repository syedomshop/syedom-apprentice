import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    field: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock register
    setTimeout(() => {
      toast({
        title: "Registration successful",
        description: "Welcome to Syedom Labs! Check your email for the offer letter.",
      });
      navigate("/intern/dashboard");
      setLoading(false);
    }, 1000);
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Syedom Labs</h1>
          <p className="text-sm text-muted-foreground mt-1">Internee Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create account</CardTitle>
            <CardDescription>Register as a new internee</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    required
                    minLength={8}
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
              <div className="space-y-2">
                <Label htmlFor="university">University / College</Label>
                <Input
                  id="university"
                  placeholder="Your university name"
                  value={form.university}
                  onChange={(e) => updateField("university", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Internship Field</Label>
                <Select value={form.field} onValueChange={(v) => updateField("field", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web-development">Web Development</SelectItem>
                    <SelectItem value="ai-ml">AI / Machine Learning</SelectItem>
                    <SelectItem value="mobile-dev">Mobile Development</SelectItem>
                    <SelectItem value="data-science">Data Science</SelectItem>
                    <SelectItem value="ui-ux">UI/UX Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Register"}
              </Button>
            </form>
            <p className="text-sm text-center text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
