import type { ReactNode } from 'react';

/**
 * The glass rail on the leading edge that takes the dock's place on a wide
 * window (hooks/sizeClass.ts): the app's sections (MNavRail) or a trip's
 * (MTripRail). It sits inside the strip --m-rail-w reserves, so the page
 * column and every fixed bar start right after it.
 */
export function MRail({ label, fixed = false, children }: { label: string; fixed?: boolean; children: ReactNode }) {
  return (
    <nav
      aria-label={label}
      className={`m-dock-vt ${fixed ? 'fixed' : 'absolute'} bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] start-[calc(var(--m-rail-w)-80px)] top-[var(--m-safe-top,12px)] z-40 flex w-[72px] flex-col items-center gap-1 overflow-y-auto rounded-[30px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-1 py-3 shadow-[0_16px_44px_-14px_rgba(0,0,0,.35)] backdrop-blur-[30px] backdrop-saturate-[1.8] [scrollbar-width:none]`}
    >
      {children}
    </nav>
  );
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
 * current one, its name underneath. Names wrap to two lines rather than being
 * cut, since a rail entry has no other way to say what it is; the title gives
 * the whole name to a pointer hovering it.
 */
export function MRailButton({ label, active, onClick, children }: MRailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-current={active ? 'page' : undefined}
      className="group flex w-full flex-none flex-col items-center gap-[3px] rounded-[18px] px-1 py-[5px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)]"
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
        className={`line-clamp-2 w-full hyphens-auto break-words text-center font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] leading-[1.2] ${
          active ? 'font-bold text-m-ink' : 'font-semibold text-m-muted'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
