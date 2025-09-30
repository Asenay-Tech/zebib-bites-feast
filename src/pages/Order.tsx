import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/ui/language-switcher";
import { CalendarIcon, ShoppingCart, Truck, UtensilsCrossed, Plus, Minus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import menuDataRaw from "@/data/menu.json";
import menuPlaceholder from "@/assets/menu-placeholder.jpg";

interface MenuItem {
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  price: number | Record<string, number>;
  category_de: string;
  category_en: string;
}

interface CartItem {
  id: string;
  name_de: string;
  name_en: string;
  variant?: string;
  price: number;
  quantity: number;
  notes?: string;
}

// Transform menu data structure
const menuData: MenuItem[] = Object.entries(menuDataRaw).flatMap(([categoryKey, items]) => {
  const categoryDe = categoryKey;
  const categoryEn = categoryKey; // You can add translations here if needed
  return (items as any[]).map(item => ({
    ...item,
    category_de: categoryDe,
    category_en: categoryEn,
  }));
});

const Order = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [diningType, setDiningType] = useState<"pickup" | "dine-in">("pickup");
  const [date, setDate] = useState<Date>();
  const [hour, setHour] = useState("18");
  const [minute, setMinute] = useState("00");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(`/login?redirect=/order`);
        return;
      }
      setUser(session.user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate(`/login?redirect=/order`);
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const categories = Array.from(new Set(menuData.map(item => item.category_de)));

  const filteredMenu = selectedCategory === "all" 
    ? menuData 
    : menuData.filter(item => item.category_de === selectedCategory);

  const addToCart = (item: any, variant?: string) => {
    const price = typeof item.price === "object" && variant 
      ? item.price[variant] 
      : typeof item.price === "number" 
      ? item.price 
      : 0;

    const cartItemId = `${item.name_de}-${variant || 'default'}`;
    const existing = cart.find(c => c.id === cartItemId);

    if (existing) {
      setCart(cart.map(c => 
        c.id === cartItemId 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        id: cartItemId,
        name_de: item.name_de,
        name_en: item.name_en,
        variant,
        price,
        quantity: 1,
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    // This would integrate with Stripe in a real implementation
    console.log("Checkout with cart:", cart);
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-foreground">{t("common.loading")}</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-24">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          ← {t("auth.backToHome")}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">{t("order.title")}</h2>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={diningType === "pickup" ? "default" : "outline"}
                    onClick={() => setDiningType("pickup")}
                    className="flex-1"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    {t("order.pickup")}
                  </Button>
                  <Button
                    variant={diningType === "dine-in" ? "default" : "outline"}
                    onClick={() => setDiningType("dine-in")}
                    className="flex-1"
                  >
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    {t("order.dineIn")}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("reserve.date")}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: language === "de" ? de : enUS }) : t("reserve.selectDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => date < new Date()}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("reserve.time")}</label>
                    <div className="flex gap-2">
                      <Select value={hour} onValueChange={setHour}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 13 }, (_, i) => i + 11).map(h => (
                            <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                              {h.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="flex items-center">:</span>
                      <Select value={minute} onValueChange={setMinute}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['00', '15', '30', '45'].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {diningType === "dine-in" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("reserve.table")}</label>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 15 }, (_, i) => i + 1).map(table => (
                        <Button
                          key={table}
                          variant={selectedTable === table ? "default" : "outline"}
                          onClick={() => setSelectedTable(table)}
                          className="aspect-square"
                        >
                          {table}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                >
                  {t("menu.category.all")}
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {language === "de" ? cat : menuData.find(i => i.category_de === cat)?.category_en || cat}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenu.map((item, idx) => (
                  <Card key={idx} className="p-4 overflow-hidden">
                    <div className="flex gap-4">
                      <img 
                        src={menuPlaceholder} 
                        alt={language === "de" ? item.name_de : item.name_en}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{language === "de" ? item.name_de : item.name_en}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {language === "de" ? item.description_de : item.description_en}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-accent">
                            {typeof item.price === "object" 
                              ? `€${Object.values(item.price)[0]}`
                              : `€${item.price}`
                            }
                          </span>
                          <Button size="sm" onClick={() => addToCart(item)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t("order.cart")}
              </h3>

              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t("order.emptyCart")}
                </p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {language === "de" ? item.name_de : item.name_en}
                            {item.variant && <span className="text-muted-foreground"> ({item.variant})</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>{t("common.total")}</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleCheckout}
                      disabled={!date || (diningType === "dine-in" && !selectedTable)}
                    >
                      {t("order.checkout")}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
