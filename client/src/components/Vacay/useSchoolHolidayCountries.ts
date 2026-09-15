import { useEffect, useState } from 'react'
import { schoolHolidayCatalogRepo } from '../../repo/schoolHolidayCatalogRepo'
import { SCHOOL_HOLIDAY_COUNTRY_CONFIG } from '../../vacay/schoolHolidayCountries'
import { getIntlLanguage, useTranslation } from '../../i18n'

export function useSchoolHolidayCountries(enabled = true) {
  const { language, t } = useTranslation()
  const [manual, setManual] = useState<{ code: string; name: string }[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (!enabled) return
    let stale = false
    schoolHolidayCatalogRepo.catalog().then(catalog => {
      if (!stale) {
        setManual(catalog.countries.filter(country => catalog.regions.some(region => region.country === country.code)))
        setError('')
      }
    }).catch(() => { if (!stale) setError(t('schoolCatalog.loadError')) })
    return () => { stale = true }
  }, [enabled, t])
  const names = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' })
  const countries = new Map(Object.keys(SCHOOL_HOLIDAY_COUNTRY_CONFIG).map(code => [code, names.of(code) || code]))
  for (const country of manual) if (!countries.has(country.code)) countries.set(country.code, country.name)
  return { countries: [...countries].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label)), error }
}
