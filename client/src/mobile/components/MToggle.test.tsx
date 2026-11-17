import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import MToggle from './MToggle';

vi.mock('../../native/haptics', () => ({ selectionHaptic: vi.fn() }));

describe('MToggle', () => {
  it('FE-MOB-TOGGLE-001: on, the knob takes the track ink so it stays visible on the near-white dark track', () => {
    const onChange = vi.fn();
    const { rerender } = render(<MToggle checked onChange={onChange} ariaLabel="Offline" />);
    const knob = screen.getByRole('switch').firstElementChild as HTMLElement;
    expect(knob.className).toContain('bg-[color:var(--m-actfg)]');
    expect(knob.className).not.toContain('--m-knob');

    rerender(<MToggle checked={false} onChange={onChange} ariaLabel="Offline" />);
    expect((screen.getByRole('switch').firstElementChild as HTMLElement).className).toContain(
      'bg-[color:var(--m-knob)]'
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
