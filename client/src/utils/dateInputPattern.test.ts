import { describe, expect, it } from 'vitest';
import { dateInputPattern } from './dateInputPattern';

// The manual date field's hint has to read the way the field is filled and
// parsed in the user's language; it used to say DD.MM.YYYY everywhere (#2604).
describe('dateInputPattern', () => {
  it('follows the field order and separators of the locale', () => {
    expect(dateInputPattern('de-DE')).toBe('DD.MM.YYYY');
    expect(dateInputPattern('en-US')).toBe('MM/DD/YYYY');
    expect(dateInputPattern('en-GB')).toBe('DD/MM/YYYY');
    expect(dateInputPattern('ko-KR')).toBe('YYYY. MM. DD.');
  });

  it('takes the shape only, never the locale digits', () => {
    expect(dateInputPattern('ar')).not.toMatch(/[٠-٩\d]/);
    expect(dateInputPattern('ar')).toContain('YYYY');
  });

  it('writes a chosen date format (#2971) as its own pattern, whatever the language', () => {
    expect(dateInputPattern('en-US', 'YYYY-MM-DD')).toBe('YYYY-MM-DD');
    expect(dateInputPattern('en-US', 'DD.MM.YYYY')).toBe('DD.MM.YYYY');
    expect(dateInputPattern('de-DE', 'MM/DD/YYYY')).toBe('MM/DD/YYYY');
    expect(dateInputPattern('ko-KR', 'YYYY/MM/DD')).toBe('YYYY/MM/DD');
  });

  it('keeps the locale pattern for auto, an unknown value or none', () => {
    expect(dateInputPattern('de-DE', 'auto')).toBe('DD.MM.YYYY');
    expect(dateInputPattern('en-US', 'auto')).toBe('MM/DD/YYYY');
    expect(dateInputPattern('en-GB', 'DD-MM-YY')).toBe('DD/MM/YYYY');
    expect(dateInputPattern('en-GB', null)).toBe('DD/MM/YYYY');
  });
});
