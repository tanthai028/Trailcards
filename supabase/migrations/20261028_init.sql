-- Wayfarer, phase 2: accounts for a small friend group, synced progress, an XP leaderboard,
-- shared decks and profile pictures.
--
-- Anyone can sign in (email code), but only members can see or do anything. You become a
-- member by redeeming an invite code, which also creates your profile. Every table has row
-- level security; writes that need rules (XP, copying decks, reports) go through functions.

-- ── Members and invites ─────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  title text check (char_length(title) <= 40),
  -- the character picture: { body, hair, hairColor, outfit, accessory }
  look jsonb not null default '{}'::jsonb check (octet_length(look::text) < 1000),
  photo_url text check (char_length(photo_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invites (
  code text primary key check (char_length(code) between 6 and 40),
  uses_left int not null default 10 check (uses_left >= 0),
  created_at timestamptz not null default now()
);

/** Is the signed-in user a member? Used by every policy below. */
create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()))
$$;

/** Redeem an invite code and create your profile. Returns true once you're in. */
create function public.join_group(invite_code text, display_name text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from public.profiles where id = uid) then return true; end if;
  update public.invites set uses_left = uses_left - 1
    where code = upper(trim(invite_code)) and uses_left > 0;
  if not found then raise exception 'That invite code is not valid'; end if;
  insert into public.profiles (id, name)
    values (uid, coalesce(nullif(left(trim(display_name), 20), ''), 'Wanderer'));
  return true;
end $$;

alter table public.profiles enable row level security;
alter table public.invites enable row level security; -- no policies: only join_group reads it

create policy "members see members" on public.profiles for select to authenticated using ((select public.is_member()));
create policy "edit your own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ── Synced progress ─────────────────────────────────────────────

-- The whole game state as the app saves it (minus the picture, which lives in storage).
create table public.progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  state jsonb not null check (octet_length(state::text) < 2000000),
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
create policy "your own progress" on public.progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── XP and the leaderboard ──────────────────────────────────────

create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null check (amount > 0),
  -- 'study' counts for the weekly board; 'import' is XP earned before you had an account
  kind text not null default 'study' check (kind in ('study', 'import')),
  created_at timestamptz not null default now()
);
create index xp_events_user_time on public.xp_events (user_id, created_at);
alter table public.xp_events enable row level security; -- written only through the functions below

/**
 * Add XP you just earned. Capped per call and per day, so a tampered app can't top the board
 * by much: a right answer is worth at most 20 XP, and 1500 a day is a very long study day.
 */
create function public.add_xp(amount int) returns int
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); today int; allowed int;
begin
  if not public.is_member() then raise exception 'Not a member'; end if;
  if amount is null or amount <= 0 then return 0; end if;
  select coalesce(sum(e.amount), 0) into today from public.xp_events e
    where e.user_id = uid and e.kind = 'study' and e.created_at >= date_trunc('day', now());
  allowed := least(amount, 400, greatest(0, 1500 - today));
  if allowed > 0 then insert into public.xp_events (user_id, amount) values (uid, allowed); end if;
  return allowed;
end $$;

/** Bring the XP you earned before signing up onto the all-time board, once. */
create function public.import_xp(total int) returns int
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); allowed int := least(greatest(coalesce(total, 0), 0), 100000);
begin
  if not public.is_member() then raise exception 'Not a member'; end if;
  if exists (select 1 from public.xp_events where user_id = uid and kind = 'import') then return 0; end if;
  if allowed > 0 then insert into public.xp_events (user_id, amount, kind) values (uid, allowed, 'import'); end if;
  return allowed;
end $$;

/** The board: 'week' is study XP since Monday (UTC), 'all' is everything. */
create function public.leaderboard(period text default 'week')
returns table (user_id uuid, name text, title text, look jsonb, photo_url text, xp bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, p.name, p.title, p.look, p.photo_url, coalesce(sum(e.amount), 0)::bigint as xp
  from public.profiles p
  left join public.xp_events e on e.user_id = p.id
    and (period = 'all' or (e.kind = 'study' and e.created_at >= date_trunc('week', now())))
  where public.is_member()
  group by p.id
  order by xp desc, p.name
  limit 100
$$;

-- ── Shared decks ────────────────────────────────────────────────

create table public.shared_decks (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  topic text check (char_length(topic) <= 4000),
  scene text not null default 'meadow' check (char_length(scene) <= 20),
  reverse boolean not null default false,
  cards jsonb not null check (jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) between 1 and 2000 and octet_length(cards::text) < 1000000),
  card_count int generated always as (jsonb_array_length(cards)) stored,
  copies int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shared_decks_recent on public.shared_decks (created_at desc);
alter table public.shared_decks enable row level security;
create policy "members browse decks" on public.shared_decks for select to authenticated
  using ((select public.is_member()) and (not hidden or owner = (select auth.uid())));
create policy "share your own decks" on public.shared_decks for insert to authenticated
  with check (owner = (select auth.uid()) and (select public.is_member()) and copies = 0 and not hidden);
create policy "update your own decks" on public.shared_decks for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "unshare your own decks" on public.shared_decks for delete to authenticated
  using (owner = (select auth.uid()));

-- owners can't reset their own copy count or unhide a reported deck
create function public.guard_shared_deck() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    new.copies := old.copies;
    new.hidden := old.hidden;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger shared_decks_guard before update on public.shared_decks
  for each row execute function public.guard_shared_deck();

/** Count a copy when someone adds a shared deck to their own decks. */
create function public.count_copy(deck uuid) returns void
language sql security definer set search_path = '' as $$
  update public.shared_decks set copies = copies + 1
  where id = deck and owner <> auth.uid() and public.is_member()
$$;

create table public.reports (
  deck_id uuid not null references public.shared_decks (id) on delete cascade,
  reporter uuid not null references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 300),
  created_at timestamptz not null default now(),
  primary key (deck_id, reporter)
);
alter table public.reports enable row level security; -- written only through report_deck

/** Report a shared deck. Two reports from different members hide it for everyone but its owner. */
create function public.report_deck(deck uuid, why text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_member() then raise exception 'Not a member'; end if;
  insert into public.reports (deck_id, reporter, reason) values (deck, auth.uid(), left(why, 300))
    on conflict do nothing;
  update public.shared_decks set hidden = true
    where id = deck and (select count(*) from public.reports r where r.deck_id = deck) >= 2;
end $$;

-- ── Profile pictures ────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 300000, array['image/webp', 'image/jpeg', 'image/png']);

create policy "members upload their own picture" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_member()));
create policy "members replace their own picture" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "members remove their own picture" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- functions are callable by signed-in users only
revoke execute on function public.is_member, public.join_group, public.add_xp, public.import_xp,
  public.leaderboard, public.count_copy, public.report_deck from public, anon;
grant execute on function public.is_member, public.join_group, public.add_xp, public.import_xp,
  public.leaderboard, public.count_copy, public.report_deck to authenticated;
