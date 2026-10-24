/**
 * FE-AI-COLL-010 to FE-AI-COLL-017
 *
 * The answer cards of the collections as the chat draws them: a list's head
 * with its size, people and places per status, its saved places as rows
 * (status, labels, rating, the trip having them), the rest as a way to the
 * list, the map pin a row lights and where a click takes it, the phone
 * without hover, and the lists card with invites and where a place is saved.
 */
import type { AssistantMessage, TrekCard } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listRow, listsCard, placesCard, savedPlace } from '../../../../../tests/helpers/collectionCards';
import { fireEvent, render, screen, within } from '../../../../../tests/helpers/render';
import { useAssistantStore } from '../../../../store/assistantStore';
import type { CardsBlock } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import AssistantCardBlock from '../AssistantCardBlock';

const INITIAL = useAssistantStore.getState();

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
  vi.restoreAllMocks();
});

const spots = (count: number) =>
  Array.from({ length: count }, (_, i) => savedPlace({ id: 100 + i, name: `Spot ${i}`, labelIds: [] }));

function draw(cards: TrekCard[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', density: 'compact', onOpen: vi.fn(), ...view };
  const block: CardsBlock = {
    kind: 'cards',
    key: 'cards-1',
    group: cards[0]?.kind ?? 'none',
    entries: cards.map((card, index) => ({ toolCallId: `call_${index}`, card })),
  };
  const message = { id: 'msg-1', role: 'assistant', parts: [] } as unknown as AssistantMessage;
  render(
    <AssistantViewContext.Provider value={value}>
      <AssistantCardBlock block={block} message={message} />
    </AssistantViewContext.Provider>
  );
  return value;
}

describe('collection answer cards', () => {
  it('FE-AI-COLL-010: a list heads its card with its size, its people, its places per status and the way to it', () => {
    const view = draw([placesCard()]);
    const card = screen.getByRole('region', { name: 'Saved places in Paris food' });
    expect(within(card).getByText('Paris food')).toBeInTheDocument();
    expect(within(card).getByText('12 places')).toBeInTheDocument();
    expect(within(card).getByText('1 member')).toBeInTheDocument();
    expect(within(card).getByText('Idea')).toBeInTheDocument();
    expect(within(card).getByText('3')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: /Open list/ }));
    expect(view.onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/collections/12' });
  });

  it('FE-AI-COLL-011: a saved place shows its status, two labels and the rest counted, its rating and the trip having it', () => {
    draw([placesCard({ places: [savedPlace({ inTripPlaceId: 6 })] })]);
    expect(screen.getByText('Septime')).toBeInTheDocument();
    expect(screen.getByText('80 Rue de Charonne')).toBeInTheDocument();
    expect(screen.getAllByText('Want to go').length).toBeGreaterThan(0);
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.queryByText('Terrace')).toBeNull();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Already in your trip')).toBeInTheDocument();
  });

  it('FE-AI-COLL-012: a narrow chat shows five rows and counts the rest as a way to the list; a roomy one eight', () => {
    const view = draw([placesCard({ places: spots(8), more: 4 })]);
    expect(screen.getByText('Spot 4')).toBeInTheDocument();
    expect(screen.queryByText('Spot 5')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '7 more in this list' }));
    expect(view.onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/collections/12' });
  });

  it('FE-AI-COLL-013: a roomy chat shows eight rows', () => {
    draw([placesCard({ places: spots(8) })], { density: 'roomy' });
    expect(screen.getByText('Spot 7')).toBeInTheDocument();
    expect(screen.queryByText(/more in this list/)).toBeNull();
  });

  it('FE-AI-COLL-014: resting on a row pins it on the map; a click selects the trip place or moves the map to the saved one', () => {
    const requestCamera = vi.fn();
    useAssistantStore.setState({ requestCamera });
    const onRevealMap = vi.fn();
    const inTrip = savedPlace({ id: 34, name: 'Septime', inTripPlaceId: 6, labelIds: [] });
    const elsewhere = savedPlace({ id: 35, name: 'Le Comptoir', lat: 48.85, lng: 2.33, labelIds: [] });
    const view = draw([placesCard({ places: [inTrip, elsewhere] })], { onRevealMap });
    const row = screen.getByRole('button', { name: /Septime/ });
    fireEvent.mouseEnter(row);
    expect(useAssistantStore.getState().preview).toMatchObject({ ref: 'col:34', placeId: 6, lat: 48.853 });
    fireEvent.mouseLeave(row);
    expect(useAssistantStore.getState().preview).toBeNull();
    fireEvent.click(row);
    expect(view.onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 6, dayId: null });
    fireEvent.click(screen.getByRole('button', { name: /Le Comptoir/ }));
    expect(onRevealMap).toHaveBeenCalled();
    expect(requestCamera).toHaveBeenCalledWith(4, [[48.85, 2.33]], 'pan', 'user');
  });

  it('FE-AI-COLL-015: on the phone a row does not pin on hover, and a place without a position is no button', () => {
    draw([placesCard({ places: [savedPlace({ lat: null, lng: null, labelIds: [] })] })], { variant: 'fullscreen' });
    expect(screen.queryByRole('button', { name: /Septime/ })).toBeNull();
    fireEvent.mouseEnter(screen.getByText('Septime'));
    expect(useAssistantStore.getState().preview).toBeNull();
  });

  it('FE-AI-COLL-016: two lists read in one answer share one card, each under its head; one read twice shows once', () => {
    const list = { id: 13, name: 'Rome', color: null, placeCount: 2, memberCount: 0, counts: null };
    const rome = placesCard({ list });
    const again = placesCard({ places: [savedPlace({ name: 'Septime again', labelIds: [] })] });
    draw([placesCard(), rome, again]);
    const card = screen.getByRole('region', { name: 'Saved places' });
    expect(within(card).getByText('Paris food')).toBeInTheDocument();
    expect(within(card).getByText('Rome')).toBeInTheDocument();
    expect(within(card).getByText('Septime again')).toBeInTheDocument();
    expect(within(card).getAllByText('Paris food')).toHaveLength(1);
  });

  it('FE-AI-COLL-017: the lists card names each list with its size, an invite with who sent it, and where a place is saved', () => {
    const person = { id: 4, name: 'Maya', avatarKey: null };
    const view = draw([
      listsCard({ lists: [listRow(), listRow({ id: 40, name: 'Rome', invite: true, person })] }),
      listsCard({ lists: [listRow({ name: 'Paris eats' })] }),
    ]);
    expect(screen.getByText('Your lists')).toBeInTheDocument();
    expect(screen.getByText('Paris eats')).toBeInTheDocument();
    expect(screen.queryByText('Paris food')).toBeNull();
    expect(screen.getByText('Invite from Maya')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Rome/ }));
    expect(view.onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/collections/40' });
  });

  it('FE-AI-COLL-018: where a place is saved reads as its lists with its status in each', () => {
    const lists = [listRow({ status: 'visited' }), listRow({ id: 13, name: 'Later', status: 'idea' })];
    draw([listsCard({ place: 'Septime', lists })]);
    expect(screen.getByText('Septime')).toBeInTheDocument();
    expect(screen.getByText('Saved in 2 lists')).toBeInTheDocument();
    expect(screen.getByText('Visited')).toBeInTheDocument();
    expect(screen.getByText('Idea')).toBeInTheDocument();
  });
});
