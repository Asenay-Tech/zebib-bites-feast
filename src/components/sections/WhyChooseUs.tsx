import { Card, CardContent } from "@/components/ui/card";
import { Users, Leaf, Calendar } from "lucide-react";
import { useLanguage } from "@/components/ui/language-switcher";
import coffeeImage from "@/assets/coffee-ceremony.jpg?url";
import platterImage from "@/assets/traditional-platter.jpg?url";

export function WhyChooseUs() {
  const { language } = useLanguage();

  const features = [
    {
      icon: Leaf,
      title: language === "de" ? "Frische Zutaten" : "Fresh Ingredients",
      description:
        language === "de"
          ? "Wir verwenden nur die frischesten Zutaten und authentische eritreischer und äthiopischer Gewürze."
          : "We use only the freshest ingredients and authentic Eritrean and Ethiopian spices.",
    },
    {
      icon: Users,
      title:
        language === "de" ? "Einladende Atmosphäre" : "Welcoming Environment",
      description:
        language === "de"
          ? "Unser Restaurant bietet eine warme, familienfreundliche Atmosphäre mit traditioneller eritreischer und äthiopischer Gastfreundschaft."
          : "Our restaurant offers a warm, family-friendly atmosphere with traditional Eritrean and Ethiopian hospitality.",
    },
    {
      icon: Calendar,
      title:
        language === "de"
          ? "Veranstaltungen & Feiern"
          : "Events & Party Hosting",
      description:
        language === "de"
          ? "Wir organisieren unvergessliche Feiern und Veranstaltungen mit traditioneller Küche und Service."
          : "We organize unforgettable celebrations and events with traditional cuisine and service.",
    },
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
              ? "Entdecken Sie, was uns zu Ihrem bevorzugten eritreischer und äthiopischer Restaurant macht."
              : "Discover what makes us your preferred Eritrean and Ethiopian restaurant."}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Text Block */}
          <div className="bg-gradient-to-br from-surface via-surface-elevated to-surface rounded-2xl p-10 flex flex-col justify-center text-center lg:text-left shadow-elegant border border-border/50">
            <h3 className="text-3xl font-bold text-foreground mb-6 tracking-wide">
              {language === "de"
                ? "TRADITIONELL & MODERN"
                : "TRADITIONAL & MODERN"}
            </h3>
            <p className="text-body leading-relaxed text-lg">
              {language === "de"
                ? "Wir verbinden den authentischen Geschmack der eritreisch-äthiopischen Hausmannskost mit einem modernen kulinarischen Erlebnis."
                : "We combine the authentic taste of Eritrean and Ethiopian home cooking with a modern dining experience."}
            </p>
          </div>

          {/* Image Block */}
          <div className="relative rounded-2xl overflow-hidden group shadow-elegant hover:shadow-card-hover transition-all duration-500 border border-border/50">
            <img
              src={coffeeImage}
              alt="Traditional Cooking"
              className="w-full h-full min-h-[300px] object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent flex items-end">
              <p className="text-foreground font-semibold text-lg p-8">
                {language === "de"
                  ? "Traditionelle Zubereitung"
                  : "Traditional Preparation"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
