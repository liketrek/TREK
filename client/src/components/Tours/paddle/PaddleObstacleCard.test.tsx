// FE-PADDLE-CARD-001 to FE-PADDLE-CARD-015: the card for one paddle object picked on the map or in the checklist.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaddleFeature, RelatedObstacle } from '@trek/shared';

import { buildSettings } from '../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import PaddleObstacleCard from './PaddleObstacleCard';
import { paddleObstacleDetail } from './paddleObstacleModel';

type Relation = Omit<RelatedObstacle, 'feature'>;

/** Noon UTC, so the date reads the same in every time zone the suite runs in. */
const AS_OF = '2026-09-01T12:00:00Z';
const ON_ROUTE: Relation = { relation: 'on_route', distanceM: 0, alongM: 1200 };
const NEAR: Relation = { relation: 'near', distanceM: 80, alongM: 640 };

function weir(overrides: Partial<PaddleFeature> = {}): PaddleFeature {
  return {
    ref: 'way/29256405',
    kind: 'weir',
    group_key: null,
    name: 'Wehr Pielenhofen',
    geometry: {
      type: 'LineString',
      coordinates: [
        [11.9561, 49.0567],
        [11.9566, 49.0571],
      ],
    },
    tags: { waterway: 'weir' },
    tag_hash: 'h-29256405',
    region_id: 'oberpfalz',
    ...overrides,
  };
}

/** What the card is handed for the picked object, worked out by the model the way the store does it. */
function detailOf(feature: PaddleFeature, related: Relation | null, asOf: string | null = AS_OF) {
  const detail = paddleObstacleDetail({
    features: [feature],
    related: related ? [{ feature, ...related }] : [],
    regions: [{ id: 'oberpfalz', name: 'Oberpfalz', source_timestamp: asOf, imported_at: null }],
    selectedRef: feature.ref,
  });
  if (!detail) throw new Error(`${feature.ref} is not picked`);
  return detail;
}

/** The weir on the route, carrying only the given tags. */
function withTags(tags: Record<string, string>) {
  return detailOf(weir({ tags }), ON_ROUTE);
}

/** The badge a label sits in, which its tooltip hangs on. */
function badgeOf(label: string): HTMLElement {
  const badge = screen.getByText(label).parentElement;
  if (!badge) throw new Error(`no badge around ${label}`);
  return badge;
}

/** The white badge beside a label: it holds the value and carries the tone. */
function valueBeside(label: string): Element {
  const value = screen.getByText(label).nextElementSibling;
  if (!value) throw new Error(`no value beside ${label}`);
  return value;
}

describe('PaddleObstacleCard', () => {
  beforeEach(() => {
    // No distance unit chosen: the card reads metric.
    seedStore(useSettingsStore, { settings: buildSettings() });
  });

  it('FE-PADDLE-CARD-001: names the object, says what it is and how far along the route it lies', async () => {
    const { container } = render(<PaddleObstacleCard detail={detailOf(weir(), ON_ROUTE)} />);

    expect(screen.getByRole('heading', { name: 'Wehr Pielenhofen' })).toBeInTheDocument();
    expect(screen.getByText('Weir')).toBeInTheDocument();
    expect(container.querySelector('[data-paddle-glyph]')).toHaveAttribute('data-paddle-glyph', 'weir');
    expect(valueBeside('On the route at').textContent).toBe('1.2 km');
    expect(screen.getByTestId('paddle-obstacle-relation')).not.toHaveTextContent('Link unclear');

    fireEvent.mouseEnter(badgeOf('On the route at'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('How far along the route it lies, from the start');
  });

  it('FE-PADDLE-CARD-002: an unnamed object takes its kind as title and does not repeat it', () => {
    const gate = weir({ ref: 'node/77', kind: 'lock_gate', name: null, tags: { 'seamark:type': 'gate' } });
    const { container } = render(<PaddleObstacleCard detail={detailOf(gate, ON_ROUTE)} />);

    expect(screen.getByRole('heading', { name: 'Lock gate' })).toHaveAttribute('title', 'Lock gate');
    expect(screen.getAllByText('Lock gate')).toHaveLength(1);
    // A gate is drawn as part of its lock.
    expect(container.querySelector('[data-paddle-glyph]')).toHaveAttribute('data-paddle-glyph', 'lock');
  });

  it('FE-PADDLE-CARD-003: an object only near the route gives its distance and says the link is unclear', async () => {
    render(<PaddleObstacleCard detail={detailOf(weir(), NEAR)} />);

    expect(valueBeside('Near the route').textContent).toBe('80 m');
    expect(screen.getByText('Link unclear')).toBeInTheDocument();
    expect(screen.queryByText('On the route at')).not.toBeInTheDocument();

    fireEvent.mouseEnter(badgeOf('Near the route'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'How far from the route it lies. It may be on another arm of the water.'
    );
  });

  it('FE-PADDLE-CARD-004: an object only in the area gives no distance at all', () => {
    render(<PaddleObstacleCard detail={detailOf(weir(), null)} />);

    const relation = screen.getByTestId('paddle-obstacle-relation');
    expect(relation).toHaveTextContent('In the area');
    expect(relation).not.toHaveTextContent('On the route at');
    expect(relation).not.toHaveTextContent('Near the route');
    expect(relation).not.toHaveTextContent('Link unclear');
  });

  it('FE-PADDLE-CARD-005: reads canoe before boat and words the known values, marking a ban or private water', () => {
    const { rerender } = render(<PaddleObstacleCard detail={withTags({ canoe: 'no', boat: 'yes' })} />);
    expect(valueBeside('Canoe').textContent).toBe('no');
    expect(valueBeside('Canoe')).toHaveClass('text-warning');
    expect(screen.queryByText('Boat')).not.toBeInTheDocument();

    rerender(<PaddleObstacleCard detail={withTags({ boat: 'permissive' })} />);
    expect(valueBeside('Boat').textContent).toBe('tolerated');
    expect(valueBeside('Boat')).toHaveClass('text-content');
    expect(valueBeside('Boat')).not.toHaveClass('text-warning');

    rerender(<PaddleObstacleCard detail={withTags({ access: 'private' })} />);
    expect(valueBeside('Access').textContent).toBe('private');
    expect(valueBeside('Access')).toHaveClass('text-warning');

    // A value the card has no words for is shown as OpenStreetMap has it.
    rerender(<PaddleObstacleCard detail={withTags({ canoe: 'portage' })} />);
    expect(valueBeside('Canoe').textContent).toBe('portage');
    expect(valueBeside('Canoe')).not.toHaveClass('text-warning');
  });

  it('FE-PADDLE-CARD-006: no paddling rule reads as unknown, never as allowed', () => {
    const bare = withTags({});
    const { rerender } = render(<PaddleObstacleCard detail={bare} />);
    const access = screen.getByTestId('paddle-obstacle-access');
    expect(access).toHaveTextContent('No paddling rule known');
    expect(access).not.toHaveTextContent('yes');

    // A rule that names its tag but carries no value says nothing either.
    const unsure = { ...bare.access, source: 'canoe' as const, value: null };
    rerender(<PaddleObstacleCard detail={{ ...bare, access: unsure }} />);
    expect(screen.getByText('No paddling rule known')).toBeInTheDocument();
    expect(screen.queryByText('Canoe')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CARD-007: a conditional rule is shown as written, alone or beside its rule', async () => {
    const conditional = 'no @ (Nov 01-Mar 31)';
    const { rerender } = render(<PaddleObstacleCard detail={withTags({ 'canoe:conditional': conditional })} />);
    expect(valueBeside('Condition').textContent).toBe(conditional);
    expect(screen.queryByText('No paddling rule known')).not.toBeInTheDocument();

    fireEvent.mouseEnter(badgeOf('Condition'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(conditional);
    fireEvent.mouseLeave(badgeOf('Condition'));

    rerender(<PaddleObstacleCard detail={withTags({ canoe: 'yes', 'canoe:conditional': conditional })} />);
    expect(valueBeside('Canoe').textContent).toBe('yes');
    expect(valueBeside('Condition').textContent).toBe(conditional);
  });

  it('FE-PADDLE-CARD-008: names the facts worth knowing, a bare length in the user unit', async () => {
    const lock = weir({
      ref: 'way/4711',
      kind: 'lock',
      name: 'Schleuse Regensburg',
      tags: {
        height: '3',
        width: '12',
        opening_hours: 'Mo-Su 06:00-22:00',
        seasonal: 'summer',
        fee: 'yes',
        operator: 'WSA Donau MDK',
        'seamark:type': 'lock_basin',
      },
    });
    const { rerender } = render(<PaddleObstacleCard detail={detailOf(lock, ON_ROUTE)} />);
    expect(valueBeside('Height').textContent).toBe('3 m');
    expect(valueBeside('Width').textContent).toBe('12 m');
    expect(valueBeside('Hours').textContent).toBe('Mo-Su 06:00-22:00');
    expect(valueBeside('Seasonal').textContent).toBe('summer');
    expect(valueBeside('Fee').textContent).toBe('yes');
    expect(valueBeside('Operator').textContent).toBe('WSA Donau MDK');
    // A tag the card has no label for stays behind.
    expect(screen.queryByText('lock_basin')).not.toBeInTheDocument();

    // The tooltip keeps the tag as OpenStreetMap holds it.
    fireEvent.mouseEnter(badgeOf('Width'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/^12$/);
    fireEvent.mouseLeave(badgeOf('Width'));

    const rapids = weir({
      kind: 'rapids',
      name: null,
      tags: { 'whitewater:section_grade': 'III', height: '1.2 m' },
    });
    rerender(<PaddleObstacleCard detail={detailOf(rapids, NEAR)} />);
    expect(valueBeside('Grade').textContent).toBe('III');
    // A length with a unit of its own is not read as metres.
    expect(valueBeside('Height').textContent).toBe('1.2 m');
  });

  it('FE-PADDLE-CARD-009: a portage recorded as private warns that it is a private way', () => {
    const portage = weir({ ref: 'way/815', kind: 'portage', name: null, tags: { 'portage:access': 'private' } });
    const { rerender } = render(<PaddleObstacleCard detail={detailOf(portage, NEAR)} />);
    expect(screen.getByRole('heading', { name: 'Portage' })).toBeInTheDocument();
    expect(screen.getByText('Private way')).toHaveClass('text-warning');

    rerender(<PaddleObstacleCard detail={detailOf({ ...portage, tags: { highway: 'path' } }, NEAR)} />);
    expect(screen.queryByText('Private way')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CARD-010: shows the description OpenStreetMap holds, or else its note, as written', () => {
    const description = 'Fish pass on the left bank, the boat chute is closed.';
    const { rerender } = render(<PaddleObstacleCard detail={withTags({ description })} />);
    expect(screen.getByText(description)).toHaveAttribute('title', description);

    rerender(<PaddleObstacleCard detail={withTags({ description: ' ', note: 'Carry round on the right.' })} />);
    expect(screen.getByText('Carry round on the right.')).toBeInTheDocument();

    rerender(<PaddleObstacleCard detail={withTags({})} />);
    expect(screen.queryByText('Carry round on the right.')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CARD-011: links to the object on openstreetmap.org and says how current the data is', () => {
    const { rerender } = render(<PaddleObstacleCard detail={detailOf(weir(), ON_ROUTE)} />);
    const link = screen.getByRole('link', { name: 'View in OpenStreetMap' });
    expect(link).toHaveAttribute('href', 'https://www.openstreetmap.org/way/29256405');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const dated = 'OpenStreetMap data as of Sep 1, 2026, not a check on site. Data © OpenStreetMap contributors';
    expect(screen.getByText(dated)).toBeInTheDocument();

    rerender(<PaddleObstacleCard detail={detailOf(weir(), ON_ROUTE, null)} />);
    const undated = 'OpenStreetMap data of an unknown date, not a check on site. Data © OpenStreetMap contributors';
    expect(screen.getByText(undated)).toBeInTheDocument();
  });

  it('FE-PADDLE-CARD-012: offers a close button only when it can be closed', () => {
    const onClose = vi.fn();
    const detail = detailOf(weir(), ON_ROUTE);
    const { rerender } = render(<PaddleObstacleCard detail={detail} />);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

    rerender(<PaddleObstacleCard detail={detail} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-PADDLE-CARD-013: takes the width it is given, and sizes itself to its content without one', () => {
    const detail = detailOf(weir(), ON_ROUTE);
    const { rerender } = render(<PaddleObstacleCard detail={detail} />);
    expect(screen.getByTestId('paddle-obstacle-card')).toHaveClass('w-max');

    rerender(<PaddleObstacleCard detail={detail} width={320} />);
    const card = screen.getByTestId('paddle-obstacle-card');
    expect(card).toHaveStyle({ width: '320px' });
    expect(card).not.toHaveClass('w-max');
  });

  it('FE-PADDLE-CARD-014: puts what the checklist adds below the facts and above the source link', () => {
    render(
      <PaddleObstacleCard detail={withTags({ height: '3' })}>
        <button type="button">Portage round it</button>
      </PaddleObstacleCard>
    );
    const added = screen.getByRole('button', { name: 'Portage round it' });
    const facts = screen.getByTestId('paddle-obstacle-access');
    expect(facts.compareDocumentPosition(added)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(added.compareDocumentPosition(screen.getByRole('link'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('FE-PADDLE-CARD-015: gives the distances in the unit the user reads', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'imperial' }) });
    const { rerender } = render(<PaddleObstacleCard detail={detailOf(weir(), { ...ON_ROUTE, alongM: 3218 })} />);
    expect(valueBeside('On the route at').textContent).toBe('2 mi');

    rerender(<PaddleObstacleCard detail={detailOf(weir(), { ...NEAR, distanceM: 805 })} />);
    expect(valueBeside('Near the route').textContent).toBe('0.5 mi');
  });
});
