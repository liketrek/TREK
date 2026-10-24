import { PaddleRegionRequestsReason } from '../../../src/db/entities/PaddleRegionRequests.entity';
import { ToursBoatType, ToursPaddleLakeStyle, ToursWaterContext } from '../../../src/db/entities/Tours.entity';
import {
  paddleBoatTypeSchema,
  paddleLakeStyleSchema,
  paddleRegionWaitReasonSchema,
  paddleWaterContextSchema,
} from '@trek/shared';

import { describe, expect, it } from 'vitest';

/**
 * The boat, water and lake style columns hold a CHECK list (migrations 043900
 * and 044600) that the
 * entity carries as its enum, and the contract holds its own list. A value
 * one side knows and the other refuses would be a tour the planner can save
 * and the database cannot store, or the other way round. A region request's
 * reason (044700) is held the same way against the planner's answer.
 */
describe('paddle columns match the contract', () => {
  it('knows the same boats as the paddle contract', () => {
    expect(Object.values(ToursBoatType).sort()).toEqual([...paddleBoatTypeSchema.options].sort());
  });

  it('knows the same waters as the paddle contract', () => {
    expect(Object.values(ToursWaterContext).sort()).toEqual([...paddleWaterContextSchema.options].sort());
  });

  it('knows the same lake styles as the paddle contract (PAD-11)', () => {
    expect(Object.values(ToursPaddleLakeStyle).sort()).toEqual([...paddleLakeStyleSchema.options].sort());
  });

  it('knows the same reasons a region request waits for as the region contract (PAD-11C)', () => {
    expect(Object.values(PaddleRegionRequestsReason).sort()).toEqual([...paddleRegionWaitReasonSchema.options].sort());
  });
});
