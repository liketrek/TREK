import {
  placeCreateRequestSchema,
  placeBulkDeleteRequestSchema,
  placeImportListRequestSchema,
  placeSchema,
  placeUpdateRequestSchema,
  placeWebsiteSchema,
} from './place.schema';

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('placeSchema route_color (#776)', () => {
  const place = { id: 1, trip_id: 1, name: 'Walk' };

  it('takes a hex colour, null, or nothing at all', () => {
    expect(placeSchema.safeParse({ ...place, route_color: '#e11d48' }).success).toBe(true);
    expect(placeSchema.safeParse({ ...place, route_color: '#abc' }).success).toBe(true);
    // null is how a track goes back to inheriting its category colour.
    expect(placeSchema.safeParse({ ...place, route_color: null }).success).toBe(true);
    expect(placeSchema.safeParse(place).success).toBe(true);
  });

  it('rejects anything a map renderer could not parse', () => {
    expect(placeSchema.safeParse({ ...place, route_color: 'blue' }).success).toBe(false);
    expect(placeSchema.safeParse({ ...place, route_color: '#12345' }).success).toBe(false);
    expect(placeSchema.safeParse({ ...place, route_color: 'e11d48' }).success).toBe(false);
  });
});

describe('placeCreateRequestSchema', () => {
  it('requires a name and keeps the other place fields open', () => {
    expect(
      placeCreateRequestSchema.safeParse({
        name: 'Spot',
        lat: 1,
        lng: 2,
        anything: true,
      }).success,
    ).toBe(true);
    expect(placeCreateRequestSchema.safeParse({ lat: 1 }).success).toBe(false);
  });
});

describe('placeBulkDeleteRequestSchema', () => {
  it('requires a numeric ids array', () => {
    expect(placeBulkDeleteRequestSchema.safeParse({ ids: [1, 2] }).success).toBe(true);
    expect(placeBulkDeleteRequestSchema.safeParse({ ids: ['a'] }).success).toBe(false);
  });
});

describe('placeImportListRequestSchema', () => {
  it('requires a non-empty url', () => {
    expect(placeImportListRequestSchema.safeParse({ url: 'http://x' }).success).toBe(true);
    expect(placeImportListRequestSchema.safeParse({ url: '' }).success).toBe(false);
  });
});

describe('stop_type on the write routes', () => {
  it('SHARED-PLACE-020: a known kind goes through, on create and on update', () => {
    expect(placeCreateRequestSchema.safeParse({ name: 'A', stop_type: 'fuel' }).success).toBe(true);
    expect(placeUpdateRequestSchema.safeParse({ stop_type: 'charging' }).success).toBe(true);
  });

  it('SHARED-PLACE-021: an invented kind is refused rather than written to the column', () => {
    // It used to go straight through: both schemas are open objects, so the value landed
    // in the column and isServiceStopType then read it as false, which quietly turned a
    // pause into a numbered destination.
    expect(placeCreateRequestSchema.safeParse({ name: 'A', stop_type: 'banana' }).success).toBe(false);
    expect(placeUpdateRequestSchema.safeParse({ stop_type: 'banana' }).success).toBe(false);
  });

  it('SHARED-PLACE-022: null is how a stop stops being a fuel stop', () => {
    expect(placeUpdateRequestSchema.safeParse({ stop_type: null }).success).toBe(true);
  });

  it('SHARED-PLACE-023: every other key stays open, because roughly 190 callers rely on it', () => {
    const body = { name: 'A', whatever: 1, notes: 'x', lat: 53.5, tags: [{ id: 1 }] };
    expect(placeCreateRequestSchema.safeParse(body).success).toBe(true);
  });
});

describe('placeWebsiteSchema (#2483)', () => {
  it('SHARED-PLACE-030: a bare host from a search result parses to its https form', () => {
    const parsed = placeWebsiteSchema.safeParse('fr.wikipedia.org/wiki/Chapelle_Sainte-Barbe_du_Faouët');
    expect(parsed.success && parsed.data).toBe('https://fr.wikipedia.org/wiki/Chapelle_Sainte-Barbe_du_Faouët');
    const relative = placeWebsiteSchema.safeParse('//www.example.fr');
    expect(relative.success && relative.data).toBe('https://www.example.fr');
  });

  it('SHARED-PLACE-031: a value that names http(s) comes back exactly as sent', () => {
    for (const value of [
      'https://louvre.fr/en/visit',
      'http://pension-alpenblick.at',
      'https://x.example ',
      'http://localhost:3000',
    ]) {
      const parsed = placeWebsiteSchema.safeParse(value);
      expect(parsed.success && parsed.data, value).toBe(value);
    }
  });

  it('SHARED-PLACE-032: every other scheme and free text still fail with the same message', () => {
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,x',
      'mailto:a@example.fr',
      'Chapelle',
      '',
      'localhost',
    ]) {
      const parsed = placeWebsiteSchema.safeParse(value);
      expect(parsed.success, value).toBe(false);
      expect(parsed.error?.issues.map((i) => i.message)).toContain('must be an http or https URL');
    }
  });

  it('SHARED-PLACE-033: the length cap applies to what is stored', () => {
    expect(placeWebsiteSchema.safeParse(`https://example.com/${'a'.repeat(480)}`).success).toBe(true);
    expect(placeWebsiteSchema.safeParse(`https://example.com/${'a'.repeat(481)}`).success).toBe(false);
    // Measured after the scheme is added, which is the value that is stored.
    expect(placeWebsiteSchema.safeParse(`example.com/${'a'.repeat(480)}`).success).toBe(true);
    expect(placeWebsiteSchema.safeParse(`example.com/${'a'.repeat(481)}`).success).toBe(false);
  });

  it('SHARED-PLACE-034: the tool schema an MCP client reads is still a plain capped string', () => {
    const shape = z.toJSONSchema(z.object({ website: placeWebsiteSchema.optional() }), { io: 'input' });
    expect(shape.properties?.website).toEqual({ type: 'string', maxLength: 500 });
  });
});
