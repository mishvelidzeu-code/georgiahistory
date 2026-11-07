# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**დღის ისტორია** (`georgia-history-app`) — a Georgian-language "this day in history" mobile app.
Expo SDK 54 / React Native 0.81 / expo-router v6 (file-based routing, typed routes on),
Supabase backend (auth + Postgres + storage). Targets iOS + Android only; there is no web target.
The app is **free** — the former PRIME/RevenueCat paywall was removed on 2026-11-07.

- Expo owner/slug: `mishvela` / `georgia-history-app`, EAS project `10febd73-7545-4658-9a01-a2680d34f272`
- Bundle id / package: `com.mishvela.georgiahistoryapp`
- Git remote: `https://github.com/mishvelidzeu-code/georgiahistory.git` (branch `main`)
- Supabase project: `cnfpgzhdqjntvakisgvn` ("ყოველდღიური ისოტრია", region ap-southeast-1).
  The previous project `lgygwpvectxaxdiujjna` was deleted. Schema, RLS and both edge functions are
  deployed; only the Google/Apple auth providers and the function secrets are still unset.

## Commands

```bash
npm start                 # expo start (dev server)
npm run android           # expo run:android
npm run ios               # expo run:ios
npm run lint              # expo lint — currently clean
npx tsc --noEmit          # type check — currently clean
npx expo export --platform ios --output-dir <dir>   # bundle smoke test
npx supabase link --project-ref <new-ref>
npx supabase db push      # apply supabase/migrations
npx supabase functions deploy delete-account
```

No tests, no CI (`.github/` is empty).

## Architecture

### Routing (`app/`)
- `app/_layout.tsx` — root `Stack`; wraps `AuthProvider → HistoryProvider → ThemeProvider(DarkTheme)`
  and sets up `expo-notifications`. Only `(tabs)` is declared; every other route is auto-registered
  by expo-router, so never declare a `<Stack.Screen>` for a file that doesn't exist.
- `app/index.tsx` → `app/SplashIntro.tsx` (animated intro + `assets/sounds/intro.wav`, then
  `router.replace("/(tabs)")`).
- `app/(tabs)/` — 5 tabs: `index` (ისტორია), `explore` (გვარები), `science` (მეცნიერება),
  `quiz` (ქვიზი), `profile` (პროფილი). The tab bar adds `useSafeAreaInsets().bottom` to its height
  and padding — without that it sits under the Android navigation bar.
- `app/premium/` — `births.tsx`, `world-events.tsx`, `medicina.tsx`. The folder name is historical;
  **these screens are free now**, they are just gated by login.
- Other routes: `settings.tsx`, `profile-details.tsx`, `login-callback.tsx` (OAuth return, renders
  `null`), `modal.tsx` (unused Expo template leftover).

### Login gate
Daily-history content is only shown to signed-in users. The pattern is:

```tsx
const { user, authLoading } = useAuth();
if (authLoading) return <Loader/>;
if (!user) return <AuthGate title=… message=… icon=… />;   // components/auth-gate.tsx
```

`AuthGate` sends the user to `/(tabs)/profile`, where the login/signup form lives.
Gated: home, science, world-events, medicina, births. Open: quiz, გვარები (explore), profile.

### State (`context/`)
- `AuthContext` — Supabase session/user + `onAuthStateChange`; exposes `user`, `session`, `authLoading`.
- `HistoryContext` — reads `daily_history` for today's Georgia date, caches in AsyncStorage under
  `daily_history_cache` as `{ key, data }` and only reuses the cache when `key` is still today.

### Dates
`services/date.ts` is the single source for Georgia time (UTC+4):
`getGeorgiaNow`, `getGeorgiaMonthDay`, `getGeorgiaDayKey` (`"MM-DD"`), `getGeorgiaDayStartIso`,
`getGeorgianMonthName`, `getGeorgianDateLabel`. Never recompute UTC+4 inline in a screen.

### Backend
- `services/supabase.ts` — single client; URL/key constants with `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` env override.
- Schema lives in `supabase/migrations/20261107090000_full_schema.sql` and is authoritative:
  `profiles`, `daily_history` (key `MM-DD`), `science_events`, `medicine_events`, `surnames`,
  `quiz_questions`, `quiz_scores`, the `leaderboard()` RPC (returns `username`, `total_score`),
  the `avatars` storage bucket, RLS on everything, and a `handle_new_user` trigger that creates a
  profile row for every new auth user (including Google/Apple sign-ups).
- Edge functions: `weekly-history-update` (cron, Wikipedia + OpenAI → `daily_history`, writes
  `date` as `MM-DD`, protected by `x-cron-secret`) and `delete-account` (service-role, deletes the
  avatar, the profile and the `auth.users` row — required by App Store 5.1.1(v)).

### Conventions
- Georgian UI strings inline; no i18n layer.
- Dark theme only. Palette: gold `#D4AF37`, backgrounds `#0A0D14` / `#111827`, text `#D1D5DB` / `#9CA3AF`.
- One screen per file, `StyleSheet.create` at the bottom of the same file.
- Path alias `@/*` → repo root.
- A list of cards carries its own `route` field — never a parallel array of routes (that caused an
  off-by-one bug on the home screen).

## Gotchas

- **Uncommitted work tree.** `main` equals `origin/main` (`490b50f`); everything since then,
  including all of the 2026-11-07 work, is uncommitted and unpushed.
- **Supabase is wired but not finished.** Still to do in the Dashboard: enable the Google and
  Apple auth providers (only `email` is on), set the `OPENAI_API_KEY` and `CRON_SECRET` function
  secrets, add `georgiahistoryapp://login-callback` to the redirect URLs, and schedule the
  `weekly-history-update` cron. Email confirmation is ON, so `signUp` returns no session until the
  user clicks the link — the profile screen branches on `data.session` for that.
- **All content tables are empty.** `daily_history` fills from the cron function; `science_events`,
  `medicine_events`, `quiz_questions` need rows; `surnames` comes from giftgrb.ge later.
- The project region is ap-southeast-1 (Singapore), which is far from Georgian users. Region cannot
  be changed after creation — moving to eu-central-1 means a new project plus re-running the
  migration.
- **Stale native prebuild.** `android/` exists locally (gitignored) at `versionCode 1` /
  `versionName "1.0.0"` while `app.json` says `1.0.1` / `2`. `app.json` changes (icon, permissions,
  `usesAppleSignIn`) only reach a local build after `npx expo prebuild --clean`.
- `react-native-purchases` is still in `package.json` although nothing imports it any more —
  `npm uninstall react-native-purchases` + a fresh prebuild when convenient.
- `expo-av` is deprecated on SDK 54 (replace with `expo-audio` before SDK 55); used only for the
  splash sound.
- `georgia-history-app-33d0ce4eea4a.json` (Google service account) sits in the repo root; it is
  gitignored and has never been committed — keep it that way. `google-services.json` **is** committed.
- `supabase/.temp/` still points at the deleted project until the CLI is re-linked.

## Working rules

- Don't commit secrets, the service-account JSON, or the `android/` / `ios` folders.
- Keep Georgian UI copy in Georgian; match the existing palette and card/gradient style.
- Any schema change goes into `supabase/migrations/`, never only into the hosted project.
- Before handing work back: `npx tsc --noEmit`, `npm run lint`, and an
  `npx expo export --platform ios` bundle check. All three are currently clean.
