import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import TourWorkspaceRail, { type TourWorkspaceRailParts } from './TourWorkspaceRail';
import type { GpxConversion } from './conversion/useGpxConversion';
import type { PaddleChecklist } from './paddle/usePaddleChecklist';
import type { TrackPaddlePlan } from './paddle/useTrackPaddlePlan';
import type { TourPlannerController } from './planner/useTourPlanner';
import type { SkiClassification } from './ski/useSkiClassification';
import type { RecordedTrack } from './useRecordedTrack';
import type { WandererBrowser } from './wanderer/useWandererBrowser';

const seen = vi.hoisted(() => ({ rail: [] as Array<Record<string, unknown>> }));
vi.mock('./planner/TourPlannerPanels', () => ({
  TourPlannerRail: (props: Record<string, unknown>) => {
    seen.rail.push(props);
    return <p>tour editor</p>;
  },
}));
vi.mock('./wanderer/WandererBrowserRail', () => ({ default: () => <p>wanderer trails</p> }));

const planner = {} as TourPlannerController;
const conversion = {} as GpxConversion;
const recordedTrack = {} as RecordedTrack;
const tourPlaceIds: ReadonlySet<number> = new Set([7, 9]);

function wanderer(overrides: Partial<WandererBrowser>): WandererBrowser {
  return { open: false, enabled: true, openBrowser: vi.fn(), ...overrides } as unknown as WandererBrowser;
}

function workspace(browser: WandererBrowser): TourWorkspaceRailParts {
  return { tourPlanner: planner, wandererBrowser: browser, tourConversion: conversion, recordedTrack, tourPlaceIds };
}

describe('TourWorkspaceRail', () => {
  it('RS-04: shows the wanderer trails in place of the editor while they are browsed', () => {
    render(<TourWorkspaceRail workspace={workspace(wanderer({ open: true }))} canEdit canAssign />);
    expect(screen.getByText('wanderer trails')).toBeInTheDocument();
    expect(screen.queryByText('tour editor')).not.toBeInTheDocument();
  });

  it('RS-04: offers the wanderer trails from the editor only while wanderer may be used', () => {
    const browser = wanderer({});
    seen.rail.length = 0;
    const view = render(<TourWorkspaceRail workspace={workspace(browser)} canEdit canAssign={false} />);
    expect(screen.getByText('tour editor')).toBeInTheDocument();
    expect(seen.rail[seen.rail.length - 1]).toMatchObject({
      planner,
      conversion,
      recordedTrack,
      canEdit: true,
      canAssign: false,
      onOpenWanderer: browser.openBrowser,
    });

    view.rerender(<TourWorkspaceRail workspace={workspace(wanderer({ enabled: false }))} canEdit canAssign />);
    expect(seen.rail[seen.rail.length - 1]?.onOpenWanderer).toBeUndefined();
  });

  it('PCW-001: hands the paddle plan and the checklist of the tour in view on to the editor rail', () => {
    const trackPaddlePlan = { pick: null } as unknown as TrackPaddlePlan;
    const paddleChecklist = { status: 'ready' } as unknown as PaddleChecklist;
    const parts = { ...workspace(wanderer({})), trackPaddlePlan, paddleChecklist };
    seen.rail.length = 0;
    render(<TourWorkspaceRail workspace={parts} canEdit canAssign />);
    expect(seen.rail[seen.rail.length - 1]?.trackPaddlePlan).toBe(trackPaddlePlan);
    expect(seen.rail[seen.rail.length - 1]?.paddleChecklist).toBe(paddleChecklist);
  });

  it('SKI-02: hands the classification of the ski track in view on to the editor rail', () => {
    const skiClassification = { tour: null } as unknown as SkiClassification;
    const parts = { ...workspace(wanderer({})), skiClassification };
    seen.rail.length = 0;
    render(<TourWorkspaceRail workspace={parts} canEdit canAssign />);
    expect(seen.rail[seen.rail.length - 1]?.skiClassification).toBe(skiClassification);
  });

  it("PR1-10: hands the trip's tours on, so Trip places never offers one as a stop", () => {
    seen.rail.length = 0;
    render(<TourWorkspaceRail workspace={workspace(wanderer({}))} canEdit canAssign />);
    expect(seen.rail[seen.rail.length - 1]?.tourPlaceIds).toBe(tourPlaceIds);
  });
});
