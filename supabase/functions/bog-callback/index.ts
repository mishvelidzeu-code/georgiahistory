import { createClient } from "https://esm.sh/@supabase/supabase-js";

Deno.serve(async (req) => {

  try {

    const callbackData = await req.json();

    console.log("FULL CALLBACK:", callbackData);

    const orderStatus = callbackData?.body?.order_status?.key;
    const orderId = callbackData?.body?.external_order_id;

    if (!orderId) {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    if (orderStatus !== "completed") {
      console.log("Order not completed:", orderStatus);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

    // 🔎 Order lookup
    const { data: order } = await supabase
      .from("prime_orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (!order) {
      console.log("Order not found:", orderId);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // 🛑 Duplicate protection
    if (order.status === "paid") {
      console.log("Already processed:", orderId);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // ✅ mark order paid
    await supabase
      .from("prime_orders")
      .update({ status: "paid" })
      .eq("order_id", orderId);

    // ⭐ enable PRIME
    await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", order.user_id);

    console.log("PRIME activated:", order.user_id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {

    console.error("CALLBACK ERROR:", err);

    return new Response(
      JSON.stringify({ error: "Callback failed" }),
      { status: 500 }
    );

  }

});