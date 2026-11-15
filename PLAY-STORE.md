# Google Play — დღის ისტორია

**აპი:** `com.mishvela.georgiahistoryapp` · Play app ID `4973597049323044994`
**დეველოპერი:** Mishvela Tech (Personal account, ID `5142807646913487073`)
**სტატუსი:** Draft · 10/11 დავალება დასრულებულია

Console: https://play.google.com/console/u/0/developers/5142807646913487073/app/4973597049323044994/app-dashboard

## დასრულებული

| ნაწილი | მნიშვნელობა |
|---|---|
| Privacy policy | https://sites.google.com/view/georgiahistory-privacy |
| Sign in details | `1@test.com` — „full access" დადასტურებული, ინსტრუქცია ინგლისურად |
| Ads | No |
| Content rating | **Everyone / PEGI 3 / 3+** (IARC, All Other App Types) |
| Target audience | 16–17 და 18+ (ბავშვებს არ მოიცავს → Families პროგრამა არ ეხება) |
| Data safety | Name, Email, User IDs, Photos, Other actions, Device IDs — **არაფერი არ ზიარდება** |
| Advertising ID | No (AAB-ის მანიფესტში `AD_ID` მართლაც არ არის) |
| Government / Financial / Health | None |
| App category | Education · საკონტაქტო ფოსტა შევსებულია |
| Store listing (ტექსტი) | ქართული სახელი, short + full description — შენახულია |

## დარჩენილი — ფაილების ატვირთვა

ფაილები: `play-store-assets/` (gitignore-შია, ბილდის არტეფაქტებია)

### 1. Store listing → Common visual assets
Grow users → Store presence → Main store listing

| ველი | ფაილი | ზომა |
|---|---|---|
| App icon | `icon-512.png` | 512×512 |
| Feature graphic | `feature-graphic.png` | 1024×500 |
| Phone screenshots | `screenshot-1.png` … `screenshot-6.png` | 1344×2688 |

სქრინშოტები App Store-ის ლისტინგიდანაა აღებული და გვერდებზე ჩამუქებული
ზოლებით 1:2 პროპორციამდეა მიყვანილი — iPhone-ის 9:19.5 Play-სთვის ძალიან
წაგრძელებულია (გრძელი გვერდი მოკლეს ორმაგზე მეტი ვერ იქნება).

### 2. Closed testing release
Test and release → Testing → Closed testing → Create new release

- **AAB:** `play-store-assets/georgia-history-1.2.0-vc4.aab` (84 MB, versionCode 4)
- ტესტერების სია: **მინიმუმ 12 ელფოსტა**
- ტესტი უნდა გაგრძელდეს **14 დღე** სანამ production-ზე განაცხადს გააკეთებ

## Privacy policy — გასწორებულია (2026-11-15)

RevenueCat-ისა და გამოწერების ხსენება ამოღებულია და გვერდი ხელახლა
გამოქვეყნდა. რედაქტორი:
https://sites.google.com/d/1VyYWb5PnOKV2llJbES--m3IC71Uf5-jA/edit

| სად | იყო | გახდა |
|---|---|---|
| §2 | Subscription Data (RevenueCat) | **Push Notifications** — push token ანგარიშზე მიბმული |
| §4 სათაური | In-App Purchases and Subscriptions | **Payments and Purchases** |
| §4 ბულეტი 1 | Billing (Apple ID-ზე ჩამოჭრა) | **No Purchases** — აპი უფასოა, IAP/გამოწერა/რეკლამა არ აქვს |
| §4 ბულეტი 2 | Management (გამოწერის გაუქმება) | **Account Deletion** — Settings > Delete Account |
| §5 | RevenueCat | **Google Play Services (FCM)** — push-ის მიწოდება |

ნუმერაცია არ შეცვლილა (1–9 ისევე რჩება), §7 „Data Deletion and Retention"
ხელუხლებელია — სწორედ ის გვერდია Play-ში „Delete account URL"-ად ჩაწერილი.

Apple EULA-ს ბმული §4-ში დარჩა: iOS-ისთვის სწორია და Play-ს არ უშლის.

## გასათვალისწინებელი

- **12 ტესტერი × 14 დღე** — Personal account-ის სავალდებულო პირობა
  production-ზე გასვლამდე. ანგარიშის დანარჩენი სამი აპიც closed testing-შია.
- **Trader status** — ანგარიშის დონეზე, 2027 წლის თებერვლამდე სავალდებულო.
  ჯერ არ არის შევსებული (ყველა აპს ეხება, არა მხოლოდ ამას).
- **მანიფესტში ზედმეტი ნებართვები:** `RECORD_AUDIO` (expo-av, მხოლოდ
  splash-ის ხმისთვის) და `CAMERA` (expo-image-picker). დეკლარაცია არ სჭირდება,
  მაგრამ `expo-av` → `expo-audio` გადასვლისას RECORD_AUDIO გაქრება.
- **Georgian script Play-ზე მუშაობს** — App Store-ის შეზღუდვა აქ არ არის.
