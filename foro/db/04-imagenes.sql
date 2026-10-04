-- ============================================================
-- Foro catto.ar · Paso 4: imágenes en las consultas
-- Ejecutar en Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se puede correr más de una vez. No toca nada del Aula.
--
-- · Bucket "foro" de lectura pública (las imágenes se ven por su URL).
--   Máximo 2 MB por archivo, solo JPEG, PNG o WebP. La página ya las
--   reduce a 1600 px antes de subirlas, así que suelen pesar mucho menos.
-- · Cada usuario sube solo a su carpeta (foro/{su id}/...), si tiene perfil
--   y no está suspendido, y como máximo 10 imágenes por hora.
-- · Toda consulta o respuesta con imagen queda pendiente de moderación,
--   aunque la cuenta ya sea de confianza (resguardo para menores).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foro', 'foro', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists foro_img_ins on storage.objects;
drop policy if exists foro_img_del on storage.objects;
drop policy if exists foro_img_sel on storage.objects;
-- cada uno puede listar su carpeta (para borrar sus imágenes al borrar la cuenta)
create policy foro_img_sel on storage.objects for select to authenticated
  using (bucket_id = 'foro' and ((storage.foldername(name))[1] = auth.uid()::text or public.foro_es_moderador()));
create policy foro_img_ins on storage.objects for insert to authenticated
  with check (
    bucket_id = 'foro'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.foro_perfil where id = auth.uid() and not bloqueado)
    and (select count(*) from storage.objects o
         where o.bucket_id = 'foro' and o.owner = auth.uid() and o.created_at > now() - interval '1 hour') < 10
  );
create policy foro_img_del on storage.objects for delete to authenticated
  using (bucket_id = 'foro' and ((storage.foldername(name))[1] = auth.uid()::text or public.foro_es_moderador()));

-- Publicación: igual que antes, pero con imagen siempre va a revisión
create or replace function foro_antes_publicar()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare p foro_perfil; n int;
begin
  select * into p from foro_perfil where id = auth.uid();
  if p.id is null then raise exception 'Hace falta completar el perfil antes de publicar.'; end if;
  if p.bloqueado then raise exception 'La cuenta está suspendida para publicar.'; end if;
  new.autor  := p.id;
  new.creado := now();
  new.estado := case when p.confiable or p.rol = 'moderador' then 'publicado' else 'pendiente' end;
  if p.rol <> 'moderador' and new.cuerpo ~ '!\[[^]]*\]\(' then new.estado := 'pendiente'; end if;
  if tg_table_name = 'foro_tema' then
    select count(*) into n from foro_tema where autor = p.id and creado > now() - interval '1 hour';
    if n >= 5 and p.rol <> 'moderador' then raise exception 'Se alcanzó el límite de 5 consultas por hora.'; end if;
    new.resuelto := false; new.respuestas := 0; new.actividad := now();
  else
    select count(*) into n from foro_respuesta where autor = p.id and creado > now() - interval '1 hour';
    if n >= 20 and p.rol <> 'moderador' then raise exception 'Se alcanzó el límite de 20 respuestas por hora.'; end if;
    if not exists(select 1 from foro_tema where id = new.tema_id and estado = 'publicado') then
      raise exception 'Ese tema no está disponible para responder.';
    end if;
  end if;
  return new;
end $$;
