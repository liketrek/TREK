import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LlmParseService } from './llm-parse.service';
import type { User } from '../../types';

/**
 * What the caller's own AI configuration can do.
 *
 * /api/health/features answers for the instance and is public, so it cannot see
 * whose model is configured or what it reads. This can: it is the difference
 * between offering to photograph a receipt and offering a five-minute wait that
 * ends in a provider refusal.
 */
@Controller('api/llm')
@UseGuards(JwtAuthGuard)
export class LlmCapabilitiesController {
  constructor(private readonly llmParse: LlmParseService) {}

  @Get('capabilities')
  async capabilities(@CurrentUser() user: User) {
    return {
      /** A provider and model are set — for this user or by the operator. */
      configured: this.llmParse.isAvailable(user.id),
      /** That model can be handed a photograph. */
      photos: await this.llmParse.readsPhotos(user.id),
    };
  }
}
