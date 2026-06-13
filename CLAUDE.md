# CLAUDE.md — CV Personal + Hub de Recursos

Contexto completo para continuar este proyecto en Claude Code.
Última sesión: mayo 2026. Fase actual: **1 completada**, lista para iniciar **Fase 2**.

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

**Aún no existen** (Fase 2):
```
data/
└── content.json
config/
├── theme.json
└── site.json
scripts/
├── theme-loader.js
├── content-renderer.js
└── site-config.js
```

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
- **Sidebar sin barra de desplazamiento visible** — el objetivo es que el contenido (brand + nav + footer) entre completo en `100vh` sin barra. Como "todo entra + sin barra" es imposible de garantizar para *cualquier* altura, el enfoque es híbrido: `.sidebar` usa `overflow-y: auto` con la barra **oculta** (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`). Así nunca se ve barra y, en pantallas muy bajas, el scroll queda como red de seguridad en vez de cortar contenido. La nav (`flex: 1`) absorbe el espacio sobrante. Si un tema infla el texto (caso `pixel8` con Press Start 2P) se reduce la escala tipográfica **solo dentro de `.sidebar`** redefiniendo `--fs-md/sm/xs` en ese scope (ver `layout.css`), nunca el contenido principal. Medido con fuentes reales: el contenido entra sin scroll con alto de viewport ≥ ~690px en los 5 temas (peor caso `retro-term`/`dnd35` = 688px; `pixel8` = 620px). Al añadir un tema con tipografía grande, verificar que la sidebar siga entrando.

---

## Notas de desarrollo

- El archivo `cv-web-standalone.html` es una versión todo-en-uno para preview móvil. **No es la fuente de verdad** — editar siempre los archivos separados y regenerar el standalone si hace falta.
- Las fuentes se cargan desde Google Fonts. Requieren conexión en la primera carga. En Fase 3 se puede hacer self-hosted.
- `prefers-reduced-motion` está implementado en `base.css` — todas las animaciones se deshabilitan automáticamente.
- Scrollbar personalizada solo en Webkit (Chrome/Safari). Firefox usa scrollbar-color nativo.
- El `<template>` approach para Fase 2: poner templates en el `<head>` o al final del `<body>` con `display:none`, luego clonarlos desde JS y poblarlos con datos del JSON.
