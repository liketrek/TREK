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
        if (attempt > 0) await sleep(400 * attempt)
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
