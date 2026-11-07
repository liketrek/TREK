/**
 * Which events the preference matrices offer. A row for an event the install
 * can never raise is a switch that does nothing: plugin notifications without
 * the plugin runtime, and on a managed install the release check and the
 * storage replicas, which belong to the operator there.
 */
import { ALL_EVENT_TYPES } from '../../../src/nest/notifications/notification-events';
import { offeredEventTypes } from '../../../src/nest/notifications/notification-preferences.service';

import { afterEach, describe, expect, it } from 'vitest';

const saved = { managed: process.env.TREK_MANAGED, plugins: process.env.TREK_PLUGINS_ENABLED };

afterEach(() => {
  if (saved.managed === undefined) delete process.env.TREK_MANAGED;
  else process.env.TREK_MANAGED = saved.managed;
  if (saved.plugins === undefined) delete process.env.TREK_PLUGINS_ENABLED;
  else process.env.TREK_PLUGINS_ENABLED = saved.plugins;
});

describe('offeredEventTypes', () => {
  it('NOTIF-OFFERED-001: a self-hosted install with plugins offers every event', () => {
    delete process.env.TREK_MANAGED;
    delete process.env.TREK_PLUGINS_ENABLED;
    expect(offeredEventTypes()).toEqual(ALL_EVENT_TYPES);
  });

  it('NOTIF-OFFERED-002: without the plugin runtime there is no plugin row', () => {
    delete process.env.TREK_MANAGED;
    process.env.TREK_PLUGINS_ENABLED = 'false';
    expect(offeredEventTypes()).not.toContain('plugin_notification');
    expect(offeredEventTypes()).toContain('version_available');
  });

  it('NOTIF-OFFERED-003: a managed install drops the operator alerts and keeps the rest in order', () => {
    process.env.TREK_MANAGED = '1';
    process.env.TREK_PLUGINS_ENABLED = 'false';
    const offered = offeredEventTypes();
    expect(offered).not.toContain('version_available');
    expect(offered).not.toContain('replica_failure');
    expect(offered).toContain('paddle_region_requested');
    expect(offered).toEqual(
      ALL_EVENT_TYPES.filter((e) => !['version_available', 'replica_failure', 'plugin_notification'].includes(e)),
    );
  });
});
