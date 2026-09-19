import { Injectable } from '@nestjs/common';
import { Readable } from 'node:stream';
import {
  docFail,
  docOk,
  type DocResult,
  type DocumentConnectionRef,
  type DocumentProvider,
  type DocumentProviderCapabilities,
  type DocumentScopeOption,
  type DocumentScopeRef,
  type FetchResult,
  type PushRequest,
  type PushResult,
  type RemoteDocument,
} from '../document-provider';
import {
  PaperlessClient,
  PaperlessError,
  currentVersion,
  sha256OrNull,
  type PaperlessCreds,
  type PaperlessDocument,
  type PaperlessTag,
} from './paperless.client';
import { DOWNLOAD_MAX_BYTES, guardDownload } from './provider-http';

/**
 * Paperless-ngx as a document scope.
 *
 * The scope is a TAG, because that is the only container Paperless has: there
 * are no folders, and a document belongs to as many tags as someone gives it.
 * A tag is also the one thing the instance's owner can see and reason about in
 * their own interface, which matters: this is their archive, and TREK is a
 * guest in it.
 *
 * The tag is paired with a custom field (`trek_trip_id`) carrying the trip's
 * uid. A tag can be removed by a human in two clicks and the binding would be
 * silently empty; the custom field survives that and says which trip a document
 * came from even after someone re-tags it. Nothing here treats the field as
 * authority: it is a breadcrumb for the person cleaning up, and for a support
 * question that starts with "where did this come from".
 *
 * Deletion propagates only as far as Paperless's own trash. `DELETE` on a
 * document is a soft delete there (`deleted_at` is set, the document leaves
 * every listing and `/api/documents/{id}/` answers 404), and the retention is
 * the instance's `trash_delay`. There is no hard delete on the API at all.
 */

/** `tag:<id>`, the only scope key shape this adapter reads or writes. */
const SCOPE_PREFIX = 'tag:';

/** The custom field the trip uid is written into, created on demand. */
export const TRIP_UID_FIELD_NAME = 'trek_trip_id';

/** The header the self-registered workflow sends its shared secret in. */
export const PAPERLESS_WEBHOOK_SECRET_HEADER = 'X-Trek-Docsync-Secret';

/**
 * What one push may buffer when the core did not say how large the file is.
 *
 * The body has to become a Buffer (Paperless wants a sized multipart request),
 * so an unbounded read would be a memory bomb driven by a remote file. The
 * declared size wins where there is one; this is the fallback ceiling.
 */
const PUSH_FALLBACK_MAX_BYTES = 64 * 1024 * 1024;

/**
 * What Paperless accepts without Tika. Measured against 3.1.3: an unsupported
 * type is refused with `400 … not supported` before a task is created.
 *
 * Note that Paperless decides on the SNIFFED type of the bytes, not on the
 * Content-Type of the multipart part: a .csv arrives as `text/plain` and is
 * stored as such. The list is therefore a pre-filter that saves a round trip,
 * never the last word; the 400 is still mapped to the same code.
 */
const BASE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/heic',
  'image/heif',
  'text/plain',
  'text/csv',
  'message/rfc822',
] as const;

/**
 * Accepted only on an instance that runs Tika and Gotenberg. They stay in the
 * list: an instance WITH Tika is a supported setup, and refusing a .docx here
 * would drop a file the provider would have taken. Without Tika the upload
 * comes back as `unsupported_type` from Paperless itself, which is the same
 * verdict one round trip later.
 */
const TIKA_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/rtf',
] as const;

const ACCEPTED_MIME_TYPES: readonly string[] = [...BASE_MIME_TYPES, ...TIKA_MIME_TYPES];

/**
 * The extension a Paperless document should carry in TREK.
 *
 * Paperless keeps a `title` without an extension and the uploaded file name
 * separately, while TREK's file list is a list of file names. The extension is
 * taken from the original name where there is one and derived from the MIME
 * type otherwise, so a document pulled twice keeps the same name.
 */
const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/tiff': '.tif',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'message/rfc822': '.eml',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.oasis.opendocument.text': '.odt',
  'application/vnd.oasis.opendocument.spreadsheet': '.ods',
  'application/vnd.oasis.opendocument.presentation': '.odp',
  'application/rtf': '.rtf',
};

const KNOWN_EXTENSIONS = new Set(Object.values(EXTENSION_BY_MIME));

/**
 * The bare type, without the parameters a stored Content-Type may carry.
 * `text/plain; charset=utf-8` is text/plain, and comparing it verbatim against
 * the allow-list would refuse a file the provider takes happily.
 */
export function normalizeMime(mimeType: string): string {
  const [type = ''] = mimeType.split(';');
  return type.trim().toLowerCase();
}

function extensionOf(name: string): string | null {
  const match = /\.[A-Za-z0-9]{1,5}$/.exec(name);
  return match === null ? null : match[0].toLowerCase();
}

/**
 * The file name a document gets in TREK: the title, plus the extension it lost
 * on the way into Paperless.
 */
export function documentFileName(doc: PaperlessDocument): string {
  const base = doc.title.trim().length > 0
    ? doc.title.trim()
    : (doc.originalFileName ?? `document-${doc.id}`);
  const fromOriginal = doc.originalFileName === null ? null : extensionOf(doc.originalFileName);
  const fromMime = doc.mimeType === null ? null : (EXTENSION_BY_MIME[doc.mimeType] ?? null);
  const extension = fromOriginal ?? fromMime;
  if (extension === null) return base;
  return base.toLowerCase().endsWith(extension) ? base : `${base}${extension}`;
}

/**
 * The title for a file name. Only an extension this adapter would have ADDED is
 * removed, so a document genuinely called `Vertrag 2026.2` keeps its name.
 */
export function titleFromFileName(name: string): string {
  const trimmed = name.trim();
  const extension = extensionOf(trimmed);
  if (extension === null || !KNOWN_EXTENSIONS.has(extension)) return trimmed;
  const base = trimmed.slice(0, trimmed.length - extension.length).trim();
  return base.length > 0 ? base : trimmed;
}

export function formatScopeKey(tagId: number): string {
  return `${SCOPE_PREFIX}${tagId}`;
}

/** The tag id in a scope key, or null when it is not one of ours. */
export function parseScopeKey(scopeKey: string): number | null {
  if (!scopeKey.startsWith(SCOPE_PREFIX)) return null;
  const raw = scopeKey.slice(SCOPE_PREFIX.length);
  if (!/^\d+$/.test(raw)) return null;
  const id = Number.parseInt(raw, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function scopeOption(tag: PaperlessTag): DocumentScopeOption {
  return {
    scopeKey: formatScopeKey(tag.id),
    label: tag.name,
    remoteRootId: String(tag.id),
    // The filter URL of the instance's own document list: paste it after the
    // base URL and you are looking at exactly what TREK syncs.
    remoteRootPath: `/documents?tags__id__all=${tag.id}`,
  };
}

function toRemoteDocument(doc: PaperlessDocument): RemoteDocument {
  const version = currentVersion(doc);
  return {
    remoteId: String(doc.id),
    name: documentFileName(doc),
    // Paperless publishes no byte count anywhere in the document serializer;
    // the only way to learn it is to download, which is not worth a round trip
    // per document per run.
    size: null,
    mimeType: doc.mimeType,
    // `modified` moves on every edit, including the bulk edits that older
    // Paperless builds left untouched (3.1.3 does bump it, measured).
    remoteVersion: doc.modified ?? doc.added ?? String(doc.id),
    contentHash: sha256OrNull(version?.checksum ?? null),
    remoteModifiedAt: doc.modified,
    isDeleted: doc.deletedAt !== null,
  };
}

/**
 * Cursor shape. The count travels with the timestamp because Paperless has no
 * change feed: a document leaving the tag moves no timestamp at all, and only
 * the count notices it.
 */
function buildCursor(count: number | null, documents: PaperlessDocument[]): string {
  let newest = '';
  for (const doc of documents) {
    const modified = doc.modified ?? '';
    if (modified > newest) newest = modified;
  }
  return `v1:${count ?? documents.length}:${newest}`;
}

/** Read a stream into memory, refusing to grow past the cap. */
async function readStreamCapped(
  body: Readable,
  maxBytes: number,
): Promise<{ bytes: Buffer; truncated: boolean }> {
  const chunks: Buffer[] = [];
  let received = 0;
  for await (const chunk of body as AsyncIterable<Buffer | Uint8Array | string>) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : Buffer.from(chunk);
    received += buffer.length;
    if (received > maxBytes) {
      body.destroy();
      return { bytes: Buffer.concat(chunks), truncated: true };
    }
    chunks.push(buffer);
  }
  return { bytes: Buffer.concat(chunks), truncated: false };
}

@Injectable()
export class PaperlessDocumentProvider implements DocumentProvider {
  readonly id = 'paperless';

  constructor(private readonly client: PaperlessClient) {}

  capabilities(_conn: DocumentConnectionRef): DocumentProviderCapabilities {
    return {
      // Paperless can subscribe itself: a workflow with a webhook action is
      // creatable through the same token, provided its user holds
      // `add_workflow`. probe() reports the downgrade when it does not.
      push: 'webhook-self-registered',
      stableId: true,
      remoteTrash: true,
      // `update_version` replaces the bytes under the same document id, which
      // is what keeps the mapping and the document's history intact.
      replaceInPlace: true,
      // Every listed document carries the sha256 of its current revision in
      // `versions[]`, so no extra round trip is needed to compare content.
      contentHashInListing: true,
      // Paperless imposes no limit of its own; what a large upload runs into is
      // the reverse proxy in front of it, which the adapter cannot know.
      maxUploadBytes: null,
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      canCreateScope: true,
    };
  }

  async probe(
    conn: DocumentConnectionRef,
  ): Promise<DocResult<{ account: string; capabilities: DocumentProviderCapabilities }>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    try {
      const profile = await this.client.probe(creds);
      const capabilities = this.capabilities(conn);
      // A token whose user may not create workflows can still sync; it just
      // cannot subscribe itself, and the operator has to be told that here
      // rather than after the first silent hour of polling.
      const canSubscribe = profile.permissions.length === 0
        || profile.permissions.includes('add_workflow');
      return docOk({
        account: profile.username.length > 0 ? profile.username : 'paperless',
        capabilities: canSubscribe ? capabilities : { ...capabilities, push: 'webhook-manual' },
      });
    } catch (err: unknown) {
      return failure(err);
    }
  }

  async listScopes(
    conn: DocumentConnectionRef,
    query?: string,
  ): Promise<DocResult<DocumentScopeOption[]>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    try {
      const tags = await this.client.listTags(creds, query);
      return docOk(tags.map(scopeOption));
    } catch (err: unknown) {
      return failure(err);
    }
  }

  async createScope(
    conn: DocumentConnectionRef,
    name: string,
  ): Promise<DocResult<DocumentScopeOption>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    try {
      return docOk(scopeOption(await this.client.createTag(creds, name.trim())));
    } catch (err: unknown) {
      // A name that is already taken comes back as a 400 about the owner/name
      // unique constraint. It is not adopted silently: an existing tag may be
      // someone else's, and binding a trip to it would publish their documents
      // to everyone on that trip.
      return failure(err);
    }
  }

  async resolveScope(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
  ): Promise<DocResult<DocumentScopeOption>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    const tagId = parseScopeKey(scope.scopeKey);
    if (tagId === null) return badScope(scope.scopeKey);
    try {
      return docOk(scopeOption(await this.client.getTag(creds, tagId)));
    } catch (err: unknown) {
      // A tag that is gone is `scope_lost` for the link, not a generic 404:
      // someone deleted or renamed it upstream and a human has to choose again.
      if (err instanceof PaperlessError && err.code === 'not_found') {
        return docFail('scope_missing', `tag ${tagId} no longer exists`, err.status);
      }
      return failure(err);
    }
  }

  async list(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
  ): Promise<DocResult<{
    documents: RemoteDocument[];
    cursor: string | null;
    cursorUnchanged: boolean;
    truncated: boolean;
  }>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    const tagId = parseScopeKey(scope.scopeKey);
    if (tagId === null) return badScope(scope.scopeKey);
    try {
      const { documents, truncated, count } = await this.client.listDocuments(creds, tagId);
      const cursor = buildCursor(count, documents);
      return docOk({
        documents: documents.map(toRemoteDocument),
        cursor,
        // A truncated walk never claims the scope is unchanged: the pages it
        // did not read could hold anything.
        cursorUnchanged: !truncated && scope.cursor !== null && scope.cursor === cursor,
        truncated,
      });
    } catch (err: unknown) {
      // An empty tag and a deleted tag look alike in a document listing, so the
      // tag is only ever confirmed by resolveScope. A 404 here is the documents
      // endpoint itself, which is a different problem.
      return failure(err);
    }
  }

  async fetch(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
  ): Promise<DocResult<FetchResult>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    if (parseScopeKey(scope.scopeKey) === null) return badScope(scope.scopeKey);
    const documentId = parseRemoteId(remoteId);
    if (documentId === null) return docFail('not_found', `unreadable document id ${remoteId}`);

    try {
      // The metadata first: it carries the version marker the core stores
      // alongside the bytes, and it fails cheaply when the document is gone.
      const doc = await this.client.getDocument(creds, documentId);
      const response = await this.client.downloadOriginal(creds, documentId);
      const download = guardDownload(response, {
        maxBytes: DOWNLOAD_MAX_BYTES,
        tooLarge: (declared) =>
          new PaperlessError(
            'too_large',
            'The document is larger than TREK will transfer',
            undefined,
            `content_length=${declared}`,
          ),
        noBody: () => new PaperlessError('provider_error', 'Paperless sent no body for the document'),
      });
      return docOk({
        body: download.body,
        size: download.size,
        mimeType: response.headers.get('content-type') ?? doc.mimeType,
        remoteVersion: doc.modified ?? doc.added ?? String(doc.id),
      });
    } catch (err: unknown) {
      return failure(err);
    }
  }

  async push(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    req: PushRequest,
  ): Promise<DocResult<PushResult>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    const tagId = parseScopeKey(scope.scopeKey);
    if (tagId === null) return badScope(scope.scopeKey);

    const mimeType = normalizeMime(req.mimeType);
    if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
      return docFail('unsupported_type', `Paperless does not accept ${req.mimeType}`);
    }

    const cap = req.size > 0 ? req.size : PUSH_FALLBACK_MAX_BYTES;
    let bytes: Buffer;
    try {
      const read = await readStreamCapped(req.body, cap);
      if (read.truncated) {
        return docFail('too_large', `the file is larger than the declared ${cap} bytes`);
      }
      bytes = read.bytes;
    } catch (err: unknown) {
      return docFail(
        'provider_error',
        err instanceof Error ? err.message : 'could not read the local file',
      );
    }

    const file = { fileName: req.fileName, mimeType, bytes };
    const replacing = req.remoteId !== undefined;
    try {
      const documentId = replacing
        ? await this.replace(creds, file, req)
        : await this.create(creds, tagId, file, req);
      const doc = await this.client.getDocument(creds, documentId);

      // Paperless stores the sha256 of what it received. Comparing it here
      // turns a truncated upload into a reported mismatch instead of a
      // document that silently differs from the one in the trip.
      const stored = sha256OrNull(currentVersion(doc)?.checksum ?? null);
      if (stored !== null && stored !== req.sha256.toLowerCase()) {
        // A document this call created and nobody has seen is litter, so it
        // goes to the trash where the owner can still get at it. A REPLACE is
        // left alone: that document existed before and its earlier revisions
        // are still attached to it.
        if (!replacing) await this.discard(creds, doc.id);
        return docFail(
          'checksum_mismatch',
          `Paperless stored ${stored} for document ${doc.id}`,
        );
      }

      return docOk({
        remoteId: String(doc.id),
        remoteVersion: doc.modified ?? doc.added ?? String(doc.id),
        remoteModifiedAt: doc.modified,
        // Paperless does not deduplicate: the same bytes uploaded twice become
        // two documents with the same checksum and an empty
        // `duplicate_documents`. Nothing here may claim otherwise.
        deduplicated: false,
      });
    } catch (err: unknown) {
      return failure(err);
    }
  }

  /**
   * Trash a document this push created but is not going to report.
   *
   * Best effort on purpose: the caller is already returning a failure, and a
   * second one on top of it would replace a precise diagnosis with the fallout
   * of the cleanup.
   */
  private async discard(creds: PaperlessCreds, documentId: number): Promise<void> {
    try {
      await this.client.deleteDocument(creds, documentId);
    } catch {
      // Nothing to do: the document stays in the archive and the mismatch is
      // still what the caller hears about.
    }
  }

  /**
   * A new document, with both anchors set in the same request: the tag, which
   * is what the listing filters on, and the trip uid in the custom field, which
   * outlives someone re-tagging the document by hand.
   *
   * The field id is resolved per upload rather than cached. It is one small GET
   * against a local instance, and a cached id goes stale exactly when it hurts
   * most: after a human deleted the field, when every later upload would fail
   * with a validation error nobody can read.
   */
  private async create(
    creds: PaperlessCreds,
    tagId: number,
    file: { fileName: string; mimeType: string; bytes: Buffer },
    req: PushRequest,
  ): Promise<number> {
    const field = (await this.client.findCustomField(creds, TRIP_UID_FIELD_NAME))
      ?? (await this.client.createCustomField(creds, TRIP_UID_FIELD_NAME));

    const taskId = await this.client.postDocument(creds, file, {
      title: titleFromFileName(req.fileName),
      tagId,
      customFields: { [String(field.id)]: req.trekTripUid },
    });
    try {
      return (await this.client.awaitConsume(creds, taskId)).documentId;
    } catch (err: unknown) {
      // The consume outlived the poll budget. The document may well be there
      // (OCR on a long scan takes minutes), and retrying blind would leave two,
      // because Paperless accepts duplicate bytes. So the checksum decides.
      if (err instanceof PaperlessError && err.code === 'timeout') {
        const existing = await this.client.findByChecksum(creds, req.sha256);
        // Only a document carrying this scope's tag can be the one this push
        // made: the tag goes on at upload. Anything else with the same bytes
        // belongs to someone else's filing, and adopting it would put a
        // stranger's document in the trip, and delete it on the next
        // delete-through.
        const mine = existing.find((doc) => doc.tagIds.includes(tagId));
        if (mine !== undefined) return mine.id;
      }
      throw err;
    }
  }

  /**
   * Replace the bytes of a document TREK already knows.
   *
   * The document id is the one that was passed in, never the one the consume
   * task reports: `update_version` files the new revision under a fresh
   * internal id that answers 404 on its own, and adopting it would break the
   * mapping on the first replace.
   */
  private async replace(
    creds: PaperlessCreds,
    file: { fileName: string; mimeType: string; bytes: Buffer },
    req: PushRequest,
  ): Promise<number> {
    const documentId = parseRemoteId(req.remoteId ?? '');
    if (documentId === null) {
      throw new PaperlessError('not_found', `unreadable document id ${req.remoteId ?? ''}`);
    }
    const taskId = await this.client.updateVersion(creds, documentId, file);
    try {
      await this.client.awaitConsume(creds, taskId);
    } catch (err: unknown) {
      if (!(err instanceof PaperlessError) || err.code !== 'timeout') throw err;
      // Same reasoning as create(), one step shorter: the document keeps its
      // id, so whether the new revision landed is visible on the document.
      const doc = await this.client.getDocument(creds, documentId);
      if (sha256OrNull(currentVersion(doc)?.checksum ?? null) !== req.sha256.toLowerCase()) {
        throw err;
      }
    }
    return documentId;
  }

  async rename(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
    name: string,
  ): Promise<DocResult<{ remoteVersion: string }>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    if (parseScopeKey(scope.scopeKey) === null) return badScope(scope.scopeKey);
    const documentId = parseRemoteId(remoteId);
    if (documentId === null) return docFail('not_found', `unreadable document id ${remoteId}`);

    try {
      // Only the title moves. The uploaded file name is immutable in Paperless,
      // and the archived file it serves is named after the title anyway.
      const doc = await this.client.patchDocument(creds, documentId, {
        title: titleFromFileName(name),
      });
      return docOk({ remoteVersion: doc.modified ?? doc.added ?? String(doc.id) });
    } catch (err: unknown) {
      return failure(err);
    }
  }

  async trash(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
  ): Promise<DocResult<void>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    if (parseScopeKey(scope.scopeKey) === null) return badScope(scope.scopeKey);
    const documentId = parseRemoteId(remoteId);
    if (documentId === null) return docFail('not_found', `unreadable document id ${remoteId}`);

    try {
      await this.client.deleteDocument(creds, documentId);
      return docOk(undefined);
    } catch (err: unknown) {
      // Already in the trash is the state that was asked for.
      if (err instanceof PaperlessError && err.code === 'not_found') return docOk(undefined);
      return failure(err);
    }
  }

  async registerWebhook(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    callbackUrl: string,
    secret: string,
  ): Promise<DocResult<{ subscriptionId: string }>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    const tagId = parseScopeKey(scope.scopeKey);
    if (tagId === null) return badScope(scope.scopeKey);

    try {
      const workflowId = await this.client.createWorkflow(creds, {
        name: `TREK document sync (link ${scope.linkId})`,
        tagId,
        callbackUrl,
        secretHeader: { name: PAPERLESS_WEBHOOK_SECRET_HEADER, value: secret },
        // Whatever Paperless sends is untrusted and only means "look now", so
        // the payload carries the link and nothing about the document. It could
        // not carry more: placeholders are not substituted in a webhook payload.
        params: { linkId: String(scope.linkId), tripId: String(scope.tripId) },
      });
      return docOk({ subscriptionId: String(workflowId) });
    } catch (err: unknown) {
      return failure(err);
    }
  }

  async unregisterWebhook(
    conn: DocumentConnectionRef,
    subscriptionId: string,
  ): Promise<DocResult<void>> {
    const creds = credsOf(conn);
    if (creds === null) return missingToken();
    const workflowId = parseRemoteId(subscriptionId);
    if (workflowId === null) {
      return docFail('not_found', `unreadable subscription id ${subscriptionId}`);
    }
    try {
      await this.client.deleteWorkflow(creds, workflowId);
      return docOk(undefined);
    } catch (err: unknown) {
      return failure(err);
    }
  }
}

function credsOf(conn: DocumentConnectionRef): PaperlessCreds | null {
  const token = conn.secrets.api_token ?? '';
  if (token.trim().length === 0) return null;
  return {
    baseUrl: conn.baseUrl,
    token: token.trim(),
    allowInsecureTls: conn.allowInsecureTls,
  };
}

function parseRemoteId(remoteId: string): number | null {
  if (!/^\d+$/.test(remoteId.trim())) return null;
  const id = Number.parseInt(remoteId.trim(), 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function missingToken<T>(): DocResult<T> {
  return docFail<T>('unauthorized', 'this connection has no Paperless API token');
}

function badScope<T>(scopeKey: string): DocResult<T> {
  return docFail<T>('scope_missing', `not a Paperless scope key: ${scopeKey}`);
}

/**
 * Every failure leaves through here, so a stray upstream exception cannot
 * escape as an `unknown` with an English sentence in it.
 */
function failure<T>(err: unknown): DocResult<T> {
  if (err instanceof PaperlessError) {
    return docFail<T>(err.code, err.detail ?? err.message, err.status);
  }
  return docFail<T>('unknown', err instanceof Error ? err.message : undefined);
}
