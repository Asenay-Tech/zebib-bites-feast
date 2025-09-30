import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

    const { orderId, reservationId, type } = await req.json();

    if (!type || (type !== "order" && type !== "reservation")) {
      throw new Error("Invalid ticket type");
    }

    const refId = type === "order" ? orderId : reservationId;
    if (!refId) {
      throw new Error("Missing reference ID");
    }

    console.log("Generating ticket:", { type, refId, userId: user.id });

    // Generate ticket code using database function
    const { data: ticketData, error: ticketError } = await supabaseClient.rpc(
      "generate_ticket_code"
    );

    if (ticketError) {
      console.error("Ticket code generation error:", ticketError);
      throw ticketError;
    }

    const ticketCode = ticketData as string;

    // Insert ticket into database
    const { data: ticket, error: insertError } = await supabaseClient
      .from("tickets")
      .insert({
        user_id: user.id,
        type,
        ref_id: refId,
        ticket_code: ticketCode,
        status: "open",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Ticket insertion error:", insertError);
      throw insertError;
    }

    console.log("Ticket generated:", ticket.ticket_code);

    return new Response(
      JSON.stringify({ ticket }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});