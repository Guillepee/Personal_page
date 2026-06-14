# CLAUDE.md — CV Personal + Hub de Recursos

Contexto completo para continuar este proyecto en Claude Code.
Última sesión: junio 2026. Fase actual: **Fase 2 en curso**. Hecho: `content.json` + `content-renderer.js` (el contenido del CV sale del JSON) y `site.json` + `site-config.js` (el sidebar se construye desde config). Pendiente: `theme.json` + `theme-loader.js`.

**Decisiones de Fase 2 (cerradas):**
- **Carga de datos: `fetch`** (no módulos ES — ambos requieren servidor igual; fetch es más simple y anda en GitHub Pages). En desarrollo local hay que servir: `python3 -m http.server`.
- **Render: template literals** en JS (funciones que devuelven HTML + `innerHTML`), no `<template>` tags. Más legible; seguro porque los datos son propios.

---

## Qué es este proyecto

Web personal con dos propósitos:
1. **CV en formato web** — navegable, elegante, con scroll a anclas.
2. **Hub de accesos rápidos** — links a recursos favoritos agrupados por categoría.

Inspiración visual: tema **Anuppuccin** de Obsidian (Catppuccin + tipografía editorial).

---

## Principio rector

**Máxima modularidad.** Tres ejes completamente desacoplados:

| Eje | Archivo | Responsabilidad |
|-----|---------|----------------|
| Contenido | `data/content.json` | CV, recursos, datos personales |
| Apariencia | `config/theme.json` | Paletas, tipografías, tokens |
| Estructura | `config/site.json` | Secciones, orden, visibilidad |

El CSS **nunca** tiene valores hardcoded: solo consume variables CSS (`--color-bg`, `--font-display`, etc.). En Fase 2, `theme-loader.js` leerá `theme.json` e inyectará esos valores en `:root` en runtime.

---

## Estado actual del repositorio

```
cv-web/
├── index.html                  ✅ completo, datos mock hardcoded
└── styles/
    ├── tokens.css              ✅ variables + 4 paletas
    ├── base.css                ✅ reset + estilos globales
    ├── layout.css              ✅ sidebar + main + responsive
    ├── components.css          ✅ todos los componentes
    └── main.css                ✅ orquestador de imports
```

**Ya creados** (Fase 2):
```
data/
└── content.json          ✅ todos los datos del CV (paridad con el mock original)
config/
└── site.json             ✅ idioma, switchers y secciones (label, icon, group, visible)
scripts/
├── content-renderer.js   ✅ fetch + render con template literals
└── site-config.js        ✅ construye el nav del sidebar y aplica visibilidad
```

**Aún no existen** (Fase 2):
```
config/
└── theme.json
scripts/
└── theme-loader.js
```

Notas sobre lo implementado:
- `site-config.js` regenera solo el `<nav>` (brand y footer quedan fijos en el HTML, porque el footer tiene la lógica del toggle de temas). Agrupa por el campo `group` (CV/Hub/Otros), aplica `visible` (oculta nav-link + `section.hidden`) y respeta `show_theme_switcher`. `show_typography_switcher` se contemplará con `theme.json`.
- El **scrollspy** consulta los nav-links en vivo (no los captura al inicio) porque el nav se genera async; `fitSidebar` se reengancha al evento `sidebar:rendered`.
- Pendiente aún: mover encabezados de sección (eyebrow/título/lede) y reordenar el `<main>` desde `site.json`; el retrato del hero sigue siendo un placeholder SVG fijo.

---

## Secciones implementadas

Todas con datos mock. Orden en sidebar:

1. `#about` — Hero con retrato editorial (3:4), nombre, bio, meta, socials
2. `#experience` — Timeline con 3 entradas mock
3. `#education` — Timeline con 2 entradas mock
4. `#skills` — Grid de chips por categoría
5. `#projects` — 4 project cards en grid 2 columnas
6. `#resources` — Hub con 4 grupos (Dev, IA, Productividad, Lectura)
7. `#contact` — 3 contact items (email, LinkedIn, GitHub)

Navegación: **scroll a anclas** con **scrollspy** activo (IntersectionObserver).

---

## Temas implementados

Hay 5 temas. El modelo no es un ciclo único: el toggle del sidebar alterna solo entre los dos temas **base** (`light`/`dark`), mientras que los temas **especiales** se activan/desactivan con sus propios botones (al desactivar, se vuelve al `baseTheme`). La elección persiste en `localStorage` (claves `theme` y `baseTheme`).

| `data-theme` | Nombre | Tipo | Descripción |
|---|---|---|---|
| `light` | Latte | base | Catppuccin Latte, acento mauve. **Default** |
| `dark` | Mocha | base | Catppuccin Mocha, acento mauve |
| `retro-term` | Terminal | especial | Fondo negro, verde fósforo, scanlines CRT, todo en JetBrains Mono |
| `pixel8` | 8-bit | especial | Paleta NES, Press Start 2P, sombras offset rojo, estética Nintendo |
| `dnd35` | D&D 3.5 | especial | Pergamino envejecido, tinta oscura, carmesí del emblema, Cinzel + Palatino |

Todo vive en `styles/tokens.css`. Añadir un tema nuevo = añadir un bloque `[data-theme="nuevo"]` con las variables semánticas sobreescritas.

### Cómo añadir un tema nuevo
```css
/* En styles/tokens.css */
[data-theme="mi-tema"] {
  --color-bg: ...;
  --color-bg-elevated: ...;
  --color-surface: ...;
  --color-border: ...;
  --color-text: ...;
  --color-text-muted: ...;
  --color-text-faint: ...;
  --color-accent: ...;
  --color-accent-hover: ...;
  --color-accent-soft: ...;
  --color-link: ...;
  --shadow-sm: ...;
  --shadow-md: ...;
  --shadow-lg: ...;
  /* Opcional: fuentes, radios, tamaños */
}
```

Luego, en el script de `index.html`, si es un tema **especial**:
```js
// 1. Añadirlo al array de temas especiales
const SPECIAL_THEMES = ["retro-term", "pixel8", "dnd35", "mi-tema"];

// 2. Capturar su botón
const miTemaBtn = document.getElementById("miTemaBtn");

// 3. Reflejar su estado activo en syncUI()
miTemaBtn.classList.toggle("is-active", current === "mi-tema");

// 4. Registrar su listener (toggle on/off contra baseTheme)
miTemaBtn.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  applyTheme(current === "mi-tema" ? baseTheme : "mi-tema");
});
```
Y añadir el botón en el HTML del sidebar (`.sidebar__footer-specials`) con su clase modificadora `.theme-special-btn--mi-tema` para el dot de color (ver `styles/components.css`).

---

## Variables CSS semánticas (lo que el CSS consume)

```css
/* Fondos */
--color-bg              /* fondo principal */
--color-bg-elevated     /* sidebar, superficies elevadas */
--color-bg-deep         /* crust, fondos más oscuros */
--color-surface         /* cards, inputs */
--color-surface-hover   /* hover de superficies */

/* Bordes */
--color-border
--color-border-strong

/* Texto */
--color-text            /* texto principal */
--color-text-muted      /* texto secundario */
--color-text-faint      /* texto muy sutil, metadatos */

/* Acento (mauve por defecto) */
--color-accent
--color-accent-hover
--color-accent-soft     /* acento con opacidad, para fondos */
--color-link

/* Sombras */
--shadow-sm / --shadow-md / --shadow-lg

/* Tipografía */
--font-display          /* Fraunces en temas normales */
--font-body             /* Inter Tight */
--font-mono             /* JetBrains Mono */

/* Escala tipográfica */
--fs-xs / --fs-sm / --fs-base / --fs-md / --fs-lg / --fs-xl / --fs-2xl / --fs-3xl

/* Espaciado (escala 8pt) */
--sp-1 (0.25rem) … --sp-10 (8rem)

/* Radios */
--radius-sm / --radius-md / --radius-lg / --radius-full

/* Transiciones */
--transition-fast / --transition-base / --transition-slow
```

---

## Clases CSS principales

### Layout
- `.app` — grid principal (sidebar + main)
- `.sidebar` — aside fijo izquierda
- `.main` — área de contenido
- `.main__inner` — contenedor centrado, max-width 760px
- `.section` — cada sección del CV

### Sección genérica
- `.section__eyebrow` — etiqueta pequeña en mayúsculas con línea antes
- `.section__title` — h2 en Fraunces italic
- `.section__lede` — subtítulo descriptivo

### Componentes
- `.hero` — grid retrato + contenido
- `.hero__name`, `.hero__headline`, `.hero__bio`, `.hero__meta`, `.hero__socials`
- `.hero__portrait` + `.hero__portrait-frame` — recorte editorial 3:4
- `.timeline` + `.timeline-item` — experiencia/formación
- `.timeline-item__period`, `__role`, `__org`, `__description`, `__tags`
- `.skills` + `.skills__group` + `.skills__group-label` + `.skills__group-items`
- `.chip` — tag/etiqueta pill
- `.projects` + `.project-card` — grid 2 cols
- `.resources` + `.resource-group` + `.resource-item` — hub de links
- `.contact` + `.contact-item`
- `.nav-link` + `.nav-link.is-active`
- `.theme-toggle` — botón del footer del sidebar
- `.social-link` — iconos de redes sociales

---

## Fase 2 — Lo que viene

### Objetivo
Reemplazar los datos mock del HTML por tres JSONs. El HTML queda como esqueleto puro, sin contenido.

### Esquema `data/content.json`
```json
{
  "profile": {
    "name": "...",
    "headline": "...",
    "bio": "...",
    "photo": "assets/images/portrait.jpg",
    "location": "Madrid, España",
    "availability": "Disponible para proyectos",
    "workMode": "Remoto · Híbrido",
    "socials": [
      { "id": "github", "url": "...", "label": "GitHub" },
      { "id": "linkedin", "url": "...", "label": "LinkedIn" }
    ]
  },
  "experience": [
    {
      "role": "...", "org": "...", "location": "...",
      "period": "2023 — actualidad",
      "description": "...",
      "tags": ["Go", "Postgres"]
    }
  ],
  "education": [ ... ],
  "skills": [
    { "category": "Lenguajes", "items": ["Go", "TypeScript"] }
  ],
  "projects": [
    {
      "title": "...", "url": "...",
      "description": "...",
      "tags": ["Go", "CLI"]
    }
  ],
  "resources": [
    {
      "category": "Dev",
      "items": [
        { "title": "GitHub", "url": "https://github.com", "description": "github.com", "icon": "G" }
      ]
    }
  ],
  "contact": [
    { "type": "email", "label": "Email", "value": "...", "url": "mailto:..." },
    { "type": "linkedin", "label": "LinkedIn", "value": "...", "url": "..." }
  ]
}
```

### Esquema `config/theme.json`
```json
{
  "default_mode": "light",
  "active": { "light": "latte", "dark": "mocha" },
  "themes": {
    "latte":      { "name": "Latte", "colors": { ... } },
    "mocha":      { "name": "Mocha", "colors": { ... } },
    "retro-term": { "name": "Terminal", "colors": { ... } },
    "pixel8":     { "name": "8-bit", "colors": { ... } }
  },
  "typography": {
    "active": "editorial",
    "presets": {
      "editorial": { "display": "Fraunces", "body": "Inter Tight", "mono": "JetBrains Mono" },
      "technical": { "display": "Geist", "body": "Geist", "mono": "Geist Mono" }
    }
  },
  "tokens": {
    "radius": "10px",
    "accent_role": "mauve"
  }
}
```

### Esquema `config/site.json`
```json
{
  "language": "es",
  "navigation_mode": "scroll",
  "show_theme_switcher": true,
  "show_typography_switcher": true,
  "sections": [
    { "id": "about",      "label": "Inicio",      "icon": "home",      "visible": true },
    { "id": "experience", "label": "Experiencia", "icon": "briefcase", "visible": true },
    { "id": "education",  "label": "Formación",   "icon": "education", "visible": true },
    { "id": "skills",     "label": "Habilidades", "icon": "skills",    "visible": true },
    { "id": "projects",   "label": "Proyectos",   "icon": "grid",      "visible": true },
    { "id": "resources",  "label": "Recursos",    "icon": "bookmark",  "visible": true },
    { "id": "contact",    "label": "Contacto",    "icon": "mail",      "visible": true }
  ]
}
```

### Scripts a crear
- `scripts/theme-loader.js` — lee `theme.json`, inyecta variables en `:root`, maneja toggle y switchers
- `scripts/content-renderer.js` — lee `content.json`, puebla el DOM usando `<template>` tags del HTML
- `scripts/site-config.js` — lee `site.json`, construye el sidebar, filtra secciones visibles

### Tecnología recomendada para Fase 2
**Vanilla JS + `<template>` tags** — sin build step, sin framework, abre directo en navegador. Si se quiere escalar, migrar a Web Components o Astro.

Consideración importante: los JSONs con `fetch()` requieren servidor local (`python3 -m http.server` o similar). Alternativa sin servidor: importarlos como módulos ES (`import data from './data/content.json' assert {type: 'json'}`), aunque el soporte varía por navegador.

---

## Decisiones de diseño tomadas (no revertir sin razón)

- **CSS sin valores hardcoded** — toda literalidad va en `tokens.css` como variable.
- **Scroll a anclas** (no SPA) — más simple, mejor para SEO, funciona sin JS.
- **Scrollspy con IntersectionObserver** — sin dependencias.
- **Toggle de tema persiste en `localStorage`** bajo la clave `"theme"`.
- **Retrato editorial 3:4** — no circular, esquinas casi rectas, leyenda firmada.
- **Fuente Fraunces italic** solo en `section__title` y `.hero__name em` — no saturar.
- **Eyebrow pattern**: línea horizontal + texto en mono uppercase + color acento.
- **Sin Tailwind, sin React, sin build step** en Fase 1. Fase 2 mantiene ese espíritu.
- **pixel8 con escala tipográfica propia (simetría)** — Press Start 2P es mucho más ancha/alta por carácter que las demás fuentes, así que a igual `--fs-*` el contenido se ve desproporcionado (hero gigante). En `[data-theme="pixel8"]` se reduce la escala `--fs-*` global (manteniendo las proporciones internas) y se moderan los `--lh-*`, para que el cuerpo tenga dimensiones simétricas a los otros temas. La **sidebar** de pixel8 usa una escala mayor aparte (`[data-theme="pixel8"] .sidebar` en `layout.css`), porque sus textos son cortos y no sufren el wrapping del cuerpo. Calibrado comparando contra el tema `light`.
- **Sidebar siempre entra sin scroll (escalado dinámico)** — el contenido completo (brand + nav + footer) debe verse sin desplazamiento, vertical ni horizontal, en cualquier altura de viewport y en todos los temas. Como con espaciados fijos eso es imposible de garantizar, el contenido se envuelve en `.sidebar__fit` y se escala con `transform: scale(var(--sidebar-scale))`. La función `fitSidebar()` (script en `index.html`) mide la altura natural (`scrollHeight` del contenedor flex) vs. el alto disponible y calcula el factor; se recalcula en `resize`, al cambiar de tema y en `document.fonts.ready` (las fuentes web cambian la altura, sobre todo `Press Start 2P` en `pixel8`). `.sidebar` usa `overflow: hidden` (no hay scroll; solo recorta subpíxeles). En pantallas altas `scale = 1` (sin cambios); en bajas el contenido se achica proporcionalmente y sigue entrando completo (verificado de 900px a 400px en los 5 temas). El bloque `[data-theme="pixel8"] .sidebar` (reduce `--fs-md/sm/xs`) se mantiene para que `pixel8` parta de un tamaño razonable antes del escalado.

---

## Notas de desarrollo

- El archivo `cv-web-standalone.html` es una versión todo-en-uno para preview móvil. **No es la fuente de verdad** — editar siempre los archivos separados y regenerar el standalone si hace falta.
- Las fuentes se cargan desde Google Fonts. Requieren conexión en la primera carga. En Fase 3 se puede hacer self-hosted.
- `prefers-reduced-motion` está implementado en `base.css` — todas las animaciones se deshabilitan automáticamente.
- Scrollbar personalizada solo en Webkit (Chrome/Safari). Firefox usa scrollbar-color nativo.
- El `<template>` approach para Fase 2: poner templates en el `<head>` o al final del `<body>` con `display:none`, luego clonarlos desde JS y poblarlos con datos del JSON.
