begin;
select plan(19);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');

insert into public.demos (id, owner_id, title, slug) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Lengkap', 'lengkap1'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Kosong',  'kosong01'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'Bolong',  'bolong01');

-- demo 1: dua langkah lengkap, disisipkan terbalik supaya urutan diuji
insert into public.steps (id, demo_id, position, image_path, image_width, image_height, hotspot_x, hotspot_y, tooltip_text, tooltip_placement) values
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1, 'a/1/dua.webp',  800, 600, 20, 30, 'dua',  'top'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0, 'a/1/satu.webp', 800, 600, 10, 10, 'satu', 'auto');
-- demo 3: langkah ke-2 tanpa hotspot
insert into public.steps (demo_id, position, image_path, image_width, image_height, hotspot_x, hotspot_y) values
  ('10000000-0000-0000-0000-000000000003', 0, 'a/3/a.webp', 10, 10, 50, 50),
  ('10000000-0000-0000-0000-000000000003', 1, 'a/3/b.webp', 10, 10, null, null);

-- ===== sebagai A =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select lives_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000001')$$, 'A bisa menerbitkan demo lengkap');

select is(
  (select jsonb_array_length(published_snapshot) from public.demos where id = '10000000-0000-0000-0000-000000000001'),
  2, 'snapshot berisi 2 langkah');
select is(
  (select published_snapshot -> 0 ->> 'tooltip_text' || ',' || (published_snapshot -> 1 ->> 'tooltip_text')
     from public.demos where id = '10000000-0000-0000-0000-000000000001'),
  'satu,dua', 'snapshot berurutan menurut position');
select ok(
  (select published_snapshot -> 0 ?& array['image_path','image_width','image_height','hotspot_x','hotspot_y','tooltip_text','tooltip_placement']
     from public.demos where id = '10000000-0000-0000-0000-000000000001'),
  'elemen snapshot punya semua field SnapshotStep');
select ok(
  (select status = 'published' and published_at = updated_at from public.demos where id = '10000000-0000-0000-0000-000000000001'),
  'status published dan published_at = updated_at');

-- edit setelah terbit
update public.steps set tooltip_text = 'satu (edit)' where id = '20000000-0000-0000-0000-000000000001';
select ok(
  (select updated_at > published_at from public.demos where id = '10000000-0000-0000-0000-000000000001'),
  'edit draft membuat updated_at > published_at');

select throws_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000002')$$,
  'P0001', 'PUBLISH_EMPTY', 'demo tanpa langkah ditolak');
select throws_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000003')$$,
  'P0001', 'PUBLISH_MISSING_HOTSPOT:2', 'langkah ke-2 tanpa hotspot ditolak');

-- reorder
select lives_ok($$select public.reorder_steps('10000000-0000-0000-0000-000000000001',
  array['20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001']::uuid[])$$, 'reorder berhasil');
select results_eq(
  $$select id::text from public.steps where demo_id = '10000000-0000-0000-0000-000000000001' order by position$$,
  $$values ('20000000-0000-0000-0000-000000000002'), ('20000000-0000-0000-0000-000000000001')$$,
  'urutan mengikuti array baru');
select results_eq(
  $$select position from public.steps where demo_id = '10000000-0000-0000-0000-000000000001' order by position$$,
  $$values (0), (1)$$, 'position menjadi 0..n-1');
select throws_ok($$select public.reorder_steps('10000000-0000-0000-0000-000000000001',
  array['20000000-0000-0000-0000-000000000002']::uuid[])$$,
  'P0001', 'REORDER_MISMATCH', 'array kurang satu id ditolak');
select throws_ok($$select public.reorder_steps('10000000-0000-0000-0000-000000000001',
  array['20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002']::uuid[])$$,
  'P0001', 'REORDER_MISMATCH', 'array dengan id ganda ditolak');

-- ===== sebagai B =====
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
select throws_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000001')$$,
  'P0001', 'DEMO_NOT_FOUND', 'B tidak bisa menerbitkan demo milik A');
select throws_ok($$select public.unpublish_demo('10000000-0000-0000-0000-000000000001')$$,
  'P0001', 'DEMO_NOT_FOUND', 'B tidak bisa membatalkan terbit demo milik A');

-- ===== sebagai anon =====
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select ok(public.get_published_demo('kosong01') is null, 'slug draft → null');
select ok(public.get_published_demo('tidakada') is null, 'slug tidak ada → null');
select is(
  (select (j ->> 'title') || ':' || json_array_length(j -> 'steps') || ':' || (j -> 'steps' -> 0 ->> 'tooltip_text')
     from public.get_published_demo('lengkap1') j),
  'Lengkap:2:satu', 'slug terbit → JSON title dan steps dari snapshot (bukan draft)');

-- ===== unpublish =====
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select public.unpublish_demo('10000000-0000-0000-0000-000000000001');
reset role;
set local role anon;
select ok(public.get_published_demo('lengkap1') is null, 'setelah unpublish → null');

select * from finish();
rollback;
