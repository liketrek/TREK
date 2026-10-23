/**
 * FE-AI-LIVE-001 to FE-AI-LIVE-004
 *
 * The running step's line: what it does, and once the stream says where it
 * looks, the place or the query, with a pin when the map can show the area.
 */
import type { AssistantActivity, AssistantMessage } from '@trek/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { render, screen } from '../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import AssistantToolSteps from './AssistantToolSteps';
import { AssistantViewContext } from './assistantViewContext';

const TRIP = 4;
const INITIAL = useAssistantStore.getState();

const running: AssistantMessage = {
  id: 'msg-2',
  role: 'assistant',
  status: 'complete',
  createdAt: '2026-10-21T08:00:00.000Z',
  parts: [{ type: 'tool-call', toolCallId: 'call-1', toolName: 'search_nearby_places', args: {} }],
};

function seed(activity: AssistantActivity | null) {
  useAssistantStore.setState({
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), messages: [running], live: { activity } } },
  });
}

function renderSteps() {
  return render(
    <AssistantViewContext.Provider value={{ tripId: TRIP, variant: 'window' }}>
      <AssistantToolSteps steps={[{ toolCallId: 'call-1', toolName: 'search_nearby_places', running: true }]} />
    </AssistantViewContext.Provider>
  );
}

afterEach(() => useAssistantStore.setState(INITIAL, true));

describe('AssistantLiveStep', () => {
  it('FE-AI-LIVE-001: names the place the running step searches near', () => {
    seed({
      toolCallId: 'call-1',
      label: 'Trastevere',
      area: { type: 'point', lat: 41.88, lng: 12.47, radiusM: 800 },
    });
    const { container } = renderSteps();
    expect(screen.getByRole('status')).toHaveTextContent('Searching near Trastevere');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('FE-AI-LIVE-002: without a place it keeps the step name, and no pin', () => {
    seed({ toolCallId: 'call-1', label: null, area: null });
    const { container } = renderSteps();
    expect(screen.getByRole('status')).toHaveTextContent('Searching nearby');
    expect(container.querySelector('svg')).toBeNull();
  });

  it("FE-AI-LIVE-003: a place another step named is not this step's", () => {
    seed({ toolCallId: 'call-0', label: 'Trastevere', area: null });
    renderSteps();
    expect(screen.getByRole('status')).toHaveTextContent('Searching nearby');
  });

  it('FE-AI-LIVE-004: with "map follows the assistant" off the place stays, the pin goes', () => {
    const settings = useSettingsStore.getState().settings;
    useSettingsStore.setState({ settings: { ...settings, assistant_map_follow: false } });
    seed({
      toolCallId: 'call-1',
      label: 'Trastevere',
      area: { type: 'point', lat: 41.88, lng: 12.47, radiusM: 800 },
    });
    const { container } = renderSteps();
    expect(screen.getByRole('status')).toHaveTextContent('Searching near Trastevere');
    expect(container.querySelector('svg')).toBeNull();
    useSettingsStore.setState({ settings });
  });
});
