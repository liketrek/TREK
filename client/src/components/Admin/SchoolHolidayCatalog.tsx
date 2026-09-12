import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useSchoolHolidayCatalog } from './useSchoolHolidayCatalog'
import SchoolHolidayRegionEditor, { holidayButtonClass, holidayInputClass } from './SchoolHolidayRegionEditor'
import ConfirmDialog from '../shared/ConfirmDialog'
import ErrorBoundary from '../shared/ErrorBoundary'
import CustomSelect from '../shared/CustomSelect'

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
  const selectedCountry = state.catalog.countries.find(item => item.code === country)?.code || state.catalog.countries[0]?.code || ''
  const regions = state.catalog.regions.filter(region => region.country === selectedCountry)
  const disabled = state.busy || state.loading || state.offline
  const addRegion = () => state.setEditor({ id: 0, country: selectedCountry, name: '', code: '', revision: 0, holidays: [] })

  return <section className="space-y-4 rounded-2xl border border-edge bg-surface-card p-4 sm:p-6">
    <div>
      <h2 className="font-semibold text-content">{t('schoolCatalog.title')}</h2>
      <p className="mt-1 text-caption text-content-faint">{t('schoolCatalog.hint')}</p>
    </div>
    {state.offline && <p role="status" className="text-body text-warning">{t('schoolCatalog.offline')}</p>}
    {state.loading && <p role="status" className="text-body text-content-muted">{t('common.loading')}</p>}
    {state.error && !state.editor && <div role="alert" className="space-y-2 text-body text-danger">{state.error}<button type="button" disabled={disabled} onClick={() => void state.refresh()} className={`${holidayButtonClass} block`}>{t('schoolCatalog.retry')}</button></div>}
    <fieldset disabled={disabled} className="space-y-4">
      {state.catalog.countries.length > 0 && <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1 text-body"><span>{t('schoolCatalog.country')}</span>
          <CustomSelect value={selectedCountry} onChange={value => setCountry(String(value))} options={state.catalog.countries.map(item => ({ value: item.code, label: item.name }))} placeholder={t('schoolCatalog.country')} searchable disabled={disabled} />
        </div>
        <button type="button" disabled={adding} title={t('schoolCatalog.addCountry')} aria-label={t('schoolCatalog.addCountry')} onClick={() => setAdding(true)} className={`${holidayButtonClass} inline-flex shrink-0 items-center justify-center`}><Plus size={18} /></button>
        <button type="button" disabled={regions.length > 0} title={t('schoolCatalog.deleteHint')} className={holidayButtonClass} aria-label={t('schoolCatalog.deleteCountry')} onClick={() => setRemove({ label: selectedCountry, action: () => state.deleteCountry(selectedCountry) })}><Trash2 size={18} /></button>
      </div>}
      {!adding && state.catalog.countries.length === 0 && <button type="button" onClick={() => setAdding(true)} className={`${holidayButtonClass} flex items-center gap-2`}><Plus size={16} />{t('schoolCatalog.addCountry')}</button>}
      {adding && <form className="space-y-3 rounded-xl border border-edge p-3" onSubmit={async event => {
        event.preventDefault()
        if (await state.createCountry({ code, name: name.trim() })) { setCountry(code); setAdding(false); setCode(''); setName('') }
      }}>
        <label className="block space-y-1 text-body"><span>{t('schoolCatalog.country')}</span><input autoFocus required maxLength={100} className={holidayInputClass} value={name} onChange={event => setName(event.target.value)} /></label>
        <label className="block space-y-1 text-body"><span>{t('schoolCatalog.code')}</span><input required pattern="[A-Z]{2}" maxLength={2} className={holidayInputClass} value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="US" /></label>
        <div className="flex gap-2"><button type="submit" className={holidayButtonClass}>{t('common.save')}</button><button type="button" onClick={() => setAdding(false)} className={holidayButtonClass}>{t('common.cancel')}</button></div>
      </form>}
      {selectedCountry && <>
        {regions.length === 0 && <p className="text-body text-content-muted">{t('schoolCatalog.empty')}</p>}
        <ul className="divide-y divide-edge">{regions.map(region => <li key={region.id} className="flex items-center gap-2 py-2">
          <button type="button" className={`${holidayButtonClass} min-w-0 flex-1 text-left`} onClick={() => void state.openRegion(region.id)}>{region.name}</button>
          <button type="button" title={t('schoolCatalog.addRegion')} aria-label={t('schoolCatalog.addRegion')} className={`${holidayButtonClass} inline-flex shrink-0 items-center justify-center`} onClick={addRegion}><Plus size={18} /></button>
          <button type="button" aria-label={`${t('common.delete')} ${region.name}`} className={holidayButtonClass} onClick={() => setRemove({ label: region.name, action: () => state.deleteRegion(region.id, region.revision) })}><Trash2 size={18} /></button>
        </li>)}</ul>
        {regions.length === 0 && <button type="button" className={`${holidayButtonClass} flex items-center gap-2`} onClick={addRegion}><Plus size={16} />{t('schoolCatalog.addRegion')}</button>}
      </>}
    </fieldset>
    {state.editor && <SchoolHolidayRegionEditor key={state.editor.id} region={state.editor} busy={state.busy} offline={state.offline} error={state.offline ? t('schoolCatalog.offline') : state.error} onClose={() => state.setEditor(null)} onSave={body => { if (state.editor) void state.saveRegion(state.editor.country, state.editor.id, body) }} />}
    <ConfirmDialog isOpen={Boolean(remove)} onClose={() => setRemove(null)} title={t('common.delete')} message={`${remove?.label || ''}. ${t('schoolCatalog.deleteHint')}`} onConfirm={() => { if (remove) void remove.action(); setRemove(null) }} />
  </section>
}
