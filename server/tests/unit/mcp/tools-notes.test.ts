/**
 * Unit tests for MCP note tools: create_day_note, update_day_note, delete_day_note
 * (DayNotesMcp, DI-discovered — attached via the nest-mcp registry inside
 * registerTools, so every harness here keeps withTools on) and
 * create_collab_note, update_collab_note, delete_collab_note (CollabMcp,
 * DI-discovered via the same registry).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { db as testDb } from '../../../src/db/database';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

const { broadcastMock, unlinkSyncMock } = vi.hoisted(() => ({
  broadcastMock: vi.fn(),
  unlinkSyncMock: vi.fn(),
}));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, unlinkSync: unlinkSyncMock };
});

import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createDay, createDayNote, createCollabNote } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { countRows, findRow, updateRows } from '../../helpers/factories/rows';
import { makeTripFile } from '../../helpers/factories/files';
import { CollabNotes } from '../../../src/db/entities/CollabNotes.entity';
import { DayNotes } from '../../../src/db/entities/DayNotes.entity';
import { TripFiles } from '../../../src/db/entities/TripFiles.entity';

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  unlinkSyncMock.mockClear();
  delete process.env.DEMO_MODE;
});

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

afterAll(async () => {
  await orm.close();
  testDb.close();
});

/** The stored day note; fails the case when it is gone. */
async function dayNote(id: number) {
  const row = await findRow(orm, DayNotes, { id });
  if (!row) throw new Error(`no day note ${id}`);
  return row;
}

/** The stored collab note; fails the case when it is gone. */
async function collabNote(id: number) {
  const row = await findRow(orm, CollabNotes, { id });
  if (!row) throw new Error(`no collab note ${id}`);
  return row;
}

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// create_day_note
// ---------------------------------------------------------------------------

describe('Tool: create_day_note', () => {
  it('creates a note on a day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day_note',
        arguments: { tripId: trip.id, dayId: day.id, text: 'Check in at noon', time: '12:00', icon: '🏨' },
      });
      const data = parseToolResult(result) as any;
      expect(data.note.text).toBe('Check in at noon');
      expect(data.note.time).toBe('12:00');
      expect(data.note.icon).toBe('🏨');
    });
  });

  it('defaults icon to 📝', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day_note',
        arguments: { tripId: trip.id, dayId: day.id, text: 'A note' },
      });
      const data = parseToolResult(result) as any;
      expect(data.note.icon).toBe('📝');
    });
  });

  it('broadcasts dayNote:created event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_day_note', arguments: { tripId: trip.id, dayId: day.id, text: 'Note' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'dayNote:created', expect.any(Object));
    });
  });

  it('persists a palette color and an explicit position', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day_note',
        arguments: { tripId: trip.id, dayId: day.id, text: 'Ferry leaves early', color: '#dc2626', sort_order: 2 },
      });
      const data = parseToolResult(result) as any;
      const row = await dayNote(data.note.id);
      expect(row.color).toBe('#dc2626');
      expect(row.sort_order).toBe(2);
    });
  });

  it('stores no color and appends at the bottom when neither is given', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day_note',
        arguments: { tripId: trip.id, dayId: day.id, text: 'A note' },
      });
      const data = parseToolResult(result) as any;
      const row = await dayNote(data.note.id);
      expect(row.color).toBeNull();
      expect(row.sort_order).toBe(9999);
    });
  });

  it('refuses a color outside the note palette and writes nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day_note',
        arguments: { tripId: trip.id, dayId: day.id, text: 'A note', color: '#ff0000' },
      });
      expect(result.isError).toBe(true);
      expect(await countRows(orm, DayNotes, { day: day.id })).toBe(0);
    });
  });

  it('returns error when day does not belong to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const dayFromTrip2 = createDay(testDb, trip2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_day_note', arguments: { tripId: trip1.id, dayId: dayFromTrip2.id, text: 'Note' } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_day_note', arguments: { tripId: trip.id, dayId: day.id, text: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_day_note
// ---------------------------------------------------------------------------

describe('Tool: update_day_note', () => {
  it('updates note text, time, icon', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id, { text: 'Old text', time: '09:00', icon: '📝' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day_note',
        arguments: { tripId: trip.id, dayId: day.id, noteId: note.id, text: 'New text', time: '14:00', icon: '🍽️' },
      });
      const data = parseToolResult(result) as any;
      expect(data.note.text).toBe('New text');
      expect(data.note.time).toBe('14:00');
      expect(data.note.icon).toBe('🍽️');
    });
  });

  it('trims text whitespace', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day_note',
        arguments: { tripId: trip.id, dayId: day.id, noteId: note.id, text: '  Trimmed  ' },
      });
      const data = parseToolResult(result) as any;
      expect(data.note.text).toBe('Trimmed');
    });
  });

  it('sets color and moves the note within the day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id, { sort_order: 9999 });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_day_note',
        arguments: { tripId: trip.id, dayId: day.id, noteId: note.id, color: '#16a34a', sort_order: 1.5 },
      });
      const row = await dayNote(note.id);
      expect(row.color).toBe('#16a34a');
      expect(row.sort_order).toBe(1.5);
    });
  });

  it('clears the color with an explicit null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);
    await updateRows(orm, DayNotes, { id: note.id }, { color: '#2563eb' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_day_note',
        arguments: { tripId: trip.id, dayId: day.id, noteId: note.id, color: null },
      });
      expect((await dayNote(note.id)).color).toBeNull();
    });
  });

  it('keeps the stored color and position when neither is sent', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id, { sort_order: 3 });
    await updateRows(orm, DayNotes, { id: note.id }, { color: '#9333ea' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_day_note',
        arguments: { tripId: trip.id, dayId: day.id, noteId: note.id, text: 'Only the text changed' },
      });
      const row = await dayNote(note.id);
      expect(row.color).toBe('#9333ea');
      expect(row.sort_order).toBe(3);
    });
  });

  it('refuses a color outside the note palette', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day_note',
        arguments: { tripId: trip.id, dayId: day.id, noteId: note.id, color: 'red' },
      });
      expect(result.isError).toBe(true);
      expect((await dayNote(note.id)).color).toBeNull();
    });
  });

  it('broadcasts dayNote:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_day_note', arguments: { tripId: trip.id, dayId: day.id, noteId: note.id, text: 'Updated' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'dayNote:updated', expect.any(Object));
    });
  });

  it('returns error when note not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_day_note', arguments: { tripId: trip.id, dayId: day.id, noteId: 99999, text: 'X' } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_day_note', arguments: { tripId: trip.id, dayId: day.id, noteId: note.id, text: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_day_note
// ---------------------------------------------------------------------------

describe('Tool: delete_day_note', () => {
  it('deletes a day note', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_day_note', arguments: { tripId: trip.id, dayId: day.id, noteId: note.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(await findRow(orm, DayNotes, { id: note.id })).toBeNull();
    });
  });

  it('broadcasts dayNote:deleted event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_day_note', arguments: { tripId: trip.id, dayId: day.id, noteId: note.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'dayNote:deleted', expect.any(Object));
    });
  });

  it('returns error when note not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_day_note', arguments: { tripId: trip.id, dayId: day.id, noteId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_day_note', arguments: { tripId: trip.id, dayId: day.id, noteId: note.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Scope gating (trips write, registration-time — the legacy registerDayTools
// whole-registrar `canWrite(scopes, 'trips')` early return, now the
// declarative access marker on every DayNotesMcp tool)
// ---------------------------------------------------------------------------

describe('Day-note tools — scope gating', () => {
  const WRITE_TOOLS = ['create_day_note', 'update_day_note', 'delete_day_note'];

  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers all three tools with null scopes (full access)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, null);
    for (const tool of WRITE_TOOLS) expect(names).toContain(tool);
  });

  it('registers no day-note tools with trips:read only (all three are writes)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['trips:read']);
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool);
  });

  it('registers no day-note tools for an unrelated scope', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['budget:read']);
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool);
  });
});

// ---------------------------------------------------------------------------
// trek://trips/{tripId}/days/{dayId}/notes resource (moved from the legacy
// registerResources to DayNotesMcp)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/days/{dayId}/notes', () => {
  it('returns the day notes ordered by sort_order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    createDayNote(testDb, day.id, trip.id, { text: 'Second', sort_order: 5 });
    createDayNote(testDb, day.id, trip.id, { text: 'First', sort_order: 1 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/days/${day.id}/notes` });
      const notes = parseResourceResult(result) as { text: string }[];
      expect(notes).toHaveLength(2);
      expect(notes[0].text).toBe('First');
      expect(notes[1].text).toBe('Second');
    });
  });

  it('returns the access-denied payload for a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/days/${day.id}/notes` });
      expect(parseResourceResult(result)).toEqual({ error: 'Trip not found or access denied' });
    });
  });

  it('returns the access-denied payload for a malformed id', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://trips/1/days/not-a-number/notes' });
      expect(parseResourceResult(result)).toEqual({ error: 'Trip not found or access denied' });
    });
  });
});

// ---------------------------------------------------------------------------
// create_collab_note
// ---------------------------------------------------------------------------

describe('Tool: create_collab_note', () => {
  it('creates a collab note with all fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_collab_note',
        arguments: { tripId: trip.id, title: 'Ideas', content: 'Visit museums', category: 'Culture', color: '#3b82f6' },
      });
      const data = parseToolResult(result) as any;
      expect(data.note.title).toBe('Ideas');
      expect(data.note.content).toBe('Visit museums');
      expect(data.note.category).toBe('Culture');
      expect(data.note.color).toBe('#3b82f6');
    });
  });

  it('defaults category to "General" and color to "#6366f1"', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_collab_note', arguments: { tripId: trip.id, title: 'Quick note' } });
      const data = parseToolResult(result) as any;
      expect(data.note.category).toBe('General');
      expect(data.note.color).toBe('#6366f1');
    });
  });

  it('persists the website link', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_collab_note',
        arguments: { tripId: trip.id, title: 'Boat tour', website: 'https://example.com/tour' },
      });
      const data = parseToolResult(result) as any;
      expect(data.note.website).toBe('https://example.com/tour');
      expect((await collabNote(data.note.id)).website)
        .toBe('https://example.com/tour');
    });
  });

  it('stores no website when none is given', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_collab_note', arguments: { tripId: trip.id, title: 'Plain note' } });
      const data = parseToolResult(result) as any;
      expect((await collabNote(data.note.id)).website).toBeNull();
    });
  });

  it('broadcasts collab:note:created event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_collab_note', arguments: { tripId: trip.id, title: 'Note' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:note:created', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_collab_note', arguments: { tripId: trip.id, title: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_collab_note
// ---------------------------------------------------------------------------

describe('Tool: update_collab_note', () => {
  it('updates collab note fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id, { title: 'Old', color: '#6366f1' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_collab_note',
        arguments: { tripId: trip.id, noteId: note.id, title: 'New Title', pinned: true, color: '#3b82f6' },
      });
      const data = parseToolResult(result) as any;
      expect(data.note.title).toBe('New Title');
      expect(data.note.pinned).toBe(1);
      expect(data.note.color).toBe('#3b82f6');
    });
  });

  it('sets the website link on an existing note', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_collab_note',
        arguments: { tripId: trip.id, noteId: note.id, website: 'https://example.com/museum' },
      });
      expect((await collabNote(note.id)).website)
        .toBe('https://example.com/museum');
    });
  });

  it('clears the website with an explicit null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    await updateRows(orm, CollabNotes, { id: note.id }, { website: 'https://example.com/old' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_collab_note', arguments: { tripId: trip.id, noteId: note.id, website: null } });
      expect((await collabNote(note.id)).website).toBeNull();
    });
  });

  it('keeps the stored website when the field is not sent', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    await updateRows(orm, CollabNotes, { id: note.id }, { website: 'https://example.com/keep' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_collab_note', arguments: { tripId: trip.id, noteId: note.id, title: 'Renamed' } });
      expect((await collabNote(note.id)).website)
        .toBe('https://example.com/keep');
    });
  });

  it('refuses a website past the tool cap, the way the sibling text fields are capped', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_collab_note',
        arguments: { tripId: trip.id, noteId: note.id, website: `https://example.com/${'x'.repeat(600)}` },
      });
      expect(result.isError).toBe(true);
      expect((await collabNote(note.id)).website).toBeNull();
    });
  });

  it('broadcasts collab:note:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_collab_note', arguments: { tripId: trip.id, noteId: note.id, title: 'Updated' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:note:updated', expect.any(Object));
    });
  });

  it('returns error when note not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_collab_note', arguments: { tripId: trip.id, noteId: 99999, title: 'X' } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const note = createCollabNote(testDb, trip.id, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_collab_note', arguments: { tripId: trip.id, noteId: note.id, title: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_collab_note
// ---------------------------------------------------------------------------

describe('Tool: delete_collab_note', () => {
  it('deletes a collab note', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_collab_note', arguments: { tripId: trip.id, noteId: note.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(await findRow(orm, CollabNotes, { id: note.id })).toBeNull();
    });
  });

  it('deletes associated trip_files records from the database', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    // Insert a trip_file linked to this note
    await makeTripFile(orm, trip.id, {
      note: note.id,
      filename: 'test-file.pdf',
      original_name: 'document.pdf',
      mime_type: 'application/pdf',
      file_size: 1024,
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_collab_note', arguments: { tripId: trip.id, noteId: note.id } });
      expect((parseToolResult(result) as any).success).toBe(true);
    });

    // trip_files rows are deleted as part of the transaction
    expect(await countRows(orm, TripFiles, { note: note.id })).toBe(0);
    // note itself is deleted
    expect(await findRow(orm, CollabNotes, { id: note.id })).toBeNull();
  });

  it('broadcasts collab:note:deleted event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const note = createCollabNote(testDb, trip.id, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_collab_note', arguments: { tripId: trip.id, noteId: note.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'collab:note:deleted', expect.any(Object));
    });
  });

  it('returns error when note not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_collab_note', arguments: { tripId: trip.id, noteId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const note = createCollabNote(testDb, trip.id, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_collab_note', arguments: { tripId: trip.id, noteId: note.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// Moved from resources.test.ts with the collab migration: the resource now
// registers via the nest-mcp registry inside registerTools (CollabMcp
// @ResourceTemplate), which resources.test.ts's withTools: false harness
// never attaches.
describe('Resource: trek://trips/{tripId}/collab-notes', () => {
  it('returns collab notes with username', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createCollabNote(testDb, trip.id, user.id, { title: 'Ideas' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/collab-notes` });
      const notes = parseResourceResult(result) as any[];
      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('Ideas');
      expect(notes[0].username).toBeTruthy();
    });
  });

  it('returns access denied for unauthorized trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/collab-notes` });
      const data = parseResourceResult(result) as any;
      expect(data.error).toBeTruthy();
    });
  });
});
