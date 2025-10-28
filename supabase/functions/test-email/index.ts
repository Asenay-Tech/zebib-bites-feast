import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail } from "../_shared/sendEmail.ts";

const MAILERSEND_ADMIN = Deno.env.get("MAILERSEND_ADMIN") || "ale@zebibfood.de";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Sending test email to admin:", MAILERSEND_ADMIN);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">ZEBIB RESTAURANT</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">✅ Test Email</h2>
                      <p style="margin: 0 0 15px; color: #666666; font-size: 16px; line-height: 1.6;">Hello Admin,</p>
                      <p style="margin: 0 0 15px; color: #666666; font-size: 16px; line-height: 1.6;">This is a test email to verify that the Mailersend integration is working correctly.</p>
                      <p style="margin: 0 0 15px; color: #666666; font-size: 16px; line-height: 1.6;">If you received this email, your email system is functioning properly!</p>
                      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 6px; border-left: 4px solid #8B0000; margin: 20px 0;">
                        <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                        <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>Integration:</strong> Mailersend API</p>
                        <p style="margin: 5px 0; color: #666666; font-size: 14px;"><strong>From:</strong> ale@zebibfood.de</p>
                      </div>
                      <p style="margin: 30px 0 0; color: #666666; font-size: 16px; line-height: 1.6;">Best regards,<br><strong>The ZEBIB Email System</strong></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 14px;">Salzstraße 14, 63450 Hanau | +49 177 4629585</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to: MAILERSEND_ADMIN,
      subject: "✅ Test Email - Zebib Foods Mailersend Integration",
      html,
      idempotencyKey: `test-${Date.now()}`,
    });

    if (!result.success) {
      console.error("Test email failed:", result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          message: "Email test failed. Check Mailersend API key and configuration." 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Test email sent successfully:", result.messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        message: "Test email sent successfully! Check your inbox at " + MAILERSEND_ADMIN,
        checkLogs: "View delivery status in Mailersend → Activity → Logs"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: "Failed to send test email"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
