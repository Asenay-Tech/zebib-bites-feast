import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink, name } = await req.json();

    console.log("Sending password reset email to:", email);

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Password Reset - Zebib Foods</h1>
          <p>Hello ${name || 'there'},</p>
          <p>You requested to reset your password for your Zebib Foods account.</p>
          <p style="margin: 30px 0;"><a href="${resetLink}" style="padding: 12px 24px; background-color: #D97706; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The Zebib Foods Team</p>
        </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Zebib Foods <noreply@zebibfood.de>",
        to: [email],
        subject: "Reset Your Password - Zebib Foods",
        html,
      }),
    });

    const data = await response.json();
    const error = !response.ok ? data : null;

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
