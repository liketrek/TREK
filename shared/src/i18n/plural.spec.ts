import {
  allPluralCategories,
  integerPluralCategories,
  pluralCategory,
  pluralFormOf,
  pluralForm,
  pluralGroups,
  resolvePluralKey,
  singleNumberPluralCategories,
} from './plural';

import { describe, expect, it } from 'vitest';

describe('pluralCategory', () => {
  it('follows the language rule, not count === 1', () => {
    expect(pluralCategory(1, 'en')).toBe('one');
    expect(pluralCategory(0, 'en')).toBe('other');
    expect(pluralCategory(0, 'fr')).toBe('one');
    expect(pluralCategory(21, 'ru')).toBe('one');
    expect(pluralCategory(11, 'ru')).toBe('many');
    expect(pluralCategory(3, 'ru')).toBe('few');
    expect(pluralCategory(2, 'ar')).toBe('two');
    expect(pluralCategory(1, 'ja')).toBe('other');
  });
});

describe('resolvePluralKey', () => {
  const strings = { 'x.n': '{count} places', 'x.n.one': '{count} place', 'y.n.other': '{count} stays' };

  it('takes the form of the category, then .other, then the key itself', () => {
    expect(resolvePluralKey(strings, 'x.n', 1, 'en')).toBe('x.n.one');
    expect(resolvePluralKey(strings, 'x.n', 5, 'en')).toBe('x.n');
    expect(resolvePluralKey(strings, 'y.n', 1, 'en')).toBe('y.n.other');
    expect(resolvePluralKey(strings, 'x.n', 5, 'ru')).toBe('x.n');
  });

  it('is undefined when the catalogue has no form of the key, and skips values that are not strings', () => {
    expect(resolvePluralKey(strings, 'z.n', 1, 'en')).toBeUndefined();
    expect(resolvePluralKey({ 'x.n.one': 1, 'x.n': 'general' }, 'x.n', 1, 'en')).toBe('x.n');
  });
});

describe('pluralForm', () => {
  const forms = { one: 'one form', few: 'few form', other: 'general form' };

  it('picks the form of the category, and the general form where none is given', () => {
    expect(pluralForm(1, 'en', forms)).toBe('one form');
    expect(pluralForm(21, 'ru', forms)).toBe('one form');
    expect(pluralForm(3, 'ru', forms)).toBe('few form');
    expect(pluralForm(5, 'ru', forms)).toBe('general form');
  });

  it('reads a count sent as text, and takes the general form for anything that is not a number', () => {
    expect(pluralForm('1', 'en', forms)).toBe('one form');
    expect(pluralForm('two', 'en', forms)).toBe('general form');
    expect(pluralForm('', 'en', forms)).toBe('general form');
    expect(pluralForm(undefined, 'en', forms)).toBe('general form');
  });
});

describe('category sets', () => {
  it('names the categories whole numbers reach, which a translation must spell out', () => {
    expect(integerPluralCategories('en')).toEqual(['one', 'other']);
    expect(integerPluralCategories('ru')).toEqual(['one', 'few', 'many']);
    expect(integerPluralCategories('ar')).toEqual(['zero', 'one', 'two', 'few', 'many', 'other']);
    expect(integerPluralCategories('ja')).toEqual(['other']);
  });

  it('names every category a language has, including those only fractions or millions reach', () => {
    expect(allPluralCategories('fr')).toEqual(expect.arrayContaining(['one', 'many', 'other']));
    expect(allPluralCategories('ja')).toEqual(['other']);
  });

  it('names the categories exactly one whole number takes', () => {
    expect(singleNumberPluralCategories('en')).toEqual(['one']);
    expect(singleNumberPluralCategories('ar')).toEqual(['zero', 'one', 'two']);
    expect(singleNumberPluralCategories('fr')).toEqual([]);
    expect(singleNumberPluralCategories('ru')).toEqual([]);
    expect(singleNumberPluralCategories('pl')).toEqual(['one']);
  });
});

describe('plural groups', () => {
  const keys = ['a.count', 'a.count.one', 'b.stays.other', 'b.stays.one', 'c.lonely.one', 'd.label', 'e.one.thing'];

  it('are keys with a general form and at least one category form', () => {
    expect([...pluralGroups(keys)].sort()).toEqual(['a.count', 'b.stays']);
  });

  it('a category form names its group and category; anything else is no form', () => {
    const groups = pluralGroups(keys);
    expect(pluralFormOf('a.count.one', groups)).toEqual({ base: 'a.count', category: 'one' });
    expect(pluralFormOf('a.count.few', groups)).toEqual({ base: 'a.count', category: 'few' });
    expect(pluralFormOf('c.lonely.one', groups)).toBeNull();
    expect(pluralFormOf('b.stays.other', groups)).toBeNull();
    expect(pluralFormOf('a.count', groups)).toBeNull();
    expect(pluralFormOf('plain', groups)).toBeNull();
  });
});
