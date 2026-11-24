import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import MContextMenu from './MContextMenu';

describe('MContextMenu', () => {
  it('FE-MOB-CTXMENU-001: names what it is about, lists the actions, and closes before running one', () => {
    const onClose = vi.fn();
    const onDelete = vi.fn(() => expect(onClose).toHaveBeenCalled());
    render(
      <MContextMenu
        open
        title="Lisbon"
        onClose={onClose}
        actions={[
          { key: 'edit', label: 'Edit', icon: <span />, onClick: vi.fn() },
          { key: 'delete', label: 'Delete', icon: <span />, onClick: onDelete },
        ]}
      />
    );
    expect(screen.getByText('Lisbon')).toBeTruthy();
    const del = screen.getByText('Delete').closest('button') as HTMLElement;
    expect(del.className).toContain('--m-st-danger');
    fireEvent.click(del);
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
