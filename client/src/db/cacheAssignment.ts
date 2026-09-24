import { offlineDb } from './offlineDb'
import type { Assignment } from '../types'

export async function cacheAssignment(assignment: Assignment): Promise<void> {
  await offlineDb.days.where('id').equals(assignment.day_id).modify(day => {
    day.assignments = (day.assignments ?? []).map(a => a.id === assignment.id ? { ...a, ...assignment } : a)
  })
}
