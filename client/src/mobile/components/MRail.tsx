import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { edgeFadeClass, useEdgeFade } from './useEdgeFade';

/**
 * The rail on the leading edge that takes the dock's place on a wide window
 * (hooks/sizeClass.ts): the app's sections (MNavRail) or a trip's (MTripRail).
 * It sits inside the strip --m-rail-w reserves, so the page column and every
 * fixed bar start right after it.
 *
 * 80px wide, a navigation rail's width on Android, so a section's name in its
 * own words has room. Its material is the sheets' near-opaque glass rather than
 * the dock's: on a map a saturated country used to show through it in bands
 * behind the names.
 *
 * `head` is the action at its top (the "+" and its stand-ins). It stays put
 * while the entries under it scroll, which they do on a short window.
 */
export function MRail({
  label,
  fixed = false,
  head,
  children,
}: {
  label: string;
  fixed?: boolean;
  head?: ReactNode;
  children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useEvenLines(listRef);
  // On a short window the entries scroll; the cut edge fades, so the foot's entries read as more below.
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const fade = useEdgeFade(list, 'y');
  return (
    <nav
      aria-label={label}
      className={`m-dock-vt ${fixed ? 'fixed' : 'absolute'} bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] start-[calc(var(--m-rail-w)-88px)] top-[var(--m-safe-top,12px)] z-40 flex w-[80px] flex-col items-center rounded-[30px] border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] py-3 shadow-[0_16px_44px_-14px_rgba(0,0,0,.35)] backdrop-blur-[30px]`}
    >
      {head && <div className="mb-2 flex flex-none justify-center">{head}</div>}
      <div
        ref={(node) => {
          listRef.current = node;
          setList(node);
        }}
        className={`flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto px-1 [scrollbar-width:none] ${edgeFadeClass(fade, 'y')}`}
      >
        {children}
      </div>
    </nav>
  );
}

/**
 * Every entry of a rail takes the same height: two lines for its name as soon
 * as one name needs them, one line otherwise. Names wrap where their language
 * needs, never at a smaller size, and the rail's rhythm does not change from
 * entry to entry or from language to language.
 *
 * What it settles on is written to the list's own style (--m-rail-lines), a
 * fact about the laid-out names rather than React state. It is measured again
 * whenever a name changes height (the user's text size, a font arriving).
 */
function useEvenLines(listRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const names = () => Array.from(list.querySelectorAll<HTMLElement>('[data-rail-name]'));
    const measure = () => {
      list.style.setProperty('--m-rail-lines', '1');
      const two = names().some((el) => {
        const line = parseFloat(getComputedStyle(el).lineHeight) || 0;
        return line > 0 && el.scrollHeight > line * 1.5;
      });
      list.style.setProperty('--m-rail-lines', two ? '2' : '1');
    };
    measure();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    // A name that changes height (the text size setting) is measured again. The
    // measure itself settles at once, so it cannot keep the observer going.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    for (const el of names()) observer?.observe(el);
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  });
}

/** Pushes the entries after it to the foot of the rail. */
export function MRailSpacer() {
  return <div className="flex-1" />;
}

interface MRailButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  /** The icon, drawn at 20px. */
  children: ReactNode;
}

/**
 * One destination: the icon on the dock's 40px circle, filled while it is the
 * current one, its name underneath at the caption size. The name is never cut
 * and never shrunk: it wraps into a second, balanced line where its language
 * needs one, and only a word longer than the rail is hyphenated.
 */
export function MRailButton({ label, active, onClick, children }: MRailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-current={active ? 'page' : undefined}
      className="group flex w-full flex-none flex-col items-center gap-[3px] rounded-[18px] py-[5px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)]"
    >
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 ${
          active ? 'bg-m-act text-m-actfg' : 'text-m-muted group-hover:bg-[color:var(--m-ic)] group-hover:text-m-ink'
        }`}
      >
        {children}
      </span>
      <span
        data-rail-name=""
        className={`line-clamp-2 min-h-[calc(1.2em*var(--m-rail-lines,1))] w-full text-center font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] leading-[1.2] [hyphens:auto] [overflow-wrap:anywhere] [text-wrap:balance] ${
          active ? 'font-bold text-m-ink' : 'font-semibold text-m-muted'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
