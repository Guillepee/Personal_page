/* ============================================================
   theme-loader.js
   Lee config/theme.json y maneja la apariencia: tema por defecto, toggle
   light/dark, y los botones de temas especiales (generados desde el JSON).
   Los COLORES y las fuentes viven en tokens.css; aquí no se inyectan, para
   no pisar los temas especiales ni provocar parpadeo (FOUC). El tema inicial
   ya lo aplica un script síncrono en el <head> desde localStorage.
   ============================================================ */
(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const toggleLabel = document.getElementById("themeToggleLabel");
  const specialsContainer = document.querySelector(".sidebar__footer-specials");
  const portraitFrame = document.querySelector(".hero__portrait-frame");
  // Placeholder SVG original: se usa como fallback si un tema no tiene imagen
  // o si la imagen no se puede cargar.
  const portraitPlaceholder = portraitFrame ? portraitFrame.innerHTML : "";

  let baseThemes = ["light", "dark"]; // fallback si falla el fetch
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

  function syncUI() {
    const current = root.getAttribute("data-theme");
    // El label del toggle muestra el próximo estado base (opuesto al actual).
    if (toggleLabel) toggleLabel.textContent = baseTheme === "dark" ? "Light" : "Dark";
    if (toggle) toggle.classList.toggle("base-dark", baseTheme === "dark");
    // Marca activo el botón del tema especial en uso.
    specialsContainer
      ?.querySelectorAll(".theme-special-btn")
      .forEach((btn) => btn.classList.toggle("is-active", current === btn.dataset.themeId));
  }

  // Genera los botones de temas especiales desde la config. El color del punto
  // identificador se pasa como variable CSS (--theme-dot), que usa el ::before.
  function renderSpecialButtons() {
    if (!specialsContainer) return;
    specialsContainer.innerHTML = specialThemes
      .map(
        (t) =>
          `<button class="theme-special-btn" type="button" data-theme-id="${t.id}" ` +
          `style="--theme-dot: ${t.dot}" aria-label="Activar tema ${t.name}">${t.label}</button>`
      )
      .join("");
    specialsContainer.querySelectorAll(".theme-special-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = root.getAttribute("data-theme");
        const id = btn.dataset.themeId;
        // Toggle on/off: al desactivar el especial, vuelve al tema base.
        applyTheme(current === id ? baseTheme : id);
      });
    });
  }

  function initToggle() {
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      // El toggle siempre opera sobre el tema base, descartando el especial.
      baseTheme = baseTheme === "dark" ? "light" : "dark";
      localStorage.setItem("baseTheme", baseTheme);
      applyTheme(baseTheme);
    });
  }

  function applyConfig(config) {
    const entries = Object.entries(config.themes || {});
    baseThemes = entries.filter(([, t]) => t.type === "base").map(([id]) => id);
    // visible !== false: un tema se oculta poniendo "visible": false en theme.json.
    specialThemes = entries
      .filter(([, t]) => t.type === "special" && t.visible !== false)
      .map(([id, t]) => ({ id, name: t.name, label: t.label || t.name, dot: t.dot || "currentColor" }));
    portraits = {};
    entries.forEach(([id, t]) => {
      if (t.portrait) portraits[id] = t.portrait;
    });

    // Tema base: el guardado (si es válido) o el default_mode de la config.
    const storedBase = localStorage.getItem("baseTheme");
    baseTheme = baseThemes.includes(storedBase) ? storedBase : config.default_mode || "light";

    // Tema activo inicial: el guardado, solo si está disponible (base o especial
    // visible). Si estaba activo un tema ahora oculto, cae al tema base.
    const availableIds = baseThemes.concat(specialThemes.map((t) => t.id));
    const storedTheme = localStorage.getItem("theme");
    const initial = availableIds.includes(storedTheme) ? storedTheme : baseTheme;

    renderSpecialButtons();
    initToggle();
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
      // El tema inicial ya está aplicado (script del <head>); dejamos al menos
      // el toggle base operativo aunque no haya botones especiales.
      console.error("Error cargando la configuración de temas. Detalle:", error);
      initToggle();
      syncUI();
    }
  }

  loadTheme();
})();
