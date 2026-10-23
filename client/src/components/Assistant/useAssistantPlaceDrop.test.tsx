/**
 * FE-AI-PLACEDROP-001 to FE-AI-PLACEDROP-005
 *
 * A place dragged from the sidebar or the map onto the chat goes into the
 * question as `@Name`, beside the booking file drop on the same chat: each
 * drop zone takes only its own kind of drag.
 */
import type { AiStatusResponse } from '@trek/shared';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildPlace, buildTrip } from '../../../tests/helpers/factories';
import { act, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import AssistantSurface from './AssistantSurface';

const TRIP = 4;
const INITIAL = useAssistantStore.getState();
const INITIAL_TRIP = useTripStore.getState();

const STATUS: AiStatusResponse = {
  available: true,
  policy: 'instance',
  canConnectOwn: false,
  effective: { source: 'instance', kind: 'openai', model: 'gpt', host: 'api.openai.com', paidBy: 'instance' },
  own: null,
  instance: { kind: 'openai', model: 'gpt', host: 'api.openai.com' },
  quota: null,
  privacyAcked: true,
  retention: { mode: 'days', days: 90 },
  openrouterOAuth: false,
};

const attach = vi.fn(async () => {});

function seed(tripInPlanner = TRIP) {
  useAssistantStore.setState({
    status: STATUS,
    attach,
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), messages: [] } },
  });
  useTripStore.setState({
    trip: buildTrip({ id: tripInPlanner, title: 'Paris' }),
    places: [buildPlace({ id: 21, name: 'Louvre' })],
  });
}

async function input(): Promise<HTMLTextAreaElement> {
  render(<AssistantSurface tripId={TRIP} tripTitle="Paris" variant="window" />);
  return (await screen.findByRole('textbox', { name: 'Ask anything about Paris' })) as HTMLTextAreaElement;
}

/** A drag as startPlaceDrag starts it; jsdom keeps the type's case, browsers lower it. */
const placeDrag = (id: string) => ({ dataTransfer: { types: ['placeId'], getData: () => id } });

beforeAll(() => {
  // jsdom lays nothing out and has no element scrolling; the viewport only needs the call to exist.
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
});

afterEach(() => {
  attach.mockClear();
  useAssistantStore.setState(INITIAL, true);
  useTripStore.setState(INITIAL_TRIP, true);
});

describe('useAssistantPlaceDrop', () => {
  it('FE-AI-PLACEDROP-001: a dragged place lights the chat with its own hint', async () => {
    seed();
    const field = await input();
    fireEvent.dragEnter(field, placeDrag('21'));
    expect(screen.getByText('Drop the place here')).toBeInTheDocument();
    expect(screen.queryByText('Drop it here and I will read the booking')).toBeNull();

    fireEvent.dragLeave(field, { relatedTarget: document.body });
    expect(screen.queryByText('Drop the place here')).toBeNull();
  });

  it('FE-AI-PLACEDROP-002: dropping a place writes @Name after the text and keeps the mention', async () => {
    seed();
    const field = await input();
    fireEvent.change(field, { target: { value: 'Lunch near' } });
    fireEvent.dragEnter(field, placeDrag('21'));
    fireEvent.drop(field, placeDrag('21'));

    await waitFor(() => expect(field.value).toBe('Lunch near @Louvre '));
    const chat = chatOf(useAssistantStore.getState(), TRIP);
    expect(chat.mentions).toEqual([{ kind: 'place', id: 21, label: 'Louvre' }]);
    expect(chat.draft).toBe('Lunch near @Louvre ');
    expect(screen.queryByText('Drop the place here')).toBeNull();
    expect(document.activeElement).toBe(field);
  });

  it('FE-AI-PLACEDROP-003: the same place dropped twice is named once', async () => {
    seed();
    const field = await input();
    fireEvent.drop(field, placeDrag('21'));
    fireEvent.drop(field, placeDrag('21'));
    await waitFor(() => expect(field.value).toBe('@Louvre '));
    expect(chatOf(useAssistantStore.getState(), TRIP).mentions).toHaveLength(1);
  });

  it('FE-AI-PLACEDROP-004: ignores a place the trip lacks and a trip the planner does not show', async () => {
    seed();
    const field = await input();
    fireEvent.drop(field, placeDrag('999'));
    expect(field.value).toBe('');

    act(() => useTripStore.setState({ trip: buildTrip({ id: 99 }) }));
    fireEvent.dragEnter(field, placeDrag('21'));
    expect(screen.queryByText('Drop the place here')).toBeNull();
    fireEvent.drop(field, placeDrag('21'));
    expect(field.value).toBe('');
    expect(chatOf(useAssistantStore.getState(), TRIP).mentions).toEqual([]);
  });

  it('FE-AI-PLACEDROP-005: a booking file still goes to the import, not into the text', async () => {
    seed();
    const field = await input();
    const file = new File(['BEGIN:VCALENDAR'], 'hotel.ics', { type: 'text/calendar' });
    fireEvent.dragEnter(field, { dataTransfer: { types: ['Files'], files: [file] } });
    expect(screen.getByText('Drop it here and I will read the booking')).toBeInTheDocument();
    expect(screen.queryByText('Drop the place here')).toBeNull();

    fireEvent.drop(field, { dataTransfer: { types: ['Files'], files: [file], getData: () => '' } });
    await waitFor(() => expect(attach).toHaveBeenCalledWith(TRIP, file));
    expect(field.value).toBe('');
  });
});
