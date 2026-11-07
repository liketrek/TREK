import { act, renderHook } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { sizeClassOf } from '../../../src/hooks/sizeClass';
import { useAutoGrow } from '../../../src/hooks/useAutoGrow';
import MSheet from '../../../src/mobile/components/MSheet';
import { edgeFadeClass, useEdgeFade } from '../../../src/mobile/components/useEdgeFade';
import {
  FormSheetBody,
  FormSheetFooter,
  FormSheetHeader,
  SheetDateField,
} from '../../../src/mobile/screens/trip/sheets/PlSheetChrome';
import { MemberAvatar } from '../../../src/mobile/screens/trip/tabs/MCostsPayment';
import { fireEvent, render, screen } from '../../helpers/render';

// FE-MOB-FORMSHEET-001 onwards: the form sheet the touch shell presents every
// form in (MSheet `form` + PlSheetChrome), and the stylesheet rules that lay it out.

function Form({ onClose = () => {} }: { onClose?: () => void }) {
  return (
    <MSheet open onClose={onClose} form ariaLabel="Add expense">
      <FormSheetHeader title="Add expense" onClose={onClose} closeLabel="Close" />
      <FormSheetBody>
        <input aria-label="Name" />
      </FormSheetBody>
      <FormSheetFooter onCancel={onClose} cancelLabel="Cancel" onSubmit={() => {}} submitLabel="Add" />
    </MSheet>
  );
}

describe('form sheet chrome', () => {
  it('FE-MOB-FORMSHEET-001: header, body and footer carry the parts the short-window layout places', () => {
    render(<Form />);
    const panel = screen.getByRole('dialog', { name: 'Add expense' });
    expect(panel).toHaveClass('m-form-sheet');
    const [head, body, foot] = Array.from(panel.children) as HTMLElement[];
    expect(head).toHaveClass('m-fs-head');
    expect(body).toHaveClass('m-fs-body', 'overflow-y-auto');
    expect(foot).toHaveClass('m-fs-foot');
    // The close button is the one the layout hides once Cancel stands beside the title.
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('m-fs-close');
  });

  it('FE-MOB-FORMSHEET-002: a long title wraps to a second line instead of being cut after one', () => {
    render(<Form />);
    const title = screen.getAllByText('Add expense').find((el) => el.tagName === 'DIV') as HTMLElement;
    expect(title).toHaveClass('line-clamp-2');
    expect(title).not.toHaveClass('truncate');
  });

  it('FE-MOB-FORMSHEET-003: the body is the container its paired rows measure against', () => {
    render(<Form />);
    const body = screen.getByRole('textbox', { name: 'Name' }).parentElement as HTMLElement;
    expect(body.className).toContain('[container-type:inline-size]');
  });

  it('FE-MOB-FORMSHEET-004: the body fades at the foot while more waits below, and at the top once scrolled', () => {
    render(<Form />);
    const body = screen.getByRole('textbox', { name: 'Name' }).parentElement as HTMLElement;
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 900 });
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 400 });
    act(() => {
      body.dispatchEvent(new Event('scroll'));
    });
    expect(body).toHaveClass('m-fade-b');
    act(() => {
      body.scrollTop = 200;
      body.dispatchEvent(new Event('scroll'));
    });
    expect(body).toHaveClass('m-fade-tb');
    act(() => {
      body.scrollTop = 500;
      body.dispatchEvent(new Event('scroll'));
    });
    expect(body).toHaveClass('m-fade-t');
  });

  it('FE-MOB-FORMSHEET-005: the date field keeps its keyboard entry in the picker, so the date has the field to itself', () => {
    render(<SheetDateField value="2026-11-07" onChange={() => {}} />);
    // No second round button beside the date taking its room.
    expect(screen.queryByRole('button', { name: /enter date manually|common\.datepicker\.enterManually/i })).toBeNull();
    const trigger = screen.getByRole('button', { expanded: false });
    fireEvent.click(trigger);
    expect(
      screen.getByRole('button', { name: /enter date manually|common\.datepicker\.enterManually/i })
    ).toBeInTheDocument();
    expect(trigger.closest('.rounded-full')).not.toBeNull();
  });
});

describe('useEdgeFade on the vertical axis', () => {
  function box(scrollHeight: number, clientHeight: number, scrollTop = 0) {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
    el.scrollTop = scrollTop;
    return el;
  }

  it('FE-MOB-FORMSHEET-006: reads the top and the foot, and its classes never mirror', () => {
    expect(edgeFadeClass(renderHook(() => useEdgeFade(box(400, 400), 'y')).result.current, 'y')).toBe('');
    expect(edgeFadeClass(renderHook(() => useEdgeFade(box(900, 400), 'y')).result.current, 'y')).toBe('m-fade-b');
    expect(edgeFadeClass({ start: true, end: false }, 'y')).toBe('m-fade-t');
    expect(edgeFadeClass({ start: true, end: true }, 'y')).toBe('m-fade-tb');
    // The strip's own classes are unchanged.
    expect(edgeFadeClass({ start: true, end: true })).toBe('m-fade-se');
  });

  it('FE-MOB-FORMSHEET-007: measures again when fields come and go inside a box that keeps its height', async () => {
    const el = box(400, 400);
    const { result } = renderHook(() => useEdgeFade(el, 'y'));
    expect(result.current.end).toBe(false);
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 800 });
    await act(async () => {
      el.appendChild(document.createElement('div'));
      // Measured on the next frame, so a burst of changes is measured once.
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
    expect(result.current.end).toBe(true);
  });
});

describe('useAutoGrow', () => {
  it('FE-MOB-FORMSHEET-008: a textarea grows to its lines instead of slicing the last one', () => {
    function Story() {
      const ref = useRef<HTMLTextAreaElement>(null);
      const [text, setText] = useState('one');
      useAutoGrow(ref, text);
      return <textarea ref={ref} aria-label="Story" rows={3} value={text} onChange={(e) => setText(e.target.value)} />;
    }
    const scrollHeight = vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockReturnValue(66);
    render(<Story />);
    const area = screen.getByRole('textbox', { name: 'Story' });
    expect(area.style.height).toBe('66px');
    scrollHeight.mockReturnValue(110);
    fireEvent.change(area, { target: { value: 'one\ntwo\nthree\nfour' } });
    expect(area.style.height).toBe('110px');
    scrollHeight.mockRestore();
  });
});

describe('MemberAvatar', () => {
  it('FE-MOB-FORMSHEET-009: shows the member initial, and turns over on a chip filled with the accent', () => {
    const { rerender } = render(<MemberAvatar name="alice" variant="accent" size={16} />);
    expect(screen.getByText('A')).toHaveClass('bg-m-act', 'text-m-actfg');
    rerender(<MemberAvatar name="alice" variant="onAccent" size={16} />);
    expect(screen.getByText('A')).toHaveClass('bg-m-actfg', 'text-m-act');
  });
});

describe('form sheet stylesheet', () => {
  // jsdom applies no stylesheet, so these read the real files. Vitest runs with
  // the client package as its root.
  const mobileCss = readFileSync(resolve(process.cwd(), 'src/mobile/mobile.css'), 'utf8');
  const indexCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
  const tailwind = readFileSync(resolve(process.cwd(), 'tailwind.config.js'), 'utf8');
  const shortBlock = (() => {
    const start = mobileCss.indexOf('@media (max-height: 500px)');
    return mobileCss.slice(start, mobileCss.indexOf('\n}\n', start));
  })();

  it('FE-MOB-FORMSHEET-010: the short-window variant is the other side of the wide size class height bound', () => {
    expect(tailwind).toContain("addVariant('short', '@media (max-height: 500px)')");
    // `wide:` follows the size class the shell writes (data-size), whose height bound starts at 501.
    expect(tailwind).toContain(
      `addVariant('wide', ':where(html:has(.m-shell[data-size="wide"], .m-shell[data-size="split"])) &')`
    );
    expect(sizeClassOf(1024, 500)).toBe('compact');
    expect(sizeClassOf(1024, 501)).not.toBe('compact');
  });

  it('FE-MOB-FORMSHEET-011: on a short window the actions sit beside the title and the fields take the rest', () => {
    expect(shortBlock).toContain('.m-form-sheet.m-form-sheet {');
    expect(shortBlock).toMatch(/display: grid;/);
    expect(shortBlock).toMatch(/\.m-fs-foot \{[^}]*grid-area: 1 \/ 2;[^}]*border-top: 0;/);
    expect(shortBlock).toMatch(/\.m-fs-body \{[^}]*grid-row: 3;/);
    // Cancel then does the close button's job; a form without a footer keeps it.
    expect(shortBlock).toContain('.m-form-sheet:has(> .m-fs-foot) > .m-fs-head .m-fs-close');
  });

  it('FE-MOB-FORMSHEET-012: the focused sheet keeps its corners and draws no focus frame', () => {
    expect(mobileCss).toMatch(
      /\.m-root \[data-m-sheet\]:focus-visible \{\s*outline: none;\s*border-radius: var\(--m-sheet-r\);/
    );
  });

  it("FE-MOB-FORMSHEET-013: the desktop's dark field paint stays out of the touch shell", () => {
    expect(indexCss).toContain('.dark input:not(:where(.m-root *))');
    expect(indexCss).toContain('.dark textarea:not(:where(.m-root *))');
    expect(indexCss).not.toMatch(/^\.dark input, \.dark textarea, \.dark select \{/m);
  });
});
