import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useLanguage } from "@/components/ui/language-switcher";
import { Star, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface Review {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  text: string;
  time: number;
}

export function Reviews() {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const googlePlaceId = "ChIJXU9TXkDUl0cRbn_fVfXQyYo"; // ZEBIB - Hanau Place ID
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // ✅ Fetch real Google reviews (top 15, 5-star only)
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=reviews&key=${apiKey}`,
        );
        const data = await response.json();
        if (data.result?.reviews) {
          const topReviews = data.result.reviews.filter((r: Review) => r.rating === 5).slice(0, 15);
          setReviews(topReviews);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    }
    fetchReviews();
  }, []);

  // 🎞️ Auto Slide Effect (every 5 seconds)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const nextButton = carousel.querySelector("[data-carousel-next]") as HTMLButtonElement | null;

    const interval = setInterval(() => {
      nextButton?.click();
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, []);

  // ⭐ Star Renderer
  const renderStars = (rating: number) => (
    <div className="flex gap-1 mb-2">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
      ))}
    </div>
  );

  const googleReviewUrl = "https://www.google.com/maps/place/ZEBIB+-+Hanau/@50.1330932,8.9212194,17z";

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

          {/* Google Maps Button */}
          <Button variant="outline" onClick={() => window.open(googleReviewUrl, "_blank")}>
            {language === "de" ? "Mehr auf Google lesen" : "Read more on Google"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Review Cards Carousel */}
        <div ref={carouselRef}>
          <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-6xl mx-auto">
            <CarouselContent>
              {reviews.map((review, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-4">
                    <Card className="h-full hover:shadow-lg transition-all duration-500 transform hover:scale-[1.02]">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={review.profile_photo_url}
                            alt={review.author_name}
                            className="w-10 h-10 rounded-full border border-border"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{review.author_name}</p>
                            {renderStars(review.rating)}
                          </div>
                        </div>

                        <p className="text-body italic mb-4 leading-relaxed">“{review.text}”</p>

                        <div className="mt-auto pt-4 border-t border-border text-sm text-muted-foreground">
                          {format(new Date(review.time * 1000), "PPP", {
                            locale: language === "de" ? de : enUS,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Carousel Arrows */}
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
