import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, Mail, Brain, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingOffer {
  id: string;
  name: string;
  email: string;
  field: string;
  intern_id: string;
  status: string;
  send_after: string;
  created_at: string;
}

interface Submission {
  id: string;
  ai_score: number | null;
  ai_feedback: string | null;
  status: string;
  created_at: string;
  repo_link: string;
  intern_name?: string;
  task_title?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  scheduled_for: string;
  created_at: string;
  intern_name?: string;
}

const AdminLogs = () => {
  const [offers, setOffers] = useState<PendingOffer[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [
        { data: offerData },
        { data: subData },
        { data: notifData },
      ] = await Promise.all([
        supabase.from("pending_offers").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("submissions").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      setOffers(offerData || []);
      setSubmissions(subData || []);
      setNotifications(notifData || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load logs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logs & Notifications</h1>
            <p className="text-muted-foreground text-sm mt-1">Email logs, AI grading history, and system notifications</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="emails">
          <TabsList>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" /> Email Log ({offers.length})
            </TabsTrigger>
            <TabsTrigger value="grading" className="gap-2">
              <Brain className="h-4 w-4" /> AI Grading ({submissions.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" /> Notifications ({notifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emails">
            <Card>
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
                          <TableHead>Recipient</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Field</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No email logs</TableCell>
                          </TableRow>
                        ) : (
                          offers.map((o) => (
                            <TableRow key={o.id}>
                              <TableCell className="font-medium text-foreground">{o.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{o.email}</TableCell>
                              <TableCell>{o.field}</TableCell>
                              <TableCell>
                                <Badge variant={o.status === "sent" ? "default" : "secondary"}>
                                  {o.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(o.send_after).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(o.created_at).toLocaleString()}
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
          </TabsContent>

          <TabsContent value="grading">
            <Card>
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
                          <TableHead>Repo Link</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>AI Score</TableHead>
                          <TableHead>Feedback</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No submissions</TableCell>
                          </TableRow>
                        ) : (
                          submissions.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>
                                <a href={s.repo_link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs truncate max-w-[200px] block">
                                  {s.repo_link}
                                </a>
                              </TableCell>
                              <TableCell>
                                <Badge variant={s.status === "graded" ? "default" : "secondary"}>
                                  {s.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {s.ai_score != null ? (
                                  <span className={s.ai_score >= 70 ? "text-success font-medium" : "text-destructive"}>
                                    {s.ai_score}%
                                  </span>
                                ) : "—"}
                              </TableCell>
                              <TableCell className="max-w-[300px]">
                                <p className="text-xs text-muted-foreground truncate">{s.ai_feedback || "—"}</p>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(s.created_at).toLocaleString()}
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
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
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
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Read</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notifications.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No notifications</TableCell>
                          </TableRow>
                        ) : (
                          notifications.map((n) => (
                            <TableRow key={n.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{n.title}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">{n.message}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{n.type}</Badge>
                              </TableCell>
                              <TableCell>
                                {n.is_read ? (
                                  <Badge variant="secondary">Read</Badge>
                                ) : (
                                  <Badge variant="destructive">Unread</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(n.scheduled_for).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(n.created_at).toLocaleString()}
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
