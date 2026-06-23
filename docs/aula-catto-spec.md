# Especificación — "Aula Catto" (administrador de estudiantes)

> Documento de trabajo. Esta spec es el **prompt maestro** que después usaremos para construir
> la app de forma iterativa (loop de construir → probar → verificar → corregir).
> Estado: **v2 — definiciones cerradas. Lista para crear el proyecto Supabase y arrancar.**

---

## 1. Objetivo

Un espacio dentro de catto.ar donde Diego (profesor) sube **actividades** para sus cursos, y cada
**estudiante** entra con su propio acceso, carga su **foto** y **entrega su trabajo** (un archivo).
Diego ve quién entregó y quién no, abre cada entrega, pone **nota + comentario**, y tiene un
**resumen por clase**.

Nombre de trabajo: **Aula Catto** (renombrable). Vivirá en `catto.ar/aula`.

---

## 2. Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Nombre | **Aula Catto** (confirmado). |
| Acceso | **Diego crea las cuentas** (importa la lista del curso). Nada de auto-registro. |
| Usuarios | **Generados por el sistema**: usuario tipo `apellido.nombre` + contraseña. **No** se requiere email real del estudiante. |
| Escala | **100–300 estudiantes** en total. Plan gratuito con límites de tamaño de archivo. |
| Actividad | **Consigna + archivo**: Diego sube consigna (texto y/o PDF), el estudiante entrega un archivo. |
| Reentrega | **Permitida** hasta la fecha límite (la última entrega reemplaza a la anterior). |
| Fecha límite | **Opcional**: algunas actividades tienen vencimiento, otras quedan abiertas. |
| Nota | **Numérica (1–10) y conceptual**, ambas. Más comentario. Visible para el estudiante. |
| Visibilidad | Toda `/aula` está **detrás de login**. Sin credenciales no se ve nada. El panel de profesor abre **solo con la cuenta de Diego**. No se enlaza desde la home pública por ahora. |

---

## 3. Stack técnico

- **Frontend:** HTML/CSS/JS, misma estética "Catto" (tema oscuro, `assets/css/base.css`).
  Se despliega estático en Vercel, igual que el resto del sitio.
- **Backend (BaaS): Supabase**
  - **Auth** → acceso de cada usuario. El sistema genera un **usuario** (`apellido.nombre`) y
    una **contraseña**; no se requiere email real (internamente Supabase usa un email sintético
    tipo `apellido.nombre@aula.catto.ar`, transparente para el estudiante).
  - **Postgres** → datos (cursos, materias, actividades, entregas, notas).
  - **Storage** → archivos (foto de perfil, consignas, entregas).
  - **Row Level Security (RLS)** → cada estudiante solo ve/toca lo suyo; Diego ve todo.

---

## 4. Roles

- **Profesor (Diego):** único administrador. Crea cursos, materias, estudiantes y actividades.
  Ve todas las entregas, califica y comenta. Accede a los resúmenes.
- **Estudiante:** ve solo las actividades de **sus** materias. Sube foto y entregas.
  Ve sus propias notas y comentarios. No ve nada de otros estudiantes.

---

## 5. Modelo de datos (tablas)

- **curso** — `id`, `nombre` (ej. "6° A"), `anio`
- **materia** — `id`, `curso_id`, `nombre` (ej. "Electrónica Digital III")
- **estudiante** — `id` (= usuario de Auth), `nombre`, `apellido`, `curso_id`, `foto_url`, `activo`
- **actividad** — `id`, `materia_id`, `titulo`, `consigna` (texto), `archivo_consigna_url` (opcional),
  `fecha_limite`, `creada_en`
- **estudiante** — además: `usuario` (ej. `perez.juan`, generado por el sistema).
- **actividad** — `fecha_limite` es **opcional** (puede ser nula = sin vencimiento).
- **entrega** — `id`, `actividad_id`, `estudiante_id`, `archivo_url`, `comentario_estudiante`,
  `entregado_en`, `nota_num` (1–10, opcional), `nota_concepto` (texto, opcional),
  `comentario_profesor` (opcional), `estado` (`pendiente` / `entregado` / `calificado`).
  La **reentrega** sobrescribe `archivo_url` y `entregado_en` mientras no haya vencido la fecha límite.

> Un estudiante pertenece a un **curso**; las actividades cuelgan de una **materia** del curso.
> Así una actividad llega automáticamente a todos los estudiantes de ese curso.

---

## 6. Buckets de Storage

- `fotos-perfil/` — foto de cada estudiante (privada, con compresión y tope de tamaño).
- `consignas/` — archivos adjuntos a las actividades (los sube Diego).
- `entregas/` — trabajos entregados por los estudiantes.

**Límites para cuidar el espacio (1 GB gratis):** foto máx. ~1 MB (se comprime al subir),
entrega máx. ~10 MB. Formatos permitidos en entregas: PDF, imágenes (JPG/PNG), DOC/DOCX.

---

## 7. Pantallas

### 7.1 Estudiante
1. **Login** — email + contraseña (entregados por Diego).
2. **Mi perfil** — nombre, curso, y **subir/cambiar foto**.
3. **Mis actividades** — lista de las actividades de sus materias, con estado:
   `Pendiente` · `Entregada` · `Calificada (nota)`. Orden por fecha límite.
4. **Detalle de actividad** — ver consigna y adjunto; **subir archivo + comentario**;
   si ya entregó, ver su entrega; si está calificada, ver **nota + comentario del profe**.

### 7.2 Profesor (Diego)
1. **Login** (rol profesor).
2. **Tablero general** — por curso/materia: total de estudiantes, entregas recibidas, faltantes.
3. **Gestión de cursos y materias** — crear/editar.
4. **Gestión de estudiantes** — **importar lista** (pegar/CSV: nombre, apellido, curso),
   el sistema **crea las cuentas** y genera credenciales para entregar. Reset de contraseña.
5. **Gestión de actividades** — crear actividad (título, consigna, adjunto, fecha límite, materia).
6. **Entregas de una actividad** — lista de estudiantes con **quién entregó / quién no**,
   abrir cada entrega (archivo + comentario), poner **nota + comentario**.
7. **Resumen de clase** — % de entrega, promedio de notas, pendientes.

---

## 8. Seguridad y privacidad (manejamos datos de menores)

- Contraseñas encriptadas por Supabase (nunca en texto plano).
- **RLS** estricto: un estudiante no puede leer entregas, fotos ni datos de otro.
- Storage **privado**: los archivos se sirven con enlaces firmados temporales, no públicos.
- Datos personales mínimos (nombre, apellido, curso, foto). Sin datos sensibles innecesarios.
- Solo Diego tiene rol profesor.
- **Gate de acceso:** toda la sección `/aula` exige login. Quien no tenga credenciales no ve
  ningún contenido (ni listas, ni actividades). El **panel de profesor** solo se renderiza para
  la cuenta de Diego (rol verificado en la base, no solo en el frontend). La sección **no se
  enlaza desde la home pública** hasta que Diego lo decida.

---

## 9. Fuera de alcance en la v1 (para más adelante)

- Cuestionarios con corrección automática (multiple choice).
- Mensajería profe ↔ estudiante.
- Exportar notas a planilla.
- Notificaciones por email de nuevas actividades.
- App móvil (la web ya es responsive).

---

## 10. Cómo vamos a construirlo (método loop)

1. **Cerrar esta spec** (revisión de Diego).
2. Diego crea un **proyecto Supabase** gratuito y me pasa las claves (URL + anon key).
3. Construyo por etapas, **verificando cada una** antes de seguir:
   - Etapa A: base de datos + RLS + auth (login de prueba).
   - Etapa B: lado estudiante (perfil, ver actividades, entregar).
   - Etapa C: lado profesor (crear actividades, ver entregas, calificar).
   - Etapa D: importación de estudiantes + resúmenes.
4. Cada etapa: construir → probar contra tu Supabase → corregir → confirmar con vos.

---

## 11. Definiciones confirmadas

- [x] **Nombre:** Aula Catto.
- [x] **Usuarios generados** por el sistema (`apellido.nombre` + contraseña), sin email real.
- [x] **Nota** numérica (1–10) **y** conceptual, más comentario.
- [x] **Reentrega** permitida hasta la fecha límite.
- [x] **Fecha límite** opcional (algunas actividades sin vencimiento).
- [x] **Gate de acceso:** `/aula` detrás de login; panel de profesor solo para Diego.
