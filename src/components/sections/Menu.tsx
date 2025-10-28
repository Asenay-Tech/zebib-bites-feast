import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/ui/language-switcher";
import traditionalPlatterImage from "@/assets/traditional-platter.jpg?url";
import { useMenuData, getItemImageSrc, formatPrice, getItemVariants, shouldShowImages } from "@/hooks/useMenuData";

export function Menu() {
  const { language, t } = useLanguage();
  const { menuItems, categories, categorySettings, loading } = useMenuData();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Update selected category when categories change
  useEffect(() => {
    if (categories.length > 0 && (!selectedCategory || !categories.includes(selectedCategory))) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const categoryOptions = categories.map((cat) => ({
    value: cat,
    label: cat,
  }));

  // Filter items based on selected category
  const filteredItems = selectedCategory ? menuItems.filter((item) => item.category === selectedCategory) : menuItems;

  // Helpers
  const getItemName = (item: typeof menuItems[0]) => (language === "de" ? item.name_de : item.name_en);

  const getItemDescription = (item: typeof menuItems[0]) => (language === "de" ? item.description_de : item.description_en) || "";
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

        {/* Menu Items */}
        {loading ? (
          <div className="text-center py-12 text-body">{t("common.loading")}</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-body">No menu items available</div>
        ) : (
          <>
            {/* Check if current category should show images */}
            {(() => {
              const showImages = shouldShowImages(selectedCategory, filteredItems, categorySettings);

              return showImages ? (
                // Card layout with images
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => {
                    const variants = getItemVariants(item.price);
                    const shouldShowImage = categorySettings[item.category] !== false;
                    
                    return (
                      <Card
                        key={item.id}
                        className="bg-surface border-border hover:shadow-card-hover transition-all duration-300 overflow-hidden"
                      >
                        <CardContent className="p-0">
                          {shouldShowImage && getItemImageSrc(item) && (
                            <div className="w-full h-48 overflow-hidden">
                              <img
                                src={getItemImageSrc(item)!}
                                alt={getItemName(item)}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          <div className="p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">{getItemName(item)}</h3>
                            {getItemDescription(item) && <p className="text-body text-sm mb-4">{getItemDescription(item)}</p>}

                            {variants.length > 1 ? (
                              <div className="space-y-2">
                                {variants.map((variant) => (
                                  <div key={variant} className="flex justify-between items-center">
                                    <span className="text-sm text-body">{variant}</span>
                                    <span className="text-lg font-bold text-accent">
                                      {typeof item.price === "object" && item.price[variant]
                                        ? `${parseFloat(item.price[variant]).toFixed(2).replace('.', ',')} €`
                                        : formatPrice(item.price)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xl font-bold text-accent">{formatPrice(item.price)}</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                // Clean list layout without images (like Specialties)
                <div className="max-w-4xl mx-auto space-y-4">
                  {filteredItems.map((item) => {
                    const variants = getItemVariants(item.price);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="group py-4 border-b border-border/50 hover:border-accent/50 transition-colors duration-300"
                      >
                        {variants.length > 1 ? (
                          // Multiple sizes
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="text-foreground font-medium mb-1">{getItemName(item)}</h4>
                                {getItemDescription(item) && (
                                  <p className="text-body text-sm">{getItemDescription(item)}</p>
                                )}
                              </div>
                            </div>
                            {variants.map((variant) => (
                              <div key={variant} className="flex items-center justify-between gap-4 pl-4">
                                <span className="text-sm text-body">{variant}</span>
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-px bg-accent/60"></div>
                                  <span className="text-accent font-bold whitespace-nowrap">
                                    {typeof item.price === "object" && item.price[variant]
                                      ? `${parseFloat(item.price[variant]).toFixed(2).replace('.', ',')} €`
                                      : formatPrice(item.price)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Single price
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-foreground font-medium mb-1">{getItemName(item)}</h4>
                              {getItemDescription(item) && (
                                <p className="text-body text-sm">{getItemDescription(item)}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-px bg-accent/60"></div>
                              <span className="text-accent font-bold whitespace-nowrap">{formatPrice(item.price)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
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
