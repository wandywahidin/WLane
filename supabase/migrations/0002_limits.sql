-- 0002: batas pemakaian, dibaca dari app_config

create function public.config_int(p_key text)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select (value #>> '{}')::int from public.app_config where key = p_key
$$;

-- ---------- demo per akun ----------
create function public.enforce_demo_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- serialisasi per pemilik supaya dua insert bersamaan tidak lolos bersama
  perform pg_advisory_xact_lock(hashtext('demos:' || new.owner_id::text));
  if (select count(*) from public.demos where owner_id = new.owner_id)
     >= public.config_int('max_demos_per_user') then
    raise exception 'LIMIT_DEMOS';
  end if;
  return new;
end;
$$;

create trigger demos_enforce_limit
  before insert on public.demos
  for each row execute function public.enforce_demo_limit();

-- ---------- langkah per demo ----------
create function public.enforce_step_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('steps:' || new.demo_id::text));
  if (select count(*) from public.steps where demo_id = new.demo_id)
     >= public.config_int('max_steps_per_demo') then
    raise exception 'LIMIT_STEPS';
  end if;
  return new;
end;
$$;

create trigger steps_enforce_limit
  before insert on public.steps
  for each row execute function public.enforce_step_limit();

-- ---------- akun total ----------
create function public.enforce_user_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('auth.users'));
  if (select count(*) from auth.users) >= public.config_int('max_users') then
    raise exception 'LIMIT_USERS';
  end if;
  return new;
end;
$$;

create trigger auth_users_enforce_limit
  before insert on auth.users
  for each row execute function public.enforce_user_limit();

revoke execute on function public.config_int(text) from public, anon, authenticated;
revoke execute on function public.enforce_demo_limit() from public, anon, authenticated;
revoke execute on function public.enforce_step_limit() from public, anon, authenticated;
revoke execute on function public.enforce_user_limit() from public, anon, authenticated;
