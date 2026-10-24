/**
 * FE-AI-ATLAS-CHANGE-001 to FE-AI-ATLAS-CHANGE-004
 *
 * Atlas changes inside the change card, drawn by the atlas views: each
 * country or wish a row with its flag and standing, the run headed by the
 * counters it moves. Switching a row off moves the counter at once; applied,
 * the counter is the exact count and the receipt opens the Atlas.
 */
import type { AssistantApplied, AssistantChangePreview, AtlasBucketCard, AtlasCountryCard } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import AssistantChangeCard from '../../AssistantChangeCard';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';

const TRIP = 4;
const INITIAL = useAssistantStore.getState();

function preview(toolCallId: string, subject: string, tool: string, remove = false): AssistantChangePreview {
  return {
    toolCallId,
    verbKey: remove ? 'genericRemove' : 'genericCreate',
    subject,
    rows: [],
    dayId: null,
    placeIds: [],
    undoable: false,
    tool,
    domain: 'atlas',
  };
}

function country(
  code: string,
  status: AtlasCountryCard['status'],
  change: Pick<NonNullable<AtlasCountryCard['change']>, 'op' | 'after' | 'countries'>
): AtlasCountryCard {
  return {
    kind: 'atlasCountry',
    code,
    status,
    markedBy: null,
    placeCount: 0,
    tripCount: 0,
    trips: [],
    moreTrips: 0,
    places: [],
    morePlaces: 0,
    change: { ...change, region: null, regions: null },
  };
}

const JAPAN = country('JP', 'planned', { op: 'mark', after: 'visited', countries: { before: 23, after: 24 } });
const KOREA = country('KR', null, { op: 'mark', after: 'visited', countries: { before: 23, after: 24 } });
const THAILAND = country('TH', 'visited', { op: 'unmark', after: 'none', countries: { before: 23, after: 22 } });

function pending(id: string, subject: string, tool: string, card: ChangeItem['card'], remove = false): ChangeItem {
  return { toolCallId: id, preview: preview(id, subject, tool, remove), applied: null, state: 'pending', card };
}

function renderCard(items: ChangeItem[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <AssistantChangeCard items={items} />
    </AssistantViewContext.Provider>
  );
}

beforeEach(() => {
  useAssistantStore.setState({
    decide: vi.fn(async () => {}),
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId: 1 } },
  });
});

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
  vi.clearAllMocks();
});

describe('atlas changes', () => {
  it('FE-AI-ATLAS-CHANGE-001: three country changes share one counter, and switching one off moves it at once', () => {
    renderCard([
      pending('c1', 'Japan', 'mark_country_visited', JAPAN),
      pending('c2', 'South Korea', 'mark_country_visited', KOREA),
      pending('c3', 'Thailand', 'unmark_country_visited', THAILAND, true),
    ]);
    expect(screen.getByText('Countries visited')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getAllByText('Mark the country as visited')).toHaveLength(2);
    expect(screen.getByText('Remove a visited country')).toBeInTheDocument();
    expect(screen.getAllByText('Atlas')).toHaveLength(3);
    // Japan was planned, Korea not on the map, Thailand leaves it.
    expect(screen.getByText('Planned')).toHaveClass('line-through');
    expect(screen.getAllByText('Visited')).toHaveLength(3);
    expect(screen.getByText('Not on your map')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Include this change' })[2] as HTMLElement);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('FE-AI-ATLAS-CHANGE-002: applied, the counter is the exact count and the receipt opens the Atlas', () => {
    const onOpen = vi.fn();
    const applied: AssistantApplied = { toolCallId: 'c1', entity: 'atlas', ids: [], dayId: null, undoUntil: null };
    const exact = country('JP', 'planned', { op: 'mark', after: 'visited', countries: { before: 23, after: 24 } });
    renderCard([{ ...pending('c1', 'Japan', 'mark_country_visited', exact), applied, state: 'applied' }], { onOpen });
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.queryByText('+1')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open Atlas' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/atlas' });
  });

  it('FE-AI-ATLAS-CHANGE-003: a wish to add shows its month, its notes and that it is on the list already', () => {
    const card: AtlasBucketCard = {
      kind: 'atlasBucket',
      items: [
        {
          id: null,
          name: 'Northern lights',
          countryCode: null,
          regionCode: null,
          targetDate: '2027-02',
          notes: 'Glacier hike and hot springs',
          reachedOn: null,
          reachedFrom: null,
        },
      ],
      more: 0,
      change: { op: 'add', before: null, duplicate: true, wishes: { before: 7, after: 7 } },
    };
    renderCard([pending('w1', 'Northern lights', 'create_bucket_list_item', card)]);
    expect(screen.getByText('Add to the bucket list')).toBeInTheDocument();
    expect(screen.getByText('Feb 2027')).toBeInTheDocument();
    expect(screen.getByText('Already on your list')).toBeInTheDocument();
    expect(screen.getByText('Glacier hike and hot springs')).toBeInTheDocument();
    expect(screen.getByText('Bucket list')).toBeInTheDocument();
    expect(screen.getAllByText('7')).toHaveLength(2);
  });

  it('FE-AI-ATLAS-CHANGE-004: a wish change strikes through the date and the notes it takes away and shows a new name', () => {
    const before = {
      id: 5,
      name: 'Northern lights',
      countryCode: 'IS',
      regionCode: null,
      targetDate: '2027-02',
      notes: 'Glacier hike',
      reachedOn: null,
      reachedFrom: null,
    };
    const card: AtlasBucketCard = {
      kind: 'atlasBucket',
      items: [{ ...before, name: 'Aurora', targetDate: null, notes: null }],
      more: 0,
      change: { op: 'update', before, duplicate: false, wishes: null },
    };
    renderCard([pending('w2', 'Aurora', 'update_bucket_list_item', card)]);
    expect(screen.getByText('Feb 2027')).toHaveClass('line-through');
    expect(screen.getByText('Glacier hike')).toHaveClass('line-through');
    expect(screen.getAllByText('Removed')).toHaveLength(2);
    expect(screen.getByText('Northern lights')).toHaveClass('line-through');
    expect(screen.getAllByText('Aurora').length).toBeGreaterThan(0);
    // No counter heads a wish change: the size of the list does not move.
    expect(screen.queryByText('Bucket list')).toBeNull();
  });
});
