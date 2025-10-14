import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/ui/language-switcher";
import menuData from "@/data/menu.json";



interface MenuItem {
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  price: number | string | Record<string, number | string>;
  image?: string; // added image key from menu.json
}

export function Menu() {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get all categories from menu data
  const categories = Object.keys(menuData);
  const categoryOptions = [
    { value: "all", label: t("menu.category.all") },
    ...categories.map((cat) => ({
      value: cat,
      label: language === "de" ? cat : cat, // translation placeholder
    })),
  ];

  // Filter items based on selected category
  const getFilteredItems = () => {
    if (selectedCategory === "all") {
      return Object.entries(menuData).flatMap(([category, items]) => items.map((item) => ({ ...item, category })));
    }
    return (
      menuData[selectedCategory as keyof typeof menuData]?.map((item) => ({ ...item, category: selectedCategory })) ||
      []
    );
  };

  const filteredItems = getFilteredItems();

  // Helpers
  const getItemName = (item: MenuItem) => (language === "de" ? item.name_de : item.name_en);

  const getItemDescription = (item: MenuItem) => (language === "de" ? item.description_de : item.description_en) || "";

  const formatPrice = (price: number | string | Record<string, number | string>, variant?: string) => {
    if (price === undefined || price === null) return "€0.00";
    const toEuro = (val: number | string) => {
      if (typeof val === "number" && isFinite(val)) return `€${val.toFixed(2)}`;
      if (typeof val === "string") return val.includes("€") ? val : `€${val}`;
      return "€0.00";
    };
    if (typeof price === "object") {
      const record = price as Record<string, number | string>;
      const pick = (key?: string) => (key ? record[key] : undefined);
      const chosen = variant ? pick(variant) : undefined;
      if (chosen !== undefined && chosen !== null) return toEuro(chosen);
      for (const key of Object.keys(record)) {
        const v = record[key];
        if (v !== undefined && v !== null) return toEuro(v);
      }
      return "€0.00";
    }
    return toEuro(price as number | string);
  };

  const getItemVariants = (price: number | string | Record<string, number | string>) =>
    typeof price === "object" ? Object.keys(price) : [];

  const getItemId = (item: MenuItem & { category: string }, index: number) => `${item.category}-${index}`;

  const getItemImageSrc = (item: MenuItem) => {
    return item.image ? `/menu-images/${item.image}` : undefined;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            const itemId = getItemId(item, index);
            const variants = getItemVariants(item.price);
            const displayPrice = variants.length > 0 ? variants[0] : undefined;

            return (
              <Card
                key={itemId}
                className="bg-surface border-border hover:shadow-card-hover transition-all duration-300 overflow-hidden"
              >
                <CardContent className="p-0">
                  {getItemImageSrc(item) && (
                    <img
                      src={getItemImageSrc(item)!}
                      alt={getItemName(item)}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  <div className="p-6">
                    {/* Item Name */}
                    <h3 className="text-lg font-semibold text-foreground mb-4">{getItemName(item)}</h3>

                    {/* Item Description */}
                    {getItemDescription(item) && <p className="text-body text-sm mb-4">{getItemDescription(item)}</p>}

                    {/* Price Display */}
                    <div className="text-xl font-bold text-accent">{formatPrice(item.price, displayPrice)}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Special Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-foreground mb-8 text-center tracking-wide">UNSERE SPEZIALITÄTEN</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {filteredItems.slice(0, 6).map((item, index) => {
                const itemId = getItemId(item, index);
                const variants = getItemVariants(item.price);
                const displayPrice = variants.length > 0 ? variants[0] : undefined;
                return (
                  <div key={itemId} className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="flex-1">
                      <h4 className="text-foreground font-medium">{getItemName(item)}</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-px bg-accent"></div>
                      <span className="text-accent font-bold">{formatPrice(item.price, displayPrice)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative">
              <img
                src="/images/traditional-platter.jpg"
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
