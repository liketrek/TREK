import { JourneyContributors } from '../../db/entities/JourneyContributors.entity';
import { TripJournalLinks } from '../../db/entities/TripJournalLinks.entity';
import type { JourneyContributorsRepository } from '../../db/repositories/JourneyContributors.repository';
import type { TripJournalLinksRepository, TripPersonRow } from '../../db/repositories/TripJournalLinks.repository';
import { avatarUrl } from '../common/avatarUrl';
import { forbidden, notFound } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { JourneyDomainService } from './journey-domain.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  TripJournalAccessRole,
  TripJournalCandidate,
  TripJournalLinkMemberRequest,
  TripJournalLinkResponse,
} from '@trek/shared';

/** Who is acting: their id, and their account role for the admin bypass of trip permissions. */
export interface TripJournalActor {
  id: number;
  role: string;
}

const NOT_LINKED = 'No journal is linked to this trip';

/**
 * A trip that shows one journal from the Journey addon as its own.
 *
 * Linking opens the journal to the trip members chosen for it, as viewers or
 * editors, for as long as the link holds them and they stay on the trip. That
 * access is read wherever journal access is read (`JourneyContributorsRepository`
 * folds it in), so the journal's own screens, its live updates and its MCP tools
 * serve linked members without knowing about trips.
 *
 * Linking a journal, or changing who it is open to, hands someone else's access
 * to it, so it takes the journal's owner, and on the trip the `journal_link`
 * permission. Taking the link down only takes access away, so the permission
 * alone or the journal's owner alone is enough.
 */
@Injectable()
export class TripJournalLinkService {
  constructor(
    @InjectRepository(TripJournalLinks) private readonly links: TripJournalLinksRepository,
    @InjectRepository(JourneyContributors) private readonly contributors: JourneyContributorsRepository,
    private readonly journeys: JourneyDomainService,
    private readonly tripAccess: TripAccessService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly uow: UnitOfWork,
  ) {}

  /** The trip, or a 404 for someone who is not on it. */
  private async requireTrip(tripId: number, actor: TripJournalActor) {
    const trip = await this.tripAccess.findAccessible(tripId, actor.id);
    if (!trip) throw notFound('Trip not found');
    return trip;
  }

  private async mayLink(trip: { user_id: number }, actor: TripJournalActor): Promise<boolean> {
    return this.permissions.checkPermission(
      'journal_link',
      actor.role,
      trip.user_id,
      actor.id,
      trip.user_id !== actor.id,
    );
  }

  /** The access someone holds on a journal today, as owner, contributor or through a link. */
  private async accessOf(journeyId: number, ownerId: number, userId: number): Promise<TripJournalAccessRole | null> {
    if (userId === ownerId) return 'owner';
    const role = await this.contributors.findAccessRole(journeyId, userId);
    return role === 'owner' || role === 'editor' || role === 'viewer' ? role : null;
  }

  /** The trip's journal as this person sees it, and what they may do with it. */
  async get(tripId: number, actor: TripJournalActor): Promise<TripJournalLinkResponse> {
    const trip = await this.requireTrip(tripId, actor);
    const canLink = await this.mayLink(trip, actor);
    const row = await this.links.findForTrip(tripId);
    if (!row) return { link: null, can_link: canLink, can_unlink: false, can_edit_members: false };

    const isJournalOwner = row.journey_owner_id === actor.id;
    const myRole = await this.accessOf(row.journey_id, row.journey_owner_id, actor.id);
    const canEditMembers = canLink && isJournalOwner;
    const canUnlink = canLink || isJournalOwner;
    // Someone the journal is closed to, and who can do nothing about the link,
    // does not see that the trip has one.
    if (!myRole && !canLink) return { link: null, can_link: false, can_unlink: false, can_edit_members: false };

    const members = canLink || isJournalOwner ? await this.links.listMembers(tripId) : null;
    return {
      link: {
        journey_id: row.journey_id,
        title: row.journey_title,
        subtitle: row.journey_subtitle,
        cover_image: row.journey_cover_image,
        owner_id: row.journey_owner_id,
        linked_by: row.linked_by,
        created_at: row.created_at,
        my_role: myRole,
        members:
          members?.map((m) => ({ user_id: m.user_id, username: m.username, avatar_url: avatarUrl(m), role: m.role })) ??
          null,
      },
      can_link: canLink,
      can_unlink: canUnlink,
      can_edit_members: canEditMembers,
    };
  }

  /**
   * The people of the trip who could be let into a journal, with the access they
   * hold there today. A null `access` is someone the link would let in for the
   * first time, the person the dialog warns about. Only for the journal's owner.
   */
  async candidates(tripId: number, actor: TripJournalActor, journeyId: number): Promise<TripJournalCandidate[]> {
    await this.requireTrip(tripId, actor);
    if (!(await this.journeys.isOwner(journeyId, actor.id))) throw forbidden('Only the journal owner can link it');
    const people = (await this.links.listTripPeople(tripId)).filter((p) => !p.is_guest && p.user_id !== actor.id);
    return await Promise.all(
      people.map(async (p) => ({
        user_id: p.user_id,
        username: p.username,
        avatar_url: avatarUrl(p),
        is_trip_owner: p.is_trip_owner,
        access: await this.accessOf(journeyId, actor.id, p.user_id),
      })),
    );
  }

  /**
   * The members a link may hold: people on the trip, never a guest (who cannot
   * sign in) and never the journal's owner (who has it anyway). A repeated id
   * keeps its last role.
   */
  private allowedMembers(
    people: TripPersonRow[],
    ownerId: number,
    members: TripJournalLinkMemberRequest[],
  ): TripJournalLinkMemberRequest[] {
    const onTrip = new Set(people.filter((p) => !p.is_guest).map((p) => p.user_id));
    const byUser = new Map<number, TripJournalLinkMemberRequest>();
    for (const m of members) {
      if (m.user_id === ownerId) continue;
      if (!onTrip.has(m.user_id)) throw forbidden('Only members of this trip can be given the journal');
      byUser.set(m.user_id, m);
    }
    return [...byUser.values()];
  }

  /** Shows a journal in the trip, to these members, replacing the one it showed. */
  async link(
    tripId: number,
    actor: TripJournalActor,
    journeyId: number,
    members: TripJournalLinkMemberRequest[],
    socketId?: string,
  ): Promise<TripJournalLinkResponse> {
    const trip = await this.requireTrip(tripId, actor);
    if (!(await this.mayLink(trip, actor))) throw forbidden('No permission to link a journal');
    if (!(await this.journeys.isOwner(journeyId, actor.id))) throw forbidden('Only the journal owner can link it');
    const allowed = this.allowedMembers(await this.links.listTripPeople(tripId), actor.id, members);
    const now = Date.now();
    await this.uow.transactional(async () => {
      await this.links.upsertLink(tripId, journeyId, actor.id, now);
      await this.links.replaceMembers(tripId, allowed, now);
    });
    this.realtime.broadcast(tripId, 'trip:journal:changed', {}, socketId);
    return this.get(tripId, actor);
  }

  /** Changes who the linked journal is open to. */
  async setMembers(
    tripId: number,
    actor: TripJournalActor,
    members: TripJournalLinkMemberRequest[],
    socketId?: string,
  ): Promise<TripJournalLinkResponse> {
    const trip = await this.requireTrip(tripId, actor);
    const row = await this.links.findForTrip(tripId);
    if (!row) throw notFound(NOT_LINKED);
    if (!(await this.mayLink(trip, actor)) || row.journey_owner_id !== actor.id) {
      throw forbidden('Only the journal owner can change who it is open to');
    }
    const allowed = this.allowedMembers(await this.links.listTripPeople(tripId), row.journey_owner_id, members);
    await this.uow.transactional(async () => {
      await this.links.replaceMembers(tripId, allowed, Date.now());
    });
    this.realtime.broadcast(tripId, 'trip:journal:changed', {}, socketId);
    return this.get(tripId, actor);
  }

  /** Takes the journal off the trip; everyone it let in loses that access. */
  async unlink(tripId: number, actor: TripJournalActor, socketId?: string): Promise<TripJournalLinkResponse> {
    const trip = await this.requireTrip(tripId, actor);
    const row = await this.links.findForTrip(tripId);
    if (!row) throw notFound(NOT_LINKED);
    if (!(await this.mayLink(trip, actor)) && row.journey_owner_id !== actor.id) {
      throw forbidden('No permission to unlink the journal');
    }
    await this.links.deleteForTrip(tripId);
    this.realtime.broadcast(tripId, 'trip:journal:changed', {}, socketId);
    return this.get(tripId, actor);
  }
}
