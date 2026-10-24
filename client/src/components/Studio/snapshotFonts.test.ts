import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  coversAny,
  cssWeight,
  faceRulesOf,
  faceUsesOf,
  parseFaceRule,
  parseUnicodeRange,
  pickFaceRules,
  snapshotFontCss,
  type FaceRule,
} from './snapshotFonts';

/**
 * The faces a page snapshot carries (FE-STUDIO-SNAPFONT): what the page draws
 * is read off the DOM, the browser's choice of rule is repeated, and only the
 * faces it would pick go into the image, each with its file inline.
 */

const BASE = 'https://trek.example/assets/app.css';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153';
const EXT = 'U+0100-02BA, U+1E00-1E9F';

const rule = (family: string, weight: number, italic: boolean, range: string, file: string): FaceRule => ({
  family,
  weight,
  italic,
  unicodeRange: range,
  url: `https://trek.example/assets/${file}`,
});

const RULES = [
  rule('Lora', 400, false, LATIN, 'lora-latin-400-normal.woff2'),
  rule('Lora', 400, false, EXT, 'lora-latin-ext-400-normal.woff2'),
  rule('Lora', 700, false, LATIN, 'lora-latin-700-normal.woff2'),
  rule('Lora', 400, true, LATIN, 'lora-latin-400-italic.woff2'),
  rule('Caveat', 400, false, LATIN, 'caveat-latin-400-normal.woff2'),
  rule('Anton', 400, false, LATIN, 'anton-latin-400-normal.woff2'),
];

const chars = (s: string) => new Set([...s].map((c) => c.codePointAt(0) ?? 0));
const files = (picked: FaceRule[]) => picked.map((r) => r.url.split('/').pop()).sort();

function page(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('reading a rule', () => {
  it('FE-STUDIO-SNAPFONT-001: reads family, weight, slant, range and the woff2 file of an @font-face rule', () => {
    const css =
      "@font-face { font-family: 'Lora'; font-style: italic; font-display: swap; font-weight: 700; " +
      'src: url(./files/lora-latin-700-italic.woff2) format("woff2"), url(./files/lora-latin-700-italic.woff) format("woff"); ' +
      `unicode-range: ${LATIN}; }`;
    expect(parseFaceRule(css, BASE)).toEqual({
      family: 'Lora',
      weight: 700,
      italic: true,
      unicodeRange: LATIN,
      url: 'https://trek.example/assets/files/lora-latin-700-italic.woff2',
    });
    const plain = '@font-face { font-family: "Anton"; src: url("/assets/anton.woff") format("woff"); }';
    expect(parseFaceRule(plain, BASE)).toMatchObject({
      weight: 400,
      italic: false,
      unicodeRange: '',
      url: 'https://trek.example/assets/anton.woff',
    });
    expect(parseFaceRule('.x { color: red; }', BASE)).toBeNull();
    expect(parseFaceRule('@font-face { font-family: "NoFile"; }', BASE)).toBeNull();
    expect(parseFaceRule('@font-face { src: url(a.woff2); }', BASE)).toBeNull();
  });

  it('FE-STUDIO-SNAPFONT-002: reads weights and unicode ranges as CSS does', () => {
    expect([cssWeight('bold'), cssWeight('normal'), cssWeight('300'), cssWeight('5000')]).toEqual([700, 400, 300, 400]);
    expect(parseUnicodeRange('U+0000-00FF, U+0131, U+4??')).toEqual([
      [0, 0xff],
      [0x131, 0x131],
      [0x400, 0x4ff],
    ]);
    expect(parseUnicodeRange('U+zz, ')).toEqual([]);
    expect(coversAny(LATIN, chars('Lisboa'))).toBe(true);
    expect(coversAny(EXT, chars('Lisboa'))).toBe(false);
    expect(coversAny(EXT, chars('Łódź'))).toBe(true);
    expect(coversAny('', chars('anything'))).toBe(true);
  });
});

describe('choosing the faces', () => {
  it('FE-STUDIO-SNAPFONT-003: picks one rule per subset the text reaches, at the weight and slant it is set in', () => {
    const uses = new Map([
      ['lora|700|false', chars('Porto')],
      ['caveat|400|false', chars('travel')],
    ]);
    expect(files(pickFaceRules(RULES, uses))).toEqual(['caveat-latin-400-normal.woff2', 'lora-latin-700-normal.woff2']);
    // Polish needs the extended subset beside the basic one.
    const polish = new Map([['lora|400|false', chars('Kraków Łódź')]]);
    expect(files(pickFaceRules(RULES, polish))).toEqual([
      'lora-latin-400-normal.woff2',
      'lora-latin-ext-400-normal.woff2',
    ]);
  });

  it('FE-STUDIO-SNAPFONT-004: falls back the way the browser does: the nearest weight, the upright face, nothing for an unknown family', () => {
    expect(files(pickFaceRules(RULES, new Map([['lora|600|false', chars('a')]])))).toEqual([
      'lora-latin-700-normal.woff2',
    ]);
    expect(files(pickFaceRules(RULES, new Map([['lora|400|true', chars('a')]])))).toEqual([
      'lora-latin-400-italic.woff2',
    ]);
    expect(files(pickFaceRules(RULES, new Map([['anton|400|true', chars('a')]])))).toEqual([
      'anton-latin-400-normal.woff2',
    ]);
    expect(pickFaceRules(RULES, new Map([['georgia|400|false', chars('a')]]))).toEqual([]);
  });
});

describe('reading the page', () => {
  it('FE-STUDIO-SNAPFONT-005: reads every face the text under the root is set in, with its characters', () => {
    const root = page(
      '<p style="font-family: \'Lora\', Georgia, serif; font-weight: 700">Porto</p>' +
        '<svg><text style="font-family: Caveat, cursive; font-style: italic">ab</text></svg>' +
        '<p style="font-family: Lora; font-weight: bold">Té</p>' +
        '<p style="font-family: Anton">   </p>'
    );
    const uses = faceUsesOf(root);
    expect([...uses.keys()].sort()).toEqual(['caveat|400|true', 'lora|700|false']);
    expect(uses.get('lora|700|false')).toEqual(chars('PortoTé'));
  });

  it('FE-STUDIO-SNAPFONT-006: reads the face rules of the stylesheets it may read, inside grouping rules too', () => {
    const face = (family: string) => ({
      cssText: `@font-face { font-family: "${family}"; src: url(/assets/${family}.woff2) format("woff2"); }`,
    });
    const fake = {
      baseURI: 'https://trek.example/',
      styleSheets: [
        {
          href: null,
          cssRules: [face('Lora'), { cssText: '.x{}' }, { cssText: '@media print {}', cssRules: [face('Anton')] }],
        },
        {
          href: 'https://cdn.example/a.css',
          get cssRules(): never {
            throw new DOMException('cross origin', 'SecurityError');
          },
        },
      ],
    } as unknown as Document;
    expect(faceRulesOf(fake).map((r) => [r.family, r.url])).toEqual([
      ['Lora', 'https://trek.example/assets/Lora.woff2'],
      ['Anton', 'https://trek.example/assets/Anton.woff2'],
    ]);
  });
});

describe('the snapshot css', () => {
  it('FE-STUDIO-SNAPFONT-007: inlines exactly the faces the page draws, and leaves out one that will not load', async () => {
    const root = page(
      '<p style="font-family: Lora; font-weight: 700">Porto</p><p style="font-family: Caveat">travel</p>'
    );
    const load = vi.fn(async (url: string) =>
      url.includes('caveat') ? null : new Blob(['font'], { type: 'font/woff2' })
    );
    const css = await snapshotFontCss(root, load, RULES);
    expect(load.mock.calls.map(([url]) => url.split('/').pop()).sort()).toEqual([
      'caveat-latin-400-normal.woff2',
      'lora-latin-700-normal.woff2',
    ]);
    expect(css).toContain('@font-face{font-family:"Lora";font-style:normal;font-weight:700;unicode-range:U+0000-00FF');
    expect(css).toContain('src:url(data:font/woff2;base64,');
    expect(css).not.toContain('Caveat');
  });

  it('FE-STUDIO-SNAPFONT-008: answers null when the page draws no bundled face or none of its files load, so the library looks for itself', async () => {
    const root = page('<p style="font-family: Georgia">Porto</p>');
    expect(await snapshotFontCss(root, vi.fn(), RULES)).toBeNull();
    const lora = page('<p style="font-family: Lora">Porto</p>');
    const failing = vi.fn(async () => {
      throw new Error('offline');
    });
    expect(await snapshotFontCss(lora, failing, RULES)).toBeNull();
  });
});
