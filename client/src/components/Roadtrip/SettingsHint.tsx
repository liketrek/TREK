import { Tooltip } from '../shared/Tooltip'

export default function SettingsHint({ children, id }: { children: string; id?: string }) {
  return <Tooltip label={children} placement="top">
    <p id={id} tabIndex={0} className="min-w-0 truncate text-caption leading-snug text-content-faint">{children}</p>
  </Tooltip>
}
