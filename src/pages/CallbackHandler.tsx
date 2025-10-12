import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CallbackHandler = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>("Signing you in...");

  useEffect(() => {
    // Listen first to avoid missing the auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const stored = localStorage.getItem("post_oauth_redirect");
        const redirectTo = stored || "/";
        if (stored) localStorage.removeItem("post_oauth_redirect");
        // Clean URL hash to avoid leaking tokens
        if (window.location.hash) {
          history.replaceState(null, "", window.location.pathname);
        }
        navigate(redirectTo, { replace: true });
      }
    });

    // Then check for an existing session (Supabase parses tokens from URL hash)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session) {
        const stored = localStorage.getItem("post_oauth_redirect");
        const redirectTo = stored || "/";
        if (stored) localStorage.removeItem("post_oauth_redirect");
        if (window.location.hash) {
          history.replaceState(null, "", window.location.pathname);
        }
        navigate(redirectTo, { replace: true });
      } else if (error) {
        console.error("OAuth callback error:", error);
        setMessage("Redirecting to login...");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="text-center">
        <div className="animate-pulse mb-3 text-sm text-muted-foreground">{message}</div>
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent mx-auto animate-spin" aria-hidden />
      </div>
    </div>
  );
};

export default CallbackHandler;
