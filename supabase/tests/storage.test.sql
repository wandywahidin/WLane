begin;
select plan(7);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');

select ok(exists (select 1 from storage.buckets where id = 'step-images'), 'bucket step-images ada');
select ok((select public from storage.buckets where id = 'step-images'), 'bucket step-images publik-baca');

-- ===== A =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('step-images', '00000000-0000-0000-0000-0000000000a1/d1/x.webp', '00000000-0000-0000-0000-0000000000a1')$$,
  'A bisa insert ke foldernya sendiri');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'step-images'), 1,
  'A bisa melihat (list) objek di foldernya');

-- Storage API memasang flag ini sebelum DELETE; tanpa flag semua delete langsung ditolak.
select set_config('storage.allow_delete_query', 'true', true);

-- ===== B =====
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('step-images', '00000000-0000-0000-0000-0000000000a1/d1/y.webp', '00000000-0000-0000-0000-0000000000b2')$$,
  '42501', null, 'B gagal insert ke folder A');
with d as (delete from storage.objects where name = '00000000-0000-0000-0000-0000000000a1/d1/x.webp' returning 1)
select is((select count(*)::int from d), 0, 'B tidak bisa menghapus objek A');

-- ===== A menghapus miliknya =====
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
with d as (delete from storage.objects where name = '00000000-0000-0000-0000-0000000000a1/d1/x.webp' returning 1)
select is((select count(*)::int from d), 1, 'A bisa menghapus objek miliknya');

select * from finish();
rollback;
