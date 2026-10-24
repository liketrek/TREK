/**
 * FE-AI-ASK-001 to FE-AI-ASK-003
 *
 * "Ask" in the place inspector: there only while the assistant can run, only
 * in the planner of the place's trip, and it opens the chat about the place.
 */
import type { AiStatusResponse } from '@trek/shared';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { buildPlace } from '../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import AssistantAskButton from './AssistantAskButton';

const INITIAL = useAssistantStore.getState();
const place = buildPlace({ id: 42, trip_id: 5, name: 'Kinkaku-ji' });

function renderAt(path: string) {
  return render(
    <Routes>
      <Route path="/trips/:id" element={<AssistantAskButton place={place} />} />
      <Route path="*" element={<AssistantAskButton place={place} />} />
    </Routes>,
    { initialEntries: [path] }
  );
}

afterEach(() => useAssistantStore.setState(INITIAL, true));

describe('AssistantAskButton', () => {
  it('FE-AI-ASK-001: shows nothing until the assistant has a connection to use', () => {
    renderAt('/trips/5');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('FE-AI-ASK-002: opens the assistant with the place as its context', () => {
    useAssistantStore.setState({ status: { available: true } as AiStatusResponse });
    renderAt('/trips/5');
    fireEvent.click(screen.getByRole('button', { name: 'Ask: Kinkaku-ji' }));

    const state = useAssistantStore.getState();
    expect(state.window).toEqual({ open: true, minimized: false });
    expect(chatOf(state, 5).focus).toEqual({ placeIds: [42] });
  });

  it('FE-AI-ASK-003: is not offered outside the planner of the trip the place belongs to', () => {
    useAssistantStore.setState({ status: { available: true } as AiStatusResponse });
    const { unmount } = renderAt('/trips/6');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    unmount();

    renderAt('/collections/3');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
