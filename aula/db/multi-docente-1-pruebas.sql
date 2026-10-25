-- ============================================================
-- Aula Catto — Varios docentes, etapa 1: pruebas de aislamiento
-- Correr DESPUÉS de multi-docente-1.sql, en Supabase → SQL Editor.
--
-- Crea usuarios y datos ficticios, se hace pasar por cada uno y comprueba
-- qué puede ver y hacer. Todo va dentro de una transacción que se deshace
-- al final: NO deja nada en la base.
-- Si una prueba falla, se detiene con el mensaje «FALLÓ: …».
-- Si todo está bien, termina mostrando «TODAS LAS PRUEBAS PASARON».
--
-- Escenario:
--   Escuela de prueba, cursos C1 y C2.
--   Profe A da M1 en C1.  Profe B da M2 en C1 (mismo curso) y M3 en C2.
--   Profe P está pendiente. Alumno 1 en C1, alumno 2 en C2.
--   Una cuenta del foro sin perfil del Aula.
-- ============================================================
begin;

-- ---------- usuarios ficticios ----------
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-4000-a000-0000000000a1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba.profa@aula.catto.ar'),
  ('00000000-0000-4000-a000-0000000000b1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba.profb@aula.catto.ar'),
  ('00000000-0000-4000-a000-0000000000c1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba.profp@aula.catto.ar'),
  ('00000000-0000-4000-a000-0000000000d1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba.alu1@aula.catto.ar'),
  ('00000000-0000-4000-a000-0000000000d2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba.alu2@aula.catto.ar'),
  ('00000000-0000-4000-a000-0000000000e1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba.foro@aula.catto.ar');

insert into escuela (nombre, codigo, estado) values ('Escuela de prueba', 'zzprueba', 'aprobada');
insert into curso (nombre, anio, escuela_id, estado)
  select 'ZZ C1', 2026, id, 'aprobado' from escuela where codigo = 'zzprueba';
insert into curso (nombre, anio, escuela_id, estado)
  select 'ZZ C2', 2026, id, 'aprobado' from escuela where codigo = 'zzprueba';

insert into perfil (id, rol, estado, nombre, apellido, usuario, curso_id) values
  ('00000000-0000-4000-a000-0000000000a1','profesor','aprobado','A','Profe','zz.profa',null),
  ('00000000-0000-4000-a000-0000000000b1','profesor','aprobado','B','Profe','zz.profb',null),
  ('00000000-0000-4000-a000-0000000000c1','profesor','pendiente','P','Profe','zz.profp',null),
  ('00000000-0000-4000-a000-0000000000d1','estudiante','aprobado','Uno','Alumno','zz.alu1',(select id from curso where nombre='ZZ C1')),
  ('00000000-0000-4000-a000-0000000000d2','estudiante','aprobado','Dos','Alumno','zz.alu2',(select id from curso where nombre='ZZ C2'));

insert into materia (curso_id, nombre) select id, 'ZZ M1' from curso where nombre = 'ZZ C1';
insert into materia (curso_id, nombre) select id, 'ZZ M2' from curso where nombre = 'ZZ C1';
insert into materia (curso_id, nombre) select id, 'ZZ M3' from curso where nombre = 'ZZ C2';
insert into materia_docente (materia_id, profesor_id) values
  ((select id from materia where nombre='ZZ M1'), '00000000-0000-4000-a000-0000000000a1'),
  ((select id from materia where nombre='ZZ M2'), '00000000-0000-4000-a000-0000000000b1'),
  ((select id from materia where nombre='ZZ M3'), '00000000-0000-4000-a000-0000000000b1');

insert into actividad (materia_id, titulo) select id, 'ZZ act1' from materia where nombre = 'ZZ M1';
insert into actividad (materia_id, titulo) select id, 'ZZ act2' from materia where nombre = 'ZZ M2';
insert into actividad (materia_id, titulo) select id, 'ZZ act3' from materia where nombre = 'ZZ M3';
insert into entrega (actividad_id, estudiante_id, nota_num) values
  ((select id from actividad where titulo='ZZ act1'), '00000000-0000-4000-a000-0000000000d1', 8),
  ((select id from actividad where titulo='ZZ act2'), '00000000-0000-4000-a000-0000000000d1', 6),
  ((select id from actividad where titulo='ZZ act3'), '00000000-0000-4000-a000-0000000000d2', 9);

-- =========================================================
-- PROFE A (M1 en C1)
-- =========================================================
-- ids anotados antes de cambiar de rol (el profe A no ve lo de M2: buscarlo como él no probaría nada)
select set_config('prueba.act2', (select id from actividad where titulo = 'ZZ act2')::text, true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000a1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from actividad) <> 1 then raise exception 'FALLÓ: el profe A tiene que ver solo su actividad (ve %)', (select count(*) from actividad); end if;
  if (select count(*) from entrega) <> 1 then raise exception 'FALLÓ: el profe A tiene que ver solo la entrega de su materia, no la de M2 del mismo curso (ve %)', (select count(*) from entrega); end if;
  if (select count(*) from perfil where rol='estudiante') <> 1 then raise exception 'FALLÓ: el profe A tiene que ver solo al alumno de C1'; end if;
  if exists (select 1 from perfil where usuario='zz.alu2') then raise exception 'FALLÓ: el profe A ve a un alumno de C2'; end if;
  if (select count(*) from materia where nombre like 'ZZ %') <> 3 then raise exception 'FALLÓ: el profe A tiene que ver los nombres de todas las materias (para el menú)'; end if;
  if es_admin() then raise exception 'FALLÓ: el profe A no es admin'; end if;
end $$;
-- no puede calificar ni tocar lo de M2
update entrega set nota_num = 1 where actividad_id = current_setting('prueba.act2')::bigint;
update actividad set titulo = 'pisado' where id = current_setting('prueba.act2')::bigint;
do $$ begin
  if exists (select 1 from actividad where id = current_setting('prueba.act2')::bigint) then
    raise exception 'FALLÓ: el profe A ve la actividad de M2'; end if;
end $$;
-- no puede crear actividades en la materia del profe B
do $$ begin
  begin
    insert into actividad (materia_id, titulo) select id, 'intruso' from materia where nombre = 'ZZ M2';
    raise exception 'FALLÓ: el profe A pudo crear una actividad en M2';
  exception when insufficient_privilege then null;
  end;
  -- no puede pasar a su alumno a un curso donde no da clase
  begin
    update perfil set curso_id = (select id from curso where nombre='ZZ C2') where usuario = 'zz.alu1';
    raise exception 'FALLÓ: el profe A pudo mover a su alumno a C2';
  exception when raise_exception then
    if sqlerrm like 'FALLÓ%' then raise; end if;
  end;
end $$;
-- puede crear una materia nueva en un curso aprobado y queda como su docente
insert into materia (curso_id, nombre) select id, 'ZZ M4 de A' from curso where nombre = 'ZZ C2';
do $$ begin
  if not exists (select 1 from materia_docente d join materia m on m.id = d.materia_id
                 where m.nombre = 'ZZ M4 de A' and d.profesor_id = auth.uid()) then
    raise exception 'FALLÓ: al crear una materia, el profe A no quedó como su docente';
  end if;
end $$;
reset role;
do $$ begin
  if (select nota_num from entrega where actividad_id = (select id from actividad where titulo='ZZ act2')) <> 6 then
    raise exception 'FALLÓ: el profe A cambió la nota de una entrega de M2'; end if;
  if not exists (select 1 from actividad where titulo = 'ZZ act2') then raise exception 'FALLÓ: el profe A editó una actividad de M2'; end if;
end $$;

-- =========================================================
-- PROFE B (M2 en C1, M3 en C2)
-- =========================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from actividad where titulo like 'ZZ act%') <> 2 then raise exception 'FALLÓ: el profe B tiene que ver act2 y act3'; end if;
  if exists (select 1 from entrega e join actividad a on a.id = e.actividad_id where a.titulo = 'ZZ act1') then
    raise exception 'FALLÓ: el profe B ve la entrega de M1 (del profe A)'; end if;
  if (select count(*) from perfil where rol='estudiante' and usuario like 'zz.%') <> 2 then raise exception 'FALLÓ: el profe B tiene que ver a los dos alumnos'; end if;
end $$;
reset role;

-- =========================================================
-- PROFE PENDIENTE
-- =========================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000c1","role":"authenticated"}', true);
do $$ begin
  if es_profesor() then raise exception 'FALLÓ: un profe pendiente cuenta como profesor'; end if;
  if (select count(*) from actividad) <> 0 then raise exception 'FALLÓ: el profe pendiente ve actividades'; end if;
  if (select count(*) from entrega) <> 0 then raise exception 'FALLÓ: el profe pendiente ve entregas'; end if;
  if (select count(*) from perfil where rol='estudiante') <> 0 then raise exception 'FALLÓ: el profe pendiente ve alumnos'; end if;
  if not exists (select 1 from escuela where codigo='zzprueba') then raise exception 'FALLÓ: el profe pendiente tiene que ver las escuelas aprobadas (menú)'; end if;
  if not exists (select 1 from curso where nombre='ZZ C1') then raise exception 'FALLÓ: el profe pendiente tiene que ver los cursos aprobados (menú)'; end if;
  begin
    insert into materia (curso_id, nombre) select id, 'intrusa' from curso where nombre = 'ZZ C1';
    raise exception 'FALLÓ: un profe pendiente pudo crear una materia';
  exception when insufficient_privilege then null;
  end;
  -- no puede aprobarse solo
  update perfil set estado = 'aprobado', admin = true where id = auth.uid();
end $$;
-- puede proponer una escuela y un curso, que nacen pendientes
insert into escuela (nombre, codigo, estado) values ('Escuela propuesta', 'zzpropuesta', 'aprobada');
insert into curso (nombre, anio, estado) values ('ZZ propuesto', 2026, 'aprobado');
reset role;
do $$ begin
  if (select estado from perfil where usuario = 'zz.profp') <> 'pendiente' then raise exception 'FALLÓ: el profe pendiente se aprobó solo'; end if;
  if (select admin from perfil where usuario = 'zz.profp') then raise exception 'FALLÓ: el profe pendiente se hizo admin'; end if;
  if (select estado from escuela where codigo = 'zzpropuesta') <> 'pendiente' then raise exception 'FALLÓ: la escuela propuesta no quedó pendiente'; end if;
  if (select estado from curso where nombre = 'ZZ propuesto') <> 'pendiente' then raise exception 'FALLÓ: el curso propuesto no quedó pendiente'; end if;
end $$;

-- =========================================================
-- ALUMNO 1 (C1)
-- =========================================================
-- el id de act3 se anota antes de cambiar de rol: como alumno de C1 no la ve, y un
-- «insert … select … where titulo='ZZ act3'» no insertaría nada sin dar error
select set_config('prueba.act3', (select id from actividad where titulo = 'ZZ act3')::text, true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000d1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from actividad) <> 2 then raise exception 'FALLÓ: el alumno 1 tiene que ver las 2 actividades de su curso (ve %)', (select count(*) from actividad); end if;
  if (select count(*) from entrega) <> 2 then raise exception 'FALLÓ: el alumno 1 tiene que ver solo sus 2 entregas'; end if;
  if (select count(*) from perfil) <> 1 then raise exception 'FALLÓ: el alumno 1 tiene que ver solo su perfil'; end if;
  begin
    insert into entrega (actividad_id, estudiante_id) values (current_setting('prueba.act3')::bigint, auth.uid());
    raise exception 'FALLÓ: el alumno 1 entregó en una actividad de otro curso';
  exception when insufficient_privilege then null;
  end;
  -- el agujero de hoy: cambiarse el rol a profesor
  update perfil set rol = 'profesor', admin = true, estado = 'aprobado' where id = auth.uid();
  update perfil set curso_id = (select id from curso where nombre = 'ZZ C2') where id = auth.uid();
  -- ponerse nota
  update entrega set nota_num = 10, estado = 'calificado' where estudiante_id = auth.uid();
end $$;
reset role;
do $$ begin
  if (select rol from perfil where usuario = 'zz.alu1') <> 'estudiante' then raise exception 'FALLÓ: el alumno 1 se cambió el rol'; end if;
  if (select admin from perfil where usuario = 'zz.alu1') then raise exception 'FALLÓ: el alumno 1 se hizo admin'; end if;
  if (select c.nombre from perfil p join curso c on c.id = p.curso_id where p.usuario = 'zz.alu1') <> 'ZZ C1' then
    raise exception 'FALLÓ: el alumno 1 se cambió de curso'; end if;
  if exists (select 1 from entrega where estudiante_id = '00000000-0000-4000-a000-0000000000d1' and nota_num = 10) then
    raise exception 'FALLÓ: el alumno 1 se puso nota'; end if;
end $$;

-- =========================================================
-- CUENTA DEL FORO (sin perfil del Aula)
-- =========================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000e1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from actividad) + (select count(*) from entrega) + (select count(*) from perfil)
     + (select count(*) from curso) + (select count(*) from materia) <> 0 then
    raise exception 'FALLÓ: una cuenta del foro ve datos del Aula'; end if;
end $$;
-- pide el alta como profesor y queda pendiente
select solicitar_alta_profesor('Foro', 'Usuario');
reset role;
do $$ begin
  if (select estado from perfil where id = '00000000-0000-4000-a000-0000000000e1') <> 'pendiente' then
    raise exception 'FALLÓ: el alta de profesor no quedó pendiente'; end if;
end $$;

-- =========================================================
-- ADMIN (Diego): sigue viendo todo
-- =========================================================
-- (el id de Diego se busca antes de cambiar de rol: como «authenticated» no se vería)
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from perfil where usuario = 'diego'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin
  if not es_admin() then raise exception 'FALLÓ: Diego no quedó como admin'; end if;
  if (select count(*) from actividad where titulo like 'ZZ act%') <> 3 then raise exception 'FALLÓ: el admin no ve todas las actividades'; end if;
  if (select count(*) from entrega e join actividad a on a.id = e.actividad_id where a.titulo like 'ZZ act%') <> 3 then
    raise exception 'FALLÓ: el admin no ve todas las entregas'; end if;
  if (select count(*) from perfil where usuario like 'zz.%') <> 5 then raise exception 'FALLÓ: el admin no ve todos los perfiles'; end if;
end $$;
reset role;

rollback;   -- deshace TODO lo de arriba: usuarios, escuela, cursos, notas de prueba

select 'TODAS LAS PRUEBAS PASARON' as resultado;
