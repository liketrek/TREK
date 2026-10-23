/**
 * FE-AI-SLOTS-001 to FE-AI-SLOTS-007
 *
 * A change that carries a card is drawn through its kind's view: the slots
 * of a waiting row and of its receipt, a kind that draws its own subject, a
 * group around a run of rows of one kind, a run of waiting rows decided as
 * one, rows that start switched off, slots that throw drawing what the row
 * shows without a card, and a run and a group told to wait while the chat
 * runs. The views here are test views.
 */
import type { AssistantApplied, AssistantChangePreview, TrekCard } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../../store/assistantStore';
import AssistantChangeCard from '../AssistantChangeCard';
import type { ChangeItem } from '../assistantParts';
import { type AssistantView, AssistantViewContext } from '../assistantViewContext';

vi.mock('./cardViews', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./cardViews')>();
  const { createElement } = await import('react');
  const words = (label: string) =>
    function Words() {
      return createElement('span', null, label);
    };
  const broken = function Broken(): never {
    throw new Error('broken view');
  };
  const views = {
    ...actual.CARD_VIEWS,
    tourRoute: {
      Lead: words('route lead'),
      Aside: words('route aside'),
      Facts: words('route facts'),
      Body: words('route body'),
    },
    tourList: {
      ownsSubject: true,
      Group: function Group({
        items,
        place,
        disabled,
      }: {
        items: readonly ChangeItem[];
        place: string;
        disabled: boolean;
      }) {
        return createElement('p', null, `${place} of ${items.length}${disabled ? ', waiting' : ''}`);
      },
      Run: function Run({
        items,
        excluded,
        disabled,
        onToggle,
      }: {
        items: readonly ChangeItem[];
        excluded: ReadonlySet<string>;
        disabled: boolean;
        onToggle: (id: string) => void;
      }) {
        return createElement(
          'button',
          { type: 'button', disabled, onClick: () => onToggle(items[0]?.toolCallId ?? '') },
          `run of ${items.length}, ${excluded.size} off`
        );
      },
      runnable: (card: TrekCard) => card.kind === 'tourList',
      startsExcluded: () => true,
    },
    dayRoute: { Lead: broken, Aside: broken, Facts: broken, Body: broken, Run: broken },
  };
  return { ...actual, CARD_VIEWS: views, viewOf: (card: TrekCard) => views[card.kind] };
});

const TRIP = 4;
const INITIAL = useAssistantStore.getState();
const ROUTE = { kind: 'tourRoute' } as TrekCard;
const LIST = { kind: 'tourList' } as TrekCard;
const BROKEN = { kind: 'dayRoute' } as TrekCard;

function preview(toolCallId: string, subject: string): AssistantChangePreview {
  return {
    toolCallId,
    verbKey: 'addTour',
    subject,
    rows: [{ op: 'change', labelKey: 'time', before: '09:00', after: '10:30' }],
    dayId: 3,
    placeIds: [],
    undoable: true,
  };
}

const pending = (id: string, subject: string, card: TrekCard | null): ChangeItem => ({
  toolCallId: id,
  preview: preview(id, subject),
  applied: null,
  state: 'pending',
  card,
});

function receipt(id: string, card: TrekCard): ChangeItem {
  const applied: AssistantApplied = { toolCallId: id, entity: 'place', ids: [9], dayId: 3, undoUntil: null };
  return { ...pending(id, 'Ridge walk', card), applied, state: 'applied' };
}

function renderCard(items: ChangeItem[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <AssistantChangeCard items={items} />
    </AssistantViewContext.Provider>
  );
}

const decide = vi.fn(async () => {});

beforeEach(() => {
  useAssistantStore.setState({
    decide,
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId: 1 } },
  });
});

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
  vi.clearAllMocks();
});

describe('ChangeCardSlots', () => {
  it('FE-AI-SLOTS-001: a waiting change with a card fills its row from the kind, in place of the verb tile and fields', () => {
    renderCard([pending('c1', 'Ridge walk', ROUTE)]);
    for (const slot of ['route lead', 'route aside', 'route facts', 'route body']) {
      expect(screen.getByText(slot)).toBeInTheDocument();
    }
    expect(screen.getByText('Ridge walk')).toBeInTheDocument();
    expect(screen.queryByText('10:30')).toBeNull();
  });

  it('FE-AI-SLOTS-002: a receipt keeps the slots, with the way to what it changed', () => {
    const onOpen = vi.fn();
    renderCard([receipt('c1', ROUTE)], { onOpen });
    for (const slot of ['route lead', 'route aside', 'route facts', 'route body']) {
      expect(screen.getByText(slot)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 9, dayId: null });
  });

  it('FE-AI-SLOTS-003: a kind that draws its subject hides it, and a group frames its run of rows', () => {
    renderCard([receipt('c1', LIST), receipt('c2', LIST), pending('c3', 'Plain change', null)]);
    expect(screen.queryByText('Ridge walk')).toBeNull();
    expect(screen.getByText('head of 2')).toBeInTheDocument();
    expect(screen.getByText('foot of 2')).toBeInTheDocument();
    expect(screen.getByText('Plain change')).toBeInTheDocument();
  });

  it('FE-AI-SLOTS-004: two or more waiting rows the kind can take together are one run; a lone one stays a row', () => {
    const first = renderCard([pending('c1', 'One', LIST), pending('c2', 'Two', LIST)]);
    expect(screen.getByRole('button', { name: /^run of 2/ })).toBeInTheDocument();
    first.unmount();

    renderCard([pending('c1', 'One', LIST), pending('c2', 'Two', ROUTE)]);
    expect(screen.queryByRole('button', { name: /^run of/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Include this change' })).toHaveLength(2);
  });

  it('FE-AI-SLOTS-005: rows the kind starts off are left off once, until the user switches them on', () => {
    const items = [pending('c1', 'One', LIST), pending('c2', 'Two', LIST)];
    const view = renderCard(items);
    expect(screen.getByRole('button', { name: 'run of 2, 2 off' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply 0' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'run of 2, 2 off' }));
    view.rerender(
      <AssistantViewContext.Provider value={{ tripId: TRIP, variant: 'window' }}>
        <AssistantChangeCard items={[...items]} />
      </AssistantViewContext.Provider>
    );
    expect(screen.getByRole('button', { name: 'run of 2, 1 off' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply 1' }));
    expect(decide).toHaveBeenCalledWith(TRIP, [
      { toolCallId: 'c1', approved: true },
      { toolCallId: 'c2', approved: false },
    ]);
  });

  it('FE-AI-SLOTS-006: slots that throw draw the plain row: a run its rows, the facts the fields', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCard([pending('c1', 'One', BROKEN), pending('c2', 'Two', BROKEN)]);
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getAllByText('10:30')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Include this change' })).toHaveLength(2);
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  it('FE-AI-SLOTS-007: while the chat runs a run and a group are told to wait, as the rows are', () => {
    useAssistantStore.setState({
      byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId: 1, isRunning: true } },
    });
    renderCard([pending('c1', 'One', LIST), pending('c2', 'Two', LIST)]);
    expect(screen.getByRole('button', { name: /^run of 2/ })).toBeDisabled();
    expect(screen.getByText('head of 2, waiting')).toBeInTheDocument();
  });
});
