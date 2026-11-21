import { assignmentSchema, type AssignmentStayRequest } from '@trek/shared';
import { apiClient } from './client';

/** How long the drive stands at one visit (#3092); null hands it back to the place's stay. */
export async function saveAssignmentStay(tripId: number | string, id: number, body: AssignmentStayRequest) {
  const saved = await apiClient.put(`/trips/${tripId}/assignments/${id}/stay`, body);
  return assignmentSchema.parse(saved.data.assignment);
}
