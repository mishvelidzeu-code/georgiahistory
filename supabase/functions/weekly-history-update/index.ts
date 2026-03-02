const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async () => {
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const future = new Date();
    future.setDate(today.getDate() + i);

    const month = String(future.getMonth() + 1).padStart(2, "0");
    const day = String(future.getDate()).padStart(2, "0");
    const key = `${month}-${day}`;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        date: key,
        title: `დღე ${key}`,
        free_text: "ტესტური ისტორიული ინფორმაცია",
        premium_text: "პრემიუმ ისტორიული ინფორმაცია"
      })
    });

    console.log("Insert status:", response.status);
  }

  return new Response("Weekly update completed", { status: 200 });
});