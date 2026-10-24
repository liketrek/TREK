import { afterEach, describe, expect, it, vi } from 'vitest';
import { translateRateLimit } from './rateLimitMessage';

describe('translateRateLimit', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('uses the language the user picked', () => {
    localStorage.setItem('app_language', 'de');
    expect(translateRateLimit()).toBe('Zu viele Versuche. Bitte versuchen Sie es später erneut.');
  });

  it('falls back to the server default language when the user picked none', () => {
    localStorage.setItem('app_language_server', 'fr');
    expect(translateRateLimit()).toBe('Trop de tentatives. Veuillez réessayer plus tard.');
  });

  it('answers in English for an unknown language', () => {
    localStorage.setItem('app_language', 'xx');
    expect(translateRateLimit()).toBe('Too many attempts. Please try again later.');
  });

  it('answers in English when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(translateRateLimit()).toBe('Too many attempts. Please try again later.');
  });
});
