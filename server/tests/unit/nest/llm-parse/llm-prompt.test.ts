import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, KI_RESERVATION_JSON_SCHEMA } from '../../../../src/nest/llm-parse/llm-prompt';
import { KI_RESERVATION_TYPES } from '@trek/shared';

/** The slice of JSON Schema these assertions read. */
interface SchemaNode {
  type?: string | readonly string[];
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  required?: readonly string[];
  additionalProperties?: boolean;
}

const root = KI_RESERVATION_JSON_SCHEMA as SchemaNode;
const item = root.properties.reservations.items;

describe('llm-prompt', () => {
  it('names every recognized @type the mapper supports', () => {
    const prompt = buildSystemPrompt();
    for (const t of KI_RESERVATION_TYPES) expect(prompt).toContain(t);
  });

  it('instructs JSON-only output wrapped in reservations', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/"reservations"/);
    expect(prompt.toLowerCase()).toContain('iso 8601');
  });

  it('exposes a strict-safe object-root JSON schema enumerating the types', () => {
    const schema = KI_RESERVATION_JSON_SCHEMA as any;
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toContain('reservations');
    const item = schema.properties.reservations.items;
    expect(item.properties['@type'].enum).toEqual([...KI_RESERVATION_TYPES]);
    expect(item.required).toContain('@type');
  });

  /**
   * Gemini decodes against the schema and fills declared properties only. An
   * open `reservationFor` without any came back missing, and every hotel lost
   * its name (#1638, #2477).
   */
  it('declares the venue fields on reservationFor so a schema-constrained provider can fill them (#2477)', () => {
    const rf = item.properties.reservationFor;

    expect(item.required).toEqual(['@type', 'reservationFor']);
    expect(rf.type).toBe('object');
    expect(rf.additionalProperties).toBe(true);
    for (const field of ['name', 'address', 'telephone', 'url']) expect(rf.properties[field]).toEqual({ type: 'string' });
    expect(rf.properties.geo.properties).toEqual({ latitude: { type: 'number' }, longitude: { type: 'number' } });
  });

  it('declares every nested object the prompt names, per type (#2477)', () => {
    const rf = item.properties.reservationFor.properties;
    const keys = (node: SchemaNode) => Object.keys(node.properties ?? {});

    expect(keys(rf.departureAirport)).toEqual(['iataCode', 'name', 'geo']);
    expect(keys(rf.airline)).toEqual(['name', 'iataCode']);
    for (const stop of ['departureStation', 'arrivalBusStop', 'arrivalBoatTerminal']) {
      expect(keys(rf[stop])).toEqual(['name', 'geo']);
    }
    expect(keys(rf.location)).toEqual(['name', 'address', 'geo', 'telephone', 'url']);
    expect(keys(rf.rentalCompany)).toEqual(['name']);
    // The car desks sit at the root, as the prompt says, with the same venue fields.
    expect(item.properties.pickupLocation).toEqual(rf.location);
    expect(item.properties.dropoffLocation).toEqual(rf.location);
  });

  it('nests no object deeper than two levels below reservationFor (#2477)', () => {
    const depth = (node: SchemaNode): number =>
      node.type === 'object' && node.properties
        ? 1 + Math.max(0, ...Object.values(node.properties).map(depth))
        : 0;
    // reservationFor itself, then e.g. departureAirport, then its geo.
    expect(depth(item.properties.reservationFor)).toBe(3);
  });

  it('every object in the schema but the root stays open to extra fields', () => {
    const walk = (node: SchemaNode | undefined, path: string): string[] => {
      if (!node) return [];
      const own = node.type === 'object' && path !== '' && node.additionalProperties !== true ? [path] : [];
      const children = Object.entries(node.properties ?? {}).flatMap(([k, v]) => walk(v, `${path}.${k}`));
      return [...own, ...children, ...walk(node.items, `${path}[]`)];
    };
    expect(walk(root, '')).toEqual([]);
  });
});
