// FE-FERRATA-CARD-001 to FE-FERRATA-CARD-009: the card for one picked via ferrata.
import { describe, expect, it, vi } from 'vitest';

import type { Ferrata } from '@trek/shared';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import FerrataDetailCard from './FerrataDetailCard';
import { type FerrataGroup, groupFerratas } from './ferrataGroups';

/** About 222 m of latitude per segment. */
const segment = (id: number, from: number, overrides: Partial<Ferrata> = {}): Ferrata => ({
  id: `way/${id}`,
  name: 'Via ferrata Pisciadù',
  grade: { raw: '5', level: 5, plus: '+' },
  routeName: 'Sella group',
  geometry: [
    [from, 11.81],
    [from + 0.002, 11.81],
  ],
  osmUrl: `https://www.openstreetmap.org/way/${id}`,
  ...overrides,
});

const LOWER = segment(77, 46.53, { grade: { raw: '2', level: 2, plus: null } });
const UPPER = segment(78, 46.532);

function groupOf(...segments: Ferrata[]): FerrataGroup {
  const [group] = groupFerratas(segments);
  if (!group) throw new Error('no group');
  return group;
}

describe('FerrataDetailCard', () => {
  it('FE-FERRATA-CARD-001: shows the name, the route, the grade range and length as badges, and the attribution', () => {
    render(<FerrataDetailCard group={groupOf(LOWER, UPPER)} segment={UPPER} />);

    expect(screen.getByRole('heading', { name: 'Via ferrata Pisciadù' })).toBeInTheDocument();
    expect(screen.getByText('Sella group')).toBeInTheDocument();
    // A badge, not a line colour: the grade is neutral, never the tour's green to red.
    expect(screen.getByText('K2 to K5+')).toHaveClass('text-content-secondary');
    expect(screen.getByText('445 m')).toBeInTheDocument();
    expect(screen.getByText('Data © OpenStreetMap contributors')).toBeInTheDocument();
  });

  it('FE-FERRATA-CARD-002: links to the way that was picked on openstreetmap.org, in a new tab', () => {
    render(<FerrataDetailCard group={groupOf(LOWER, UPPER)} segment={UPPER} />);
    const link = screen.getByRole('link', { name: /View in OpenStreetMap/ });

    expect(link).toHaveAttribute('href', 'https://www.openstreetmap.org/way/78');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('FE-FERRATA-CARD-003: an unnamed ferrata takes its route name as title and does not repeat it', () => {
    const unnamed = segment(77, 46.53, { name: null });
    render(<FerrataDetailCard group={groupOf(unnamed)} segment={unnamed} />);

    expect(screen.getByRole('heading', { name: 'Sella group' })).toBeInTheDocument();
    expect(screen.getAllByText('Sella group')).toHaveLength(1);
  });

  it('FE-FERRATA-CARD-004: one grade reads once; a letter scale keeps its raw grade, none at all reads unknown', () => {
    const { rerender } = render(<FerrataDetailCard group={groupOf(UPPER)} segment={UPPER} />);
    expect(screen.getByText('K5+')).toBeInTheDocument();

    const letter = segment(80, 46.53, { grade: { raw: 'C/D', level: null, plus: null } });
    rerender(<FerrataDetailCard group={groupOf(letter)} segment={letter} />);
    expect(screen.getByText('C/D')).toHaveClass('text-content-secondary');

    const bare = segment(81, 46.53, { name: null, routeName: null, grade: { raw: null, level: null, plus: null } });
    rerender(<FerrataDetailCard group={groupOf(bare)} segment={bare} />);
    expect(screen.getByText('Grade unknown')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Unnamed via ferrata' })).toBeInTheDocument();
  });

  it('FE-FERRATA-CARD-005: offers a close button only when it can be closed', () => {
    const onClose = vi.fn();
    const group = groupOf(UPPER);
    const { rerender } = render(<FerrataDetailCard group={group} segment={UPPER} />);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

    rerender(<FerrataDetailCard group={group} segment={UPPER} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-FERRATA-CARD-006: separates nothing with a middle dot', () => {
    const { container } = render(<FerrataDetailCard group={groupOf(LOWER, UPPER)} segment={LOWER} />);
    expect(container.textContent).not.toContain('·');
  });
  it('FE-FERRATA-CARD-007: a long name wraps onto a second line instead of being cut to one', () => {
    const long = 'Herrmann von Barth Klettersteig über den Wetterstein';
    render(<FerrataDetailCard group={groupOf(segment(79, 46.6, { name: long }))} segment={UPPER} />);
    const heading = screen.getByRole('heading', { name: long });
    expect(heading).toHaveClass('line-clamp-2');
    expect(heading).not.toHaveClass('truncate');
  });

  it('FE-FERRATA-CARD-008: offers "Add to tour" only where the tour can be edited, and hands over the ferrata', () => {
    const group = groupOf(LOWER, UPPER);
    const { rerender } = render(<FerrataDetailCard group={group} segment={UPPER} />);
    expect(screen.queryByTestId('ferrata-adopt')).not.toBeInTheDocument();

    const onAdopt = vi.fn();
    rerender(<FerrataDetailCard group={group} segment={UPPER} onAdopt={onAdopt} />);
    fireEvent.click(screen.getByTestId('ferrata-adopt'));
    expect(onAdopt).toHaveBeenCalledWith(group);
  });

  it('FE-FERRATA-CARD-009: a ferrata the tour already climbs says so instead of offering it again', () => {
    render(<FerrataDetailCard group={groupOf(LOWER, UPPER)} segment={UPPER} onAdopt={vi.fn()} onTour />);
    expect(screen.getByTestId('ferrata-on-tour')).toHaveTextContent('Part of the tour');
    expect(screen.queryByTestId('ferrata-adopt')).not.toBeInTheDocument();
  });
});
