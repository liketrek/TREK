import { Shapes, Type } from 'lucide-react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { StudioTabPanel, StudioTabs } from './StudioTabs';

/**
 * FE-STUDIO-TABS-001 to FE-STUDIO-TABS-005: the tab rows inside Studio's
 * panels, as a screen reader and a keyboard meet them, and as a long word
 * meets them.
 */

type Id = 'one' | 'two' | 'three';

function Row({ onChange = () => {} }: { onChange?: (id: Id) => void }) {
  const [value, setValue] = useState<Id>('one');
  return (
    <>
      <StudioTabs<Id>
        idBase="t"
        label="Kinds"
        value={value}
        columns={2}
        onChange={(id) => {
          setValue(id);
          onChange(id);
        }}
        tabs={[
          { id: 'one', label: 'Klistermärken', icon: Type, count: 12 },
          { id: 'two', label: 'Two', icon: Shapes },
          { id: 'three', label: 'Three' },
        ]}
      />
      <StudioTabPanel idBase="t" value={value} className="body">
        <p>{value}</p>
      </StudioTabPanel>
    </>
  );
}

describe('StudioTabs', () => {
  it('FE-STUDIO-TABS-001: is a tab list naming its panel, with only the chosen tab in the Tab order', () => {
    render(<Row />);
    const list = screen.getByRole('tablist', { name: 'Kinds' });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    expect(tabs[0]?.getAttribute('aria-controls')).toBe('t-panel');
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe('t-tab-one');
    expect(panel.className).toBe('body');
    expect(list.className).toContain('st-subtabs');
  });

  it('FE-STUDIO-TABS-002: opens a tab on a click and moves the focus with the arrows without opening', () => {
    const onChange = vi.fn();
    render(<Row onChange={onChange} />);
    const [one, two, three] = screen.getAllByRole('tab');
    one?.focus();
    fireEvent.keyDown(one as HTMLElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(two);
    fireEvent.keyDown(two as HTMLElement, { key: 'End' });
    expect(document.activeElement).toBe(three);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(three as HTMLElement);
    expect(onChange).toHaveBeenCalledWith('three');
    expect(screen.getByRole('tabpanel').textContent).toBe('three');
    expect(three?.tabIndex).toBe(0);
  });

  it('FE-STUDIO-TABS-005: in a grid of two lines, up and down move to the tab above or below', () => {
    render(<Row />);
    const [one, two, three] = screen.getAllByRole('tab');
    one?.focus();
    fireEvent.keyDown(one as HTMLElement, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(three);
    fireEvent.keyDown(three as HTMLElement, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(one);
    two?.focus();
    // Nothing below the second tab: the focus stays.
    fireEvent.keyDown(two as HTMLElement, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(two);
  });

  it('FE-STUDIO-TABS-003: keeps a long word in a cell that breaks it, and the count as plain figures', () => {
    const { container } = render(<Row />);
    const label = screen.getByText('Klistermärken');
    expect(label.className).toBe('st-subtab-label');
    expect(container.querySelector('.st-subtab-count')?.textContent).toBe('12');
    // A row with icons stacks each word under its icon, so the word has the whole cell.
    expect(container.querySelector('.st-subtabs')?.classList.contains('has-icons')).toBe(true);
  });

  it('FE-STUDIO-TABS-004: lays a row without icons out flat', () => {
    const { container } = render(
      <StudioTabs idBase="u" label="Plain" value="a" onChange={() => {}} tabs={[{ id: 'a', label: 'A' }]} />
    );
    expect(container.querySelector('.st-subtabs')?.classList.contains('has-icons')).toBe(false);
    expect(screen.getByRole('tab', { name: 'A' })).toBeTruthy();
  });
});
