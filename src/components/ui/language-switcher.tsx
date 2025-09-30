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
    { code: "en" as Language, label: "EN", flag: "🇬🇧" }
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
        
        // Reserve
        "reserve.title": "Tisch reservieren",
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
        "reserve.submit": "Reservierung absenden",
        "reserve.success": "Reservierung erfolgreich! Sie werden weitergeleitet...",
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
        "footer.developed": "Entwickelt von Asenay Tech",
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
        "hero.subtitle": "Authentic Eritrean Cuisine in the Heart of Hanau",
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
        
        // Common
        "common.loading": "Loading...",
        "common.error": "Error occurred",
        "common.success": "Success",
        "common.add": "Add",
        "common.remove": "Remove",
        "common.price": "Price",
        "common.total": "Total",
        
        // Footer
        "footer.developed": "Developed by Asenay Tech",
      }
    };

    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}