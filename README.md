<div align="center">

# 🪪 CV Web + Links + Biblioteca

**Una página personal (CV navegable + hub de enlaces) totalmente modular y multi-tema, con una Biblioteca generada desde Markdown.**

Editás tres archivos JSON para el portfolio y archivos Markdown para la Biblioteca. Sin frameworks ni backend. Python genera el sitio para publicar; **html2pdf.js** (incluida en el repo) permite exportar el CV a PDF.

![Build](https://img.shields.io/badge/build-Python-22c55e?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-f7df1e?style=flat-square)
![Dependencias](https://img.shields.io/badge/runtime-html2pdf.js-8b5cf6?style=flat-square)
![Temas](https://img.shields.io/badge/temas-5-e11d48?style=flat-square)
![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages%20%C2%B7%20Docker-222?style=flat-square)

</div>

---

## 📑 Contenido

- [Qué es](#-qué-es)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Publicar en la Biblioteca](#-publicar-en-la-biblioteca)
- [Cómo armar tu propia página](#-cómo-armar-tu-propia-página)
- [Despliegue](#-despliegue)
  - [Desarrollo local](#1-desarrollo-local)
  - [Docker (imagen liviana)](#2-docker-imagen-liviana)
  - [GitHub Pages](#3-github-pages)
- [Configuración: secciones y temas](#-configuración-secciones-y-temas)
- [Decisiones de diseño y arquitectura](#-decisiones-de-diseño-y-arquitectura)
- [Solución de problemas](#-solución-de-problemas)

---

## 🎯 Qué es

Una web personal con tres propósitos:

1. **CV en formato web** — navegable, elegante, con scroll a anclas y navegación lateral.
2. **Hub de accesos rápidos** — tus enlaces favoritos agrupados por categoría.
3. **Biblioteca pública** — notas, documentos, noticias y lecturas desde Markdown, con índice y páginas independientes.

El portfolio carga contenido y configuración desde JSON en el navegador. La Biblioteca se genera desde Markdown durante el build: sus páginas ya contienen el texto al publicarse. Ambos comparten la navegación y los temas. Para publicar contenido, editás JSON o Markdown.

Inspiración visual: el tema **Anuppuccin** de Obsidian (Catppuccin + tipografía editorial).

---

## ✨ Características

- 🧩 **100% modular** — contenido, estructura y temas separados en JSON.
- 🌐 **Bilingüe (es/en)** — un archivo de contenido por idioma y un selector ES/EN en el sidebar que cambia el idioma en vivo, sin recargar. Persiste en `localStorage`.
- 🎨 **5 temas** — Latte (claro), Mocha (oscuro), Terminal (CRT), 8-bit (NES) y D&D 3.5 (pergamino). Persisten en `localStorage`.
- 🖼️ **Retrato por tema** — cada tema puede mostrar su propia imagen.
- 🧭 **Sidebar dinámica** — se construye desde config; secciones y temas se activan/desactivan con un flag.
- 📐 **Sin scroll en la sidebar** — el contenido se autoescala para entrar completo en cualquier alto de pantalla.
- 📄 **Descargar CV en PDF** — botón en el sidebar que genera un PDF del CV respetando el tema activo (vía html2pdf.js, incluida en el repo).
- ⚡ **Runtime estático** — HTML + CSS + JavaScript vanilla. El build Python genera únicamente la Biblioteca y empaqueta el sitio; no hay backend.
- 📚 **Biblioteca** — Markdown con frontmatter, índice por fecha, búsqueda y etiquetas; páginas de lectura que comparten los temas del portfolio.
- ♿ **Accesible** — respeta `prefers-reduced-motion`, navegación por teclado y `aria-label`.

---

## 🏛️ Arquitectura

El principio rector es **máxima modularidad**: tres ejes completamente desacoplados, cada uno en su propio archivo, leídos por su propio script.

```
                      ┌──────────────────────────────┐
                      │          index.html           │
                      │   esqueleto + CSS (tokens)    │
                      └───────────────┬───────────────┘
                                      │ fetch()  (cache: no-cache)
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   me/content.{es,en}.json     config/site.json           config/theme.json
     CONTENIDO                  ESTRUCTURA                  APARIENCIA
   (CV, hub, textos)      (secciones, sidebar, idiomas)   (temas, retratos)
          │                           │                           │
          ▼                           ▼                           ▼
 content-renderer.js          site-config.js              theme-loader.js
```

| Eje | Archivo | Lo lee | Responsabilidad |
|-----|---------|--------|-----------------|
| **Contenido** | `me/content.es.json` · `me/content.en.json` | `content-renderer.js` | Perfil, experiencia, formación, skills, proyectos, recursos, contacto y encabezados (un archivo por idioma) |
| **Estructura** | `config/site.json` | `site-config.js` | Qué secciones existen, su orden, grupos y visibilidad; idiomas y selector; switchers |
| **Apariencia** | `config/theme.json` | `theme-loader.js` | Temas disponibles, tema por defecto, retratos, botones |

La Biblioteca añade una fuente independiente:

| Fuente | Procesa | Resultado |
|--------|---------|-----------|
| `me/archive/content/*.md` + frontmatter | `tools/build_site.py` durante el build | `dist/archive/index.html` y `dist/archive/<slug>/index.html` |
| `me/archive/assets/` | Copia durante el build | `dist/archive/assets/` |

El navegador recibe HTML generado para las entradas. JavaScript solo añade búsqueda, filtros y temas. El build empaqueta también el portfolio, las guías y la política de privacidad en `dist/`, sin incluir los Markdown fuente.

> **¿Por qué separar en tres?** Para que cada tipo de cambio tenga **un único lugar**: actualizar tu CV no toca la apariencia; agregar un tema no toca el contenido; reordenar el menú no toca nada de lo demás. El HTML y el CSS quedan estables; los datos cambian por su cuenta. Es el patrón de *separación de responsabilidades* llevado a archivos de configuración.

El CSS **nunca tiene valores hardcodeados**: todo literal vive en `styles/tokens.css` como variable (`--color-bg`, `--font-display`, etc.). Cambiar un tema = redefinir variables, no reescribir reglas.

---

## 📂 Estructura del proyecto

```text
.
├── index.html                 # Portfolio: esqueleto cargado desde JSON
├── me/
│   ├── content.{es,en}.json   # CV, proyectos y recursos por idioma
│   ├── favicon-*.png
│   ├── images/                # Retratos y previews sociales
│   └── archive/
│       ├── content/*.md        # Entradas fuente con frontmatter YAML
│       └── assets/             # Imágenes y documentos de la Biblioteca (opcional)
├── guias/                     # Guías HTML existentes
├── focustube-privacy.html      # URL pública conservada
├── config/
│   ├── site.json              # Navegación, idiomas y enlace a la Biblioteca
│   └── theme.json             # Temas y retratos
├── scripts/
│   ├── content-renderer.js    # Contenido del portfolio
│   ├── site-config.js         # Navegación por anclas y páginas
│   ├── theme-loader.js        # Temas compartidos
│   ├── archive.js             # Búsqueda y filtros de la Biblioteca
│   └── pdf-export.js          # Exportación del CV
├── styles/                    # Tokens, layout y componentes compartidos
│   └── archive.css            # Índice y tipografía de lectura
├── vendor/html2pdf.bundle.min.js
├── tools/build_site.py        # Valida Markdown y genera el sitio estático
├── tests/test_archive.py      # Pruebas del build y las entradas
├── requirements-build.txt     # Dependencias Python del build
├── .github/workflows/pages.yml # Validación y despliegue de dist/
├── Dockerfile                 # Build Python + servidor nginx
└── dist/                      # Generado, ignorado por Git
    ├── index.html             # Portfolio y sus assets
    ├── archive/index.html     # Índice de entradas publicadas
    ├── archive/<slug>/index.html # Página de lectura
    └── archive/assets/        # Assets publicados
```

> Editás `me/content.{es,en}.json` para el portfolio y `me/archive/content/*.md` para publicar notas. El HTML de `dist/` se genera; no se edita.
>
> **Todo lo que es tuyo vive en `me/`**: textos, imágenes y favicons. `config/` no es contenido personal sino configuración del sitio (qué secciones existen, qué temas hay); la tocás solo si querés cambiar el comportamiento, no tus datos.
>
> ⚠️ **Única excepción:** las etiquetas `<title>`, `description` y Open Graph del `<head>` de `index.html` llevan tu nombre y la URL de tu sitio hardcodeados. No pueden salir de ahí porque los crawlers de WhatsApp, LinkedIn y Slack **no ejecutan JavaScript**: si se inyectaran desde `me/`, las previews al compartir tu link se verían vacías. Son 7 líneas, están comentadas en el archivo.

---

## 🛠️ Cómo armar tu propia página

1. **Cloná o usá este repo como plantilla.**
2. **Editá `me/content.es.json`** (y `content.en.json` si querés versión en inglés) con tus datos: nombre, bio, experiencia, formación, skills, proyectos, recursos y contacto.
3. **Subí tus retratos** a `me/images/` (uno por tema, ver [retratos](#retratos-por-tema)), y reemplazá `me/images/og-image.jpg` y los `me/favicon-*.png` por los tuyos.
4. **Actualizá el `<head>` de `index.html`**: el `<title>`, la `description` y las etiquetas Open Graph / Twitter con tu nombre, tu rol y la URL de tu sitio. Es lo único personal fuera de `me/`, y está comentado en el archivo explicando por qué.
5. *(Opcional)* **Ajustá `config/site.json`** si querés cambiar etiquetas del menú, agrupaciones, esconder secciones o configurar los idiomas.
6. *(Opcional)* **Personalizá `config/theme.json`**: elegí el tema por defecto, ocultá los que no quieras.
7. **Levantá un servidor** (ver [Despliegue](#-despliegue)) — recordá que **no funciona abriendo el `.html` con doble clic** (ver [por qué](#por-qué-hace-falta-un-servidor)).

Salvo esas etiquetas del `<head>`, no hace falta tocar HTML, CSS ni JavaScript.

---

## 🚀 Despliegue

### ¿Por qué hace falta un servidor?

La página carga su contenido con `fetch()` de los archivos JSON. Por seguridad, los navegadores **bloquean `fetch` cuando la página se abre como archivo local** (`file://`). Por eso necesitás servirla por **HTTP**, tanto en desarrollo como en producción. (GitHub Pages, Docker o cualquier servidor estático ya cumplen esto.)

---

### 1. Desarrollo local

Cualquier servidor estático sirve. El más a mano, con Python:

```bash
python3 -m pip install -r requirements-build.txt
python3 tools/build_site.py
python3 -m http.server 8000 --directory dist
```

Abrí **http://localhost:8000**.

> **¿Trabajás dentro de un contenedor/VM remota?** `localhost` apunta a tu máquina, no al contenedor. Accedé por la IP de red del contenedor (`http://<ip-del-contenedor>:8000`) o reenviá el puerto (VS Code → pestaña *Ports*; o SSH con `-L 8000:localhost:8000`).

Después de editar JSON, Markdown, estilos o scripts, ejecutá `python3 tools/build_site.py` de nuevo y recargá con `F5` (el servidor local sirve `dist/`). Los loaders usan `cache: "no-cache"`, así que el navegador revalida y ves el cambio sin *hard refresh*.

---

### 2. Docker (imagen liviana)

La imagen final sirve un sitio **100% estático** con `nginx:alpine`. Una etapa previa con Python instala las dependencias y genera `dist/`; esas dependencias no pasan a la imagen final.

El `Dockerfile` incluido genera el sitio en una etapa Python y sirve `dist/` con nginx.

**Construir y correr:**

```bash
docker build -t cv-web .
docker run --rm -p 8080:80 cv-web
# → http://localhost:8080
```

### 3. GitHub Pages

La opción más simple para publicarlo gratis:

1. Subí el repo a GitHub.
2. **Settings → Pages**.
3. En *Source* elegí **GitHub Actions**. El workflow `.github/workflows/pages.yml` valida y genera `dist/`, y publica al hacer push a `main`. Los PR solo construyen y validan.
4. Guardá. En ~1 minuto estará en `https://<usuario>.github.io/<repo>/`.

**Migración desde el despliegue anterior:** es obligatorio cambiar *Source* de **Deploy from a branch** a **GitHub Actions**. Si quedan activos ambos métodos, Jekyll puede publicar la raíz del repo después del build Python y sobrescribir el sitio: la sidebar aparece pero `/archive/` devuelve 404.

Después de cambiar *Source*, abrí **Actions → Build and deploy static site → Run workflow → main** para regenerar y publicar. No uses el workflow antiguo “pages build and deployment”. El nuevo workflow comprueba esta configuración antes de publicar.

La URL esperada de la Biblioteca es `https://guillepee.github.io/Personal_page/archive/`. GitHub Pages sirve `dist/` por HTTP, con las rutas relativas del portfolio y de la Biblioteca.

> ⚠️ **Lo que editás localmente no aparece en Pages hasta que hagas `git push`.** Y tras pushear, el deploy tarda ~1 min y el navegador puede cachear: si no ves el cambio, `Ctrl+Shift+R`.

---

## ⚙️ Configuración: secciones y temas

### Activar / desactivar secciones

En `config/site.json`, cada sección tiene un flag `visible`. Ponelo en `false` para esconderla (desaparece del menú **y** del contenido):

```json
{ "id": "resources", "label": { "es": "Links", "en": "Links" }, "icon": "bookmark", "group": "Hub", "visible": false }
```

| Campo | Qué hace |
|-------|----------|
| `label` | Texto del enlace en el sidebar |
| `icon` | Ícono (`home`, `briefcase`, `education`, `skills`, `grid`, `bookmark`, `mail`) |
| `group` | Encabezado que agrupa secciones en el sidebar (ej. `CV`, `Hub`, `Otros`) |
| `visible` | `true` / `false` para mostrar u ocultar |

Otros flags globales en `site.json`:

| Flag | Efecto |
|------|--------|
| `show_theme_switcher` | `false` esconde **todos** los controles de tema |
| `show_language_switcher` | `false` esconde el selector de idioma |

### Idiomas (es / en)

El contenido vive en un archivo por idioma (`me/content.es.json`, `me/content.en.json`), ambos con la **misma estructura**. El idioma activo se guarda en `localStorage` (`es` por defecto) y se cambia con el selector del sidebar, **en vivo, sin recargar**. Las etiquetas del menú y los nombres de grupo se traducen desde `site.json` (`sections[].label.{es,en}` y `groupLabels`).

**Añadir un idioma** son 3 pasos en JSON, sin tocar JS ni HTML:

1. Creá `me/content.<idioma>.json` (copiá uno existente y traducí los textos).
2. En `site.json`, agregalo a `languages` y a cada entrada de `groupLabels`:
   ```json
   "languages": { "es": { "name": "Español", "label": "ES" }, "fr": { "name": "Français", "label": "FR" } }
   ```
3. En `site.json`, añadí su clave en cada `sections[].label` (ej. `"label": { "es": "Inicio", "fr": "Accueil" }`).

> `show_language_switcher: false` oculta el selector (la página queda en el idioma guardado).

### Activar / desactivar temas

En `config/theme.json`, cada tema también tiene `visible`:

```json
"dnd35": { "name": "D&D 3.5", "type": "special", "visible": false, "label": "D&D", "dot": "#8b1a1a", "portrait": "me/images/portrait-dnd35.jpg" }
```

- `type`: `base` (botón de modo de selección directa, como Light/Dark) o `special` (botón propio que se activa/desactiva).
- `visible: false`: oculta el botón. Si alguien lo tenía activo, la página cae sola al tema base.
- `dot`: color del puntito identificador del botón.
- `default_mode` (raíz del archivo): tema con el que arranca la página.

### Retratos por tema

Cada tema referencia su imagen en `theme.json` (`"portrait": "me/images/portrait-<tema>.jpg"`). Subí las imágenes a `me/images/`:

| Propiedad | Recomendación |
|-----------|---------------|
| **Aspecto** | **3:4 vertical** (obligatorio para no deformar) |
| **Resolución** | ~750×1000 o 900×1200 px |
| **Formato** | `.webp` o `.jpg` |
| **Peso** | < ~200 KB cada una |

Si una imagen falta o falla, se muestra un **placeholder SVG** automáticamente (no rompe nada).

### Añadir un tema nuevo

1. En `styles/tokens.css`, agregá un bloque con las variables del tema:
   ```css
   [data-theme="mi-tema"] {
     --color-bg: …; --color-text: …; --color-accent: …;
     /* + el resto de variables semánticas */
   }
   ```
2. En `config/theme.json`, registralo:
   ```json
   "mi-tema": { "name": "Mi Tema", "type": "special", "visible": true, "label": "Mi", "dot": "#abcdef" }
   ```

El botón se genera solo. **No tocás JS ni HTML.**

---

## 🧠 Decisiones de diseño y arquitectura

<details>
<summary><strong>Carga de datos con <code>fetch</code> (no módulos ES)</strong></summary>

Ambas opciones requieren servidor (los módulos ES tampoco funcionan con `file://`). `fetch` es más simple, universal y funciona en GitHub Pages sin configuración. Se usa con `cache: "no-cache"` para que al editar un JSON el cambio se vea con un `F5` normal.
</details>

<details>
<summary><strong>Render con <em>template literals</em> (no <code>&lt;template&gt;</code> tags)</strong></summary>

Los scripts arman el HTML con funciones que devuelven *template strings* y se insertan con `innerHTML`. Es más legible y conciso que clonar `<template>` y rellenar campo por campo. Es seguro porque los datos son propios (no entrada externa). Los iconos SVG viven en los scripts (son presentación, no contenido).
</details>

<details>
<summary><strong>Los colores de los temas viven en CSS, no en el JSON (enfoque híbrido)</strong></summary>

Aunque la apariencia es "configurable", los **colores y fuentes se quedan en `tokens.css`**, no se inyectan desde el JSON. ¿Por qué? Inyectar la apariencia por `fetch` (asíncrono) provoca **FOUC** (un parpadeo con el tema equivocado mientras carga el JSON). Manteniendo los colores en CSS, el tema correcto se aplica al instante. `theme.json` define **qué** temas hay y cómo aparecen; `tokens.css` define **cómo** se ven. Un script síncrono en el `<head>` aplica el tema guardado antes de pintar (anti-parpadeo).
</details>

<details>
<summary><strong>Sidebar que se autoescala (sin scroll)</strong></summary>

El contenido de la sidebar debe verse completo sin desplazamiento, en cualquier alto de pantalla y en cualquier tema (algunas fuentes, como la de 8-bit, son enormes). En vez de permitir scroll, el contenido se envuelve y se escala con `transform: scale()` calculado en runtime, de modo que siempre entra. Se recalcula al cambiar de tamaño, de tema o al cargar las fuentes.
</details>

<details>
<summary><strong>Navegación por scroll a anclas + scrollspy</strong></summary>

No es una SPA: es scroll a secciones con anclas, con un `IntersectionObserver` que resalta el enlace activo. Más simple, mejor para SEO y funciona aunque el JS de navegación no cargue. Los `nav-links` se consultan en vivo porque el menú se genera de forma asíncrona.
</details>

<details>
<summary><strong>Coordinación entre scripts por eventos</strong></summary>

Los tres scripts son independientes y se comunican por eventos del DOM: `site-config` emite `sidebar:rendered` y `theme-loader` emite `theme:changed`; el escalado de la sidebar escucha ambos para recalcularse. Así nadie depende del orden de carga del otro.
</details>

<details>
<summary><strong>Exportación a PDF con html2pdf.js (vendored)</strong></summary>

El botón "Descargar CV en PDF" usa **html2pdf.js**, que rasteriza el DOM (html2canvas) y lo arma en un PDF (jsPDF). Se eligió frente a la impresión nativa (`window.print`) por la descarga directa de un clic. La librería se incluye en `vendor/` (no por CDN) para que funcione offline y sin depender de un tercero en runtime.

Consecuencias de rasterizar el DOM:
- **Favicons con CORS**: html2canvas no puede capturar imágenes de otro origen salvo que el servidor mande cabeceras CORS. Por eso los favicons de los recursos se cargan de **icon.horse** (que responde con `Access-Control-Allow-Origin: *`) con `crossorigin="anonymous"`: así se ven en pantalla **y** en el PDF, sin descargar ni mantener archivos. Agregar un recurso con su `url` basta para que aparezca su icono.
- **Esperar las imágenes**: `pdf-export.js` espera a que las imágenes terminen de cargar antes de capturar; si html2canvas mide el alto con favicons a medias, la paginación se rompe (páginas en blanco).
- **Ajustes solo-PDF por clase**: como no se usa `@media print`, los retoques exclusivos del PDF se aplican con la clase `is-pdf-export` (la pone `pdf-export.js` solo durante la captura y la quita al terminar). Hoy se usa para ocultar la línea de la timeline, que rasterizada quedaba como una raya en el margen.
</details>

---

## 🩹 Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| La página carga vacía / sin contenido | Abierta como `file://` | Servila por HTTP (ver [Despliegue](#-despliegue)) |
| Edité un JSON y no se actualiza | Caché del navegador | `Ctrl+Shift+R`, o DevTools → Network → *Disable cache* |
| Biblioteca devuelve 404 aunque el build pasó | Un despliegue antiguo de Jekyll sobrescribió `dist/` | En Settings → Pages elegí GitHub Actions y ejecutá el nuevo workflow |
| El cambio no aparece en GitHub Pages | Falta `git push` o el deploy tarda | Pushear y esperar ~1 min; luego `Ctrl+Shift+R` |
| El retrato no aparece | Falta la imagen o el nombre no coincide | Verificá `me/images/portrait-<tema>.jpg`; mientras tanto se ve el placeholder |
| `404` en consola por una imagen | El retrato de ese tema aún no se subió | Es benigno (cae al placeholder); desaparece al subir la imagen |

---

<div align="center">

Hecho con HTML, CSS y JavaScript vanilla — sin frameworks ni backend.

</div>


## 📚 Publicar en la Biblioteca

1. Copiá `me/archive/content/plantilla.md` a otro `.md` en la misma carpeta.
2. Editá título, descripción, fecha, etiquetas y contenido. Usá un `slug` único de letras minúsculas, números y guiones: define la URL estable `archive/<slug>/`.
3. Cambiá `published` a `true` y hacé commit + push. GitHub Actions generará el HTML y actualizará el índice automáticamente.

```yaml
---
title: Una idea que quiero conservar
description: Un resumen breve para el índice.
date: 2026-10-05
slug: una-idea
tags: [IA, Desarrollo]
type: note
lang: es
published: true
source: https://example.com/original
---
```

`type`: `note`, `article`, `link`, `document`, `news` o `guide`. `source` es opcional y enlaza al original; no descarga contenido. `lang` identifica el idioma real del texto, no lo traduce. La interfaz de la Biblioteca comparte el selector ES/EN y la preferencia guardada del portfolio. Sus textos viven en `me/content.es.json` y `me/content.en.json`, bajo `archive`. Cambiar la interfaz no traduce las entradas: títulos, etiquetas y cuerpos conservan el idioma de cada Markdown.

Escribí el cuerpo desde `##`: el título principal viene del frontmatter. Soporta Markdown CommonMark, tablas y bloques de código; HTML crudo se muestra como texto. No ejecuta scripts, Mermaid ni extensiones de Obsidian. El conversor vive detrás de `render_markdown()` en `tools/build_site.py`, listo para sustituirlo por un motor compartido con `markdown-to-html` cuando se revise su contrato.

Guardá imágenes/PDF en `me/archive/assets/` y enlazalos como `[Documento](archive/assets/documento.pdf)` o `![Descripción](archive/assets/imagen.png)`. Los enlaces se resuelven desde la raíz del sitio, incluso en GitHub Pages bajo `/Personal_page/`.

Los archivos con `published: false` o sin `published: true` quedan fuera de `dist/`, **pero siguen visibles en el repositorio público**. Conservá las notas privadas fuera del repo. No edites el HTML de `dist/`: se regenera y elimina páginas antiguas al retirar o renombrar una entrada. Los slugs deben mantenerse estables si ya compartiste su enlace.

El build falla con un mensaje si una entrada publicada tiene metadatos inválidos o un slug duplicado. La plantilla incluida es un borrador: la primera publicación comienza con el índice vacío. El índice y los artículos se pueden leer sin JavaScript; búsqueda, filtros y cambio de temas se activan con JavaScript.

Verificación local:

```bash
python3 -m unittest discover -s tests
node tests/test_archive_i18n.cjs
python3 tools/build_site.py
```
