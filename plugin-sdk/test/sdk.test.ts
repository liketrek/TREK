import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { definePlugin, PLUGIN_API_VERSION, validateManifest, createMockHost } from '../src/index.js';
import { scaffold } from '../src/cli/create.js';
import { validatePluginDir } from '../src/cli/validate.js';
import { makeZip, listZipNames } from '../src/zip.js';
import { packPluginDir } from '../src/cli/pack.js';
import { buildEntry } from '../src/cli/entry.js';
import { generateKeypair, signArtifact, publicKeyBase64, verifyArtifact, loadPrivateKey } from '../src/cli/sign.js';

/** A central-directory zip reader mirroring the TREK server's, to prove round-trip. */
function readZip(buf: Buffer): Record<string, Buffer> {
  let e = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  const count = buf.readUInt16LE(e + 8);
  let p = buf.readUInt32LE(e + 16);
  const out: Record<string, Buffer> = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    const dataStart = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const comp = buf.subarray(dataStart, dataStart + compSize);
    out[name] = method === 0 ? Buffer.from(comp) : zlib.inflateRawSync(comp);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

describe('definePlugin + api version', () => {
  it('returns the definition and exposes the api version', () => {
    const def = { onLoad: async () => {} };
    expect(definePlugin(def)).toBe(def);
    expect(PLUGIN_API_VERSION).toBe(1);
  });
});

describe('validateManifest', () => {
  const base = { id: 'flight-tracker', name: 'Flight', version: '1.0.0', type: 'widget', apiVersion: 1 };
  it('accepts a valid manifest', () => {
    expect(validateManifest(base).ok).toBe(true);
  });
  it('collects every problem', () => {
    const r = validateManifest({ id: 'Bad', version: '1.x', type: 'nope', permissions: ['fs:read'] });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(2);
  });
  it('requires egress when http:outbound is declared', () => {
    expect(validateManifest({ ...base, permissions: ['http:outbound'] }).ok).toBe(false);
    expect(validateManifest({ ...base, permissions: ['http:outbound'], egress: ['api.x.com'] }).ok).toBe(true);
  });
  it('rejects native modules and non-objects', () => {
    expect(validateManifest({ ...base, nativeModules: true }).ok).toBe(false);
    expect(validateManifest('nope').ok).toBe(false);
  });
  it('accepts the newer host permissions (writes, notify, map-marker hook)', () => {
    const permissions = ['db:write:reservations', 'db:write:accommodations', 'notify:send', 'hook:map-marker-provider'];
    const r = validateManifest({ ...base, permissions });
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.manifest?.permissions).toEqual(permissions);
  });
  it('accepts hook:trip-card-provider and hook:user-data (server accepts them)', () => {
    const permissions = ['hook:trip-card-provider', 'hook:user-data'];
    const r = validateManifest({ ...base, permissions });
    expect(r.ok).toBe(true);
    expect(r.manifest?.permissions).toEqual(permissions);
  });

  it('accepts the read-symmetry + broker permissions (collab, file content, trip create, rates)', () => {
    const permissions = ['db:read:collab', 'db:create:trips', 'rates:read', 'db:read:files:content'];
    const r = validateManifest({ ...base, permissions });
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.manifest?.permissions).toEqual(permissions);
  });
  it('validates tripPage: replaceable tabs only (never plan), position 0-50', () => {
    const page = { ...base, type: 'trip-page' };
    expect(validateManifest({ ...page, capabilities: { tripPage: { replaces: ['transports', 'buchungen'], position: 1 } } }).ok).toBe(true);
    expect(validateManifest({ ...page, capabilities: { tripPage: { replaces: ['plan'] } } }).ok).toBe(false);
    expect(validateManifest({ ...page, capabilities: { tripPage: { replaces: ['nope'] } } }).ok).toBe(false);
    expect(validateManifest({ ...page, capabilities: { tripPage: { position: -1 } } }).ok).toBe(false);
  });
});

describe('createMockHost', () => {
  it('enforces the granted permission set', async () => {
    const { ctx } = createMockHost({ grants: ['db:own'] });
    await expect(ctx.db.migrate('1', 'CREATE TABLE t (x)')).resolves.toEqual({ applied: true });
    await expect(ctx.trips.getById(1, 1)).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('membership-checks trip reads against the ACTING user (asUserId is ignored, like the real host) and records broadcasts', async () => {
    const member = createMockHost({
      grants: ['db:read:trips', 'ws:broadcast:trip'],
      actingUserId: 42,
      trips: { 1: { members: [42], data: { id: 1, name: 'Japan' } } },
    });
    expect(await member.ctx.trips.getById(1)).toEqual({ id: 1, name: 'Japan' });
    await member.ctx.ws.broadcastToTrip(1, 'ping', { a: 1 });
    expect(member.broadcasts).toEqual([{ kind: 'trip', target: 1, event: 'ping', data: { a: 1 } }]);
    // asUserId is accepted for source-compat but IGNORED: a non-member acting user is
    // refused even when it passes a member id as asUserId (the #13 divergence, now fixed).
    const outsider = createMockHost({
      grants: ['db:read:trips'],
      actingUserId: 99,
      trips: { 1: { members: [42], data: { id: 1, name: 'Japan' } } },
    });
    await expect(outsider.ctx.trips.getById(1, 42)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('returns canned db.query results + records logs', async () => {
    const { ctx, logs } = createMockHost({ grants: ['db:own'], queryResults: { 'SELECT 1': [{ n: 1 }] } });
    expect(await ctx.db.query('SELECT 1')).toEqual([{ n: 1 }]);
    ctx.log.info('hi');
    expect(logs).toEqual([{ level: 'info', msg: 'hi' }]);
  });

  it('gates costs reads/writes on the grant, addon, membership and edit permission', async () => {
    const { ctx } = createMockHost({
      grants: ['db:read:costs', 'db:write:costs'],
      actingUserId: 42,
      trips: {
        1: { members: [42], costs: [{ id: 5, name: 'Hotel' }] },
        2: { members: [42], costs: [{ id: 6, name: 'Food' }], canEditCosts: false },
      },
    });
    // read: trip-scoped + cross-trip aggregate
    expect(await ctx.costs.getByTrip(1)).toEqual([{ id: 5, name: 'Hotel' }]);
    expect(await ctx.costs.listMine()).toEqual([{ id: 5, name: 'Hotel' }, { id: 6, name: 'Food' }]);
    // write: allowed where the user may edit, refused where they may not
    expect(await ctx.costs.create(1, { name: 'Taxi' })).toMatchObject({ trip_id: 1, name: 'Taxi' });
    await expect(ctx.costs.create(2, { name: 'Nope' })).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    // update: edits an existing item where allowed, refused without edit permission
    expect(await ctx.costs.update(1, 5, { name: 'Hostel' })).toMatchObject({ id: 5, name: 'Hostel' });
    await expect(ctx.costs.update(2, 6, { name: 'Nope' })).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    // update: a missing item is refused
    await expect(ctx.costs.update(1, 999, { name: 'X' })).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    // delete: removes where allowed, refused without edit permission / when missing
    expect(await ctx.costs.delete(1, 5)).toEqual({ deleted: true });
    await expect(ctx.costs.delete(2, 6)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    await expect(ctx.costs.delete(1, 999)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('gates planner writes (places/days/itinerary/trips) on grant, membership and edit permission', async () => {
    const { ctx } = createMockHost({
      grants: ['db:write:places', 'db:write:days', 'db:write:itinerary', 'db:write:trips'],
      actingUserId: 42,
      trips: {
        1: { members: [42], data: { id: 1, title: 'Japan' } },
        2: { members: [42], canEditPlaces: false },
      },
    });
    // create + assign on a trip the user may edit
    const place = await ctx.places.create(1, { name: 'Fushimi Inari' });
    expect(place).toMatchObject({ trip_id: 1, name: 'Fushimi Inari' });
    const day = await ctx.days.create(1, { notes: 'Day 1' });
    expect(await ctx.itinerary.assign(1, (day as { id: number }).id, (place as { id: number }).id))
      .toMatchObject({ day_id: (day as { id: number }).id });
    expect(await ctx.trips.update(1, { title: 'Renamed' })).toMatchObject({ title: 'Renamed' });
    // refused where the user may not edit
    await expect(ctx.places.create(2, { name: 'Nope' })).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('refuses a planner write without the matching write scope', async () => {
    const { ctx } = createMockHost({ grants: ['db:read:trips'], actingUserId: 42, trips: { 1: { members: [42] } } });
    await expect(ctx.places.create(1, { name: 'X' })).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('ctx.meta stores/reads/lists/deletes namespaced metadata, gated on db:meta', async () => {
    const { ctx } = createMockHost({ grants: ['db:meta'], actingUserId: 42, trips: { 1: { members: [42] } } });
    await ctx.meta.set('trip', 1, 'rating', 5);
    expect(await ctx.meta.get('trip', 1, 'rating')).toBe(5);
    expect(await ctx.meta.list('trip', 1)).toEqual({ rating: 5 });
    expect(await ctx.meta.delete('trip', 1, 'rating')).toEqual({ deleted: true });
    expect(await ctx.meta.get('trip', 1, 'rating')).toBe(null);
    const ungranted = createMockHost({ grants: [], actingUserId: 42, trips: { 1: { members: [42] } } });
    await expect(ungranted.ctx.meta.get('trip', 1, 'x')).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('serves days + accommodations from the trip fixture and creates lodging blocks', async () => {
    const { ctx } = createMockHost({
      grants: ['db:read:trips', 'db:write:accommodations'],
      actingUserId: 42,
      trips: {
        1: {
          members: [42],
          days: [{ id: 1, date: '2026-07-01' }, { id: 2, date: '2026-07-02' }],
          accommodations: [{ id: 9, place_id: 3, start_day_id: 1, end_day_id: 2 }],
        },
      },
    });
    expect(await ctx.trips.getDays(1)).toEqual([{ id: 1, date: '2026-07-01' }, { id: 2, date: '2026-07-02' }]);
    expect(await ctx.trips.getAccommodations(1)).toHaveLength(1);
    const created = await ctx.accommodations.create(1, { place_id: 7, start_day_id: 1, end_day_id: 2 });
    expect(created).toMatchObject({ trip_id: 1, place_id: 7 });
    expect(await ctx.trips.getAccommodations(1)).toHaveLength(2);
    // ungranted read stays refused
    const ungranted = createMockHost({ grants: [], actingUserId: 42, trips: { 1: { members: [42] } } });
    await expect(ungranted.ctx.trips.getDays(1)).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('removeMember + journey create/delete round out the write symmetry, grant-gated', async () => {
    const host = createMockHost({
      grants: ['db:write:members', 'db:write:journal'],
      actingUserId: 42,
      trips: { 1: { members: [42, 7] } },
    });
    expect(await host.ctx.trips.removeMember(1, 7)).toEqual({ removed: true });
    expect(await host.ctx.trips.removeMember(1, 999)).toEqual({ removed: true }); // prod's DELETE reports removed:true either way
    const j = await host.ctx.journal.createJourney({ title: 'Imported', trip_ids: [1] });
    expect(j).toMatchObject({ title: 'Imported' });
    expect(await host.ctx.journal.deleteJourney(1)).toEqual({ deleted: true });
    // grants enforced identically to production
    const ungranted = createMockHost({ grants: [], actingUserId: 42, trips: { 1: { members: [42, 7] } } });
    await expect(ungranted.ctx.trips.removeMember(1, 7)).rejects.toThrow(/PERMISSION_DENIED/);
    await expect(ungranted.ctx.journal.createJourney({ title: 'x' })).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('creates a trip for the acting user and serves rates + collab reads against the grants', async () => {
    const { ctx } = createMockHost({
      grants: ['db:create:trips', 'rates:read', 'db:read:collab'],
      actingUserId: 42,
      trips: { 1: { members: [42], notes: [{ id: 1, title: 'Museum tips' }] } },
      ratesResult: { USD: 1.08, GBP: 0.85 },
    });
    expect(await ctx.trips.create({ title: 'Japan 2027', currency: 'JPY' })).toMatchObject({ title: 'Japan 2027', user_id: 42 });
    expect(await ctx.collab.listNotes(1)).toEqual([{ id: 1, title: 'Museum tips' }]);
    expect(await ctx.rates.get('EUR')).toEqual({ USD: 1.08, GBP: 0.85 });
    // ungranted capability (file content) stays refused
    await expect(ctx.files.getContent(1, 1)).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('serves file bytes via files.getContent under db:read:files:content', async () => {
    const content = Buffer.from('voucher bytes').toString('base64');
    const { ctx } = createMockHost({
      grants: ['db:read:files:content'],
      actingUserId: 42,
      trips: { 1: { members: [42], files: [{ id: 3, name: 'voucher.pdf', mimetype: 'application/pdf', content_base64: content }] } },
    });
    expect(await ctx.files.getContent(1, 3)).toEqual({ name: 'voucher.pdf', mimetype: 'application/pdf', size: 13, content_base64: content });
    await expect(ctx.files.getContent(1, 99)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('refuses costs when the permission is missing or the addon is disabled', async () => {
    const ungranted = createMockHost({ grants: [], actingUserId: 42, trips: { 1: { members: [42] } } });
    await expect(ungranted.ctx.costs.getByTrip(1)).rejects.toThrow(/PERMISSION_DENIED/);

    const addonOff = createMockHost({
      grants: ['db:read:costs'],
      actingUserId: 42,
      budgetAddonEnabled: false,
      trips: { 1: { members: [42], costs: [] } },
    });
    await expect(addonOff.ctx.costs.getByTrip(1)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('host.run drives the plugin\'s own handlers (route, job, scheduled, event, GDPR, hook)', async () => {
    const seen: string[] = [];
    const def = definePlugin({
      routes: [{ method: 'GET', path: '/ping', async handler(req) { return { status: 200, body: { user: req.user?.id } }; } }],
      jobs: [{ id: 'refresh', schedule: '* * * * *', async handler() { seen.push('job'); } }],
      async scheduled({ name, payload }) { seen.push(`sched:${name}:${JSON.stringify(payload)}`); },
      events: [{ on: 'place:created', handler(p) { seen.push(`evt:${p.event}:${p.entityId}`); } }],
      async deleteUserData({ userId }) { seen.push(`del:${userId}`); },
      async exportUserData({ userId }) { return { userId, rows: 2 }; },
      hooks: { tripCardProvider: { async getCards(tripIds) { return tripIds.map((id) => ({ tripId: id, id: 'b', label: 'X' })); } } },
    });
    const host = createMockHost({ grants: ['jobs:run', 'hook:trip-card-provider'], actingUserId: 7 });
    const d = host.run(def);

    const res = await d.route({ method: 'GET', path: '/ping' });
    expect(res).toEqual({ status: 200, body: { user: 7 } });
    await d.job('refresh');
    await d.scheduled('daily', { x: 1 });
    await d.event('place:created', { tripId: 1, entity: 'place', entityId: 9 });
    await d.deleteUserData(42);
    expect(await d.exportUserData(42)).toEqual({ userId: 42, rows: 2 });
    expect(await d.hook('tripCardProvider', 'getCards', [1, 2])).toEqual([
      { tripId: 1, id: 'b', label: 'X' }, { tripId: 2, id: 'b', label: 'X' },
    ]);
    expect(seen).toEqual(['job', 'sched:daily:{"x":1}', 'evt:place:created:9', 'del:42']);

    // missing handlers / unknown ids throw a clear error, not a silent no-op
    await expect(d.job('nope')).rejects.toThrow(/no job/);
    await expect(host.run(definePlugin({})).scheduled('x')).rejects.toThrow(/no scheduled handler/);
  });

  it('exposes the scheduler timers a plugin armed via ctx.scheduler', async () => {
    const def = definePlugin({ async onLoad(ctx) { await ctx.scheduler.every(3_600_000, 'sync', { n: 1 }); } });
    const host = createMockHost({ grants: ['jobs:run'] });
    await host.run(def).load();
    expect(host.scheduled.get('sync')).toMatchObject({ everyMs: 3_600_000, payload: { n: 1 } });
  });

  it('runs jobs USERLESS like production — a membership read refuses, the same read from a route works', async () => {
    const seen: string[] = [];
    const def = definePlugin({
      jobs: [{ id: 'sync', schedule: '* * * * *', async handler(ctx) {
        try { await ctx.trips.getById(1); seen.push('read-ok'); } catch (e) { seen.push((e as Error).message.split(':')[0]); }
      } }],
      routes: [{ method: 'GET', path: '/t', async handler(_req, ctx) { return { status: 200, body: await ctx.trips.getById(1) }; } }],
    });
    const host = createMockHost({ grants: ['db:read:trips', 'jobs:run'], actingUserId: 42, trips: { 1: { members: [42], data: { id: 1 } } } });
    const d = host.run(def);
    await d.job('sync');
    expect(seen).toEqual(['RESOURCE_FORBIDDEN']);
    expect(await d.route(0)).toEqual({ status: 200, body: { id: 1 } });
  });

  it('notify.send strips emojis and enforces the host caps + in-app link rule', async () => {
    const host = createMockHost({ grants: ['notify:send'], actingUserId: 7, trips: { 1: { members: [7] } } });
    await expect(host.ctx.notify.send({ title: '🎉🎉', body: 'x', scope: 'user', targetId: 7 })).rejects.toThrow(/title is required/);
    await expect(host.ctx.notify.send({ title: 't', body: 'x'.repeat(1001), scope: 'user', targetId: 7 })).rejects.toThrow(/max 1000/);
    await expect(host.ctx.notify.send({ title: 't', body: 'b', scope: 'user', targetId: 7, link: 'https://evil.example' })).rejects.toThrow(/in-app path/);
    await host.ctx.notify.send({ title: 'Trip 🎉 ready', body: 'b', scope: 'trip', targetId: 1, link: '/trips/1' });
    expect(host.notifications).toEqual([{ title: 'Trip ready', body: 'b', link: '/trips/1', scope: 'trip', targetId: 1 }]);
  });

  it('db guards match the host: forbidden statements, tx control, op cap', async () => {
    const { ctx } = createMockHost({ grants: ['db:own'] });
    await expect(ctx.db.query('PRAGMA user_version')).rejects.toThrow(/not allowed/);
    await expect(ctx.db.tx([{ sql: '  COMMIT' }])).rejects.toThrow(/transaction-control/);
    await expect(ctx.db.tx([{ sql: '/* x */ROLLBACK' }])).rejects.toThrow(/transaction-control/);
    await expect(ctx.db.tx(Array.from({ length: 101 }, () => ({ sql: 'SELECT 1' })))).rejects.toThrow(/at most 100/);
  });

  it('member writes need member_manage + protect the owner; users.getById serves only public fields', async () => {
    const host = createMockHost({
      grants: ['db:write:members', 'db:read:users'],
      actingUserId: 42,
      users: { 7: { id: 7, username: 'ada', email: 'secret@example.com' }, 42: { id: 42, username: 'me' } },
      trips: { 1: { members: [42, 7], data: { id: 1, user_id: 42 } }, 2: { members: [42], can: { member_manage: false } } },
    });
    await expect(host.ctx.trips.removeMember(1, 42)).rejects.toThrow(/trip owner/);
    await expect(host.ctx.trips.addMember(2, 7)).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    await expect(host.ctx.trips.addMember(1, 999)).rejects.toThrow(/no user 999/);
    const u = await host.ctx.users.getById(7) as Record<string, unknown>;
    expect(u).toMatchObject({ id: 7, username: 'ada' });
    expect('email' in u).toBe(false);
    await expect(host.ctx.users.getById(999)).rejects.toThrow(/no access to user 999/); // no shared trip
  });

  it('addon toggles gate journal/vacay/collections like production; atlas normalizes codes', async () => {
    const off = createMockHost({
      grants: ['db:read:journal', 'db:read:atlas', 'db:write:atlas', 'db:read:vacay', 'db:read:collections'],
      actingUserId: 1,
      journeyAddonEnabled: false, vacayAddonEnabled: false, collectionsAddonEnabled: false,
    });
    await expect(off.ctx.journal.listMine()).rejects.toThrow(/journey addon is disabled/);
    await expect(off.ctx.vacay.mine()).rejects.toThrow(/vacay addon is disabled/);
    await expect(off.ctx.collections.listMine()).rejects.toThrow(/collections addon is disabled/);
    expect(await off.ctx.atlas.markCountry('de')).toEqual({ visited: true }); // atlas stays enabled
    expect(await off.ctx.atlas.visited()).toMatchObject({ countries: ['DE'] });
    await expect(off.ctx.atlas.markCountry('not-a-code!')).rejects.toThrow(/short code/);
  });

  it('scheduler refuses a non-finite or >1-year dueAt, like the host', async () => {
    const { ctx } = createMockHost({ grants: ['jobs:run'] });
    await expect(ctx.scheduler.at(Number.NaN, 'x')).rejects.toThrow(/dueAt out of range/);
    await expect(ctx.scheduler.at(Date.now() + 400 * 24 * 3600 * 1000, 'x')).rejects.toThrow(/dueAt out of range/);
    await expect(ctx.scheduler.every(1000, 'x')).rejects.toThrow(/>= 60000/);
  });

  it('declaredEmits drops an undeclared emit with a warning — production refuses it', () => {
    const host = createMockHost({ declaredEmits: ['rate.updated'] });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      host.ctx.events.emit('rate.updated', { a: 1 });
      host.ctx.events.emit('undeclared.event', {});
      expect(warn).toHaveBeenCalledOnce();
    } finally { warn.mockRestore(); }
    expect(host.emitted).toEqual([{ name: 'rate.updated', payload: { a: 1 } }]);
  });
});

describe('scaffold + validate CLIs', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('scaffolds a widget plugin that then validates (with README warnings)', () => {
    scaffold('my-widget', 'widget', tmp);
    const dir = path.join(tmp, 'my-widget');
    expect(fs.existsSync(path.join(dir, 'trek-plugin.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'server', 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'client', 'index.html'))).toBe(true);

    const r = validatePluginDir(dir);
    expect(r.ok).toBe(true); // manifest + files valid
    expect(r.warnings.some((w) => /placeholder|screenshot/.test(w))).toBe(true); // README is the unfilled template
  });

  it('scaffolds a client that opts into the design kit via the marker (source stays one line)', () => {
    scaffold('kit-plug', 'widget', tmp);
    const html = fs.readFileSync(path.join(tmp, 'kit-plug', 'client', 'index.html'), 'utf8');
    expect(html).toContain('<!-- trek:ui -->'); // the one-line opt-in
    expect(html).toContain('trek.onContext');   // uses the bridge the marker installs
    expect(html).not.toContain('--glass-bg');    // kit is NOT pre-inlined in the source
  });

  it('scaffolds a trip-page plugin (a tab inside the trip) with a client UI', () => {
    scaffold('trip-diary', 'trip-page', tmp);
    const dir = path.join(tmp, 'trip-diary');
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'trek-plugin.json'), 'utf8'));
    expect(m.type).toBe('trip-page');
    expect(fs.existsSync(path.join(dir, 'client', 'index.html'))).toBe(true); // non-integration → gets a UI
    expect(validatePluginDir(dir).ok).toBe(true);
  });

  it('pack expands the design-kit marker into the archived client HTML', () => {
    scaffold('kit-plug', 'widget', tmp);
    const out = path.join(tmp, 'kit-plug.zip');
    packPluginDir(path.join(tmp, 'kit-plug'), out);
    const html = readZip(fs.readFileSync(out))['client/index.html'].toString('utf8');
    expect(html).not.toContain('<!-- trek:ui -->'); // expanded away
    expect(html).toContain('.trek-glass');          // kit CSS inlined
    expect(html).toContain('window.trek');          // bridge inlined
  });

  it('scaffolds a CommonJS package.json with the SDK as a devDependency only', () => {
    scaffold('my-widget', 'widget', tmp);
    const pkg = JSON.parse(fs.readFileSync(path.join(tmp, 'my-widget', 'package.json'), 'utf8'));
    expect(pkg.type).toBe('commonjs');
    expect(pkg.private).toBe(true);
    expect(pkg.devDependencies['trek-plugin-sdk']).toMatch(/^\^\d/);
    expect(pkg.dependencies).toBeUndefined(); // runtime deps are the author's call; the SDK never is one
  });

  it('applies author, description, and permissions from options', () => {
    scaffold('opt-plug', 'integration', tmp, { author: 'Jane', description: 'Does X', permissions: ['db:own', 'db:read:trips'] });
    const m = JSON.parse(fs.readFileSync(path.join(tmp, 'opt-plug', 'trek-plugin.json'), 'utf8'));
    expect(m.author).toBe('Jane');
    expect(m.description).toBe('Does X');
    expect(m.permissions).toEqual(['db:own', 'db:read:trips']);
  });

  it('rejects an invalid plugin name', () => {
    expect(() => scaffold('Bad Name', 'widget', tmp)).toThrow(/invalid plugin id/);
  });

  it('tolerates a UTF-8 BOM in trek-plugin.json (Windows editors add one)', () => {
    scaffold('bom-plug', 'integration', tmp);
    const mp = path.join(tmp, 'bom-plug', 'trek-plugin.json');
    fs.writeFileSync(mp, '\uFEFF' + fs.readFileSync(mp, 'utf8'));
    expect(validatePluginDir(path.join(tmp, 'bom-plug')).ok).toBe(true);
  });

  it('validatePluginDir flags a missing manifest', () => {
    expect(validatePluginDir(tmp).ok).toBe(false);
  });
});

describe('dev-server SDK injection', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inject-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('makes require(trek-plugin-sdk) resolve from the package itself — no npm install', async () => {
    const { installSdkInjection } = await import('../src/cli/dev.js');
    const { createRequire } = await import('node:module');
    installSdkInjection();
    // A scaffold-shaped CJS entry that requires the SDK without any node_modules.
    // The injected surface must MATCH the prod child shim: definePlugin +
    // PLUGIN_API_VERSION only, subpaths throw the same pointed error.
    fs.writeFileSync(path.join(tmp, 'entry.cjs'),
      "const sdkShim = require('trek-plugin-sdk');\n" +
      "let testingError = '';\n" +
      "try { require('trek-plugin-sdk/testing'); } catch (e) { testingError = e.message; }\n" +
      'module.exports = { def: sdkShim.definePlugin({ routes: [] }), api: sdkShim.PLUGIN_API_VERSION, keys: Object.keys(sdkShim).sort(), testingError };\n');
    const req = createRequire(path.join(tmp, 'entry.cjs'));
    const mod = req(path.join(tmp, 'entry.cjs')) as { def: unknown; api: number; keys: string[]; testingError: string };
    expect(mod.def).toEqual({ routes: [] });
    expect(mod.api).toBe(1);
    expect(mod.keys).toEqual(['PLUGIN_API_VERSION', 'definePlugin']); // prod parity — no dev-only extras
    expect(mod.testingError).toMatch(/build\/test-time/);
  });
});

describe('dev db bind shapes', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devdb-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  // Without node:sqlite (Node < 22.5) createDevDb falls back to the [] stub and
  // there is no bind behaviour to test.
  const hasNodeSqlite = (() => {
    try { createRequire(import.meta.url)('node:sqlite'); return true; } catch { return false; }
  })();

  it.runIf(hasNodeSqlite)('accepts spread args AND a single array of them, like the real host', async () => {
    const { createDevDb } = await import('../src/cli/dev.js');
    const { db, close } = createDevDb(path.join(tmp, 'db.sqlite'));
    try {
      await db.migrate('001', 'CREATE TABLE kv (k TEXT PRIMARY KEY, v TEXT)');
      await db.exec('INSERT INTO kv (k, v) VALUES (?, ?)', ['a', '1']); // array form (better-sqlite3 style)
      await db.exec('INSERT INTO kv (k, v) VALUES (?, ?)', 'b', '2'); // spread form
      expect(await db.query('SELECT v FROM kv WHERE k = ?', ['a'])).toEqual([{ v: '1' }]);
      expect(await db.query('SELECT v FROM kv WHERE k = ?', 'b')).toEqual([{ v: '2' }]);
    } finally {
      close();
    }
  });

  it.runIf(hasNodeSqlite)('refuses the statements the real host forbids for plugin databases', async () => {
    const { createDevDb } = await import('../src/cli/dev.js');
    const { db, close } = createDevDb(path.join(tmp, 'db.sqlite'));
    try {
      await expect(db.query('PRAGMA user_version')).rejects.toThrow(/not allowed/);
      await expect(db.exec("ATTACH DATABASE 'x' AS y")).rejects.toThrow(/not allowed/);
      await expect(db.migrate('001', 'PRAGMA journal_mode = OFF')).rejects.toThrow(/not allowed/);
    } finally {
      close();
    }
  });
});

describe('reference plugin (examples/koffi)', () => {
  const dir = path.resolve(import.meta.dirname, '..', 'examples', 'koffi');

  it('passes the same validation authors run', () => {
    const r = validatePluginDir(dir);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('has a valid, minimal-permission hero-widget manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'trek-plugin.json'), 'utf8')) as {
      capabilities?: { widget?: { slot?: string } };
    };
    const res = validateManifest(manifest);
    expect(res.ok).toBe(true);
    expect(res.manifest?.permissions).toEqual(['db:read:trips']);
    expect(manifest.capabilities?.widget?.slot).toBe('hero');
  });
});

describe('makeZip', () => {
  it('round-trips through a central-directory reader (installer-compatible)', () => {
    const files = [
      { name: 'trek-plugin.json', data: Buffer.from('{"id":"x"}') },
      { name: 'server/index.js', data: Buffer.from('module.exports={}\n'.repeat(200)) },
    ];
    const zip = makeZip(files);
    expect(zip.subarray(0, 2).toString()).toBe('PK'); // local file header magic
    const back = readZip(zip);
    expect(Object.keys(back).sort()).toEqual(['server/index.js', 'trek-plugin.json']);
    expect(back['trek-plugin.json'].toString()).toBe('{"id":"x"}');
    expect(back['server/index.js'].length).toBe(files[1].data.length);
  });
});

describe('pack + entry (publishing automation)', () => {
  const koffi = path.resolve(import.meta.dirname, '..', 'examples', 'koffi');
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('packs the canonical layout, excludes docs/, and reports sha256 + size', () => {
    const out = path.join(tmp, 'plugin.zip');
    const r = packPluginDir(koffi, out);
    expect(r.files).toEqual(['README.md', 'client/index.html', 'server/index.js', 'trek-plugin.json']);
    expect(r.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.size).toBeGreaterThan(0);
    const back = readZip(fs.readFileSync(out));
    expect(back['trek-plugin.json']).toBeTruthy();
    expect(Object.keys(back).some((n) => n.startsWith('docs/'))).toBe(false); // screenshot served from repo, not shipped
  });

  it('refuses a plugin that ships a native binary', () => {
    const bad = path.join(tmp, 'bad');
    fs.mkdirSync(path.join(bad, 'server'), { recursive: true });
    fs.writeFileSync(path.join(bad, 'trek-plugin.json'), JSON.stringify({ id: 'bad-plug', name: 'Bad', version: '1.0.0', type: 'integration', permissions: [], egress: [] }));
    fs.writeFileSync(path.join(bad, 'server', 'index.js'), 'module.exports={}');
    fs.writeFileSync(path.join(bad, 'server', 'thing.node'), Buffer.from([1, 2, 3]));
    fs.writeFileSync(path.join(bad, 'README.md'), '# Bad\n![x](x.png)\ncontent');
    expect(() => packPluginDir(bad, path.join(tmp, 'x.zip'))).toThrow(/native binaries/);
  });

  it('builds a registry entry with sha256/size/commit/minTrekVersion filled in', () => {
    const out = path.join(tmp, 'plugin.zip');
    const packed = packPluginDir(koffi, out);
    const entry = buildEntry({
      dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.0.0', zipPath: out,
      commit: 'a'.repeat(40), now: '2026-07-04T00:00:00.000Z',
    });
    expect(entry.id).toBe('koffi');
    expect(entry.type).toBe('widget');
    const v = entry.versions[0];
    expect(v.sha256).toBe(packed.sha256);
    expect(v.size).toBe(packed.size);
    expect(v.commitSha).toBe('a'.repeat(40));
    expect(v.minTrekVersion).toBe('3.2.0');
    expect(v.downloadUrl).toBe('https://github.com/mauriceboe/trek-plugin-koffi/releases/download/v1.0.0/plugin.zip');
    expect(v.nativeModules).toBe(false);
  });

  it('--merge prepends the new version onto an existing entry, newest-first', () => {
    const out = path.join(tmp, 'plugin.zip');
    packPluginDir(koffi, out);
    const existingPath = path.join(tmp, 'koffi.json');
    fs.writeFileSync(existingPath, JSON.stringify({
      id: 'koffi', name: 'Koffi', author: 'TREK', description: 'x', repo: 'mauriceboe/trek-plugin-koffi', type: 'widget',
      versions: [{ version: '0.9.0', gitTag: 'v0.9.0', commitSha: 'b'.repeat(40), downloadUrl: 'https://github.com/x/y/releases/download/v0.9.0/plugin.zip', sha256: 'c'.repeat(64), minTrekVersion: '3.2.0', size: 10, apiVersion: 1, nativeModules: false, publishedAt: '2026-01-01T00:00:00.000Z' }],
    }));
    const merged = buildEntry({
      dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.0.0', zipPath: out,
      commit: 'a'.repeat(40), mergePath: existingPath, now: '2026-07-04T00:00:00.000Z',
    });
    expect(merged.versions.map((v) => v.version)).toEqual(['1.0.0', '0.9.0']);
  });
});

describe('listZipNames', () => {
  it('lists central-directory entries of a makeZip archive', () => {
    const zip = makeZip([{ name: 'a.js', data: Buffer.from('x') }, { name: 'server/b.js', data: Buffer.from('y'.repeat(100)) }]);
    expect(listZipNames(zip).sort()).toEqual(['a.js', 'server/b.js']);
  });
});

describe('sign + keygen (author signatures, TOFU)', () => {
  const koffi = path.resolve(import.meta.dirname, '..', 'examples', 'koffi');
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sign-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('keygen writes a private key and returns a schema-length public key', () => {
    const keyPath = path.join(tmp, 'k.pem');
    const { publicKey } = generateKeypair(keyPath);
    expect(fs.existsSync(keyPath)).toBe(true);
    expect(publicKey.length).toBeGreaterThanOrEqual(40); // registry schema minLength
    expect(() => generateKeypair(keyPath)).toThrow(/already exists/); // never clobbers a key
  });

  it('a signature round-trips through the server-shaped verifier', () => {
    const keyPath = path.join(tmp, 'k.pem');
    generateKeypair(keyPath);
    const key = loadPrivateKey(keyPath);
    const bytes = Buffer.from('the exact plugin.zip bytes ' + 'x'.repeat(60));
    const sig = signArtifact(bytes, key);
    expect(sig.length).toBeGreaterThanOrEqual(40);
    expect(verifyArtifact(bytes, sig, publicKeyBase64(key))).toBe(true);
    expect(verifyArtifact(Buffer.concat([bytes, Buffer.from('!')]), sig, publicKeyBase64(key))).toBe(false);
  });

  it('entry --sign fills signature + authorPublicKey that verify against the artifact', () => {
    const out = path.join(tmp, 'plugin.zip');
    packPluginDir(koffi, out);
    const keyPath = path.join(tmp, 'k.pem');
    const { publicKey } = generateKeypair(keyPath);
    const entry = buildEntry({ dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.0.0', zipPath: out, commit: 'a'.repeat(40), signKeyPath: keyPath, now: '2026-07-04T00:00:00.000Z' });
    expect(entry.authorPublicKey).toBe(publicKey);
    const sig = entry.versions[0].signature;
    expect(sig).toBeTruthy();
    expect(verifyArtifact(fs.readFileSync(out), sig!, entry.authorPublicKey!)).toBe(true);
  });

  it('refuses to sign an update with a different key than the one already published', () => {
    const out = path.join(tmp, 'plugin.zip');
    packPluginDir(koffi, out);
    const key1 = path.join(tmp, 'k1.pem');
    generateKeypair(key1);
    const existing = buildEntry({ dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.0.0', zipPath: out, commit: 'a'.repeat(40), signKeyPath: key1, now: '2026-07-04T00:00:00.000Z' });
    const existingPath = path.join(tmp, 'koffi.json');
    fs.writeFileSync(existingPath, JSON.stringify({ ...existing, versions: existing.versions.map((v) => ({ ...v, version: '0.9.0', gitTag: 'v0.9.0' })) }));
    const key2 = path.join(tmp, 'k2.pem');
    generateKeypair(key2);
    expect(() => buildEntry({ dir: koffi, repo: 'mauriceboe/trek-plugin-koffi', tag: 'v1.1.0', zipPath: out, commit: 'a'.repeat(40), mergePath: existingPath, signKeyPath: key2, now: '2026-07-04T00:00:00.000Z' })).toThrow(/differs from the one already published/);
  });
});

describe('mock-host inter-plugin (plugins.call + events.emit)', () => {
  it('calls a configured dependency export and records the call', async () => {
    const { ctx, calls } = createMockHost({
      pluginExports: { 'dep-lib': { greet: (args: any) => ({ hi: args?.who }) } },
    });
    const r = await ctx.plugins.call('dep-lib', 'greet', { who: 'ada' });
    expect(r).toEqual({ hi: 'ada' });
    expect(calls.some((c) => c.method === 'plugins.call')).toBe(true);
  });

  it('throws RESOURCE_FORBIDDEN calling an export that is not configured', async () => {
    const { ctx } = createMockHost({ pluginExports: { 'dep-lib': {} } });
    await expect(ctx.plugins.call('dep-lib', 'nope', {})).rejects.toThrow(/RESOURCE_FORBIDDEN/);
    await expect(ctx.plugins.call('other', 'greet', {})).rejects.toThrow(/RESOURCE_FORBIDDEN/);
  });

  it('records emitted events', () => {
    const { ctx, emitted } = createMockHost({});
    ctx.events.emit('rate.updated', { pair: 'USD/EUR' });
    expect(emitted).toEqual([{ name: 'rate.updated', payload: { pair: 'USD/EUR' } }]);
  });
});

describe('validateManifest capabilities.provides/emits', () => {
  const base = { id: 'my-plug', name: 'My Plug', version: '1.0.0', type: 'integration', permissions: ['db:own'] };
  it('accepts well-formed provides + emits', () => {
    const r = validateManifest({ ...base, capabilities: { provides: ['computeRate'], emits: ['rate.updated'] } });
    expect(r.ok).toBe(true);
  });
  it('rejects a malformed export/event name and a non-array', () => {
    expect(validateManifest({ ...base, capabilities: { provides: ['bad name!'] } }).ok).toBe(false);
    expect(validateManifest({ ...base, capabilities: { emits: 'nope' } }).ok).toBe(false);
  });
});
