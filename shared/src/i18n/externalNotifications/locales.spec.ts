import { SUPPORTED_LANGUAGE_CODES } from '../languages';
import { EMAIL_I18N, EVENT_TEXTS } from './index';

import { describe, expect, it } from 'vitest';

describe('notification locales', () => {
  it('cover every language the app ships, so no user gets English mail by omission', () => {
    expect(Object.keys(EMAIL_I18N).sort()).toEqual([...SUPPORTED_LANGUAGE_CODES].sort());
    expect(Object.keys(EVENT_TEXTS).sort()).toEqual([...SUPPORTED_LANGUAGE_CODES].sort());
    expect(EMAIL_I18N.ca?.manage).toBe('Gestiona les preferències');
  });

  it('count texts take the form the number asks for, not "photo(s)"', () => {
    const en = EVENT_TEXTS.en;
    const shared = (count: string) => en?.photos_shared?.({ actor: 'Ana', trip: 'Lisboa', count });
    expect(shared('1')).toEqual({ title: '1 photo shared', body: 'Ana shared 1 photo in "Lisboa".' });
    expect(shared('3')).toEqual({ title: '3 photos shared', body: 'Ana shared 3 photos in "Lisboa".' });
    const failure = (suppressed: string) =>
      en?.replica_failure?.({ backend: 's3', op: 'put', key: 'k', error: 'timeout', suppressed }).body;
    expect(failure('0')).not.toContain('suppressed');
    expect(failure('1')).toContain(' 1 more failure was suppressed');
    expect(failure('4')).toContain(' 4 more failures were suppressed');
  });
});
