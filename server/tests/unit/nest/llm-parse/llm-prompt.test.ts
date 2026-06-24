import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, KI_RESERVATION_JSON_SCHEMA } from '../../../../src/nest/llm-parse/llm-prompt';
import { KI_RESERVATION_TYPES } from '@trek/shared';

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
});
