import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { CollectionLink } from '@trek/shared'
import { fireEvent, render, screen } from '../../../helpers/render'
import MCollLinksEditor from '../../../../src/mobile/screens/collections/MCollLinksEditor'
import { useTranslation } from '../../../../src/i18n'

// FE-MOB-CLNKED-001 to FE-MOB-CLNKED-006
// The editor reads its copy through the real TranslationProvider, so the
// assertions use the English strings.

function Harness(props: Omit<ComponentProps<typeof MCollLinksEditor>, 't'>) {
  const { t } = useTranslation()
  return <MCollLinksEditor {...props} t={t} />
}

function setup(links: CollectionLink[]) {
  const onChange = vi.fn<(next: CollectionLink[]) => void>()
  const view = render(<Harness links={links} onChange={onChange} />)
  return { ...view, onChange }
}

const LINKS: CollectionLink[] = [
  { label: 'Menu', url: 'https://example.com/menu' },
  { url: 'https://booking.com/hotel' },
]

describe('MCollLinksEditor', () => {
  it('FE-MOB-CLNKED-001: renders one label/url pair per link and an add row', () => {
    setup(LINKS)
    const labels = screen.getAllByPlaceholderText('Label')
    const urls = screen.getAllByPlaceholderText('https://…')
    expect(labels).toHaveLength(2)
    expect(labels[0]).toHaveValue('Menu')
    // A link without a label still renders an empty (controlled) input.
    expect(labels[1]).toHaveValue('')
    expect(urls[0]).toHaveValue('https://example.com/menu')
    expect(urls[1]).toHaveValue('https://booking.com/hotel')
    expect(screen.getByRole('button', { name: /Add link/ })).toBeInTheDocument()
  })

  it('FE-MOB-CLNKED-002: editing a label patches only that row', () => {
    const { onChange } = setup(LINKS)
    fireEvent.change(screen.getAllByPlaceholderText('Label')[1], { target: { value: 'Hotel' } })
    expect(onChange).toHaveBeenCalledWith([
      { label: 'Menu', url: 'https://example.com/menu' },
      { label: 'Hotel', url: 'https://booking.com/hotel' },
    ])
  })

  it('FE-MOB-CLNKED-003: editing a url patches only that row', () => {
    const { onChange } = setup(LINKS)
    fireEvent.change(screen.getAllByPlaceholderText('https://…')[0], { target: { value: 'https://example.com/card' } })
    expect(onChange).toHaveBeenCalledWith([
      { label: 'Menu', url: 'https://example.com/card' },
      { url: 'https://booking.com/hotel' },
    ])
  })

  it('FE-MOB-CLNKED-004: the trash button drops that row', () => {
    const { onChange } = setup(LINKS)
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(onChange).toHaveBeenCalledWith([{ url: 'https://booking.com/hotel' }])
  })

  it('FE-MOB-CLNKED-005: the add row appends an empty link', () => {
    const { onChange } = setup(LINKS)
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    expect(onChange).toHaveBeenCalledWith([...LINKS, { url: '' }])
  })

  it('FE-MOB-CLNKED-006: an empty list shows the add row only', () => {
    const { onChange } = setup([])
    expect(screen.queryByPlaceholderText('Label')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    expect(onChange).toHaveBeenCalledWith([{ url: '' }])
  })
})
