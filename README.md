# catto.ar — Sitio personal de Diego Scattaneo

Sitio estático (HTML/CSS/JS, sin frameworks). Mismo esquema que el de la banda:
**GitHub guarda el código → Vercel lo publica → el dominio `catto.ar` apunta a Vercel.**

---

## 📁 Estructura

```
catto-web/
├── index.html                      ← Home (hero, publicaciones, descargas, contacto)
├── 404.html                        ← Página de error
├── robots.txt                      ← Para buscadores
├── vercel.json                     ← Config de Vercel (URLs limpias, caché)
├── assets/
│   ├── css/base.css                ← Estilos compartidos (paleta del dashboard)
│   └── img/                         ← Imágenes/íconos
├── publicaciones/
│   └── mapa-electronica/index.html ← Publicación 1: el dashboard
└── descargas/                       ← Archivos para descargar (PDF, libro, apuntes…)
```

---

## 🚀 Publicar por primera vez (paso a paso)

### 1. Crear el repositorio en GitHub
1. Entrá a <https://github.com/new>.
2. Nombre: `catto-web` (o el que prefieras). Visibilidad: **Public**.
3. **No** marques "Add a README" (ya tenemos uno). Creá el repo.

### 2. Subir esta carpeta al repo
Desde una terminal **dentro de `catto-web/`**:

```powershell
git init
git add .
git commit -m "Sitio inicial catto.ar + dashboard de electronica"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/catto-web.git
git push -u origin main
```

> Reemplazá `TU_USUARIO` por tu usuario de GitHub.

### 3. Conectar Vercel
1. Entrá a <https://vercel.com> con tu cuenta (la misma de la banda).
2. **Add New… → Project → Import** el repo `catto-web`.
3. Framework Preset: **Other** (es un sitio estático, no toca nada más).
4. **Deploy.** En ~20 segundos tenés una URL `catto-web.vercel.app` funcionando.

### 4. Conectar el dominio catto.ar
1. En el proyecto de Vercel: **Settings → Domains → Add** → escribí `catto.ar`.
   Agregá también `www.catto.ar` (Vercel ofrece redirigir uno al otro).
2. Vercel te muestra los registros DNS a cargar. Como `.ar` se gestiona en **NIC.ar**,
   andá a <https://nic.ar> → tu dominio → **Delegación / DNS** y cargá:
   - Lo más simple: usar los **nameservers de Vercel** que te indica
     (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`), o
   - Un registro **A** del apex `catto.ar` → `76.76.21.21` y un **CNAME** de
     `www` → `cname.vercel-dns.com` (Vercel te muestra los valores exactos).
3. La propagación DNS puede tardar de minutos a unas horas. Vercel pone ✅ cuando está listo,
   y emite el certificado HTTPS automáticamente.

---

## 🔄 Cómo actualizar el sitio (el día a día)

Cada vez que cambies algo, repetí:

```powershell
git add .
git commit -m "Describí el cambio"
git push
```

Vercel detecta el push y **redespliega solo**. No hay que hacer nada más.

---

## ➕ Cómo agregar contenido

### Una descarga (libro, apunte, PDF…)
1. Copiá el archivo a la carpeta `descargas/`.
2. En `index.html`, dentro de `<div class="dl-list">`, descomentá/copiá este bloque y editalo:

```html
<a class="dl" href="descargas/mi-libro.pdf" download>
  <span class="di">📕</span>
  <span class="dinfo"><b>Mi libro de Electrónica</b><span>Edición 2026 · PDF</span></span>
  <span class="dsize">12 MB</span>
  <span class="darrow">↓</span>
</a>
```

> ⚠️ GitHub rechaza archivos de **más de 100 MB**. Para libros/videos pesados, conviene
> subirlos a Google Drive / Dropbox y poner el enlace en el `href`. Si más adelante hay
> muchos archivos grandes, te muestro cómo usar Git LFS o almacenamiento externo.

### Una publicación nueva (otro dashboard/artefacto)
1. Creá `publicaciones/nombre-corto/index.html` con tu nuevo artefacto.
2. En `index.html`, dentro de `<div class="cards">` de la sección Publicaciones,
   duplicá la tarjeta `<a class="card link">` y apuntala a la nueva carpeta.

El **administrador de estudiantes** que querés armar más adelante entra acá como una
publicación más (ya está reservada su tarjeta "Próximamente" en la home).

---

## 🎨 Estilo
Todo el sitio usa la paleta del dashboard original (tema oscuro tipo GitHub) definida en
`assets/css/base.css`. Cambiando las variables de `:root` ahí, cambia todo el sitio de una.
