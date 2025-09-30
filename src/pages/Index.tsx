import { useState, useEffect } from "react";
import { Header } from "@/components/navigation/Header";
import { Hero } from "@/components/sections/Hero";
import { Menu } from "@/components/sections/Menu";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Reviews } from "@/components/sections/Reviews";
import { Contact } from "@/components/sections/Contact";
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
      
      <Reviews />
      
      <Contact />
      
      <Footer />
    </div>
  );
};

export default Index;
