import type { LucideIcon } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { tickHaptic } from '../../native/haptics';

/**
 * A list row that swipes sideways to show its actions, as in Mail or Reminders.
 *
 * Swiped towards the start it shows the trailing actions (delete, in red), the
 * other way the leading one (pack, done). Let go past half of them and the row
 * stays open on its buttons; swipe through to the far end and the first action
 * runs straight away, with a tick when the finger crosses that point. A tap
 * anywhere closes an open row, and opening one closes the one open before.
 *
 * The gesture claims only a clearly sideways drag, so the list still scrolls,
 * and none that starts at the screen's left edge, which goes back (MEdgeBack).
 * Every action here is a second way to something the row already offers, so
 * nothing is lost to a screen reader or a mouse: the buttons are hidden from
 * both until the row is open.
 */

export interface SwipeAction {
  label: string;
  icon: LucideIcon;
  tone: 'danger' | 'accent' | 'neutral';
  onAction: () => void;
}

interface MSwipeRowProps {
  /** Shown by a swipe towards the end of the line (to the right in LTR). */
  leading?: SwipeAction;
  /** Shown by a swipe towards the start; the first one is what a full swipe runs. */
  trailing?: SwipeAction[];
  disabled?: boolean;
  className?: string;
  /** The row's own background: it covers the buttons until the row moves, so it must match what is around it. */
  surface?: string;
  children: ReactNode;
}

const BUTTON_W = 76;
const EDGE_PX = 24;
const CLAIM_PX = 10;
const AXIS_BIAS = 1.5;
/** Past this share of the row's width a release runs the first action. */
const FULL_SHARE = 0.62;

const TONE: Record<SwipeAction['tone'], string> = {
  danger: 'bg-danger text-[color:var(--danger-text)]',
  accent: 'bg-m-act text-m-actfg',
  neutral: 'bg-[color:var(--bg-inverse)] text-[color:var(--text-inverse)]',
};

// The row open now, so opening another closes it.
let closeOpenRow: (() => void) | null = null;

export default function MSwipeRow({
  leading,
  trailing = [],
  disabled = false,
  className = '',
  surface = 'bg-[color:var(--m-card)]',
  children,
}: MSwipeRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<'leading' | 'trailing' | null>(null);
  // Which side shows while the finger moves, so the right buttons sit under the row.
  const [side, setSide] = useState<'leading' | 'trailing' | null>(null);
  const latest = useRef({ leading, trailing });
  useEffect(() => {
    latest.current = { leading, trailing };
  });

  useEffect(() => {
    const row = rowRef.current;
    const content = contentRef.current;
    if (!row || !content || disabled) return;
    const rtl = () => getComputedStyle(row).direction === 'rtl';
    let start: { x: number; y: number } | null = null;
    let claimed = false;
    let base = 0;
    let offset = 0;
    let beyond = false;

    const place = (x: number, animate: boolean) => {
      offset = x;
      content.style.transition = animate ? 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)' : 'none';
      content.style.transform = x ? `translateX(${x}px)` : '';
    };
    const width = () => row.getBoundingClientRect().width;
    // Positive offset reveals the leading side in LTR; RTL mirrors it.
    const leadSign = () => (rtl() ? -1 : 1);
    const openWidth = (which: 'leading' | 'trailing') =>
      which === 'leading' ? (latest.current.leading ? BUTTON_W : 0) : latest.current.trailing.length * BUTTON_W;

    const close = () => {
      place(0, true);
      setOpen(null);
      setSide(null);
      if (closeOpenRow === close) closeOpenRow = null;
    };

    const onStart = (e: TouchEvent) => {
      claimed = false;
      start = null;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.clientX < EDGE_PX) return;
      start = { x: t.clientX, y: t.clientY };
      base = offset;
      beyond = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (!claimed) {
        if (Math.abs(dx) < CLAIM_PX && Math.abs(dy) < CLAIM_PX) return;
        if (Math.abs(dx) < Math.abs(dy) * AXIS_BIAS) {
          start = null;
          return;
        }
        claimed = true;
        if (closeOpenRow && closeOpenRow !== close) closeOpenRow();
      }
      if (e.cancelable) e.preventDefault();
      let x = base + dx;
      const which = x * leadSign() > 0 ? 'leading' : 'trailing';
      const room = openWidth(which);
      if (!room) x = x / 4;
      setSide((s) => (s === which ? s : which));
      // Unmeasured (width 0) means no full swipe: a row never runs an action by accident.
      const w = width();
      const crossed = w > 0 && room > 0 && Math.abs(x) > w * FULL_SHARE;
      if (crossed !== beyond) {
        beyond = crossed;
        if (crossed) tickHaptic();
      }
      place(x, false);
    };

    const onEnd = () => {
      if (!start || !claimed) {
        start = null;
        return;
      }
      start = null;
      claimed = false;
      const which = offset * leadSign() > 0 ? 'leading' : 'trailing';
      const room = openWidth(which);
      const action = which === 'leading' ? latest.current.leading : latest.current.trailing[0];
      if (beyond && action) {
        close();
        action.onAction();
        return;
      }
      if (room && Math.abs(offset) > room / 2) {
        place(room * (which === 'leading' ? leadSign() : -leadSign()), true);
        setOpen(which);
        closeOpenRow = close;
      } else {
        close();
      }
    };

    // A tap on an open row closes it instead of opening what is under the finger.
    const onClickCapture = (e: MouseEvent) => {
      if (offset === 0) return;
      if (e.target instanceof Element && e.target.closest('[data-swipe-action]')) return;
      e.preventDefault();
      e.stopPropagation();
      close();
    };

    row.addEventListener('touchstart', onStart, { passive: true });
    row.addEventListener('touchmove', onMove, { passive: false });
    row.addEventListener('touchend', onEnd, { passive: true });
    row.addEventListener('touchcancel', onEnd, { passive: true });
    row.addEventListener('click', onClickCapture, true);
    return () => {
      row.removeEventListener('touchstart', onStart);
      row.removeEventListener('touchmove', onMove);
      row.removeEventListener('touchend', onEnd);
      row.removeEventListener('touchcancel', onEnd);
      row.removeEventListener('click', onClickCapture, true);
      if (closeOpenRow === close) closeOpenRow = null;
    };
  }, [disabled]);

  const run = (action: SwipeAction) => {
    closeOpenRow?.();
    action.onAction();
  };
  const shown = open ?? side;
  const button = (action: SwipeAction) => (
    <button
      key={action.label}
      type="button"
      data-swipe-action=""
      tabIndex={open ? 0 : -1}
      onClick={() => run(action)}
      className={`flex h-full w-[76px] flex-none flex-col items-center justify-center gap-1 text-caption font-semibold ${TONE[action.tone]}`}
    >
      <action.icon size={18} strokeWidth={2.2} aria-hidden="true" />
      {action.label}
    </button>
  );

  return (
    <div ref={rowRef} className={`relative overflow-hidden ${className}`}>
      {shown && (
        <div
          aria-hidden={!open}
          className={`absolute inset-0 flex ${shown === 'leading' ? 'justify-start' : 'justify-end'}`}
        >
          {shown === 'leading' ? leading && button(leading) : trailing.map(button)}
        </div>
      )}
      <div ref={contentRef} className={`relative ${surface}`}>
        {children}
      </div>
    </div>
  );
}
