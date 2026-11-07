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

interface RailEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  go: () => void;
}

/**
 * The touch shell's navigation on a wide window (hooks/sizeClass.ts): a glass
 * rail on the leading edge, where an iPad app keeps its sidebar, in place of
 * the phone's bottom dock.
 *
 * It has the room the dock lacks, so every destination sits in it at once,
 * with its name under the icon: the dock's own items, the ones the phone keeps
 * under More, the home assistant, and settings and administration at the foot,
 * which the phone reaches through the avatar menu. The create action keeps the
 * dock's raised circle at the head, with the same context-aware meaning.
 */
export default function MNavRail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const create = useCreateAction(true);
  const assistant = useAssistantHomeLauncher();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const navItems = useNavItems();

  const isActive = (to: string) => isNavItemActive(location.pathname, to);
  const main: RailEntry[] = [
    ...navItems.map(({ to, label, icon }) => ({
      id: to,
      label,
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
      label: t('nav.bottomSettings'),
      icon: Settings2,
      active: isActive('/settings'),
      go: () => void navigate('/settings'),
    },
    ...(isAdmin
      ? [
          {
            id: '/admin',
            label: t('nav.admin'),
            icon: Shield,
            active: isActive('/admin'),
            go: () => void navigate('/admin'),
          },
        ]
      : []),
  ];

  // Settings and admin have nothing to create, and /vacay draws its own action
  // (the year/edit toggle), the same exceptions the dock makes.
  const noFab = ['/settings', '/admin', '/vacay'].some((p) => location.pathname.startsWith(p));
  const searchFab = location.pathname.startsWith('/atlas');

  return (
    <MRail label={t('mobileNav.navigation')} fixed>
      {!noFab && (
        <MFab
          onClick={create.run}
          ariaLabel={create.label}
          className="mb-2 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--m-bg)]"
        >
          {searchFab ? (
            <Search size={22} strokeWidth={2.4} />
          ) : create.upload ? (
            <Upload size={21} strokeWidth={2.4} />
          ) : (
            <Plus size={24} strokeWidth={2.4} />
          )}
        </MFab>
      )}
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

function RailEntryButton({ label, icon: Icon, active, go }: RailEntry) {
  return (
    <MRailButton label={label} active={active} onClick={go}>
      <Icon size={20} strokeWidth={active ? 2.1 : 1.9} />
    </MRailButton>
  );
}
