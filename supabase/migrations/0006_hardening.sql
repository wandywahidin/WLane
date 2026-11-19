-- 0006: pengerasan dari review akhir.

-- ---------- posisi langkah diberikan database ----------
-- Klien tidak lagi mengirim position; nomor berikutnya dihitung di bawah lock yang sama
-- dengan batas langkah, sehingga unggahan bersamaan dan hapus tidak membuat celah/bentrok.
create or replace function public.enforce_step_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('steps:' || new.demo_id::text));
  if (select count(*) from public.steps where demo_id = new.demo_id)
     >= public.config_int('max_steps_per_demo') then
    raise exception 'LIMIT_STEPS';
  end if;
  if new.position is null then
    select coalesce(max(position) + 1, 0) into new.position from public.steps where demo_id = new.demo_id;
  end if;
  return new;
end;
$$;

-- ---------- hapus langkah + rapikan urutan dalam satu transaksi ----------
create function public.delete_step(p_step_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_demo_id uuid;
begin
  select s.demo_id into v_demo_id
    from public.steps s join public.demos d on d.id = s.demo_id
   where s.id = p_step_id and d.owner_id = auth.uid();
  if v_demo_id is null then
    raise exception 'STEP_NOT_FOUND';
  end if;

  perform pg_advisory_xact_lock(hashtext('steps:' || v_demo_id::text));
  delete from public.steps where id = p_step_id;
  update public.steps s
     set position = o.rn - 1
    from (select id, row_number() over (order by position) as rn from public.steps where demo_id = v_demo_id) o
   where s.id = o.id and s.position <> o.rn - 1;
end;
$$;

revoke execute on function public.delete_step(uuid) from public, anon;
grant execute on function public.delete_step(uuid) to authenticated;

-- ---------- langkah tidak bisa dipindah ke demo lain ----------
create function public.forbid_step_demo_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.demo_id is distinct from old.demo_id then
    raise exception 'STEP_DEMO_IMMUTABLE';
  end if;
  return new;
end;
$$;

create trigger steps_forbid_demo_change
  before update of demo_id on public.steps
  for each row execute function public.forbid_step_demo_change();

alter table public.steps add constraint steps_image_path_len check (char_length(image_path) <= 255);

-- ---------- kolom terbit hanya lewat RPC ----------
alter table public.demos add constraint demos_title_len check (char_length(title) <= 120);

revoke insert, update on public.demos from authenticated;
-- owner_id tetap dijaga RLS (with check owner_id = auth.uid()).
grant insert (id, owner_id, title, slug) on public.demos to authenticated;
grant update (title) on public.demos to authenticated;

-- ---------- storage: folder demo milik sendiri + kuota objek ----------
create function public.can_upload_step_image(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (storage.foldername(p_name))[1] = auth.uid()::text
     and exists (
       select 1 from public.demos d
        where d.id::text = (storage.foldername(p_name))[2] and d.owner_id = auth.uid()
     )
     and (
       select count(*) from storage.objects o
        where o.bucket_id = 'step-images' and (storage.foldername(o.name))[1] = auth.uid()::text
     ) < public.config_int('max_demos_per_user') * public.config_int('max_steps_per_demo') * 2
$$;

revoke execute on function public.can_upload_step_image(text) from public, anon;
grant execute on function public.can_upload_step_image(text) to authenticated;

drop policy step_images_insert_own on storage.objects;
create policy step_images_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'step-images' and public.can_upload_step_image(name));

-- Fallback JPEG untuk browser yang tidak bisa meng-encode WebP (Safari/iOS).
update storage.buckets set allowed_mime_types = array['image/webp', 'image/jpeg'] where id = 'step-images';
