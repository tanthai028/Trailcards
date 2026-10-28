-- Pictures became an icon (or photo) with a frame, instead of a character.
alter table public.profiles rename column look to avatar;
comment on column public.profiles.avatar is '{ icon, frame } — the icon id and the frame around the picture';

drop function public.leaderboard(text);
create function public.leaderboard(period text default 'week')
returns table (user_id uuid, name text, title text, avatar jsonb, photo_url text, xp bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, p.name, p.title, p.avatar, p.photo_url, coalesce(sum(e.amount), 0)::bigint as xp
  from public.profiles p
  left join public.xp_events e on e.user_id = p.id
    and (period = 'all' or (e.kind = 'study' and e.created_at >= date_trunc('week', now())))
  where public.is_member()
  group by p.id
  order by xp desc, p.name
  limit 100
$$;
revoke execute on function public.leaderboard from public, anon;
grant execute on function public.leaderboard to authenticated;
