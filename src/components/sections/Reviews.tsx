import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useLanguage } from "@/components/ui/language-switcher";
import { Star, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

// ✅ Import avatar images
import mariaAvatar from "@/assets/reviews/maria.jpg";
import ahmedAvatar from "@/assets/reviews/ahmed.jpg";
import thomasAvatar from "@/assets/reviews/thomas.jpg";
import sarahAvatar from "@/assets/reviews/sarah.jpg";
import jonasAvatar from "@/assets/reviews/jonas.jpg";

interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  created_at: string;
}

export function Reviews() {
  const { language } = useLanguage();
  const carouselRef = useRef<HTMLDivElement | null>(null);

  // ✅ Hardcoded reviews (max 10)
  const reviews: Review[] = [
    {
      id: "1",
      name: "Maria Schmidt",
      avatar: mariaAvatar,
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
      avatar: ahmedAvatar,
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
      avatar: thomasAvatar,
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
      avatar: sarahAvatar,
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
      avatar: jonasAvatar,
      rating: 5,
      text:
        language === "de"
          ? "Leckeres Essen und exzellenter Service. Ich komme auf jeden Fall wieder!"
          : "Delicious food and excellent service. I’ll definitely come back!",
      created_at: "2025-10-02",
    },
  ];

  const googleReviewUrl = "https://www.google.com/maps/place/ZEBIB+-+Hanau/@50.133092,8.9212194,17z";

  // ⭐ Star Renderer
  const renderStars = (rating: number) => (
    <div className="flex gap-1 mb-2">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
      ))}
    </div>
  );

  // 🎞️ Auto Slide Effect (every 6 seconds)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const nextButton = carousel.querySelector("[data-carousel-next]") as HTMLButtonElement | null;

    const interval = setInterval(() => {
      nextButton?.click();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="reviews" className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            {language === "de" ? "KUNDENBEWERTUNGEN" : "CUSTOMER REVIEWS"}
          </h2>
          <p className="text-xl text-body max-w-2xl mx-auto mb-6">
            {language === "de" ? "Was unsere Gäste über uns sagen" : "What our guests say about us"}
          </p>

          <Button variant="outline" onClick={() => window.open(googleReviewUrl, "_blank")}>
            {language === "de" ? "Mehr auf Google lesen" : "Read more on Google"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Reviews Carousel */}
        <div ref={carouselRef}>
          <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-6xl mx-auto">
            <CarouselContent>
              {reviews.map((review) => (
                <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-4">
                    <Card className="h-full hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02]">
                      <CardContent className="p-6 flex flex-col h-full">
                        {renderStars(review.rating)}
                        <p className="text-body italic mb-6 leading-relaxed">“{review.text}”</p>
                        <div className="mt-auto pt-4 border-t border-border flex items-center gap-3">
                          <img
                            src={review.avatar}
                            alt={review.name}
                            className="w-10 h-10 rounded-full object-cover border border-accent/40"
                          />
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
            <CarouselPrevious
              data-carousel-prev
              className="text-accent border-accent hover:bg-accent hover:text-accent-foreground"
            />
            <CarouselNext
              data-carousel-next
              className="text-accent border-accent hover:bg-accent hover:text-accent-foreground"
            />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
