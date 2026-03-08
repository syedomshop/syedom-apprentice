import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseClient";
import { Send, Bell, Mail, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Intern {
  id: string;
  name: string;
  email: string;
  field: string;
  intern_id: string;
  status: string;
}

const AdminNotifications = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [search, setSearch] = useState("");
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Notification form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchInterns = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("intern_profiles")
        .select("id, name, email, field, intern_id, status")
        .eq("status", "active")
        .order("name");
      setInterns(data || []);
      setLoading(false);
    };
    fetchInterns();
  }, []);

  const filtered = interns.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.field.toLowerCase().includes(search.toLowerCase())
  );

  const toggleIntern = (id: string) => {
    setSelectedInterns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedInterns(filtered.map((i) => i.id));
    } else {
      setSelectedInterns([]);
    }
  };

  const handleSend = async () => {
    if (!title || !message || selectedInterns.length === 0) {
      toast({ title: "Missing fields", description: "Fill in title, message, and select at least one intern.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      // Insert portal notifications
      const notifications = selectedInterns.map((intern_id) => ({
        intern_id,
        title,
        message,
        type,
        link: link || null,
        link_label: linkLabel || null,
        scheduled_for: new Date().toISOString(),
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      // Send email if checked
      if (sendEmail) {
        const emailInterns = interns.filter((i) => selectedInterns.includes(i.id));
        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/send-admin-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              recipients: emailInterns.map((i) => ({ name: i.name, email: i.email })),
              subject: title,
              message,
            }),
          });
          if (!response.ok) {
            console.error("Email send failed:", await response.text());
            toast({ title: "Partial Success", description: "Portal notifications sent, but email delivery failed.", variant: "destructive" });
          }
        } catch (emailErr) {
          console.error("Email error:", emailErr);
          toast({ title: "Partial Success", description: "Portal notifications sent, but email delivery failed.", variant: "destructive" });
        }
      }

      toast({
        title: "Sent!",
        description: `Notification sent to ${selectedInterns.length} intern(s)${sendEmail ? " + email" : ""}.`,
      });

      // Reset form
      setTitle("");
      setMessage("");
      setLink("");
      setLinkLabel("");
      setType("info");
      setSendEmail(false);
      setSelectedInterns([]);
      setSelectAll(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Send Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Push custom notifications to the portal and/or send emails to interns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compose */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Compose Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="📢 Important Update" />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your notification message..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link (optional)</Label>
                  <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              {link && (
                <div className="space-y-2">
                  <Label>Link Label</Label>
                  <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="e.g. Join Meeting" />
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={(v) => setSendEmail(v === true)}
                />
                <Label htmlFor="sendEmail" className="text-sm cursor-pointer">
                  Also send via email (Resend)
                </Label>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>

              <Button className="w-full" onClick={handleSend} disabled={sending || selectedInterns.length === 0}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : `Send to ${selectedInterns.length} intern(s)`}
              </Button>
            </CardContent>
          </Card>

          {/* Select Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Select Recipients
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search interns..."
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
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={(v) => handleSelectAll(v === true)}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Field</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No active interns found</TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((intern) => (
                          <TableRow key={intern.id} className="cursor-pointer" onClick={() => toggleIntern(intern.id)}>
                            <TableCell>
                              <Checkbox
                                checked={selectedInterns.includes(intern.id)}
                                onCheckedChange={() => toggleIntern(intern.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground text-sm">{intern.name}</p>
                                <p className="text-xs text-muted-foreground">{intern.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{intern.field}</Badge>
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
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
