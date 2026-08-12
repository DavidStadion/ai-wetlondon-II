/**
 * Turns content/articles/*.md into public/data/articles.json.
 *
 * Articles are markdown files in the repo rather than database rows, so a new
 * one is a file you add. That matters more than it sounds: it means publishing
 * weekly does not depend on anyone building you an editor first. GitHub's own
 * web editor handles markdown perfectly well, and every push deploys.
 *
 * Markdown is converted to HTML here, at build time, so the browser never has to
 * carry a markdown parser and the prerenderer gets real article HTML to put in
 * the page. That second part is the whole point: an article whose words only
 * appear after JavaScript runs is invisible to the people we are writing for.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'content', 'articles');

/** Minimal frontmatter: key: value pairs between --- fences. */
function parse(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

const words = (s) => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

if (!existsSync(DIR)) {
  console.warn('[articles] no content/articles directory, nothing to build');
  process.exit(0);
}

const articles = readdirSync(DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const { meta, body } = parse(readFileSync(join(DIR, f), 'utf8'));
    const html = marked.parse(body, { mangle: false, headerIds: false });
    return {
      slug: meta.slug || f.replace(/\.md$/, ''),
      title: meta.title || f,
      dek: meta.dek || '',
      date: meta.date || '',
      lead: meta.lead || '',          // venue name, used for the cover image
      readingMinutes: Math.max(2, Math.round(words(html) / 220)),
      wordCount: words(html),
      html,
    };
  })
  // newest first
  .sort((a, b) => (a.date < b.date ? 1 : -1));

mkdirSync(join(ROOT, 'public', 'data'), { recursive: true });
writeFileSync(join(ROOT, 'public', 'data', 'articles.json'), JSON.stringify(articles, null, 2));
for (const a of articles) console.log(`[articles] ${a.slug}: ${a.wordCount} words, ${a.readingMinutes} min`);
console.log(`[articles] wrote ${articles.length} articles`);
