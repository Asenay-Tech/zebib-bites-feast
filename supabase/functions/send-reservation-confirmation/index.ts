import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { ReservationConfirmationEmail } from "./_templates/reservation-confirmation.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

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

    const html = await renderAsync(
      React.createElement(ReservationConfirmationEmail, {
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
      })
    );

    const { data, error } = await resend.emails.send({
      from: "Zebib Foods <reservations@zebibfood.de>",
      to: [email],
      subject: `Reservation Confirmed #${reservationId} - Zebib Foods`,
      html,
    });

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
