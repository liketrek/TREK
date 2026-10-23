/**
 * FE-AI-CARDPART-001 to FE-AI-CARDPART-010
 *
 * The pieces every card is built from: its tile, frame and head, its facts
 * and change marks, its rows and the way to the rest, its "Open" and day
 * buttons, the people on it, and the boundary that leaves a broken card out.
 */
import type { CardPerson } from '@trek/shared';
import { CalendarDays, Route } from 'lucide-react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildUser } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAuthStore } from '../../../../store/authStore';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import CardBoundary from './CardBoundary';
import { CardFacts, ChangeMark, Fact, FactChange, NoLonger } from './CardFacts';
import CardFrame from './CardFrame';
import CardHeader from './CardHeader';
import { CardDayButton, CardOpenButton } from './CardOpen';
import { PeopleStack, PersonFace } from './CardPeople';
import { CardMore, CardRow, CardRows } from './CardRows';
import KindTile from './KindTile';

const AUTH = useAuthStore.getState();

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

afterEach(() => {
  useAuthStore.setState(AUTH, true);
  vi.restoreAllMocks();
});

describe('card parts', () => {
  it('FE-AI-CARDPART-001: the tile wears its tone, fades when dimmed and waits as a placeholder without an icon', () => {
    const { container, rerender } = render(<KindTile icon={Route} tone="success" size="xs" />);
    expect(container.firstElementChild).toHaveClass('bg-success-soft', 'ring-2');
    rerender(<KindTile icon={Route} tone="danger" dimmed />);
    expect(container.firstElementChild).toHaveClass('bg-surface-secondary', 'h-8');
    rerender(<KindTile icon={null} tone="info" size="sm" />);
    expect(container.firstElementChild).toHaveClass('trek-skeleton', 'h-7');
  });

  it('FE-AI-CARDPART-002: the frame names the card and says its state; the head titles, counts and acts', () => {
    render(
      <CardFrame label="Tours" state="pending" surface="secondary">
        <CardHeader
          icon={Route}
          tone="info"
          title="Three ways up"
          count={3}
          meta="Day 2"
          actions={<button type="button">act</button>}
        />
      </CardFrame>
    );
    const frame = screen.getByRole('region', { name: 'Tours' });
    expect(frame).toHaveClass('border-dashed', 'bg-surface-secondary');
    expect(screen.getByText('Three ways up')).toHaveAttribute('title', 'Three ways up');
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'act' })).toBeInTheDocument();
  });

  it('FE-AI-CARDPART-003: facts read old to new, change marks name what happens, and a list says who is gone', () => {
    render(
      <CardFacts>
        <Fact icon={CalendarDays} label="Day 3" />
        <FactChange icon={CalendarDays} tone="warning" before="09:00" after="10:30" />
        <ChangeMark change="new" />
        <ChangeMark change="willDelete" />
        <ChangeMark change="none" />
        <NoLonger names={['Ana', 'Ben']} />
        <NoLonger names={[]} />
      </CardFacts>
    );
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toHaveClass('line-through');
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Will be deleted')).toBeInTheDocument();
    expect(screen.getByText('No longer: Ana, Ben')).toBeInTheDocument();
  });

  it('FE-AI-CARDPART-004: a row that leads somewhere is a button and lights the map while the pointer rests on it', () => {
    const onActivate = vi.fn();
    const onHover = vi.fn();
    inView(
      <CardRows>
        <CardRow title="Col du Galibier" aside="12 km" lit onActivate={onActivate} onHover={onHover} />
        <CardRow title="Quiet row" />
      </CardRows>,
      { variant: 'fullscreen' }
    );
    const row = screen.getByRole('button', { name: /Col du Galibier/ });
    expect(row).toHaveClass('bg-surface-hover', 'min-h-11');
    fireEvent.mouseEnter(row);
    fireEvent.mouseLeave(row);
    expect(onHover.mock.calls).toEqual([[true], [false]]);
    fireEvent.click(row);
    expect(onActivate).toHaveBeenCalled();
    expect(screen.getByText('Quiet row').closest('button')).toBeNull();
  });

  it('FE-AI-CARDPART-005: "N more" opens where the rest lives, and is plain words where nothing can open it', () => {
    const onOpen = vi.fn();
    const target = { kind: 'tab', tab: 'finanzplan' } as const;
    const first = inView(<CardMore count={4} target={target} />, { onOpen });
    fireEvent.click(screen.getByRole('button', { name: '4 more' }));
    expect(onOpen).toHaveBeenCalledWith(target);
    first.unmount();

    const second = inView(<CardMore count={1} labelKey="assistant.place.more" target={target} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('1 more')).toBeInTheDocument();
    second.unmount();

    const { container } = inView(<CardMore count={0} target={target} />, { onOpen });
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-CARDPART-006: "Open" and a day go through the shell, taller on the phone, and stay out without a shell', () => {
    const onOpen = vi.fn();
    const first = inView(
      <>
        <CardOpenButton target={{ kind: 'page', path: '/atlas' }} />
        <CardDayButton dayId={8} label="Day 2" />
      </>,
      { onOpen, variant: 'fullscreen' }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/atlas' });
    expect(screen.getByRole('button', { name: 'Open' })).toHaveClass('h-10');
    fireEvent.click(screen.getByRole('button', { name: 'Day 2: Show this day in the plan' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'map', placeId: null, dayId: 8 });
    first.unmount();

    inView(
      <>
        <CardOpenButton target={{ kind: 'page', path: '/atlas' }} labelKey="assistant.change.viewOnMap" />
        <CardDayButton dayId={8} label="Day 2" />
      </>
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
  });

  it('FE-AI-CARDPART-007: the signed-in user reads as You, a picture comes from TREK only, the rest is counted', () => {
    useAuthStore.setState({ user: buildUser({ id: 1 }) });
    const people: CardPerson[] = [
      { id: 1, name: 'Ana', avatarKey: 'ana.png' },
      { id: 2, name: 'Ben', avatarKey: null },
      { id: 3, name: 'Cleo', avatarKey: null },
      { id: 4, name: 'Dan', avatarKey: null },
    ];
    const { container } = render(
      <>
        <PersonFace person={people[0] as CardPerson} size={24} />
        <PeopleStack people={people} max={2} />
      </>
    );
    expect(screen.getByRole('img', { name: 'You' })).toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/uploads/avatars/ana.png');
    expect(screen.getByRole('img', { name: 'You, Ben, Cleo, Dan' })).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('FE-AI-CARDPART-008: nobody on a card draws nothing', () => {
    const { container } = render(<PeopleStack people={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-CARDPART-009: a card that throws is left out and the rest stays', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken(): never {
      throw new Error('broken');
    }
    render(
      <div>
        <CardBoundary>
          <Broken />
        </CardBoundary>
        <span>still here</span>
      </div>
    );
    expect(screen.getByText('still here')).toBeInTheDocument();
  });

  it('FE-AI-CARDPART-010: a card that threw stays out until its reset key moves on, then is drawn again', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Flaky({ broken }: { broken: boolean }) {
      if (broken) throw new Error('broken');
      return <span>drawn</span>;
    }
    const { rerender } = render(
      <CardBoundary resetKeys={['pending']}>
        <Flaky broken />
      </CardBoundary>
    );
    expect(screen.queryByText('drawn')).not.toBeInTheDocument();
    rerender(
      <CardBoundary resetKeys={['pending']}>
        <Flaky broken={false} />
      </CardBoundary>
    );
    expect(screen.queryByText('drawn')).not.toBeInTheDocument();
    rerender(
      <CardBoundary resetKeys={['applying']}>
        <Flaky broken={false} />
      </CardBoundary>
    );
    expect(screen.getByText('drawn')).toBeInTheDocument();
  });
});
