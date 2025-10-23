import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const { orderId } = await req.json();

    console.log("Confirming payment for order:", orderId);

    // Verify order ownership before updating
    const { data: existingOrder, error: fetchError } = await supabaseClient
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !existingOrder) {
      console.error("Order not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    if (existingOrder.user_id !== user.id) {
      console.error("User does not own this order");
      return new Response(
        JSON.stringify({ error: "Unauthorized - not your order" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Update order payment status
    const { data: order, error: updateError } = await supabaseClient
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    console.log("Order updated successfully:", order.id);

    // Get user email from profiles
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();

    const userEmail = profile?.email || "";

    console.log("Sending confirmation email to:", userEmail);

    // Send order confirmation email
    const emailResponse = await supabaseClient.functions.invoke("send-order-confirmation", {
      body: {
        name: order.name,
        email: userEmail,
        orderId: order.id,
        items: order.items,
        totalAmount: order.total_amount_cents,
        diningType: order.dining_type,
        date: order.date,
        time: order.time,
        tableNumber: order.table_number,
        phone: order.phone,
      },
    });

    if (emailResponse.error) {
      console.error("Error sending confirmation email:", emailResponse.error);
      // Don't throw - payment is confirmed, email is nice to have
    } else {
      console.log("Confirmation email sent successfully");
    }

    return new Response(
      JSON.stringify({ success: true, order }),
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
