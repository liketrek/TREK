import { Public } from '../auth/public.decorator';
import { McpTransportService } from './mcp-transport.service';
import { Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';

import type { Request, Response } from 'express';

/**
 * Pure passthrough: every response (SDK JSON-RPC frames, auth challenges,
 * bespoke error bodies) is written by the service through @Res(), never
 * thrown, so the global filters never re-envelope an MCP response. No @Body()
 * — /mcp bodies are raw by design (see bootstrap's parser wrappers) and the
 * SDK transport reads the stream itself. @Public keeps GlobalAuthGuard from
 * ever touching the request; bearer verification happens in the service, and
 * the IdempotencyInterceptor no-ops without a resolved req.user.
 */
@Public('the MCP transport endpoint — bearer tokens (OAuth 2.1 / static / JWT) are verified in the handler')
@Controller('mcp')
export class McpTransportController {
  constructor(private readonly transport: McpTransportService) {}

  @Post()
  post(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.transport.handle(req, res);
  }

  @Get()
  get(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.transport.handle(req, res);
  }

  @Delete()
  delete(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.transport.handle(req, res);
  }
}
