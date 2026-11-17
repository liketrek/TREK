import { Tags } from '../../db/entities/Tags.entity';
import type { TagRow, TagsRepository } from '../../db/repositories/Tags.repository';
import type { User } from '../../types';
import { conflict, DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { requireTripWrite, restTripWriter, tripNotFound, type TripWriter } from '../common/trip-writer';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { Tag } from '@trek/shared';

/** The colour a tag gets when its creator names none, the same as a personal tag's. */
const DEFAULT_TAG_COLOR = '#10b981';

const tagNotFound = () => new DomainError(404, 'Tag not found', { mcpMessage: 'Tag not found.' });
const nameTaken = () => conflict('A tag with this name already exists');

/** Two names are one tag when they read the same, whatever their case. */
const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/** A stored row as the contract types it; the columns the contract narrows are always set on a trip's tag. */
const asTag = (row: TagRow): Tag => row as unknown as Tag;

/**
 * A trip's own tags, one method per use case, for REST and MCP alike.
 *
 * A tag of a trip belongs to the trip, not to the member who created it: every
 * member reads the same list, and anyone who may edit the trip's places
 * (`place_edit`, the right a tag is put on a place with) may add to it, rename
 * and delete. Each write holds the trip gate, its checks, the write and the
 * `tripTags:changed` it sends, so both surfaces tell the trip the same thing.
 *
 * A name stands once per trip, whatever its case: asking for one the trip has
 * answers that tag, and renaming onto another tag's name is refused. Two members
 * tagging the same idea end up on one tag, which is what a shared filter needs.
 */
@Injectable()
export class TripTagsService {
  constructor(
    @InjectRepository(Tags) private readonly tags: TagsRepository,
    private readonly access: TripAccessService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly uow: UnitOfWork,
  ) {}

  /** The REST caller of a tag write: its event skips the socket that made the request. */
  restWriter(tripId: string, user: User, socketId: string | undefined): TripWriter {
    return restTripWriter(this.realtime, tripId, user, socketId);
  }

  /** The trip's tags by name, for anybody who can see the trip. */
  async list(tripId: string | number, userId: number): Promise<Tag[]> {
    const tid = toRowId(tripId);
    if (tid === null || !(await this.access.findAccessible(tid, userId))) throw tripNotFound();
    return (await this.tags.listByTrip(tid)).map(asTag);
  }

  /** The tag of that name on the trip, created when the trip has none yet. */
  async create(tripId: string | number, input: { name: string; color?: string }, writer: TripWriter): Promise<Tag> {
    const tid = await this.gate(tripId, writer);
    const name = input.name.trim();
    const { tag, created } = await this.uow.transactional(async () => {
      const existing = (await this.tags.listByTrip(tid)).find((row) => sameName(row.name, name));
      if (existing) return { tag: existing, created: false };
      const color = input.color ?? DEFAULT_TAG_COLOR;
      return { tag: await this.tags.createTag({ user_id: writer.userId, trip_id: tid, name, color }), created: true };
    });
    if (created) writer.events.emit('tripTags:changed', {});
    return asTag(tag);
  }

  /** Rename or recolour a tag of the trip; a field that is left out keeps its value. */
  async update(
    tripId: string | number,
    tagId: string | number,
    changes: { name?: string; color?: string },
    writer: TripWriter,
  ): Promise<Tag> {
    const tid = await this.gate(tripId, writer);
    const id = toRowId(tagId);
    const name = changes.name?.trim();
    const tag = await this.uow.transactional(async () => {
      const onTrip = await this.tags.listByTrip(tid);
      const current = onTrip.find((row) => row.id === id);
      if (!current) throw tagNotFound();
      if (name && onTrip.some((row) => row.id !== current.id && sameName(row.name, name))) throw nameTaken();
      const patched = await this.tags.patch(current.id, {
        ...(name ? { name } : {}),
        ...(changes.color ? { color: changes.color } : {}),
      });
      // Read in this transaction a statement ago, so the patch finds the row.
      return patched as TagRow;
    });
    writer.events.emit('tripTags:changed', {});
    return asTag(tag);
  }

  /** Delete a tag of the trip; it comes off every place that carried it. */
  async remove(tripId: string | number, tagId: string | number, writer: TripWriter): Promise<void> {
    const tid = await this.gate(tripId, writer);
    const id = toRowId(tagId);
    if (id === null || !(await this.tags.findByIdAndTrip(id, tid))) throw tagNotFound();
    await this.tags.remove(id);
    writer.events.emit('tripTags:changed', {});
  }

  /** The gate of every write: the writer sees the trip (404) and may edit its places (403). */
  private async gate(tripId: string | number, writer: TripWriter): Promise<number> {
    const tid = toRowId(tripId);
    if (tid === null) throw tripNotFound();
    await requireTripWrite({ access: this.access, permissions: this.permissions }, 'place_edit', tid, writer);
    return tid;
  }
}
