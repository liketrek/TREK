import { useId, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { schoolHolidayRegionRequestSchema, type SchoolHolidayRegionDetail, type SchoolHolidayRegionRequest } from '@trek/shared'
import { useTranslation } from '../../i18n'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'

export const holidayInputClass = 'w-full rounded-lg border border-edge bg-surface-input px-3 py-2 text-body text-content'
export const holidayButtonClass = 'rounded-lg border border-edge px-3 py-2 text-body font-medium text-content hover:bg-surface-hover disabled:opacity-50'

export default function SchoolHolidayRegionEditor({ region, busy, offline = false, error, onClose, onSave }: {
  region: SchoolHolidayRegionDetail
  busy: boolean
  offline?: boolean
  error: string
  onClose: () => void
  onSave: (body: SchoolHolidayRegionRequest) => void
}) {
  const { t } = useTranslation()
  const fieldId = useId()
  const [name, setName] = useState(region.name)
  const [holidays, setHolidays] = useState(region.holidays.map((holiday, index) => ({ ...holiday, key: index })))
  const [nextKey, setNextKey] = useState(holidays.length)
  const [discard, setDiscard] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const body = { name, revision: region.revision, holidays: holidays.map(({ name, startDate, endDate }) => ({ name, startDate, endDate })) }
  const dirty = name !== region.name || JSON.stringify(body.holidays) !== JSON.stringify(region.holidays)
  const close = () => { if (!busy) { if (dirty) setDiscard(true); else onClose() } }

  return <>
    <Modal isOpen onClose={close} title={t('schoolCatalog.region')} size="xl">
      <form className="space-y-4" onSubmit={event => {
        event.preventDefault()
        const parsed = schoolHolidayRegionRequestSchema.safeParse(body)
        setInvalid(!parsed.success)
        if (parsed.success) onSave(parsed.data)
      }}>
        <fieldset disabled={busy || offline} className="space-y-4">
          <label className="block space-y-1 text-body"><span>{t('schoolCatalog.region')}</span>
            <input autoFocus required maxLength={150} className={holidayInputClass} value={name} onChange={event => setName(event.target.value)} />
          </label>
          <p className="text-caption text-content-muted">{t('schoolCatalog.periodHint')}</p>
          {holidays.map((holiday, index) => <div key={holiday.key} className="space-y-2 rounded-xl border border-edge p-3">
            <div className="space-y-1 text-body">
              <label htmlFor={`${fieldId}-holiday-${holiday.key}`}>{t('schoolCatalog.name')}</label>
              <div className="flex items-stretch gap-2">
                <input id={`${fieldId}-holiday-${holiday.key}`} required maxLength={150} className={`${holidayInputClass} min-w-0 flex-1`} value={holiday.name} onChange={event => setHolidays(rows => rows.map(row => row.key === holiday.key ? { ...row, name: event.target.value } : row))} />
                <button type="button" className="flex shrink-0 items-center justify-center rounded-[10px] border border-edge px-[9px] text-content-faint transition-colors hover:border-[color:var(--text-faint)] hover:text-content disabled:opacity-50" aria-label={`${t('common.delete')} ${holiday.name || index + 1}`} onClick={() => setHolidays(rows => rows.filter(row => row.key !== holiday.key))}><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div role="group" aria-label={t('schoolCatalog.start')} className="min-w-0 space-y-1 text-caption"><span>{t('schoolCatalog.start')}</span>
                <CustomDatePicker key={String(busy || offline)} value={holiday.startDate} placeholder={t('schoolCatalog.start')} max={holiday.endDate || undefined} onChange={startDate => setHolidays(rows => rows.map(row => row.key === holiday.key ? { ...row, startDate } : row))} />
              </div>
              <div role="group" aria-label={t('schoolCatalog.end')} className="min-w-0 space-y-1 text-caption"><span>{t('schoolCatalog.end')}</span>
                <CustomDatePicker key={String(busy || offline)} value={holiday.endDate} placeholder={t('schoolCatalog.end')} min={holiday.startDate || undefined} onChange={endDate => setHolidays(rows => rows.map(row => row.key === holiday.key ? { ...row, endDate } : row))} />
              </div>
            </div>
          </div>)}
          <button type="button" disabled={holidays.length >= 500} className={`${holidayButtonClass} flex items-center gap-2`} onClick={() => {
            setHolidays(rows => [...rows, { key: nextKey, name: '', startDate: '', endDate: '' }]); setNextKey(key => key + 1)
          }}><Plus size={16} />{t('schoolCatalog.addPeriod')}</button>
          {invalid && <p role="alert" className="text-body text-danger">{t('schoolCatalog.invalid')}</p>}
          {error && <p role="alert" className="text-body text-danger">{error}</p>}
        </fieldset>
          <div className="flex justify-end gap-2 border-t border-edge pt-4">
            <button type="button" className={holidayButtonClass} onClick={close}>{t('common.cancel')}</button>
            <button type="submit" disabled={busy || offline} aria-busy={busy} className="rounded-lg bg-accent px-4 py-2 text-body font-semibold text-accent-text disabled:opacity-50">{busy ? t('common.loading') : t('common.save')}</button>
          </div>
      </form>
    </Modal>
    <ConfirmDialog isOpen={discard} onClose={() => setDiscard(false)} onConfirm={onClose} title={t('common.cancel')} message={t('schoolCatalog.discard')} />
  </>
}
