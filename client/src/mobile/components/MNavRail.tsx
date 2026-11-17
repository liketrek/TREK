import type { LucideIcon } from 'lucide-react';
import { Plus, Search, Settings2, Shield, Sparkles, Upload } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useAssistantHomeLauncher } from '../../components/Assistant/useAssistantHome';
import { useNavItems } from '../../components/Layout/navItems';
import { isNavItemActive, useCreateAction } from '../../components/Layout/useCreateAction';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import MFab from './MFab';
import { MRail, MRailButton, MRailSpacer } from './MRail';
import { useRailAction } from './railAction';

interface RailEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  go: () => void;
}

const FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--m-bg)]';

/**
 * The touch shell's navigation on a wide window (hooks/sizeClass.ts): a rail
 * on the leading edge, where an iPad app keeps its sidebar, in place of the
 * phone's bottom dock.
 *
 * It has the room the dock lacks, so every destination sits in it at once,
 * with its name under the icon: the dock's own items, the ones the phone keeps
 * under More, the home assistant, and settings and administration at the foot,
 * which the phone reaches through the avatar menu.
 *
 * Its head is always one 56px circle, so no entry moves when the page changes:
 * the create action with the dock's context-aware meaning, the screen's own
 * action where it has one (the vacation calendar's switch), or the dock's
 * quiet logo where there is nothing to create (settings, administration).
 */
export default function MNavRail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const create = useCreateAction(true);
  const assistant = useAssistantHomeLauncher();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const navItems = useNavItems();
  const screenAction = useRailAction();

  const isActive = (to: string) => isNavItemActive(location.pathname, to);
  const main: RailEntry[] = [
    ...navItems.map(({ id, to, label, icon }) => ({
      id: to,
      // A few names are too long for a rail in some languages; the rail has its own words for those.
      label: id === 'collections' ? t('mobileNav.railCollections') : label,
      icon,
      active: isActive(to),
      go: () => void navigate(to),
    })),
    ...(assistant.available
      ? [{ id: 'assistant', label: t('assistant.launcher.tooltip'), icon: Sparkles, active: false, go: assistant.open }]
      : []),
  ];
  const foot: RailEntry[] = [
    {
      id: '/settings',
      label: t('mobileNav.railSettings'),
      icon: Settings2,
      active: isActive('/settings'),
      go: () => void navigate('/settings'),
    },
    ...(isAdmin
      ? [
          {
            id: '/admin',
            label: t('mobileNav.railAdmin'),
            icon: Shield,
            active: isActive('/admin'),
            go: () => void navigate('/admin'),
          },
        ]
      : []),
  ];

  const path = location.pathname;
  const nothingToCreate = path.startsWith('/settings') || path.startsWith('/admin');
  // /vacay draws its own action (the year/editor switch) into the head, as it
  // does into the dock's centre on the phone; until it has, the slot stays empty.
  const screenOwnsHead = path.startsWith('/vacay');
  const searchFab = path.startsWith('/atlas');

  let head;
  if (nothingToCreate) {
    head = (
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--m-ic)] opacity-70"
      >
        <img src="/icons/icon-dark.svg" alt="" className="block h-6 w-6 opacity-75 dark:hidden" />
        <img src="/icons/icon-white.svg" alt="" className="hidden h-6 w-6 opacity-75 dark:block" />
      </span>
    );
  } else if (screenOwnsHead) {
    head = screenAction ? <ScreenActionButton /> : <span aria-hidden="true" className="h-14 w-14" />;
  } else {
    head = (
      <MFab onClick={create.run} ariaLabel={create.label} className={FOCUS_RING}>
        {searchFab ? (
          <Search size={22} strokeWidth={2.4} />
        ) : create.upload ? (
          <Upload size={21} strokeWidth={2.4} />
        ) : (
          <Plus size={24} strokeWidth={2.4} />
        )}
      </MFab>
    );
  }

  return (
    <MRail label={t('mobileNav.navigation')} fixed head={head}>
      {main.map((entry) => (
        <RailEntryButton key={entry.id} {...entry} />
      ))}
      <MRailSpacer />
      <div aria-hidden="true" className="my-1 h-px w-8 flex-none bg-[color:var(--m-rowbr)]" />
      {foot.map((entry) => (
        <RailEntryButton key={entry.id} {...entry} />
      ))}
    </MRail>
  );
}

/** The screen's own action, drawn like the dock's circle: filled, or a ring while it is on. */
function ScreenActionButton() {
  const action = useRailAction();
  if (!action) return null;
  const Icon = action.icon;
  return (
    <button
      type="button"
      onClick={action.run}
      aria-label={action.label}
      className={`flex h-14 w-14 flex-none items-center justify-center rounded-full transition-[background,color] duration-300 ease-in-out ${FOCUS_RING} ${
        action.pressed
          ? 'border-2 border-[color:var(--m-act)] bg-[color:var(--m-sheetop)] text-m-ink'
          : 'bg-m-act text-m-actfg shadow-[0_8px_20px_-6px_rgba(0,0,0,.4)]'
      }`}
    >
      <Icon size={24} strokeWidth={2.3} />
    </button>
  );
}

function RailEntryButton({ label, icon: Icon, active, go }: RailEntry) {
  return (
    <MRailButton label={label} active={active} onClick={go}>
      <Icon size={20} strokeWidth={active ? 2.1 : 1.9} />
    </MRailButton>
  );
}
