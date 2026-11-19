begin;
select plan(14);

-- Dua user uji
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');

-- ===== User A =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select lives_ok(
  $$insert into public.demos (id, owner_id, title, slug)
    values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Demo A', 'aaaa1111')$$,
  'A bisa insert demo miliknya'
);
select is((select count(*)::int from public.demos), 1, 'A bisa select demo miliknya');

select lives_ok(
  $$insert into public.steps (id, demo_id, position, image_path, image_width, image_height, tooltip_text, tooltip_placement)
    values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0, 'a/d/x.webp', 100, 100, 'halo', 'auto')$$,
  'A bisa insert langkah di demo miliknya'
);

select throws_ok(
  $$insert into public.steps (demo_id, position, image_path, image_width, image_height, tooltip_text, tooltip_placement)
    values ('10000000-0000-0000-0000-000000000001', 1, 'p', 1, 1, repeat('x', 281), 'auto')$$,
  '23514', null, 'tooltip 281 karakter ditolak'
);
select throws_ok(
  $$insert into public.steps (demo_id, position, image_path, image_width, image_height, hotspot_x, hotspot_y, tooltip_text, tooltip_placement)
    values ('10000000-0000-0000-0000-000000000001', 1, 'p', 1, 1, 101, 50, '', 'auto')$$,
  '23514', null, 'hotspot_x = 101 ditolak'
);
select throws_ok(
  $$insert into public.steps (demo_id, position, image_path, image_width, image_height, tooltip_text, tooltip_placement)
    values ('10000000-0000-0000-0000-000000000001', 1, 'p', 1, 1, '', 'tengah')$$,
  '23514', null, 'tooltip_placement di luar lima nilai ditolak'
);
select throws_ok(
  $$insert into public.demos (owner_id, title, slug) values ('00000000-0000-0000-0000-0000000000a1', 'x', 'pendek')$$,
  '23514', null, 'slug selain 8 karakter ditolak'
);

-- updated_at: mundurkan dulu (flag publishing melewati trigger), lalu edit langkah
reset role;
select set_config('app.publishing', 'on', true);
update public.demos set updated_at = '2000-01-01' where id = '10000000-0000-0000-0000-000000000001';
select set_config('app.publishing', 'off', true);
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

update public.steps set tooltip_text = 'baru' where id = '20000000-0000-0000-0000-000000000001';
select ok(
  (select updated_at > '2000-01-01'::timestamptz from public.demos where id = '10000000-0000-0000-0000-000000000001'),
  'update steps.tooltip_text mengubah demos.updated_at'
);

-- ===== User B =====
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';

select is((select count(*)::int from public.demos), 0, 'B tidak melihat demo milik A');

with u as (update public.demos set title = 'dibajak' where id = '10000000-0000-0000-0000-000000000001' returning 1)
select is((select count(*)::int from u), 0, 'B tidak bisa update demo A');
with d as (delete from public.demos where id = '10000000-0000-0000-0000-000000000001' returning 1)
select is((select count(*)::int from d), 0, 'B tidak bisa delete demo A');
with u as (update public.steps set tooltip_text = 'dibajak' where id = '20000000-0000-0000-0000-000000000001' returning 1)
select is((select count(*)::int from u), 0, 'B tidak bisa update langkah A');

-- ===== anon =====
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select count(*) from public.steps$$, '42501', null, 'anon tidak punya akses ke steps');
select throws_ok($$select * from public.demos$$, '42501', null, 'anon tidak punya akses langsung ke demos');

select * from finish();
rollback;
