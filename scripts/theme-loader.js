/* ============================================================
   theme-loader.js
   Lee config/theme.json y maneja la apariencia. Genera un botón por tema:
   los base (Light/Dark) se seleccionan directo y fijan el modo guardado; los
   especiales se activan/desactivan (al desactivar, vuelven al base). Los
   COLORES y las fuentes viven en tokens.css; aquí no se inyectan, para no
   pisar los temas especiales ni provocar parpadeo (FOUC). El tema inicial ya
   lo aplica un script síncrono en el <head> desde localStorage.
   ============================================================ */
(function () {
  const root = document.documentElement;
  const basesContainer = document.querySelector(".sidebar__footer-modes");
  const specialsContainer = document.querySelector(".sidebar__footer-specials");
  const portraitFrame = document.querySelector(".hero__portrait-frame");
  // Placeholder SVG original: se usa como fallback si un tema no tiene imagen
  // o si la imagen no se puede cargar.
  const portraitPlaceholder = portraitFrame ? portraitFrame.innerHTML : "";

  let baseThemes = []; // [{ id, name, label, dot }]
  let specialThemes = [];
  let portraits = {}; // tema -> ruta de imagen
  let baseTheme = localStorage.getItem("baseTheme") || "light";

  // Muestra el retrato del tema activo; si no hay imagen o falla la carga,
  // deja el placeholder SVG original.
  function applyPortrait(theme) {
    if (!portraitFrame) return;
    const src = portraits[theme];
    if (!src) {
      portraitFrame.innerHTML = portraitPlaceholder;
      return;
    }
    const img = new Image();
    img.onload = () => {
      portraitFrame.innerHTML = `<img src="${src}" alt="Retrato" />`;
    };
    img.onerror = () => {
      portraitFrame.innerHTML = portraitPlaceholder;
    };
    img.src = src;
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    applyPortrait(theme);
    syncUI();
    // El cambio de tema altera las fuentes (y la altura del sidebar): avisar
    // para que fitSidebar (en el script inline) recalcule el escalado.
    document.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme } }));
  }

  // Marca como activo el botón del tema en uso (sea base o especial).
  function syncUI() {
    const current = root.getAttribute("data-theme");
    document
      .querySelectorAll(".sidebar__footer .theme-btn")
      .forEach((btn) => btn.classList.toggle("is-active", current === btn.dataset.themeId));
  }

  // Markup de un botón de tema. El color del punto identificador se pasa como
  // variable CSS (--theme-dot), que usa el ::before.
  function themeButton(t) {
    return (
      `<button class="theme-btn" type="button" data-theme-id="${t.id}" ` +
      `style="--theme-dot: ${t.dot}" aria-label="Activar tema ${t.name}">${t.label}</button>`
    );
  }

  // Botones de temas base (Light/Dark): selección directa. Además de aplicar el
  // tema, fijan el "modo" guardado al que vuelven los especiales al desactivarse.
  function renderBaseButtons() {
    if (!basesContainer) return;
    basesContainer.innerHTML = baseThemes.map(themeButton).join("");
    basesContainer.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        baseTheme = btn.dataset.themeId;
        localStorage.setItem("baseTheme", baseTheme);
        applyTheme(baseTheme);
      });
    });
  }

  // Botones de temas especiales: toggle on/off. Al desactivar el especial en
  // uso, vuelve al tema base.
  function renderSpecialButtons() {
    if (!specialsContainer) return;
    specialsContainer.innerHTML = specialThemes.map(themeButton).join("");
    specialsContainer.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = root.getAttribute("data-theme");
        const id = btn.dataset.themeId;
        applyTheme(current === id ? baseTheme : id);
      });
    });
  }

  function applyConfig(config) {
    const entries = Object.entries(config.themes || {});
    // visible !== false: un tema se oculta poniendo "visible": false en theme.json.
    const toButton = ([id, t]) => ({
      id,
      name: t.name,
      label: t.label || t.name,
      dot: t.dot || "currentColor",
    });
    baseThemes = entries.filter(([, t]) => t.type === "base" && t.visible !== false).map(toButton);
    specialThemes = entries
      .filter(([, t]) => t.type === "special" && t.visible !== false)
      .map(toButton);
    portraits = {};
    entries.forEach(([id, t]) => {
      if (t.portrait) portraits[id] = t.portrait;
    });

    // Tema base: el guardado (si es válido) o el default_mode de la config.
    const baseIds = baseThemes.map((t) => t.id);
    const storedBase = localStorage.getItem("baseTheme");
    baseTheme = baseIds.includes(storedBase) ? storedBase : config.default_mode || "light";

    // Tema activo inicial: el guardado, solo si está disponible (base o especial
    // visible). Si estaba activo un tema ahora oculto, cae al tema base.
    const availableIds = baseIds.concat(specialThemes.map((t) => t.id));
    const storedTheme = localStorage.getItem("theme");
    const initial = availableIds.includes(storedTheme) ? storedTheme : baseTheme;

    renderBaseButtons();
    renderSpecialButtons();
    applyTheme(initial);
  }

  async function loadTheme() {
    try {
      // cache: "no-cache" -> revalida con el server, así los cambios en el JSON
      // se ven con un F5 normal (sin hard refresh).
      const res = await fetch("config/theme.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`No se pudo cargar theme.json (HTTP ${res.status})`);
      applyConfig(await res.json());
    } catch (error) {
      // El tema inicial ya está aplicado (script del <head>); sin la config no
      // se pueden generar los botones, pero la página sigue usable.
      console.error("Error cargando la configuración de temas. Detalle:", error);
    }
  }

  loadTheme();
})();
