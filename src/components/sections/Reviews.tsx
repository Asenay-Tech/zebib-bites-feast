import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  language?: string;
  isGoogle?: boolean;
  url?: string;
}

export function Reviews() {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [language]);

  const fetchReviews = async () => {
    try {
      // Fetch local reviews from database
      const { data, error } = await supabase
        .from("reviews_local")
        .select("*")
        .eq("language", language)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;

      const formattedReviews: Review[] = (data || []).map(review => ({
        id: review.id,
        name: review.name,
        rating: review.rating,
        text: review.text,
        created_at: review.created_at,
        language: review.language,
      }));

      setReviews(formattedReviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1" role="img" aria-label={`${rating} ${t("reviews.of")} 5 ${t("reviews.starsLabel")}`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-accent text-accent" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section id="reviews" className="py-20 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-body">{t("common.loading")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="py-20 bg-surface" aria-label={t("reviews.sectionLabel")}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            {t("reviews.title")}
          </h2>
          <p className="text-xl text-body max-w-2xl mx-auto mb-6">
            {t("reviews.subtitle")}
          </p>
          <Button
            variant="outline"
            onClick={() => window.open("https://www.google.com/maps/search/zebib+restaurant+hanau", "_blank")}
          >
            {t("reviews.readMoreGoogle")}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center text-body">
            <p>{t("reviews.noReviews")}</p>
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent>
              {reviews.map((review, index) => (
                <CarouselItem
                  key={review.id}
                  className="md:basis-1/2 lg:basis-1/3"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} ${t("reviews.of")} ${reviews.length}`}
                >
                  <div className="p-4">
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="mb-4">
                          {renderStars(review.rating)}
                        </div>

                        <div className="flex-1 mb-4">
                          <p className="text-body line-clamp-6 leading-relaxed">
                            "{review.text}"
                          </p>
                        </div>

                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{review.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(review.created_at),
                                  "PPP",
                                  { locale: language === "de" ? de : enUS }
                                )}
                              </p>
                            </div>
                            {review.isGoogle && review.url && (
                              <a
                                href={review.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:text-accent-hover transition-colors"
                                aria-label={t("reviews.viewOnGoogle")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
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
        )}
      </div>
    </section>
  );
}
