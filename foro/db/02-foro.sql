-- ============================================================
-- Foro catto.ar · Paso 2: tablas, reglas de seguridad y funciones
-- Ejecutar en Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se puede correr más de una vez. No toca ninguna tabla del Aula.
--
-- Reglas que impone la base de datos (no dependen de la página):
--  · solo mensajes públicos; no existe mensajería privada
--  · el perfil público tiene solo alias y curso
--  · la primera publicación de cada usuario queda pendiente hasta que
--    la apruebe un moderador; después publica directo
--  · límites: 5 consultas y 20 respuestas por hora
--  · nadie puede cambiar su rol, su estado ni el de los mensajes:
--    eso lo hacen las funciones de moderación
-- ============================================================

-- ---------------- TABLAS ----------------
create table if not exists foro_categoria (
  slug   text primary key,
  nombre text not null,
  grupo  text not null,
  orden  int  not null
);

create table if not exists foro_perfil (
  id         uuid primary key references auth.users(id) on delete cascade,
  alias      text not null unique check (alias ~ '^[a-z0-9_.]{3,20}$'),
  curso      text not null check (curso in (
               'Tecnicatura 4.º año','Tecnicatura 5.º año','Tecnicatura 6.º año','Tecnicatura 7.º año',
               'Ingeniería nivel 1','Ingeniería nivel 2','Ingeniería nivel 3','Ingeniería nivel 4',
               'Ingeniería nivel 5','Ingeniería nivel 6','Docente','Otro')),
  mayor_13   boolean not null check (mayor_13),
  rol        text not null default 'usuario' check (rol in ('usuario','moderador')),
  confiable  boolean not null default false,
  bloqueado  boolean not null default false,
  acepto_normas timestamptz not null default now(),
  creado     timestamptz not null default now()
);

create table if not exists foro_tema (
  id          bigint generated always as identity primary key,
  autor       uuid not null references foro_perfil(id) on delete cascade,
  categoria   text not null references foro_categoria(slug),
  titulo      text not null check (char_length(titulo) between 10 and 150),
  cuerpo      text not null check (char_length(cuerpo) between 30 and 10000),
  pagina      text check (pagina ~ '^/publicaciones/[a-z0-9/_.-]+$'),
  estado      text not null default 'pendiente' check (estado in ('pendiente','publicado','oculto')),
  resuelto    boolean not null default false,
  respuestas  int not null default 0,
  creado      timestamptz not null default now(),
  actividad   timestamptz not null default now()
);
create index if not exists foro_tema_cat on foro_tema (categoria, actividad desc);
create index if not exists foro_tema_pag on foro_tema (pagina);
create index if not exists foro_tema_aut on foro_tema (autor, creado);

create table if not exists foro_respuesta (
  id       bigint generated always as identity primary key,
  tema_id  bigint not null references foro_tema(id) on delete cascade,
  autor    uuid not null references foro_perfil(id) on delete cascade,
  cuerpo   text not null check (char_length(cuerpo) between 2 and 10000),
  estado   text not null default 'pendiente' check (estado in ('pendiente','publicado','oculto')),
  creado   timestamptz not null default now()
);
create index if not exists foro_resp_tema on foro_respuesta (tema_id, creado);
create index if not exists foro_resp_aut  on foro_respuesta (autor, creado);

create table if not exists foro_denuncia (
  id           bigint generated always as identity primary key,
  autor        uuid not null default auth.uid() references foro_perfil(id) on delete cascade,
  tema_id      bigint references foro_tema(id) on delete cascade,
  respuesta_id bigint references foro_respuesta(id) on delete cascade,
  motivo       text not null check (char_length(motivo) between 3 and 500),
  atendida     boolean not null default false,
  creado       timestamptz not null default now(),
  check (tema_id is not null or respuesta_id is not null),
  unique nulls not distinct (autor, tema_id, respuesta_id)
);

create table if not exists foro_accion (
  id         bigint generated always as identity primary key,
  moderador  uuid references foro_perfil(id) on delete set null,
  accion     text not null,
  tipo       text not null,
  objeto     text not null,
  creado     timestamptz not null default now()
);

-- ---------------- CATEGORÍAS ----------------
insert into foro_categoria (slug, nombre, grupo, orden) values
  ('tec-4','4.º año','Tecnicatura',1), ('tec-5','5.º año','Tecnicatura',2),
  ('tec-6','6.º año','Tecnicatura',3), ('tec-7','7.º año','Tecnicatura',4),
  ('ing-1','Nivel 1','Ingeniería',5), ('ing-2','Nivel 2','Ingeniería',6),
  ('ing-3','Nivel 3','Ingeniería',7), ('ing-4','Nivel 4','Ingeniería',8),
  ('ing-5','Nivel 5','Ingeniería',9), ('ing-6','Nivel 6 y proyecto final','Ingeniería',10),
  ('laboratorio','Laboratorio e instrumental','General',11),
  ('proyectos','Proyectos y trabajos prácticos','General',12),
  ('general','Sobre el sitio y el foro','General',13)
on conflict (slug) do update set nombre = excluded.nombre, grupo = excluded.grupo, orden = excluded.orden;

-- ---------------- AUXILIARES ----------------
create or replace function foro_es_moderador()
returns boolean language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists(select 1 from foro_perfil where id = auth.uid() and rol = 'moderador' and not bloqueado);
$$;

-- Antes de publicar: fija autor y estado, controla bloqueo y límites
create or replace function foro_antes_publicar()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare p foro_perfil; n int;
begin
  select * into p from foro_perfil where id = auth.uid();
  if p.id is null then raise exception 'Hace falta completar el perfil antes de publicar.'; end if;
  if p.bloqueado then raise exception 'La cuenta está suspendida para publicar.'; end if;
  new.autor  := p.id;
  new.creado := now();
  new.estado := case when p.confiable or p.rol = 'moderador' then 'publicado' else 'pendiente' end;
  -- con imagen, siempre a revisión (agregado en 04-imagenes.sql)
  if p.rol <> 'moderador' and new.cuerpo ~ '!\[[^]]*\]\(' then new.estado := 'pendiente'; end if;
  if tg_table_name = 'foro_tema' then
    select count(*) into n from foro_tema where autor = p.id and creado > now() - interval '1 hour';
    if n >= 5 and p.rol <> 'moderador' then raise exception 'Se alcanzó el límite de 5 consultas por hora.'; end if;
    new.resuelto := false; new.respuestas := 0; new.actividad := now();
  else
    select count(*) into n from foro_respuesta where autor = p.id and creado > now() - interval '1 hour';
    if n >= 20 and p.rol <> 'moderador' then raise exception 'Se alcanzó el límite de 20 respuestas por hora.'; end if;
    if not exists(select 1 from foro_tema where id = new.tema_id and estado = 'publicado') then
      raise exception 'Ese tema no está disponible para responder.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists foro_tema_antes on foro_tema;
create trigger foro_tema_antes before insert on foro_tema
  for each row execute function foro_antes_publicar();
drop trigger if exists foro_resp_antes on foro_respuesta;
create trigger foro_resp_antes before insert on foro_respuesta
  for each row execute function foro_antes_publicar();

-- Mantiene el contador de respuestas y la última actividad del tema
create or replace function foro_recontar()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare t bigint;
begin
  if tg_op = 'DELETE' then t := old.tema_id; else t := new.tema_id; end if;
  update foro_tema set
    respuestas = (select count(*) from foro_respuesta where tema_id = t and estado = 'publicado'),
    actividad  = greatest(creado, coalesce((select max(creado) from foro_respuesta where tema_id = t and estado = 'publicado'), creado))
  where id = t;
  return null;
end $$;

drop trigger if exists foro_resp_cuenta on foro_respuesta;
create trigger foro_resp_cuenta after insert or update or delete on foro_respuesta
  for each row execute function foro_recontar();

-- ---------------- PERMISOS ----------------
alter table foro_categoria enable row level security;
alter table foro_perfil    enable row level security;
alter table foro_tema      enable row level security;
alter table foro_respuesta enable row level security;
alter table foro_denuncia  enable row level security;
alter table foro_accion    enable row level security;

revoke all on foro_categoria, foro_perfil, foro_tema, foro_respuesta, foro_denuncia, foro_accion from anon, authenticated;
grant select on foro_categoria, foro_perfil, foro_tema, foro_respuesta to anon, authenticated;
grant insert (id, alias, curso, mayor_13) on foro_perfil to authenticated;
grant update (alias, curso) on foro_perfil to authenticated;
grant insert (categoria, titulo, cuerpo, pagina) on foro_tema to authenticated;
grant insert (tema_id, cuerpo) on foro_respuesta to authenticated;
grant insert (tema_id, respuesta_id, motivo) on foro_denuncia to authenticated;
grant select on foro_denuncia, foro_accion to authenticated;

drop policy if exists cat_sel on foro_categoria;
create policy cat_sel on foro_categoria for select using (true);

drop policy if exists per_sel on foro_perfil;
drop policy if exists per_ins on foro_perfil;
drop policy if exists per_upd on foro_perfil;
create policy per_sel on foro_perfil for select using (true);
create policy per_ins on foro_perfil for insert with check (id = auth.uid());
create policy per_upd on foro_perfil for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists tem_sel on foro_tema;
drop policy if exists tem_ins on foro_tema;
create policy tem_sel on foro_tema for select using (estado = 'publicado' or autor = auth.uid() or foro_es_moderador());
create policy tem_ins on foro_tema for insert with check (auth.uid() is not null);

drop policy if exists res_sel on foro_respuesta;
drop policy if exists res_ins on foro_respuesta;
create policy res_sel on foro_respuesta for select using (estado = 'publicado' or autor = auth.uid() or foro_es_moderador());
create policy res_ins on foro_respuesta for insert with check (auth.uid() is not null);

drop policy if exists den_sel on foro_denuncia;
drop policy if exists den_ins on foro_denuncia;
create policy den_sel on foro_denuncia for select using (foro_es_moderador());
create policy den_ins on foro_denuncia for insert with check (autor = auth.uid());

drop policy if exists acc_sel on foro_accion;
create policy acc_sel on foro_accion for select using (foro_es_moderador());

-- Resumen por categoría para la portada del foro
create or replace view foro_resumen with (security_invoker = on) as
  select c.slug, c.nombre, c.grupo, c.orden,
         count(t.id) filter (where t.estado = 'publicado') as temas,
         max(t.actividad) filter (where t.estado = 'publicado') as ultima
  from foro_categoria c left join foro_tema t on t.categoria = c.slug
  group by c.slug, c.nombre, c.grupo, c.orden;
grant select on foro_resumen to anon, authenticated;

-- ---------------- ACCIONES DE USUARIOS ----------------
create or replace function foro_marcar_resuelto(p_tema bigint, p_valor boolean)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  update foro_tema set resuelto = p_valor
  where id = p_tema and (autor = auth.uid() or foro_es_moderador());
  if not found then raise exception 'Solo quien hizo la consulta puede marcarla.'; end if;
end $$;

-- Borra la cuenta del foro y todo lo publicado. Si la persona también
-- es miembro del Aula, conserva su usuario del Aula.
create or replace function foro_borrar_cuenta()
returns void language plpgsql security definer
set search_path = public, auth, pg_temp
as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'No hay sesión iniciada.'; end if;
  delete from public.foro_perfil where id = u;
  if not exists(select 1 from public.perfil where id = u) then
    delete from auth.users where id = u;
  end if;
end $$;

-- ---------------- MODERACIÓN ----------------
create or replace function foro_moderar(p_tipo text, p_id bigint, p_estado text)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare a uuid;
begin
  if not foro_es_moderador() then raise exception 'Sin permiso de moderación.'; end if;
  if p_estado not in ('publicado','oculto') then raise exception 'Estado no válido.'; end if;
  if p_tipo = 'tema' then
    update foro_tema set estado = p_estado where id = p_id returning autor into a;
  elsif p_tipo = 'respuesta' then
    update foro_respuesta set estado = p_estado where id = p_id returning autor into a;
  else
    raise exception 'Tipo no válido.';
  end if;
  if a is null then raise exception 'No se encontró el mensaje.'; end if;
  if p_estado = 'publicado' then update foro_perfil set confiable = true where id = a; end if;
  insert into foro_accion (moderador, accion, tipo, objeto) values (auth.uid(), p_estado, p_tipo, p_id::text);
end $$;

create or replace function foro_bloquear(p_alias text, p_valor boolean)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not foro_es_moderador() then raise exception 'Sin permiso de moderación.'; end if;
  update foro_perfil set bloqueado = p_valor where alias = lower(p_alias) and rol <> 'moderador';
  if not found then raise exception 'No hay un usuario con ese alias (o es moderador).'; end if;
  insert into foro_accion (moderador, accion, tipo, objeto)
    values (auth.uid(), case when p_valor then 'bloquear' else 'desbloquear' end, 'usuario', lower(p_alias));
end $$;

create or replace function foro_atender_denuncia(p_id bigint)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not foro_es_moderador() then raise exception 'Sin permiso de moderación.'; end if;
  update foro_denuncia set atendida = true where id = p_id;
  insert into foro_accion (moderador, accion, tipo, objeto) values (auth.uid(), 'atender', 'denuncia', p_id::text);
end $$;

revoke all on function foro_marcar_resuelto(bigint, boolean), foro_borrar_cuenta(),
  foro_moderar(text, bigint, text), foro_bloquear(text, boolean), foro_atender_denuncia(bigint) from public, anon;
grant execute on function foro_marcar_resuelto(bigint, boolean), foro_borrar_cuenta(),
  foro_moderar(text, bigint, text), foro_bloquear(text, boolean), foro_atender_denuncia(bigint) to authenticated;
