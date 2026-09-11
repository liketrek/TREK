// FE-ADMIN-VISION-001 to -010 — the shared "this model reads images" hook.
import { act, renderHook, waitFor } from '@testing-library/react'
import { adminApi } from '../../api/client'
import { useModelVision } from './useModelVision'

const URL = 'http://ollama.lan:11434/v1'

type Props = Parameters<typeof useModelVision>[0]

function mount(props: Partial<Props> = {}) {
  const initial: Props = { provider: 'local', model: '', baseUrl: URL, stored: {}, ...props }
  return renderHook((p: Props) => useModelVision(p), { initialProps: initial })
}

/** A promise this test controls the settling of, to pin down state mid-flight. */
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

let capabilities: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  capabilities = vi.spyOn(adminApi, 'llmLocalCapabilities').mockResolvedValue({ capabilities: null })
})
afterEach(() => vi.restoreAllMocks())

describe('useModelVision', () => {
  it('FE-ADMIN-VISION-001: starts from the stored flag when there is one', () => {
    const { result } = mount({ provider: 'openai', model: 'mistral:7b', stored: { model: 'mistral:7b', multimodal: true } })
    expect(result.current.multimodal).toBe(true)
  })

  it('FE-ADMIN-VISION-002: without a stored flag, a model from a vision family starts on', () => {
    // An instance configured before the switch existed must not be told its model is blind.
    const { result } = mount({ provider: 'openai', model: 'qwen3.5:4b', stored: { model: 'qwen3.5:4b' } })
    expect(result.current.multimodal).toBe(true)
    expect(result.current.warning).toBeNull()
  })

  it('FE-ADMIN-VISION-003: a local model is looked up on the server, and its answer replaces the guess', async () => {
    capabilities.mockResolvedValue({ capabilities: ['completion', 'vision', 'tools', 'thinking'] })
    const { result } = mount({ model: 'some-local-thing', stored: { model: 'some-local-thing' } })

    await waitFor(() => expect(result.current.multimodal).toBe(true))
    expect(capabilities).toHaveBeenCalledWith(URL, 'some-local-thing')
    expect(result.current.serverNote).toBe('The server reports that some-local-thing reads images.')
    expect(result.current.warning).toBeNull()
  })

  it('FE-ADMIN-VISION-004: a local model the server calls blind is turned off, id notwithstanding', async () => {
    capabilities.mockResolvedValue({ capabilities: ['completion', 'tools'] })
    const { result } = mount({ model: 'qwen3.5:4b', stored: { model: 'qwen3.5:4b' } })

    await waitFor(() => expect(result.current.multimodal).toBe(false))
    expect(result.current.serverNote).toBe('The server reports that qwen3.5:4b does not read images.')
  })

  it('FE-ADMIN-VISION-005: turning it on against the server warns, and does not undo the choice', async () => {
    capabilities.mockResolvedValue({ capabilities: ['completion'] })
    const { result } = mount({ model: 'qwen3:8b' })
    await waitFor(() => expect(result.current.serverNote).not.toBeNull())

    act(() => result.current.setMultimodal(true))

    expect(result.current.multimodal).toBe(true)
    expect(result.current.warning).toMatch(/against what the server reports/)
  })

  it('FE-ADMIN-VISION-006: with no server answer, an unknown model turned on warns where the refusal will come from', async () => {
    const { result } = mount({ model: 'mistral:7b' })
    await waitFor(() => expect(capabilities).toHaveBeenCalled())

    act(() => result.current.setMultimodal(true))

    expect(result.current.serverNote).toBeNull()
    expect(result.current.warning).toBe('mistral:7b is not known to read images — if the provider refuses the document, this is why.')
  })

  it('FE-ADMIN-VISION-007: an unreachable server is no answer, not an error', async () => {
    capabilities.mockRejectedValue(new Error('Network Error'))
    const { result } = mount({ model: 'qwen3.5:4b', stored: { model: 'qwen3.5:4b' } })
    await waitFor(() => expect(capabilities).toHaveBeenCalled())

    expect(result.current.serverNote).toBeNull()
    expect(result.current.multimodal).toBe(true)
  })

  it('FE-ADMIN-VISION-008: a cloud provider, or no model yet, asks nothing', () => {
    mount({ provider: 'openai', model: 'gpt-4o' })
    mount({ provider: 'local', model: '   ' })
    expect(capabilities).not.toHaveBeenCalled()
  })

  it('FE-ADMIN-VISION-009: a late answer about the previous model is not shown as one about the current model', async () => {
    const first = deferred<{ capabilities: string[] | null }>()
    capabilities.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ capabilities: null })
    const { result, rerender } = mount({ model: 'qwen3.5:4b' })

    rerender({ provider: 'local', model: 'mistral:7b', baseUrl: URL, stored: {} })
    await act(async () => { first.resolve({ capabilities: ['vision'] }) })

    expect(result.current.serverNote).toBeNull()
    expect(result.current.multimodal).toBe(false)
  })

  it('FE-ADMIN-VISION-010: leaving the local provider drops what the server said', async () => {
    capabilities.mockResolvedValue({ capabilities: ['vision'] })
    const { result, rerender } = mount({ model: 'qwen3.5:4b' })
    await waitFor(() => expect(result.current.serverNote).not.toBeNull())

    rerender({ provider: 'openai', model: 'qwen3.5:4b', baseUrl: URL, stored: {} })

    expect(result.current.serverNote).toBeNull()
  })
})
