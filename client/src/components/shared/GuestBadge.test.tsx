// FE-W4GB-001 to FE-W4GB-003
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import GuestBadge from './GuestBadge'

describe('GuestBadge', () => {
  it('FE-W4GB-001: renders the translated guest label with the accountless hint as title', () => {
    render(<GuestBadge />)
    const pill = screen.getByTitle(/without an account/i)

    expect(pill).toHaveTextContent('Guest')
    expect(pill.querySelector('svg')).not.toBeNull()
  })

  it('FE-W4GB-002: sizes the label at 10px by default', () => {
    render(<GuestBadge />)
    expect(screen.getByTitle(/without an account/i)).toHaveStyle({ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' })
  })

  it('FE-W4GB-003: shrinks to 9px in the xs variant', () => {
    render(<GuestBadge size="xs" />)
    expect(screen.getByTitle(/without an account/i)).toHaveStyle({ fontSize: 'calc(9px * var(--fs-scale-caption, 1))' })
  })
})
