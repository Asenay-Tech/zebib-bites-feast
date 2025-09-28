import { useState, useEffect } from "react";
import { Header } from "@/components/navigation/Header";
import { Hero } from "@/components/sections/Hero";
import { Menu } from "@/components/sections/Menu";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Footer } from "@/components/sections/Footer";

const Index = () => {
  const [currentSection, setCurrentSection] = useState("home");

  // Handle scroll to update current section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "menu", "reserve", "order", "reviews", "contact"];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setCurrentSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />
      
      <Hero
        onScrollToMenu={() => scrollToSection("menu")}
        onReserveClick={() => scrollToSection("reserve")}
        onOrderClick={() => scrollToSection("order")}
      />
      
      <Menu />
      
      <WhyChooseUs />
      
      {/* Placeholder sections for Reserve, Order, Reviews, Contact */}
      <section id="reserve" className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">RESERVIERUNG</h2>
          <p className="text-body">Reservation system coming soon...</p>
        </div>
      </section>
      
      <section id="order" className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">BESTELLUNG</h2>
          <p className="text-body">Online ordering system coming soon...</p>
        </div>
      </section>
      
      <section id="reviews" className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">BEWERTUNGEN</h2>
          <p className="text-body">Customer reviews coming soon...</p>
        </div>
      </section>
      
      <section id="contact" className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">KONTAKT</h2>
          <p className="text-body">Contact information and map coming soon...</p>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
