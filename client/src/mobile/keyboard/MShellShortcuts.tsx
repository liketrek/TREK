import { useLocation, useMatch, useNavigate } from 'react-router';
import { useNavItems } from '../../components/Layout/navItems';
import { useCreateAction } from '../../components/Layout/useCreateAction';
import { useTranslation } from '../../i18n';
import type { Shortcut } from './shortcuts';
import { useShortcuts } from './useShortcuts';

/**
 * The app-wide shortcuts of the touch shell: ⌘1 to ⌘9 for the sections in the
 * order the rail shows them, ⌘N for what the "+" creates here, ⌘, for
 * settings. Inside a trip the numbers belong to the trip's own sections
 * (MTripShell), so the shell lets go of them there.
 */
export default function MShellShortcuts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const inTrip = useMatch('/trips/:id');
  const navItems = useNavItems();
  const create = useCreateAction(true);
  const noCreate = ['/settings', '/admin', '/vacay'].some((p) => location.pathname.startsWith(p));

  const shortcuts: Shortcut[] = [
    ...(inTrip
      ? []
      : navItems.slice(0, 9).map((item, i) => ({
          id: `go-${item.id}`,
          title: item.label,
          key: String(i + 1),
          mod: true,
          run: () => void navigate(item.to),
        }))),
    ...(noCreate ? [] : [{ id: 'create', title: create.label, key: 'n', mod: true, run: create.run }]),
    { id: 'settings', title: t('nav.bottomSettings'), key: ',', mod: true, run: () => void navigate('/settings') },
  ];
  useShortcuts('shell', shortcuts);
  return null;
}
