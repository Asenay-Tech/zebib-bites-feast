import { useLanguage } from "@/components/ui/language-switcher";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const socialLinks = [
    // { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "https://www.instagram.com/zebib.official?igsh=YTRvYzRqdDRwN3py", label: "Instagram" },
    // { icon: Twitter, href: "#", label: "Twitter" },
    // {
    //   icon: () => (
    //     <svg
    //       className="w-6 h-6"
    //       fill="currentColor"
    //       viewBox="0 0 24 24"
    //       aria-hidden="true"
    //     >
    //       <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.042-3.441.219-.937 1.404-5.945 1.404-5.945s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
    //     </svg>
    //   ),
    //   href: "#",
    //   label: "TikTok",
    // },
  ];

  return (
    <footer className="bg-surface border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Restaurant Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">ZEBIB</h3>
            <div className="space-y-2 text-body">
              {/* use translated address line */}
              <p>{t("info.address")}</p>
              {/* optional: show phone/email labels translated */}
              <p>{t("contact.phone")}: +49 177 4629585</p>
              <p>{t("contact.email")}: info@zebib-restaurant.de</p>
            </div>
          </div>

          {/* Opening Hours (inline, zero gap) */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              {t("info.hours")}
            </h4>

            <div className="space-y-2 text-body">
              <p>
                <span>{t("footer.hours.monThu")}</span>
                <span className="font-mono tabular-nums"> 11:00 – 22:00</span>
              </p>
              <p>
                <span>{t("footer.hours.friSat")}</span>
                <span className="font-mono tabular-nums"> 11:00 – 23:00</span>
              </p>
              <p>
                <span>{t("footer.hours.sun")}</span>
                <span className="font-mono tabular-nums"> 12:00 – 22:00</span>
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              {t("footer.followUs")}
            </h4>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-surface-elevated rounded-full flex items-center justify-center text-body hover:text-accent hover:bg-accent/10 transition-colors duration-300"
                    aria-label={social.label}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-body text-sm">
            {/* dynamic year + translated rights text */}© {year} Zebib
            Restaurant. {t("footer.rights")}
          </p>

          <div className="flex items-center gap-6 text-sm text-body">
            <a href="/privacy" className="hover:text-accent transition-colors">
              {t("footer.privacy")}
            </a>
            <a href="/imprint" className="hover:text-accent transition-colors">
              {t("footer.imprint")}
            </a>
            {/* <span>{t("footer.developed")}</span> */}
            <span className="text-sm text-body">
              <Trans i18nKey="footer.developed">
                Developed by <a href="https://asenaytech.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent font-semibold">Asenay Tech</a>
              </Trans>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
