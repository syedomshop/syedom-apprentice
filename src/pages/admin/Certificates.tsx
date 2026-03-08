import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CertificateRow {
  id: string;
  student_name: string;
  field: string;
  batch_number: number | null;
  certificate_code: string;
  average_score: number;
  tasks_completed: number;
  payment_status: string;
  status: string;
  issued_at: string;
}

const AdminCertificates = () => {
  const [certs, setCerts] = useState<CertificateRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("issued_at", { ascending: false });

      if (error) throw error;
      setCerts(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load certificates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const togglePayment = async (id: string, current: string) => {
    const newStatus = current === "paid" ? "unpaid" : "paid";
    const { error } = await supabase
      .from("certificates")
      .update({ payment_status: newStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update payment", variant: "destructive" });
    } else {
      setCerts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, payment_status: newStatus } : c))
      );
      toast({ title: "Updated", description: `Payment marked as ${newStatus}` });
    }
  };

  const filtered = certs.filter(
    (c) =>
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      c.certificate_code.toLowerCase().includes(search.toLowerCase()) ||
      c.field.toLowerCase().includes(search.toLowerCase())
  );

  const paidCount = certs.filter((c) => c.payment_status === "paid").length;
  const unpaidCount = certs.length - paidCount;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Certificate Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {certs.length} certificates · {paidCount} paid · {unpaidCount} unpaid
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCerts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or field..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No certificates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium">{cert.student_name}</TableCell>
                          <TableCell className="font-mono text-xs">{cert.certificate_code}</TableCell>
                          <TableCell>{cert.field}</TableCell>
                          <TableCell>{cert.batch_number || "—"}</TableCell>
                          <TableCell>{cert.average_score}%</TableCell>
                          <TableCell>{cert.tasks_completed}</TableCell>
                          <TableCell>
                            <Badge
                              variant={cert.payment_status === "paid" ? "default" : "destructive"}
                            >
                              {cert.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cert.status === "issued" ? "secondary" : "destructive"}>
                              {cert.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePayment(cert.id, cert.payment_status)}
                            >
                              {cert.payment_status === "paid" ? "Mark Unpaid" : "Mark Paid"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCertificates;
