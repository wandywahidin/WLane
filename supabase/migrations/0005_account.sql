-- 0005: hapus akun sendiri. Demo dan langkah ikut terhapus lewat on delete cascade.
-- Gambar di Storage dihapus klien lebih dulu (Storage tidak boleh dihapus lewat SQL).

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
