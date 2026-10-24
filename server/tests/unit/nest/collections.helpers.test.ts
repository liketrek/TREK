/**
 * The link helpers of the collections domain, which read and write the JSON
 * TEXT column a list or a saved place keeps its links in.
 * COLLECTIONS-HELPERS-001 to 003.
 */
import { parseLinks, serializeLinks } from '../../../src/nest/collections/collections.helpers';

import { describe, expect, it } from 'vitest';

const links = [{ url: 'https://menu.example/', label: 'Menu' }];

describe('parseLinks', () => {
  it('COLLECTIONS-HELPERS-001: reads a stored array of links back', () => {
    expect(parseLinks(JSON.stringify(links))).toEqual(links);
  });

  it('COLLECTIONS-HELPERS-002: answers undefined for a missing, empty, unreadable or non-array value', () => {
    expect(parseLinks(null)).toBeUndefined();
    expect(parseLinks('')).toBeUndefined();
    expect(parseLinks('{not json')).toBeUndefined();
    expect(parseLinks(JSON.stringify(links[0]))).toBeUndefined();
  });
});

describe('serializeLinks', () => {
  it('COLLECTIONS-HELPERS-003: writes links as JSON and no links as null', () => {
    expect(serializeLinks(links)).toBe(JSON.stringify(links));
    expect(serializeLinks([])).toBeNull();
    expect(serializeLinks(undefined)).toBeNull();
  });
});
