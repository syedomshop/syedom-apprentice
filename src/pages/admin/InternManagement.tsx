import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const InternManagement = () => {
  const [interns, setInterns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("intern_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setInterns(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = interns.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.intern_id.includes(search) ||
      i.university.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Intern Management</h1>
            <p className="text-sm text-muted-foreground mt-1">{interns.length} registered interns</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search interns..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Intern ID</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">University</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Field</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No interns found.</td></tr>
                  ) : (
                    filtered.map((intern) => (
                      <tr key={intern.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{intern.intern_id}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">{intern.name}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{intern.university}</td>
                        <td className="px-4 py-3"><span className="portal-badge-info">{intern.field}</span></td>
                        <td className="px-4 py-3">
                          <span className={intern.status === "active" ? "portal-badge-success" : intern.status === "completed" ? "portal-badge-info" : "portal-badge-destructive"}>
                            {intern.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{intern.start_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default InternManagement;
