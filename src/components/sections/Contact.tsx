import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/ui/language-switcher";
import { MapPin, Phone, Mail, Clock, Navigation, Menu as MenuIcon } from "lucide-react";

export function Contact() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { error: submitError } = await supabase
        .from("contact_messages")
        .insert({
          name,
          email,
          phone: phone || null,
          subject,
          message,
        });

      if (submitError) throw submitError;

      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-wide">
            {t("contact.title")}
          </h2>
          <p className="text-xl text-body max-w-2xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Card - Contact Info */}
          <Card>
            <CardContent className="p-8 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  {t("contact.info")}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{t("contact.address")}</p>
                      <p className="text-body">Salzstraße 14</p>
                      <p className="text-body">63450 Hanau, Deutschland</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{t("contact.phone")}</p>
                      <a href="tel:+4917746295" className="text-body hover:text-accent transition-colors">
                        +49 177 4629585
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{t("contact.email")}</p>
                      <a href="mailto:info@zebib-restaurant.de" className="text-body hover:text-accent transition-colors">
                        info@zebib-restaurant.de
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{t("contact.hours")}</p>
                      <p className="text-body">{t("info.hours")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <Button
                  className="w-full"
                  onClick={() => window.open("https://maps.google.com/?q=Salzstraße+14,+63450+Hanau", "_blank")}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  {t("contact.getDirections")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Card - Contact Form */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                {t("contact.form")}
              </h3>

              {success && (
                <div className="bg-accent/10 text-accent p-4 rounded-md mb-6">
                  {t("contact.success")}
                </div>
              )}
              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">{t("contact.name")}</Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("contact.namePlaceholder")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">{t("contact.emailLabel")}</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("contact.emailPlaceholder")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">{t("contact.phoneLabel")} ({t("contact.optional")})</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("contact.phonePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-subject">{t("contact.subject")}</Label>
                  <Input
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t("contact.subjectPlaceholder")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">{t("contact.message")}</Label>
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("contact.messagePlaceholder")}
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("common.loading") : t("contact.send")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="mt-12 max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2551.5!2d8.91861!3d50.13167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bd0e3c8b3f0001%3A0x1!2sSalzstra%C3%9Fe%2014%2C%2063450%20Hanau!5e0!3m2!1sde!2sde!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0, filter: "grayscale(20%)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
