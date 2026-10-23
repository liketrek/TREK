/**
 * FE-AI-SURF-001 to FE-AI-SURF-009
 *
 * The chat on the real @assistant-ui runtime, fed from the assistant store:
 * the empty chat with its suggestions, stored messages as the user sees
 * them, sending from the composer, the composer holding back while a change
 * waits for a decision, and a journey's chat under its own key, without the
 * trip's questions and booking upload, read only for a viewer of the
 * journey and in the book's words.
 */
import type { AiStatusResponse, AssistantMessage } from '@trek/shared';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { assistantChatKey } from '../../store/assistantChatKey';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { type JourneyDetail, useJourneyStore } from '../../store/journeyStore';
import AssistantSurface from './AssistantSurface';

const TRIP = 4;
const INITIAL = useAssistantStore.getState();
const JOURNEYS = useJourneyStore.getState();
const AT = '2026-10-21T08:00:00.000Z';

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

const send = vi.fn(async () => {});

function seed(messages: AssistantMessage[], status: AiStatusResponse = STATUS) {
  useAssistantStore.setState({
    status,
    send,
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), messages } },
  });
}

function renderChat() {
  return render(<AssistantSurface tripId={TRIP} tripTitle="Kyoto" variant="window" />);
}

beforeAll(() => {
  // jsdom lays nothing out and has no element scrolling; the viewport only needs the call to exist.
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
});

beforeEach(() => send.mockClear());
afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
  useJourneyStore.setState(JOURNEYS, true);
});

describe('AssistantSurface', () => {
  it('FE-AI-SURF-001: the empty chat asks what to plan and offers questions that change nothing for an unknown trip', async () => {
    seed([]);
    renderChat();
    expect(await screen.findByText('What are we planning?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make a packing list for this trip' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Which days are still empty?' }));
    await waitFor(() => expect(send).toHaveBeenCalledWith(TRIP, 'Which days are still empty?'));
  });

  it('FE-AI-SURF-002: shows the question and the answer, with the steps folded away', async () => {
    seed([
      { id: 'q1', role: 'user', status: 'complete', createdAt: AT, parts: [{ type: 'text', text: 'Plan Friday' }] },
      {
        id: 'a1',
        role: 'assistant',
        status: 'complete',
        createdAt: AT,
        parts: [
          { type: 'tool-call', toolCallId: 'r1', toolName: 'get_trip_summary', args: {}, result: { ok: true } },
          { type: 'text', text: 'Here is a **plan**.' },
        ],
      },
    ]);
    renderChat();
    expect(await screen.findByText('Plan Friday')).toBeInTheDocument();
    expect(screen.getByText('plan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 step' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('What are we planning?')).toBeNull();
  });

  it('FE-AI-SURF-003: Enter sends what was typed, with the trip in the placeholder', async () => {
    seed([]);
    renderChat();
    const input = await screen.findByRole('textbox', { name: 'Ask anything about Kyoto' });
    fireEvent.change(input, { target: { value: 'Where should we eat?' } });
    expect(chatOf(useAssistantStore.getState(), TRIP).draft).toBe('Where should we eat?');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(send).toHaveBeenCalledWith(TRIP, 'Where should we eat?'));
  });

  it('FE-AI-SURF-004: a change waiting for a decision holds the send button back', async () => {
    seed([
      {
        id: 'a1',
        role: 'assistant',
        status: 'awaiting_approval',
        createdAt: AT,
        parts: [{ type: 'tool-call', toolCallId: 'w1', toolName: 'create_todo', args: {}, approval: { id: 'w1' } }],
      },
    ]);
    renderChat();
    const input = await screen.findByRole('textbox', { name: 'Ask anything about Kyoto' });
    fireEvent.change(input, { target: { value: 'Something else' } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it('FE-AI-SURF-005: on the admin connection the chat says once where messages go', async () => {
    seed([], { ...STATUS, privacyAcked: false });
    renderChat();
    expect(
      await screen.findByText('Your messages and the trip data the assistant reads go to OpenAI.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'What gets shared?' }));
    expect(screen.getByText('Not your password, your files or your other trips.')).toBeInTheDocument();
  });

  it('FE-AI-SURF-006: an answer shows what its search found and the weather it looked up', async () => {
    seed([
      {
        id: 'a1',
        role: 'assistant',
        status: 'complete',
        createdAt: AT,
        parts: [
          { type: 'tool-call', toolCallId: 's1', toolName: 'search_nearby_places', args: {}, result: { ok: true } },
          {
            type: 'data-trek-places',
            data: {
              toolCallId: 's1',
              more: 0,
              places: [
                {
                  ref: 's1:0',
                  name: 'Nishiki Market',
                  address: null,
                  lat: 35.005,
                  lng: 135.765,
                  kind: 'food',
                  rating: null,
                  openNow: null,
                  googlePlaceId: null,
                  osmId: null,
                  photoKey: null,
                  inTripPlaceId: null,
                },
              ],
            },
          },
          {
            type: 'data-trek-weather',
            data: {
              days: [
                {
                  dayId: null,
                  date: '2026-11-02',
                  main: 'Rain',
                  tempMax: 14,
                  tempMin: 9,
                  rainPct: 70,
                  kind: 'forecast',
                },
              ],
            },
          },
          { type: 'text', text: 'Rain on Monday, so the market is a good pick.' },
        ],
      },
    ]);
    renderChat();
    expect(await screen.findByRole('region', { name: 'Places found' })).toBeInTheDocument();
    expect(screen.getByText('Nishiki Market')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Weather for 1 day' })).toBeInTheDocument();
    expect(screen.getByText('14°')).toBeInTheDocument();
  });

  it('FE-AI-SURF-007: a journey chat reads and sends under its own key, not the trip with the same id', async () => {
    const key = assistantChatKey({ kind: 'journey', journeyId: TRIP });
    useAssistantStore.setState({
      status: STATUS,
      send,
      byTrip: {
        [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), draft: 'trip draft' },
        [key]: {
          ...chatOf(useAssistantStore.getState(), key),
          messages: [
            {
              id: 'q1',
              role: 'user',
              status: 'complete',
              createdAt: AT,
              parts: [{ type: 'text', text: 'Tidy page 3' }],
            },
          ],
        },
      },
    });
    render(<AssistantSurface tripId={key} tripTitle="Lisbon" variant="window" density="compact" />);

    expect(await screen.findByText('Tidy page 3')).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Ask anything about Lisbon' });
    fireEvent.change(input, { target: { value: 'Calmer cover' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(send).toHaveBeenCalledWith(key, 'Calmer cover'));
    expect(chatOf(useAssistantStore.getState(), TRIP).draft).toBe('trip draft');
  });

  it('FE-AI-SURF-008: an empty journey chat offers no trip questions, no booking upload and no drop zone', async () => {
    const key = assistantChatKey({ kind: 'journey', journeyId: TRIP });
    useAssistantStore.setState({
      status: STATUS,
      send,
      byTrip: { [key]: { ...chatOf(useAssistantStore.getState(), key), messages: [] } },
    });
    render(<AssistantSurface tripId={key} tripTitle="Lisbon" variant="window" />);

    const input = await screen.findByRole('textbox', { name: 'Ask anything about Lisbon' });
    // It asks about the book, not the plan.
    expect(screen.getByText('What should the book look like?')).toBeInTheDocument();
    expect(screen.queryByText('What are we planning?')).toBeNull();
    // An owner of the journey, as the Studio reads one before the journey says otherwise.
    expect(screen.queryByText(/You can only view/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Which days are still empty?' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Attach a booking' })).toBeNull();

    // A file dragged over the chat is left to the browser: nothing lights up to take it.
    fireEvent.dragEnter(input, { dataTransfer: { types: ['Files'], files: [] } });
    expect(screen.queryByText('Drop it here and I will read the booking')).toBeNull();
  });

  it('FE-AI-SURF-009: a viewer of the journey hears in the book words that the chat changes nothing', async () => {
    const key = assistantChatKey({ kind: 'journey', journeyId: TRIP });
    useAssistantStore.setState({
      status: STATUS,
      send,
      byTrip: { [key]: { ...chatOf(useAssistantStore.getState(), key), messages: [] } },
    });
    useJourneyStore.setState({ current: { id: TRIP, my_role: 'viewer' } as JourneyDetail });
    render(<AssistantSurface tripId={key} tripTitle="Lisbon" variant="window" />);

    expect(
      await screen.findByText('You can only view this book, so I can answer questions but not change anything.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/this trip/)).toBeNull();
  });
});
