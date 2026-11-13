import { VacayIcsCalendars } from '../entities/VacayIcsCalendars.entity';
import { dbNow } from '../types';
import { toRow } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

export interface VacayIcsCalendarRow {
  id: number;
  plan_id: number;
  url: string;
  label: string;
  color: string;
  events: string;
  last_fetched_at: string | null;
  last_error: string | null;
}

export class VacayIcsCalendarsRepository extends TrekRepository<VacayIcsCalendars> {
  async listForPlan(planId: number): Promise<VacayIcsCalendarRow[]> {
    return (await this.find({ plan: planId }, { orderBy: { id: 'asc' } })).map((r) => toRow(r) as VacayIcsCalendarRow);
  }
  async listAll(): Promise<VacayIcsCalendarRow[]> {
    return (await this.find({}, { orderBy: { id: 'asc' } })).map((r) => toRow(r) as VacayIcsCalendarRow);
  }
  async findScoped(id: number, planId: number): Promise<VacayIcsCalendarRow | null> {
    const row = await this.findOne({ id, plan: planId });
    return row ? (toRow(row) as VacayIcsCalendarRow) : null;
  }
  async existsForPlanUrl(planId: number, url: string): Promise<boolean> {
    return (await this.findOne({ plan: planId, url }, { fields: ['id'] })) !== null;
  }
  async add(planId: number, url: string, label: string, color: string, events: string): Promise<number> {
    return this.insert({
      plan: planId,
      url,
      label,
      color,
      events,
      last_fetched_at: dbNow() as string,
      last_error: null,
    });
  }
  async updateDisplay(id: number, planId: number, values: { label?: string; color?: string }): Promise<void> {
    await this.nativeUpdate({ id, plan: planId }, values);
  }
  async saveFetch(id: number, events: string): Promise<void> {
    await this.nativeUpdate({ id }, { events, last_fetched_at: dbNow(), last_error: null });
  }
  async fetchFailed(id: number, error: string): Promise<void> {
    await this.nativeUpdate({ id }, { last_error: error });
  }
  async remove(id: number, planId: number): Promise<void> {
    await this.nativeDelete({ id, plan: planId });
  }
}
