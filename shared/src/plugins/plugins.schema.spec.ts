import {
  pluginSettingsFieldSchema,
  pluginInstanceConfigResponseSchema,
  pluginInstanceConfigUpdateSchema,
  pluginInstanceConfigUpdatedSchema,
  pluginInstallRequestSchema,
  pluginLinkRequestSchema,
  pluginActivateRequestSchema,
  pluginUninstallRequestSchema,
  pluginRetrustRequestSchema,
  pluginUpdateRequestSchema,
  pluginEgressHostsRequestSchema,
  pluginUserSettingsUpdateRequestSchema,
  pluginRouteRequestSchema,
  pluginActionDescriptorSchema,
  pluginActionResultSchema,
} from './plugins.schema';

import { describe, expect, it } from 'vitest';

/**
 * The instance-config contract (#plugins): the settings-field descriptor both
 * settings forms render from, and the admin config GET/PUT wire shapes. These
 * pin the SHAPE the server emits — which keys are nullable vs optional matters,
 * because the client forms branch on them (`f.label || f.key`, `f.secret`).
 */
describe('pluginSettingsFieldSchema', () => {
  it('accepts a fully-populated field as the server emits it (nulls, not absences)', () => {
    const field = {
      key: 'apiKey',
      label: 'API key',
      input_type: 'text',
      placeholder: null,
      hint: null,
      required: false,
      secret: true,
      options: undefined,
    };
    expect(pluginSettingsFieldSchema.parse(field)).toMatchObject({ key: 'apiKey', secret: true });
  });

  it('accepts a select field with {value,label} options (the manifest-validated shape)', () => {
    const field = { key: 'mode', options: [{ value: 'fast', label: 'Fast' }] };
    expect(pluginSettingsFieldSchema.parse(field).options).toEqual([{ value: 'fast', label: 'Fast' }]);
  });

  it('requires key — a field without one cannot be rendered or saved', () => {
    expect(pluginSettingsFieldSchema.safeParse({ label: 'orphan' }).success).toBe(false);
  });

  it('settings field carries an optional default (string | number | boolean)', () => {
    expect(pluginSettingsFieldSchema.parse({ key: 'k', default: 'https://x' }).default).toBe('https://x');
    expect(pluginSettingsFieldSchema.parse({ key: 'k', default: 3 }).default).toBe(3);
    expect(pluginSettingsFieldSchema.parse({ key: 'k', default: true }).default).toBe(true);
    expect(pluginSettingsFieldSchema.parse({ key: 'k' }).default).toBeUndefined();
    expect(pluginSettingsFieldSchema.safeParse({ key: 'k', default: { o: 1 } }).success).toBe(false);
  });
});

describe('instance-config wire shapes', () => {
  it('GET response carries the form fields alongside the (masked) values', () => {
    const res = {
      fields: [
        {
          key: 'apiUrl',
          label: null,
          input_type: 'text',
          placeholder: null,
          hint: null,
          required: true,
          secret: false,
        },
      ],
      config: { apiUrl: 'https://x.example', apiKey: '••••••••' },
      actions: [],
    };
    expect(pluginInstanceConfigResponseSchema.parse(res).fields).toHaveLength(1);
  });

  it('PUT body is the config record itself — any keys, unknown values', () => {
    expect(pluginInstanceConfigUpdateSchema.parse({ apiUrl: 'x', retries: 3, on: true })).toEqual({
      apiUrl: 'x',
      retries: 3,
      on: true,
    });
  });

  it('PUT body refuses a non-object (the handler never sees garbage shapes)', () => {
    expect(pluginInstanceConfigUpdateSchema.safeParse('not a config').success).toBe(false);
    expect(pluginInstanceConfigUpdateSchema.safeParse([1, 2]).success).toBe(false);
  });

  it('PUT response reports whether the save restarted a running plugin', () => {
    expect(pluginInstanceConfigUpdatedSchema.parse({ config: {}, restarted: true }).restarted).toBe(true);
    expect(pluginInstanceConfigUpdatedSchema.safeParse({ config: {} }).success).toBe(false);
  });
});

/**
 * The admin body contracts, written to DESCRIBE rather than to tighten (the
 * journey-contract doctrine, #1842): fields optional, objects loose, so every
 * handler keeps the rejection it already owns ('id is required', 503-before-body,
 * hosts-clears-on-non-array). These pin exactly that looseness — a "helpful"
 * tightening of one of these schemas is a behavior change on the wire.
 */
describe('admin body contracts stay loose by doctrine', () => {
  it("install: an empty body parses — `id is required` stays the HANDLER's answer", () => {
    expect(pluginInstallRequestSchema.safeParse({}).success).toBe(true);
    expect(
      pluginInstallRequestSchema.parse({ id: 'p', version: '1.0.0', constraint: '^1', withDependencies: true }),
    ).toMatchObject({ id: 'p', withDependencies: true });
  });

  it('install: declared fields still pin their TYPES', () => {
    expect(pluginInstallRequestSchema.safeParse({ withDependencies: 'yes' }).success).toBe(false);
  });

  it('link / activate / uninstall / retrust / update: empty bodies parse', () => {
    for (const s of [
      pluginLinkRequestSchema,
      pluginActivateRequestSchema,
      pluginUninstallRequestSchema,
      pluginRetrustRequestSchema,
      pluginUpdateRequestSchema,
    ]) {
      expect(s.safeParse({}).success).toBe(true);
    }
  });

  it('egress hosts: a non-array `hosts` parses — that is the documented clear/reset path', () => {
    expect(pluginEgressHostsRequestSchema.safeParse({}).success).toBe(true);
    expect(pluginEgressHostsRequestSchema.safeParse({ hosts: null }).success).toBe(true);
    expect(pluginEgressHostsRequestSchema.safeParse({ hosts: ['a.example'] }).success).toBe(true);
  });

  it('user settings update: a non-object `config` parses — the handler answers 200, not 400', () => {
    expect(pluginUserSettingsUpdateRequestSchema.safeParse({ config: 'garbage' }).success).toBe(true);
    expect(pluginUserSettingsUpdateRequestSchema.safeParse({}).success).toBe(true);
  });

  it('route: any object parses — the handler answers { route: null }, never a 400', () => {
    expect(pluginRouteRequestSchema.safeParse({ anything: [1, 2, 3] }).success).toBe(true);
  });
});

describe('plugin action contracts', () => {
  it('SHARED-PLUG-ACT-001: a descriptor carries key/label/danger/scope and an optional hint', () => {
    expect(
      pluginActionDescriptorSchema.parse({ key: 'purge', label: 'Purge cache', danger: true, scope: 'instance' }),
    ).toEqual({ key: 'purge', label: 'Purge cache', danger: true, scope: 'instance' });
    expect(pluginActionDescriptorSchema.parse({ key: 'a', label: 'A', hint: 'h', danger: false, scope: 'user' }).hint).toBe('h');
  });

  it('SHARED-PLUG-ACT-002: refuses a scope outside user|instance and a missing scope', () => {
    expect(pluginActionDescriptorSchema.safeParse({ key: 'a', label: 'A', danger: false, scope: 'global' }).success).toBe(false);
    expect(pluginActionDescriptorSchema.safeParse({ key: 'a', label: 'A', danger: false }).success).toBe(false);
  });

  it('SHARED-PLUG-ACT-003: a result is ok plus an optional message', () => {
    expect(pluginActionResultSchema.parse({ ok: true })).toEqual({ ok: true });
    expect(pluginActionResultSchema.parse({ ok: false, message: 'nope' })).toEqual({ ok: false, message: 'nope' });
    expect(pluginActionResultSchema.safeParse({ message: 'x' }).success).toBe(false);
  });

  it('SHARED-PLUG-ACT-004: the instance config response now lists instance actions', () => {
    const r = pluginInstanceConfigResponseSchema.parse({
      fields: [],
      config: {},
      actions: [{ key: 'ping', label: 'Ping', danger: false, scope: 'instance' }],
    });
    expect(r.actions).toHaveLength(1);
    expect(pluginInstanceConfigResponseSchema.safeParse({ fields: [], config: {} }).success).toBe(false);
  });
});
