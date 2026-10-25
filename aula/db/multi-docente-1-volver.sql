-- ============================================================
-- Aula Catto — Varios docentes, etapa 1: VUELTA ATRÁS
-- Solo si multi-docente-1.sql dio problemas. Supabase → SQL Editor → Run.
--
-- Restituye las reglas de acceso y funciones como estaban antes
-- (schema.sql + etapa-c.sql + reentrega.sql + foro/db/01-proteger-aula.sql).
-- No borra las tablas ni las columnas nuevas (escuela, materia_docente,
-- admin, estado…): sin reglas que las usen, no afectan en nada, y así no se
-- pierde lo que se haya cargado en ellas.
--
-- Lo único que se deja puesto a propósito es el trigger proteger_perfil:
-- cierra el agujero por el que un estudiante podía cambiarse el rol.
-- ============================================================
begin;

-- funciones como antes
create or replace function es_profesor() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists(select 1 from perfil where id = auth.uid() and rol = 'profesor');
$$;
create or replace function es_miembro_aula() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists(select 1 from perfil where id = auth.uid());
$$;

-- automatismos nuevos, fuera (salvo proteger_perfil)
drop trigger if exists trg_al_crear_escuela       on escuela;
drop trigger if exists trg_al_crear_curso         on curso;
drop trigger if exists trg_al_crear_materia       on materia;
drop trigger if exists trg_al_crear_materia_autor on materia;

-- perfil
drop policy if exists perfil_sel      on perfil;
drop policy if exists perfil_upd_self on perfil;
drop policy if exists perfil_upd_prof on perfil;
drop policy if exists perfil_admin    on perfil;
drop policy if exists perfil_prof     on perfil;
create policy perfil_sel      on perfil for select using (id = auth.uid() or es_profesor());
create policy perfil_upd_self on perfil for update using (id = auth.uid());
create policy perfil_prof     on perfil for all    using (es_profesor()) with check (es_profesor());

-- escuela y materia_docente: sin reglas (RLS activo = nadie las lee desde el navegador)
drop policy if exists escuela_sel   on escuela;
drop policy if exists escuela_ins   on escuela;
drop policy if exists escuela_admin on escuela;
drop policy if exists md_sel   on materia_docente;
drop policy if exists md_admin on materia_docente;

-- curso
drop policy if exists curso_sel   on curso;
drop policy if exists curso_ins   on curso;
drop policy if exists curso_admin on curso;
drop policy if exists curso_prof  on curso;
create policy curso_sel  on curso for select using (es_miembro_aula());
create policy curso_prof on curso for all    using (es_profesor()) with check (es_profesor());

-- materia
drop policy if exists materia_sel   on materia;
drop policy if exists materia_ins   on materia;
drop policy if exists materia_upd   on materia;
drop policy if exists materia_del   on materia;
drop policy if exists materia_admin on materia;
drop policy if exists materia_prof  on materia;
create policy materia_sel  on materia for select using (es_miembro_aula());
create policy materia_prof on materia for all    using (es_profesor()) with check (es_profesor());

-- actividad
drop policy if exists actividad_sel  on actividad;
drop policy if exists actividad_prof on actividad;
create policy actividad_sel on actividad for select using (
  es_profesor() or materia_id in (
    select m.id from materia m join perfil p on p.curso_id = m.curso_id where p.id = auth.uid()
  )
);
create policy actividad_prof on actividad for all using (es_profesor()) with check (es_profesor());

-- entrega
drop policy if exists entrega_sel      on entrega;
drop policy if exists entrega_ins      on entrega;
drop policy if exists entrega_upd_self on entrega;
drop policy if exists entrega_prof     on entrega;
create policy entrega_sel      on entrega for select using (estudiante_id = auth.uid() or es_profesor());
create policy entrega_ins      on entrega for insert with check (estudiante_id = auth.uid());
create policy entrega_upd_self on entrega for update using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());
create policy entrega_prof     on entrega for all    using (es_profesor()) with check (es_profesor());

-- storage
drop policy if exists entregas_read on storage.objects;
drop policy if exists entregas_del  on storage.objects;
drop policy if exists fotos_read    on storage.objects;
create policy entregas_read on storage.objects for select
  using (bucket_id='entregas' and ((storage.foldername(name))[1] = auth.uid()::text or es_profesor()));
create policy entregas_del on storage.objects for delete
  using (bucket_id='entregas' and ((storage.foldername(name))[1] = auth.uid()::text or es_profesor()));
create policy fotos_read on storage.objects for select
  using (bucket_id='fotos-perfil' and es_miembro_aula());

commit;
select 'Reglas restituidas como antes de la etapa 1' as resultado;
