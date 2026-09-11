import { useEffect, useState } from 'react'
import { modelReadsPhotos } from '@trek/shared'
import { adminApi } from '../../api/client'

export interface ModelVision {
  /** Whether the model may be handed the document itself — the switch, and what is saved. */
  multimodal: boolean
  setMultimodal: (next: boolean) => void
  /** What the local server reported about the model, as a sentence; null when it said nothing. */
  serverNote: string | null
  /** Why the provider is likely to refuse the document as set; null when nothing is off. */
  warning: string | null
}

/**
 * The instance-wide "this model reads images" switch — the ONE logic path behind
 * both admin shells, which render their own markup over it.
 *
 * It starts from the stored flag, or from the id when there is none, so a setup
 * that predates the switch is not told its vision model is blind. With the local
 * provider the server is asked instead: Ollama's `/api/show` reports what a model
 * can do, and that answer replaces the guess. The switch stays an override either
 * way — going against what is known warns, it does not block.
 */
export function useModelVision({ provider, model, baseUrl, stored }: {
  provider: string
  model: string
  /** The Ollama address to ask, already defaulted by the caller. */
  baseUrl: string
  /** The addon config as loaded. */
  stored: { model?: unknown; multimodal?: unknown }
}): ModelVision {
  const [multimodal, setMultimodal] = useState<boolean>(
    stored.multimodal === true || modelReadsPhotos(typeof stored.model === 'string' ? stored.model : ''),
  )
  // The server's answer, keyed by what was asked: a reply about the previous
  // model or address must not be read as one about the current one.
  const [answer, setAnswer] = useState<{ key: string; sees: boolean | null } | null>(null)

  const id = model.trim()
  const key = `${baseUrl}\n${id}`

  useEffect(() => {
    if (provider !== 'local' || !id) return
    let cancelled = false
    adminApi.llmLocalCapabilities(baseUrl, id)
      .then(r => {
        if (cancelled) return
        const sees = r.capabilities ? r.capabilities.includes('vision') : null
        setAnswer({ key, sees })
        if (sees !== null) setMultimodal(sees)
      })
      .catch(() => { if (!cancelled) setAnswer({ key, sees: null }) })
    return () => { cancelled = true }
  }, [provider, id, baseUrl, key])

  // null = no answer: not local, no model, unreachable, unknown to the server, or too old to say.
  const serverVision = provider === 'local' && answer?.key === key ? answer.sees : null

  let serverNote: string | null = null
  if (serverVision !== null) {
    serverNote = serverVision
      ? `The server reports that ${id} reads images.`
      : `The server reports that ${id} does not read images.`
  }

  let warning: string | null = null
  if (multimodal && serverVision === false) {
    warning = 'You have turned this on against what the server reports — the provider will refuse the document.'
  } else if (multimodal && serverVision === null && id !== '' && !modelReadsPhotos(id)) {
    warning = `${id} is not known to read images — if the provider refuses the document, this is why.`
  }

  return { multimodal, setMultimodal, serverNote, warning }
}
