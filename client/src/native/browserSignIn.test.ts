import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';
import { startAuthentication } from '@simplewebauthn/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../api/client';
import { nativeAuthApi } from '../api/nativeAuth';
import {
  BrowserSignInCancelled,
  createHandoffSecret,
  handoffUrl,
  rememberHandoffReturn,
  requestHandoffCode,
  signInThroughBrowser,
  signInWithPasskey,
  takeHandoffReturn,
} from './browserSignIn';
import { TrekShell } from './trekShell';

vi.mock('./trekShell', () => ({ APP_URL_SCHEME: 'com.liketrek.trek', TrekShell: { authenticate: vi.fn() } }));
vi.mock('@simplewebauthn/browser', () => ({ startAuthentication: vi.fn() }));
vi.mock('../api/client', () => ({ authApi: { passkey: { loginOptions: vi.fn(), loginVerify: vi.fn() } } }));
vi.mock('../api/nativeAuth', () => ({ nativeAuthApi: { exchange: vi.fn(), handoff: vi.fn() } }));

beforeEach(() => {
  vi.mocked(TrekShell.authenticate).mockReset();
  vi.mocked(nativeAuthApi.exchange).mockReset().mockResolvedValue();
});

describe('createHandoffSecret', () => {
  it('pairs a fresh 64-character verifier with the hex sha256 the server checks against', () => {
    const { verifier, challenge } = createHandoffSecret();
    expect(verifier).toMatch(/^[0-9a-f]{64}$/);
    expect(challenge).toBe(bytesToHex(sha256(new TextEncoder().encode(verifier))));
    expect(createHandoffSecret().verifier).not.toBe(verifier);
  });
});

describe('requestHandoffCode', () => {
  it('asks the server for the one-time code bound to the challenge', async () => {
    vi.mocked(nativeAuthApi.handoff).mockResolvedValue({ code: 'c-1' });
    await expect(requestHandoffCode('ab'.repeat(32))).resolves.toBe('c-1');
    expect(nativeAuthApi.handoff).toHaveBeenCalledWith('ab'.repeat(32));
  });
});

describe('handoffUrl', () => {
  it('starts at the server page in front of the hand-off page, with the challenge and an optional start', () => {
    // Under /api, which every TREK service worker passes to the server: an older
    // version's worker must not answer the hand-off page from its cache.
    expect(handoffUrl('https://trek.example.com', 'c')).toBe('https://trek.example.com/api/auth/native/start?challenge=c');
    expect(handoffUrl('https://trek.example.com', 'c', 'oidc')).toBe(
      'https://trek.example.com/api/auth/native/start?challenge=c&start=oidc'
    );
  });
});

describe('signInThroughBrowser', () => {
  it('opens the hand-off page and redeems the returned code with the verifier', async () => {
    vi.mocked(TrekShell.authenticate).mockResolvedValue({ url: 'com.liketrek.trek://auth?code=abc' });

    await signInThroughBrowser('oidc');

    const opened = new URL(vi.mocked(TrekShell.authenticate).mock.calls[0][0].url);
    expect(opened.pathname).toBe('/api/auth/native/start');
    expect(opened.searchParams.get('start')).toBe('oidc');
    expect(vi.mocked(TrekShell.authenticate).mock.calls[0][0].callbackScheme).toBe('com.liketrek.trek');
    const { code, verifier } = vi.mocked(nativeAuthApi.exchange).mock.calls[0][0];
    expect(code).toBe('abc');
    expect(bytesToHex(sha256(new TextEncoder().encode(verifier)))).toBe(opened.searchParams.get('challenge'));
  });

  it('turns a closed browser into BrowserSignInCancelled', async () => {
    vi.mocked(TrekShell.authenticate).mockRejectedValue(Object.assign(new Error('closed'), { code: 'CANCELLED' }));
    await expect(signInThroughBrowser()).rejects.toBeInstanceOf(BrowserSignInCancelled);
    expect(nativeAuthApi.exchange).not.toHaveBeenCalled();
  });

  it('passes other failures on', async () => {
    vi.mocked(TrekShell.authenticate).mockRejectedValue(new Error('no browser'));
    await expect(signInThroughBrowser()).rejects.toThrow('no browser');
  });

  it('refuses a return without a code', async () => {
    vi.mocked(TrekShell.authenticate).mockResolvedValue({ url: 'com.liketrek.trek://auth' });
    await expect(signInThroughBrowser()).rejects.toThrow('without a sign-in code');
    expect(nativeAuthApi.exchange).not.toHaveBeenCalled();
  });
});

describe('the remembered handoff return', () => {
  const path = `/native-handoff?challenge=${'a'.repeat(64)}`;

  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('survives a sign-in that comes back in another tab, once', () => {
    rememberHandoffReturn(path);
    expect(takeHandoffReturn()).toBe(path);
    expect(takeHandoffReturn()).toBeNull();
  });

  it('is dropped once it is older than a quarter of an hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T12:00:00Z'));
    rememberHandoffReturn(path);
    vi.setSystemTime(new Date('2026-11-08T12:16:00Z'));
    expect(takeHandoffReturn()).toBeNull();
    vi.useRealTimers();
  });

  it('only ever leads back to the handoff page', () => {
    rememberHandoffReturn('/admin');
    expect(takeHandoffReturn()).toBeNull();
    localStorage.setItem('trek_native_handoff_return', 'not json');
    expect(takeHandoffReturn()).toBeNull();
  });
});

describe('signInWithPasskey', () => {
  it('asks for the passkey and has the server verify it', async () => {
    vi.mocked(authApi.passkey.loginOptions).mockResolvedValue({ challenge: 'x' });
    vi.mocked(startAuthentication).mockResolvedValue({ id: 'cred' } as never);
    vi.mocked(authApi.passkey.loginVerify).mockResolvedValue({ token: '', user: {} });
    await signInWithPasskey();
    expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: { challenge: 'x' } });
    expect(authApi.passkey.loginVerify).toHaveBeenCalledWith({ id: 'cred' });
  });
});
