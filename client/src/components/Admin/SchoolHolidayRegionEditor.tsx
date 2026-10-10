import { useId, useState } from 'react'
import { CalendarRange, Trash2 } from 'lucide-react'
import { schoolHolidayRegionRequestSchema, type SchoolHolidayRegionDetail, type SchoolHolidayRegionRequest } from '@trek/shared'
import { useTranslation } from '../../i18n'
import ConfirmDialog from '../shared/ConfirmDialog'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import { Tooltip } from '../shared/Tooltip'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, GRID_2, INPUT, LABEL, PANEL } from '../shared/dialogParts'
import { SettingsHint } from '../Settings/settingsKit'

/** The dialog body's padded column, kept inside the form so the footer's Save submits it. */
const BODY = 'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6 pt-5'
const ALERT = 'm-0 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-danger'

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
  const labelId = `${fieldId}-title`

  return <>
    <DialogShell
      onClose={close}
      labelledBy={labelId}
      width="editor"
      align="top"
      blocked={discard}
      bodyClassName="flex min-h-0 flex-1 flex-col"
      header={
        <DialogHeader
          tile={<DialogTile><CalendarRange size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          eyebrow={t('schoolCatalog.title')}
          title={name.trim() || t('schoolCatalog.region')}
          sub={region.country}
        />
      }
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => {
        event.preventDefault()
        const parsed = schoolHolidayRegionRequestSchema.safeParse(body)
        setInvalid(!parsed.success)
        if (parsed.success) onSave(parsed.data)
      }}>
        <div className={BODY}>
          <fieldset disabled={busy || offline} className={`m-0 flex min-w-0 flex-col gap-5 border-0 p-0 ${busy ? 'opacity-60' : ''}`}>
            <EditorField label={t('schoolCatalog.region')} htmlFor={`${fieldId}-region`}>
              <input id={`${fieldId}-region`} autoFocus required maxLength={150} className={INPUT} value={name} onChange={event => setName(event.target.value)} />
            </EditorField>
            <SettingsHint>{t('schoolCatalog.periodHint')}</SettingsHint>
            {holidays.map((holiday, index) => {
              const removeLabel = `${t('common.delete')} ${holiday.name || index + 1}`
              return <div key={holiday.key} className={PANEL}>
                <EditorField label={t('schoolCatalog.name')} htmlFor={`${fieldId}-holiday-${holiday.key}`}>
                  <div className="flex items-stretch gap-2">
                    <input id={`${fieldId}-holiday-${holiday.key}`} required maxLength={150} className={`${INPUT} flex-1`} value={holiday.name} onChange={event => setHolidays(rows => rows.map(row => row.key === holiday.key ? { ...row, name: event.target.value } : row))} />
                    <Tooltip label={removeLabel}>
                      <button type="button" className="grid w-[38px] flex-none place-items-center rounded-[10px] border border-edge bg-surface-card text-content-faint transition-colors hover:border-content-faint hover:text-danger disabled:cursor-default disabled:opacity-50" aria-label={removeLabel} onClick={() => setHolidays(rows => rows.filter(row => row.key !== holiday.key))}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </Tooltip>
                  </div>
                </EditorField>
                <div className={GRID_2}>
                  <div role="group" aria-label={t('schoolCatalog.start')} className="min-w-0">
                    <span className={LABEL}>{t('schoolCatalog.start')}</span>
                    <CustomDatePicker key={String(busy || offline)} value={holiday.startDate} placeholder={t('schoolCatalog.start')} max={holiday.endDate || undefined} onChange={startDate => setHolidays(rows => rows.map(row => row.key === holiday.key ? { ...row, startDate } : row))} />
                  </div>
                  <div role="group" aria-label={t('schoolCatalog.end')} className="min-w-0">
                    <span className={LABEL}>{t('schoolCatalog.end')}</span>
                    <CustomDatePicker key={String(busy || offline)} value={holiday.endDate} placeholder={t('schoolCatalog.end')} min={holiday.startDate || undefined} onChange={endDate => setHolidays(rows => rows.map(row => row.key === holiday.key ? { ...row, endDate } : row))} />
                  </div>
                </div>
              </div>
            })}
            <AddRowButton disabled={holidays.length >= 500} onClick={() => {
              setHolidays(rows => [...rows, { key: nextKey, name: '', startDate: '', endDate: '' }]); setNextKey(key => key + 1)
            }}>{t('schoolCatalog.addPeriod')}</AddRowButton>
            {invalid && <p role="alert" className={ALERT} style={fs(12.5, 'body')}>{t('schoolCatalog.invalid')}</p>}
            {error && <p role="alert" className={ALERT} style={fs(12.5, 'body')}>{error}</p>}
          </fieldset>
        </div>
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={close}>{t('common.cancel')}</DialogButton>
          <DialogButton type="submit" variant="primary" disabled={busy || offline} aria-busy={busy}>{busy ? t('common.loading') : t('common.save')}</DialogButton>
        </DialogFooter>
      </form>
    </DialogShell>
    <ConfirmDialog isOpen={discard} onClose={() => setDiscard(false)} onConfirm={onClose} title={t('common.cancel')} message={t('schoolCatalog.discard')} />
  </>
}
