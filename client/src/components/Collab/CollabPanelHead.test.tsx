// FE-COLLAB-PANELHEAD-001 to FE-COLLAB-PANELHEAD-004
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { StickyNote } from 'lucide-react';
import CollabPanelHead, { HEAD_ACTION } from './CollabPanelHead';

describe('CollabPanelHead', () => {
  it('FE-COLLAB-PANELHEAD-001: names the panel as a heading with how many there are', () => {
    render(<CollabPanelHead icon={StickyNote} title="Notes" count={4} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('FE-COLLAB-PANELHEAD-002: an empty or unknown count is left out', () => {
    const { rerender } = render(<CollabPanelHead icon={StickyNote} title="Notes" count={0} />);
    expect(screen.queryByText('0')).toBeNull();
    rerender(<CollabPanelHead icon={StickyNote} title="Notes" />);
    expect(screen.getByRole('heading', { name: 'Notes' }).parentElement?.querySelectorAll('span')).toHaveLength(0);
  });

  it('FE-COLLAB-PANELHEAD-003: its actions sit on the right and work', async () => {
    const onAdd = vi.fn();
    render(<CollabPanelHead icon={StickyNote} title="Polls" actions={<button type="button" className={HEAD_ACTION} onClick={onAdd}>New poll</button>} />);
    await userEvent.click(screen.getByRole('button', { name: 'New poll' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('FE-COLLAB-PANELHEAD-004: without actions there is no action area', () => {
    render(<CollabPanelHead icon={StickyNote} title="Chat" count={2} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
