import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MSheet from '../../../src/mobile/components/MSheet';
import { closeTopOverlay } from '../../../src/mobile/overlayStack';

// FE-MOB-SHEET-001 onwards

describe('MSheet', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = '';
  });

  it('FE-MOB-SHEET-001: renders its children in a dialog when open', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Test sheet">
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Test sheet' })).toBeInTheDocument();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('FE-MOB-SHEET-002: renders nothing while closed', () => {
    render(
      <MSheet open={false} onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('FE-MOB-SHEET-003: backdrop click closes, clicks inside the panel do not', () => {
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} ariaLabel="Test sheet">
        <span>Sheet content</span>
      </MSheet>,
    );

    fireEvent.click(screen.getByText('Sheet content'));
    expect(onClose).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.closest('[role="presentation"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-004: Escape closes the sheet', () => {
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose}>
        <span>Sheet content</span>
      </MSheet>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-005: stays mounted for the exit animation, then unmounts', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <MSheet open onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    rerender(
      <MSheet open={false} onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    // Still visible right after closing (exit animation running).
    expect(screen.getByText('Sheet content')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
  });

  it('FE-MOB-SHEET-007: Tab wraps around inside the dialog', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Trap">
        <button type="button">first</button>
        <button type="button">last</button>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    const first = screen.getByText('first');
    const last = screen.getByText('last');

    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('FE-MOB-SHEET-008: shift+Tab from the panel itself jumps to the last control', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Trap">
        <button type="button">first</button>
        <button type="button">last</button>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    dialog.focus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText('last'));
  });

  it('FE-MOB-SHEET-009: keys other than Tab pass through', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Trap">
        <button type="button">first</button>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    const first = screen.getByText('first');
    first.focus();

    fireEvent.keyDown(dialog, { key: 'a' });

    expect(document.activeElement).toBe(first);
  });

  it('FE-MOB-SHEET-010: a sheet without focusable content swallows Tab', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Empty">
        <span>nothing to focus</span>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');

    const handled = fireEvent.keyDown(dialog, { key: 'Tab' });

    // fireEvent returns false once a listener called preventDefault.
    expect(handled).toBe(false);
  });

  it('FE-MOB-SHEET-011: the entrance animation class is dropped once it has played', () => {
    render(
      <MSheet open onClose={() => {}} ariaLabel="Anim">
        <span>Sheet content</span>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('m-sheet-in');

    // jsdom has no AnimationEvent, so React binds the vendor-prefixed name.
    act(() => {
      dialog.dispatchEvent(new Event('animationend', { bubbles: true }));
      dialog.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
    });

    expect(dialog.className).not.toContain('m-sheet-in');
  });

  it('FE-MOB-SHEET-012: dragging the bottom sheet far enough dismisses it', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
        <span>Sheet content</span>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    Object.defineProperty(dialog, 'offsetHeight', { configurable: true, value: 400 });
    const strip = dialog.querySelector('.cursor-grab') as HTMLElement;

    fireEvent.pointerDown(strip, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 260 });
    expect(dialog.getAttribute('style')).toContain('translateY(160px)');
    // A slow last move keeps the velocity low, so only the 30% travel rule can close it.
    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 260.3 });

    fireEvent.pointerUp(strip, { pointerId: 1, clientY: 260.3 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-015: a quick flick dismisses even without much travel', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
        <span>Sheet content</span>
      </MSheet>,
    );
    const strip = screen.getByRole('dialog').querySelector('.cursor-grab') as HTMLElement;

    fireEvent.pointerDown(strip, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 130 });
    fireEvent.pointerUp(strip, { pointerId: 1, clientY: 130 });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-013: a short drag snaps back instead of closing', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
        <span>Sheet content</span>
      </MSheet>,
    );
    const dialog = screen.getByRole('dialog');
    Object.defineProperty(dialog, 'offsetHeight', { configurable: true, value: 400 });
    const strip = dialog.querySelector('.cursor-grab') as HTMLElement;

    fireEvent.pointerDown(strip, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 100.4 });
    fireEvent.pointerCancel(strip, { pointerId: 1, clientY: 100.4 });

    expect(onClose).not.toHaveBeenCalled();
    expect(dialog.getAttribute('style')).toContain('transform 280ms');
  });

  it('FE-MOB-SHEET-014: pointer moves without a drag in progress are ignored', () => {
    const onClose = vi.fn();
    render(
      <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
        <span>Sheet content</span>
      </MSheet>,
    );
    const strip = screen.getByRole('dialog').querySelector('.cursor-grab') as HTMLElement;

    fireEvent.pointerMove(strip, { pointerId: 1, clientY: 400 });
    fireEvent.pointerUp(strip, { pointerId: 1, clientY: 400 });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-MOB-SHEET-006: locks body scroll while open and releases it on close', () => {
    const { rerender } = render(
      <MSheet open onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <MSheet open={false} onClose={() => {}}>
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('FE-MOB-SHEET-016: Escape closes only the sheet on top, the one under it on the next press', () => {
    const onCloseBase = vi.fn();
    const onCloseTop = vi.fn();
    const { rerender } = render(
      <>
        <MSheet open onClose={onCloseBase} ariaLabel="Trip"><span>Trip form</span></MSheet>
        <MSheet open onClose={onCloseTop} ariaLabel="Remove days?"><span>Question</span></MSheet>
      </>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseTop).toHaveBeenCalledTimes(1);
    expect(onCloseBase).not.toHaveBeenCalled();

    rerender(
      <>
        <MSheet open onClose={onCloseBase} ariaLabel="Trip"><span>Trip form</span></MSheet>
        <MSheet open={false} onClose={onCloseTop} ariaLabel="Remove days?"><span>Question</span></MSheet>
      </>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseBase).toHaveBeenCalledTimes(1);
    expect(onCloseTop).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SHEET-017: a sheet re-rendered with a fresh onClose stays under the one opened after it', () => {
    const onCloseTop = vi.fn();
    const baseCalls: number[] = [];
    const renderBoth = (round: number) => (
      <>
        <MSheet open onClose={() => baseCalls.push(round)} ariaLabel="Trip"><span>Trip form {round}</span></MSheet>
        <MSheet open onClose={onCloseTop} ariaLabel="Remove days?"><span>Question</span></MSheet>
      </>
    );
    const { rerender } = render(renderBoth(1));
    // Typing into the form under the question re-renders it with a new handler.
    rerender(renderBoth(2));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseTop).toHaveBeenCalledTimes(1);
    expect(baseCalls).toEqual([]);
  });

  it('FE-MOB-SHEET-030: a way back (edge swipe, Android back) closes the open sheet first', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <MSheet open onClose={onClose} ariaLabel="Back">
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(closeTopOverlay()).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <MSheet open={false} onClose={onClose} ariaLabel="Back">
        <span>Sheet content</span>
      </MSheet>,
    );
    expect(closeTopOverlay()).toBe(false);
  });

  describe('dragging the docked sheet', () => {
    const touch = (y: number, x = 100) => ({ touches: [{ clientX: x, clientY: y }], changedTouches: [{ clientX: x, clientY: y }] });

    function renderBottom(onClose = vi.fn(), content: React.ReactNode = <div>Sheet content</div>) {
      HTMLElement.prototype.setPointerCapture = vi.fn();
      render(
        <MSheet open onClose={onClose} variant="bottom" ariaLabel="Bottom">
          {content}
        </MSheet>,
      );
      const dialog = screen.getByRole('dialog');
      Object.defineProperty(dialog, 'offsetHeight', { configurable: true, value: 400 });
      return { dialog, onClose };
    }

    it('FE-MOB-SHEET-022: a pull down on the content carries the sheet and throws it off past a third', () => {
      const { dialog, onClose } = renderBottom();
      const content = screen.getByText('Sheet content');

      fireEvent.touchStart(content, touch(100));
      fireEvent.touchMove(content, touch(140));
      fireEvent.touchMove(content, touch(300));
      expect(dialog.style.transform).toBe('translateY(160px)');

      fireEvent.touchEnd(content, touch(300));
      expect(onClose).toHaveBeenCalledTimes(1);
      // Thrown from where the finger let go, not replayed from the rest position.
      expect(dialog.style.transform).toMatch(/translateY\(\d+px\)/);
      expect(dialog.className).not.toContain('m-sheet-down');
    });

    it('FE-MOB-SHEET-023: content scrolled down keeps its own scroll, and a sideways pan is let go', () => {
      const { dialog, onClose } = renderBottom(vi.fn(), (
        <div data-testid="list" style={{ overflowY: 'auto' }}>
          <span>row</span>
        </div>
      ));
      const list = screen.getByTestId('list');
      Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 900 });
      Object.defineProperty(list, 'clientHeight', { configurable: true, value: 300 });
      Object.defineProperty(list, 'scrollTop', { configurable: true, writable: true, value: 120 });

      fireEvent.touchStart(screen.getByText('row'), touch(100));
      fireEvent.touchMove(screen.getByText('row'), touch(200));
      fireEvent.touchEnd(screen.getByText('row'), touch(200));

      list.scrollTop = 0;
      fireEvent.touchStart(list, touch(100, 100));
      fireEvent.touchMove(list, touch(110, 160));
      fireEvent.touchEnd(list, touch(110, 160));

      expect(dialog.style.transform).toBe('');
      expect(onClose).not.toHaveBeenCalled();
    });

    it('FE-MOB-SHEET-024: pulling up past the rest position only stretches a little', () => {
      const { dialog } = renderBottom();
      const strip = dialog.querySelector('.cursor-grab') as HTMLElement;

      fireEvent.pointerDown(strip, { pointerId: 1, clientY: 300 });
      fireEvent.pointerMove(strip, { pointerId: 1, clientY: 0 });

      expect(dialog.style.transform).toBe('translateY(-20px)');
    });

    it('FE-MOB-SHEET-025: with unsaved changes a flick springs back and asks', () => {
      HTMLElement.prototype.setPointerCapture = vi.fn();
      const onClose = vi.fn();
      function Form() {
        const [name, setName] = React.useState('');
        return (
          <MSheet open onClose={onClose} variant="bottom" ariaLabel="Form" discardGuard={{ name }}>
            <input aria-label="Name" value={name} onChange={e => setName(e.target.value)} />
          </MSheet>
        );
      }
      render(<Form />);
      const input = screen.getByRole('textbox', { name: 'Name' });
      fireEvent.pointerDown(input);
      fireEvent.change(input, { target: { value: 'Porto' } });
      const dialog = screen.getByRole('dialog', { name: 'Form' });
      const strip = dialog.querySelector('.cursor-grab') as HTMLElement;

      fireEvent.pointerDown(strip, { pointerId: 1, clientY: 100 });
      fireEvent.pointerMove(strip, { pointerId: 1, clientY: 160 });
      fireEvent.pointerUp(strip, { pointerId: 1, clientY: 160 });

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(dialog.style.transform).toBe('translateY(0px)');
    });

    it('FE-MOB-SHEET-027: a mouse pull that starts on a button carries the sheet and does not press it', () => {
      const pressed = vi.fn();
      const { dialog, onClose } = renderBottom(vi.fn(), <button type="button" onClick={pressed}>Go</button>);
      const button = screen.getByRole('button', { name: 'Go' });

      fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 100, clientY: 140 });
      fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 100, clientY: 300 });
      expect(dialog.style.transform).toBe('translateY(160px)');
      fireEvent.pointerUp(window, { pointerType: 'mouse', clientX: 100, clientY: 300 });
      fireEvent.click(button);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(pressed).not.toHaveBeenCalled();
    });

    it('FE-MOB-SHEET-028: a plain click on a button in the sheet still presses it', () => {
      const pressed = vi.fn();
      renderBottom(vi.fn(), <button type="button" onClick={pressed}>Go</button>);
      const button = screen.getByRole('button', { name: 'Go' });

      fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0, clientX: 100, clientY: 100 });
      fireEvent.pointerUp(window, { pointerType: 'mouse', clientX: 100, clientY: 101 });
      fireEvent.click(button);

      expect(pressed).toHaveBeenCalledTimes(1);
    });

    it('FE-MOB-SHEET-026: the docked sheet rises from below, the card pops in place', () => {
      const { dialog } = renderBottom();
      expect(dialog.className).toContain('m-sheet-up');
    });
  });

  describe('the unsaved-changes question', () => {
    function Form({ open, onClose }: { open: boolean; onClose: () => void }) {
      const [name, setName] = React.useState('');
      return (
        <MSheet open={open} onClose={onClose} ariaLabel="Form" discardGuard={{ name }}>
          <input aria-label="Name" value={name} onChange={e => setName(e.target.value)} />
        </MSheet>
      );
    }
    const backdrop = () => screen.getByRole('dialog', { name: 'Form' }).closest('[role="presentation"]') as HTMLElement;

    it('FE-MOB-SHEET-020: a tap on the scrim asks before throwing a change away, and keep editing stays', () => {
      const onClose = vi.fn();
      render(<Form open onClose={onClose} />);
      const input = screen.getByRole('textbox', { name: 'Name' });
      fireEvent.pointerDown(input);
      fireEvent.change(input, { target: { value: 'Lisbon' } });

      fireEvent.click(backdrop());
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /keep editing|common.keepEditing/i }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(input).toHaveValue('Lisbon');

      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.click(screen.getByRole('button', { name: /discard|common.discard/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('FE-MOB-SHEET-021: without a change it closes at once, and a reopened sheet starts afresh', () => {
      const onClose = vi.fn();
      const { rerender } = render(<Form open onClose={onClose} />);
      fireEvent.pointerDown(screen.getByRole('textbox', { name: 'Name' }));
      fireEvent.click(backdrop());
      expect(onClose).toHaveBeenCalledTimes(1);

      rerender(<Form open={false} onClose={onClose} />);
      rerender(<Form open onClose={onClose} />);
      fireEvent.click(backdrop());
      expect(onClose).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
  describe('presentation', () => {
    const panel = (name = 'Sheet') => screen.getByRole('dialog', { name });
    const region = (name = 'Sheet') => panel(name).parentElement!.parentElement as HTMLElement;

    it('FE-MOB-SHEET-031: every sheet stands on the one opaque surface, whatever material it names', () => {
      for (const material of ['glass', 'bar-glass', 'opaque'] as const) {
        const { unmount } = render(
          <MSheet open onClose={() => {}} material={material} ariaLabel="Sheet">
            <span>body</span>
          </MSheet>,
        );
        expect(panel().className).toContain('bg-[color:var(--m-sheetop)]');
        expect(panel().className).not.toContain('backdrop-blur');
        expect(panel().className).not.toContain('var(--m-sheet)');
        expect(panel().className).not.toContain('var(--m-glass)');
        unmount();
      }
    });

    it('FE-MOB-SHEET-032: on a phone the card stands between the status bar and the dock, never across the dock', () => {
      render(
        <MSheet open onClose={() => {}} ariaLabel="Sheet">
          <span>body</span>
        </MSheet>,
      );
      expect(region().className).toContain('top-[var(--m-safe-top,12px)]');
      expect(region().className).toContain('bottom-[calc(var(--bottom-nav-h,84px)+12px)]');
      expect(panel().className).toContain('max-h-full');
    });

    it('FE-MOB-SHEET-033: a form fills the height of a short window and lays its actions beside the title', () => {
      const { unmount } = render(
        <MSheet open onClose={() => {}} form ariaLabel="Sheet">
          <span>body</span>
        </MSheet>,
      );
      expect(panel().className).toContain('m-form-sheet');
      expect(panel().className).toContain('short:flex-1');
      expect(region().className).toContain('short:bottom-0');
      unmount();

      render(
        <MSheet open onClose={() => {}} ariaLabel="Sheet">
          <span>body</span>
        </MSheet>,
      );
      expect(panel().className).not.toContain('m-form-sheet');
      expect(region().className).not.toContain('short:bottom-0');
    });

    it('FE-MOB-SHEET-034: a transparent scrim still dims a short window, where the sheet takes most of the height', () => {
      render(
        <MSheet open onClose={() => {}} variant="bottom" dimTransparent ariaLabel="Sheet">
          <span>body</span>
        </MSheet>,
      );
      const scrim = panel().closest('[role="presentation"]') as HTMLElement;
      expect(scrim.className).toContain('bg-transparent');
      expect(scrim.className).toContain('short:bg-[color:var(--m-dim)]');
    });

    it('FE-MOB-SHEET-035: the region lets taps through to the scrim, the sheet itself takes them', () => {
      render(
        <MSheet open onClose={() => {}} ariaLabel="Sheet">
          <span>body</span>
        </MSheet>,
      );
      expect(region().className).toContain('pointer-events-none');
      expect(panel().parentElement!.className).toContain('pointer-events-auto');
    });
  });
});
