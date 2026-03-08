import { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Video, Calendar, CheckCircle, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "meeting" | "milestone" | "reminder";
  link?: string;
  link_label?: string;
  is_read: boolean;
  scheduled_for: string;
}

const ORIENTATION_LINK = "https://meet.google.com/zyr-jwmt-yyb";
const FINAL_PRESENTATION_LINK = "https://meet.google.com/urh-hrej-jti";

const Notifications = () => {
  const { internProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!internProfile) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("intern_id", internProfile.id)
        .lte("scheduled_for", new Date().toISOString())
        .order("scheduled_for", { ascending: false });

      setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();

    // Also generate client-side milestone notifications based on dates
    generateMilestoneNotifications();
  }, [internProfile]);

  const generateMilestoneNotifications = () => {
    if (!internProfile?.start_date) return;

    const start = new Date(internProfile.start_date);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const offerDate = new Date(start);
    offerDate.setDate(offerDate.getDate() - 7); // offer arrived 7 days before start
    const daysSinceOffer = Math.floor((now.getTime() - offerDate.getTime()) / (1000 * 60 * 60 * 24));

    const milestones: Notification[] = [];

    // Day 7 after offer: Welcome & orientation
    if (daysSinceOffer >= 7) {
      milestones.push({
        id: "milestone-orientation",
        title: "🎓 Orientation Session",
        message: "Welcome to Syedom Labs! Join our live orientation session to meet the team and get started with your internship journey.",
        type: "meeting",
        link: ORIENTATION_LINK,
        link_label: "Join Orientation Meeting",
        is_read: false,
        scheduled_for: new Date(offerDate.getTime() + 7 * 86400000).toISOString(),
      });
    }

    // Day 1 of internship
    if (daysSinceStart >= 0) {
      milestones.push({
        id: "milestone-start",
        title: "🚀 Internship Started!",
        message: "Your internship has officially begun. Head over to the Tasks section to see your first week's assignments. Good luck!",
        type: "milestone",
        is_read: false,
        scheduled_for: start.toISOString(),
      });
    }

    // Week 1 complete
    if (daysSinceStart >= 7) {
      milestones.push({
        id: "milestone-week1",
        title: "✅ Week 1 Complete",
        message: "Great job completing your first week! Keep up the momentum and check your Week 2 tasks.",
        type: "milestone",
        is_read: false,
        scheduled_for: new Date(start.getTime() + 7 * 86400000).toISOString(),
      });
    }

    // Week 4 midpoint
    if (daysSinceStart >= 28) {
      milestones.push({
        id: "milestone-midpoint",
        title: "📊 Midpoint Check-in",
        message: "You're halfway through! Review your progress and make sure all submissions are up to date. Remember to update your LinkedIn profile with your internship experience.",
        type: "reminder",
        is_read: false,
        scheduled_for: new Date(start.getTime() + 28 * 86400000).toISOString(),
      });
    }

    // Week 7 reminder
    if (daysSinceStart >= 49) {
      milestones.push({
        id: "milestone-week7",
        title: "⏰ One Week Left!",
        message: "Your final week is here. Make sure all tasks are submitted. Prepare your final project for the presentation session.",
        type: "reminder",
        is_read: false,
        scheduled_for: new Date(start.getTime() + 49 * 86400000).toISOString(),
      });
    }

    // Week 8 / End of batch: Final presentation
    if (daysSinceStart >= 56) {
      milestones.push({
        id: "milestone-final",
        title: "🎤 Final Project Presentation",
        message: "It's time to showcase your work! Join the final presentation session to present your project to the team and fellow interns.",
        type: "meeting",
        link: FINAL_PRESENTATION_LINK,
        link_label: "Join Presentation Meeting",
        is_read: false,
        scheduled_for: new Date(start.getTime() + 56 * 86400000).toISOString(),
      });
    }

    // Merge with DB notifications, avoiding duplicates
    setNotifications((prev) => {
      const dbIds = new Set(prev.map((n) => n.id));
      const unique = milestones.filter((m) => !dbIds.has(m.id));
      return [...unique, ...prev].sort(
        (a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime()
      );
    });
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    // Only update DB for non-milestone (server) notifications
    if (!id.startsWith("milestone-")) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }
  };

  const iconMap = {
    info: <Info className="h-5 w-5 text-primary" />,
    meeting: <Video className="h-5 w-5 text-success" />,
    milestone: <CheckCircle className="h-5 w-5 text-primary" />,
    reminder: <Calendar className="h-5 w-5 text-warning" />,
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No notifications yet. Updates will appear here as your internship progresses.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`transition-colors cursor-pointer ${!n.is_read ? "border-primary/30 bg-primary/5" : "border-border"}`}
                onClick={() => markAsRead(n.id)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="mt-0.5 flex-shrink-0">{iconMap[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{n.title}</h3>
                      {!n.is_read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    {n.link && (
                      <a
                        href={n.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video className="h-4 w-4" />
                        {n.link_label || "Join Meeting"}
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.scheduled_for).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Notifications;
