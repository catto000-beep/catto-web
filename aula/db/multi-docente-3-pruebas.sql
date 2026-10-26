-- ============================================================
-- Aula Catto — Varios docentes, etapa 3: pruebas de los adjuntos por materia
-- Correr DESPUÉS de multi-docente-3.sql. Todo dentro de una transacción que
-- se deshace al final: NO deja nada (ni en las tablas ni en Storage).
-- Termina mostrando «TODAS LAS PRUEBAS PASARON» o se detiene en «FALLÓ: …».
--
-- Escenario: curso C1 con M1 (profe A) y M2 (profe B); curso C2 con M3 (profe B).
-- Alumno 1 en C1, alumno 2 en C2.
-- ============================================================
begin;

-- La regla foro_img_ins (tope de imágenes del foro) consulta storage.objects desde una regla de
-- storage.objects: insertando por SQL, PostgreSQL lo toma como recursión infinita. Las subidas
-- reales (por el servicio de Storage) no pasan por ahí. Se quita solo dentro de esta transacción:
-- el rollback del final la restituye.
drop policy if exists foro_img_ins on storage.objects;

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-4000-c000-0000000000a1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba3.profa@aula.catto.ar'),
  ('00000000-0000-4000-c000-0000000000b1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba3.profb@aula.catto.ar'),
  ('00000000-0000-4000-c000-0000000000d1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba3.alu1@aula.catto.ar'),
  ('00000000-0000-4000-c000-0000000000d2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba3.alu2@aula.catto.ar');
insert into escuela (nombre, codigo, estado) values ('Escuela de prueba 3', 'zzprueba3', 'aprobada');
insert into curso (nombre, anio, escuela_id, estado) select 'ZZ3 C1', 2026, id, 'aprobado' from escuela where codigo = 'zzprueba3';
insert into curso (nombre, anio, escuela_id, estado) select 'ZZ3 C2', 2026, id, 'aprobado' from escuela where codigo = 'zzprueba3';
insert into perfil (id, rol, estado, nombre, apellido, usuario, curso_id) values
  ('00000000-0000-4000-c000-0000000000a1','profesor','aprobado','A','Profe','zz3.profa',null),
  ('00000000-0000-4000-c000-0000000000b1','profesor','aprobado','B','Profe','zz3.profb',null),
  ('00000000-0000-4000-c000-0000000000d1','estudiante','aprobado','Uno','Alumno','zz3.alu1',(select id from curso where nombre='ZZ3 C1')),
  ('00000000-0000-4000-c000-0000000000d2','estudiante','aprobado','Dos','Alumno','zz3.alu2',(select id from curso where nombre='ZZ3 C2'));
insert into materia (curso_id, nombre) select id, 'ZZ3 M1' from curso where nombre = 'ZZ3 C1';
insert into materia (curso_id, nombre) select id, 'ZZ3 M2' from curso where nombre = 'ZZ3 C1';
insert into materia (curso_id, nombre) select id, 'ZZ3 M3' from curso where nombre = 'ZZ3 C2';
insert into materia_docente (materia_id, profesor_id) values
  ((select id from materia where nombre='ZZ3 M1'), '00000000-0000-4000-c000-0000000000a1'),
  ((select id from materia where nombre='ZZ3 M2'), '00000000-0000-4000-c000-0000000000b1'),
  ((select id from materia where nombre='ZZ3 M3'), '00000000-0000-4000-c000-0000000000b1');
select set_config('prueba.m1', 'm' || (select id from materia where nombre = 'ZZ3 M1'), true);
select set_config('prueba.m2', 'm' || (select id from materia where nombre = 'ZZ3 M2'), true);
select set_config('prueba.m3', 'm' || (select id from materia where nombre = 'ZZ3 M3'), true);

-- ---------- profe A sube a M1, no a M2 ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000a1","role":"authenticated"}', true);
insert into storage.objects (bucket_id, name, owner) values ('consignas', current_setting('prueba.m1') || '/zz3-guia.pdf', auth.uid());
do $$ begin
  begin
    insert into storage.objects (bucket_id, name, owner) values ('consignas', current_setting('prueba.m2') || '/zz3-intruso.pdf', auth.uid());
    raise exception 'FALLÓ: el profe A subió un adjunto a la materia del profe B';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('consignas', 'zz3-raiz.pdf', auth.uid());
    raise exception 'FALLÓ: un profesor subió un adjunto a la raíz del bucket';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
-- profe B sube a M3 (para la prueba del alumno 2)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000b1","role":"authenticated"}', true);
insert into storage.objects (bucket_id, name, owner) values ('consignas', current_setting('prueba.m3') || '/zz3-tp.pdf', auth.uid());
do $$ begin
  if exists (select 1 from storage.objects where bucket_id = 'consignas' and name like current_setting('prueba.m1') || '/%') then
    raise exception 'FALLÓ: el profe B ve los adjuntos de M1 (de A)'; end if;
end $$;
reset role;

-- ---------- alumnos ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000d1","role":"authenticated"}', true);
do $$ begin
  if not exists (select 1 from storage.objects where bucket_id = 'consignas' and name = current_setting('prueba.m1') || '/zz3-guia.pdf') then
    raise exception 'FALLÓ: el alumno 1 no ve el adjunto de una materia de su curso'; end if;
  if exists (select 1 from storage.objects where bucket_id = 'consignas' and name like current_setting('prueba.m3') || '/%') then
    raise exception 'FALLÓ: el alumno 1 ve adjuntos de otro curso'; end if;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('consignas', current_setting('prueba.m1') || '/zz3-alumno.pdf', auth.uid());
    raise exception 'FALLÓ: un alumno subió un adjunto a una consigna';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-c000-0000000000d2","role":"authenticated"}', true);
do $$ begin
  if exists (select 1 from storage.objects where bucket_id = 'consignas' and name like current_setting('prueba.m1') || '/%') then
    raise exception 'FALLÓ: el alumno 2 ve adjuntos de C1'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'consignas' and name like current_setting('prueba.m3') || '/%') then
    raise exception 'FALLÓ: el alumno 2 no ve el adjunto de su curso'; end if;
end $$;
reset role;

-- ---------- admin ve todo ----------
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from perfil where usuario = 'diego'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ begin
  if (select count(*) from storage.objects where bucket_id = 'consignas' and name like '%zz3-%') <> 2 then
    raise exception 'FALLÓ: el admin tiene que ver los 2 adjuntos de prueba'; end if;
end $$;
reset role;

rollback;
select 'TODAS LAS PRUEBAS PASARON' as resultado;
