-- =============================================================================
-- უქმე დღეების სრული ისტორია
-- მოკლე `description` რჩება ბარათზე, `history` კი ცალკე ფანჯარაში იშლება
-- (იხ. app/(tabs)/calendar.tsx)
-- =============================================================================
alter table public.holidays
  add column if not exists history text;

comment on column public.holidays.description is 'მოკლე განმარტება — ჩანს არჩეული დღის ბარათზე.';
comment on column public.holidays.history is 'დღესასწაულის სრული ისტორია; აბზაცები ორმაგი ხაზის გადატანით იყოფა.';
