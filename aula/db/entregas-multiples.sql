-- ============================================================
-- Aula Catto — Varios archivos por entrega
-- Ejecutar en Supabase → SQL Editor → pegar TODO → Run. Idempotente.
-- ============================================================

-- Nueva lista de archivos de la entrega [{path, nombre}, ...]
alter table entrega add column if not exists archivos jsonb not null default '[]'::jsonb;

-- Migrar el archivo único anterior al nuevo formato de lista
update entrega
  set archivos = jsonb_build_array(jsonb_build_object('path', archivo_path, 'nombre', 'archivo'))
  where archivo_path is not null
    and (archivos is null or archivos = '[]'::jsonb);
