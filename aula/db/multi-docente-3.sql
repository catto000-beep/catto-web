-- ============================================================
-- Aula Catto — Varios docentes, etapa 3: adjuntos de las consignas por materia
-- Diseño: docs/aula-multi-docente.md. Requiere las etapas 1 y 2.
--
-- Hasta ahora cualquier miembro del Aula podía leer (y listar) todos los
-- adjuntos de las consignas, de cualquier escuela. Desde esta etapa el
-- panel los guarda en consignas/m{id de la materia}/…, y:
--   · los suben y cambian los docentes de esa materia (y el admin);
--   · los leen sus docentes, los estudiantes del curso de esa materia y el admin.
-- Los adjuntos viejos, guardados en la raíz del bucket (todos de Diego),
-- se siguen leyendo como antes, para no romper ninguna actividad.
-- Va en una transacción. Se puede correr más de una vez.
-- ============================================================
begin;

create or replace function materias_de_mi_curso() returns setof bigint
language sql security definer stable set search_path = public, pg_temp as $$
  select m.id from materia m where m.curso_id = mi_curso();
$$;

drop policy if exists consignas_write on storage.objects;
drop policy if exists consignas_upd   on storage.objects;
drop policy if exists consignas_read  on storage.objects;

create policy consignas_write on storage.objects for insert with check (
  bucket_id = 'consignas' and (
    es_admin()
    or (es_profesor() and (storage.foldername(name))[1] in (select 'm' || x from mis_materias() x))
  )
);
create policy consignas_upd on storage.objects for update using (
  bucket_id = 'consignas' and (
    es_admin()
    or (es_profesor() and (storage.foldername(name))[1] in (select 'm' || x from mis_materias() x))
  )
);
create policy consignas_read on storage.objects for select using (
  bucket_id = 'consignas' and es_miembro_aula() and (
    es_admin()
    or (storage.foldername(name))[1] is null                                         -- adjuntos viejos, en la raíz
    or (storage.foldername(name))[1] in (select 'm' || x from mis_materias() x)
    or (storage.foldername(name))[1] in (select 'm' || x from materias_de_mi_curso() x)
  )
);

commit;
select policyname, cmd from pg_policies where schemaname = 'storage' and policyname like 'consignas%' order by 1;
