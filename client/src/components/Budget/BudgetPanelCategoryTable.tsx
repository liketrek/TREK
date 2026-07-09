import { Fragment, type CSSProperties, type Dispatch, type SetStateAction } from 'react'
import { Trash2, Pencil, GripVertical } from 'lucide-react'
import type { BudgetItem } from '../../types'
import { usePluginViewContributions, PluginCardFooter } from '../Plugins/PluginContributions'
import { currencyDecimals } from '../../utils/formatters'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import { calcPP, calcPD, calcPPD, hasCustomMemberSplit } from './BudgetPanel.helpers'
import InlineEditCell from './BudgetPanelInlineEditCell'
import AddItemRow from './BudgetPanelAddItemRow'
import BudgetMemberChips, { type TripMember } from './BudgetPanelMemberChips'
import type { EditingCat, AddItemData } from './useBudgetPanel'

interface BudgetCategoryTableProps {
  cat: string
  grouped: Map<string, BudgetItem[]>
  categoryColor: (cat: string) => string
  canEdit: boolean
  editingCat: EditingCat | null
  setEditingCat: Dispatch<SetStateAction<EditingCat | null>>
  dragCat: string | null
  setDragCat: Dispatch<SetStateAction<string | null>>
  dragOverCat: string | null
  setDragOverCat: Dispatch<SetStateAction<string | null>>
  dragItem: number | null
  setDragItem: Dispatch<SetStateAction<number | null>>
  dragOverItem: number | null
  setDragOverItem: Dispatch<SetStateAction<number | null>>
  dragItemCat: string | null
  setDragItemCat: Dispatch<SetStateAction<string | null>>
  categoryNames: string[]
  reorderBudgetCategories: (tripId: number | string, orderedCategories: string[]) => Promise<void>
  reorderBudgetItems: (tripId: number | string, orderedIds: number[]) => Promise<void>
  handleRenameCategory: (oldName: string, newName: string) => Promise<void>
  handleDeleteCategory: (cat: string) => Promise<void>
  handleDeleteItem: (id: number) => Promise<void>
  handleUpdateField: (id: number, field: string, value: unknown) => Promise<void>
  handleAddItem: (category: string, data: AddItemData) => Promise<void>
  tripId: number
  currency: string
  locale: string
  t: (key: string) => string
  fmt: (v: number | null | undefined, cur: string) => string
  hasMultipleMembers: boolean
  tripMembers: TripMember[]
  setBudgetItemMembers: (tripId: number | string, itemId: number, userIds: number[]) => Promise<{ members: unknown; item: unknown }>
  toggleBudgetMemberPaid: (tripId: number | string, itemId: number, userId: number, paid: boolean) => Promise<void>
  th: CSSProperties
  td: CSSProperties
}

export default function BudgetCategoryTable({ cat, grouped, categoryColor, canEdit, editingCat, setEditingCat,
  dragCat, setDragCat, dragOverCat, setDragOverCat, dragItem, setDragItem, dragOverItem, setDragOverItem,
  dragItemCat, setDragItemCat, categoryNames, reorderBudgetCategories, reorderBudgetItems,
  handleRenameCategory, handleDeleteCategory, handleDeleteItem, handleUpdateField, handleAddItem,
  tripId, currency, locale, t, fmt, hasMultipleMembers, tripMembers, setBudgetItemMembers, toggleBudgetMemberPaid, th, td }: BudgetCategoryTableProps) {
  const items = grouped.get(cat) || []
  const contribFor = usePluginViewContributions('costs', tripId)
  const subtotal = items.reduce((s, x) => s + (x.total_price || 0), 0)
  const color = categoryColor(cat)
  return (
              <div key={cat} data-drag-cat={cat} style={{
                  marginBottom: 16, opacity: dragCat === cat ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                  position: 'relative',
                }}
                onDragOver={e => {
                  if (!dragCat || dragCat === cat || dragItem) return
                  e.preventDefault(); e.dataTransfer.dropEffect = 'move'
                  setDragOverCat(cat)
                }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCat(null)
                }}
                onDrop={e => {
                  e.preventDefault()
                  if (dragCat && dragCat !== cat) {
                    const newOrder = [...categoryNames]
                    const fromIdx = newOrder.indexOf(dragCat)
                    const toIdx = newOrder.indexOf(cat)
                    newOrder.splice(fromIdx, 1)
                    newOrder.splice(toIdx, 0, dragCat)
                    reorderBudgetCategories(tripId, newOrder)
                  }
                  setDragCat(null); setDragOverCat(null)
                }}
              >
                {dragOverCat === cat && <div style={{ position: 'absolute', top: -2, left: 0, right: 0, height: 4, background: 'var(--accent)', borderRadius: 2, zIndex: 10 }} />}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#000000', color: '#fff',
                  borderRadius: '10px 10px 0 0', padding: '9px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    {canEdit && (
                      <div draggable onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/x-budget-cat', cat); setDragCat(cat) }}
                        onDragEnd={() => { setDragCat(null); setDragOverCat(null) }}
                        style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                        <GripVertical size={14} />
                      </div>
                    )}
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                    {canEdit && editingCat?.name === cat ? (
                      <input
                        autoFocus
                        value={editingCat.value}
                        onChange={e => setEditingCat({ ...editingCat, value: e.target.value })}
                        onBlur={() => { handleRenameCategory(cat, editingCat.value); setEditingCat(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') { handleRenameCategory(cat, editingCat.value); setEditingCat(null) } if (e.key === 'Escape') setEditingCat(null) }}
                        style={{ fontWeight: 600, fontSize: 'calc(13px * var(--fs-scale-body, 1))', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, color: '#fff', padding: '1px 6px', outline: 'none', fontFamily: 'inherit', width: '100%' }}
                      />
                    ) : (
                      <>
                        <span style={{ fontWeight: 600, fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{cat}</span>
                        {canEdit && (
                          <button onClick={() => setEditingCat({ name: cat, value: cat })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 1 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                            <Pencil size={10} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, opacity: 0.9 }}>{fmt(subtotal, currency)}</span>
                    {canEdit && (
                      <button onClick={() => handleDeleteCategory(cat)} title={t('budget.deleteCategory')}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}
                  onDragOver={e => { if (dragCat) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: 'left', minWidth: 120 }}>{t('budget.table.name')}</th>
                        <th style={{ ...th, minWidth: 75 }}>{t('budget.table.total')}</th>
                        <th className="hidden sm:table-cell" style={{ ...th, minWidth: 160 }}>{t('budget.table.persons')}</th>
                        <th className="hidden sm:table-cell" style={{ ...th, minWidth: 55 }}>{t('budget.table.days')}</th>
                        <th className="hidden md:table-cell" style={{ ...th, minWidth: 100 }}>{t('budget.table.perPerson')}</th>
                        <th className="hidden md:table-cell" style={{ ...th, minWidth: 90 }}>{t('budget.table.perDay')}</th>
                        <th className="hidden lg:table-cell" style={{ ...th, minWidth: 95 }}>{t('budget.table.perPersonDay')}</th>
                        <th className="hidden sm:table-cell" style={{ ...th, width: 90, maxWidth: 90 }}>{t('budget.table.date')}</th>
                        <th className="hidden sm:table-cell" style={{ ...th, minWidth: 150 }}>{t('budget.table.note')}</th>
                        <th style={{ ...th, width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => {
                        // A custom (uneven) split has no single per-person figure — the per-member
                        // amounts are shown via the member chips — so blank those columns (#1458).
                        const customSplit = hasCustomMemberSplit(item)
                        const pp = customSplit ? null : calcPP(item.total_price, item.persons)
                        const pd = calcPD(item.total_price, item.days)
                        const ppd = customSplit ? null : calcPPD(item.total_price, item.persons, item.days)
                        const hasMembers = (item.members?.length ?? 0) > 0
                        const contributions = contribFor(item.id)
                        return (
                          <Fragment key={item.id}>
                          <tr
                            style={{
                              transition: 'background 0.1s, opacity 0.15s',
                              opacity: dragItem === item.id ? 0.4 : 1,
                              boxShadow: dragOverItem === item.id ? 'inset 4px 0 0 0 var(--accent)' : 'none',
                            }}
                            onDragOver={e => {
                              if (dragCat && dragCat !== cat) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return }
                              if (dragItem && dragItemCat === cat && dragItem !== item.id) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverItem(item.id) }
                            }}
                            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverItem(null) }}
                            onDrop={e => {
                              if (dragItem && dragItemCat === cat && dragItem !== item.id) {
                                e.preventDefault(); e.stopPropagation()
                                const ids = items.map(i => i.id)
                                const fromIdx = ids.indexOf(dragItem)
                                const toIdx = ids.indexOf(item.id)
                                ids.splice(fromIdx, 1)
                                ids.splice(toIdx, 0, dragItem)
                                reorderBudgetItems(tripId, ids)
                                setDragItem(null); setDragOverItem(null); setDragItemCat(null)
                              }
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {canEdit && (
                                  <div draggable onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; setDragItem(item.id); setDragItemCat(cat) }}
                                    onDragEnd={() => { setDragItem(null); setDragOverItem(null); setDragItemCat(null) }}
                                    style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-faint)', flexShrink: 0 }}>
                                    <GripVertical size={12} />
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <InlineEditCell value={item.name} onSave={v => handleUpdateField(item.id, 'name', v)} placeholder={t('budget.table.name')} locale={locale} editTooltip={item.reservation_id ? t('budget.linkedToReservation') : t('budget.editTooltip')} readOnly={!canEdit || !!item.reservation_id} />
                                  {hasMultipleMembers && (
                                    <div className="sm:hidden" style={{ marginTop: 4 }}>
                                      <BudgetMemberChips
                                        members={item.members || []}
                                        tripMembers={tripMembers}
                                        onSetMembers={(userIds) => setBudgetItemMembers(tripId, item.id, userIds)}
                                        onTogglePaid={(userId, paid) => toggleBudgetMemberPaid(tripId, item.id, userId, paid)}
                                        compact={false}
                                        readOnly={!canEdit}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ ...td, textAlign: 'center' }}>
                              <InlineEditCell value={item.total_price} type="number" decimals={currencyDecimals(currency)} onSave={v => handleUpdateField(item.id, 'total_price', v)} style={{ textAlign: 'center' }} placeholder={currencyDecimals(currency) === 0 ? '0' : '0,00'} locale={locale} editTooltip={t('budget.editTooltip')} readOnly={!canEdit} />
                            </td>
                            <td className="hidden sm:table-cell" style={{ ...td, textAlign: 'center', position: 'relative' }}>
                              {hasMultipleMembers ? (
                                <BudgetMemberChips
                                  members={item.members || []}
                                  tripMembers={tripMembers}
                                  onSetMembers={(userIds) => setBudgetItemMembers(tripId, item.id, userIds)}
                                  onTogglePaid={(userId, paid) => toggleBudgetMemberPaid(tripId, item.id, userId, paid)}
                                  readOnly={!canEdit}
                                />
                              ) : (
                                <InlineEditCell value={item.persons} type="number" decimals={0} onSave={v => handleUpdateField(item.id, 'persons', v != null ? parseInt(v as string) || null : null)} style={{ textAlign: 'center' }} placeholder="-" locale={locale} editTooltip={t('budget.editTooltip')} readOnly={!canEdit} />
                              )}
                            </td>
                            <td className="hidden sm:table-cell" style={{ ...td, textAlign: 'center' }}>
                              <InlineEditCell value={item.days} type="number" decimals={0} onSave={v => handleUpdateField(item.id, 'days', v != null ? parseInt(v as string) || null : null)} style={{ textAlign: 'center' }} placeholder="-" locale={locale} editTooltip={t('budget.editTooltip')} readOnly={!canEdit} />
                            </td>
                            <td className="hidden md:table-cell" style={{ ...td, textAlign: 'center', color: pp != null ? 'var(--text-secondary)' : 'var(--text-faint)' }}>{pp != null ? fmt(pp, currency) : '-'}</td>
                            <td className="hidden md:table-cell" style={{ ...td, textAlign: 'center', color: pd != null ? 'var(--text-secondary)' : 'var(--text-faint)' }}>{pd != null ? fmt(pd, currency) : '-'}</td>
                            <td className="hidden lg:table-cell" style={{ ...td, textAlign: 'center', color: ppd != null ? 'var(--text-secondary)' : 'var(--text-faint)' }}>{ppd != null ? fmt(ppd, currency) : '-'}</td>
                            <td className="hidden sm:table-cell" style={{ ...td, padding: '2px 6px', width: 90, maxWidth: 90, textAlign: 'center' }}>
                              {canEdit ? (
                                <div style={{ maxWidth: 90, margin: '0 auto' }}>
                                  <CustomDatePicker value={item.expense_date || ''} onChange={v => handleUpdateField(item.id, 'expense_date', v || null)} placeholder="—" compact borderless />
                                </div>
                              ) : (
                                <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: item.expense_date ? 'var(--text-secondary)' : 'var(--text-faint)' }}>{item.expense_date || '—'}</span>
                              )}
                            </td>
                            <td className="hidden sm:table-cell" style={td}><InlineEditCell value={item.note} onSave={v => handleUpdateField(item.id, 'note', v)} placeholder={t('budget.table.note')} locale={locale} editTooltip={t('budget.editTooltip')} readOnly={!canEdit} /></td>
                            <td style={{ ...td, textAlign: 'center' }}>
                              {canEdit && (
                              <button onClick={() => handleDeleteItem(item.id)} title={t('common.delete')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-faint)', borderRadius: 4, display: 'inline-flex', transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>
                                <Trash2 size={14} />
                              </button>
                              )}
                            </td>
                          </tr>
                          {contributions.length > 0 && (
                            <tr>
                              <td colSpan={10} style={{ padding: '0 8px 6px 20px' }}>
                                <PluginCardFooter items={contributions} tripId={tripId} />
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        )
                      })}
                      {canEdit && <AddItemRow onAdd={data => handleAddItem(cat, data)} t={t} />}
                    </tbody>
                  </table>
                </div>
              </div>
  )
}
