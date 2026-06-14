<div align="center">

# 🪪 CV Web + Hub de Recursos

**Una página personal (CV navegable + hub de enlaces) totalmente modular, multi-tema y sin build step.**

Editás tres archivos JSON y tenés tu propia página. Sin frameworks, sin compilación, sin dependencias.

![Build](https://img.shields.io/badge/build-ninguno-22c55e?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-f7df1e?style=flat-square)
![Sin dependencias](https://img.shields.io/badge/dependencias-0-8b5cf6?style=flat-square)
![Temas](https://img.shields.io/badge/temas-5-e11d48?style=flat-square)
![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages%20%C2%B7%20Docker-222?style=flat-square)

</div>

---

## 📑 Contenido

- [Qué es](#-qué-es)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Estructura del proyecto](#-estructura-del-proyecto)
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

Una web personal con dos propósitos:

1. **CV en formato web** — navegable, elegante, con scroll a anclas y navegación lateral.
2. **Hub de accesos rápidos** — tus enlaces favoritos agrupados por categoría.

Lo distintivo: **todo el contenido, la estructura y la apariencia viven en archivos JSON**. El HTML es un esqueleto vacío que se rellena en tiempo de ejecución. Para hacerla tuya, **no tocás código**: editás JSON.

Inspiración visual: el tema **Anuppuccin** de Obsidian (Catppuccin + tipografía editorial).

---

## ✨ Características

- 🧩 **100% modular** — contenido, estructura y temas separados en JSON.
- 🎨 **5 temas** — Latte (claro), Mocha (oscuro), Terminal (CRT), 8-bit (NES) y D&D 3.5 (pergamino). Persisten en `localStorage`.
- 🖼️ **Retrato por tema** — cada tema puede mostrar su propia imagen.
- 🧭 **Sidebar dinámica** — se construye desde config; secciones y temas se activan/desactivan con un flag.
- 📐 **Sin scroll en la sidebar** — el contenido se autoescala para entrar completo en cualquier alto de pantalla.
- ⚡ **Sin build, sin dependencias** — HTML + CSS + JavaScript vanilla. Abre con un servidor estático.
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
   data/content.json           config/site.json           config/theme.json
     CONTENIDO                  ESTRUCTURA                  APARIENCIA
   (CV, hub, textos)        (secciones, sidebar)        (temas, retratos)
          │                           │                           │
          ▼                           ▼                           ▼
 content-renderer.js          site-config.js              theme-loader.js
```

| Eje | Archivo | Lo lee | Responsabilidad |
|-----|---------|--------|-----------------|
| **Contenido** | `data/content.json` | `content-renderer.js` | Perfil, experiencia, formación, skills, proyectos, recursos, contacto y encabezados |
| **Estructura** | `config/site.json` | `site-config.js` | Qué secciones existen, su orden, grupos y visibilidad; idioma; switchers |
| **Apariencia** | `config/theme.json` | `theme-loader.js` | Temas disponibles, tema por defecto, retratos, botones |

> **¿Por qué separar en tres?** Para que cada tipo de cambio tenga **un único lugar**: actualizar tu CV no toca la apariencia; agregar un tema no toca el contenido; reordenar el menú no toca nada de lo demás. El HTML y el CSS quedan estables; los datos cambian por su cuenta. Es el patrón de *separación de responsabilidades* llevado a archivos de configuración.

El CSS **nunca tiene valores hardcodeados**: todo literal vive en `styles/tokens.css` como variable (`--color-bg`, `--font-display`, etc.). Cambiar un tema = redefinir variables, no reescribir reglas.

---

## 📂 Estructura del proyecto

```
.
├── index.html                 # Esqueleto + carga de scripts y CSS
├── data/
│   └── content.json           # ← Tu CV y tus enlaces
├── config/
│   ├── site.json              # ← Secciones, sidebar, visibilidad
│   └── theme.json             # ← Temas, tema por defecto, retratos
├── scripts/
│   ├── content-renderer.js    # Rellena el contenido (template literals)
│   ├── site-config.js         # Construye la navegación del sidebar
│   └── theme-loader.js        # Toggle de temas + botones + retrato
├── styles/
│   ├── tokens.css             # Variables + paletas de los 5 temas
│   ├── base.css               # Reset y estilos globales
│   ├── layout.css             # Sidebar + main + responsive
│   ├── components.css         # Componentes (hero, timeline, chips…)
│   └── main.css               # Orquestador de @import
└── assets/
    └── images/                # ← Tus retratos: portrait-<tema>.jpg
```

> Lo que editás vos está marcado con ←. **El resto no se toca** para personalizar tu página.

---

## 🛠️ Cómo armar tu propia página

1. **Cloná o usá este repo como plantilla.**
2. **Editá `data/content.json`** con tus datos: nombre, bio, experiencia, formación, skills, proyectos, recursos y contacto.
3. **Ajustá `config/site.json`** si querés cambiar etiquetas del menú, agrupaciones o esconder secciones.
4. **Personalizá `config/theme.json`**: elegí el tema por defecto, ocultá los que no quieras.
5. **Subí tus retratos** a `assets/images/` (uno por tema, ver [retratos](#retratos-por-tema)).
6. **Levantá un servidor** (ver [Despliegue](#-despliegue)) — recordá que **no funciona abriendo el `.html` con doble clic** (ver [por qué](#por-qué-hace-falta-un-servidor)).

No hace falta tocar HTML, CSS ni JavaScript.

---

## 🚀 Despliegue

### ¿Por qué hace falta un servidor?

La página carga su contenido con `fetch()` de los archivos JSON. Por seguridad, los navegadores **bloquean `fetch` cuando la página se abre como archivo local** (`file://`). Por eso necesitás servirla por **HTTP**, tanto en desarrollo como en producción. (GitHub Pages, Docker o cualquier servidor estático ya cumplen esto.)

---

### 1. Desarrollo local

Cualquier servidor estático sirve. El más a mano, con Python:

```bash
python3 -m http.server 8000
```

Abrí **http://localhost:8000**.

> **¿Trabajás dentro de un contenedor/VM remota?** `localhost` apunta a tu máquina, no al contenedor. Accedé por la IP de red del contenedor (`http://<ip-del-contenedor>:8000`) o reenviá el puerto (VS Code → pestaña *Ports*; o SSH con `-L 8000:localhost:8000`).

Editás un JSON → guardás → `F5`. Los loaders usan `cache: "no-cache"`, así que el navegador revalida y ves el cambio sin *hard refresh*.

---

### 2. Docker (imagen liviana)

El sitio es **100% estático**, así que la imagen solo necesita un servidor web. `nginx:alpine` (~25 MB) es robusto y resuelve los MIME types correctamente.

**`Dockerfile`:**

```dockerfile
FROM nginx:alpine

# Copiamos solo lo que sirve el sitio (nada de .git, configs locales, etc.)
COPY index.html /usr/share/nginx/html/
COPY styles  /usr/share/nginx/html/styles
COPY scripts /usr/share/nginx/html/scripts
COPY data    /usr/share/nginx/html/data
COPY config  /usr/share/nginx/html/config
COPY assets  /usr/share/nginx/html/assets

EXPOSE 80
```

**Construir y correr:**

```bash
docker build -t cv-web .
docker run --rm -p 8080:80 cv-web
# → http://localhost:8080
```

#### Imagen mínima absoluta

Si buscás el menor tamaño posible, un servidor estático compilado pesa **~10 MB o menos**. Por ejemplo, con [`static-web-server`](https://static-web-server.net/):

```dockerfile
FROM ghcr.io/static-web-server/static-web-server:2
COPY . /public
# Sirve /public en :80 por defecto
```

```bash
docker build -t cv-web-mini .
docker run --rm -p 8080:80 cv-web-mini
```

> **Tip de tamaño**: agregá un `.dockerignore` con `.git`, `.venv`, `*.md`, etc. para no inflar el contexto de build ni la imagen.

---

### 3. GitHub Pages

La opción más simple para publicarlo gratis:

1. Subí el repo a GitHub.
2. **Settings → Pages**.
3. En *Source* elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. Guardá. En ~1 minuto estará en `https://<usuario>.github.io/<repo>/`.

GitHub Pages ya sirve por HTTP, así que `fetch` funciona sin configuración extra.

> ⚠️ **Lo que editás localmente no aparece en Pages hasta que hagas `git push`.** Y tras pushear, el deploy tarda ~1 min y el navegador puede cachear: si no ves el cambio, `Ctrl+Shift+R`.

---

## ⚙️ Configuración: secciones y temas

### Activar / desactivar secciones

En `config/site.json`, cada sección tiene un flag `visible`. Ponelo en `false` para esconderla (desaparece del menú **y** del contenido):

```json
{ "id": "resources", "label": "Recursos", "icon": "bookmark", "group": "Hub", "visible": false }
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
| `language` | Atributo `lang` del documento (`es`, `en`, …) |
| `show_theme_switcher` | `false` esconde **todos** los controles de tema |

### Activar / desactivar temas

En `config/theme.json`, cada tema también tiene `visible`:

```json
"dnd35": { "name": "D&D 3.5", "type": "special", "visible": false, "label": "D&D", "dot": "#8b1a1a", "portrait": "assets/images/portrait-dnd35.jpg" }
```

- `type`: `base` (entra en el toggle claro/oscuro) o `special` (botón propio).
- `visible: false`: oculta el botón. Si alguien lo tenía activo, la página cae sola al tema base.
- `dot`: color del puntito identificador del botón.
- `default_mode` (raíz del archivo): tema con el que arranca la página.

### Retratos por tema

Cada tema referencia su imagen en `theme.json` (`"portrait": "assets/images/portrait-<tema>.jpg"`). Subí las imágenes a `assets/images/`:

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

---

## 🩹 Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| La página carga vacía / sin contenido | Abierta como `file://` | Servila por HTTP (ver [Despliegue](#-despliegue)) |
| Edité un JSON y no se actualiza | Caché del navegador | `Ctrl+Shift+R`, o DevTools → Network → *Disable cache* |
| El cambio no aparece en GitHub Pages | Falta `git push` o el deploy tarda | Pushear y esperar ~1 min; luego `Ctrl+Shift+R` |
| El retrato no aparece | Falta la imagen o el nombre no coincide | Verificá `assets/images/portrait-<tema>.jpg`; mientras tanto se ve el placeholder |
| `404` en consola por una imagen | El retrato de ese tema aún no se subió | Es benigno (cae al placeholder); desaparece al subir la imagen |

---

<div align="center">

Hecho con HTML, CSS y JavaScript vanilla — sin frameworks, sin build.

</div>
