import { placeWebsiteSchema } from '../place/place.schema';
import { collectionStatusSchema, collectionLinksSchema } from './collection.schema';

import { z } from 'zod';

/**
 * A list as a file, so a list of places can leave the instance it was saved on.
 *
 * ── Why this is worth having ─────────────────────────────────────────────
 *
 * Somebody who has been to a place knows which twenty of its restaurants are
 * worth the walk, and that knowledge currently exists in one account on one
 * server. Sharing a list already works between members of the same instance;
 * this is the other case, where the person you want to send it to runs their
 * own TREK, or none yet (#2198).
 *
 * ── What travels ─────────────────────────────────────────────────────────
 *
 * What somebody wrote down: the list's own name, colour and description, and
 * for each place its name, where it is, what was noted about it, how to reach
 * it, and which of the list's labels it carries. Deliberately dull JSON, so a
 * file can be read, edited and diffed by a person.
 *
 * ── What does not ────────────────────────────────────────────────────────
 *
 * **Ids of any kind.** A collection id, a place id, a category id and a user
 * id all mean something only on the instance that issued them. The receiving
 * instance issues its own; a category comes across as its name and is matched
 * against the palette on the other side.
 *
 * **Other people.** Members, invitations, and the star ratings members gave
 * (#1435). A rating is an opinion somebody expressed to the people on that
 * list, not something the list's owner may forward.
 *
 * **Provenance into trips.** `source_trip_id` / `source_place_id` point at
 * rows the receiver cannot see and must not be handed a reference to.
 *
 * **Instance-local image paths.** `/uploads/...` and the photo-proxy path
 * resolve to a file on the *sender's* server, so on the receiver's screen they
 * would either 404 or, behind the same reverse proxy, show a stranger's
 * upload. Only an absolute https URL survives, and even that is rendered as an
 * image rather than fetched by the server. A cover image is instance-local by
 * definition, so a list arrives without one.
 *
 * **Tags.** A tag row carries a `user_id`; there is no meaningful way to give
 * one to somebody else's account.
 *
 * ── What an imported file is trusted for ─────────────────────────────────
 *
 * Nothing. It is a stranger's JSON. It is read in the browser that chose it,
 * never uploaded as a file, and what is sent to the server goes through this
 * contract on both sides. Text is rendered as text; the two fields that would
 * otherwise reach a browser API (`website` and a link's `url`) are pinned to
 * http(s) by the schemas they borrow, so neither can be a `javascript:` value.
 * The counts below are the other half: a file cannot ask the server for more
 * rows than the UI that created it could.
 *
 * Strict where it must refuse, forgiving where it can drop. The envelope is
 * checked hard — a file that does not say what it is never reaches the
 * importer — while a single place inside it that does not parse is skipped and
 * counted, and one unreadable field on an otherwise good place is dropped
 * rather than taking the place with it.
 */

/** What the file says it is, so a stray JSON is refused rather than half-read. */
export const COLLECTION_FILE_FORMAT = 'trek.collection';
export const COLLECTION_FILE_VERSION = 1;

/**
 * As many places as `collectionSaveFromTripManyRequestSchema` accepts in one
 * go, which is the largest bulk write the list UI can already produce.
 */
export const MAX_COLLECTION_FILE_PLACES = 1000;
/** `MAX_LABELS_PER_COLLECTION` in collections.service.ts. */
export const MAX_COLLECTION_FILE_LABELS = 50;

/**
 * A megabyte holds a thousand places with room to spare. The point of the
 * limit is to refuse a hostile or mistaken file before parsing it.
 */
export const MAX_COLLECTION_FILE_BYTES = 1024 * 1024;

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  .nullable()
  .optional();

/**
 * An image the receiver may show: an absolute https URL and nothing else.
 *
 * Narrower than `placeImageUrlSchema`, which also admits an instance-local
 * path and an inline data URI. Neither belongs in a file: the path resolves on
 * the wrong server, and a data URI turns a list of a thousand places into a
 * file nobody can send.
 */
export const collectionFileImageSchema = z
  .string()
  .max(2048)
  .refine((v) => /^https:\/\//i.test(v), { message: 'must be an https URL' });

/**
 * A value the reader keeps, or nothing.
 *
 * `.catch(null)` rather than a hard refusal, on the two fields that carry a
 * URL: a place whose website is a `javascript:` value, or whose image points
 * at the sender's own disk, is still a place worth having, and it arrives
 * without that field. Refusing the whole file over one of them would lose a
 * hundred good places to a single hand-edited line, and the failure would read
 * as "the import is broken" rather than "that link was dropped".
 */
const droppable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional().catch(null);

export const collectionFileLabelSchema = z.object({
  name: z.string().min(1).max(60),
  color: hexColor,
});
export type CollectionFileLabel = z.infer<typeof collectionFileLabelSchema>;

export const collectionFilePlaceSchema = z.object({
  name: z.string().min(1).max(500),
  description: z.string().max(5000).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  address: z.string().max(1000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().max(10).nullable().optional(),
  website: droppable(placeWebsiteSchema),
  phone: z.string().max(60).nullable().optional(),
  image_url: droppable(collectionFileImageSchema),
  /** Provider ids identify the place itself, not a row on the sender's server. */
  google_place_id: z.string().max(255).nullable().optional(),
  google_ftid: z.string().max(255).nullable().optional(),
  osm_id: z.string().max(255).nullable().optional(),
  status: collectionStatusSchema.optional(),
  links: collectionLinksSchema.optional(),
  /** The category's NAME; the receiving instance matches it against its own palette. */
  category: z.string().max(100).nullable().optional(),
  /** Label names, matched against `labels` above. Unknown names are dropped. */
  labels: z.array(z.string().min(1).max(60)).max(MAX_COLLECTION_FILE_LABELS).optional(),
});
export type CollectionFilePlace = z.infer<typeof collectionFilePlaceSchema>;

export const collectionFileSchema = z.object({
  format: z.literal(COLLECTION_FILE_FORMAT),
  /**
   * Read but not yet branched on: version 1 is the only shape there is. A file
   * from a later version still parses when its additions are optional, which
   * is the point of keeping every field below optional.
   */
  version: z.number().int().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  color: hexColor,
  icon: z.string().max(40).nullable().optional(),
  /** ISO timestamp, for a person reading the file. Nothing branches on it. */
  exported_at: z.string().max(40).optional(),
  labels: z.array(collectionFileLabelSchema).max(MAX_COLLECTION_FILE_LABELS).optional(),
  /**
   * Unknown at the envelope, checked one by one where they are written.
   *
   * A single unreadable place must not cost the other nine hundred: the
   * envelope only counts them, and `collectionFilePlaceSchema` is applied per
   * entry by the importer, which reports how many it had to drop. Same shape
   * as the studio's spread file, for the same reason.
   */
  places: z.array(z.unknown()).max(MAX_COLLECTION_FILE_PLACES),
});
export type CollectionFile = z.infer<typeof collectionFileSchema>;

/**
 * The import request: the file itself, plus the one thing the importer may
 * decide rather than the file. A list always arrives as a NEW list, so there
 * is no target id here and no way for a file to write into an existing one.
 */
export const collectionImportRequestSchema = z.object({
  file: collectionFileSchema,
  /** Overrides the file's name when the importer typed one. */
  name: z.string().min(1).max(120).optional(),
});
export type CollectionImportRequest = z.infer<typeof collectionImportRequestSchema>;

export interface CollectionImportResult {
  /** The list as created, so the client can select it without a refetch. */
  collection: unknown;
  imported: number;
  /** Places the file carried that the contract refused. */
  skipped: number;
}
