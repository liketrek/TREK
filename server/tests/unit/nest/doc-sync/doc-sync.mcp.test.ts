/**
 * The MCP half of document sync, built with `new` and plain mocks: no registry,
 * no MCP server, no container.
 *
 * The tool bodies are three lines each, and what is worth pinning about them is
 * not the plumbing but the decisions around it. The access check is the whole
 * security story: there is no guard in front of an MCP tool, so a dropped
 * `verifyTripAccess` is a stranger reading where somebody's documents live. The
 * absence of a connect tool is a decision too: setting a connection up means
 * handing over a credential that usually reaches a person's entire document
 * archive, and a decision nobody asserts is one somebody re-adds by accident.
 * And the refusal for an unconnected trip is the only thing standing between an
 * assistant and answering "nothing to sync" to a question about someone's
 * boarding pass.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z, type ZodRawShape } from 'zod';

import { ADDON_IDS } from '../../../../src/addons';
import { DocSyncMcp } from '../../../../src/nest/doc-sync/doc-sync.mcp';
import type { DocSyncConfigService, LinkRow } from '../../../../src/nest/doc-sync/doc-sync-config.service';
import type { DocSyncService } from '../../../../src/nest/doc-sync/doc-sync.service';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import type { FilesService } from '../../../../src/nest/files/files.service';
import { getEntry, type ClassRef } from '../../../../src/nest-mcp/metadata';
import type { McpContext, McpTextResult, ToolOptions } from '../../../../src/nest-mcp';

const ctx = { userId: 7, scopes: null, isStaticToken: false } as McpContext;

const link = (id: number, providerId = 'paperless', lastSyncState: string | null = null): LinkRow =>
  ({ id, provider_id: providerId, trip_id: 3, last_sync_state: lastSyncState } as LinkRow);

const RUN = { state: 'ok', pulled: 2, pushed: 1, conflicts: 0, missing: 0 };

interface Setup {
  /** `undefined` is what canAccessTrip answers for a trip the user cannot see. */
  access: boolean;
  links: LinkRow[];
  status: Record<string, unknown>;
  issues: Array<Record<string, unknown>>;
  addonOn: boolean;
  /** Bindings whose provider an admin has switched off. */
  off: number[];
}

function makeMcp(over: Partial<Setup> = {}) {
  const setup: Setup = { access: true, links: [], status: {}, issues: [], addonOn: true, off: [], ...over };
  const files = { verifyTripAccess: vi.fn(() => (setup.access ? { id: 3, user_id: 7 } : undefined)) };
  const config = {
    listLinks: vi.fn(() => setup.links),
    // The real helper also asks whether the owner is still on the trip; here
    // the mark stands in for both.
    isOrphaned: vi.fn((l: LinkRow) => l.last_sync_state === 'orphaned'),
  };
  const sync = {
    status: vi.fn(() => setup.status),
    issues: vi.fn(() => setup.issues),
    syncLink: vi.fn(async () => RUN),
    retryShelvedItems: vi.fn(),
    isSwitchedOff: vi.fn((l: LinkRow) => setup.off.includes(l.id)),
  };
  const addons = { isAddonEnabled: vi.fn(() => setup.addonOn) };
  const mcp = new DocSyncMcp(
    config as unknown as DocSyncConfigService,
    sync as unknown as DocSyncService,
    files as unknown as FilesService,
    addons as unknown as AddonsService,
  );
  return { mcp, files, config, sync, addons };
}

/** A success is one JSON text block and carries no error flag. */
function payload(result: McpTextResult): Record<string, unknown> {
  expect(result.isError).toBeUndefined();
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

function refusal(result: McpTextResult): string {
  expect(result.isError).toBe(true);
  return result.content[0].text;
}

function toolOptions(method: string): ToolOptions {
  const entry = getEntry(DocSyncMcp as unknown as ClassRef, method);
  if (!entry || entry.kind !== 'tool') throw new Error(`${method} is not a registered MCP tool`);
  return entry.options;
}

/**
 * Read off the prototype rather than listed here, so a fourth tool fails the
 * set assertion below instead of quietly slipping past a table this file keeps.
 */
function registeredMethods(): string[] {
  return Object.getOwnPropertyNames(DocSyncMcp.prototype)
    .filter((name) => getEntry(DocSyncMcp as unknown as ClassRef, name) !== undefined)
    .sort();
}

beforeEach(() => vi.clearAllMocks());

describe('DocSyncMcp surface', () => {
  it('offers three tools, none of which can create or change a connection', () => {
    expect(registeredMethods()).toEqual(['getTripDocumentSync', 'listIssues', 'syncNow']);
    expect(registeredMethods().map((m) => toolOptions(m).name).sort()).toEqual([
      'get_trip_document_sync',
      'list_trip_document_sync_issues',
      'sync_trip_documents',
    ]);
  });

  it('asks for nothing but a trip id and a full-run flag', () => {
    // The other half of the same decision: a credential surface could arrive
    // bolted onto an existing schema rather than as a tool of its own.
    const fields = registeredMethods().flatMap((m) => Object.keys(toolOptions(m).inputSchema as ZodRawShape));
    expect([...new Set(fields)].sort()).toEqual(['full', 'tripId']);
  });

  it.each(registeredMethods())('%s disappears while the documents addon is off', (method) => {
    const { mcp, addons } = makeMcp({ addonOn: false });
    const { when } = toolOptions(method);
    expect(typeof when).toBe('function');
    expect(when?.(ctx, mcp)).toBe(false);
    expect(addons.isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.DOCUMENTS);

    addons.isAddonEnabled.mockReturnValue(true);
    expect(when?.(ctx, mcp)).toBe(true);
  });

  it.each([
    ['getTripDocumentSync', 'read'],
    ['listIssues', 'read'],
    ['syncNow', 'write'],
  ])('%s claims files:%s, so a read-scoped token cannot move files', (method, mode) => {
    expect(toolOptions(method).access).toEqual({ group: 'files', mode });
  });

  it('advertises the run as a write even though it creates nothing itself', () => {
    // It moves bytes in both directions, and a host that trusts readOnlyHint
    // would otherwise call it unattended.
    expect(toolOptions('syncNow').annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false });
    expect(toolOptions('getTripDocumentSync').annotations).toMatchObject({ readOnlyHint: true });
    expect(toolOptions('listIssues').annotations).toMatchObject({ readOnlyHint: true });
  });

  it('refuses a trip id that is not a positive integer before a handler sees it', () => {
    const schema = z.object(toolOptions('getTripDocumentSync').inputSchema as ZodRawShape);
    expect(schema.safeParse({ tripId: 3 }).success).toBe(true);
    expect(schema.safeParse({ tripId: 0 }).success).toBe(false);
    expect(schema.safeParse({ tripId: -1 }).success).toBe(false);
    expect(schema.safeParse({ tripId: 1.5 }).success).toBe(false);
  });
});

describe('DocSyncMcp access', () => {
  it.each([
    ['get_trip_document_sync', (m: DocSyncMcp) => m.getTripDocumentSync({ tripId: 3 }, ctx)],
    ['list_trip_document_sync_issues', (m: DocSyncMcp) => m.listIssues({ tripId: 3 }, ctx)],
    ['sync_trip_documents', (m: DocSyncMcp) => m.syncNow({ tripId: 3 }, ctx)],
  ])('%s tells a user who cannot see the trip nothing beyond that', async (_name, call) => {
    const { mcp, files } = makeMcp({ access: false, links: [link(1)] });
    const result = await call(mcp);
    expect(refusal(result as McpTextResult)).toBe('Trip not found or access denied.');
    expect(files.verifyTripAccess).toHaveBeenCalledWith(3, ctx.userId);
  });

  it('does not reach the sync service at all for a trip the user cannot see', async () => {
    const { mcp, sync, config } = makeMcp({ access: false, links: [link(1)] });
    await mcp.syncNow({ tripId: 3 }, ctx);
    mcp.listIssues({ tripId: 3 }, ctx);
    mcp.getTripDocumentSync({ tripId: 3 }, ctx);
    expect(sync.syncLink).not.toHaveBeenCalled();
    expect(sync.status).not.toHaveBeenCalled();
    expect(sync.issues).not.toHaveBeenCalled();
    expect(config.listLinks).not.toHaveBeenCalled();
  });
});

describe('get_trip_document_sync', () => {
  it('hands back the trip status as the service reports it', () => {
    const status = { links: [{ id: 1, remoteLabel: 'Japan 2026' }], items: { synced: 4, conflict: 1 } };
    const { mcp, sync } = makeMcp({ status });
    expect(payload(mcp.getTripDocumentSync({ tripId: 3 }, ctx))).toEqual(status);
    expect(sync.status).toHaveBeenCalledWith(3);
  });
});

describe('list_trip_document_sync_issues', () => {
  it('says the trip is not configured rather than answering with an empty list', () => {
    // An empty list and no connection at all read identically to an assistant,
    // and "everything is in step" is the wrong answer to give about documents
    // that were never being synced.
    const { mcp, sync } = makeMcp({ links: [] });
    expect(payload(mcp.listIssues({ tripId: 3 }, ctx))).toEqual({ configured: false, issues: [] });
    expect(sync.issues).not.toHaveBeenCalled();
  });

  it('reports an empty list for a configured trip with nothing to decide', () => {
    const { mcp } = makeMcp({ links: [link(1)], issues: [] });
    expect(payload(mcp.listIssues({ tripId: 3 }, ctx))).toEqual({ configured: true, issues: [] });
  });

  it('passes the open issues through for a configured trip', () => {
    const issues = [{ id: 9, state: 'conflict', remote_name: 'boarding.pdf' }];
    const { mcp, sync } = makeMcp({ links: [link(1)], issues });
    expect(payload(mcp.listIssues({ tripId: 3 }, ctx))).toEqual({ configured: true, issues });
    expect(sync.issues).toHaveBeenCalledWith(3);
  });
});

describe('sync_trip_documents', () => {
  it('refuses an unconnected trip with the step that would fix it', async () => {
    const { mcp, sync } = makeMcp({ links: [] });
    const text = refusal(await mcp.syncNow({ tripId: 3 }, ctx));
    expect(text).toContain('not connected to a document store');
    expect(text).toContain('file manager');
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('runs every binding of the trip and reports each one separately', async () => {
    // A trip can be bound to more than one store, and collapsing the runs into
    // one total would hide which of them failed.
    const links = [link(1, 'paperless'), link(2, 'nextcloud')];
    const { mcp, sync } = makeMcp({ links });
    const body = payload(await mcp.syncNow({ tripId: 3 }, ctx));
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
    expect(body.runs).toEqual([
      { linkId: 1, provider: 'paperless', ...RUN },
      { linkId: 2, provider: 'nextcloud', ...RUN },
    ]);
  });

  it('un-shelves the documents that gave up before running, as the REST route does', async () => {
    // "Run it now" means "try again", including the items parked after too many
    // failures. A tool that skipped this reported "in sync" while leaving them
    // parked, and the only way out was the button in the web UI.
    const links = [link(1, 'paperless'), link(2, 'nextcloud')];
    const { mcp, sync } = makeMcp({ links });
    await mcp.syncNow({ tripId: 3 }, ctx);
    expect(sync.retryShelvedItems.mock.calls).toEqual([[1], [2]]);
  });

  it('refuses with the same code as the REST route when every binding is switched off', async () => {
    const { mcp, sync } = makeMcp({ links: [link(1)], off: [1] });
    const text = refusal(await mcp.syncNow({ tripId: 3 }, ctx));
    expect(text.startsWith('provider_disabled:')).toBe(true);
    expect(text).toContain('switched back on');
    // Nothing un-shelved, nothing run: the binding resumes as it was left.
    expect(sync.retryShelvedItems).not.toHaveBeenCalled();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('runs the bindings that are on and reports the switched-off one by its code', async () => {
    const links = [link(1, 'paperless'), link(2, 'nextcloud')];
    const { mcp, sync } = makeMcp({ links, off: [1] });
    const body = payload(await mcp.syncNow({ tripId: 3 }, ctx));
    expect(body.runs).toEqual([
      { linkId: 1, provider: 'paperless', state: 'disabled', errorCode: 'provider_disabled' },
      { linkId: 2, provider: 'nextcloud', ...RUN },
    ]);
    expect(sync.retryShelvedItems.mock.calls).toEqual([[2]]);
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('refuses an orphaned binding as the REST route does, without touching it', async () => {
    const { mcp, sync } = makeMcp({ links: [link(1, 'paperless', 'orphaned')] });
    const text = refusal(await mcp.syncNow({ tripId: 3 }, ctx));
    expect(text.startsWith('orphaned:')).toBe(true);
    expect(text).toContain('connect the store again');
    // The credential belongs to somebody who left the trip: no run, and the
    // shelved rows stay shelved.
    expect(sync.retryShelvedItems).not.toHaveBeenCalled();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('runs the bindings that still have an owner and reports the orphaned one by its code', async () => {
    const links = [link(1, 'paperless', 'orphaned'), link(2, 'nextcloud')];
    const { mcp, sync } = makeMcp({ links });
    const body = payload(await mcp.syncNow({ tripId: 3 }, ctx));
    expect(body.runs).toEqual([
      { linkId: 1, provider: 'paperless', state: 'orphaned', errorCode: 'orphaned' },
      { linkId: 2, provider: 'nextcloud', ...RUN },
    ]);
    expect(sync.retryShelvedItems.mock.calls).toEqual([[2]]);
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('asks for the cheap incremental run unless the caller says otherwise', async () => {
    const { mcp, sync } = makeMcp({ links: [link(1)] });
    await mcp.syncNow({ tripId: 3 }, ctx);
    expect(sync.syncLink).toHaveBeenCalledWith(link(1), { full: false });

    await mcp.syncNow({ tripId: 3, full: true }, ctx);
    expect(sync.syncLink).toHaveBeenLastCalledWith(link(1), { full: true });
  });
});
