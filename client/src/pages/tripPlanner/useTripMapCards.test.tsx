import { act, renderHook } from '@testing-library/react';
import { buildDay, buildTrip } from '../../../tests/helpers/factories';
import { summariseTripRoute } from '../../components/Map/tripRouteGeometry';
import { useTripMapCards } from './useTripMapCards';

const day = buildDay({ id: 1 });
const pendingOverview = { ...summariseTripRoute([]), hasPlannedRoute: true, loading: true };
const tripOverview = {
  ...pendingOverview,
  loading: false,
  days: [
    {
      dayId: day.id,
      dayNumber: 1,
      date: day.date ?? null,
      title: day.title ?? null,
      color: { line: '#0a84ff', casing: '#0a5cc2' },
      lines: [],
      segments: [],
      distance: 12000,
      duration: 900,
      modes: ['driving'],
    },
  ],
};

function setup() {
  const planner: Parameters<typeof useTripMapCards>[0] = {
    activeTab: 'plan',
    hideOverview: vi.fn(),
    isLoading: false,
    isMobile: false,
    leftHidden: false,
    leftWidth: 340,
    overviewActive: false,
    overviewShown: false,
    rightHidden: false,
    rightWidth: 300,
    roadtripActive: false,
    selectAssignment: vi.fn(),
    selectedDayId: day.id,
    selectedPlace: null,
    setSelectedPlaceId: vi.fn(),
    setShowDayDetail: vi.fn(),
    showDayDetail: day,
    toggleOverview: vi.fn(),
    trip: buildTrip(),
    tripOverview: pendingOverview,
    viewportWidth: 1920,
  };
  const { result, rerender } = renderHook(useTripMapCards, { initialProps: planner });
  const dayCard = document.createElement('div');
  const overviewCard = document.createElement('div');
  vi.spyOn(dayCard, 'getBoundingClientRect').mockReturnValue(new DOMRect(580, 500, 800, 200));
  const measureOverview = vi.spyOn(overviewCard, 'getBoundingClientRect');
  result.current.dayCardRef.current = dayCard;

  const openCards = { ...planner, overviewActive: true, overviewShown: true };
  return { openCards, result, rerender, overviewCard, measureOverview };
}

describe('useTripMapCards', () => {
  it('waits for the first route card before checking the actual gap', () => {
    const { openCards, result, rerender, overviewCard, measureOverview } = setup();
    act(() => result.current.handleToggleOverview());
    rerender(openCards);
    expect(openCards.setShowDayDetail).not.toHaveBeenCalled();

    result.current.overviewCardRef.current = overviewCard;
    measureOverview.mockReturnValue(new DOMRect(1388, 500, 208, 150));
    rerender({ ...openCards, tripOverview });
    expect(openCards.setShowDayDetail).not.toHaveBeenCalled();
    expect(openCards.hideOverview).not.toHaveBeenCalled();

    measureOverview.mockReturnValue(new DOMRect(1387, 500, 209, 150));
    rerender({ ...openCards, tripOverview, leftWidth: 341 });
    expect(openCards.setShowDayDetail).toHaveBeenCalledExactlyOnceWith(null);
    expect(openCards.hideOverview).not.toHaveBeenCalled();
  });

  it('keeps the day details when the overview no longer fits after a viewport resize', () => {
    const { openCards, result, rerender, overviewCard, measureOverview } = setup();
    result.current.overviewCardRef.current = overviewCard;
    measureOverview.mockReturnValue(new DOMRect(1400, 500, 196, 150));
    rerender({ ...openCards, tripOverview });
    expect(openCards.hideOverview).not.toHaveBeenCalled();

    act(() => result.current.handleDayDetail(day));
    measureOverview.mockReturnValue(new DOMRect(1370, 500, 196, 150));
    rerender({ ...openCards, tripOverview, viewportWidth: 1890 });
    expect(openCards.hideOverview).toHaveBeenCalledOnce();
    expect(openCards.setShowDayDetail).not.toHaveBeenCalledWith(null);
  });

  it('uses reserved overview space while the trip has no route', () => {
    const { openCards, result, rerender } = setup();
    act(() => result.current.handleToggleOverview());
    const emptyOverview = { ...openCards, tripOverview: { ...pendingOverview, hasPlannedRoute: false } };
    rerender({ ...emptyOverview, viewportWidth: 2100 });
    expect(openCards.setShowDayDetail).not.toHaveBeenCalled();

    rerender(emptyOverview);
    expect(openCards.setShowDayDetail).toHaveBeenCalledExactlyOnceWith(null);
  });
});
