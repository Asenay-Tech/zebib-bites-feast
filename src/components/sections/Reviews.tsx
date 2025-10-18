import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useLanguage } from "@/components/ui/language-switcher";
import { Star, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
}

export function Reviews() {
  const { language } = useLanguage();

  // Hardcoded reviews (max 10)
  const reviews: Review[] = [
    {
      id: "1",
      name: "Maria Schmidt",
      rating: 5,
      text:
        language === "de"
          ? "Authentisches eritreisches Essen! Die Injera war perfekt und die Gewürze exzellent. Sehr freundlicher Service."
          : "Authentic Eritrean food! The injera was perfect and the spices were excellent. Very friendly service.",
      created_at: "2025-09-30",
    },
    {
      id: "2",
      name: "Ahmed Hassan",
      rating: 5,
      text:
        language === "de"
          ? "Das beste eritreische Restaurant in der Region. Die Atmosphäre ist gemütlich und das Essen schmeckt wie zu Hause."
          : "The best Eritrean restaurant in the region. The atmosphere is cozy and the food tastes like home.",
      created_at: "2025-09-30",
    },
    {
      id: "3",
      name: "Thomas Müller",
      rating: 5,
      text:
        language === "de"
          ? "Fantastisches Essen und tolle Gastfreundschaft. Die vegetarischen Optionen sind besonders gut!"
          : "Fantastic food and great hospitality. The vegetarian options are especially good!",
      created_at: "2025-09-30",
    },
    {
      id: "4",
      name: "Sarah Klein",
      rating: 5,
      text:
        language === "de"
          ? "Ich liebe die Atmosphäre! Traditionell, aber modern eingerichtet. Sehr empfehlenswert."
          : "I love the atmosphere! Traditional yet modern design. Highly recommended.",
      created_at: "2025-10-01",
    },
    {
      id: "5",
      name: "Jonas Weber",
      rating: 5,
      text:
        language === "de"
          ? "Leckeres Essen und exzellenter Service. Ich komme auf jeden Fall wieder!"
          : "Delicious food and excellent service. I’ll definitely come back!",
      created_at: "2025-10-02",
    },
  ];

  const googleReviewUrl = "https://www.google.com/maps/search/zebib+restaurant+hanau"; // update with your exact map link

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
      ))}
    </div>
  );

  return (
    <section id="reviews" className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            {language === "de" ? "KUNDENBEWERTUNGEN" : "CUSTOMER REVIEWS"}
          </h2>
          <p className="text-xl text-body max-w-2xl mx-auto mb-6">
            {language === "de" ? "Was unsere Gäste über uns sagen" : "What our guests say about us"}
          </p>

          {/* Google Maps Button */}
          <Button variant="outline" onClick={() => window.open(googleReviewUrl, "_blank")}>
            {language === "de" ? "Mehr auf Google lesen" : "Read more on Google"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Reviews Carousel */}
        <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-6xl mx-auto">
          <CarouselContent>
            {reviews.map((review, index) => (
              <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-4">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="mb-4">{renderStars(review.rating)}</div>
                      <div className="flex-1 mb-4">
                        <p className="text-body italic leading-relaxed">“{review.text}”</p>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <div>
                          <p className="font-semibold text-foreground">{review.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), "PPP", {
                              locale: language === "de" ? de : enUS,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="text-accent border-accent hover:bg-accent hover:text-accent-foreground" />
          <CarouselNext className="text-accent border-accent hover:bg-accent hover:text-accent-foreground" />
        </Carousel>
      </div>
    </section>
  );
}
