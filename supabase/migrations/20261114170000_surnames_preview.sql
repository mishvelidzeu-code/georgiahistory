-- გვარების ცხრილი: საიტთან (gvarigen.ge) დაკავშირება.
--
-- იდეა: აპი აჩვენებს მხოლოდ მოკლე ნაწყვეტს (preview) და გადაამისამართებს
-- gvarigen.ge/gvari/<crest_code>-ზე, სადაც სრული ისტორიაა. სრული ტექსტი
-- აპის ბაზაში შეგნებულად არ ინახება:
--   1) App Store 3.1.1 — აპში „გასახსნელი" ციფრული კონტენტი არ არსებობს;
--   2) ერთი წყარო — სრული ტექსტი giftgrb-ის პროექტში და საიტზე რჩება.
--
-- crest_code არ არის unique: ერთ გერბის კოდს შეიძლება რამდენიმე
-- ფორმა შეესაბამებოდეს (მაგ. „თარბაია" და „თარბა" → GRB-284).

alter table public.surnames add column if not exists crest_code text;
alter table public.surnames add column if not exists preview text;

-- სრული ისტორია აპში აღარ ჩამოდის
alter table public.surnames alter column full_history drop not null;

create index if not exists surnames_crest_code_idx on public.surnames (crest_code);

comment on column public.surnames.crest_code is
  'გერბის კოდი (GRB-NNN) — gvarigen.ge/gvari/<crest_code>-ის ბმული.';
comment on column public.surnames.preview is
  'ისტორიის პირველი ~42 სიტყვა. სრული ტექსტი მხოლოდ საიტზეა.';
-- `full_history` სრულ ტექსტს აღარ ინახავს, მაგრამ NULL ვერ დარჩება:
-- 2026-11-14-მდე აწყობილი ბილდები მას პირდაპირ კითხულობენ, დაცვის გარეშე
-- (`text.split(" ")`), ანუ NULL მათ გვარების ტაბს ამტვრევს. ამიტომ
-- `import-surnames.js` მასში იმავე ნაწყვეტს წერს, რაც `preview`-შია.
comment on column public.surnames.full_history is
  'preview-ის ასლი ძველი ბილდებისთვის. სრული ისტორია მხოლოდ საიტზეა.';
