-- ============================================================
-- Crear un ESTUDIANTE DE PRUEBA (para testear el flujo completo)
-- Pasos previos:
--   1) Supabase → Authentication → Users → Add user
--      Email: alumno.demo@aula.catto.ar
--      Password: la que quieras (anotala para el login)
--      ✅ Activá "Auto Confirm User"
--   2) Pegá esto en SQL Editor y Run.
--      (Lo asigna al curso "6° A" — el mismo donde tenés que tener actividades
--       para que las vea. Si usás otro curso, cambialo abajo.)
-- ============================================================
insert into perfil (id, rol, nombre, apellido, usuario, curso_id)
select u.id, 'estudiante', 'Alumno', 'Demo', 'alumno.demo',
       (select id from curso where nombre = '6° A' limit 1)
from auth.users u
where u.email = 'alumno.demo@aula.catto.ar'
on conflict (id) do update
  set rol='estudiante',
      curso_id = excluded.curso_id;
