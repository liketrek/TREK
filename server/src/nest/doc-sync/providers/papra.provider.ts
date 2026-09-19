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
  PapraClient,
  PapraError,
  PAPRA_DEFAULT_TAG_COLOR,
  snapshotVersion,
  tagSearchQuery,
  type PapraCreds,
  type PapraDocument,
  type PapraTag,
} from './papra.client';
import { Injectable } from '@nestjs/common';

import crypto from 'node:crypto';

/**
 * Papra as a document scope: one organisation, one tag per trip.
 *
 * Papra has no folders, so the container a trip binds to is a tag, which is
 * why the scope key carries both halves (`org:…/tag:…`). The organisation is in
 * there although it is also on the connection: an API key reaches every
 * organisation its owner belongs to, so a binding that only named the tag would
 * silently follow the connection if its organisation were ever re-pointed.
 *
 * Two capabilities are `false`/`manual` because of what Papra withholds from an
 * API key rather than what it cannot do. Webhook CRUD and the restore and
 * hard-delete routes answer 401 to a key and 200 to a browser session, so TREK
 * cannot subscribe itself, and there is no endpoint that replaces the bytes of
 * an existing document at all.
 */
@Injectable()
export class PapraDocumentProvider implements DocumentProvider {
  readonly id = 'papra';

  private readonly client = new PapraClient();

  capabilities(_conn: DocumentConnectionRef): DocumentProviderCapabilities {
    return {
      // The API exists, but only a browser session may call it.
      push: 'webhook-manual',
      stableId: true,
      remoteTrash: true,
      // No endpoint replaces a document's bytes. A new revision is a new
      // document, and an identical one is deduplicated into the old.
      replaceInPlace: false,
      // `originalSha256Hash` is a real sha256 of the stored bytes.
      contentHashInListing: true,
      // The ceiling is DOCUMENT_STORAGE_MAX_UPLOAD_SIZE on the instance and is
      // not exposed anywhere in the API, so claiming Papra's 10 MB default here
      // would refuse uploads a tuned instance accepts. An oversized one comes
      // back as 413 `too_large` instead.
      maxUploadBytes: null,
      acceptedMimeTypes: null,
      canCreateScope: true,
    };
  }

  async probe(
    conn: DocumentConnectionRef,
  ): Promise<DocResult<{ account: string; capabilities: DocumentProviderCapabilities }>> {
    return this.withCreds(conn, async (creds) => {
      // Tags rather than `/organizations`: it is the narrowest call that proves
      // all three things at once: the instance answers, the key is valid, and
      // the key's owner is in this organisation.
      await this.client.listTags(creds);
      return { account: await this.accountLabel(creds), capabilities: this.capabilities(conn) };
    });
  }

  async listScopes(conn: DocumentConnectionRef, query?: string): Promise<DocResult<DocumentScopeOption[]>> {
    return this.withCreds(conn, async (creds) => {
      const tags = await this.client.listTags(creds);
      const needle = query?.trim().toLowerCase();
      return tags
        .filter((tag) => !needle || tag.name.toLowerCase().includes(needle))
        .map((tag) => toScopeOption(creds.organizationId, tag));
    });
  }

  async createScope(conn: DocumentConnectionRef, name: string): Promise<DocResult<DocumentScopeOption>> {
    return this.withCreds(conn, async (creds) => {
      // A name collision is reported rather than resolved to the existing tag:
      // that tag may be someone else's filing, and the picker already lists it
      // for an admin who meant to bind to it.
      const tag = await this.client.createTag(creds, name, PAPRA_DEFAULT_TAG_COLOR);
      return toScopeOption(creds.organizationId, tag);
    });
  }

  async resolveScope(conn: DocumentConnectionRef, scope: DocumentScopeRef): Promise<DocResult<DocumentScopeOption>> {
    return this.withCreds(conn, async (creds) => {
      const tag = await this.requireTag(creds, scope);
      return toScopeOption(creds.organizationId, tag);
    });
  }

  async list(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
  ): Promise<
    DocResult<{ documents: RemoteDocument[]; cursor: string | null; cursorUnchanged: boolean; truncated: boolean }>
  > {
    return this.withCreds(conn, async (creds) => {
      const tag = await this.requireTag(creds, scope);
      const searchQuery = tagSearchQuery(tag.name);
      const walked = await this.client.listAllDocuments(creds, searchQuery === null ? {} : { searchQuery });

      const documents = walked.documents.filter((doc) => inScope(doc, tag.id, searchQuery !== null)).map(toRemote);

      // A capped walk saw part of the tag, and the core reads absence as a
      // possible deletion. Reporting no cursor keeps the incomplete picture out
      // of the agreed state instead of pinning it as the new truth.
      if (walked.truncated) {
        return { documents, cursor: null, cursorUnchanged: false, truncated: true };
      }

      const cursor = enumerationDigest(documents);
      return { documents, cursor, cursorUnchanged: scope.cursor === cursor, truncated: false };
    });
  }

  /**
   * The scope is not re-checked here. Every route is organisation-scoped
   * upstream, so a document from elsewhere cannot be reached, and a document
   * that has lost its tag is exactly the one the core is fetching to resolve
   * the drift.
   */
  async fetch(
    conn: DocumentConnectionRef,
    _scope: DocumentScopeRef,
    remoteId: string,
  ): Promise<DocResult<FetchResult>> {
    return this.withCreds(conn, async (creds) => {
      // The document first: the file route answers
      // `content-type: application/octet-stream` for everything, so the real
      // MIME type and the version marker only exist on the record.
      const doc = await this.client.getDocument(creds, remoteId);
      const download = await this.client.downloadDocument(creds, remoteId);
      return {
        body: download.body,
        size: download.size ?? doc.originalSize,
        mimeType: doc.mimeType,
        remoteVersion: snapshotVersion(doc),
      };
    });
  }

  /**
   * Store a trip file as a Papra document and tag it into the trip's scope.
   *
   * `trekDocUid`/`trekTripUid` are not written anywhere: Papra's custom
   * properties are session-only, so a key has nowhere to put an anchor. The tag
   * is the whole binding, and a human who removes it upstream detaches the
   * document, which is `scope_drift` in the core, not a silent loss.
   *
   * The tag goes on in a second call because the upload route ignores every
   * multipart field except the file. That leaves a window in which the document
   * exists untagged; it closes on the next call, and a concurrent listing that
   * misses it picks it up on the following run.
   */
  async push(conn: DocumentConnectionRef, scope: DocumentScopeRef, req: PushRequest): Promise<DocResult<PushResult>> {
    return this.withCreds(conn, async (creds) => {
      if (req.remoteId !== undefined) {
        throw new PapraError(
          'provider_error',
          'Papra has no endpoint that replaces the bytes of a document; push a new one instead (replaceInPlace is false)',
        );
      }

      const tag = await this.requireTag(creds, scope);

      let document: PapraDocument;
      let deduplicated: boolean;
      try {
        const uploaded = await this.client.uploadDocument(creds, {
          body: req.body,
          fileName: req.fileName,
          mimeType: req.mimeType,
        });
        document = uploaded.document;
        deduplicated = uploaded.deduplicated;
      } catch (err: unknown) {
        if (!(err instanceof PapraError) || err.papraCode !== 'document.already_exists') throw err;

        // Papra refused the bytes because it already holds them. The twin is
        // the document this push is about, so it has to be found before the tag
        // can go on, and it is found by hash, because a twin stored under
        // another name would otherwise pair the wrong document.
        const twin = await this.client.findByHash(creds, req.sha256, req.fileName);
        if (!twin) {
          throw new PapraError(
            'conflict',
            'Papra holds these bytes already but did not return the document that has them',
            err.status,
            err.detail,
            err.papraCode,
          );
        }
        document = twin;
        deduplicated = true;
      }

      await this.client.addTag(creds, document.id, tag.id);

      return {
        remoteId: document.id,
        remoteVersion: snapshotVersion(document),
        remoteModifiedAt: document.updatedAt ?? document.createdAt,
        deduplicated,
      };
    });
  }

  async rename(
    conn: DocumentConnectionRef,
    _scope: DocumentScopeRef,
    remoteId: string,
    name: string,
  ): Promise<DocResult<{ remoteVersion: string }>> {
    return this.withCreds(conn, async (creds) => {
      const doc = await this.client.renameDocument(creds, remoteId, name);
      return { remoteVersion: snapshotVersion(doc) };
    });
  }

  async trash(conn: DocumentConnectionRef, _scope: DocumentScopeRef, remoteId: string): Promise<DocResult<void>> {
    return this.withCreds(conn, async (creds) => {
      await this.client.trashDocument(creds, remoteId);
    });
  }

  /** The bound tag, or a `scope_missing` a caller can surface as `scope_lost`. */
  private async requireTag(creds: PapraCreds, scope: DocumentScopeRef): Promise<PapraTag> {
    const parsed = parseScopeKey(scope.scopeKey);
    if (!parsed) {
      throw new PapraError('scope_missing', 'The stored scope key is not a Papra scope', undefined, scope.scopeKey);
    }
    if (parsed.organizationId !== creds.organizationId) {
      throw new PapraError(
        'scope_missing',
        'The bound tag belongs to a different Papra organisation than this connection',
        undefined,
        `scope ${parsed.organizationId}, connection ${creds.organizationId}`,
      );
    }

    // Papra has no single-tag route, so existence is answered by the list, the
    // same call that supplies the name the document search needs.
    const tags = await this.client.listTags(creds);
    const tag = tags.find((candidate) => candidate.id === parsed.tagId);
    if (!tag) {
      throw new PapraError('scope_missing', 'The tag this trip is bound to no longer exists', undefined, parsed.tagId);
    }
    return tag;
  }

  /** The organisation's name, if the key is allowed to read it. */
  private async accountLabel(creds: PapraCreds): Promise<string> {
    try {
      const organizations = await this.client.listOrganizations(creds);
      const mine = organizations.find((org) => org.id === creds.organizationId);
      if (mine) return mine.name;
    } catch {
      // `organizations:read` is a separate scope a working sync key need not
      // hold, so its absence costs a nicer label and nothing else.
    }
    return creds.organizationId;
  }

  /**
   * Resolve the connection's credentials and run one operation on them.
   *
   * Every operation answers with a result rather than a throw, because the
   * settings screen shows a failed probe inline. Reading the credentials inside
   * the same guard is what keeps a half-filled connection form on that path
   * too: it is reported exactly like a provider fault, and nothing reaches the
   * network to find out.
   */
  private async withCreds<T>(
    conn: DocumentConnectionRef,
    run: (creds: PapraCreds) => Promise<T>,
  ): Promise<DocResult<T>> {
    try {
      return docOk(await run(readCreds(conn)));
    } catch (err: unknown) {
      if (err instanceof PapraError) return docFail<T>(err.code, describe(err), err.status);
      return docFail<T>('unknown', err instanceof Error ? err.message : String(err));
    }
  }
}

function toScopeOption(organizationId: string, tag: PapraTag): DocumentScopeOption {
  return {
    scopeKey: buildScopeKey(organizationId, tag.id),
    label: tag.name,
    remoteRootId: tag.id,
    remoteRootPath: `#${tag.name}`,
  };
}

function toRemote(doc: PapraDocument): RemoteDocument {
  return {
    remoteId: doc.id,
    name: doc.name,
    size: doc.originalSize,
    mimeType: doc.mimeType,
    remoteVersion: snapshotVersion(doc),
    contentHash: doc.originalSha256Hash,
    // In practice the creation time: Papra writes `updatedAt` once and never
    // touches it again, not on a rename, a tag change or a delete.
    remoteModifiedAt: doc.updatedAt ?? doc.createdAt,
    isDeleted: doc.isDeleted,
  };
}

/**
 * Whether a listed document really carries the bound tag.
 *
 * The search already filters server-side, so this is belt and braces, except
 * for the one case that matters: a tag name the grammar cannot express makes
 * the client enumerate the whole organisation, and then this is the only filter
 * there is. A document that states no tags at all is kept when the server did
 * the filtering, because reading a missing field as "no tags" would empty the
 * listing, and an empty listing is how a mass delete looks to the core.
 */
function inScope(doc: PapraDocument, tagId: string, serverFiltered: boolean): boolean {
  if (doc.tags === null) return serverFiltered;
  return doc.tags.some((tag) => tag.id === tagId);
}

/**
 * A fingerprint of the whole enumeration, used as the cursor.
 *
 * Papra offers nothing to short-circuit a walk with, so this cannot save the
 * enumeration. It only lets the core skip diffing when the tag is provably
 * unchanged. It covers deletions as well as edits because it is built from the
 * complete set rather than from the newest entry.
 */
function enumerationDigest(documents: RemoteDocument[]): string {
  const pairs = documents
    .map((doc) => `${doc.remoteId}:${doc.remoteVersion}`)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return crypto.createHash('sha256').update(pairs.join('\n')).digest('hex');
}

export function buildScopeKey(organizationId: string, tagId: string): string {
  return `org:${organizationId}/tag:${tagId}`;
}

export function parseScopeKey(scopeKey: string): { organizationId: string; tagId: string } | null {
  const match = /^org:([A-Za-z0-9_-]{1,64})\/tag:([A-Za-z0-9_-]{1,64})$/.exec(scopeKey.trim());
  if (!match) return null;
  return { organizationId: match[1], tagId: match[2] };
}

/**
 * Connection fields to client credentials.
 *
 * A missing field is answered here rather than as a 401 from Papra, because the
 * two look identical to the admin staring at the form and only one of them is
 * fixed by issuing a new key.
 */
function readCreds(conn: DocumentConnectionRef): PapraCreds {
  const apiKey = conn.secrets.api_key?.trim();
  if (!apiKey) throw new PapraError('unauthorized', 'The connection has no Papra API key');

  const organizationId = conn.settings.organization_id?.trim();
  if (!organizationId) throw new PapraError('provider_error', 'The connection names no Papra organisation');

  const baseUrl = conn.baseUrl.trim();
  if (!baseUrl) throw new PapraError('provider_error', 'The connection has no Papra URL');

  return { baseUrl, apiKey, organizationId, allowInsecureTls: conn.allowInsecureTls };
}

/** Upstream text for the self-hoster's log, never for the user's file list. */
function describe(err: PapraError): string {
  const parts = [err.message];
  if (err.papraCode) parts.push(`papra=${err.papraCode}`);
  if (err.detail) parts.push(err.detail);
  return parts.join(' | ');
}
