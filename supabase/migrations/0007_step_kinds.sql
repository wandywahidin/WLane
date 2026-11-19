-- 0007: jenis langkah (sorotan area, modal), batas ukuran, dan aturan terbit

-- Hanya batas ukuran/bentuk; draf boleh berisi label kosong atau URL setengah jadi.
create function public.valid_step_buttons(p jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p is not null
     and jsonb_typeof(p) = 'array'
     and jsonb_array_length(p) <= 2
     and coalesce((
       select bool_and(
                jsonb_typeof(b) = 'object'
            and jsonb_typeof(b -> 'label') = 'string'
            and char_length(b ->> 'label') <= 30
            and (b ->> 'action') in ('next', 'back', 'link')
            and (not b ? 'url' or (jsonb_typeof(b -> 'url') = 'string' and char_length(b ->> 'url') <= 500))
            and (not b ? 'primary' or jsonb_typeof(b -> 'primary') = 'boolean')
              )
         from jsonb_array_elements(p) b
     ), true)
     and (
       select count(*) from jsonb_array_elements(p) b
        where jsonb_typeof(b) = 'object' and b -> 'primary' = 'true'::jsonb
     ) <= 1
$$;

alter table public.steps
  add column kind        text  not null default 'hotspot',
  add column area_w      numeric,
  add column area_h      numeric,
  add column modal_title text  not null default '',
  add column modal_body  text  not null default '',
  add column buttons     jsonb not null default '[]'::jsonb;

alter table public.steps
  add constraint steps_kind_check check (kind in ('hotspot', 'modal')),
  add constraint steps_modal_title_len check (char_length(modal_title) <= 80),
  add constraint steps_modal_body_len check (char_length(modal_body) <= 500),
  add constraint steps_buttons_valid check (public.valid_step_buttons(buttons)),
  add constraint steps_area_pair check ((area_w is null) = (area_h is null)),
  add constraint steps_area_min check (
    (area_w is null or area_w >= 2) and (area_h is null or area_h >= 2)
  ),
  add constraint steps_area_inside check (
    area_w is null or hotspot_x is null or hotspot_y is null
    or (hotspot_x - area_w / 2 >= 0 and hotspot_x + area_w / 2 <= 100
        and hotspot_y - area_h / 2 >= 0 and hotspot_y + area_h / 2 <= 100)
  );

create or replace function public.publish_demo(p_demo_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_missing text;
  v_incomplete text;
  v_msg text;
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
      select row_number() over (order by position) as n, kind, hotspot_x, hotspot_y
        from public.steps where demo_id = p_demo_id
    ) s
   where kind = 'hotspot' and (hotspot_x is null or hotspot_y is null);

  select string_agg(n::text, ',' order by n) into v_incomplete
    from (
      select row_number() over (order by position) as n, kind, modal_title, buttons
        from public.steps where demo_id = p_demo_id
    ) s
   where kind = 'modal'
     and (
       btrim(modal_title) = ''
       or jsonb_array_length(buttons) < 1
       or exists (
         select 1 from jsonb_array_elements(s.buttons) b
          where btrim(coalesce(b ->> 'label', '')) = ''
             or (b ->> 'action' = 'link' and coalesce(b ->> 'url', '') !~ '^https://')
       )
     );

  if v_missing is not null or v_incomplete is not null then
    v_msg := concat_ws(';',
      case when v_missing is not null then 'PUBLISH_MISSING_HOTSPOT:' || v_missing end,
      case when v_incomplete is not null then 'PUBLISH_INCOMPLETE_MODAL:' || v_incomplete end);
    raise exception '%', v_msg;
  end if;

  select jsonb_agg(jsonb_build_object(
           'image_path', image_path,
           'image_width', image_width,
           'image_height', image_height,
           'hotspot_x', hotspot_x,
           'hotspot_y', hotspot_y,
           'tooltip_text', tooltip_text,
           'tooltip_placement', tooltip_placement,
           'kind', kind,
           'area_w', area_w,
           'area_h', area_h,
           'modal_title', modal_title,
           'modal_body', modal_body,
           'buttons', buttons
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

revoke execute on function public.publish_demo(uuid) from public, anon;
grant execute on function public.publish_demo(uuid) to authenticated;
