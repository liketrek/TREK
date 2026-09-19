import { assignmentSchema, type AssignmentEndDayRequest } from '@trek/shared'
import { apiClient } from './client'

export async function saveAssignmentEndDay(tripId: number | string, id: number, body: AssignmentEndDayRequest) {
  const saved = await apiClient.put(`/trips/${tripId}/assignments/${id}/end-day`, body)
  return assignmentSchema.parse(saved.data.assignment)
}
