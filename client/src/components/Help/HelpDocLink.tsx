import { ArrowUpRight, FileText } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';
import { useHelpStore } from '../../store/helpStore';

/**
 * A row that leads into the full Help & Docs page. The panel closes on the
 * way: the docs page has its own navigation and the two side by side would
 * fight for the width.
 */
export default function HelpDocLink({
  to,
  title,
  subtitle,
}: {
  to: string;
  title: string;
  subtitle?: string;
}): React.ReactElement {
  const closeHelp = useHelpStore((s) => s.closeHelp);
  return (
    <Link
      to={to}
      onClick={closeHelp}
      className="group -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
    >
      <FileText className="h-4 w-4 flex-shrink-0 text-content-faint" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body text-content-secondary transition-colors group-hover:text-content">
          {title}
        </span>
        {subtitle && <span className="block truncate text-caption text-content-faint">{subtitle}</span>}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-content-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
