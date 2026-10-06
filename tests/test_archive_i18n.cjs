const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const listeners = {};
const make = (dataset = {}, textContent = '') => ({dataset, textContent, setAttribute(k, v) { this[k] = v; }, addEventListener(k, fn) { this[k] = fn; }});
const title = make({archiveText: 'title'});
const all = make({archiveText: 'all', tag: ''});
const type = make({archiveType: 'note'});
const minutes = make({readingMinutes: '3'});
const search = make(); search.value = '';
const brand = make(); const nav = make(); const meta = make();
const active = make({lang: 'en'});
const entry = make({tags: '["Python"]'}, 'Original Spanish note Python');
const ids = {archiveSearch: search, archiveCount: make(), archiveEmpty: make(), archiveFilters: make()};
const doc = {
  documentElement: {lang: 'es'},
  getElementById: id => ids[id],
  querySelector: selector => ({'.sidebar__brand-name': brand, '.sidebar__nav': nav, '.lang-btn.is-active': active, 'meta[name="description"]': meta})[selector],
  querySelectorAll: selector => ({'.archive-entry': [entry], '[data-tag]': [all], '[data-archive-text]': [title, all], '[data-archive-type]': [type], '[data-reading-minutes]': [minutes]})[selector] || [],
  addEventListener: (name, fn) => (listeners[name] ||= []).push(fn),
  dispatchEvent: event => (listeners[event.type] || []).forEach(fn => fn(event))
};
const tick = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  vm.runInNewContext(fs.readFileSync('scripts/archive.js', 'utf8'), {
    document: doc, console,
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    fetch: async path => ({ok: true, json: async () => JSON.parse(fs.readFileSync(path, 'utf8'))})
  });
  // Initial stored EN preference supplied by site-config after the script starts.
  doc.dispatchEvent({type: 'sidebar:rendered'});
  await tick(); await tick();
  assert.equal(title.textContent, 'Notes and reading');
  assert.equal(type.textContent, 'Note');
  assert.equal(minutes.textContent, '3 min read');
  assert.equal(search.placeholder, 'Title, description or tag…');
  assert.equal(ids.archiveCount.textContent, '1 of 1 entries');
  search.value = 'missing'; search.input();
  assert.equal(entry.hidden, true);
  assert.equal(ids.archiveEmpty.textContent, 'No entries found.');
  active.dataset.lang = 'es';
  doc.dispatchEvent({type: 'language:changed', detail: {lang: 'es'}});
  await tick(); await tick();
  assert.equal(title.textContent, 'Notas y lecturas');
  assert.equal(type.textContent, 'Nota');
  assert.equal(search.value, 'missing');
  assert.equal(ids.archiveEmpty.textContent, 'No se encontraron entradas.');
  assert.equal(entry.textContent, 'Original Spanish note Python');
  console.log('Archive ES/EN lifecycle, search and content preservation: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
