import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// FE-RTL-CSS-001 to FE-RTL-CSS-004
//
// styles/rtl.css carries what the logical utilities cannot say for Arabic: user
// text that lines up with the UI in its own direction, arrows that turn round
// in the touch shell, and Arabic's caption labels. jsdom applies no
// stylesheet, so these read the real file.
const css = readFileSync(resolve(process.cwd(), 'src/styles/rtl.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of the rule whose selector text contains every given part. */
function ruleBody(...parts: string[]): string {
  for (const chunk of css.split('}')) {
    const open = chunk.indexOf('{');
    if (open < 0) continue;
    const head = chunk.slice(0, open);
    if (parts.every((part) => head.includes(part))) return chunk.slice(open + 1);
  }
  return '';
}

describe('rtl.css', () => {
  it('FE-RTL-CSS-001: the stylesheet is loaded with the app', () => {
    const main = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');
    expect(main).toMatch(/import '\.\/styles\/rtl\.css'/);
  });

  it('FE-RTL-CSS-002: cut, clamped or typed user text in its own direction sits on the UI start edge', () => {
    const body = ruleBody(
      ":root[dir='rtl'] [dir='auto']:dir(ltr)",
      '.truncate',
      "[class*='line-clamp-']",
      'input',
      'textarea'
    );
    expect(body).toMatch(/text-align:\s*end/);
    // The left-to-right UI gets the mirror case: Arabic text in an English row.
    expect(css).toContain(":root[dir='ltr'] [dir='auto']:dir(rtl)");
    // Zero specificity: an explicit alignment class on the element still wins.
    expect(css).toMatch(/:where\(\s*:root\[dir='rtl'\]/);
  });

  it('FE-RTL-CSS-003: in the touch shell every back, forward and flow arrow turns round in a right-to-left language', () => {
    const body = ruleBody(
      ":root[dir='rtl'] .m-root",
      '.lucide-chevron-left',
      '.lucide-chevron-right',
      '.lucide-arrow-left',
      '.lucide-arrow-right'
    );
    expect(body).toMatch(/scale:\s*-1 1/);
    // An icon that names its own treatment keeps it.
    expect(css).toContain(":not([class*='rtl:'])");
  });

  it('FE-RTL-CSS-004: Arabic and Hebrew caption labels grow, drop the tracking and take the muted ink', () => {
    expect(ruleBody(':lang(ar)', ':lang(he)', '.m-root .uppercase')).toMatch(/zoom:\s*1\.2[\s\S]*letter-spacing:\s*0/);
    expect(ruleBody('.uppercase.text-m-faint')).toMatch(/color:\s*var\(--m-muted\)/);
  });
});
