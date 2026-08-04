// FE-W4AVC-001 to FE-W4AVC-006
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { AvatarChip } from './FileManagerAvatarChip'

describe('AvatarChip', () => {
  it('FE-W4AVC-001: falls back to the uppercased initial without an avatar', () => {
    const { container } = render(<AvatarChip name="ada" />)

    expect(container.firstElementChild).toHaveTextContent('A')
    expect(container.querySelector('img')).toBeNull()
  })

  it('FE-W4AVC-002: renders the avatar image when one is given', () => {
    const { container } = render(<AvatarChip name="ada" avatarUrl="/uploads/avatars/ada.png" />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/uploads/avatars/ada.png')
    expect(container.firstElementChild).not.toHaveTextContent('A')
  })

  it('FE-W4AVC-003: sizes the chip and its glyph from the size prop', () => {
    const { container } = render(<AvatarChip name="ada" size={30} />)
    const chip = container.firstElementChild as HTMLElement

    expect(chip.style.width).toBe('30px')
    expect(chip.style.height).toBe('30px')
    expect(chip.style.fontSize).toBe('12px')
  })

  it('FE-W4AVC-004: defaults to a 20px chip', () => {
    const { container } = render(<AvatarChip name="ada" />)

    expect((container.firstElementChild as HTMLElement).style.width).toBe('20px')
  })

  it('FE-W4AVC-005: hovering portals a name tooltip and leaving removes it', () => {
    const { container } = render(<AvatarChip name="Ada Lovelace" />)
    const chip = container.firstElementChild as HTMLElement

    fireEvent.mouseEnter(chip)
    const tip = screen.getByText('Ada Lovelace')
    expect(tip).toBeInTheDocument()
    expect(container.contains(tip)).toBe(false)

    fireEvent.mouseLeave(chip)
    expect(screen.queryByText('Ada Lovelace')).toBeNull()
  })

  it('FE-W4AVC-006: renders nothing in the chip for an empty name', () => {
    const { container } = render(<AvatarChip name="" />)

    expect(container.firstElementChild).toBeEmptyDOMElement()
  })
})
