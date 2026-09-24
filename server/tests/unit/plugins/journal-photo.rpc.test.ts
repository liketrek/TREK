/**
 * journal.addEntryPhoto — the byte path a journal importer needs (#1365).
 *
 * A plugin holding an export archive has bytes and nothing else: no gallery photo
 * to link and no provider asset. These cases pin what the handler refuses before
 * it writes anything, and that a refused write leaves no object behind.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted above the imports, so the flag it reads has to be too.
// Only readEnv().demo is overridden: the module is shared, and replacing it
// wholesale takes defaultLanguage and the rest of the env with it.
const { demo } = vi.hoisted(() => ({ demo: { enabled: false } }));
vi.mock('../../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/app-config')>();
  return { ...actual, readEnv: () => ({ ...actual.readEnv(), demo }) };
});

import { JournalRpc } from '../../../src/nest/journey/journal.rpc';
import { DEMO_EMAIL_PRIMARY } from '../../../src/nest/common/demo';

const ACTOR = { actingUserId: 7 } as never;
const PNG = Buffer.from('89504e470d0a1a0a', 'hex').toString('base64');

function build(overrides: {
  addPhoto?: unknown;
  allowed?: string;
  demoEnabled?: boolean;
  email?: string;
} = {}) {
  // Typed parameters so the assertions below can index mock.calls.
  const put = vi.fn(async (_category: string, _filename: string, _body?: unknown, _opts?: unknown) => undefined);
  const del = vi.fn(async (_category: string, _filename: string) => undefined);
  const schedule = vi.fn();
  const addPhoto = vi.fn(overrides.addPhoto === undefined
    ? () => ({ id: 5, photo_id: 42 })
    : () => overrides.addPhoto);

  demo.enabled = overrides.demoEnabled ?? false;

  const rpc = new JournalRpc(
    { addPhoto } as never,
    { requireAddon: vi.fn() } as never,
    { put, delete: del } as never,
    { get: () => overrides.allowed ?? '*' } as never,
    { schedule } as never,
    { prepare: () => ({ get: () => ({ email: overrides.email ?? 'user@example.test' }) }) } as never,
  );
  return { rpc, put, del, schedule, addPhoto };
}

const input = (over: Record<string, unknown> = {}) => ({ name: 'photo.jpg', content_base64: PNG, ...over });

beforeEach(() => {
  demo.enabled = false;
});

describe('journal.addEntryPhoto', () => {
  it('JPHOTO-001: stores the bytes under a name of its own, then links the photo', async () => {
    const { rpc, put, schedule, addPhoto } = build();

    const photo = await rpc.addEntryPhoto({ entryId: 3, input: input({ caption: 'Tokyo' }) }, ACTOR);

    expect(photo).toEqual({ id: 5, photo_id: 42 });
    // Category and a generated filename: never the name the plugin sent, which
    // could otherwise collide with an existing gallery row on file_path.
    expect(put).toHaveBeenCalledTimes(1);
    const [category, filename] = put.mock.calls[0];
    expect(category).toBe('journey');
    expect(filename).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(addPhoto).toHaveBeenCalledWith(3, 7, `journey/${filename}`, undefined, 'Tokyo');
    expect(schedule).toHaveBeenCalledWith([42], 7);
  });

  it('JPHOTO-002: refuses an entry the acting user cannot edit, and removes the object it just wrote', async () => {
    // addPhoto answering null IS the access check: the entry is missing, or it
    // belongs to a journey this user may not edit.
    const { rpc, put, del } = build({ addPhoto: null });

    await expect(rpc.addEntryPhoto({ entryId: 3, input: input() }, ACTOR)).rejects.toThrow(/no editable journal entry 3/);
    expect(put).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith('journey', put.mock.calls[0][1]);
  });

  it('JPHOTO-003: refuses a name that is a path, and an extension that is not an image', async () => {
    const { rpc, put } = build();

    // basename() reduces this to 'evil.sh', which is not an image extension.
    await expect(rpc.addEntryPhoto({ entryId: 3, input: input({ name: '../../evil.sh' }) }, ACTOR))
      .rejects.toThrow(/not an allowed image type/);
    await expect(rpc.addEntryPhoto({ entryId: 3, input: input({ name: 'map.svg' }) }, ACTOR))
      .rejects.toThrow(/not an allowed image type/);
    await expect(rpc.addEntryPhoto({ entryId: 3, input: input({ name: 'noext' }) }, ACTOR))
      .rejects.toThrow(/not an allowed image type/);
    expect(put).not.toHaveBeenCalled();
  });

  it('JPHOTO-004: obeys the operator allowed-file-types setting, so the RPC is no way around it', async () => {
    const { rpc, put } = build({ allowed: 'png,pdf' });

    await expect(rpc.addEntryPhoto({ entryId: 3, input: input({ name: 'photo.jpg' }) }, ACTOR))
      .rejects.toThrow(/file type \.jpg is not allowed/);
    expect(put).not.toHaveBeenCalled();

    await expect(rpc.addEntryPhoto({ entryId: 3, input: input({ name: 'photo.png' }) }, ACTOR)).resolves.toBeTruthy();
  });

  it('JPHOTO-005: rejects an oversized payload before decoding it, and an empty one after', async () => {
    const { rpc, put } = build();

    // Encoded cap first: a 15MB string never becomes a 11MB buffer in memory.
    await expect(rpc.addEntryPhoto({ entryId: 3, input: input({ content_base64: 'A'.repeat(15 * 1024 * 1024) }) }, ACTOR))
      .rejects.toThrow(/invalid photo input/);
    await expect(rpc.addEntryPhoto({ entryId: 3, input: input({ content_base64: '@@@@' }) }, ACTOR))
      .rejects.toThrow(/photo content is empty/);
    expect(put).not.toHaveBeenCalled();
  });

  it('JPHOTO-006: rejects an entryId that is not a positive integer, and unknown input keys', async () => {
    const { rpc } = build();

    await expect(rpc.addEntryPhoto({ entryId: 1.5, input: input() }, ACTOR)).rejects.toThrow(/positive integer/);
    await expect(rpc.addEntryPhoto({ entryId: 0, input: input() }, ACTOR)).rejects.toThrow(/positive integer/);
    // strictObject: an unknown key is a mistake worth reporting, not ignoring.
    await expect(rpc.addEntryPhoto({ entryId: 3, input: input({ provider: 'immich' }) }, ACTOR))
      .rejects.toThrow(/invalid photo input/);
  });

  it('JPHOTO-007: refuses to write bytes for a demo user, exactly as the REST upload does', async () => {
    const { rpc, put } = build({ demoEnabled: true, email: DEMO_EMAIL_PRIMARY });

    await expect(rpc.addEntryPhoto({ entryId: 3, input: input() }, ACTOR)).rejects.toThrow(/disabled in demo mode/);
    expect(put).not.toHaveBeenCalled();
  });

  it('JPHOTO-008: a userless call never reaches storage', async () => {
    const { rpc, put } = build();

    await expect(rpc.addEntryPhoto({ entryId: 3, input: input() }, {} as never))
      .rejects.toThrow(/journal writes require an authenticated user context/);
    expect(put).not.toHaveBeenCalled();
  });
});
