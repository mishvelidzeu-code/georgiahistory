import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const future = new Date();
    future.setDate(today.getDate() + i);

    const month = String(future.getMonth() + 1).padStart(2, "0");
    const day = String(future.getDate()).padStart(2, "0");
    const key = `${month}-${day}`;

    await supabase.from("daily_history").upsert({
      date: key,
      title: `დღე ${key}`,
      free_text: "ტესტური ისტორიული ინფორმაცია",
      premium_text: "პრემიუმ ისტორიული ინფორმაცია",
    });
  }

  return new Response("Weekly update completed");
});