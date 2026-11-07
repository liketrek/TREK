import { ExternalLink, Link2, MoreHorizontal, Star, Wallet } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { formatSize, isImage, isWalletPass } from '../../../../components/Files/FileManager.helpers';
import { linkedFileTargets } from '../../../../components/Files/fileListRules';
import { useTranslation } from '../../../../i18n';
import { fileRepo } from '../../../../repo/fileRepo';
import type { TripFile } from '../../../../types';
import { formatFileDate, getFileTypeMeta } from './filesModel';
import type { MTabScreenProps } from './tabModel';

type Planner = MTabScreenProps['planner'];

/** The product's name, the same in every language. */
const APPLE_WALLET = 'Apple Wallet';
const isPdf = (file: TripFile) => file.mime_type === 'application/pdf';

/**
 * A file's signed address for showing it in place (a tile's picture, the
 * preview pane), fetched once `enabled` turns on: every address costs a token
 * of its own, so a tile asks only once it scrolls into view.
 */
function useSignedUrl(url: string | undefined, enabled: boolean): string {
  const [signed, setSigned] = useState('');
  useEffect(() => {
    if (!url || !enabled) return;
    let cancelled = false;
    void fileRepo.previewUrl(url).then((next) => {
      if (!cancelled) setSigned(next);
    });
    return () => {
      cancelled = true;
    };
  }, [url, enabled]);
  return enabled ? signed : '';
}

/** True once the element has come within a screen of the viewport. */
function useNearView<T extends Element>() {
  const ref = useRef<T>(null);
  // Without an observer to ask, every tile counts as near.
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: '100% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return { ref, near };
}

/** The type's own tile: its icon on its colour, for a file with no picture to show. */
function TypeArt({ file, large = false }: { file: TripFile; large?: boolean }) {
  const meta = getFileTypeMeta(file);
  const Icon = meta.icon;
  return (
    <span
      className="absolute inset-0 flex flex-col items-center justify-center gap-[6px]"
      style={{ background: `${meta.color}1f`, color: meta.color }}
    >
      <Icon size={large ? 44 : 30} strokeWidth={1.7} />
      <span
        className={`font-geist font-extrabold tracking-[.08em] ${large ? 'text-caption' : 'text-[length:calc(9px*var(--fs-scale-caption,1))]'}`}
      >
        {meta.label}
      </span>
    </span>
  );
}

const roundBtn =
  'flex h-7 w-7 flex-none items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)]';

interface FileTileProps {
  file: TripFile;
  selected: boolean;
  canStar: boolean;
  onPick: () => void;
  onStar: () => void;
  onMenu: () => void;
  t: Planner['t'];
}

/**
 * A file as a tile of the grid a wide window shows in place of the phone's
 * rows: its picture (a photo's own, the type's colour and icon otherwise),
 * the name under it, size and date as badges.
 */
export function FileTile({ file, selected, canStar, onPick, onStar, onMenu, t }: FileTileProps) {
  const { locale } = useTranslation();
  const { ref, near } = useNearView<HTMLDivElement>();
  const picture = useSignedUrl(file.url, near && isImage(file.mime_type));
  const starred = !!file.starred;
  return (
    <div
      ref={ref}
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-m-sheetop transition-shadow ${
        selected ? 'border-[color:var(--m-act)] shadow-[0_0_0_1.5px_var(--m-act)]' : 'border-[color:var(--m-rowbr)]'
      }`}
    >
      <button
        type="button"
        onClick={onPick}
        aria-pressed={selected}
        className="flex flex-1 flex-col text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--m-act)]"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden">
          {picture ? (
            <img src={picture} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <TypeArt file={file} />
          )}
        </span>
        <span className="flex flex-1 flex-col gap-[6px] px-3 pb-[10px] pt-2">
          <span className="line-clamp-2 break-words text-[length:calc(12.5px*var(--fs-scale-body,1))] font-bold leading-[1.3] text-m-ink">
            {file.original_name}
          </span>
          <span className="mt-auto flex flex-wrap items-center gap-1">
            {!!file.file_size && <Badge>{formatSize(file.file_size)}</Badge>}
            <Badge>{formatFileDate(file.created_at, locale)}</Badge>
          </span>
        </span>
      </button>
      <span className="absolute end-2 top-2 flex items-center gap-1">
        {canStar ? (
          <button
            type="button"
            onClick={onStar}
            aria-label={starred ? t('files.unstar') : t('files.star')}
            aria-pressed={starred}
            className={`${roundBtn} ${starred ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-glass)] text-m-ink backdrop-blur-[16px]'}`}
          >
            <Star size={13} strokeWidth={2.4} fill={starred ? 'currentColor' : 'none'} />
          </button>
        ) : (
          starred && (
            <span className={`${roundBtn} bg-m-act text-m-actfg`}>
              <Star size={13} strokeWidth={2.4} fill="currentColor" aria-label={t('files.filterStarred')} />
            </span>
          )
        )}
        <button
          type="button"
          onClick={onMenu}
          aria-label={t('files.menu')}
          className={`${roundBtn} bg-[color:var(--m-glass)] text-m-ink backdrop-blur-[16px]`}
        >
          <MoreHorizontal size={14} strokeWidth={2.2} />
        </button>
      </span>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[length:calc(9px*var(--fs-scale-caption,1))] font-bold text-m-muted">
      {children}
    </span>
  );
}

interface FilePreviewPaneProps {
  file: TripFile;
  planner: Planner;
  onOpen: () => void;
  onStar: () => void;
  onLinks: () => void;
  onMenu: () => void;
}

/**
 * The file picked in the grid, shown beside it once the window has room for
 * two panes, the way Files on an iPad previews a document: the picture or the
 * document itself, then what it is, what it belongs to, and what to do with it.
 */
export function FilePreviewPane({ file, planner, onOpen, onStar, onLinks, onMenu }: FilePreviewPaneProps) {
  const { t } = planner;
  const { locale } = useTranslation();
  const meta = getFileTypeMeta(file);
  const showsInPlace = isImage(file.mime_type) || isPdf(file);
  const src = useSignedUrl(file.url, showsInPlace);
  const linked = linkedFileTargets(file, planner.places, planner.reservations, planner.TRANSPORT_TYPES);
  const canEdit = planner.can('file_edit', planner.trip);
  const starred = !!file.starred;
  const actionBtn =
    'flex h-10 flex-1 items-center justify-center gap-[6px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-caption font-semibold text-m-ink outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)]';

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] max-h-[56dvh] w-full overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop">
        {isImage(file.mime_type) && src ? (
          <img src={src} alt={file.original_name} className="absolute inset-0 h-full w-full object-contain" />
        ) : isPdf(file) && src ? (
          <object
            data={`${src}#view=FitH`}
            type="application/pdf"
            title={file.original_name}
            className="absolute inset-0 h-full w-full"
          >
            <TypeArt file={file} large />
          </object>
        ) : (
          <TypeArt file={file} large />
        )}
      </div>

      <div>
        <h3 className="break-words text-[length:calc(16px*var(--fs-scale-subtitle,1))] font-extrabold leading-[1.3] text-m-ink">
          {file.original_name}
        </h3>
        <div className="mt-[6px] flex flex-wrap items-center gap-1">
          <span
            className="rounded-full px-[7px] py-[2px] font-geist text-[length:calc(9px*var(--fs-scale-caption,1))] font-extrabold tracking-[.06em]"
            style={{ background: `${meta.color}1f`, color: meta.color }}
          >
            {meta.label}
          </span>
          {isWalletPass(file.mime_type, file.original_name) && (
            <span className="flex items-center gap-[3px] rounded-full bg-m-act px-[7px] py-[2px] font-geist text-[length:calc(9px*var(--fs-scale-caption,1))] font-bold text-m-actfg">
              <Wallet size={9} strokeWidth={2.4} aria-hidden="true" />
              {APPLE_WALLET}
            </span>
          )}
          {!!file.file_size && <Badge>{formatSize(file.file_size)}</Badge>}
          <Badge>{formatFileDate(file.created_at, locale)}</Badge>
          {file.uploaded_by_name && <Badge>{file.uploaded_by_name}</Badge>}
        </div>
      </div>

      {(linked.places.length > 0 || linked.reservations.length > 0 || file.note_id != null) && (
        <div className="flex flex-wrap gap-[6px]">
          {linked.places.map((place) => (
            <LinkChip key={`p${place.id}`} kind={t('files.sourcePlan')} name={place.name} />
          ))}
          {linked.reservations.map(({ reservation, transport }) => (
            <LinkChip
              key={`r${reservation.id}`}
              kind={t(transport ? 'files.sourceTransport' : 'files.sourceBooking')}
              name={reservation.title}
            />
          ))}
          {file.note_id != null && <LinkChip kind={t('files.sourceCollab')} />}
        </div>
      )}

      {file.description && (
        <p className="whitespace-pre-wrap break-words rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-[13px] py-[11px] text-[length:calc(12.5px*var(--fs-scale-body,1))] text-m-ink">
          {file.description}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex h-10 flex-[1.4] items-center justify-center gap-[6px] rounded-full bg-m-act text-caption font-semibold text-m-actfg outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)] focus-visible:ring-offset-2"
        >
          <ExternalLink size={14} strokeWidth={2.2} />
          {t('common.open')}
        </button>
        {canEdit && (
          <button type="button" onClick={onStar} aria-pressed={starred} className={actionBtn}>
            <Star size={14} strokeWidth={2.2} fill={starred ? 'currentColor' : 'none'} />
            {starred ? t('files.unstar') : t('files.star')}
          </button>
        )}
        {canEdit && (
          <button type="button" onClick={onLinks} className={actionBtn}>
            <Link2 size={14} strokeWidth={2.2} />
            {t('files.link')}
          </button>
        )}
        <button
          type="button"
          onClick={onMenu}
          aria-label={t('files.menu')}
          className={`${actionBtn} w-10 flex-none px-0`}
        >
          <MoreHorizontal size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

/** What a file belongs to: the kind as the outer badge, the name inside it. */
function LinkChip({ kind, name }: { kind: string; name?: string }) {
  return (
    <span
      className={`flex max-w-full items-center gap-[6px] rounded-full border border-[color:var(--m-rowbr)] bg-m-sheetop py-[3px] ps-[10px] ${
        name ? 'pe-[3px]' : 'pe-[10px]'
      }`}
    >
      <span className="flex-none font-geist text-[length:calc(9px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.08em] text-m-faint">
        {kind}
      </span>
      {name && (
        <span className="min-w-0 truncate rounded-full bg-[color:var(--m-ic)] px-[9px] py-[2px] text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold text-m-ink">
          {name}
        </span>
      )}
    </span>
  );
}
