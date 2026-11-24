/**
 * The demo addon policy: which addons, providers and addon switches a demo
 * instance runs with, and that the seed and the hourly reset both put them back.
 *
 * The lists are explicit on purpose, so a release that adds an addon has to say
 * whether a demo shows it: DEMOPOL-001 fails on a seeded row that is in neither
 * list, and on a listed id the database does not hold.
 */
import { Addons } from '../../../src/db/entities/Addons.entity';
import { DocumentProviders } from '../../../src/db/entities/DocumentProviders.entity';
import { PhotoProviders } from '../../../src/db/entities/PhotoProviders.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { DEMO_ADDON_POLICY } from '../../../src/demo/demo-addon-policy';
import { resetDemoUser } from '../../../src/demo/demo-reset';
import { seedDemoData } from '../../../src/demo/demo-seed';
import type { DatabaseBackupStrategy } from '../../../src/nest/database/database-backup.interface';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { readAppSetting, readUserSetting, setAppSetting, setUserSetting } from '../../helpers/factories/settings';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import type Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const BASELINE = path.resolve(__dirname, '..', '..', '..', 'data', 'travel-baseline.db');

let db: Database.Database;
let t: TestOrm;

beforeEach(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  db = createSnapshotTestDb();
  t = await createTestOrm(db);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await t.close();
  db.close();
});

const seed = () => withRequestContext(t.orm, () => seedDemoData());

async function enabledIds(entity: typeof Addons | typeof PhotoProviders | typeof DocumentProviders) {
  const rows = (await findRows(t, entity as typeof Addons)) as { id: string; enabled: unknown }[];
  return {
    on: rows
      .filter((r) => !!r.enabled)
      .map((r) => r.id)
      .sort(),
    off: rows
      .filter((r) => !r.enabled)
      .map((r) => r.id)
      .sort(),
  };
}

const sorted = (ids: readonly string[]) => [...ids].sort();

/** What an admin of a demo instance might have switched during the hour. */
async function scramble(): Promise<void> {
  await updateRows(t, Addons, { id: 'airtrail' }, { enabled: true });
  await updateRows(t, Addons, { id: 'packing' }, { enabled: false });
  await updateRows(t, Addons, { id: 'journey' }, { enabled: false });
  await updateRows(t, PhotoProviders, { id: 'immich' }, { enabled: 1 });
  await updateRows(t, DocumentProviders, { id: 'paperless' }, { enabled: 1 });
  await setAppSetting(t, 'tours_wanderer_enabled', 'true');
  await setAppSetting(t, 'collab_chat_enabled', 'false');
}

async function expectPolicyApplied(): Promise<void> {
  expect(await enabledIds(Addons)).toEqual({
    on: sorted(DEMO_ADDON_POLICY.addons.on),
    off: sorted(DEMO_ADDON_POLICY.addons.off),
  });
  expect(await enabledIds(PhotoProviders)).toEqual({ on: [], off: sorted(DEMO_ADDON_POLICY.photoProviders.off) });
  expect(await enabledIds(DocumentProviders)).toEqual({
    on: [],
    off: sorted(DEMO_ADDON_POLICY.documentProviders.off),
  });
  const keys = Object.keys(DEMO_ADDON_POLICY.appSettings);
  const values = await Promise.all(keys.map((key) => readAppSetting(t, key)));
  expect(Object.fromEntries(keys.map((key, i) => [key, values[i]]))).toEqual(DEMO_ADDON_POLICY.appSettings);
}

describe('demo addon policy', () => {
  it('DEMOPOL-001: names every seeded addon and provider exactly once, and nothing the database lacks', async () => {
    const shelves = [
      [Addons, DEMO_ADDON_POLICY.addons],
      [PhotoProviders, DEMO_ADDON_POLICY.photoProviders],
      [DocumentProviders, DEMO_ADDON_POLICY.documentProviders],
    ] as const;
    const seeded = await Promise.all(shelves.map(([entity]) => findRows(t, entity as typeof Addons)));
    shelves.forEach(([, shelf], i) => {
      const listed = [...shelf.on, ...shelf.off];
      expect(new Set(listed).size).toBe(listed.length);
      expect(sorted(listed)).toEqual(seeded[i].map((r) => r.id).sort());
    });
  });

  it('DEMOPOL-002: keeps off exactly what reaches a server of the visitor’s own, the AI features, MCP and the legacy Photos row', () => {
    expect(sorted(DEMO_ADDON_POLICY.addons.off)).toEqual([
      'ai_assistant',
      'airtrail',
      'dawarich',
      'llm_parsing',
      'mcp',
      'memories',
    ]);
    expect(sorted(DEMO_ADDON_POLICY.photoProviders.off)).toEqual(['immich', 'synologyphotos']);
    expect(sorted(DEMO_ADDON_POLICY.documentProviders.off)).toEqual(
      sorted(['paperless', 'papra', 'nextcloud', 'opencloud', 'synologydrive']),
    );
    expect(DEMO_ADDON_POLICY.appSettings.tours_wanderer_enabled).toBe('false');
    const otherSwitches = Object.entries(DEMO_ADDON_POLICY.appSettings).filter(
      ([key]) => key !== 'tours_wanderer_enabled',
    );
    expect(otherSwitches.every(([, value]) => value === 'true')).toBe(true);
  });

  it('DEMOPOL-003: the first demo boot puts the whole shelf to the demo set', async () => {
    await scramble();
    await seed();
    await expectPolicyApplied();
  });

  it('DEMOPOL-004: a later boot, with the example trips already there, puts it back again', async () => {
    await seed();
    await scramble();
    await seed();
    await expectPolicyApplied();
  });

  it('DEMOPOL-005: the demo account runs in English, whatever a visitor picked before', async () => {
    const { demoId } = await seed();
    await setUserSetting(t, demoId, 'language', 'de');
    await seed();
    expect(await readUserSetting(t, demoId, 'language')).toBe('en');
  });

  it('DEMOPOL-006: the admin account keeps the language it chose', async () => {
    const { adminId } = await seed();
    await setUserSetting(t, adminId, 'language', 'de');
    await seed();
    expect(await readUserSetting(t, adminId, 'language')).toBe('de');
  });
});

describe('demo addon policy across the hourly reset', () => {
  it('DEMOPOL-007: the reset puts the demo set back after the baseline swap, whatever the baseline held', async () => {
    await seed();
    vi.spyOn(fs, 'existsSync').mockImplementation(((p: fs.PathLike) => String(p) === BASELINE) as typeof fs.existsSync);
    // The stand-in swap brings back a baseline whose shelf an admin had changed.
    const database = {
      archiveEntry: 'travel.db',
      canSnapshot: () => true,
      checkCopy: vi.fn(async () => null),
      checkpoint: vi.fn(async () => undefined),
      replace: vi.fn(async () => {
        await scramble();
        return { reopenError: undefined };
      }),
    } as unknown as DatabaseBackupStrategy;

    await withRequestContext(t.orm, () => resetDemoUser(database));
    t.clear();

    expect(database.replace).toHaveBeenCalled();
    await expectPolicyApplied();
    expect(await findRow(t, Users, { email: 'demo@trek.app' })).not.toBeNull();
  });
});
