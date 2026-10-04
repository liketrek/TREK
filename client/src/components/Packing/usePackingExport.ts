import { useCallback, useMemo, useState } from 'react'
import { packingApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { packingViewItems, type PackingView } from '../../mobile/screens/trip/tabs/listsModel'
import { useAddonStore } from '../../store/addonStore'
import { useTripStore } from '../../store/tripStore'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { downloadBlob } from '../../utils/fileDownload'
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants'
import { packingCsv, packingFileName, packingMarkdown, type PackingBagLookup } from './packingExport'
import { packingPrintHtml } from './packingPrintDocument'

export type { PackingView }

const noBag: PackingBagLookup = () => undefined

/** The trip's dates as one range in the reader's language, or null for a trip without them. */
export function tripDateRange(start: string | null | undefined, end: string | null | undefined, locale: string): string | null {
  if (!start) return null
  // Pinned to UTC: a trip date is a calendar day, and the reader's offset must not move it.
  const format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const from = new Date(`${start}T00:00:00Z`)
  if (!end || end === start) return format.format(from)
  const to = new Date(`${end}T00:00:00Z`)
  const ranged = format as Intl.DateTimeFormat & { formatRange?: (a: Date, b: Date) => string }
  return ranged.formatRange ? ranged.formatRange(from, to) : `${format.format(from)} · ${format.format(to)}`
}

/**
 * The @font-face rules the app loaded for `family`, with every url made absolute.
 *
 * The printable page is a srcdoc frame that knows no fonts of its own. Handing it the
 * app's rules lets it print in Poppins from the same origin, where the trip PDF still
 * asks Google for it.
 */
export function appFontFaces(family: string, doc: Document = document): string {
  const rules: string[] = []
  for (const sheet of Array.from(doc.styleSheets)) {
    let sheetRules: CSSRuleList
    try {
      sheetRules = sheet.cssRules
    } catch {
      continue // a cross-origin sheet does not let its rules be read, and has no font of ours
    }
    const base = sheet.href || doc.baseURI
    for (const rule of Array.from(sheetRules)) {
      if (rule.type !== CSSRule.FONT_FACE_RULE || !rule.cssText.includes(family)) continue
      rules.push(rule.cssText.replace(/url\((["']?)([^"')]+)\1\)/g, (_, quote: string, url: string) =>
        `url(${quote}${new URL(url, base).href}${quote})`))
    }
  }
  return rules.join('\n')
}

/**
 * Export, CSV and print for the view of the packing list on screen (#875, #1420), for
 * the desktop header and the phone's action menu alike.
 *
 * Exactly what the view shows goes out: the Personal list never takes the group's
 * items along, and the Common one never takes anybody's private ones. The placeholder
 * rows that keep an empty category on screen are not items and stay behind.
 *
 * Bags are read when an export runs rather than kept in sync, because only a CSV row
 * or the printout needs them; offline, or with bag tracking off, rows go without.
 */
export function usePackingExport(tripId: number | string, view: PackingView) {
  const { t, language, locale } = useTranslation()
  const trip = useTripStore(s => s.trip)
  const allItems = useTripStore(s => s.packingItems)
  const bagTracking = useAddonStore(s => s.bagTracking)
  const items = useMemo(
    () => packingViewItems(allItems, view).filter(item => item.name !== PACKING_PLACEHOLDER_NAME),
    [allItems, view],
  )
  const [printHtml, setPrintHtml] = useState<string | null>(null)

  const tripTitle = trip?.title
  const listName = view === 'personal' ? t('packing.viewPersonal') : t('packing.viewCommon')
  const title = tripTitle ? `${t('packing.title')}: ${tripTitle}` : t('packing.title')
  const uncategorized = t('packing.defaultCategory')

  const bagLookup = useCallback(async (): Promise<PackingBagLookup> => {
    if (!bagTracking || isEffectivelyOffline()) return noBag
    try {
      const { bags } = await packingApi.listBags(tripId) as { bags?: { id: number; name: string; color?: string | null }[] }
      const byId = new Map((bags ?? []).map(bag => [bag.id, { name: bag.name, color: bag.color }]))
      return bagId => byId.get(bagId)
    } catch {
      return noBag
    }
  }, [bagTracking, tripId])

  const download = useCallback((content: string, type: string, extension: string) => {
    downloadBlob(new Blob([content], { type: `${type};charset=utf-8` }), packingFileName(tripTitle, extension))
  }, [tripTitle])

  const exportMarkdown = useCallback(() => {
    download(packingMarkdown(items, `${title} (${listName})`, uncategorized), 'text/markdown', '.md')
  }, [download, items, title, listName, uncategorized])

  const exportCsv = useCallback(async () => {
    download(packingCsv(items, await bagLookup()), 'text/csv', '.csv')
  }, [download, items, bagLookup])

  const openPrint = useCallback(async () => {
    setPrintHtml(packingPrintHtml(items, {
      eyebrow: `${t('packing.title')} · ${listName}`,
      title: tripTitle || t('packing.title'),
      dates: tripDateRange(trip?.start_date, trip?.end_date, locale),
      itemsLabel: t('packing.printItems'),
      packedLabel: t('packing.printPacked'),
      weightLabel: t('packing.totalWeight'),
      bagsLabel: t('packing.bags'),
      uncategorized,
      lang: language,
      origin: window.location.origin,
      fontCss: appFontFaces('Poppins'),
    }, await bagLookup()))
  }, [items, t, listName, tripTitle, trip?.start_date, trip?.end_date, locale, uncategorized, language, bagLookup])

  const closePrint = useCallback(() => setPrintHtml(null), [])

  return { hasItems: items.length > 0, exportMarkdown, exportCsv, openPrint, printHtml, printTitle: title, closePrint }
}

export type PackingExport = ReturnType<typeof usePackingExport>
