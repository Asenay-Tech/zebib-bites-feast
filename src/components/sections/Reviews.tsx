import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const carouselRef = useRef<HTMLDivElement | null>(null);

  // ✅ Fetch reviews from backend edge function
  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('fetch-google-reviews');
        
        if (error) {
          console.error("Error fetching reviews:", error);
          return;
        }
        
        if (data?.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews.map((r: any) => ({
            author_name: r.author_name || r.authorAttribution?.displayName || "Guest",
            profile_photo_url: r.profile_photo_url || r.authorAttribution?.photoUri || "",
            rating: r.rating,
            text: r.text?.text || r.text || "",
            time: r.time || (r.publishTime ? Math.floor(new Date(r.publishTime).getTime() / 1000) : Date.now()/1000),
          })));
        } else {
          // Fallback to local reviews in DB if Google returns none
          const { data: local, error: localErr } = await supabase
            .from('reviews_local')
            .select('*')
            .eq('language', language)
            .order('created_at', { ascending: false })
            .limit(6);
          if (!localErr && local) {
            setReviews(local.map((r: any) => ({
              author_name: r.name,
              profile_photo_url: '',
              rating: r.rating,
              text: r.text,
              time: Math.floor(new Date(r.created_at).getTime() / 1000),
            })) as Review[]);
          }
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [language]);

  // 🎞️ Auto Slide Effect (every 7 seconds for smooth viewing)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || reviews.length === 0) return;

    const nextButton = carousel.querySelector("[data-carousel-next]") as HTMLButtonElement | null;

    const interval = setInterval(() => {
      nextButton?.click();
    }, 7000); // 7 seconds per slide for comfortable reading

    return () => clearInterval(interval);
  }, [reviews]);

  // ⭐ Star Renderer
  const renderStars = (rating: number) => (
    <div className="flex gap-1 mb-2">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
      ))}
    </div>
  );

  const displayName = (name: string) => {
    if (!name) return "Guest";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
  };

  const toggleExpanded = (index: number) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const MAX_TEXT_LENGTH = 150;

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
        {loading ? (
          <div className="text-center py-12">
            <p className="text-body">{language === "de" ? "Bewertungen werden geladen..." : "Loading reviews..."}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body">{language === "de" ? "Keine Bewertungen verfügbar" : "No reviews available"}</p>
          </div>
        ) : (
          <div ref={carouselRef}>
            <Carousel opts={{ align: "start", loop: true }} className="w-full max-w-6xl mx-auto">
              <CarouselContent className="-ml-2 md:-ml-4">
              {reviews.map((review, index) => {
                const isExpanded = expandedReviews.has(index);
                const needsTruncation = review.text.length > MAX_TEXT_LENGTH;
                const displayText = isExpanded || !needsTruncation 
                  ? review.text 
                  : review.text.slice(0, MAX_TEXT_LENGTH) + "...";

                return (
                  <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <Card className="h-full hover:shadow-elegant transition-all duration-500 transform hover:scale-[1.02] bg-card border-border/50 rounded-2xl">
                        <CardContent className="p-6 flex flex-col h-full min-h-[280px]">
                          <div className="flex items-start gap-3 mb-4">
                            {review.profile_photo_url && (
                              <img
                                src={review.profile_photo_url}
                                alt={displayName(review.author_name)}
                                className="w-12 h-12 rounded-full border-2 border-accent/20 object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-foreground text-base mb-1">
                                {displayName(review.author_name)}
                              </p>
                              {renderStars(review.rating)}
                            </div>
                          </div>

                          <p className="text-body italic leading-relaxed flex-1 text-sm mb-4">
                            "{displayText}"
                          </p>

                          {needsTruncation && (
                            <button
                              onClick={() => toggleExpanded(index)}
                              className="text-accent hover:text-accent/80 text-sm font-medium transition-colors self-start mb-3"
                            >
                              {isExpanded 
                                ? (language === "de" ? "Weniger anzeigen" : "Read less")
                                : (language === "de" ? "Mehr lesen" : "Read more")
                              }
                            </button>
                          )}

                          <div className="mt-auto pt-4 border-t border-border text-xs text-muted-foreground">
                            {format(new Date(review.time * 1000), "PPP", {
                              locale: language === "de" ? de : enUS,
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

              {/* Carousel Arrows */}
              <CarouselPrevious
                data-carousel-prev
                className="text-accent border-accent/50 hover:bg-accent hover:text-accent-foreground transition-all -left-12 hidden md:flex"
              />
              <CarouselNext
                data-carousel-next
                className="text-accent border-accent/50 hover:bg-accent hover:text-accent-foreground transition-all -right-12 hidden md:flex"
              />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}
