/* ============================================================
   site-config.js
   Lee config/site.json y construye la navegación del sidebar:
   secciones visibles, orden, agrupación (CV / Hub / Otros) y switchers.
   El brand y el footer (toggle de temas) quedan fijos en el HTML; aquí
   solo se genera el <nav> y se aplica la visibilidad de las secciones.
   ============================================================ */

// Iconos del nav, indexados por el nombre que usa site.json. Son presentación,
// por eso viven aquí y no en el JSON (igual que en content-renderer.js).
const NAV_ICONS = {
  home: '<path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />',
  briefcase:
    '<rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />',
  education:
    '<path d="M22 10L12 4 2 10l10 6 10-6z" /><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />',
  skills: '<path d="M12 2l2.5 6.5L21 10l-5 4.5L17.5 22 12 18l-5.5 4L8 14.5 3 10l6.5-1.5z" />',
  grid:
    '<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />',
  mail:
    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />',
};

function navIcon(name) {
  const paths = NAV_ICONS[name] || "";
  return `<svg class="nav-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

// Estado de idioma: site-config es su dueño (igual que theme-loader lo es del
// tema). Se conserva la config cargada para poder re-renderizar el nav al
// cambiar de idioma sin volver a hacer fetch.
let siteConfig = null;
let activeLang = "es";

// Idioma inicial: el guardado en localStorage si es uno de los declarados en
// site.json; si no, "es" por defecto. El único que escribe localStorage.lang
// es setLanguage (abajo), así que el valor guardado siempre es válido.
function resolveLang(config) {
  const stored = localStorage.getItem("lang");
  return config.languages && config.languages[stored] ? stored : "es";
}

function renderNavLink(section, lang, isActive) {
  return `
    <a href="#${section.id}" class="nav-link${isActive ? " is-active" : ""}">
      ${navIcon(section.icon)}
      <span>${section.label[lang]}</span>
    </a>`;
}

// Construye el <nav> agrupando las secciones visibles por su campo "group",
// respetando el orden de aparición de los grupos en site.json. El encabezado
// de cada grupo se traduce vía groupLabels; activeId marca el link activo
// (al inicio, la primera sección; al cambiar idioma, la que estuviera activa).
function renderNav(sections, groupLabels, lang, activeId) {
  const visible = sections.filter((s) => s.visible);
  const groups = [];
  for (const section of visible) {
    let group = groups.find((g) => g.name === section.group);
    if (!group) {
      group = { name: section.group, items: [] };
      groups.push(group);
    }
    group.items.push(section);
  }
  return groups
    .map((group) => {
      const label = groupLabels?.[group.name]?.[lang] || group.name;
      return (
        `<span class="sidebar__nav-section">${label}</span>` +
        group.items.map((s) => renderNavLink(s, lang, s.id === activeId)).join("")
      );
    })
    .join("");
}

// Pinta el nav en el sidebar con el idioma dado, preservando qué sección está
// activa: usa la marcada en vivo (la mueve el scrollspy) o, si no hay, la
// primera visible.
function renderNavInto(lang) {
  const nav = document.querySelector(".sidebar__nav");
  if (!nav) return;
  const visible = siteConfig.sections.filter((s) => s.visible);
  const currentActive = nav
    .querySelector(".nav-link.is-active")
    ?.getAttribute("href")
    ?.slice(1);
  const activeId = currentActive || (visible.length ? visible[0].id : null);
  nav.innerHTML = renderNav(siteConfig.sections, siteConfig.groupLabels, lang, activeId);
}

// Oculta del main las secciones marcadas como no visibles.
function applySectionVisibility(sections) {
  for (const section of sections) {
    if (section.visible) continue;
    const el = document.getElementById(section.id);
    if (el) el.hidden = true;
  }
}

// Genera los botones de idioma (uno por idioma declarado), marcando el activo.
// Reusan el aspecto de los botones de tema (.lang-btn comparte estilos con
// .theme-btn en components.css).
function renderLangButtons(languages, current) {
  const container = document.querySelector(".sidebar__langs");
  if (!container) return;
  container.innerHTML = Object.entries(languages || {})
    .map(
      ([id, lang]) =>
        `<button class="lang-btn${id === current ? " is-active" : ""}" type="button" ` +
        `data-lang="${id}" aria-label="${lang.name}">${lang.label}</button>`
    )
    .join("");
  container.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
}

// Traduce el texto del botón de descarga del CV según el idioma activo.
function applyActionLabels(lang) {
  const label = document.getElementById("downloadCvLabel");
  const text = siteConfig.actions?.downloadCv?.[lang];
  if (label && text) label.textContent = text;
}

// Cambia el idioma en vivo (sin recargar): re-pinta el nav y los botones, y
// avisa con language:changed para que content-renderer re-cargue el contenido.
function setLanguage(lang) {
  if (lang === activeLang || !siteConfig.languages[lang]) return;
  activeLang = lang;
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;

  renderNavInto(lang);
  renderLangButtons(siteConfig.languages, lang);
  applyActionLabels(lang);

  document.dispatchEvent(new CustomEvent("language:changed", { detail: { lang } }));
  // El nav cambió de tamaño (labels de otra longitud): recalcular el escalado.
  document.dispatchEvent(new CustomEvent("sidebar:rendered"));
}

function applyConfig(config) {
  siteConfig = config;
  activeLang = resolveLang(config);
  document.documentElement.lang = activeLang;

  renderNavInto(activeLang);
  applyActionLabels(activeLang);

  applySectionVisibility(config.sections);

  // Ocultar los controles de tema si la config lo pide.
  if (config.show_theme_switcher === false) {
    document.querySelector(".sidebar__footer-modes")?.remove();
    document.querySelector(".sidebar__footer-specials")?.remove();
  }

  // Selector de idioma: se omite si la config lo desactiva.
  if (config.show_language_switcher === false) {
    document.querySelector(".sidebar__langs")?.remove();
  } else {
    renderLangButtons(config.languages, activeLang);
  }
  // show_typography_switcher se contemplará al implementar theme.json
  // (todavía no existe un selector de tipografía en la UI).

  // Avisar que el sidebar cambió, para que el escalado (fitSidebar) recalcule.
  document.dispatchEvent(new CustomEvent("sidebar:rendered"));
}

async function loadSiteConfig() {
  try {
    // cache: "no-cache" -> revalida con el server, así los cambios en el JSON
    // se ven con un F5 normal (sin hard refresh).
    const response = await fetch("config/site.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`No se pudo cargar site.json (HTTP ${response.status})`);
    }
    applyConfig(await response.json());
  } catch (error) {
    // Sin la config, el sidebar queda vacío: fallar de forma visible.
    console.error(
      "Error cargando la configuración del sitio. ¿Estás sirviendo la página " +
        "por HTTP (p. ej. python3 -m http.server)? Detalle:",
      error
    );
  }
}

loadSiteConfig();
