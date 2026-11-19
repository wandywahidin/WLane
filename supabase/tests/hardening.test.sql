begin;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');
insert into public.demos (id, owner_id, title, slug) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'A1', 'hardaaa1'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'A2', 'hardaaa2'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000b2', 'B1', 'hardbbb1');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

-- ---------- posisi diisi database (Important #3) ----------
insert into public.steps (id, demo_id, image_path, image_width, image_height) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'a', 1, 1);
insert into public.steps (id, demo_id, image_path, image_width, image_height) values
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'b', 1, 1);
insert into public.steps (id, demo_id, image_path, image_width, image_height) values
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'c', 1, 1);
select results_eq(
  $$select position from public.steps where demo_id = '10000000-0000-0000-0000-000000000001' order by position$$,
  $$values (0), (1), (2)$$, 'insert tanpa position → database memberi 0..n-1');

select lives_ok($$select public.delete_step('20000000-0000-0000-0000-000000000001')$$, 'delete_step berhasil');
select results_eq(
  $$select id::text, position from public.steps where demo_id = '10000000-0000-0000-0000-000000000001' order by position$$,
  $$values ('20000000-0000-0000-0000-000000000002', 0), ('20000000-0000-0000-0000-000000000003', 1)$$,
  'delete_step merapikan urutan tanpa celah');
insert into public.steps (id, demo_id, image_path, image_width, image_height) values
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'd', 1, 1);
select is((select position from public.steps where id = '20000000-0000-0000-0000-000000000004'), 2,
  'langkah baru setelah hapus mendapat posisi berikutnya');

-- ---------- demo_id langkah tidak boleh dipindah (Important #5) ----------
select throws_ok(
  $$update public.steps set demo_id = '10000000-0000-0000-0000-000000000002' where id = '20000000-0000-0000-0000-000000000002'$$,
  'P0001', 'STEP_DEMO_IMMUTABLE', 'demo_id langkah tidak bisa diubah (melewati batas langkah)');

-- ---------- kolom terbit hanya lewat RPC (Important #6) ----------
select throws_ok(
  $$update public.demos set status = 'published', published_snapshot = '[{"image_path":"x"}]' where id = '10000000-0000-0000-0000-000000000002'$$,
  '42501', null, 'pemilik tidak bisa menulis status/snapshot langsung');
select throws_ok(
  $$update public.demos set published_at = now() where id = '10000000-0000-0000-0000-000000000002'$$,
  '42501', null, 'pemilik tidak bisa menulis published_at langsung');
select lives_ok(
  $$update public.demos set title = 'Judul baru' where id = '10000000-0000-0000-0000-000000000002'$$,
  'pemilik tetap bisa mengganti judul');
select throws_ok(
  $$update public.demos set title = repeat('x', 121) where id = '10000000-0000-0000-0000-000000000002'$$,
  '23514', null, 'judul lebih dari 120 karakter ditolak');
select throws_ok(
  $$insert into public.demos (title, slug, status) values ('x', 'hardaaa3', 'published')$$,
  '42501', null, 'insert demo tidak bisa langsung berstatus published');

-- ---------- storage: folder demo milik sendiri + kuota objek (Important #7) ----------
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('step-images', '00000000-0000-0000-0000-0000000000a1/10000000-0000-0000-0000-000000000003/x.webp', '00000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'tidak bisa unggah ke folder demo milik orang lain');
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('step-images', '00000000-0000-0000-0000-0000000000a1/10000000-0000-0000-0000-000000000001/x.webp', '00000000-0000-0000-0000-0000000000a1')$$,
  'unggah ke folder demo sendiri boleh');

reset role;
update public.app_config set value = '1' where key = 'max_demos_per_user';
update public.app_config set value = '1' where key = 'max_steps_per_demo';
-- kuota objek = max_demos × max_steps × 2 = 2; satu sudah ada, tambah satu lagi lalu yang ketiga ditolak
insert into storage.objects (bucket_id, name, owner_id)
  values ('step-images', '00000000-0000-0000-0000-0000000000a1/10000000-0000-0000-0000-000000000001/y.webp', '00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('step-images', '00000000-0000-0000-0000-0000000000a1/10000000-0000-0000-0000-000000000001/z.webp', '00000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'unggah melebihi kuota objek ditolak');

select * from finish();
rollback;
