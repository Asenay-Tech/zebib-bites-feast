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
      setSpecialties(data || []);
    } catch (error) {
      logger.error('Error fetching specialties:', error);
    }
  };

  if (specialties.length === 0) return null;

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

        {/* Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {specialties.map((specialty) => {
            const item = specialty.menu_items;
            
            return (
              <Card
                key={specialty.id}
                className="overflow-hidden bg-card border-border/50 hover:shadow-elegant transition-all duration-500 group rounded-2xl"
              >
                {item.image_url && (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={language === "de" ? item.name_de : item.name_en}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  </div>
                )}
                
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {language === "de" ? item.name_de : item.name_en}
                  </h3>
                  
                  {(language === "de" ? item.description_de : item.description_en) && (
                    <p className="text-body leading-relaxed">
                      {language === "de" ? item.description_de : item.description_en}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
