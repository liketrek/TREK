import { Controller, Get, Post, Query, Body, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { LlmLocalService } from './llm-local.service';
import { LlmLocalPullDto } from './llm-local.dto';
import { ManagedForbidden } from '../common/managed';

/**
 * Admin-only management of a local LLM server (Ollama): list installed models and
 * pull new ones (e.g. NuExtract). Used by the AI-parsing addon config UI.
 */
@Controller('api/admin/llm/local')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LlmLocalController {
  constructor(private readonly local: LlmLocalService) {}

  @ManagedForbidden('the model list belongs to the operator runtime, not to one instance')
  @Get('models')
  models(@Query('baseUrl') baseUrl?: string) {
    return this.local.listModels(baseUrl);
  }

  /**
   * What the local server says a model can do — `vision`, `thinking`, `tools`.
   * Lets the addon screen fill the "reads images" switch from the truth instead
   * of guessing from the model id. `null` when the server cannot answer or is
   * too old to report it, and the screen falls back to the id heuristic.
   */
  @ManagedForbidden('the model list belongs to the operator runtime, not to one instance')
  @Get('capabilities')
  async capabilities(@Query('model') model?: string, @Query('baseUrl') baseUrl?: string) {
    return { capabilities: model ? await this.local.capabilities(baseUrl, model) : null };
  }

  /**
   * Stream a model pull. Proxies Ollama's NDJSON progress lines
   * ({ status, total?, completed? }) straight to the client, which reads the
   * response body to render a progress bar. Uses @Res() to stream manually.
   */
  @ManagedForbidden('pulling a model spends the operator disk and GPU from inside a customer instance')
  @Post('pull')
  async pull(@Body() body: LlmLocalPullDto, @Res() res: Response): Promise<void> {
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
