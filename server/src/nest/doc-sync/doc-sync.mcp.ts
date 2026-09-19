import { z } from 'zod';
import {
  McpController,
  Tool,
  type McpContext,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  errorResult,
  ok,
} from '../../nest-mcp';
import { ADDON_IDS } from '../../addons';
import { noAccess } from '../../mcp/tools/_shared';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { FilesService } from '../files/files.service';
import { DocSyncConfigService } from './doc-sync-config.service';
import { DocSyncService } from './doc-sync.service';
import { PROVIDER_DISABLED } from './doc-sync.constants';

const documentsAddonOn = addonGate(ADDON_IDS.DOCUMENTS);

/**
 * The MCP half of document sync, mirroring /api/trips/:tripId/docsync.
 *
 * Read and trigger only. There is no tool that creates a connection, and that
 * is deliberate rather than unfinished: setting one up means handing over a
 * credential that usually reaches a person's entire document archive, and an
 * assistant is the wrong place to collect one. The same reason the REST side
 * restricts those routes to the trip owner applies twice over here.
 *
 * `sync_trip_documents` is a write because it moves files in both directions,
 * even though it creates nothing itself.
 */
@McpController()
export class DocSyncMcp {
  constructor(
    private readonly config: DocSyncConfigService,
    private readonly sync: DocSyncService,
    private readonly files: FilesService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'get_trip_document_sync',
    description:
      'Show whether this trip\'s documents are synced with an external document store (Paperless-ngx, Papra, Nextcloud, OpenCloud or a Synology NAS), which folder or tag they are bound to, when the last run happened, and how many documents are waiting, in conflict or missing at the provider. Use this before telling someone where their documents live.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'files', mode: 'read' },
    when: documentsAddonOn,
  })
  getTripDocumentSync({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    return ok(this.sync.status(tripId));
  }

  @Tool({
    name: 'list_trip_document_sync_issues',
    description:
      'List the documents that need a person to look at them: conflicts where both copies changed, documents the provider refused because of their type or size, and documents that disappeared at the provider. Returns an empty list when everything is in step.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'files', mode: 'read' },
    when: documentsAddonOn,
  })
  listIssues({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const links = this.config.listLinks(tripId);
    if (links.length === 0) return ok({ configured: false, issues: [] });
    return ok({ configured: true, issues: this.sync.issues(tripId) });
  }

  @Tool({
    name: 'sync_trip_documents',
    description:
      'Run the document sync for this trip now instead of waiting for the next scheduled check. Reports how many documents were pulled in from the provider, pushed out to it, and how many are in conflict. Safe to call repeatedly: a run that is already in progress is not started twice.',
    inputSchema: {
      tripId: z.number().int().positive(),
      full: z
        .boolean()
        .optional()
        .default(false)
        .describe('Ignore the change marker from last time and compare both sides in full'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'files', mode: 'write' },
    when: documentsAddonOn,
  })
  async syncNow({ tripId, full }: { tripId: number; full?: boolean }, ctx: McpContext) {
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const links = this.config.listLinks(tripId);
    if (links.length === 0) {
      return errorResult('This trip is not connected to a document store. Connect one in the trip\'s file manager first.');
    }
    const results = [];
    for (const link of links) {
      // Refused as the REST route refuses it, before the shelved rows below are
      // touched: a binding an admin switched off stays exactly as it was, so it
      // resumes where it stopped once the provider is back on.
      if (this.sync.isSwitchedOff(link)) {
        results.push({ linkId: link.id, provider: link.provider_id, state: 'disabled', errorCode: PROVIDER_DISABLED });
        continue;
      }
      // Asking for a run by hand means "try again", including the documents
      // that were shelved after too many failures. The REST route does the
      // same thing before its run; a tool that skipped it would answer "in
      // sync" while leaving them shelved.
      this.sync.retryShelvedItems(link.id);
      results.push({ linkId: link.id, provider: link.provider_id, ...(await this.sync.syncLink(link, { full: full === true })) });
    }
    if (results.every((r) => r.errorCode === PROVIDER_DISABLED)) {
      return errorResult(
        `${PROVIDER_DISABLED}: an administrator has switched off the document store this trip is bound to, so nothing was synced. The binding and its documents are kept, and syncing resumes once the store is switched back on.`,
      );
    }
    return ok({ runs: results });
  }
}
