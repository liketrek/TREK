import { DEFAULT_SKI_ROUTE_OPTIONS } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { NO_SKI_CHOICE, skiChoiceChanged, skiChoiceMissing, skiChoiceOf, skiFieldsOf } from './skiChoice';

// FE-TOUR-SKI-CHOICE-001 to FE-TOUR-SKI-CHOICE-004

describe('ski choice (SKI-02)', () => {
  it('FE-TOUR-SKI-CHOICE-001: asks for a discipline first, then for a cross-country technique, Unknown counting as one', () => {
    expect(skiChoiceMissing(NO_SKI_CHOICE)).toBe('discipline');
    expect(skiChoiceMissing({ discipline: 'cross_country', technique: null })).toBe('technique');
    expect(skiChoiceMissing({ discipline: 'cross_country', technique: 'unknown' })).toBeNull();
    expect(skiChoiceMissing({ discipline: 'alpine', technique: null })).toBeNull();
  });

  it('FE-TOUR-SKI-CHOICE-002: sends a technique for cross-country only, and nothing while incomplete', () => {
    expect(skiFieldsOf(NO_SKI_CHOICE)).toBeNull();
    expect(skiFieldsOf({ discipline: 'cross_country', technique: null })).toBeNull();
    expect(skiFieldsOf({ discipline: 'cross_country', technique: 'classic' })).toEqual({
      ski_discipline: 'cross_country',
      ski_technique: 'classic',
    });
    // A technique tried on cross-country and left behind stays out of an alpine track.
    expect(skiFieldsOf({ discipline: 'alpine', technique: 'classic' })).toEqual({ ski_discipline: 'alpine' });
  });

  it('FE-TOUR-SKI-CHOICE-003: opens from the saved track, and counts the technique as a change for cross-country only', () => {
    const saved = skiChoiceOf({ ski_discipline: 'cross_country', ski_technique: 'skating' });
    expect(saved).toEqual({ discipline: 'cross_country', technique: 'skating' });
    expect(skiChoiceOf({})).toEqual(NO_SKI_CHOICE);
    expect(skiChoiceChanged(saved, saved)).toBe(false);
    expect(skiChoiceChanged({ ...saved, technique: 'classic' }, saved)).toBe(true);
    expect(skiChoiceChanged({ discipline: 'touring', technique: 'skating' }, saved)).toBe(true);
    const alpine = { discipline: 'alpine' as const, technique: null };
    expect(skiChoiceChanged({ discipline: 'alpine', technique: 'classic' }, alpine)).toBe(false);
  });

  it('FE-TOUR-SKI-CHOICE-004: opens with the router options a planned tour kept, and without any where none were kept', () => {
    const options = { ...DEFAULT_SKI_ROUTE_OPTIONS, pace: 'sporty' as const };
    const planned = skiChoiceOf({ ski_discipline: 'alpine', ski_technique: null, ski_options: options });
    expect(planned).toEqual({ discipline: 'alpine', technique: null, options });
    expect(skiChoiceOf({ ski_discipline: 'alpine', ski_options: null })).not.toHaveProperty('options');
  });
});
