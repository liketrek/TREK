import { describe, it, expect, vi, beforeEach } from 'vitest';

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn() }));
vi.mock('../../../../src/services/adminService', () => ({ isAddonEnabled }));

const { hasInstanceLlmConfig } = vi.hoisted(() => ({ hasInstanceLlmConfig: vi.fn() }));
vi.mock('../../../../src/nest/llm-parse/llm-config.resolver', () => ({ hasInstanceLlmConfig }));

import { FeaturesController } from '../../../../src/nest/booking-import/features.controller';
import type { KitineraryExtractorService } from '../../../../src/nest/booking-import/kitinerary-extractor.service';

function make(extractorAvailable = true) {
  const extractor = { isAvailable: vi.fn(() => extractorAvailable) } as unknown as KitineraryExtractorService;
  return new FeaturesController(extractor);
}

beforeEach(() => vi.clearAllMocks());

describe('FeaturesController.features', () => {
  it('reports addon-enabled and managed flags independently', () => {
    isAddonEnabled.mockReturnValue(true);
    hasInstanceLlmConfig.mockReturnValue(true);
    expect(make().features()).toEqual({
      bookingImport: true,
      aiParsing: true,
      aiParsingManaged: true,
    });
  });

  it('aiParsingManaged is false when the admin has no usable instance config', () => {
    isAddonEnabled.mockReturnValue(true);
    hasInstanceLlmConfig.mockReturnValue(false);
    expect(make().features()).toMatchObject({ aiParsing: true, aiParsingManaged: false });
  });

  it('reflects the addon being disabled', () => {
    isAddonEnabled.mockReturnValue(false);
    hasInstanceLlmConfig.mockReturnValue(false);
    expect(make(false).features()).toEqual({
      bookingImport: false,
      aiParsing: false,
      aiParsingManaged: false,
    });
  });
});
