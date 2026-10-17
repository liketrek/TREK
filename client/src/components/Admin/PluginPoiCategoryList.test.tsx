// FE-COMP-PLUGINPOICATLIST-001 to FE-COMP-PLUGINPOICATLIST-005
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import { useSettingsStore } from '../../store/settingsStore'
import PluginPoiCategoryList from './PluginPoiCategoryList'
import { POI_CATEGORY_PERMISSION } from './pluginCaps'

const TRAILHEADS = { id: 'trailheads', label: 'Trailheads', labels: { de: 'Wanderparkplätze' }, icon: 'Signpost', color: '#2f855a' }
const SWIMMING = { id: 'swimming', label: 'Swimming spots', icon: 'Waves', color: '#0369a1' }

const initialSettings = useSettingsStore.getState()
beforeEach(() => useSettingsStore.setState(initialSettings, true))

function renderList(categories: unknown, permissions: string[] = [POI_CATEGORY_PERMISSION]) {
  return render(
    <PluginPoiCategoryList pluginId="trail-finder" permissions={permissions} categories={categories}
      className="shell-place" titleClassName="shell-title" itemClassName="shell-row" />,
  )
}

describe('PluginPoiCategoryList', () => {
  it('FE-COMP-PLUGINPOICATLIST-001: a titled list with one row per category, placed by the shell', () => {
    const { container } = renderList([TRAILHEADS, SWIMMING])

    const title = screen.getByRole('heading', { name: 'Map categories it adds' })
    expect(title).toHaveClass('shell-title')
    expect(container.firstElementChild).toHaveClass('shell-place')
    const rows = screen.getAllByRole('listitem')
    expect(rows.map(r => r.textContent)).toEqual(['Trailheads', 'Swimming spots'])
    expect(rows[0]).toHaveClass('shell-row')
  })

  it('FE-COMP-PLUGINPOICATLIST-002: each swatch carries the category colour and its icon, hidden from readers', () => {
    renderList([TRAILHEADS, SWIMMING])

    const swatches = screen.getAllByTestId('poi-category-swatch')
    expect(swatches.map(s => s.style.backgroundColor)).toEqual(['rgb(47, 133, 90)', 'rgb(3, 105, 161)'])
    expect(swatches[0]).toHaveAttribute('aria-hidden', 'true')
    expect(swatches[0].querySelector('svg')).toHaveClass('lucide-signpost')
    expect(swatches[1].querySelector('svg')).toHaveClass('lucide-waves')
  })

  it('FE-COMP-PLUGINPOICATLIST-003: a label is text, never markup', () => {
    const { container } = renderList([{ ...TRAILHEADS, label: '<img src=x onerror=alert(1)>' }])

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('FE-COMP-PLUGINPOICATLIST-004: the admin language picks the plugin label for it', async () => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, language: 'de' } }))
    renderList([TRAILHEADS, SWIMMING])

    expect(await screen.findByRole('heading', { name: 'Kartenkategorien, die es hinzufügt' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map(r => r.textContent)).toEqual(['Wanderparkplätze', 'Swimming spots'])
  })

  it('FE-COMP-PLUGINPOICATLIST-005: renders nothing without the grant or without a valid category', () => {
    const withoutGrant = renderList([TRAILHEADS], ['hook:search-provider'])
    expect(withoutGrant.container).toBeEmptyDOMElement()
    withoutGrant.unmount()

    const nothingValid = renderList([{ ...TRAILHEADS, color: 'red' }])
    expect(nothingValid.container).toBeEmptyDOMElement()
    nothingValid.unmount()

    expect(renderList(undefined).container).toBeEmptyDOMElement()
  })
})
