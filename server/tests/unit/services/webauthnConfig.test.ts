/**
 * webauthnConfig.test.ts
 *
 * The RP-ID / allowed-origin resolver is the single highest-risk piece of the
 * passkey feature: a wrong RP ID permanently bricks every enrolled credential.
 * These tests pin the security-relevant rules — config wins over APP_URL, bare
 * IPs are rejected, localhost dev uses the browser (Vite) origin, and the
 * resolver NEVER reads request headers.
 */

const { settingsStore, appUrlRef } = vi.hoisted(() => ({
  settingsStore: new Map<string, string>(),
  appUrlRef: { value: '' },
}));

vi.mock('../../../src/db/database', () => ({
  db: {
    prepare: (_sql: string) => ({
      get: (key: string) => {
        const v = settingsStore.get(key);
        return v === undefined ? undefined : { value: v };
      },
    }),
  },
}));

vi.mock('../../../src/services/notifications', () => ({
  getAppUrl: () => appUrlRef.value,
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveWebauthnConfig, isPasskeyConfigured } from '../../../src/services/webauthnConfig';

beforeEach(() => {
  settingsStore.clear();
  appUrlRef.value = '';
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveWebauthnConfig', () => {
  it('WAC-001: derives the RP ID and single origin from a real APP_URL domain', () => {
    appUrlRef.value = 'https://trek.example.org';
    const cfg = resolveWebauthnConfig();
    expect(cfg).not.toBeNull();
    expect(cfg!.rpID).toBe('trek.example.org');
    expect(cfg!.origins).toEqual(['https://trek.example.org']);
    expect(isPasskeyConfigured()).toBe(true);
  });

  it('WAC-002: returns null for a bare-IP host (IPs are not valid RP IDs)', () => {
    appUrlRef.value = 'http://192.168.1.50:3001';
    expect(resolveWebauthnConfig()).toBeNull();
    expect(isPasskeyConfigured()).toBe(false);
  });

  it('WAC-003: returns null when nothing is configured', () => {
    expect(resolveWebauthnConfig()).toBeNull();
    expect(isPasskeyConfigured()).toBe(false);
  });

  it('WAC-004: localhost dev uses the browser (Vite :5173) origin, not just the API port', () => {
    appUrlRef.value = 'http://localhost:3001';
    const cfg = resolveWebauthnConfig();
    expect(cfg!.rpID).toBe('localhost');
    expect(cfg!.origins).toContain('http://localhost:5173');
    expect(cfg!.origins).toContain('http://localhost:3001');
  });

  it('WAC-005: an explicit webauthn_rp_id app-setting overrides APP_URL', () => {
    appUrlRef.value = 'https://internal.example.org';
    settingsStore.set('webauthn_rp_id', 'public.example.org');
    settingsStore.set('webauthn_origins', 'https://public.example.org');
    const cfg = resolveWebauthnConfig();
    expect(cfg!.rpID).toBe('public.example.org');
    expect(cfg!.origins).toEqual(['https://public.example.org']);
  });

  it('WAC-006: webauthn_origins is parsed as a comma-separated, trimmed list', () => {
    settingsStore.set('webauthn_rp_id', 'example.org');
    settingsStore.set('webauthn_origins', 'https://a.example.org , https://b.example.org/');
    const cfg = resolveWebauthnConfig();
    expect(cfg!.origins).toEqual(['https://a.example.org', 'https://b.example.org']);
  });

  it('WAC-007: the WEBAUTHN_RP_ID env var takes priority', () => {
    vi.stubEnv('WEBAUTHN_RP_ID', 'env.example.org');
    vi.stubEnv('WEBAUTHN_ORIGINS', 'https://env.example.org');
    appUrlRef.value = 'https://ignored.example.org';
    const cfg = resolveWebauthnConfig();
    expect(cfg!.rpID).toBe('env.example.org');
    expect(cfg!.origins).toEqual(['https://env.example.org']);
  });

  it('WAC-008: a configured RP ID with no origins falls back to the APP_URL origin', () => {
    appUrlRef.value = 'https://trek.example.org';
    settingsStore.set('webauthn_rp_id', 'trek.example.org');
    const cfg = resolveWebauthnConfig();
    expect(cfg!.origins).toEqual(['https://trek.example.org']);
  });
});
