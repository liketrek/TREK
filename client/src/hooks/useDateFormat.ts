import { DEFAULT_DATE_FORMAT, type DateFormat } from '@trek/shared'
import { useCallback } from 'react'
import { useTranslation } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'
import { formatDisplayDate, formatDisplayDateTime } from '../utils/dateFormat'

/** The current user's date format (#2971); 'auto' follows the interface language. */
export function useDateFormat(): DateFormat {
  return useSettingsStore((s) => s.settings.date_format) ?? DEFAULT_DATE_FORMAT
}

/** The same value outside React (stores, exports, plain helpers), read when called. */
export function readDateFormat(): DateFormat {
  return useSettingsStore.getState().settings.date_format ?? DEFAULT_DATE_FORMAT
}

/**
 * `toLocaleDateString` and `toLocaleString` bound to the interface language and
 * the user's date format, for components that write dates.
 */
export function useFormatDate() {
  const { locale } = useTranslation()
  const format = useDateFormat()
  const date = useCallback(
    (value: Date, opts?: Intl.DateTimeFormatOptions) => formatDisplayDate(value, locale, opts, format),
    [locale, format]
  )
  const dateTime = useCallback(
    (value: Date, opts?: Intl.DateTimeFormatOptions) => formatDisplayDateTime(value, locale, opts, format),
    [locale, format]
  )
  return { formatDate: date, formatDateTime: dateTime, locale, dateFormat: format }
}
