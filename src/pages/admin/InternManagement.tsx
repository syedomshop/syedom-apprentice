import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const interns = [
  { id: "SYD-001", name: "Ali Hassan", email: "ali@example.com", university: "FAST NUCES", field: "Web Development", tasks: 12, avgScore: 8.5, startDate: "2026-01-15" },
  { id: "SYD-002", name: "Sara Khan", email: "sara@example.com", university: "LUMS", field: "AI / ML", tasks: 10, avgScore: 9.0, startDate: "2026-01-20" },
  { id: "SYD-003", name: "Usman Ahmed", email: "usman@example.com", university: "NUST", field: "Web Development", tasks: 8, avgScore: 7.2, startDate: "2026-02-01" },
  { id: "SYD-004", name: "Fatima Noor", email: "fatima@example.com", university: "COMSATS", field: "Data Science", tasks: 15, avgScore: 9.5, startDate: "2026-01-10" },
  { id: "SYD-005", name: "Bilal Raza", email: "bilal@example.com", university: "IBA Karachi", field: "Mobile Development", tasks: 6, avgScore: 7.8, startDate: "2026-02-15" },
];

const InternManagement = () => {
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
            <Input placeholder="Search interns..." className="pl-9" />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">ID</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">University</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Field</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Tasks</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Avg Score</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern) => (
                    <tr key={intern.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{intern.id}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-foreground">{intern.name}</span>
                          <p className="text-xs text-muted-foreground">{intern.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{intern.university}</td>
                      <td className="px-4 py-3"><span className="portal-badge-info">{intern.field}</span></td>
                      <td className="px-4 py-3 text-foreground">{intern.tasks}</td>
                      <td className="px-4 py-3">
                        <span className={intern.avgScore >= 8 ? "text-success font-medium" : "text-warning font-medium"}>
                          {intern.avgScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{intern.startDate}</td>
                    </tr>
                  ))}
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
