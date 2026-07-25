import type { MTripTabPanelProps } from '../MTripShell'

/**
 * Props every non-plan tab screen receives. The shell decides which `tab` is
 * active (dock + Mehr sheet) and routes it through MTripTabPanel, so the
 * individual panels only need the planner data and the shell api.
 */
export type MTabScreenProps = Omit<MTripTabPanelProps, 'tab'>

/** Status-dot canon (spec 03 §1.4) — the theme-independent --m-st-* tokens. */
export const STATUS_COLOR = {
  confirmed: 'var(--m-st-confirmed)',
  pending: 'var(--m-st-pending)',
  info: 'var(--m-st-info)',
  danger: 'var(--m-st-danger)',
  neutral: 'var(--m-st-neutral)',
} as const
