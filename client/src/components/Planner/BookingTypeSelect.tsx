import type { LucideIcon } from 'lucide-react'
import CustomSelect from '../shared/CustomSelect'
import { useTranslation } from '../../i18n'

export interface BookingTypeOption {
  value: string
  labelKey: string
  Icon: LucideIcon
}

/**
 * The kind of a booking or transport as one TREK dropdown, each type with its
 * icon, so it takes a single field at the head of the dialog instead of a row
 * of chips.
 */
export function BookingTypeSelect({ options, value, onChange }: {
  options: readonly BookingTypeOption[]
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <CustomSelect
      value={value}
      onChange={v => onChange(String(v))}
      options={options.map(({ value: optionValue, labelKey, Icon }) => ({
        value: optionValue,
        label: t(labelKey),
        icon: <Icon size={14} className="text-content-muted" />,
      }))}
    />
  )
}
