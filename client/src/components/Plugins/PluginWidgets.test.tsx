// FE-W4PW-001 to FE-W4PW-005
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import type { ActivePlugin } from '../../store/pluginStore'

vi.mock('./PluginFrame', () => ({
  default: ({ pluginId, tripId, title }: { pluginId: string; tripId: string | null; title?: string }) =>
    <div data-testid="frame" data-plugin={pluginId} data-trip={tripId ?? ''} data-title={title} />,
}))

import PluginWidgets from './PluginWidgets'

function plugin(overrides: Partial<ActivePlugin> = {}): ActivePlugin {
  return { id: 'weather', name: 'Weather', icon: 'CloudSun', ...overrides } as unknown as ActivePlugin
}

describe('PluginWidgets', () => {
  it('FE-W4PW-001: renders nothing without active widget plugins', () => {
    const { container } = render(<PluginWidgets plugins={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-W4PW-002: renders one card per plugin with its name', () => {
    render(<PluginWidgets plugins={[plugin(), plugin({ id: 'fx', name: 'Currency' })]} />)

    expect(screen.getByText('Weather')).toBeInTheDocument()
    expect(screen.getByText('Currency')).toBeInTheDocument()
    expect(screen.getAllByTestId('frame')).toHaveLength(2)
  })

  it('FE-W4PW-003: hands each card its own sandboxed frame', () => {
    render(<PluginWidgets plugins={[plugin()]} />)
    const frame = screen.getByTestId('frame')

    expect(frame).toHaveAttribute('data-plugin', 'weather')
    expect(frame).toHaveAttribute('data-title', 'Weather')
  })

  it('FE-W4PW-004: defaults the trip context to null and forwards a given tripId', () => {
    const { unmount } = render(<PluginWidgets plugins={[plugin()]} />)
    expect(screen.getByTestId('frame')).toHaveAttribute('data-trip', '')
    unmount()

    render(<PluginWidgets plugins={[plugin()]} tripId="42" />)
    expect(screen.getByTestId('frame')).toHaveAttribute('data-trip', '42')
  })

  it('FE-W4PW-005: gives the body a pre-resize minimum height', () => {
    render(<PluginWidgets plugins={[plugin()]} />)

    expect(screen.getByTestId('frame').parentElement).toHaveStyle({ minHeight: '60px' })
  })

  it('FE-W4PW-006: renders the plugin icon in the card header', () => {
    const { container } = render(<PluginWidgets plugins={[plugin()]} />)

    expect(container.querySelector('.lucide-cloud-sun')).not.toBeNull()
  })
})
