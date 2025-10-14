import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/ui/language-switcher";


interface HeroProps {
  onScrollToMenu: () => void;
}

export function Hero({ onScrollToMenu }: HeroProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <section
      id="home"
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero-restaurant.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/10 to-background/60" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="animate-fade-in">
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 tracking-wider">
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-body mb-12 max-w-2xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              onClick={() => navigate("/reserve")}
              size="lg"
              className="bg-accent hover:bg-accent-hover text-accent-foreground font-semibold px-8 py-4 text-lg transition-all duration-300 hover:shadow-glow min-w-[200px]"
            >
              {t("hero.cta.reserve")}
            </Button>

            <Button
              onClick={() => navigate("/order")}
              variant="outline"
              size="lg"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-semibold px-8 py-4 text-lg transition-all duration-300 min-w-[200px]"
            >
              {t("hero.cta.order")}
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Down Button */}
      <button
        onClick={onScrollToMenu}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 group"
        aria-label={t("hero.scroll")}
      >
        <div className="flex flex-col items-center gap-2 text-body hover:text-accent transition-colors duration-300">
          <span className="text-sm font-medium tracking-wide uppercase">
            {t("hero.scroll")}
          </span>
          <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:border-accent transition-colors duration-300">
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </button>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-4 w-2 h-16 bg-accent/20 rounded-full hidden lg:block" />
      <div className="absolute top-1/3 right-4 w-2 h-24 bg-accent/20 rounded-full hidden lg:block" />
    </section>
  );
}
