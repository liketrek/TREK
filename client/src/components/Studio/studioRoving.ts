/**
 * Arrow keys through a strip of tabs: the rail down the side of Studio and the
 * tab rows inside its panels.
 *
 * One tab of a strip is in the Tab order, the chosen one, and the arrows move
 * the focus along the strip from there, wrapping at both ends; Home and End
 * jump to the ends. A strip read across follows the reading direction, so in
 * Arabic the left arrow moves on to the next tab. The focus moves, the choice
 * does not: a panel opens on Enter or Space, as a button does, because the
 * panels behind these tabs are photo grids and libraries, and arrowing past one
 * should not draw it.
 */

interface RovingStrip {
  /** Read top to bottom (the rail) rather than across (a tab row). */
  vertical: boolean;
  /** The strip runs right to left. Only read for a strip that runs across. */
  rtl: boolean;
}

/** The tab a key moves the focus to, or null for a key the strip leaves alone. */
export function rovingTarget(key: string, index: number, count: number, strip: RovingStrip): number | null {
  if (count <= 0) return null;
  const last = count - 1;
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  const back = strip.vertical ? 'ArrowUp' : strip.rtl ? 'ArrowRight' : 'ArrowLeft';
  const ahead = strip.vertical ? 'ArrowDown' : strip.rtl ? 'ArrowLeft' : 'ArrowRight';
  if (key === back) return index <= 0 ? last : index - 1;
  if (key === ahead) return index >= last ? 0 : index + 1;
  return null;
}

/** Whether the element sits in right to left text, read from the page rather than from the locale. */
export function runsRtl(el: Element): boolean {
  return el.closest('[dir]')?.getAttribute('dir') === 'rtl';
}
