import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListTodo, Upload, TrendingUp, Award, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Tasks", icon: ListTodo, path: "/tasks" },
  { label: "Submit Task", icon: Upload, path: "/submit" },
  { label: "Progress", icon: TrendingUp, path: "/progress" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
  { label: "Certificate", icon: Award, path: "/certificate" },
];

const PortalLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, internProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!internProfile) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("intern_id", internProfile.id)
        .eq("is_read", false)
        .lte("scheduled_for", new Date().toISOString());
      
      // Also count client-side milestone notifications
      const start = internProfile.start_date ? new Date(internProfile.start_date) : null;
      let milestoneCount = 0;
      if (start) {
        const now = new Date();
        const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const offerDate = new Date(start);
        offerDate.setDate(offerDate.getDate() - 7);
        const daysSinceOffer = Math.floor((now.getTime() - offerDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceOffer >= 7) milestoneCount++;
        if (daysSinceStart >= 0) milestoneCount++;
        if (daysSinceStart >= 7) milestoneCount++;
        if (daysSinceStart >= 28) milestoneCount++;
        if (daysSinceStart >= 49) milestoneCount++;
        if (daysSinceStart >= 56) milestoneCount++;
      }
      setUnreadCount((count || 0) + milestoneCount);
    };
    fetchUnread().catch(() => {});
  }, [internProfile]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-8 w-8 rounded-lg object-cover mr-2.5" />
          <div>
            <h1 className="text-sm font-semibold text-sidebar-accent-foreground">Syedom Labs</h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Internship Program</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const showBadge = item.path === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {showBadge && (
                  <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default PortalLayout;
