"""Generate a deployable static site; Markdown sources never enter dist/."""
import argparse
from datetime import date
from html import escape as e
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urlparse

from markdown_it import MarkdownIt
import yaml

ROOT = Path(__file__).resolve().parents[1]
TYPES = ('note', 'article', 'link', 'document', 'news', 'guide')

def archive_text():
    return json.loads((ROOT / 'me/content.es.json').read_text())['archive']

def label(key):
    return f'<span data-archive-text="{key}">{e(archive_text()[key])}</span>'

def type_label(kind):
    return f'<span data-archive-type="{kind}">{e(archive_text()["types"][kind])}</span>'


def render_markdown(body):
    # Raw HTML is displayed as text; markdown-it rejects unsafe URL schemes.
    return MarkdownIt('commonmark', {'html': False}).enable('table').render(body)


def load_entries(folder):
    entries = []
    for path in sorted(folder.glob('*.md')):
        raw = path.read_text(encoding='utf-8')
        match = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)(.*)\Z', raw, re.S)
        if not match:
            raise ValueError(f'{path.name}: falta frontmatter YAML')
        meta = yaml.safe_load(match[1])
        if not isinstance(meta, dict):
            raise ValueError(f'{path.name}: metadatos inválidos')
        if meta.get('published', False) is not True:
            continue
        for key in ('title', 'description', 'date'):
            if not str(meta.get(key, '')).strip():
                raise ValueError(f'{path.name}: falta {key}')
        day = date.fromisoformat(str(meta['date']))
        slug = meta.get('slug', path.stem)
        if not isinstance(slug, str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            raise ValueError(f'{path.name}: slug inválido')
        tags = meta.get('tags', [])
        if not isinstance(tags, list) or any(not isinstance(t, str) or not t.strip() for t in tags):
            raise ValueError(f'{path.name}: tags debe ser una lista de textos')
        kind = meta.get('type', 'note')
        if kind not in TYPES:
            raise ValueError(f'{path.name}: type inválido')
        source = meta.get('source', '')
        if source and (not isinstance(source, str) or urlparse(source).scheme not in ('https', 'http') or not urlparse(source).netloc):
            raise ValueError(f'{path.name}: source debe ser una URL HTTP(S)')
        lang = meta.get('lang', 'es')
        if lang not in ('es', 'en'):
            raise ValueError(f'{path.name}: lang debe ser es/en')
        entries.append(dict(title=str(meta['title']), description=str(meta['description']), date=day.isoformat(), slug=slug, tags=tags, type=kind, source=source, lang=lang, body=match[2]))
    if len({x['slug'] for x in entries}) != len(entries):
        raise ValueError('Hay slugs duplicados')
    return sorted(entries, key=lambda x: (x['date'], x['slug']), reverse=True)


def tags_html(tags):
    return ' '.join(f'<span class="archive-tag">#{e(t)}</span>' for t in tags)


def page(title, description, content, depth, lang='es'):
    original = (ROOT / 'index.html').read_text()
    head = original.split('<head>')[1].split('</head>')[0]
    head = re.sub(r'<title>.*?</title>', f'<title>{e(title)} · Guillermo Palmieri</title>', head)
    head = re.sub(r'<meta (?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>', '', head)
    head = re.sub(r'\s*<script src="(?:scripts/content-renderer.js|vendor/html2pdf.bundle.min.js|scripts/pdf-export.js)" defer></script>', '', head)
    head = f'<base href="{"../" * depth}" />' + head
    head += f'<meta name="description" content="{e(description, quote=True)}" /><meta property="og:title" content="{e(title, quote=True)}" /><meta property="og:description" content="{e(description, quote=True)}" /><script src="scripts/archive.js" defer></script>'
    sidebar = original.split('<aside class="sidebar">')[1].split('</aside>')[0]
    config = json.loads((ROOT / 'config/site.json').read_text())
    links = ''.join(f'<a class="nav-link{ " is-active" if item["id"] == "archive" else ""}" href="{item.get("href", "index.html#" + item["id"])}">{e(item["label"]["es"])}</a>' for item in config['sections'] if item['visible'])
    sidebar = sidebar.replace('<nav class="sidebar__nav" aria-label="Navegación principal"></nav>', f'<nav class="sidebar__nav" aria-label="Navegación principal">{links}</nav>')
    profile = json.loads((ROOT / 'me/content.es.json').read_text())['profile']
    sidebar = sidebar.replace('<div class="sidebar__brand-mark"></div>', '<div class="sidebar__brand-mark">GP</div>').replace('<span class="sidebar__brand-name"></span>', f'<span class="sidebar__brand-name">{e(profile["name"])}</span>').replace('<span class="sidebar__brand-role"></span>', '<span class="sidebar__brand-role" data-archive-text="name">Archivo</span>')
    sidebar = re.sub(r'<button class="sidebar__download".*?</button>', '<a class="sidebar__download" href="index.html" data-archive-text="portfolio">← Portfolio</a>', sidebar, flags=re.S)
    layout = original.split('  <script>')[-1].split('</script>')[0]
    return f'<!DOCTYPE html><html lang="{lang}" data-theme="light" data-page="archive"><head>{head}</head><body><div class="app"><aside class="sidebar">{sidebar}</aside><main class="main"><div class="main__inner">{content}</div></main></div><script>{layout}</script></body></html>'


def build(output):
    entries = load_entries(ROOT / 'me/archive/content')  # Validate before changing output.
    if output.resolve() in (ROOT.resolve(), Path('/')) or ROOT.resolve() in output.resolve().parents and output.name != 'dist':
        raise ValueError('Usá una carpeta dist separada')
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    for name in ('styles', 'scripts', 'config', 'vendor', 'guias'):
        shutil.copytree(ROOT / name, output / name)
    shutil.copytree(ROOT / 'me', output / 'me', ignore=shutil.ignore_patterns('archive'))
    for path in ROOT.glob('*.html'):
        shutil.copy2(path, output / path.name)
    (output / '.nojekyll').touch()
    assets = ROOT / 'me/archive/assets'
    if assets.exists():
        shutil.copytree(assets, output / 'archive/assets')
    archive = output / 'archive'
    archive.mkdir(exist_ok=True)
    rows = []
    for item in entries:
        slug = item['slug']
        rows.append(f'<article class="archive-entry" lang="{item["lang"]}" data-tags="{e(json.dumps(item["tags"], ensure_ascii=False), quote=True)}"><p class="archive-meta">{type_label(item['type'])} · <time datetime="{item["date"]}">{item["date"]}</time></p><h2><a href="archive/{slug}/">{e(item["title"])}</a></h2><p>{e(item["description"])}</p><div class="archive-tags">{tags_html(item["tags"])}</div></article>')
        source = f'<p><a href="{e(item["source"], quote=True)}" rel="noopener noreferrer" data-archive-text="source">{e(archive_text()["source"])}</a></p>' if item['source'] else ''
        minutes = max(1, (len(item['body'].split()) + 199) // 200)
        body = f'<article lang="{item["lang"]}"><a href="archive/" data-archive-text="back">{e(archive_text()["back"])}</a><header class="archive-header"><p class="archive-meta">{type_label(item['type'])} · <time>{item["date"]}</time> · <span data-reading-minutes="{minutes}">{e(archive_text()["readingTime"].replace("{minutes}", str(minutes)))}</span></p><h1>{e(item["title"])}</h1><p class="section__lede">{e(item["description"])}</p><div class="archive-tags">{tags_html(item["tags"])}</div></header><div class="archive-prose">{source}{render_markdown(item["body"])}</div></article>'
        dest = archive / slug
        dest.mkdir()
        (dest / 'index.html').write_text(page(item['title'], item['description'], body, 2, item['lang']))
    all_tags = sorted({t for item in entries for t in item['tags']}, key=str.casefold)
    buttons = ''.join(f'<button class="chip" type="button" data-tag="{e(t, quote=True)}" aria-pressed="false">{e(t)}</button>' for t in all_tags)
    content = f'<header><span class="section__eyebrow" data-archive-text="name">{e(archive_text()["name"])}</span><h1 class="section__title" data-archive-text="title">{e(archive_text()["title"])}</h1><p class="section__lede" data-archive-text="description">{e(archive_text()["description"])}</p></header><div id="archiveFilters" hidden><label for="archiveSearch" data-archive-text="search">{e(archive_text()["search"])}</label><input type="search" id="archiveSearch" placeholder="{e(archive_text()["placeholder"], quote=True)}" /><div class="archive-tags"><button class="chip" type="button" data-tag="" aria-pressed="true" data-archive-text="all">{e(archive_text()["all"])}</button>{buttons}</div></div><p id="archiveCount" class="archive-meta" role="status"></p><div id="archiveEntries">{"".join(rows)}</div><p id="archiveEmpty" {"hidden" if rows else ""}>{e(archive_text()["empty" if not rows else "noResults"])}</p>'
    (archive / 'index.html').write_text(page(archive_text()['name'], archive_text()['description'], content, 1))
    print(f'Sitio generado en {output}: {len(entries)} entradas')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'dist')
    build(parser.parse_args().output)
