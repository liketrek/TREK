import { llmCapabilitiesResponseSchema, receiptScanStartResponseSchema } from '@trek/shared'
import { apiClient, postMultipart } from '../api/client'
import { isEffectivelyOffline } from '../sync/networkMode'

/**
 * What the AI model can read, and the receipt scan that depends on it. Both are
 * online-only: the model runs on the server, so offline a photo is simply not
 * offered.
 */
export const llmRepo = {
  /** Whether a photo is worth offering to this user: their AI model reads images. */
  async readsPhotos(): Promise<boolean> {
    if (isEffectivelyOffline()) return false
    const reply = await apiClient.get('/llm/capabilities')
    return llmCapabilitiesResponseSchema.parse(reply.data).images
  },

  /** Start reading one receipt photo in the background; answers the import job id. */
  async scanReceipt(tripId: number | string, photo: File): Promise<string> {
    if (isEffectivelyOffline()) throw new Error('Scanning a receipt requires a connection')
    const form = new FormData()
    form.append('file', photo)
    return receiptScanStartResponseSchema.parse(await postMultipart(`/trips/${tripId}/budget/receipt-scan`, form)).jobId
  },
}
