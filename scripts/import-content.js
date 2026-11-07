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

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY) {
  console.error(
    "\n❌ SUPABASE_SERVICE_ROLE_KEY არ არის მითითებული.\n\n" +
      'PowerShell:  $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/import-content.js\n' +
      'Git Bash:    SUPABASE_SERVICE_ROLE_KEY="..." node scripts/import-content.js\n'
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

(async () => {
  const file = path.join(__dirname, "..", "content", "daily_history.json");

  if (!fs.existsSync(file)) {
    console.error(`❌ ფაილი ვერ მოიძებნა: ${file}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  const rows = data
    .map(({ date, georgia_content, world_content, births_content }) => ({
      date,
      georgia_content,
      world_content,
      births_content,
    }))
    .filter((r) => r.georgia_content || r.world_content || r.births_content);

  console.log(`\nდღეები ფაილში: ${data.length}, ჩასაწერი: ${rows.length}\n`);

  await upsert("daily_history", rows, "date");

  console.log("\n✅ მზადაა. შეამოწმე Table Editor-ში.\n");
})();
