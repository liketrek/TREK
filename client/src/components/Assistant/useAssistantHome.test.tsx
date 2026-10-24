/**
 * FE-AI-HOME-001 to FE-AI-HOME-004
 *
 * The home chat's shared hooks: its key and name, the way into one trip's own
 * chat with the question waiting there (a question already typed there
 * stays), the way in from the pages outside a trip, and the questions the
 * empty home chat offers.
 */
import type { AiStatusResponse } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { HOME_SUGGESTIONS } from './assistantModel';
import { useAssistantHome, useAssistantHomeLauncher } from './useAssistantHome';
import { useAssistantSuggestions } from './useAssistantSuggestions';

const INITIAL = useAssistantStore.getState();

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
});

function Home({ switchTo }: { switchTo: (trip: { id: number; title: string }) => void }) {
  const home = useAssistantHome(switchTo);
  return (
    <div>
      <p>
        chat {home.chat.id} {home.chat.title}
      </p>
      <button type="button" onClick={() => home.openTripChat({ id: 9, title: 'Lisbon' }, 'What is missing?')}>
        ask
      </button>
      <button type="button" onClick={() => home.openTripChat({ id: 9, title: 'Lisbon' }, null)}>
        go
      </button>
    </div>
  );
}

function Launcher() {
  const { available, open } = useAssistantHomeLauncher();
  return available ? (
    <button type="button" onClick={open}>
      open
    </button>
  ) : null;
}

function Suggestions() {
  const { suggestions, canEdit } = useAssistantSuggestions(0);
  return (
    <ul data-can-edit={String(canEdit)}>
      {suggestions.map((s) => (
        <li key={s.id}>{s.prompt}</li>
      ))}
    </ul>
  );
}

describe('useAssistantHome', () => {
  it('FE-AI-HOME-001: names the home chat and keeps it under its own key', () => {
    render(<Home switchTo={vi.fn()} />);
    expect(screen.getByText('chat 0 Your travels')).toBeInTheDocument();
  });

  it("FE-AI-HOME-002: goes on in a trip's chat with the question waiting, and never over one typed there", () => {
    const switchTo = vi.fn();
    render(<Home switchTo={switchTo} />);
    fireEvent.click(screen.getByRole('button', { name: 'ask' }));
    expect(switchTo).toHaveBeenCalledWith({ id: 9, title: 'Lisbon' });
    expect(chatOf(useAssistantStore.getState(), 9).draft).toBe('What is missing?');

    useAssistantStore.getState().setDraft(9, 'My own words');
    fireEvent.click(screen.getByRole('button', { name: 'ask' }));
    expect(chatOf(useAssistantStore.getState(), 9).draft).toBe('My own words');
    fireEvent.click(screen.getByRole('button', { name: 'go' }));
    expect(switchTo).toHaveBeenCalledTimes(3);
  });
});

describe('useAssistantHomeLauncher', () => {
  it('FE-AI-HOME-003: offers the way in only while the assistant can run, and opens the window', () => {
    const { rerender } = render(<Launcher />);
    expect(screen.queryByRole('button', { name: 'open' })).not.toBeInTheDocument();
    useAssistantStore.setState({ status: { available: true } as AiStatusResponse });
    rerender(<Launcher />);
    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(useAssistantStore.getState().window).toEqual({ open: true, minimized: false });
  });
});

describe('the empty home chat', () => {
  it('FE-AI-HOME-004: offers questions across the trips, all of them, and holds nothing back', () => {
    render(<Suggestions />);
    const items = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(items).toHaveLength(HOME_SUGGESTIONS.length);
    expect(items).toContain('Which trip is next, and what is still open?');
    expect(items).toContain('How many countries have I visited?');
    expect(screen.getByRole('list')).toHaveAttribute('data-can-edit', 'true');
  });
});
