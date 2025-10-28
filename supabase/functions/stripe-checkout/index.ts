import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate order ID: ZB-{YYYYMMDD}-{XXXX}
function generateOrderId(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `ZB-${datePart}-${randomPart}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    console.log("[stripe-checkout] CORS preflight request");
    return new Response("ok", { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    console.log("[stripe-checkout] Function invoked", { method: req.method });

    // Initialize Supabase client with SERVICE_ROLE_KEY for privileged operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user (required for order creation)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[stripe-checkout] Missing authorization header");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("[stripe-checkout] Auth error:", authError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("[stripe-checkout] User authenticated:", user.id);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[stripe-checkout] STRIPE_SECRET_KEY not configured");
      throw new Error("STRIPE_SECRET_KEY not found");
    }

    // Detect and log Stripe mode
    if (stripeKey.startsWith("sk_test_")) {
      console.warn("[stripe-checkout] WARNING: Running in TEST mode");
    } else if (stripeKey.startsWith("sk_live_")) {
      console.log("[stripe-checkout] ✓ Stripe LIVE Mode active");
    } else {
      console.warn("[stripe-checkout] WARNING: Unrecognized Stripe key format");
    }
    console.log("[stripe-checkout] Stripe key validated");

    const body = await req.json();
    console.log("[stripe-checkout] Request body parsed", {
      hasProductName: !!body.productName,
      amount: body.amount,
      hasCustomerEmail: !!body.customerEmail,
      hasSuccessUrl: !!body.successUrl,
      hasCancelUrl: !!body.cancelUrl,
    });

    const {
      productName,
      amount,
      customerEmail,
      customerName,
      customerPhone,
      items,
      date,
      time,
      diningType,
      successUrl,
      cancelUrl,
    } = body;

    if (!productName || amount === undefined || !successUrl || !cancelUrl) {
      console.error("[stripe-checkout] Missing required fields", { productName, amount, successUrl, cancelUrl });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: productName, amount, successUrl, cancelUrl",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Determine if we can create an order record (phone optional)
    const canInsertOrder = !!(customerName && items && date && time && diningType);
    if (!canInsertOrder) {
      console.log("[stripe-checkout] Order fields incomplete - will skip DB insert", {
        hasName: !!customerName,
        hasItems: !!items,
        hasDate: !!date,
        hasTime: !!time,
        hasDiningType: !!diningType,
      });
    }

    // Stripe expects amount in cents (EUR)
    const amountInCents = Math.round(Number(amount) * 100);
    console.log("[stripe-checkout] Amount conversion", {
      originalAmount: amount,
      amountInCents,
      currency: "EUR",
    });

    // Validate minimum amount (€0.50 = 50 cents)
    if (amountInCents < 50) {
      console.error("[stripe-checkout] Amount too low:", amountInCents);
      return new Response(JSON.stringify({ success: false, error: "Minimum charge is €0.50" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate human-friendly code (not DB id)
    const orderCode = generateOrderId();
    console.log("[stripe-checkout] Generated order code:", orderCode);

    // Create order record in database when possible
    let orderUuid: string | null = null;
    if (canInsertOrder) {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            name: customerName,
            phone: customerPhone || "",
            date,
            time,
            dining_type: diningType,
            items,
            total_amount_cents: amountInCents,
            payment_status: "pending",
            status: "pending",
            order_code: orderCode,
          })
          .select("id")
          .maybeSingle();

        if (orderError) {
          console.error("[stripe-checkout] Order creation error:", orderError);
        } else {
          orderUuid = orderData?.id || null;
          console.log("[stripe-checkout] Order created", { orderUuid, orderCode });
        }
      } catch (dbErr) {
        console.error("[stripe-checkout] Exception during order insert", dbErr);
      }
    } else {
      console.log("[stripe-checkout] Skipping order insert due to incomplete fields");
    }

    // Helper function to properly encode nested objects for Stripe API
    function toFormData(obj: Record<string, any>, prefix = ""): URLSearchParams {
      const form = new URLSearchParams();
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null) continue;

        const path = prefix ? `${prefix}[${key}]` : key;

        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === "object" && item !== null) {
              const nestedForm = toFormData(item, `${path}[${index}]`);
              nestedForm.forEach((val, nestedKey) => form.append(nestedKey, val));
            } else {
              form.append(`${path}[${index}]`, item.toString());
            }
          });
        } else if (typeof value === "object" && value !== null) {
          const nestedForm = toFormData(value, path);
          nestedForm.forEach((val, nestedKey) => form.append(nestedKey, val));
        } else {
          form.append(path, value.toString());
        }
      }
      return form;
    }

    // Build Stripe checkout session params with proper structure
    // Ensure we append order_id correctly even when URLs already contain query params
    const successUrlFinal = orderUuid
      ? (() => {
          try {
            const u = new URL(successUrl);
            u.searchParams.set("order_id", orderUuid);
            return u.toString();
          } catch {
            return `${successUrl}${successUrl.includes("?") ? "&" : "?"}order_id=${orderUuid}`;
          }
        })()
      : successUrl;

    const cancelUrlFinal = orderUuid
      ? (() => {
          try {
            const u = new URL(cancelUrl);
            u.searchParams.set("order_id", orderUuid);
            return u.toString();
          } catch {
            return `${cancelUrl}${cancelUrl.includes("?") ? "&" : "?"}order_id=${orderUuid}`;
          }
        })()
      : cancelUrl;

    const checkoutData: Record<string, any> = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrlFinal,
      cancel_url: cancelUrlFinal,
    };

    // Add customer email for Stripe receipts if provided
    if (customerEmail) {
      checkoutData.customer_email = customerEmail;
      console.log("[stripe-checkout] Customer email set:", customerEmail);
    } else {
      console.log("[stripe-checkout] No email – redirect only");
    }

    console.log("[stripe-checkout] Stripe API parameters prepared", {
      productName,
      amount: amountInCents,
      currency: "EUR",
      orderUuid,
      hasEmail: !!customerEmail,
    });

    console.log("[stripe-checkout] Calling Stripe API...");
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: toFormData(checkoutData),
    });

    console.log("[stripe-checkout] Stripe API responded", {
      status: stripeResponse.status,
      statusText: stripeResponse.statusText,
    });

    const session = await stripeResponse.json();

    if (stripeResponse.status !== 200) {
      console.error("[stripe-checkout] Stripe API error", {
        status: stripeResponse.status,
        error: session.error,
        fullResponse: session,
      });
      const errorMsg = session.error?.message || `Stripe API error (${stripeResponse.status})`;
      return new Response(JSON.stringify({ success: false, error: errorMsg, details: session.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[stripe-checkout] Session created successfully", {
      sessionId: session.id,
      url: session.url,
      mode: session.mode,
      currency: session.currency,
      amount_total: session.amount_total,
      orderUuid,
      receiptEmail: customerEmail || "none",
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        orderId: orderUuid,
        orderCode,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error occurred";
    const stack = err instanceof Error ? err.stack : undefined;

    console.error("[stripe-checkout] Fatal error", { message, stack });

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        type: err instanceof Error ? err.name : "UnknownError",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
