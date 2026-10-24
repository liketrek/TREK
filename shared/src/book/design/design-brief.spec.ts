import { BOOK_COVER_ARCHETYPES } from '../book-archetypes';
import { designBookRequestSchema } from '../book-design-tools.schema';
import { BOOK_LOCKUPS } from '../book-lockups.data';
import { BOOK_THEME_IDS } from '../theme/book-theme.schema';
import {
  BOOK_COVER_ARCHETYPE_LINES,
  BOOK_DESIGN_LIVELY_BEATS,
  BOOK_DESIGN_OVERRIDE_BEATS,
  MAX_BOOK_DESIGN_OVERRIDES,
  bookCoverArchetypeSchema,
  bookDesignBriefSchema,
  bookDesignPageOverrideSchema,
} from './design-brief.schema';
import { bookDesignDirectivesSchema } from './design-directives.schema';
import { BOOK_DESIGN_BEATS } from './design-pacing';

import { describe, expect, it } from 'vitest';

/**
 * The art direction design_book takes (design-brief.schema.ts): the brief,
 * the cover's archetype and lockup, and the page overrides, each bounded and
 * described, beside directives written before they existed, which still
 * parse to exactly what they did.
 */

const ok = (directives: unknown) => bookDesignDirectivesSchema.safeParse(directives).success;

describe('the art direction of design_book', () => {
  it('DSNBRF-001: directives written before the brief existed parse as they did, with no art direction', () => {
    const old = {
      style: 'editorial',
      density: 'rich',
      pages: { min: 6, max: 10 },
      cover: { template: 'cover-band', title: 'Coast' },
      type: { scale: 1.2, display: 3 },
      keep: 'nothing',
      seed: 4,
    };
    const parsed = bookDesignDirectivesSchema.parse(old);
    expect(parsed).toMatchObject(old);
    expect(parsed.brief).toBeUndefined();
    expect(parsed.cover).not.toHaveProperty('archetype');
    expect(parsed.cover).not.toHaveProperty('lockup');
    expect(parsed.pages).not.toHaveProperty('overrides');
    expect(bookDesignDirectivesSchema.parse({})).toEqual(bookDesignDirectivesSchema.parse({ style: 'classic' }));
  });

  it('DSNBRF-002: the brief takes an energy, a decoration, collages and a theme, nothing else', () => {
    const brief = { energy: 'loud', decoration: 'rich', collage: true, theme: 'tropical' };
    expect(bookDesignBriefSchema.parse(brief)).toEqual(brief);
    expect(bookDesignBriefSchema.parse({})).toEqual({});
    expect(bookDesignBriefSchema.safeParse({ energy: 'wild' }).success).toBe(false);
    expect(bookDesignBriefSchema.safeParse({ decoration: 'heavy' }).success).toBe(false);
    expect(bookDesignBriefSchema.safeParse({ theme: 'classic' }).success).toBe(false);
    expect(bookDesignBriefSchema.safeParse({ energy: 'calm', mood: 'happy' }).success).toBe(false);
    for (const theme of BOOK_THEME_IDS) expect(bookDesignBriefSchema.safeParse({ theme }).success, theme).toBe(true);
  });

  it('DSNBRF-003: the cover takes an archetype of the seven and a lockup of the Text styles shelf', () => {
    for (const archetype of BOOK_COVER_ARCHETYPES) expect(ok({ cover: { archetype } }), archetype).toBe(true);
    for (const lockup of BOOK_LOCKUPS) expect(ok({ cover: { lockup: lockup.id } }), lockup.id).toBe(true);
    expect(ok({ cover: { archetype: 'collage' } })).toBe(false);
    expect(ok({ cover: { lockup: 'big-title' } })).toBe(false);
    // Every archetype is said in a line, so a model reads what it picks.
    expect(Object.keys(BOOK_COVER_ARCHETYPE_LINES).sort()).toEqual([...BOOK_COVER_ARCHETYPES].sort());
    for (const archetype of BOOK_COVER_ARCHETYPES)
      expect(bookCoverArchetypeSchema.description).toContain(`${archetype} (`);
    expect(designBookRequestSchema.safeParse({ directives: { cover: { archetype: 'cutout' } } }).success).toBe(true);
  });

  it('DSNBRF-004: a page override names a page of the plan and a beat or a layout the page edit takes', () => {
    expect(bookDesignPageOverrideSchema.parse({ index: 4, beat: 'collage' })).toEqual({ index: 4, beat: 'collage' });
    expect(bookDesignPageOverrideSchema.safeParse({ index: 4, template: 'two-up' }).success).toBe(true);
    expect(bookDesignPageOverrideSchema.safeParse({ index: 4, template: 'cover-band' }).success).toBe(true);
    expect(bookDesignPageOverrideSchema.safeParse({ index: 4, template: 'no-such-layout' }).success).toBe(false);
    expect(bookDesignPageOverrideSchema.safeParse({ index: 4 }).success).toBe(false);
    expect(bookDesignPageOverrideSchema.safeParse({ index: 1, beat: 'duo' }).success).toBe(false);
    expect(bookDesignPageOverrideSchema.safeParse({ index: 4, beat: 'cover' }).success).toBe(false);
    const many = Array.from({ length: MAX_BOOK_DESIGN_OVERRIDES + 1 }, (_, i) => ({ index: i + 2, beat: 'duo' }));
    expect(ok({ pages: { overrides: many } })).toBe(false);
    expect(ok({ pages: { min: 4, overrides: many.slice(1) } })).toBe(true);
  });

  it('DSNBRF-005: the lively beats join the beats a plan names, and an override takes them and the photo beats', () => {
    for (const beat of BOOK_DESIGN_LIVELY_BEATS) {
      expect(BOOK_DESIGN_BEATS).toContain(beat);
      expect(BOOK_DESIGN_OVERRIDE_BEATS).toContain(beat);
    }
    expect(BOOK_DESIGN_OVERRIDE_BEATS).toEqual(expect.arrayContaining(['hero', 'duo', 'trio', 'grid']));
    expect(BOOK_DESIGN_BEATS.slice(0, 17)).toEqual([
      'cover',
      'first',
      'summary',
      'countries',
      'opener',
      'hero',
      'story',
      'quiet',
      'grid',
      'duo',
      'trio',
      'pano',
      'map',
      'stations',
      'closing',
      'last',
      'back',
    ]);
  });
});
