-- ============================================================
-- Aula Catto — Varios docentes, etapa 2: pruebas de pedidos y aprobación
-- Correr DESPUÉS de multi-docente-2.sql. Todo dentro de una transacción
-- que se deshace al final: NO deja nada en la base.
-- Termina mostrando «TODAS LAS PRUEBAS PASARON» o se detiene en «FALLÓ: …».
--
-- Escenario: escuela de prueba con un curso y una materia M del profe B.
-- P y Q piden el alta (pendientes). Una cuenta del foro sin perfil.
-- ============================================================
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-4000-b000-0000000000b1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba2.profb@aula.catto.ar'),
  ('00000000-0000-4000-b000-0000000000c1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba2.profp@aula.catto.ar'),
  ('00000000-0000-4000-b000-0000000000c2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba2.profq@aula.catto.ar'),
  ('00000000-0000-4000-b000-0000000000e1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prueba2.foro@aula.catto.ar');

insert into escuela (nombre, codigo, estado) values ('Escuela de prueba 2', 'zzprueba2', 'aprobada');
insert into escuela (nombre, codigo, estado) values ('Otra escuela de prueba', 'zzotra2', 'aprobada');
insert into curso (nombre, anio, escuela_id, estado) select 'ZZ2 C1', 2026, id, 'aprobado' from escuela where codigo = 'zzprueba2';
insert into curso (nombre, anio, escuela_id, estado) select 'ZZ2 OTRO', 2026, id, 'aprobado' from escuela where codigo = 'zzotra2';
insert into perfil (id, rol, estado, nombre, apellido, usuario) values
  ('00000000-0000-4000-b000-0000000000b1','profesor','aprobado','B','Profe','zz2.profb'),
  ('00000000-0000-4000-b000-0000000000c1','profesor','pendiente','P','Profe','zz2.profp'),
  ('00000000-0000-4000-b000-0000000000c2','profesor','pendiente','Q','Profe','zz2.profq');
insert into materia (curso_id, nombre) select id, 'ZZ2 M' from curso where nombre = 'ZZ2 C1';
insert into materia_docente (materia_id, profesor_id) select id, '00000000-0000-4000-b000-0000000000b1' from materia where nombre = 'ZZ2 M';
insert into actividad (materia_id, titulo) select id, 'ZZ2 act de M' from materia where nombre = 'ZZ2 M';

-- ids anotados antes de cambiar de rol
select set_config('prueba.esc',  (select id from escuela where codigo = 'zzprueba2')::text, true);
select set_config('prueba.otra', (select id from escuela where codigo = 'zzotra2')::text, true);
select set_config('prueba.c1',   (select id from curso where nombre = 'ZZ2 C1')::text, true);
select set_config('prueba.cotro',(select id from curso where nombre = 'ZZ2 OTRO')::text, true);
select set_config('prueba.m',    (select id from materia where nombre = 'ZZ2 M')::text, true);

-- =========================================================
-- P (pendiente) pide tres cosas
-- =========================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-0000000000c1","role":"authenticated"}', true);
do $$ declare n bigint; begin
  -- 1) materia nueva en un curso existente
  n := pedir_materia(current_setting('prueba.esc')::bigint, null, current_setting('prueba.c1')::bigint, null,
                     null, 'ZZ2 Materia nueva de P', 'titular', 'Doy esta materia desde marzo');
  -- 2) sumarse a la materia M como pareja pedagógica
  n := pedir_materia(current_setting('prueba.esc')::bigint, null, current_setting('prueba.c1')::bigint, null,
                     current_setting('prueba.m')::bigint, null, 'pareja', null);
  -- 3) escuela y curso que no están
  n := pedir_materia(null, 'ZZ2 Escuela propuesta', null, 'ZZ2 6° B', null, 'ZZ2 Materia en escuela nueva', 'titular', null);
  if (select count(*) from mis_solicitudes()) <> 3 then raise exception 'FALLÓ: P tiene que ver sus 3 pedidos'; end if;
  -- validaciones
  begin
    n := pedir_materia(current_setting('prueba.esc')::bigint, null, current_setting('prueba.cotro')::bigint, null, null, 'x', 'titular', null);
    raise exception 'FALLÓ: aceptó un curso de otra escuela';
  exception when raise_exception then if sqlerrm like 'FALLÓ%' then raise; end if;
  end;
  begin
    n := pedir_materia(current_setting('prueba.esc')::bigint, null, current_setting('prueba.c1')::bigint, null, null, '   ', 'titular', null);
    raise exception 'FALLÓ: aceptó una materia sin nombre';
  exception when raise_exception then if sqlerrm like 'FALLÓ%' then raise; end if;
  end;
  -- no puede ver ni aprobar los pedidos de nadie
  begin
    perform * from solicitudes_pendientes();
    raise exception 'FALLÓ: un profesor pendiente vio la cola de pedidos';
  exception when raise_exception then if sqlerrm like 'FALLÓ%' then raise; end if;
  end;
  begin
    perform aprobar_solicitud((select id from mis_solicitudes() limit 1));
    raise exception 'FALLÓ: un profesor pendiente aprobó un pedido';
  exception when raise_exception then if sqlerrm like 'FALLÓ%' then raise; end if;
  end;
  -- todavía no ve la actividad de M
  if exists (select 1 from actividad where titulo = 'ZZ2 act de M') then raise exception 'FALLÓ: P ve actividades antes de ser aprobado'; end if;
end $$;
reset role;

-- =========================================================
-- Q (pendiente) pide algo; la cuenta del foro no puede pedir
-- =========================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-0000000000c2","role":"authenticated"}', true);
select pedir_materia(null, 'ZZ2 Escuela de Q', null, '1° A', null, 'ZZ2 Materia de Q', 'titular', null);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-0000000000e1","role":"authenticated"}', true);
do $$ declare n bigint; begin
  begin
    n := pedir_materia(null, 'x', null, 'x', null, 'x', 'titular', null);
    raise exception 'FALLÓ: una cuenta sin alta de profesor pudo pedir una materia';
  exception when raise_exception then if sqlerrm like 'FALLÓ%' then raise; end if;
  end;
end $$;
reset role;

-- =========================================================
-- ADMIN (Diego) aprueba los de P y rechaza a Q
-- =========================================================
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from perfil where usuario = 'diego'), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$ declare r record; begin
  if (select count(*) from solicitudes_pendientes() where email like 'prueba2.%') <> 4 then
    raise exception 'FALLÓ: el admin tiene que ver los 4 pedidos de prueba'; end if;
  if (select count(*) from profesores_pendientes() where email like 'prueba2.%') <> 2 then
    raise exception 'FALLÓ: el admin tiene que ver a P y Q como pendientes'; end if;
  for r in select id from solicitudes_pendientes() where email = 'prueba2.profp@aula.catto.ar' loop
    perform aprobar_solicitud(r.id);
  end loop;
  perform rechazar_profesor('00000000-0000-4000-b000-0000000000c2');
end $$;
reset role;

do $$ begin
  if (select estado from perfil where usuario = 'zz2.profp') <> 'aprobado' then raise exception 'FALLÓ: P no quedó aprobado'; end if;
  if (select estado from perfil where usuario = 'zz2.profq') <> 'rechazado' then raise exception 'FALLÓ: Q no quedó rechazado'; end if;
  if (select count(*) from materia_docente where profesor_id = '00000000-0000-4000-b000-0000000000c1') <> 3 then
    raise exception 'FALLÓ: P tiene que quedar en 3 materias'; end if;
  if exists (select 1 from materia_docente d join materia m on m.id = d.materia_id
             where m.nombre like 'ZZ2 Materia%' and d.profesor_id = (select id from perfil where usuario = 'diego')) then
    raise exception 'FALLÓ: Diego quedó como docente de las materias aprobadas'; end if;
  if (select rol from materia_docente where profesor_id = '00000000-0000-4000-b000-0000000000c1'
        and materia_id = current_setting('prueba.m')::bigint) <> 'pareja' then
    raise exception 'FALLÓ: P no quedó como pareja pedagógica en M'; end if;
  if (select creada_por from materia where nombre = 'ZZ2 Materia nueva de P') <> '00000000-0000-4000-b000-0000000000c1' then
    raise exception 'FALLÓ: la materia nueva no quedó a nombre de P'; end if;
  if not exists (select 1 from escuela where nombre = 'ZZ2 Escuela propuesta' and estado = 'aprobada') then
    raise exception 'FALLÓ: no se creó la escuela propuesta'; end if;
  if not exists (select 1 from curso c join escuela e on e.id = c.escuela_id
                 where c.nombre = 'ZZ2 6° B' and e.nombre = 'ZZ2 Escuela propuesta' and c.estado = 'aprobado') then
    raise exception 'FALLÓ: no se creó el curso propuesto en la escuela nueva'; end if;
  if exists (select 1 from aula_priv.solicitud where profesor_id = '00000000-0000-4000-b000-0000000000c2' and estado = 'pendiente') then
    raise exception 'FALLÓ: quedaron pedidos de Q pendientes'; end if;
end $$;

-- =========================================================
-- P aprobado ya trabaja en sus materias (incluida la actividad de M, como pareja)
-- =========================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-0000000000c1","role":"authenticated"}', true);
do $$ begin
  if not es_profesor() then raise exception 'FALLÓ: P aprobado no cuenta como profesor'; end if;
  if (select count(*) from mis_materias()) <> 3 then raise exception 'FALLÓ: P tiene que ver sus 3 materias'; end if;
  if not exists (select 1 from actividad where titulo = 'ZZ2 act de M') then raise exception 'FALLÓ: P no ve la actividad de M siendo pareja'; end if;
  if (select count(*) from mis_solicitudes() where estado = 'aprobada') <> 3 then raise exception 'FALLÓ: P tiene que ver sus 3 pedidos aprobados'; end if;
end $$;
reset role;

rollback;   -- deshace TODO lo de arriba

select 'TODAS LAS PRUEBAS PASARON' as resultado;
