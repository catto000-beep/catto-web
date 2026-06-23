-- ============================================================
-- Aula Catto — Etapa C: adjuntos, video y políticas de Storage
-- Ejecutar en Supabase → SQL Editor → pegar TODO → Run. Idempotente.
-- ============================================================

-- 1) Campo para el video de referencia (YouTube) en cada actividad
alter table actividad add column if not exists video_url text;

-- 2) POLÍTICAS DE STORAGE
--    Convención de carpetas: el primer nivel del path es el uid del dueño.
--      fotos-perfil/{uid}/...   · entregas/{uid}/...
--    consignas/...              · las sube el profesor (cualquier path).

-- ---- fotos-perfil: cada uno gestiona la suya; cualquiera autenticado la ve ----
drop policy if exists fotos_write on storage.objects;
drop policy if exists fotos_upd   on storage.objects;
drop policy if exists fotos_read  on storage.objects;
create policy fotos_write on storage.objects for insert
  with check (bucket_id='fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text);
create policy fotos_upd on storage.objects for update
  using (bucket_id='fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text);
create policy fotos_read on storage.objects for select
  using (bucket_id='fotos-perfil' and auth.uid() is not null);

-- ---- entregas: el estudiante gestiona las suyas; el profesor las lee todas ----
drop policy if exists entregas_write on storage.objects;
drop policy if exists entregas_upd   on storage.objects;
drop policy if exists entregas_read  on storage.objects;
create policy entregas_write on storage.objects for insert
  with check (bucket_id='entregas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy entregas_upd on storage.objects for update
  using (bucket_id='entregas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy entregas_read on storage.objects for select
  using (bucket_id='entregas' and ((storage.foldername(name))[1] = auth.uid()::text or es_profesor()));

-- ---- consignas: las sube el profesor; cualquiera autenticado las lee ----
drop policy if exists consignas_write on storage.objects;
drop policy if exists consignas_upd   on storage.objects;
drop policy if exists consignas_read  on storage.objects;
create policy consignas_write on storage.objects for insert
  with check (bucket_id='consignas' and es_profesor());
create policy consignas_upd on storage.objects for update
  using (bucket_id='consignas' and es_profesor());
create policy consignas_read on storage.objects for select
  using (bucket_id='consignas' and auth.uid() is not null);
