-- ============================================================
-- Aula Catto — Agregar OTRO profesor (autoservicio, sin ayuda externa)
-- ============================================================
-- Paso 1) Supabase → Authentication → Users → Add user
--         Email:    nombreprofe@aula.catto.ar   (o su email real)
--         Password: la que le vayas a entregar
--         ✅ Activá "Auto Confirm User"
--         Create user
--
-- Paso 2) SQL Editor → New query → pegá esto (cambiá email, nombre,
--         apellido y usuario) → Run.
-- ============================================================
insert into perfil (id, rol, nombre, apellido, usuario)
select u.id, 'profesor', 'NombreDelProfe', 'ApellidoDelProfe', 'apellido.nombre'
from auth.users u
where u.email = 'nombreprofe@aula.catto.ar'
on conflict (id) do update set rol = 'profesor';

-- El nuevo profesor entra en catto.ar/aula con su usuario y contraseña.
-- El login lo lleva solo a su panel de profesor.

-- ⚠️ IMPORTANTE (leer): con el diseño ACTUAL, TODOS los profesores ven y
-- editan TODO — cursos, materias, actividades, estudiantes y notas de
-- cualquiera. No hay separación por profesor. Sirve para un colega de
-- confianza que co-gestiona todo. Si querés que cada profe vea SOLO lo
-- suyo, eso es una función aparte que hay que construir (ownership + RLS).
