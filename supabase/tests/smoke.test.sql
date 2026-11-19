begin;
select plan(1);
select ok(true, 'pgTAP berjalan');
select * from finish();
rollback;
