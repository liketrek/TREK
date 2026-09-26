// FE-PACKEXPORTMENU-001 to FE-PACKEXPORTMENU-006
import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import PackingExportMenu from './PackingExportMenu'
import PackingPrintPreview from './PackingPrintPreview'
import type { PackingExport } from './usePackingExport'

const packingExport: PackingExport = {
  hasItems: true,
  exportMarkdown: vi.fn(),
  exportCsv: vi.fn(async () => {}),
  openPrint: vi.fn(async () => {}),
  printHtml: null,
  printTitle: 'Packing List: Lisbon & Porto',
  closePrint: vi.fn(),
}
vi.mock('./usePackingExport', () => ({ usePackingExport: () => packingExport }))

const renderMenu = () => render(<PackingExportMenu tripId={7} view="common" className="btn" style={{}} />)

beforeEach(() => {
  vi.clearAllMocks()
  packingExport.hasItems = true
  packingExport.printHtml = null
})

describe('PackingExportMenu', () => {
  it('FE-PACKEXPORTMENU-001: renders nothing while the view has no items', () => {
    packingExport.hasItems = false
    const { container } = renderMenu()
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-PACKEXPORTMENU-002: is an icon button named Export that opens a menu of three ways out', async () => {
    const user = userEvent.setup()
    renderMenu()
    const button = screen.getByRole('button', { name: 'Export' })
    expect(button).toHaveAttribute('title', 'Export')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('menuitem').map(i => i.textContent)).toEqual([
      'Print or save as PDF', 'Markdown checklist (.md)', 'CSV for import (.csv)',
    ])
  })

  it('FE-PACKEXPORTMENU-003: runs the chosen export and closes the menu', async () => {
    const user = userEvent.setup()
    renderMenu()
    for (const [label, action] of [
      ['Print or save as PDF', packingExport.openPrint],
      ['Markdown checklist (.md)', packingExport.exportMarkdown],
      ['CSV for import (.csv)', packingExport.exportCsv],
    ] as const) {
      await user.click(screen.getByRole('button', { name: 'Export' }))
      await user.click(screen.getByRole('menuitem', { name: label }))
      expect(action).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    }
  })

  it('FE-PACKEXPORTMENU-004: closes on Escape and on a click anywhere else', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'Export' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Export' }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('FE-PACKEXPORTMENU-005: keeps the preview open even if the view has been emptied meanwhile', () => {
    packingExport.hasItems = false
    packingExport.printHtml = '<html><body><h1>Lisbon</h1></body></html>'
    renderMenu()
    expect(screen.getByTitle('Packing List: Lisbon & Porto')).toBeInTheDocument()
  })
})

describe('PackingPrintPreview', () => {
  it('FE-PACKEXPORTMENU-006: shows the page in a frame, prints that frame, and closes', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(<PackingPrintPreview html={null} title="Packing List" onClose={onClose} />)
    expect(screen.queryByTitle('Packing List')).not.toBeInTheDocument()

    rerender(<PackingPrintPreview html="<html><body>List</body></html>" title="Packing List" onClose={onClose} />)
    const frame = screen.getByTitle('Packing List') as HTMLIFrameElement
    expect(frame.getAttribute('srcdoc')).toBe('<html><body>List</body></html>')
    expect(frame.getAttribute('sandbox')).toBe('allow-same-origin allow-modals')
    const print = vi.fn()
    Object.defineProperty(frame, 'contentWindow', { value: { print }, configurable: true })
    await user.click(screen.getByRole('button', { name: 'Print or save as PDF' }))
    expect(print).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
