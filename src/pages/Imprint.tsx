import { useEffect } from "react";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/sections/Footer";
import { useLanguage } from "@/components/ui/language-switcher";

export default function Imprint() {
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${t("imprint.title")} - Zebib Restaurant`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', `${t("imprint.title")} - Zebib Foods, Salzstraße 14, 63450 Hanau, Germany`);
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/imprint`);
    
    // Update hreflang tags
    let hreflangDe = document.querySelector('link[hreflang="de"]');
    if (!hreflangDe) {
      hreflangDe = document.createElement('link');
      hreflangDe.setAttribute('rel', 'alternate');
      hreflangDe.setAttribute('hreflang', 'de');
      document.head.appendChild(hreflangDe);
    }
    hreflangDe.setAttribute('href', `${window.location.origin}/imprint`);
    
    let hreflangEn = document.querySelector('link[hreflang="en"]');
    if (!hreflangEn) {
      hreflangEn = document.createElement('link');
      hreflangEn.setAttribute('rel', 'alternate');
      hreflangEn.setAttribute('hreflang', 'en');
      document.head.appendChild(hreflangEn);
    }
    hreflangEn.setAttribute('href', `${window.location.origin}/imprint`);
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Label */}
          <div className="text-center mb-8">
            <p className="text-sm text-body mb-2">{t("imprint.pageLabel")}</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {t("imprint.title")}
            </h1>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-body">
            {/* Company Info */}
            <section className="bg-surface-elevated p-6 rounded-lg space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t("imprint.company")}
                </h2>
                <p className="font-medium">Zebib Foods</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t("imprint.address")}
                </h2>
                <p>Salzstraße 14</p>
                <p>63450 Hanau, Germany</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t("imprint.contact")}
                </h2>
                <p>Email: ale@zebibfood.de</p>
                <p>Phone: +49 177 4629585</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t("imprint.responsible")}
                </h2>
                <p>Ale Tesfaldet</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t("imprint.vat")}
                </h2>
                <p>{t("imprint.vatNumber")}</p>
              </div>
            </section>

            {/* Liability Disclaimer */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("imprint.liability.title")}
              </h2>
              <p className="leading-relaxed">{t("imprint.liability.content")}</p>
            </section>

            {/* External Links */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("imprint.externalLinks.title")}
              </h2>
              <p className="leading-relaxed">{t("imprint.externalLinks.content")}</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
