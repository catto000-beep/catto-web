-- ============================================================
-- Foro catto.ar · Paso 7: más herramientas de moderación
-- Ejecutar en Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se puede correr más de una vez. No toca nada del Aula.
--
-- · foro_moderar: volver a publicar un mensaje oculto ya no le da
--   confianza a la cuenta; solo aprobar uno pendiente lo hace.
-- · foro_borrar: borra para siempre una consulta (con sus respuestas
--   y denuncias) o una respuesta. Queda registrado en el historial.
-- · foro_confianza: dar o quitar a una cuenta el permiso de publicar
--   sin revisión previa.
-- · foro_mover: cambiar una consulta de categoría.
-- Todas exigen ser moderador y quedan en foro_accion.
-- ============================================================

create or replace function foro_moderar(p_tipo text, p_id bigint, p_estado text)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare a uuid; antes text;
begin
  if not foro_es_moderador() then raise exception 'Sin permiso de moderación.'; end if;
  if p_estado not in ('publicado','oculto') then raise exception 'Estado no válido.'; end if;
  if p_tipo = 'tema' then
    select estado into antes from foro_tema where id = p_id;
    update foro_tema set estado = p_estado where id = p_id returning autor into a;
  elsif p_tipo = 'respuesta' then
    select estado into antes from foro_respuesta where id = p_id;
    update foro_respuesta set estado = p_estado where id = p_id returning autor into a;
  else
    raise exception 'Tipo no válido.';
  end if;
  if a is null then raise exception 'No se encontró el mensaje.'; end if;
  if p_estado = 'publicado' and antes = 'pendiente' then update foro_perfil set confiable = true where id = a; end if;
  insert into foro_accion (moderador, accion, tipo, objeto) values (auth.uid(), p_estado, p_tipo, p_id::text);
end $$;

create or replace function foro_borrar(p_tipo text, p_id bigint)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare d text;
begin
  if not foro_es_moderador() then raise exception 'Sin permiso de moderación.'; end if;
  if p_tipo = 'tema' then
    select '«' || left(t.titulo, 80) || '» de ' || coalesce(p.alias, '?') into d
      from foro_tema t left join foro_perfil p on p.id = t.autor where t.id = p_id;
    if d is null then raise exception 'No se encontró el mensaje.'; end if;
    delete from foro_tema where id = p_id;
  elsif p_tipo = 'respuesta' then
    select 'de ' || coalesce(p.alias, '?') || ' en la consulta ' || r.tema_id into d
      from foro_respuesta r left join foro_perfil p on p.id = r.autor where r.id = p_id;
    if d is null then raise exception 'No se encontró el mensaje.'; end if;
    delete from foro_respuesta where id = p_id;
  else
    raise exception 'Tipo no válido.';
  end if;
  insert into foro_accion (moderador, accion, tipo, objeto) values (auth.uid(), 'borrar', p_tipo, p_id || ' ' || d);
end $$;

create or replace function foro_confianza(p_alias text, p_valor boolean)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not foro_es_moderador() then raise exception 'Sin permiso de moderación.'; end if;
  update foro_perfil set confiable = p_valor where alias = lower(p_alias) and rol <> 'moderador';
  if not found then raise exception 'No hay un usuario con ese alias (o es moderador).'; end if;
  insert into foro_accion (moderador, accion, tipo, objeto)
    values (auth.uid(), case when p_valor then 'confiar' else 'revisar' end, 'usuario', lower(p_alias));
end $$;

create or replace function foro_mover(p_tema bigint, p_categoria text)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not foro_es_moderador() then raise exception 'Sin permiso de moderación.'; end if;
  if not exists (select 1 from foro_categoria where slug = p_categoria) then raise exception 'Categoría no válida.'; end if;
  update foro_tema set categoria = p_categoria where id = p_tema;
  if not found then raise exception 'No se encontró la consulta.'; end if;
  insert into foro_accion (moderador, accion, tipo, objeto) values (auth.uid(), 'mover', 'tema', p_tema || ' a ' || p_categoria);
end $$;

revoke all on function foro_moderar(text, bigint, text), foro_borrar(text, bigint),
  foro_confianza(text, boolean), foro_mover(bigint, text) from public, anon;
grant execute on function foro_moderar(text, bigint, text), foro_borrar(text, bigint),
  foro_confianza(text, boolean), foro_mover(bigint, text) to authenticated;
