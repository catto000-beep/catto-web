-- ============================================================
-- Aula Catto — Re-entrega: limpieza de archivos en Storage
-- OPCIONAL. La re-entrega funciona sin esto; lo único que cambia es que,
-- al reemplazar o quitar un archivo, el viejo queda ocupando lugar en el
-- bucket "entregas" (invisible para todos, pero suma espacio).
-- Con esta política el archivo se borra de verdad.
-- Ejecutar en Supabase → SQL Editor → pegar TODO → Run. Idempotente.
-- ============================================================

-- El estudiante puede borrar archivos de SU carpeta (entregas/{uid}/...);
-- el profesor puede borrar cualquiera.
drop policy if exists entregas_del on storage.objects;
create policy entregas_del on storage.objects for delete
  using (bucket_id='entregas' and ((storage.foldername(name))[1] = auth.uid()::text or es_profesor()));
