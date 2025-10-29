import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/navigation/Header";
import { Hero } from "@/components/sections/Hero";
import { Menu } from "@/components/sections/Menu";
import { Specialties } from "@/components/sections/Specialties";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Reviews } from "@/components/sections/Reviews";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

const Index = () => {
  const navigate = useNavigate();
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

  // Post-OAuth redirect handler (works on root as a fallback)
  useEffect(() => {
    const intended = localStorage.getItem("post_oauth_redirect");
    if (!intended) return;

    // 1) Listen for sign-in events
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        localStorage.removeItem("post_oauth_redirect");
        navigate(intended, { replace: true });
      }
    });

    // 2) Also check immediately in case session is already available
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.removeItem("post_oauth_redirect");
        navigate(intended, { replace: true });
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

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
      />
      
      <Menu />
      
      <Specialties />
      
      <WhyChooseUs />
      
      <Reviews />
      
      <Contact />
      
      <Footer />
    </div>
  );
};

export default Index;
