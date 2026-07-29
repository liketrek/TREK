// FE-W4UTL-010 to FE-W4UTL-014
import { describe, it, expect } from 'vitest'
import { GRADIENTS, entityGradient } from './gradients'

describe('entityGradient', () => {
  it('FE-W4UTL-010: exposes eight two-stop gradients', () => {
    expect(GRADIENTS).toHaveLength(8)
    GRADIENTS.forEach(g => expect(g).toMatch(/^linear-gradient\(135deg, #[0-9a-f]{6} 0%, #[0-9a-f]{6} 100%\)$/))
  })

  it('FE-W4UTL-011: maps an id onto its slot', () => {
    expect(entityGradient(0)).toBe(GRADIENTS[0])
    expect(entityGradient(3)).toBe(GRADIENTS[3])
    expect(entityGradient(7)).toBe(GRADIENTS[7])
  })

  it('FE-W4UTL-012: wraps around past the palette length', () => {
    expect(entityGradient(8)).toBe(GRADIENTS[0])
    expect(entityGradient(11)).toBe(GRADIENTS[3])
  })

  it('FE-W4UTL-013: handles negative ids without going out of range', () => {
    expect(entityGradient(-1)).toBe(GRADIENTS[7])
    expect(entityGradient(-8)).toBe(GRADIENTS[0])
    expect(entityGradient(-11)).toBe(GRADIENTS[5])
  })

  it('FE-W4UTL-014: is stable for the same id', () => {
    expect(entityGradient(42)).toBe(entityGradient(42))
  })
})
