/**
 * The output contract as the SDK publishes it. The lists are generated from the host's
 * protocol/output-contract.ts (server check:plugin-facts keeps them in sync) and the
 * entity interfaces in src/index.ts are type-checked against them; these cases pin the
 * runtime side: what the exports hold and that they cover the method vocabulary.
 */
import { describe, it, expect } from 'vitest';
import { PLUGIN_ENTITY_FIELDS, PLUGIN_ENTITY_NESTED, PLUGIN_METHOD_RESULT } from '../src/index.js';
import { KNOWN_ADDONS } from '../src/manifest.js';
import { KNOWN_METHODS } from '../src/generated/host-facts.js';

describe('PLUGIN_ENTITY_FIELDS', () => {
  it('names the fields plugins rely on and never a credential', () => {
    expect(PLUGIN_ENTITY_FIELDS.trip).toEqual(expect.arrayContaining(['id', 'user_id', 'title', 'start_date', 'end_date', 'currency']));
    expect(PLUGIN_ENTITY_FIELDS.trip).not.toContain('feed_token');
    expect(PLUGIN_ENTITY_FIELDS.user).toEqual(['id', 'username', 'display_name', 'avatar']);
    expect(PLUGIN_ENTITY_FIELDS.place).toEqual(expect.arrayContaining(['trip_id', 'name', 'lat', 'lng', 'category_id', 'notes']));
    // A place has no day of its own: Place.day_id is deprecated, never delivered.
    expect(PLUGIN_ENTITY_FIELDS.place).not.toContain('day_id');
  });

  it('lists every field once', () => {
    for (const fields of Object.values(PLUGIN_ENTITY_FIELDS)) {
      expect(new Set(fields).size).toBe(fields.length);
    }
  });
});

describe('PLUGIN_ENTITY_NESTED', () => {
  it('points the fields that hold rows at entities with a field list', () => {
    const fields: Readonly<Record<string, readonly string[]>> = PLUGIN_ENTITY_FIELDS;
    for (const [entity, nested] of Object.entries(PLUGIN_ENTITY_NESTED)) {
      for (const [field, child] of Object.entries(nested)) {
        expect(fields[entity]).toContain(field);
        expect(fields[child]).toBeDefined();
      }
    }
    expect(PLUGIN_ENTITY_NESTED.day).toEqual({ assignments: 'assignment', notes_items: 'dayNote' });
    expect(PLUGIN_ENTITY_NESTED.reservation).toEqual({ endpoints: 'reservationEndpoint' });
  });
});

describe('PLUGIN_METHOD_RESULT', () => {
  it('describes every wire method plus the three unconditional ones', () => {
    for (const method of KNOWN_METHODS) expect(PLUGIN_METHOD_RESULT[method]).toBeDefined();
    for (const method of ['plugins.call', 'events.emit', 'settings.get']) expect(PLUGIN_METHOD_RESULT[method]).toBeDefined();
    expect(Object.keys(PLUGIN_METHOD_RESULT)).toHaveLength(KNOWN_METHODS.length + 3);
  });

  it('names only entities that have a field list, or host or readModel', () => {
    for (const result of Object.values(PLUGIN_METHOD_RESULT)) {
      const entity = result.replace(/\[\]$/, '');
      expect(entity in PLUGIN_ENTITY_FIELDS || entity === 'host' || entity === 'readModel').toBe(true);
    }
    expect(PLUGIN_METHOD_RESULT['trips.getById']).toBe('trip');
    expect(PLUGIN_METHOD_RESULT['trips.getPlaces']).toBe('place[]');
    expect(PLUGIN_METHOD_RESULT['db.query']).toBe('host');
    expect(PLUGIN_METHOD_RESULT['tags.list']).toBe('tag[]');
    expect(PLUGIN_METHOD_RESULT['atlas.visited']).toBe('readModel');
  });
});

describe('KNOWN_ADDONS', () => {
  it('carries the addons the hand-kept copy had missed', () => {
    expect(KNOWN_ADDONS).toEqual(expect.arrayContaining(['dawarich', 'roadtrip', 'tours', 'budget', 'collections']));
  });
});
