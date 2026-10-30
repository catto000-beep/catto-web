-- ============================================================
-- catto.ar · Juegos: ranking global (30/10/2026)
-- Ejecutar en Supabase → SQL Editor, después de 09, 10 y 11.
-- Se puede correr más de una vez. Solo crea dos funciones de lectura:
-- no toca ninguna tabla.
--
--  · juegos_ranking_global(): cada jugador (alias) con todas sus partidas
--    en línea de la Ruleta de Ohm y de Unir con flechas, de siempre:
--    puntos sumados, partidas de cada juego, mejor puntaje en cada uno y
--    su avatar más reciente. Ordena por puntos sumados
--  · juegos_resumen(): cuántos jugadores y cuántas partidas hay en total
-- ============================================================

create or replace function public.juegos_ranking_global()
returns table (alias text, avatar text, puntos bigint, partidas bigint, ruleta bigint, unir bigint,
               mejor_ruleta integer, mejor_unir integer, ultima timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select p.alias, p.avatar, p.puntaje, p.creado, 'r'::text as j from public.juego_partida p
    union all
    select p.alias, p.avatar, p.puntaje, p.creado, 'u'::text from public.unir_partida p
  )
  select t.alias,
         (array_agg(t.avatar order by t.creado desc) filter (where t.avatar is not null))[1],
         sum(t.puntaje)::bigint,
         count(*),
         count(*) filter (where t.j = 'r'),
         count(*) filter (where t.j = 'u'),
         (max(t.puntaje) filter (where t.j = 'r'))::int,
         (max(t.puntaje) filter (where t.j = 'u'))::int,
         max(t.creado)
    from t
   group by t.alias
   order by 3 desc, 4 desc
   limit 30;
$$;

create or replace function public.juegos_resumen()
returns table (jugadores bigint, partidas bigint, ruleta bigint, unir bigint)
language sql
stable
security definer
set search_path = public
as $$
  select (select count(distinct a) from (select alias as a from public.juego_partida
                                         union select alias from public.unir_partida) x),
         (select count(*) from public.juego_partida) + (select count(*) from public.unir_partida),
         (select count(*) from public.juego_partida),
         (select count(*) from public.unir_partida);
$$;

grant execute on function public.juegos_ranking_global() to anon, authenticated;
grant execute on function public.juegos_resumen() to anon, authenticated;

notify pgrst, 'reload schema';

select * from public.juegos_resumen();
