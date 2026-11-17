import type { LucideIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { create } from 'zustand';

/**
 * A screen's own action at the head of the navigation rail, in the place the
 * "+" holds elsewhere: the vacation calendar's switch between the year and the
 * editor. On the phone the same screen draws it into the dock's centre slot.
 */
export interface RailAction {
  label: string;
  icon: LucideIcon;
  /** On: drawn as a ring rather than filled (the editor is open). */
  pressed?: boolean;
  run: () => void;
}

const useRailActionStore = create<{ action: RailAction | null }>(() => ({ action: null }));

/** The action the screen on show has put at the head of the rail, if any. */
export function useRailAction(): RailAction | null {
  return useRailActionStore((s) => s.action);
}

/**
 * Puts the screen's action at the head of the rail while it is mounted; null
 * takes it away. Pressing it always runs the newest handler, and the rail only
 * redraws when what it shows changes.
 */
export function useScreenRailAction(action: RailAction | null): void {
  const run = useRef(action?.run);
  useLayoutEffect(() => {
    run.current = action?.run;
  });
  const shown = action !== null;
  const label = action?.label ?? '';
  const icon = action?.icon;
  const pressed = action?.pressed ?? false;
  useEffect(() => {
    if (!shown || !icon) return;
    useRailActionStore.setState({ action: { label, icon, pressed, run: () => run.current?.() } });
    return () => useRailActionStore.setState({ action: null });
  }, [shown, label, icon, pressed]);
}
