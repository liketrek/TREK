import { Search, Plus, X, Upload, ChevronDown, Check, MapPin } from 'lucide-react'
import { getCategoryIcon } from '../shared/categoryIcons'
import Tooltip from '../shared/Tooltip'
import type { SidebarState } from './usePlacesSidebar'

export function PlacesDropOverlay({ t }: SidebarState) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
      border: '2px dashed var(--accent)',
      borderRadius: 4,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, pointerEvents: 'none',
    }}>
      <Upload size={28} strokeWidth={1.5} color="var(--accent)" />
      <span className="text-accent" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('places.sidebarDrop')}</span>
    </div>
  )
}

export function PlacesHeader(S: SidebarState) {
  const {
    canEditPlaces, onAddPlace, t, setFileImportOpen, setListImportOpen, hasMultipleListImportProviders,
    places, categories, categoryFilters, search, setSearch, plannedIds, hasTracks,
    filter, setFilter, onPlacesFilterChange, setSelectedIds, selectMode, setSelectMode,
    catDropOpen, setCatDropOpen, toggleCategoryFilter, setCategoryFiltersLocal, onCategoryFilterChange,
  } = S
  return (
    <div className="border-b border-edge-faint" style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
      {canEditPlaces && <button
        onClick={onAddPlace}
        className="bg-accent text-accent-text"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '8px 12px', borderRadius: 12, border: 'none',
          fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
        }}
      >
        <Plus size={14} strokeWidth={2} /> {t('places.addPlace')}
      </button>}
      {canEditPlaces && <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button
          onClick={() => setFileImportOpen(true)}
          className="border border-dashed border-edge text-content-faint"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            flex: 1, padding: '5px 12px', borderRadius: 8,
            background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Upload size={11} strokeWidth={2} /> {t('places.importFile')}
        </button>
        <button
          onClick={() => setListImportOpen(true)}
          className="border border-dashed border-edge text-content-faint"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            flex: 1, padding: '5px 12px', borderRadius: 8,
            background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <MapPin size={11} strokeWidth={2} /> {t(hasMultipleListImportProviders ? 'places.importList' : 'places.importGoogleList')}
        </button>
      </div>
      <div className="bg-edge" style={{ height: 1, margin: '2px 0 10px' }} />
      </>}

      {/* Filter-Tabs */}
      {(() => {
        const baseFiltered = places.filter(p => {
          if (categoryFilters.size > 0) {
            if (p.category_id == null) {
              if (!categoryFilters.has('uncategorized')) return false
            } else if (!categoryFilters.has(String(p.category_id))) return false
          }
          if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
              !(p.address || '').toLowerCase().includes(search.toLowerCase())) return false
          return true
        })
        const counts = {
          all: baseFiltered.length,
          unplanned: baseFiltered.filter(p => !plannedIds.has(p.id)).length,
          tracks: baseFiltered.filter(p => p.route_geometry).length,
        }
        const tabs = ([
          { id: 'all', label: t('places.all') },
          { id: 'unplanned', label: t('places.unplanned') },
          hasTracks ? { id: 'tracks', label: t('places.filterTracks') } : null,
        ] as const).filter(Boolean) as Array<{ id: 'all' | 'unplanned' | 'tracks'; label: string }>
        return (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {tabs.map(f => {
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => { setFilter(f.id); onPlacesFilterChange?.(f.id); setSelectedIds(new Set()) }}
                  className={active ? 'bg-accent text-accent-text' : 'bg-surface-card text-content'}
                  style={{
                    appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 9px', borderRadius: 99,
                    fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, whiteSpace: 'nowrap',
                    boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                    transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                  }}
                >
                  {f.label}
                  <span className={active ? 'text-accent-text' : 'text-content-faint'} style={{
                    fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, lineHeight: 1,
                    background: active ? 'color-mix(in srgb, var(--accent-text) 22%, transparent)' : 'var(--bg-tertiary)',
                    padding: '1px 5px', borderRadius: 99, minWidth: 14, textAlign: 'center',
                  }}>
                    {counts[f.id]}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* Suchfeld */}
      <div style={{ position: 'relative' }}>
        <Search size={13} strokeWidth={1.8} color="var(--text-faint)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); if (selectMode) setSelectedIds(new Set()) }}
          placeholder={t('places.search')}
          className="bg-surface-tertiary text-content"
          style={{
            width: '100%', padding: '7px 30px 7px 30px', borderRadius: 10,
            border: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))',
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={12} strokeWidth={2} color="var(--text-faint)" />
          </button>
        )}
      </div>

      {/* Category multi-select dropdown */}
      {categories.length > 0 && (() => {
        const label = categoryFilters.size === 0
          ? t('places.allCategories')
          : categoryFilters.size === 1
            ? (categoryFilters.has('uncategorized') ? t('places.noCategory') : categories.find(c => categoryFilters.has(String(c.id)))?.name || t('places.allCategories'))
            : `${categoryFilters.size} ${t('places.categoriesSelected')}`
        return (
          <div style={{ marginTop: 6, position: 'relative', display: 'flex', gap: 6, alignItems: 'stretch' }}>
            <button onClick={() => setCatDropOpen(v => !v)} className="bg-surface-card text-content" style={{
              flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              <ChevronDown size={12} className="text-content-faint" style={{ flexShrink: 0, transform: catDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {canEditPlaces && (
              <Tooltip label={t('common.select')} placement="bottom">
              <button
                onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()) }}
                aria-label={t('common.select')}
                aria-pressed={selectMode}
                className={selectMode ? 'text-accent' : 'text-content-faint'}
                style={{
                  position: 'relative', width: 30, flexShrink: 0, borderRadius: 8,
                  border: `1px solid ${selectMode ? 'var(--accent)' : 'var(--border-primary)'}`,
                  background: selectMode ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--bg-card)',
                  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                  transition: 'background 0.18s, color 0.18s, border-color 0.18s',
                  overflow: 'hidden',
                }}
              >
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.18s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: selectMode ? 0 : 1,
                  transform: selectMode ? 'rotate(-90deg) scale(0.6)' : 'rotate(0) scale(1)',
                }}>
                  <Check size={13} strokeWidth={2.4} />
                </span>
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.18s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: selectMode ? 1 : 0,
                  transform: selectMode ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0.6)',
                }}>
                  <X size={13} strokeWidth={2.4} />
                </span>
              </button>
              </Tooltip>
            )}
            {catDropOpen && (
              <div className="bg-surface-card" style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
                border: '1px solid var(--border-primary)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, maxHeight: 200, overflowY: 'auto',
              }}>
                {categories.map(c => {
                  const active = categoryFilters.has(String(c.id))
                  const CatIcon = getCategoryIcon(c.icon)
                  return (
                    <button key={c.id} onClick={() => toggleCategoryFilter(String(c.id))} className={`text-content ${active ? 'bg-surface-hover' : 'bg-transparent'}`} style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                      textAlign: 'left',
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: active ? 'none' : '1.5px solid var(--border-primary)',
                        background: active ? (c.color || 'var(--accent)') : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {active && <Check size={10} strokeWidth={3} color="white" />}
                      </div>
                      <CatIcon size={12} strokeWidth={2} color={c.color || 'var(--text-muted)'} />
                      <span style={{ flex: 1 }}>{c.name}</span>
                    </button>
                  )
                })}
                {places.some(p => p.category_id == null) && (() => {
                  const active = categoryFilters.has('uncategorized')
                  return (
                    <button onClick={() => toggleCategoryFilter('uncategorized')} className={`text-content-muted ${active ? 'bg-surface-hover' : 'bg-transparent'}`} style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                      textAlign: 'left', borderTop: '1px solid var(--border-faint)', marginTop: 2,
                    }}>
                      <div className={active ? 'bg-[var(--text-faint)]' : 'bg-transparent'} style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: active ? 'none' : '1.5px solid var(--border-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {active && <Check size={10} strokeWidth={3} color="white" />}
                      </div>
                      <MapPin size={12} strokeWidth={2} color="var(--text-faint)" />
                      <span style={{ flex: 1 }}>{t('places.noCategory')}</span>
                    </button>
                  )
                })()}
                {categoryFilters.size > 0 && (
                  <button onClick={() => { setCategoryFiltersLocal(new Set()); onCategoryFilterChange?.(new Set()) }} className="bg-transparent text-content-faint" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
                    marginTop: 2, borderTop: '1px solid var(--border-faint)',
                  }}>
                    <X size={10} /> {t('places.clearFilter')}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
