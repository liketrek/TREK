import { filesApi } from '../../api/client'

/**
 * Uploading receipts alongside an expense, and undoing it when the expense
 * itself fails to save.
 *
 * One module for both shells. The desktop form and the phone sheet each had
 * their own copy of this, three near-identical try/catch blocks apiece, which is
 * six places for the same bug to sit and six copies against the duplication
 * budget the PR gate measures.
 */

/** Upload each file and return the ids the server handed back, in order. */
export async function uploadReceipts(
  tripId: number | string,
  files: readonly File[],
  budgetItemId: number | null,
): Promise<number[]> {
  const ids: number[] = []
  for (const file of files) {
    const fd = new FormData()
    fd.append('file', file)
    // Only an existing expense can be named here. A new one has no id yet, so
    // its receipts are linked by the create call instead.
    if (budgetItemId != null) fd.append('budget_item_id', String(budgetItemId))
    const res = await filesApi.upload(tripId, fd)
    if (res?.file?.id) ids.push(res.file.id)
  }
  return ids
}

/**
 * Undo an upload after the save it belonged to failed.
 *
 * Two calls per file, and the order matters: the permanent route only accepts a
 * file that is already in the trash (`deleted_at IS NOT NULL`), so calling it on
 * a freshly uploaded file answers 404 and the file stays on the trip. The soft
 * delete puts it there first. It also drops the receipt link the upload created,
 * so a failed edit does not leave the file attached to the expense.
 *
 * Returns the ids it could not remove. The caller is expected to say so rather
 * than swallow it: a file left behind is a file the user has to find in the
 * Files tab and delete by hand.
 */
export async function discardReceipts(
  tripId: number | string,
  ids: readonly number[],
): Promise<number[]> {
  const stuck: number[] = []
  for (const id of ids) {
    try {
      await filesApi.delete(tripId, id)
      await filesApi.permanentDelete(tripId, id)
    } catch {
      stuck.push(id)
    }
  }
  return stuck
}

/**
 * Upload the pending receipts, run the save, and take the uploads back out
 * again if it throws.
 *
 * The rollback runs for a failure in the save AND for one partway through the
 * upload loop, which is why the ids are collected outside the try.
 */
export async function saveWithReceipts<T>(
  tripId: number | string,
  files: readonly File[],
  budgetItemId: number | null,
  save: (uploadedIds: number[]) => Promise<T>,
): Promise<{ result: T; stuckIds: number[] }> {
  const uploaded: number[] = []
  try {
    for (const file of files) {
      const [id] = await uploadReceipts(tripId, [file], budgetItemId)
      if (id != null) uploaded.push(id)
    }
    const result = await save(uploaded)
    return { result, stuckIds: [] }
  } catch (err) {
    const stuck = await discardReceipts(tripId, uploaded)
    ;(err as { stuckReceiptIds?: number[] }).stuckReceiptIds = stuck
    throw err
  }
}
