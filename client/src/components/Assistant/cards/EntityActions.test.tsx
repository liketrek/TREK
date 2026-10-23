/**
 * FE-AI-ENTITY-001 to FE-AI-ENTITY-005
 *
 * What a receipt offers for the thing it changed, read off the entity's
 * look: the map pin where the plan can show it, "Open" where it lives in
 * another part of TREK, and nothing where the shell cannot open anything.
 */
import type { AssistantApplied } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { type AssistantView, AssistantViewContext } from '../assistantViewContext';
import EntityActions from './EntityActions';

vi.mock('./cardLooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./cardLooks')>();
  const looks = {
    ...actual.ENTITY_LOOK,
    tour: {
      ...actual.ENTITY_LOOK.tour,
      openLabelKey: 'assistant.change.viewOnMap',
      phoneOpenLabelKey: 'assistant.history.open',
      onMap: undefined,
      phoneOpen: undefined,
      open: (applied: AssistantApplied) => ({
        kind: 'tab',
        tab: 'tour-planner',
        params: { tour: String(applied.ids[0]) },
      }),
    },
    budget: {
      ...actual.ENTITY_LOOK.budget,
      openLabelKey: undefined,
      open: () => ({ kind: 'tab', tab: 'finanzplan' }),
    },
    reservation: {
      ...actual.ENTITY_LOOK.reservation,
      openLabelKey: undefined,
      open: () => ({ kind: 'tab', tab: 'buchungen' }),
      phoneOpen: () => null,
    },
  };
  return { ...actual, ENTITY_LOOK: looks, entityLookOf: (entity: AssistantApplied['entity']) => looks[entity] };
});

const applied = (entity: AssistantApplied['entity'], ids: number[], dayId: number | null): AssistantApplied => ({
  toolCallId: 'c1',
  entity,
  ids,
  dayId,
  undoUntil: null,
});

function renderActions(change: AssistantApplied, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <EntityActions applied={change} card={null} />
    </AssistantViewContext.Provider>
  );
}

describe('EntityActions', () => {
  it('FE-AI-ENTITY-001: a place shows itself on the map, a stop its day', () => {
    const onOpen = vi.fn();
    const first = renderActions(applied('place', [7], 2), { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'map', placeId: 7, dayId: null });
    first.unmount();

    renderActions(applied('assignment', [41], 3), { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'map', placeId: null, dayId: 3 });
  });

  it('FE-AI-ENTITY-002: nothing shows where the shell cannot open anything', () => {
    const { container } = renderActions(applied('place', [7], 2));
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-ENTITY-003: what has no place on the map gets no pin', () => {
    const { container } = renderActions(applied('memory', [2], null), { onOpen: vi.fn() });
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-ENTITY-004: "Open" goes where the entity lives, in its own words on the desktop and the phone', () => {
    const onOpen = vi.fn();
    const desktop = renderActions(applied('tour', [12], null), { onOpen });
    expect(screen.queryByRole('button', { name: 'Show on map' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'View on map' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'tour-planner', params: { tour: '12' } });
    desktop.unmount();

    const phone = renderActions(applied('tour', [12], null), { onOpen, variant: 'fullscreen' });
    expect(screen.getByRole('button', { name: 'Recent chats' })).toBeInTheDocument();
    phone.unmount();

    renderActions(applied('budget', [3], null), { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'tab', tab: 'finanzplan' });
  });

  it('FE-AI-ENTITY-005: on the phone "Open" goes where the look names for the phone, and shows none where it names nothing', () => {
    const onOpen = vi.fn();
    const desktop = renderActions(applied('reservation', [5], null), { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'tab', tab: 'buchungen' });
    desktop.unmount();

    renderActions(applied('reservation', [5], null), { onOpen, variant: 'fullscreen' });
    expect(screen.queryByRole('button', { name: 'Open' })).toBeNull();
  });
});
