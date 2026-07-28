import type { JourneyBookDocument } from '../render/buildJourneyBookDocument'

interface JourneyExportPreviewOptions {
  title: string
  document: JourneyBookDocument
  saveLabel?: string
  closeLabel?: string
  pagesLabel?: string
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Shows a print-safe, script-free iframe preview for a prepared export document. */
export function showJourneyExportPreview({
  title,
  document: exportDocument,
  saveLabel = 'Save as PDF',
  closeLabel = 'Close',
  pagesLabel = 'pages',
}: JourneyExportPreviewOptions) {
  // Render in a fixed overlay + srcdoc iframe — same pattern as TripPDF.
  // This avoids window.open() which Safari iOS blocks in async callbacks
  // and window.close() which doesn't work reliably in standalone PWA mode.
  const overlay = document.createElement('div')
  overlay.id = 'journey-pdf-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:8px;'
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove() }

  const card = document.createElement('div')
  card.style.cssText = 'width:100%;max-width:1100px;height:95vh;background:#fff;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.35);'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-bottom:1px solid #e4e4e7;flex-shrink:0;background:#0f172a;'
  header.innerHTML = `
    <span style="font-size:12px;color:rgba(255,255,255,0.45);font-weight:500;letter-spacing:0.03em">${esc(title)} &middot; ${exportDocument.estimatedPageCount} ${esc(pagesLabel)}</span>
    <div style="display:flex;align-items:center;gap:8px">
      <button id="journey-pdf-save" style="min-height:44px;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border:none;background:#fff;color:#0f172a;">${esc(saveLabel)}</button>
      <button id="journey-pdf-close" style="min-height:44px;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);">${esc(closeLabel)}</button>
    </div>
  `

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'flex:1;width:100%;border:none;'
  // No script runs inside the document (print is triggered from the parent via
  // contentWindow.print()), so withhold allow-scripts to keep the sandbox tight.
  iframe.sandbox = 'allow-same-origin allow-modals'
  iframe.srcdoc = exportDocument.html

  card.appendChild(header)
  card.appendChild(iframe)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  header.querySelector<HTMLButtonElement>('#journey-pdf-close')!.onclick = () => overlay.remove()
  header.querySelector<HTMLButtonElement>('#journey-pdf-save')!.onclick = () => { iframe.contentWindow?.print() }
}
