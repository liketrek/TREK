// FE-W4SPIN-001 to FE-W4SPIN-005
import { describe, it, expect } from 'vitest'
import { render } from '../../../tests/helpers/render'
import { Spinner, PageSpinner } from './Spinner'

describe('Spinner', () => {
  it('FE-W4SPIN-001: renders the default page-loader ring', () => {
    const { container } = render(<Spinner />)
    const el = container.firstElementChild as HTMLElement

    expect(el.className).toBe('w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin')
  })

  it('FE-W4SPIN-002: keeps caller classes and still spins', () => {
    const { container } = render(<Spinner className="w-10 h-10 border-4 border-accent" />)
    const el = container.firstElementChild as HTMLElement

    expect(el.className).toBe('w-10 h-10 border-4 border-accent rounded-full animate-spin')
  })
})

describe('PageSpinner', () => {
  it('FE-W4SPIN-003: centres the ring in a flex wrapper by default', () => {
    const { container } = render(<PageSpinner />)
    const wrapper = container.firstElementChild as HTMLElement

    expect(wrapper.className).toBe('flex items-center justify-center')
    expect((wrapper.firstElementChild as HTMLElement).className).toContain('animate-spin')
  })

  it('FE-W4SPIN-004: forwards wrapper classes and style', () => {
    const { container } = render(<PageSpinner wrapperClassName="h-screen grid place-items-center" wrapperStyle={{ minHeight: 200 }} />)
    const wrapper = container.firstElementChild as HTMLElement

    expect(wrapper.className).toBe('h-screen grid place-items-center')
    expect(wrapper.style.minHeight).toBe('200px')
  })

  it('FE-W4SPIN-005: forwards the ring className down to the Spinner', () => {
    const { container } = render(<PageSpinner className="w-8 h-8 border-2" />)

    expect((container.querySelector('.animate-spin') as HTMLElement).className).toBe('w-8 h-8 border-2 rounded-full animate-spin')
  })
})
