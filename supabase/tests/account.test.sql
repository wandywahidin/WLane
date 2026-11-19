begin;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local');
insert into public.demos (id, owner_id, title, slug) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'A1', 'akunaaa1'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'A2', 'akunaaa2'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000b2', 'B1', 'akunbbb1');
insert into public.steps (demo_id, position, image_path, image_width, image_height) values
  ('10000000-0000-0000-0000-000000000001', 0, 'a', 1, 1),
  ('10000000-0000-0000-0000-000000000001', 1, 'b', 1, 1),
  ('10000000-0000-0000-0000-000000000003', 0, 'c', 1, 1);

-- anon tidak bisa
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select public.delete_my_account()$$, '42501', null, 'anon tidak bisa memanggil delete_my_account');
reset role;

-- A menghapus akunnya
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok($$select public.delete_my_account()$$, 'A bisa menghapus akunnya');
reset role;

select is((select count(*)::int from auth.users where id = '00000000-0000-0000-0000-0000000000a1'), 0, 'user A tidak ada lagi');
select is((select count(*)::int from public.demos where owner_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'demo A terhapus');
select is((select count(*)::int from public.steps where demo_id = '10000000-0000-0000-0000-000000000001'), 0, 'langkah A terhapus');
select is(
  (select count(*)::int from public.demos d join public.steps s on s.demo_id = d.id
    where d.owner_id = '00000000-0000-0000-0000-0000000000b2'),
  1, 'demo dan langkah B tetap utuh');

select * from finish();
rollback;
