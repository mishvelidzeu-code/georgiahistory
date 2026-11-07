/**
 * კონტენტის ჩაწერა Supabase-ში.
 *
 * მონაცემები: content/daily_history.json (366 დღე, ქართული ვიკიპედიიდან აწყობილი)
 *
 * გაშვება (PowerShell):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<შენი service_role key>"; node scripts/import-content.js
 *
 * გაშვება (Git Bash / macOS / Linux):
 *   SUPABASE_SERVICE_ROLE_KEY="<შენი service_role key>" node scripts/import-content.js
 *
 * გასაღები: Supabase Dashboard → Project Settings → API → service_role (secret).
 * ის მხოლოდ შენს ტერმინალში რჩება — არსად არ იწერება და არ იგზავნება.
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://cnfpgzhdqjntvakisgvn.supabase.co";

/** გასაღები: ან garemos ცვლადიდან, ან .env.local-იდან (git-ში არ ხვდება). */
function readKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  }

  const envFile = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envFile)) return null;

  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  }
  return null;
}

const KEY = readKey();

if (!KEY) {
  console.error(
    "\n❌ SUPABASE_SERVICE_ROLE_KEY ვერ მოიძებნა.\n\n" +
      "ვარიანტი 1 — ფაილი (ერთხელ):\n" +
      "  შექმენი .env.local პროექტის ფესვში და ჩაწერე ერთი ხაზი:\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...\n" +
      "  (.gitignore-ში უკვე გამორიცხულია — git-ში არ მოხვდება)\n\n" +
      "ვარიანტი 2 — ტერმინალის ცვლადი:\n" +
      '  $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/import-content.js\n'
  );
  process.exit(1);
}

const CHUNK = 40;

async function upsert(table, rows, conflict) {
  let sent = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflict}`,
      {
        method: "POST",
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`\n❌ ${table}: ${res.status}\n${body.slice(0, 500)}`);
      process.exit(1);
    }

    sent += chunk.length;
    process.stdout.write(`\r${table}: ${sent}/${rows.length}`);
  }

  process.stdout.write(`\r${table}: ${sent}/${rows.length} ✓\n`);
}

function load(name) {
  const file = path.join(__dirname, "..", "content", name);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

(async () => {
  // --- daily_history ---
  const daily = load("daily_history.json");
  if (daily) {
    const rows = daily
      .map(({ date, georgia_content, world_content, births_content }) => ({
        date,
        georgia_content,
        world_content,
        births_content,
      }))
      .filter((r) => r.georgia_content || r.world_content || r.births_content);

    console.log(`\ndaily_history: ${rows.length} დღე`);
    await upsert("daily_history", rows, "date");
  }

  // --- science_events ---
  const science = load("science_events.json");
  if (science) {
    const rows = science
      .map(({ month, day, year, title, description }) => ({
        month,
        day,
        year,
        title,
        description,
      }))
      .filter((r) => r.title && r.description);

    console.log(`science_events: ${rows.length} დღე`);
    await upsert("science_events", rows, "month,day");
  }

  // --- medicine_events (თუ ფაილი გაჩნდა) ---
  const medicine = load("medicine_events.json");
  if (medicine) {
    const rows = medicine
      .map(({ month, day, year, title, description }) => ({
        month,
        day,
        year,
        title,
        description,
      }))
      .filter((r) => r.title && r.description);

    console.log(`medicine_events: ${rows.length} დღე`);
    await upsert("medicine_events", rows, "month,day");
  }

  console.log("\n✅ მზადაა. შეამოწმე Table Editor-ში.\n");
})();
