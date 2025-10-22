import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("[stripe-checkout] CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[stripe-checkout] Function invoked", { method: req.method });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[stripe-checkout] STRIPE_SECRET_KEY not configured");
      throw new Error("STRIPE_SECRET_KEY not found");
    }
    console.log("[stripe-checkout] Stripe key found");

    const body = await req.json();
    console.log("[stripe-checkout] Request body parsed", { 
      hasProductName: !!body.productName, 
      amount: body.amount,
      hasSuccessUrl: !!body.successUrl,
      hasCancelUrl: !!body.cancelUrl
    });

    const { productName, amount, successUrl, cancelUrl } = body;
    
    if (!productName || amount === undefined || !successUrl || !cancelUrl) {
      console.error("[stripe-checkout] Missing required fields", { productName, amount, successUrl, cancelUrl });
      return new Response(JSON.stringify({ error: "Missing required fields: productName, amount, successUrl, cancelUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stripe expects amount in cents (EUR)
    const amountInCents = Math.round(Number(amount) * 100);
    console.log("[stripe-checkout] Amount conversion", { 
      originalAmount: amount, 
      amountInCents,
      currency: "EUR"
    });

    const params = {
      "payment_method_types[0]": "card",
      mode: "payment",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": productName,
      "line_items[0][price_data][unit_amount]": amountInCents.toString(),
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
    };
    console.log("[stripe-checkout] Stripe API parameters prepared", params);

    console.log("[stripe-checkout] Calling Stripe API...");
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    });

    console.log("[stripe-checkout] Stripe API responded", { 
      status: stripeResponse.status,
      statusText: stripeResponse.statusText 
    });

    const session = await stripeResponse.json();

    if (stripeResponse.status !== 200) {
      console.error("[stripe-checkout] Stripe API error", { 
        status: stripeResponse.status,
        error: session.error,
        fullResponse: session
      });
      const errorMsg = session.error?.message || `Stripe API error (${stripeResponse.status})`;
      return new Response(JSON.stringify({ error: errorMsg, details: session.error }), {
        status: stripeResponse.status >= 400 && stripeResponse.status < 500 ? 400 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[stripe-checkout] Session created successfully", { 
      sessionId: session.id,
      url: session.url,
      mode: session.mode,
      currency: session.currency
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    const stack = err instanceof Error ? err.stack : undefined;

    console.error("[stripe-checkout] Fatal error", { message, stack });

    return new Response(JSON.stringify({ 
      error: message,
      type: err instanceof Error ? err.name : "UnknownError"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
