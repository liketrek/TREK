/**
 * trek-plugin.json validation (#plugins, M4). Rejects invalid ids/versions/types,
 * unknown permissions, native modules, and http:outbound without egress.
 */
import { describe, it, expect } from 'vitest';
import { parseManifest, ManifestError } from '../../../src/nest/plugins/install/manifest';

const base = { id: 'flight-tracker', name: 'Flight', version: '1.2.0', type: 'widget', apiVersion: 1 };

describe('parseManifest', () => {
  it('parses a valid manifest with defaults', () => {
    const m = parseManifest({ ...base });
    expect(m.id).toBe('flight-tracker');
    expect(m.icon).toBe('Blocks');
    expect(m.nativeModules).toBe(false);
    expect(m.permissions).toEqual([]);
  });

  it('derives minTrekVersion from the trek range', () => {
    expect(parseManifest({ ...base, trek: '>=3.2.0 <4.0.0' }).minTrekVersion).toBe('3.2.0');
  });

  it('keeps known permissions + parses settings', () => {
    const m = parseManifest({
      ...base,
      permissions: ['db:own', 'http:outbound:api.x.com'],
      egress: ['api.x.com'],
      settings: [{ key: 'api_key', input_type: 'password', scope: 'instance', secret: true }, { bad: 1 }],
    });
    expect(m.permissions).toContain('db:own');
    expect(m.settings).toHaveLength(1);
    expect(m.settings[0]).toMatchObject({ key: 'api_key', secret: true, scope: 'instance' });
  });

  it('accepts exact, single-label (self-hoster sibling), and wildcard outbound hosts', () => {
    const m = parseManifest({ ...base, permissions: ['http:outbound:api.x.com', 'http:outbound:*.example.com', 'http:outbound:redis'], egress: ['api.x.com', '*.example.com', 'redis'] });
    expect(m.permissions).toContain('http:outbound:*.example.com');
    expect(m.permissions).toContain('http:outbound:redis');
  });

  it.each([
    ['Bad-Id', { ...base, id: 'Bad-Id' }, /invalid id/],
    ['reserved id', { ...base, id: 'registry' }, /reserved id/],
    ['bad version', { ...base, version: '1.x' }, /invalid version/],
    ['bad type', { ...base, type: 'thing' }, /invalid type/],
    ['native', { ...base, nativeModules: true }, /native modules/],
    ['unknown perm', { ...base, permissions: ['fs:read'] }, /unknown permission/],
    ['outbound no egress', { ...base, permissions: ['http:outbound'] }, /egress\[\] is empty/],
    ['wildcard egress', { ...base, permissions: ['http:outbound'], egress: ['*'] }, /bare "\*"/],
    ['allow-all outbound host', { ...base, permissions: ['http:outbound:*'], egress: ['x.com'] }, /invalid http:outbound host/],
    ['degenerate wildcard host', { ...base, permissions: ['http:outbound:*.'], egress: ['x.com'] }, /invalid http:outbound host/],
    ['whole-TLD outbound host', { ...base, permissions: ['http:outbound:*.com'], egress: ['x.com'] }, /invalid http:outbound host/],
    ['host with a space', { ...base, permissions: ['http:outbound:legit.com x'], egress: ['legit.com'] }, /invalid http:outbound host/],
    ['bad egress host', { ...base, permissions: ['http:outbound:api.x.com'], egress: ['api.x.com', 'no spaces here'] }, /invalid egress host/],
    ['not an object', 'nope', /not an object/],
    ['missing name', { id: 'x-plugin', version: '1.0.0', type: 'page' }, /missing\/invalid "name"/],
  ])('rejects: %s', (_label, input, re) => {
    expect(() => parseManifest(input)).toThrow(ManifestError);
    expect(() => parseManifest(input)).toThrow(re as RegExp);
  });
});

describe('parseManifest capabilities', () => {
  it('parses a hero widget slot and defaults to sidebar', () => {
    const hero = parseManifest({ ...base, capabilities: { widget: { slot: 'hero', title: 'T' } } });
    expect(hero.capabilities.widget?.slot).toBe('hero');
    const plain = parseManifest({ ...base, capabilities: { widget: {} } });
    expect(plain.capabilities.widget?.slot).toBe('sidebar');
    expect(parseManifest(base).capabilities).toEqual({});
  });

  it('rejects an unknown widget slot', () => {
    expect(() => parseManifest({ ...base, capabilities: { widget: { slot: 'floating' } } })).toThrow(ManifestError);
  });
});
