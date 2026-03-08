import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ListTodo, Upload, TrendingUp,
  Users, Database, Activity, LogOut, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface PortalLayoutProps {
  children: ReactNode;
  role: "intern" | "admin";
}

const internNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/intern/dashboard" },
  { label: "Tasks", icon: ListTodo, path: "/intern/tasks" },
  { label: "Submit Task", icon: Upload, path: "/intern/submit" },
  { label: "Progress", icon: TrendingUp, path: "/intern/progress" },
];

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Intern Management", icon: Users, path: "/admin/interns" },
  { label: "Task Pool", icon: Database, path: "/admin/tasks" },
  { label: "AI Usage", icon: Activity, path: "/admin/ai-usage" },
];

const PortalLayout = ({ children, role }: PortalLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const navItems = role === "admin" ? adminNav : internNav;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Bot className="h-6 w-6 text-sidebar-primary mr-2.5" />
          <div>
            <h1 className="text-sm font-semibold text-sidebar-accent-foreground">Syedom Labs</h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Internee Portal</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
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
