import { afterEach, describe, expect, it, vi } from 'vitest'
import { showJourneyExportPreview } from './showJourneyExportPreview'

const exportDocument = {
  html: '<!DOCTYPE html><html><body><h1>Journey book</h1></body></html>',
  estimatedPageCount: 3,
}

function overlay(): HTMLElement {
  return document.getElementById('journey-pdf-overlay')!
}

afterEach(() => {
  overlay()?.remove()
  vi.restoreAllMocks()
})

describe('showJourneyExportPreview', () => {
  it('renders the document with supplied, escaped preview labels', () => {
    showJourneyExportPreview({
      title: '<img src=x onerror=alert(1)> Iceland',
      document: exportDocument,
      saveLabel: 'Save as PDF',
      closeLabel: 'Close',
      pagesLabel: 'pages',
    })

    const preview = overlay()
    expect(preview.querySelector('img')).toBeNull()
    expect(preview.textContent).toContain('<img src=x onerror=alert(1)> Iceland · 3 pages')
    expect(preview.querySelector('#journey-pdf-save')?.textContent).toBe('Save as PDF')
    expect(preview.querySelector('#journey-pdf-close')?.textContent).toBe('Close')
    expect(preview.querySelector('iframe')?.srcdoc).toBe(exportDocument.html)
  })

  it('uses supplied labels, prints from the iframe, and closes from either dismissal path', () => {
    showJourneyExportPreview({
      title: 'Iceland Ring Road',
      document: exportDocument,
      saveLabel: 'Print journey',
      closeLabel: 'Dismiss',
      pagesLabel: 'sheets',
    })

    const preview = overlay()
    const iframe = preview.querySelector('iframe')!
    const print = vi.spyOn(iframe.contentWindow!, 'print').mockImplementation(() => {})

    expect(preview.textContent).toContain('Iceland Ring Road · 3 sheets')
    preview.querySelector<HTMLButtonElement>('#journey-pdf-save')!.click()
    expect(print).toHaveBeenCalledOnce()

    preview.querySelector<HTMLButtonElement>('#journey-pdf-close')!.click()
    expect(document.getElementById('journey-pdf-overlay')).toBeNull()

    showJourneyExportPreview({
      title: 'Iceland Ring Road',
      document: exportDocument,
      saveLabel: 'Save as PDF',
      closeLabel: 'Close',
      pagesLabel: 'pages',
    })
    overlay().click()
    expect(document.getElementById('journey-pdf-overlay')).toBeNull()
  })
})
