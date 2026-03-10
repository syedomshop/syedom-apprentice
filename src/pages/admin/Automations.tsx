import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Mail, Clock, Brain, FileText, Bell, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Automation {
  id: string;
  label: string;
  description: string;
  icon: typeof Bot;
  category: "ai" | "email" | "scheduling" | "enrollment";
  enabled: boolean;
}

const defaultAutomations: Automation[] = [
  {
    id: "ai_grading",
    label: "Submission Grading",
    description: "Evaluate and grade submissions automatically and assign scores",
    icon: Brain,
    category: "ai",
    enabled: true,
  },
  {
    id: "task_generation",
    label: "Task Generation",
    description: "Generate weekly tasks for each role when a new batch starts",
    icon: Bot,
    category: "ai",
    enabled: true,
  },
  {
    id: "offer_letters",
    label: "Offer Letter Emails",
    description: "Send delayed offer letter emails to new interns via Resend",
    icon: Mail,
    category: "email",
    enabled: true,
  },
  {
    id: "confirmation_emails",
    label: "Confirmation Emails",
    description: "Send application confirmation emails on registration",
    icon: Mail,
    category: "email",
    enabled: true,
  },
  {
    id: "certificate_emails",
    label: "Certificate Emails",
    description: "Send certificate emails when payment is confirmed",
    icon: FileText,
    category: "email",
    enabled: true,
  },
  {
    id: "milestone_notifications",
    label: "Milestone Notifications",
    description: "Auto-schedule portal notifications for orientation, midpoint, and final presentation",
    icon: Bell,
    category: "scheduling",
    enabled: true,
  },
  {
    id: "batch_cleanup",
    label: "Nightly Batch Cleanup",
    description: "Auto-complete interns past 90 days and close expired batches",
    icon: Clock,
    category: "scheduling",
    enabled: true,
  },
  {
    id: "pending_offers_cron",
    label: "Pending Offers Processor",
    description: "Process queued offer letters every 15 minutes via pg_cron",
    icon: Clock,
    category: "scheduling",
    enabled: true,
  },
  {
    id: "auto_close_applications",
    label: "Auto-Close Applications",
    description: "Automatically close new applications when a batch becomes active. New applicants are added to the waitlist.",
    icon: ShieldCheck,
    category: "enrollment",
    enabled: true,
  },
];

const AdminAutomations = () => {
  const [automations, setAutomations] = useState<Automation[]>(defaultAutomations);
  const { toast } = useToast();

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = !a.enabled;
          toast({
            title: next ? "Enabled" : "Disabled",
            description: `${a.label} has been ${next ? "enabled" : "disabled"}.`,
          });
          return { ...a, enabled: next };
        }
        return a;
      })
    );
  };

  const categories = [
    { key: "ai" as const, label: "Core Operations", icon: Brain },
    { key: "email" as const, label: "Email Automations", icon: Mail },
    { key: "scheduling" as const, label: "Scheduled Jobs", icon: Clock },
    { key: "enrollment" as const, label: "Enrollment Controls", icon: ShieldCheck },
  ];

  const enabledCount = automations.filter((a) => a.enabled).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automation Controls</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {enabledCount}/{automations.length} automations active — toggle to enable/disable specific operations
          </p>
        </div>

        {categories.map((cat) => {
          const items = automations.filter((a) => a.category === cat.key);
          if (items.length === 0) return null;
          return (
            <Card key={cat.key}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <cat.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{cat.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((auto, idx) => (
                  <div key={auto.id}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <auto.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-foreground">{auto.label}</Label>
                            <Badge variant={auto.enabled ? "default" : "secondary"} className="text-[10px]">
                              {auto.enabled ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{auto.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={auto.enabled}
                        onCheckedChange={() => toggleAutomation(auto.id)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminAutomations;
