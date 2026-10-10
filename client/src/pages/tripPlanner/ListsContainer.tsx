import React, { useState } from 'react'
import { PackageCheck, ListTodo, ListPlus, Download, Plus, FolderPlus } from 'lucide-react'
import ApplyTemplateButton from '../../components/Packing/ApplyTemplateButton'
import PackingExportMenu from '../../components/Packing/PackingExportMenu'
import { useTranslation } from '../../i18n'
import { useAuthStore } from '../../store/authStore'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useListsSubTab } from '../../hooks/useListsSubTab'
import type { PackingItem, TodoItem } from '../../types'
import { PackingListPanel, TodoListPanel } from './plannerLazy'
import { LazyPanel } from './LazyPanel'

export function ListsContainer({ tripId, packingItems, todoItems }: Readonly<{ tripId: number; packingItems: PackingItem[]; todoItems: TodoItem[] }>) {
  const [subTab, setSubTabPersist] = useListsSubTab(tripId)
  const [importPackingSignal, setImportPackingSignal] = useState(0)
  const [addCategorySignal, setAddCategorySignal] = useState(0)
  const [saveTemplateSignal, setSaveTemplateSignal] = useState(0)
  const [addTodoSignal, setAddTodoSignal] = useState(0)
  const [packingView, setPackingView] = useState<'common' | 'personal'>('common')
  const { t } = useTranslation()
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const trip = useTripStore(s => s.trip)
  const canEditPacking = useCanDo()('packing_edit', trip)

  const tabs = [
    { id: 'packing' as const, label: t('todo.subtab.packing'), icon: PackageCheck, count: packingItems.length },
    { id: 'todo' as const, label: t('todo.subtab.todo'), icon: ListTodo, count: todoItems.length },
  ]

  // The to-do view fills what is left under the bar, so its list and detail pane
  // scroll inside the screen and the pane's buttons stay in sight.
  const fill = subTab === 'todo'
  return (
    <div style={fill ? { display: 'flex', flexDirection: 'column', height: '100%' } : undefined}>
      <div style={{ padding: '24px 28px 0', flexShrink: 0 }} className="max-md:!px-4 max-md:!pt-4">
        <div className="bg-surface-tertiary" style={{
          borderRadius: 18,
          paddingBlock: 14, paddingInlineEnd: 16, paddingInlineStart: 22,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <h2 className="text-content" style={{ margin: 0, fontSize: 'calc(18px * var(--fs-scale-subtitle, 1))', fontWeight: 600, letterSpacing: '-0.01em', flexShrink: 0 }}>
            {t('trip.tabs.lists')}
          </h2>
          <div className="hidden md:block bg-edge-faint" style={{ width: 1, height: 22, flexShrink: 0 }} />
          <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            {tabs.map(tab => {
              const active = subTab === tab.id
              const Icon = tab.icon
              return (
                <button type="button" key={tab.id} onClick={() => setSubTabPersist(tab.id)}
                  className={active ? 'bg-surface-card text-content' : 'bg-transparent text-content-muted'}
                  style={{
                    appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 99, fontSize: 'calc(13px * var(--fs-scale-body, 1))', whiteSpace: 'nowrap',
                    fontWeight: active ? 500 : 400,
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'background 180ms cubic-bezier(0.23,1,0.32,1), color 180ms cubic-bezier(0.23,1,0.32,1), box-shadow 180ms cubic-bezier(0.23,1,0.32,1)',
                  }}
                >
                  <Icon size={13} className={active ? 'text-content' : 'text-content-faint'} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`text-content-faint ${active ? 'bg-surface-tertiary' : 'bg-[rgba(0,0,0,0.06)]'}`} style={{
                    fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600,
                    padding: '1px 6px', borderRadius: 99, minWidth: 16, textAlign: 'center',
                  }}>{tab.count}</span>
                </button>
              )
            })}
          </div>

          {subTab === 'packing' && (() => {
            const sharedBtnClass = 'inline-flex items-center gap-1.5 px-2.5 sm:px-[14px] py-[7px] sm:py-[9px] hover:opacity-[0.88]'
            // Export and Import carry only their icon, with the name as tooltip and label.
            const iconBtnClass = 'inline-flex items-center justify-center px-2.5 py-[7px] sm:py-[9px] hover:opacity-[0.88] bg-accent text-accent-text'
            const sharedBtnStyle: React.CSSProperties = {
              appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
            }
            return (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginInlineStart: 'auto', flexWrap: 'wrap' }}>
                {canEditPacking && (
                  <button type="button" onClick={() => setAddCategorySignal(s => s + 1)}
                    className={`${sharedBtnClass} bg-accent text-accent-text`}
                    style={sharedBtnStyle}
                  >
                    <ListPlus size={14} strokeWidth={2.5} />
                    <span className="hidden sm:inline">{t('packing.addCategory')}</span>
                  </button>
                )}
                <ApplyTemplateButton
                  tripId={tripId}
                  visibility={packingView}
                  className={`${sharedBtnClass} bg-accent text-accent-text`}
                  style={sharedBtnStyle}
                />
                {isAdmin && packingItems.length > 0 && (
                  <button type="button" onClick={() => setSaveTemplateSignal(s => s + 1)}
                    className={`${sharedBtnClass} bg-accent text-accent-text`}
                    style={sharedBtnStyle}
                  >
                    <FolderPlus size={14} strokeWidth={2.5} />
                    <span className="hidden sm:inline">{t('packing.saveAsTemplate')}</span>
                  </button>
                )}
                <PackingExportMenu tripId={tripId} view={packingView} className={iconBtnClass} style={sharedBtnStyle} />
                <button type="button" onClick={() => setImportPackingSignal(s => s + 1)}
                  className={iconBtnClass}
                  style={sharedBtnStyle}
                  aria-label={t('packing.import')}
                  title={t('packing.import')}
                >
                  <Download size={14} strokeWidth={2.5} />
                </button>
              </div>
            )
          })()}
          {subTab === 'todo' && (
            <button type="button" onClick={() => setAddTodoSignal(s => s + 1)}
              className="hover:opacity-[0.88] bg-accent text-accent-text"
              style={{
                appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
                flexShrink: 0,
                marginInlineStart: 'auto',
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">{t('todo.addItem')}</span>
            </button>
          )}
        </div>
      </div>
      <div style={fill ? { padding: '16px 28px 16px', flex: 1, minHeight: 0 } : { padding: '16px 28px 0' }} className="max-md:!px-4">
        {subTab === 'packing' && (
          <LazyPanel id="packing">
            <PackingListPanel tripId={tripId} items={packingItems} openImportSignal={importPackingSignal} addCategorySignal={addCategorySignal} saveTemplateSignal={saveTemplateSignal} inlineHeader={false} view={packingView} onViewChange={setPackingView} />
          </LazyPanel>
        )}
        {subTab === 'todo' && (
          <LazyPanel id="todo">
            <TodoListPanel tripId={tripId} items={todoItems} addItemSignal={addTodoSignal} />
          </LazyPanel>
        )}
      </div>
    </div>
  )
}
