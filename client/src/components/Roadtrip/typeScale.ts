/**
 * The road trip's type scale, pinned to the day plan's.
 *
 * Both road trip panels sit beside the day plan and the tab switcher flips between
 * them, so a road trip whose names ran a size larger than the day plan's read as a
 * different app.
 * The two anchors are the day plan's own: a day title is 14px and a place name 12.5px
 * (`DayPlanSidebar`), and everything here is derived from those. The design handoff was
 * drawn a fifth larger throughout — its proportions are kept, its absolute sizes are not.
 *
 * Written as `calc(px * var(--fs-scale-<tier>))` rather than as a tier utility because
 * the tiers land on 24/18/14/12px and this rail needs the steps between them; the
 * multiplier is what keeps the user's per-tier text-size setting reaching them. A value
 * and its unit always share one tier, so scaling one tier cannot break a pair apart.
 */
export const FS = {
  /** A total in the head. */
  total: 'calc(20px * var(--fs-scale-title, 1))',
  /** The unit hanging off one. */
  totalUnit: 'calc(11.5px * var(--fs-scale-title, 1))',
  /** A day's name — the day plan's own size. */
  dayTitle: 'calc(14px * var(--fs-scale-body, 1))',
  /** A stop's name — the day plan's own size. */
  name: 'calc(12.5px * var(--fs-scale-body, 1))',
  /** A clock reading, and a service stop's dwell. */
  time: 'calc(11px * var(--fs-scale-caption, 1))',
  /** A drive band, a date, a line of explanation. */
  meta: 'calc(10px * var(--fs-scale-caption, 1))',
  /** The number in a marker. */
  marker: 'calc(10.5px * var(--fs-scale-caption, 1))',
  /** A badge, a caption over a total. */
  label: 'calc(9px * var(--fs-scale-caption, 1))',
  /** The word "Stay" — the smallest thing in the rail. */
  micro: 'calc(8px * var(--fs-scale-caption, 1))',
  /** The name of a panel — "Along the route". The largest text either panel carries. */
  panelTitle: 'calc(15px * var(--fs-scale-subtitle, 1))',
  /** A pill, a segment, a line of progress: anything you press but do not read as prose. */
  control: 'calc(10.5px * var(--fs-scale-body, 1))',
} as const
