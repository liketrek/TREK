// FE-W4CTX-001 to FE-W4CTX-010
import { describe, it, expect, vi, afterEach } from 'vitest'
import { Trash2 } from 'lucide-react'
import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { ContextMenu, useContextMenu } from './ContextMenu'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useContextMenu', () => {
  it('FE-W4CTX-001: opening stores the pointer position and the items', () => {
    const { result } = renderHook(() => useContextMenu())
    const preventDefault = vi.fn()
    const stopPropagation = vi.fn()
    const items = [{ label: 'Delete' }]

    act(() => {
      result.current.open({ clientX: 120, clientY: 40, preventDefault, stopPropagation } as unknown as React.MouseEvent, items)
    })

    expect(result.current.menu).toEqual({ x: 120, y: 40, items })
    expect(preventDefault).toHaveBeenCalled()
    expect(stopPropagation).toHaveBeenCalled()
  })

  it('FE-W4CTX-002: closing clears the menu', () => {
    const { result } = renderHook(() => useContextMenu())
    act(() => {
      result.current.open({ clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {} } as unknown as React.MouseEvent, [])
    })

    act(() => { result.current.close() })

    expect(result.current.menu).toBeNull()
  })
})

describe('ContextMenu', () => {
  it('FE-W4CTX-003: renders nothing without a menu', () => {
    const { container, baseElement } = render(<ContextMenu menu={null} onClose={() => {}} />)

    expect(container).toBeEmptyDOMElement()
    expect(baseElement.querySelector('.trek-popover-enter')).toBeNull()
  })

  it('FE-W4CTX-004: renders one button per item at the pointer position', () => {
    const { baseElement } = render(
      <ContextMenu menu={{ x: 40, y: 20, items: [{ label: 'Open' }, { label: 'Delete', icon: Trash2, danger: true }] }} onClose={() => {}} />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(baseElement.querySelector('.trek-popover-enter')).toHaveStyle({ left: '40px', top: '20px' })
  })

  it('FE-W4CTX-005: a danger item is red and carries its icon', () => {
    render(<ContextMenu menu={{ x: 0, y: 0, items: [{ label: 'Delete', icon: Trash2, danger: true }] }} onClose={() => {}} />)
    const button = screen.getByRole('button', { name: 'Delete' })

    expect(button).toHaveStyle({ color: 'rgb(239, 68, 68)' })
    expect(button.querySelector('svg')).not.toBeNull()
  })

  it('FE-W4CTX-006: a divider entry renders a rule instead of a button', () => {
    render(<ContextMenu menu={{ x: 0, y: 0, items: [{ label: 'Open' }, { divider: true }, { label: 'Delete' }] }} onClose={() => {}} />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('FE-W4CTX-007: clicking an item runs it and closes the menu', () => {
    const onClick = vi.fn()
    const onClose = vi.fn()
    render(<ContextMenu menu={{ x: 0, y: 0, items: [{ label: 'Open', onClick }] }} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-W4CTX-008: an item without a handler still closes the menu', () => {
    const onClose = vi.fn()
    render(<ContextMenu menu={{ x: 0, y: 0, items: [{ label: 'Open' }] }} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('FE-W4CTX-009: a document click or right-click dismisses the menu', () => {
    const onClose = vi.fn()
    const { unmount } = render(<ContextMenu menu={{ x: 0, y: 0, items: [{ label: 'Open' }] }} onClose={onClose} />)

    fireEvent.click(document)
    fireEvent.contextMenu(document)
    expect(onClose).toHaveBeenCalledTimes(2)

    unmount()
    fireEvent.click(document)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('FE-W4CTX-010: flips the menu back inside the viewport when it would overflow', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 200, height: 120, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect)
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 400 })
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 300 })

    const { baseElement } = render(<ContextMenu menu={{ x: 380, y: 290, items: [{ label: 'Open' }] }} onClose={() => {}} />)

    const menu = baseElement.querySelector('.trek-popover-enter') as HTMLElement
    expect(menu.style.left).toBe('192px')
    expect(menu.style.top).toBe('172px')
  })
})
