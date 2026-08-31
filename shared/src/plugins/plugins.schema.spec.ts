import {
  pluginSettingsFieldSchema,
  pluginInstanceConfigResponseSchema,
  pluginInstanceConfigUpdateSchema,
  pluginInstanceConfigUpdatedSchema,
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
});

describe('instance-config wire shapes', () => {
  it('GET response carries the form fields alongside the (masked) values', () => {
    const res = {
      fields: [{ key: 'apiUrl', label: null, input_type: 'text', placeholder: null, hint: null, required: true, secret: false }],
      config: { apiUrl: 'https://x.example', apiKey: '••••••••' },
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
