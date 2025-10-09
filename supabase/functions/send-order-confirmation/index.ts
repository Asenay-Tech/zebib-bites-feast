import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { OrderConfirmationEmail } from "./_templates/order-confirmation.tsx";

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
      orderId,
      items,
      totalAmount,
      diningType,
      date,
      time,
      tableNumber,
      phone,
    } = await req.json();

    console.log("Sending order confirmation email to:", email);

    const html = await renderAsync(
      React.createElement(OrderConfirmationEmail, {
        name,
        email,
        orderId,
        items,
        totalAmount,
        diningType,
        date,
        time,
        tableNumber,
        phone,
      })
    );

    const { data, error } = await resend.emails.send({
      from: "Zebib Foods <orders@zebibfood.de>",
      to: [email],
      subject: `Order Confirmation #${orderId} - Zebib Foods`,
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
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
