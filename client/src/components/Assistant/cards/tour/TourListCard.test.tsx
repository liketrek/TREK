/**
 * FE-AI-TOUR-035 to FE-AI-TOUR-036, FE-AI-TOUR-044
 *
 * The saved tours of a trip as the Tours sidebar lists them: the avatar, the
 * name, time, length and climb, the days a tour is on or that it is on none
 * yet, the rest counted as a way to the Tours tab (on the phone, to the plan);
 * resting on a row lights the tour's line on the map, a tap shows it there,
 * and a card that goes puts out the line it lit.
 */
import type { TourListCard as TourList } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TOUR_LIST } from '../../../../../tests/helpers/assistantTour';
import { act, fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAssistantStore } from '../../../../store/assistantStore';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import TourListCard from './TourListCard';

const ASSISTANT = useAssistantStore.getState();

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
});

function renderList(view: Partial<AssistantView> = {}, card: TourList = TOUR_LIST) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <TourListCard cards={[{ toolCallId: 'call_3', card }]} />
    </AssistantViewContext.Provider>
  );
}

describe('TourListCard', () => {
  it('FE-AI-TOUR-035: lists the tours with their figures and days, and counts the rest as a way to the Tours tab', () => {
    const onOpen = vi.fn();
    renderList({ onOpen });
    expect(screen.getByRole('region', { name: 'Tours' })).toBeInTheDocument();
    expect(screen.getByText('Hochfelln from Bergen')).toBeInTheDocument();
    expect(screen.getByText('8.2 km')).toBeInTheDocument();
    expect(screen.getByText('640 m')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Not on a day yet')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 more' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'tour-planner' });
  });

  it('FE-AI-TOUR-036: resting on a row lights the tour on the map, a tap shows it there', () => {
    const onOpen = vi.fn();
    renderList({ onOpen });
    const row = screen.getByRole('button', { name: /Chiemsee by kayak/ });
    fireEvent.mouseEnter(row);
    expect(useAssistantStore.getState().mapLink).toMatchObject({ tripId: 4, hoveredId: 'tour:42', source: 'card' });
    fireEvent.mouseLeave(row);
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBeNull();
    fireEvent.click(row);
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 42, dayId: null });
  });

  it('FE-AI-TOUR-044: names several days at once, counts the rest towards the plan on the phone, and puts out its light when it goes', () => {
    const onOpen = vi.fn();
    const first = TOUR_LIST.rows[0] as TourList['rows'][number];
    const card: TourList = { ...TOUR_LIST, dayId: 22, rows: [{ ...first, days: [2, 4] }] };
    const view = renderList({ onOpen, variant: 'fullscreen' }, card);
    expect(screen.getByText('Days 2, 4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2 more' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: null, dayId: 22 });

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Hochfelln from Bergen/ }));
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBe('tour:41');
    view.unmount();
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBeNull();

    // A line lit from the map is the map's: a card that goes leaves it lit.
    const again = renderList({ onOpen }, card);
    act(() => useAssistantStore.getState().setMapHover(4, 'tour:41', 'map'));
    again.unmount();
    expect(useAssistantStore.getState().mapLink).toMatchObject({ hoveredId: 'tour:41', source: 'map' });
  });
});
