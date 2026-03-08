import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Award,
  Layers,
  BookOpen,
  Cpu,
  DollarSign,
  FileText,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const adminNavItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin" },
  { label: "Interns", icon: Users, path: "/admin/interns" },
  { label: "Certificates", icon: Award, path: "/admin/certificates" },
  { label: "Batches", icon: Layers, path: "/admin/batches" },
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
      <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <img
            src="/images/syedom-labs-logo.png"
            alt="Syedom Labs"
            className="h-8 w-8 rounded-lg object-cover mr-2.5"
          />
          <div>
            <h1 className="text-sm font-semibold text-sidebar-accent-foreground">
              Admin Panel
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Syedom Labs
            </p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {adminNavItems.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);
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

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            <ArrowLeft className="h-4 w-4" />
            Student Portal
          </Link>
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

export default AdminLayout;
