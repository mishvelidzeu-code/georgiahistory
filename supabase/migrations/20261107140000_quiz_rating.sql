-- =============================================================================
-- ქვიზი: დღის კითხვების თანმიმდევრობა და დაგროვებითი რეიტინგი
-- =============================================================================

-- თითო დღეზე რამდენიმე კითხვაა — თანმიმდევრობა და უნიკალურობა
alter table public.quiz_questions
  add column if not exists sort_order smallint not null default 1;

create unique index if not exists quiz_questions_day_order_idx
  on public.quiz_questions (month, day, sort_order);

-- -----------------------------------------------------------------------------
-- რეიტინგი დაგროვებითია: ყველა დღის ქულა ჯამდება.
-- გამოტოვებულ დღეს ჩანაწერი არ აქვს, ანუ 0 ქულა — ავტომატურად.
-- -----------------------------------------------------------------------------
drop function if exists public.leaderboard();

create function public.leaderboard()
returns table (username text, total_score integer, days_played integer)
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
    sum(q.score)::int as total_score,
    count(distinct (timezone('Asia/Tbilisi', q.created_at))::date)::int as days_played
  from public.quiz_scores q
  join public.profiles p on p.id = q.user_id
  group by p.id, 1
  order by 2 desc, 3 asc
  limit 50;
$$;

grant execute on function public.leaderboard() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- მომხმარებლის საკუთარი ადგილი რეიტინგში
-- -----------------------------------------------------------------------------
create or replace function public.my_quiz_rank()
returns table (total_score integer, days_played integer, rank integer)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      q.user_id,
      sum(q.score)::int as total_score,
      count(distinct (timezone('Asia/Tbilisi', q.created_at))::date)::int as days_played,
      rank() over (order by sum(q.score) desc)::int as rank
    from public.quiz_scores q
    group by q.user_id
  )
  select t.total_score, t.days_played, t.rank
  from totals t
  where t.user_id = auth.uid();
$$;

revoke all on function public.my_quiz_rank() from public, anon;
grant execute on function public.my_quiz_rank() to authenticated;
