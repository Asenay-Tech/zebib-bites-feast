import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const processPayment = async () => {
      const isSuccess = searchParams.get("success") === "true";
      const isCanceled = searchParams.get("canceled") === "true";
      const orderId = searchParams.get("order_id");

      if (isCanceled) {
        setLoading(false);
        setSuccess(false);
        toast({ 
          title: "Payment canceled", 
          description: "Your order has not been placed",
          variant: "destructive" 
        });
        return;
      }

      if (isSuccess && orderId) {
        try {
          // Confirm payment and send email
          const { data, error } = await supabase.functions.invoke("confirm-payment", {
            body: { orderId },
          });

          if (error) {
            console.error("Confirmation error:", error);
            toast({ 
              title: "Error confirming order", 
              description: error.message,
              variant: "destructive" 
            });
            setLoading(false);
            return;
          }

          setSuccess(true);
          setOrderDetails(data?.order);
          toast({ 
            title: "Order confirmed!", 
            description: "Check your email for confirmation" 
          });
        } catch (err) {
          console.error("Error:", err);
          toast({ 
            title: "Error processing order", 
            variant: "destructive" 
          });
        }
      }
      
      setLoading(false);
    };

    processPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Processing your order...</p>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="container mx-auto px-4 py-24">
        <Card className="p-6 space-y-4 text-center max-w-md mx-auto">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Payment Canceled</h2>
          <p className="text-muted-foreground">
            Your payment was canceled. No charges were made.
          </p>
          <Button onClick={() => navigate("/order")}>Return to Order</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <Card className="p-6 space-y-4 max-w-md mx-auto">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Order Confirmed!</h2>
          <p className="text-muted-foreground mt-2">
            Thank you for your order. We've sent a confirmation email.
          </p>
        </div>
        
        {orderDetails && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Order ID:</span>
              <span className="text-muted-foreground">{orderDetails.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Date:</span>
              <span className="text-muted-foreground">{orderDetails.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Time:</span>
              <span className="text-muted-foreground">{orderDetails.time}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Type:</span>
              <span className="text-muted-foreground capitalize">{orderDetails.dining_type}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total:</span>
              <span>€{(orderDetails.total_amount_cents / 100).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="pt-4 space-y-2">
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
          <Button onClick={() => navigate("/order")} variant="outline" className="w-full">
            Place Another Order
          </Button>
        </div>
      </Card>
    </div>
  );
}
