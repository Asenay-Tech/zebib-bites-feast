import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/ui/language-switcher";
import { logger } from "@/lib/logger";

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

  useEffect(() => {
    fetchSpecialties();

    // Set up realtime subscription for specialties changes
    const channel = supabase
      .channel('specialties-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialties'
        },
        () => {
          fetchSpecialties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select(`
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
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      console.log('Fetched specialties:', data);
      setSpecialties(data || []);
    } catch (error) {
      logger.error('Error fetching specialties:', error);
      console.error('Error fetching specialties:', error);
    }
  };

  const formatPrice = (price: any) => {
    if (typeof price === 'number') {
      return `€${price.toFixed(2)}`;
    }
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? price : `€${numPrice.toFixed(2)}`;
    }
    if (typeof price === 'object' && price !== null) {
      if ('default' in price) {
        return formatPrice(price.default);
      }
      const firstKey = Object.keys(price)[0];
      return firstKey ? formatPrice(price[firstKey]) : '€0.00';
    }
    return '€0.00';
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            {language === "de" ? "UNSERE SPEZIALITÄTEN" : "OUR SPECIALTIES"}
          </h2>
          <p className="text-xl text-body max-w-2xl mx-auto">
            {language === "de"
              ? "Entdecken Sie unsere handverlesenen Spezialitäten"
              : "Discover our handpicked specialties"}
          </p>
        </div>

        {specialties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-body">
              {language === "de"
                ? "Unsere Spezialitäten werden gerade aktualisiert – schauen Sie bald wieder vorbei!"
                : "Our specialties are being updated — check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Specialties List */}
            <div className="space-y-6">
              {specialties.map((specialty) => {
                const item = specialty.menu_items;
                const itemName = language === "de" ? item.name_de : item.name_en;
                const itemPrice = formatPrice(item.price);
                
                return (
                  <div
                    key={specialty.id}
                    className="group hover:transform hover:translate-x-2 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold text-foreground whitespace-nowrap">
                        {itemName}
                      </h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-[hsl(var(--primary))] to-transparent opacity-50" />
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        {itemPrice}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Decorative Image */}
            {specialties.length > 0 && specialties[0].menu_items.image_url && (
              <div className="relative hidden lg:block">
                <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-elegant">
                  <img
                    src={specialties[0].menu_items.image_url}
                    alt={language === "de" ? "Spezialitäten" : "Specialties"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
