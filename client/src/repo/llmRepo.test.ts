// FE-REPO-LLM-001 to FE-REPO-LLM-004
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { readMultipart } from '../../tests/helpers/multipart'
import { llmRepo } from './llmRepo'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true })
}

beforeEach(() => setOnline(true))

describe('llmRepo', () => {
  it('FE-REPO-LLM-001: readsPhotos answers what the server says the model reads', async () => {
    server.use(http.get('/api/llm/capabilities', () => HttpResponse.json({ images: true })))
    await expect(llmRepo.readsPhotos()).resolves.toBe(true)
    server.use(http.get('/api/llm/capabilities', () => HttpResponse.json({ images: false })))
    await expect(llmRepo.readsPhotos()).resolves.toBe(false)
  })

  it('FE-REPO-LLM-002: readsPhotos is false offline, without asking', async () => {
    let asked = false
    server.use(http.get('/api/llm/capabilities', () => { asked = true; return HttpResponse.json({ images: true }) }))
    setOnline(false)
    await expect(llmRepo.readsPhotos()).resolves.toBe(false)
    expect(asked).toBe(false)
  })

  it('FE-REPO-LLM-003: scanReceipt uploads the photo as `file` and answers the job id', async () => {
    let sent: string[] = []
    server.use(http.post('/api/trips/7/budget/receipt-scan', async ({ request }) => {
      sent = (await readMultipart(request)).filenames
      return HttpResponse.json({ jobId: 'job-9' })
    }))
    const photo = new File(['jpeg'], 'bill.jpg', { type: 'image/jpeg' })
    await expect(llmRepo.scanReceipt(7, photo)).resolves.toBe('job-9')
    // One file part; jsdom names every File part 'blob' on the wire, so the name is not checked.
    expect(sent).toHaveLength(1)
  })

  it('FE-REPO-LLM-004: scanReceipt refuses offline and rejects an answer without a job id', async () => {
    setOnline(false)
    await expect(llmRepo.scanReceipt(7, new File(['x'], 'a.jpg'))).rejects.toThrow(/connection/)
    setOnline(true)
    server.use(http.post('/api/trips/7/budget/receipt-scan', () => HttpResponse.json({})))
    await expect(llmRepo.scanReceipt(7, new File(['x'], 'a.jpg'))).rejects.toThrow()
  })
})
