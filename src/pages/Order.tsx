import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
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
import { PhoneInputDialog } from "@/components/ui/phone-input-dialog";
import { useMenuData, getItemImageSrc, formatPrice as formatMenuPrice, getItemVariants, shouldShowImages, type MenuItem as MenuItemType } from "@/hooks/useMenuData";
import { getBookedTables, checkTableAvailability } from "@/lib/tableAvailability";
import { FloatingMobileCart } from "@/components/order/FloatingMobileCart";
import { useIsMobile } from "@/hooks/use-mobile";

const checkoutSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  cartItems: z.array(z.any()).min(1, "Cart cannot be empty"),
});

type Price = number | string | Record<string, number | string> | undefined;
/** Grab the first number in a string like "€15,90 per person" or "15.90 per person" */
const extractNumber = (v: string): number => {
  const m = v.match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return NaN;
  return parseFloat(m[0].replace(",", "."));
};

/** Resolve a price to a numeric unit price, supporting numbers, strings, and variant maps */
export const getUnitPrice = (price: Price, variant?: string): number => {
  if (price == null) return NaN;
  if (typeof price === "number") return price;
  if (typeof price === "string") return extractNumber(price);

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
    const rounded = Math.ceil(mins / 15) * 15;
    return (rounded === 60 ? 0 : rounded).toString().padStart(2, "0");
  });
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [processingPhone, setProcessingPhone] = useState(false);
  const [bookedTables, setBookedTables] = useState<Array<{ tableNumber: number; bookedUntil: string }>>([]);
  const isMobile = useIsMobile();

  // Use shared menu data hook
  const { menuItems: menuData, categories, categorySettings, loading } = useMenuData();

  // Update selected category when categories change
  useEffect(() => {
    if (categories.length > 0 && (!selectedCategory || !categories.includes(selectedCategory))) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

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

  // Fetch booked tables when date/time or diningType changes
  useEffect(() => {
    if (diningType === "dine-in" && date) {
      const fetchBookedTables = async () => {
        const timeString = `${hour}:${minute}`;
        const dateString = format(date, "yyyy-MM-dd");
        const booked = await getBookedTables(dateString, timeString);
        setBookedTables(booked);
      };
      fetchBookedTables();
    } else {
      setBookedTables([]);
    }
  }, [diningType, date, hour, minute]);

  const filteredMenu = selectedCategory ? menuData.filter((item) => item.category === selectedCategory) : menuData;

  const addToCart = (item: any, variant?: string) => {
    setAddingToCart(item.name_de);

    if (typeof item.price === "object" && item.price && !variant) {
      const firstKey = Object.keys(item.price)[0];
      variant = firstKey;
    }

    const unitPrice = getUnitPrice(item.price, variant);
    if (isNaN(unitPrice)) {
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
          price: unitPrice,
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
    logger.log("🔷 handleCheckout called");

    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    if (diningType === "dine-in" && !selectedTable) {
      toast({ title: "Please select a table", variant: "destructive" });
      return;
    }
    
    // Check table availability for dine-in orders
    if (diningType === "dine-in" && selectedTable) {
      const timeString = `${hour}:${minute}`;
      const dateString = format(date, "yyyy-MM-dd");
      const availability = await checkTableAvailability(selectedTable, dateString, timeString);
      
      if (!availability.available) {
        const message = availability.bookedUntil
          ? `Table ${selectedTable} is already reserved until ${availability.bookedUntil}. Please choose another table or time.`
          : `Table ${selectedTable} is already reserved. Please choose another table or time.`;
        toast({ title: message, variant: "destructive" });
        return;
      }
    }
    if (!date) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }
    if (!user?.email) {
      toast({ title: "Please log in to continue", variant: "destructive" });
      return;
    }

    const when = new Date(date);
    when.setHours(Number(hour), Number(minute), 0, 0);

    logger.log("🔷 Fetching profile for user:", user.id);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", user.id)
      .maybeSingle();

    logger.log("🔷 Profile data:", profile);
    logger.log("🔷 Profile error:", profileError);

    if (!profile?.phone) {
      logger.log("🔷 No phone found, opening dialog");
      setPhoneDialogOpen(true);
      setPendingCheckout(true);
      return;
    }

    logger.log("🔷 Phone exists, proceeding to checkout");
    await processCheckout(profile);
  };

  const handlePhoneSubmit = async (phone: string) => {
    if (!user) return;

    if (processingPhone) {
      return;
    }

    setProcessingPhone(true);

    // Show loading toast
    toast({
      title: "Updating phone number...",
      description: "Please wait",
    });

    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, phone, email: user.email ?? null })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Close dialog immediately
      setPhoneDialogOpen(false);

      // Show success toast
      toast({
        title: "Phone number updated",
        description: "Redirecting to payment page...",
      });

      // Process checkout immediately with the updated profile
      if (pendingCheckout) {
        await processCheckout(data);
        setPendingCheckout(false);
      }
    } catch (error) {
      logger.error("Error updating phone:", error);
      setPendingCheckout(false);

      toast({
        title: "Profile update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPhone(false);
    }
  };

  const processCheckout = async (profile: { name?: string; phone?: string; id?: string; email?: string } | null) => {
    try {
      const result = checkoutSchema.safeParse({
        name: profile?.name || user!.email,
        notes: "",
        cartItems: cart,
      });

      if (!result.success) {
        const errorMessages = result.error.errors.map((e) => e.message).join(", ");
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Redirecting to payment page...",
        description: "Please wait",
      });

      const productName =
        cart.length === 1
          ? cart[0].name_en
          : `Order: ${cart
              .map((c) => c.name_en)
              .join(", ")
              .substring(0, 100)}`;

      const orderDate = format(date, "yyyy-MM-dd");
      const orderTime = `${hour}:${minute}`;

      // Determine base URL dynamically for any environment (local, preview, prod)
      const BASE_URL = window.location.origin;

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
          successUrl: `${BASE_URL}/checkout?success=true`,
          cancelUrl: `${BASE_URL}/checkout?canceled=true`,
        },
      });

      if (error) {
        logger.error("Checkout error:", error);
        toast({
          title: "Checkout failed",
          description: error.message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      if (data && !data.success && data.error) {
        logger.error("Checkout error from function:", data.error);
        toast({
          title: "Checkout failed",
          description: data.error || "Payment setup failed, please try again",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        logger.error("No checkout URL in response");
        toast({
          title: "Error",
          description: "No checkout URL received",
          variant: "destructive",
        });
      }
    } catch (err) {
      logger.error("Checkout error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
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
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((table) => {
                        const booking = bookedTables.find(b => b.tableNumber === table);
                        const isBooked = !!booking;
                        
                        return (
                          <Button
                            key={table}
                            variant={selectedTable === table ? "default" : "outline"}
                            onClick={() => !isBooked && setSelectedTable(table)}
                            disabled={isBooked}
                            className={cn(
                              "aspect-square relative",
                              isBooked && "opacity-40 cursor-not-allowed"
                            )}
                            title={isBooked ? `Booked until ${booking.bookedUntil}` : undefined}
                          >
                            {table}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              {/* Mobile Dropdown */}
              <div className="flex md:hidden mb-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full bg-surface border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border z-50">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Button Grid */}
              <div className="hidden md:grid gap-3 grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
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
                (() => {
                  const showImages = shouldShowImages(selectedCategory, filteredMenu, categorySettings);

                  return showImages ? (
                    // Card layout with images (when category has showImage=true)
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMenu.map((item) => {
                        const hasVariants = typeof item.price === "object" && item.price && Object.keys(item.price).length > 1;
                        const variants = hasVariants ? Object.keys(item.price as Record<string, any>) : [];
                        const shouldShowImage = categorySettings[item.category] !== false;
                        const imageSrc = shouldShowImage ? getItemImageSrc(item) : undefined;
                        
                        return (
                          <Card key={item.id} className="p-4 overflow-hidden">
                            <div className="flex gap-4">
                              {imageSrc && (
                                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={imageSrc}
                                    alt={language === "de" ? item.name_de : item.name_en}
                                    className="w-full h-full object-cover transition-transform duration-200"
                                    style={{
                                      transform: `scale(${item.image_scale || 1})`,
                                      transformOrigin: "center",
                                    }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{language === "de" ? item.name_de : item.name_en}</h3>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {language === "de" ? item.description_de : item.description_en}
                                </p>
                                
                                {hasVariants ? (
                                  <div className="space-y-2">
                                    {variants.map((variant) => {
                                      const variantPrice = getUnitPrice(item.price, variant);
                                      return (
                                        <div key={variant} className="flex justify-between items-center gap-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{variant}</span>
                                            <span className="font-bold text-sm text-accent">{formatEUR(variantPrice)}</span>
                                          </div>
                                          <Button 
                                            size="sm" 
                                            onClick={() => addToCart(item, variant)} 
                                            disabled={addingToCart === item.name_de}
                                          >
                                            {addingToCart === item.name_de ? (
                                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <Plus className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
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
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    // Clean list layout without images (when category has showImage=false)
                    <div className="max-w-4xl mx-auto space-y-4 mt-6">
                      {filteredMenu.map((item) => {
                        const hasVariants = typeof item.price === "object" && item.price && Object.keys(item.price).length > 1;
                        const variants = hasVariants ? Object.keys(item.price as Record<string, any>) : [];
                        
                        return (
                          <div 
                            key={item.id} 
                            className="group py-4 border-b border-border/50 hover:border-accent/50 transition-colors duration-300"
                          >
                            {hasVariants ? (
                              // Multiple sizes
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="text-foreground font-medium mb-1">{language === "de" ? item.name_de : item.name_en}</h4>
                                    {(language === "de" ? item.description_de : item.description_en) && (
                                      <p className="text-body text-sm">{language === "de" ? item.description_de : item.description_en}</p>
                                    )}
                                  </div>
                                </div>
                                {variants.map((variant) => {
                                  const variantPrice = getUnitPrice(item.price, variant);
                                  return (
                                    <div key={variant} className="flex items-center justify-between gap-4 pl-4">
                                      <span className="text-sm text-body">{variant}</span>
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-px bg-accent/60"></div>
                                        <span className="text-accent font-bold whitespace-nowrap">{formatEUR(variantPrice)}</span>
                                        <Button 
                                          size="sm" 
                                          onClick={() => addToCart(item, variant)} 
                                          disabled={addingToCart === item.name_de}
                                        >
                                          {addingToCart === item.name_de ? (
                                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Plus className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              // Single price
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="text-foreground font-medium mb-1">{language === "de" ? item.name_de : item.name_en}</h4>
                                  {(language === "de" ? item.description_de : item.description_en) && (
                                    <p className="text-body text-sm">{language === "de" ? item.description_de : item.description_en}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-px bg-accent/60"></div>
                                  <span className="text-accent font-bold whitespace-nowrap">{formatEUR(getUnitPrice(item.price))}</span>
                                  <Button size="sm" onClick={() => addToCart(item)} disabled={addingToCart === item.name_de}>
                                    {addingToCart === item.name_de ? (
                                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Plus className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
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

      <PhoneInputDialog
        open={phoneDialogOpen}
        onOpenChange={setPhoneDialogOpen}
        onSubmit={handlePhoneSubmit}
        disabled={processingPhone}
      />

      {/* Floating Mobile Cart */}
      {isMobile && (
        <FloatingMobileCart
          cart={cart}
          subtotal={subtotal}
          formatEUR={formatEUR}
          onCheckout={handleCheckout}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          disabled={!date || (diningType === "dine-in" && !selectedTable)}
        />
      )}
    </div>
  );
};

export default Order;
