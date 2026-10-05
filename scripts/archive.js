/* Progressive enhancement: entries and navigation remain readable without JS. */
(function () {
  const search = document.getElementById('archiveSearch');
  if (!search) return;
  const entries = [...document.querySelectorAll('.archive-entry')];
  const buttons = [...document.querySelectorAll('[data-tag]')];
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let tag = '';
  function filter() {
    const query = normalize(search.value.trim());
    let count = 0;
    entries.forEach(entry => {
      const matches = normalize(entry.textContent).includes(query) && (!tag || JSON.parse(entry.dataset.tags).includes(tag));
      entry.hidden = !matches;
      if (matches) count++;
    });
    document.getElementById('archiveCount').textContent = `${count} / ${entries.length}`;
    document.getElementById('archiveEmpty').hidden = count > 0;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tag === tag)));
  }
  buttons.forEach(button => button.addEventListener('click', () => { tag = button.dataset.tag; filter(); }));
  search.addEventListener('input', filter);
  document.getElementById('archiveFilters').hidden = false;
  filter();
})();
