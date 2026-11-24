import { daySchema, type DayTiming } from '@trek/shared';
import { apiClient } from './client';

export async function saveDayTiming(tripId: number | string, id: number, timing: DayTiming) {
  return daySchema.parse((await apiClient.put(`/trips/${tripId}/days/${id}/timing`, timing)).data.day);
}
