import { createClient } from "https://esm.sh/@supabase/supabase-js";

Deno.serve(async (req) => {

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  try {

    const { user_id } = await req.json();
    const price = 3;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const orderId = "PRIME-" + Date.now();

    // Optional: save order
    await supabase
      .from("prime_orders")
      .insert([
        {
          order_id: orderId,
          user_id: user_id,
          amount: price,
          status: "pending"
        }
      ]);

      const clientId = Deno.env.get("BOG_CLIENT_ID")!;
const clientSecret = Deno.env.get("BOG_CLIENT_SECRET")!;
const basicAuth = "Basic " + btoa(`${clientId}:${clientSecret}`);

// 🔐 OAuth token
const tokenResponse = await fetch(
  "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": basicAuth,
    },
    body: "grant_type=client_credentials",
  }
);

    const tokenData = await tokenResponse.json();
    console.log("BOG TOKEN:", tokenData);
    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Token failed" }),
        { status: 500 }
      );
    }

    const accessToken = tokenData.access_token;

    // 🧾 Create BOG order
    const orderResponse = await fetch(
      "https://api.bog.ge/payments/v1/ecommerce/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Accept-Language": "ka",
        },
        body: JSON.stringify({
          callback_url:
            "https://lgygwpvectxaxdiujjna.supabase.co/functions/v1/bog-callback",
          external_order_id: orderId,
          purchase_units: {
            currency: "GEL",
            total_amount: price,
            basket: [
              {
                quantity: 1,
                unit_price: price,
                product_id: "prime"
              }
            ]
          },
          redirect_urls: {
  success: "https://www.giftgrb.ge/payment-success.html",
  fail: "https://www.giftgrb.ge/payment-fail.html",
},
        }),
      }
    );

    const orderData = await orderResponse.json();
    console.log("BOG ORDER:", orderData);
    if (!orderData._links?.redirect?.href) {
      return new Response(
        JSON.stringify({ error: "Order creation failed" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify(orderData._links.redirect.href),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {

    console.error("Payment error:", err);

    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );

  }

});