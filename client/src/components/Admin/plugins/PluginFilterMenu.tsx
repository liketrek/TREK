import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { POPOVER } from '../../Packing/packingPopoverStyles';
import { fs } from '../../shared/DialogShell';
import { anchorMenu, MENU_ITEM, useFollowTrigger } from './pluginMenu';
import { sortLabel, type SortKey, type StatusFilter, type T, type TypeFilter } from './pluginModel';

const MENU_ID = 'filters';

interface Section {
  title: string;
  value: string;
  options: Array<[string, string]>;
  onPick: (v: string) => void;
}

/**
 * Type, status and order of the plugin list behind one button instead of three, so the
 * toolbar stays search plus one control. The button counts the filters that narrow the
 * list (the order does not narrow it) and names the order it is in.
 */
export default function PluginFilterMenu({
  t,
  view,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  menu,
  setMenu,
}: {
  t: T;
  view: 'installed' | 'discover';
  typeFilter: TypeFilter;
  setTypeFilter: (v: TypeFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  menu: string | null;
  setMenu: (v: string | null) => void;
}) {
  const open = menu === MENU_ID;
  const btnRef = useRef<HTMLButtonElement>(null);
  useFollowTrigger(open);

  const sections: Section[] = [
    {
      title: t('admin.plugins.filterType'),
      value: typeFilter,
      options: [
        ['all', t('admin.plugins.allTypes')],
        ['widget', t('admin.plugins.type.widget')],
        ['integration', t('admin.plugins.type.integration')],
        ['page', t('admin.plugins.type.page')],
        ['trip-page', t('admin.plugins.type.trip-page')],
      ],
      onPick: (v) => setTypeFilter(v as TypeFilter),
    },
    ...(view === 'installed'
      ? [
          {
            title: t('admin.plugins.filterStatus'),
            value: statusFilter,
            options: [
              ['all', t('admin.plugins.allStatuses')],
              ['on', t('admin.plugins.status.active')],
              ['off', t('admin.plugins.stateOff')],
              ['update', t('admin.plugins.filterUpdate')],
              ['err', t('admin.plugins.status.error')],
            ] as Array<[string, string]>,
            onPick: (v: string) => setStatusFilter(v as StatusFilter),
          },
        ]
      : []),
    {
      title: t('admin.plugins.sortBy'),
      value: sort,
      options:
        view === 'discover'
          ? [
              ['name', t('admin.plugins.sortName')],
              ['recent', t('admin.plugins.sortRecent')],
              ['downloads', t('admin.plugins.sortDownloads')],
            ]
          : [
              ['name', t('admin.plugins.sortName')],
              ['recent', t('admin.plugins.sortRecent')],
              ['updates', t('admin.plugins.sortUpdates')],
            ],
      onPick: (v) => setSort(v as SortKey),
    },
  ];
  const narrowing = (typeFilter !== 'all' ? 1 : 0) + (view === 'installed' && statusFilter !== 'all' ? 1 : 0);

  return (
    <div className="relative flex-none">
      <button
        type="button"
        ref={btnRef}
        onClick={() => setMenu(open ? null : MENU_ID)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[10px] border bg-surface-card px-3 text-content-secondary transition-colors hover:text-content ${
          narrowing ? 'border-[color:var(--text-primary)]' : 'border-edge'
        }`}
        style={fs(12.5, 'body')}
      >
        <SlidersHorizontal size={14} className="flex-none text-content-faint" />
        <span className="font-semibold text-content">{t('admin.plugins.filters')}</span>
        {narrowing > 0 && (
          <span
            className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1.5 font-geist font-bold tabular-nums text-accent-text"
            style={fs(10.5)}
          >
            {narrowing}
          </span>
        )}
        <span className="text-content-faint">{sortLabel(sort, t)}</span>
        <ChevronDown
          size={13}
          className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open &&
        createPortal(
          <div
            role="menu"
            className="w-[240px] max-w-[calc(100vw-2rem)]"
            style={{ ...POPOVER, ...anchorMenu(btnRef.current) }}
          >
            {sections.map((s, i) => (
              <div key={s.title} className={i > 0 ? 'mt-1.5 border-t border-edge-faint pt-1.5' : undefined}>
                <p
                  className="m-0 px-2.5 pb-1 pt-1 font-geist font-bold uppercase tracking-[.08em] text-content-faint"
                  style={fs(10)}
                >
                  {s.title}
                </p>
                {s.options.map(([v, label]) => (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={s.value === v}
                    key={v}
                    onClick={() => s.onPick(v)}
                    className={`${MENU_ITEM} ${s.value === v ? 'font-semibold text-content' : 'text-content-secondary'}`}
                    style={fs(12.5, 'body')}
                  >
                    <span className="min-w-0 flex-1 truncate text-start">{label}</span>
                    <Check
                      size={14}
                      className={`flex-none text-content-muted ${s.value === v ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
