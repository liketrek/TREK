import { ToursBoatType, ToursPaddleLakeStyle, ToursWaterContext } from '../../../src/db/entities/Tours.entity';
import { paddleBoatTypeSchema, paddleLakeStyleSchema, paddleWaterContextSchema } from '@trek/shared';

import { describe, expect, it } from 'vitest';

/**
 * The boat, water and lake style columns hold a CHECK list (migrations 043900
 * and 044500) that the
 * entity carries as its enum, and the contract holds its own list. A value
 * one side knows and the other refuses would be a tour the planner can save
 * and the database cannot store, or the other way round.
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
});
