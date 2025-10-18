import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokenHash, newPassword } = await req.json();

    console.log("Resetting password with token:", tokenHash);

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('type', 'password_reset')
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token not found or error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error("Token expired");
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error("Error updating token:", updateError);
      throw updateError;
    }

    // Update user's password
    const { error: authError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    );

    if (authError) {
      console.error("Error updating password:", authError);
      throw authError;
    }

    console.log("Password reset successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in reset-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
