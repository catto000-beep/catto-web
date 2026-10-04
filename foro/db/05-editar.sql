-- ============================================================
-- Foro catto.ar · Paso 5: editar una consulta propia
-- Ejecutar en Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se puede correr más de una vez.
--
-- · Solo el autor, y solo si la consulta no tiene NINGUNA respuesta
--   (ni publicada ni pendiente). Una consulta oculta no se edita.
-- · Se pueden cambiar título, texto y categoría; la página vinculada no.
-- · Si la edición agrega una imagen nueva, vuelve a revisión (salvo moderadores).
-- · Queda registrada la fecha de la última edición.
-- ============================================================

alter table foro_tema add column if not exists editado timestamptz;

create or replace function foro_editar_tema(p_tema bigint, p_titulo text, p_cuerpo text, p_categoria text)
returns text language plpgsql security definer
set search_path = public, pg_temp
as $$
declare t foro_tema; p foro_perfil; nuevo text;
begin
  select * into p from foro_perfil where id = auth.uid();
  if p.id is null then raise exception 'Hace falta ingresar para editar.'; end if;
  if p.bloqueado then raise exception 'La cuenta está suspendida para publicar.'; end if;
  select * into t from foro_tema where id = p_tema;
  if t.id is null or t.autor <> p.id then raise exception 'Solo quien hizo la consulta puede editarla.'; end if;
  if t.estado = 'oculto' then raise exception 'Una consulta oculta por la moderación no se puede editar.'; end if;
  if exists (select 1 from foro_respuesta where tema_id = p_tema) then
    raise exception 'La consulta ya tiene respuestas: no se puede editar.';
  end if;
  nuevo := t.estado;
  -- vuelve a revisión solo si aparece una imagen que antes no estaba
  if p.rol <> 'moderador' and exists (
       select 1 from regexp_matches(p_cuerpo, '!\[[^]]*\]\(([^) ]+)\)', 'g') m
       where position(m[1] in t.cuerpo) = 0) then
    nuevo := 'pendiente';
  end if;
  update foro_tema set titulo = btrim(p_titulo), cuerpo = btrim(p_cuerpo), categoria = p_categoria,
         estado = nuevo, editado = now()
  where id = p_tema;
  return nuevo;
end $$;

revoke all on function foro_editar_tema(bigint, text, text, text) from public, anon;
grant execute on function foro_editar_tema(bigint, text, text, text) to authenticated;
