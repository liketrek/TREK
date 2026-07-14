import path from 'path';
import { existsSync, promises as fs } from 'fs';

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

const REPO = 'mauriceboe/TREK';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main/wiki`;
const TTL_MS = 60 * 60 * 1000; // remote fallback only: refresh from GitHub at most hourly
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * `server/{src,dist}/services` both sit three levels under the repo root, so this
 * one anchor resolves in dev, a built source install, vitest, and Docker (where
 * the Dockerfile copies `wiki/` to /app/wiki). `process.cwd()` would not — Docker
 * runs the server from /app/server.
 */
const WIKI_DIR = process.env.TREK_WIKI_DIR ?? path.join(__dirname, '..', '..', '..', 'wiki');

/**
 * Probe for the sidebar rather than the bare directory: an empty or half-copied
 * `wiki/` should fall back to GitHub, not serve an empty table of contents.
 */
const useLocalWiki = existsSync(path.join(WIKI_DIR, '_Sidebar.md'));

if (!useLocalWiki) {
  console.warn(`[help] wiki not found at ${WIKI_DIR} — falling back to the GitHub wiki (help may not match this version)`);
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
    });
    if (res.ok) {
      const text = await res.text();
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
    const heading = raw.match(/^#{1,4}\s+(.+?)\s*$/);
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
    const [title, slugRaw] = inner.includes('|') ? inner.split('|') : [inner, inner];
    const slug = slugRaw.trim().replace(/\s+/g, '-');
    return `[${title.trim()}](/help/${slug})`;
  });
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (m, alt: string, url: string) => {
    if (/^https?:\/\//i.test(url) || url.startsWith('/api/help/asset/')) return m;
    const clean = url.replace(/^\.?\//, '').replace(/^wiki\//, '');
    return `![${alt}](/api/help/asset/${clean})`;
  });
  return out;
}

function extractTitle(md: string, fallback: string): string {
  const h1 = md.match(/^#\s+(.+?)\s*$/m);
  return h1 ? h1[1].replace(/[*_`]/g, '').trim() : fallback.replace(/-/g, ' ');
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
    });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      assetCache.set(assetPath, { buf, type, ts: Date.now() });
      return { buf, type };
    }
  } catch {
    /* fall through */
  }
  if (cached) return { buf: cached.buf, type: cached.type };
  throw new WikiNotFound(assetPath);
}
