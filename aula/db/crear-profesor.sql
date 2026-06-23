-- ============================================================
-- Convertir tu usuario en PROFESOR (correr después de crear el usuario en Auth)
-- Pasos previos:
--   1) Supabase → Authentication → Users → Add user
--      Email: diego@aula.catto.ar   (o el que prefieras)
--      Password: la que quieras
--      ✅ Activá "Auto Confirm User"
--   2) Pegá esto en SQL Editor y cambiá el email si usaste otro. Run.
-- ============================================================
insert into perfil (id, rol, nombre, apellido, usuario)
select id, 'profesor', 'Diego', 'Scattaneo', 'diego'
from auth.users
where email = 'diego@aula.catto.ar'
on conflict (id) do update set rol = 'profesor';
