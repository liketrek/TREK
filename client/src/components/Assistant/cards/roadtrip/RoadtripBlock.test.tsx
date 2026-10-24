/**
 * FE-AI-RT-010 to FE-AI-RT-016
 *
 * The drive in the chat is the road trip's own card: its totals as badges,
 * the days as a strip that switches the rail below, the chosen day as the
 * planner's day card with its rows and findings but none of its controls, a
 * charger checked beside it in the row of its stop, the ways of driving it
 * an answer worked out to pick from, what the totals leave out said, the
 * day the chat was opened on chosen first and where the battery runs dry.
 */
import type { TrekCard } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { charger, DRIVE, FLORENCE_DAY, MUNICH_DAY } from '../../../../../tests/helpers/assistantRoadtrip';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import RoadtripBlock from './RoadtripBlock';

vi.mock('../../../../hooks/useElementSize', () => ({
  useElementSize: () => ({ ref: () => undefined, width: 0, height: 0 }),
}));

const INITIAL = useAssistantStore.getState();

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
});

function renderBlock(cards: { toolCallId: string; card: TrekCard }[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', onOpen: vi.fn(), ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <RoadtripBlock cards={cards} />
    </AssistantViewContext.Provider>
  );
}

describe('RoadtripBlock', () => {
  it('FE-AI-RT-010: states the totals and draws the chosen day as the planner day card, read only', () => {
    renderBlock([{ toolCallId: 'call_1', card: DRIVE }]);
    expect(screen.getByText('7 stops')).toBeInTheDocument();
    expect(screen.getByText('1 charging stop')).toBeInTheDocument();
    expect(screen.getByText('Munich to Rome')).toBeInTheDocument();
    expect(screen.getByText('Ionity Holzkirchen')).toBeInTheDocument();
    expect(screen.getAllByText('LH 1840').length).toBeGreaterThan(0);
    expect(screen.getByText('Hotel Roma')).toBeInTheDocument();
    expect(screen.getByText('2 more stops on this day')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change what kind of stop this is' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make it a stop on the way' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3 more days in the road trip' })).toBeInTheDocument();
  });

  it('FE-AI-RT-011: a day of the strip switches the rail and draws its drive over the plan while pointed at', () => {
    renderBlock([{ toolCallId: 'call_1', card: DRIVE }]);
    const strip = screen.getByRole('list', { name: 'Days of the drive' });
    const chips = strip.querySelectorAll('button');
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'Something on this day needs a look' })).toBeInTheDocument();
    fireEvent.mouseEnter(chips[1] as HTMLElement);
    const preview = useAssistantStore.getState().routePreview;
    expect(preview).toMatchObject({ tripId: 4, ref: 'call_1', lines: FLORENCE_DAY.lines });
    fireEvent.mouseLeave(chips[1] as HTMLElement);
    expect(useAssistantStore.getState().routePreview).toBeNull();
    fireEvent.click(chips[1] as HTMLElement);
    expect(screen.getByText('Florence')).toBeInTheDocument();
    expect(screen.queryByText('Ionity Holzkirchen')).not.toBeInTheDocument();
  });

  it('FE-AI-RT-012: a charger checked beside the drive shows in its stop, one elsewhere stands on its own', () => {
    renderBlock([
      { toolCallId: 'call_1', card: DRIVE },
      { toolCallId: 'call_2', card: charger() },
      { toolCallId: 'call_3', card: charger({ placeId: null, name: 'Supercharger Chur' }) },
    ]);
    expect(screen.getAllByText('4/6')).toHaveLength(2);
    expect(screen.getByText('Supercharger Chur')).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Charging' })).toHaveLength(1);
  });

  it('FE-AI-RT-013: several ways of driving it are rows to pick, and the picked one drives the card', () => {
    const preview: TrekCard = {
      ...DRIVE,
      previewKeys: ['roadtrip_hotel_bookends'],
      days: [FLORENCE_DAY],
      moreDays: 0,
    };
    renderBlock([
      { toolCallId: 'call_1', card: DRIVE },
      { toolCallId: 'call_2', card: preview },
    ]);
    const rows = screen.getByRole('list', { name: 'Ways to drive it' }).querySelectorAll('button');
    expect(rows[0]).toHaveTextContent('Saved settings');
    expect(rows[1]).toHaveTextContent('Preview: Start and end each day at your stay');
    expect(screen.getByText('Munich to Rome')).toBeInTheDocument();
    fireEvent.click(rows[1] as HTMLElement);
    expect(screen.getByText('Florence')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('FE-AI-RT-014: says why the totals are not the whole drive, and the bookings on none of the days', () => {
    const card = { ...DRIVE, complete: false, problem: 'routing' as const, undatedRides: 2, quietDays: 2 };
    renderBlock([{ toolCallId: 'call_1', card }]);
    const notice = 'Some legs could not be routed, so these totals are not the whole drive.';
    expect(screen.getByText(notice)).toBeInTheDocument();
    expect(screen.getByText('2 bookings are on none of the days')).toBeInTheDocument();
    expect(screen.getByText('2 days without a drive')).toBeInTheDocument();
  });

  it('FE-AI-RT-015: the sketch and the crosshair move the map to the day and the drive; open goes to the road trip', () => {
    const onOpen = vi.fn();
    const onFocusDay = vi.fn();
    renderBlock([{ toolCallId: 'call_1', card: DRIVE }], { onOpen, onFocusDay });
    fireEvent.click(screen.getByRole('button', { name: 'Show day 1 on the map' }));
    expect(onFocusDay).toHaveBeenCalledWith(MUNICH_DAY.dayId);
    expect(useAssistantStore.getState().camera).toMatchObject({ tripId: 4, mode: 'fit', why: 'user' });
    fireEvent.click(screen.getByRole('button', { name: 'Show the drive on the map' }));
    expect(useAssistantStore.getState().camera?.points.length).toBe(7);
    fireEvent.click(screen.getByRole('button', { name: /Open in the road trip/ }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'roadtrip', params: { day: '31' } });
  });

  it('FE-AI-RT-016: opens on the day the chat was opened on and says where the battery runs dry', () => {
    useAssistantStore.setState((s) => ({
      byTrip: { ...s.byTrip, 4: { ...chatOf(s, 4), focus: { dayId: FLORENCE_DAY.dayId } } },
    }));
    const dry = { ...DRIVE, days: [MUNICH_DAY, { ...FLORENCE_DAY, dryKm: 280 }] };
    renderBlock([{ toolCallId: 'call_1', card: dry }]);
    expect(screen.getByText('Florence')).toBeInTheDocument();
    expect(screen.getByText(/Battery runs out here after 280/)).toBeInTheDocument();
  });
});
