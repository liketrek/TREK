import { useCallback, useEffect, useRef, useState } from 'react'
import type { SchoolHolidayCatalog, SchoolHolidayCountryRequest, SchoolHolidayRegionDetail, SchoolHolidayRegionRequest } from '@trek/shared'
import { schoolHolidayCatalogRepo as catalogRepo } from '../../repo/schoolHolidayCatalogRepo'
import { useTranslation } from '../../i18n'
import { useNetworkMode } from '../../hooks/useNetworkMode'

export function useSchoolHolidayCatalog() {
  const { t } = useTranslation()
  const { offline } = useNetworkMode()
  const [catalog, setCatalog] = useState<SchoolHolidayCatalog>({ countries: [], regions: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<SchoolHolidayRegionDetail | null>(null)
  const mounted = useRef(true)
  const pending = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const reload = useCallback(async () => {
    catalogRepo.requireOnline()
    const catalog = await catalogRepo.catalog()
    if (mounted.current) setCatalog(catalog)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (offline) { setLoading(false); return }
    setLoading(true)
    catalogRepo.catalog().then(catalog => {
      if (!cancelled) { setCatalog(catalog); setError('') }
    }).catch(() => { if (!cancelled) setError(t('common.error')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [offline, t])

  async function run(action: () => Promise<unknown>, after?: () => void) {
    if (pending.current) return false
    pending.current = true
    setBusy(true)
    setError('')
    try {
      catalogRepo.requireOnline()
      await action()
      if (mounted.current) after?.()
      try {
        await reload()
      } catch {
        if (mounted.current) setError(t('schoolCatalog.refreshError'))
      }
      return true
    } catch (failure) {
      if (mounted.current) {
        const message = failure instanceof Error ? failure.message : ''
        const http = failure as { response?: { data?: { error?: string } } }
        setError(http.response?.data?.error || message || t('common.error'))
      }
      return false
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }

  return {
    catalog, loading, busy, error, offline, editor, setEditor,
    refresh: () => run(async () => {}),
    createCountry: (country: SchoolHolidayCountryRequest) => run(() => catalogRepo.createCountry(country)),
    deleteCountry: (code: string) => run(() => catalogRepo.deleteCountry(code)),
    openRegion: (id: number) => run(async () => {
      const region = await catalogRepo.region(id)
      if (mounted.current) setEditor(region)
    }),
    saveRegion: (country: string, id: number, body: SchoolHolidayRegionRequest) => run(
      () => id ? catalogRepo.updateRegion(id, body) : catalogRepo.createRegion(country, body),
      () => setEditor(null),
    ),
    deleteRegion: (id: number, revision: number) => run(() => catalogRepo.deleteRegion(id, revision)),
  }
}
