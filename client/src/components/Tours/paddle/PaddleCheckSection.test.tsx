// PCS-001 to PCS-004: the checklist section in a paddle tour's detail (PAD-09): the bench and how current its data
// is in one box, then the safety note, which stays when the tour has no bench yet.
import { describe, expect, it } from 'vitest';

import type { TourListItem } from '@trek/shared';

import { paddleBench } from '../../../../tests/helpers/paddleCheck';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { PaddleCheckSection } from './PaddleCheckSection';

const SAFETY = 'Paddling has risks. Check water, rules and weather yourself.';

/** A planned paddle tour as the list carries it, without a bench. */
const TOUR: TourListItem = {
  place_id: 21,
  name: 'Naab paddle',
  tour_type: 'kayak',
  distance: 12.4,
  elevation_gain: null,
  elevation_loss: null,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  max_hiking_difficulty: null,
  planned: false,
  caution: false,
  boat_type: 'canoe',
};

interface Benchless {
  id: string;
  what: string;
  tour: TourListItem;
}

const BENCHLESS: Benchless[] = [
  { id: 'PCS-002', what: 'no bench yet', tour: { ...TOUR, paddle_check: null } },
  { id: 'PCS-003', what: 'a list cached before the bench existed', tour: TOUR },
];

describe('PaddleCheckSection', () => {
  it('PCS-001: a tour with a bench shows its pill and its data in one box, the safety note below it', () => {
    render(<PaddleCheckSection tour={{ ...TOUR, paddle_check: paddleBench({ data: 'partial', open: 2 }) }} />);

    expect(screen.getByText('Checklist')).toBeInTheDocument();
    const summary = screen.getByTestId('paddle-check-summary');
    expect(within(summary).getByTestId('plan-tour-paddle-check').textContent).toBe('2 open');
    expect(within(summary).getByTestId('paddle-check-coverage')).toHaveTextContent('Partial');
    expect(within(summary).getByTestId('paddle-check-as-of')).toHaveTextContent('OSM as of');
    expect(within(summary).getByTestId('paddle-check-read')).toHaveTextContent('Fetched');

    const row = screen.getByRole('button', { name: SAFETY });
    expect(summary).not.toContainElement(row);
    expect(summary.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(BENCHLESS)('$id: a tour with $what shows the safety note alone', ({ tour }) => {
    render(<PaddleCheckSection tour={tour} />);

    expect(screen.getByRole('button', { name: SAFETY })).toBeInTheDocument();
    expect(screen.queryByText('Checklist')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-check-summary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('plan-tour-paddle-check')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-check-data')).not.toBeInTheDocument();
  });

  it('PCS-004: the safety note of the section opens the full note', () => {
    render(<PaddleCheckSection tour={{ ...TOUR, paddle_check: paddleBench() }} />);

    fireEvent.click(screen.getByRole('button', { name: SAFETY }));

    expect(screen.getByRole('dialog', { name: 'Safety on the water' })).toBeInTheDocument();
  });
});
