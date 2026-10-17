import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { useHelpStore } from '../../store/helpStore'
import { getHelpGuide } from '../../help/registry'
import HelpGuideView from './HelpGuideView'

const initial = useHelpStore.getState()

beforeEach(() => {
  useHelpStore.setState(initial, true)
})

describe('HelpGuideView: links', () => {
  it('offers the in-app link of a guide that has one and closes the dialog on the way', () => {
    useHelpStore.setState({ open: true })
    render(<HelpGuideView guide={getHelpGuide('widgets')!} />)
    const link = screen.getByRole('link', { name: /Open Appearance settings/ })
    expect(link).toHaveAttribute('href', '/settings?tab=appearance')
    fireEvent.click(link)
    expect(useHelpStore.getState().open).toBe(false)
  })

  it('lists every step and has no link for a quick guide', () => {
    render(<HelpGuideView guide={getHelpGuide('delete-trip')!} />)
    expect(screen.getAllByLabelText(/^Step \d$/)).toHaveLength(getHelpGuide('delete-trip')!.steps)
    expect(screen.queryByRole('link', { name: /Open Appearance settings/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Open in Help & Docs/ })).toHaveAttribute('href', '/help/My-Trips-Dashboard#per-trip-actions')
  })
})
