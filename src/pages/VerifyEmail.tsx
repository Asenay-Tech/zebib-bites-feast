import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-email-token", {
          body: { tokenHash: token },
        });

        if (error) throw error;

        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus("error");
          setMessage("Verification failed. Please try again.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Verification successful!"}
            {status === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === "loading" && (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle className="h-16 w-16 text-green-500" />
          )}
          {status === "error" && (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
          
          <p className="text-center text-muted-foreground">{message}</p>

          {status === "success" && (
            <p className="text-sm text-center text-muted-foreground">
              Redirecting to login...
            </p>
          )}

          {status === "error" && (
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
