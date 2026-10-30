-- ============================================================
-- catto.ar · Memoria: desafíos en línea, ranking semanal y ranking global
-- con los tres juegos (30/10/2026)
-- Ejecutar en Supabase → SQL Editor, después de 09 a 12.
-- Se puede correr más de una vez.
--
--  · memoria_desafio: un desafío = las 16 cartas en su lugar (lista JSON
--    de «tema:clave|i» o «tema:clave|d»), y un código de 6 letras
--  · memoria_partida: alias, avatar, intentos, segundos y puntaje
--  · el puntaje lo calcula la base, no la página: 1500, menos 50 por cada
--    intento de más (8 es lo justo) y 2 por segundo; nunca menos de 100
--  · memoria_ranking(): la mejor partida de cada alias en 7 días
--  · juegos_ranking_global() y juegos_resumen() se rehacen para sumar
--    Memoria (cambia lo que devuelven: por eso se borran antes)
-- ============================================================

create table if not exists public.memoria_desafio (
  codigo text primary key check (codigo ~ '^[a-z0-9]{6}$'),
  cartas jsonb not null check (jsonb_typeof(cartas) = 'array' and jsonb_array_length(cartas) = 16),
  creado timestamptz not null default now()
);

create table if not exists public.memoria_partida (
  id          bigint generated always as identity primary key,
  desafio     text not null references public.memoria_desafio(codigo) on delete cascade,
  alias       text not null check (char_length(alias) between 2 and 20),
  avatar      text check (avatar is null or avatar ~ '^[a-z]{2,8}$'),
  movimientos integer not null check (movimientos between 8 and 500),
  segundos    integer not null check (segundos between 1 and 3600),
  puntaje     integer not null check (puntaje between 100 and 1500),
  creado      timestamptz not null default now(),
  unique (desafio, alias)
);
create index if not exists memoria_partida_creado on public.memoria_partida (creado desc);

alter table public.memoria_desafio enable row level security;
alter table public.memoria_partida enable row level security;
drop policy if exists memoria_desafio_leer on public.memoria_desafio;
drop policy if exists memoria_partida_leer on public.memoria_partida;
create policy memoria_desafio_leer on public.memoria_desafio for select to anon, authenticated using (true);
create policy memoria_partida_leer on public.memoria_partida for select to anon, authenticated using (true);
revoke all on public.memoria_desafio, public.memoria_partida from anon, authenticated;
grant select on public.memoria_desafio, public.memoria_partida to anon, authenticated;

-- crea un desafío con 16 cartas y devuelve su código
create or replace function public.memoria_crear(p_cartas jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v text; n int := 0;
begin
  if p_cartas is null or jsonb_typeof(p_cartas) <> 'array' or jsonb_array_length(p_cartas) <> 16
     or exists (select 1 from jsonb_array_elements(p_cartas) e
                 where jsonb_typeof(e) <> 'string' or char_length(e #>> '{}') > 90 or (e #>> '{}') !~ '^[a-z]+:.+\|[id]$') then
    raise exception 'cartas inválidas';
  end if;
  if (select count(*) from public.memoria_desafio where creado > now() - interval '1 hour') >= 300 then
    raise exception 'demasiados desafíos, probá en un rato';
  end if;
  loop
    v := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    begin
      insert into public.memoria_desafio (codigo, cartas) values (v, p_cartas);
      return v;
    exception when unique_violation then
      n := n + 1;
      if n > 5 then raise; end if;
    end;
  end loop;
end;
$$;

-- guarda una partida y devuelve el puntaje que le corresponde
create or replace function public.memoria_guardar(p_desafio text, p_alias text, p_movimientos integer, p_segundos integer, p_avatar text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare a text := btrim(p_alias); pts integer;
begin
  if not exists (select 1 from public.memoria_desafio where codigo = p_desafio) then
    raise exception 'desafío inexistente';
  end if;
  if a is null or char_length(a) < 2 or char_length(a) > 20 or a ~ '[<>"&]' then
    raise exception 'alias inválido';
  end if;
  -- ocho parejas: por lo menos ocho intentos y un segundo por intento
  if p_movimientos is null or p_movimientos < 8 or p_movimientos > 500 then
    raise exception 'intentos inválidos';
  end if;
  if p_segundos is null or p_segundos < p_movimientos or p_segundos > 3600 then
    raise exception 'tiempo imposible';
  end if;
  if p_avatar is not null and p_avatar !~ '^[a-z]{2,8}$' then
    raise exception 'avatar inválido';
  end if;
  if (select count(*) from public.memoria_partida where alias = a and creado > now() - interval '1 hour') >= 30 then
    raise exception 'muchas partidas seguidas, descansá un rato';
  end if;
  pts := greatest(100, 1500 - 50 * (p_movimientos - 8) - 2 * p_segundos);
  insert into public.memoria_partida (desafio, alias, avatar, movimientos, segundos, puntaje)
  values (p_desafio, a, p_avatar, p_movimientos, p_segundos, pts);
  return pts;
exception when unique_violation then
  raise exception 'ya jugaste este desafío con ese nombre';
end;
$$;

-- ranking de los últimos 7 días: la mejor partida de cada alias
create or replace function public.memoria_ranking()
returns table (alias text, mejor integer, movimientos integer, segundos integer, partidas bigint, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select m.alias, m.puntaje, m.movimientos, m.segundos, c.partidas, c.avatar
    from (select distinct on (p.alias) p.alias, p.puntaje, p.movimientos, p.segundos
            from public.memoria_partida p
           where p.creado > now() - interval '7 days'
           order by p.alias, p.puntaje desc, p.movimientos asc, p.segundos asc) m
    join (select p.alias, count(*) as partidas,
                 (array_agg(p.avatar order by p.creado desc) filter (where p.avatar is not null))[1] as avatar
            from public.memoria_partida p
           where p.creado > now() - interval '7 days'
           group by p.alias) c on c.alias = m.alias
   order by m.puntaje desc, m.movimientos asc, m.segundos asc
   limit 20;
$$;

revoke all on function public.memoria_crear(jsonb) from public;
revoke all on function public.memoria_guardar(text, text, integer, integer, text) from public;
revoke all on function public.memoria_ranking() from public;
grant execute on function public.memoria_crear(jsonb) to anon, authenticated;
grant execute on function public.memoria_guardar(text, text, integer, integer, text) to anon, authenticated;
grant execute on function public.memoria_ranking() to anon, authenticated;

-- ranking global con los tres juegos
drop function if exists public.juegos_ranking_global();
create function public.juegos_ranking_global()
returns table (alias text, avatar text, puntos bigint, partidas bigint, ruleta bigint, unir bigint, memoria bigint,
               mejor_ruleta integer, mejor_unir integer, mejor_memoria integer, ultima timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select p.alias, p.avatar, p.puntaje, p.creado, 'r'::text as j from public.juego_partida p
    union all
    select p.alias, p.avatar, p.puntaje, p.creado, 'u'::text from public.unir_partida p
    union all
    select p.alias, p.avatar, p.puntaje, p.creado, 'm'::text from public.memoria_partida p
  )
  select t.alias,
         (array_agg(t.avatar order by t.creado desc) filter (where t.avatar is not null))[1],
         sum(t.puntaje)::bigint,
         count(*),
         count(*) filter (where t.j = 'r'),
         count(*) filter (where t.j = 'u'),
         count(*) filter (where t.j = 'm'),
         (max(t.puntaje) filter (where t.j = 'r'))::int,
         (max(t.puntaje) filter (where t.j = 'u'))::int,
         (max(t.puntaje) filter (where t.j = 'm'))::int,
         max(t.creado)
    from t
   group by t.alias
   order by 3 desc, 4 desc
   limit 30;
$$;

drop function if exists public.juegos_resumen();
create function public.juegos_resumen()
returns table (jugadores bigint, partidas bigint, ruleta bigint, unir bigint, memoria bigint)
language sql
stable
security definer
set search_path = public
as $$
  select (select count(distinct a) from (select alias as a from public.juego_partida
                                         union select alias from public.unir_partida
                                         union select alias from public.memoria_partida) x),
         (select count(*) from public.juego_partida) + (select count(*) from public.unir_partida) + (select count(*) from public.memoria_partida),
         (select count(*) from public.juego_partida),
         (select count(*) from public.unir_partida),
         (select count(*) from public.memoria_partida);
$$;

grant execute on function public.juegos_ranking_global() to anon, authenticated;
grant execute on function public.juegos_resumen() to anon, authenticated;

notify pgrst, 'reload schema';

select * from public.juegos_resumen();
