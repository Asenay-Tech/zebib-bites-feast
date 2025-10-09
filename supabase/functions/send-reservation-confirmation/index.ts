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
    const {
      name,
      email,
      reservationId,
      date,
      time,
      people,
      tableNumber,
      eventType,
      services,
      notes,
      phone,
    } = await req.json();

    console.log("Sending reservation confirmation email to:", email);

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>🍽️ Reservation Confirmed - Zebib Foods</h1>
          <p>Hello ${name},</p>
          <p>Your reservation has been confirmed!</p>
          <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Reservation ID:</strong> ${reservationId?.slice(0, 8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Guests:</strong> ${people}</p>
            ${tableNumber ? `<p><strong>Table:</strong> ${tableNumber}</p>` : ''}
            ${eventType ? `<p><strong>Event Type:</strong> ${eventType}</p>` : ''}
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${notes ? `<p><strong>Special Requests:</strong> ${notes}</p>` : ''}
          </div>
          <p>We look forward to serving you!</p>
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
        from: "Zebib Foods <reservations@zebibfood.de>",
        to: [email],
        subject: `Reservation Confirmed - ${date} at ${time}`,
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
    console.error("Error in send-reservation-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
