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

  describe('the trek range', () => {
    it('normalizes a valid range onto trekRange — what the host actually gates on', () => {
      const m = parseManifest({ ...base, trek: '>=3.2.0 <4.0.0' });
      expect(m.trekRange).toBe('>=3.2.0 <4.0.0');
    });

    it('reads the lower bound off the range, not off its first version-shaped substring', () => {
      // "<4.0.0" has a first X.Y.Z of 4.0.0 but a lower bound of 0.0.0. The old regex
      // published 4.0.0 as the MINIMUM — the exact inverse of what the plugin declared.
      expect(parseManifest({ ...base, trek: '<4.0.0' }).minTrekVersion).toBeUndefined();
      expect(parseManifest({ ...base, trek: '>=3' }).minTrekVersion).toBe('3.0.0');
    });

    it('stays lenient by default — discovery must still register a plugin with no range', () => {
      // Discovery only logs and skips on a throw; it never touches the plugins row, so a
      // strict parse there would leave a stale enabled=1 row that the next boot spawns
      // anyway. The activation gate refuses an undeclared range instead.
      const m = parseManifest({ ...base });
      expect(m.trekRange).toBeNull();
      expect(m.minTrekVersion).toBeUndefined();
    });

    it('drops an unparseable range to null rather than throwing, in lenient mode', () => {
      expect(parseManifest({ ...base, trek: '3.2+' }).trekRange).toBeNull();
    });

    it('requires a satisfiable range at the install front doors', () => {
      expect(() => parseManifest({ ...base }, { requireTrek: true })).toThrow(/missing "trek"/);
      expect(() => parseManifest({ ...base, trek: '3.2+' }, { requireTrek: true })).toThrow(ManifestError);
      // Syntactically valid, semantically empty — no TREK could ever run it.
      expect(() => parseManifest({ ...base, trek: '>=4.0.0 <3.0.0' }, { requireTrek: true })).toThrow(/satisfiable/);
      expect(parseManifest({ ...base, trek: '^3.2.0' }, { requireTrek: true }).trekRange).toBe('^3.2.0');
    });
  });

  it('accepts the trip-page type (mounts as a tab inside the trip planner)', () => {
    expect(parseManifest({ ...base, type: 'trip-page' }).type).toBe('trip-page');
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

  it('accepts the place-detail widget slot (mounts in the place inspector)', () => {
    const pd = parseManifest({ ...base, capabilities: { widget: { slot: 'place-detail' } } });
    expect(pd.capabilities.widget?.slot).toBe('place-detail');
  });

  it('accepts the day-detail widget slot (mounts in the day panel)', () => {
    const dd = parseManifest({ ...base, capabilities: { widget: { slot: 'day-detail' } } });
    expect(dd.capabilities.widget?.slot).toBe('day-detail');
  });

  it('accepts the reservation-detail widget slot (mounts on a booking card)', () => {
    const rd = parseManifest({ ...base, capabilities: { widget: { slot: 'reservation-detail' } } });
    expect(rd.capabilities.widget?.slot).toBe('reservation-detail');
  });

  it('rejects an unknown widget slot', () => {
    expect(() => parseManifest({ ...base, capabilities: { widget: { slot: 'floating' } } })).toThrow(ManifestError);
  });

  it('parses settingsUi as a strict boolean, dropping false', () => {
    expect(parseManifest({ ...base, capabilities: { settingsUi: true } }).capabilities.settingsUi).toBe(true);
    // false means "none" — it must not linger in the stored capabilities blob
    expect(parseManifest({ ...base, capabilities: { settingsUi: false } }).capabilities.settingsUi).toBeUndefined();
    expect(() => parseManifest({ ...base, capabilities: { settingsUi: 'yes' } })).toThrow(ManifestError);
  });

  it('parses tripPage replaces + position, deduplicated', () => {
    const m = parseManifest({ ...base, capabilities: { tripPage: { replaces: ['transports', 'buchungen', 'transports'], position: 1 } } });
    expect(m.capabilities.tripPage).toEqual({ replaces: ['transports', 'buchungen'], position: 1 });
    // either half stands alone
    expect(parseManifest({ ...base, capabilities: { tripPage: { position: 0 } } }).capabilities.tripPage).toEqual({ position: 0 });
    expect(parseManifest({ ...base, capabilities: { tripPage: {} } }).capabilities.tripPage).toBeUndefined();
  });

  it("refuses to replace 'plan', unknown tabs and out-of-range positions", () => {
    expect(() => parseManifest({ ...base, capabilities: { tripPage: { replaces: ['plan'] } } })).toThrow(ManifestError);
    expect(() => parseManifest({ ...base, capabilities: { tripPage: { replaces: ['settings'] } } })).toThrow(ManifestError);
    expect(() => parseManifest({ ...base, capabilities: { tripPage: { replaces: 'transports' } } })).toThrow(ManifestError);
    expect(() => parseManifest({ ...base, capabilities: { tripPage: { position: -1 } } })).toThrow(ManifestError);
    expect(() => parseManifest({ ...base, capabilities: { tripPage: { position: 2.5 } } })).toThrow(ManifestError);
    expect(() => parseManifest({ ...base, capabilities: { tripPage: { position: 99 } } })).toThrow(ManifestError);
  });
});

describe('parseManifest dependencies', () => {
  it('defaults to empty dependency lists', () => {
    const m = parseManifest({ ...base });
    expect(m.requiredAddons).toEqual([]);
    expect(m.pluginDependencies).toEqual([]);
  });

  it('parses + de-duplicates requiredAddons', () => {
    const m = parseManifest({ ...base, requiredAddons: ['budget', 'journey', 'budget'] });
    expect(m.requiredAddons).toEqual(['budget', 'journey']);
  });

  it('rejects a malformed addon id', () => {
    expect(() => parseManifest({ ...base, requiredAddons: ['Budget!'] })).toThrow(ManifestError);
  });

  it('parses pluginDependencies with semver ranges', () => {
    const m = parseManifest({ ...base, pluginDependencies: [{ id: 'koffi', version: '>=1.2.0 <2.0.0' }] });
    expect(m.pluginDependencies).toEqual([{ id: 'koffi', version: '>=1.2.0 <2.0.0' }]);
  });

  it('rejects an invalid dependency version range', () => {
    expect(() => parseManifest({ ...base, pluginDependencies: [{ id: 'koffi', version: 'not-a-range' }] })).toThrow(ManifestError);
  });

  it('rejects a self dependency, a reserved id, and duplicates', () => {
    expect(() => parseManifest({ ...base, pluginDependencies: [{ id: base.id, version: '*' }] })).toThrow(/itself/);
    expect(() => parseManifest({ ...base, pluginDependencies: [{ id: 'registry', version: '*' }] })).toThrow(/reserved/);
    expect(() => parseManifest({ ...base, pluginDependencies: [{ id: 'koffi', version: '*' }, { id: 'koffi', version: '^1' }] })).toThrow(/duplicate/);
  });
});

describe('capabilities.notificationChannel', () => {
  const base = {
    id: 'my-gotify',
    name: 'My Gotify',
    version: '1.0.0',
    apiVersion: 1,
    type: 'integration',
    nativeModules: false,
    permissions: ['hook:notification-channel', 'http:outbound:gotify.example.com'],
    egress: ['gotify.example.com'],
  };

  it('accepts what the SDK notification-channel template scaffolds', () => {
    const m = parseManifest({
      ...base,
      capabilities: { notificationChannel: { title: 'My Gotify' } },
      settings: [{ key: 'appToken', label: 'App token', required: true, secret: true, scope: 'user' }],
    });
    expect(m.capabilities.notificationChannel?.title).toBe('My Gotify');
    // scope:'user' + secret is what lets the host hand the decrypted value to the hook.
    expect(m.settings[0].scope).toBe('user');
    expect(m.settings[0].secret).toBe(true);
  });

  it('accepts a narrowed event list', () => {
    const m = parseManifest({ ...base, capabilities: { notificationChannel: { events: ['trip_invite', 'booking_change'] } } });
    expect(m.capabilities.notificationChannel?.events).toEqual(['trip_invite', 'booking_change']);
  });

  it('rejects an admin-scoped event — a plugin channel can never carry one', () => {
    expect(() => parseManifest({ ...base, capabilities: { notificationChannel: { events: ['version_available'] } } }))
      .toThrow(/not a plugin-deliverable event/);
  });

  it('rejects a non-array events field', () => {
    expect(() => parseManifest({ ...base, capabilities: { notificationChannel: { events: 'trip_invite' } } }))
      .toThrow(ManifestError);
  });
});

describe('select field options', () => {
  const base = { id: 'sel', name: 'Sel', version: '1.0.0', apiVersion: 1, type: 'integration', nativeModules: false, permissions: [] };
  const opts = (options: unknown) => parseManifest({ ...base, settings: [{ key: 'priority', input_type: 'select', scope: 'user', options }] }).settings[0].options;

  it('keeps a proper { value, label } list', () => {
    expect(opts([{ value: '5', label: 'Normal' }])).toEqual([{ value: '5', label: 'Normal' }]);
  });

  it('coerces a bare string/number list instead of rendering blank options', () => {
    // The obvious thing to write — and it used to be cast straight through, so the
    // client read o.value/o.label as undefined and every dropdown entry was EMPTY.
    expect(opts(['1', '5'])).toEqual([{ value: '1', label: '1' }, { value: '5', label: '5' }]);
    expect(opts([1, 5])).toEqual([{ value: '1', label: '1' }, { value: '5', label: '5' }]);
  });

  it('defaults a missing label to the value rather than leaving it blank', () => {
    expect(opts([{ value: '5' }])).toEqual([{ value: '5', label: '5' }]);
  });

  it('rejects an option with no value, and a non-array list', () => {
    expect(() => opts([{ label: 'Normal' }])).toThrow(/non-empty "value"/);
    expect(() => opts([null])).toThrow(ManifestError);
    expect(() => opts('nope')).toThrow(/must be an array/);
  });
});

describe('settings-page actions', () => {
  const base = { id: 'act', name: 'Act', version: '1.0.0', apiVersion: 1, type: 'integration', nativeModules: false, permissions: [] };

  it('parses actions with label/hint/danger', () => {
    const m = parseManifest({ ...base, actions: [{ key: 'testConnection', label: 'Test connection', hint: 'Pings the API.' }, { key: 'purge', label: 'Purge', danger: true }] });
    expect(m.actions).toEqual([
      { key: 'testConnection', label: 'Test connection', hint: 'Pings the API.', danger: false },
      { key: 'purge', label: 'Purge', hint: undefined, danger: true },
    ]);
  });

  it('defaults the label to the key, and bounds label/hint', () => {
    const m = parseManifest({ ...base, actions: [{ key: 'sync', label: 'L'.repeat(200), hint: 'H'.repeat(500) }] });
    expect(m.actions[0].label.length).toBe(60);
    expect(m.actions[0].hint!.length).toBe(200);
    expect(parseManifest({ ...base, actions: [{ key: 'sync' }] }).actions[0].label).toBe('sync');
  });

  it('rejects a prototype-chain key, a duplicate, a non-array and too many', () => {
    expect(() => parseManifest({ ...base, actions: [{ key: '__proto__' }] })).toThrow(ManifestError);
    expect(() => parseManifest({ ...base, actions: [{ key: 'a' }, { key: 'a' }] })).toThrow(/duplicate action/);
    expect(() => parseManifest({ ...base, actions: 'nope' })).toThrow(/must be an array/);
    expect(() => parseManifest({ ...base, actions: Array.from({ length: 9 }, (_, i) => ({ key: `a${i}` })) })).toThrow(/at most 8/);
  });

  it('defaults to no actions', () => {
    expect(parseManifest(base).actions).toEqual([]);
  });
});
