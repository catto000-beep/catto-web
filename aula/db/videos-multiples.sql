-- ============================================================
-- Aula Catto — Varios videos de referencia por actividad
-- Ejecutar en Supabase → SQL Editor → pegar TODO → Run. Idempotente.
-- ============================================================

-- Nueva lista de videos (URLs de YouTube)
alter table actividad add column if not exists videos jsonb not null default '[]'::jsonb;

-- Migrar el video único anterior al nuevo formato de lista
update actividad
  set videos = jsonb_build_array(video_url)
  where video_url is not null and video_url <> ''
    and (videos is null or videos = '[]'::jsonb);
