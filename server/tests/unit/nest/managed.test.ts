/**
 * TREK_MANAGED — the switch that says the configuration belongs to whoever runs
 * this install rather than to its admin.
 *
 * Runtime-toggled, exactly like DEMO_MODE: read live on every access, never
 * snapshotted into a field or a registerAs token, because roughly sixty tests
 * mutate process.env mid-lifetime and a frozen value breaks all of them.
 * MANAGED-004 is the case that pins it.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { isManagedBlocked, MANAGED_FORBIDDEN, MANAGED_FORBIDDEN_ERROR, ManagedForbidden } from '../../../src/nest/common/managed';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { deriveManaged } from '../../../src/app-config/derive';

const env = new RuntimeEnvService();

afterEach(() => {
  delete process.env.TREK_MANAGED;
});

describe('deriveManaged', () => {
  it('MANAGED-001: off when the variable is unset', () => {
    expect(deriveManaged({}).enabled).toBe(false);
  });

  it('MANAGED-002: on for the documented truthy spellings', () => {
    for (const value of ['true', 'TRUE', '1', 'yes', 'on']) {
      expect(deriveManaged({ TREK_MANAGED: value }).enabled).toBe(true);
    }
  });

  it('MANAGED-003: off for an empty, unparseable or falsy value', () => {
    // A typo must not take settings away from an admin who never asked for it,
    // so anything that is not recognisably true stays off.
    for (const value of ['', 'false', '0', 'no', 'off', 'maybe', 'TREK_MANAGED']) {
      expect(deriveManaged({ TREK_MANAGED: value }).enabled).toBe(false);
    }
  });
});

describe('RuntimeEnvService.isManaged', () => {
  it('MANAGED-004: reads the env live, so a toggle takes effect without a restart', () => {
    expect(env.isManaged()).toBe(false);

    process.env.TREK_MANAGED = 'true';
    expect(env.isManaged()).toBe(true);

    delete process.env.TREK_MANAGED;
    expect(env.isManaged()).toBe(false);
  });
});

describe('isManagedBlocked', () => {
  it('MANAGED-005: false on a self-hosted install', () => {
    expect(isManagedBlocked(env)).toBe(false);
  });

  it('MANAGED-006: true once the instance is centrally administered', () => {
    process.env.TREK_MANAGED = 'true';
    expect(isManagedBlocked(env)).toBe(true);
  });
});

describe('the shared 403', () => {
  it('MANAGED-007: one body, and it does not name a reason', () => {
    // Pinned because DEMO_MODE grew two texts for one condition (REST says
    // 'Self-host TREK for full functionality.', MCP says something else) and
    // neither can now be changed without hunting for the other.
    expect(MANAGED_FORBIDDEN_ERROR).toEqual({
      error: 'This is configured by the operator of this instance.',
      code: 'MANAGED_FORBIDDEN',
    });
  });
});

describe('ManagedForbidden', () => {
  it('MANAGED-008: writes the reason onto the handler for the next reader', () => {
    class Controller {
      @ManagedForbidden('the operator holds this credential')
      handler() {}
    }

    const meta = Reflect.getMetadata(MANAGED_FORBIDDEN, Controller.prototype.handler);
    expect(meta).toEqual({ reason: 'the operator holds this credential', enforcedInHandler: false });
  });

  it('MANAGED-009: a multipart route stays in the inventory while refusing in its handler', () => {
    class Controller {
      @ManagedForbidden('restoring a backup replaces state the operator owns', { enforcedInHandler: true })
      upload() {}
    }

    const meta = Reflect.getMetadata(MANAGED_FORBIDDEN, Controller.prototype.upload);
    expect(meta.enforcedInHandler).toBe(true);
    // The reason is still mandatory: the boot gate refuses an empty one.
    expect(meta.reason).not.toBe('');
  });
});
