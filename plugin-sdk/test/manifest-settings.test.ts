import { describe, it, expect } from 'vitest';
import { validateManifest } from '../src/manifest.js';

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
