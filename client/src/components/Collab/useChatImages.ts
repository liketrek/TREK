import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * The images pinned to a chat message before it is sent.
 *
 * One hook for both shells. The desktop hook and the phone screen each carried
 * their own copy of the same picking, previewing and clearing, which is two
 * places for the same leak and a duplication bill on every line.
 *
 * A file and the object URL that previews it are one thing, so they are stored
 * as one thing and the two arrays the callers read are derived from it. Every
 * mutator computes the next list first and then commits it: nothing is created
 * or revoked inside a state updater, because React invokes those an extra time
 * in development and the second run would mint a second URL for the same file.
 * That is what the strip showed as two thumbnails for one attachment, and
 * removing one of them left a preview for a picture that was never sent.
 *
 * The ref is the list, the state is the render of it. Written together so two
 * calls in the same tick see each other, which a functional updater would give
 * for free and a plain array would not.
 */
export const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const MAX_CHAT_IMAGES = 4
export const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024

interface PickedImage {
  file: File
  url: string
}

/**
 * What an add() left out: files of the wrong type or over the size limit, and
 * valid files past the cap of MAX_CHAT_IMAGES. Either can be zero, both cannot.
 */
export interface ChatImageDrop {
  rejected: number
  overflow: number
}

export interface ChatImages {
  files: File[]
  previews: string[]
  /**
   * Returns false when something was dropped, so the caller can say why. The
   * optional callback tells it what was dropped, because a picture past the cap
   * is a different message from a picture of the wrong kind.
   */
  add: (incoming: FileList | File[], onDrop?: (drop: ChatImageDrop) => void) => boolean
  remove: (index: number) => void
  clear: () => void
}

export function useChatImages(): ChatImages {
  const [items, setItems] = useState<PickedImage[]>([])
  const itemsRef = useRef<PickedImage[]>([])

  const commit = useCallback((next: PickedImage[]) => {
    itemsRef.current = next
    setItems(next)
  }, [])

  // Unmount with pictures still pinned: the URLs outlive the component otherwise.
  useEffect(() => () => {
    itemsRef.current.forEach(item => URL.revokeObjectURL(item.url))
    itemsRef.current = []
  }, [])

  const add = useCallback((incoming: FileList | File[], onDrop?: (drop: ChatImageDrop) => void) => {
    const all = Array.from(incoming)
    const valid = all.filter(f => CHAT_IMAGE_TYPES.includes(f.type) && f.size <= MAX_CHAT_IMAGE_BYTES)
    const room = MAX_CHAT_IMAGES - itemsRef.current.length
    const added = valid.slice(0, Math.max(0, room))
    if (added.length) {
      // Only the new files get a URL; the ones already in the list keep theirs.
      commit([...itemsRef.current, ...added.map(file => ({ file, url: URL.createObjectURL(file) }))])
    }
    // A picture the cap turned away is as gone as one of the wrong kind: the strip
    // shows what will be sent, and the sender deserves to hear why it is short.
    const drop = { rejected: all.length - valid.length, overflow: valid.length - added.length }
    if (drop.rejected || drop.overflow) onDrop?.(drop)
    return drop.rejected === 0 && drop.overflow === 0
  }, [commit])

  const remove = useCallback((index: number) => {
    const gone = itemsRef.current[index]
    if (!gone) return
    URL.revokeObjectURL(gone.url)
    commit(itemsRef.current.filter((_, i) => i !== index))
  }, [commit])

  const clear = useCallback(() => {
    itemsRef.current.forEach(item => URL.revokeObjectURL(item.url))
    commit([])
  }, [commit])

  const files = useMemo(() => items.map(item => item.file), [items])
  const previews = useMemo(() => items.map(item => item.url), [items])

  return { files, previews, add, remove, clear }
}
