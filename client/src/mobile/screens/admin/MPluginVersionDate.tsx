import { useFormatDate } from '../../../hooks/useDateFormat'

/** The day a plugin version was published, in the user's date format (#2971). */
export default function MPluginVersionDate({ at, className }: { at?: string | null; className?: string }) {
  const { formatDate } = useFormatDate()
  if (!at) return null
  return <span className={className}>{formatDate(new Date(at))}</span>
}
