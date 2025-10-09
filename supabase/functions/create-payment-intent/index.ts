import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { amount, items, date, time, diningType, tableNumber, name, phone } = await req.json();

    console.log("Creating Stripe checkout session:", { amount, user: user.id, diningType });

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: user.id,
        items,
        total_amount_cents: Math.round(amount * 100),
        date,
        time,
        dining_type: diningType,
        table_number: tableNumber,
        payment_status: "pending",
        name,
        phone,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw orderError;
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: `${diningType} order`,
          },
          unit_amount: Math.round((item.price || 0)),
        },
        quantity: item.quantity || 1,
      })),
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/checkout?success=true&order_id=${order.id}`,
      cancel_url: `${req.headers.get("origin")}/checkout?canceled=true`,
      metadata: {
        order_id: order.id,
        user_id: user.id,
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({
        sessionUrl: session.url,
        orderId: order.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});