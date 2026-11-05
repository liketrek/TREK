import { PlaceContribLog } from '../../db/entities/PlaceContribLog.entity';
import { PlaceContribOutbox } from '../../db/entities/PlaceContribOutbox.entity';
import type { PlaceContribLogRepository, PlaceContribLogWrite } from '../../db/repositories/PlaceContribLog.repository';
import type { PlaceContribOutboxRepository } from '../../db/repositories/PlaceContribOutbox.repository';
import { logWarn } from '../audit/audit-log.logger';
import { DomainError, badRequest, conflict } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { SettingsService } from '../settings/settings.service';
import { PlaceContribQueue } from './place-contrib-queue';
import { agreedToCurrentTerms, PlaceContribSettings } from './place-contrib-settings';
import { PlaceContribClient } from './place-contrib.client';
import { COUNT_WINDOW_DAYS, OUTBOX_CAP, SNOOZE_DAYS } from './place-contrib.constants';
import { dayOf } from './place-contrib.helpers';
import { PlaceContribJob } from './place-contrib.job';
import type { ContribWrite } from './place-contrib.types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  PLACE_CONTRIB_FIELDS,
  PLACE_CONTRIB_TERMS_VERSION,
  type PlaceContribConsent,
  type PlaceContribDecisionRequest,
  type PlaceContribField,
  type PlaceContribFieldSwitches,
  type PlaceContribLogQuery,
  type PlaceContribLogResponse,
  type PlaceContribLogResult,
  type PlaceContribState,
  type PlaceContribWithdrawResponse,
} from '@trek/shared';

const DAY_MS = 24 * 3_600_000;
const LOG_RESULTS: readonly PlaceContribLogResult[] = ['accepted', 'duplicate', 'rejected', 'withheld', 'retracted'];

/**
 * The community enrichment of place details, as the admin and the places
 * domain see it: the admin's decision and the state the admin panel shows, the
 * transmission log, withdrawing everything, and the queue a place write feeds.
 *
 * Nothing leaves here. The queue is drained by PlaceContribSender on its cron,
 * and only while the installation is eligible and an admin agreed to the
 * terms in force; every value it holds is one the origin tracking recorded as
 * typed by a user.
 */
@Injectable()
export class PlaceContribService {
  constructor(
    @InjectRepository(PlaceContribOutbox) private readonly outbox: PlaceContribOutboxRepository,
    @InjectRepository(PlaceContribLog) private readonly log: PlaceContribLogRepository,
    private readonly store: PlaceContribSettings,
    private readonly settings: SettingsService,
    private readonly client: PlaceContribClient,
    private readonly uow: UnitOfWork,
    private readonly job: PlaceContribJob,
    private readonly queue: PlaceContribQueue,
  ) {}

  async state(adminId: number, now: Date = new Date()): Promise<PlaceContribState> {
    const eligibility = this.store.eligibility();
    const consent = await this.store.consent();
    const snoozedUntil = await this.store.snoozedUntil(adminId, now);
    const decidedForTerms = consent.decision !== null && consent.termsVersion === PLACE_CONTRIB_TERMS_VERSION;
    const size = await this.outbox.size();
    const active = eligibility.eligible && agreedToCurrentTerms(consent) && anyField(consent.fields);
    return {
      termsVersion: PLACE_CONTRIB_TERMS_VERSION,
      ceiling: this.store.ceiling(),
      eligible: eligibility.eligible,
      ineligibleReason: eligibility.reason,
      consent,
      showPrompt: eligibility.eligible && !decidedForTerms && snoozedUntil === null,
      snoozedUntil,
      active,
      counts: await this.counts(now),
      lastSuccessDay: await this.log.lastAcceptedDay(),
      queue: { size, cap: OUTBOX_CAP, full: size >= OUTBOX_CAP },
      pauseReason: active ? await this.store.pauseReason(now) : null,
      registrationOpen: (await this.settings.getAppSetting('allow_registration')) !== 'false',
    };
  }

  /**
   * One decision of an admin. An agreement or a refusal names the terms it
   * was shown; a dialog built for older terms is refused with 409 and reloads.
   * Answers the state that follows.
   *
   * @txIndependent switching off commits before the withdrawal asks the service, which is network I/O.
   */
  async decide(
    adminId: number,
    request: PlaceContribDecisionRequest,
    now: Date = new Date(),
  ): Promise<PlaceContribState> {
    const consent = await this.store.consent();
    const decided = { decidedBy: adminId, decidedAt: now.toISOString() };
    switch (request.action) {
      case 'agree':
        assertCurrentTerms(request.termsVersion);
        if (!anyField(request.fields)) throw badRequest('Pick at least one field to share', { reason: 'no_field' });
        // A new agreement is a fresh start: a pause over a key or a wait the
        // service asked for is tried again on the next run, and what users
        // typed before the agreement goes out too, caught up page by page.
        await this.uow.transactional(async () => {
          await this.store.writeConsent({
            enabled: true,
            fields: request.fields,
            termsVersion: request.termsVersion,
            decision: 'agreed',
            ...decided,
            includesEarlier: true,
          });
          await this.store.clearPause();
          await this.store.writeBackfill({ fields: switchedOn(request.fields), afterId: 0 });
        });
        this.job.sendSoon();
        break;
      case 'snooze':
        await this.store.snooze(adminId, new Date(now.getTime() + SNOOZE_DAYS * DAY_MS));
        break;
      case 'decline':
        assertCurrentTerms(request.termsVersion);
        await this.switchOff(consent, { decision: 'declined', termsVersion: request.termsVersion, ...decided });
        break;
      case 'fields':
        await this.changeFields(consent, request.fields, { withdraw: request.withdraw === true, decided });
        break;
      case 'off':
        await this.switchOff(consent, { decision: 'off', termsVersion: consent.termsVersion, ...decided });
        if (request.withdraw) await this.withdrawAll(now);
        break;
    }
    return this.state(adminId, now);
  }

  async logPage(query: PlaceContribLogQuery): Promise<PlaceContribLogResponse> {
    const filter = { result: query.result, field: query.field };
    const rows = await this.log.page(filter, query.perPage, (query.page - 1) * query.perPage);
    return {
      entries: rows.map((row) => ({
        id: row.id,
        day: row.day,
        key: row.contrib_key,
        placeName: row.place_name,
        field: row.field as PlaceContribField,
        valueSummary: row.value_summary,
        result: row.result as PlaceContribLogResult,
        reason: row.reason,
      })),
      total: await this.log.total(filter),
      page: query.page,
      perPage: query.perPage,
    };
  }

  /**
   * Asks the service to withdraw everything this installation sent, then
   * empties the queue here. When the service does not confirm, nothing is
   * dropped and the admin sees why.
   */
  async withdrawAll(now: Date = new Date()): Promise<PlaceContribWithdrawResponse> {
    const answer = await this.client.withdraw();
    if (answer.kind !== 'ok') {
      const reason = answer.kind === 'refused' ? answer.error : answer.reason;
      logWarn(`Places contribution: the withdrawal was not confirmed (${reason})`);
      throw new DomainError(502, 'The TREK Places API did not confirm the withdrawal', { details: { reason } });
    }
    const withdrawn = countsOf(answer.body.withdrawn);
    const day = dayOf(now);
    const lines: PlaceContribLogWrite[] = PLACE_CONTRIB_FIELDS.filter((field) => (withdrawn[field] ?? 0) > 0).map(
      (field) => ({
        day,
        contrib_key: '*',
        place_name: '',
        field,
        value_summary: String(withdrawn[field]),
        result: 'retracted',
        reason: 'withdraw_all',
      }),
    );
    // Everything taken back stays back: the catch-up does not send it again.
    const cleared = await this.uow.transactional(async () => {
      await this.log.insertLines(lines);
      await this.store.writeBackfill(null);
      return this.outbox.deleteAll();
    });
    return { withdrawn, cleared };
  }

  /**
   * A place write the origin tracking saw. Values that are no longer the
   * user's leave the queue whatever the decision; the user's values are
   * queued only while the installation is eligible and an admin agreed, each
   * for a field that is switched on, and only for a place the service can key.
   * The newest value replaces a queued one, and the queue is sent at once.
   *
   * @txStandalone a derived write after the place write committed: it never fails that write.
   * @txIndependent the queue is one transaction; the send run it starts writes its own steps, apart from it.
   */
  async enqueue(write: ContribWrite, now: Date = new Date()): Promise<void> {
    const active = await this.store.activeFields();
    await this.uow.transactional(() => this.queue.put(write, active, now));
    this.job.sendSoon();
  }

  private async counts(now: Date): Promise<PlaceContribState['counts']> {
    const rows = await this.log.countsSince(dayOf(new Date(now.getTime() - COUNT_WINDOW_DAYS * DAY_MS)));
    const counts = { accepted: 0, duplicate: 0, rejected: 0, withheld: 0, retracted: 0 };
    for (const row of rows)
      if (LOG_RESULTS.includes(row.result as PlaceContribLogResult))
        counts[row.result as PlaceContribLogResult] = row.count;
    return counts;
  }

  /** Off or declined: nothing more is sent, and what waits in the queue goes. */
  private async switchOff(
    consent: PlaceContribConsent,
    change: Pick<PlaceContribConsent, 'decision' | 'termsVersion' | 'decidedBy' | 'decidedAt'>,
  ): Promise<void> {
    await this.uow.transactional(async () => {
      await this.store.writeConsent({ ...consent, ...change, enabled: false });
      await this.outbox.deleteAll();
      await this.store.writeBackfill(null);
    });
  }

  /** @txIndependent the switches and the catch-up commit together before any withdrawal asks the service, which is network I/O. */
  private async changeFields(
    consent: PlaceContribConsent,
    fields: PlaceContribFieldSwitches,
    opts: { withdraw: boolean; decided: Pick<PlaceContribConsent, 'decidedBy' | 'decidedAt'> },
  ): Promise<void> {
    if (!agreedToCurrentTerms(consent)) {
      throw conflict('Sharing is not switched on', { reason: 'not_agreed' });
    }
    if (!anyField(fields)) throw badRequest('Pick at least one field to share', { reason: 'no_field' });
    const removed = PLACE_CONTRIB_FIELDS.filter((field) => consent.fields[field] && !fields[field]);
    const added = PLACE_CONTRIB_FIELDS.filter((field) => !consent.fields[field] && fields[field]);
    const catchUp = added.length > 0 && consent.includesEarlier === true;
    await this.uow.transactional(async () => {
      await this.store.writeConsent({ ...consent, fields, ...opts.decided });
      await this.outbox.deleteFields(removed);
      // A field switched on catches up too, under an agreement that said so.
      // The catch-up keeps one position, so it starts over for every field it
      // still had to do; what went out already is answered as a duplicate.
      if (catchUp) {
        const pending = (await this.store.backfill())?.fields ?? [];
        const catchUpFields = PLACE_CONTRIB_FIELDS.filter((field) => added.includes(field) || pending.includes(field));
        await this.store.writeBackfill({ fields: catchUpFields, afterId: 0 });
      }
    });
    if (catchUp) this.job.sendSoon();
    if (!opts.withdraw) return;
    await Promise.all(
      removed.map(async (field) => {
        const answer = await this.client.withdraw({ field });
        if (answer.kind !== 'ok') logWarn(`Places contribution: withdrawing ${field} was not confirmed`);
      }),
    );
  }
}

function anyField(fields: PlaceContribFieldSwitches): boolean {
  return PLACE_CONTRIB_FIELDS.some((field) => fields[field]);
}

function switchedOn(fields: PlaceContribFieldSwitches): PlaceContribField[] {
  return PLACE_CONTRIB_FIELDS.filter((field) => fields[field]);
}

function assertCurrentTerms(termsVersion: number): void {
  if (termsVersion !== PLACE_CONTRIB_TERMS_VERSION) {
    throw conflict('The contribution terms changed', {
      reason: 'terms_outdated',
      termsVersion: PLACE_CONTRIB_TERMS_VERSION,
    });
  }
}

/** The service's per-kind counts, the numbers only. */
function countsOf(withdrawn: Record<string, unknown> | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [kind, value] of Object.entries(withdrawn ?? {})) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) counts[kind] = value;
  }
  return counts;
}
