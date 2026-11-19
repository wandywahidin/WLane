begin;
select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local');

update public.app_config set value = '10' where key = 'max_demos_per_user';

insert into public.demos (id, owner_id, title, slug) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Modal tanpa judul', 'kind0001'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Link http',         'kind0002'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'Dua masalah',       'kind0003'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', 'Sukses',            'kind0004'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a1', 'Titik lama',        'kind0005'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000a1', 'Batas',             'kind0006');

-- ===== batas tabel (draf) =====
select lives_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, kind, modal_title, buttons)
  values ('10000000-0000-0000-0000-000000000006', 'a/6/a.webp', 10, 10, 'modal', '',
          '[{"label":"","action":"link","url":"ht"}]')$$, 'draf modal dengan label kosong dan url setengah jadi lolos');
select lives_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, hotspot_x, hotspot_y, area_w, area_h)
  values ('10000000-0000-0000-0000-000000000006', 'a/6/b.webp', 10, 10, 50, 50, 16, 10)$$, 'sorotan berarea 16x10 lolos');

select throws_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, kind, buttons)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 'modal',
          '[{"label":"a","action":"next"},{"label":"b","action":"back"},{"label":"c","action":"next"}]')$$,
  '23514', null, '3 tombol ditolak');
select throws_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, kind, buttons)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 'modal',
          '[{"label":"a","action":"next","primary":true},{"label":"b","action":"back","primary":true}]')$$,
  '23514', null, '2 tombol primary ditolak');
select throws_ok(format($f$insert into public.steps (demo_id, image_path, image_width, image_height, kind, buttons)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 'modal', %L)$f$,
  '[{"label":"' || repeat('a', 31) || '","action":"next"}]'),
  '23514', null, 'label 31 karakter ditolak');
select throws_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, kind, buttons)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 'modal',
          '[{"label":"a","action":"lompat"}]')$$,
  '23514', null, 'action tidak dikenal ditolak');
select throws_ok(format($f$insert into public.steps (demo_id, image_path, image_width, image_height, kind, buttons)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 'modal', %L)$f$,
  '[{"label":"a","action":"link","url":"https://' || repeat('a', 493) || '"}]'),
  '23514', null, 'URL 501 karakter ditolak');
select throws_ok(format($f$insert into public.steps (demo_id, image_path, image_width, image_height, kind, modal_title)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 'modal', %L)$f$, repeat('a', 81)),
  '23514', null, 'judul 81 karakter ditolak');
select throws_ok(format($f$insert into public.steps (demo_id, image_path, image_width, image_height, kind, modal_body)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 'modal', %L)$f$, repeat('a', 501)),
  '23514', null, 'teks 501 karakter ditolak');
select throws_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, hotspot_x, hotspot_y, area_w)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 50, 50, 16)$$,
  '23514', null, 'area_w terisi tapi area_h null ditolak');
select throws_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, hotspot_x, hotspot_y, area_w, area_h)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 50, 50, 1, 10)$$,
  '23514', null, 'area_w = 1 ditolak');
select throws_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, hotspot_x, hotspot_y, area_w, area_h)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 95, 50, 16, 10)$$,
  '23514', null, 'kotak keluar gambar ditolak');
select throws_ok($$insert into public.steps (demo_id, image_path, image_width, image_height, kind)
  values ('10000000-0000-0000-0000-000000000006', 'x', 10, 10, 'form')$$,
  '23514', null, 'kind form ditolak');

-- ===== aturan terbit =====
-- demo 1: langkah 1 titik lengkap, langkah 2 modal tanpa judul
insert into public.steps (demo_id, position, image_path, image_width, image_height, hotspot_x, hotspot_y) values
  ('10000000-0000-0000-0000-000000000001', 0, 'a/1/a.webp', 10, 10, 50, 50);
insert into public.steps (demo_id, position, image_path, image_width, image_height, kind, modal_title, buttons) values
  ('10000000-0000-0000-0000-000000000001', 1, 'a/1/b.webp', 10, 10, 'modal', '  ', '[{"label":"Lanjut","action":"next","primary":true}]');
-- demo 2: modal dengan URL http
insert into public.steps (demo_id, position, image_path, image_width, image_height, kind, modal_title, buttons) values
  ('10000000-0000-0000-0000-000000000002', 0, 'a/2/a.webp', 10, 10, 'modal', 'Judul', '[{"label":"Buka","action":"link","url":"http://x.id"}]');
-- demo 3: sorotan tanpa hotspot + modal kosong
insert into public.steps (demo_id, position, image_path, image_width, image_height) values
  ('10000000-0000-0000-0000-000000000003', 0, 'a/3/a.webp', 10, 10);
insert into public.steps (demo_id, position, image_path, image_width, image_height, kind) values
  ('10000000-0000-0000-0000-000000000003', 1, 'a/3/b.webp', 10, 10, 'modal');
-- demo 4: modal lengkap tanpa hotspot + sorotan berarea
insert into public.steps (demo_id, position, image_path, image_width, image_height, kind, modal_title, modal_body, buttons) values
  ('10000000-0000-0000-0000-000000000004', 0, 'a/4/a.webp', 10, 10, 'modal', 'Halo', 'Selamat datang',
   '[{"label":"Lanjut","action":"next","primary":true},{"label":"Buka","action":"link","url":"https://x.id"}]');
insert into public.steps (demo_id, position, image_path, image_width, image_height, hotspot_x, hotspot_y, area_w, area_h) values
  ('10000000-0000-0000-0000-000000000004', 1, 'a/4/b.webp', 10, 10, 50, 50, 16, 10);
-- demo 5: langkah titik lama
insert into public.steps (demo_id, position, image_path, image_width, image_height, hotspot_x, hotspot_y) values
  ('10000000-0000-0000-0000-000000000005', 0, 'a/5/a.webp', 10, 10, 20, 30);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select throws_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000001')$$,
  'P0001', 'PUBLISH_INCOMPLETE_MODAL:2', 'modal tanpa judul di langkah 2 ditolak');
select throws_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000002')$$,
  'P0001', 'PUBLISH_INCOMPLETE_MODAL:1', 'modal dengan URL http ditolak');
select throws_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000003')$$,
  'P0001', 'PUBLISH_MISSING_HOTSPOT:1;PUBLISH_INCOMPLETE_MODAL:2', 'kedua masalah disebut sekaligus');

select lives_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000004')$$, 'modal lengkap + sorotan berarea terbit');
select is((select published_snapshot -> 0 ->> 'kind' from public.demos where id = '10000000-0000-0000-0000-000000000004'),
  'modal', 'snapshot langkah 1 kind modal');
select is((select published_snapshot -> 0 -> 'buttons' -> 0 ->> 'label' from public.demos where id = '10000000-0000-0000-0000-000000000004'),
  'Lanjut', 'snapshot membawa tombol');
select is((select published_snapshot -> 1 ->> 'area_w' from public.demos where id = '10000000-0000-0000-0000-000000000004'),
  '16', 'snapshot membawa area_w');

select lives_ok($$select public.publish_demo('10000000-0000-0000-0000-000000000005')$$, 'langkah titik lama tetap terbit');
select ok((select published_snapshot -> 0 ?& array['kind','area_w','area_h','modal_title','modal_body','buttons']
  from public.demos where id = '10000000-0000-0000-0000-000000000005'), 'elemen snapshot punya field baru');

select * from finish();
rollback;
