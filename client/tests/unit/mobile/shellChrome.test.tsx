import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import MGlassBar from '../../../src/mobile/components/MGlassBar';
import { render, screen } from '../../helpers/render';

// FE-MOB-CHROME-001 onwards: the touch shell's own chrome against what the
// desktop pages bring along.

const root = resolve(__dirname, '../../..');

describe('desktop chrome inside the touch shell', () => {
  it('FE-MOB-CHROME-001: a page without a phone screen shows no desktop navbar over the rail, and keeps no room for it', () => {
    // /plugins/:id, /help and a trip's files still render through PageShell. jsdom
    // applies no stylesheet, so the rule and the mark it needs are read from source.
    const css = readFileSync(resolve(root, 'src/mobile/mobile.css'), 'utf8');
    expect(css).toMatch(/html:has\(\.m-shell\) \{\s*--nav-h: 0px;\s*\}/);
    expect(css).toMatch(/html:has\(\.m-shell\) \[data-desktop-navbar\] \{\s*display: none;\s*\}/);
    const navbar = readFileSync(resolve(root, 'src/components/Layout/Navbar.tsx'), 'utf8');
    expect(navbar).toContain('data-desktop-navbar=""');
  });
});

describe('MGlassBar', () => {
  it('FE-MOB-CHROME-002: a floating bar stands in the content column, padded and capped like it', () => {
    render(
      <MGlassBar column="wide:max-w-[1280px]">
        <span>bar</span>
      </MGlassBar>
    );
    const bar = screen.getByText('bar').parentElement as HTMLElement;
    const column = bar.parentElement as HTMLElement;
    expect(column.className).toContain('px-4');
    expect(column.className).toContain('wide:px-6');
    expect(column.className).toContain('wide:max-w-[1280px]');
    expect(column.parentElement?.className).toContain('m-span-x');
    // The strip around the bar lets taps through to the page.
    expect(column.parentElement?.className).toContain('pointer-events-none');
    expect(bar.className).toContain('pointer-events-auto');
  });

  it('FE-MOB-CHROME-003: in flow it is the bar alone', () => {
    const { container } = render(
      <MGlassBar floating={false}>
        <span>bar</span>
      </MGlassBar>
    );
    expect(container.firstElementChild).toBe(screen.getByText('bar').parentElement);
  });
});

describe('safe area in the touch shell', () => {
  // jsdom applies no stylesheet and has no env(), so the rules are read from source.
  const css = readFileSync(resolve(root, 'src/mobile/mobile.css'), 'utf8');
  const wideRoot = "html:has(.m-shell[data-size='wide'], .m-shell[data-size='split']) .m-root {";
  const rtlWideRoot = "html[dir='rtl']:has(.m-shell[data-size='wide'], .m-shell[data-size='split']) .m-root {";
  const block = (selector: string) => css.split(selector)[1]?.split('}')[0] ?? '';

  it('FE-MOB-CHROME-004: the insets take env() with the measurement of the app as a floor, never in its place', () => {
    expect(css).toContain('--m-raw-t: max(env(safe-area-inset-top, 0px), var(--trek-native-safe-top, 0px));');
    expect(css).toContain('--m-raw-l: max(env(safe-area-inset-left, 0px), var(--trek-native-safe-left, 0px));');
    expect(css).toContain('--m-raw-r: max(env(safe-area-inset-right, 0px), var(--trek-native-safe-right, 0px));');
    expect(css).toContain('--m-safe-top: calc(var(--m-safe-t) + 12px);');
  });

  it('FE-MOB-CHROME-005: without the rail the floating bars keep clear of a side inset, such as a camera in a corner', () => {
    const narrow = "html:not(:has(.m-shell[data-size='wide'], .m-shell[data-size='split'])) :is(.m-bar-x, .m-span-x) {";
    const rule = css.split(narrow)[1]?.split('}')[0] ?? '';
    expect(rule).toContain('margin-inline: var(--m-safe-l-gap, 0px) var(--m-safe-r-gap, 0px);');
    // The insets are the screen's: right to left takes them the other way round.
    const rtl = css.split(`html[dir='rtl']${narrow.slice('html'.length)}`)[1]?.split('}')[0] ?? '';
    expect(rtl).toContain('margin-inline: var(--m-safe-r-gap, 0px) var(--m-safe-l-gap, 0px);');
    // On a wide window the bars keep no side margin, so mx-auto still centres them.
    for (const cls of ['m-bar-x', 'm-span-x']) {
      expect(css.split(`\n.${cls} {`)[1]?.split('}')[0] ?? '').not.toContain('margin');
    }
  });

  it('FE-MOB-CHROME-006: a side inset gets a little air, and none where there is no inset', () => {
    expect(css).toContain('--m-safe-r-gap: calc(var(--m-safe-r) + min(var(--m-safe-r), 8px));');
    expect(css).toContain('--m-safe-l-gap: calc(var(--m-safe-l) + min(var(--m-safe-l), 8px));');
  });

  it('FE-MOB-CHROME-007: on a wide window the bars end before the trailing inset, by their box, not a margin', () => {
    const wide = "html:has(.m-shell[data-size='wide'], .m-shell[data-size='split']) .m-bar-x {";
    expect(block(wide)).toContain('inset-inline-end: calc(16px + var(--m-safe-r-gap, 0px));');
    const rtl = `html[dir='rtl']:has(.m-shell[data-size='wide'], .m-shell[data-size='split']) .m-bar-x {`;
    expect(block(rtl)).toContain('inset-inline-end: calc(16px + var(--m-safe-l-gap, 0px));');
  });

  it('FE-MOB-CHROME-008: the page keeps clear of the side insets, the leading one left to the rail on a wide window', () => {
    expect(block('\n.m-page {')).toContain('margin-inline: var(--m-safe-l, 0px) var(--m-safe-r, 0px);');
    expect(block('\n.m-page {')).not.toContain('padding-top');
    expect(block("html[dir='rtl'] .m-page {")).toContain('margin-inline: var(--m-safe-r, 0px) var(--m-safe-l, 0px);');
    const wide = block("html:has(.m-shell[data-size='wide'], .m-shell[data-size='split']) .m-page {");
    expect(wide).toContain('margin-inline-start: 0;');
    expect(wide).toContain('margin-inline-end: var(--m-safe-r-gap, 0px);');
    const rtlWide = block("html[dir='rtl']:has(.m-shell[data-size='wide'], .m-shell[data-size='split']) .m-page {");
    expect(rtlWide).toContain('margin-inline-end: var(--m-safe-l-gap, 0px);');
  });

  it('FE-MOB-CHROME-009: upright, an element in a top corner counts as top inset, and the sides keep their width', () => {
    // A Duo's status capsule: everything that clears the top clears it too.
    expect(css).toContain('--m-safe-t: max(var(--m-raw-t), var(--trek-native-corner-bottom, 0px));');
    // iOS reports it as a side inset as well; upright that width is given back.
    expect(css).toContain('--m-safe-l: max(0px, var(--m-raw-l) - var(--trek-native-corner-left, 0px));');
    expect(css).toContain('--m-safe-r: max(0px, var(--m-raw-r) - var(--trek-native-corner-right, 0px));');
  });

  it('FE-MOB-CHROME-010: on a wide window the corner element takes its side over the whole height instead', () => {
    const wide = block(wideRoot);
    expect(wide).toContain('--m-safe-t: var(--m-raw-t);');
    expect(wide).toContain('--m-safe-l: max(var(--m-raw-l), var(--trek-native-corner-left, 0px));');
    expect(wide).toContain('--m-safe-r: max(var(--m-raw-r), var(--trek-native-corner-right, 0px));');
    expect(wide).toContain('--m-rail-w: calc(var(--m-safe-l) + 100px);');
    // Right to left the rail stands on the other side and takes that inset.
    expect(block(rtlWideRoot)).toContain('--m-rail-w: calc(var(--m-safe-r) + 100px);');
  });

  it('FE-MOB-CHROME-011: rows and layers a screen places itself keep to the same insets, and no screen handles the corner on its own', () => {
    const narrowRow = "html:not(:has(.m-shell[data-size='wide'], .m-shell[data-size='split'])) .m-safe-row {";
    expect(block(narrowRow)).toContain('margin-inline: var(--m-safe-l-gap, 0px) var(--m-safe-r-gap, 0px);');
    const wideBoth =
      "html:has(.m-shell[data-size='wide'], .m-shell[data-size='split']) :is(.m-safe-row, .m-safe-trail) {";
    expect(block(wideBoth)).toContain('margin-inline-end: var(--m-safe-r-gap, 0px);');
    const src = (file: string) => readFileSync(resolve(root, 'src', file), 'utf8');
    expect(src('mobile/screens/trip/MTripShellParts.tsx')).toContain("CHROME_ROW = 'm-safe-row absolute end-4");
    expect(src('mobile/screens/trip/MTripShell.tsx')).toContain('<div className="m-safe-trail relative h-full">');
    expect(src('mobile/screens/trip/map/MMapArea.tsx')).toContain('m-safe-row pointer-events-none absolute end-4');
    expect(src('mobile/components/MSheet.tsx')).toContain('${base} m-safe-trail ');
    // The capsule's own measurement is read in mobile.css alone.
    expect(src('mobile/MobileShell.tsx')).not.toContain('corner.css');
    for (const file of [
      'mobile/components/MSectionNav.tsx',
      'mobile/screens/trip/tabs/tabChrome.tsx',
      'mobile/screens/journey/MJourneyDetail.tsx',
      'mobile/screens/vacay/MVacay.tsx',
    ]) {
      expect(src(file)).not.toMatch(/m-corner|trek-native-corner/);
    }
  });
});
