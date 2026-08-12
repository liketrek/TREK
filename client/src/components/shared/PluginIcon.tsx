import type { CSSProperties } from 'react'
import * as LucideIcons from 'lucide-react'
import { Blocks, type LucideIcon } from 'lucide-react'

// Lucide names are PascalCase. Restricting the lookup to that shape keeps a manifest
// from reaching lucide's non-icon exports (`createLucideIcon`, `icons`, `default`,
// `module.exports`), which are all lowercase-initial.
const LUCIDE_ICON_NAME = /^[A-Z][A-Za-z0-9]*$/

/**
 * Resolves a plugin manifest's `icon` (a lucide icon name, e.g. "Stethoscope") to the
 * matching lucide component, falling back to Blocks for a missing or unknown name.
 *
 * Note lucide icons are forwardRef objects, not functions — never narrow this with
 * `typeof x === 'function'`. The lookup returns a module-level reference, so the
 * component identity is stable across renders and is safe to call inline while
 * building nav/tab arrays.
 */
export function resolvePluginIcon(name: string | null | undefined): LucideIcon {
  if (!name || !LUCIDE_ICON_NAME.test(name)) return Blocks
  const icon = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[name]
  return icon ?? Blocks
}

/** Renders the lucide icon a plugin declares in its manifest (Blocks if unknown). */
export default function PluginIcon({ name, size = 20, className, style }: {
  name: string | null | undefined
  size?: number
  className?: string
  style?: CSSProperties
}) {
  const Icon = resolvePluginIcon(name)
  return <Icon size={size} className={className} style={style} />
}
