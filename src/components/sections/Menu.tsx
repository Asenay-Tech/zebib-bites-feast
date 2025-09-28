import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/ui/language-switcher";
import { Plus, Minus } from "lucide-react";
import menuData from "@/data/menu.json";
import traditionalPlatterImage from "@/assets/traditional-platter.jpg";

interface MenuItem {
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  price: number | string | Record<string, number>;
}

interface MenuProps {
  onAddToCart?: (item: any) => void;
}

export function Menu({ onAddToCart }: MenuProps) {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Get all categories from menu data
  const categories = Object.keys(menuData);
  const categoryOptions = [
    { value: "all", label: t("menu.category.all") },
    ...categories.map(cat => ({ 
      value: cat, 
      label: language === "de" ? cat : cat // You might want to translate category names
    }))
  ];

  // Filter items based on selected category
  const getFilteredItems = () => {
    if (selectedCategory === "all") {
      return Object.entries(menuData).flatMap(([category, items]) =>
        items.map(item => ({ ...item, category }))
      );
    }
    return menuData[selectedCategory as keyof typeof menuData]?.map(item => 
      ({ ...item, category: selectedCategory })
    ) || [];
  };

  const filteredItems = getFilteredItems();

  // Helper to get item name in current language
  const getItemName = (item: MenuItem) => {
    return language === "de" ? item.name_de : item.name_en;
  };

  // Helper to get item description in current language
  const getItemDescription = (item: MenuItem) => {
    const desc = language === "de" ? item.description_de : item.description_en;
    return desc || "";
  };

  // Helper to format price
  const formatPrice = (price: number | string | Record<string, number>, variant?: string) => {
    if (typeof price === "object") {
      if (variant && price[variant]) {
        return `€${price[variant].toFixed(2)}`;
      }
      // Return first available price as default
      const firstKey = Object.keys(price)[0];
      return `€${price[firstKey].toFixed(2)}`;
    }
    if (typeof price === "string") {
      return price.includes("€") ? price : `€${price}`;
    }
    return `€${price.toFixed(2)}`;
  };

  // Helper to get item variants (for items with multiple sizes/volumes)
  const getItemVariants = (price: number | string | Record<string, number>) => {
    if (typeof price === "object") {
      return Object.keys(price);
    }
    return [];
  };

  // Helper to get unique item ID
  const getItemId = (item: MenuItem & { category: string }, index: number) => {
    return `${item.category}-${index}`;
  };

  // Update quantity
  const updateQuantity = (itemId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  // Update variant selection
  const updateVariant = (itemId: string, variant: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [itemId]: variant
    }));
  };

  // Add to cart handler
  const handleAddToCart = (item: MenuItem & { category: string }, index: number) => {
    const itemId = getItemId(item, index);
    const quantity = quantities[itemId] || 1;
    const variant = selectedVariants[itemId];
    
    if (onAddToCart) {
      onAddToCart({
        id: itemId,
        name: getItemName(item),
        description: getItemDescription(item),
        category: item.category,
        price: item.price,
        variant,
        quantity
      });
    }
  };

  return (
    <section id="menu" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            {t("menu.title")}
          </h2>
          <p className="text-xl text-body max-w-2xl mx-auto">
            {t("menu.subtitle")}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-wrap gap-2 md:hidden">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64 bg-surface border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border">
                {categoryOptions.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:flex flex-wrap gap-2 justify-center">
            {categoryOptions.map(category => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            const itemId = getItemId(item, index);
            const variants = getItemVariants(item.price);
            const currentVariant = selectedVariants[itemId] || variants[0];
            const currentQuantity = quantities[itemId] || 0;

            return (
              <Card key={itemId} className="bg-surface border-border hover:shadow-card-hover transition-all duration-300">
                <CardContent className="p-6">
                  {/* Item Category Badge */}
                  <Badge variant="secondary" className="mb-3 bg-accent/10 text-accent border-accent/20">
                    {item.category}
                  </Badge>

                  {/* Item Name */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {getItemName(item)}
                  </h3>

                  {/* Item Description */}
                  {getItemDescription(item) && (
                    <p className="text-body text-sm mb-4 leading-relaxed">
                      {getItemDescription(item)}
                    </p>
                  )}

                  {/* Variants Selector */}
                  {variants.length > 0 && (
                    <div className="mb-4">
                      <Select 
                        value={currentVariant} 
                        onValueChange={(value) => updateVariant(itemId, value)}
                      >
                        <SelectTrigger className="w-full bg-surface-elevated border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-border">
                          {variants.map(variant => (
                            <SelectItem key={variant} value={variant}>
                              {variant} - {formatPrice(item.price, variant)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Price Display */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-accent">
                      {formatPrice(item.price, currentVariant)}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(itemId, -1)}
                        disabled={currentQuantity === 0}
                        className="h-8 w-8 p-0 border-border hover:border-accent"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-foreground font-medium">
                        {currentQuantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(itemId, 1)}
                        className="h-8 w-8 p-0 border-border hover:border-accent"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() => handleAddToCart(item, index)}
                      disabled={currentQuantity === 0}
                      className="bg-accent hover:bg-accent-hover text-accent-foreground disabled:opacity-50"
                    >
                      {t("common.add")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Special Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center tracking-wide">
            UNSERE SPEZIALITÄTEN
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {filteredItems.slice(0, 6).map((item, index) => {
                const itemId = getItemId(item, index);
                const variants = getItemVariants(item.price);
                const currentVariant = selectedVariants[itemId] || variants[0];
                
                return (
                  <div key={itemId} className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="flex-1">
                      <h4 className="text-foreground font-medium">{getItemName(item)}</h4>
                      {getItemDescription(item) && (
                        <p className="text-body text-sm mt-1">{getItemDescription(item)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-px bg-accent"></div>
                      <span className="text-accent font-bold">
                        {formatPrice(item.price, currentVariant)}
                      </span>
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
      </div>
    </section>
  );
}