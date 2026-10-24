import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { PopoverListPanel } from './dialogParts';
import { usePopoverList } from './usePopoverList';

// FE-POPOVER-LIST-001 to FE-POPOVER-LIST-006

function Picker({ current = 1, onPick = vi.fn() }: { current?: number; onPick?: (index: number) => void }) {
  const list = usePopoverList(current);
  const { open, toggle, close, triggerRef } = list;
  return (
    <>
      <button type="button" ref={triggerRef} onClick={toggle} aria-expanded={open}>
        trigger
      </button>
      <PopoverListPanel list={list} label="choices">
        {['one', 'two', 'three'].map((name, index) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              onPick(index);
              close();
            }}
          >
            {name}
          </button>
        ))}
      </PopoverListPanel>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'trigger' });

afterEach(() => vi.restoreAllMocks());

describe('usePopoverList', () => {
  it('FE-POPOVER-LIST-001: opening puts the focus on the current choice', () => {
    render(<Picker current={1} />);
    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'choices' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'two' })).toHaveFocus();
  });

  it('FE-POPOVER-LIST-002: the arrows walk round the list, Home and End go to its ends', () => {
    render(<Picker current={0} />);
    fireEvent.click(trigger());
    const group = screen.getByRole('group');
    fireEvent.keyDown(group, { key: 'ArrowUp' });
    expect(screen.getByRole('button', { name: 'three' })).toHaveFocus();
    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: 'one' })).toHaveFocus();
    fireEvent.keyDown(group, { key: 'End' });
    expect(screen.getByRole('button', { name: 'three' })).toHaveFocus();
    fireEvent.keyDown(group, { key: 'Home' });
    expect(screen.getByRole('button', { name: 'one' })).toHaveFocus();
    fireEvent.keyDown(group, { key: 'x' });
    expect(screen.getByRole('button', { name: 'one' })).toHaveFocus();
  });

  it('FE-POPOVER-LIST-003: Escape closes the list only, and gives the focus back to the button', () => {
    const outer = vi.fn();
    document.addEventListener('keydown', outer);
    render(<Picker />);
    fireEvent.click(trigger());
    fireEvent.keyDown(screen.getByRole('button', { name: 'two' }), { key: 'Escape' });
    expect(screen.queryByRole('group')).toBeNull();
    expect(trigger()).toHaveFocus();
    expect(outer).not.toHaveBeenCalled();
    document.removeEventListener('keydown', outer);
  });

  it('FE-POPOVER-LIST-004: Tab closes it and goes on from the button; a click beside it closes it', () => {
    render(<Picker />);
    fireEvent.click(trigger());
    fireEvent.keyDown(screen.getByRole('group'), { key: 'Tab' });
    expect(screen.queryByRole('group')).toBeNull();
    expect(trigger()).toHaveFocus();
    fireEvent.click(trigger());
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('FE-POPOVER-LIST-005: a choice closes the list and hands the focus back', () => {
    const onPick = vi.fn();
    render(<Picker onPick={onPick} />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'three' }));
    expect(onPick).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('group')).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('FE-POPOVER-LIST-006: a list that would run past the window moves back inside it, and stays where it fits', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const isList = this.getAttribute('role') === 'group';
      const left = isList ? window.innerWidth - 100 : window.innerWidth - 40;
      return { left, right: left + 240, top: 10, bottom: 40, width: 240, height: 30, x: left, y: 10 } as DOMRect;
    });
    render(<Picker />);
    fireEvent.click(trigger());
    // 240 wide from 100 short of the edge: 140 past it, and the 8 kept clear of it.
    expect(screen.getByRole('group').style.translate).toBe('-148px 0');
  });
});
