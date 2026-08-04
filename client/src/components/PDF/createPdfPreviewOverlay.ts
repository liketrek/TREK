interface PdfPreviewOverlayOptions {
  id: string
  html: string
  header: HTMLElement
  overlayStyle: string
  cardStyle: string
}

export interface PdfPreviewOverlay {
  overlay: HTMLDivElement
  iframe: HTMLIFrameElement
}

/** Creates the shared, script-free iframe shell used by PDF previews. */
export function createPdfPreviewOverlay({
  id,
  html,
  header,
  overlayStyle,
  cardStyle,
}: PdfPreviewOverlayOptions): PdfPreviewOverlay {
  const overlay = document.createElement('div')
  overlay.id = id
  overlay.style.cssText = overlayStyle
  overlay.onclick = event => { if (event.target === overlay) overlay.remove() }

  const card = document.createElement('div')
  card.style.cssText = cardStyle

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'flex:1;width:100%;border:none;'
  // No script runs inside the document (print is parent-initiated), so withhold
  // allow-scripts to keep the sandbox tight.
  iframe.sandbox = 'allow-same-origin allow-modals'
  iframe.srcdoc = html

  card.appendChild(header)
  card.appendChild(iframe)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  return { overlay, iframe }
}
