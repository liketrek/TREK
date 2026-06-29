import {
  X, Check, CheckCheck, Luggage, Package, FolderPlus, Upload,
} from 'lucide-react'
import type { PackingState } from './usePackingListPanel'

export function PackingHeader(S: PackingState) {
  const {
    inlineHeader, t, items, abgehakt, fortschritt, canEdit, isAdmin,
    showSaveTemplate, saveTemplateName, setSaveTemplateName, handleSaveAsTemplate, setShowSaveTemplate,
    setShowImportModal, handleClearChecked, availableTemplates, templateDropdownRef,
    showTemplateDropdown, setShowTemplateDropdown, applyingTemplate, handleApplyTemplate,
    bagTrackingEnabled, showBagModal, setShowBagModal,
    addingCategory, newCatName, setNewCatName, handleAddNewCategory, setAddingCategory,
  } = S
  return (
    <div style={{ padding: inlineHeader ? '20px 24px 16px' : '0 0 16px', flexShrink: 0, borderBottom: inlineHeader ? '1px solid rgba(0,0,0,0.06)' : undefined }}>
      <div style={{ display: 'flex', alignItems: inlineHeader ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 14 }}>
        {inlineHeader ? (
          <div>
            <h2 style={{ margin: 0, fontSize: 'calc(18px * var(--fs-scale-subtitle, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>{t('packing.title')}</h2>
            {items.length > 0 && (
              <p style={{ margin: '2px 0 0', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', color: 'var(--text-faint)' }}>
                {t('packing.progress', { packed: abgehakt, total: items.length, percent: fortschritt })}
              </p>
            )}
          </div>
        ) : <span />}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {canEdit && isAdmin && items.length > 0 && showSaveTemplate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="text" autoFocus
                value={saveTemplateName}
                onChange={e => setSaveTemplateName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveAsTemplate(); if (e.key === 'Escape') { setShowSaveTemplate(false); setSaveTemplateName('') } }}
                placeholder={t('packing.templateName')}
                style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', padding: '5px 10px', borderRadius: 99, border: '1px solid var(--border-primary)', outline: 'none', fontFamily: 'inherit', width: 140, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              />
              <button onClick={handleSaveAsTemplate} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#10b981' }}><Check size={14} /></button>
              <button onClick={() => { setShowSaveTemplate(false); setSaveTemplateName('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-faint)' }}><X size={14} /></button>
            </div>
          )}
          {inlineHeader && canEdit && (
            <button onClick={() => setShowImportModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99,
              border: '1px solid var(--border-primary)', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', background: 'var(--bg-card)', color: 'var(--text-muted)',
            }}>
              <Upload size={12} /> <span className="hidden sm:inline">{t('packing.import')}</span>
            </button>
          )}
          {inlineHeader && canEdit && abgehakt > 0 && (
            <button onClick={handleClearChecked} style={{
              fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', padding: '5px 10px', borderRadius: 99, border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <span className="hidden sm:inline">{t('packing.clearChecked', { count: abgehakt })}</span>
              <span className="sm:hidden">{t('packing.clearCheckedShort', { count: abgehakt })}</span>
            </button>
          )}
          {inlineHeader && canEdit && availableTemplates.length > 0 && (
            <div ref={templateDropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowTemplateDropdown(v => !v)} disabled={applyingTemplate} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99,
                border: '1px solid', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                background: showTemplateDropdown ? 'var(--text-primary)' : 'var(--bg-card)',
                borderColor: showTemplateDropdown ? 'var(--text-primary)' : 'var(--border-primary)',
                color: showTemplateDropdown ? 'var(--bg-primary)' : 'var(--text-muted)',
              }}>
                <Package size={12} /> <span className="hidden sm:inline">{t('packing.applyTemplate')}</span><span className="sm:hidden">{t('packing.template')}</span>
              </button>
              {showTemplateDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 50,
                  background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 200,
                }}>
                  {availableTemplates.map(tmpl => (
                    <button key={tmpl.id} onClick={() => handleApplyTemplate(tmpl.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'transparent', fontFamily: 'inherit', fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-primary)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Package size={13} className="text-content-faint" />
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>{tmpl.name}</div>
                        <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{tmpl.item_count} {t('admin.packingTemplates.items')}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {inlineHeader && canEdit && isAdmin && items.length > 0 && !showSaveTemplate && (
            <button onClick={() => setShowSaveTemplate(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99,
              border: '1px solid var(--border-primary)', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              background: 'var(--bg-card)', color: 'var(--text-muted)',
            }}>
              <FolderPlus size={12} /> <span className="hidden sm:inline">{t('packing.saveAsTemplate')}</span>
            </button>
          )}
          {bagTrackingEnabled && (
            <button onClick={() => setShowBagModal(true)} className="xl:!hidden"
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99,
                border: '1px solid', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                background: showBagModal ? 'var(--text-primary)' : 'var(--bg-card)',
                borderColor: showBagModal ? 'var(--text-primary)' : 'var(--border-primary)',
                color: showBagModal ? 'var(--bg-primary)' : 'var(--text-muted)',
              }}>
              <Luggage size={12} /> {t('packing.bags')}
            </button>
          )}
        </div>
      </div>

        {items.length > 0 && (
        <div className="hidden sm:block" style={{ marginTop: 14, marginBottom: 14 }}>
          <div className="flex items-center" style={{ gap: 14 }}>
            {fortschritt === 100 ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))', fontWeight: 700, color: '#10b981',
                letterSpacing: '-0.01em', flexShrink: 0,
              }}>
                <CheckCheck size={18} strokeWidth={2.5} />
                <span>{t('packing.allPacked')}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{
                    fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 700, color: 'var(--text-primary)',
                    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}>{abgehakt}</span>
                  <span style={{
                    fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: 'var(--text-faint)',
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginLeft: 1,
                  }}>/{items.length}</span>
                </div>
                <span style={{
                  fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, padding: '2px 7px',
                  borderRadius: 99, background: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.4,
                }}>{fortschritt}%</span>
              </div>
            )}

            <div style={{
              flex: 1,
              height: 8,
              background: 'var(--bg-tertiary)',
              borderRadius: 99,
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
            }}>
              <div style={{
                height: '100%',
                borderRadius: 99,
                transition: 'width 600ms cubic-bezier(0.23, 1, 0.32, 1), background 400ms ease, box-shadow 400ms ease',
                background: fortschritt === 100
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : 'var(--accent)',
                width: `${fortschritt}%`,
                boxShadow: fortschritt === 100 ? '0 0 14px rgba(16,185,129,0.45)' : 'none',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)',
                  borderRadius: 99,
                  pointerEvents: 'none',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {canEdit && (addingCategory ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            autoFocus
            type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddNewCategory(); if (e.key === 'Escape') { setAddingCategory(false); setNewCatName('') } }}
            placeholder={t('packing.newCategoryPlaceholder')}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontFamily: 'inherit', outline: 'none', color: 'var(--text-primary)' }}
          />
          <button onClick={handleAddNewCategory} disabled={!newCatName.trim()}
            style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: newCatName.trim() ? 'var(--text-primary)' : 'var(--border-primary)', color: 'var(--bg-primary)', cursor: newCatName.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}>
            <Check size={16} />
          </button>
          <button onClick={() => { setAddingCategory(false); setNewCatName('') }}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-faint)' }}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <button onClick={() => setAddingCategory(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px dashed var(--border-primary)', background: 'none', cursor: 'pointer', fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-faint)' }}>
          <FolderPlus size={14} /> {t('packing.addCategory')}
        </button>
      ))}
    </div>
  )
}
