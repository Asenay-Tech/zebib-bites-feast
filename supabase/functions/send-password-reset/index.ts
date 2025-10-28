import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/sendEmail.ts";

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
    const { email, name, appUrl } = await req.json();

    // Log anonymized email domain for debugging
    const emailDomain = email.split('@')[1];
    console.log("Sending password reset email to domain:", emailDomain);

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    const user = userData?.users.find(u => u.email === email);

    if (userError || !user) {
      console.error("User not found");
      // Don't reveal if email exists for security
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate token locally (base64url)
    const random = new Uint8Array(32);
    crypto.getRandomValues(random);
    const token = btoa(String.fromCharCode(...random))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const tokenHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token)
    ).then(buffer => 
      Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    );

    // Store token in database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const { error: insertError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: user.id,
        email: email,
        token: token,
        token_hash: tokenHash,
        type: 'password_reset',
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error("Error storing token:", insertError);
      throw insertError;
    }

    const resetLink = `${appUrl || window.location.origin}/reset-password?token=${tokenHash}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #D97706;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ Zebib Foods</h1>
          </div>
          <div class="content">
            <p>Hello ${name || 'there'},</p>
            <p>We received a request to reset your password for your Zebib Foods account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The Zebib Foods Team</p>
          </div>
          <div class="footer">
            <p>Zebib Foods - Authentic East African Cuisine</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    const emailResult = await sendEmail({
      to: email,
      subject: "Reset Your Password - Zebib Foods",
      html,
      idempotencyKey: `password-reset-${tokenHash}`,
    });

    if (!emailResult.success) {
      console.error("Error sending email:", emailResult.error);
      throw new Error(emailResult.error || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult.messageId);

    return new Response(JSON.stringify({ success: true, messageId: emailResult.messageId }), {
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
