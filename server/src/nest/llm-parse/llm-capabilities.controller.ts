import { Controller, Get, UseGuards } from '@nestjs/common';
import type { LlmCapabilitiesResponse } from '@trek/shared';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { LlmParseService } from './llm-parse.service';

/**
 * What the caller's AI model can be handed. Per user, unlike the public
 * /api/health/features: whose model applies depends on who is asking. The
 * photo pickers read it to decide whether a photo is offered at all.
 */
@Controller('api/llm')
@UseGuards(JwtAuthGuard)
export class LlmCapabilitiesController {
  constructor(private readonly llmParse: LlmParseService) {}

  @Get('capabilities')
  async capabilities(@CurrentUser() user: User): Promise<LlmCapabilitiesResponse> {
    return { images: await this.llmParse.readsImages(user.id) };
  }
}
