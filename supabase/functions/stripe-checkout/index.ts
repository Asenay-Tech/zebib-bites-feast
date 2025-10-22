import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate order ID: ZB-{YYYYMMDD}-{XXXX}
function generateOrderId(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `ZB-${datePart}-${randomPart}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("[stripe-checkout] CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[stripe-checkout] Function invoked", { method: req.method });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("[stripe-checkout] Auth error:", authError);
      throw new Error("Unauthorized");
    }
    console.log("[stripe-checkout] User authenticated:", user.id);

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
      hasCustomerEmail: !!body.customerEmail,
      hasSuccessUrl: !!body.successUrl,
      hasCancelUrl: !!body.cancelUrl
    });

    const { productName, amount, customerEmail, customerName, customerPhone, items, date, time, diningType, successUrl, cancelUrl } = body;
    
    if (!productName || amount === undefined || !successUrl || !cancelUrl) {
      console.error("[stripe-checkout] Missing required fields", { productName, amount, successUrl, cancelUrl });
      return new Response(JSON.stringify({ error: "Missing required fields: productName, amount, successUrl, cancelUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required order fields
    if (!customerName || !customerPhone || !items || !date || !time || !diningType) {
      console.error("[stripe-checkout] Missing order fields");
      return new Response(JSON.stringify({ error: "Missing required order fields" }), {
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

    // Validate minimum amount (€0.50 = 50 cents)
    if (amountInCents < 50) {
      console.error("[stripe-checkout] Amount too low:", amountInCents);
      return new Response(JSON.stringify({ error: "Minimum charge is €0.50" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique order ID
    const orderId = generateOrderId();
    console.log("[stripe-checkout] Generated order ID:", orderId);

    // Create order record in database
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        user_id: user.id,
        name: customerName,
        phone: customerPhone,
        date,
        time,
        dining_type: diningType,
        items,
        total_amount_cents: amountInCents,
        payment_status: "pending",
        status: "pending"
      })
      .select()
      .single();

    if (orderError) {
      console.error("[stripe-checkout] Order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order", details: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("[stripe-checkout] Order created:", orderId);

    // Build Stripe checkout session params
    const params: Record<string, string> = {
      "payment_method_types[0]": "card",
      mode: "payment",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": productName,
      "line_items[0][price_data][unit_amount]": amountInCents.toString(),
      "line_items[0][quantity]": "1",
      success_url: `${successUrl}?order_id=${orderId}`,
      cancel_url: `${cancelUrl}?order_id=${orderId}`,
    };

    // Add customer email for Stripe receipts if provided
    if (customerEmail) {
      params["customer_email"] = customerEmail;
      params["payment_intent_data[receipt_email]"] = customerEmail;
      console.log("[stripe-checkout] Email receipt enabled for:", customerEmail);
    } else {
      console.log("[stripe-checkout] No email – redirect only");
    }

    console.log("[stripe-checkout] Stripe API parameters prepared", {
      ...params,
      amount: amountInCents,
      currency: "EUR",
      orderId
    });

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
      currency: session.currency,
      orderId,
      receiptEmail: customerEmail || "none"
    });

    return new Response(JSON.stringify({ 
      url: session.url, 
      orderId,
      sessionId: session.id 
    }), {
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
