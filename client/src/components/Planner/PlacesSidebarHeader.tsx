import { Search, Plus, X, Upload, FileDown, ChevronDown, Check, MapPin, Star, CalendarPlus, CalendarDays } from 'lucide-react'
import { getCategoryIcon } from '../shared/categoryIcons'
import Tooltip from '../shared/Tooltip'
import { useElementSize } from '../../hooks/useElementSize'
import type { SidebarState } from './usePlacesSidebar'

/**
 * Below this the two labels stop fitting side by side and both buttons fall back
 * to their icon. Measured on the button row itself rather than derived from the
 * sidebar width: the labels are translated, so how much room they need differs
 * per locale, and the row is what actually runs out of space. The rail is
 * draggable down to 200px, which leaves the row 168.
 */
const COMPACT_BUTTONS_WIDTH = 232

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
    canEditPlaces, onAddPlace, onAddPlaceToSelectedDay, selectedDayId, t, setFileImportOpen, setListImportOpen, hasMultipleListImportProviders,
    places, categories, categoryFilters, search, setSearch, plannedIds, plannedFilterIds, dayScoped, onClearSelectedDay, hasTracks,
    filter, setFilter, setSelectedIds, selectMode, setSelectMode,
    catDropOpen, setCatDropOpen, toggleCategoryFilter, setCategoryFilters,
    ratingFilter, setRatingFilter,
    starDropOpen, setStarDropOpen,
  } = S
  const dayOpen = selectedDayId != null
  const { ref: buttonRowRef, width: buttonRowWidth } = useElementSize<HTMLDivElement>()
  // Zero is the first paint, before the observer has measured anything — treat
  // that as roomy so the labels do not flash away and back on every mount.
  const compact = buttonRowWidth > 0 && buttonRowWidth < COMPACT_BUTTONS_WIDTH
  const addLabel = t(dayOpen ? 'places.addPlaceShort' : 'places.addPlace')
  const fileImportLabel = t('places.importFile')
  const listImportLabel = t(hasMultipleListImportProviders ? 'places.importList' : 'places.importGoogleList')
  return (
    <div className="border-b border-edge-faint" style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
      {canEditPlaces && <div ref={buttonRowRef} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {/* The label shortens while the second button is out, so both fit side by
            side in a default rail without either one truncating; a squeezed rail
            drops it entirely and the aria-label carries the name instead. */}
        <button type="button"
          onClick={onAddPlace}
          aria-label={compact ? addLabel : undefined}
          title={compact ? addLabel : undefined}
          className="bg-accent text-accent-text motion-reduce:transition-none"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            // Both halves are driven by flex-basis rather than by grow, so the
            // pair lands on an exact 50/50 and the handover animates in both
            // directions. Half of the 6px gap comes off each side.
            flexGrow: 0, flexShrink: 1, flexBasis: dayOpen ? 'calc(50% - 3px)' : '100%',
            minWidth: 0, padding: '8px 12px', borderRadius: 12, border: 'none',
            fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            overflow: 'hidden', whiteSpace: 'nowrap',
            transition: 'flex-basis 180ms ease',
          }}
        >
          <Plus size={14} strokeWidth={2} />
          {!compact && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {addLabel}
            </span>
          )}
        </button>
        {/* Kept mounted and collapsed rather than unmounted, so it has something
            to animate out of: a button that only exists while a day is open
            would appear and vanish on the spot. Hidden from the tab order and
            from screen readers in the same breath, because a zero-width button
            is still focusable otherwise. */}
        {onAddPlaceToSelectedDay && (
          <Tooltip label={t('places.addToSelectedDay')} disabled={!dayOpen}>
            <button type="button"
              onClick={onAddPlaceToSelectedDay}
              aria-label={t('places.addToSelectedDay')}
              data-testid="add-place-to-day"
              aria-hidden={!dayOpen}
              tabIndex={dayOpen ? 0 : -1}
              className="bg-accent text-accent-text motion-reduce:transition-none"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                flexGrow: 0, flexShrink: 1, flexBasis: dayOpen ? 'calc(50% - 3px)' : '0%',
                minWidth: 0,
                opacity: dayOpen ? 1 : 0,
                padding: dayOpen ? '8px 12px' : 0,
                borderRadius: 12, border: 'none',
                fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', overflow: 'hidden', whiteSpace: 'nowrap',
                pointerEvents: dayOpen ? 'auto' : 'none',
                transition: 'flex-basis 180ms ease, opacity 140ms ease, padding 180ms ease',
              }}
            >
              <CalendarPlus size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
              {!compact && t('places.addToDayShort')}
            </button>
          </Tooltip>
        )}
      </div>}
      {canEditPlaces && <>
      {/* Same squeeze rule as the row above, measured off the same rail: once the
          add buttons lose their labels these two would not fit either. */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button type="button"
          onClick={() => setFileImportOpen(true)}
          aria-label={compact ? fileImportLabel : undefined}
          title={compact ? fileImportLabel : undefined}
          className="border border-dashed border-edge text-content-faint"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            flex: 1, minWidth: 0, padding: '5px 12px', borderRadius: 8,
            background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            overflow: 'hidden', whiteSpace: 'nowrap',
          }}
        >
          <FileDown size={11} strokeWidth={2} /> {!compact && fileImportLabel}
        </button>
        <button type="button"
          onClick={() => setListImportOpen(true)}
          aria-label={compact ? listImportLabel : undefined}
          title={compact ? listImportLabel : undefined}
          className="border border-dashed border-edge text-content-faint"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            flex: 1, minWidth: 0, padding: '5px 12px', borderRadius: 8,
            background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            overflow: 'hidden', whiteSpace: 'nowrap',
          }}
        >
          <MapPin size={11} strokeWidth={2} /> {!compact && listImportLabel}
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
          // While a day is open this counts that day's plan, the same set the list and
          // the map show. Counting the whole trip here is what made the tab read 55
          // beside five pins, with nothing to say the two were answering different
          // questions.
          planned: baseFiltered.filter(p => plannedFilterIds.has(p.id)).length,
          tracks: baseFiltered.filter(p => p.route_geometry).length,
        }
        const tabs = ([
          { id: 'all', label: t('places.all') },
          { id: 'unplanned', label: t('places.unplanned') },
          { id: 'planned', label: t('places.planned') },
          hasTracks ? { id: 'tracks', label: t('places.filterTracks') } : null,
        ] as const).filter(Boolean) as Array<{ id: 'all' | 'unplanned' | 'planned' | 'tracks'; label: string }>
        return (
          // The group always spans the rail and never wraps onto a second line.
          // Each tab keeps its own text width and only the leftover space is
          // shared out, so "Unplanned" stays wider than "All" instead of the four
          // being forced to one size.
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'nowrap' }}>
            {tabs.map(f => {
              const active = filter === f.id
              return (
                <button type="button"
                  key={f.id}
                  onClick={() => { setFilter(f.id); setSelectedIds(new Set()) }}
                  className={active ? 'bg-accent text-accent-text' : 'bg-surface-card text-content'}
                  style={{
                    appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    flex: '1 1 auto', minWidth: 0, overflow: 'hidden',
                    padding: compact ? '4px 5px' : '4px 9px', borderRadius: 99,
                    fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, whiteSpace: 'nowrap',
                    boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                    transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</span>
                  <span className={active ? 'text-accent-text' : 'text-content-faint'} style={{
                    fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, lineHeight: 1,
                    background: active ? 'color-mix(in srgb, var(--accent-text) 22%, transparent)' : 'var(--bg-tertiary)',
                    padding: '1px 5px', borderRadius: 99, minWidth: 14, textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    {counts[f.id]}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* Says out loud what the count above already narrowed to.
          The map has followed the open day on this filter since #2024, and until now
          nothing anywhere said so: the pool read 55, the map drew five, and the honest
          conclusion was that the map was broken. It sits under the tabs rather than on
          the map because a chip over the canvas is unreachable on a phone, which is
          where this was reported from. */}
      {dayScoped && (
        <div
          className="border border-edge-faint bg-surface-tertiary text-content-secondary"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 6px 4px 9px', borderRadius: 8, marginBottom: 8,
            fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
          }}
        >
          <CalendarDays size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('places.dayScoped')}
          </span>
          {onClearSelectedDay && (
            <button type="button"
              onClick={onClearSelectedDay}
              aria-label={t('places.dayScopedClear')}
              title={t('places.dayScopedClear')}
              className="text-content-faint hover:text-content"
              style={{
                marginInlineStart: 'auto', display: 'flex', alignItems: 'center',
                background: 'none', border: 'none', padding: 3, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <X size={12} strokeWidth={2.2} />
            </button>
          )}
        </div>
      )}

      {/* Suchfeld */}
      <div style={{ position: 'relative' }}>
        <Search size={13} strokeWidth={1.8} color="var(--text-faint)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); if (selectMode) setSelectedIds(new Set()) }}
          placeholder={t('places.search')}
          className="bg-surface-card text-content"
          style={{
            width: '100%', padding: '7px 30px 7px 30px', borderRadius: 10,
            // Borderless on the tertiary surface it sat almost flush with the
            // panel; the outline is the one the category dropdown below already
            // uses, so the two read as the same kind of control.
            border: '1px solid var(--border-primary)',
            fontSize: 'calc(12px * var(--fs-scale-body, 1))',
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={12} strokeWidth={2} color="var(--text-faint)" />
          </button>
        )}
      </div>

      {/* Category multi-select plus the star filter. Rendered even without any
          category, because the rating filter does not depend on one and a fresh
          trip is exactly where someone collects places to rate. */}
      {(() => {
        const label = categoryFilters.size === 0
          ? t('places.allCategories')
          : categoryFilters.size === 1
            ? (categoryFilters.has('uncategorized') ? t('places.noCategory') : categories.find(c => categoryFilters.has(String(c.id)))?.name || t('places.allCategories'))
            : `${categoryFilters.size} ${t('places.categoriesSelected')}`
        return (
          <div style={{ marginTop: 6, position: 'relative', display: 'flex', gap: 6, alignItems: 'stretch' }}>
            {categories.length > 0 && <button type="button" onClick={() => setCatDropOpen(v => !v)} className="bg-surface-card text-content" style={{
              flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              <ChevronDown size={12} className="text-content-faint" style={{ flexShrink: 0, transform: catDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>}
            {/* Minimum-stars filter (#1435), same floors as the collections bar. */}
            <Tooltip label={t('places.filterByRating')} placement="bottom">
              <button type="button"
                onClick={() => { setStarDropOpen(v => !v); setCatDropOpen(false) }}
                aria-label={t('places.filterByRating')}
                aria-expanded={starDropOpen}
                className={ratingFilter !== 'all' ? 'text-accent' : 'text-content-faint'}
                style={{
                  height: 30, flexShrink: 0, borderRadius: 8, gap: 3,
                  padding: ratingFilter === 'all' ? 0 : '0 7px',
                  width: ratingFilter === 'all' ? 30 : undefined,
                  border: `1px solid ${ratingFilter !== 'all' ? 'var(--accent)' : 'var(--border-primary)'}`,
                  background: ratingFilter !== 'all' ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--bg-card)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.18s, color 0.18s, border-color 0.18s',
                }}
              >
                <Star size={13} strokeWidth={2.2} fill={ratingFilter !== 'all' ? 'currentColor' : 'none'} />
                {ratingFilter !== 'all' && <span>{ratingFilter}+</span>}
              </button>
            </Tooltip>
            {starDropOpen && (
              <div className="bg-surface-card" style={{
                position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4, minWidth: 116,
                border: '1px solid var(--border-primary)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4,
              }}>
                {(['all', 5, 4, 3, 2, 1] as const).map(opt => {
                  const active = ratingFilter === opt
                  return (
                    <button type="button"
                      key={String(opt)}
                      onClick={() => { setRatingFilter(opt as number | 'all'); setStarDropOpen(false) }}
                      className={`text-content ${active ? 'bg-surface-hover' : 'bg-transparent'}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                        padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                        textAlign: 'left',
                      }}
                    >
                      {opt === 'all'
                        ? <span style={{ flex: 1 }}>{t('common.all')}</span>
                        : (
                          <>
                            <Star size={12} strokeWidth={2.2} color="#facc15" fill="#facc15" />
                            <span style={{ flex: 1 }}>{opt}+</span>
                          </>
                        )}
                      {active && <Check size={11} strokeWidth={3} className="text-content-faint" />}
                    </button>
                  )
                })}
              </div>
            )}
            {canEditPlaces && (
              <Tooltip label={t('common.select')} placement="bottom">
              <button type="button"
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
            {catDropOpen && categories.length > 0 && (
              <div className="bg-surface-card" style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
                border: '1px solid var(--border-primary)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, maxHeight: 200, overflowY: 'auto',
              }}>
                {categories.map(c => {
                  const active = categoryFilters.has(String(c.id))
                  const CatIcon = getCategoryIcon(c.icon)
                  return (
                    <button type="button" key={c.id} onClick={() => toggleCategoryFilter(String(c.id))} className={`text-content ${active ? 'bg-surface-hover' : 'bg-transparent'}`} style={{
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
                    <button type="button" onClick={() => toggleCategoryFilter('uncategorized')} className={`text-content-muted ${active ? 'bg-surface-hover' : 'bg-transparent'}`} style={{
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
                  <button type="button" onClick={() => setCategoryFilters(new Set())} className="bg-transparent text-content-faint" style={{
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
