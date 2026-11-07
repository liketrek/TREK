import userEvent from '@testing-library/user-event';
import { Settings2, Users } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MRail, MRailButton } from '../../../src/mobile/components/MRail';
import MSectionNav from '../../../src/mobile/components/MSectionNav';
import MCollListNav from '../../../src/mobile/screens/collections/MCollListNav';
import MJourneyFeed from '../../../src/mobile/screens/journey/MJourneyFeed';
import { storyExcerpt } from '../../../src/mobile/screens/journey/mobileJourneyMeta';
import { CollabSegment } from '../../../src/mobile/screens/trip/MTripShellParts';
import { collabBoardFor, collabBoards, collabSideBySide } from '../../../src/mobile/screens/trip/tabs/collabPanes';
import { FilePreviewPane, FileTile } from '../../../src/mobile/screens/trip/tabs/MFilesBoard';
import MTodoSidebar from '../../../src/mobile/screens/trip/tabs/MTodoSidebar';
import { CardGrid, TabPanes } from '../../../src/mobile/screens/trip/tabs/tabChrome';
import { fileRepo } from '../../../src/repo/fileRepo';
import { ALL_SAVED } from '../../../src/store/collectionStore';
import type { JourneyEntry } from '../../../src/store/journeyStore';
import type { Reservation, TripFile } from '../../../src/types';
import { buildPlanner } from '../../helpers/mobileTrip';
import { fireEvent, render, screen, waitFor, within } from '../../helpers/render';
import { setSizeClass } from '../../helpers/sizeClass';

// FE-MOB-PANES-001 onwards: the panes, grids and labels the touch shell uses on a wide window.

const echo = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

describe('rail labels', () => {
  // jsdom lays nothing out: a name measures as two lines when its scrollHeight
  // says so, against the 12px line its computed style reports.
  function measureLike(twoLines: string[]) {
    vi.spyOn(HTMLSpanElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return twoLines.includes(this.textContent ?? '') ? 24 : 12;
    });
    const real = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      const style = real(el, pseudo);
      return new Proxy(style, {
        get: (target, prop) => (prop === 'lineHeight' ? '12px' : Reflect.get(target, prop)),
      });
    });
  }

  afterEach(() => vi.restoreAllMocks());

  function railOf(names: string[]) {
    return render(
      <MRail label="Navigation">
        {names.map((name) => (
          <MRailButton key={name} label={name} active={false} onClick={() => {}}>
            x
          </MRailButton>
        ))}
      </MRail>
    );
  }
  const list = () => screen.getByText('Atlas').closest('nav')?.lastElementChild as HTMLElement;

  it('FE-MOB-PANES-001: every name is drawn at the one caption size, none shrunk to fit', () => {
    measureLike([]);
    railOf(['Atlas', 'Einstellungen']);
    for (const name of ['Atlas', 'Einstellungen']) {
      const label = screen.getByText(name);
      expect(label.className).toContain('text-[length:calc(10px*var(--fs-scale-caption,1))]');
      expect(label.style.getPropertyValue('--fit')).toBe('');
    }
  });

  it('FE-MOB-PANES-002: names that all fit on one line keep the rail at one line each', () => {
    measureLike([]);
    railOf(['Atlas', 'Vacay', 'Journey']);
    expect(list().style.getPropertyValue('--m-rail-lines')).toBe('1');
  });

  it('FE-MOB-PANES-003: one name on two lines gives every entry room for two, so the rhythm holds', () => {
    measureLike(['Мои поездки']);
    railOf(['Мои поездки', 'Atlas', 'Vacay']);
    expect(list().style.getPropertyValue('--m-rail-lines')).toBe('2');
    // Each name reserves the lines the rail settled on, and wraps balanced, hyphenating only a word too long.
    const label = screen.getByText('Atlas');
    expect(label.className).toContain('min-h-[calc(1.2em*var(--m-rail-lines,1))]');
    expect(label.className).toContain('[text-wrap:balance]');
    expect(label.className).toContain('[hyphens:auto]');
  });
});

describe('collab panes', () => {
  const on = { chat: true, notes: true, links: true, polls: true };

  it('FE-MOB-PANES-004: the boards beside the chat follow the trip switches, in header order', () => {
    expect(collabBoards(on)).toEqual(['notes', 'links', 'polls']);
    expect(collabBoards({ ...on, notes: false, links: false })).toEqual(['polls']);
    expect(collabSideBySide(true, on)).toBe(true);
    expect(collabSideBySide(false, on)).toBe(false);
    expect(collabSideBySide(true, { ...on, chat: false })).toBe(false);
    expect(collabSideBySide(true, { chat: true, notes: false, links: false, polls: false })).toBe(false);
  });

  it('FE-MOB-PANES-005: a tab still set to the chat shows the first board beside it', () => {
    expect(collabBoardFor('chat', on)).toBe('notes');
    expect(collabBoardFor('polls', on)).toBe('polls');
    expect(collabBoardFor('notes', { ...on, notes: false })).toBe('links');
  });

  it('FE-MOB-PANES-006: the header switches the board alone and names the chat over its pane', () => {
    const onPick = vi.fn();
    const { rerender } = render(<CollabSegment active="chat" onPick={onPick} features={on} split={false} t={echo} />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'collab.tabs.chat',
      'collab.tabs.notes',
      'collab.tabs.links',
      'collab.tabs.polls',
    ]);

    rerender(<CollabSegment active="chat" onPick={onPick} features={on} split t={echo} />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'collab.tabs.notes',
      'collab.tabs.links',
      'collab.tabs.polls',
    ]);
    expect(screen.getByRole('button', { name: 'collab.tabs.notes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('collab.tabs.chat').tagName).toBe('SPAN');
    fireEvent.click(screen.getByRole('button', { name: 'collab.tabs.polls' }));
    expect(onPick).toHaveBeenCalledWith('polls');
  });
});

describe('section lists beside the page', () => {
  const sections = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  it('FE-MOB-PANES-007: names the screen, leads back and marks the section on show', () => {
    const onBack = vi.fn();
    const onPick = vi.fn();
    render(
      <MSectionNav
        title="Administration"
        backLabel="Back"
        onBack={onBack}
        sections={sections}
        activeId="settings"
        onPick={onPick}
        action={<button type="button">New user</button>}
      />
    );
    const nav = screen.getByRole('navigation', { name: 'Administration' });
    expect(within(nav).getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Users' })).not.toHaveAttribute('aria-current');
    fireEvent.click(within(nav).getByRole('button', { name: 'Back' }));
    fireEvent.click(within(nav).getByRole('button', { name: 'Users' }));
    expect(onBack).toHaveBeenCalled();
    expect(onPick).toHaveBeenCalledWith('users');
    expect(within(nav).getByRole('button', { name: 'New user' })).toBeInTheDocument();
  });

  it("FE-MOB-PANES-008: the collections' lists, with their counts, the one on show and a new one", () => {
    const onSelect = vi.fn();
    const onNewList = vi.fn();
    render(
      <MCollListNav
        lists={[
          { id: 1, name: 'Coffee in Kyoto', color: '#a16207', place_count: 4 },
          { id: 2, name: 'Tokyo next time', color: '#2563eb', place_count: 5 },
        ]}
        allSaved={false}
        activeId={2}
        onSelect={onSelect}
        onNewList={onNewList}
        t={echo}
      />
    );
    const tokyo = screen.getByRole('button', { name: /Tokyo next time/ });
    expect(tokyo).toHaveAttribute('aria-current', 'page');
    expect(tokyo).toHaveTextContent('5');
    fireEvent.click(screen.getByRole('button', { name: /collections.allSaved/ }));
    fireEvent.click(screen.getByRole('button', { name: /Coffee in Kyoto/ }));
    fireEvent.click(screen.getByRole('button', { name: /collections.newList/ }));
    expect(onSelect).toHaveBeenNthCalledWith(1, ALL_SAVED);
    expect(onSelect).toHaveBeenNthCalledWith(2, 1);
    expect(onNewList).toHaveBeenCalled();
  });
});

describe('list tabs on a wide window', () => {
  it('FE-MOB-PANES-009: cards flow down as many columns of a phone width as the page holds, starting level', () => {
    const { container } = render(
      <CardGrid>
        <div>a</div>
      </CardGrid>
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('wide:columns-[340px]');
    // No card splits across two columns, and none keeps a top margin that
    // would start its column lower than the next.
    expect(grid.className).toContain('wide:[&>*]:break-inside-avoid');
    expect(grid.className).toContain('wide:[&>*]:mt-0');
    expect(grid.className).not.toContain('wide:grid');
  });

  it('FE-MOB-PANES-010: the summary stacks above the list, and stands beside it with room for two panes', () => {
    const { rerender } = render(
      <TabPanes aside={<p>summary</p>} asideLabel="Budget">
        <p>list</p>
      </TabPanes>
    );
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    // Stacked: one scroll body holds both, the summary first.
    const scroller = screen.getByText('summary').closest('.overflow-y-auto');
    expect(scroller).not.toBeNull();
    expect(scroller).toBe(screen.getByText('list').closest('.overflow-y-auto'));

    setSizeClass('split');
    rerender(
      <TabPanes aside={<p>summary</p>} asideLabel="Budget">
        <p>list</p>
      </TabPanes>
    );
    const aside = screen.getByRole('complementary', { name: 'Budget' });
    expect(aside).toHaveClass('m-pane-aside');
    expect(within(aside).getByText('summary')).toBeInTheDocument();
    expect(within(aside).queryByText('list')).not.toBeInTheDocument();
  });

  it('FE-MOB-PANES-016: turning between stacked and two panes keeps what is typed in either pane', async () => {
    const user = userEvent.setup();
    const panes = () => (
      <TabPanes aside={<input aria-label="budget note" />} asideLabel="Budget">
        <input aria-label="search" />
      </TabPanes>
    );
    const { rerender } = render(panes());
    await user.type(screen.getByLabelText('search'), 'ramen');
    await user.type(screen.getByLabelText('budget note'), 'cap');

    setSizeClass('split');
    rerender(panes());
    expect(screen.getByLabelText('search')).toHaveValue('ramen');
    expect(screen.getByLabelText('budget note')).toHaveValue('cap');

    setSizeClass('wide');
    rerender(panes());
    expect(screen.getByLabelText('search')).toHaveValue('ramen');
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('FE-MOB-PANES-011: the to-do filters as tiles and lists, each one a filter to pick', () => {
    const onPick = vi.fn();
    render(
      <MTodoSidebar
        active={{ kind: 'smart', id: 'all' }}
        onPick={onPick}
        counts={{ total: 6, open: 4, done: 2, overdue: 1, my: 3 }}
        categories={['Tickets', 'Money']}
        catCount={(name) => (name === 'Tickets' ? 2 : 1)}
        smartLabel={(id) => `filter.${id}`}
        listsLabel="Lists"
      />
    );
    const all = screen.getByRole('button', { name: /filter\.all/ });
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(all).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /filter\.overdue/ })).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: /filter\.done/ }));
    fireEvent.click(screen.getByRole('button', { name: /Tickets/ }));
    expect(onPick).toHaveBeenNthCalledWith(1, { kind: 'smart', id: 'done' });
    expect(onPick).toHaveBeenNthCalledWith(2, { kind: 'category', name: 'Tickets' });
  });
});

describe('the journey as a feed beside its map', () => {
  function entry(id: number, date: string, overrides: Partial<JourneyEntry> = {}): JourneyEntry {
    return {
      id,
      journey_id: 1,
      type: 'entry',
      entry_date: date,
      title: `Entry ${id}`,
      photos: [],
      ...overrides,
    } as JourneyEntry;
  }
  const days = [
    { date: '2026-11-05', color: '#6366f1' },
    { date: '2026-11-06', color: '#f97316' },
  ];

  it('FE-MOB-PANES-012: the start of a story reads as plain text', () => {
    expect(storyExcerpt('# Day one\n\nThe **bamboo** grove, see [the map](https://x.y).\n![img](a.jpg)')).toBe(
      'Day one The bamboo grove, see the map.'
    );
    expect(storyExcerpt(null)).toBe('');
  });

  it('FE-MOB-PANES-013: entries under their day, the active one marked, a tap handed back with its place', () => {
    const onCardTap = vi.fn();
    const cardRefs = { current: new Map<number, HTMLDivElement>() };
    const entries = [
      entry(1, '2026-11-05', { story: 'Landed **late**', mood: 'amazing' }),
      entry(2, '2026-11-05'),
      entry(3, '2026-11-06', { type: 'skeleton' }),
    ];
    render(
      <MJourneyFeed
        entries={entries}
        days={days}
        activeIndex={1}
        cardRefs={cardRefs}
        onCardTap={onCardTap}
        showMood
        showWeather
        t={echo}
        locale="en-US"
      />
    );
    expect(screen.getAllByText(/journey\.detail\.day:/).map((n) => n.textContent)).toEqual([
      'journey.detail.day:1',
      'journey.detail.day:2',
    ]);
    expect(screen.getByText('Landed late')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entry 2/ })).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Entry 3/ }));
    expect(onCardTap).toHaveBeenCalledWith(entries[2], 2);
    expect(cardRefs.current.size).toBe(3);
  });
});

describe('files as tiles and a preview', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // The setup's observer never reports; a tile asks for its picture once it is near the screen.
  class InView {
    constructor(private readonly report: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.report(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    }
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  }

  const photo = {
    id: 6,
    trip_id: 1,
    original_name: 'Fushimi Inari gates.jpg',
    mime_type: 'image/jpeg',
    file_size: 402200,
    created_at: '2026-11-07T10:00:00Z',
    url: '/api/trips/1/files/6/download',
  } as unknown as TripFile;
  const pass = {
    id: 1,
    trip_id: 1,
    original_name: 'Boarding pass LH 740.pdf',
    mime_type: 'application/pdf',
    file_size: 46100,
    created_at: '2026-11-07T10:00:00Z',
    url: '/api/trips/1/files/1/download',
    reservation_id: 6,
    uploaded_by_name: 'Alex',
  } as unknown as TripFile;

  it('FE-MOB-PANES-014: a tile shows its picture, and picks, stars and opens its menu', async () => {
    vi.stubGlobal('IntersectionObserver', InView);
    const preview = vi.spyOn(fileRepo, 'previewUrl').mockResolvedValue('/signed/6');
    const onPick = vi.fn();
    const onStar = vi.fn();
    const onMenu = vi.fn();
    const { container } = render(
      <FileTile file={photo} selected canStar onPick={onPick} onStar={onStar} onMenu={onMenu} t={echo} />
    );
    await waitFor(() => expect(container.querySelector('img')).toHaveAttribute('src', '/signed/6'));
    expect(preview).toHaveBeenCalledWith('/api/trips/1/files/6/download');
    fireEvent.click(screen.getByRole('button', { name: /Fushimi Inari gates\.jpg/ }));
    fireEvent.click(screen.getByRole('button', { name: 'files.star' }));
    fireEvent.click(screen.getByRole('button', { name: 'files.menu' }));
    expect(onPick).toHaveBeenCalled();
    expect(onStar).toHaveBeenCalled();
    expect(onMenu).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Fushimi Inari gates\.jpg/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-MOB-PANES-015: the preview names the file, what it belongs to, and what to do with it', () => {
    vi.spyOn(fileRepo, 'previewUrl').mockResolvedValue('/signed/1');
    const reservations = [{ id: 6, title: 'LH 740', type: 'flight' }] as unknown as Reservation[];
    const planner = buildPlanner({ reservations, TRANSPORT_TYPES: new Set(['flight']) } as never);
    const onOpen = vi.fn();
    const onStar = vi.fn();
    const onLinks = vi.fn();
    const onMenu = vi.fn();
    render(
      <FilePreviewPane
        file={pass}
        planner={planner}
        onOpen={onOpen}
        onStar={onStar}
        onLinks={onLinks}
        onMenu={onMenu}
      />
    );
    expect(screen.getByRole('heading', { name: 'Boarding pass LH 740.pdf' })).toBeInTheDocument();
    expect(screen.getByText('files.sourceTransport')).toBeInTheDocument();
    expect(screen.getByText('LH 740')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /common\.open/ }));
    fireEvent.click(screen.getByRole('button', { name: /files\.star/ }));
    fireEvent.click(screen.getByRole('button', { name: /files\.link/ }));
    fireEvent.click(screen.getByRole('button', { name: 'files.menu' }));
    expect(onOpen).toHaveBeenCalled();
    expect(onStar).toHaveBeenCalled();
    expect(onLinks).toHaveBeenCalled();
    expect(onMenu).toHaveBeenCalled();
  });

  it('FE-MOB-PANES-017: without the right to edit files the preview only opens', () => {
    vi.spyOn(fileRepo, 'previewUrl').mockResolvedValue('/signed/1');
    const planner = buildPlanner({ can: vi.fn(() => false) } as never);
    render(
      <FilePreviewPane
        file={pass}
        planner={planner}
        onOpen={vi.fn()}
        onStar={vi.fn()}
        onLinks={vi.fn()}
        onMenu={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /common\.open/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /files\.star/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /files\.link/ })).not.toBeInTheDocument();
  });
});
