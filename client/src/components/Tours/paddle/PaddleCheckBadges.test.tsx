// PCB-001 to PCB-033: the badges of a paddle tour's checklist (PAD-06, PAD-09): the bench as one pill, how far its
// data reaches and how current it is, the ring a row's symbol sits in, where an entry stands and its paddling rule.
import { describe, expect, it } from 'vitest';

import type { ObstacleDecision, PaddleCheck, PaddleCheckData, TourObstacleEntry } from '@trek/shared';

import { earlierEntry, obstacleEntry, paddleBench } from '../../../../tests/helpers/paddleCheck';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import {
  ChecklistGlyph,
  ObstacleAccessBadge,
  ObstacleStatusBadges,
  PaddleCheckDataLine,
  PaddleCheckPill,
} from './PaddleCheckBadges';
import { formatCheckDate } from './paddleCheckModel';

const NOT_CLEARANCE = 'A checklist is no safety or legal clearance.';
const BANS_INFO = 'OpenStreetMap records a ban or private ground here. A decision does not lift it.';
const GONE_INFO = 'Missing from the data is no proof that the obstacle is gone.';
/** A conditional rule as OpenStreetMap writes it: shown as written, never evaluated. */
const CONDITION = 'no @ (Nov-Mar)';

/** The dates of a bench as the fixtures carry them, and as the badges word them in the suite's locale (en-US). */
const DATA_AS_OF = '2026-10-01T00:00:00.000Z';
const READ_AT = '2026-10-02T04:20:00.000Z';
const AS_OF = formatCheckDate(DATA_AS_OF, 'en-US');
const READ = formatCheckDate(READ_AT, 'en-US');

/** No paddling rule in the tags at all. */
const NO_RULE: TourObstacleEntry['access'] = {
  value: null,
  source: null,
  condition: null,
  forbidden: false,
  private: false,
};

function decisionOf(decision: ObstacleDecision): TourObstacleEntry['decision'] {
  return { decision, note: null, decided_at: '2026-10-10T10:00:00.000Z', decided_by: 1 };
}

/** What an element's tooltip says once it is hovered; the hover ends before it returns. */
async function tooltipOf(element: HTMLElement): Promise<string | null> {
  fireEvent.mouseEnter(element);
  const text = (await screen.findByRole('tooltip')).textContent;
  fireEvent.mouseLeave(element);
  return text;
}

function pillOf(check: PaddleCheck): HTMLElement {
  render(<PaddleCheckPill check={check} />);
  return screen.getByTestId('plan-tour-paddle-check');
}

interface Precedence {
  id: string;
  rule: string;
  bench: Partial<PaddleCheck>;
  value: string;
  icon: string;
}

const PRECEDENCE: Precedence[] = [
  {
    id: 'PCB-002',
    rule: 'unavailable data says so over every count and every ban',
    bench: { data: 'unavailable', open: 2, review: 1, bans: 1 },
    value: 'Unavailable',
    icon: 'circle-dashed',
  },
  {
    id: 'PCB-003',
    rule: 'no data says so and never shows a count',
    bench: { data: 'none', open: 2, decided: 3 },
    value: 'No data',
    icon: 'circle-dashed',
  },
  {
    id: 'PCB-004',
    rule: 'entries open or to check again come before a partial coverage, counted together',
    bench: { data: 'partial', open: 1, review: 2 },
    value: '3 open',
    icon: 'list-checks',
  },
  {
    id: 'PCB-005',
    rule: 'partial data with nothing pending names the coverage',
    bench: { data: 'partial', open: 0, decided: 2 },
    value: 'Partial',
    icon: 'list-checks',
  },
  {
    id: 'PCB-006',
    rule: 'data cut short with nothing pending names it',
    bench: { data: 'limited', open: 0 },
    value: 'Cut short',
    icon: 'list-checks',
  },
  {
    id: 'PCB-007',
    rule: 'a route without known obstacles says none known, never clear',
    bench: { entries: 0, open: 0 },
    value: 'None known',
    icon: 'list-checks',
  },
  {
    id: 'PCB-008',
    rule: 'every entry decided counts the decisions',
    bench: { entries: 2, open: 0, decided: 2 },
    value: '2 decided',
    icon: 'list-checks',
  },
];

describe('PaddleCheckPill', () => {
  it('PCB-001: an open entry on covered data reads as open and is named by its counts and the caveat', () => {
    const pill = pillOf(paddleBench());

    expect(pill.textContent).toBe('1 open');
    expect(pill).toHaveAttribute('aria-label', `1 open\n${NOT_CLEARANCE}`);
    expect(pill.querySelector('svg.lucide-list-checks')).not.toBeNull();
  });

  it.each(PRECEDENCE)('$id: $rule', ({ bench, value, icon }) => {
    const pill = pillOf(paddleBench(bench));

    expect(pill.textContent).toBe(value);
    expect(pill.querySelector(`svg.lucide-${icon}`)).not.toBeNull();
  });

  it('PCB-009: the tooltip lists the data, every count, the ban and that a checklist is no clearance', async () => {
    const pill = pillOf(paddleBench({ data: 'partial', open: 2, review: 1, decided: 3, bans: 1 }));
    const label = [
      'Obstacle data: Partial',
      '2 open',
      '1 to check again',
      '3 decided',
      '1 with a ban',
      BANS_INFO,
      NOT_CLEARANCE,
    ].join('\n');

    expect(pill.textContent).toBe('3 open');
    expect(pill.querySelector('svg.lucide-ban')).not.toBeNull();
    expect(pill).toHaveAttribute('aria-label', label);
    expect(await tooltipOf(pill)).toBe(label);
  });
});

interface Coverage {
  id: string;
  data: Exclude<PaddleCheckData, 'covered'>;
  word: string;
  info: string;
}

const COVERAGE: Coverage[] = [
  {
    id: 'PCB-011',
    data: 'partial',
    word: 'Partial',
    info: `Obstacle data covers only part of the route (as of ${AS_OF}). Check the rest yourself.`,
  },
  {
    id: 'PCB-012',
    data: 'none',
    word: 'No data',
    info: 'No obstacle data for this area. Check weirs, locks and portages here yourself.',
  },
  {
    id: 'PCB-013',
    data: 'limited',
    word: 'Cut short',
    info: 'TREK shows only part of the objects here; the area holds more. Check the water yourself.',
  },
  {
    id: 'PCB-014',
    data: 'unavailable',
    word: 'Unavailable',
    info: 'The obstacle data could not be loaded. Check the water yourself.',
  },
];

describe('PaddleCheckDataLine', () => {
  it('PCB-010: covered data shows no coverage badge, the date OSM is current to and when TREK fetched it', async () => {
    render(<PaddleCheckDataLine check={paddleBench({ data_as_of: DATA_AS_OF, read_at: READ_AT })} />);

    expect(screen.queryByTestId('paddle-check-coverage')).not.toBeInTheDocument();
    const asOf = screen.getByTestId('paddle-check-as-of');
    expect(within(asOf).getByText('OSM as of')).toBeInTheDocument();
    expect(within(asOf).getByText(AS_OF)).toBeInTheDocument();
    const read = screen.getByTestId('paddle-check-read');
    expect(within(read).getByText('Fetched')).toBeInTheDocument();
    expect(within(read).getByText(READ)).toBeInTheDocument();
    // Both sit in the one wrapping line.
    expect(screen.getByTestId('paddle-check-data')).toContainElement(asOf);
    expect(screen.getByTestId('paddle-check-data')).toContainElement(read);

    expect(await tooltipOf(asOf)).toBe(`OpenStreetMap data as of ${AS_OF}, not a check on site.`);
  });

  it.each(COVERAGE)(
    '$id: $data data names its coverage and says to check the water yourself',
    async ({ data, word, info }) => {
      render(<PaddleCheckDataLine check={paddleBench({ data, data_as_of: DATA_AS_OF })} />);

      const coverage = screen.getByTestId('paddle-check-coverage');
      expect(within(coverage).getByText('Obstacle data')).toBeInTheDocument();
      expect(within(coverage).getByText(word)).toBeInTheDocument();
      expect(await tooltipOf(coverage)).toBe(info);
    }
  );

  it('PCB-015: an unknown date reads as unknown, and data never fetched shows no fetch date', async () => {
    render(<PaddleCheckDataLine check={paddleBench({ data: 'partial', data_as_of: null, read_at: null })} />);

    const asOf = screen.getByTestId('paddle-check-as-of');
    expect(within(asOf).getByText('unknown')).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-check-read')).not.toBeInTheDocument();
    expect(await tooltipOf(asOf)).toBe('OpenStreetMap data of an unknown date, not a check on site.');
    expect(await tooltipOf(screen.getByTestId('paddle-check-coverage'))).toBe(
      'Obstacle data covers only part of the route (as of an unknown date). Check the rest yourself.'
    );
  });
});

describe('ChecklistGlyph', () => {
  it('PCB-016: an obstacle on the route sits in a solid 24 px ring of its kind colour', () => {
    render(<ChecklistGlyph kind="weir" />);

    const ring = screen.getByTestId('paddle-check-glyph');
    expect(ring.style.width).toBe('24px');
    expect(ring.style.height).toBe('24px');
    expect(ring.style.color).toBe('var(--map-paddle-obstacle)');
    expect(ring.style.borderColor).toBe('var(--map-paddle-obstacle)');
    expect(ring).toHaveClass('border-solid');
    expect(ring).not.toHaveClass('border-dashed');
    expect(ring.querySelector('[data-paddle-glyph]')).toHaveAttribute('data-paddle-glyph', 'weir');
  });

  it('PCB-017: an object only near the route gets a dashed ring at the size asked for; a lock gate shows the lock', () => {
    render(<ChecklistGlyph kind="lock_gate" dashed size={20} />);

    const ring = screen.getByTestId('paddle-check-glyph');
    expect(ring).toHaveClass('border-dashed');
    expect(ring.style.width).toBe('20px');
    expect(ring.querySelector('[data-paddle-glyph]')).toHaveAttribute('data-paddle-glyph', 'lock');
  });

  it('PCB-018: an own portage, an own lock and an access rule take the colour and symbol of their kind', () => {
    const { rerender } = render(<ChecklistGlyph kind="portage" />);
    let ring = screen.getByTestId('paddle-check-glyph');
    expect(ring.style.borderColor).toBe('var(--map-portage)');
    expect(ring.querySelector('[data-paddle-glyph]')).toHaveAttribute('data-paddle-glyph', 'portage');

    rerender(<ChecklistGlyph kind="lock" />);
    ring = screen.getByTestId('paddle-check-glyph');
    expect(ring.style.borderColor).toBe('var(--map-paddle-obstacle)');
    expect(ring.querySelector('[data-paddle-glyph]')).toHaveAttribute('data-paddle-glyph', 'lock');

    rerender(<ChecklistGlyph kind="access" />);
    ring = screen.getByTestId('paddle-check-glyph');
    expect(ring.style.borderColor).toBe('var(--map-paddle-access)');
    expect(ring.querySelector('[data-paddle-glyph]')).toHaveAttribute('data-paddle-glyph', 'access');
  });
});

interface EarlierStatus {
  id: string;
  status: 'off_route' | 'unknown';
  decision: ObstacleDecision;
  chosen: string;
  word: string;
}

const EARLIER: EarlierStatus[] = [
  {
    id: 'PCB-027',
    status: 'off_route',
    decision: 'not_affected',
    chosen: 'Not affected',
    word: 'No longer on the route',
  },
  { id: 'PCB-028', status: 'unknown', decision: 'reroute', chosen: 'Go round', word: 'Not comparable' },
];

describe('ObstacleStatusBadges', () => {
  it('PCB-019: an open entry reads as open and nothing more', () => {
    render(<ObstacleStatusBadges entry={obstacleEntry()} />);

    const badges = screen.getAllByTestId('paddle-check-status');
    expect(badges).toHaveLength(1);
    expect(badges[0]?.textContent).toBe('Open');
  });

  it('PCB-020: a decided entry shows the decision alone', () => {
    render(<ObstacleStatusBadges entry={obstacleEntry({ status: 'decided', decision: decisionOf('not_affected') })} />);

    expect(screen.getByTestId('paddle-check-status').textContent).toBe('Not affected');
  });

  it('PCB-021: an entry counted as decided that carries no decision shows no empty badge', () => {
    const { container } = render(<ObstacleStatusBadges entry={obstacleEntry({ status: 'decided', decision: null })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('PCB-022: a choice whose plan is missing names the choice and what is missing', () => {
    const { rerender } = render(
      <ObstacleStatusBadges entry={obstacleEntry({ status: 'todo', decision: decisionOf('portage') })} />
    );
    let badge = screen.getByTestId('paddle-check-status');
    expect(within(badge).getByText('Carry round')).toBeInTheDocument();
    expect(within(badge).getByText('No portage yet')).toBeInTheDocument();

    rerender(<ObstacleStatusBadges entry={obstacleEntry({ status: 'todo', decision: decisionOf('reroute') })} />);
    badge = screen.getByTestId('paddle-check-status');
    expect(within(badge).getByText('Go round')).toBeInTheDocument();
    expect(within(badge).getByText('Route still passes')).toBeInTheDocument();
  });

  it('PCB-023: an entry to check again gets one badge for each change, each with the turning arrow', () => {
    const entry = obstacleEntry({ status: 'review', changed: ['route', 'source'], decision: decisionOf('pass') });
    render(<ObstacleStatusBadges entry={entry} />);

    const badges = screen.getAllByTestId('paddle-check-status');
    expect(badges.map((badge) => badge.textContent)).toEqual(['Check againRoute changed', 'Check againData changed']);
    for (const badge of badges) expect(badge.querySelector('svg.lucide-rotate-ccw')).not.toBeNull();
    // The earlier choice is the panel's to show, not the badge's.
    expect(screen.queryByText('Paddle through')).not.toBeInTheDocument();
  });

  it('PCB-024: one change gives one badge', () => {
    render(<ObstacleStatusBadges entry={obstacleEntry({ status: 'review', changed: ['source'] })} />);

    const badges = screen.getAllByTestId('paddle-check-status');
    expect(badges).toHaveLength(1);
    expect(badges[0]?.textContent).toBe('Check againData changed');
  });

  it('PCB-025: an entry to check again without a recorded change still says so, with the turning arrow', () => {
    render(<ObstacleStatusBadges entry={obstacleEntry({ status: 'review', changed: [] })} />);

    const badge = screen.getByTestId('paddle-check-status');
    expect(badge.textContent).toBe('Check again');
    expect(badge.querySelector('svg.lucide-rotate-ccw')).not.toBeNull();
  });

  it('PCB-026: a decision about an object the data no longer holds says so, and kept it steps back', async () => {
    const { rerender } = render(<ObstacleStatusBadges entry={earlierEntry()} />);
    let badge = screen.getByTestId('paddle-check-status');
    expect(within(badge).getByText('Paddle through')).toBeInTheDocument();
    expect(within(badge).getByText('No longer in the data')).toBeInTheDocument();
    expect(badge.closest('.opacity-60')).toBeNull();
    // Missing from the data is no proof the obstacle is gone.
    expect(await tooltipOf(badge)).toBe(GONE_INFO);

    rerender(<ObstacleStatusBadges entry={earlierEntry({ status: 'kept' })} />);
    badge = screen.getByTestId('paddle-check-status');
    expect(within(badge).getByText('Paddle through')).toBeInTheDocument();
    expect(within(badge).getByText('No longer in the data')).toBeInTheDocument();
    expect(badge.closest('.opacity-60')).not.toBeNull();
  });

  it.each(EARLIER)(
    '$id: an earlier decision now $status names the decision and why it stands apart',
    ({ status, decision, chosen, word }) => {
      render(<ObstacleStatusBadges entry={earlierEntry({ status, decision: decisionOf(decision) })} />);

      const badge = screen.getByTestId('paddle-check-status');
      expect(within(badge).getByText(chosen)).toBeInTheDocument();
      expect(within(badge).getByText(word)).toBeInTheDocument();
      expect(badge.closest('.opacity-60')).toBeNull();
    }
  );
});

describe('ObstacleAccessBadge', () => {
  it('PCB-029: a rule that neither forbids, makes private nor carries a condition shows nothing', () => {
    const { container, rerender } = render(<ObstacleAccessBadge access={NO_RULE} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ObstacleAccessBadge access={{ ...NO_RULE, value: 'yes', source: 'canoe' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('PCB-030: a ban for canoes names the canoe rule and colours its value as a warning', () => {
    render(<ObstacleAccessBadge access={{ ...NO_RULE, value: 'no', source: 'canoe', forbidden: true }} />);

    const badge = screen.getByTestId('paddle-check-access');
    expect(within(badge).getByText('Canoe')).not.toHaveClass('text-warning');
    expect(within(badge).getByText('no').parentElement).toHaveClass('text-warning');
  });

  it('PCB-031: private ground under the general access rule is a warning too', () => {
    render(<ObstacleAccessBadge access={{ ...NO_RULE, value: 'private', source: 'access', private: true }} />);

    const badge = screen.getByTestId('paddle-check-access');
    expect(within(badge).getByText('Access')).toBeInTheDocument();
    expect(within(badge).getByText('private').parentElement).toHaveClass('text-warning');
  });

  it('PCB-032: a value TREK has no words for is shown as written, its condition in the tooltip', async () => {
    render(<ObstacleAccessBadge access={{ ...NO_RULE, value: 'permit', source: 'boat', condition: CONDITION }} />);

    const badge = screen.getByTestId('paddle-check-access');
    expect(within(badge).getByText('Boat')).toBeInTheDocument();
    expect(within(badge).getByText('permit').parentElement).toHaveClass('text-content');
    expect(within(badge).getByText('permit').parentElement).not.toHaveClass('text-warning');
    expect(await tooltipOf(badge)).toBe(`Condition: ${CONDITION}`);
  });

  it('PCB-033: a condition without a value of its own is shown as written under its own label', () => {
    render(<ObstacleAccessBadge access={{ ...NO_RULE, condition: CONDITION }} />);

    const badge = screen.getByTestId('paddle-check-access');
    expect(within(badge).getByText('Condition')).toBeInTheDocument();
    expect(within(badge).getByText(CONDITION)).toBeInTheDocument();
  });
});
