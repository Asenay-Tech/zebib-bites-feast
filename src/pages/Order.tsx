import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import menuPlaceholder from "@/assets/menu-placeholder.jpg";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  cartItems: z.array(z.any()).min(1, "Cart cannot be empty"),
});

type Price = number | string | Record<string, number | string> | undefined;
/** Grab the first number in a string like "€15,90 per person" or "15.90 per person" */
const extractNumber = (v: string): number => {
  const m = v.match(/-?\d+(?:[.,]\d+)?/); // finds 15.90 or 15,90
  if (!m) return NaN;
  return parseFloat(m[0].replace(",", ".")); // "15,90" -> 15.90
};

/** Resolve a price to a numeric unit price, supporting numbers, strings, and variant maps */
export const getUnitPrice = (price: Price, variant?: string): number => {
  if (price == null) return NaN;
  if (typeof price === "number") return price;
  if (typeof price === "string") return extractNumber(price);

  // object -> variants like { small: 2.5, large: "3.00" }
  let val: any;
  if (variant && Object.prototype.hasOwnProperty.call(price, variant)) {
    val = (price as any)[variant];
  } else {
    const firstKey = Object.keys(price as any)[0];
    val = (price as any)[firstKey];
  }
  return typeof val === "number" ? val : extractNumber(String(val));
};

export const formatEUR = (n: number) =>
  isNaN(n)
    ? ""
    : new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(n);

interface MenuItem {
  id: string;
  name_de: string;
  name_en: string;
  description_de?: string | null;
  description_en?: string | null;
  price?: any;
  category: string;
  image_url?: string | null;
  image_scale?: number | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
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

const Order = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [diningType, setDiningType] = useState<"pickup" | "dine-in">("pickup");
  const [date, setDate] = useState<Date>(new Date());
  const [hour, setHour] = useState(() => {
    const now = new Date();
    return now.getHours().toString().padStart(2, "0");
  });
  const [minute, setMinute] = useState(() => {
    const now = new Date();
    const mins = now.getMinutes();
    // Round to nearest 15-minute interval
    const rounded = Math.ceil(mins / 15) * 15;
    return (rounded === 60 ? 0 : rounded).toString().padStart(2, "0");
  });
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate(`/login?redirect=/order`);
        return;
      }
      setUser(session.user);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate(`/login?redirect=/order`);
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchMenuItems();

    // Real-time subscription
    const channel = supabase
      .channel("menu_order_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        () => {
          fetchMenuItems();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase.from("menu_items").select("*").order("category", { ascending: true });

      if (error) throw error;

      setMenuData(data || []);

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data?.map((item) => item.category) || [])).sort();
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        title: "Error loading menu",
        description: "Please refresh the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu =
    selectedCategory === "all" ? menuData : menuData.filter((item) => item.category === selectedCategory);

  const addToCart = (item: any, variant?: string) => {
    setAddingToCart(item.name_de);

    // If price is an object and no variant chosen, default to the first key
    if (typeof item.price === "object" && item.price && !variant) {
      const firstKey = Object.keys(item.price)[0];
      variant = firstKey;
    }

    const unitPrice = getUnitPrice(item.price, variant);
    if (isNaN(unitPrice)) {
      // Optional: show a toast instead of silently failing
      setAddingToCart(null);
      return;
    }

    const cartItemId = `${item.name_de}-${variant || "default"}`;

    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartItemId);
      if (existing) {
        return prev.map((c) => (c.id === cartItemId ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          id: cartItemId,
          name_de: item.name_de,
          name_en: item.name_en,
          variant,
          price: unitPrice, // store a clean number in the cart
          quantity: 1,
        },
      ];
    });

    setAddingToCart(null);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => {
    const p = isNaN(item.price) ? 0 : item.price;
    return sum + p * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    if (diningType === "dine-in" && !selectedTable) {
      toast({ title: "Please select a table", variant: "destructive" });
      return;
    }
    if (!date) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }
    if (!user?.email) {
      toast({ title: "Please log in to continue", variant: "destructive" });
      return;
    }

    // Build the order date-time
    const when = new Date(date);
    when.setHours(Number(hour), Number(minute), 0, 0);

    // Get profile info for name and phone
    const { data: profile } = await supabase.from("profiles").select("name, phone").eq("id", user.id).maybeSingle();

    try {
      // Validate input before checkout
      const result = checkoutSchema.safeParse({
        name: profile?.name || user.email,
        phone: profile?.phone || "",
        notes: "",
        cartItems: cart,
      });

      if (!result.success) {
        toast({
          title: "Validation Error",
          description: result.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Creating checkout session...", description: "Please wait" });

      // Build a product name from cart items
      const productName =
        cart.length === 1
          ? cart[0].name_en
          : `Order: ${cart
              .map((c) => c.name_en)
              .join(", ")
              .substring(0, 100)}`;

      // Format date and time for order
      const orderDate = format(date, "yyyy-MM-dd");
      const orderTime = `${hour}:${minute}`;

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          productName,
          amount: subtotal,
          customerEmail: user.email,
          customerName: profile?.name || user.email,
          customerPhone: profile?.phone || "",
          items: cart,
          date: orderDate,
          time: orderTime,
          diningType,
          successUrl: `${window.location.origin}/checkout?success=true`,
          cancelUrl: `${window.location.origin}/order?canceled=true`,
        },
      });

      if (error) {
        console.error("Checkout error:", error);
        toast({
          title: "Checkout failed",
          description: error.message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      // Check if the function returned an error in the response data
      if (data && !data.success && data.error) {
        console.error("Checkout error from function:", data.error);
        toast({
          title: "Checkout failed",
          description: data.error || "Payment setup failed, please try again",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to payment",
          description: "Opening Stripe Checkout in new tab",
        });
      } else {
        toast({
          title: "Error",
          description: "No checkout URL received",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        title: "Checkout failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-24">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
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
                          className={cn("w-full justify-start text-left", !date && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date
                            ? format(date, "PPP", {
                                locale: language === "de" ? de : enUS,
                              })
                            : t("reserve.selectDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
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
                          {Array.from({ length: 13 }, (_, i) => i + 11).map((h) => (
                            <SelectItem key={h} value={h.toString().padStart(2, "0")}>
                              {h.toString().padStart(2, "0")}
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
                          {["00", "15", "30", "45"].map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
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
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((table) => (
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
              {/* auto rows; columns expand/shrink with space */}
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                <Button
                  className="w-full text-center whitespace-normal break-words leading-snug px-4 py-2"
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                >
                  {t("menu.category.all")}
                </Button>

                {categories.map((cat) => {
                  return (
                    <Button
                      key={cat}
                      className="w-full text-center whitespace-normal break-words leading-snug px-4 py-2"
                      variant={selectedCategory === cat ? "default" : "outline"}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </Button>
                  );
                })}
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredMenu.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">{t("menu.noItems")}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMenu.map((item) => (
                    <Card key={item.id} className="p-4 overflow-hidden">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image_url || menuPlaceholder}
                            alt={language === "de" ? item.name_de : item.name_en}
                            className="w-full h-full object-cover transition-transform duration-200"
                            style={{
                              transform: `scale(${item.image_scale || 1})`,
                              transformOrigin: "center",
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{language === "de" ? item.name_de : item.name_en}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {language === "de" ? item.description_de : item.description_en}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-accent">{formatEUR(getUnitPrice(item.price))}</span>
                            <Button size="sm" onClick={() => addToCart(item)} disabled={addingToCart === item.name_de}>
                              {addingToCart === item.name_de ? (
                                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t("order.cart")}
              </h3>

              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t("order.emptyCart")}</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {language === "de" ? item.name_de : item.name_en}
                            {item.variant && <span className="text-muted-foreground"> ({item.variant})</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm">{item.quantity}</span>
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatEUR(item.price * item.quantity)}</p>

                          <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>{t("common.total")}</span>
                      <span>{formatEUR(subtotal)}</span>
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
