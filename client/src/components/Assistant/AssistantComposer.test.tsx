/**
 * FE-AI-MENTION-001 to FE-AI-MENTION-007
 *
 * `@` in the composer on the real @assistant-ui runtime: the list of the
 * trip's days, places and bookings opens only at the start of a word, Enter
 * picks from it instead of sending, Escape closes it and keeps the text, and
 * a pick leaves `@label` in the text, with no chip above it: the text is what
 * the question names.
 */
import type { AiStatusResponse } from '@trek/shared';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDay, buildPlace, buildReservation, buildTrip } from '../../../tests/helpers/factories';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
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

const send = vi.fn(async () => {});

function seed(tripInPlanner = TRIP) {
  useAssistantStore.setState({
    status: STATUS,
    send,
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), messages: [] } },
  });
  useTripStore.setState({
    trip: buildTrip({ id: tripInPlanner, title: 'Paris' }),
    days: [buildDay({ id: 11, title: 'Arrival', date: '2026-11-02' }), buildDay({ id: 12, title: null, date: null })],
    places: [buildPlace({ id: 21, name: 'Louvre' }), buildPlace({ id: 22, name: 'Bouillon Pigalle' })],
    reservations: [buildReservation({ id: 31, title: 'Dinner at Le Train Bleu', day_id: 11 })],
  });
}

async function input(): Promise<HTMLTextAreaElement> {
  render(<AssistantSurface tripId={TRIP} tripTitle="Paris" variant="window" />);
  return (await screen.findByRole('textbox', { name: 'Ask anything about Paris' })) as HTMLTextAreaElement;
}

const mentions = () => chatOf(useAssistantStore.getState(), TRIP).mentions;

beforeAll(() => {
  // jsdom lays nothing out and has no element scrolling; the viewport only needs the call to exist.
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
});

beforeEach(() => send.mockClear());
afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
  useTripStore.setState(INITIAL_TRIP, true);
});

describe('AssistantComposer mentions', () => {
  it('FE-AI-MENTION-001: typing after @ lists matches, and Enter picks one instead of sending', async () => {
    seed();
    const field = await input();
    expect(screen.getByText('Type @ to mention days, places and bookings.')).toBeInTheDocument();
    fireEvent.change(field, { target: { value: 'Is @lou' } });

    expect(await screen.findByRole('option', { name: 'Louvre' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Bouillon Pigalle' })).toBeNull();

    fireEvent.keyDown(field, { key: 'Enter' });
    await waitFor(() => expect(field.value).toBe('Is @Louvre '));
    expect(send).not.toHaveBeenCalled();
    // A browser reports where the caret went after the pick; jsdom does not on its own.
    fireEvent.select(field);
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(mentions()).toEqual([{ kind: 'place', id: 21, label: 'Louvre' }]);
    expect(chatOf(useAssistantStore.getState(), TRIP).draft).toBe('Is @Louvre ');
    // The pick shows in the text only, never as a chip above it.
    expect(screen.queryByRole('button', { name: 'Remove context' })).toBeNull();

    fireEvent.change(field, { target: { value: 'Is @Louvre open late?' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    await waitFor(() => expect(send).toHaveBeenCalledWith(TRIP, 'Is @Louvre open late?'));
  });

  it('FE-AI-MENTION-002: a bare @ offers the kinds, and a kind opens its entries', async () => {
    seed();
    const field = await input();
    fireEvent.change(field, { target: { value: '@' } });

    expect(await screen.findByRole('option', { name: 'Days' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Places' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bookings' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'Days' }));
    expect(await screen.findByRole('option', { name: /Arrival/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Day 2' })).toBeInTheDocument();

    // The heading leads back to the kinds.
    fireEvent.click(screen.getByRole('button', { name: 'Days' }));
    expect(await screen.findByRole('option', { name: 'Places' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Days' }));

    fireEvent.click(await screen.findByRole('option', { name: /Arrival/ }));
    await waitFor(() => expect(field.value).toBe('@Arrival '));
    expect(mentions()).toEqual([{ kind: 'day', id: 11, label: 'Arrival' }]);
  });

  it('FE-AI-MENTION-003: Escape closes the list and keeps what was typed', async () => {
    seed();
    const field = await input();
    fireEvent.change(field, { target: { value: 'near @bou' } });
    expect(await screen.findByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(field, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(field.value).toBe('near @bou');
    expect(mentions()).toEqual([]);
  });

  it('FE-AI-MENTION-004: @ inside a word, such as an email address, opens nothing', async () => {
    seed();
    const field = await input();
    fireEvent.change(field, { target: { value: 'mail@lou' } });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('FE-AI-MENTION-005: says so when nothing matches', async () => {
    seed();
    const field = await input();
    fireEvent.change(field, { target: { value: '@zzz' } });
    expect(await screen.findByText('Nothing found')).toBeInTheDocument();
  });

  it('FE-AI-MENTION-006: a mention is taken back by deleting its @label, with no chip row to keep in step', async () => {
    seed();
    const field = await input();
    fireEvent.change(field, { target: { value: 'Dinner after @Din' } });
    fireEvent.click(await screen.findByRole('option', { name: /Dinner at Le Train Bleu/ }));
    await waitFor(() => expect(field.value).toBe('Dinner after @Dinner at Le Train Bleu '));
    expect(screen.queryByRole('button', { name: 'Remove context' })).toBeNull();

    fireEvent.change(field, { target: { value: 'Dinner after ' } });
    expect(chatOf(useAssistantStore.getState(), TRIP).draft).toBe('Dinner after ');
    expect(screen.queryByText('Dinner at Le Train Bleu')).toBeNull();
  });

  it('FE-AI-MENTION-007: for a trip the planner does not show, @ stays plain text', async () => {
    seed(99);
    const field = await input();
    fireEvent.change(field, { target: { value: '@lou' } });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.queryByText('Type @ to mention days, places and bookings.')).toBeNull();
  });
});
