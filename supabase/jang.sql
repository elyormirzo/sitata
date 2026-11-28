-- «sitata.uz» — ONLAYN DUEL: raqib qidirish, jonli bellashuv, reyting, chaqiruv va qasos.
-- Supabase: SQL Editor → shu faylni joylang → Run. Qayta ishga tushirsa ham zarar qilmaydi.
-- Hamma yozish faqat quyidagi funksiyalar orqali (security definer, auth.uid() tekshiriladi).
-- Bellashuv: 10 ta savol, har biriga 15 soniya; ikkala o'yinchi bir vaqtda, har kim o'z tezligida.
-- G'olib — ko'p to'g'ri javob; teng bo'lsa — to'g'ri javoblarga kam vaqt sarflagan. Reyting: g'alaba +3, mag'lubiyat −1, durang +1;
-- Faqat saytda onlayn turgan haqiqiy o'yinchilar bilan (bot yo'q).

-- 1. Reyting
create table if not exists public.jang_reyting (
  profil_id  uuid primary key references public.profillar on delete cascade,
  ball       int not null default 0 check (ball >= 0),
  janglar    int not null default 0,
  yutuq      int not null default 0,
  maglub     int not null default 0,
  durang     int not null default 0,
  yangilandi timestamptz not null default now()
);
create index if not exists jang_reyting_ball on public.jang_reyting (ball desc);
alter table public.jang_reyting enable row level security;
create policy "hamma ko'radi" on public.jang_reyting for select using (true);
grant select on public.jang_reyting to anon, authenticated;

-- 2. Bellashuvlar
create table if not exists public.janglar (
  id         bigint generated always as identity primary key,
  a          uuid not null references public.profillar on delete cascade,
  b          uuid references public.profillar on delete cascade,
  bot        boolean not null default false,
  tur        text not null check (tur in ('tasodifiy', 'taklif', 'qasos', 'bot')),
  holat      text not null default 'kutish' check (holat in ('kutish', 'taklif', 'davom', 'tugadi', 'bekor')),
  savollar   jsonb not null check (jsonb_typeof(savollar) = 'array' and jsonb_array_length(savollar) between 5 and 10),
  boshlandi  timestamptz,
  a_javob    jsonb not null default '[]',
  b_javob    jsonb not null default '[]',
  a_ball     int not null default 0,
  b_ball     int not null default 0,
  natija     text check (natija in ('a', 'b', 'durang')),
  a_ozgarish int,
  b_ozgarish int,
  qasos_id   bigint,
  faol       timestamptz not null default now(),       -- kutayotgan o'yinchining oxirgi so'rovi
  yaratildi  timestamptz not null default now(),
  tugadi     timestamptz
);
create index if not exists janglar_a on public.janglar (a, yaratildi desc);
create index if not exists janglar_b on public.janglar (b, yaratildi desc);
create index if not exists janglar_kutish on public.janglar (holat, faol) where holat = 'kutish';
alter table public.janglar enable row level security;
create policy "ishtirokchilar ko'radi" on public.janglar for select to authenticated using (a = auth.uid() or b = auth.uid());
grant select on public.janglar to authenticated;

-- 3. Kim saytda (onlayn o'yinchilar)
create table if not exists public.faollik (
  profil_id uuid primary key references public.profillar on delete cascade,
  vaqt      timestamptz not null default now()
);
create index if not exists faollik_vaqt on public.faollik (vaqt desc);
alter table public.faollik enable row level security;

-- ===== Ichki yordamchilar =====
create or replace function public.jang_vaqti_tugadimi(j public.janglar) returns boolean
language sql stable set search_path = '' as $$
  select j.boshlandi is not null and now() > j.boshlandi + make_interval(secs => jsonb_array_length(j.savollar) * 16 + 15);
$$;

create or replace function public.jang_reytingga_yoz(p uuid, ozgarish int, nat text) returns int
language plpgsql security definer set search_path = '' as $$
declare v_eski int; v_yangi int;
begin
  insert into public.jang_reyting (profil_id) values (p) on conflict do nothing;
  select ball into v_eski from public.jang_reyting where profil_id = p for update;
  v_yangi := greatest(0, v_eski + ozgarish);
  update public.jang_reyting set ball = v_yangi, janglar = janglar + 1,
    yutuq = yutuq + (nat = 'yutuq')::int, maglub = maglub + (nat = 'maglub')::int, durang = durang + (nat = 'durang')::int,
    yangilandi = now() where profil_id = p;
  return v_yangi - v_eski;
end $$;

-- Bellashuvni yakunlash (ikkalasi tugatganda yoki vaqt o'tganda)
create or replace function public.jang_yakunla_ichki(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare j public.janglar; at int; bt int; ams int; bms int; nat text; ao int; bo int;
begin
  select * into j from public.janglar where id = p_id for update;
  if j.holat <> 'davom' then return; end if;
  select count(*) filter (where (x->>'t')::boolean), coalesce(sum((x->>'ms')::int) filter (where (x->>'t')::boolean), 0)
    into at, ams from jsonb_array_elements(j.a_javob) x;
  select count(*) filter (where (x->>'t')::boolean), coalesce(sum((x->>'ms')::int) filter (where (x->>'t')::boolean), 0)
    into bt, bms from jsonb_array_elements(j.b_javob) x;
  nat := case when at > bt then 'a' when bt > at then 'b' when ams < bms then 'a' when bms < ams then 'b' else 'durang' end;
  if j.bot then
    ao := public.jang_reytingga_yoz(j.a, case nat when 'a' then 1 else 0 end, case nat when 'a' then 'yutuq' when 'b' then 'maglub' else 'durang' end);
  else
    ao := public.jang_reytingga_yoz(j.a, case nat when 'a' then 3 when 'b' then -1 else 1 end, case nat when 'a' then 'yutuq' when 'b' then 'maglub' else 'durang' end);
    bo := public.jang_reytingga_yoz(j.b, case nat when 'b' then 3 when 'a' then -1 else 1 end, case nat when 'b' then 'yutuq' when 'a' then 'maglub' else 'durang' end);
  end if;
  update public.janglar set holat = 'tugadi', tugadi = now(), a_ball = at, b_ball = bt, natija = nat, a_ozgarish = ao, b_ozgarish = bo where id = p_id;
end $$;
revoke execute on function public.jang_reytingga_yoz(uuid, int, text) from public, anon, authenticated;
revoke execute on function public.jang_yakunla_ichki(bigint) from public, anon, authenticated;

-- ===== Mijoz chaqiradigan funksiyalar =====
-- Raqib qidirish: har 1.5 soniyada chaqiriladi. Juftlik topilsa — bellashuv raqami, aks holda null.
create or replace function public.jang_qidir(p_savollar jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); v_id bigint;
begin
  if me is null or not exists (select 1 from public.profillar where id = me) then raise exception 'profil yo''q'; end if;
  update public.janglar set holat = 'bekor' where holat = 'kutish' and faol < now() - interval '2 minutes';   -- tashlab ketilgan navbatlar
  -- Meni kimdir topib bo'lganmi?
  select id into v_id from public.janglar where a = me and tur = 'tasodifiy' and holat = 'davom' and boshlandi > now() - interval '30 seconds' order by id desc limit 1;
  if v_id is not null then return v_id; end if;
  -- Kutayotgan boshqa o'yinchi bormi?
  select id into v_id from public.janglar where holat = 'kutish' and a <> me and faol > now() - interval '6 seconds'
    order by yaratildi limit 1 for update skip locked;
  if v_id is not null then
    update public.janglar set holat = 'bekor' where a = me and holat = 'kutish';
    update public.janglar set b = me, holat = 'davom', boshlandi = now() + interval '4 seconds' where id = v_id;
    return v_id;
  end if;
  -- Navbatda turamiz
  update public.janglar set faol = now() where a = me and holat = 'kutish';
  if not found then
    insert into public.janglar (a, tur, holat, savollar) values (me, 'tasodifiy', 'kutish', p_savollar);
  end if;
  return null;
end $$;

create or replace function public.jang_qidiruvni_bekor() returns void
language sql security definer set search_path = '' as $$
  update public.janglar set holat = 'bekor' where a = auth.uid() and holat = 'kutish';
$$;

-- Javob yozish (ketma-ket: i — nechanchi savol)
create or replace function public.jang_javob(p_id bigint, p_i int, p_togri boolean, p_ms int) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); j public.janglar; v jsonb := jsonb_build_object('t', p_togri, 'ms', least(15000, greatest(0, p_ms)));
begin
  select * into j from public.janglar where id = p_id for update;
  if j.id is null or (j.a <> me and coalesce(j.b <> me, true)) then raise exception 'ruxsat yo''q'; end if;
  if j.holat <> 'davom' or now() < j.boshlandi - interval '1 second' then return; end if;
  if j.a = me then
    if jsonb_array_length(j.a_javob) <> p_i or p_i >= jsonb_array_length(j.savollar) then return; end if;
    update public.janglar set a_javob = a_javob || v, a_ball = a_ball + p_togri::int where id = p_id returning * into j;
  else
    if jsonb_array_length(j.b_javob) <> p_i or p_i >= jsonb_array_length(j.savollar) then return; end if;
    update public.janglar set b_javob = b_javob || v, b_ball = b_ball + p_togri::int where id = p_id returning * into j;
  end if;
  if jsonb_array_length(j.a_javob) = jsonb_array_length(j.savollar)
     and (j.bot or jsonb_array_length(j.b_javob) = jsonb_array_length(j.savollar)) then
    perform public.jang_yakunla_ichki(p_id);
  end if;
end $$;

-- Holat (o'yin davomida har soniyada): vaqt o'tgan bo'lsa yakunlaydi; eskirgan takliflarni bekor qiladi
create or replace function public.jang_holati(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); j public.janglar; ra int; rb int;
begin
  select * into j from public.janglar where id = p_id;
  if j.id is null or (j.a <> me and coalesce(j.b <> me, true)) then return null; end if;
  if j.holat = 'davom' and public.jang_vaqti_tugadimi(j) then perform public.jang_yakunla_ichki(p_id); end if;
  if j.holat = 'taklif' and j.yaratildi < now() - interval '90 seconds' then
    update public.janglar set holat = 'bekor' where id = p_id and holat = 'taklif';
  end if;
  select * into j from public.janglar where id = p_id;
  select ball into ra from public.jang_reyting where profil_id = j.a;
  select ball into rb from public.jang_reyting where profil_id = j.b;
  return to_jsonb(j) || jsonb_build_object('hozir', now(), 'a_reyting', coalesce(ra, 0), 'b_reyting', coalesce(rb, 0),
    'qasos_holat', (select holat from public.janglar q where q.id = j.qasos_id),
    'qasos_kim', (select q.a from public.janglar q where q.id = j.qasos_id));
end $$;

-- Chaqiruv: kitobdosh yoki onlayn o'yinchini; qasos — tugagan bellashuvdan keyin
create or replace function public.jang_taklif(p_raqib uuid, p_savollar jsonb, p_oldingi bigint default null) returns bigint
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); v_id bigint; o public.janglar;
begin
  if me is null or not exists (select 1 from public.profillar where id = me) then raise exception 'profil yo''q'; end if;
  if p_raqib is null or p_raqib = me or not exists (select 1 from public.profillar where id = p_raqib) then raise exception 'raqib topilmadi'; end if;
  if (select count(*) from public.janglar where a = me and holat = 'taklif' and yaratildi > now() - interval '90 seconds') >= 3 then
    raise exception 'juda ko''p chaqiruv';
  end if;
  if p_oldingi is not null then
    select * into o from public.janglar where id = p_oldingi;
    if o.id is null or o.holat <> 'tugadi' or not (me in (o.a, o.b) and p_raqib in (o.a, o.b)) then raise exception 'qasos mumkin emas'; end if;
    if o.qasos_id is not null then
      -- Raqib allaqachon qasos taklif qilgan bo'lsa — uni qabul qilamiz
      select id into v_id from public.janglar where id = o.qasos_id and holat = 'taklif' and b = me;
      if v_id is not null then
        update public.janglar set holat = 'davom', boshlandi = now() + interval '4 seconds' where id = v_id;
        return v_id;
      end if;
      return o.qasos_id;
    end if;
  end if;
  insert into public.janglar (a, b, tur, holat, savollar) values (me, p_raqib, case when p_oldingi is null then 'taklif' else 'qasos' end, 'taklif', p_savollar)
    returning id into v_id;
  if p_oldingi is not null then update public.janglar set qasos_id = v_id where id = p_oldingi; end if;
  return v_id;
end $$;

create or replace function public.jang_qabul(p_id bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.janglar set holat = 'davom', boshlandi = now() + interval '4 seconds'
    where id = p_id and b = auth.uid() and holat = 'taklif' and yaratildi > now() - interval '90 seconds';
  return found;
end $$;

create or replace function public.jang_rad(p_id bigint) returns void
language sql security definer set search_path = '' as $$
  update public.janglar set holat = 'bekor' where id = p_id and holat = 'taklif' and (a = auth.uid() or b = auth.uid());
$$;

-- Chaqiruv haqida bildirishnoma (push va Telegram ham shu orqali boradi)
create or replace function public.jang_taklif_bildir() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_ism text;
begin
  if new.holat = 'taklif' and new.b is not null then
    select ism into v_ism from public.profillar where id = new.a;
    insert into public.bildirishnomalar (kimga, matn, havola)
    values (new.b, case when new.tur = 'qasos' then '🔥 ' || coalesce(v_ism, 'Raqibingiz') || ' qasos olmoqchi — onlayn duelga chaqirdi!'
                         else '✒️ ' || coalesce(v_ism, 'Kitobxon') || ' sizni onlayn duelga chaqirdi!' end, '#jang/' || new.id);
  end if;
  return new;
end $$;
drop trigger if exists jang_taklif_bildir on public.janglar;
create trigger jang_taklif_bildir after insert on public.janglar for each row execute function public.jang_taklif_bildir();
revoke execute on function public.jang_taklif_bildir() from public, anon, authenticated;

-- Faollik (sayt ochiq turganda har daqiqada) va onlayn o'yinchilar
create or replace function public.faollik_yoz() returns void
language sql security definer set search_path = '' as $$
  insert into public.faollik (profil_id, vaqt) select auth.uid(), now() where exists (select 1 from public.profillar where id = auth.uid())
  on conflict (profil_id) do update set vaqt = now();
$$;

create or replace function public.onlayn_oyinchilar() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'soni', (select count(*) from public.faollik where vaqt > now() - interval '3 minutes'),
    'qidiryapti', (select count(*) from public.janglar where holat = 'kutish' and faol > now() - interval '6 seconds' and a <> auth.uid()),
    'royxat', coalesce((select jsonb_agg(x order by (x->>'qidiryapti')::boolean desc, x->>'vaqt' desc) from (
      select jsonb_build_object('id', p.id, 'kod', p.kod, 'ism', p.ism, 'taxallus', p.taxallus, 'rasm', p.rasm,
        'ball', coalesce(r.ball, 0), 'vaqt', f.vaqt,
        'qidiryapti', exists (select 1 from public.janglar k where k.a = p.id and k.holat = 'kutish' and k.faol > now() - interval '6 seconds')) x
      from public.faollik f join public.profillar p on p.id = f.profil_id left join public.jang_reyting r on r.profil_id = p.id
      where f.vaqt > now() - interval '3 minutes' and f.profil_id <> auth.uid()
      order by f.vaqt desc limit 40) s), '[]'::jsonb));
$$;

create or replace function public.jang_reytingi() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select jsonb_build_object('id', p.id, 'kod', p.kod, 'ism', p.ism, 'taxallus', p.taxallus, 'rasm', p.rasm,
      'ball', r.ball, 'janglar', r.janglar, 'yutuq', r.yutuq) x
    from public.jang_reyting r join public.profillar p on p.id = r.profil_id
    where r.janglar > 0 order by r.ball desc, r.yutuq desc, r.yangilandi limit 50) s;
$$;

revoke execute on function public.jang_qidir(jsonb), public.jang_qidiruvni_bekor(), public.jang_javob(bigint, int, boolean, int),
  public.jang_holati(bigint), public.jang_taklif(uuid, jsonb, bigint), public.jang_qabul(bigint), public.jang_rad(bigint),
  public.faollik_yoz(), public.onlayn_oyinchilar(), public.jang_reytingi() from public, anon;
grant execute on function public.jang_qidir(jsonb), public.jang_qidiruvni_bekor(), public.jang_javob(bigint, int, boolean, int),
  public.jang_holati(bigint), public.jang_taklif(uuid, jsonb, bigint), public.jang_qabul(bigint), public.jang_rad(bigint),
  public.faollik_yoz(), public.onlayn_oyinchilar(), public.jang_reytingi() to authenticated;

-- Saytdagi jami onlayn (oxirgi 3 daqiqada faol profillar) — tepadagi «🟢 N onlayn» uchun, hamma ko'ra oladi
create or replace function public.onlayn_soni() returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.faollik where vaqt > now() - interval '3 minutes';
$$;
grant execute on function public.onlayn_soni() to anon, authenticated;
