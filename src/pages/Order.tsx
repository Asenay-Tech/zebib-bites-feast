import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/ui/language-switcher";
import { XCircle } from "lucide-react";

const Order = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background py-24 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          ← {language === "de" ? "Zurück zur Startseite" : "Back to Home"}
        </Button>

        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-3xl text-destructive">
              {language === "de" ? "Dauerhaft Geschlossen" : "Permanently Closed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body text-lg">
              {language === "de" 
                ? "Wir bedauern Ihnen mitteilen zu müssen, dass unser Restaurant dauerhaft geschlossen ist. Online-Bestellungen und Zahlungen sind nicht mehr möglich."
                : "We regret to inform you that our restaurant is permanently closed. Online ordering and payments are no longer available."
              }
            </p>
            <p className="text-muted-foreground">
              {language === "de"
                ? "Vielen Dank für Ihre Treue und Unterstützung über die Jahre."
                : "Thank you for your loyalty and support over the years."
              }
            </p>
            <Button onClick={() => navigate("/")} className="mt-6">
              {language === "de" ? "Zurück zur Startseite" : "Back to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Order;
