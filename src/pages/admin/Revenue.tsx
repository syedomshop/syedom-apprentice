import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, DollarSign, Download, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CERT_PRICE_PKR = 500;
const PKR_TO_USD = 0.0036;

interface CertPayment {
  id: string;
  student_name: string;
  field: string;
  batch_number: number | null;
  payment_status: string;
  issued_at: string;
}

const AdminRevenue = () => {
  const [certs, setCerts] = useState<CertPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, student_name, field, batch_number, payment_status, issued_at")
        .order("issued_at", { ascending: false });

      if (error) throw error;
      setCerts(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load revenue data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRevenue(); }, []);

  const paid = certs.filter((c) => c.payment_status === "paid");
  const unpaid = certs.filter((c) => c.payment_status === "unpaid");
  const totalPKR = paid.length * CERT_PRICE_PKR;
  const totalUSD = totalPKR * PKR_TO_USD;
  const pendingPKR = unpaid.length * CERT_PRICE_PKR;

  const batchRevenue = paid.reduce((acc, c) => {
    const key = c.batch_number ? `Batch ${c.batch_number}` : "Unknown";
    acc[key] = (acc[key] || 0) + CERT_PRICE_PKR;
    return acc;
  }, {} as Record<string, number>);

  const exportCSV = () => {
    const headers = ["Name", "Field", "Batch", "Payment Status", "Issued At", "Amount (PKR)"];
    const rows = certs.map((c) => [
      c.student_name,
      c.field,
      c.batch_number || "N/A",
      c.payment_status,
      c.issued_at ? new Date(c.issued_at).toLocaleDateString() : "N/A",
      c.payment_status === "paid" ? CERT_PRICE_PKR : 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Revenue CSV has been downloaded." });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Revenue & Payments</h1>
            <p className="text-muted-foreground text-sm mt-1">Certificate payment tracking</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchRevenue} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue (PKR)</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">₨ {totalPKR.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue (USD)</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">$ {totalUSD.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">₨ {pendingPKR.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{unpaid.length} unpaid certificates</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue by Batch</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {Object.entries(batchRevenue).length === 0 ? (
                <p className="text-sm text-muted-foreground">No revenue yet</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(batchRevenue).map(([batch, amount]) => (
                    <div key={batch} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{batch}</span>
                      <span className="font-medium text-foreground">₨ {amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Issued</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No certificates found</TableCell>
                      </TableRow>
                    ) : (
                      certs.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-foreground">{c.student_name}</TableCell>
                          <TableCell>{c.field}</TableCell>
                          <TableCell>{c.batch_number ? `Batch ${c.batch_number}` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={c.payment_status === "paid" ? "default" : "destructive"}>
                              {c.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>₨ {CERT_PRICE_PKR}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.issued_at ? new Date(c.issued_at).toLocaleDateString() : "—"}
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

export default AdminRevenue;
