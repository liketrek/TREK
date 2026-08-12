import { describe, it, expect } from 'vitest';
import {
  grantGaps, grantedHosts, HOOK_PERMISSION, USER_DATA_PERMISSION, EVENTS_PERMISSION, JOBS_PERMISSION,
} from '../src/permissions.js';

const noop = () => {};

describe('grantGaps — entry points TREK would never run', () => {
  it('reports nothing for an empty plugin', () => {
    expect(grantGaps({}, new Set())).toEqual([]);
  });

  // The whole point of this module: every hook must be gated on its own permission, and
  // a typo in one row of the map is a plugin that silently never runs in production.
  for (const [key, permission] of Object.entries(HOOK_PERMISSION)) {
    it(`flags hooks.${key} without ${permission}`, () => {
      const plugin = { hooks: { [key]: { anyFn: noop } } };
      const gaps = grantGaps(plugin, new Set());
      expect(gaps).toHaveLength(1);
      expect(gaps[0]).toMatchObject({ entryPoint: `hooks.${key}`, permission });
    });

    it(`does not flag hooks.${key} when ${permission} is granted`, () => {
      expect(grantGaps({ hooks: { [key]: { anyFn: noop } } }, new Set([permission]))).toEqual([]);
    });
  }

  it.each([
    ['jobs', { jobs: [{ id: 'refresh', handler: noop }] }, JOBS_PERMISSION],
    ['scheduled', { scheduled: noop }, JOBS_PERMISSION],
    ['events', { events: [{ on: 'place:created', handler: noop }] }, EVENTS_PERMISSION],
    ['deleteUserData', { deleteUserData: noop }, USER_DATA_PERMISSION],
    ['exportUserData', { exportUserData: noop }, USER_DATA_PERMISSION],
  ])('flags %s without its grant, and clears once granted', (entryPoint, plugin, permission) => {
    const gaps = grantGaps(plugin, new Set());
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({ entryPoint, permission });
    expect(grantGaps(plugin, new Set([permission]))).toEqual([]);
  });

  it('does not flag an EMPTY jobs/events array — nothing is implemented', () => {
    expect(grantGaps({ jobs: [], events: [] }, new Set())).toEqual([]);
  });

  it('ignores an unknown hooks.* key (the host ignores it too, so it is not a gap)', () => {
    expect(grantGaps({ hooks: { notAHook: { f: noop } } }, new Set())).toEqual([]);
  });

  it('reports every gap at once, so one dev run surfaces them all', () => {
    const gaps = grantGaps(
      { jobs: [{ id: 'j', handler: noop }], events: [{ on: '*', handler: noop }], hooks: { warningProvider: { getWarnings: noop } } },
      new Set(),
    );
    expect(gaps.map((g) => g.permission).sort()).toEqual(
      [EVENTS_PERMISSION, JOBS_PERMISSION, 'hook:trip-warning-provider'].sort(),
    );
  });

  it('a partially-granted plugin reports only what is missing', () => {
    const plugin = { jobs: [{ id: 'j', handler: noop }], hooks: { warningProvider: { getWarnings: noop } } };
    const gaps = grantGaps(plugin, new Set([JOBS_PERMISSION]));
    expect(gaps).toHaveLength(1);
    expect(gaps[0].permission).toBe('hook:trip-warning-provider');
  });
});

describe('grantedHosts', () => {
  it('takes the hosts from http:outbound:<host> permissions only', () => {
    expect(grantedHosts(['db:own', 'http:outbound:api.example.com', 'http:outbound:*.foo.dev'])).toEqual([
      'api.example.com',
      '*.foo.dev',
    ]);
  });

  it('a bare http:outbound names no host — it reaches nothing', () => {
    expect(grantedHosts(['http:outbound'])).toEqual([]);
    expect(grantedHosts(['http:outbound:'])).toEqual([]);
  });
});
