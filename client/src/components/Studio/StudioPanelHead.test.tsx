import { describe, expect, it } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import { PanelHead, Shelf } from './StudioPanelHead';

/**
 * FE-STUDIO-HEAD-001 to FE-STUDIO-HEAD-003: the one head every Studio panel
 * opens on, and the shelf the panels on the left group their catalogues in.
 */

describe('the panel head', () => {
  it('FE-STUDIO-HEAD-001: names the panel as a heading, with its count, a fact and its actions', () => {
    const { container } = render(
      <PanelHead label="Pages" count={7} meta="210 × 210 mm" actions={<button type="button">Act</button>} />
    );
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('Pages7');
    expect(container.querySelector('.st-what-label')?.textContent).toBe('Pages');
    expect(container.querySelector('.st-what em')?.textContent).toBe('7');
    expect(container.querySelector('.st-head-meta')?.textContent).toBe('210 × 210 mm');
    expect(container.querySelector('.st-head-acts button')?.textContent).toBe('Act');
  });

  it('FE-STUDIO-HEAD-002: leaves out what it is not given, and keeps a long name in a label that wraps', () => {
    const long = 'Gruppierung aufheben und Ausrichtung zurücksetzen';
    const { container } = render(<PanelHead label={long} />);
    expect(container.querySelector('.st-what em')).toBeNull();
    expect(container.querySelector('.st-head-meta')).toBeNull();
    expect(container.querySelector('.st-head-acts')).toBeNull();
    expect(container.querySelector('.st-what-label')?.textContent).toBe(long);
  });
});

describe('the shelf', () => {
  it('FE-STUDIO-HEAD-003: heads its things with a label and closes with a hint, or holds them bare', () => {
    const { container, rerender } = render(
      <Shelf label="Stars" hint="Click one to add it.">
        <button type="button">Star</button>
      </Shelf>
    );
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Stars');
    expect(container.querySelector('.st-shelf > .st-shelf-hint')?.textContent).toBe('Click one to add it.');
    rerender(
      <Shelf>
        <button type="button">Star</button>
      </Shelf>
    );
    expect(screen.queryByRole('heading')).toBeNull();
    expect(container.querySelector('.st-shelf-hint')).toBeNull();
    expect(screen.getByRole('button', { name: 'Star' })).toBeTruthy();
  });
});
