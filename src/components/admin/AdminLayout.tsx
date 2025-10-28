import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingBag, Calendar, Menu as MenuIcon, LogOut, Home, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/ui/language-switcher";
import { Badge } from "@/components/ui/badge";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { unreadCount, notifications, markAsRead, clearAll } = useOrderNotifications();

  const languages = [
    { code: "de" as const, label: "Deutsch", flag: "🇩🇪" },
    { code: "en" as const, label: "English", flag: "🇬🇧" },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

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
            const showBadge = item.path === "/admin/orders" && unreadCount > 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {showBadge && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header with Notifications, Language Switcher and Logout */}
        <header className="sticky top-0 z-10 bg-surface border-b border-border px-8 py-4 flex justify-end items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative h-9 w-9 rounded-full p-0 hover:scale-110 transition-transform"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-surface border-border">
              <div className="flex items-center justify-between p-2 border-b border-border">
                <span className="font-semibold">Notifications</span>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-auto py-1 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No new notifications
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((order) => (
                    <DropdownMenuItem
                      key={order.id}
                      className="cursor-pointer p-3 flex flex-col items-start gap-1 hover:bg-muted"
                      onClick={() => {
                        markAsRead(order.id);
                        navigate('/admin/orders');
                      }}
                    >
                      <div className="font-semibold text-sm">
                        New Order #{order.order_code || order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-sm text-primary">
                        Total: €{(order.total_amount_cents / 100).toFixed(2).replace('.', ',')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-full p-0 hover:scale-110 transition-transform"
              >
                <span className="text-xl">{currentLanguage.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`cursor-pointer ${
                    language === lang.code
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="mr-3 text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Button */}
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
