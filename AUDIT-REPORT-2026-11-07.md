# აუდიტის რეპორტი — დღის ისტორია (georgia-history-app)

თარიღი: 2026-11-07 · შემოწმებულია HEAD `490b50f` + ლოკალური (არა-დაკომიტებული) ცვლილებები
კოდი **არ შეცვლილა**. დამატებულია მხოლოდ ორი დოკუმენტი: `CLAUDE.md` და ეს რეპორტი.

---

## 1. ჯანმრთელობის შეჯამება

| შემოწმება | შედეგი |
|---|---|
| TypeScript (`npx tsc --noEmit`) | ✅ სუფთა (მხოლოდ `Deno` გლობალები edge function-ში) |
| ESLint (`npm run lint`) | ✅ 0 error, ⚠️ 12 warning |
| iOS JS bundle (`expo export --platform ios`) | ✅ აეწყო (4.72 MB) — მოდულები და asset-ები ადგილზეა |
| Web export (`expo export --platform web`) | ❌ ჩავარდა — `window is not defined` |
| Expo config (`expo config`) | ✅ იკითხება |
| GitHub remote | ✅ ხელმისაწვდომია, `main` = `origin/main` (0 ahead / 0 behind) |
| Supabase (კონფიგი/მიგრაციები/CLI link) | ⚠️ ნაწილობრივ — ცოცხალი ბაზა ამ გარემოდან ვერ შემოწმდა |
| ტესტები / CI | ❌ არ არსებობს (`.github/` ცარიელია) |

**მთავარი დასკვნა:** აპლიკაცია თავისთავად იწყობა და იბილდება — ჩამტვრეული bundle არ გაქვს.
პრობლემა არის ნახევრად დასრულებული რეფაქტორინგი (წაშლილი ეკრანები, რომლებზეც ბმულები დარჩა)
და მონაცემების ფორმატის შეუთავსებლობა, რაც მთავარ ეკრანს ცარიელს ტოვებს.

---

## 2. კრიტიკული პრობლემები (აღდგენისას პირველ რიგში)

### 2.1 გალერეის ბმულები არასწორ ეკრანებზე მიდის — `app/(tabs)/index.tsx:100`
`GALLERY_ITEMS`-ში 3 ბარათია (მსოფლიო ისტორია / მედიცინის მატიანე / პიროვნებები),
ხოლო `premiumRoutes`-ში 4 მისამართი და პირველი არის წაშლილი `/premium/georgia-events`:

```
ბარათი 0 "მსოფლიო ისტორია"   → /premium/georgia-events  (ფაილი წაშლილია → Unmatched Route)
ბარათი 1 "მედიცინის მატიანე" → /premium/world-events    (არასწორი ეკრანი)
ბარათი 2 "პიროვნებები"        → /premium/medicina        (არასწორი ეკრანი)
```

ანუ პრემიუმ მომხმარებელს სამივე ბარათი არასწორად მუშაობს, პირველი — საერთოდ ცდება.

### 2.2 `daily_history.date` ფორმატის შეუთავსებლობა
- Edge function (`supabase/functions/weekly-history-update/index.ts:107`) წერს
  `date = "MM-DD"` (მაგ. `11-07`).
- `context/HistoryContext.tsx:42` კითხულობს `date = "YYYY-MM-DD"` (მაგ. `2026-11-07`).

შედეგი: `history` რჩება `null` → მთავარ ეკრანზე ჩანს
„ინფორმაცია ამ დღისათვის ჯერ არ არის დამატებული", ხოლო `premium/births.tsx` და
`premium/world-events.tsx` სამუდამოდ ლოდერზე რჩება (`if (!history) return <ActivityIndicator/>`).
**ეს უნდა გადამოწმდეს ცოცხალ ბაზაში** — რომელი ფორმატი აქვს `date` სვეტს რეალურად.

### 2.3 Web ბილდი ჩავარდნილია
`app.json`-ში `web.output: "static"`, მაგრამ static rendering-ის დროს `services/supabase.ts`
იმპორტზევე ამუშავებს AsyncStorage-ს → `ReferenceError: window is not defined`.
ასევე `web.favicon` მიუთითებს `./assets/images/favicon.png`-ზე, რომელიც HEAD კომიტში წაიშალა.
თუ web არ არის სამიზნე — სჯობს `web` ბლოკი საერთოდ მოიხსნას, რომ `expo start --web` არ ჩავარდეს.

---

## 3. მნიშვნელოვანი (მაღაზიისთვის / გამოშვებისთვის)

1. **Apple Sign In წინააღმდეგობა.** `app/(tabs)/profile.tsx` იყენებს
   `expo-apple-authentication`-ს და plugin-იც ჩართულია, მაგრამ `app.json`-ში
   `ios.usesAppleSignIn: false` (წინა კომიტში `true` იყო). entitlement-ის გარეშე iOS-ზე
   Apple-ით შესვლა ვერ იმუშავებს. App Store-ის წესებით, თუ Google შესვლა არსებობს,
   Apple შესვლაც სავალდებულოა.
2. **`android.permission.RECORD_AUDIO` ორჯერ არის მითითებული** `app.json`-ში და აპლიკაცია
   მიკროფონს არ იყენებს (მხოლოდ `expo-av`-ით ხმას უკრავს). Play Store-ზე ზედმეტი
   ნებართვა review-ს ართულებს.
3. **ხატულა `.jpg` ფორმატშია** (`assets/images/icon.jpg`, `icon.png` წაიშალა). iOS-ის
   ხატულა უნდა იყოს PNG გამჭვირვალობის გარეშე — `.jpg` რისკია App Store-ისთვის.
4. **ლოკალური `android/` prebuild მოძველებულია**: `versionCode 1` / `versionName "1.0.0"`,
   როცა `app.json`-ში `1.0.1` / `versionCode 2`. `app.json`-ის ცვლილებები (ხატულა,
   ნებართვები) არ გავრცელდება სანამ `npx expo prebuild --clean` ან EAS cloud build არ გაეშვება.
   (`eas.json`-ში `appVersionSource: "remote"` — ვერსიებს EAS მართავს.)
5. **`expo-av` SDK 54-ზე deprecated-ია** — SDK 55-ში მოიხსნება. ერთადერთი გამოყენება:
   `SplashIntro.tsx`-ის ხმა. შემცვლელი: `expo-audio`.
6. **პრემიუმ ეკრანებს საკუთარი დაცვა არ აქვს.** `/premium/*`-ზე შესვლა იფილტრება მხოლოდ
   მთავარი ეკრანის tap-ზე; deep link-ით ან `router.push`-ით შემოვლა შესაძლებელია, ხოლო
   `premium/medicina.tsx` `isPremium`-ს საერთოდ არ ამოწმებს.
7. **თემის გადამრთველი არაფერს აკეთებს.** `ThemeProviderCustom` (`context/ThemeContext.tsx`)
   არსად არ არის მონტაჟებული, ამიტომ `app/settings.tsx`-ის და `app/(tabs)/_layout.tsx`-ის
   `useThemeCustom()` იღებს default-ს, `toggleTheme` — ცარიელი ფუნქციაა.
8. **`app/_layout.tsx` აცხადებს არარსებულ ეკრანებს** (`premium/georgia-events`,
   `(modals)/auth`) → expo-router წერს `No route named …` warning-ს. კრახი არ არის,
   მაგრამ ნაგავია.

---

## 4. Git / GitHub კავშირი

- Remote: `origin → https://github.com/mishvelidzeu-code/georgiahistory.git` — ✅ წაკითხვადი
  (`git ls-remote` მუშაობს).
- `main` ზუსტად უდრის `origin/main`-ს (`490b50f`), ანუ **GitHub-ზე ბოლო სამუშაო არ არის ატვირთული**.
- სამუშაო დირექტორიაში დაუკომიტებელი ცვლილებებია:

```
M  app.json                        M  app/(tabs)/profile.tsx
M  app/(tabs)/_layout.tsx          M  app/(tabs)/science.tsx
M  app/(tabs)/index.tsx            M  app/SplashIntro.tsx
M  app/subscription.tsx            M  context/PremiumContext.tsx
D  app/(tabs)/explore.tsx          D  app/premium/georgia-events.tsx
D  assets/gallery/7.webp           D  assets/images/icon.png
?? assets/images/icon.jpg          ?? supabase/migrations/
```

- **მიგრაციების საქაღალდე (`supabase/migrations/`) ჯერ არ არის git-ში** — ანუ სქემის
  ერთადერთი ვერსიონირებული ასლი მხოლოდ ამ კომპიუტერზეა.
- `.github/` ცარიელია — CI/Actions არ არის.
- საიდუმლოებები: `georgia-history-app-33d0ce4eea4a.json` (Google service account) ლოკალურად
  არის, `.gitignore`-შია და **არასდროს დაკომიტებულა** ✅. `google-services.json` კი
  დაკომიტებულია (Firebase-ის კლიენტის კონფიგი — კრიტიკული არ არის, მაგრამ იდეალში env-ში იყოს).
- `.gitignore` უგულებელყოფს `/ios`-ს და `/android`-ს, თუმცა `android/` ლოკალურად არსებობს.

### დარჩენილი ნაბიჯი აღდგენისთვის
ლოკალური ცვლილებები უნდა ან დაკომიტდეს, ან დაბრუნდეს. სანამ გადაწყვეტ, ღირს ასლის აღება:
```
git stash list; git branch backup-local-$(date +%Y%m%d)
```

---

## 5. Supabase კავშირი

| ელემენტი | მდგომარეობა |
|---|---|
| Project ref | `lgygwpvectxaxdiujjna` (`supabase/.temp/project-ref`) — CLI დალინკულია |
| Pooler | `aws-1-eu-central-1`, Postgres `17.6.1.063`, GoTrue `v2.187.0` |
| კლიენტი | `services/supabase.ts` — URL + publishable key **ჩაშენებულია კოდში**, `.env` არ არსებობს |
| Auth | email/password, Google OAuth (`expo-web-browser` + `login-callback`), Apple (iOS) |
| Storage | bucket `avatars` (ავატარი `<user_id>.jpg` სახელით, `upsert: true`) |
| Edge function | `weekly-history-update` — `verify_jwt = true`, `x-cron-secret` შემოწმება, OpenAI `gpt-4.1-mini` |
| CLI ვერსია | ლოკალური 2.75.0 / npx 2.122.0 (ხელმისაწვდომია v3.0.0) |

### სქემის შეუთავსებლობა (მნიშვნელოვანი)
კოდი ეძახება: `profiles`, `daily_history`, `science_events`, `medicine_events`,
`quiz_questions`, `quiz_scores`, RPC `leaderboard`, bucket `avatars`.

მიგრაცია (`20260409_create_profiles_and_daily_feed.sql`) ქმნის მხოლოდ:
`profiles` + `daily_feed_items` (+ RLS, `is_admin()`, `has_active_premium()`).

- `daily_feed_items` აპლიკაციის კოდში **არსად არ გამოიყენება** — მკვდარი სქემაა
  (ან დაუმთავრებელი მიგრაციის გეგმა „ყველაფერი ერთ ცხრილში").
- `daily_history`, `science_events`, `medicine_events`, `quiz_questions`, `quiz_scores`
  და `leaderboard` RPC **მიგრაციებში არ არის** — ანუ ცოცხალი ბაზა რეპოზიტორიას უსწრებს.
  თუ ბაზა ვინმემ წაშალა/გადაიტანა, რეპოდან მისი აღდგენა შეუძლებელია.

### რისი შემოწმება ვერ მოხერხდა
ამ გარემოდან გარე HTTPS ბლოკირებულია (`curl`/`fetch` → DNS error, ბრაუზერის პანელმა
`*.supabase.co` არ გაუშვა), ამიტომ **ცოცხალი ბაზა, RLS-ის რეალური ქცევა, ცხრილების არსებობა
და `date` სვეტის ფორმატი ვერ გადამოწმდა**. შენს მხარეს ამას გაშვება დაადასტურებს:

```bash
npx supabase projects list
```

```bash
npx supabase db diff --linked --schema public
```

```bash
npx supabase functions list
```

(`db diff` აჩვენებს ზუსტად რით განსხვავდება ცოცხალი სქემა `supabase/migrations/`-ისგან.)

---

## 6. მცირე შენიშვნები

- ESLint 12 warning: გამოუყენებელი `e`/`error`/`width` ცვლადები და `useEffect`-ის
  `exhaustive-deps` (`index.tsx`, `quiz.tsx`, `SplashIntro.tsx`, `medicina.tsx`,
  `subscription.tsx`, `_layout.tsx`).
- UTC+4 (საქართველოს დრო) ლოგიკა 4-ჯერ არის დუბლირებული
  (`HistoryContext`, `(tabs)/index.tsx`, `premium/medicina.tsx`, `(tabs)/science.tsx` — სადაც
  სხვათა შორის UTC+4 **არ** გამოიყენება, უბრალოდ `new Date()`).
- `quiz.tsx`: `checkTodayQuiz` ადარებს `created_at >= today` ლოკალური დღით, ხოლო დათვლა
  შუაღამემდე — ლოკალური დროით; UTC+4 ლოგიკასთან შეუთავსებელია.
- გამოუყენებელი ფაილები: `app/modal.tsx`, `components/hello-wave.tsx`,
  `components/parallax-scroll-view.tsx`, `components/ui/collapsible.tsx`,
  `components/external-link.tsx`, `constants/theme.ts`, `hooks/use-theme-color.ts`
  (Expo-ს თარგიდან დარჩენილი).
- `README.md` ჯერ კიდევ Expo-ს თარგის ტექსტია.
- `assets/gallery/7.webp` წაშლილია; `3.webp` და `5.webp` არსად არ გამოიყენება.
- `tsconfig.json`-ის `include` მოიცავს `supabase/functions/**`-ს (Deno), აქედან `tsc`-ის
  5 შეცდომა — ღირს ამ საქაღალდის `exclude`-ში გატანა.

---

## 7. რეკომენდებული რიგითობა აღდგენისთვის

1. ლოკალური ცვლილებების ასლი/კომიტი (`backup-local-*` ბრენჩი), `supabase/migrations/` git-ში.
2. `app/(tabs)/index.tsx` — `premiumRoutes` მასივის გასწორება 3 ბარათზე.
3. `app/_layout.tsx` — არარსებული `Stack.Screen`-ების მოხსნა.
4. `daily_history.date` ფორმატის გადაწყვეტა (edge function ან `HistoryContext` — ერთს აირჩევ).
5. `ThemeProviderCustom`-ის ჩამატება `app/_layout.tsx`-ში (ან ThemeContext-ის მოხსნა).
6. `app.json`: `usesAppleSignIn`, დუბლირებული `RECORD_AUDIO`, `icon` → PNG, `web`/favicon.
7. `npx expo prebuild --clean` ან EAS ბილდი, შემდეგ `git push`.
8. ცოცხალი სქემის ჩაწერა მიგრაციებში (`supabase db diff --linked`).

---

# დამატება — შესრულებული სამუშაო (2026-11-07)

## Supabase-ის ვერდიქტი: ძველი პროექტი აღარ არსებობს

`lgygwpvectxaxdiujjna.supabase.co` DNS-ში არ იხსნება — შემოწმებულია ლოკალური resolver-ით,
Google-ის 8.8.8.8-ით და Cloudflare-ის 1.1.1.1-ით, სამივეგან `Non-existent domain`. იმავდროულად
`supabase.co`, `api.supabase.com` და `aws-1-eu-central-1.pooler.supabase.com` ნორმალურად იხსნება,
ანუ ეს ქსელის პრობლემა არ არის. შეჩერებული (paused) პროექტი ჩვეულებრივ მაინც იხსნება და
„paused" პასუხს აბრუნებს — DNS ჩანაწერის არარსებობა წაშლაზე მიუთითებს.

**დასკვნა: ახალი პროექტი უნდა შეიქმნას.** სქემა მზად არის — ერთი ფაილი აღადგენს ყველაფერს.

### ახალი პროექტის აწყობა (თანმიმდევრობით)

1. supabase.com → New project (რეგიონი: eu-central-1 იყო ძველი).
2. Project Settings → API → დააკოპირე **Project URL** და **publishable (anon) key**, ჩასვი
   `services/supabase.ts`-ის თავში (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
3. სქემა:

```bash
npx supabase link --project-ref <ახალი-ref>
```

```bash
npx supabase db push
```

4. Edge functions:

```bash
npx supabase functions deploy delete-account
```

```bash
npx supabase functions deploy weekly-history-update
```

5. Project Settings → Edge Functions → Secrets: `OPENAI_API_KEY`, `CRON_SECRET`.
6. Authentication → Providers → **Google** ჩართე (Google Cloud-ის Client ID + Secret) და
   **Apple** ჩართე (Services ID / Team ID / Key — iOS-ისთვის Client IDs-ში ჩაწერე
   `com.mishvela.georgiahistoryapp`).
7. Authentication → URL Configuration → Redirect URLs: `georgiahistoryapp://login-callback`.
8. კონტენტი: `daily_history` ივსება cron-ით (weekly-history-update), `science_events`,
   `medicine_events`, `quiz_questions` — ხელით ან იმპორტით; `surnames` — giftgrb.ge-დან, ბოლოს.

## რა შეიცვალა კოდში

**პრაიმი სრულად მოიხსნა, კონტენტი არსად წაშლილა:**
- წაიშალა მხოლოდ paywall-ის მექანიკა: `app/subscription.tsx`, `context/PremiumContext.tsx`,
  RevenueCat-ის ინიციალიზაცია `app/_layout.tsx`-ში, PRIME ბეჯი და „გაააქტიურე PRIME" ღილაკი
  პროფილზე, ჩაკეტილი ეკრანი მეცნიერებაში. (სამივე ფაილი git-ის ისტორიაშია, დაბრუნებადია.)
- `science`, `medicina`, `world-events`, `births` — ოთხივე ეკრანი ადგილზეა, უბრალოდ უფასოა.

**გვარები დაბრუნდა:** `app/(tabs)/explore.tsx` და `assets/gallery/7.webp` აღდგენილია git-იდან,
ტაბი ჩართულია (ისტორია · გვარები · მეცნიერება · ქვიზი · პროფილი). შიგთავსი უცვლელია —
`surnames` ცხრილიდან კითხულობს, დახვეწა მოგვიანებით.

**შესვლის ბარიერი:** ახალი `components/auth-gate.tsx`. შესვლის გარეშე ისტორიები არ ჩანს —
მთავარ ეკრანზე ჩაკეტილი ბარათი დგას, გალერეის ბარათებზე ბოქლომი, ნებისმიერი დაჭერა პროფილის
ტაბზე (შესვლის ფორმაზე) გადაჰყავს. იგივე მეცნიერებაზე, მედიცინაზე, მსოფლიოზე, პიროვნებებზე.
ქვიზი და გვარები ღიად დარჩა.

**Apple/Google შესვლა:** აღმოჩნდა, რომ **ორივე ღილაკი გამორთული იყო** — კოდში `{false && (...)}`
ეწერა, ანუ არც Apple ჩანდა და არც Google. ორივე ჩაირთო (Apple მხოლოდ iOS-ზე), `app.json`-ში
`usesAppleSignIn: true` დაბრუნდა. Google-ის იკონი SVG-ით იყო ჩასმული (React Native SVG-ს ასე ვერ
ხატავს — ცარიელი კვადრატი ჩანდა), შეიცვალა Ionicons-ით. OAuth-ის ტოკენის დამუშავებაც გასწორდა.

**თემა:** light რეჟიმი და გადამრთველი მოიხსნა, აპლიკაცია მხოლოდ მუქია
(`context/ThemeContext.tsx` წაიშალა, `app.json` → `userInterfaceStyle: "dark"`).

**მენიუ (tab bar):** სიმაღლე და padding ახლა `useSafeAreaInsets().bottom`-ს ემატება, ანუ
ანდროიდის ნავიგაციის ზოლს აღარ ედება — იკონები და წარწერები აწეულია.

**სხვა გასწორებული პრობლემები:**
- გალერეის ბარათების არასწორი მისამართები — მისამართი ახლა თითოეულ ბარათზევე წერია.
- `daily_history.date` — აპიც და edge function-იც ახლა `MM-DD`-ს იყენებს (`services/date.ts`).
- ქეში თარიღს ამოწმებს — ძველი დღის ტექსტი აღარ გამოჩნდება.
- `premium/*` ეკრანები სამუდამო ლოდერზე აღარ ჭედავს — ცარიელ მდგომარეობას აჩვენებს.
- ანგარიშის წაშლა ნამდვილად შლის ანგარიშს — ახალი `delete-account` edge function
  (ავატარი + პროფილი + `auth.users`). App Store 5.1.1(v).
- პროფილს ახლა ბაზის ტრიგერი (`handle_new_user`) ქმნის — Google/Apple მომხმარებლებსაც.
- UTC+4 ლოგიკა ერთ ფაილში გაერთიანდა; ქვიზის „დღეში ერთხელ" შემოწმებაც საქართველოს შუაღამეზეა.
- `app.json`: ხატულა PNG-ზე დაბრუნდა, დუბლირებული `RECORD_AUDIO` მოიხსნა, გატეხილი `web` ბლოკი
  მოიხსნა.
- `tsconfig.json` აღარ ამოწმებს Deno-ს ფაილებს.

## შემოწმება

| | შედეგი |
|---|---|
| `npx tsc --noEmit` | ✅ 0 შეცდომა |
| `npm run lint` | ✅ 0 შეცდომა, 0 warning (იყო 12 warning) |
| `npx expo export --platform ios` | ✅ აეწყო, bundle 4.72 MB → 3.73 MB |

## რა დარჩა შენზე

1. ახალი Supabase პროექტი (ზემოთ, 8 ნაბიჯი).
2. `npm uninstall react-native-purchases` — პაკეტი აღარ გამოიყენება, მაგრამ ჯერ არ წამიშლია.
3. `npx expo prebuild --clean` — რომ `app.json`-ის ცვლილებები ლოკალურ ანდროიდ ბილდშიც გადავიდეს.
4. `git add -A && git commit` — ყველა ცვლილება ჯერ ლოკალურია.
5. `expo-av` → `expo-audio` მიგრაცია SDK 55-მდე.
