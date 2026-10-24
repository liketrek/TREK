/**
 * Which OpenStreetMap objects PAD-05A reads as paddle objects, by the tag
 * variants paddle-tags.ts documents, and which of their tags are kept.
 */
import { keptTags, paddleKindOf, paddleNameOf } from '../../../../src/nest/paddle-obstacles/paddle-tags';

import { describe, expect, it } from 'vitest';

describe('paddleKindOf', () => {
  it.each([
    [{ waterway: 'weir' }, 'weir'],
    [{ waterway: 'dam' }, 'dam'],
    [{ waterway: 'lock_gate' }, 'lock_gate'],
    [{ waterway: 'waterfall' }, 'waterfall'],
    [{ lock: 'yes' }, 'lock'],
    [{ lock: 'yes', waterway: 'canal' }, 'lock'],
    [{ whitewater: 'rapid' }, 'rapids'],
    [{ waterway: 'rapids' }, 'rapids'],
    [{ whitewater: 'hazard' }, 'hazard'],
    [{ canoe: 'portage' }, 'portage'],
    [{ portage: 'yes' }, 'portage'],
    [{ whitewater: 'portage_way' }, 'portage'],
    [{ canoe: 'put_in' }, 'put_in'],
    [{ whitewater: 'put_in' }, 'put_in'],
    [{ whitewater: 'put_in;egress' }, 'put_in'],
    [{ whitewater: 'egress;put_in' }, 'put_in'],
    [{ canoe: 'egress' }, 'egress'],
    [{ whitewater: 'egress' }, 'egress'],
    [{ leisure: 'slipway' }, 'slipway'],
    [{ waterway: 'river', hazard: 'yes' }, 'hazard'],
    [{ waterway: 'stream', obstacle: 'fallen_tree' }, 'hazard'],
    [{ waterway: 'river', canoe: 'no' }, 'access'],
    [{ waterway: 'canal', boat: 'private' }, 'access'],
    [{ waterway: 'river', 'canoe:conditional': 'no @ (Nov-Mar)' }, 'access'],
    [{ waterway: 'fairway', 'boat:conditional': 'yes @ (sunrise-sunset)' }, 'access'],
  ] as const)('PTAG-001 %o reads as %s', (tags, kind) => {
    expect(paddleKindOf(tags)).toBe(kind);
  });

  it('PTAG-002: an object that is none of them reads as null', () => {
    expect(paddleKindOf({})).toBeNull();
    expect(paddleKindOf({ waterway: 'river' })).toBeNull();
    expect(paddleKindOf({ highway: 'path', canoe: 'no' })).toBeNull();
    // A lock on something that is no waterway TREK knows (a dock) is not a paddle lock.
    expect(paddleKindOf({ lock: 'yes', waterway: 'dock' })).toBeNull();
    expect(paddleKindOf({ whitewater: 'rapid_class' })).toBeNull();
  });

  it('PTAG-003: the structure wins over the rule: a weir with a canoe tag stays a weir', () => {
    expect(paddleKindOf({ waterway: 'weir', canoe: 'portage' })).toBe('weir');
    expect(paddleKindOf({ waterway: 'dam', whitewater: 'hazard' })).toBe('dam');
    expect(paddleKindOf({ canoe: 'portage', whitewater: 'put_in' })).toBe('portage');
  });
});

describe('keptTags and paddleNameOf', () => {
  it('PTAG-004: keeps the tags a paddler is shown and the prefixed rules, nothing else', () => {
    expect(
      keptTags({
        name: 'Lindenmühle',
        waterway: 'weir',
        'canoe:conditional': 'no @ (Nov-Mar)',
        'whitewater:section_grade': '2',
        'portage:access': 'private',
        height: '1.5',
        source: 'survey',
        highway: 'footway',
        created_by: 'JOSM',
      }),
    ).toEqual({
      name: 'Lindenmühle',
      waterway: 'weir',
      'canoe:conditional': 'no @ (Nov-Mar)',
      'whitewater:section_grade': '2',
      'portage:access': 'private',
      height: '1.5',
    });
  });

  it("PTAG-005: names an object by its own name, else by the lock's", () => {
    expect(paddleNameOf({ name: 'Wehr', lock_name: 'Schleuse' })).toBe('Wehr');
    expect(paddleNameOf({ lock_name: 'Schleuse Wesenberg' })).toBe('Schleuse Wesenberg');
    expect(paddleNameOf({ waterway: 'weir' })).toBeNull();
  });
});

describe('keptTags: checks on site', () => {
  it('PTAG-006: keeps when someone last looked on site, the dated variants included', () => {
    expect(
      keptTags({
        waterway: 'weir',
        check_date: '2025-06-01',
        'survey:date': '2024-05',
        'check_date:canoe': '2026-04-02',
      }),
    ).toEqual({
      waterway: 'weir',
      check_date: '2025-06-01',
      'survey:date': '2024-05',
      'check_date:canoe': '2026-04-02',
    });
  });
});
