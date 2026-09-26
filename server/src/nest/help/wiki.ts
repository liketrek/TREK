import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { readEnv } from '../../app-config';
import { exceedsDeclaredLength, readCapped, readCappedText } from '../../utils/cappedFetch';

/**
 * In-app Help/Wiki content, sourced from the `wiki/**` directory that ships with
 * the app — the same content that CI mirrors to the public GitHub wiki. Reading
 * from disk keeps the help pages pinned to the running version (a v1.2 install
 * shows v1.2 docs, not whatever `main` says) and works offline.
 *
 * If that directory can't be resolved — an unusual layout, an image built without
 * it — we fall back to fetching from the GitHub wiki over the network and caching
 * hourly, so help degrades instead of disappearing. The client never talks to
 * GitHub directly either way; images are proxied through /api/help/asset.
 */

const REPO = 'liketrek/TREK';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main/wiki`;
const TTL_MS = 60 * 60 * 1000; // remote fallback only: refresh from GitHub at most hourly
// Remote fallback only: raw.githubusercontent.com is a third party on the
// request path, so it gets a deadline and a size budget like every other
// outbound client. A page or a screenshot over the budget falls through to the
// stale-cache path instead of being buffered whole.
const WIKI_TIMEOUT_MS = 8000;
const WIKI_MAX_BYTES = 2 * 1024 * 1024;
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * `server/{src,dist}/nest/help` both sit four levels under the repo root, so this
 * one anchor resolves in dev, a built source install, vitest, and Docker (where
 * the Dockerfile copies `wiki/` to /app/wiki). `process.cwd()` would not — Docker
 * runs the server from /app/server. The depth is counted from THIS file: it was
 * three while the module lived in `src/services`.
 */
const WIKI_DIR = readEnv().paths.wikiDir ?? path.join(__dirname, '..', '..', '..', '..', 'wiki');

/**
 * Probe for the sidebar rather than the bare directory: an empty or half-copied
 * `wiki/` should fall back to GitHub, not serve an empty table of contents.
 */
const useLocalWiki = existsSync(path.join(WIKI_DIR, '_Sidebar.md'));

if (!useLocalWiki) {
  console.warn(
    `[help] wiki not found at ${WIKI_DIR} — falling back to the GitHub wiki (help may not match this version)`,
  );
}

export class WikiNotFound extends Error {
  status = 404;
}

interface TextEntry {
  data: string;
  ts: number;
}
const textCache = new Map<string, TextEntry>();
const assetCache = new Map<string, { buf: Buffer; type: string; ts: number }>();

const fresh = (ts: number): boolean => Date.now() - ts < TTL_MS;

/** Resolve a path inside the wiki dir, refusing anything that escapes it. */
function resolveInWiki(rel: string): string {
  const root = path.resolve(WIKI_DIR);
  const full = path.resolve(root, rel);
  if (full !== root && !full.startsWith(root + path.sep)) throw new WikiNotFound(rel);
  return full;
}

/** Fetch a wiki text file: local disk, or GitHub with cache → stale-cache fallback. */
async function fetchText(file: string): Promise<string> {
  if (useLocalWiki) {
    try {
      return await fs.readFile(resolveInWiki(file), 'utf8');
    } catch (err) {
      if (err instanceof WikiNotFound) throw err;
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') throw new WikiNotFound(file);
      throw err;
    }
  }

  const cached = textCache.get(file);
  if (cached && fresh(cached.ts)) return cached.data;
  try {
    const res = await fetch(`${RAW_BASE}/${encodeURIComponent(file)}`, {
      headers: { 'User-Agent': 'TREK-help', Accept: 'text/plain' },
      signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
    });
    if (res.ok && !exceedsDeclaredLength(res, WIKI_MAX_BYTES)) {
      const { text, truncated } = await readCappedText(res, WIKI_MAX_BYTES);
      if (truncated) throw new Error('wiki page exceeds size limit');
      textCache.set(file, { data: text, ts: Date.now() });
      return text;
    }
    if (res.status === 404) throw new WikiNotFound(file);
  } catch (err) {
    if (err instanceof WikiNotFound) throw err;
    // network/parse error — fall through to stale cache
  }
  if (cached) return cached.data; // serve stale rather than fail
  throw new WikiNotFound(file);
}

export interface WikiNavItem {
  title: string;
  slug: string;
}
export interface WikiNavSection {
  title: string;
  pages: WikiNavItem[];
}

/** Parse the wiki `_Sidebar.md` into ordered sections of `[[Title|Slug]]` links. */
function parseSidebar(md: string): WikiNavSection[] {
  const sections: WikiNavSection[] = [];
  let current: WikiNavSection | null = null;
  for (const raw of md.split('\n')) {
    // The title, trimmed: a run that starts and ends on a non-space, or a single
    // character (a heading whose body is only spaces still opens a section, the way
    // `(.+?)\s*$` did). Spelled out so no two quantifiers compete for the same
    // spaces — that pairing backtracks quadratically on a long ragged line.
    const heading = raw.match(/^#{1,4}\s+(\S.*\S|.)\s*$/);
    if (heading) {
      current = { title: heading[1].replace(/[*_`]/g, '').trim(), pages: [] };
      sections.push(current);
      continue;
    }
    const link = raw.match(/^\s*[-*]\s*\[\[([^\]]+)\]\]/);
    if (link) {
      if (!current) {
        current = { title: '', pages: [] };
        sections.push(current);
      }
      const inner = link[1];
      const [title, slugRaw] = inner.includes('|') ? inner.split('|') : [inner, inner];
      const slug = slugRaw.trim().replace(/\s+/g, '-');
      if (SLUG_RE.test(slug)) current.pages.push({ title: title.trim(), slug });
    }
  }
  return sections.filter((s) => s.pages.length > 0);
}

/** Rewrite GitHub-wiki `[[..]]` links to /help routes and proxy relative images. */
function processMarkdown(md: string): string {
  // Strip HTML comments (e.g. `<!-- TODO: screenshot … -->` placeholders) — the
  // markdown renderer would otherwise surface them as raw text.
  let out = md.replace(/<!--[\s\S]*?-->/g, '');
  out = out.replace(/\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
    const [titleRaw, slugRaw] = inner.includes('|') ? inner.split('|') : [inner, inner];
    const slug = slugRaw.trim().replace(/\s+/g, '-');
    // `[[Plugin Development#talking-to-plugins|Plugin-Development]]` must not
    // render its anchor as visible link text.
    const [title, anchor] = titleRaw.includes('#') ? titleRaw.split('#') : [titleRaw, ''];
    const hash = anchor ? `#${anchor.trim()}` : '';
    return `[${title.trim()}](/help/${slug}${hash})`;
  });
  // The optional title after the URL (`![a](u "t")`) has to start on whitespace,
  // so it cannot compete with the URL group for the same characters.
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(\s[^)]*)?\)/g, (m, alt: string, url: string) => {
    if (/^https?:\/\//i.test(url) || url.startsWith('/api/help/asset/')) return m;
    const clean = url.replace(/^\.?\//, '').replace(/^wiki\//, '');
    return `![${alt}](/api/help/asset/${clean})`;
  });
  // Bare relative links — `[Currencies](Currencies)`, the native GitHub-wiki
  // spelling and by far the most common in these pages (455 of them across 81
  // files, against 114 `[[..]]` links). GitHub resolves them against the wiki
  // root; in-app they used to fall through to HelpPage's external-link branch
  // and open a dead tab. Rewriting them here fixes every page at once and keeps
  // the source GitHub-compatible, so contributors can keep writing either form.
  //
  // Runs last: `[[..]]` links and images have already become absolute paths by
  // this point, so the leading-slash guard skips them.
  out = outsideCode(out, (segment) =>
    segment.replace(/(^|[^!])\[([^\]]+)\]\(([^)\s]+)\)/g, (m, prefix: string, text: string, url: string) => {
      if (/^(https?:|mailto:|tel:|#|\/)/i.test(url)) return m;
      const [pageRaw, anchor] = url.includes('#') ? url.split('#') : [url, ''];
      const page = pageRaw.replace(/^\.?\//, '').replace(/\.md$/i, '').trim();
      if (!page || !SLUG_RE.test(page)) return m;
      return `${prefix}[${text}](/help/${page}${anchor ? `#${anchor}` : ''})`;
    }),
  );
  return out;
}

/**
 * Apply `fn` to the parts of the markdown that are NOT code, leaving fenced
 * blocks and inline spans untouched.
 *
 * Without this the link rewriter corrupts code samples: Plugin-Development.md
 * documents `actions[key](ctx)`, which reads as a markdown link and would be
 * rewritten to `actions[key](/help/ctx)` inside what is supposed to be a
 * verbatim snippet.
 */
function outsideCode(md: string, fn: (segment: string) => string): string {
  // Alternation order matters: fenced blocks first, so a ``` fence containing
  // backticks is consumed whole rather than being split by the inline rule.
  const CODE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g;
  const parts = md.split(CODE);
  // split() with a capturing group yields [text, code, text, code, …].
  return parts.map((part, i) => (i % 2 === 1 ? part : fn(part))).join('');
}

function extractTitle(md: string, fallback: string): string {
  // Same shape as the sidebar heading above — see the note there.
  const h1 = md.match(/^#\s+(\S.*\S|.)\s*$/m);
  return h1 ? h1[1].replace(/[*_`]/g, '').trim() : fallback.replaceAll('-', ' ');
}

export interface WikiPage {
  slug: string;
  title: string;
  markdown: string;
}

/** True when help is served from the bundled wiki rather than fetched from GitHub. */
export const isLocalWiki = (): boolean => useLocalWiki;

export async function getWikiIndex(): Promise<{ sections: WikiNavSection[] }> {
  const md = await fetchText('_Sidebar.md');
  return { sections: parseSidebar(md) };
}

export async function getWikiPage(slug: string): Promise<WikiPage> {
  if (!SLUG_RE.test(slug)) throw new WikiNotFound(slug);
  const md = await fetchText(`${slug}.md`);
  return { slug, title: extractTitle(md, slug), markdown: processMarkdown(md) };
}

const ASSET_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/** Read a wiki image from disk, or proxy it from GitHub so the browser never calls it directly. */
export async function getWikiAsset(assetPath: string): Promise<{ buf: Buffer; type: string }> {
  // Defend against traversal; allow nested image folders.
  if (assetPath.includes('..') || !/^[A-Za-z0-9/._-]+$/.test(assetPath)) throw new WikiNotFound(assetPath);
  const ext = path.extname(assetPath).toLowerCase();
  const type = ASSET_TYPES[ext];
  if (!type) throw new WikiNotFound(assetPath);

  if (useLocalWiki) {
    try {
      // resolveInWiki re-checks containment: the regex above is a filter, this is the boundary.
      const buf = await fs.readFile(resolveInWiki(assetPath));
      return { buf, type };
    } catch (err) {
      if (err instanceof WikiNotFound) throw err;
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') throw new WikiNotFound(assetPath);
      throw err;
    }
  }

  const cached = assetCache.get(assetPath);
  if (cached && fresh(cached.ts)) return { buf: cached.buf, type: cached.type };
  try {
    const res = await fetch(`${RAW_BASE}/${assetPath.split('/').map(encodeURIComponent).join('/')}`, {
      headers: { 'User-Agent': 'TREK-help' },
      signal: AbortSignal.timeout(WIKI_TIMEOUT_MS),
    });
    if (res.ok && !exceedsDeclaredLength(res, WIKI_MAX_BYTES)) {
      const { bytes: buf, truncated } = await readCapped(res, WIKI_MAX_BYTES);
      if (truncated) throw new Error('wiki asset exceeds size limit');
      assetCache.set(assetPath, { buf, type, ts: Date.now() });
      return { buf, type };
    }
  } catch {
    /* fall through */
  }
  if (cached) return { buf: cached.buf, type: cached.type };
  throw new WikiNotFound(assetPath);
}

// ── Full-text search ─────────────────────────────────────────────────────────

export interface WikiSearchHit {
  slug: string;
  title: string;
  section: string;
  /** The heading the best match sits under, as a GitHub-style anchor, or null for the page top. */
  anchor: string | null;
  heading: string | null;
  snippet: string;
  score: number;
}

interface IndexedPage {
  slug: string;
  title: string;
  section: string;
  /** Plain text of the whole page as written, for snippets. */
  plain: string;
  /** The same, lower-cased once, for scoring. */
  text: string;
  /** Headings in document order with the plain text that follows each one. */
  chunks: { heading: string; anchor: string; text: string }[];
}

const SEARCH_MAX_QUERY = 120;
const SEARCH_MAX_LIMIT = 20;
const SNIPPET_RADIUS = 90;

let indexCache: { pages: IndexedPage[]; ts: number } | null = null;
let indexBuild: Promise<IndexedPage[]> | null = null;

/** GitHub's heading anchor: lower-case, punctuation dropped, spaces to hyphens. */
function headingAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Markdown to the words a reader actually sees: code fences and HTML comments go,
 * link and image syntax collapses to its label, `[[Title|Slug]]` keeps the title,
 * emphasis markers and table pipes are dropped. Good enough for ranking; the page
 * itself is still rendered from the real markdown.
 */
function toPlainText(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~>|#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a page at its headings so a hit can point at the section it lives in. */
function chunkByHeading(md: string): IndexedPage['chunks'] {
  const chunks: IndexedPage['chunks'] = [];
  let heading = '';
  let buf: string[] = [];
  const flush = () => {
    const text = toPlainText(buf.join('\n'));
    if (heading || text) chunks.push({ heading, anchor: heading ? headingAnchor(heading) : '', text });
    buf = [];
  };
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^(```|~~~)/.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^#{2,4}\s+(\S.*\S|.)\s*$/);
    if (h) {
      flush();
      heading = h[1].replace(/[*_`]/g, '').trim();
      continue;
    }
    buf.push(line);
  }
  flush();
  return chunks;
}

async function buildIndex(): Promise<IndexedPage[]> {
  const { sections } = await getWikiIndex();
  const jobs = sections.flatMap((section) =>
    section.pages.map(async (p): Promise<IndexedPage | null> => {
      try {
        const md = await fetchText(`${p.slug}.md`);
        const plain = toPlainText(md);
        return {
          slug: p.slug,
          title: extractTitle(md, p.slug),
          section: section.title,
          plain,
          text: plain.toLowerCase(),
          chunks: chunkByHeading(md),
        };
      } catch {
        // One unreadable page must not take the whole search down.
        return null;
      }
    }),
  );
  const pages = (await Promise.all(jobs)).filter((p): p is IndexedPage => p !== null);
  return pages;
}

async function getIndex(): Promise<IndexedPage[]> {
  // The bundled wiki is pinned to this build, so its index never goes stale;
  // the GitHub fallback refreshes on the same hourly TTL as the pages.
  if (indexCache && (useLocalWiki || fresh(indexCache.ts))) return indexCache.pages;
  if (!indexBuild) {
    indexBuild = buildIndex()
      .then((pages) => {
        indexCache = { pages, ts: Date.now() };
        return pages;
      })
      .finally(() => {
        indexBuild = null;
      });
  }
  return indexBuild;
}

/** Cut a readable window around the first occurrence of `needle` (or the start of the text). */
function snippetAround(text: string, needle: string): string {
  const lower = text.toLowerCase();
  const at = needle ? lower.indexOf(needle) : -1;
  if (at < 0) return text.length > SNIPPET_RADIUS * 2 ? `${text.slice(0, SNIPPET_RADIUS * 2).trimEnd()}…` : text;
  let start = Math.max(0, at - SNIPPET_RADIUS);
  let end = Math.min(text.length, at + needle.length + SNIPPET_RADIUS);
  // Snap to word boundaries so the window doesn't open or close mid-word.
  if (start > 0) {
    const sp = text.lastIndexOf(' ', start);
    start = sp > 0 ? sp + 1 : start;
  }
  if (end < text.length) {
    const sp = text.indexOf(' ', end);
    end = sp > 0 ? sp : end;
  }
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i >= 0 && n < 50) {
    n++;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}

/**
 * Rank wiki pages against a free-text query. Title hits weigh most, then the
 * heading a chunk sits under, then plain body occurrences; the whole phrase
 * beats its scattered words. Returns at most `limit` hits, best first.
 */
export async function searchWiki(query: string, limit = 8): Promise<WikiSearchHit[]> {
  const q = query.trim().toLowerCase().slice(0, SEARCH_MAX_QUERY);
  const tokens = Array.from(new Set(q.split(/\s+/).filter((t) => t.length >= 2)));
  if (!q || tokens.length === 0) return [];
  const max = Math.min(Math.max(1, Math.floor(limit)), SEARCH_MAX_LIMIT);

  const pages = await getIndex();
  const hits: WikiSearchHit[] = [];
  for (const page of pages) {
    const title = page.title.toLowerCase();
    let score = 0;
    if (title.includes(q)) score += 12;
    for (const t of tokens) {
      if (title.includes(t)) score += 6;
      score += Math.min(5, countOccurrences(page.text, t));
    }
    if (tokens.length > 1 && page.text.includes(q)) score += 4;
    if (score === 0) continue;

    // Best chunk: the heading + text that carries the most of the query.
    let best: IndexedPage['chunks'][number] | null = null;
    let bestScore = 0;
    for (const chunk of page.chunks) {
      const h = chunk.heading.toLowerCase();
      const body = chunk.text.toLowerCase();
      let s = 0;
      if (h && h.includes(q)) s += 8;
      for (const t of tokens) {
        if (h.includes(t)) s += 4;
        if (body.includes(t)) s += 1;
      }
      if (body.includes(q)) s += 3;
      if (s > bestScore) {
        bestScore = s;
        best = chunk;
      }
    }
    if (best?.heading) score += 3;

    const source = best?.text || page.plain;
    const needle = source.toLowerCase().includes(q) ? q : (tokens.find((t) => source.toLowerCase().includes(t)) ?? '');
    hits.push({
      slug: page.slug,
      title: page.title,
      section: page.section,
      anchor: best?.anchor || null,
      heading: best?.heading || null,
      snippet: snippetAround(source, needle),
      score,
    });
  }
  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return hits.slice(0, max);
}
