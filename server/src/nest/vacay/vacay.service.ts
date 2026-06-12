import { Injectable } from '@nestjs/common';
import * as svc from '../../services/vacayService';

type UpdatePlanBody = Parameters<typeof svc.updatePlan>[1];

/**
 * Thin Nest wrapper around the existing vacay service. All plan logic, the
 * holiday-calendar handling, invite flow and the WebSocket broadcasts (driven by
 * the forwarded socket id) stay in vacayService, so behaviour is unchanged.
 */
@Injectable()
export class VacayService {
  getPlanData(userId: number) {
    return svc.getPlanData(userId);
  }

  getActivePlanId(userId: number): number {
    return svc.getActivePlanId(userId);
  }

  getActivePlan(userId: number) {
    return svc.getActivePlan(userId);
  }

  updatePlan(planId: number, body: UpdatePlanBody, socketId: string | undefined) {
    return svc.updatePlan(planId, body, socketId);
  }

  addHolidayCalendar(planId: number, region: string, label: string | null, color: string | undefined, sortOrder: number | undefined, socketId: string | undefined) {
    return svc.addHolidayCalendar(planId, region, label, color, sortOrder, socketId);
  }

  updateHolidayCalendar(id: number, planId: number, body: Parameters<typeof svc.updateHolidayCalendar>[2], socketId: string | undefined) {
    return svc.updateHolidayCalendar(id, planId, body, socketId);
  }

  deleteHolidayCalendar(id: number, planId: number, socketId: string | undefined): boolean {
    return svc.deleteHolidayCalendar(id, planId, socketId);
  }

  getPlanUsers(planId: number) {
    return svc.getPlanUsers(planId);
  }

  setUserColor(userId: number, planId: number, color: string | undefined, socketId: string | undefined): void {
    svc.setUserColor(userId, planId, color, socketId);
  }

  sendInvite(planId: number, inviterId: number, inviterUsername: string, inviterEmail: string, targetUserId: number) {
    return svc.sendInvite(planId, inviterId, inviterUsername, inviterEmail, targetUserId);
  }

  acceptInvite(userId: number, planId: number, socketId: string | undefined) {
    return svc.acceptInvite(userId, planId, socketId);
  }

  declineInvite(userId: number, planId: number, socketId: string | undefined): void {
    svc.declineInvite(userId, planId, socketId);
  }

  cancelInvite(planId: number, targetUserId: number): void {
    svc.cancelInvite(planId, targetUserId);
  }

  dissolvePlan(userId: number, socketId: string | undefined): void {
    svc.dissolvePlan(userId, socketId);
  }

  getAvailableUsers(userId: number, planId: number) {
    return svc.getAvailableUsers(userId, planId);
  }

  listYears(planId: number): number[] {
    return svc.listYears(planId);
  }

  addYear(planId: number, year: number, socketId: string | undefined): number[] {
    return svc.addYear(planId, year, socketId);
  }

  deleteYear(planId: number, year: number, socketId: string | undefined): number[] {
    return svc.deleteYear(planId, year, socketId);
  }

  getEntries(planId: number, year: string) {
    return svc.getEntries(planId, year);
  }

  toggleEntry(userId: number, planId: number, date: string, socketId: string | undefined) {
    return svc.toggleEntry(userId, planId, date, socketId);
  }

  toggleCompanyHoliday(planId: number, date: string, note: string | undefined, socketId: string | undefined) {
    return svc.toggleCompanyHoliday(planId, date, note, socketId);
  }

  getStats(planId: number, year: number) {
    return svc.getStats(planId, year);
  }

  updateStats(userId: number, planId: number, year: number, vacationDays: number, socketId: string | undefined): void {
    svc.updateStats(userId, planId, year, vacationDays, socketId);
  }

  getCountries() {
    return svc.getCountries();
  }

  getHolidays(year: string, country: string) {
    return svc.getHolidays(year, country);
  }
}
