-- =============================================================================
-- დღის ისტორია — სრული სქემა
-- ეს ფაილი ქმნის ყველაფერს, რასაც აპლიკაცია იყენებს, ნულიდან.
-- გაშვება: npx supabase db push   (ან Dashboard → SQL Editor → ჩასმა და Run)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- საერთო ჰელპერები
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — მომხმარებლის პროფილი (auth.users-ზე მიბმული)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  push_token text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles for delete to authenticated
using (auth.uid() = id);

-- ყოველი ახალი მომხმარებლისთვის პროფილი ავტომატურად იქმნება.
-- (ადრე პროფილს მხოლოდ email-რეგისტრაცია ქმნიდა, Google/Apple — არა.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ადმინის შემოწმება (კონტენტის ჩაწერისთვის)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- daily_history — მთავარი ეკრანის დღიური კონტენტი
-- `date` ინახება `MM-DD` ფორმატში (მაგ. '11-07'), რადგან კონტენტი
-- ყოველწლიურად მეორდება. ასევე წერს weekly-history-update edge function.
-- -----------------------------------------------------------------------------
create table if not exists public.daily_history (
  date text primary key check (date ~ '^[0-1][0-9]-[0-3][0-9]$'),
  georgia_content text,
  world_content text,
  births_content text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_daily_history_updated_at on public.daily_history;
create trigger set_daily_history_updated_at
before update on public.daily_history
for each row
execute function public.set_updated_at();

alter table public.daily_history enable row level security;

-- ისტორია ჩანს მხოლოდ შესული მომხმარებლისთვის
drop policy if exists "daily_history_select_authenticated" on public.daily_history;
create policy "daily_history_select_authenticated"
on public.daily_history for select to authenticated
using (true);

drop policy if exists "daily_history_write_admin" on public.daily_history;
create policy "daily_history_write_admin"
on public.daily_history for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- science_events / medicine_events — დღის მიხედვით ერთი ჩანაწერი
-- -----------------------------------------------------------------------------
create table if not exists public.science_events (
  id bigint generated by default as identity primary key,
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  year integer,
  title text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (month, day)
);

create table if not exists public.medicine_events (
  id bigint generated by default as identity primary key,
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  year integer,
  title text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (month, day)
);

drop trigger if exists set_science_events_updated_at on public.science_events;
create trigger set_science_events_updated_at
before update on public.science_events
for each row execute function public.set_updated_at();

drop trigger if exists set_medicine_events_updated_at on public.medicine_events;
create trigger set_medicine_events_updated_at
before update on public.medicine_events
for each row execute function public.set_updated_at();

alter table public.science_events enable row level security;
alter table public.medicine_events enable row level security;

drop policy if exists "science_events_select_authenticated" on public.science_events;
create policy "science_events_select_authenticated"
on public.science_events for select to authenticated
using (true);

drop policy if exists "science_events_write_admin" on public.science_events;
create policy "science_events_write_admin"
on public.science_events for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "medicine_events_select_authenticated" on public.medicine_events;
create policy "medicine_events_select_authenticated"
on public.medicine_events for select to authenticated
using (true);

drop policy if exists "medicine_events_write_admin" on public.medicine_events;
create policy "medicine_events_write_admin"
on public.medicine_events for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- surnames — გვარების მატიანე (მონაცემები მოგვიანებით შემოვა giftgrb.ge-დან)
-- -----------------------------------------------------------------------------
create table if not exists public.surnames (
  id bigint generated by default as identity primary key,
  surname text not null,
  full_history text not null,
  image text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists surnames_surname_idx on public.surnames (surname);

drop trigger if exists set_surnames_updated_at on public.surnames;
create trigger set_surnames_updated_at
before update on public.surnames
for each row execute function public.set_updated_at();

alter table public.surnames enable row level security;

-- გვარების გვერდი შესვლის გარეშეც ხელმისაწვდომია
drop policy if exists "surnames_select_public" on public.surnames;
create policy "surnames_select_public"
on public.surnames for select to anon, authenticated
using (true);

drop policy if exists "surnames_write_admin" on public.surnames;
create policy "surnames_write_admin"
on public.surnames for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- quiz_questions / quiz_scores
-- -----------------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id bigint generated by default as identity primary key,
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  category text,
  question text not null,
  option1 text not null,
  option2 text not null,
  option3 text not null,
  option4 text not null,
  correct text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists quiz_questions_day_idx
  on public.quiz_questions (month, day);

alter table public.quiz_questions enable row level security;

drop policy if exists "quiz_questions_select_public" on public.quiz_questions;
create policy "quiz_questions_select_public"
on public.quiz_questions for select to anon, authenticated
using (true);

drop policy if exists "quiz_questions_write_admin" on public.quiz_questions;
create policy "quiz_questions_write_admin"
on public.quiz_questions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create table if not exists public.quiz_scores (
  id bigint generated by default as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0,
  xp integer not null default 0,
  mode text not null default 'normal',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists quiz_scores_user_day_idx
  on public.quiz_scores (user_id, created_at desc);

alter table public.quiz_scores enable row level security;

drop policy if exists "quiz_scores_select_own" on public.quiz_scores;
create policy "quiz_scores_select_own"
on public.quiz_scores for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "quiz_scores_insert_own" on public.quiz_scores;
create policy "quiz_scores_insert_own"
on public.quiz_scores for insert to authenticated
with check (auth.uid() = user_id);

-- დღის ლიდერბორდი (აპი ელოდება ველებს: username, total_score)
create or replace function public.leaderboard()
returns table (username text, total_score integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(
      nullif(p.full_name, ''),
      split_part(coalesce(p.email, 'ანონიმური@'), '@', 1)
    ) as username,
    sum(q.score)::int as total_score
  from public.quiz_scores q
  join public.profiles p on p.id = q.user_id
  where q.created_at >= timezone(
    'Asia/Tbilisi',
    date_trunc('day', timezone('Asia/Tbilisi', now()))
  )
  group by 1
  order by 2 desc
  limit 10;
$$;

grant execute on function public.leaderboard() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage — ავატარების bucket
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select to anon, authenticated
using (bucket_id = 'avatars');

-- ფაილის სახელი ყოველთვის `<user_id>.jpg`-ია (იხ. app/(tabs)/profile.tsx)
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg')
with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

-- -----------------------------------------------------------------------------
comment on table public.profiles is 'მომხმარებლის პროფილი (auth.users-ზე მიბმული).';
comment on table public.daily_history is 'დღიური ისტორიული კონტენტი, გასაღები MM-DD.';
comment on table public.surnames is 'გვარების მატიანე — მონაცემები შემოვა giftgrb.ge-დან.';
