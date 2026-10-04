import { useId, useState } from 'react'
import { ChevronRight, GraduationCap, Loader2, MapPinned, Plus, Trash2, WifiOff } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useSchoolHolidayCatalog } from './useSchoolHolidayCatalog'
import SchoolHolidayRegionEditor from './SchoolHolidayRegionEditor'
import ConfirmDialog from '../shared/ConfirmDialog'
import ErrorBoundary from '../shared/ErrorBoundary'
import CustomSelect from '../shared/CustomSelect'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, GRID_2, INPUT, LABEL, PANEL } from '../shared/dialogParts'
import { SettingRows, SettingsCard, SettingsHint, StatusPill, SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON } from '../Settings/settingsKit'

export default function SchoolHolidayCatalog() {
  return <ErrorBoundary boundaryId="school-holiday-catalog"><Catalog /></ErrorBoundary>
}

function Catalog() {
  const { t } = useTranslation()
  const state = useSchoolHolidayCatalog()
  const [country, setCountry] = useState('')
  const [adding, setAdding] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [remove, setRemove] = useState<{ label: string; action: () => Promise<boolean> } | null>(null)
  const fieldId = useId()
  const selectedCountry = state.catalog.countries.find(item => item.code === country)?.code || state.catalog.countries[0]?.code || ''
  const regions = state.catalog.regions.filter(region => region.country === selectedCountry)
  const disabled = state.busy || state.loading || state.offline
  const addRegion = () => state.setEditor({ id: 0, country: selectedCountry, name: '', code: '', revision: 0, holidays: [] })

  return <SettingsCard
    icon={GraduationCap}
    title={t('schoolCatalog.title')}
    hint={t('schoolCatalog.hint')}
    badge={state.catalog.countries.length > 0 ? <StatusPill>{state.catalog.regions.length}</StatusPill> : undefined}
  >
    {state.offline && <p role="status" className="m-0 flex items-center gap-2 rounded-[12px] bg-warning-soft px-3.5 py-2.5 text-warning" style={fs(12.5, 'body')}><WifiOff size={14} className="flex-none" />{t('schoolCatalog.offline')}</p>}
    {state.loading && <p role="status" className="m-0 flex items-center gap-2 text-content-muted" style={fs(12.5, 'body')}><Loader2 size={14} className="flex-none animate-spin" />{t('common.loading')}</p>}
    {state.error && !state.editor && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-danger" style={fs(12.5, 'body')}>
      <span className="min-w-0 flex-1 basis-48">{state.error}</span>
      <button type="button" disabled={disabled} onClick={() => void state.refresh()} className={SETTINGS_BUTTON} style={fs(12.5, 'body')}>{t('schoolCatalog.retry')}</button>
    </div>}
    <fieldset disabled={disabled} className={`m-0 flex min-w-0 flex-col gap-4 border-0 p-0 ${state.busy ? 'opacity-60' : ''}`}>
      {state.catalog.countries.length > 0 && <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <span className={LABEL}>{t('schoolCatalog.country')}</span>
          <CustomSelect value={selectedCountry} onChange={value => setCountry(String(value))} options={state.catalog.countries.map(item => ({ value: item.code, label: item.name }))} placeholder={t('schoolCatalog.country')} searchable disabled={disabled} />
        </div>
        <Tooltip label={t('schoolCatalog.addCountry')}>
          <button type="button" disabled={adding} aria-label={t('schoolCatalog.addCountry')} onClick={() => setAdding(true)} className={`${SETTINGS_ICON_BUTTON} h-[38px] w-[38px]`}><Plus size={16} strokeWidth={2.2} /></button>
        </Tooltip>
        {/* The hint is the reason the button is off, so it has to show while it is: the
            wrapper takes the pointer the disabled button lets through. */}
        <Tooltip label={t('schoolCatalog.deleteHint')}>
          <span className="inline-flex flex-none">
            <button type="button" disabled={regions.length > 0} className={`${SETTINGS_ICON_BUTTON} h-[38px] w-[38px] hover:!text-danger disabled:pointer-events-none`} aria-label={t('schoolCatalog.deleteCountry')} onClick={() => setRemove({ label: selectedCountry, action: () => state.deleteCountry(selectedCountry) })}><Trash2 size={15} strokeWidth={2} /></button>
          </span>
        </Tooltip>
      </div>}
      {!adding && state.catalog.countries.length === 0 && <div>
        <button type="button" onClick={() => setAdding(true)} className={SETTINGS_BUTTON} style={fs(13, 'body')}><Plus size={14} strokeWidth={2.2} />{t('schoolCatalog.addCountry')}</button>
      </div>}
      {adding && <form className={PANEL} onSubmit={async event => {
        event.preventDefault()
        if (await state.createCountry({ code, name: name.trim() })) { setCountry(code); setAdding(false); setCode(''); setName('') }
      }}>
        <div className={GRID_2}>
          <EditorField label={t('schoolCatalog.country')} htmlFor={`${fieldId}-name`}>
            <input id={`${fieldId}-name`} autoFocus required maxLength={100} className={INPUT} value={name} onChange={event => setName(event.target.value)} />
          </EditorField>
          <EditorField label={t('schoolCatalog.code')} htmlFor={`${fieldId}-code`}>
            <input id={`${fieldId}-code`} required pattern="[A-Z]{2}" maxLength={2} className={`${INPUT} font-geist uppercase tracking-[.08em]`} value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="US" />
          </EditorField>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setAdding(false)} className={SETTINGS_BUTTON} style={fs(13, 'body')}>{t('common.cancel')}</button>
          <button type="submit" className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>{t('common.save')}</button>
        </div>
      </form>}
      {selectedCountry && <>
        {regions.length === 0
          ? <div className="rounded-[12px] border border-dashed border-edge px-4 py-5 text-center"><SettingsHint>{t('schoolCatalog.empty')}</SettingsHint></div>
          : <SettingRows>
            {regions.map(region => <div key={region.id} className="flex items-center gap-2 py-1.5 pl-1.5 pr-3">
              <button type="button" className="group flex min-w-0 flex-1 items-center gap-3 rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-surface-secondary" onClick={() => void state.openRegion(region.id)}>
                <span aria-hidden className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary"><MapPinned size={15} strokeWidth={1.9} /></span>
                <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(13, 'body')}>{region.name}</span>
                <ChevronRight aria-hidden size={15} className="flex-none text-content-faint transition-transform group-hover:translate-x-0.5" />
              </button>
              <Tooltip label={`${t('common.delete')} ${region.name}`}>
                <button type="button" aria-label={`${t('common.delete')} ${region.name}`} className={`${SETTINGS_ICON_BUTTON} hover:!text-danger`} onClick={() => setRemove({ label: region.name, action: () => state.deleteRegion(region.id, region.revision) })}><Trash2 size={14} strokeWidth={2} /></button>
              </Tooltip>
            </div>)}
          </SettingRows>}
        <AddRowButton onClick={addRegion}>{t('schoolCatalog.addRegion')}</AddRowButton>
      </>}
    </fieldset>
    {state.editor && <SchoolHolidayRegionEditor key={state.editor.id} region={state.editor} busy={state.busy} offline={state.offline} error={state.offline ? t('schoolCatalog.offline') : state.error} onClose={() => state.setEditor(null)} onSave={body => { if (state.editor) void state.saveRegion(state.editor.country, state.editor.id, body) }} />}
    <ConfirmDialog isOpen={Boolean(remove)} onClose={() => setRemove(null)} title={t('common.delete')} message={`${remove?.label || ''}. ${t('schoolCatalog.deleteHint')}`} onConfirm={() => { if (remove) void remove.action(); setRemove(null) }} />
  </SettingsCard>
}
