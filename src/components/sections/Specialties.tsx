import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/components/ui/language-switcher";
import { logger } from "@/lib/logger";
import traditionalPlatterImage from "@/assets/traditional-platter.jpg?url";

interface MenuItem {
  id: string;
  category: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  image_url: string | null;
  price: any;
}

interface Specialty {
  id: string;
  menu_item_id: string;
  display_order: number;
  menu_items: MenuItem;
}

export function Specialties() {
  const { language } = useLanguage();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecialties();

    // Real-time subscription for specialties updates
    const channel = supabase
      .channel("specialties-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "specialties" },
        () => fetchSpecialties()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("specialties")
        .select(
          `
          id,
          menu_item_id,
          display_order,
          menu_items (
            id,
            category,
            name_de,
            name_en,
            description_de,
            description_en,
            image_url,
            price
          )
        `
        )
        .order("display_order", { ascending: true });

      if (error) throw error;
      logger.info("Fetched specialties:", data);
      setSpecialties(data || []);
    } catch (error) {
      logger.error("Error fetching specialties:", error);
      console.error("Error fetching specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: any) => {
    if (typeof price === "number") return `€${price.toFixed(2)}`;
    if (typeof price === "string") {
      const num = parseFloat(price);
      return isNaN(num) ? price : `€${num.toFixed(2)}`;
    }
    if (typeof price === "object" && price !== null) {
      if ("default" in price) return formatPrice(price.default);
      const firstKey = Object.keys(price)[0];
      return firstKey ? formatPrice(price[firstKey]) : "€0.00";
    }
    return "€0.00";
  };

  const getItemName = (item: MenuItem) =>
    language === "de" ? item.name_de : item.name_en;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-wide">
            {language === "de" ? "UNSERE SPEZIALITÄTEN" : "OUR SPECIALTIES"}
          </h2>
        </div>

        {/* Empty fallback */}
        {!loading && specialties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-body">
              {language === "de"
                ? "Unsere Spezialitäten werden gerade aktualisiert – schauen Sie bald wieder vorbei!"
                : "Our specialties are being updated — check back soon!"}
            </p>
          </div>
        )}

        {/* Specialties Grid (old layout, new logic) */}
        {!loading && specialties.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left side – Static specialties list */}
            <div className="space-y-6">
              {specialties.slice(0, 6).map((specialty) => {
                const item = specialty.menu_items;
                return (
                  <div
                    key={specialty.id}
                    className="flex items-center justify-between py-3 border-b border-border/50 transition-all duration-300 hover:translate-x-1"
                  >
                    <div className="flex-1">
                      <h4 className="text-foreground font-medium">
                        {getItemName(item)}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-px bg-accent"></div>
                      <span className="text-accent font-bold">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right side – Decorative image */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-elegant">
                <img
                  src={traditionalPlatterImage}
                  alt={
                    language === "de"
                      ? "Traditionelle Eritreisch-Äthiopische Platte"
                      : "Traditional Eritrean and Ethiopian Platter"
                  }
                  className="w-full h-full object-cover rounded-2xl shadow-elegant"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
