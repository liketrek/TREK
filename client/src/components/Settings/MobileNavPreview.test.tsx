// FE-COMP-NAVPREVIEW-001 to FE-COMP-NAVPREVIEW-006
import { render, screen } from '../../../tests/helpers/render';
import { LayoutGrid, CalendarDays, Globe, Compass } from 'lucide-react';
import type { NavItemDef } from '../Layout/navItems';
import MobileNavPreview from './MobileNavPreview';

const DASHBOARD: NavItemDef = { id: 'dashboard', to: '/dashboard', label: 'My Trips', icon: LayoutGrid, pinned: true };
const VACAY: NavItemDef = { id: 'vacay', to: '/vacay', label: 'Vacay', icon: CalendarDays };
const ATLAS: NavItemDef = { id: 'atlas', to: '/atlas', label: 'Atlas', icon: Globe };
const JOURNEY: NavItemDef = { id: 'journey', to: '/journey', label: 'Journey', icon: Compass };

/** The dock's circles in DOM order, identified by their title attribute. */
function slots(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('span[title]')).map(el => el.getAttribute('title') ?? '');
}

describe('MobileNavPreview', () => {
  it('FE-COMP-NAVPREVIEW-001: renders a circle per bar item plus the More slot', () => {
    const { container } = render(
      <MobileNavPreview bar={[DASHBOARD, VACAY, ATLAS]} hasMore moreLabel="More" />,
    );

    expect(slots(container)).toEqual(['My Trips', 'Vacay', 'Atlas', 'More']);
    expect(screen.getByTitle('Vacay')).toBeInTheDocument();
  });

  it('FE-COMP-NAVPREVIEW-002: the More circle is dropped when nothing is demoted', () => {
    const { container } = render(<MobileNavPreview bar={[DASHBOARD, VACAY]} hasMore={false} moreLabel="More" />);

    expect(slots(container)).toEqual(['My Trips', 'Vacay']);
    expect(screen.queryByTitle('More')).not.toBeInTheDocument();
  });

  it('FE-COMP-NAVPREVIEW-003: the raised centre button splits the slots evenly around it', () => {
    const { container } = render(
      <MobileNavPreview bar={[DASHBOARD, VACAY, ATLAS]} hasMore moreLabel="More" />,
    );

    const row = container.firstElementChild as HTMLElement;
    const children = Array.from(row.children);
    // 4 slots → 2 on the left, then the "+", then the rest.
    const centre = children.findIndex(c => !c.hasAttribute('title'));
    expect(centre).toBe(2);
    expect(children).toHaveLength(5);
  });

  it('FE-COMP-NAVPREVIEW-004: an odd slot count keeps the extra circle on the left', () => {
    const { container } = render(
      <MobileNavPreview bar={[DASHBOARD, VACAY, ATLAS, JOURNEY]} hasMore={false} moreLabel="More" />,
    );

    const children = Array.from((container.firstElementChild as HTMLElement).children);
    const centre = children.findIndex(c => !c.hasAttribute('title'));
    expect(centre).toBe(2);
    expect(slots(container)).toEqual(['My Trips', 'Vacay', 'Atlas', 'Journey']);
  });

  it('FE-COMP-NAVPREVIEW-005: an empty bar still renders the centre action', () => {
    const { container } = render(<MobileNavPreview bar={[]} hasMore={false} moreLabel="More" />);

    expect(slots(container)).toEqual([]);
    expect((container.firstElementChild as HTMLElement).children).toHaveLength(1);
  });

  it('FE-COMP-NAVPREVIEW-006: the More label comes from the caller', () => {
    render(<MobileNavPreview bar={[DASHBOARD]} hasMore moreLabel="Mehr" />);

    expect(screen.getByTitle('Mehr')).toBeInTheDocument();
  });
});
