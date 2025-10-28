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

    // Log order ID for debugging, not email
    console.log("Sending order confirmation for order ID:", orderId?.slice(0, 8));

    const itemsList = items.map((item: any) => 
      `<li>${item.name} ${item.variant ? `(${item.variant})` : ''} × ${item.quantity} = €${((item.price / 100) * item.quantity).toFixed(2)}</li>`
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">ZEBIB RESTAURANT</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Order Confirmation</h2>
                      <p style="margin: 0 0 15px; color: #666666; font-size: 16px; line-height: 1.6;">Hello ${name},</p>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">Thank you for your order! We're preparing it now.</p>
                      
                      <div style="background-color: #f8f8f8; padding: 25px; border-radius: 6px; border-left: 4px solid #8B0000;">
                        <h3 style="margin: 0 0 15px; color: #333333; font-size: 18px;">Order Details</h3>
                        <p style="margin: 5px 0; color: #666666; font-size: 15px;"><strong>Order ID:</strong> ${orderId.slice(0, 8).toUpperCase()}</p>
                        <p style="margin: 5px 0; color: #666666; font-size: 15px;"><strong>Type:</strong> ${diningType === 'dine-in' ? 'Dine-in' : 'Pickup'}</p>
                        <p style="margin: 5px 0; color: #666666; font-size: 15px;"><strong>Date:</strong> ${date}</p>
                        <p style="margin: 5px 0 15px; color: #666666; font-size: 15px;"><strong>Time:</strong> ${time}</p>
                        ${tableNumber ? `<p style="margin: 5px 0; color: #666666; font-size: 15px;"><strong>Table:</strong> ${tableNumber}</p>` : ''}
                        ${phone ? `<p style="margin: 5px 0; color: #666666; font-size: 15px;"><strong>Phone:</strong> ${phone}</p>` : ''}
                        
                        <h4 style="margin: 20px 0 10px; color: #333333; font-size: 16px;">Items:</h4>
                        <table width="100%" cellpadding="8" cellspacing="0" style="border-top: 1px solid #ddd;">
                          ${items.map((item: any) => 
                            `<tr style="border-bottom: 1px solid #ddd;">
                              <td style="color: #666666; font-size: 14px;">${item.name}${item.variant ? ` (${item.variant})` : ''}</td>
                              <td style="color: #666666; font-size: 14px; text-align: center;">${item.quantity}x</td>
                              <td style="color: #666666; font-size: 14px; text-align: right;">€${((item.price / 100) * item.quantity).toFixed(2)}</td>
                            </tr>`
                          ).join('')}
                          <tr>
                            <td colspan="2" style="padding-top: 15px; font-weight: bold; color: #333333; font-size: 16px;">Total:</td>
                            <td style="padding-top: 15px; font-weight: bold; color: #8B0000; font-size: 18px; text-align: right;">€${(totalAmount / 100).toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>

                      <p style="margin: 30px 0 0; color: #666666; font-size: 16px; line-height: 1.6;">We'll have your order ready at the scheduled time!</p>
                      <p style="margin: 15px 0 0; color: #666666; font-size: 16px; line-height: 1.6;">Best regards,<br><strong>The ZEBIB Team</strong></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 14px;">Salzstraße 14, 63450 Hanau | +49 177 4629585</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // In test mode, Resend only allows sending to verified email
    // So we'll send customer copy to admin email for testing
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@zebibfood.de";
    const testMode = !RESEND_API_KEY?.startsWith("re_");
    
    console.log(`Sending emails in ${testMode ? "TEST" : "LIVE"} mode`);

    // Send to customer (or admin in test mode)
    const customerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Zebib Foods <onboarding@resend.dev>",
        to: testMode ? [adminEmail] : [email],
        subject: `Order Confirmation #${orderId.slice(0, 8).toUpperCase()} - Zebib Foods`,
        html,
      }),
    });

    const customerData = await customerResponse.json();
    
    if (!customerResponse.ok) {
      console.error("Error sending customer email:", customerData);
    } else {
      console.log("Customer email sent successfully:", customerData);
    }

    // Send admin notification
    const adminHtml = html.replace(
      `Hello ${name},`,
      `New paid order received from ${name} (${email}):`
    ).replace(
      "Order Confirmation",
      "🔔 NEW PAID ORDER"
    );
    
    const adminResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Zebib Foods <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `🔔 New Order #${orderId.slice(0, 8).toUpperCase()} - €${(totalAmount / 100).toFixed(2)}`,
        html: adminHtml,
      }),
    });

    const adminData = await adminResponse.json();
    
    if (!adminResponse.ok) {
      console.error("Error sending admin email:", adminData);
    } else {
      console.log("Admin email sent successfully:", adminData);
    }

    return new Response(JSON.stringify({ success: true, customerData, adminData }), {
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
