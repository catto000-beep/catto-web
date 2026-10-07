-- ============================================================
-- Foro catto.ar · Paso 6: videos en las consultas
-- Ejecutar en Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se puede correr más de una vez. No toca nada del Aula.
--
-- · El bucket "foro" acepta además videos MP4, WebM y MOV (los del
--   celular). El tope por archivo pasa de 2 MB a 20 MB; las imágenes
--   siguen llegando reducidas por la página, así que no cambian.
-- · La página limita los videos a 60 segundos. Para algo más largo se
--   pega un enlace de YouTube, que no ocupa espacio en Supabase.
-- · No hace falta tocar la moderación: toda consulta con un archivo o un
--   video insertado (la marca ![…](…)) ya queda pendiente de revisión,
--   y al editarla vuelve a revisión si se agrega uno nuevo.
-- · El límite de 10 archivos por hora por usuario sigue igual y cuenta
--   imágenes y videos juntos.
-- ============================================================

update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']
where id = 'foro';

-- Comprobación: tiene que mostrar 20971520 y los seis tipos
select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'foro';
