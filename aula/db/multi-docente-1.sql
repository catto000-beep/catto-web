-- ============================================================
-- Aula Catto — Varios docentes, etapa 1: base de datos
-- Diseño completo: docs/aula-multi-docente.md
--
-- Cómo ejecutar: Supabase → SQL Editor → New query → pegar TODO → Run.
--   ANTES: cambiar el nombre y la localidad de tu escuela en el paso 0.
--   DESPUÉS: correr multi-docente-1-pruebas.sql.
-- Va entero dentro de una transacción: si algo falla, no se aplica nada.
-- Se puede correr más de una vez (usa IF NOT EXISTS y reemplaza las reglas).
-- Vuelta atrás: multi-docente-1-volver.sql.
--
-- Para Diego no cambia nada visible: queda como admin y ve todo, como hoy.
-- ============================================================
begin;

-- ----------------------------------------------------------
-- 0) TU ESCUELA (cambiar estos datos antes de correr)
-- ----------------------------------------------------------
create temp table _mi_escuela on commit drop as
select 'NOMBRE DE TU ESCUELA'::text as nombre,
       'Villa María'::text          as localidad,
       null::text                   as cue,       -- código único de establecimiento, si lo tenés a mano
       'esc1'::text                 as codigo;    -- prefijo corto para los usuarios de estudiantes

-- ----------------------------------------------------------
-- 1) TABLAS Y COLUMNAS NUEVAS
-- ----------------------------------------------------------
create table if not exists escuela (
  id         bigint generated always as identity primary key,
  nombre     text not null,
  localidad  text,
  cue        text unique,
  codigo     text unique,                        -- prefijo de los usuarios de estudiantes (etapa 3)
  estado     text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  creada_por uuid references perfil(id) on delete set null,
  creada_en  timestamptz not null default now()
);

alter table perfil add column if not exists admin  boolean not null default false;
alter table perfil add column if not exists estado text    not null default 'aprobado';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'perfil_estado_check') then
    alter table perfil add constraint perfil_estado_check
      check (estado in ('pendiente','aprobado','rechazado','suspendido'));
  end if;
end $$;

alter table curso add column if not exists escuela_id bigint references escuela(id) on delete restrict;
alter table curso add column if not exists estado     text not null default 'aprobado';
alter table curso add column if not exists creado_por uuid references perfil(id) on delete set null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'curso_estado_check') then
    alter table curso add constraint curso_estado_check check (estado in ('pendiente','aprobado','rechazado'));
  end if;
end $$;

alter table materia add column if not exists creada_por uuid references perfil(id) on delete set null;

create table if not exists materia_docente (
  materia_id  bigint not null references materia(id) on delete cascade,
  profesor_id uuid   not null references perfil(id)  on delete cascade,
  rol         text   not null default 'titular' check (rol in ('titular','pareja')),
  creado_en   timestamptz not null default now(),
  primary key (materia_id, profesor_id)
);
create index if not exists materia_docente_profesor on materia_docente(profesor_id);
create index if not exists curso_escuela on curso(escuela_id);
create index if not exists materia_curso on materia(curso_id);
create index if not exists perfil_curso on perfil(curso_id);

-- ----------------------------------------------------------
-- 2) MIGRACIÓN DE LOS DATOS ACTUALES
-- ----------------------------------------------------------
-- Diego: admin y aprobado (su usuario es «diego», ver crear-profesor.sql)
update perfil set admin = true, estado = 'aprobado' where usuario = 'diego' and rol = 'profesor';
do $$ begin
  if not exists (select 1 from perfil where usuario = 'diego' and admin) then
    raise exception 'No encontré el perfil de Diego (usuario «diego», rol profesor). No se aplicó nada.';
  end if;
end $$;

-- Su escuela (una sola vez)
insert into escuela (nombre, localidad, cue, codigo, estado, creada_por)
select e.nombre, e.localidad, e.cue, e.codigo, 'aprobada', (select id from perfil where usuario = 'diego')
from _mi_escuela e
where not exists (select 1 from escuela x where x.codigo = e.codigo);

-- Los cursos actuales pasan a esa escuela, aprobados
update curso set escuela_id = (select x.id from escuela x join _mi_escuela e on e.codigo = x.codigo),
                 estado = 'aprobado',
                 creado_por = coalesce(creado_por, (select id from perfil where usuario = 'diego'))
where escuela_id is null;

-- Las materias actuales quedan a cargo de Diego
insert into materia_docente (materia_id, profesor_id, rol)
select m.id, (select id from perfil where usuario = 'diego'), 'titular' from materia m
on conflict do nothing;
update materia set creada_por = (select id from perfil where usuario = 'diego') where creada_por is null;

-- ----------------------------------------------------------
-- 3) FUNCIONES AUXILIARES
--    SECURITY DEFINER: leen sin pasar por las reglas de acceso (evita recursión).
-- ----------------------------------------------------------
create or replace function es_admin() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists(select 1 from perfil where id = auth.uid() and rol = 'profesor' and admin and estado = 'aprobado');
$$;

-- antes: cualquier perfil con rol profesor. Ahora además tiene que estar aprobado.
create or replace function es_profesor() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists(select 1 from perfil where id = auth.uid() and rol = 'profesor' and estado = 'aprobado');
$$;

-- profesor que pidió el alta (pendiente) o ya aprobado: puede ver los menús y proponer escuela o curso
create or replace function es_profesor_registrado() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists(select 1 from perfil where id = auth.uid() and rol = 'profesor' and estado in ('pendiente','aprobado'));
$$;

-- antes: cualquier fila en perfil. Ahora un profesor pendiente o rechazado no cuenta como miembro.
create or replace function es_miembro_aula() returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists(select 1 from perfil where id = auth.uid() and (rol = 'estudiante' or estado = 'aprobado'));
$$;

create or replace function mi_curso() returns bigint
language sql security definer stable set search_path = public, pg_temp as $$
  select curso_id from perfil where id = auth.uid() and rol = 'estudiante';
$$;

create or replace function mis_materias() returns setof bigint
language sql security definer stable set search_path = public, pg_temp as $$
  select d.materia_id from materia_docente d
  where d.profesor_id = auth.uid() and es_profesor();
$$;

create or replace function mis_cursos() returns setof bigint
language sql security definer stable set search_path = public, pg_temp as $$
  select distinct m.curso_id from materia m join materia_docente d on d.materia_id = m.id
  where d.profesor_id = auth.uid() and es_profesor();
$$;

create or replace function mis_actividades() returns setof bigint
language sql security definer stable set search_path = public, pg_temp as $$
  select a.id from actividad a join materia_docente d on d.materia_id = a.materia_id
  where d.profesor_id = auth.uid() and es_profesor();
$$;

create or replace function actividades_de_mi_curso() returns setof bigint
language sql security definer stable set search_path = public, pg_temp as $$
  select a.id from actividad a join materia m on m.id = a.materia_id
  where m.curso_id = mi_curso();
$$;

-- ¿el uid (en texto, como viene de la carpeta de Storage) es un estudiante de mis cursos?
create or replace function es_alumno_mio(uid text) returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists(select 1 from perfil p
                where p.id::text = uid and p.rol = 'estudiante' and p.curso_id in (select mis_cursos()));
$$;

-- Alta de un profesor: la única vía para tener rol profesor sin que Diego lo cree a mano.
-- Queda pendiente hasta que Diego lo apruebe.
create or replace function solicitar_alta_profesor(p_nombre text, p_apellido text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Hace falta iniciar sesión.'; end if;
  if exists (select 1 from perfil where id = auth.uid()) then
    raise exception 'Esta cuenta ya tiene un perfil en el Aula.';
  end if;
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_apellido), '') = '' then
    raise exception 'Faltan el nombre o el apellido.';
  end if;
  insert into perfil (id, rol, estado, nombre, apellido)
  values (auth.uid(), 'profesor', 'pendiente', trim(p_nombre), trim(p_apellido));
end $$;
revoke all on function solicitar_alta_profesor(text, text) from public, anon;
grant execute on function solicitar_alta_profesor(text, text) to authenticated;

-- ----------------------------------------------------------
-- 4) AUTOMATISMOS
-- ----------------------------------------------------------
-- Escuela o curso creados por alguien que no es admin nacen pendientes.
-- (Desde el SQL Editor o una Edge Function, auth.uid() es nulo: no se toca nada.)
create or replace function al_crear_escuela() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null then
    new.creada_por := auth.uid();
    if not es_admin() then new.estado := 'pendiente'; end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_al_crear_escuela on escuela;
create trigger trg_al_crear_escuela before insert on escuela for each row execute function al_crear_escuela();

create or replace function al_crear_curso() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null then
    new.creado_por := auth.uid();
    if not es_admin() then new.estado := 'pendiente'; end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_al_crear_curso on curso;
create trigger trg_al_crear_curso before insert on curso for each row execute function al_crear_curso();

-- Quien crea una materia queda como su docente titular.
create or replace function al_crear_materia() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null and es_profesor() then
    insert into materia_docente (materia_id, profesor_id, rol) values (new.id, auth.uid(), 'titular')
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists trg_al_crear_materia on materia;
create trigger trg_al_crear_materia after insert on materia for each row execute function al_crear_materia();

create or replace function al_crear_materia_autor() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null then new.creada_por := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists trg_al_crear_materia_autor on materia;
create trigger trg_al_crear_materia_autor before insert on materia for each row execute function al_crear_materia_autor();

-- Nadie (salvo el admin) se cambia el rol, el estado, la marca de admin ni el usuario.
-- Un estudiante tampoco su curso ni su «activo». Un profesor solo mueve alumnos entre SUS cursos.
create or replace function proteger_perfil() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or es_admin() then return new; end if;
  new.rol     := old.rol;
  new.estado  := old.estado;
  new.admin   := old.admin;
  new.usuario := old.usuario;
  if old.id = auth.uid() then
    new.curso_id := old.curso_id;
    new.activo   := old.activo;
  elsif new.curso_id is distinct from old.curso_id
        and (new.curso_id is null or new.curso_id not in (select mis_cursos())) then
    raise exception 'Solo podés pasar el estudiante a un curso donde das clase.';
  end if;
  return new;
end $$;
drop trigger if exists trg_proteger_perfil on perfil;
create trigger trg_proteger_perfil before update on perfil for each row execute function proteger_perfil();

-- ----------------------------------------------------------
-- 5) REGLAS DE ACCESO (RLS)
-- ----------------------------------------------------------
alter table escuela         enable row level security;
alter table materia_docente enable row level security;

-- perfil
drop policy if exists perfil_sel       on perfil;
drop policy if exists perfil_upd_self  on perfil;
drop policy if exists perfil_prof      on perfil;
drop policy if exists perfil_upd_prof  on perfil;
drop policy if exists perfil_admin     on perfil;
create policy perfil_sel on perfil for select using (
  id = auth.uid() or es_admin()
  or (es_profesor() and rol = 'estudiante' and curso_id in (select mis_cursos()))
);
create policy perfil_upd_self on perfil for update using (id = auth.uid()) with check (id = auth.uid());
create policy perfil_upd_prof on perfil for update
  using (es_profesor() and rol = 'estudiante' and curso_id in (select mis_cursos()))
  with check (rol = 'estudiante');
create policy perfil_admin on perfil for all using (es_admin()) with check (es_admin());

-- escuela
drop policy if exists escuela_sel   on escuela;
drop policy if exists escuela_ins   on escuela;
drop policy if exists escuela_admin on escuela;
create policy escuela_sel on escuela for select using (
  es_admin() or creada_por = auth.uid() or (estado = 'aprobada' and (es_profesor_registrado() or es_miembro_aula()))
);
create policy escuela_ins on escuela for insert with check (es_profesor_registrado());
create policy escuela_admin on escuela for all using (es_admin()) with check (es_admin());

-- curso
drop policy if exists curso_sel   on curso;
drop policy if exists curso_prof  on curso;
drop policy if exists curso_ins   on curso;
drop policy if exists curso_admin on curso;
create policy curso_sel on curso for select using (
  es_admin() or creado_por = auth.uid() or id = mi_curso()
  or (estado = 'aprobado' and es_profesor_registrado())
);
create policy curso_ins on curso for insert with check (es_profesor_registrado());
create policy curso_admin on curso for all using (es_admin()) with check (es_admin());

-- materia
drop policy if exists materia_sel   on materia;
drop policy if exists materia_prof  on materia;
drop policy if exists materia_ins   on materia;
drop policy if exists materia_upd   on materia;
drop policy if exists materia_del   on materia;
drop policy if exists materia_admin on materia;
create policy materia_sel on materia for select using (
  es_admin() or es_profesor_registrado() or curso_id = mi_curso()
);
create policy materia_ins on materia for insert with check (
  es_admin() or (es_profesor() and exists (select 1 from curso c where c.id = curso_id and c.estado = 'aprobado'))
);
create policy materia_upd on materia for update
  using (es_admin() or id in (select mis_materias()))
  with check (es_admin() or id in (select mis_materias()));
create policy materia_del on materia for delete using (es_admin() or id in (select mis_materias()));

-- materia_docente
drop policy if exists md_sel   on materia_docente;
drop policy if exists md_admin on materia_docente;
create policy md_sel on materia_docente for select using (es_admin() or profesor_id = auth.uid() or es_miembro_aula());
create policy md_admin on materia_docente for all using (es_admin()) with check (es_admin());

-- actividad
drop policy if exists actividad_sel  on actividad;
drop policy if exists actividad_prof on actividad;
create policy actividad_sel on actividad for select using (
  es_admin() or materia_id in (select mis_materias()) or id in (select actividades_de_mi_curso())
);
create policy actividad_prof on actividad for all
  using (es_admin() or materia_id in (select mis_materias()))
  with check (es_admin() or materia_id in (select mis_materias()));

-- entrega
drop policy if exists entrega_sel      on entrega;
drop policy if exists entrega_ins      on entrega;
drop policy if exists entrega_upd_self on entrega;
drop policy if exists entrega_prof     on entrega;
create policy entrega_sel on entrega for select using (
  estudiante_id = auth.uid() or es_admin() or actividad_id in (select mis_actividades())
);
create policy entrega_ins on entrega for insert with check (
  estudiante_id = auth.uid() and actividad_id in (select actividades_de_mi_curso())
);
create policy entrega_upd_self on entrega for update
  using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());
create policy entrega_prof on entrega for all
  using (es_admin() or actividad_id in (select mis_actividades()))
  with check (es_admin() or actividad_id in (select mis_actividades()));

-- Storage: entregas y fotos, cada profesor solo las de sus alumnos
drop policy if exists entregas_read on storage.objects;
drop policy if exists entregas_del  on storage.objects;
create policy entregas_read on storage.objects for select using (
  bucket_id = 'entregas' and (
    (storage.foldername(name))[1] = auth.uid()::text or es_admin()
    or (es_profesor() and es_alumno_mio((storage.foldername(name))[1]))
  )
);
create policy entregas_del on storage.objects for delete using (
  bucket_id = 'entregas' and ((storage.foldername(name))[1] = auth.uid()::text or es_admin())
);

drop policy if exists fotos_read on storage.objects;
create policy fotos_read on storage.objects for select using (
  bucket_id = 'fotos-perfil' and es_miembro_aula() and (
    (storage.foldername(name))[1] = auth.uid()::text or es_admin()
    or (es_profesor() and es_alumno_mio((storage.foldername(name))[1]))
  )
);
-- (fotos_write, fotos_upd, entregas_write, entregas_upd y consignas_* quedan como estaban:
--  ya usan es_miembro_aula() / es_profesor(), que ahora excluyen a los pendientes.)

-- ----------------------------------------------------------
-- 6) RESUMEN (lo muestra el SQL Editor al terminar)
-- ----------------------------------------------------------
commit;

select 'escuelas' as que, count(*)::text as cuantos from escuela
union all select 'cursos sin escuela', count(*)::text from curso where escuela_id is null
union all select 'materias sin docente', count(*)::text from materia m
          where not exists (select 1 from materia_docente d where d.materia_id = m.id)
union all select 'admin', string_agg(usuario, ', ') from perfil where admin
union all select 'otros profesores (ahora sin materias: revisar)', coalesce(string_agg(usuario, ', '), 'ninguno')
          from perfil where rol = 'profesor' and not admin;
