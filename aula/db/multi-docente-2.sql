-- ============================================================
-- Aula Catto — Varios docentes, etapa 2: pedidos de alta y aprobación
-- Diseño: docs/aula-multi-docente.md. Requiere la etapa 1 ya aplicada.
--
-- Un profesor entra con Google en /aula/registro, completa su nombre
-- (solicitar_alta_profesor, de la etapa 1) y pide una o más materias:
-- escuela → curso → materia, eligiendo de lo que ya existe o proponiendo
-- lo que falta. Diego ve los pedidos en su panel y los aprueba o rechaza.
-- Aprobar un pedido aprueba al profesor y crea lo que haga falta
-- (escuela, curso, materia) con él como docente.
--
-- Los pedidos viven en un esquema privado (aula_priv) que la API no
-- expone: solo se tocan con las funciones de abajo. Así tampoco suman
-- relaciones nuevas entre tablas públicas (lo que rompió los embeds en
-- la etapa 1).
-- Va entero en una transacción. Se puede correr más de una vez.
-- ============================================================
begin;

create schema if not exists aula_priv;
revoke all on schema aula_priv from public, anon, authenticated;

create table if not exists aula_priv.solicitud (
  id                bigint generated always as identity primary key,
  profesor_id       uuid   not null,
  escuela_id        bigint,             -- de la lista; si no está, escuela_propuesta
  escuela_propuesta text,
  curso_id          bigint,             -- un curso existente; si no, curso_propuesto («5° A»)
  curso_propuesto   text,
  materia_id        bigint,             -- sumarse a una materia existente (pareja pedagógica)
  materia_nombre    text,               -- o una materia nueva
  rol               text not null default 'titular' check (rol in ('titular','pareja')),
  mensaje           text,
  estado            text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  respuesta         text,
  creada_en         timestamptz not null default now(),
  resuelta_en       timestamptz
);
create index if not exists solicitud_profesor on aula_priv.solicitud(profesor_id);
create index if not exists solicitud_estado   on aula_priv.solicitud(estado);

-- ----------------------------------------------------------
-- Los automatismos de la etapa 1 (autor y docente de lo que se crea)
-- no tienen que actuar cuando el que crea es la aprobación de Diego:
-- ahí el autor y el docente son el profesor que pidió, no Diego.
-- ----------------------------------------------------------
create or replace function al_crear_curso() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null and coalesce(current_setting('aula.aprobando', true), '') <> '1' then
    new.creado_por := auth.uid();
    if not es_admin() then new.estado := 'pendiente'; end if;
  end if;
  return new;
end $$;

create or replace function al_crear_materia() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null and es_profesor() and coalesce(current_setting('aula.aprobando', true), '') <> '1' then
    insert into materia_docente (materia_id, profesor_id, rol) values (new.id, auth.uid(), 'titular')
    on conflict do nothing;
  end if;
  return new;
end $$;

create or replace function al_crear_materia_autor() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null and coalesce(current_setting('aula.aprobando', true), '') <> '1' then
    new.creada_por := auth.uid();
  end if;
  return new;
end $$;

create or replace function al_crear_escuela() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null and coalesce(current_setting('aula.aprobando', true), '') <> '1' then
    new.creada_por := auth.uid();
    if not es_admin() then new.estado := 'pendiente'; end if;
  end if;
  return new;
end $$;

-- ----------------------------------------------------------
-- Profesor: pedir, ver y cancelar sus pedidos
-- ----------------------------------------------------------
create or replace function pedir_materia(
  p_escuela_id bigint, p_escuela_propuesta text,
  p_curso_id bigint, p_curso_propuesto text,
  p_materia_id bigint, p_materia_nombre text,
  p_rol text, p_mensaje text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare nuevo bigint;
begin
  if not es_profesor_registrado() then raise exception 'Primero completá tu alta como profesor.'; end if;
  if (select count(*) from aula_priv.solicitud where profesor_id = auth.uid() and estado = 'pendiente') >= 10 then
    raise exception 'Ya tenés 10 pedidos esperando. Esperá a que se revisen.';
  end if;
  p_escuela_propuesta := nullif(trim(p_escuela_propuesta), '');
  p_curso_propuesto   := nullif(trim(p_curso_propuesto), '');
  p_materia_nombre    := nullif(trim(p_materia_nombre), '');
  p_mensaje           := left(nullif(trim(p_mensaje), ''), 1000);
  if p_rol is null or p_rol not in ('titular','pareja') then p_rol := 'titular'; end if;

  -- escuela: de la lista (aprobada) o propuesta
  if p_escuela_id is not null then
    if not exists (select 1 from escuela where id = p_escuela_id and estado = 'aprobada') then
      raise exception 'Esa escuela no está en la lista.'; end if;
    p_escuela_propuesta := null;
  elsif p_escuela_propuesta is null then
    raise exception 'Elegí tu escuela o escribí su nombre.';
  end if;
  -- curso: uno existente de esa escuela, o propuesto
  if p_curso_id is not null then
    if p_escuela_id is null or not exists (select 1 from curso where id = p_curso_id and escuela_id = p_escuela_id and estado = 'aprobado') then
      raise exception 'Ese curso no es de la escuela elegida.'; end if;
    p_curso_propuesto := null;
  elsif p_curso_propuesto is null then
    raise exception 'Elegí el curso o escribilo (por ejemplo, 5° A).';
  end if;
  -- materia: sumarse a una existente de ese curso, o una nueva
  if p_materia_id is not null then
    if p_curso_id is null or not exists (select 1 from materia where id = p_materia_id and curso_id = p_curso_id) then
      raise exception 'Esa materia no es del curso elegido.'; end if;
    if exists (select 1 from materia_docente where materia_id = p_materia_id and profesor_id = auth.uid()) then
      raise exception 'Ya das esa materia.'; end if;
    p_materia_nombre := null;
  elsif p_materia_nombre is null then
    raise exception 'Escribí el nombre de la materia.';
  else
    p_rol := 'titular';
  end if;

  insert into aula_priv.solicitud (profesor_id, escuela_id, escuela_propuesta, curso_id, curso_propuesto,
                                   materia_id, materia_nombre, rol, mensaje)
  values (auth.uid(), p_escuela_id, p_escuela_propuesta, p_curso_id, p_curso_propuesto,
          p_materia_id, p_materia_nombre, p_rol, p_mensaje)
  returning id into nuevo;
  return nuevo;
end $$;

create or replace function mis_solicitudes()
returns table (id bigint, escuela text, curso text, materia text, rol text, estado text,
               respuesta text, creada_en timestamptz)
language sql security definer stable set search_path = public, pg_temp as $$
  select s.id,
         coalesce(e.nombre, s.escuela_propuesta),
         coalesce(c.nombre, s.curso_propuesto),
         coalesce(m.nombre, s.materia_nombre),
         s.rol, s.estado, s.respuesta, s.creada_en
  from aula_priv.solicitud s
  left join escuela e on e.id = s.escuela_id
  left join curso   c on c.id = s.curso_id
  left join materia m on m.id = s.materia_id
  where s.profesor_id = auth.uid()
  order by s.creada_en desc;
$$;

create or replace function cancelar_solicitud(p_id bigint) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from aula_priv.solicitud where id = p_id and profesor_id = auth.uid() and estado = 'pendiente';
  if not found then raise exception 'Ese pedido ya no se puede cancelar.'; end if;
end $$;

-- ----------------------------------------------------------
-- Admin (Diego): ver, aprobar y rechazar
-- ----------------------------------------------------------
create or replace function solicitudes_pendientes()
returns table (id bigint, profesor_id uuid, profesor text, email text, estado_profesor text,
               escuela_id bigint, escuela text, escuela_nueva boolean,
               curso_id bigint, curso text, curso_nuevo boolean,
               materia_id bigint, materia text, materia_nueva boolean,
               rol text, mensaje text, creada_en timestamptz)
language plpgsql security definer stable set search_path = public, pg_temp as $$
begin
  if not es_admin() then raise exception 'Solo el administrador.'; end if;
  return query
  select s.id, s.profesor_id, (p.apellido || ', ' || p.nombre)::text, u.email::text, p.estado,
         s.escuela_id, coalesce(e.nombre, s.escuela_propuesta), s.escuela_id is null,
         s.curso_id, coalesce(c.nombre, s.curso_propuesto), s.curso_id is null,
         s.materia_id, coalesce(m.nombre, s.materia_nombre), s.materia_id is null,
         s.rol, s.mensaje, s.creada_en
  from aula_priv.solicitud s
  join perfil p on p.id = s.profesor_id
  left join auth.users u on u.id = s.profesor_id
  left join escuela e on e.id = s.escuela_id
  left join curso   c on c.id = s.curso_id
  left join materia m on m.id = s.materia_id
  where s.estado = 'pendiente'
  order by s.creada_en;
end $$;

-- profesores que pidieron el alta (para verlos aunque todavía no hayan pedido materias)
create or replace function profesores_pendientes()
returns table (id uuid, profesor text, email text, creado_en timestamptz, pedidos bigint)
language plpgsql security definer stable set search_path = public, pg_temp as $$
begin
  if not es_admin() then raise exception 'Solo el administrador.'; end if;
  return query
  select p.id, (p.apellido || ', ' || p.nombre)::text, u.email::text, p.creado_en,
         (select count(*) from aula_priv.solicitud s where s.profesor_id = p.id and s.estado = 'pendiente')
  from perfil p left join auth.users u on u.id = p.id
  where p.rol = 'profesor' and p.estado = 'pendiente'
  order by p.creado_en;
end $$;

-- Aprobar: crea lo que falte y deja al profesor como docente de la materia.
-- p_escuela_id / p_curso_id permiten a Diego elegir uno existente en lugar de crear el propuesto
-- (por ejemplo, si el profesor escribió una escuela que ya estaba con otro nombre).
create or replace function aprobar_solicitud(p_id bigint, p_escuela_id bigint default null, p_curso_id bigint default null)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare s aula_priv.solicitud; v_esc bigint; v_cur bigint; v_mat bigint; v_rol text;
begin
  if not es_admin() then raise exception 'Solo el administrador.'; end if;
  select * into s from aula_priv.solicitud where id = p_id for update;
  if s.id is null or s.estado <> 'pendiente' then raise exception 'Ese pedido ya no está pendiente.'; end if;
  perform set_config('aula.aprobando', '1', true);

  v_esc := coalesce(p_escuela_id, s.escuela_id);
  if v_esc is null then
    insert into escuela (nombre, estado, creada_por) values (s.escuela_propuesta, 'aprobada', s.profesor_id)
    returning id into v_esc;
  end if;

  v_cur := coalesce(p_curso_id, s.curso_id);
  if v_cur is null then
    insert into curso (nombre, anio, escuela_id, estado, creado_por)
    values (s.curso_propuesto, extract(year from now())::int, v_esc, 'aprobado', s.profesor_id)
    returning id into v_cur;
  end if;

  if s.materia_id is not null then
    v_mat := s.materia_id; v_rol := s.rol;
  else
    insert into materia (curso_id, nombre, creada_por) values (v_cur, s.materia_nombre, s.profesor_id)
    returning id into v_mat;
    v_rol := 'titular';
  end if;
  insert into materia_docente (materia_id, profesor_id, rol) values (v_mat, s.profesor_id, v_rol)
  on conflict do nothing;

  update perfil set estado = 'aprobado' where id = s.profesor_id and estado = 'pendiente';
  update aula_priv.solicitud set estado = 'aprobada', resuelta_en = now(),
         escuela_id = v_esc, curso_id = v_cur, materia_id = v_mat
  where id = p_id;
  perform set_config('aula.aprobando', '', true);
  return 'Aprobado: ' || (select nombre from materia where id = v_mat) || ' · ' || (select nombre from curso where id = v_cur);
end $$;

create or replace function rechazar_solicitud(p_id bigint, p_respuesta text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not es_admin() then raise exception 'Solo el administrador.'; end if;
  update aula_priv.solicitud set estado = 'rechazada', resuelta_en = now(),
         respuesta = left(nullif(trim(p_respuesta), ''), 500)
  where id = p_id and estado = 'pendiente';
  if not found then raise exception 'Ese pedido ya no está pendiente.'; end if;
end $$;

-- un alta que no corresponde (sin pedidos de materias, o que no es docente)
create or replace function rechazar_profesor(p_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not es_admin() then raise exception 'Solo el administrador.'; end if;
  update aula_priv.solicitud set estado = 'rechazada', resuelta_en = now()
  where profesor_id = p_id and estado = 'pendiente';
  update perfil set estado = 'rechazado' where id = p_id and rol = 'profesor' and estado = 'pendiente';
  if not found then raise exception 'Ese profesor ya no está pendiente.'; end if;
end $$;

-- permisos: las funciones las llama el navegador con la sesión del usuario
revoke all on function pedir_materia(bigint, text, bigint, text, bigint, text, text, text) from public, anon;
revoke all on function mis_solicitudes() from public, anon;
revoke all on function cancelar_solicitud(bigint) from public, anon;
revoke all on function solicitudes_pendientes() from public, anon;
revoke all on function profesores_pendientes() from public, anon;
revoke all on function aprobar_solicitud(bigint, bigint, bigint) from public, anon;
revoke all on function rechazar_solicitud(bigint, text) from public, anon;
revoke all on function rechazar_profesor(uuid) from public, anon;
grant execute on function pedir_materia(bigint, text, bigint, text, bigint, text, text, text) to authenticated;
grant execute on function mis_solicitudes() to authenticated;
grant execute on function cancelar_solicitud(bigint) to authenticated;
grant execute on function solicitudes_pendientes() to authenticated;
grant execute on function profesores_pendientes() to authenticated;
grant execute on function aprobar_solicitud(bigint, bigint, bigint) to authenticated;
grant execute on function rechazar_solicitud(bigint, text) to authenticated;
grant execute on function rechazar_profesor(uuid) to authenticated;

commit;
notify pgrst, 'reload schema';

select 'pedidos' as que, count(*)::text as valor from aula_priv.solicitud
union all select 'funciones nuevas', count(*)::text from pg_proc
  where pronamespace = 'public'::regnamespace and proname in
  ('pedir_materia','mis_solicitudes','cancelar_solicitud','solicitudes_pendientes','profesores_pendientes',
   'aprobar_solicitud','rechazar_solicitud','rechazar_profesor');
