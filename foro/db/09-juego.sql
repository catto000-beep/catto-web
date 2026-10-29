-- ============================================================
-- catto.ar · Ruleta de Ohm: desafíos en línea y ranking (29/10/2026)
-- Ejecutar en Supabase → SQL Editor. Se puede correr más de una vez.
-- No toca ninguna tabla del Aula, del foro ni de «me gusta».
--
--  · juego_desafio: un desafío = 10 preguntas fijas (sus id) y un código
--    de 6 letras que se comparte por enlace
--  · juego_partida: cada vez que alguien juega un desafío, con su alias
--  · nadie escribe las tablas directo: se usan juego_crear y juego_guardar,
--    que validan todo (formato, puntaje posible, una partida por alias y
--    desafío, y un tope de partidas por hora)
--  · cualquiera puede leer los resultados; el ranking semanal sale de
--    juego_ranking()
--  · no hay cuentas: el alias lo elige cada jugador. Es un juego, no un examen
-- ============================================================

create table if not exists public.juego_desafio (
  codigo    text primary key check (codigo ~ '^[a-z0-9]{6}$'),
  preguntas text not null check (preguntas ~ '^[a-z][0-9]{2}(,[a-z][0-9]{2}){9}$'),
  creado    timestamptz not null default now()
);

create table if not exists public.juego_partida (
  id       bigint generated always as identity primary key,
  desafio  text not null references public.juego_desafio(codigo) on delete cascade,
  alias    text not null check (char_length(alias) between 2 and 20),
  aciertos integer not null check (aciertos between 0 and 10),
  puntaje  integer not null check (puntaje between 0 and 2000),
  creado   timestamptz not null default now(),
  unique (desafio, alias)
);
create index if not exists juego_partida_creado on public.juego_partida (creado desc);

alter table public.juego_desafio enable row level security;
alter table public.juego_partida enable row level security;
drop policy if exists juego_desafio_leer on public.juego_desafio;
drop policy if exists juego_partida_leer on public.juego_partida;
create policy juego_desafio_leer on public.juego_desafio for select to anon, authenticated using (true);
create policy juego_partida_leer on public.juego_partida for select to anon, authenticated using (true);
revoke all on public.juego_desafio, public.juego_partida from anon, authenticated;
grant select on public.juego_desafio, public.juego_partida to anon, authenticated;

-- crea un desafío con 10 preguntas y devuelve su código
create or replace function public.juego_crear(p_preguntas text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v text; n int := 0;
begin
  if p_preguntas is null or p_preguntas !~ '^[a-z][0-9]{2}(,[a-z][0-9]{2}){9}$' then
    raise exception 'preguntas inválidas';
  end if;
  -- tope general: no más de 300 desafíos nuevos por hora
  if (select count(*) from public.juego_desafio where creado > now() - interval '1 hour') >= 300 then
    raise exception 'demasiados desafíos, probá en un rato';
  end if;
  loop
    v := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    begin
      insert into public.juego_desafio (codigo, preguntas) values (v, p_preguntas);
      return v;
    exception when unique_violation then
      n := n + 1;
      if n > 5 then raise; end if;
    end;
  end loop;
end;
$$;

-- guarda una partida; devuelve su id
create or replace function public.juego_guardar(p_desafio text, p_alias text, p_aciertos integer, p_puntaje integer)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare v bigint; a text := btrim(p_alias);
begin
  if not exists (select 1 from public.juego_desafio where codigo = p_desafio) then
    raise exception 'desafío inexistente';
  end if;
  if a is null or char_length(a) < 2 or char_length(a) > 20 or a ~ '[<>"&]' then
    raise exception 'alias inválido';
  end if;
  if p_aciertos is null or p_aciertos < 0 or p_aciertos > 10 then
    raise exception 'aciertos inválidos';
  end if;
  -- cada acierto vale entre 100 y 200 puntos (más rápido, más puntos)
  if p_puntaje is null or p_puntaje < p_aciertos * 100 or p_puntaje > p_aciertos * 200 then
    raise exception 'puntaje imposible';
  end if;
  if (select count(*) from public.juego_partida where alias = a and creado > now() - interval '1 hour') >= 30 then
    raise exception 'muchas partidas seguidas, descansá un rato';
  end if;
  insert into public.juego_partida (desafio, alias, aciertos, puntaje)
  values (p_desafio, a, p_aciertos, p_puntaje)
  returning id into v;
  return v;
exception when unique_violation then
  raise exception 'ya jugaste este desafío con ese nombre';
end;
$$;

-- ranking de los últimos 7 días: el mejor puntaje de cada alias
create or replace function public.juego_ranking()
returns table (alias text, mejor integer, partidas bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.alias, max(p.puntaje)::int as mejor, count(*) as partidas
    from public.juego_partida p
   where p.creado > now() - interval '7 days'
   group by p.alias
   order by mejor desc, partidas desc
   limit 20;
$$;

revoke all on function public.juego_crear(text) from public;
revoke all on function public.juego_guardar(text, text, integer, integer) from public;
revoke all on function public.juego_ranking() from public;
grant execute on function public.juego_crear(text) to anon, authenticated;
grant execute on function public.juego_guardar(text, text, integer, integer) to anon, authenticated;
grant execute on function public.juego_ranking() to anon, authenticated;

notify pgrst, 'reload schema';

select 'listo' as estado,
       (select count(*) from public.juego_desafio) as desafios,
       (select count(*) from public.juego_partida) as partidas;
