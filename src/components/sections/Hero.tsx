import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/ui/language-switcher";
import { logger } from "@/lib/logger";
import heroImage from "@/assets/hero-restaurant.jpg?url";

interface HeroProps {
  onScrollToMenu: () => void;
}

export function Hero({ onScrollToMenu }: HeroProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <section
      id="home"
      // ✅ Optimized layout: shorter hero for better flow into "OUR MENU"
      className="relative flex items-center justify-center overflow-hidden bg-background min-h-[85vh] mt-[80px] pb-8"
    >
      {/* 🖼️ Background Image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={heroImage}
          alt="Zebib Restaurant Interior"
          // ✅ Refined image behavior — fills area naturally without cutting too much
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            logger.error("Failed to load hero image:", heroImage, e.currentTarget?.src);
          }}
          onLoad={() => {
            logger.info("Hero image loaded:", heroImage);
          }}
        />

        {/* 🔳 Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      </div>

      {/* 📝 Content */}
      <div className="relative z-10 text-center px-4 py-8 md:py-0 max-w-4xl mx-auto">
        <div className="animate-fade-in">
          {/* 🏷️ Title */}
          <h1
            className="
              text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
              font-bold text-foreground 
              mb-4 md:mb-5 tracking-wide
            "
          >
            {t("hero.title")}
          </h1>

          {/* 🧾 Subtitle */}
          <p
            className="
              text-lg sm:text-xl md:text-2xl 
              text-body mb-6 md:mb-8 
              max-w-2xl mx-auto leading-relaxed
            "
          >
            {t("hero.subtitle")}
          </p>

          {/* 🎯 CTA Buttons */}
          <div
            className="
              flex flex-col sm:flex-row gap-3 md:gap-4 
              justify-center items-center 
              mb-6 md:mb-8
            "
          >
            <Button
              onClick={() => navigate("/reserve")}
              size="lg"
              className="
                bg-accent hover:bg-accent-hover text-accent-foreground 
                font-semibold px-6 md:px-8 py-3 md:py-4 
                text-base md:text-lg transition-all duration-300 
                hover:shadow-glow min-w-[180px] md:min-w-[200px]
              "
            >
              {t("hero.cta.reserve")}
            </Button>

            <Button
              onClick={() => navigate("/order")}
              variant="outline"
              size="lg"
              className="
                border-accent text-accent hover:bg-accent hover:text-accent-foreground 
                font-semibold px-6 md:px-8 py-3 md:py-4 
                text-base md:text-lg transition-all duration-300 
                min-w-[180px] md:min-w-[200px]
              "
            >
              {t("hero.cta.order")}
            </Button>
          </div>
        </div>
      </div>

      {/* 🖱️ Scroll Down Button */}
      <button
        onClick={onScrollToMenu}
        className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 z-10 group"
        aria-label={t("hero.scroll")}
      >
        <div className="flex flex-col items-center gap-1 md:gap-2 text-body hover:text-accent transition-colors duration-300">
          <span className="text-xs md:text-sm font-medium tracking-wide uppercase">{t("hero.scroll")}</span>
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border-2 border-current flex items-center justify-center group-hover:border-accent transition-colors duration-300">
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 animate-bounce" />
          </div>
        </div>
      </button>

      {/* 🎨 Decorative Accent Bars */}
      <div className="absolute top-1/4 left-4 w-2 h-16 bg-accent/20 rounded-full hidden lg:block" />
      <div className="absolute top-1/3 right-4 w-2 h-24 bg-accent/20 rounded-full hidden lg:block" />
    </section>
  );
}
