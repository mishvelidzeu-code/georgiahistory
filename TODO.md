# გასაკეთებელი სია — დღის ისტორია

შედგენილია 2026-11-07. კოდის მხარე დასრულებულია; ქვემოთ მხოლოდ ის არის, რაც შენ უნდა გააკეთო.
Supabase პროექტი: **`cnfpgzhdqjntvakisgvn`** („ყოველდღიური ისოტრია", ap-southeast-1).

პირდაპირი ლინკი: https://supabase.com/dashboard/project/cnfpgzhdqjntvakisgvn

---

## A. Supabase Dashboard — ავტორიზაცია

- [ ] **A1. ელფოსტის დადასტურება გადაწყვიტე**
  `Authentication → Sign In / Providers → Email → Confirm email`
  ჩართულია ახლა — რეგისტრაციის შემდეგ მომხმარებელი ელფოსტაზე ბმულს უნდა დააჭიროს.
  თუ გინდა, რომ რეგისტრაციისთანავე შევიდეს, გამორთე. (აპი ორივე ვარიანტს სწორად ამუშავებს.)

- [ ] **A2. Redirect URL დაამატე**
  `Authentication → URL Configuration → Redirect URLs` → დაამატე ზუსტად:
  ```
  georgiahistoryapp://login-callback
  ```
  ამის გარეშე Google-ით შესვლა ბრაუზერიდან აპში ვერ დაბრუნდება.

- [ ] **A3. Google პროვაიდერი ჩართე**
  1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → **Web application**
  2. „Authorized redirect URIs"-ში ჩააწერე:
     ```
     https://cnfpgzhdqjntvakisgvn.supabase.co/auth/v1/callback
     ```
  3. მიღებული **Client ID** და **Client Secret** ჩასვი: `Authentication → Providers → Google` → Enable.

- [ ] **A4. Apple პროვაიდერი ჩართე** (iOS-ისთვის სავალდებულოა, რადგან Google შესვლა გვაქვს)
  Apple Developer → Certificates, Identifiers & Profiles:
  1. **Services ID** შექმენი, Return URL: `https://cnfpgzhdqjntvakisgvn.supabase.co/auth/v1/callback`
  2. **Sign in with Apple key** (.p8) ჩამოტვირთე, გადაიწერე Key ID და Team ID
  3. `Authentication → Providers → Apple` → Enable → ჩასვი Services ID, Team ID, Key ID, .p8-ის შიგთავსი
  4. იმავე გვერდზე **Client IDs** ველში დაამატე: `com.mishvela.georgiahistoryapp`
     (ეს აუცილებელია — აპი `signInWithIdToken`-ს იყენებს, ანუ ნატიურ Apple ღილაკს)

## B. Supabase Dashboard — Edge Functions

ორივე ფუნქცია უკვე deploy-ზეა, მხოლოდ გასაღებები აკლია.

**გადაწყვეტილება (2026-11-07):** OpenAI-ს რობოტი ჯერ არ გვჭირდება — კონტენტს ხელით ავსებ.
`weekly-history-update` ფუნქცია ადგილზე რჩება, უბრალოდ გამორთული (გასაღების გარეშე არ მუშაობს).

- [ ] **B1. `CRON_SECRET`** — მხოლოდ მაშინ, როცა სერვერულ push-ს ჩართავ (იხ. E ნაწილი).
  `Edge Functions → Secrets` → გრძელი შემთხვევითი სტრიქონი.

- [ ] ~~`OPENAI_API_KEY`~~ — გადადებულია (ხელით შევსების გამო)
- [ ] ~~`weekly-history-update`-ის გაშვება და cron~~ — გადადებულია

## C. კონტენტი (ცხრილები ჯერ ცარიელია)

📁 **მზა შაბლონები:** `content-templates/` — ოთხი CSV, თარიღები უკვე ჩაწერილი.
ინსტრუქცია: [content-templates/README.md](content-templates/README.md)

- [ ] **C0. `daily_history` — ტექსტები მზადაა, მხოლოდ ჩაწერა დარჩა** ✨
      366 დღე აწყობილია ქართული ვიკიპედიიდან → `content/daily_history.json`
      ჩასაწერად (PowerShell, გასაღები მხოლოდ შენს ტერმინალში რჩება):
      `$env:SUPABASE_SERVICE_ROLE_KEY="<key>"; node scripts/import-content.js`
- [ ] **C1. `science_events`** — თითო ჩანაწერი დღეზე: `year`, `title`, `description`
- [ ] **C2. `medicine_events`** — იგივე სტრუქტურა
- [ ] **C3. `quiz_questions`** — დღეში 4 კითხვა; `correct`-ში ზუსტად იგივე ტექსტი, რაც სწორ ვარიანტშია
- [ ] **C4. `surnames` — მითხარი და მე გადმოვიტან.**
      შენს მეორე Supabase პროექტში (`mishvelidzeu-code's Project` — giftgrb.ge-ს ბაზა)
      `surnames` ცხრილში **447 ჩანაწერია** და ზუსტად საჭირო სვეტებიც აქვს:
      `surname`, `full_history`, `image`. ერთი ბრძანებით გადმოვიწერ (pin/crest სვეტებს არ შევეხები).

## D. აპლიკაცია და ბილდი

- [x] ~~`npm uninstall react-native-purchases`~~ — გაკეთებულია
- [ ] **D2.** `npx expo prebuild --clean` — რომ `app.json`-ის ცვლილებები (ხატულა, Apple Sign In,
      ნებართვები) ლოკალურ ანდროიდ ბილდშიც გადავიდეს
- [ ] **D3.** ტესტი რეალურ მოწყობილობაზე:
      რეგისტრაცია → შესვლა → მთავარი ეკრანის ტექსტი → გალერეის სამი ბარათი → მეცნიერება →
      ქვიზი → ავატარის ატვირთვა → ანგარიშის წაშლა → Google-ით შესვლა → Apple-ით შესვლა (iOS) →
      შეტყობინების ნებართვა (შესვლის შემდეგ ერთხელ იკითხება) → პარამეტრებში გადამრთველი
- [ ] **D4.** EAS ბილდი და მაღაზიებში ატვირთვა
- [ ] **D5.** (სურვილისამებრ) `assets/images/icon.jpg` წაშალე — აღარ გამოიყენება

---

## E. შეტყობინებები

ლოკალური ყოველდღიური შეხსენება (10:00) **უკვე მუშაობს** — სერვერი და გასაღებები არ სჭირდება,
მხოლოდ ბილდი. ქვემოთა პუნქტები მხოლოდ სერვერული push-ისთვისაა.

- [ ] **E1. FCM V1 გასაღები (Android push)**
      Firebase Console → პროექტი `georgia-history-app` → Project settings → Service accounts →
      Generate new private key → ჩამოტვირთული JSON ატვირთე: `eas credentials` → Android →
      Push Notifications: FCM V1.
- [ ] **E2. APNs key (iOS push)** — `eas credentials` → iOS → Push Notifications; EAS თვითონ
      შექმნის შენი Apple ანგარიშით.
- [ ] **E3. `send-daily-push`-ის cron** (ფუნქცია უკვე deploy-ზეა)
      `Integrations → Cron` → ყოველდღე, ჰედერით `x-cron-secret: <CRON_SECRET>`.
      **ყურადღება:** 10:00-ზე ლოკალური შეხსენებაც მოდის — თუ cron-საც 10:00-ზე დააყენებ,
      ხალხს ორი შეტყობინება ექნება. ან სხვა საათი აირჩიე (მაგ. 19:00), ან მითხარი და
      ლოკალურს გამოვრთავ მათთვის, ვისაც push აქვს.
- [ ] **E4. ძველი RevenueCat-ის გასაღები გააუქმე**
      `georgia-history-app-33d0ce4eea4a.json` = `revenuecat-helper@...` service account.
      RevenueCat წაშლილია, ეს გასაღები აღარ გამოიყენება — Google Cloud → IAM → Service Accounts →
      წაშალე, და ლოკალური ფაილიც წაშალე. (FCM-ს სხვა, ახალი გასაღები სჭირდება — E1.)

## რიგითობა, რომ არ აირიოს

1. **A1 + A2** (2 წუთი) → მერე **B1 + B2** → აპი უკვე მუშაობს: რეგისტრაცია + მთავარი ეკრანი.
2. **D1 + D2 + D3** → დარწმუნდი, რომ ყველაფერი მუშაობს email-შესვლით.
3. **A3 + A4** → Google/Apple შესვლა (ყველაზე დიდი ხელის მოცემა, ბოლოს სჯობს).
4. **C1–C3** → კონტენტი.
5. **C4** → გვარები (ბოლოს, როგორც შევთანხმდით).
6. **B3 + D4** → cron და მაღაზიები.

## რაც უკვე გაკეთებულია (შენ არაფერი გჭირდება)

- სქემა, RLS, `handle_new_user` ტრიგერი, `avatars` bucket — დადებულია
- `delete-account` და `weekly-history-update` — deploy-ზეა
- URL და publishable key — კოდშია, დაკომიტებული და ატვირთული
- უსაფრთხოების advisor-ის შენიშვნები — გასწორებული
