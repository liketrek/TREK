import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { AdminGuard } from '../auth-core/admin.guard';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ManagedForbidden } from '../common/managed';
import { ResponseContract } from '../common/response-contract';
import { AiAdminSettingsDto, AiInstanceConnectionDto } from './ai-connections.dto';
import { AiConnectionsService } from './ai-connections.service';
import { ChatgptAuthService } from './chatgpt-auth.service';
import { OpenrouterAuthService } from './openrouter-auth.service';
import { Body, Controller, Delete, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import {
  aiAdminConnectionResponseSchema,
  aiAdminSettingsSchema,
  aiAuthStartResponseSchema,
  aiModelListResponseSchema,
  successResponseSchema,
  type AiInstanceConnectionRequest,
} from '@trek/shared';

/**
 * `/api/admin/ai`: the assistant's instance settings (policy, daily limit,
 * retention) and the connection the instance provides for everyone, set up
 * once here instead of by every user.
 */
@Controller('api/admin/ai')
@UseGuards(AddonGuard, JwtAuthGuard, AdminGuard)
// The connection serves AI parsing too, so either addon opens these routes.
@RequireAddon([ADDON_IDS.AI_ASSISTANT, ADDON_IDS.LLM_PARSING], 'AI assistant')
@ManagedForbidden('the operator decides which model a managed install talks to, and pays for it')
export class AiAdminController {
  constructor(
    private readonly connections: AiConnectionsService,
    private readonly openrouter: OpenrouterAuthService,
    private readonly chatgpt: ChatgptAuthService,
  ) {}

  @Get('settings')
  @ResponseContract(aiAdminSettingsSchema)
  settings() {
    return this.connections.readSettings();
  }

  @Put('settings')
  @ResponseContract(aiAdminSettingsSchema)
  saveSettings(@CurrentUser() user: User, @Body() body: AiAdminSettingsDto) {
    return this.connections.writeSettings(user.id, body);
  }

  @Get('connection')
  @ResponseContract(aiAdminConnectionResponseSchema)
  connection() {
    return this.connections.instanceConnection();
  }

  @Put('connection')
  @ResponseContract(aiAdminConnectionResponseSchema)
  saveConnection(@CurrentUser() user: User, @Body() body: AiInstanceConnectionDto) {
    // The pipe validated the body against the full union; the DTO only types its shared fields.
    return this.connections.saveInstance(user.id, body as AiInstanceConnectionRequest);
  }

  @Delete('connection')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async removeConnection(@CurrentUser() user: User) {
    await this.connections.removeInstance(user.id);
    return { success: true as const };
  }

  @Get('models')
  @ResponseContract(aiModelListResponseSchema)
  async models(@CurrentUser() user: User) {
    return { models: await this.connections.listInstanceModels(user.id) };
  }

  @Post('connect/openrouter/start')
  @HttpCode(200)
  @ResponseContract(aiAuthStartResponseSchema)
  startOpenrouter(@CurrentUser() user: User) {
    return this.openrouter.start(user.id, 'instance');
  }

  /** The admin shares their own ChatGPT plan with everyone here; the sign-in finishes on the user route. */
  @Post('connect/chatgpt/start')
  @HttpCode(200)
  @ResponseContract(aiAuthStartResponseSchema)
  startChatgpt(@CurrentUser() user: User) {
    return this.chatgpt.start(user.id, 'instance');
  }

  @Post('connect/chatgpt/sign-out')
  @HttpCode(200)
  @ResponseContract(aiAdminConnectionResponseSchema)
  async signOutChatgpt(@CurrentUser() user: User) {
    await this.chatgpt.signOut(user.id, 'instance');
    return this.connections.instanceConnection();
  }
}
