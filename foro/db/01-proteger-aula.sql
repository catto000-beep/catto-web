-- ============================================================
-- Foro catto.ar · Paso 1: proteger el Aula ANTES de abrir el foro
-- Ejecutar en Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se puede correr más de una vez.
--
-- Por qué: el foro abre el registro al público en el mismo proyecto.
-- Varias reglas del Aula solo pedían "estar autenticado", así que una
-- cuenta del foro habría podido leer las fotos de perfil de los
-- estudiantes y las consignas. Ahora exigen ser miembro del Aula
-- (tener fila en la tabla perfil). Para profesores y estudiantes del
-- Aula no cambia nada.
-- ============================================================

create or replace function es_miembro_aula()
returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists(select 1 from perfil where id = auth.uid());
$$;

-- curso y materia: solo miembros del Aula
drop policy if exists curso_sel on curso;
create policy curso_sel on curso for select using (es_miembro_aula());

drop policy if exists materia_sel on materia;
create policy materia_sel on materia for select using (es_miembro_aula());

-- fotos de perfil: cada miembro la suya; solo miembros las ven
drop policy if exists fotos_write on storage.objects;
drop policy if exists fotos_upd   on storage.objects;
drop policy if exists fotos_read  on storage.objects;
create policy fotos_write on storage.objects for insert
  with check (bucket_id='fotos-perfil' and es_miembro_aula() and (storage.foldername(name))[1] = auth.uid()::text);
create policy fotos_upd on storage.objects for update
  using (bucket_id='fotos-perfil' and es_miembro_aula() and (storage.foldername(name))[1] = auth.uid()::text);
create policy fotos_read on storage.objects for select
  using (bucket_id='fotos-perfil' and es_miembro_aula());

-- entregas: solo miembros suben a su carpeta
drop policy if exists entregas_write on storage.objects;
drop policy if exists entregas_upd   on storage.objects;
create policy entregas_write on storage.objects for insert
  with check (bucket_id='entregas' and es_miembro_aula() and (storage.foldername(name))[1] = auth.uid()::text);
create policy entregas_upd on storage.objects for update
  using (bucket_id='entregas' and es_miembro_aula() and (storage.foldername(name))[1] = auth.uid()::text);

-- consignas: solo miembros las leen
drop policy if exists consignas_read on storage.objects;
create policy consignas_read on storage.objects for select
  using (bucket_id='consignas' and es_miembro_aula());
