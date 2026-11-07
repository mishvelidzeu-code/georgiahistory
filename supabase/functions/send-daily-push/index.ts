// ყოველდღიური push შეტყობინება ყველა მომხმარებელს, ვისაც ტოკენი აქვს.
//
// გაშვება cron-ით, ჰედერით:  x-cron-secret: <CRON_SECRET>
// ტექსტს დღევანდელი `daily_history`-დან იღებს.

import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

/** დღის გასაღები `MM-DD` საქართველოს დროით. */
function georgiaDayKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tbilisi",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";

  return `${month}-${day}`;
}

function preview(text: string | null | undefined, max = 110): string {
  if (!text) return "ნახე, რა მოხდა ამ დღეს წლების წინ 📜";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1) + "…";
}

Deno.serve(async (req: Request) => {
  try {
    const CRON_SECRET = Deno.env.get("CRON_SECRET");

    if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. დღევანდელი ტექსტი
    const key = georgiaDayKey();
    const { data: today } = await admin
      .from("daily_history")
      .select("georgia_content")
      .eq("date", key)
      .maybeSingle();

    const body = preview(today?.georgia_content);

    // 2. ტოკენები
    const { data: rows, error } = await admin
      .from("profiles")
      .select("id, push_token")
      .not("push_token", "is", null);

    if (error) throw error;

    const targets = (rows ?? []).filter((r) =>
      typeof r.push_token === "string" && r.push_token.startsWith("ExponentPushToken")
    );

    if (targets.length === 0) {
      return Response.json({ status: "success", sent: 0, note: "no tokens" });
    }

    // 3. გაგზავნა 100-იან ნაწილებად
    let sent = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
      const chunk = targets.slice(i, i + CHUNK_SIZE);

      const messages = chunk.map((r) => ({
        to: r.push_token,
        title: "დღის ისტორია",
        body,
        sound: "default",
        channelId: "daily-history",
        data: { screen: "/(tabs)" },
      }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        console.error("EXPO PUSH HTTP", res.status, await res.text());
        continue;
      }

      const json = await res.json().catch(() => null);
      const tickets = json?.data ?? [];

      tickets.forEach((ticket: any, index: number) => {
        if (ticket?.status === "ok") {
          sent++;
        } else if (ticket?.details?.error === "DeviceNotRegistered") {
          // ტოკენი აღარ მუშაობს — ბაზიდან ვშლით
          const token = chunk[index]?.push_token;
          if (token) invalidTokens.push(token);
        } else {
          console.error("TICKET ERROR", JSON.stringify(ticket));
        }
      });
    }

    // 4. მკვდარი ტოკენების გასუფთავება
    if (invalidTokens.length > 0) {
      await admin
        .from("profiles")
        .update({ push_token: null })
        .in("push_token", invalidTokens);
    }

    return Response.json({
      status: "success",
      day: key,
      total: targets.length,
      sent,
      cleaned: invalidTokens.length,
    });
  } catch (err) {
    console.error("SEND DAILY PUSH ERROR:", err);
    return Response.json(
      { status: "error", message: String(err) },
      { status: 500 },
    );
  }
});
