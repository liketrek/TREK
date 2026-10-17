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
});
