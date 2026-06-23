-- ============================================================
-- Aula Catto — Esquema de base de datos (Etapa A)
-- Cómo ejecutar: Supabase → SQL Editor → New query → pegar TODO → Run.
-- Se puede correr más de una vez sin romper nada (usa IF NOT EXISTS / guards).
-- ============================================================

-- ----------------------------------------------------------
-- 1) TABLAS
-- ----------------------------------------------------------
create table if not exists curso (
  id     bigint generated always as identity primary key,
  nombre text not null,
  anio   int
);

create table if not exists materia (
  id       bigint generated always as identity primary key,
  curso_id bigint not null references curso(id) on delete cascade,
  nombre   text not null
);

create table if not exists perfil (
  id        uuid primary key references auth.users(id) on delete cascade,
  rol       text not null default 'estudiante' check (rol in ('profesor','estudiante')),
  nombre    text,
  apellido  text,
  usuario   text unique,
  curso_id  bigint references curso(id),
  foto_path text,
  activo    boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists actividad (
  id                    bigint generated always as identity primary key,
  materia_id            bigint not null references materia(id) on delete cascade,
  titulo                text not null,
  consigna              text,
  archivo_consigna_path text,
  fecha_limite          date,            -- NULL = sin vencimiento
  creada_en             timestamptz not null default now()
);

create table if not exists entrega (
  id                  bigint generated always as identity primary key,
  actividad_id        bigint not null references actividad(id) on delete cascade,
  estudiante_id       uuid not null references perfil(id) on delete cascade,
  archivo_path        text,
  comentario_estudiante text,
  entregado_en        timestamptz default now(),
  nota_num            numeric(4,2),      -- 1 a 10 (opcional)
  nota_concepto       text,              -- conceptual (opcional)
  comentario_profesor text,
  estado              text not null default 'entregado' check (estado in ('entregado','calificado')),
  unique (actividad_id, estudiante_id)   -- una entrega por estudiante/actividad (la reentrega la sobrescribe)
);

-- ----------------------------------------------------------
-- 2) HELPER: ¿el usuario actual es profesor?
--    SECURITY DEFINER => lee perfil sin pasar por RLS (evita recursión).
-- ----------------------------------------------------------
create or replace function es_profesor()
returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists(select 1 from perfil where id = auth.uid() and rol = 'profesor');
$$;

-- ----------------------------------------------------------
-- 3) ROW LEVEL SECURITY (cada uno ve solo lo suyo; profesor ve todo)
-- ----------------------------------------------------------
alter table curso     enable row level security;
alter table materia   enable row level security;
alter table perfil    enable row level security;
alter table actividad enable row level security;
alter table entrega   enable row level security;

-- perfil
drop policy if exists perfil_sel       on perfil;
drop policy if exists perfil_upd_self  on perfil;
drop policy if exists perfil_prof       on perfil;
create policy perfil_sel      on perfil for select using (id = auth.uid() or es_profesor());
create policy perfil_upd_self on perfil for update using (id = auth.uid());
create policy perfil_prof     on perfil for all    using (es_profesor()) with check (es_profesor());

-- curso / materia: cualquier usuario autenticado lee; solo profesor escribe
drop policy if exists curso_sel   on curso;
drop policy if exists curso_prof  on curso;
create policy curso_sel  on curso  for select using (auth.uid() is not null);
create policy curso_prof on curso  for all    using (es_profesor()) with check (es_profesor());

drop policy if exists materia_sel  on materia;
drop policy if exists materia_prof on materia;
create policy materia_sel  on materia for select using (auth.uid() is not null);
create policy materia_prof on materia for all    using (es_profesor()) with check (es_profesor());

-- actividad: el estudiante ve las de las materias de SU curso; profesor todo
drop policy if exists actividad_sel  on actividad;
drop policy if exists actividad_prof on actividad;
create policy actividad_sel on actividad for select using (
  es_profesor() or materia_id in (
    select m.id from materia m
    join perfil p on p.curso_id = m.curso_id
    where p.id = auth.uid()
  )
);
create policy actividad_prof on actividad for all using (es_profesor()) with check (es_profesor());

-- entrega: el estudiante lee/crea/edita LA SUYA; profesor lee todo y califica
drop policy if exists entrega_sel      on entrega;
drop policy if exists entrega_ins      on entrega;
drop policy if exists entrega_upd_self on entrega;
drop policy if exists entrega_prof     on entrega;
create policy entrega_sel      on entrega for select using (estudiante_id = auth.uid() or es_profesor());
create policy entrega_ins      on entrega for insert with check (estudiante_id = auth.uid());
create policy entrega_upd_self on entrega for update using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());
create policy entrega_prof     on entrega for all    using (es_profesor()) with check (es_profesor());

-- ----------------------------------------------------------
-- 4) STORAGE (buckets privados). Las POLÍTICAS de archivos se configuran
--    en la Etapa B (cuando conectemos la subida real de fotos/entregas).
-- ----------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('fotos-perfil','fotos-perfil', false),
  ('consignas','consignas', false),
  ('entregas','entregas', false)
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 5) DATOS DE EJEMPLO (un curso y una materia, para probar)
-- ----------------------------------------------------------
insert into curso (nombre, anio)
select '6° A', 2026 where not exists (select 1 from curso where nombre = '6° A');

insert into materia (curso_id, nombre)
select c.id, 'Electrónica Digital III'
from curso c
where c.nombre = '6° A'
  and not exists (select 1 from materia m where m.nombre = 'Electrónica Digital III');
