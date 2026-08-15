/**
 * With TREK_MANAGED unset, nothing in this feature does anything.
 *
 * That is the promise the whole design rests on: the same image runs on a
 * self-hosted install and on a centrally administered one, and the first must
 * not be able to tell the second exists. Every other test here checks that the
 * mode works; this one checks that its absence is total.
 *
 * Written as its own file rather than a case in each suite on purpose. Spread
 * across eight files the question "does this change anything for a self-hoster"
 * has eight partial answers; here it has one.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import {
  splitManagedKeys,
  isManagedBlocked,
  MANAGED_LOCKED_SETTING_KEYS,
} from '../../../src/nest/common/managed';
import { deriveMaps, deriveManaged } from '../../../src/app-config/derive';

const env = new RuntimeEnvService();

afterEach(() => {
  delete process.env.TREK_MANAGED;
  delete process.env.PLACES_API_BASE;
  delete process.env.PLACES_API_KEY;
});

describe('a self-hosted install', () => {
  it('MANAGED-INERT-001: is not managed, and no other variable can make it so', () => {
    // Only TREK_MANAGED decides. Setting the operator plumbing without it must
    // not flip the mode, or an operator half-way through a migration would take
    // settings away from admins without meaning to.
    process.env.PLACES_API_BASE = 'https://places.example.test';
    process.env.PLACES_API_KEY = 'operator-key';

    expect(env.isManaged()).toBe(false);
    expect(isManagedBlocked(env)).toBe(false);
  });

  it('MANAGED-INERT-002: keeps every settings key writable', () => {
    const body = Object.fromEntries(MANAGED_LOCKED_SETTING_KEYS.map((k) => [k, 'x']));

    const { allowed, blocked } = splitManagedKeys(body, env.isManaged());

    expect(blocked).toEqual([]);
    expect(allowed).toEqual(body);
  });

  it('MANAGED-INERT-003: is the same object, not a copy, so no write path can diverge', () => {
    // splitManagedKeys returns the body itself when the mode is off. If it ever
    // started cloning, a caller mutating `allowed` would silently stop working
    // on self-hosted installs only, which is the hardest kind of bug to find.
    const body = { smtp_host: 'mail.example.test' };

    expect(splitManagedKeys(body, false).allowed).toBe(body);
  });

  it('MANAGED-INERT-004: leaves the Places calls pointing at Google with the stored key', () => {
    const maps = deriveMaps({});

    expect(maps.placesApiBase).toBeUndefined();
    expect(maps.placesApiKey).toBeUndefined();
  });

  it('MANAGED-INERT-005: treats an unparseable flag as off, never as on', () => {
    // Fail closed in the direction that matters here: the failure mode of a typo
    // must be "the admin keeps their settings", not "the admin quietly loses them".
    for (const value of ['', ' ', 'maybe', 'TRUE_ISH', '2', 'null', 'undefined']) {
      expect(deriveManaged({ TREK_MANAGED: value }).enabled, `TREK_MANAGED=${value}`).toBe(false);
    }
  });
});
