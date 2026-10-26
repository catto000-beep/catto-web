# Aula Catto para varios docentes — diseño

Fecha: 25/10/2026. Estado: **etapa 1 aplicada el 25/10/2026** (respaldo previo en el esquema
`respaldo_20261025`; pruebas de aislamiento pasadas; las dos Edge Functions desplegadas).

Al aplicarla apareció un problema y quedó corregido: las columnas de autoría (`curso.creado_por`,
`materia.creada_por`, `escuela.creada_por`) tenían clave foránea a `perfil`, y la API dejó de poder
resolver «el curso del estudiante» (dos caminos entre perfil y curso, error PGRST201). Se quitaron esas
claves; el script ya está corregido. La respuesta de error (HTTP 300) quedó en la caché del navegador
de Diego unos minutos; se renovó a mano.

## La idea

Cada profesor da su materia. Varios profesores pueden dar materias distintas en el mismo curso, y
una materia puede tener más de un docente (pareja pedagógica, MEP de taller). Diego modera todo:
aprueba a cada profesor, cada escuela nueva y cada curso nuevo.

```
escuela ──< curso ──< materia >──< materia_docente >── profesor
              │          │
           alumnos    actividad ──< entrega
```

## Quién ve qué

| Rol | Ve | No ve |
|---|---|---|
| **Admin** (Diego) | Todo, como hoy | — |
| **Profesor aprobado** | Escuelas y cursos aprobados (para elegir en el menú), todas las materias por nombre, los alumnos de los cursos donde da clase y las actividades, entregas y notas **de sus materias** | Las actividades, entregas y notas de las materias de otros profesores, aunque sean del mismo curso; los alumnos de cursos donde no da clase |
| **Profesor pendiente** | Su propio perfil, las escuelas y los cursos aprobados (para elegir) | Alumnos, actividades, entregas |
| **Estudiante** | Su perfil, su curso, las materias y actividades de su curso, sus propias entregas | Lo de sus compañeros y lo de otros cursos |
| **Cuenta del foro** (sin perfil del Aula) | Nada del Aula | — |

## Etapas

1. **Base de datos** (esta): tablas nuevas, migración de los datos actuales, reglas de acceso
   nuevas y las dos Edge Functions ajustadas. **El panel actual sigue funcionando igual para Diego**,
   porque como admin ve todo.
2. **Registro y aprobación**: página de alta del profesor, menús escuela → curso → materia, y la cola
   de aprobación en el panel de Diego.
3. **Panel del profesor**: cada uno ve solo sus materias; la importación de la libreta crea usuarios
   con prefijo de escuela; pantalla de «cuenta pendiente».
4. **Términos y privacidad**, y prueba con un profesor real.

## Etapa 2: pedidos y aprobación (25/10/2026, aplicada en la base)

- `aula/db/multi-docente-2.sql`: los pedidos van en `aula_priv.solicitud` (esquema que la API no expone) y se manejan
  solo con funciones: `pedir_materia`, `mis_solicitudes`, `cancelar_solicitud` (profesor) y `solicitudes_pendientes`,
  `profesores_pendientes`, `aprobar_solicitud`, `rechazar_solicitud`, `rechazar_profesor` (admin). Aprobar crea la
  escuela, el curso o la materia que falten, con el profesor como autor y docente (no Diego: los automatismos se
  apagan durante la aprobación con `aula.aprobando`). Pruebas: `multi-docente-2-pruebas.sql`, pasadas.
- `aula/registro.html`: entrar con Google → nombre y apellido → pedir materias (buscador de las 239 escuelas,
  cursos existentes o uno nuevo, materia nueva con sugerencias de los planes o sumarse a una existente como pareja).
- Ingreso del Aula: botón para profesores; una cuenta en revisión va a su pedido, no al panel.
- Panel de Diego: sección «Pedidos de profesores» con aprobar y rechazar.
- Requiere en Supabase → Authentication → URL Configuration la dirección `https://catto.ar/aula/registro**`.

## Etapa 1: archivos

| Archivo | Qué hace |
|---|---|
| `aula/db/multi-docente-1.sql` | La migración. Todo dentro de una transacción: si algo falla, no queda nada a medias |
| `aula/db/multi-docente-1-pruebas.sql` | Pruebas de aislamiento con usuarios ficticios, dentro de una transacción que se deshace al final: no deja rastro |
| `aula/db/multi-docente-1-volver.sql` | Vuelta atrás: restituye las reglas de acceso anteriores |
| `aula/functions/*/index.ts` | Las dos Edge Functions, ahora con control de escuela y curso |

### Cambios en la base

- **Tablas nuevas:** `escuela` (nombre, localidad, CUE, código para el prefijo de usuarios, estado) y
  `materia_docente` (qué profesores dan cada materia: titular o pareja pedagógica).
- **`perfil`:** suma `admin` (solo Diego) y `estado` (`pendiente`, `aprobado`, `rechazado`,
  `suspendido`). Los estudiantes quedan siempre `aprobado`.
- **`curso`:** suma `escuela_id`, `estado` y `creado_por`. **`materia`:** suma `creada_por`.
- **Migración:** se crea la escuela de Diego, todos los cursos actuales pasan a esa escuela, todas las
  materias actuales quedan a cargo de Diego y su perfil se marca como admin.
- **Funciones auxiliares:** `es_admin()`, `es_profesor()` (ahora exige estar aprobado),
  `es_profesor_registrado()` (pendiente o aprobado), `es_miembro_aula()` (ahora sin profesores
  pendientes), `mi_curso()`, `mis_materias()`, `mis_cursos()`, `mis_actividades()`,
  `actividades_de_mi_curso()` y `es_alumno_mio(uid)`.
- **Automatismos (triggers):** quien crea una materia queda como su docente; un curso o una escuela
  creados por alguien que no es admin nacen pendientes; un perfil no puede cambiarse a sí mismo el rol,
  el estado, el usuario ni la marca de admin.
- **Alta de profesores:** la función `solicitar_alta_profesor(nombre, apellido)` crea el perfil
  pendiente. Es la única vía, para que nadie se dé rol de profesor solo.

### Un agujero que ya existe hoy y esta etapa cierra

La regla actual `perfil_upd_self` deja que cada usuario actualice **cualquier columna** de su propio
perfil, y no hay nada que lo impida a nivel de columnas. Por cómo está escrita, un estudiante con
conocimientos podría cambiarse el `rol` a `profesor` desde la consola del navegador y ver todo el
Aula. **No lo probé** (no tengo acceso a la base), pero la regla lo permite. El trigger nuevo
`proteger_perfil` lo cierra.

### Lo que queda para las etapas siguientes

- Los adjuntos de las consignas (bucket `consignas`) siguen legibles por cualquier miembro del Aula
  que conozca la ruta exacta. Para separarlos por materia hay que cambiar la ruta en que se guardan
  (etapa 3).
- Un profesor que entra hoy al panel con la cuenta pendiente ve el panel vacío; la pantalla de
  «tu cuenta está en revisión» es de la etapa 2.
- Los usuarios de estudiantes todavía no llevan prefijo de escuela (etapa 3).

## Cómo ejecutar la etapa 1

1. Hacer una copia: Supabase → Database → Backups (o exportar las tablas desde el Table Editor).
2. En `multi-docente-1.sql`, cambiar el nombre y la localidad de tu escuela (está marcado al
   principio) y correrlo entero en SQL Editor.
3. Correr `multi-docente-1-pruebas.sql`. Tiene que terminar con «TODAS LAS PRUEBAS PASARON». Si
   alguna falla, avisa y se corre `multi-docente-1-volver.sql`.
4. Volver a desplegar las dos Edge Functions con el código nuevo (pegar cada `index.ts` en
   Supabase → Edge Functions, como la primera vez).
5. Entrar al Aula como siempre y comprobar que ves todo igual que antes.
