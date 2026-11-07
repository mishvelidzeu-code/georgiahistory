// საქართველოს დრო (UTC+4) — ერთი წყარო მთელი აპლიკაციისთვის.
// აქამდე ეს ლოგიკა 4 სხვადასხვა ფაილში იყო დუბლირებული.

const GEORGIA_UTC_OFFSET_HOURS = 4;

const GEORGIAN_MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];

/** მიმდინარე მომენტი საქართველოს დროით. */
export function getGeorgiaNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + GEORGIA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

/** დღევანდელი თვე/დღე საქართველოს დროით. */
export function getGeorgiaMonthDay(): { month: number; day: number } {
  const georgia = getGeorgiaNow();
  return { month: georgia.getMonth() + 1, day: georgia.getDate() };
}

/**
 * დღის გასაღები `MM-DD` ფორმატში — ზუსტად იმ ფორმატში, რომელშიც
 * `weekly-history-update` edge function წერს `daily_history.date`-ს.
 * წელი განზრახ არ შედის: „ამ დღეს ისტორიაში" კონტენტი ყოველწლიურად ბრუნდება.
 */
export function getGeorgiaDayKey(): string {
  const { month, day } = getGeorgiaMonthDay();
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * დღევანდელი დღის დასაწყისი (საქართველოს შუაღამე) ISO ფორმატში.
 * გამოიყენება ბაზაში `created_at >= ...` შედარებისთვის.
 */
export function getGeorgiaDayStartIso(): string {
  const georgia = getGeorgiaNow();
  const utcMidnight = Date.UTC(
    georgia.getFullYear(),
    georgia.getMonth(),
    georgia.getDate()
  );
  return new Date(
    utcMidnight - GEORGIA_UTC_OFFSET_HOURS * 60 * 60 * 1000
  ).toISOString();
}

/** თვის სახელი ქართულად (1–12). */
export function getGeorgianMonthName(month: number): string {
  return GEORGIAN_MONTHS[month - 1] ?? "";
}

/** მაგ. „7 ნოემბერი" — საქართველოს დროით. */
export function getGeorgianDateLabel(): string {
  const georgia = getGeorgiaNow();
  return `${georgia.getDate()} ${getGeorgianMonthName(georgia.getMonth() + 1)}`;
}
