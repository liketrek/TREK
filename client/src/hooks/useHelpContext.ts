import { useEffect } from 'react'
import { useHelpStore } from '../store/helpStore'

/**
 * Tell the help center which screen is showing. Call it from the screen's data
 * hook, or render `<HelpAnchor id>` from a page body; either way the context
 * is set while the screen is mounted and cleared when it goes away, unless
 * another screen has already taken over.
 */
export function useHelpContext(id: string): void {
  const setContext = useHelpStore(s => s.setContext)
  useEffect(() => {
    setContext(id)
    return () => {
      if (useHelpStore.getState().contextId === id) setContext(null)
    }
  }, [id, setContext])
}
