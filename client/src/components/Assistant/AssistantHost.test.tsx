/**
 * FE-AI-HOST-001 to FE-AI-HOST-007
 *
 * The desktop host follows the trip on screen and sends what the chat opens
 * (a spot on the map, a tab of the trip, another page) and a picked day to
 * the planner through its links.
 */
import { useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, render, screen } from '../../../tests/helpers/render';
import { useTripStore } from '../../store/tripStore';
import type { Trip } from '../../types';
import AssistantHost from './AssistantHost';
import type { EntityTarget } from './cards/cardTypes';

interface WindowProps {
  trip: { id: number; title: string } | null;
  onOpen?: (target: EntityTarget) => void;
  onFocusDay?: (dayId: number) => void;
}
const seen: { props: WindowProps | null } = { props: null };

vi.mock('./AssistantWindow', () => ({
  default: (props: WindowProps) => {
    seen.props = props;
    return null;
  },
}));

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

function renderAt(path: string) {
  return render(
    <>
      <AssistantHost />
      <Location />
    </>,
    { initialEntries: [path] }
  );
}

const INITIAL = useTripStore.getState();

afterEach(() => {
  useTripStore.setState(INITIAL, true);
  seen.props = null;
  sessionStorage.clear();
});

describe('AssistantHost', () => {
  it('FE-AI-HOST-001: outside a trip the window gets no trip and asks which one', () => {
    renderAt('/dashboard');
    expect(seen.props?.trip).toBeNull();
  });

  it('FE-AI-HOST-002: inside a trip it is about that trip, named once the planner has it', () => {
    renderAt('/trips/5/files');
    expect(seen.props?.trip).toEqual({ id: 5, title: '' });

    act(() => useTripStore.setState({ trip: { id: 5, title: 'Kyoto' } as Trip }));
    expect(seen.props?.trip).toEqual({ id: 5, title: 'Kyoto' });
  });

  it('FE-AI-HOST-003: "Show on map" opens the planner on the place, or on the day', () => {
    renderAt('/trips/5/files');
    act(() => seen.props?.onOpen?.({ kind: 'map', placeId: 7, dayId: null }));
    expect(screen.getByTestId('location')).toHaveTextContent('/trips/5?place=7');

    act(() => seen.props?.onOpen?.({ kind: 'map', placeId: null, dayId: 3 }));
    expect(screen.getByTestId('location')).toHaveTextContent('/trips/5?day=3');
  });

  it('FE-AI-HOST-006: a tab of the trip opens as ?tab= with its params, a list tab remembers its own list first', () => {
    renderAt('/trips/5');
    act(() => seen.props?.onOpen?.({ kind: 'tab', tab: 'finanzplan', params: { expense: '7' } }));
    expect(screen.getByTestId('location')).toHaveTextContent('/trips/5?tab=finanzplan&expense=7');

    act(() => seen.props?.onOpen?.({ kind: 'tab', tab: 'listen', sub: 'todo' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/trips/5?tab=listen');
    expect(sessionStorage.getItem('trip-lists-subtab-5')).toBe('todo');
  });

  it('FE-AI-HOST-007: another page is navigated to as it is', () => {
    renderAt('/trips/5');
    act(() => seen.props?.onOpen?.({ kind: 'page', path: '/atlas' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/atlas');
  });

  it('FE-AI-HOST-005: a day picked in the chat selects it in the planner', () => {
    renderAt('/trips/5');
    act(() => seen.props?.onFocusDay?.(12));
    expect(screen.getByTestId('location')).toHaveTextContent('/trips/5?day=12');
  });

  it('FE-AI-HOST-004: a route that only looks like a trip is none', () => {
    renderAt('/trips/new');
    expect(seen.props?.trip).toBeNull();
  });
});
