import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Users, Leaf, Calendar } from "lucide-react";
import { useLanguage } from "@/components/ui/language-switcher";
import coffeeImage from "@/assets/coffee-ceremony.jpg";
import platterImage from "@/assets/traditional-platter.jpg";

export function WhyChooseUs() {
  const { language, t } = useLanguage();

  const features = [
    {
      icon: Leaf,
      title: language === "de" ? "Frische Zutaten" : "Fresh Ingredients",
      description: language === "de" 
        ? "Wir verwenden nur die frischesten, authentischen Zutaten direkt aus Eritrea und lokale Bio-Produkte."
        : "We use only the freshest, authentic ingredients directly from Eritrea and local organic produce."
    },
    {
      icon: Users,
      title: language === "de" ? "Einladende Atmosphäre" : "Welcoming Environment",
      description: language === "de"
        ? "Unser Restaurant bietet eine warme, familienfreundliche Atmosphäre mit traditioneller eritreischer Gastfreundschaft."
        : "Our restaurant offers a warm, family-friendly atmosphere with traditional Eritrean hospitality."
    },
    {
      icon: ChefHat,
      title: language === "de" ? "Erfahrene Köche" : "Skilled Chefs",
      description: language === "de"
        ? "Unsere erfahrenen Köche bringen authentische eritreische Kochtraditionen und Familienrezepte mit."
        : "Our experienced chefs bring authentic Eritrean cooking traditions and family recipes."
    },
    {
      icon: Calendar,
      title: language === "de" ? "Veranstaltungen & Feiern" : "Events & Party Hosting",
      description: language === "de"
        ? "Wir organisieren unvergessliche Feiern und Veranstaltungen mit traditioneller Küche und Service."
        : "We organize unforgettable celebrations and events with traditional cuisine and service."
    }
  ];

  return (
    <section className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            {language === "de" ? "WARUM ZEBIB WÄHLEN?" : "WHY CHOOSE ZEBIB?"}
          </h2>
          <p className="text-xl text-body max-w-2xl mx-auto">
            {language === "de" 
              ? "Entdecken Sie, was uns zu Ihrem bevorzugten eritreischen Restaurant macht"
              : "Discover what makes us your preferred Eritrean restaurant"
            }
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <Card 
                key={index} 
                className="bg-background border-border hover:shadow-card-hover transition-all duration-300 group"
              >
                <CardContent className="p-8 text-center">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                      <Icon className="w-8 h-8 text-accent" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-body leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Traditional Elements Section */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-gradient-card rounded-xl p-8 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-foreground mb-4 tracking-wide">
                {language === "de" ? "TRADITIONELL & MODERN" : "TRADITIONAL & MODERN"}
              </h3>
              <p className="text-body leading-relaxed">
                {language === "de"
                  ? "Wir verbinden jahrhundertealte eritreische Kochtraditionen mit modernen Präsentations- und Servicetechniken."
                  : "We combine centuries-old Eritrean cooking traditions with modern presentation and service techniques."
                }
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative rounded-xl overflow-hidden group">
              <img
                src={coffeeImage}
                alt="Traditional Cooking"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end">
                <p className="text-foreground font-medium p-6">
                  {language === "de" ? "Traditionelle Zubereitung" : "Traditional Preparation"}
                </p>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden group">
              <img
                src={platterImage}
                alt="Modern Presentation"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end">
                <p className="text-foreground font-medium p-6">
                  {language === "de" ? "Moderne Präsentation" : "Modern Presentation"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}