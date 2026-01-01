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
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  return (
    <section
      id="home"
      className="
        relative flex flex-col md:items-center md:justify-center 
        overflow-hidden bg-background 
        mt-[65px] sm:mt-[70px] md:mt-[85px]
        pb-0 md:min-h-screen
      "
    >
      {/* 🖼️ Background Image */}
      <div className="relative md:absolute md:inset-0 w-full h-[32vh] sm:h-[36vh] md:h-full flex items-center justify-center">
        <img
          src={heroImage}
          alt="Zebib Restaurant Interior"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            logger.error(
              "Failed to load hero image:",
              heroImage,
              e.currentTarget?.src
            );
          }}
          onLoad={() => {
            logger.info("Hero image loaded:", heroImage);
          }}
        />

        {/* Overlay for readability on desktop */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      </div>

      {/* 📝 Content */}
      <div className="relative z-10 text-center px-4 py-6 md:py-0 max-w-4xl mx-auto">
        <div className="animate-fade-in">
          {/* Title */}
          <h1
            className="
              text-4xl sm:text-5xl md:text-7xl lg:text-8xl 
              font-bold text-foreground 
              mb-3 md:mb-5 tracking-wider
            "
          >
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p
            className="
              text-lg sm:text-xl md:text-2xl 
              text-body mb-6 md:mb-8 
              max-w-2xl mx-auto leading-relaxed
            "
          >
            {t("hero.subtitle")}
          </p>

          {/* Permanently Closed Notice */}
          <div
            className="
              flex flex-col gap-2 md:gap-4
              justify-center items-center 
              mb-1 md:mb-4
            "
          >
            <div className="bg-destructive/90 text-destructive-foreground px-6 py-3 rounded-lg">
              <p className="text-lg md:text-xl font-semibold">
                {language === "de" ? "Dauerhaft Geschlossen" : "Permanently Closed"}
              </p>
            </div>
            <p className="text-body text-sm md:text-base max-w-md">
              {language === "de" 
                ? "Vielen Dank für Ihre Unterstützung über die Jahre."
                : "Thank you for your support over the years."
              }
            </p>
          </div>
        </div>
      </div>

      {/* 🖱️ Scroll Down Button */}
      <div className="relative mt-0 md:absolute md:bottom-4 md:left-1/2 md:-translate-x-1/2 z-20">
        <button
          onClick={onScrollToMenu}
          className="group mx-auto block"
          aria-label={t("hero.scroll")}
        >
          <div className="flex flex-col items-center gap-1 md:gap-2 text-body hover:text-accent transition-colors duration-300">
            <span className="hidden md:block text-xs md:text-sm font-medium tracking-wide uppercase">
              {t("hero.scroll")}
            </span>
            <div className="w-12 h-12 md:w-12 md:h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:border-accent transition-colors duration-300 bg-background/80 backdrop-blur-sm">
              <ChevronDown className="w-5 h-5 md:w-5 md:h-5 animate-bounce" />
            </div>
          </div>
        </button>
      </div>

      {/* 🎨 Decorative Bars */}
      <div className="absolute top-1/4 left-4 w-2 h-16 bg-accent/20 rounded-full hidden lg:block" />
      <div className="absolute top-1/3 right-4 w-2 h-24 bg-accent/20 rounded-full hidden lg:block" />
    </section>
  );
}
