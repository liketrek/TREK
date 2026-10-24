// FE-ACT-COMPARE-LEGEND-001
// ACT-02 over the plan map, rendered without the translation provider so
// every text reads as its key: the legend names both lines, and closing it
// ends the comparison.
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTourActivityCompareStore } from '../../../store/tourActivityCompareStore';
import ActivityCompareLegend from './ActivityCompareLegend';

beforeEach(() => {
  useTourActivityCompareStore.getState().show({ tourPlaceId: 7, trackPlaceId: 20 });
});

describe('ActivityCompareLegend (ACT-02)', () => {
  it('FE-ACT-COMPARE-LEGEND-001: names the plan and the actual track, and ends the comparison when closed', () => {
    const legend = { planName: 'Ridge', planColor: 'plan-paint', trackName: 'Watch export' };
    render(<ActivityCompareLegend legend={legend} />);
    const card = screen.getByTestId('activity-compare-legend');
    expect(card).toHaveTextContent('tours.activity.compare.plan');
    expect(card).toHaveTextContent('Ridge');
    expect(card).toHaveTextContent('tours.activity.badge');
    expect(card).toHaveTextContent('Watch export');

    fireEvent.click(screen.getByRole('button', { name: 'tours.activity.compare.hide' }));
    expect(useTourActivityCompareStore.getState().comparison).toBeNull();
  });
});
