import { describe, it, expect, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { LlmCapabilitiesController } from '../../../../src/nest/llm-parse/llm-capabilities.controller';
import { JwtAuthGuard } from '../../../../src/nest/auth/jwt-auth.guard';
import type { LlmParseService } from '../../../../src/nest/llm-parse/llm-parse.service';
import type { User } from '../../../../src/types';

describe('LlmCapabilitiesController', () => {
  it("answers whether the caller's model reads images", async () => {
    const readsImages = vi.fn(async (id: number) => id === 1);
    const c = new LlmCapabilitiesController({ readsImages } as unknown as LlmParseService);
    await expect(c.capabilities({ id: 1 } as User)).resolves.toEqual({ images: true });
    await expect(c.capabilities({ id: 2 } as User)).resolves.toEqual({ images: false });
    expect(readsImages).toHaveBeenCalledWith(2);
  });

  it('needs a session', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, LlmCapabilitiesController)).toContain(JwtAuthGuard);
  });
});
