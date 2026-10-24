import type { VacayCardDay } from '@trek/shared';
import type { CSSProperties } from 'react';

import { safeHexColor } from '../../../../utils/safeColor';
import type { DayCell, PlacedProposal, VacayView } from './vacayCardModel';

/**
 * How a day of the vacation card looks, worked out apart from the markup:
 * the planner's own colours (a person's days in their colour, a comp day
 * hatched, a company holiday amber, a public holiday in its calendar's
 * colour, the trip's days dotted), and a held day on top of it, dashed while
 * it waits, solid once applied, struck through when it gives a day back.
 */

/** The colour a person's days wear, or the company's for a company holiday; the accent when they have none. */
export function personColor(view: VacayView, personId: number | null): string {
  if (personId === null) return 'var(--warning)';
  return safeHexColor(view.people.find((person) => person.id === personId)?.color, 'var(--accent)');
}

function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function hatch(color: string): string {
  return `repeating-linear-gradient(45deg, ${tint(color, 45)} 0 2.5px, transparent 2.5px 5px)`;
}

/** The logged days of a cell: one person fills it, several share it side by side. */
export function entriesFill(view: VacayView, entries: readonly VacayCardDay[]): string | null {
  const shown = entries.slice(0, 3);
  const [only] = shown;
  if (!only) return null;
  if (shown.length === 1) {
    const color = personColor(view, only.personId);
    return only.kind === 'comp' ? hatch(color) : tint(color, 26);
  }
  const step = 100 / shown.length;
  const stops = shown.map((entry, index) => {
    const color = tint(personColor(view, entry.personId), entry.kind === 'comp' ? 18 : 30);
    return `${color} ${Math.round(index * step)}% ${Math.round((index + 1) * step)}%`;
  });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

const BASE = 'relative grid place-items-center rounded-md text-caption tabular-nums leading-none transition-colors';
const DASHED = 'outline-dashed outline-1 outline-offset-[-1px]';

/** What a held day adds to its cell, by its state and what it does: one text colour, its weight and its outline. */
type ProposalLook = 'take' | 'giveBack' | 'givenBack' | 'excluded' | 'blocked' | 'applied' | 'failed';

const PROPOSAL_CLASS: Record<ProposalLook, string> = {
  take: `font-semibold text-content ${DASHED} outline-accent`,
  giveBack: `text-content-faint line-through ${DASHED} outline-danger`,
  givenBack: 'text-content-faint line-through',
  excluded: `text-content-faint ${DASHED} outline-edge`,
  blocked: `text-content-faint ${DASHED} outline-warning`,
  applied: 'font-semibold text-content',
  failed: 'text-content outline outline-1 outline-offset-[-1px] outline-danger',
};

interface CellLook {
  className: string;
  style: CSSProperties;
  /** The held day the cell shows, when one is on the table. */
  proposal: PlacedProposal | null;
  /** Someone is off for half of the day. */
  half: boolean;
}

function proposalClass(entry: PlacedProposal): string {
  if (entry.state === 'excluded') return PROPOSAL_CLASS.excluded;
  if (entry.state === 'failed') return PROPOSAL_CLASS.failed;
  if (entry.proposal.outcome === 'blocked') return PROPOSAL_CLASS.blocked;
  const applied = entry.state === 'applied';
  if (entry.proposal.outcome === 'remove') return applied ? PROPOSAL_CLASS.givenBack : PROPOSAL_CLASS.giveBack;
  return applied ? PROPOSAL_CLASS.applied : PROPOSAL_CLASS.take;
}

/** The text of a cell without a held day: a logged day reads strong, a whole company holiday amber, a weekend faint. */
function plainClass(cell: DayCell): string {
  if (cell.entries.length > 0) return 'text-content';
  if (cell.company === 1) return 'bg-warning-soft text-warning';
  return cell.weekend ? 'text-content-faint' : 'text-content-secondary';
}

/** The background of a cell: the held day's colour where it takes a day, else what is logged or given. */
function backgroundOf(view: VacayView, cell: DayCell, entry: PlacedProposal | null): string | undefined {
  const takes = entry?.proposal.outcome === 'add' || entry?.proposal.outcome === 'convert';
  if (entry && takes && entry.state !== 'excluded' && entry.state !== 'failed') {
    return `color-mix(in srgb, ${personColor(view, entry.proposal.personId)} 55%, var(--bg-card))`;
  }
  const logged = entriesFill(view, cell.entries);
  if (logged) return logged;
  if (cell.company === 0.5) return 'linear-gradient(135deg, var(--warning-soft) 50%, transparent 50%)';
  if (cell.holiday && cell.company === null) return tint(safeHexColor(cell.holiday.color, 'var(--danger)'), 28);
  return undefined;
}

/** The whole look of one cell. */
export function cellLook(view: VacayView, cell: DayCell): CellLook {
  const entry = cell.proposals.find((placed) => placed.state !== 'off') ?? null;
  const classes = [BASE, entry ? proposalClass(entry) : plainClass(cell)];
  if (entry && cell.company === 1 && cell.entries.length === 0) classes.push('bg-warning-soft');
  if (cell.today) classes.push('ring-1 ring-inset ring-content');
  if (cell.today && !entry) classes.push('font-semibold');
  if (entry?.state === 'applying') classes.push('motion-safe:animate-pulse');
  const background = backgroundOf(view, cell, entry);
  return {
    className: classes.join(' '),
    style: background ? { background } : {},
    proposal: entry,
    half: cell.entries.some((day) => day.fraction === 0.5) || entry?.proposal.fraction === 0.5,
  };
}
