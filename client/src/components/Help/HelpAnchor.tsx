import { useHelpContext } from '../../hooks/useHelpContext'

/**
 * Renders nothing; registers the screen it sits in with the help center. A
 * page body may not call hooks itself (see pages/PATTERN.md), so this is the
 * form a `*Page.tsx` uses.
 */
export default function HelpAnchor({ id }: { id: string }): null {
  useHelpContext(id)
  return null
}
