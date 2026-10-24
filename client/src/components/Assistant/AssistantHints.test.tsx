/**
 * FE-AI-HINTLIST-001 to FE-AI-HINTLIST-006
 *
 * The hint list in the empty chat: three rows at most with the rest behind
 * "n more", a row that asks, an X that waves one away, rows shown counted as
 * seen, and rows that wait while offline.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import AssistantHints from './AssistantHints';
import type { AssistantHintsView, ReadyHint } from './useAssistantHints';

const network = vi.hoisted(() => ({ offline: false }));
vi.mock('../../hooks/useNetworkMode', () => ({
  useNetworkMode: () => ({ offline: network.offline, forced: false, setForced: () => undefined }),
}));

function hint(id: string, level: ReadyHint['level'] = 'info'): ReadyHint {
  const rule = level === 'warn' ? 'overlap' : 'gap';
  return { id, rule, level, text: `Line ${id}`, prompt: `Ask ${id}`, focus: null };
}

function view(hints: ReadyHint[]): AssistantHintsView {
  return {
    hints,
    unseenWarn: 0,
    markSeen: vi.fn(),
    markWarnsSeen: vi.fn(),
    dismiss: vi.fn(),
    ask: vi.fn(),
  };
}

beforeEach(() => {
  network.offline = false;
});

describe('AssistantHints', () => {
  it('FE-AI-HINTLIST-001: shows nothing without hints, and three rows with the rest behind "n more"', () => {
    const { container, unmount } = render(<AssistantHints view={view([])} phone={false} />);
    expect(container).toBeEmptyDOMElement();
    unmount();

    const five = view(['a', 'b', 'c', 'd', 'e'].map((id) => hint(id)));
    render(<AssistantHints view={five} phone={false} />);
    expect(screen.getByRole('region', { name: 'Worth a look' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(five.markSeen).toHaveBeenLastCalledWith(['a', 'b', 'c']);

    fireEvent.click(screen.getByRole('button', { name: '2 more' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(five.markSeen).toHaveBeenLastCalledWith(['a', 'b', 'c', 'd', 'e']);
  });

  it('FE-AI-HINTLIST-002: a row asks its question, and the X waves the hint away', () => {
    const one = view([hint('a', 'warn')]);
    render(<AssistantHints view={one} phone={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Line a' }));
    expect(one.ask).toHaveBeenCalledWith(one.hints[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Hide this hint' }));
    expect(one.dismiss).toHaveBeenCalledWith('a');
  });

  it('FE-AI-HINTLIST-003: on the phone the X is always there, with room for a thumb', () => {
    render(<AssistantHints view={view([hint('a')])} phone />);
    const dismiss = screen.getByRole('button', { name: 'Hide this hint' });
    expect(dismiss.className).toContain('h-10');
    expect(dismiss.className).not.toContain('opacity-0');
  });

  it('FE-AI-HINTLIST-006: in the window the X hides until hover only on a screen that can hover', () => {
    render(<AssistantHints view={view([hint('a')])} phone={false} />);
    const dismiss = screen.getByRole('button', { name: 'Hide this hint' });
    expect(dismiss.className).toContain('[@media(hover:hover)]:opacity-0');
    expect(dismiss.className.split(' ')).not.toContain('opacity-0');
  });

  it('FE-AI-HINTLIST-004: offline the rows stay readable but do not ask', () => {
    network.offline = true;
    const one = view([hint('a')]);
    render(<AssistantHints view={one} phone={false} />);
    const row = screen.getByRole('button', { name: 'Line a' });
    expect(row).toBeDisabled();
    fireEvent.click(row);
    expect(one.ask).not.toHaveBeenCalled();
  });
});
