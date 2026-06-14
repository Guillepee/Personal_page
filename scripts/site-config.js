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

function renderNavLink(section, isActive) {
  return `
    <a href="#${section.id}" class="nav-link${isActive ? " is-active" : ""}">
      ${navIcon(section.icon)}
      <span>${section.label}</span>
    </a>`;
}

// Construye el <nav> agrupando las secciones visibles por su campo "group",
// respetando el orden de aparición de los grupos en site.json.
function renderNav(sections) {
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
  // La primera sección visible arranca activa (el scrollspy la actualiza al hacer scroll).
  const firstId = visible.length ? visible[0].id : null;
  return groups
    .map(
      (group) =>
        `<span class="sidebar__nav-section">${group.name}</span>` +
        group.items.map((s) => renderNavLink(s, s.id === firstId)).join("")
    )
    .join("");
}

// Oculta del main las secciones marcadas como no visibles.
function applySectionVisibility(sections) {
  for (const section of sections) {
    if (section.visible) continue;
    const el = document.getElementById(section.id);
    if (el) el.hidden = true;
  }
}

function applyConfig(config) {
  if (config.language) document.documentElement.lang = config.language;

  const nav = document.querySelector(".sidebar__nav");
  if (nav) nav.innerHTML = renderNav(config.sections);

  applySectionVisibility(config.sections);

  // Ocultar los controles de tema si la config lo pide.
  if (config.show_theme_switcher === false) {
    document.querySelector(".sidebar__footer-top .theme-toggle")?.remove();
    document.querySelector(".sidebar__footer-specials")?.remove();
  }
  // show_typography_switcher se contemplará al implementar theme.json
  // (todavía no existe un selector de tipografía en la UI).

  // Avisar que el sidebar cambió, para que el escalado (fitSidebar) recalcule.
  document.dispatchEvent(new CustomEvent("sidebar:rendered"));
}

async function loadSiteConfig() {
  try {
    const response = await fetch("config/site.json");
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
