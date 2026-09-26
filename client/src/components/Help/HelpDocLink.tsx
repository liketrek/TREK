import React from 'react'
import { Link } from 'react-router'
import { FileText, ArrowUpRight } from 'lucide-react'
import { useHelpStore } from '../../store/helpStore'

/**
 * A row that leads into the full Help & Docs page. The panel closes on the
 * way: the docs page has its own navigation and the two side by side would
 * fight for the width.
 */
export default function HelpDocLink({ to, title, subtitle }: { to: string; title: string; subtitle?: string }): React.ReactElement {
  const closeHelp = useHelpStore(s => s.closeHelp)
  return (
    <Link
      to={to}
      onClick={closeHelp}
      className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 hover:bg-surface-hover transition-colors"
    >
      <FileText className="w-4 h-4 text-content-faint flex-shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-body text-content-secondary group-hover:text-content truncate transition-colors">{title}</span>
        {subtitle && <span className="block text-caption text-content-faint truncate">{subtitle}</span>}
      </span>
      <ArrowUpRight className="w-3.5 h-3.5 text-content-faint opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  )
}
