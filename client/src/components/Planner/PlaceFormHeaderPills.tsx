import { Loader2, MapPin, Navigation, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Category, Place } from '../../types';
import { safeHexColor } from '../../utils/safeColor';
import type { StopKind } from '../Roadtrip/stopKinds';
import { getCategoryIcon } from '../shared/categoryIcons';
import { PillSelect } from '../shared/dialogParts';
import { PILL } from '../shared/DialogShell';
import { NavigationMenu } from '../shared/NavigationMenu';
import { Tooltip } from '../shared/Tooltip';
import { getNavigationTargets, openNavigationTarget } from './placeNavigation';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** The round pill of the head band: a + or a map pin, an icon and nothing else. */
const ROUND_PILL_BUTTON =
  'grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm ring-1 ring-edge-faint transition-colors hover:text-content';

interface NewCategoryRow {
  open: boolean;
  setOpen: (open: boolean) => void;
  name: string;
  setName: (name: string) => void;
  create: () => Promise<void>;
  inputId: string;
}

/**
 * The head band's pill row. The category to pick, with a round + beside it that
 * turns the two into a field for a new one; for a stop on a drive, its kind in
 * place of both. Then where the picked place came from, and a spinner while a
 * pick is still being looked up.
 */
export function HeaderPills({
  kind,
  categories,
  categoryId,
  onCategory,
  newCategory,
  pickedSource,
  busy,
  navPlace,
  refresh,
  t,
}: {
  kind?: StopKind;
  categories: Category[] | null;
  categoryId: string;
  onCategory: (id: string) => void;
  newCategory: NewCategoryRow;
  pickedSource: string | null;
  busy: boolean;
  /** The place as the form holds it, once it has a position: opens it in a map app (#2178). */
  navPlace: NavigablePlace | null;
  /** Newer details for a saved place, when a fresh lookup has them (PlaceRefreshPill). */
  refresh?: ReactNode;
  t: Translate;
}) {
  // When the new-category field closes, the field or the button that closed it
  // goes with it, and the focus would drop out of the dialog. It comes back to
  // the + that opened the field, as a picker's focus comes back to its pill.
  const plusRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(newCategory.open);
  useEffect(() => {
    const closed = wasOpen.current && !newCategory.open;
    wasOpen.current = newCategory.open;
    if (!closed) return;
    const active = document.activeElement;
    if (!active || active === document.body || !active.isConnected) plusRef.current?.focus();
  }, [newCategory.open]);

  const noCategory = {
    label: t('places.noCategory'),
    icon: <MapPin size={13} strokeWidth={2.2} className="text-content-faint" />,
  };
  const options = [
    { value: '', ...noCategory },
    ...(categories || []).map((c) => {
      const Icon = getCategoryIcon(c.icon);
      // A string like form.category_id, so the picked option hands back the same
      // kind of value the form already keeps.
      return {
        value: String(c.id),
        label: c.name,
        icon: <Icon size={13} strokeWidth={2.2} style={{ color: safeHexColor(c.color, '') || 'var(--text-muted)' }} />,
      };
    }),
  ];

  let lead: ReactNode;
  if (kind) {
    lead = (
      <span className={PILL}>
        <kind.Icon size={13} strokeWidth={2.2} style={{ color: kind.color }} />
        {t(kind.labelKey)}
      </span>
    );
  } else if (newCategory.open) {
    lead = <NewCategoryField {...newCategory} t={t} />;
  } else {
    lead = (
      <>
        <PillSelect
          label={t('places.formCategory')}
          value={categoryId}
          onChange={onCategory}
          options={options}
          fallback={noCategory}
        />
        <Tooltip label={t('places.newCategory')}>
          <button
            ref={plusRef}
            type="button"
            onClick={() => newCategory.setOpen(true)}
            aria-label={t('places.newCategory')}
            className={ROUND_PILL_BUTTON}
          >
            <Plus size={13} strokeWidth={2.4} />
          </button>
        </Tooltip>
      </>
    );
  }

  return (
    <>
      {lead}
      {pickedSource && (
        <span className={PILL}>
          <Search size={12} strokeWidth={2.2} className="text-content-faint" aria-hidden="true" />
          {pickedSource}
        </span>
      )}
      {navPlace && <OpenInMapsPill place={navPlace} t={t} />}
      {refresh}
      {busy && (
        <span className={PILL} role="status" aria-label={t('places.loadingDetails')}>
          <Loader2 size={13} className="animate-spin text-content-faint" aria-hidden="true" />
          <span className="font-medium text-content-muted">{t('places.loadingDetails')}</span>
        </span>
      )}
    </>
  );
}

type NavigablePlace = Pick<Place, 'name' | 'address' | 'lat' | 'lng' | 'google_place_id' | 'google_ftid'>;

/**
 * A look at the picked place in a real map before it is saved (#2178): its reviews, its
 * photos, whether it is the right branch. The same apps the inspector offers, one tap
 * straight away when only one applies.
 */
function OpenInMapsPill({ place, t }: { place: NavigablePlace; t: Translate }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const targets = getNavigationTargets(place);
  if (targets.length === 0) return null;
  return (
    <span ref={anchorRef} className="inline-flex">
      <Tooltip label={t('places.openInMaps')}>
        <button
          type="button"
          aria-label={t('places.openInMaps')}
          aria-haspopup={targets.length > 1 ? 'menu' : undefined}
          aria-expanded={targets.length > 1 ? open : undefined}
          onClick={() => {
            if (targets.length === 1) openNavigationTarget(targets[0]);
            else setOpen((o) => !o);
          }}
          className={ROUND_PILL_BUTTON}
        >
          <Navigation size={13} strokeWidth={2.2} />
        </button>
      </Tooltip>
      {open && <NavigationMenu targets={targets} anchor={anchorRef.current} onClose={() => setOpen(false)} />}
    </span>
  );
}

/** The new category's name, typed where the category pill was, with its OK and Cancel beside it. */
function NewCategoryField({ inputId, name, setName, create, setOpen, t }: NewCategoryRow & { t: Translate }) {
  return (
    // One parent for the field and both of its buttons.
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <input
        id={inputId}
        type="text"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          // Enter confirms the name, like OK; it never reaches the place's own save.
          if (e.key === 'Enter') {
            e.preventDefault();
            void create();
          }
          // Escape closes the field, like Cancel, and only the field: marked
          // handled, the dialog around it leaves it alone and keeps what is typed.
          if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
          }
        }}
        aria-label={t('places.newCategory')}
        placeholder={t('places.categoryNamePlaceholder')}
        className="w-48 min-w-0 rounded-full bg-surface-card px-3 py-1 text-content shadow-sm outline-none ring-1 ring-edge-faint placeholder:text-content-faint focus:ring-2 focus:ring-[color:var(--text-primary)]"
      />
      <button
        type="button"
        onClick={() => void create()}
        className="rounded-full bg-accent px-3 py-1 font-semibold text-accent-text hover:opacity-90"
      >
        {t('common.ok')}
      </button>
      <button type="button" onClick={() => setOpen(false)} className={`${PILL} hover:opacity-80`}>
        {t('common.cancel')}
      </button>
    </span>
  );
}
