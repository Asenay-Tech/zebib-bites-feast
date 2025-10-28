import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export type Language = "de" | "en";

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  className?: string;
}

export function LanguageSwitcher({ currentLanguage, onLanguageChange, className }: LanguageSwitcherProps) {
  const languages = [
    { code: "de" as Language, label: "DE", flag: "🇩🇪" },
    { code: "en" as Language, label: "EN", flag: "🇬🇧" },
  ];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Globe className="h-4 w-4 text-body mr-1" />
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLanguage === lang.code ? "default" : "ghost"}
          size="sm"
          onClick={() => onLanguageChange(lang.code)}
          className={`h-8 px-2 text-xs font-medium transition-colors ${
            currentLanguage === lang.code
              ? "bg-accent text-accent-foreground"
              : "text-body hover:text-foreground hover:bg-surface-elevated"
          }`}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.label}
        </Button>
      ))}
    </div>
  );
}

// Language context and hook for managing language state
import { createContext, useContext, ReactNode } from "react";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("de");

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("zebib-language") as Language;
    if (saved && (saved === "de" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("zebib-language", newLanguage);
    // Update document lang attribute for SEO
    document.documentElement.lang = newLanguage;
  };

  // Simple translation function - in a real app you'd use i18next or similar
  const t = (key: string): string => {
    const translations: Record<Language, Record<string, string>> = {
      de: {
        // Navigation
        "nav.home": "Startseite",
        "nav.menu": "Speisekarte",
        "nav.reserve": "Reservieren",
        "nav.order": "Bestellen",
        "nav.reviews": "Bewertungen",
        "nav.contact": "Kontakt",

        // Hero Section
        "hero.title": "ZEBIB RESTAURANT",
        "hero.subtitle": "Authentische eritreische Küche im Herzen von Hanau",
        "hero.cta.reserve": "Tisch Reservieren",
        "hero.cta.order": "Online Bestellen",
        "hero.scroll": "Zur Speisekarte",

        // Info Bar
        "info.address": "Salzstraße 14, 63450 Hanau",
        "info.directions": "Route Anzeigen",
        "info.hours": "Täglich 11:00 - 23:00",
        "info.phone": "+49 177 4629585",

        // Menu Section
        "menu.title": "UNSERE SPEISEKARTE",
        "menu.subtitle": "Entdecken Sie die Aromen Eritreas",
        "menu.category.all": "Alle",

        // Auth
        "auth.login": "Anmelden",
        "auth.register": "Registrieren",
        "auth.logout": "Abmelden",
        "auth.logoutSuccess": "Erfolgreich abgemeldet",
        "auth.email": "E-Mail",
        "auth.password": "Passwort",
        "auth.confirmPassword": "Passwort bestätigen",
        "auth.name": "Name",
        "auth.loginDescription": "Melden Sie sich an, um Reservierungen vorzunehmen und Bestellungen aufzugeben",
        "auth.registerDescription": "Erstellen Sie ein Konto, um unsere Services zu nutzen",
        "auth.emailPlaceholder": "ihre@email.de",
        "auth.passwordPlaceholder": "Ihr Passwort",
        "auth.confirmPasswordPlaceholder": "Passwort wiederholen",
        "auth.namePlaceholder": "Ihr vollständiger Name",
        "auth.noAccount": "Noch kein Konto?",
        "auth.hasAccount": "Bereits ein Konto?",
        "auth.backToHome": "Zurück zur Startseite",
        "auth.passwordMismatch": "Passwörter stimmen nicht überein",
        "auth.passwordTooShort": "Passwort muss mindestens 6 Zeichen lang sein",
        "auth.profile": "Profil",
        "auth.orders": "Bestellungen",
        "auth.reservations": "Reservierungen",
        "auth.forgotPassword": "Passwort vergessen?",
        "auth.sendResetLink": "Link zum Zurücksetzen senden",
        "auth.resetLinkSent": "Passwort-Zurücksetzungslink gesendet. Bitte prüfen Sie Ihre E-Mails.",
        "auth.resetPassword": "Passwort zurücksetzen",
        "auth.resetPasswordDescription": "Legen Sie ein neues Passwort für Ihr Konto fest.",
        "auth.resetPasswordHelp": "Geben Sie Ihre Konto-E-Mail ein; wir senden Ihnen einen Link zum Zurücksetzen.",
        "auth.newPassword": "Neues Passwort",
        "auth.updatePassword": "Passwort aktualisieren",
        "auth.backToLogin": "Zurück zur Anmeldung",

        // Reserve
        "reserve.title": "Reservieren",
        "reserve.description": "Reservieren Sie Ihren Tisch im Zebib Restaurant",
        "reserve.name": "Name",
        "reserve.email": "E-Mail",
        "reserve.phone": "Telefon",
        "reserve.date": "Datum",
        "reserve.time": "Uhrzeit",
        "reserve.people": "Anzahl Personen",
        "reserve.table": "Tischnummer",
        "reserve.eventType": "Veranstaltungstyp",
        "reserve.services": "Zusätzliche Services",
        "reserve.notes": "Anmerkungen",
        "reserve.namePlaceholder": "Ihr vollständiger Name",
        "reserve.emailPlaceholder": "ihre@email.de",
        "reserve.phonePlaceholder": "+49 ...",
        "reserve.selectDate": "Datum wählen",
        "reserve.selectEventType": "Wählen Sie einen Veranstaltungstyp",
        "reserve.notesPlaceholder": "Besondere Wünsche oder Allergien...",
        "reserve.submit": "Reservieren",
        "reserve.success": "Reservierung erfolgreich!",
        "reserve.successMessage": "Ihre Reservierung wurde erfolgreich erstellt. Wir freuen uns auf Ihren Besuch!",
        "reserve.backToHome": "Zurück zur Startseite",
        "reserve.tableAlreadyReserved":
          "Dieser Tisch ist zu dieser Zeit bereits reserviert. Bitte wählen Sie einen anderen Tisch oder eine andere Zeit.",
        "reserve.eventTypes.birthday": "Geburtstag",
        "reserve.eventTypes.wedding": "Hochzeit",
        "reserve.eventTypes.christening": "Taufe",
        "reserve.eventTypes.other": "Andere",
        "reserve.servicesList.catering": "Catering",
        "reserve.servicesList.decorations": "Dekoration",
        "reserve.servicesList.dj": "DJ",
        "reserve.servicesList.drinks": "Getränke",
        "reserve.servicesList.venue": "Location",
        "reserve.servicesList.delivery": "Lieferung",

        // Order
        "order.title": "Online bestellen",
        "order.pickup": "Abholung",
        "order.dineIn": "Im Restaurant",
        "order.cart": "Warenkorb",
        "order.emptyCart": "Ihr Warenkorb ist leer",
        "order.checkout": "Zur Kasse",

        // Contact
        "contact.title": "KONTAKT",
        "contact.subtitle": "Wir freuen uns von Ihnen zu hören",
        "contact.info": "Kontaktinformationen",
        "contact.address": "Adresse",
        "contact.phone": "Telefon",
        "contact.email": "E-Mail",
        "contact.hours": "Öffnungszeiten",
        "contact.getDirections": "Route anzeigen",
        "contact.viewMenu": "Speisekarte ansehen",
        "contact.form": "Kontaktformular",
        "contact.name": "Name",
        "contact.emailLabel": "E-Mail",
        "contact.phoneLabel": "Telefon",
        "contact.subject": "Betreff",
        "contact.message": "Nachricht",
        "contact.optional": "optional",
        "contact.namePlaceholder": "Ihr Name",
        "contact.emailPlaceholder": "ihre@email.de",
        "contact.phonePlaceholder": "+49 ...",
        "contact.subjectPlaceholder": "Worum geht es?",
        "contact.messagePlaceholder": "Ihre Nachricht an uns...",
        "contact.send": "Nachricht senden",
        "contact.success": "Nachricht erfolgreich gesendet!",

        // Reviews
        "reviews.title": "KUNDENBEWERTUNGEN",
        "reviews.subtitle": "Was unsere Gäste über uns sagen",
        "reviews.readMoreGoogle": "Mehr auf Google lesen",
        "reviews.noReviews": "Noch keine Bewertungen vorhanden",
        "reviews.starsLabel": "Sternen",
        "reviews.of": "von",
        "reviews.sectionLabel": "Kundenbewertungen Karussell",
        "reviews.viewOnGoogle": "Auf Google ansehen",

        // Common
        "common.loading": "Lädt...",
        "common.error": "Fehler aufgetreten",
        "common.success": "Erfolgreich",
        "common.add": "Hinzufügen",
        "common.remove": "Entfernen",
        "common.price": "Preis",
        "common.total": "Gesamt",

        // Footer
        "footer.developed": "Entwickelt von ",
        "footer.followUs": "Folgen Sie uns",
        "footer.rights": "Alle Rechte vorbehalten.",
        "footer.privacy": "Datenschutz",
        "footer.imprint": "Impressum",
        "footer.hours.monThu": "Montag – Donnerstag:",
        "footer.hours.friSat": "Freitag – Samstag:",
        "footer.hours.sun": "Sonntag:",

        // Privacy Policy
        "privacy.title": "Datenschutzerklärung",
        "privacy.pageLabel": "Datenschutzerklärung / Privacy Policy",
        "privacy.intro.title": "Datenschutz im Überblick",
        "privacy.intro.content": "Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003). In dieser Datenschutzerklärung informieren wir Sie über die wichtigsten Aspekte der Datenverarbeitung.",
        "privacy.collected.title": "Welche Daten sammeln wir?",
        "privacy.collected.content": "Wir erfassen folgende personenbezogene Daten: Name, E-Mail-Adresse, Telefonnummer, Bestelldetails und Zahlungsstatus. Optional erfassen wir Analysedaten und Cookies zur Verbesserung unserer Dienste.",
        "privacy.purpose.title": "Zweck der Datenverarbeitung",
        "privacy.purpose.content": "Ihre Daten werden ausschließlich zur Bestellabwicklung, zum Versand von Bestellbestätigungen und zur Kundenbetreuung verwendet. Wir verkaufen Ihre Daten nicht an Dritte. Eine Weitergabe erfolgt nur an Zahlungs- und Lieferdienstleister, soweit dies für die Auftragsabwicklung erforderlich ist.",
        "privacy.legal.title": "Rechtsgrundlage",
        "privacy.legal.content": "Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse), soweit anwendbar.",
        "privacy.retention.title": "Speicherdauer",
        "privacy.retention.content": "Ihre Daten werden nur so lange gespeichert, wie dies für die Erfüllung rechtlicher und buchhalterischer Verpflichtungen erforderlich ist.",
        "privacy.rights.title": "Ihre Rechte",
        "privacy.rights.content": "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Zudem haben Sie das Recht, sich bei einer Aufsichtsbehörde zu beschweren.",
        "privacy.cookies.title": "Cookies und Analyse",
        "privacy.cookies.content": "Wir verwenden Cookies, um die Funktionalität unserer Website zu gewährleisten. Sofern Analysetools eingesetzt werden, informieren wir Sie gesondert.",
        "privacy.controller.title": "Verantwortliche Stelle",
        "privacy.controller.name": "Zebib Foods",
        "privacy.controller.address": "Salzstraße 14, 63450 Hanau, Germany",
        "privacy.controller.email": "E-Mail: ale@zebibfood.de",
        "privacy.controller.phone": "Telefon: +49 177 4629585",

        // Imprint
        "imprint.title": "Impressum",
        "imprint.pageLabel": "Impressum / Imprint",
        "imprint.company": "Unternehmen",
        "imprint.owner": "Inhaberin",
        "imprint.address": "Anschrift",
        "imprint.contact": "Kontakt",
        "imprint.responsible": "Verantwortlich gemäß § 18 Abs. 2 MStV",
        "imprint.vat": "USt-ID Nr.",
        "imprint.vatNumber": "DE450260438",
        "imprint.disclaimer.title": "Haftungsausschluss",
        "imprint.disclaimer.content": "Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.",
        "imprint.externalLinks.content": "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.",
      },

      en: {
        // Navigation
        "nav.home": "Home",
        "nav.menu": "Menu",
        "nav.reserve": "Reserve",
        "nav.order": "Order",
        "nav.reviews": "Reviews",
        "nav.contact": "Contact",

        // Hero Section
        "hero.title": "ZEBIB RESTAURANT",
        "hero.subtitle": "Authentic Eritrean cuisine in the heart of Hanau",
        "hero.cta.reserve": "Make Reservation",
        "hero.cta.order": "Order Online",
        "hero.scroll": "View Menu",

        // Info Bar
        "info.address": "Salzstraße 14, 63450 Hanau",
        "info.directions": "Get Directions",
        "info.hours": "Daily 11:00 AM - 11:00 PM",
        "info.phone": "+49 177 4629585",

        // Menu Section
        "menu.title": "OUR MENU",
        "menu.subtitle": "Discover the Flavors of Eritrea",
        "menu.category.all": "All",

        // Auth
        "auth.login": "Login",
        "auth.register": "Sign up",
        "auth.logout": "Logout",
        "auth.logoutSuccess": "Logged out successfully",
        "auth.email": "Email",
        "auth.password": "Password",
        "auth.confirmPassword": "Confirm password",
        "auth.name": "Name",
        "auth.loginDescription": "Sign in to make reservations and place orders",
        "auth.registerDescription": "Create an account to use our services",
        "auth.emailPlaceholder": "your@email.com",
        "auth.passwordPlaceholder": "Your password",
        "auth.confirmPasswordPlaceholder": "Confirm your password",
        "auth.namePlaceholder": "Your full name",
        "auth.noAccount": "Don't have an account yet?",
        "auth.hasAccount": "Already have an account?",
        "auth.backToHome": "Back to Home",
        "auth.passwordMismatch": "Passwords do not match",
        "auth.passwordTooShort": "Password must be at least 6 characters long",
        "auth.profile": "Profile",
        "auth.orders": "Orders",
        "auth.reservations": "Reservations",
        "auth.forgotPassword": "Forgot password?",
        "auth.sendResetLink": "Send reset link",
        "auth.resetLinkSent": "Password reset link sent. Please check your email.",
        "auth.resetPassword": "Reset password",
        "auth.resetPasswordDescription": "Set a new password for your account.",
        "auth.resetPasswordHelp": "Enter your account email and we’ll email you a reset link.",
        "auth.newPassword": "New password",
        "auth.updatePassword": "Update password",
        "auth.backToLogin": "Back to login",

        // Reserve
        "reserve.title": "Make a Reservation",
        "reserve.description": "Reserve your table at Zebib Restaurant",
        "reserve.name": "Name",
        "reserve.email": "Email",
        "reserve.phone": "Phone",
        "reserve.date": "Date",
        "reserve.time": "Time",
        "reserve.people": "Number of People",
        "reserve.table": "Table Selection",
        "reserve.eventType": "Event Type",
        "reserve.services": "Additional Services",
        "reserve.notes": "Notes",
        "reserve.namePlaceholder": "Your full name",
        "reserve.emailPlaceholder": "your@email.com",
        "reserve.phonePlaceholder": "+49 ...",
        "reserve.selectDate": "Select date",
        "reserve.selectEventType": "Choose an event type",
        "reserve.notesPlaceholder": "Special requests or allergies...",
        "reserve.submit": "Reserve",
        "reserve.success": "Reservation successful!",
        "reserve.successMessage": "Your reservation has been created successfully. We look forward to your visit!",
        "reserve.backToHome": "Back to Home",
        "reserve.tableAlreadyReserved":
          "This table is already reserved at this time. Please choose another table or time.",
        "reserve.eventTypes.birthday": "Birthday",
        "reserve.eventTypes.wedding": "Wedding",
        "reserve.eventTypes.christening": "Christening",
        "reserve.eventTypes.other": "Other",
        "reserve.servicesList.catering": "Catering",
        "reserve.servicesList.decorations": "Decorations",
        "reserve.servicesList.dj": "DJ",
        "reserve.servicesList.drinks": "Drinks",
        "reserve.servicesList.venue": "Venue",
        "reserve.servicesList.delivery": "Delivery",

        // Order
        "order.title": "Order Online",
        "order.pickup": "Pickup",
        "order.dineIn": "Dine-In",
        "order.cart": "Your Cart",
        "order.emptyCart": "Your cart is empty",
        "order.checkout": "Proceed to Checkout",

        // Contact
        "contact.title": "CONTACT",
        "contact.subtitle": "We'd love to hear from you",
        "contact.info": "Contact Information",
        "contact.address": "Address",
        "contact.phone": "Phone",
        "contact.email": "Email",
        "contact.hours": "Opening Hours",
        "contact.getDirections": "Get Directions",
        "contact.viewMenu": "View Menu",
        "contact.form": "Contact Form",
        "contact.name": "Name",
        "contact.emailLabel": "Email",
        "contact.phoneLabel": "Phone",
        "contact.subject": "Subject",
        "contact.message": "Message",
        "contact.optional": "optional",
        "contact.namePlaceholder": "Your Name",
        "contact.emailPlaceholder": "your@email.com",
        "contact.phonePlaceholder": "+49 ...",
        "contact.subjectPlaceholder": "What's this about?",
        "contact.messagePlaceholder": "Your message to us...",
        "contact.send": "Send Message",
        "contact.success": "Message sent successfully!",

        // Reviews
        "reviews.title": "CUSTOMER REVIEWS",
        "reviews.subtitle": "What our guests say about us",
        "reviews.readMoreGoogle": "Read more on Google",
        "reviews.noReviews": "No reviews yet",
        "reviews.starsLabel": "stars",
        "reviews.of": "of",
        "reviews.sectionLabel": "Customer Reviews Carousel",
        "reviews.viewOnGoogle": "View on Google",

        // Common
        "common.loading": "Loading...",
        "common.error": "Error occurred",
        "common.success": "Success",
        "common.add": "Add",
        "common.remove": "Remove",
        "common.price": "Price",
        "common.total": "Total",

        // Footer
        "footer.developed": "Developed by ",
        "footer.followUs": "Follow us",
        "footer.rights": "All rights reserved.",
        "footer.privacy": "Privacy Policy",
        "footer.imprint": "Imprint",
        "footer.hours.monThu": "Monday – Thursday:",
        "footer.hours.friSat": "Friday – Saturday:",
        "footer.hours.sun": "Sunday:",

        // Privacy Policy
        "privacy.title": "Privacy Policy",
        "privacy.pageLabel": "Privacy Policy / Datenschutzerklärung",
        "privacy.intro.title": "Privacy Overview",
        "privacy.intro.content": "The protection of your personal data is of special concern to us. We process your data exclusively on the basis of legal regulations (GDPR, TKG 2003). In this privacy policy, we inform you about the most important aspects of data processing.",
        "privacy.collected.title": "What Data Do We Collect?",
        "privacy.collected.content": "We collect the following personal data: name, email address, phone number, order details, and payment status. Optionally, we collect analytics data and cookies to improve our services.",
        "privacy.purpose.title": "Purpose of Data Processing",
        "privacy.purpose.content": "Your data is used exclusively for order processing, sending order confirmations, and customer support. We do not sell your data to third parties. Data is shared only with payment and delivery service providers as required for order fulfillment.",
        "privacy.legal.title": "Legal Basis",
        "privacy.legal.content": "Processing is based on Art. 6 (1) lit. b GDPR (contract performance) and Art. 6 (1) lit. f GDPR (legitimate interest), where applicable.",
        "privacy.retention.title": "Data Retention",
        "privacy.retention.content": "Your data is stored only as long as necessary to fulfill legal and accounting obligations.",
        "privacy.rights.title": "Your Rights",
        "privacy.rights.content": "You have the right to access, rectification, deletion, restriction of processing, data portability, and objection. You also have the right to lodge a complaint with a supervisory authority.",
        "privacy.cookies.title": "Cookies and Analytics",
        "privacy.cookies.content": "We use cookies to ensure the functionality of our website. If analytics tools are used, we inform you separately.",
        "privacy.controller.title": "Data Controller",
        "privacy.controller.name": "Zebib Foods",
        "privacy.controller.address": "Salzstraße 14, 63450 Hanau, Germany",
        "privacy.controller.email": "Email: ale@zebibfood.de",
        "privacy.controller.phone": "Phone: +49 177 4629585",

        // Imprint
        "imprint.title": "Imprint",
        "imprint.pageLabel": "Imprint / Impressum",
        "imprint.company": "Company",
        "imprint.owner": "Owner",
        "imprint.address": "Address",
        "imprint.contact": "Contact",
        "imprint.responsible": "Responsible for content under § 18 Abs. 2 MStV",
        "imprint.vat": "VAT ID",
        "imprint.vatNumber": "DE450260438",
        "imprint.disclaimer.title": "Disclaimer",
        "imprint.disclaimer.content": "The contents of this website were created with great care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content. Despite careful control of external links, we assume no liability for the content of external websites. The operators of linked pages are solely responsible for their content.",
        "imprint.externalLinks.content": "Our website contains links to external third-party websites over whose content we have no control. The respective provider is always responsible for the content of the linked pages.",
      },
    };

    return translations[language][key] || key;
  };

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
