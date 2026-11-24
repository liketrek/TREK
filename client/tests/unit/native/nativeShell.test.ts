import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { directionOf, pickLocale, translator } from '../../../native-shell/i18n';

// FE-NATIVE-SHELL-001 to FE-NATIVE-SHELL-006
//
// The app's own first screens (client/native-shell): which language and reading
// direction they start in, and the layout rules in shell.css that no component
// test reaches (jsdom applies no stylesheet, so these read the real file).

/** Every rule of a stylesheet as its selector list, its declarations and the media query around it, comments dropped. */
function rules(css: string): { selectors: string[]; body: string; media: string }[] {
  const out: { selectors: string[]; body: string; media: string }[] = [];
  const stack: string[] = [];
  let buf = '';
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      const head = stack.pop() ?? '';
      if (!head.startsWith('@')) {
        const media = stack.filter((h) => h.startsWith('@media')).join(' ');
        out.push({ selectors: head.split(',').map((sel) => sel.trim()), body: buf, media });
      }
      buf = '';
    } else {
      buf += ch;
    }
  }
  return out;
}

const css = readFileSync(resolve(process.cwd(), 'native-shell/shell.css'), 'utf8');
const all = rules(css);
const find = (selector: string, media?: RegExp) =>
  all.filter((r) => r.selectors.includes(selector) && (!media || media.test(r.media)));

describe('native shell', () => {
  it('FE-NATIVE-SHELL-001: Arabic and Hebrew start right to left, every other language left to right', () => {
    expect(pickLocale(['ar-SA'])).toBe('ar');
    expect(pickLocale(['he-IL'])).toBe('he');
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('he')).toBe('rtl');
    expect(directionOf('ru')).toBe('ltr');
    expect(directionOf('de')).toBe('ltr');
  });

  it('FE-NATIVE-SHELL-002: the first screens speak without dashes as punctuation', () => {
    for (const code of ['en', 'de']) {
      const t = translator(code);
      for (const key of ['native.welcome.lead', 'native.plans.yearlyIs', 'native.provisioning.readySub']) {
        expect(t(key)).not.toMatch(/[\u2013\u2014]| - /);
      }
    }
  });

  it("FE-NATIVE-SHELL-003: Russian keeps the shell's faces through Cyrillic stand-ins under the same family names", () => {
    const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    const cyrillic = faces.filter((f) => /unicode-range:\s*U\+0301, U\+0400-045F/.test(f));
    expect(cyrillic.filter((f) => /font-family:\s*'Poppins'/.test(f))).toHaveLength(3);
    expect(cyrillic.filter((f) => /font-family:\s*'Plus Jakarta Sans'/.test(f))).toHaveLength(3);
    for (const face of faces) {
      const file = /url\('\.\/fonts\/([^']+)'\)/.exec(face)?.[1];
      expect(file).toBeTruthy();
      expect(() => readFileSync(resolve(process.cwd(), 'native-shell/fonts', file as string))).not.toThrow();
    }
  });

  it('FE-NATIVE-SHELL-004: a wide screen or a phone on its side puts the landscape beside a column of its own', () => {
    const wide = /min-width: 900px\), \(orientation: landscape\) and \(max-height: 500px\)/;
    expect(find('.scr', wide)[0]?.body).toMatch(/flex-direction:\s*row/);
    expect(find('.body', wide)[0]?.body).toMatch(/overflow-y:\s*auto/);
    // On a phone the content is no box of its own: it flows in the screen's column.
    expect(find('.body')[0]?.body).toMatch(/display:\s*contents/);
    // Two screens with a hinge: the landscape on one, the content on the other.
    expect(find('.body', /horizontal-viewport-segments: 2/)[0]?.body).toMatch(/env\(viewport-segment-width 1 0\)/);
  });

  it('FE-NATIVE-SHELL-005: a screen taller than the window scrolls instead of overflowing both edges', () => {
    expect(find('.scr')[0]?.body).toMatch(/overflow-y:\s*auto/);
    const shell = find('.shell')[0]?.body ?? '';
    expect(shell).toMatch(/overflow-x:\s*clip/);
    expect(shell).not.toMatch(/justify-content:\s*center/);
    // The button at the foot stays in reach while the screen scrolls under it.
    expect(find('.dock')[0]?.body).toMatch(/position:\s*sticky/);
  });

  it('FE-NATIVE-SHELL-006: in Arabic and Hebrew the layout mirrors through logical sides only', () => {
    expect(find(":root[dir='rtl'] .back svg")[0]?.body).toMatch(/transform:\s*scaleX\(-1\)/);
    expect(find(":root[dir='rtl'] .cycle[data-year='true'] .thumb")[0]?.body).toMatch(/translateX\(-100%\)/);
    expect(find('.fld .edge')[0]?.body).toMatch(/inset-inline-end:\s*14px/);
    expect(find('.card')[0]?.body).toMatch(/inset-inline:/);
    expect(css).not.toMatch(
      /margin-left|margin-right|padding-left|padding-right|text-align:\s*left|[^-]left:\s|[^-]right:\s/
    );
  });
});
