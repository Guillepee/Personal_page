/* ============================================================
   content-renderer.js
   Lee data/content.json y puebla las secciones del CV.
   Fase 2: el contenido vive en el JSON; el HTML es el esqueleto.
   Construye el markup con template literals (datos propios, no externos).
   ============================================================ */

// Iconos SVG que dependen del dato (socials, meta, contacto). Se mantienen
// aquí —y no en el JSON— porque son presentación, no contenido. Los iconos
// fijos (la flecha ↗) viven directamente en las plantillas de abajo.
const ICONS = {
  github:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" /></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>',
  twitter:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg>',
  email:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>',
  location:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>',
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>',
};

// Flecha ↗ reutilizada en project-card y resource-item.
const ARROW =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M17 7H8M17 7v9" /></svg>';

// El contacto usa los mismos iconos que los socials, indexados por tipo.
const CONTACT_ICONS = { email: ICONS.email, linkedin: ICONS.linkedin, github: ICONS.github };

const chip = (text) => `<span class="chip">${text}</span>`;

// Estiliza el apellido (última palabra) en cursiva, como en el diseño original.
function renderName(name) {
  const parts = name.trim().split(" ");
  const last = parts.pop();
  const first = parts.join(" ");
  return first ? `${first} <em>${last}</em>` : `<em>${last}</em>`;
}

// Marca del sidebar (inicial + nombre + rol), desde profile para no duplicar.
function renderBrand(profile) {
  const mark = document.querySelector(".sidebar__brand-mark");
  const name = document.querySelector(".sidebar__brand-name");
  const role = document.querySelector(".sidebar__brand-role");
  if (mark) mark.textContent = (profile.name || "").trim().charAt(0);
  if (name) name.textContent = profile.name || "";
  if (role) role.textContent = profile.brandRole || "";
}

function renderHero(profile) {
  const meta = [
    { icon: "location", text: profile.location },
    { icon: "clock", text: profile.availability },
    { icon: "check", text: profile.workMode },
  ];
  const content = document.getElementById("heroContent");
  content.innerHTML = `
    <p class="hero__headline">${profile.headline}</p>
    <h1 class="hero__name">${renderName(profile.name)}</h1>
    <p class="hero__bio">${profile.bio}</p>
    <div class="hero__meta">
      ${meta
        .map(
          (m) => `<span class="hero__meta-item">${ICONS[m.icon]}${m.text}</span>`
        )
        .join("")}
    </div>
    <div class="hero__socials">
      ${profile.socials
        .map(
          (s) =>
            `<a href="${s.url}" class="social-link" aria-label="${s.label}">${ICONS[s.id] || ""}</a>`
        )
        .join("")}
    </div>`;
  document.getElementById("heroCaption").textContent = profile.portraitCaption;
}

// Experiencia y formación comparten estructura; la formación no lleva tags.
function renderTimelineItem(item) {
  const tags = item.tags
    ? `<div class="timeline-item__tags">${item.tags.map(chip).join("")}</div>`
    : "";
  return `
    <article class="timeline-item">
      <div class="timeline-item__period">${item.period}</div>
      <div class="timeline-item__body">
        <h3 class="timeline-item__role">${item.role}</h3>
        <p class="timeline-item__org">
          ${item.org}
          <span class="timeline-item__org-meta">${item.orgMeta}</span>
        </p>
        <p class="timeline-item__description">${item.description}</p>
        ${tags}
      </div>
    </article>`;
}

function renderSkillGroup(group) {
  return `
    <div class="skills__group">
      <div class="skills__group-label">${group.category}</div>
      <div class="skills__group-items">${group.items.map(chip).join("")}</div>
    </div>`;
}

function renderProject(project) {
  return `
    <a href="${project.url}" class="project-card">
      <div class="project-card__head">
        <h3 class="project-card__title">${project.title}</h3>
        <span class="project-card__arrow">${ARROW}</span>
      </div>
      <p class="project-card__description">${project.description}</p>
      <div class="project-card__tags">${project.tags.map(chip).join("")}</div>
    </a>`;
}

function renderResourceItem(item) {
  return `
    <a href="${item.url}" class="resource-item">
      <div class="resource-item__icon">${item.icon}</div>
      <div class="resource-item__body">
        <div class="resource-item__title">
          ${item.title}
          <span class="resource-item__arrow">${ARROW}</span>
        </div>
        <div class="resource-item__description">${item.description}</div>
      </div>
    </a>`;
}

function renderResourceGroup(group) {
  // El contador se calcula del número de items (antes estaba hardcodeado).
  const count = String(group.items.length).padStart(2, "0");
  return `
    <div class="resource-group">
      <div class="resource-group__head">
        <h3 class="resource-group__title">${group.category}</h3>
        <span class="resource-group__count">${count}</span>
      </div>
      <div class="resource-group__items">${group.items.map(renderResourceItem).join("")}</div>
    </div>`;
}

function renderContactItem(item) {
  return `
    <a href="${item.url}" class="contact-item">
      <div class="contact-item__icon">${CONTACT_ICONS[item.type] || ""}</div>
      <div>
        <div class="contact-item__label">${item.label}</div>
        <div class="contact-item__value">${item.value}</div>
      </div>
    </a>`;
}

// Encabezado de sección (eyebrow + título + lede).
function renderSectionHead(head) {
  return `
    <p class="section__eyebrow">${head.eyebrow}</p>
    <h2 class="section__title">${head.title}</h2>
    <p class="section__lede">${head.lede}</p>`;
}

// Inserta el HTML generado en el contenedor con el id dado.
function fillList(id, items, renderFn) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = items.map(renderFn).join("");
}

// Puebla los encabezados de cada sección desde sectionHeaders.
function fillHeads(headers) {
  if (!headers) return;
  for (const [id, head] of Object.entries(headers)) {
    const el = document.getElementById(`${id}Head`);
    if (el) el.innerHTML = renderSectionHead(head);
  }
}

function renderContent(data) {
  fillHeads(data.sectionHeaders);
  renderBrand(data.profile);
  renderHero(data.profile);
  fillList("experienceList", data.experience, renderTimelineItem);
  fillList("educationList", data.education, renderTimelineItem);
  fillList("skillsList", data.skills, renderSkillGroup);
  fillList("projectsList", data.projects, renderProject);
  fillList("resourcesList", data.resources, renderResourceGroup);
  fillList("contactList", data.contact, renderContactItem);
  // Avisar a otros scripts (p. ej. fitSidebar/scrollspy) que el DOM ya tiene contenido.
  document.dispatchEvent(new CustomEvent("content:rendered"));
}

async function loadContent() {
  try {
    // cache: "no-cache" -> el navegador revalida con el server en cada carga,
    // así al editar el JSON se ve con un F5 normal (sin hard refresh).
    const response = await fetch("data/content.json", { cache: "no-cache" });
    if (!response.ok) {
      // Fallar de forma visible: sin contenido la página no tiene sentido.
      throw new Error(`No se pudo cargar content.json (HTTP ${response.status})`);
    }
    renderContent(await response.json());
  } catch (error) {
    // Causa típica en desarrollo: abrir el archivo con file:// en vez de servirlo.
    console.error(
      "Error cargando el contenido. ¿Estás sirviendo la página por HTTP " +
        "(p. ej. python3 -m http.server)? Detalle:",
      error
    );
  }
}

loadContent();
