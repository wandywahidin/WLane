-- 0003: terbit (snapshot), batalkan terbit, urutan langkah, baca publik

-- ---------- publish_demo ----------
create function public.publish_demo(p_demo_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_missing text;
  v_snapshot jsonb;
  v_now timestamptz := clock_timestamp();
begin
  if not exists (select 1 from public.demos where id = p_demo_id and owner_id = auth.uid()) then
    raise exception 'DEMO_NOT_FOUND';
  end if;

  if not exists (select 1 from public.steps where demo_id = p_demo_id) then
    raise exception 'PUBLISH_EMPTY';
  end if;

  select string_agg(n::text, ',' order by n) into v_missing
    from (
      select row_number() over (order by position) as n, hotspot_x, hotspot_y
        from public.steps where demo_id = p_demo_id
    ) s
   where hotspot_x is null or hotspot_y is null;
  if v_missing is not null then
    raise exception 'PUBLISH_MISSING_HOTSPOT:%', v_missing;
  end if;

  select jsonb_agg(jsonb_build_object(
           'image_path', image_path,
           'image_width', image_width,
           'image_height', image_height,
           'hotspot_x', hotspot_x,
           'hotspot_y', hotspot_y,
           'tooltip_text', tooltip_text,
           'tooltip_placement', tooltip_placement
         ) order by position)
    into v_snapshot
    from public.steps where demo_id = p_demo_id;

  perform set_config('app.publishing', 'on', true);
  update public.demos
     set published_snapshot = v_snapshot,
         status = 'published',
         published_at = v_now,
         updated_at = v_now
   where id = p_demo_id;
  perform set_config('app.publishing', 'off', true);

  return v_now;
end;
$$;

-- ---------- unpublish_demo ----------
create function public.unpublish_demo(p_demo_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.demos where id = p_demo_id and owner_id = auth.uid()) then
    raise exception 'DEMO_NOT_FOUND';
  end if;

  perform set_config('app.publishing', 'on', true);
  update public.demos
     set published_snapshot = null,
         status = 'draft',
         published_at = null
   where id = p_demo_id;
  perform set_config('app.publishing', 'off', true);
end;
$$;

-- ---------- reorder_steps ----------
-- Perubahan urutan adalah perubahan draft, jadi updated_at tetap disentuh (tanpa flag).
create function public.reorder_steps(p_demo_id uuid, p_step_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.demos where id = p_demo_id and owner_id = auth.uid()) then
    raise exception 'DEMO_NOT_FOUND';
  end if;

  if coalesce(array_length(p_step_ids, 1), 0) <> (select count(*) from public.steps where demo_id = p_demo_id)
     or (select count(distinct x) from unnest(p_step_ids) x) <> coalesce(array_length(p_step_ids, 1), 0)
     or exists (
       select 1 from unnest(p_step_ids) x
        where not exists (select 1 from public.steps s where s.id = x and s.demo_id = p_demo_id)
     ) then
    raise exception 'REORDER_MISMATCH';
  end if;

  update public.steps s
     set position = o.ord - 1
    from unnest(p_step_ids) with ordinality as o(id, ord)
   where s.id = o.id and s.demo_id = p_demo_id and s.position <> o.ord - 1;
end;
$$;

-- ---------- get_published_demo ----------
create function public.get_published_demo(p_slug text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object('title', title, 'slug', slug, 'steps', published_snapshot)
    from public.demos
   where slug = p_slug and status = 'published' and published_snapshot is not null
$$;

revoke execute on function public.publish_demo(uuid) from public, anon;
revoke execute on function public.unpublish_demo(uuid) from public, anon;
revoke execute on function public.reorder_steps(uuid, uuid[]) from public, anon;
grant execute on function public.publish_demo(uuid) to authenticated;
grant execute on function public.unpublish_demo(uuid) to authenticated;
grant execute on function public.reorder_steps(uuid, uuid[]) to authenticated;
grant execute on function public.get_published_demo(text) to anon, authenticated;
