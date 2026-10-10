// FE-PLANNER-PLFORMH-001 to FE-PLANNER-PLFORMH-010: the place form's openings and save
// payload, as the desktop dialog and the phone sheet both build them.
import { describe, expect, it } from 'vitest';

import type { Assignment, Place } from '../../types';
import {
  DEFAULT_FORM,
  duplicateName,
  openingAutoFilled,
  openingDetailsSelection,
  placeEditForm,
  placeFormPayload,
  prefillForm,
} from './PlaceFormModal.helpers';

const PLACE = {
  id: 3,
  name: 'Louvre',
  description: 'Museum',
  address: 'Rue de Rivoli',
  lat: 48.86,
  lng: 2.33,
  category_id: 4,
  place_time: '09:00',
  end_time: '10:00',
  notes: 'Bring water',
  transport_mode: null,
  website: 'https://louvre.fr',
  google_place_id: null,
  amap_poi_id: 'amap-1',
  osm_id: 'W1',
} as unknown as Place;

const ASSIGNMENT = {
  id: 11,
  notes: 'Day note',
  place: { place_time: '14:00', end_time: '' },
} as unknown as Assignment;

describe('placeEditForm', () => {
  it('FE-PLANNER-PLFORMH-001: reads the place, with its times off the assignment in context and its day note', () => {
    expect(placeEditForm(PLACE, ASSIGNMENT)).toEqual({
      name: 'Louvre',
      description: 'Museum',
      address: 'Rue de Rivoli',
      lat: '48.86',
      lng: '2.33',
      category_id: '4',
      place_time: '14:00',
      end_time: '',
      notes: 'Bring water',
      transport_mode: 'walking',
      website: 'https://louvre.fr',
      assignment_notes: 'Day note',
    });
  });

  it("FE-PLANNER-PLFORMH-002: without an assignment the times are the place's and no day note key exists", () => {
    const form = placeEditForm(PLACE, null, { phone: '+33' });
    expect(form.place_time).toBe('09:00');
    expect(form.end_time).toBe('10:00');
    expect(form.phone).toBe('+33');
    expect('assignment_notes' in form).toBe(false);
  });

  it('FE-PLANNER-PLFORMH-003: empty coordinates and category stay empty strings', () => {
    const bare = { ...PLACE, lat: null, lng: null, category_id: null, name: null } as unknown as Place;
    const form = placeEditForm(bare, undefined);
    expect([form.lat, form.lng, form.category_id, form.name]).toEqual(['', '', '', '']);
  });
});

describe('prefillForm', () => {
  it("FE-PLANNER-PLFORMH-004: a blank form at the POI, with what it knew and the shell's own extras", () => {
    const form = prefillForm({ lat: 1.5, lng: 2.5, name: 'Cafe', osm_id: 'N9' }, { category_id: '3' });
    expect(form).toEqual({
      ...DEFAULT_FORM,
      lat: '1.5',
      lng: '2.5',
      name: 'Cafe',
      address: '',
      website: '',
      phone: '',
      osm_id: 'N9',
      category_id: '3',
    });
  });
});

describe('openingDetailsSelection', () => {
  it('FE-PLANNER-PLFORMH-005: the edited place first, then the POI, then nothing', () => {
    expect(openingDetailsSelection(PLACE, { lat: 1, lng: 2 })).toEqual({
      placeId: 'amap-1',
      lat: 48.86,
      lng: 2.33,
      name: 'Louvre',
    });
    const unplaced = { ...PLACE, lat: null } as unknown as Place;
    expect(openingDetailsSelection(unplaced, { lat: 1, lng: 2, name: 'Cafe' })).toEqual({
      placeId: undefined,
      lat: 1,
      lng: 2,
      name: 'Cafe',
    });
    expect(openingDetailsSelection(unplaced, null)).toBeNull();
  });
});

describe('openingAutoFilled', () => {
  it('FE-PLANNER-PLFORMH-006: only a POI opening owns fields, and only the ones it filled', () => {
    const prefill = { lat: 1, lng: 2, name: 'Cafe', address: '', phone: '+1' };
    expect([...openingAutoFilled(null, prefill)].sort()).toEqual(['lat', 'lng', 'name', 'phone']);
    expect(openingAutoFilled(PLACE, prefill).size).toBe(0);
    expect(openingAutoFilled(null, null).size).toBe(0);
  });
});

describe('duplicateName', () => {
  it('FE-PLANNER-PLFORMH-007: names the existing place, or the typed name when that one has none', () => {
    const form = { ...DEFAULT_FORM, name: 'Louvre', lat: '48.86', lng: '2.33' };
    expect(duplicateName(form, [{ name: 'LOUVRE' }])).toBe('LOUVRE');
    expect(duplicateName(form, [{ name: null, lat: 48.86001, lng: 2.33 }])).toBe('Louvre');
    expect(duplicateName(form, [{ name: 'Orsay', lat: 40, lng: 2 }])).toBeNull();
  });
});

describe('placeFormPayload', () => {
  const form = {
    ...DEFAULT_FORM,
    name: 'Louvre',
    lat: '48.86',
    lng: '',
    category_id: '',
    assignment_notes: 'Day note',
  };

  it('FE-PLANNER-PLFORMH-008: numbers for the coordinates, null for an empty category, files only when chosen', () => {
    const payload = placeFormPayload(form, [], null);
    expect(payload.lat).toBe(48.86);
    expect(payload.lng).toBeNull();
    expect(payload.category_id).toBeNull();
    expect(payload._pendingFiles).toBeUndefined();
    const pdf = new File(['x'], 'a.pdf');
    expect(placeFormPayload(form, [pdf], null)._pendingFiles).toEqual([pdf]);
  });

  it('FE-PLANNER-PLFORMH-009: the day note travels only with its assignment and only when it changed', () => {
    expect('assignment_notes' in placeFormPayload(form, [], null)).toBe(false);
    expect('assignment_notes' in placeFormPayload(form, [], { notes: 'Day note' })).toBe(false);
    expect(placeFormPayload(form, [], { notes: 'Old note' }).assignment_notes).toBe('Day note');
    expect('assignment_notes' in placeFormPayload({ ...form, assignment_notes: '' }, [], { notes: null })).toBe(false);
  });

  it("FE-PLANNER-PLFORMH-010: a shell's extras are built from the parsed coordinates", () => {
    const payload = placeFormPayload(form, [], null, (lat, lng) => ({ at: [lat, lng] }));
    expect(payload.at).toEqual([48.86, null]);
  });
});
