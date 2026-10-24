import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ManagedForbidden } from '../common/managed';
import { ResponseContract } from '../common/response-contract';
import { aiRefusal } from './ai-connections.constants';
import {
  AiApiKeyConnectDto,
  AiChatgptFinishDto,
  AiModelUpdateDto,
  AiOpenrouterFinishDto,
  AiOpenrouterStartDto,
  AiPrivacyAckDto,
} from './ai-connections.dto';
import { AiConnectionsService } from './ai-connections.service';
import { ChatgptAuthService } from './chatgpt-auth.service';
import { OpenrouterAuthService } from './openrouter-auth.service';
import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Put, UseGuards } from '@nestjs/common';
import {
  aiAuthStartResponseSchema,
  aiConnectionViewSchema,
  aiModelListResponseSchema,
  aiStatusResponseSchema,
  successResponseSchema,
} from '@trek/shared';

/**
 * `/api/ai`: whether the assistant can run for the caller, and the caller's
 * own connection (a pasted key, a ChatGPT sign-in, OpenRouter's OAuth). Every
 * write touches only the caller's own row; whether a user may connect one at
 * all (the policy, the demo account) is the service's to decide.
 */
@Controller('api/ai')
@UseGuards(AddonGuard, JwtAuthGuard)
// The connection serves AI parsing too, so either addon opens these routes.
@RequireAddon([ADDON_IDS.AI_ASSISTANT, ADDON_IDS.LLM_PARSING], 'AI assistant')
@ManagedForbidden('the operator decides which model a managed install talks to, and pays for it')
export class AiConnectionsController {
  constructor(
    private readonly connections: AiConnectionsService,
    private readonly chatgpt: ChatgptAuthService,
    private readonly openrouter: OpenrouterAuthService,
  ) {}

  @Get('status')
  @ResponseContract(aiStatusResponseSchema)
  status(@CurrentUser() user: User) {
    return this.connections.status(user.id);
  }

  @Get('models')
  @ResponseContract(aiModelListResponseSchema)
  async models(@CurrentUser() user: User) {
    return { models: await this.connections.listOwnModels(user.id) };
  }

  @Put('connection')
  @ResponseContract(aiConnectionViewSchema)
  connect(@CurrentUser() user: User, @Body() body: AiApiKeyConnectDto) {
    return this.connections.saveOwnKey(user.id, body);
  }

  @Patch('connection/model')
  @ResponseContract(aiConnectionViewSchema)
  setModel(@CurrentUser() user: User, @Body() body: AiModelUpdateDto) {
    return this.connections.setOwnModel(user.id, body.model);
  }

  @Delete('connection')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async disconnect(@CurrentUser() user: User) {
    await this.connections.removeOwn(user.id);
    return { success: true as const };
  }

  @Post('privacy-ack')
  @HttpCode(200)
  @ResponseContract(successResponseSchema)
  async ackPrivacy(@CurrentUser() user: User, @Body() body: AiPrivacyAckDto) {
    await this.connections.ackPrivacy(user.id, body);
    return { success: true as const };
  }

  @Post('connect/chatgpt/start')
  @HttpCode(200)
  @ResponseContract(aiAuthStartResponseSchema)
  startChatgpt(@CurrentUser() user: User) {
    return this.chatgpt.start(user.id);
  }

  @Post('connect/chatgpt/finish')
  @HttpCode(200)
  @ResponseContract(aiConnectionViewSchema)
  async finishChatgpt(@CurrentUser() user: User, @Body() body: AiChatgptFinishDto) {
    // A sign-in an admin started for everyone answers with the instance's connection.
    const scope = await this.chatgpt.finish(user, body.flowId, body.pastedUrl);
    return scope === 'instance' ? this.connections.instanceView() : this.connections.ownView(user.id);
  }

  @Post('connect/chatgpt/sign-out')
  @HttpCode(200)
  @ResponseContract(aiConnectionViewSchema)
  async signOutChatgpt(@CurrentUser() user: User) {
    await this.chatgpt.signOut(user.id);
    return this.connections.ownView(user.id);
  }

  @Post('connect/openrouter/start')
  @HttpCode(200)
  @ResponseContract(aiAuthStartResponseSchema)
  startOpenrouter(@CurrentUser() user: User, @Body() body: AiOpenrouterStartDto) {
    // The instance's connection is started from the admin routes only.
    if (body.scope !== 'user') throw aiRefusal('forbidden', 'Admin access required');
    return this.openrouter.start(user.id, 'user');
  }

  @Post('connect/openrouter/finish')
  @HttpCode(200)
  @ResponseContract(aiConnectionViewSchema)
  finishOpenrouter(@CurrentUser() user: User, @Body() body: AiOpenrouterFinishDto) {
    return this.openrouter.finish(user, body.flowId, body.code);
  }
}
