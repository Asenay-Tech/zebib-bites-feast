import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingBag, Calendar, Menu as MenuIcon, LogOut, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error logging out",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
    { icon: Calendar, label: "Reservations", path: "/admin/reservations" },
    { icon: MenuIcon, label: "Menu Manager", path: "/admin/menu" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">ZEBIB Admin</h1>
        </div>
        
        <div className="px-4 mb-4">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start gap-3">
              <Home className="h-5 w-5" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <nav className="px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header with Logout */}
        <header className="sticky top-0 z-10 bg-surface border-b border-border px-8 py-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </header>
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
