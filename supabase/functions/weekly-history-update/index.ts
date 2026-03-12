Deno.serve(async (req: Request) => {
  try {

    // 🔐 CRON SECRET CHECK
    const CRON_SECRET = Deno.env.get("CRON_SECRET");

    if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("7 DAY BATCH STARTED");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

    let processed = 0;

    for (let i = 0; i < 7; i++) {
      try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);

        const month = targetDate.getMonth() + 1;
        const day = targetDate.getDate();
        const key = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        console.log("PROCESSING:", key);

        // Wikipedia
        const eventsRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`
        );
        const birthsRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/${month}/${day}`
        );

        if (!eventsRes.ok || !birthsRes.ok) continue;

        const eventsData = await eventsRes.json().catch(() => null);
        const birthsData = await birthsRes.json().catch(() => null);

        const rawEvents = JSON.stringify(eventsData?.events?.slice(0, 3) || []);
        const rawBirths = JSON.stringify(birthsData?.births?.slice(0, 3) || []);

        // OpenAI
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "შენ ხარ პროფესიონალი ისტორიკოსი. დაწერე გამართული ქართული ტექსტი და დააბრუნე მხოლოდ JSON."
              },
              {
                role: "user",
                content: `
თარიღი: ${month}-${day}

მოვლენები:
${rawEvents}

დაბადებები:
${rawBirths}

ფორმატი:
{
  "world": "მსოფლიო მოვლენები ქართულად",
  "georgia": "საქართველოსთან დაკავშირებული მოვლენები ქართულად",
  "births": "ამ დღეს დაბადებული პირები ქართულად"
}
`
              }
            ]
          })
        });

        if (!aiRes.ok) continue;

        const aiData = await aiRes.json().catch(() => null);
        if (!aiData) continue;

        const content = aiData.choices?.[0]?.message?.content;
        if (!content) continue;

        let parsed: any = {};
        try {
          parsed = JSON.parse(content);
        } catch {
          continue;
        }

        // Supabase UPSERT
        await fetch(
          `${SUPABASE_URL}/rest/v1/daily_history?on_conflict=date`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
              Prefer: "resolution=merge-duplicates"
            },
            body: JSON.stringify({
              date: key,
              world_content: parsed.world ?? "",
              georgia_content: parsed.georgia ?? "",
              births_content: parsed.births ?? ""
            })
          }
        );

        console.log("UPDATED:", key);
        processed++;

      } catch (loopErr) {
        console.error("LOOP ERROR:", loopErr);
      }
    }

    return Response.json({
      status: "success",
      processed_days: processed
    });

  } catch (err) {
    console.error("FUNCTION ERROR:", err);

    return Response.json(
      { status: "error", message: String(err) },
      { status: 500 }
    );
  }
});