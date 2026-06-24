import { Controller, Get, Post, Query, Body, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { LlmLocalService } from './llm-local.service';

/**
 * Admin-only management of a local LLM server (Ollama): list installed models and
 * pull new ones (e.g. NuExtract). Used by the AI-parsing addon config UI.
 */
@Controller('api/admin/llm/local')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LlmLocalController {
  constructor(private readonly local: LlmLocalService) {}

  @Get('models')
  models(@Query('baseUrl') baseUrl?: string) {
    return this.local.listModels(baseUrl);
  }

  /**
   * Stream a model pull. Proxies Ollama's NDJSON progress lines
   * ({ status, total?, completed? }) straight to the client, which reads the
   * response body to render a progress bar. Uses @Res() to stream manually.
   */
  @Post('pull')
  async pull(@Body() body: { baseUrl?: string; model?: string }, @Res() res: Response): Promise<void> {
    const stream = await this.local.pull(body?.baseUrl, body?.model ?? '');
    res.status(200);
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    const reader = stream.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } catch {
      // Upstream dropped mid-pull — close the response; the client surfaces it.
    } finally {
      res.end();
    }
  }
}
