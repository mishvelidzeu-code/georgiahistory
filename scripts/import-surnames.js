/**
 * გვარების ჩამოტანა gvarigen.ge-ის ბაზიდან აპის ბაზაში.
 *
 * რას აკეთებს:
 *   1. კითხულობს საიტის Supabase პროექტს (lcmipkdelgyzqniqtrtv, 447 გვარი);
 *   2. ასუფთავებს — იხ. „გასუფთავების წესები" ქვემოთ;
 *   3. ჭრის ისტორიას პირველ 42 სიტყვამდე (preview);
 *   4. წერს content/surnames.json-ს (რეპოს backup);
 *   5. ტვირთავს აპის ბაზაში (cnfpgzhdqjntvakisgvn) upsert-ით.
 *
 * სრული ისტორია აპის ბაზაში შეგნებულად არ ჩამოდის — მხოლოდ ნაწყვეტი.
 * სრული ტექსტი რჩება საიტზე: gvarigen.ge/gvari/<crest_code>.
 * მიზეზი: App Store 3.1.1 — აპში „გასახსნელი" ციფრული კონტენტი არ უნდა იყოს.
 *
 * გაშვება:
 *   node scripts/import-surnames.js              # ჩამოტანა + ატვირთვა
 *   node scripts/import-surnames.js --from-json  # მხოლოდ ატვირთვა არსებული JSON-იდან
 *   node scripts/import-surnames.js --dry-run    # მხოლოდ JSON, ბაზას არ ეხება
 *
 * გასაღებები — .env.local-ში (gitignored, არსად არ იბეჭდება):
 *   SUPABASE_SERVICE_ROLE_KEY=...    # აპის პროექტი (უკვე გაქვს)
 *   GVARIGEN_SERVICE_ROLE_KEY=...    # საიტის პროექტი — Dashboard → API → service_role
 */

const fs = require("fs");
const path = require("path");

const APP_URL = "https://cnfpgzhdqjntvakisgvn.supabase.co";
const GVARIGEN_URL = "https://lcmipkdelgyzqniqtrtv.supabase.co";

const OUT_FILE = path.join(__dirname, "..", "content", "surnames.json");
const PREVIEW_WORDS = 42; // დღის ბარათი 40 სიტყვას აჩვენებს — მარაგით

/* ── გასუფთავების წესები ───────────────────────────────────────────────
 * საიტზე ბაზა ხელით ივსება, ამიტომ ხარვეზებია. აღმოჩენილი:
 *   • ერთ ჩანაწერში AI-ის პასუხის პრეამბულა („…მოიძიებულია:");
 *   • სათაურის პრეფიქსი („არწივიძე — გვარის ისტორია …");
 *   • surname-ის ველში სათაური და არა გვარი („დასკვნა:", „კულტურა:");
 *   • surname-ის ველში მრავლობითი ფორმა („ედემაშვილების გვარი");
 *   • 8 ჩანაწერი ცარიელი ან ერთსიტყვიანი (ჩანს, ერთით აცდენილი ჩასმა);
 *   • 6 ჩანაწერს სხვა გვარის ტექსტი აწერია — იხ. WRONG_CONTENT.
 * ყველა წესი იდემპოტენტურია: სკრიპტი უვნებლად გაიშვება ხელახლა.
 */

// ტექსტი სხვა გვარს ეკუთვნის — აპში არ უნდა მოხვდეს.
// გასწორება საიტის ბაზაში ჯერ საჭიროა, მერე ეს სია დაცარიელდება.
const WRONG_CONTENT = {
  "GRB-203": "აბაზაძე — ტექსტი ალიბეგაშვილისაა",
  "GRB-214": "გოგილაშვილი — ტექსტი დავითაშვილისაა",
  "GRB-194": "ვახანია — ტექსტი ვეზირიშვილისაა",
  "GRB-187": "თარბაია — ტექსტი ედიშერაშვილისაა",
  "GRB-134": "თევზაძე — ტექსტი ქვარიანებისაა",
  "GRB-272": "თევზაძეები — ტექსტი ქვარიანებისაა",
};

const MIN_HISTORY_CHARS = 120;

function readEnv(name) {
  if (process.env[name]) return process.env[name].trim();
  const envFile = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envFile)) return null;
  const re = new RegExp("^\\s*" + name + "\\s*=\\s*(.+?)\\s*$");
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(re);
    if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  }
  return null;
}

/** ერთ ხაზად, ზედმეტი ჰარეების გარეშე. */
function flatten(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

/** სათაურისა და AI-პრეამბულის მოჭრა. */
function stripPreamble(h) {
  let out = h.replace(/^\S{1,40}\s*[—–-]\s*გვარის ისტორია\s*/, "");
  out = out.replace(/^.{0,120}?მოიძიებულია:\s*/, "");
  return out.trim();
}

/** პირველი სიტყვა, ბოლო სასვენი ნიშნების გარეშე. */
function firstWord(h) {
  return (h.split(" ")[0] || "").replace(/[,.;:„“"()«»]+$/, "");
}

/** „თათელაშვილი / თათელიშვილი" და „ბერაძეები (ბერასძე)" → ორი ფორმა. */
function expandNames(name) {
  if (name.includes("/")) return name.split("/").map((s) => s.trim());
  if (name.includes("(")) {
    const before = name.split("(")[0].trim();
    const inside = (name.split("(")[1] || "").replace(")", "").trim();
    return [before, inside];
  }
  return [name.trim()];
}

function buildRows(source) {
  const candidates = [];
  const skipped = { short: 0, heading: 0, test: 0, wrong: 0, empty: 0 };

  for (const row of source) {
    const rawName = flatten(row.surname);

    if (!flatten(row.full_history)) {
      skipped.empty++;
      continue;
    }
    if (WRONG_CONTENT[row.crest_code]) {
      skipped.wrong++;
      continue;
    }
    if (rawName.includes(":")) {
      skipped.heading++;
      continue;
    }
    if (/^ტესტ/i.test(rawName)) {
      skipped.test++;
      continue;
    }

    const h = stripPreamble(flatten(row.full_history));
    if (h.length < MIN_HISTORY_CHARS) {
      skipped.short++;
      continue;
    }

    // „ედემაშვილების გვარი" → სწორი გვარი ტექსტის პირველი სიტყვაა
    const wasSuffixed = /გვარი$/.test(rawName);
    const name = wasSuffixed ? firstWord(h) : rawName;
    const preview = h.split(" ").slice(0, PREVIEW_WORDS).join(" ");

    for (const nm of expandNames(name)) {
      if (nm.length < 3) continue;
      candidates.push({
        surname: nm,
        crest_code: row.crest_code,
        preview,
        wasSuffixed,
      });
    }
  }

  // ერთ გვარზე ერთი ჩანაწერი: უპირატესობა სუფიქსის გარეშე ჩანაწერს,
  // მერე უფრო სრულ ტექსტს, მერე პატარა GRB კოდს.
  const byName = new Map();
  for (const c of candidates) {
    const prev = byName.get(c.surname);
    if (!prev) {
      byName.set(c.surname, c);
      continue;
    }
    const better =
      (prev.wasSuffixed && !c.wasSuffixed) ||
      (prev.wasSuffixed === c.wasSuffixed &&
        (c.preview.length > prev.preview.length ||
          (c.preview.length === prev.preview.length &&
            c.crest_code < prev.crest_code)));
    if (better) byName.set(c.surname, c);
  }

  const rows = [...byName.values()]
    .map(({ surname, crest_code, preview }) => ({ surname, crest_code, preview }))
    .sort((a, b) => a.surname.localeCompare(b.surname, "ka"));

  return { rows, skipped, duplicates: candidates.length - rows.length };
}

async function fetchSource(key) {
  const url =
    GVARIGEN_URL +
    "/rest/v1/surnames?select=surname,crest_code,full_history&limit=2000";
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: "Bearer " + key },
  });
  if (!res.ok) {
    throw new Error("gvarigen: " + res.status + " " + (await res.text()).slice(0, 300));
  }
  return res.json();
}

async function upload(rows, key) {
  const CHUNK = 40;
  let sent = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    // `full_history` უკანგამტარიანობისთვის ივსება იმავე ნაწყვეტით.
    // 2026-11-14-მდე აწყობილი ბილდები `full_history`-ს პირდაპირ კითხულობენ,
    // დაცვის გარეშე (`text.split(" ")`), ანუ NULL მათ გვარების ტაბს ამტვრევს.
    // ეს სრული ისტორია არ არის — იგივე 42 სიტყვაა, რაც `preview`-ში.
    // შეიძლება წაიშალოს, როცა ძველი ბილდები აღარ იქნება მიმოქცევაში.
    const chunk = rows.slice(i, i + CHUNK).map((r) => ({
      ...r,
      full_history: r.preview,
    }));
    const res = await fetch(APP_URL + "/rest/v1/surnames?on_conflict=surname", {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      console.error("\n❌ ატვირთვა: " + res.status + "\n" + (await res.text()).slice(0, 500));
      process.exit(1);
    }
    sent += chunk.length;
    process.stdout.write("\rატვირთვა: " + sent + "/" + rows.length);
  }
  process.stdout.write("\rატვირთვა: " + sent + "/" + rows.length + " ✓\n");
}

(async () => {
  const fromJson = process.argv.includes("--from-json");
  const dryRun = process.argv.includes("--dry-run");

  let rows;

  if (fromJson) {
    if (!fs.existsSync(OUT_FILE)) {
      console.error("❌ content/surnames.json არ არსებობს — გაუშვი --from-json-ის გარეშე.");
      process.exit(1);
    }
    rows = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
    console.log("content/surnames.json: " + rows.length + " გვარი");
  } else {
    const gvarigenKey = readEnv("GVARIGEN_SERVICE_ROLE_KEY");
    if (!gvarigenKey) {
      console.error(
        "\n❌ GVARIGEN_SERVICE_ROLE_KEY ვერ მოიძებნა.\n\n" +
          "დაამატე ერთი ხაზი .env.local-ში (git-ში არ მოხვდება):\n" +
          "  GVARIGEN_SERVICE_ROLE_KEY=sb_secret_...\n\n" +
          "აიღე: Supabase Dashboard → საიტის პროექტი →\n" +
          "Project Settings → API → service_role (secret).\n\n" +
          "ან, თუ JSON უკვე გაქვს: node scripts/import-surnames.js --from-json\n"
      );
      process.exit(1);
    }

    const source = await fetchSource(gvarigenKey);
    console.log("gvarigen.ge: " + source.length + " ჩანაწერი ჩამოვიდა");

    const built = buildRows(source);
    rows = built.rows;

    console.log(
      "გამოტოვებული: მოკლე " + built.skipped.short +
        ", სათაური " + built.skipped.heading +
        ", ტესტი " + built.skipped.test +
        ", სხვისი ტექსტი " + built.skipped.wrong +
        ", ცარიელი " + built.skipped.empty +
        "; დუბლიკატი " + built.duplicates
    );
    console.log("საბოლოო: " + rows.length + " გვარი");

    fs.writeFileSync(OUT_FILE, JSON.stringify(rows, null, 2) + "\n", "utf8");
    console.log("✓ content/surnames.json ჩაიწერა");
  }

  if (dryRun) {
    console.log("\n--dry-run: ბაზას არ შევეხე.\n");
    return;
  }

  const appKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!appKey) {
    console.error("\n❌ SUPABASE_SERVICE_ROLE_KEY ვერ მოიძებნა (.env.local).\n");
    process.exit(1);
  }

  await upload(rows, appKey);
  console.log("\n✅ მზადაა. შეამოწმე აპის გვარების ტაბი.\n");
})();
