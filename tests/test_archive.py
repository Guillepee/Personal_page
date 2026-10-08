import tempfile
import json
import unittest
from unittest.mock import patch
from pathlib import Path
from tools.build_site import ROOT, load_entries, render_markdown, build


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = Path(self.tmp.name)

    def write(self, name='entry', extra='', body='## Texto\n\nHola'):
        (self.folder / f'{name}.md').write_text(f'---\ntitle: Título\ndescription: Descripción\ndate: 2026-10-05\npublished: true\n{extra}---\n{body}')

    def test_archive_translations_have_matching_keys(self):
        es = json.loads((ROOT / 'me/content.es.json').read_text())['archive']
        en = json.loads((ROOT / 'me/content.en.json').read_text())['archive']
        self.assertEqual(es.keys(), en.keys())
        self.assertEqual(es['types'].keys(), en['types'].keys())
        self.assertEqual(en['name'], 'Library')
        self.assertIn('{count}', en['count'])

    def test_drafts_are_excluded(self):
        (self.folder / 'draft.md').write_text('---\npublished: false\n---\nPrivado')
        self.assertEqual(load_entries(self.folder), [])

    def test_sort_and_metadata(self):
        self.write('older', 'date: 2026-09-01\ntags: [IA, Python]\n')
        self.write('newer')
        result = load_entries(self.folder)
        self.assertEqual([x['slug'] for x in result], ['newer', 'older'])
        self.assertEqual(result[1]['tags'], ['IA', 'Python'])

    def test_reject_bad_metadata(self):
        for extra in ('slug: ../../oops\n', 'source: javascript:alert(1)\n', 'date: 2026-02-30\n', 'tags: Python\n', 'type: invalid\n'):
            with self.subTest(extra=extra):
                self.write(extra=extra)
                with self.assertRaises(ValueError):
                    load_entries(self.folder)

    def test_duplicate_slug(self):
        self.write('one', 'slug: same\n')
        self.write('two', 'slug: same\n')
        with self.assertRaises(ValueError):
            load_entries(self.folder)

    def test_html_and_unsafe_links(self):
        html = render_markdown('<script>alert(1)</script>\n\n[click](javascript:alert(1))')
        self.assertNotIn('<script>', html)
        self.assertNotIn('href="javascript:', html)

    def test_published_article_paths_and_escape(self):
        self.write(body='## Sección\n\n[PDF](archive/assets/test.pdf)')
        entry = load_entries(self.folder)[0]
        entry['title'] = '<Texto>'
        out = self.folder / 'dist'
        with patch('tools.build_site.load_entries', return_value=[entry]):
            build(out)
        article = (out / 'archive/entry/index.html').read_text()
        self.assertIn('<base href="../../"', article)
        self.assertIn('data-archive-text="back"', article)
        self.assertIn('data-archive-type="note"', article)
        self.assertIn('<article lang="es">', article)
        self.assertIn('&lt;Texto&gt;', article)
        self.assertIn('href="archive/assets/test.pdf"', article)
        self.assertIn('href="index.html#about"', article)
        self.assertIn('href="archive/entry/"', (out / 'archive/index.html').read_text())

    def test_build_keeps_existing_pages_and_excludes_sources(self):
        out = self.folder / 'dist'
        build(out)
        self.assertTrue((out / 'index.html').exists())
        self.assertTrue((out / 'guias/claude-code.html').exists())
        self.assertTrue((out / 'focustube-privacy.html').exists())
        self.assertFalse((out / 'me/archive/content').exists())
        self.assertIn('<base href="../"', (out / 'archive/index.html').read_text())
        self.assertNotIn('mi-primera-nota/', (out / 'archive/index.html').read_text())


if __name__ == '__main__':
    unittest.main()
