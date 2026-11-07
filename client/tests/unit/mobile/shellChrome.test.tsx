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
