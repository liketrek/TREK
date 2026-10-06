import type { CollectionMembers } from '../entities/CollectionMembers.entity';
import { TrekRepository } from './_shared/trek-repository';

/** `buildMembers`'s owner row — `collections` joined to `users` (CL12). */
export interface CollectionOwnerMemberRow {
  user_id: number;
  username: string;
  email: string;
  avatar: string | null;
}

/** `buildMembers`'s accepted/pending member rows — `collection_members` joined to `users` (CL13). */
export interface CollectionMemberRow extends CollectionOwnerMemberRow {
  status: string;
  role: string;
}

interface CollectionOwnerKyselyDB {
  collections: { id: number; owner_id: number };
  users: { id: number; username: string; email: string; avatar: string | null };
}

interface CollectionMembersKyselyDB {
  collection_members: { collection_id: number; user_id: number; status: string; role: string };
  users: { id: number; username: string; email: string; avatar: string | null };
}

interface CollectionMemberUserIdsKyselyDB {
  collection_members: { collection_id: number; user_id: number; status: string };
}

/** `listCollections`'s incoming-invites read — a genuine statement missing
 *  its own CL number in the plan's inventory gather (jumped CL15 → CL16
 *  without capturing it): `SELECT cm.collection_id, c.name, u.id AS from_id,
 *  u.username AS from_username FROM collection_members cm JOIN collections c
 *  ON c.id=cm.collection_id JOIN users u ON u.id=c.owner_id WHERE
 *  cm.user_id=? AND cm.status='pending'`. */
export interface CollectionIncomingInviteRow {
  collection_id: number;
  name: string;
  from_id: number;
  from_username: string;
}

interface CollectionIncomingInvitesKyselyDB {
  collection_members: { collection_id: number; user_id: number; status: string };
  collections: { id: number; name: string; owner_id: number };
  users: { id: number; username: string };
}

/**
 * `collection_members` — Plan 3h Task 1's first cut (`roleOf`'s own member
 * lookup lives in `_shared/collection-role.ts` instead, R6). Task 2 extends
 * this repository with `sendInvite`/`acceptInvite`/etc.'s invite-lifecycle
 * methods (CL79-88) and the membership-lookup surface (CL69, `findMembership`).
 * Owns `buildMembers`'s two joined reads (CL12/CL13) and `deleteCollection`'s
 * snapshot-before-cascade reads (CL33/CL34).
 */
export class CollectionMembersRepository extends TrekRepository<CollectionMembers> {
  /** CL12 (`buildMembers`) — `SELECT u.id AS user_id, u.username, u.email, u.avatar FROM collections col JOIN users u ON u.id=col.owner_id WHERE col.id=?`. */
  async ownerRow(collectionId: number): Promise<CollectionOwnerMemberRow | undefined> {
    return await this.kysely<CollectionOwnerKyselyDB>()
      .selectFrom('collections as col')
      .innerJoin('users as u', 'u.id', 'col.owner_id')
      .select(['u.id as user_id', 'u.username', 'u.email', 'u.avatar'])
      .where('col.id', '=', collectionId)
      .executeTakeFirst();
  }

  /** CL13 (`buildMembers`) — `SELECT u.id AS user_id, u.username, u.email, u.avatar, cm.status, cm.role FROM collection_members cm JOIN users u ON u.id=cm.user_id WHERE cm.collection_id=? ORDER BY u.username`. */
  async memberRows(collectionId: number): Promise<CollectionMemberRow[]> {
    return await this.kysely<CollectionMembersKyselyDB>()
      .selectFrom('collection_members as cm')
      .innerJoin('users as u', 'u.id', 'cm.user_id')
      .select(['u.id as user_id', 'u.username', 'u.email', 'u.avatar', 'cm.status', 'cm.role'])
      .where('cm.collection_id', '=', collectionId)
      .orderBy('u.username')
      .execute();
  }

  /** CL33 (`deleteCollection`'s snapshot, taken BEFORE the cascading delete) — `SELECT user_id FROM collection_members WHERE collection_id=? AND status='accepted'`. Dup text also `collectionMemberIds`/`notifyCollectionUsers` (Task 2's own call sites). */
  async acceptedUserIds(collectionId: number): Promise<number[]> {
    const rows = await this.kysely<CollectionMemberUserIdsKyselyDB>()
      .selectFrom('collection_members')
      .select('user_id')
      .where('collection_id', '=', collectionId)
      .where('status', '=', 'accepted')
      .execute();
    return rows.map((r) => r.user_id);
  }

  /** CL34 (`deleteCollection`'s snapshot, taken BEFORE the cascading delete) — `SELECT user_id FROM collection_members WHERE collection_id=? AND status='pending'`. */
  async pendingUserIds(collectionId: number): Promise<number[]> {
    const rows = await this.kysely<CollectionMemberUserIdsKyselyDB>()
      .selectFrom('collection_members')
      .select('user_id')
      .where('collection_id', '=', collectionId)
      .where('status', '=', 'pending')
      .execute();
    return rows.map((r) => r.user_id);
  }

  /** `listCollections`'s incoming-invites read (see {@link CollectionIncomingInviteRow}'s docstring). */
  async pendingInvitesForUser(userId: number): Promise<CollectionIncomingInviteRow[]> {
    return await this.kysely<CollectionIncomingInvitesKyselyDB>()
      .selectFrom('collection_members as cm')
      .innerJoin('collections as c', 'c.id', 'cm.collection_id')
      .innerJoin('users as u', 'u.id', 'c.owner_id')
      .select(['cm.collection_id', 'c.name', 'u.id as from_id', 'u.username as from_username'])
      .where('cm.user_id', '=', userId)
      .where('cm.status', '=', 'pending')
      .execute();
  }

  // -------------------------------------------------------------------------
  // Plan 3h Task 2 (part B) — CL79-88, additive: the invite lifecycle
  // (sendInvite/acceptInvite/declineInvite/cancelInvite/leaveCollection/
  // removeMember/setMemberRole/availableUsers/findMembershipForUser).
  // -------------------------------------------------------------------------

  /** CL80 (`sendInvite`) — `SELECT id, status FROM collection_members WHERE collection_id=? AND user_id=?` (dup/pending guard). */
  async findByCollectionAndUser(
    collectionId: number,
    userId: number,
  ): Promise<{ id: number; status: string } | undefined> {
    const row = await this.findOne({ collection: collectionId, user: userId }, { fields: ['id', 'status'] });
    return row ?? undefined;
  }

  /** CL81 (`sendInvite`) — `INSERT INTO collection_members (collection_id, user_id, status, role) VALUES (?, ?, 'pending', ?)`. */
  async insertInvite(collectionId: number, userId: number, role: string): Promise<void> {
    await this.insert({ collection: collectionId, user: userId, status: 'pending', role });
  }

  /** CL82 (`acceptInvite`) — `SELECT id FROM collection_members WHERE collection_id=? AND user_id=? AND status='pending'`. */
  async findPendingInvite(collectionId: number, userId: number): Promise<number | undefined> {
    const row = await this.findOne({ collection: collectionId, user: userId, status: 'pending' }, { fields: ['id'] });
    return row?.id;
  }

  /** CL83 (`acceptInvite`) — `UPDATE collection_members SET status='accepted' WHERE id=?`. */
  async accept(memberId: number): Promise<void> {
    await this.nativeUpdate({ id: memberId }, { status: 'accepted' });
  }

  /** CL84 (`declineInvite`, dup text also `cancelInvite`) — `DELETE FROM collection_members WHERE collection_id=? AND user_id=? AND status='pending'`. */
  async deletePending(collectionId: number, userId: number): Promise<void> {
    await this.nativeDelete({ collection: collectionId, user: userId, status: 'pending' });
  }

  /** CL85 (`leaveCollection`, dup text also `removeMember`) — `DELETE FROM collection_members WHERE collection_id=? AND user_id=? AND status='accepted'`. Returns the affected row count (`removeMember`'s own 404-on-zero check). */
  async deleteAccepted(collectionId: number, userId: number): Promise<number> {
    return await this.nativeDelete({ collection: collectionId, user: userId, status: 'accepted' });
  }

  /** CL86 (`setMemberRole`) — `UPDATE collection_members SET role=? WHERE collection_id=? AND user_id=? AND status='accepted'`. Returns the affected row count (0 ⇒ 404). */
  async setRole(collectionId: number, userId: number, role: string): Promise<number> {
    return await this.nativeUpdate({ collection: collectionId, user: userId, status: 'accepted' }, { role });
  }

  /**
   * CL87 (`availableUsers`) — `SELECT u.id, u.username FROM users u WHERE
   * u.id != ? AND u.id NOT IN (SELECT user_id FROM collection_members WHERE
   * collection_id = ?) AND u.is_guest = 0 ORDER BY u.username`. Kysely — a
   * `NOT IN` subquery against a different repository's own table (`users`),
   * the same cross-entity shape `pendingInvitesForUser` above already uses.
   */
  async availableUsers(ownerId: number, collectionId: number): Promise<{ id: number; username: string }[]> {
    return await this.kysely<CollectionAvailableUsersKyselyDB>()
      .selectFrom('users as u')
      .select(['u.id', 'u.username'])
      .where('u.id', '!=', ownerId)
      .where('u.is_guest', '=', 0)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('collection_members as cm')
              .select('cm.user_id')
              .whereRef('cm.user_id', '=', 'u.id')
              .where('cm.collection_id', '=', collectionId),
          ),
        ),
      )
      .orderBy('u.username')
      .execute();
  }

  /** CL88 (`findMembershipForUser`) — `SELECT status FROM collection_members WHERE collection_id=? AND user_id=?` (no status filter — any row, pending or accepted). */
  async statusFor(collectionId: number, userId: number): Promise<string | undefined> {
    const row = await this.findOne({ collection: collectionId, user: userId }, { fields: ['status'] });
    return row?.status;
  }
}

/** {@link CollectionMembersRepository.availableUsers}'s narrow `users`/`collection_members` shape. */
interface CollectionAvailableUsersKyselyDB {
  users: { id: number; username: string; is_guest: number };
  collection_members: { collection_id: number; user_id: number };
}
