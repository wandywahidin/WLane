begin;
select plan(7);

-- ---------- LIMIT_USERS ----------
insert into auth.users (id, email)
select gen_random_uuid(), 'u' || i || '@test.local' from generate_series(1, 20) i;
select is((select count(*)::int from auth.users), 20, '20 user bisa dibuat');
select throws_ok(
  $$insert into auth.users (id, email) values (gen_random_uuid(), 'ke21@test.local')$$,
  'P0001', 'LIMIT_USERS', 'user ke-21 ditolak'
);

-- ---------- LIMIT_DEMOS ----------
-- pakai user pertama
create temp table t_owner as select id from auth.users order by email limit 1;

select lives_ok(
  $$insert into public.demos (owner_id, title, slug)
    select (select id from t_owner), 'Demo ' || i, 'demo000' || i from generate_series(1, 5) i$$,
  '5 demo bisa dibuat'
);
select throws_ok(
  $$insert into public.demos (owner_id, title, slug) values ((select id from t_owner), 'Demo 6', 'demo0006')$$,
  'P0001', 'LIMIT_DEMOS', 'demo ke-6 ditolak'
);

update public.app_config set value = '6' where key = 'max_demos_per_user';
select lives_ok(
  $$insert into public.demos (owner_id, title, slug) values ((select id from t_owner), 'Demo 6', 'demo0006')$$,
  'setelah max_demos_per_user=6, demo ke-6 lolos'
);

-- ---------- LIMIT_STEPS ----------
create temp table t_demo as select id from public.demos where slug = 'demo0001';

select lives_ok(
  $$insert into public.steps (demo_id, position, image_path, image_width, image_height)
    select (select id from t_demo), i, 'p' || i, 10, 10 from generate_series(0, 19) i$$,
  '20 langkah bisa dibuat'
);
select throws_ok(
  $$insert into public.steps (demo_id, position, image_path, image_width, image_height)
    values ((select id from t_demo), 20, 'p20', 10, 10)$$,
  'P0001', 'LIMIT_STEPS', 'langkah ke-21 ditolak'
);

select * from finish();
rollback;
