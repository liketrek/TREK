import type { AxiosProgressEvent } from 'axios'

export interface UploadProgress {
  done: number
  total: number
  failed: number
  percent: number
}

export interface ResilientResult<T> {
  succeeded: T[]
  failed: File[]
}

export interface UploadOpts {
  onUploadProgress: (e: AxiosProgressEvent) => void
  idempotencyKey: string
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

function isRetryable(err: unknown): boolean {
  if (err && typeof err === 'object' && 'response' in err) {
    const status = (err as { response?: { status?: number } }).response?.status
    // 408/425/429: timeout / too-early / rate-limited. TREK's own upload routes
    // do not send them, but a proxy in front of a self-hosted instance does, and
    // dropping the file for one of those loses a photo we could have re-sent.
    if (status === 408 || status === 425 || status === 429) return true
    if (status !== undefined && status >= 400 && status < 500) return false
  }
  return true
}

export async function uploadFilesResilient<T>(
  files: File[],
  uploadOne: (file: File, opts: UploadOpts) => Promise<T[]>,
  cbs?: {
    concurrency?: number
    retries?: number
    onProgress?: (p: UploadProgress) => void
    onUploaded?: (items: T[]) => void
  },
): Promise<ResilientResult<T>> {
  const concurrency = cbs?.concurrency ?? 3
  const maxRetries = cbs?.retries ?? 2

  const totalBytes = files.reduce((s, f) => s + f.size, 0)
  const loadedMap = new Map<number, number>()
  let doneCount = 0
  let failedCount = 0

  const emitProgress = () => {
    if (!cbs?.onProgress) return
    const sumLoaded = Array.from(loadedMap.values()).reduce((a, b) => a + b, 0)
    const percent = totalBytes > 0 ? Math.round((sumLoaded / totalBytes) * 100) : 0
    cbs.onProgress({ done: doneCount, total: files.length, failed: failedCount, percent })
  }

  const succeeded: T[] = []
  const failedFiles: File[] = []

  let idx = 0

  async function worker() {
    while (true) {
      const i = idx++
      if (i >= files.length) break
      const file = files[i]
      const idempotencyKey = crypto.randomUUID()
      loadedMap.set(i, 0)

      let items: T[] | null = null
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
          // The aborted attempt's bytes never landed, so drop them before the
          // retry starts reporting its own — otherwise they'd be counted twice
          // until the first onUploadProgress of the new attempt arrives.
          loadedMap.set(i, 0)
          emitProgress()
          await sleep(400 * attempt)
        }
        try {
          items = await uploadOne(file, {
            idempotencyKey,
            onUploadProgress: (e) => {
              loadedMap.set(i, e.loaded)
              emitProgress()
            },
          })
          break
        } catch (err) {
          if (!isRetryable(err) || attempt === maxRetries) {
            items = null
            break
          }
        }
      }

      if (items !== null) {
        succeeded.push(...items)
        cbs?.onUploaded?.(items)
        loadedMap.set(i, file.size)
        doneCount++
      } else {
        failedFiles.push(file)
        loadedMap.set(i, 0)
        failedCount++
      }
      emitProgress()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker())
  await Promise.all(workers)

  return { succeeded, failed: failedFiles }
}
