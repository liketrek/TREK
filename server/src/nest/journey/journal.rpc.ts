import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { asPayload, num } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { ADDON_IDS } from '../../addons';
import { JourneyDomainService } from './journey-domain.service';

/**
 * The journal surface a plugin may reach (#plugins).
 *
 * Journeys are user-scoped, not trip-scoped, so there is no tripId to check. The
 * access decision belongs to JourneyDomainService, which self-gates every call
 * against the acting user (owner or contributor) and answers with null rather than
 * throwing; each handler turns that null into RESOURCE_FORBIDDEN.
 */
@PluginController()
export class JournalRpc {
  constructor(
    private readonly journey: JourneyDomainService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('journal.listMine', { permission: 'db:read:journal' })
  listMine(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'reads');
    this.requireJourneyAddon();
    return this.journey.listJourneys(userId);
  }

  @PluginMethod('journal.getEntries', { permission: 'db:read:journal' })
  getEntries(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'reads');
    const journeyId = num(params.journeyId, 'journeyId');
    this.requireJourneyAddon();
    // listEntries self-gates via canAccessJourney and returns null when the user
    // cannot see it.
    const entries = this.journey.listEntries(journeyId, userId);
    if (entries === null) throw new ForbiddenResource(`no access to journey ${journeyId}`);
    return entries;
  }

  @PluginMethod('journal.createEntry', { permission: 'db:write:journal' })
  createEntry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const input = asPayload(params.input);
    if (typeof input.entry_date !== 'string' || input.entry_date === '') throw new BadParams('entry_date is required');
    const journeyId = num(params.journeyId, 'journeyId');
    this.requireJourneyAddon();
    const entry = this.journey.createEntry(journeyId, userId, input as never);
    if (!entry) throw new ForbiddenResource(`no editable journey ${journeyId} for this user`);
    return entry;
  }

  @PluginMethod('journal.updateEntry', { permission: 'db:write:journal' })
  updateEntry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const entryId = num(params.entryId, 'entryId');
    this.requireJourneyAddon();
    const entry = this.journey.updateEntry(entryId, userId, asPayload(params.input) as never);
    if (!entry) throw new ForbiddenResource(`no editable journal entry ${entryId} for this user`);
    return entry;
  }

  @PluginMethod('journal.deleteEntry', { permission: 'db:write:journal' })
  deleteEntry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const entryId = num(params.entryId, 'entryId');
    this.requireJourneyAddon();
    if (!this.journey.deleteEntry(entryId, userId)) {
      throw new ForbiddenResource(`no editable journal entry ${entryId} for this user`);
    }
    return { deleted: true };
  }

  @PluginMethod('journal.createJourney', { permission: 'db:write:journal' })
  createJourney(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const input = asPayload(params.input);
    this.requireJourneyAddon();
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) throw new BadParams('journal title is required');
    return this.journey.createJourney(userId, {
      title,
      subtitle: input.subtitle as string | undefined,
      trip_ids: input.trip_ids as number[] | undefined,
    });
  }

  @PluginMethod('journal.deleteJourney', { permission: 'db:write:journal' })
  deleteJourney(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireJournalUser(ctx, 'writes');
    const journeyId = num(params.journeyId, 'journeyId');
    this.requireJourneyAddon();
    if (!this.journey.deleteJourney(journeyId, userId)) {
      throw new ForbiddenResource(`no deletable journal ${journeyId} for this user`);
    }
    return { deleted: true };
  }

  private requireJournalUser(ctx: PluginRpcContext, kind: 'reads' | 'writes'): number {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource(`journal ${kind} require an authenticated user context`);
    }
    return ctx.actingUserId;
  }

  private requireJourneyAddon(): void {
    this.guards.requireAddon(ADDON_IDS.JOURNEY, 'journey');
  }
}
