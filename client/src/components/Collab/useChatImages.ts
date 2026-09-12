import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The images pinned to a chat message before it is sent.
 *
 * One hook for both shells. The desktop hook and the phone screen each carried
 * their own copy of the same picking, previewing and clearing, which is two
 * places for the same leak and a duplication bill on every line.
 *
 * Object URLs are held in a ref and revoked when the file they belong to goes,
 * when the list is cleared and on unmount. Rebuilding every preview on each
 * change, which is what both copies did, leaked one URL per image per keystroke
 * of picking, and did it from inside a setState updater, so React ran it twice
 * in development and leaked twice as fast.
 */
export const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const MAX_CHAT_IMAGES = 4
export const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024

export interface ChatImages {
  files: File[]
  previews: string[]
  /** Returns false when something was dropped, so the caller can say why. */
  add: (incoming: FileList | File[]) => boolean
  remove: (index: number) => void
  clear: () => void
}

export function useChatImages(): ChatImages {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const urls = useRef<string[]>([])

  const revokeAll = useCallback(() => {
    urls.current.forEach(URL.revokeObjectURL)
    urls.current = []
  }, [])

  useEffect(() => revokeAll, [revokeAll])

  const add = useCallback((incoming: FileList | File[]) => {
    const all = Array.from(incoming)
    const valid = all.filter(f => CHAT_IMAGE_TYPES.includes(f.type) && f.size <= MAX_CHAT_IMAGE_BYTES)
    if (valid.length) {
      setFiles(prev => {
        const room = MAX_CHAT_IMAGES - prev.length
        const added = valid.slice(0, Math.max(0, room))
        // Only the new files get a URL; the ones already in the list keep theirs.
        const fresh = added.map(URL.createObjectURL)
        urls.current = [...urls.current, ...fresh]
        setPreviews(p => [...p, ...fresh])
        return [...prev, ...added]
      })
    }
    return valid.length === all.length
  }, [])

  const remove = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      const gone = prev[index]
      if (gone) {
        URL.revokeObjectURL(gone)
        urls.current = urls.current.filter(u => u !== gone)
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const clear = useCallback(() => {
    revokeAll()
    setFiles([])
    setPreviews([])
  }, [revokeAll])

  return { files, previews, add, remove, clear }
}
