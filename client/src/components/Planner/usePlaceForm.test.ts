// FE-PLANNER-PLFORM-001 to FE-PLANNER-PLFORM-014: the place form state behind the desktop
// dialog and the phone sheet, and the inline new category of both ('dialog' and 'sheet').
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Category, Place } from '../../types';
import { DEFAULT_FORM } from './PlaceFormModal.helpers';
import { useNewCategory, usePlaceForm, type NewCategoryOptions } from './usePlaceForm';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

const makeToast = () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() });

let toast: ReturnType<typeof makeToast>;

beforeEach(() => {
  toast = makeToast();
});

function setup(canUploadFiles = true) {
  return renderHook(() => usePlaceForm({ t, toast, canUploadFiles }));
}

const PLACE = {
  id: 5,
  name: 'Louvre',
  lat: 48.86,
  lng: 2.33,
  google_place_id: 'g-louvre',
  amap_poi_id: null,
  osm_id: null,
} as unknown as Place;

function file(name: string, type: string) {
  return new File(['x'], name, { type });
}

function pasteEvent(items: { type: string; file: File | null }[]) {
  const preventDefault = vi.fn();
  const event = {
    preventDefault,
    clipboardData: { items: items.map((item) => ({ type: item.type, getAsFile: () => item.file })) },
  } as unknown as React.ClipboardEvent;
  return { event, preventDefault };
}

describe('usePlaceForm', () => {
  it('FE-PLANNER-PLFORM-001: starts on the blank form with nothing attached, warned or described', () => {
    const { result } = setup();
    expect(result.current.form).toEqual(DEFAULT_FORM);
    expect(result.current.pendingFiles).toEqual([]);
    expect(result.current.duplicateWarning).toBeNull();
    expect(result.current.detailsSelection).toBeNull();
    expect(result.current.isSaving).toBe(false);
    expect(result.current.autoFilledRef.current.size).toBe(0);
  });

  it('FE-PLANNER-PLFORM-002: opening on a place being edited owns no field and describes that place', () => {
    const { result } = setup();
    const next = { ...DEFAULT_FORM, name: 'Louvre' };
    act(() => result.current.openForm(next, PLACE, null));
    expect(result.current.form).toBe(next);
    expect(result.current.autoFilledRef.current.size).toBe(0);
    expect(result.current.detailsSelection).toEqual({ placeId: 'g-louvre', lat: 48.86, lng: 2.33, name: 'Louvre' });
  });

  it('FE-PLANNER-PLFORM-003: opening on a map POI owns the fields it filled and describes the POI', () => {
    const { result } = setup();
    const prefill = { lat: 1, lng: 2, name: 'Cafe', website: 'https://cafe.example', osm_id: 'N9' };
    act(() => result.current.openForm(DEFAULT_FORM, null, prefill));
    expect([...result.current.autoFilledRef.current].sort()).toEqual(['lat', 'lng', 'name', 'osm_id', 'website']);
    expect(result.current.detailsSelection).toEqual({ placeId: 'N9', lat: 1, lng: 2, name: 'Cafe' });
  });

  it('FE-PLANNER-PLFORM-004: a fresh opening drops the files and the warning the last one left', () => {
    const { result } = setup();
    act(() => result.current.addFiles([file('a.pdf', 'application/pdf')]));
    act(() => result.current.handleChange('name', 'Louvre'));
    act(() => {
      result.current.warnIfDuplicate([{ name: 'louvre' }]);
    });
    expect(result.current.duplicateWarning).toBe('louvre');
    act(() => result.current.openForm(DEFAULT_FORM, null, null));
    expect(result.current.pendingFiles).toEqual([]);
    expect(result.current.duplicateWarning).toBeNull();
    expect(result.current.detailsSelection).toBeNull();
  });

  it('FE-PLANNER-PLFORM-005: a field typed by hand is no longer the last pick to clear', () => {
    const { result } = setup();
    act(() => result.current.openForm(DEFAULT_FORM, null, { lat: 1, lng: 2, name: 'Cafe' }));
    act(() => result.current.handleChange('name', 'My cafe'));
    expect(result.current.form.name).toBe('My cafe');
    expect(result.current.autoFilledRef.current.has('name')).toBe(false);
    expect(result.current.autoFilledRef.current.has('lat')).toBe(true);
  });

  it('FE-PLANNER-PLFORM-006: files are added from the input, which is cleared, and removed by index', () => {
    const { result } = setup();
    const a = file('a.pdf', 'application/pdf');
    const b = file('b.png', 'image/png');
    const target = { files: [a, b], value: 'C:\\fakepath\\a.pdf' };
    act(() => result.current.addFilesFromInput({ target } as unknown as React.ChangeEvent<HTMLInputElement>));
    expect(result.current.pendingFiles).toEqual([a, b]);
    expect(target.value).toBe('');
    act(() => result.current.removeFile(0));
    expect(result.current.pendingFiles).toEqual([b]);
  });

  it('FE-PLANNER-PLFORM-007: a pasted picture or PDF becomes an attachment, the first one only', () => {
    const { result } = setup();
    const img = file('shot.png', 'image/png');
    const { event, preventDefault } = pasteEvent([
      { type: 'text/plain', file: null },
      { type: 'image/png', file: img },
      { type: 'application/pdf', file: file('x.pdf', 'application/pdf') },
    ]);
    act(() => result.current.handlePaste(event));
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.pendingFiles).toEqual([img]);
  });

  it('FE-PLANNER-PLFORM-008: a member who may not upload pastes text as text', () => {
    const { result } = setup(false);
    const { event, preventDefault } = pasteEvent([{ type: 'image/png', file: file('shot.png', 'image/png') }]);
    act(() => result.current.handlePaste(event));
    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.pendingFiles).toEqual([]);
  });

  it('FE-PLANNER-PLFORM-009: the details column picks the image and hands over its description', () => {
    const { result } = setup();
    act(() => result.current.pickImage('https://img.example/1.jpg'));
    expect(result.current.form.image_url).toBe('https://img.example/1.jpg');
    act(() => result.current.pickImage(null));
    expect(result.current.form.image_url).toBeUndefined();
    act(() => result.current.adoptDescription('A museum'));
    expect(result.current.form.description).toBe('A museum');
  });

  it('FE-PLANNER-PLFORM-010: a likely duplicate warns once by name; none lets the save go on', () => {
    const { result } = setup();
    act(() => result.current.handleChange('name', 'Louvre'));
    let warned = true;
    act(() => {
      warned = result.current.warnIfDuplicate([{ name: 'Orsay' }]);
    });
    expect(warned).toBe(false);
    expect(toast.warning).not.toHaveBeenCalled();

    act(() => {
      warned = result.current.warnIfDuplicate([{ name: 'Louvre Museum' }, { name: '  louvre ' }]);
    });
    expect(warned).toBe(true);
    expect(result.current.duplicateWarning).toBe('  louvre ');
    expect(toast.warning).toHaveBeenCalledWith('places.duplicateExists:{"name":"  louvre "}');
  });
});

function category(id: number): Category {
  return { id, name: 'Food', color: '#6366f1', icon: 'MapPin' } as unknown as Category;
}

describe('useNewCategory', () => {
  function setupCategory(options: Pick<NewCategoryOptions, 'variant' | 'create'>) {
    const onCreated = vi.fn();
    const hook = renderHook(() => useNewCategory({ ...options, onCreated, t, toast } as NewCategoryOptions));
    return { ...hook, onCreated };
  }

  it('FE-PLANNER-PLFORM-011: a blank name creates nothing', async () => {
    const create = vi.fn(async () => category(1));
    const { result } = setupCategory({ variant: 'sheet', create });
    act(() => result.current.setName('   '));
    await act(async () => {
      await result.current.submit();
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLFORM-012: the desktop sends the name as typed, picks the new category and closes', async () => {
    const create = vi.fn(async () => category(7));
    const { result, onCreated } = setupCategory({ variant: 'dialog', create });
    act(() => {
      result.current.setOpen(true);
      result.current.setName(' Food ');
    });
    await act(async () => {
      await result.current.submit();
    });
    expect(create).toHaveBeenCalledWith({ name: ' Food ', color: '#6366f1', icon: 'MapPin' });
    expect(onCreated).toHaveBeenCalledWith('7');
    expect(result.current.name).toBe('');
    expect(result.current.open).toBe(false);
  });

  it('FE-PLANNER-PLFORM-013: a desktop create that hands nothing back picks nothing but still closes', async () => {
    const create = vi.fn(() => undefined);
    const { result, onCreated } = setupCategory({ variant: 'dialog', create });
    act(() => {
      result.current.setOpen(true);
      result.current.setName('Food');
    });
    await act(async () => {
      await result.current.submit();
    });
    expect(onCreated).not.toHaveBeenCalled();
    expect(result.current.open).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLFORM-014: the phone trims the name, ignores a second tap while saving and toasts a failure', async () => {
    let finish: (c: Category) => void = () => {};
    const create = vi.fn(() => new Promise<Category>((resolve) => (finish = resolve)));
    const { result, onCreated } = setupCategory({ variant: 'sheet', create });
    act(() => result.current.setName(' Food '));
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.submit();
    });
    expect(result.current.saving).toBe(true);
    await act(async () => {
      await result.current.submit();
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({ name: 'Food', color: '#6366f1', icon: 'MapPin' });
    await act(async () => {
      finish(category(3));
      await first;
    });
    expect(onCreated).toHaveBeenCalledWith('3');
    expect(result.current.saving).toBe(false);

    create.mockImplementation(() => Promise.reject(new Error('nope')));
    act(() => result.current.setName('Bar'));
    await act(async () => {
      await result.current.submit();
    });
    expect(toast.error).toHaveBeenCalledWith('places.categoryCreateError');
    expect(result.current.name).toBe('Bar');
  });
});
