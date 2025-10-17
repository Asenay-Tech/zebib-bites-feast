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
    const { name, email, date, time, people, tableNumber } = await req.json();

    console.log("Sending reservation reminder email to:", email);

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
                      <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Reservation Reminder</h2>
                      <p style="margin: 0 0 15px; color: #666666; font-size: 16px; line-height: 1.6;">Hello ${name},</p>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">This is a friendly reminder about your upcoming reservation:</p>
                      
                      <div style="background-color: #f8f8f8; padding: 25px; border-radius: 6px; border-left: 4px solid #8B0000;">
                        <p style="margin: 8px 0; color: #666666; font-size: 15px;"><strong>Date:</strong> ${date}</p>
                        <p style="margin: 8px 0; color: #666666; font-size: 15px;"><strong>Time:</strong> ${time}</p>
                        <p style="margin: 8px 0; color: #666666; font-size: 15px;"><strong>Party Size:</strong> ${people} ${people === 1 ? 'person' : 'people'}</p>
                        ${tableNumber ? `<p style="margin: 8px 0; color: #666666; font-size: 15px;"><strong>Table Number:</strong> ${tableNumber}</p>` : ''}
                      </div>

                      <p style="margin: 30px 0 0; color: #666666; font-size: 16px; line-height: 1.6;">We look forward to seeing you soon!</p>
                      <p style="margin: 15px 0 0; color: #666666; font-size: 16px; line-height: 1.6;">Best regards,<br><strong>The ZEBIB Team</strong></p>
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

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ZEBIB Restaurant <noreply@zebibrestaurant.com>",
        to: [email],
        subject: `Reservation Reminder - Today at ${time}`,
        html,
        reply_to: "info@zebibrestaurant.com",
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
    console.error("Error in send-reservation-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
