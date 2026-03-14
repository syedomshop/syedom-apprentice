import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, FileText, Upload, LogOut, Bell, Layers, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const adminNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Interns", icon: Users, path: "/admin/interns" },
  { label: "Batches", icon: Layers, path: "/admin/batches" },
  { label: "Tasks", icon: BookOpen, path: "/admin/tasks" },
  { label: "Submissions", icon: FileText, path: "/admin/submissions" },
  { label: "Grading", icon: Upload, path: "/admin/grading" },
  { label: "AI Grading", icon: Brain, path: "/admin/ai-grading" },
  { label: "Notifications", icon: Bell, path: "/admin/notifications" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-7 w-7 rounded-lg object-cover mr-2" />
          <div>
            <h1 className="text-xs font-semibold text-sidebar-accent-foreground">Admin Panel</h1>
            <p className="text-[9px] text-sidebar-foreground/60 uppercase tracking-wider">Syedom Labs</p>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {adminNavItems.map((item) => {
            const isActive = item.path === "/admin/dashboard"
              ? location.pathname === "/admin/dashboard"
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <span className="text-sm font-semibold text-foreground">Admin Panel</span>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 pt-[72px] md:pt-8 pb-24 md:pb-8">{children}</div>
      </main>

      {/* Mobile bottom nav — show first 5 items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-14 px-1">
        {adminNavItems.slice(0, 5).map((item) => {
          const isActive = item.path === "/admin/dashboard"
            ? location.pathname === "/admin/dashboard"
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-md transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminLayout;
