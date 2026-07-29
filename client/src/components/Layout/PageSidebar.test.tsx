// FE-W4PSB-001 to FE-W4PSB-012
import type { ComponentProps } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { Bell, Palette, Shield } from 'lucide-react'
import { render, screen, fireEvent, within } from '../../../tests/helpers/render'
import PageSidebar, { type PageSidebarTab } from './PageSidebar'

const TABS: PageSidebarTab[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette, group: 'General' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'General' },
  { id: 'security', label: 'Security', icon: Shield, group: 'Account' },
]

function setup(overrides: Partial<ComponentProps<typeof PageSidebar>> = {}) {
  const onTabChange = vi.fn()
  const utils = render(
    <PageSidebar sidebarLabel="SETTINGS" tabs={TABS} activeTab="appearance" onTabChange={onTabChange} {...overrides}>
      <p>panel body</p>
    </PageSidebar>,
  )
  return { onTabChange, ...utils }
}

describe('PageSidebar', () => {
  it('FE-W4PSB-001: renders the label, every tab and the panel children', () => {
    setup()

    expect(screen.getAllByText('SETTINGS').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /^Appearance$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Security$/ })).toBeInTheDocument()
    expect(screen.getByText('panel body')).toBeInTheDocument()
  })

  it('FE-W4PSB-002: prints one heading per contiguous group', () => {
    setup()

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
  })

  it('FE-W4PSB-003: highlights the active tab', () => {
    setup()

    expect(screen.getByRole('button', { name: /^Appearance$/ }).className).toContain('font-semibold')
    expect(screen.getByRole('button', { name: /^Security$/ }).className).toContain('font-medium')
  })

  it('FE-W4PSB-004: mirrors the active tab label in the mobile top bar', () => {
    setup({ activeTab: 'security' })

    expect(screen.getByText('Security', { selector: 'div' })).toBeInTheDocument()
  })

  it('FE-W4PSB-005: falls back to an empty mobile label for an unknown tab', () => {
    const { container } = setup({ activeTab: 'nope' })
    const bar = container.querySelector('.lg\\:hidden') as HTMLElement

    expect(within(bar).getByLabelText('Open navigation')).toBeInTheDocument()
    expect(bar.textContent).toBe('')
  })

  it('FE-W4PSB-006: reports the clicked tab id', () => {
    const { onTabChange } = setup()

    fireEvent.click(screen.getByRole('button', { name: /^Notifications$/ }))

    expect(onTabChange).toHaveBeenCalledWith('notifications')
  })

  it('FE-W4PSB-007: the hamburger opens the drawer and its close button shuts it', () => {
    setup()

    fireEvent.click(screen.getByLabelText('Open navigation'))
    expect(screen.getByLabelText('Close navigation')).toBeInTheDocument()
    // The drawer duplicates the tab list.
    expect(screen.getAllByRole('button', { name: /^Appearance$/ })).toHaveLength(2)

    fireEvent.click(screen.getByLabelText('Close navigation'))
    expect(screen.queryByLabelText('Close navigation')).toBeNull()
  })

  it('FE-W4PSB-008: picking a tab in the drawer reports it and closes the drawer', () => {
    const { onTabChange } = setup()
    fireEvent.click(screen.getByLabelText('Open navigation'))

    const drawerTabs = screen.getAllByRole('button', { name: /^Security$/ })
    fireEvent.click(drawerTabs[drawerTabs.length - 1])

    expect(onTabChange).toHaveBeenCalledWith('security')
    expect(screen.queryByLabelText('Close navigation')).toBeNull()
  })

  it('FE-W4PSB-009: Escape closes the drawer', () => {
    setup()
    fireEvent.click(screen.getByLabelText('Open navigation'))

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByLabelText('Close navigation')).toBeNull()

    // A stray key while closed must not crash.
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.queryByLabelText('Close navigation')).toBeNull()
  })

  it('FE-W4PSB-010: clicking the scrim closes the drawer', () => {
    const { container } = setup()
    fireEvent.click(screen.getByLabelText('Open navigation'))

    fireEvent.click(container.querySelector('.fixed.inset-0')!)

    expect(screen.queryByLabelText('Close navigation')).toBeNull()
  })

  it('FE-W4PSB-011: renders an optional footer in both sidebar copies', () => {
    setup({ footer: 'v3.4 · self-hosted' })
    expect(screen.getAllByText('v3.4 · self-hosted')).toHaveLength(1)

    fireEvent.click(screen.getByLabelText('Open navigation'))
    expect(screen.getAllByText('v3.4 · self-hosted')).toHaveLength(2)
  })

  it('FE-W4PSB-012: renders ungrouped tabs without a heading', () => {
    render(
      <PageSidebar sidebarLabel="ADMIN" tabs={[{ id: 'users', label: 'Users', icon: Shield }]} activeTab="users" onTabChange={() => {}}>
        <p>body</p>
      </PageSidebar>,
    )

    expect(screen.getByRole('button', { name: /^Users$/ })).toBeInTheDocument()
    expect(screen.queryByText('General')).toBeNull()
  })
})
