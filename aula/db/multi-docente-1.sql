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
-- 0) LA ESCUELA DE DIEGO (CUE oficial, del GeoServer del Ministerio)
-- ----------------------------------------------------------
create temp table _mi_escuela on commit drop as
select 'I.P.E.T. Nº 49 DOMINGO FAUSTINO SARMIENTO'::text as nombre,
       'Villa Maria'::text  as localidad,
       '140246300'::text    as cue,
       'ipet49'::text       as codigo;    -- prefijo de los usuarios de estudiantes (etapa 3)

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
alter table escuela add column if not exists departamento   text;
alter table escuela add column if not exists sector         text;          -- Estatal / Privado
alter table escuela add column if not exists especialidades text[] not null default '{}';  -- títulos técnicos que dicta

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

-- Las escuelas secundarias técnicas de Córdoba, ya aprobadas, para el menú del alta
-- (solo datos institucionales públicos; ninguna dirección de correo ni teléfono)
-- <escuelas>  (generado por escuelas_sql.py desde el GeoServer del Ministerio de Educación de
-- Córdoba, capa establecimientos_educativos, 25/10/2026: 239 escuelas secundarias técnicas)
insert into escuela (nombre, localidad, departamento, sector, cue, codigo, especialidades, estado)
values
  ('I.P.E.A. N° 292 ING. AGR. LILIAM PRIOTTO', 'Adelia Maria', 'Rio Cuarto', 'Estatal', '140379500', 'ipea292', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. N° 292 ING. AGR. LILIAM PRIOTTO ANEXO Bº NORTE', 'Adelia Maria', 'Rio Cuarto', 'Estatal', '140379502', 'ipea292_2', array['Técnico en Industrialización de la Madera y el Mueble']::text[], 'aprobada'),
  ('I.P.E.A. Nº 226 HEROES DE MALVINAS', 'Alcira', 'Rio Cuarto', 'Estatal', '140387400', 'ipea226', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A.T.y M. N° 429', 'Alejandro Roca', 'Juarez Celman', 'Estatal', '140573900', 'ipeatym429', array['Tecnico en Industrias de Procesos', 'Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 210 ING. VICTOR DES ROTOURS', 'Almafuerte', 'Tercero Arriba', 'Estatal', '140306200', 'ipea210', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 132 PARAVACHASCA', 'Alta Gracia', 'Santa Maria', 'Estatal', '140230500', 'ipet132', array['Técnico en Electricidad', 'Técnico en equipos e instalaciones electromecánicas', 'Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('INSTITUTO AGROTECNICO PADRE DOMINGO VIERA', 'Alta Gracia', 'Santa Maria', 'Privado', '140518000', 'esc518000', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO TECNICO DE ENSEÑANZA PRIVADA EL OBRAJE', 'Alta Gracia', 'Santa Maria', 'Privado', '140267100', 'esc267100', array['Técnico en informática profesional y personal', 'Técnico químico']::text[], 'aprobada'),
  ('INSTITUTO TECNICO MANUEL DE FALLA', 'Alta Gracia', 'Santa Maria', 'Privado', '140482800', 'esc482800', array['Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.A. Nº 216. DR.FRANCISCO CONRADO ROSENBUSCH', 'Alto Alegre', 'Union', 'Estatal', '140269500', 'ipea216', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 234 MIGUEL DE LA FUENTE', 'Ambul', 'San Alberto', 'Estatal', '140270000', 'ipea234', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 118 JUANA AZURDUY', 'Anizacate', 'Santa Maria', 'Estatal', '140323600', 'ipet118', array['Técnico en Industria de los Alimentos', 'Técnico en mantenimiento de inmuebles en zonas turísticas']::text[], 'aprobada'),
  ('I.P.E.T. Nº 372', 'Arias', 'Marcos Juarez', 'Estatal', '140546200', 'ipet372', array['Técnico en equipos e instalaciones electromecánicas', 'Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('I.P.E.T.A. y M. Nº 68 CNEL. DON LUIS ALVAREZ', 'Arroyito', 'San Justo', 'Estatal', '140374300', 'ipetaym68', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en producción agropecuaria', 'Técnico químico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 139 GRAL. MANUEL BELGRANO', 'Ballesteros', 'Union', 'Estatal', '140354000', 'ipet139', array['Tecnico en Industrias de Procesos', 'Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 261 SAN JOSE', 'Balnearia', 'San Justo', 'Estatal', '140191100', 'ipetym261', array['Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.A. Nº 293 ING. AGR. ORESTE CHIESA MOLINARI', 'Bell Ville', 'Union', 'Estatal', '140302500', 'ipea293', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 267 ANTONIO GRAZIANO', 'Bell Ville', 'Union', 'Estatal', '140302600', 'ipet267', array['Técnico en automotores', 'Técnico en equipos e instalaciones electromecánicas', 'Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 87 ROBERTINA MOYANO DE SASTRE', 'Bell Ville', 'Union', 'Estatal', '140253700', 'ipet87', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.A. Nº 81 DIP. DUILIO J. GIORGETTI', 'Bengolea', 'Juarez Celman', 'Estatal', '140311900', 'ipea81', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. N° 255-ANEXO DE BENJAMIN GOULD', 'Benjamin Gould', 'Union', 'Estatal', '140126201', 'ipet255', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 80 LUIS FEDERICO LELOIR', 'Berrotaran', 'Rio Cuarto', 'Estatal', '140309100', 'ipet80', array['Técnico en electrónica', 'Técnico químico']::text[], 'aprobada'),
  ('I.P.E.M.y T. Nº 262 DR. BELISARIO ROLDAN', 'Brinckmann', 'San Justo', 'Estatal', '140340200', 'ipemyt262', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.A. Nº 244 VICTOR SANTIAGO IRAOLA', 'Bulnes', 'Rio Cuarto', 'Estatal', '140060200', 'ipea244', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 236 EMILIO PRATAVIERA', 'Calchin Oeste', 'Rio Segundo', 'Estatal', '140032100', 'ipea236', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.M. y A. Nº 151.JOSE IGNACIO URBIZU', 'Camilo Aldao', 'Marcos Juarez', 'Estatal', '140365500', 'ipemya151', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. N° 355', 'Canals', 'Union', 'Estatal', '140533800', 'ipet355', array['Técnico en mecanización agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 110 MANUEL HIDALGO', 'Canteras Quilpo', 'Cruz del Eje', 'Estatal', '140255800', 'ipet110', array['Técnico minero']::text[], 'aprobada'),
  ('INSTITUTO TECNICO CARNERILLO', 'Carnerillo', 'Juarez Celman', 'Privado', '140384100', 'esc384100', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('CENTRO DE CAPACITACION AGROTECNICA TOMAS THOMAS', 'Cavanagh', 'Marcos Juarez', 'Privado', '140404300', 'esc404300', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 113 BRIG. GRAL. JUAN FACUNDO QUIROGA', 'Cañada de Luque', 'Totoral', 'Estatal', '140189100', 'ipea113', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. N° 354', 'Chancani', 'Pocho', 'Estatal', '140528500', 'ipea354', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO AGROTECNICO INDUSTRIAL CHAZON', 'Chazon', 'General San Martin', 'Privado', '140069100', 'esc069100', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 232 PROF. ENRIQUE ALBERTO FLORES', 'Cienaga del Coro', 'Minas', 'Estatal', '140346300', 'ipet232', array['Técnico minero']::text[], 'aprobada'),
  ('ASOCIACION EDUCATIVA AGROTECNICA Y ORIENTADA PIO LEON', 'Colonia Caroya', 'Colon', 'Privado', '140426600', 'esc426600', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 412 NICOLAS AVELLANEDA', 'Colonia Caroya', 'Colon', 'Estatal', '140566000', 'ipet412', array['Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('I.P.E.A. Nº 245 CARLOS PELLEGRINI', 'Colonia San Bartolome', 'San Justo', 'Estatal', '140357600', 'ipea245', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 83 DR. RENE FAVALORO', 'Colonia Tirolesa', 'Colon', 'Estatal', '140217300', 'ipetym83', array['Técnico en informática profesional y personal', 'Técnico mecánico']::text[], 'aprobada'),
  ('INSTITUTO AGROTECNICO NUESTRA SEÑORA DEL ROSARIO', 'Colonia Vignaud', 'San Justo', 'Privado', '140339400', 'esc339400', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('CENTRO INTEGRAL DE TERMINALIDAD EDUCATIVA', 'Cordoba', 'Capital', 'Estatal', '140586800', 'esc586800', '{}'::text[], 'aprobada'),
  ('I.P.E.A. N° 14 DR. CESAR CUESTAS CARNERO', 'Cordoba', 'Capital', 'Estatal', '140454700', 'ipea14', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 4 CHACRA DE LA MERCED', 'Cordoba', 'Capital', 'Estatal', '140227900', 'ipea4', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A.y T. Nº 189 DR. JUAN MAMERTO GARRO', 'Cordoba', 'Capital', 'Estatal', '140229400', 'ipeayt189', array['Técnico en Industria de los Alimentos', 'Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.M. y T. Nº 319 - ROBERTO FONTANARROSA', 'Cordoba', 'Capital', 'Estatal', '140476200', 'ipemyt319', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('I.P.E.M.y T. N° 310 PUERTO ARGENTINO', 'Cordoba', 'Capital', 'Estatal', '140475900', 'ipemyt310', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.M.y T. N° 357 JOSE CAMPELLONE', 'Cordoba', 'Capital', 'Estatal', '140535600', 'ipemyt357', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.M.y T. Nº 149 ALEJANDRO CARBO', 'Cordoba', 'Capital', 'Estatal', '140326800', 'ipemyt149', array['Técnico electricista']::text[], 'aprobada'),
  ('I.P.E.M.y T. Nº 204 ING. ALBERTO EMILIO LUCCHINI', 'Cordoba', 'Capital', 'Estatal', '140426400', 'ipemyt204', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.M.y T. Nº 297 DR. RENE FAVALORO', 'Cordoba', 'Capital', 'Estatal', '140472600', 'ipemyt297', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. N° 318 COMBATE DE LA TABLADA', 'Cordoba', 'Capital', 'Estatal', '140476100', 'ipet318', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. N° 321. BRIGADIER JUAN MANUEL DE ROSAS', 'Cordoba', 'Capital', 'Estatal', '140478300', 'ipet321', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T. N° 351 AUGUSTO CHAMMAS', 'Cordoba', 'Capital', 'Estatal', '140525800', 'ipet351', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. N° 383', 'Cordoba', 'Capital', 'Estatal', '140549900', 'ipet383', array['Técnico electricista', 'Técnico en electrónica']::text[], 'aprobada'),
  ('I.P.E.T. N° 404', 'Cordoba', 'Capital', 'Estatal', '140560500', 'ipet404', array['Técnico electricista', 'Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.T. N° 430 INSTITUTO TECNICO INDUSTRIAL ZONA NORTE', 'Cordoba', 'Capital', 'Estatal', '140514100', 'ipet430', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T. N°48 PRESIDENTE ROCA', 'Cordoba', 'Capital', 'Estatal', '140334800', 'ipet48', array['Técnico electricista', 'Técnico en automotores', 'Técnico en electrónica', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 17 PAULO FREIRE', 'Cordoba', 'Capital', 'Estatal', '140250500', 'ipet17', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 247 ING. CARLOS CASSAFFOUSTH', 'Cordoba', 'Capital', 'Estatal', '140280300', 'ipet247', array['Técnico electricista', 'Técnico en automotores', 'Técnico en electrónica', 'Técnico en Industrialización de la Madera y el Mueble', 'Técnico en Programación', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 248 LEOPOLDO LUGONES', 'Cordoba', 'Capital', 'Estatal', '140312200', 'ipet248', array['Técnico químico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 249 NICOLAS COPERNICO', 'Cordoba', 'Capital', 'Estatal', '140331700', 'ipet249', array['Técnico en automotores', 'Técnico en electrónica', 'Técnico en informática profesional y personal', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 250 DR. JUAN BIALET MASSE', 'Cordoba', 'Capital', 'Estatal', '140402000', 'ipet250', array['Técnico en automotores', 'Técnico en electrónica']::text[], 'aprobada'),
  ('I.P.E.T. Nº 251 GUARNICION AEREA CORDOBA', 'Cordoba', 'Capital', 'Estatal', '140401900', 'ipet251', array['Técnico aviónico', 'Técnico en aeronáutica']::text[], 'aprobada'),
  ('I.P.E.T. Nº 312 DALMACIO VELEZ SARSFIELD', 'Cordoba', 'Capital', 'Estatal', '140540800', 'ipet312', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 337 JORGE ALBERTO SABATO', 'Cordoba', 'Capital', 'Estatal', '140508100', 'ipet337', array['Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 416', 'Cordoba', 'Capital', 'Estatal', '140567500', 'ipet416', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T. Nº 57 COMODORO MARTIN RIVADAVIA', 'Cordoba', 'Capital', 'Estatal', '140411800', 'ipet57', array['Técnico en automotores', 'Técnico en electrónica', 'Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.T. Nº 64 MALVINAS ARGENTINAS', 'Cordoba', 'Capital', 'Estatal', '140072500', 'ipet64', array['Técnico en Industrialización de la Madera y el Mueble']::text[], 'aprobada'),
  ('I.P.E.T. Nº 66 DR.JOSE A.BALSEIRO', 'Cordoba', 'Capital', 'Estatal', '140094100', 'ipet66', array['Técnico en electrónica']::text[], 'aprobada'),
  ('I.P.E.T. Nº 70 PROF. DR. HUMBERTO DIONISI', 'Cordoba', 'Capital', 'Estatal', '140041700', 'ipet70', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en Industrialización de la Madera y el Mueble']::text[], 'aprobada'),
  ('I.P.E.T. Nº 77 GDOR.DR.S.DEL CASTILLO', 'Cordoba', 'Capital', 'Estatal', '140221900', 'ipet77', array['Técnico en electrónica', 'Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 101 REPUBLICA ARGENTINA', 'Cordoba', 'Capital', 'Estatal', '140268800', 'ipetym101', array['Técnico en electrónica']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 246 DR. AMADEO SABATTINI', 'Cordoba', 'Capital', 'Estatal', '140331900', 'ipetym246', array['Técnico en Óptica Oftálmica e Instrumental', 'Técnico en Programación']::text[], 'aprobada'),
  ('INSTITUTO DE ENSEÑANZA DOMINGO FAUSTINO SARMIENTO (NIVEL SECUNDARIO Y TECNICO)', 'Cordoba', 'Capital', 'Privado', '140380100', 'esc380100', array['Técnico químico']::text[], 'aprobada'),
  ('INSTITUTO PARROQUIAL SAN ROQUE', 'Cordoba', 'Capital', 'Privado', '140030300', 'esc030300', array['Técnico en electrónica']::text[], 'aprobada'),
  ('INSTITUTO SECUNDARIO DE ECONOMIA Y TECNICO JOHN KENNEDY', 'Cordoba', 'Capital', 'Privado', '140136300', 'esc136300', array['Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('INSTITUTO SECUNDARIO ORIENTADO Y TECNICO CARLOS MARIA DE ALVEAR', 'Cordoba', 'Capital', 'Privado', '140238700', 'esc238700', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('INSTITUTO TECNICO RENAULT', 'Cordoba', 'Capital', 'Privado', '140411400', 'esc411400', array['Técnico en Programación', 'Técnico mecánico']::text[], 'aprobada'),
  ('INSTITUTO TECNICO SALESIANO VILLADA', 'Cordoba', 'Capital', 'Privado', '140342200', 'esc342200', array['Técnico en electrónica', 'Técnico en equipos e instalaciones electromecánicas', 'Técnico en Programación']::text[], 'aprobada'),
  ('INSTITUTO TECNICO Y ORIENTADO LUIS MANUEL ROBLES', 'Cordoba', 'Capital', 'Privado', '140290000', 'esc290000', array['Técnico en electrónica']::text[], 'aprobada'),
  ('I.P.E.M. y T. Nº 280. AGUSTIN TOSCO', 'Coronel Moldes', 'Rio Cuarto', 'Estatal', '140187700', 'ipemyt280', array['Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('I.P.E.T. N° 47 NORBERTO JOSE QUADRI', 'Corral de Bustos', 'Marcos Juarez', 'Estatal', '140462600', 'ipet47', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('INSTITUTO TECNICO AGROPECUARIO CORRALITO - I.T.A.C.', 'Corralito', 'Tercero Arriba', 'Privado', '140123800', 'esc123800', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 60 MARIANO MORENO', 'Cosquin', 'Punilla', 'Estatal', '140263000', 'ipet60', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en Industrialización de la Madera y el Mueble']::text[], 'aprobada'),
  ('I.P.E.T.y M. Nº 59. 25 DE MAYO', 'Cruz Alta', 'Marcos Juarez', 'Estatal', '140415100', 'ipetym59', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.A. Nº 211 PRESIDENTE ARTURO ILLIA', 'Cruz del Eje', 'Cruz del Eje', 'Estatal', '140256100', 'ipea211', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 104 ARTURO CAPDEVILA', 'Cruz del Eje', 'Cruz del Eje', 'Estatal', '140252000', 'ipet104', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 253 PTE. JUAN DOMINGO PERON', 'Cruz del Eje', 'Cruz del Eje', 'Estatal', '140319800', 'ipet253', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T.y A. Nº 53 FRAY LUIS BELTRAN', 'Dean Funes', 'Ischilin', 'Estatal', '140296300', 'ipetya53', array['Técnico en electrónica', 'Técnico en equipos e instalaciones electromecánicas', 'Técnico en Industrialización de la Madera y el Mueble', 'Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A.y M. Nº 219 ENRIQUE COOK', 'del Campillo', 'General Roca', 'Estatal', '140401000', 'ipeaym219', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T.y M. Nº 89 PAULA ALBARRACIN', 'Devoto', 'San Justo', 'Estatal', '140097600', 'ipetym89', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.A. Nº 225. ATAHUALPA YUPANQUI', 'El Arañado', 'San Justo', 'Estatal', '140151400', 'ipea225', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 235. JULIO R. VALENZUELA', 'El Fortin', 'San Justo', 'Estatal', '140098900', 'ipea235', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T.y M. Nº 61 GRAL. MANUEL SAVIO', 'El Pueblito', 'Colon', 'Estatal', '140386400', 'ipetym61', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.A.y T. Nº 347 DOCTOR ALEJANDRO DEGENARO', 'Embalse', 'Calamuchita', 'Estatal', '140507700', 'ipeayt347', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO MARIANO FRAGUEIRO TECNICO Y ORIENTADO', 'Embalse', 'Calamuchita', 'Privado', '140247900', 'esc247900', array['Técnico electricista']::text[], 'aprobada'),
  ('I.P.E.A. Nº 291', 'General Cabrera', 'Juarez Celman', 'Estatal', '140194600', 'ipea291', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 105 ALFONSINA STORNI', 'General Deheza', 'Juarez Celman', 'Estatal', '140195800', 'ipea105', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO TECNICO ADRIAN P.URQUIA', 'General Deheza', 'Juarez Celman', 'Privado', '140309400', 'esc309400', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en Programación', 'Técnico químico']::text[], 'aprobada'),
  ('I.P.E.A. Nº 239 HECTOR M.C. REYNAL', 'General Levalle', 'Presidente Roque Saenz Peña', 'Estatal', '140201600', 'ipea239', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 85 REPUBLICA DE ITALIA', 'General Paz', 'Colon', 'Estatal', '140082900', 'ipet85', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 71 LUIS FEDERICO LELOIR', 'Hernando', 'Tercero Arriba', 'Estatal', '140040300', 'ipet71', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('INSTITUTO PABLO A. PIZZURNO - AGROTECNICO y ORIENTADO', 'Hernando', 'Tercero Arriba', 'Privado', '140041400', 'esc041400', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 200 ING. JOSE PALACIOS', 'Huerta Grande', 'Punilla', 'Estatal', '140284800', 'ipet200', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 52 CARLOS PELLEGRINI', 'Huinca Renanco', 'General Roca', 'Estatal', '140364300', 'ipet52', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T. N° 420', 'Isla Verde', 'Marcos Juarez', 'Estatal', '140572500', 'ipet420', array['Técnico en mecanización agropecuaria', 'Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.A. Nº 33 HUMBERTO VOLANDO', 'James Craik', 'Tercero Arriba', 'Estatal', '140447900', 'ipea33', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 361 JOSE GABRIEL BROCHERO', 'Jesus Maria', 'Colon', 'Estatal', '140537900', 'ipet361', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 69 JUANA MANSO DE NORONHA', 'Jesus Maria', 'Colon', 'Estatal', '140328500', 'ipetym69', array['Técnico en automotores', 'Técnico en electrónica', 'Técnico en equipos e instalaciones electromecánicas', 'Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('I.P.E.T. Nº 265 ESCUELA DE MINERIA DE JOSE DE LA QUINTANA SENADOR LUIS CARNEVALE', 'Jose de la Quintana', 'Santa Maria', 'Estatal', '140323700', 'ipet265', array['Técnico minero']::text[], 'aprobada'),
  ('I.P.E.A.y.M. Nº 221 SAN CARLOS', 'Jovita', 'General Roca', 'Estatal', '140400700', 'ipeaym221', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. N° 386', 'Juarez Celman', 'Colon', 'Estatal', '140551600', 'ipet386', array['Técnico electricista']::text[], 'aprobada'),
  ('I.P.E.T. Nº 333 JULIO SALUSSO', 'Juarez Celman', 'Colon', 'Estatal', '140509000', 'ipet333', array['Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('I.P.E.T. Nº 415', 'Justiniano Posse', 'Union', 'Estatal', '140567400', 'ipet415', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('INSTITUTO TECNICO SAN JOSE', 'Justiniano Posse', 'Union', 'Privado', '140353000', 'esc353000', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T. Nº 379 ALFREDO BENOIT MOLET', 'la Calera', 'Colon', 'Estatal', '140546100', 'ipet379', array['Técnico electricista', 'Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 73 MARGARITA WEILD DE PAZ', 'la Calera', 'Colon', 'Estatal', '140410300', 'ipetym73', array['Técnico en electrónica']::text[], 'aprobada'),
  ('I.P.E.A. Nº 213 ING. AGR. LORENZO R. PARODI', 'la Carlota', 'Juarez Celman', 'Estatal', '140320700', 'ipea213', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 100 MARIA BENITA ARIAS', 'la Carlota', 'Juarez Celman', 'Estatal', '140331400', 'ipet100', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 255', 'la Carlota', 'Juarez Celman', 'Estatal', '140126200', 'ipet255_2', array['Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. N° 426', 'la Cumbre', 'Punilla', 'Estatal', '140573800', 'ipet426', array['Técnico electricista']::text[], 'aprobada'),
  ('INSTITUTO TECNICO INDUSTRIAL FELIX DE MICHELLI', 'la Cumbre', 'Punilla', 'Privado', '140284400', 'esc284400', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('INSTITUTO TECNICO LA FALDA', 'la Falda', 'Punilla', 'Privado', '140293100', 'esc293100', array['Técnico en electrónica', 'Técnico en Programación', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.A. Nº 233 AGUSTIN TOSCO', 'la Granja', 'Colon', 'Estatal', '140323100', 'ipea233', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 240 SANTIAGO CARRIZO', 'la Paquita', 'San Justo', 'Estatal', '140340500', 'ipea240', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 111 RAMIRO SUAREZ', 'la Playosa', 'General San Martin', 'Estatal', '140299100', 'ipet111', array['Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 58 GENERAL MOSCONI', 'la Puerta', 'Rio Primero', 'Estatal', '140378000', 'ipet58', array['Técnico en automotores', 'Técnico en Industria de los Alimentos', 'Técnico en informática profesional y personal', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.A. Nº 212.HILDER ODILIO GALASSI', 'Laborde', 'Union', 'Estatal', '140203200', 'ipea212', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T.y.M. Nº 257 DR. RENE FAVALORO', 'Laboulaye', 'Presidente Roque Saenz Peña', 'Estatal', '140141700', 'ipetym257', array['Técnico en electrónica', 'Técnico en equipos e instalaciones electromecánicas', 'Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.T. N° 397 MANUEL GONZALEZ', 'Laguna Larga', 'Rio Segundo', 'Estatal', '140557100', 'ipet397', array['Técnico en mecanización agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO TECNICO PARROQUIAL LAS ACEQUIAS', 'las Acequias', 'Rio Cuarto', 'Privado', '140057300', 'esc057300', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 34 PEDRO CATTANEO', 'las Arrias', 'Tulumba', 'Estatal', '140448000', 'ipet34', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.A.T.y M. Nº 186 CAPITAN LUIS D. J. CASTAGNARI', 'las Higueras', 'Rio Cuarto', 'Estatal', '140153800', 'ipeatym186', array['Técnico en informática profesional y personal', 'Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. N° 258 MAYOR ING. FRANCISCO DE ARTEAGA', 'las Higueras', 'Rio Cuarto', 'Estatal', '140154300', 'ipet258', array['Técnico aviónico', 'Técnico en aeronáutica']::text[], 'aprobada'),
  ('I.P.E.A. Nº 231 INT.DELMO EDUARDO SEBASTIAN TORASSO', 'las Junturas', 'Rio Segundo', 'Estatal', '140032700', 'ipea231', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A Nº 403', 'las Varas', 'San Justo', 'Estatal', '140560600', 'ipea403', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 263. DR. BERNARDO HOUSSAY', 'las Varillas', 'San Justo', 'Estatal', '140066800', 'ipet263', array['Técnico en Industria de los Alimentos', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T.y M. Nº 256 LDOR. GRAL. DON JOSE DE SAN MARTIN', 'Leones', 'Marcos Juarez', 'Estatal', '140351900', 'ipetym256', array['Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.A. Nº 230 DR. AMADEO SABATTINI', 'los Cerrillos', 'San Javier', 'Estatal', '140156900', 'ipea230', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 343 MAURICIO RUMBOLL', 'los Cocos', 'Punilla', 'Estatal', '140507300', 'ipea343', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T.y M. Nº 75 - DR. RENE FAVALORO', 'los Condores', 'Calamuchita', 'Estatal', '140073200', 'ipetym75', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.A. Nº 241. FEDERICO CAMPODONICO', 'los Zorros', 'Tercero Arriba', 'Estatal', '140424200', 'ipea241', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 227 ING. AGR. HERIBERTO G. FISHER', 'Lozada', 'Santa Maria', 'Estatal', '140003900', 'ipea227', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 308', 'Lucio V. Mansilla', 'Tulumba', 'Estatal', '140468200', 'ipet308', array['Técnico electricista']::text[], 'aprobada'),
  ('I.P.E.T. Nº 300 PLAZA MINETTI', 'Luque', 'Rio Segundo', 'Estatal', '140470100', 'ipet300', array['Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('I.P.E.T. Nº 67 TTE. CNEL. LUIS PIEDRABUENA', 'Malagueño', 'Santa Maria', 'Estatal', '140231100', 'ipet67', array['Técnico mecánico', 'Técnico minero']::text[], 'aprobada'),
  ('I.P.E.A. Nº 1 INGENIERO AGRONOMO LUCIANO ALMIRON', 'Malena', 'Rio Cuarto', 'Estatal', '140415200', 'ipea1', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. N° 378', 'Malvinas Argentinas', 'Colon', 'Estatal', '140549800', 'ipet378', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('INSTITUTO TECNICO HECTOR VALDIVIELSO', 'Malvinas Argentinas', 'Colon', 'Privado', '140563500', 'esc563500', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.A. Nº 209. DOMINGO FAUSTINO SARMIENTO', 'Marcos Juarez', 'Marcos Juarez', 'Estatal', '140314400', 'ipea209', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 51 NICOLAS AVELLANEDA', 'Marcos Juarez', 'Marcos Juarez', 'Estatal', '140272400', 'ipet51', array['Técnico en automotores', 'Técnico en electrónica', 'Técnico en Industrialización de la Madera y el Mueble', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.A.y M. Nº 237 SAN ANTONIO', 'Melo', 'Presidente Roque Saenz Peña', 'Estatal', '140085400', 'ipeaym237', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 418 JORGE RAUL RECALDE', 'Mina Clavero', 'San Alberto', 'Estatal', '140571600', 'ipet418', array['Técnico en mantenimiento de inmuebles en zonas turísticas']::text[], 'aprobada'),
  ('I.P.E.T. Nº 44 MINISTRO MACARIO CARRIZO', 'Miramar', 'San Justo', 'Estatal', '140206500', 'ipet44', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('INSTITUTO TECNICO AGRARIO INDUSTRIAL', 'Monte Buey', 'Marcos Juarez', 'Privado', '140224300', 'esc224300', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO TECNICO y ORIENTADO SAGRADO CORAZON', 'Monte Maiz', 'Union', 'Privado', '140260500', 'esc260500', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.M.y T. Nº 30 EDUARDO SIMON NEMIROVSKY', 'Montecristo', 'Rio Primero', 'Estatal', '140456600', 'ipemyt30', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 363', 'Montecristo', 'Rio Primero', 'Estatal', '140538100', 'ipet363', array['Técnico en electrónica', 'Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.M.y T. Nº 173 GDOR. JUAN B. BUSTOS', 'Morrison', 'Union', 'Estatal', '140050100', 'ipemyt173', array['Técnico en mecanización agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A.y T. Nº 242 FUERTE LOS MORTEROS', 'Morteros', 'San Justo', 'Estatal', '140322300', 'ipeayt242', array['Técnico en mecanización agropecuaria', 'Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 411', 'Noetinger', 'Union', 'Estatal', '140565500', 'ipet411', array['Técnico en mecanización agropecuaria', 'Técnico en Programación']::text[], 'aprobada'),
  ('INSTITUTO JOSE MANUEL ESTRADA', 'Obispo Trejo', 'Rio Primero', 'Privado', '140054800', 'esc054800', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 143 GRAL. JOSE MARIA PAZ', 'Oliva', 'Tercero Arriba', 'Estatal', '140366800', 'ipet143', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.A. Nº 220 INGENIERO MARIANO FREZZI', 'Oncativo', 'Rio Segundo', 'Estatal', '140211500', 'ipea220', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 54 JUAN ENRIQUE MULLER', 'Oncativo', 'Rio Segundo', 'Estatal', '140122600', 'ipet54', array['Técnico en automotores', 'Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.A. Nº 218. JUAN BAUTISTA BOSIO', 'Pasco', 'General San Martin', 'Estatal', '140018000', 'ipea218', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 306 DR. AMADEO SABATTINI', 'Paso Viejo', 'Cruz del Eje', 'Estatal', '140468300', 'ipea306', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A.Y.M. Nº 243 EDUARDO OLIVERA', 'Pilar', 'Rio Segundo', 'Estatal', '140035700', 'ipeaym243', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 229 MIGUEL LILLO', 'Piquillin', 'Rio Primero', 'Estatal', '140274500', 'ipea229', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 222 AGRONOMO AMERICO ALMES MILANI', 'Plaza San Francisco', 'San Justo', 'Estatal', '140321700', 'ipea222', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INST.PRIVADO DIOCESANO GENERAL MANUEL BELGRANO', 'Pozo del Molle', 'Rio Segundo', 'Privado', '140026400', 'esc026400', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO QUILINO', 'Quilino', 'Ischilin', 'Privado', '140282000', 'esc282000', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T.y M. N° 352 ALFREDO CAVALOTTI', 'Rio Ceballos', 'Colon', 'Estatal', '140529600', 'ipetym352', array['Técnico electricista', 'Técnico mecánico']::text[], 'aprobada'),
  ('INSTITUTO TECNICO MAESTRO ALFREDO BRAVO', 'Rio Ceballos', 'Colon', 'Privado', '140502700', 'esc502700', array['Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('ESCUELA DE AGRONOMIA DE RIO CUARTO: INSTITUTO AGROTECNICO Y ORIENTADO EN CIENCIAS NATURALES', 'Rio Cuarto', 'Rio Cuarto', 'Privado', '140153300', 'esc153300', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.M.y T. Nº 203 DR. JUAN BAUTISTA DICHIARA', 'Rio Cuarto', 'Rio Cuarto', 'Estatal', '140299900', 'ipemyt203', array['Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('I.P.E.T. Nº 259 AMBROSIO OLMOS', 'Rio Cuarto', 'Rio Cuarto', 'Estatal', '140400300', 'ipet259', array['Técnico en equipos e instalaciones electromecánicas', 'Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 26 JUAN FILLOY', 'Rio Cuarto', 'Rio Cuarto', 'Estatal', '140447400', 'ipet26', array['Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('I.P.E.T. Nº 362 JUAN ANDRES POLITANO', 'Rio Cuarto', 'Rio Cuarto', 'Estatal', '140538000', 'ipet362', array['Técnico en Industria de los Alimentos', 'Técnico en Industrialización de la Madera y el Mueble']::text[], 'aprobada'),
  ('I.P.E.T. Nº 79 ING. RENATO DE MARCO', 'Rio Cuarto', 'Rio Cuarto', 'Estatal', '140301300', 'ipet79', array['Técnico electricista', 'Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('INSTITUTO SECUNDARIO SANTA MARIA TERESA GORETTI', 'Rio Cuarto', 'Rio Cuarto', 'Privado', '140090700', 'esc090700', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T. N°398', 'Rio Primero', 'Rio Primero', 'Estatal', '140556200', 'ipet398', array['Técnico en electrónica']::text[], 'aprobada'),
  ('I.P.E.T. Nº 62 ALVAREZ CONDARCO', 'Rio Segundo', 'Rio Segundo', 'Estatal', '140241900', 'ipet62', array['Técnico en automotores', 'Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T.Y.M. Nº 108 CLOTILDE GUILLEN DE REZZANO', 'Rio Segundo', 'Rio Segundo', 'Estatal', '140242400', 'ipetym108', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 266 GRAL. SAVIO', 'Rio Tercero', 'Tercero Arriba', 'Estatal', '140329800', 'ipet266', array['Técnico en electrónica', 'Técnico en equipos e instalaciones electromecánicas', 'Técnico mecánico', 'Técnico químico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 98 LUIS DE TEJEDA', 'Rio Tercero', 'Tercero Arriba', 'Estatal', '140161500', 'ipet98', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('INSTITUTO TECNICO RIO TERCERO', 'Rio Tercero', 'Tercero Arriba', 'Privado', '140329100', 'esc329100', array['Técnico en automotores', 'Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('INSTITUTO AGROTECNICO MANUEL BELGRANO', 'Saira', 'Marcos Juarez', 'Privado', '140352700', 'esc352700', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. N° 389', 'Sampacho', 'Rio Cuarto', 'Estatal', '140555500', 'ipet389', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en mecanización agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO ORIENTADO Y AGROTECNICO PABLO A. PIZZURNO', 'Sampacho', 'Rio Cuarto', 'Privado', '140279000', 'esc279000', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 331', 'San Agustin', 'Calamuchita', 'Estatal', '140504000', 'ipet331', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('ESCUELA AGROTECNICA SALESIANA AMBROSIO OLMOS', 'San Ambrosio', 'Rio Cuarto', 'Privado', '140280200', 'esc280200', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 214. MANUEL BELGRANO', 'San Antonio de Litin', 'Union', 'Estatal', '140313000', 'ipea214', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('ESCUELA EXPERIMENTAL CON ENFASIS EN TECNOLOGIAS DE LA INFORMACION Y LA COMUNICACION', 'San Francisco', 'San Justo', 'Estatal', '140549200', 'esc549200', array['Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.T. Nº 264 TEODORO ASTEGGIANO', 'San Francisco', 'San Justo', 'Estatal', '140382900', 'ipet264', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.T. Nº 50 ING. EMILIO F. OLMOS', 'San Francisco', 'San Justo', 'Estatal', '140319000', 'ipet50', array['Técnico electricista', 'Técnico en automotores', 'Técnico en electrónica', 'Técnico en Industrialización de la Madera y el Mueble', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 63 REPUBLICA DE ITALIA', 'San Francisco del Chañar', 'Sobremonte', 'Estatal', '140297700', 'ipetym63', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.A.y T. Nº 223 INTENDENTE RAMON NICENO QUINTEROS', 'San Jose de la Dormida', 'Tulumba', 'Estatal', '140430900', 'ipeayt223', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO AGROTECNICO STELLA MARIS', 'San Pedro', 'San Alberto', 'Privado', '140350200', 'esc350200', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 215 RAUL SCALABRINI ORTIZ', 'Santa Catalina', 'Rio Cuarto', 'Estatal', '140120300', 'ipea215', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. N° 422', 'Santa Rosa de Calamuchita', 'Calamuchita', 'Estatal', '140573300', 'ipet422', array['Técnico en mantenimiento de inmuebles en zonas turísticas']::text[], 'aprobada'),
  ('INSTITUTO SAN FRANCISCO DE ASIS - ORIENTADO y TECNICO', 'Santa Rosa de Calamuchita', 'Calamuchita', 'Privado', '140021100', 'esc021100', array['Técnico en Industrialización de la Madera y el Mueble', 'Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('I.P.E.T. N° 428 EGIDIO FERRERO', 'Seeber', 'San Justo', 'Estatal', '140573500', 'ipet428', array['Técnico en informática profesional y personal']::text[], 'aprobada'),
  ('I.P.E.T. Nº 106 REMEDIOS DE ESCALADA DE SAN MARTIN', 'Serrezuela', 'Cruz del Eje', 'Estatal', '140106800', 'ipet106', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. N° 392 OTTO KRAUSE', 'Silvio Pellico', 'General San Martin', 'Estatal', '140558400', 'ipet392', array['Técnico en mecanización agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 413', 'Sinsacate', 'Totoral', 'Estatal', '140565800', 'ipet413', array['Técnico en mecanización agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 84 JORGE VOCOS LESCANO', 'Tanti', 'Punilla', 'Estatal', '140162500', 'ipetym84', array['Técnico en electrónica']::text[], 'aprobada'),
  ('INSTITUTO DE LA FAMILIA AGRICOLA', 'Tuclame', 'Cruz del Eje', 'Privado', '140371300', 'esc371300', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.M.y T. Nº 23 LINO ENEA SPILIMBERGO', 'Unquillo', 'Colon', 'Estatal', '140455100', 'ipemyt23', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. y M. Nº 78 JUAN BAUTISTA AMBROSETTI', 'Unquillo', 'Colon', 'Estatal', '140323200', 'ipetym78', array['Técnico minero']::text[], 'aprobada'),
  ('I.P.E.T.A.y.M. Nº 65 JUAN A. DE MENA', 'Vicuña Mackenna', 'Rio Cuarto', 'Estatal', '140091900', 'ipetaym65', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO TECNICO ISOR', 'Villa Bustos (santa Maria de la Punilla)', 'Punilla', 'Privado', '140400500', 'esc400500', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. N°382 MANUEL ANTONIO DIAZ MARIÑO', 'Villa Carlos Paz', 'Punilla', 'Estatal', '140550100', 'ipet382', array['Técnico en informática profesional y personal', 'Técnico en mantenimiento de inmuebles en zonas turísticas']::text[], 'aprobada'),
  ('INSTITUTO INDUSTRIAL CRISTO OBRERO', 'Villa Carlos Paz', 'Punilla', 'Privado', '140240400', 'esc240400', array['Técnico en Programación', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 344 PROFESOR VICTOR DOMINGUEZ', 'Villa Cura Brochero', 'San Alberto', 'Estatal', '140503500', 'ipet344', array['Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('INSTITUTO VILLA DE LAS ROSAS', 'Villa de las Rosas', 'San Javier', 'Privado', '140405900', 'esc405900', array['Técnico electricista']::text[], 'aprobada'),
  ('I.P.E.A. y M. Nº 224 LEOPOLDO LUGONES', 'Villa de Maria', 'Rio Seco', 'Estatal', '140394800', 'ipeaym224', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 254 TRISTAN DE TEJEDA', 'Villa de Soto', 'Cruz del Eje', 'Estatal', '140250600', 'ipet254', array['Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 55', 'Villa del Rosario', 'Rio Segundo', 'Estatal', '140395900', 'ipet55', array['Técnico en automotores', 'Técnico en electrónica', 'Técnico en equipos e instalaciones electromecánicas', 'Técnico en Industrialización de la Madera y el Mueble', 'Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('INSTITUTO BACHILLERATO AGROTECNICO SAN JOSE', 'Villa del Rosario', 'Rio Segundo', 'Privado', '140211100', 'esc211100', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('ESC. NORMAL SUPERIOR MAESTROS FUNDADORES', 'Villa del Totoral', 'Totoral', 'Estatal', '140189000', 'esc189000', array['Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.A. Nº 217 ING. JOSE BARRIONUEVO', 'Villa del Totoral', 'Totoral', 'Estatal', '140328200', 'ipea217', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T.y M. Nº 74 FRAY MAMERTO ESQUIU', 'Villa del Totoral', 'Totoral', 'Estatal', '140120000', 'ipetym74', array['Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('I.P.E.T. N° 424', 'Villa Dolores', 'San Javier', 'Estatal', '140573400', 'ipet424', array['Técnico en informática profesional y personal', 'Técnico en Programación']::text[], 'aprobada'),
  ('I.P.E.T. Nº 260 INDUSTRIAL ERNESTO ARNALDO MARTINEZ', 'Villa Dolores', 'San Javier', 'Estatal', '140302400', 'ipet260', array['Técnico en automotores', 'Técnico en equipos e instalaciones electromecánicas']::text[], 'aprobada'),
  ('I.P.E.A. Nº 228 SAN ISIDRO LABRADOR', 'Villa Fontana', 'Rio Primero', 'Estatal', '140378400', 'ipea228', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 238 CARLOS MARIA MAMPAEY', 'Villa General Belgrano', 'Calamuchita', 'Estatal', '140005800', 'ipea238', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.M.y.A. Nº 188 DR. ANTONIO PEREZ', 'Villa Huidobro', 'General Roca', 'Estatal', '140157500', 'ipemya188', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 49 DOMINGO FAUSTINO SARMIENTO', 'Villa Maria', 'General San Martin', 'Estatal', '140246300', 'ipet49', array['Técnico electricista', 'Técnico en automotores', 'Técnico en electrónica', 'Técnico en Industrialización de la Madera y el Mueble', 'Técnico mecánico']::text[], 'aprobada'),
  ('I.P.E.T. Nº 56 ABRAHAM JUAREZ', 'Villa Maria', 'General San Martin', 'Estatal', '140152900', 'ipet56', array['Técnico electricista', 'Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T.y M. N° 99. ROSARIO VERA PEÑALOZA', 'Villa Maria', 'General San Martin', 'Estatal', '140392600', 'ipetym99', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('INSTITUTO SAN ANTONIO', 'Villa Maria', 'General San Martin', 'Privado', '140156000', 'esc156000', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.T. N° 322 MANUEL BELGRANO', 'Villa Nueva', 'General San Martin', 'Estatal', '140476300', 'ipet322', array['Técnico en Industria de los Alimentos', 'Tecnico en Industrias de Procesos']::text[], 'aprobada'),
  ('I.P.E.T. Nº 334', 'Villa Parque Santa Ana', 'Santa Maria', 'Estatal', '140507600', 'ipet334', array['Técnico en Industria de los Alimentos']::text[], 'aprobada'),
  ('I.P.E.A. Nº 127 DR. MATEO CARUSILLO', 'Villa Reduccion', 'Juarez Celman', 'Estatal', '140312000', 'ipea127', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 25 MARTIN MIGUEL DE GUEMES', 'Villa Rossi', 'Presidente Roque Saenz Peña', 'Estatal', '140447300', 'ipea25', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.T. Nº 76. GUSTAVO RIEMANN', 'Villa Rumipal', 'Calamuchita', 'Estatal', '140005600', 'ipet76', array['Técnico en equipos e instalaciones electromecánicas', 'Técnico químico']::text[], 'aprobada'),
  ('I.P.E.A.y M. Nº 307 PASO DEL LEON', 'Villa Sarmiento', 'San Alberto', 'Estatal', '140472000', 'ipeaym307', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('I.P.E.A. Nº 179 PADRE ORLANDO NICOLETTI', 'Villa Valeria', 'General Roca', 'Estatal', '140341100', 'ipea179', array['Técnico en producción agropecuaria']::text[], 'aprobada'),
  ('INSTITUTO TECNICO JOSE HERNANDEZ', 'Wenceslao Escalante', 'Union', 'Privado', '140203500', 'esc203500', array['Técnico en Industria de los Alimentos']::text[], 'aprobada')
on conflict do nothing;
-- </escuelas>

-- Su escuela (ya viene en la lista; esto la asegura si no estuviera)
insert into escuela (nombre, localidad, cue, codigo, estado)
select e.nombre, e.localidad, e.cue, e.codigo, 'aprobada'
from _mi_escuela e
where not exists (select 1 from escuela x where x.cue = e.cue or x.codigo = e.codigo);

-- Los cursos actuales pasan a esa escuela, aprobados
update curso set escuela_id = (select x.id from escuela x join _mi_escuela e on e.cue = x.cue),
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
