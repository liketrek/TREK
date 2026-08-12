import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Blocks, Stethoscope } from 'lucide-react'
import PluginIcon, { resolvePluginIcon } from './PluginIcon'

describe('resolvePluginIcon', () => {
  it('resolves a lucide name outside the old 14-icon allowlist', () => {
    expect(resolvePluginIcon('Stethoscope')).toBe(Stethoscope)
  })

  it('falls back to Blocks for a missing or unknown name', () => {
    expect(resolvePluginIcon(null)).toBe(Blocks)
    expect(resolvePluginIcon(undefined)).toBe(Blocks)
    expect(resolvePluginIcon('')).toBe(Blocks)
    expect(resolvePluginIcon('Stethscope')).toBe(Blocks)
  })

  // A manifest must not be able to reach lucide's non-icon exports.
  it.each(['icons', 'createLucideIcon', 'default', 'module.exports'])(
    'falls back to Blocks for the non-icon export %s',
    (name) => expect(resolvePluginIcon(name)).toBe(Blocks),
  )

  it('returns a stable reference so nav arrays do not remount the icon', () => {
    expect(resolvePluginIcon('Stethoscope')).toBe(resolvePluginIcon('Stethoscope'))
  })
})

describe('PluginIcon', () => {
  it('renders the plugin-declared icon', () => {
    const { container } = render(<PluginIcon name="Stethoscope" />)
    expect(container.querySelector('.lucide-stethoscope')).not.toBeNull()
  })

  it('renders Blocks when the plugin declares nothing', () => {
    const { container } = render(<PluginIcon name={null} />)
    expect(container.querySelector('.lucide-blocks')).not.toBeNull()
  })
})
