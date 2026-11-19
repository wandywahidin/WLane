-- 0001: skema demos, steps, app_config; RLS; trigger updated_at

-- ---------- app_config ----------
create table public.app_config (
  key   text primary key,
  value jsonb
);

insert into public.app_config (key, value) values
  ('max_demos_per_user', '5'),
  ('max_steps_per_demo', '20'),
  ('max_users', '20'),
  ('sample_demo_slug', 'null');

alter table public.app_config enable row level security;
-- Hanya baca. Isinya angka batas dan slug demo contoh, tidak rahasia.
create policy app_config_read on public.app_config
  for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.app_config from anon, authenticated;

-- ---------- demos ----------
create table public.demos (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title              text not null default '',
  slug               text not null unique check (slug ~ '^[a-z0-9]{8}$'),
  status             text not null default 'draft' check (status in ('draft', 'published')),
  published_snapshot jsonb,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index demos_owner_id_idx on public.demos (owner_id);

-- ---------- steps ----------
create table public.steps (
  id                uuid primary key default gen_random_uuid(),
  demo_id           uuid not null references public.demos (id) on delete cascade,
  position          int not null check (position >= 0),
  image_path        text not null,
  image_width       int not null check (image_width > 0),
  image_height      int not null check (image_height > 0),
  hotspot_x         numeric check (hotspot_x is null or (hotspot_x >= 0 and hotspot_x <= 100)),
  hotspot_y         numeric check (hotspot_y is null or (hotspot_y >= 0 and hotspot_y <= 100)),
  tooltip_text      text not null default '' check (char_length(tooltip_text) <= 280),
  tooltip_placement text not null default 'auto'
                    check (tooltip_placement in ('auto', 'top', 'bottom', 'left', 'right')),
  constraint steps_demo_position_key unique (demo_id, position) deferrable initially deferred
);

-- ---------- RLS ----------
alter table public.demos enable row level security;
alter table public.steps enable row level security;

create policy demos_owner_all on public.demos
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy steps_owner_all on public.steps
  for all to authenticated
  using (exists (select 1 from public.demos d where d.id = steps.demo_id and d.owner_id = auth.uid()))
  with check (exists (select 1 from public.demos d where d.id = steps.demo_id and d.owner_id = auth.uid()));

-- Anon tidak punya akses langsung; baca publik hanya lewat RPC (0003).
revoke all on public.demos from anon;
revoke all on public.steps from anon;

-- ---------- updated_at ----------
-- clock_timestamp() (bukan now()) supaya edit setelah terbit di transaksi yang sama
-- tetap lebih baru daripada published_at.
create function public.touch_demo_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.publishing', true), '') <> 'on' then
    new.updated_at := clock_timestamp();
  end if;
  return new;
end;
$$;

create trigger demos_touch_updated_at
  before update on public.demos
  for each row execute function public.touch_demo_row();

create function public.touch_demo_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.publishing', true), '') <> 'on' then
    update public.demos
       set updated_at = clock_timestamp()
     where id = coalesce(new.demo_id, old.demo_id);
  end if;
  return null;
end;
$$;

create trigger steps_touch_demo_updated_at
  after insert or update or delete on public.steps
  for each row execute function public.touch_demo_updated_at();
