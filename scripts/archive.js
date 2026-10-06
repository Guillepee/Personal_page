/* Archive UI uses the same JSON translations and language events as the CV. */
(function () {
  const search = document.getElementById('archiveSearch');
  const entries = [...document.querySelectorAll('.archive-entry')];
  const buttons = [...document.querySelectorAll('[data-tag]')];
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let tag = '';
  let strings = null;
  let request = 0;
  let requestedLang = null;
  const cache = {};
  const format = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

  function filter() {
    if (!search) return;
    const query = normalize(search.value.trim());
    let count = 0;
    entries.forEach(entry => {
      const matches = normalize(entry.textContent).includes(query) && (!tag || JSON.parse(entry.dataset.tags).includes(tag));
      entry.hidden = !matches;
      if (matches) count++;
    });
    document.getElementById('archiveCount').textContent = strings ? format(strings.count, { count, total: entries.length }) : `${count} / ${entries.length}`;
    const empty = document.getElementById('archiveEmpty');
    empty.hidden = count > 0;
    if (strings) empty.textContent = entries.length ? strings.noResults : strings.empty;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tag === tag)));
  }

  async function translate(lang) {
    requestedLang = lang;
    const current = ++request;
    try {
      if (!cache[lang]) {
        const response = await fetch(`me/content.${lang}.json`, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        cache[lang] = await response.json();
      }
      if (current !== request) return; // Ignore stale responses after a quick switch.
      const content = cache[lang];
      strings = content.archive;
      document.querySelectorAll('[data-archive-text]').forEach(el => {
        const text = strings[el.dataset.archiveText];
        if (typeof text === 'string') el.textContent = text;
      });
      document.querySelectorAll('[data-archive-type]').forEach(el => {
        el.textContent = strings.types[el.dataset.archiveType];
      });
      document.querySelectorAll('[data-reading-minutes]').forEach(el => {
        el.textContent = format(strings.readingTime, { minutes: el.dataset.readingMinutes });
      });
      document.querySelector('.sidebar__brand-name').textContent = content.profile.name;
      document.querySelector('.sidebar__nav').setAttribute('aria-label', strings.navigation);
      if (search) {
        search.placeholder = strings.placeholder;
        document.title = `${strings.name} · ${content.profile.name}`;
        document.querySelector('meta[name="description"]').content = strings.description;
      }
      filter();
      // New language labels can change sidebar height; reuse its existing event.
      document.dispatchEvent(new CustomEvent('sidebar:rendered'));
    } catch (error) {
      console.error('Error loading Archive translations:', error);
    }
  }

  document.addEventListener('language:changed', event => translate(event.detail.lang));
  document.addEventListener('sidebar:rendered', () => {
    // site-config owns the initial language; wait until it has populated controls.
    const active = document.querySelector('.lang-btn.is-active');
    if (active && active.dataset.lang !== requestedLang) translate(active.dataset.lang);
  });
  if (search) {
    buttons.forEach(button => button.addEventListener('click', () => { tag = button.dataset.tag; filter(); }));
    search.addEventListener('input', filter);
    document.getElementById('archiveFilters').hidden = false;
    filter();
  }
  translate(document.documentElement.lang);
})();
