/**
 * Unit tests for memories/helpersService — MEM-HELPERS-001 to MEM-HELPERS-020.
 * Covers mapDbError, getAlbumIdFromLink, pipeAsset error paths.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ─────────────────────────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`
        SELECT t.id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const { mockSafeFetch } = vi.hoisted(() => ({
  mockSafeFetch: vi.fn(),
}));

vi.mock('../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {
    constructor(msg: string) { super(msg); this.name = 'SsrfBlockedError'; }
  }
  return {
    safeFetch: mockSafeFetch,
    SsrfBlockedError,
    checkSsrf: vi.fn(async () => ({ allowed: true, resolvedIp: '1.2.3.4' })),
  };
});

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { mapDbError, getAlbumIdFromLink, pipeAsset } from '../../../src/services/memories/helpersService';
import { SsrfBlockedError } from '../../../src/utils/ssrfGuard';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  mockSafeFetch.mockReset();
});

afterAll(() => {
  testDb.close();
});

// ── mapDbError ────────────────────────────────────────────────────────────────

describe('mapDbError', () => {
  it('MEM-HELPERS-001: returns 409 for unique constraint error', () => {
    const err = new Error('UNIQUE constraint failed: users.email');
    const result = mapDbError(err, 'fallback');
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(409);
    expect(result.error.message).toBe('Resource already exists');
  });

  it('MEM-HELPERS-002: returns 409 for generic constraint error', () => {
    const err = new Error('constraint violation');
    const result = mapDbError(err, 'fallback');
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(409);
  });

  it('MEM-HELPERS-003: returns 500 with original message for non-constraint error', () => {
    const err = new Error('Something went wrong');
    const result = mapDbError(err, 'fallback');
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(500);
    expect(result.error.message).toBe('Something went wrong');
  });

  it('MEM-HELPERS-004: returns 500 for generic DB error', () => {
    const err = new Error('disk I/O error');
    const result = mapDbError(err, 'fallback');
    expect(result.error.status).toBe(500);
  });
});

// ── getAlbumIdFromLink ────────────────────────────────────────────────────────

describe('getAlbumIdFromLink', () => {
  it('MEM-HELPERS-005: returns 404 when trip access is denied', () => {
    const result = getAlbumIdFromLink('9999', 'link-1', 1);
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(404);
  });

  it('MEM-HELPERS-006: returns 404 when album link is not found', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = getAlbumIdFromLink(String(trip.id), 'nonexistent-link', user.id);
    expect(result.success).toBe(false);
    expect(result.error.status).toBe(404);
    expect(result.error.message).toBe('Album link not found');
  });

  it('MEM-HELPERS-007: returns album_id when link exists', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Insert with auto-increment id (INTEGER PRIMARY KEY)
    const ins = testDb.prepare(
      'INSERT INTO trip_album_links (trip_id, user_id, provider, album_id, album_name) VALUES (?, ?, ?, ?, ?)'
    ).run(trip.id, user.id, 'immich', 'album-123', 'My Album');
    const linkId = ins.lastInsertRowid;

    const result = getAlbumIdFromLink(String(trip.id), String(linkId), user.id);
    expect(result.success).toBe(true);
    expect((result as any).data).toBe('album-123');
  });
});

// ── pipeAsset ─────────────────────────────────────────────────────────────────

describe('pipeAsset', () => {
  function mockResponse(overrides: Record<string, any> = {}) {
    return {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      end: vi.fn(),
      json: vi.fn(),
      headersSent: false,
      ...overrides,
    } as any;
  }

  it('MEM-HELPERS-009: calls response.end() when resp.body is null', async () => {
    mockSafeFetch.mockResolvedValue({
      status: 200,
      headers: { get: vi.fn(() => null) },
      body: null,
    });
    const res = mockResponse();

    await pipeAsset('https://example.com/asset', res);

    expect(res.end).toHaveBeenCalled();
  });

  it('MEM-HELPERS-010: returns 400 when SsrfBlockedError is thrown', async () => {
    mockSafeFetch.mockRejectedValue(new SsrfBlockedError('SSRF blocked'));
    const res = mockResponse({ headersSent: false });

    await pipeAsset('https://internal.example.com/asset', res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('MEM-HELPERS-011: returns 500 for generic fetch error', async () => {
    mockSafeFetch.mockRejectedValue(new Error('Network error'));
    const res = mockResponse({ headersSent: false });

    await pipeAsset('https://example.com/asset', res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch asset' });
  });

  it('MEM-HELPERS-012: calls response.end() when headersSent is true on error', async () => {
    mockSafeFetch.mockRejectedValue(new Error('fail'));
    const res = mockResponse({ headersSent: true });

    await pipeAsset('https://example.com/asset', res);

    expect(res.end).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('MEM-HELPERS-013: sets content-type header when present in response', async () => {
    mockSafeFetch.mockResolvedValue({
      status: 200,
      headers: {
        get: (h: string) => {
          if (h === 'content-type') return 'image/jpeg';
          return null;
        },
      },
      body: null,
    });
    const res = mockResponse();

    await pipeAsset('https://example.com/img.jpg', res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(res.end).toHaveBeenCalled();
  });
});

// ── pipeAsset fetch options (#1611) ───────────────────────────────────────────

describe('pipeAsset fetch options (#1611)', () => {
  function mockResponse(overrides: Record<string, any> = {}) {
    return {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      end: vi.fn(),
      json: vi.fn(),
      headersSent: false,
      ...overrides,
    } as any;
  }

  it('MEM-HELPERS-021: forwards fetchOptions to safeFetch', async () => {
    mockSafeFetch.mockResolvedValue({
      status: 200,
      headers: { get: vi.fn(() => null) },
      body: null,
    });
    const res = mockResponse();

    await pipeAsset('https://example.com/asset', res, undefined, undefined, undefined, { rejectUnauthorized: false });

    expect(mockSafeFetch).toHaveBeenCalledWith(
      'https://example.com/asset',
      expect.anything(),
      { rejectUnauthorized: false },
    );
  });

  it('MEM-HELPERS-022: omitting fetchOptions leaves safeFetch options undefined', async () => {
    mockSafeFetch.mockResolvedValue({
      status: 200,
      headers: { get: vi.fn(() => null) },
      body: null,
    });
    const res = mockResponse();

    await pipeAsset('https://example.com/asset', res);

    expect(mockSafeFetch.mock.calls[0][2]).toBeUndefined();
  });

  it('MEM-HELPERS-023: logs the underlying error when responding 500', async () => {
    const boom = new Error('unable to verify the first certificate');
    mockSafeFetch.mockRejectedValue(boom);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockResponse({ headersSent: false });

    await pipeAsset('https://example.com/asset', res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(errorSpy).toHaveBeenCalledWith(expect.any(String), boom);
    errorSpy.mockRestore();
  });
});
