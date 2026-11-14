# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**დღის ისტორია** (`georgia-history-app`) — a Georgian-language "this day in history" mobile app.
Expo SDK 54 / React Native 0.81 / expo-router v6 (file-based routing, typed routes on),
Supabase backend (auth + Postgres + storage). iOS + Android only; there is no web target.
The app is **free** — the PRIME/RevenueCat paywall was removed on 2026-11-07.

- Expo owner/slug: `mishvela` / `georgia-history-app`, EAS project `10febd73-7545-4658-9a01-a2680d34f272`
- Bundle id / package: `com.mishvela.georgiahistoryapp`
- Git remote: `https://github.com/mishvelidzeu-code/georgiahistory.git` (branch `main`)
- Supabase project: `cnfpgzhdqjntvakisgvn` ("ყოველდღიური ისოტრია", ap-southeast-1).
  The earlier project `lgygwpvectxaxdiujjna` was deleted; schema, RLS, content and all three
  edge functions are deployed to the new one.

## Commands

```bash
npm start                 # expo start
npm run android / ios     # local native run
npm run lint              # expo lint — currently clean
npx tsc --noEmit          # type check — currently clean
npx expo export --platform ios --output-dir <dir>   # bundle smoke test
node scripts/import-content.js                       # content → Supabase (needs .env.local)
npx eas-cli build --platform ios --profile production --auto-submit
npx eas-cli update --branch production --message "…"  # OTA, works from build 11 onward
```

No tests, no CI (`.github/` is empty).

## Secrets

`.env.local` (gitignored) holds `SUPABASE_SERVICE_ROLE_KEY`, used only by
`scripts/import-content.js`. Never commit it, never print the key, never pass it through chat.
`.gitignore` blocks `.env`, `.env.*` and `.env*.local`. The Google service-account JSON in the
repo root is also gitignored and has never been committed — it belongs to the removed RevenueCat
integration and should be revoked in Google Cloud.

## Architecture

### Routing (`app/`)
- `app/_layout.tsx` — root `Stack`; wraps `AuthProvider → HistoryProvider → ThemeProvider(DarkTheme)`,
  mounts `NotificationBootstrap`, sets the notification handler. Only `(tabs)` is declared; every
  other route is auto-registered, so never declare a `<Stack.Screen>` for a file that doesn't exist.
- `app/index.tsx` → `app/SplashIntro.tsx` → `router.replace("/(tabs)")`.
- `app/(tabs)/` — 5 tabs: `index` (ისტორია), `explore` (გვარები), `calendar` (კალენდარი),
  `quiz` (ქვიზი), `profile` (პროფილი). The tab bar adds `useSafeAreaInsets().bottom` to height
  and padding — without it the icons sit under the Android navigation bar.
- `app/premium/` — `births.tsx`, `world-events.tsx`, `medicina.tsx`, `science.tsx`. The folder name
  is historical; these screens are free, only login-gated, and each is opened from a card in the
  home gallery (order: world → science → medicine → births). Each hero is a photo from
  `assets/gallery/` with a dark gradient, the section label and today's date.
- `calendar.tsx` shows the month grid with holidays from the `holidays` table. Every holiday of the
  shown month is rendered as a full card right under the grid — date, title, short description,
  a day-off / აღსანიშნავი badge and a collapsible „სრული ისტორია" section fed by
  `holidays.history` (paragraphs split on `

`). Nothing is hidden behind a tap; tapping a day
  in the grid only highlights its card and scrolls to it (`jumpToCard`). Easter-based days
  (წითელი პარასკევი, დიდი შაბათი, აღდგომა, შავი ორშაბათი) are **computed in the app**
  (`orthodoxEaster`, Meeus Julian + 13 days), not stored.
- `admin.tsx` — admin dashboard, fed by the `admin_stats()` RPC. The entry point is a menu row
  in the profile tab that only renders when `profiles.role === 'admin'`.
- Other routes: `settings.tsx`, `profile-details.tsx`, `login-callback.tsx`, `modal.tsx` (unused).

### Login gate
Daily-history content is shown only to signed-in users:

```tsx
const { user, authLoading } = useAuth();
if (authLoading) return <Loader/>;
if (!user) return <AuthGate title=… message=… icon=… />;   // components/auth-gate.tsx
```

`AuthGate` sends the user to `/(tabs)/profile`, where the login/signup form lives.
Gated: every content screen — home, science, world-events, medicina, births, quiz and
გვარები (explore). Only the profile tab (which holds the login form) is open.

### Notifications
`services/notifications.ts` is the single place for the Android channel (`daily-history`),
permission, the 10:00 daily reminder and the push token.
`components/notification-bootstrap.tsx` asks for permission **once, after login** (never on the
splash), then schedules the reminder, stores the token and routes notification taps via
`data.screen`. Never call `cancelAllScheduledNotificationsAsync()` from a screen — that bug wiped
the daily reminder on every app open.

### State & dates
- `AuthContext` — session/user + `authLoading`.
- `HistoryContext` — reads `daily_history` for today's Georgia key, caches `{ key, data }` in
  AsyncStorage and only reuses the cache when `key` is still today.
- `services/date.ts` is the only source for Georgia time (UTC+4): `getGeorgiaNow`,
  `getGeorgiaMonthDay`, `getGeorgiaDayKey` (`"MM-DD"`), `getGeorgiaDayStartIso`,
  `getGeorgianMonthName`, `getGeorgianDateLabel`. Never recompute UTC+4 inline.

### Backend
- `services/supabase.ts` — one client; URL + publishable key as constants with
  `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` overrides.
- Schema lives in `supabase/migrations/` — five files, all applied to the project:
  - `20261107090000_full_schema.sql` — `profiles`, `daily_history` (text key `MM-DD`),
    `science_events`, `medicine_events`, `surnames`, `quiz_questions`, `quiz_scores`, the
    `avatars` bucket, RLS everywhere, and a `handle_new_user` trigger that creates a profile for
    every new auth user.
  - `20261107140000_quiz_rating.sql` — `quiz_questions.sort_order` + its unique index, the
    cumulative `leaderboard()` (`username`, `total_score`, `days_played`) and `my_quiz_rank()`
    (authenticated only).
  - `20261107150000_holidays.sql` — the `holidays` table (`month`, `day`, `title`, `description`,
    `is_dayoff`), read by the calendar tab.
  - `20261114120000_holidays_history.sql` — `holidays.history` (nullable text), the long
    story shown in the calendar's collapsible „სრული ისტორია" panel.
  - `20261114170000_surnames_preview.sql` — `surnames.crest_code` (`GRB-NNN`, the gvarigen.ge
    deep-link key, non-unique: one code can carry several name forms) + `surnames.preview`
    (first 42 words), and `full_history` made nullable. It is still written, as a copy of
    `preview`: builds shipped before 2026-11-14 read `full_history` with no null guard
    (`text.split(" ")`), so a NULL there crashes their გვარები tab. Drop it only once those
    builds are gone.
  - `20261114160000_admin_stats.sql` — `admin_stats()`, one security-definer RPC returning the
    whole admin dashboard as jsonb (users, auth providers, quiz activity, content coverage,
    today's content, 14-day series, top players, recent signups). Non-admins get 42501.
- Edge functions: `weekly-history-update` (cron, Wikipedia + OpenAI → `daily_history`; currently
  **unused** — content is maintained by hand), `delete-account` (service-role, full account
  deletion for App Store 5.1.1(v)), `send-daily-push` (cron secret, Expo Push API, cleans up
  `DeviceNotRegistered` tokens).

### Content
`content/` holds the source of truth, mirrored into the database by `scripts/import-content.js`
(upsert, safe to re-run):
- `daily_history.json` — 366 days, built from Georgian Wikipedia day pages.
- `science_events.json` — 366 days; March came from a hand-written CSV, 74 days were written from
  English Wikipedia, the rest from the Georgian pages.
- `medicine_events.json` — 222 days; 144 days are intentionally empty (no sourced event).
- `holidays.json` — 17 rows: 13 public holidays + 4 observances. Each has a short
  `description` (the card) and a long `history` (3 paragraphs, split on `

`, shown in the
  card's collapsible section). The 4 Easter-based days carry their `history` inline in `calendar.tsx`.
- `surnames.json` — the surname registry, imported from the **gvarigen.ge project**
  (`lcmipkdelgyzqniqtrtv`) by `scripts/import-surnames.js`, not written by hand. Each row is
  `{ surname, crest_code, preview }`. Only the 42-word preview ships; the full history stays on
  the site. The script cleans the source (an AI-reply preamble, title prefixes, `„…ების გვარი"`
  surname fields, one-word rows, 6 rows carrying another surname's text — `WRONG_CONTENT`) and
  is idempotent. Needs `GVARIGEN_SERVICE_ROLE_KEY` in `.env.local` next to the app's key.
- `quiz_questions.json` — 1823 questions, 366 days × 5, generated by `scripts/build-quiz.js`
  from the **previous** day's facts. A question shows the fact verbatim, then asks
  „რომელ წელს მოხდა?" on its own line — never splice the fact into the question, and never
  truncate it, or the Georgian breaks. Regenerate with `node scripts/build-quiz.js`.
`content-templates/` holds CSV templates for filling tables by hand.
Facts come from sources and are never invented; if a day has no event, leave it empty rather than
making one up — the screens all have empty states.

### Conventions
- Georgian UI strings inline; no i18n layer. Dark theme only.
- Palette: gold `#D4AF37`, backgrounds `#0A0D14` / `#111827`, text `#D1D5DB` / `#9CA3AF`.
- One screen per file, `StyleSheet.create` at the bottom.
- Path alias `@/*` → repo root.
- A list of cards carries its own `route` field — never a parallel array of routes.
- **Never set `fontFamily: 'Georgia'` / `'serif'` on Georgian text** — those faces have no
  Mkhedruli glyphs and iOS substitutes per character, which looks broken. **Never use
  `textAlign: 'justify'`** either; it stretches the spacing badly in Georgian. The one custom font
  in the project is Great Vibes (`assets/fonts/`, OFL), loaded with `expo-font` on the explore
  screen for the Latin `gvarigen.ge` link only.
- Switching tabs from inside `(tabs)` needs `navigation.navigate("index")`;
  `router.replace("/(tabs)")` is a no-op there (that is how the post-login jump to the history tab
  is done in `profile.tsx`).

## Gotchas

- **Auth is fully working**: email, Google and Apple are all enabled and tested, email
  confirmation is OFF (`mailer_autoconfirm: true`), and `georgiahistoryapp://login-callback` is in
  the redirect URLs. Google goes through `signInWithOAuth` + `WebBrowser` and the handler accepts
  both `#access_token` (implicit, the current flow) and `?code` (PKCE); Apple uses the native
  `signInWithIdToken`, which is why it kept working while the redirect URL was still missing.
- **Still unset in Supabase**: the `OPENAI_API_KEY` / `CRON_SECRET` function secrets, and no cron
  is scheduled, so `weekly-history-update` and `send-daily-push` never run.
- **Admin is a DB flag, not a hardcoded email**: `is_admin()` checks `profiles.role = 'admin'`.
  Grant it with a direct `update public.profiles set role = 'admin' where …` against the hosted
  project — never put an email address in the repo.
- Typed routes are generated by the dev server into `.expo/types/router.d.ts`, which is gitignored
  and usually stale (it still lists removed routes and misses new ones). That is why `router.push`
  to a newer route is written `router.push("/admin" as any)` — the same cast the home gallery uses.
- **The app is the free teaser, gvarigen.ge is the depth.** `gvarigen.ge` 308-redirects to
  `giftgrb.ge`, but deep links work through either domain, so the app always writes
  `gvarigen.ge` — the nicer brand. The surname card shows a 15-word cut and two buttons:
  „ნახე საიტზე" → `/gvari/<crest_code>` and „შეუკვეთე გერბი / წიგნი" → `/gerbi-gverdi`;
  the not-found box sends the typed surname to `/gvari?surname=…`. Every outbound link carries
  `utm_source=app`. Never word a button as „unlock the full text" — the site sells that text for
  15/25 ₾ and an in-app purchase promise would be an App Store 3.1.1 rejection. Selling the
  gerbi, the book, boxes and commissioned research is a service, so linking to it is safe.
- `surnames` is filled by `node scripts/import-surnames.js` (409 rows after cleaning, out of 447
  in the source). The source is maintained by hand on the site, so re-run the script whenever
  the registry grows. Search is still `.eq("surname", …)` — exact match only, so a typo or a
  plural form finds nothing; a prefix/`ilike` search and an alphabetical browse (the site has
  `/gvarebi`) are the obvious next step.
- The quiz rating is cumulative: `leaderboard()` sums every day's score and returns `days_played`;
  `my_quiz_rank()` gives the signed-in user their own total and rank. A skipped day simply has no
  row, so it counts as 0.
- **OTA works from build 11 (2026-11-07) onward** — `eas.json` had no `channel` before that, so
  older builds can never receive an update. `runtimeVersion` follows `appVersion`, so an update
  only reaches builds of the **same** version: today that is **1.2.0**. Bumping `app.json`'s
  version starts a new OTA lane. Native changes
  (permissions, icons, entitlements, new native packages) always need a new build.
- **App Store state (2026-11-14):** the live version is **1.1**; **1.2.0 (build 14)** is
  *Waiting for Review*, set to release automatically to all users once approved. Build numbers are
  managed by EAS (`appVersionSource: "remote"` + `autoIncrement`), so `app.json`'s `buildNumber`
  and `versionCode` are ignored — never bump them by hand.
- **The store listing locale is English (U.K.)**, and App Store Connect **rejects Georgian script
  in "What's New"** ("This field contains one or more invalid characters"). Release notes and the
  description are therefore in English. A Georgian localisation would need its own name,
  description, keywords and screenshots.
- **App Review needs a working demo account**, because every content screen is login-gated. It
  lives in the version's App Review Information and must exist in the *current* Supabase project
  (`cnfpgzhdqjntvakisgvn`). The account inherited from the deleted project was gone and would have
  caused a Guideline 2.1 rejection, so check it with
  `select email from auth.users where email = '…'` before every submission. Never put the password
  in this repo.
- When the paywall was removed, the **review notes and the store description still advertised
  PRIME** — they asked the reviewer to test a subscription that no longer exists. Both were
  rewritten on 2026-11-14. Removing a feature means checking the App Store metadata too.
- Apple's **age-rating questionnaire was re-issued** (7 steps) and blocks submission until the new
  questions are answered. The answers keep the app at **4+**; advertising is declared **No** (there
  is no ad SDK anywhere in the project). One answer worth re-checking: *Contests* is **None**,
  although the quiz has a cumulative leaderboard where users compete for ranking — there are no
  prizes or rewards.
- Apple rejects a build whose version is not higher than the last approved one (errors 90186 /
  90062) — that is why the version jumped from 1.0.1 to 1.2.0.
- `eas.json` carries `submit.production.ios.ascAppId = 6760388933`, so `--auto-submit` works
  non-interactively. The iOS distribution certificate is shared with the user's other apps —
  never create a new one (the Apple limit is 3); reuse the existing one via `eas credentials`.
- Project region is ap-southeast-1 (Singapore), far from Georgian users; the region cannot be
  changed after creation.
- Email confirmation is OFF, so `signUp` returns a session immediately; the profile screen still
  branches on `data.session` in case it is turned back on.
- `expo-av` is deprecated on SDK 54 (replace with `expo-audio` before SDK 55); used only for the
  splash sound.
- Local `android/` is gitignored and stale (`versionCode 1`); `app.json` changes only reach a local
  build after `npx expo prebuild --clean`. EAS builds prebuild in the cloud and are unaffected.

## Working rules

- Don't commit secrets, the service-account JSON, or the `android/` / `ios` folders.
- Keep Georgian UI copy in Georgian; match the existing palette and card/gradient style.
- Any schema change goes into `supabase/migrations/`, never only into the hosted project.
- Content changes go into `content/*.json` first, then into the database via the import script —
  so the repo always holds a restorable backup.
- Before handing work back: `npx tsc --noEmit`, `npm run lint`, and an
  `npx expo export --platform ios` bundle check. All three are currently clean.
