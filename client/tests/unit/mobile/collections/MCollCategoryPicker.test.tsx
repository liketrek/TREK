import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../helpers/render'
import MCollCategoryPicker from '../../../../src/mobile/screens/collections/MCollCategoryPicker'
import type { Category } from '../../../../src/types'
import { useTranslation } from '../../../../src/i18n'

// FE-MOB-CCATP-001 to FE-MOB-CCATP-010

const CATEGORIES = [
  // In CATEGORY_SPEC — takes the design colour/icon, not the DB row.
  { id: 1, name: 'Restaurant', color: '#000000', icon: 'MapPin' },
  // Custom admin category — falls back to its own colour/icon.
  { id: 2, name: 'Winery', color: '#123456', icon: 'Wine' },
] as unknown as Category[]

function Harness(props: Omit<ComponentProps<typeof MCollCategoryPicker>, 't'>) {
  const { t } = useTranslation()
  return <MCollCategoryPicker {...props} t={t} />
}

function setup(value: number | null, categories: Category[] = CATEGORIES) {
  const onChange = vi.fn<(id: number | null) => void>()
  const view = render(<Harness categories={categories} value={value} onChange={onChange} />)
  const trigger = screen.getAllByRole('button')[0]
  return { ...view, onChange, trigger }
}

describe('MCollCategoryPicker', () => {
  it('FE-MOB-CCATP-001: closed with no value it reads "No category" and lists nothing', () => {
    const { trigger } = setup(null)
    expect(trigger).toHaveTextContent('No category')
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(trigger.querySelector('.lucide-chevron-down')).not.toBeNull()
  })

  it('FE-MOB-CCATP-002: a selected category is shown on the trigger', () => {
    const { trigger } = setup(2)
    expect(trigger).toHaveTextContent('Winery')
  })

  it('FE-MOB-CCATP-003: a value with no matching category falls back to "No category"', () => {
    const { trigger } = setup(99)
    expect(trigger).toHaveTextContent('No category')
  })

  it('FE-MOB-CCATP-004: opening lists "No category" plus every category and flips the chevron', () => {
    const { trigger } = setup(null)
    fireEvent.click(trigger)
    const options = screen.getAllByRole('button').slice(1)
    expect(options.map(o => o.textContent?.trim())).toEqual(['No category', 'Restaurant', 'Winery'])
    expect(trigger.querySelector('.lucide-chevron-up')).not.toBeNull()
  })

  it('FE-MOB-CCATP-005: picking a category reports its id and closes the list', () => {
    const { trigger, onChange } = setup(null)
    fireEvent.click(trigger)
    fireEvent.click(screen.getAllByRole('button')[2])
    expect(onChange).toHaveBeenCalledWith(1)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('FE-MOB-CCATP-006: picking "No category" reports null', () => {
    const { trigger, onChange } = setup(1)
    fireEvent.click(trigger)
    fireEvent.click(screen.getAllByRole('button')[1])
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-CCATP-007: only the active option carries the check mark', () => {
    const { trigger } = setup(2)
    fireEvent.click(trigger)
    const options = screen.getAllByRole('button').slice(1)
    expect(options[0].querySelector('.lucide-check')).toBeNull()
    expect(options[1].querySelector('.lucide-check')).toBeNull()
    expect(options[2].querySelector('.lucide-check')).not.toBeNull()
  })

  it('FE-MOB-CCATP-008: canonical categories use the design icon, custom ones their own', () => {
    const { trigger } = setup(null)
    fireEvent.click(trigger)
    const options = screen.getAllByRole('button').slice(1)
    // No category → CircleSlash, Restaurant → Utensils (CATEGORY_SPEC), Winery → its DB icon.
    expect(options[0].querySelector('.lucide-circle-slash')).not.toBeNull()
    expect(options[1].querySelector('.lucide-utensils')).not.toBeNull()
    expect(options[2].querySelector('.lucide-wine')).not.toBeNull()
  })

  it('FE-MOB-CCATP-009: a second tap on the trigger closes the list again', () => {
    const { trigger } = setup(null)
    fireEvent.click(trigger)
    expect(screen.getAllByRole('button')).toHaveLength(4)
    fireEvent.click(trigger)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('FE-MOB-CCATP-010: with no categories the list holds "No category" alone', () => {
    const { trigger } = setup(null, [])
    fireEvent.click(trigger)
    const options = screen.getAllByRole('button').slice(1)
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('No category')
  })
})
