import { describe, it, expect } from 'vitest';
import { validateManifest } from '../src/manifest.js';

describe('validateManifest normalized output', () => {
  it('normalized manifest keeps every recognized field', () => {
    const input = {
      id: 'my-plugin', name: 'My Plugin', version: '1.0.0', type: 'widget', trek: '>=4.0.0 <5.0.0',
      permissions: ['db:own'], operatorEgress: false, icon: 'Bell', author: 'A', description: 'Does things.',
      homepage: 'https://example.com', tags: ['fun'], license: 'MIT',
      capabilities: { widget: { title: 'W', slot: 'hero' }, provides: ['getState'] },
      settings: [{ key: 'mode', scope: 'user', options: ['a', 'b'] }],
      actions: [{ key: 'ping', label: 'Ping' }],
    };
    const r = validateManifest(input);
    expect(r.ok).toBe(true);
    const m = r.manifest!;
    expect(m.capabilities?.widget?.slot).toBe('hero');
    expect(m.settings?.[0].options).toEqual(['a', 'b']);
    expect(m.actions?.[0]).toEqual({ key: 'ping', label: 'Ping' });
    expect(m.icon).toBe('Bell');
    expect(m.operatorEgress).toBe(false);
    expect(m.nativeModules).toBe(false); // still forced
    expect(m.apiVersion).toBe(1); // still defaulted
    expect(m.requiredAddons).toEqual([]);
  });

  it('accepts routeProfiles icon', () => {
    const r = validateManifest({
      id: 'rt-plug', name: 'R', version: '1.0.0', type: 'integration', trek: '>=4.0.0 <5.0.0',
      permissions: ['hook:route-provider'], capabilities: { routeProfiles: [{ id: 'hike', label: 'Hiking', icon: 'Mountain' }] },
    });
    expect(r.ok).toBe(true);
    expect(r.manifest!.capabilities?.routeProfiles?.[0].icon).toBe('Mountain');
  });

  it('drops a non-string routeProfiles icon instead of rejecting the manifest', () => {
    const r = validateManifest({
      id: 'rt-plug', name: 'R', version: '1.0.0', type: 'integration', trek: '>=4.0.0 <5.0.0',
      permissions: ['hook:route-provider'], capabilities: { routeProfiles: [{ id: 'hike', label: 'Hiking', icon: 42 }] },
    });
    expect(r.ok).toBe(true);
    expect(r.manifest!.capabilities?.routeProfiles?.[0].icon).toBeUndefined();
  });
});
