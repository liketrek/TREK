// FE-PLANNER-PLTAGS-001 to FE-PLANNER-PLTAGS-008: the tags of the place form, the one logic
// path behind the desktop dialog and the phone sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import { useState, type KeyboardEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTag } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTripStore, type TripStoreState } from '../../store/tripStore';
import type { Place, Tag } from '../../types';
import { DEFAULT_FORM } from './PlaceFormModal.helpers';
import { usePlaceTags } from './usePlaceTags';

const t = (key: string) => key;
const makeToast = () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() });

const monument = buildTag({ id: 7, trip_id: 5, name: 'Monument', color: '#6366f1' });
const zone = buildTag({ id: 8, trip_id: 5, name: 'Zone', color: '#10b981' });
/** A traveller's personal tag, put on the place through the API: the trip does not list it. */
const personal = { id: 50, name: 'Hidden gem', color: '#f59e0b' };

const addTripTag = vi.fn<TripStoreState['addTripTag']>();
let toast: ReturnType<typeof makeToast>;

function setOnline(online: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: online, writable: true, configurable: true });
}

beforeEach(() => {
  resetAllStores();
  setOnline(true);
  toast = makeToast();
  addTripTag.mockReset();
  useTripStore.setState({ tripTags: [monument, zone], addTripTag });
});

afterEach(() => {
  setOnline(true);
});

/** The hook over a form of its own, as both shells run it. */
function setup(place: Pick<Place, 'tags'> | null = null) {
  return renderHook(() => {
    const [form, setForm] = useState(DEFAULT_FORM);
    return { form, field: usePlaceTags({ tripId: 5, place, tags: form.tags, setForm, t, toast }) };
  });
}

function key(name: string) {
  const preventDefault = vi.fn();
  return { event: { key: name, preventDefault } as unknown as KeyboardEvent<HTMLInputElement>, preventDefault };
}

describe('usePlaceTags', () => {
  it('FE-PLANNER-PLTAGS-001: offers the tags of the trip by name, none ticked for a new place', () => {
    const { result } = setup();
    expect(result.current.field.options).toEqual([
      { id: 7, name: 'Monument', color: '#6366f1', on: false },
      { id: 8, name: 'Zone', color: '#10b981', on: false },
    ]);
    // Nothing was touched, so the save has no tags to send.
    expect(result.current.form.tags).toBeUndefined();
    expect(result.current.field.canAdd).toBe(false);
  });

  it('FE-PLANNER-PLTAGS-002: ticks what the place carries and keeps a personal tag of it on offer', () => {
    const { result } = setup({ tags: [{ id: 8, name: 'Zone (old name)' }, personal] });
    expect(result.current.field.options).toEqual([
      { id: 50, name: 'Hidden gem', color: '#f59e0b', on: true },
      { id: 7, name: 'Monument', color: '#6366f1', on: false },
      // The trip's own name and colour, not the copy on the place.
      { id: 8, name: 'Zone', color: '#10b981', on: true },
    ]);
    expect(result.current.form.tags).toBeUndefined();
  });

  it('FE-PLANNER-PLTAGS-003: a tick writes the whole set into the form, starting from what the place carries', () => {
    const { result } = setup({ tags: [{ id: 8, name: 'Zone' }, personal] });

    act(() => result.current.field.toggle(7));
    expect(result.current.form.tags).toEqual([8, 50, 7]);
    expect(result.current.field.options.map((tag) => tag.on)).toEqual([true, true, true]);

    act(() => result.current.field.toggle(50));
    expect(result.current.form.tags).toEqual([8, 7]);

    act(() => result.current.field.toggle(8));
    act(() => result.current.field.toggle(7));
    // Every tag off is an answer too: the save takes the tags off the place.
    expect(result.current.form.tags).toEqual([]);
    expect(result.current.field.options.map((tag) => tag.on)).toEqual([false, false, false]);
  });

  it('FE-PLANNER-PLTAGS-004: a typed name becomes a tag of the trip, ticked, and the field is empty again', async () => {
    const viewpoint = buildTag({ id: 9, trip_id: 5, name: 'Viewpoint' });
    addTripTag.mockResolvedValue(viewpoint);
    const { result } = setup();

    act(() => result.current.field.setName('  Viewpoint '));
    expect(result.current.field.canAdd).toBe(true);
    await act(() => result.current.field.addNew());

    expect(addTripTag).toHaveBeenCalledWith(5, { name: 'Viewpoint', color: expect.stringMatching(/^#[0-9a-f]{6}$/) });
    expect(result.current.form.tags).toEqual([9]);
    expect(result.current.field.name).toBe('');
    expect(result.current.field.saving).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLTAGS-005: a name the trip has already ticks that tag once, and an empty name asks nothing', async () => {
    addTripTag.mockResolvedValue(zone);
    const { result } = setup({ tags: [{ id: 8, name: 'Zone' }] });

    act(() => result.current.field.setName('   '));
    expect(result.current.field.canAdd).toBe(false);
    await act(() => result.current.field.addNew());
    expect(addTripTag).not.toHaveBeenCalled();

    act(() => result.current.field.setName('zone'));
    await act(() => result.current.field.addNew());
    expect(result.current.form.tags).toEqual([8]);
  });

  it('FE-PLANNER-PLTAGS-006: a tag that could not be added says so and keeps the name; offline it asks for a connection', async () => {
    addTripTag.mockRejectedValue(new Error('refused'));
    const { result } = setup();
    act(() => result.current.field.setName('Viewpoint'));

    await act(() => result.current.field.addNew());
    expect(toast.error).toHaveBeenLastCalledWith('places.tagCreateError');
    expect(result.current.field.name).toBe('Viewpoint');
    expect(result.current.field.saving).toBe(false);
    expect(result.current.form.tags).toBeUndefined();

    setOnline(false);
    await act(() => result.current.field.addNew());
    expect(toast.error).toHaveBeenLastCalledWith('common.needsConnection');
  });

  it('FE-PLANNER-PLTAGS-007: Enter in the name field adds the tag instead of saving the place; an empty field leaves the key alone', async () => {
    addTripTag.mockResolvedValue(buildTag({ id: 9, trip_id: 5, name: 'Viewpoint' }));
    const { result } = setup();

    const empty = key('Enter');
    act(() => result.current.field.handleNameKey(empty.event));
    expect(empty.preventDefault).not.toHaveBeenCalled();

    act(() => result.current.field.setName('Viewpoint'));
    const letter = key('a');
    act(() => result.current.field.handleNameKey(letter.event));
    expect(letter.preventDefault).not.toHaveBeenCalled();
    expect(addTripTag).not.toHaveBeenCalled();

    const enter = key('Enter');
    act(() => result.current.field.handleNameKey(enter.event));
    await waitFor(() => expect(result.current.form.tags).toEqual([9]));
    expect(enter.preventDefault).toHaveBeenCalledTimes(1);
    expect(addTripTag).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-PLTAGS-008: a tick made while a tag is on its way is kept, and a second request waits for the first', async () => {
    let answer: (tag: Tag) => void = () => undefined;
    addTripTag.mockReturnValue(new Promise<Tag>((resolve) => (answer = resolve)));
    const { result } = setup();
    act(() => result.current.field.setName('Viewpoint'));

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.field.addNew();
    });
    expect(result.current.field.saving).toBe(true);
    expect(result.current.field.canAdd).toBe(false);
    await act(() => result.current.field.addNew());
    expect(addTripTag).toHaveBeenCalledTimes(1);

    act(() => result.current.field.toggle(7));
    await act(async () => {
      answer(buildTag({ id: 9, trip_id: 5, name: 'Viewpoint' }));
      await pending;
    });
    expect(result.current.form.tags).toEqual([7, 9]);
  });
});
