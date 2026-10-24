/**
 * FE-STUDIO-ASTPANEL-001 to FE-STUDIO-ASTPANEL-009
 *
 * The assistant's floating window in TREK Studio (journey-studio.md 3.4, 4.5): the
 * journey's chat with its own question; the notice that images of a page
 * leave only once the user agreed, for the connection on screen, that "Not
 * now" keeps it text for the visit, and that a model reading no images is
 * never asked; every key inside the window belongs to the chat, so Studio
 * neither closes nor edits the page's selection, and Escape stops a running
 * answer first, while Escape in the header's menu only closes the menu; the
 * journey's chat offers no trip notes, and its privacy banner speaks of the
 * journey; the bar's switch and the window it opens.
 */
import type { AiStatusResponse } from '@trek/shared';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, waitFor, within } from '../../../tests/helpers/render';
import { aiConnectionsRepo } from '../../repo/aiConnectionsRepo';
import { assistantRepo } from '../../repo/assistantRepo';
import { assistantChatKey } from '../../store/assistantChatKey';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import StudioAssistantPanel, { StudioAssistantColumn, StudioAssistantToggle } from './StudioAssistantPanel';
import type { StudioAssistant } from './useStudioAssistant';

/** The assistant's surface is loaded lazily, which can outlast findBy's default second on CI. */
const LAZY = { timeout: 10_000 };
const JOURNEY = 12;
const KEY = assistantChatKey({ kind: 'journey', journeyId: JOURNEY });
const INITIAL = useAssistantStore.getState();

const STATUS: AiStatusResponse = {
  available: true,
  policy: 'instance',
  canConnectOwn: false,
  effective: { source: 'instance', kind: 'anthropic', model: 'claude', host: 'api.anthropic.com', paidBy: 'instance' },
  own: null,
  instance: { kind: 'anthropic', model: 'claude', host: 'api.anthropic.com' },
  quota: null,
  privacyAcked: true,
  studioImages: true,
  studioImagesAcked: false,
  retention: { mode: 'days', days: 90 },
  openrouterOAuth: false,
};

function assistant(over: Partial<StudioAssistant> = {}): StudioAssistant {
  return { chatKey: KEY, available: true, open: true, toggle: vi.fn(), jobs: [], drawn: vi.fn(), ...over };
}

/** A chat whose answer is still being written, with the store's cancel spied on. */
function running() {
  const cancel = vi.fn();
  useAssistantStore.setState({
    cancel,
    byTrip: { [KEY]: { ...chatOf(useAssistantStore.getState(), KEY), isRunning: true } },
  });
  return cancel;
}

beforeAll(() => {
  // jsdom lays nothing out and has no element scrolling; the thread's viewport only needs the call to exist.
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
});

beforeEach(() => {
  vi.spyOn(assistantRepo, 'threads').mockResolvedValue([]);
  useAssistantStore.setState({ ...INITIAL, status: STATUS, byTrip: {}, studioHosts: {} });
});
afterEach(() => {
  vi.restoreAllMocks();
  useAssistantStore.setState(INITIAL);
});

describe('StudioAssistantPanel', () => {
  it('FE-STUDIO-ASTPANEL-001: shows the journey chat and lets page images leave once the user agreed', async () => {
    const ack = vi.spyOn(aiConnectionsRepo, 'ackPrivacy').mockResolvedValueOnce(undefined);
    render(<StudioAssistantPanel assistant={assistant()} title="Lisbon" />);

    expect(screen.getByRole('complementary', { name: 'Book assistant' })).toBeInTheDocument();
    // The chat is a lazy chunk; on a busy runner it can take longer than findBy's default second.
    expect(await screen.findByText('What should the book look like?', undefined, LAZY)).toBeInTheDocument();
    const notice = screen.getByRole('note');
    expect(notice.textContent).toContain('Only that page goes to Anthropic');

    fireEvent.click(screen.getByRole('button', { name: 'Show it pages' }));

    await waitFor(() => expect(screen.queryByRole('note')).toBeNull());
    expect(ack).toHaveBeenCalledWith({ kind: 'anthropic', host: 'api.anthropic.com', scope: 'studio_images' });
    expect(useAssistantStore.getState().status?.studioImagesAcked).toBe(true);
  });

  it('FE-STUDIO-ASTPANEL-002: "Not now" keeps the pages as text, an agreed connection shows no notice', async () => {
    const ack = vi.spyOn(aiConnectionsRepo, 'ackPrivacy');
    const { unmount } = render(<StudioAssistantPanel assistant={assistant()} title="Lisbon" />);

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('note')).toBeNull();
    expect(ack).not.toHaveBeenCalled();
    unmount();

    useAssistantStore.setState({ status: { ...STATUS, studioImagesAcked: true } });
    render(<StudioAssistantPanel assistant={assistant()} title="Lisbon" />);
    // The chat is a lazy chunk; on a busy runner it can take longer than findBy's default second.
    expect(await screen.findByText('What should the book look like?', undefined, LAZY)).toBeInTheDocument();
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('FE-STUDIO-ASTPANEL-003: keys in the window stay there, Escape stops a running answer first', () => {
    const cancel = running();
    const studioKeys = vi.fn();
    window.addEventListener('keydown', studioKeys);
    const panel = assistant();
    render(<StudioAssistantPanel assistant={panel} title="Lisbon" />);

    const column = screen.getByRole('complementary', { name: 'Book assistant' });
    // The editor deletes the selected elements on Backspace; from the chat it must not hear it.
    fireEvent.keyDown(column, { key: 'Backspace' });
    expect(cancel).not.toHaveBeenCalled();
    fireEvent.keyDown(column, { key: 'Escape' });

    expect(studioKeys).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith(KEY);
    expect(panel.toggle).not.toHaveBeenCalled();
    window.removeEventListener('keydown', studioKeys);
  });

  it("FE-STUDIO-ASTPANEL-004: Escape in the header's menu closes the menu, not the answer or Studio", async () => {
    const cancel = running();
    const studioKeys = vi.fn();
    window.addEventListener('keydown', studioKeys);
    const panel = assistant();
    render(<StudioAssistantPanel assistant={panel} title="Lisbon" />);

    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const item = within(await screen.findByRole('menu')).getAllByRole('button')[0] as HTMLElement;
    // The menu's own keys stay out of the Studio and leave the answer alone.
    fireEvent.keyDown(item, { key: 'ArrowDown' });
    fireEvent.keyDown(item, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(cancel).not.toHaveBeenCalled();
    expect(studioKeys).not.toHaveBeenCalled();
    expect(panel.toggle).not.toHaveBeenCalled();
    window.removeEventListener('keydown', studioKeys);
  });

  it('FE-STUDIO-ASTPANEL-005: the journey chat offers no trip notes, which only a trip turn reads', async () => {
    render(<StudioAssistantPanel assistant={assistant()} title="Lisbon" />);

    // The chat is a lazy chunk; on a busy runner it can take longer than findBy's default second.
    expect(await screen.findByText('What should the book look like?', undefined, LAZY)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recent chats' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Trip notes' })).toBeNull();
  });

  it('FE-STUDIO-ASTPANEL-006: on the admin connection the privacy banner speaks of the journey', async () => {
    useAssistantStore.setState({ status: { ...STATUS, privacyAcked: false } });
    render(<StudioAssistantPanel assistant={assistant()} title="Lisbon" />);

    expect(
      await screen.findByText('Your messages and the journey data the assistant reads go to Anthropic.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/trip data/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'What gets shared?' }));
    expect(
      screen.getByText('Not your password or your other journeys. A picture of a page goes only once you allow it.')
    ).toBeInTheDocument();
    expect(screen.getByText(/what the assistant reads of this journey/)).toBeInTheDocument();
    expect(screen.queryByText('Not your password, your files or your other trips.')).toBeNull();
  });

  it('FE-STUDIO-ASTPANEL-007: a connection whose model reads no images is never asked to show pages', async () => {
    useAssistantStore.setState({
      status: {
        ...STATUS,
        effective: { source: 'instance', kind: 'custom', model: 'llama3', host: 'ollama.lan', paidBy: 'instance' },
        studioImages: false,
      },
    });
    render(<StudioAssistantPanel assistant={assistant()} title="Lisbon" />);

    // The chat is a lazy chunk; on a busy runner it can take longer than findBy's default second.
    expect(await screen.findByText('What should the book look like?', undefined, LAZY)).toBeInTheDocument();
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show it pages' })).toBeNull();
  });

  it('FE-STUDIO-ASTPANEL-008: the bar switch shows where the assistant runs, tells its state and toggles', () => {
    const { unmount } = render(<StudioAssistantToggle assistant={assistant({ available: false })} />);
    expect(screen.queryByRole('button', { name: 'Assistant' })).toBeNull();
    unmount();

    const closed = assistant({ open: false });
    const second = render(<StudioAssistantToggle assistant={closed} />);
    const toggle = screen.getByRole('button', { name: 'Assistant' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('title', 'Design the book together with the assistant');
    expect(toggle).not.toHaveClass('is-on');
    fireEvent.click(toggle);
    expect(closed.toggle).toHaveBeenCalledTimes(1);
    second.unmount();

    render(<StudioAssistantToggle assistant={assistant()} />);
    expect(screen.getByRole('button', { name: 'Assistant' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Assistant' })).toHaveClass('is-on');
  });

  it('FE-STUDIO-ASTPANEL-009: the window mounts only while it is open, named after the journey or as one', async () => {
    const { unmount } = render(<StudioAssistantColumn assistant={assistant({ open: false })} title="Lisbon" />);
    expect(screen.queryByRole('complementary', { name: 'Book assistant' })).toBeNull();
    unmount();

    render(<StudioAssistantColumn assistant={assistant()} />);
    expect(screen.getByRole('complementary', { name: 'Book assistant' })).toBeInTheDocument();
    // The chat is a lazy chunk; on a busy runner it can take longer than findBy's default second.
    expect(await screen.findByText('What should the book look like?', undefined, LAZY)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Journey' })).toBeInTheDocument();
  });
});
