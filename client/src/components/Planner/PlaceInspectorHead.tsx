import { Banknote, ChevronDown, ChevronUp, Mail, MapPin, Phone, Star, X } from 'lucide-react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';

import { useTranslation } from '../../i18n';
import type { Category, Place } from '../../types';
import AssistantAskButton from '../Assistant/AssistantAskButton';
import DawarichIcon from '../shared/DawarichIcon';
import { NEUTRAL_TINT, fs } from '../shared/DialogShell';
import PlaceAvatar from '../shared/PlaceAvatar';
import { Tooltip } from '../shared/Tooltip';
import PlacePhotoGallery from './PlacePhotoGallery';
import { SoftPill, TimePill, tintOf } from './planParts';

/** The round buttons at the end of the band. */
const ROUND_BUTTON =
  'grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm transition-colors hover:text-content';

/** The small pill of the head band, the size of a SoftPill but raised on the tint. */
const HEAD_PILL =
  'inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full bg-surface-card px-2 py-[2px] font-semibold text-content shadow-sm';

interface InspectorHeadProps {
  place: Place;
  category: Category | undefined;
  openNow: boolean | null;
  phone: string | null | undefined;
  /** Typed in by hand (#2472); there is no looked-up one. */
  email?: string | null;
  rating: number | null;
  ratingCount: number | null;
  price: string | null;
  time: string | null;
  /** Who made the avatar's picture, under it; the inspector looks it up. */
  photoCredit: ReactNode;
  /** Folded to the name alone, the place still selected on the map (#3039). */
  collapsed: boolean;
  /** Folds and unfolds the card; without it the card does not fold. */
  onToggleCollapsed?: () => void;
  editingName: boolean;
  nameInputRef: RefObject<HTMLInputElement | null>;
  nameValue: string;
  setNameValue: (value: string) => void;
  commitNameEdit: () => void;
  handleNameKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  startNameEdit: () => void;
  onUpdatePlace?: (placeId: number, data: Partial<Place>) => void;
  onClose: () => void;
}

/**
 * The head band of the place inspector: the avatar with its open/closed ring and photo
 * credit, the name (a double-click renames it), the address, and the facts as pills.
 * The avatar opens the place's photos; its picture is changed in the editor.
 *
 * Folded, it is a slim bar of the avatar and the name over the map, so the place can stay
 * selected, its marker highlighted, while the map around it is panned (#3039).
 */
export function InspectorHead({
  place,
  category,
  openNow,
  phone,
  email,
  rating,
  ratingCount,
  price,
  time,
  photoCredit,
  collapsed,
  onToggleCollapsed,
  editingName,
  nameInputRef,
  nameValue,
  setNameValue,
  commitNameEdit,
  handleNameKeyDown,
  startNameEdit,
  onUpdatePlace,
  onClose,
}: InspectorHeadProps) {
  const { t, locale, language } = useTranslation();
  const ring = openNow === true ? 'bg-success' : openNow === false ? 'bg-danger' : 'bg-surface-card shadow-sm';
  const hasCoords = !!(place.lat && place.lng);
  const hasPills =
    openNow !== null ||
    !!category ||
    !!time ||
    rating != null ||
    !!price ||
    place.source === 'dawarich' ||
    !!phone ||
    !!email ||
    hasCoords;
  return (
    <header
      className={`flex-none px-4 ${collapsed ? 'py-2.5' : 'border-b border-edge-faint pb-3 pt-3.5'}`}
      style={{ background: category?.color ? tintOf(category.color) : NEUTRAL_TINT }}
    >
      <div className={`flex gap-3.5 ${collapsed ? 'items-center' : 'items-start'}`}>
        <div className={`flex flex-none flex-col items-center ${collapsed ? '' : 'w-[57px]'}`}>
          <div className={`rounded-full p-[2.5px] ${ring}`}>
            <PlacePhotoGallery
              place={place}
              language={language}
              label={t('places.openPhotos')}
              className="rounded-full"
            >
              <PlaceAvatar place={place} category={category} size={collapsed ? 32 : 52} />
            </PlacePhotoGallery>
          </div>
          {!collapsed && photoCredit}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitNameEdit}
              onKeyDown={handleNameKeyDown}
              aria-label={t('places.formName')}
              className="-mx-1.5 block w-[calc(100%+12px)] rounded-[8px] border-0 bg-surface-card px-1.5 py-0.5 font-bold tracking-[-0.01em] text-content shadow-sm outline-none"
              style={fs(17, 'subtitle')}
            />
          ) : (
            <h2
              onDoubleClick={startNameEdit}
              className={`m-0 font-bold leading-snug tracking-[-0.01em] text-content ${collapsed ? 'truncate' : 'break-words'} ${onUpdatePlace ? 'cursor-text' : ''}`}
              style={fs(17, 'subtitle')}
            >
              {place.name}
            </h2>
          )}
          {!collapsed && place.address && (
            // One line, whatever its length; the whole address is in the tooltip.
            <div className="mt-0.5 flex min-w-0 items-center gap-1 text-content-muted" style={fs(12.5, 'body')}>
              <MapPin size={12} strokeWidth={2} className="flex-none text-content-faint" />
              <Tooltip label={place.address}>
                <span className="min-w-0 truncate">{place.address}</span>
              </Tooltip>
            </div>
          )}

          {!collapsed && hasPills && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {openNow !== null && (
                <SoftPill
                  tone={openNow ? 'success' : 'danger'}
                  icon={<span className="h-1.5 w-1.5 flex-none rounded-full bg-current" />}
                >
                  {openNow ? t('inspector.opened') : t('inspector.closed')}
                </SoftPill>
              )}
              {category && (
                <span className={HEAD_PILL} style={fs(10.5)}>
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: category.color || 'var(--text-faint)' }}
                  />
                  {category.name}
                </span>
              )}
              {time && <TimePill>{time}</TimePill>}
              {rating != null && rating > 0 && (
                <span className={HEAD_PILL} style={fs(10.5)}>
                  <Star size={11} strokeWidth={2} fill="currentColor" className="flex-none text-warning" />
                  {rating.toFixed(1)}
                  {ratingCount ? (
                    <span className="font-medium text-content-faint">({ratingCount.toLocaleString(locale)})</span>
                  ) : null}
                </span>
              )}
              {price && (
                <span className={HEAD_PILL} style={fs(10.5)}>
                  <Banknote size={11} strokeWidth={2} className="flex-none text-success" />
                  {price}
                </span>
              )}
              {/* Where the place came from, when it did not come from somebody typing it: a stay
                  accepted out of their own recordings. The mark alone — the name beside it is
                  already the place's name, and a word here would only repeat the tooltip. */}
              {place.source === 'dawarich' && (
                <Tooltip label={t('dawarich.place.fromDawarich')} placement="top">
                  <span
                    role="img"
                    aria-label={t('dawarich.place.fromDawarich')}
                    className={`${HEAD_PILL} px-1 py-[3px]`}
                  >
                    <span className="inline-flex overflow-hidden rounded-[4px]">
                      <DawarichIcon size={13} />
                    </span>
                  </span>
                </Tooltip>
              )}
              {phone && (
                <a href={`tel:${phone}`} className={`${HEAD_PILL} hover:text-content-secondary`} style={fs(10.5)}>
                  <Phone size={11} strokeWidth={2} className="flex-none text-content-faint" />
                  {phone}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className={`${HEAD_PILL} min-w-0 hover:text-content-secondary`}
                  style={fs(10.5)}
                >
                  <Mail size={11} strokeWidth={2} className="flex-none text-content-faint" />
                  <span className="truncate">{email}</span>
                </a>
              )}
              {hasCoords && (
                <span
                  className="hidden flex-none items-center rounded-full border border-edge-faint px-2 py-[1px] font-geist tabular-nums text-content-faint sm:inline-flex"
                  style={fs(10.5)}
                >
                  {Number(place.lat).toFixed(6)}, {Number(place.lng).toFixed(6)}
                </span>
              )}
            </div>
          )}
        </div>

        {!collapsed && <AssistantAskButton place={place} />}
        {/* Folding is not closing: the place stays selected, and only the close deselects it. */}
        {onToggleCollapsed && (
          <Tooltip label={collapsed ? t('common.expand') : t('common.collapse')}>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? t('common.expand') : t('common.collapse')}
              className={ROUND_BUTTON}
            >
              {collapsed ? <ChevronUp size={15} strokeWidth={2.2} /> : <ChevronDown size={15} strokeWidth={2.2} />}
            </button>
          </Tooltip>
        )}
        <Tooltip label={t('common.close')}>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className={ROUND_BUTTON}>
            <X size={15} strokeWidth={2.2} />
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
