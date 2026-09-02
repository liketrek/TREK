import { describe, it, expect } from 'vitest';
import { validateManifest, settingDefaults } from '../src/manifest.js';

const base = () => ({ id: 'my-plugin', name: 'My Plugin', version: '1.0.0', type: 'integration', trek: '>=4.0.0 <5.0.0' });
const withSetting = (extra: object) => ({ ...base(), settings: [{ key: 'mode', ...extra }] });

describe('validateManifest settings[].options / settings[].oauth', () => {
  it('accepts string/number option lists', () => {
    expect(validateManifest(withSetting({ options: ['a', 'b'] })).ok).toBe(true);
    expect(validateManifest(withSetting({ options: [1, 2] })).ok).toBe(true);
  });
  it('accepts {value,label} options incl. value 0', () => {
    expect(validateManifest(withSetting({ options: [{ value: 0, label: 'Zero' }] })).ok).toBe(true);
  });
  it('rejects a non-array options', () => {
    const r = validateManifest(withSetting({ options: 'a,b' }));
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('settings option list must be an array');
  });
  it('rejects an option with empty value', () => {
    const r = validateManifest(withSetting({ options: [{ value: '', label: 'x' }] }));
    expect(r.errors).toContain('settings option must have a non-empty "value"');
  });
  it('rejects a garbage option entry', () => {
    const r = validateManifest(withSetting({ options: [true] }));
    expect(r.errors).toContain('invalid settings option true (expected a string or { value, label })');
  });
  it('rejects a non-object oauth', () => {
    expect(validateManifest(withSetting({ oauth: 'x' })).errors).toContain('settings oauth must be an object');
  });
  it('rejects non-string oauth paths, accepts valid oauth', () => {
    expect(validateManifest(withSetting({ oauth: { initPath: 3 } })).errors).toContain('settings oauth.initPath must be a string');
    expect(validateManifest(withSetting({ oauth: { initPath: '/oauth/init' } })).ok).toBe(true);
  });
});

describe('settings default', () => {
  it('accepts a string/number/boolean default', () => {
    expect(validateManifest(withSetting({ default: 'https://x' })).ok).toBe(true);
    expect(validateManifest(withSetting({ default: 42 })).ok).toBe(true);
    expect(validateManifest(withSetting({ default: true })).ok).toBe(true);
  });
  it('carries the default through onto the normalized manifest', () => {
    const r = validateManifest(withSetting({ default: 'https://x' }));
    expect(r.manifest?.settings?.[0]?.default).toBe('https://x');
  });
  it('rejects an object default', () => {
    const r = validateManifest(withSetting({ key: 'a', default: { nope: 1 } }));
    expect(r.errors.join()).toMatch(/settings\["a"\]\.default must be a string, number or boolean/);
  });
  it('rejects default on a secret field', () => {
    const r = validateManifest(withSetting({ key: 'tok', secret: true, default: 'x' }));
    expect(r.errors.join()).toMatch(/not allowed on a secret field/);
  });
  it('rejects a non-boolean default on a checkbox', () => {
    const r = validateManifest(withSetting({ key: 'on', input_type: 'checkbox', default: 'yes' }));
    expect(r.errors.join()).toMatch(/must be a boolean/);
  });
  it('rejects a default that is not one of the declared options', () => {
    const r = validateManifest(withSetting({ key: 's', input_type: 'select', options: ['a', 'b'], default: 'c' }));
    expect(r.errors.join()).toMatch(/one of the declared options/);
  });
});

describe('settingDefaults (what `trek-plugin dev` seeds ctx.config / ctx.settings with)', () => {
  const manifest = () => ({
    ...base(),
    settings: [
      { key: 'api_url', default: 'https://api.example' },
      { key: 'retries', input_type: 'number', default: 3 },
      { key: 'region', scope: 'user', default: 'eu' },
      { key: 'token', secret: true, default: 'never' }, // invalid anyway, but must never leak through
      { key: 'note' },
    ],
  });
  it('collects the instance-scope defaults (scope omitted = instance)', () => {
    expect(settingDefaults(manifest(), 'instance')).toEqual({ api_url: 'https://api.example', retries: 3 });
  });
  it('collects the user-scope defaults', () => {
    expect(settingDefaults(manifest(), 'user')).toEqual({ region: 'eu' });
  });
  it('is empty for a manifest without settings', () => {
    expect(settingDefaults(base(), 'instance')).toEqual({});
  });
});
