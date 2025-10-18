import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[stripe-checkout] Function started');

    // Validate Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Parse request body
    const { productName, amount, successUrl, cancelUrl } = await req.json();
    console.log('[stripe-checkout] Request received', { productName, amount });

    // Validate required fields
    if (!productName || amount === undefined || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: productName, amount, successUrl, cancelUrl' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Amount provided by frontend is already in cents (EUR)
    const amountInCents = Math.round(Number(amount));
    console.log('[stripe-checkout] Amount received (cents)', { cents: amountInCents });

    // Validate minimum amount (Stripe requires at least 50 cents for EUR)
    if (amountInCents < 50) {
      return new Response(
        JSON.stringify({ error: 'Amount must be at least €0.50' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur', // Force EUR currency
            product_data: {
              name: productName,
            },
            unit_amount: amountInCents, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log('[stripe-checkout] Session created successfully', { sessionId: session.id });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[stripe-checkout] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
