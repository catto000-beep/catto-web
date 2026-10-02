-- ============================================================
-- Foro catto.ar · Paso 3: convertir una cuenta en moderadora
-- Antes: ingresar al foro con esa cuenta y completar el perfil.
-- Cambiar el alias de abajo por el elegido y ejecutar en SQL Editor.
-- ============================================================
update foro_perfil set rol = 'moderador', confiable = true
where alias = 'diego';

-- Para comprobarlo:
select alias, curso, rol from foro_perfil where rol = 'moderador';
