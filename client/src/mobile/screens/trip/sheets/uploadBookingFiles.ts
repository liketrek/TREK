import type { TripPlanner } from '../MTripShell'

/**
 * Uploads the files picked in a booking or transport sheet against the saved
 * record. Runs after both a create and an edit: the sheet only holds files the
 * user just picked, so nothing is uploaded twice, and skipping the edit dropped
 * them without a word (#2534). A save that did not come back with a record
 * uploads nothing.
 */
export async function uploadBookingFiles(
  planner: Pick<TripPlanner, 'tripId' | 'tripActions' | 'canUploadFiles'>,
  savedId: number | undefined,
  files: File[],
  description: string,
): Promise<void> {
  if (!savedId || !planner.canUploadFiles) return
  for (const file of files) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('reservation_id', String(savedId))
    fd.append('description', description)
    await planner.tripActions.addFile(planner.tripId, fd)
  }
}
