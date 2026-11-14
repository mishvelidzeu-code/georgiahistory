-- =============================================================================
-- ადმინის სტატისტიკა
-- ერთი RPC, რომელიც მთელ დაფას ერთი მოთხოვნით აბრუნებს jsonb-ად.
-- ადმინი = profiles.role = 'admin' (იხ. public.is_admin()).
-- დღე ითვლება თბილისის დროით, ისევე როგორც leaderboard()-ში.
-- =============================================================================
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  res       jsonb;
  tz        text := 'Asia/Tbilisi';
  today     date := (timezone('Asia/Tbilisi', now()))::date;
  today_key text := to_char(timezone('Asia/Tbilisi', now()), 'MM-DD');
begin
  if not public.is_admin() then
    raise exception 'ადმინის უფლებები საჭიროა' using errcode = '42501';
  end if;

  select jsonb_build_object(

    'generated_at', now(),
    'today_key', today_key,

    -- მომხმარებლები
    'users', (
      select jsonb_build_object(
        'total',     count(*),
        'today',     count(*) filter (where (timezone(tz, created_at))::date = today),
        'last_7',    count(*) filter (where created_at >= now() - interval '7 days'),
        'last_30',   count(*) filter (where created_at >= now() - interval '30 days'),
        'with_push', count(*) filter (where coalesce(push_token, '') <> ''),
        'with_name', count(*) filter (where coalesce(full_name, '') <> ''),
        'admins',    count(*) filter (where role = 'admin')
      )
      from public.profiles
    ),

    -- ავტორიზაციის წყარო (email / google / apple)
    'providers', (
      select coalesce(jsonb_object_agg(prov, c), '{}'::jsonb)
      from (
        select coalesce(u.raw_app_meta_data ->> 'provider', 'unknown') as prov,
               count(*) as c
        from auth.users u
        group by 1
      ) t
    ),

    -- ქვიზის აქტივობა
    'quiz', (
      select jsonb_build_object(
        'total_games',   count(*),
        'today',         count(*) filter (where (timezone(tz, created_at))::date = today),
        'last_7',        count(*) filter (where created_at >= now() - interval '7 days'),
        'players_total', count(distinct user_id),
        'players_7',     count(distinct user_id) filter (where created_at >= now() - interval '7 days'),
        'avg_score',     round(coalesce(avg(score), 0)::numeric, 1),
        'max_score',     coalesce(max(score), 0)
      )
      from public.quiz_scores
    ),

    -- კონტენტის დაფარვა (366 დღიდან)
    'content', jsonb_build_object(
      'daily_total',           (select count(*) from public.daily_history),
      'daily_georgia',         (select count(*) from public.daily_history where coalesce(georgia_content, '') <> ''),
      'daily_world',           (select count(*) from public.daily_history where coalesce(world_content, '') <> ''),
      'daily_births',          (select count(*) from public.daily_history where coalesce(births_content, '') <> ''),
      'science',               (select count(*) from public.science_events where coalesce(description, '') <> ''),
      'medicine',              (select count(*) from public.medicine_events where coalesce(description, '') <> ''),
      'quiz_questions',        (select count(*) from public.quiz_questions),
      'quiz_days',             (select count(*) from (select distinct month, day from public.quiz_questions) q),
      'holidays',              (select count(*) from public.holidays),
      'holidays_with_history', (select count(*) from public.holidays where coalesce(history, '') <> ''),
      'surnames',              (select count(*) from public.surnames)
    ),

    -- დღევანდელი დღე: ყველაფერი ადგილზეა თუ არა
    'today_content', (
      select jsonb_build_object(
        'georgia', coalesce((select coalesce(georgia_content, '') <> '' from public.daily_history where date = today_key), false),
        'world',   coalesce((select coalesce(world_content, '')   <> '' from public.daily_history where date = today_key), false),
        'births',  coalesce((select coalesce(births_content, '')  <> '' from public.daily_history where date = today_key), false),
        'science', exists (
          select 1 from public.science_events
          where month = extract(month from today)::int
            and day = extract(day from today)::int
            and coalesce(description, '') <> ''
        ),
        'medicine', exists (
          select 1 from public.medicine_events
          where month = extract(month from today)::int
            and day = extract(day from today)::int
            and coalesce(description, '') <> ''
        ),
        'quiz', (
          select count(*) from public.quiz_questions
          where month = extract(month from today)::int
            and day = extract(day from today)::int
        )
      )
    ),

    -- ბოლო 14 დღე: რეგისტრაციები და ნათამაშები
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'd', to_char(d, 'DD.MM'),
               'signups', s.c,
               'games',   g.c
             ) order by d), '[]'::jsonb)
      from generate_series(today - 13, today, interval '1 day') as d
      left join lateral (
        select count(*) as c from public.profiles p
        where (timezone(tz, p.created_at))::date = d::date
      ) s on true
      left join lateral (
        select count(*) as c from public.quiz_scores q
        where (timezone(tz, q.created_at))::date = d::date
      ) g on true
    ),

    -- ტოპ 10 მოთამაშე
    'top_players', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name',  username,
               'score', total_score,
               'days',  days_played
             ) order by total_score desc), '[]'::jsonb)
      from (select * from public.leaderboard() limit 10) l
    ),

    -- ბოლო 10 რეგისტრაცია
    'recent_users', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name',    coalesce(nullif(p.full_name, ''), split_part(coalesce(p.email, '—@'), '@', 1)),
               'at',      p.created_at,
               'push',    coalesce(p.push_token, '') <> ''
             ) order by p.created_at desc), '[]'::jsonb)
      from (select * from public.profiles order by created_at desc limit 10) p
    )

  ) into res;

  return res;
end;
$$;

revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

comment on function public.admin_stats() is
  'ადმინის დაფის სრული სტატისტიკა ერთ jsonb-ად; არაადმინს 42501-ით უარს ეუბნება.';
