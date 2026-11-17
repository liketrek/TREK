import { afterEach, describe, expect, it } from 'vitest';
import {
  BROWSER_SIGN_IN_KEY,
  BROWSER_SIGN_IN_TTL_MS,
  browserSignInRunning,
  endBrowserSignIn,
} from './browserSignInFlag';

afterEach(() => localStorage.clear());

describe('browserSignInRunning', () => {
  it('FE-NATIVE-SIGNINFLAG-001: counts a mark from public/native-handoff.js for as long as a sign-in may take', () => {
    const now = 1_000_000_000;
    expect(browserSignInRunning(now)).toBe(false);

    localStorage.setItem(BROWSER_SIGN_IN_KEY, String(now - 1000));
    expect(browserSignInRunning(now)).toBe(true);

    localStorage.setItem(BROWSER_SIGN_IN_KEY, String(now - BROWSER_SIGN_IN_TTL_MS));
    expect(browserSignInRunning(now)).toBe(false);
    // A clock set back, or anything that is no time at all.
    localStorage.setItem(BROWSER_SIGN_IN_KEY, String(now + 60_000));
    expect(browserSignInRunning(now)).toBe(false);
    localStorage.setItem(BROWSER_SIGN_IN_KEY, 'soon');
    expect(browserSignInRunning(now)).toBe(false);
  });

  it('FE-NATIVE-SIGNINFLAG-002: ends with the hand-back to the app', () => {
    localStorage.setItem(BROWSER_SIGN_IN_KEY, String(Date.now()));
    endBrowserSignIn();
    expect(localStorage.getItem(BROWSER_SIGN_IN_KEY)).toBeNull();
    expect(browserSignInRunning()).toBe(false);
  });
});
