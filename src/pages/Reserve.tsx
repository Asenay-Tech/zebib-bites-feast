import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/ui/language-switcher";
import { CalendarIcon, Clock, Users, MapPin, PartyPopper, Minus, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { getBookedTables, checkTableAvailability } from "@/lib/tableAvailability";

const reservationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone must be less than 20 characters"),
  people: z.number().int().min(1, "At least 1 person required").max(20, "Maximum 20 people"),
  tableNumber: z.number().int().min(1).max(15),
  eventType: z.string().max(100).optional(),
  services: z.array(z.string()).max(10, "Too many services selected"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional()
});

const services = ["Catering", "Decorations", "DJ", "Drinks", "Venue", "Delivery"];
const eventTypes = ["Birthday", "Wedding", "Christening", "Other"];

const Reserve = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const currentHour = new Date().getHours();
  const currentMinute = Math.ceil(new Date().getMinutes() / 15) * 15;
  const [hour, setHour] = useState(
    currentHour >= 11 && currentHour <= 23 
      ? currentHour.toString().padStart(2, '0') 
      : '18'
  );
  const [minute, setMinute] = useState(
    currentMinute >= 60 ? '00' : currentMinute.toString().padStart(2, '0')
  );
  const [people, setPeople] = useState(2);
  const [tableNumber, setTableNumber] = useState("1");
  const [eventType, setEventType] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [bookedTables, setBookedTables] = useState<Array<{ tableNumber: number; bookedUntil: string }>>([]);

  useEffect(() => {
    // Check auth
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(`/login?redirect=/reserve`);
        return;
      }
      setUser(session.user);
      setEmail(session.user.email || "");
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate(`/login?redirect=/reserve`);
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check for reserved tables when date/time changes (2-hour window)
  useEffect(() => {
    const fetchBookedTables = async () => {
      if (!date) return;
      
      const timeString = `${hour}:${minute}`;
      const dateString = format(date, "yyyy-MM-dd");
      
      const booked = await getBookedTables(dateString, timeString);
      setBookedTables(booked);
    };
    
    fetchBookedTables();
  }, [date, hour, minute]);

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;

    setError("");
    setLoading(true);

    try {
      const timeString = `${hour}:${minute}`;
      const dateString = format(date, "yyyy-MM-dd");
      const selectedTableNum = parseInt(tableNumber);
      
      // Check if table is available using 2-hour slot logic
      const availability = await checkTableAvailability(selectedTableNum, dateString, timeString);
      if (!availability.available) {
        const message = availability.bookedUntil
          ? `This table is already reserved until ${availability.bookedUntil}. Please choose another table or time.`
          : "This table is already reserved for that time slot. Please choose another table or time.";
        setError(message);
        setLoading(false);
        return;
      }

      // Validate input
      const result = reservationSchema.safeParse({
        name,
        email,
        phone,
        people,
        tableNumber: selectedTableNum,
        eventType: eventType || undefined,
        services: selectedServices,
        notes: notes || undefined
      });

      if (!result.success) {
        setError(result.error.errors[0].message);
        setLoading(false);
        return;
      }
      
      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          date: dateString,
          time: timeString,
          people: result.data.people,
          table_number: result.data.tableNumber,
          event_type: result.data.eventType || null,
          services: result.data.services.length > 0 ? result.data.services : null,
          notes: result.data.notes || null,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Send confirmation email automatically
      try {
        await supabase.functions.invoke("send-reservation-confirmation", {
          body: {
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            reservationId: reservationData.id,
            date: format(date, "PPP", { locale: language === "de" ? de : enUS }),
            time: timeString,
            people: result.data.people,
            tableNumber: result.data.tableNumber,
            eventType: result.data.eventType || null,
            services: result.data.services.length > 0 ? result.data.services : null,
            notes: result.data.notes || null,
          },
        });
      } catch (emailError) {
        logger.error("Failed to send confirmation email:", emailError);
        // Don't fail the reservation if email fails
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-foreground">{t("common.loading")}</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background py-24 px-4">
      <div className="container mx-auto max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          ← {t("auth.backToHome")}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{t("reserve.title")}</CardTitle>
            <CardDescription>{t("reserve.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <Card className="max-w-md mx-4 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => setSuccess(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <CardHeader>
                    <CardTitle className="text-2xl text-accent">{t("reserve.success")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-body">{t("reserve.successMessage")}</p>
                    <Button onClick={() => navigate("/")} className="w-full">
                      {t("reserve.backToHome")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("reserve.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("reserve.namePlaceholder")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("reserve.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("reserve.emailPlaceholder")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("reserve.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("reserve.phonePlaceholder")}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("reserve.date")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: language === "de" ? de : enUS }) : t("reserve.selectDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{t("reserve.time")}</Label>
                  <div className="flex gap-2">
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }, (_, i) => i + 11).map(h => (
                          <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                            {h.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="flex items-center">:</span>
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['00', '15', '30', '45'].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("reserve.people")}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPeople(Math.max(1, people - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={people}
                      onChange={(e) => setPeople(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                      className="text-center"
                      min="1"
                      max="50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPeople(Math.min(50, people + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="table">{t("reserve.table")}</Label>
                  <Select value={tableNumber} onValueChange={setTableNumber}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map(t => {
                        const booking = bookedTables.find(b => b.tableNumber === t);
                        const isBooked = !!booking;
                        return (
                          <SelectItem 
                            key={t} 
                            value={t.toString()}
                            disabled={isBooked}
                            className={isBooked ? "opacity-50" : ""}
                          >
                            {language === "de" ? `Tisch ${t}` : `Table ${t}`}
                            {isBooked && ` (booked until ${booking.bookedUntil})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("reserve.eventType")}</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("reserve.selectEventType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {t(`reserve.eventTypes.${type.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("reserve.services")}</Label>
                <div className="flex flex-wrap gap-2">
                  {services.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        selectedServices.includes(service)
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface border border-border text-body hover:bg-surface-elevated"
                      )}
                    >
                      {t(`reserve.servicesList.${service.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("reserve.notes")}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("reserve.notesPlaceholder")}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t("common.loading")}
                  </span>
                ) : (
                  t("reserve.submit")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reserve;
