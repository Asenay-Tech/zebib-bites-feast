import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher, useLanguage } from "@/components/ui/language-switcher";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, X, Phone, MapPin, Clock, User, LogOut, ShoppingBag, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  currentSection?: string;
  onSectionChange?: (section: string) => void;
}

export function Header({ currentSection, onSectionChange }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { key: "home", href: "#home", type: "scroll" },
    { key: "menu", href: "#menu", type: "scroll" },
    { key: "reserve", href: "/reserve", type: "route" },
    { key: "order", href: "/order", type: "route" },
    { key: "reviews", href: "#reviews", type: "scroll" },
    { key: "contact", href: "#contact", type: "scroll" },
  ];

  const handleNavClick = (item: typeof navigation[0]) => {
    setIsMobileMenuOpen(false);
    
    if (item.type === "route") {
      navigate(item.href);
    } else {
      // First navigate to home if not already there
      if (window.location.pathname !== "/") {
        navigate("/");
        // Wait for navigation then scroll
        setTimeout(() => {
          const element = document.querySelector(item.href);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            onSectionChange?.(item.href.replace("#", ""));
          }
        }, 100);
      } else {
        const element = document.querySelector(item.href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          onSectionChange?.(item.href.replace("#", ""));
        }
      }
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.logoutSuccess") });
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Info Bar */}
      <div className="bg-surface border-b border-border px-4 py-2 text-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-body">{t("info.address")}</span>
              <a
                href="https://maps.google.com/?q=Salzstraße+14,+63450+Hanau"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                {t("info.directions")}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-body">{t("info.hours")}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:+4917746295"
              className="flex items-center gap-2 text-body hover:text-accent transition-colors"
            >
              <Phone className="h-4 w-4" />
              {t("info.phone")}
            </a>
            <LanguageSwitcher
              currentLanguage={language}
              onLanguageChange={setLanguage}
            />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
                  <DropdownMenuItem onClick={() => navigate("/reserve")} className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    {t("nav.reserve")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/order")} className="cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {t("nav.order")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!user && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                {t("auth.login")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav
        className={`backdrop-blur-md transition-all duration-300 ${
          isScrolled
            ? "bg-surface/95 shadow-lg"
            : "bg-surface/80"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate("/")}
                className="text-2xl font-bold text-foreground hover:text-accent transition-colors"
              >
                ZEBIB
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item)}
                  className={`text-sm font-medium transition-colors duration-200 relative ${
                    currentSection === item.key
                      ? "text-accent"
                      : "text-body hover:text-foreground"
                  }`}
                >
                  {t(`nav.${item.key}`)}
                  {currentSection === item.key && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-body hover:text-foreground"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item)}
                    className={`block w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                      currentSection === item.key
                        ? "text-accent bg-surface-elevated"
                        : "text-body hover:text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    {t(`nav.${item.key}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}