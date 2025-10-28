import { useEffect } from "react";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/sections/Footer";
import { useLanguage } from "@/components/ui/language-switcher";

export default function Privacy() {
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${t("privacy.title")} - Zebib Restaurant`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', t("privacy.intro.content"));
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/privacy`);
    
    // Update hreflang tags
    let hreflangDe = document.querySelector('link[hreflang="de"]');
    if (!hreflangDe) {
      hreflangDe = document.createElement('link');
      hreflangDe.setAttribute('rel', 'alternate');
      hreflangDe.setAttribute('hreflang', 'de');
      document.head.appendChild(hreflangDe);
    }
    hreflangDe.setAttribute('href', `${window.location.origin}/privacy`);
    
    let hreflangEn = document.querySelector('link[hreflang="en"]');
    if (!hreflangEn) {
      hreflangEn = document.createElement('link');
      hreflangEn.setAttribute('rel', 'alternate');
      hreflangEn.setAttribute('hreflang', 'en');
      document.head.appendChild(hreflangEn);
    }
    hreflangEn.setAttribute('href', `${window.location.origin}/privacy`);
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Label */}
          <div className="text-center mb-8">
            <p className="text-sm text-body mb-2">{t("privacy.pageLabel")}</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {t("privacy.title")}
            </h1>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-body">
            {/* Intro */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.intro.title")}
              </h2>
              <p className="leading-relaxed">{t("privacy.intro.content")}</p>
            </section>

            {/* Data Collected */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.collected.title")}
              </h2>
              <p className="leading-relaxed">{t("privacy.collected.content")}</p>
            </section>

            {/* Purpose */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.purpose.title")}
              </h2>
              <p className="leading-relaxed">{t("privacy.purpose.content")}</p>
            </section>

            {/* Legal Basis */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.legal.title")}
              </h2>
              <p className="leading-relaxed">{t("privacy.legal.content")}</p>
            </section>

            {/* Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.retention.title")}
              </h2>
              <p className="leading-relaxed">{t("privacy.retention.content")}</p>
            </section>

            {/* Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.rights.title")}
              </h2>
              <p className="leading-relaxed">{t("privacy.rights.content")}</p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.cookies.title")}
              </h2>
              <p className="leading-relaxed">{t("privacy.cookies.content")}</p>
            </section>

            {/* Controller/Contact */}
            <section className="bg-surface-elevated p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.controller.title")}
              </h2>
              <div className="space-y-2">
                <p className="font-medium">{t("privacy.controller.name")}</p>
                <p>{t("privacy.controller.address")}</p>
                <p>{t("privacy.controller.email")}</p>
                <p>{t("privacy.controller.phone")}</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
