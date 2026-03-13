import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListTodo, Upload, Star, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/intern/dashboard" },
  { label: "Tasks", icon: ListTodo, path: "/intern/tasks" },
  { label: "Submissions", icon: Upload, path: "/intern/submissions" },
  { label: "Grades", icon: Star, path: "/intern/grades" },
];

const PortalLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-8 w-8 rounded-lg object-cover mr-2.5" />
          <div>
            <h1 className="text-sm font-semibold text-sidebar-accent-foreground">Syedom Labs</h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Intern Portal</p>
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

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/images/syedom-labs-logo.png" alt="Syedom Labs" className="h-7 w-7 rounded-lg object-cover" />
          <span className="text-sm font-semibold text-foreground">Syedom Labs</span>
        </div>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 pt-[72px] md:pt-8 pb-24 md:pb-8">{children}</div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-md transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default PortalLayout;
