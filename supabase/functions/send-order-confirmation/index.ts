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

    const itemsList = items.map((item: any) => 
      `<li>${item.name} ${item.variant ? `(${item.variant})` : ''} × ${item.quantity} = €${((item.price / 100) * item.quantity).toFixed(2)}</li>`
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #D97706; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .order-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; margin-top: 15px; padding-top: 15px; border-top: 2px solid #D97706; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍽️ Zebib Foods</h1>
              <p>Order Confirmation</p>
            </div>
            <div class="content">
              <h2>Thank you, ${name}!</h2>
              <p>Your order has been confirmed and payment received.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId.slice(0, 8).toUpperCase()}</p>
                <p><strong>Type:</strong> ${diningType === 'dine-in' ? 'Dine-in' : 'Pickup'}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time}</p>
                ${tableNumber ? `<p><strong>Table:</strong> ${tableNumber}</p>` : ''}
                ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                
                <h3 style="margin-top: 20px;">Items Ordered</h3>
                <ul>
                  ${itemsList}
                </ul>
                
                <div class="total">
                  Total: €${(totalAmount / 100).toFixed(2)}
                </div>
              </div>
              
              <p>We're preparing your order and it will be ready at the scheduled time.</p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>Zebib Foods - Authentic East African Cuisine</p>
              <p>zebibfood.de</p>
            </div>
          </div>
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
        from: "Zebib Foods <mail@zebibfood.de>",
        to: [email],
        subject: `Order Confirmation #${orderId.slice(0, 8).toUpperCase()} - Zebib Foods`,
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
