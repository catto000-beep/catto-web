-- ============================================================
-- catto.ar · Ruleta de Ohm: avatar de cada jugador (30/10/2026)
-- Ejecutar en Supabase → SQL Editor, después de 09-juego.sql.
-- Se puede correr más de una vez.
--
--  · juego_partida suma la columna avatar (el id del dibujo, p. ej. «gato»;
--    los dibujos viven en assets/js/juego-avatares.js)
--  · juego_guardar pasa a recibir p_avatar, opcional: quien juegue con
--    una página vieja en caché sigue pudiendo guardar
--  · juego_ranking devuelve también el avatar más reciente de cada alias
-- ============================================================

alter table public.juego_partida add column if not exists avatar text;
alter table public.juego_partida drop constraint if exists juego_partida_avatar_ok;
alter table public.juego_partida add constraint juego_partida_avatar_ok check (avatar is null or avatar ~ '^[a-z]{2,8}$');

-- la versión de cuatro parámetros se reemplaza por una de cinco, con p_avatar opcional
drop function if exists public.juego_guardar(text, text, integer, integer);

create or replace function public.juego_guardar(p_desafio text, p_alias text, p_aciertos integer, p_puntaje integer, p_avatar text default null)
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
  if p_avatar is not null and p_avatar !~ '^[a-z]{2,8}$' then
    raise exception 'avatar inválido';
  end if;
  if (select count(*) from public.juego_partida where alias = a and creado > now() - interval '1 hour') >= 30 then
    raise exception 'muchas partidas seguidas, descansá un rato';
  end if;
  insert into public.juego_partida (desafio, alias, aciertos, puntaje, avatar)
  values (p_desafio, a, p_aciertos, p_puntaje, p_avatar)
  returning id into v;
  return v;
exception when unique_violation then
  raise exception 'ya jugaste este desafío con ese nombre';
end;
$$;

-- el tipo de retorno cambia: hay que borrarla antes de recrearla
drop function if exists public.juego_ranking();

create function public.juego_ranking()
returns table (alias text, mejor integer, partidas bigint, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select p.alias, max(p.puntaje)::int as mejor, count(*) as partidas,
         (array_agg(p.avatar order by p.creado desc) filter (where p.avatar is not null))[1] as avatar
    from public.juego_partida p
   where p.creado > now() - interval '7 days'
   group by p.alias
   order by mejor desc, partidas desc
   limit 20;
$$;

revoke all on function public.juego_guardar(text, text, integer, integer, text) from public;
revoke all on function public.juego_ranking() from public;
grant execute on function public.juego_guardar(text, text, integer, integer, text) to anon, authenticated;
grant execute on function public.juego_ranking() to anon, authenticated;

notify pgrst, 'reload schema';

select 'listo' as estado,
       (select count(*) from public.juego_partida where avatar is not null) as partidas_con_avatar;
