-- ============================================================
-- Aula Catto — Varios adjuntos por actividad
-- Ejecutar en Supabase → SQL Editor → pegar TODO → Run. Idempotente.
-- ============================================================

-- Nuevo campo: lista de adjuntos [{path, nombre}, ...]
alter table actividad add column if not exists adjuntos jsonb not null default '[]'::jsonb;

-- Migrar el adjunto único anterior (si lo había) al nuevo formato de lista
update actividad
  set adjuntos = jsonb_build_array(jsonb_build_object('path', archivo_consigna_path, 'nombre', 'Material adjunto'))
  where archivo_consigna_path is not null
    and (adjuntos is null or adjuntos = '[]'::jsonb);
