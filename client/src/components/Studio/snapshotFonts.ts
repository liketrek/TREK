/**
 * The typefaces a page snapshot for the assistant carries, and only those.
 *
 * modern-screenshot draws the page as an SVG image, and an SVG image cannot
 * reach the document's fonts, so every face it shows has to travel inside it.
 * Left to itself the library embeds every @font-face rule of every family the
 * page names: all nine weights of Montserrat, both styles, every script
 * subset, woff and woff2. With thirty four book families that is megabytes of
 * fonts per page for a picture whose text uses one weight of two families.
 *
 * So the snapshot reads what the page really draws (family, weight, slant and
 * the characters set in it), picks the one rule per subset the browser would
 * pick for that, and hands the library exactly those faces as data URLs. A
 * page set in Lora and Caveat embeds the latin files of Lora and Caveat, and
 * nothing else.
 */

/** One @font-face rule, as far as the choice of face goes. */
export interface FaceRule {
  family: string;
  weight: number;
  italic: boolean;
  /** The CSS unicode-range, or '' for a face that covers everything. */
  unicodeRange: string;
  /** The woff2 file, else the first file the rule names, resolved to a full URL. */
  url: string;
}

/** What the page draws in one face: the characters set in it. */
type FaceUses = Map<string, Set<number>>;

const faceKey = (family: string, weight: number, italic: boolean) => `${family.toLowerCase()}|${weight}|${italic}`;

const unquote = (v: string) => v.trim().replace(/^["']|["']$/g, '');

/** A rule's descriptors by name, read from its text: `font-weight: 700` and the like. */
function descriptors(css: string): Map<string, string> {
  const body = css.slice(css.indexOf('{') + 1, css.lastIndexOf('}'));
  const out = new Map<string, string>();
  for (const part of body.split(';')) {
    const at = part.indexOf(':');
    if (at > 0) out.set(part.slice(0, at).trim().toLowerCase(), part.slice(at + 1).trim());
  }
  return out;
}

/** A CSS weight as a number: the keywords as CSS reads them, anything else as 400. */
export function cssWeight(value: string): number {
  if (value === 'bold') return 700;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 1 && n <= 1000 ? n : 400;
}

/** The file a rule's src names, the woff2 one first, resolved against where the stylesheet came from. */
function sourceOf(src: string, base: string): string | null {
  const urls = [...src.matchAll(/url\((["']?)([^"')]+)\1\) ?(?:format\(["']?([\w-]+)["']?\))?/g)];
  const pick = urls.find((m) => m[3] === 'woff2') ?? urls[0];
  if (!pick?.[2]) return null;
  try {
    return new URL(pick[2], base).href;
  } catch {
    // A source no URL can be made of is a face the snapshot does without.
    return null;
  }
}

/** One @font-face rule read from its text, or null for any other rule or one that names no file. */
export function parseFaceRule(css: string, base: string): FaceRule | null {
  if (!css.trimStart().toLowerCase().startsWith('@font-face')) return null;
  const d = descriptors(css);
  const family = unquote(d.get('font-family') ?? '');
  const url = sourceOf(d.get('src') ?? '', base);
  if (!family || !url) return null;
  return {
    family,
    weight: cssWeight(d.get('font-weight') || '400'),
    italic: /italic|oblique/i.test(d.get('font-style') ?? ''),
    unicodeRange: d.get('unicode-range') ?? '',
    url,
  };
}

/** A unicode-range as code point spans: `U+0000-00FF, U+0131, U+4??` all read. */
export function parseUnicodeRange(range: string): [number, number][] {
  return range
    .split(',')
    .map((part) => part.trim().replace(/^u\+/i, ''))
    .filter(Boolean)
    .flatMap((part): [number, number][] => {
      if (part.includes('?')) {
        return [[Number.parseInt(part.replace(/\?/g, '0'), 16), Number.parseInt(part.replace(/\?/g, 'F'), 16)]];
      }
      const [from, to] = part.split('-');
      const a = Number.parseInt(from ?? '', 16);
      const b = to === undefined ? a : Number.parseInt(to, 16);
      return Number.isFinite(a) && Number.isFinite(b) ? [[a, b]] : [];
    });
}

/** Whether a rule's range takes any of the characters; a rule without one takes them all. */
export function coversAny(range: string, chars: ReadonlySet<number>): boolean {
  if (!range) return true;
  const spans = parseUnicodeRange(range);
  for (const c of chars) if (spans.some(([a, b]) => c >= a && c <= b)) return true;
  return false;
}

/**
 * The rules the browser would draw these uses with: per family and slant, the
 * nearest weight it has (the renderer only ever asks for weights a family
 * ships, so this is the exact one in practice), an upright face where there is
 * no italic, and of those only the subsets whose range the text reaches.
 */
export function pickFaceRules(rules: readonly FaceRule[], uses: FaceUses): FaceRule[] {
  const picked = new Map<string, FaceRule>();
  for (const [key, chars] of uses) {
    const [family = '', weightText = '400', italicText = 'false'] = key.split('|');
    const weight = Number(weightText);
    const ofFamily = rules.filter((r) => r.family.toLowerCase() === family);
    const slanted = ofFamily.filter((r) => r.italic === (italicText === 'true'));
    const styled = slanted.length ? slanted : ofFamily.filter((r) => !r.italic);
    if (!styled.length) continue;
    const nearest = styled.reduce(
      (best, r) => (Math.abs(r.weight - weight) < Math.abs(best.weight - weight) ? r : best),
      styled[0]
    ).weight;
    for (const rule of styled) {
      if (rule.weight === nearest && coversAny(rule.unicodeRange, chars)) picked.set(rule.url, rule);
    }
  }
  return [...picked.values()];
}

/** The faces the text under `root` is set in, each with the characters it sets. */
export function faceUsesOf(root: Element): FaceUses {
  const uses: FaceUses = new Map();
  const view = root.ownerDocument.defaultView;
  if (!view) return uses;
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const words = node.textContent ?? '';
    const parent = node.parentElement;
    if (!parent || !words.trim()) continue;
    const style = view.getComputedStyle(parent);
    const family = unquote(style.fontFamily.split(',')[0] ?? '');
    if (!family) continue;
    const key = faceKey(family, cssWeight(style.fontWeight), /italic|oblique/.test(style.fontStyle));
    const chars = uses.get(key) ?? new Set<number>();
    for (const ch of words) {
      const code = ch.codePointAt(0);
      if (code !== undefined && code > 32) chars.add(code);
    }
    uses.set(key, chars);
  }
  return uses;
}

/** Every @font-face rule the document's stylesheets hold, inside grouping rules too. */
export function faceRulesOf(doc: Document): FaceRule[] {
  const out: FaceRule[] = [];
  const walk = (list: CSSRuleList, base: string) => {
    for (const rule of Array.from(list)) {
      const face = parseFaceRule(rule.cssText, base);
      if (face) out.push(face);
      else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules, base);
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // A stylesheet from another origin cannot be read, and holds no book face.
      continue;
    }
    walk(rules, sheet.href ?? doc.baseURI);
  }
  return out;
}

/** A file as a data URL. */
function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('font read failed'));
    reader.readAsDataURL(blob);
  });
}

type FetchFont = (url: string) => Promise<Blob | null>;

/** A face file from this server, out of the cache when the page has already drawn it. */
const fetchFont: FetchFont = async (url) => {
  if (new URL(url).origin !== window.location.origin) return null;
  const res = await fetch(url, {
    credentials: 'same-origin',
    cache: 'force-cache',
    signal: AbortSignal.timeout(8_000),
  });
  return res.ok ? res.blob() : null;
};

/** One face as a rule the snapshot can carry: its file inline. */
async function inlineRule(rule: FaceRule, load: FetchFont): Promise<string | null> {
  try {
    const blob = await load(rule.url);
    if (!blob) return null;
    const range = rule.unicodeRange ? `unicode-range:${rule.unicodeRange};` : '';
    const family = rule.family.replace(/"/g, '');
    const style = rule.italic ? 'italic' : 'normal';
    return `@font-face{font-family:"${family}";font-style:${style};font-weight:${rule.weight};${range}src:url(${await asDataUrl(blob)});}`;
  } catch {
    // A face that cannot be fetched is drawn in its fallback; the page still goes.
    return null;
  }
}

/**
 * The @font-face rules for the faces the page under `root` draws, with their
 * files inline, ready for modern-screenshot's `font.cssText`. Null when there
 * is nothing to carry, so the caller lets the library look for itself.
 */
export async function snapshotFontCss(
  root: Element,
  load: FetchFont = fetchFont,
  available: readonly FaceRule[] = faceRulesOf(root.ownerDocument)
): Promise<string | null> {
  const rules = pickFaceRules(available, faceUsesOf(root));
  if (!rules.length) return null;
  const inlined = await Promise.all(rules.map((rule) => inlineRule(rule, load)));
  const css = inlined.filter((r): r is string => r !== null);
  return css.length ? css.join('\n') : null;
}
