-- ============================================================
-- catto.ar · Unir con flechas: desafíos en línea y ranking (30/10/2026)
-- Ejecutar en Supabase → SQL Editor. Se puede correr más de una vez.
-- Mismo esquema que la Ruleta de Ohm (09-juego.sql), en tablas propias:
--
--  · unir_desafio: un desafío = las 30 parejas fijas, en orden (cinco
--    rondas de seis), como lista JSON de claves «tema:clave», y un código
--    de 6 letras que se comparte por enlace
--  · unir_partida: cada vez que alguien juega un desafío, con alias,
--    avatar, aciertos, puntaje y segundos que tardó
--  · nadie escribe las tablas directo: se usan unir_crear y unir_guardar,
--    que validan todo
--  · el ranking semanal sale de unir_ranking(): el mejor puntaje de cada
--    alias; a igual puntaje, gana el más rápido
-- ============================================================

create table if not exists public.unir_desafio (
  codigo  text primary key check (codigo ~ '^[a-z0-9]{6}$'),
  parejas jsonb not null check (jsonb_typeof(parejas) = 'array' and jsonb_array_length(parejas) = 30),
  creado  timestamptz not null default now()
);

create table if not exists public.unir_partida (
  id       bigint generated always as identity primary key,
  desafio  text not null references public.unir_desafio(codigo) on delete cascade,
  alias    text not null check (char_length(alias) between 2 and 20),
  avatar   text check (avatar is null or avatar ~ '^[a-z]{2,8}$'),
  aciertos integer not null check (aciertos between 0 and 30),
  puntaje  integer not null check (puntaje between 0 and 3500),
  segundos integer not null check (segundos between 1 and 7200),
  creado   timestamptz not null default now(),
  unique (desafio, alias)
);
create index if not exists unir_partida_creado on public.unir_partida (creado desc);

alter table public.unir_desafio enable row level security;
alter table public.unir_partida enable row level security;
drop policy if exists unir_desafio_leer on public.unir_desafio;
drop policy if exists unir_partida_leer on public.unir_partida;
create policy unir_desafio_leer on public.unir_desafio for select to anon, authenticated using (true);
create policy unir_partida_leer on public.unir_partida for select to anon, authenticated using (true);
revoke all on public.unir_desafio, public.unir_partida from anon, authenticated;
grant select on public.unir_desafio, public.unir_partida to anon, authenticated;

-- crea un desafío con 30 parejas y devuelve su código
create or replace function public.unir_crear(p_parejas jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v text; n int := 0;
begin
  if p_parejas is null or jsonb_typeof(p_parejas) <> 'array' or jsonb_array_length(p_parejas) <> 30
     or exists (select 1 from jsonb_array_elements(p_parejas) e
                 where jsonb_typeof(e) <> 'string' or char_length(e #>> '{}') > 80 or (e #>> '{}') !~ '^[a-z]+:') then
    raise exception 'parejas inválidas';
  end if;
  if (select count(*) from public.unir_desafio where creado > now() - interval '1 hour') >= 300 then
    raise exception 'demasiados desafíos, probá en un rato';
  end if;
  loop
    v := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    begin
      insert into public.unir_desafio (codigo, parejas) values (v, p_parejas);
      return v;
    exception when unique_violation then
      n := n + 1;
      if n > 5 then raise; end if;
    end;
  end loop;
end;
$$;

-- guarda una partida; devuelve su id
create or replace function public.unir_guardar(p_desafio text, p_alias text, p_aciertos integer, p_puntaje integer, p_segundos integer, p_avatar text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare v bigint; a text := btrim(p_alias);
begin
  if not exists (select 1 from public.unir_desafio where codigo = p_desafio) then
    raise exception 'desafío inexistente';
  end if;
  if a is null or char_length(a) < 2 or char_length(a) > 20 or a ~ '[<>"&]' then
    raise exception 'alias inválido';
  end if;
  if p_aciertos is null or p_aciertos < 0 or p_aciertos > 30 then
    raise exception 'aciertos inválidos';
  end if;
  -- 100 por pareja bien y 100 más por cada ronda perfecta (seis de seis)
  if p_puntaje is null or p_puntaje < p_aciertos * 100 or p_puntaje > p_aciertos * 100 + 100 * (p_aciertos / 6) then
    raise exception 'puntaje imposible';
  end if;
  -- unir 30 parejas lleva por lo menos medio minuto
  if p_segundos is null or p_segundos < 30 or p_segundos > 7200 then
    raise exception 'tiempo imposible';
  end if;
  if p_avatar is not null and p_avatar !~ '^[a-z]{2,8}$' then
    raise exception 'avatar inválido';
  end if;
  if (select count(*) from public.unir_partida where alias = a and creado > now() - interval '1 hour') >= 30 then
    raise exception 'muchas partidas seguidas, descansá un rato';
  end if;
  insert into public.unir_partida (desafio, alias, avatar, aciertos, puntaje, segundos)
  values (p_desafio, a, p_avatar, p_aciertos, p_puntaje, p_segundos)
  returning id into v;
  return v;
exception when unique_violation then
  raise exception 'ya jugaste este desafío con ese nombre';
end;
$$;

-- ranking de los últimos 7 días: la mejor partida de cada alias (más puntos y, si empatan, menos tiempo)
create or replace function public.unir_ranking()
returns table (alias text, mejor integer, segundos integer, partidas bigint, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select m.alias, m.puntaje, m.segundos, c.partidas, c.avatar
    from (select distinct on (p.alias) p.alias, p.puntaje, p.segundos
            from public.unir_partida p
           where p.creado > now() - interval '7 days'
           order by p.alias, p.puntaje desc, p.segundos asc) m
    join (select p.alias, count(*) as partidas,
                 (array_agg(p.avatar order by p.creado desc) filter (where p.avatar is not null))[1] as avatar
            from public.unir_partida p
           where p.creado > now() - interval '7 days'
           group by p.alias) c on c.alias = m.alias
   order by m.puntaje desc, m.segundos asc, c.partidas desc
   limit 20;
$$;

revoke all on function public.unir_crear(jsonb) from public;
revoke all on function public.unir_guardar(text, text, integer, integer, integer, text) from public;
revoke all on function public.unir_ranking() from public;
grant execute on function public.unir_crear(jsonb) to anon, authenticated;
grant execute on function public.unir_guardar(text, text, integer, integer, integer, text) to anon, authenticated;
grant execute on function public.unir_ranking() to anon, authenticated;

notify pgrst, 'reload schema';

select 'listo' as estado,
       (select count(*) from public.unir_desafio) as desafios,
       (select count(*) from public.unir_partida) as partidas;
