/**
 * ყოველდღიური ქვიზის აგება **წინა დღის** კონტენტიდან.
 *
 *   8 ნოემბრის ქვიზი ← 7 ნოემბრის ისტორია, მეცნიერება და მედიცინა
 *
 * თითო კითხვა: „რომელ წელს …?“ — ოთხი ვარიანტი, ერთი სწორი.
 * ფაქტები მხოლოდ content/*.json-იდან მოდის, ანუ არაფერია გამოგონილი.
 *
 * გაშვება:  node scripts/build-quiz.js
 * შედეგი:   content/quiz_questions.json
 */

const fs = require("fs");
const path = require("path");

const CONTENT = path.join(__dirname, "..", "content");
const MAX_PER_DAY = 5;
const MAX_QUESTION_LEN = 150;

const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const load = (f) => JSON.parse(fs.readFileSync(path.join(CONTENT, f), "utf8"));

const daily = new Map();
for (const r of load("daily_history.json")) daily.set(r.date, r);

const science = new Map();
for (const r of load("science_events.json")) {
  science.set(`${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`, r);
}

const medicine = new Map();
for (const r of load("medicine_events.json")) {
  medicine.set(`${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`, r);
}

const key = (m, d) => `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** წინა დღე (1 იანვრის წინა დღე 31 დეკემბერია) */
function prevDay(m, d) {
  if (d > 1) return [m, d - 1];
  const pm = m === 1 ? 12 : m - 1;
  return [pm, DAYS_IN[pm - 1]];
}

/** "1918 — გამოცხადდა რესპუბლიკა." → { year: 1918, text: "გამოცხადდა რესპუბლიკა" } */
function parseFact(line) {
  const m = line.match(/^(\d{3,4})\s*—\s*(.+)$/);
  if (!m) return null;
  const year = Number(m[1]);
  let text = m[2].trim().replace(/\s+/g, " ").replace(/[.\s]+$/, "");
  if (text.length < 25) return null;
  if (text.length > MAX_QUESTION_LEN) {
    const cut = text.slice(0, MAX_QUESTION_LEN);
    text = cut.slice(0, cut.lastIndexOf(" "));
  }
  return { year, text };
}

/** სავარაუდო, მაგრამ არასწორი წლები */
function decoys(year, rnd) {
  const spread = year < 1500 ? 60 : year < 1900 ? 25 : 12;
  const out = new Set();
  let guard = 0;
  while (out.size < 3 && guard++ < 200) {
    const delta = 1 + Math.floor(rnd() * spread);
    const candidate = rnd() < 0.5 ? year - delta : year + delta;
    if (candidate === year || candidate < 1 || candidate > 2026) continue;
    out.add(candidate);
  }
  while (out.size < 3) out.add(year + out.size + 1);
  return [...out];
}

/** დეტერმინისტული შემთხვევითობა — ხელახლა გაშვებისას იგივე ქვიზი გამოდის */
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const questions = [];

for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= DAYS_IN[m - 1]; d++) {
    const [pm, pd] = prevDay(m, d);
    const pk = key(pm, pd);
    const rnd = seeded(m * 1000 + d);

    const facts = [];

    const day = daily.get(pk);
    if (day) {
      for (const field of ["georgia_content", "world_content"]) {
        for (const line of String(day[field] || "").split("\n\n")) {
          const f = parseFact(line.trim());
          if (f) facts.push({ ...f, category: "ისტორია" });
        }
      }
    }

    const sci = science.get(pk);
    if (sci?.year) facts.push({ year: sci.year, text: sci.title.replace(/[….]+$/, ""), category: "მეცნიერება" });

    const med = medicine.get(pk);
    if (med?.year) facts.push({ year: med.year, text: med.title.replace(/[….]+$/, ""), category: "მედიცინა" });

    // კატეგორიები შერეული იყოს: 3 ისტორია + 1 მეცნიერება + 1 მედიცინა,
    // თუ რომელიმე აკლია — ისტორიით ივსება.
    const seen = new Set();
    const uniq = [];
    for (const f of facts) {
      const sig = f.text.slice(0, 40);
      if (seen.has(sig)) continue;
      seen.add(sig);
      uniq.push(f);
    }

    const byCat = (c) => uniq.filter((f) => f.category === c);
    const picked = [
      ...byCat("ისტორია").slice(0, 3),
      ...byCat("მეცნიერება").slice(0, 1),
      ...byCat("მედიცინა").slice(0, 1),
    ];
    for (const f of uniq) {
      if (picked.length >= MAX_PER_DAY) break;
      if (!picked.includes(f)) picked.push(f);
    }
    picked.length = Math.min(picked.length, MAX_PER_DAY);

    picked.forEach((f, i) => {
      const options = [String(f.year), ...decoys(f.year, rnd).map(String)];
      // არევა (დეტერმინისტულად)
      for (let j = options.length - 1; j > 0; j--) {
        const k = Math.floor(rnd() * (j + 1));
        [options[j], options[k]] = [options[k], options[j]];
      }

      questions.push({
        month: m,
        day: d,
        sort_order: i + 1,
        category: f.category,
        question: `რომელ წელს ${f.text}?`,
        option1: options[0],
        option2: options[1],
        option3: options[2],
        option4: options[3],
        correct: String(f.year),
      });
    });
  }
}

fs.writeFileSync(
  path.join(CONTENT, "quiz_questions.json"),
  JSON.stringify(questions, null, 1),
  "utf8"
);

const days = new Set(questions.map((q) => `${q.month}-${q.day}`));
console.log(`კითხვები: ${questions.length}`);
console.log(`დღეები: ${days.size} / 366`);
console.log(`საშუალოდ დღეში: ${(questions.length / days.size).toFixed(1)}`);
