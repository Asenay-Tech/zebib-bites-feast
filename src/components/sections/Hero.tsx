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
      // 🧩 SECTION HEIGHT & SPACING
      // ❌ Problem: min-h-screen (100vh) causes too much empty space below the hero on smaller content
      // ✅ Option 1 (recommended): reduce overall height to make transition smoother
      // className="relative flex items-center justify-center overflow-hidden bg-background min-h-[80vh] mt-[85px]"
      // ✅ Option 2 (compact look): use padding instead of full height
      // className="relative flex items-center justify-center overflow-hidden bg-background py-20 md:py-28 mt-[85px]"
      // ✅ Option 3 (dynamic spacing): keep min-h-screen but reduce top/bottom padding
      // className="relative flex items-center justify-center overflow-hidden bg-background min-h-screen pt-12 md:pt-20 mt-[70px]"
      className="relative flex items-center justify-center overflow-hidden bg-background min-h-screen mt-[85px]"
    >
      {/* 🖼️ Background Image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={heroImage}
          alt="Zebib Restaurant Interior"
          // 🧠 Image Sizing Tips:
          // ✅ object-cover = fills the section, crops excess → professional, modern look
          // ✅ object-contain = fits the whole image, may leave blank areas
          // ✅ Try these for refinement:
          // className="w-full h-full object-cover object-center"
          // className="w-full h-full object-cover object-top"
          // className="w-full h-full object-[50%_30%]" // fine-tune vertical crop manually
          className="w-full h-full object-contain object-top md:object-cover md:object-center"
          onError={(e) => {
            logger.error("Failed to load hero image:", heroImage, e.currentTarget?.src);
          }}
          onLoad={() => {
            logger.info("Hero image loaded:", heroImage);
          }}
        />

        {/* 🔳 Overlay: gradient overlay improves text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      </div>

      {/* 📝 Content Block */}
      <div className="relative z-10 text-center px-4 py-8 md:py-0 max-w-4xl mx-auto">
        <div className="animate-fade-in">
          {/* 🏷️ Title */}
          <h1
            className="
              text-4xl sm:text-5xl md:text-7xl lg:text-8xl 
              font-bold text-foreground 
              mb-4 md:mb-6 tracking-wider
            "
          >
            {t("hero.title")}
          </h1>
          {/* 💬 Suggestions:
              - If title too large on small screens, try:
                text-3xl sm:text-5xl md:text-6xl
              - If you want a more elegant, compact header:
                text-4xl sm:text-6xl md:text-7xl font-semibold
          */}

          {/* 🧾 Subtitle */}
          <p
            className="
              text-lg sm:text-xl md:text-2xl 
              text-body mb-8 md:mb-12 
              max-w-2xl mx-auto leading-relaxed
            "
          >
            {t("hero.subtitle")}
          </p>
          {/* 💬 Adjust spacing:
              - mb-6 md:mb-8 → tighter
              - mb-10 md:mb-12 → balanced
          */}

          {/* 🎯 CTA Buttons */}
          <div
            className="
              flex flex-col sm:flex-row gap-3 md:gap-4 
              justify-center items-center 
              mb-4 md:mb-10
            "
          >
            {/* 💡 Reduce spacing below buttons:
                - mb-6 md:mb-8 → compact
                - mb-10 md:mb-12 → balanced
                - mb-16 md:mb-20 → spacious */}
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
        className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10 group"
        aria-label={t("hero.scroll")}
      >
        <div className="flex flex-col items-center gap-1 md:gap-2 text-body hover:text-accent transition-colors duration-300">
          <span className="text-xs md:text-sm font-medium tracking-wide uppercase">{t("hero.scroll")}</span>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:border-accent transition-colors duration-300">
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
