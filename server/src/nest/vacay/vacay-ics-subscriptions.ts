import type { VacayIcsCalendarsRepository } from '../../db/repositories/VacayIcsCalendars.repository';
import { DomainError } from '../common/domain-error';
import type { UnitOfWork } from '../database/unit-of-work';
import { fetchIcs, type IcsEvent } from './vacay-ics';

/** ICS subscription workflows, with access checks and notifications supplied by the plan service. */
export class VacayIcsSubscriptions {
  constructor(
    private readonly calendars: VacayIcsCalendarsRepository,
    private readonly uow: UnitOfWork,
    private readonly assertParticipant: (planId: number, userId: number) => Promise<void>,
    private readonly notifyPlanUsers: (
      planId: number,
      socketId: string | undefined,
      event: 'vacay:settings',
    ) => Promise<void>,
  ) {}

  async eventsForWindow(planId: number, start: string, end: string) {
    return (await this.calendars.listForPlan(planId)).map((cal) => ({
      id: cal.id,
      label: cal.label,
      color: cal.color,
      events: (JSON.parse(cal.events || '[]') as IcsEvent[]).filter((e) => e.start < end && e.end > start),
    }));
  }

  async listIcsCalendars(planId: number, userId: number) {
    await this.assertParticipant(planId, userId);
    return (await this.calendars.listForPlan(planId)).map((cal) => ({
      id: cal.id,
      label: cal.label,
      color: cal.color,
      url: cal.url,
      last_fetched_at: cal.last_fetched_at,
      last_error: cal.last_error,
      event_count: (JSON.parse(cal.events || '[]') as IcsEvent[]).length,
    }));
  }

  async addIcsCalendar(planId: number, userId: number, url: string, label: string, color: string, socketId?: string) {
    await this.assertParticipant(planId, userId);
    let events: IcsEvent[];
    try {
      events = await fetchIcs(url);
    } catch (error) {
      throw new DomainError(400, error instanceof Error ? error.message : 'Could not read ICS calendar');
    }
    if (events.length === 0) throw new DomainError(400, 'Calendar contains no supported all-day events');
    const id = await this.uow.transactional(async () => {
      if (await this.calendars.existsForPlanUrl(planId, url))
        throw new DomainError(400, 'Calendar URL is already subscribed');
      return this.calendars.add(planId, url, label.trim(), color, JSON.stringify(events));
    });
    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return {
      id,
      label: label.trim(),
      color,
      last_fetched_at: new Date().toISOString(),
      last_error: null,
      event_count: events.length,
    };
  }

  async updateIcsCalendar(
    planId: number,
    userId: number,
    id: number,
    values: { label?: string; color?: string },
    socketId?: string,
  ) {
    await this.assertParticipant(planId, userId);
    const existing = await this.calendars.findScoped(id, planId);
    if (!existing) return null;
    await this.calendars.updateDisplay(id, planId, values);
    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return {
      id,
      label: values.label ?? existing.label,
      color: values.color ?? existing.color,
      url: existing.url,
      last_fetched_at: existing.last_fetched_at,
      last_error: existing.last_error,
      event_count: (JSON.parse(existing.events || '[]') as IcsEvent[]).length,
    };
  }

  async deleteIcsCalendar(planId: number, userId: number, id: number, socketId?: string) {
    await this.assertParticipant(planId, userId);
    const existing = await this.calendars.findScoped(id, planId);
    if (!existing) return false;
    await this.calendars.remove(id, planId);
    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return true;
  }

  /** @txIndependent Each subscription refresh stands alone, with network I/O between database writes. */
  async refreshIcsCalendars(): Promise<void> {
    for (const cal of await this.calendars.listAll()) {
      try {
        await this.calendars.saveFetch(cal.id, JSON.stringify(await fetchIcs(cal.url)));
        await this.notifyPlanUsers(cal.plan_id, undefined, 'vacay:settings');
      } catch (error) {
        await this.calendars.fetchFailed(cal.id, error instanceof Error ? error.message : 'Refresh failed');
      }
    }
  }
}
