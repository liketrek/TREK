// FE-MOB-PFILTER-TAGS-001 to FE-MOB-PFILTER-TAGS-003: the tags in the phone's category filter,
// which ticks them into the same set as the categories.
import { beforeEach, describe, expect, it } from 'vitest';

import { buildCategory, buildPlace, buildTag } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { resetAllStores } from '../../../../../tests/helpers/store';
import { useTripStore } from '../../../../store/tripStore';
import { MCategoryFilterList } from './MPlacesFilterControls';

const park = buildCategory({ id: 4, name: 'Park' });
const monument = buildTag({ id: 7, trip_id: 1, name: 'Monument', color: '#6366f1' });
const tower = buildPlace({ category_id: 4, tags: [{ id: 7, name: 'Monument' }] });
// A traveller's personal tag, put on the place through the API: the trip does not list it.
const market = buildPlace({ category_id: 4, tags: [{ id: 50, name: 'Hidden gem' }] });

beforeEach(() => {
  resetAllStores();
  useTripStore.setState({ tripTags: [monument] });
});

describe('MCategoryFilterList: tags', () => {
  it('FE-MOB-PFILTER-TAGS-001: lists the tags after the categories, the ones of the trip and any other a place carries', () => {
    render(<MCategoryFilterList categories={[park]} places={[tower, market]} />);
    expect(screen.getAllByRole('checkbox').map((row) => row.textContent)).toEqual(['Park', 'Hidden gem', 'Monument']);
    expect(screen.getByRole('checkbox', { name: 'Monument' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-PFILTER-TAGS-002: a tag is ticked into the set the categories filter through, and out of it again', () => {
    render(<MCategoryFilterList categories={[park]} places={[tower, market]} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Monument' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Park' }));
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual(['tag:7', '4']);
    expect(screen.getByRole('checkbox', { name: 'Monument' })).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Monument' }));
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual(['4']);
    expect(screen.getByRole('checkbox', { name: 'Monument' })).toHaveAttribute('aria-checked', 'false');
  });

  it('FE-MOB-PFILTER-TAGS-003: a trip without tags lists the categories alone', () => {
    useTripStore.setState({ tripTags: [] });
    render(<MCategoryFilterList categories={[park]} places={[buildPlace({ category_id: 4 })]} />);
    expect(screen.getAllByRole('checkbox').map((row) => row.textContent)).toEqual(['Park']);
  });
});
