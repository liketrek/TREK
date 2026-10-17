import { AdminGuard } from '../auth-core/admin.guard';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ManagedForbidden } from '../common/managed';
import { LlmConfigResolver } from './llm-config.resolver';
import { LlmLocalPullDto } from './llm-local.dto';
import { LlmLocalService } from './llm-local.service';
import { Controller, Get, Post, Query, Body, Res, UseGuards } from '@nestjs/common';

import type { Response } from 'express';

/**
 * Admin-only management of a local LLM server (Ollama): list installed models and
 * pull new ones (e.g. NuExtract). Used by the AI-parsing addon config UI.
 *
 * The form never holds the saved API key (it gets the mask), so the key is added
 * here from the saved config, and only when the request names the saved server.
 */
@Controller('api/admin/llm/local')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LlmLocalController {
  constructor(
    private readonly local: LlmLocalService,
    private readonly llmConfig: LlmConfigResolver,
  ) {}

  @ManagedForbidden('the model list belongs to the operator runtime, not to one instance')
  @Get('models')
  async models(@Query('baseUrl') baseUrl?: string) {
    return this.local.listModels(baseUrl, await this.savedKeyFor(baseUrl));
  }

  /**
   * Stream a model pull. Proxies Ollama's NDJSON progress lines
   * ({ status, total?, completed? }) straight to the client, which reads the
   * response body to render a progress bar. Uses @Res() to stream manually.
   */
  @ManagedForbidden('pulling a model spends the operator disk and GPU from inside a customer instance')
  @Post('pull')
  async pull(@Body() body: LlmLocalPullDto, @Res() res: Response): Promise<void> {
    const stream = await this.local.pull(body?.baseUrl, body?.model ?? '', await this.savedKeyFor(body?.baseUrl));
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

  /** The saved key, if `baseUrl` reaches the saved server; never for another address. */
  private async savedKeyFor(baseUrl: string | undefined): Promise<string | undefined> {
    // A base URL that is no URL is refused as before, without reading the saved config.
    this.local.ollamaRoot(baseUrl);
    const saved = await this.llmConfig.readLocalServerAccess();
    if (!saved?.apiKey || !this.local.sameServer(saved.baseUrl, baseUrl)) return undefined;
    return saved.apiKey;
  }
}
