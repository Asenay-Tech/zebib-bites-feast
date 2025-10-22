import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/ui/language-switcher";
import { supabase } from "@/integrations/supabase/client";
import traditionalPlatterImage from "@/assets/traditional-platter.jpg?url";


interface MenuItem {
  id: string;
  name_de: string;
  name_en: string;
  description_de?: string | null;
  description_en?: string | null;
  price: any;
  image_url?: string | null;
  image_scale?: number;
  category: string;
}

export function Menu() {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();

    // Real-time subscription
    const channel = supabase
      .channel("menu_public_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        () => {
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;

      setMenuItems(data || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(data?.map((item) => item.category) || [])
      ).sort();
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: "all", label: t("menu.category.all") },
    ...categories.map((cat) => ({
      value: cat,
      label: cat,
    })),
  ];

  // Filter items based on selected category
  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter((item) => item.category === selectedCategory);

  // Helpers
  const getItemName = (item: MenuItem) => (language === "de" ? item.name_de : item.name_en);

  const getItemDescription = (item: MenuItem) => (language === "de" ? item.description_de : item.description_en) || "";

  const formatPrice = (price: any) => {
    if (price === undefined || price === null) return "€0.00";
    
    // If it's a number
    if (typeof price === "number") {
      return `€${price.toFixed(2)}`;
    }
    
    // If it's a string
    if (typeof price === "string") {
      return price.includes("€") ? price : `€${price}`;
    }
    
    // If it's an object (JSONB with variants)
    if (typeof price === "object" && price !== null) {
      const firstKey = Object.keys(price)[0];
      const firstValue = price[firstKey];
      if (typeof firstValue === "number") {
        return `€${firstValue.toFixed(2)}`;
      }
      return typeof firstValue === "string" && firstValue.includes("€") 
        ? firstValue 
        : `€${firstValue}`;
    }
    
    return "€0.00";
  };

  const getItemVariants = (price: any) => {
    if (typeof price === "object" && price !== null && !Array.isArray(price)) {
      return Object.keys(price);
    }
    return [];
  };

  const getItemImageSrc = (item: MenuItem) => {
    if (!item.image_url) return undefined;
    // If it's already a full URL or starts with /, use it directly
    if (item.image_url.startsWith('http') || item.image_url.startsWith('/')) {
      return item.image_url;
    }
    // Otherwise, construct the path
    return `/menu-images/${item.image_url}`;
  };
  return (
    <section id="menu" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">{t("menu.title")}</h2>
          <p className="text-xl text-body max-w-2xl mx-auto">{t("menu.subtitle")}</p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-wrap gap-2 md:hidden">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64 bg-surface border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border">
                {categoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:flex flex-wrap gap-2 justify-center">
            {categoryOptions.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.value)}
                className={`transition-colors ${
                  selectedCategory === category.value
                    ? "bg-accent text-accent-foreground"
                    : "border-border text-body hover:text-foreground hover:border-accent"
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="text-center py-12 text-body">{t("common.loading")}</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-body">No menu items available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const variants = getItemVariants(item.price);

              return (
                <Card
                  key={item.id}
                  className="bg-surface border-border hover:shadow-card-hover transition-all duration-300 overflow-hidden"
                >
                  <CardContent className="p-0">
                    {getItemImageSrc(item) && (
                      <div className="w-full h-48 overflow-hidden">
                        <img
                          src={getItemImageSrc(item)!}
                          alt={getItemName(item)}
                          className="w-full h-full object-cover transition-transform duration-200"
                          style={{ 
                            transform: `scale(${item.image_scale || 1})`,
                            transformOrigin: 'center'
                          }}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Item Name */}
                      <h3 className="text-lg font-semibold text-foreground mb-4">{getItemName(item)}</h3>

                      {/* Item Description */}
                      {getItemDescription(item) && <p className="text-body text-sm mb-4">{getItemDescription(item)}</p>}

                      {/* Price Display */}
                      <div className="text-xl font-bold text-accent">{formatPrice(item.price)}</div>
                      
                      {/* Show variants if available */}
                      {variants.length > 1 && (
                        <div className="text-sm text-muted-foreground mt-2">
                          {variants.join(", ")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Special Section */}
        {!loading && filteredItems.length > 0 && (
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-foreground mb-8 text-center tracking-wide">
              {language === "de" ? "UNSERE SPEZIALITÄTEN" : "OUR SPECIALTIES"}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {filteredItems.slice(0, 6).map((item) => {
                  return (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-border/50">
                      <div className="flex-1">
                        <h4 className="text-foreground font-medium">{getItemName(item)}</h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-px bg-accent"></div>
                        <span className="text-accent font-bold">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative">
                <img
                  src={traditionalPlatterImage}
                  alt="Traditional Eritrean Platter"
                  className="w-full h-auto rounded-xl shadow-elegant"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
