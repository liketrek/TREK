import { ADDON_IDS } from '../../../src/addons';
import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import { RESPONSE_CONTRACT_KEY } from '../../../src/nest/common/response-contract';
import { ClaudeConnectorController } from '../../../src/nest/oauth/claude-connector.controller';
import { ClaudeConnectorService } from '../../../src/nest/oauth/claude-connector.service';
import { OauthService } from '../../../src/nest/oauth/oauth.service';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { aiClaudeConnectorResponseSchema } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

async function service(mcpSafeUrl: string): Promise<ClaudeConnectorService> {
  const moduleRef = await Test.createTestingModule({
    providers: [ClaudeConnectorService, { provide: OauthService, useValue: { mcpSafeUrl: () => mcpSafeUrl } }],
  }).compile();
  return moduleRef.get(ClaudeConnectorService);
}

describe('ClaudeConnectorService', () => {
  it('CLAUDE-001: links claude.ai to the MCP endpoint of this instance and encodes it once', async () => {
    const res = await (await service('https://trek.example.test')).describe();
    expect(res.mcpUrl).toBe('https://trek.example.test/mcp');
    expect(res.deepLink).toBe(
      'https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=TREK' +
        '&connectorUrl=https%3A%2F%2Ftrek.example.test%2Fmcp',
    );
    expect(aiClaudeConnectorResponseSchema.parse(res)).toEqual(res);
  });

  it('CLAUDE-002: trailing slashes on the configured URL do not double the path', async () => {
    expect((await (await service('https://trek.example.test/sub///')).describe()).mcpUrl).toBe(
      'https://trek.example.test/sub/mcp',
    );
  });

  it('CLAUDE-003: the QR code comes as an SVG document', async () => {
    const { qrSvg } = await (await service('https://trek.example.test')).describe();
    expect(qrSvg.startsWith('<svg')).toBe(true);
    expect(qrSvg.trimEnd().endsWith('</svg>')).toBe(true);
  });
});

describe('ClaudeConnectorController', () => {
  it('CLAUDE-004: answers what the service describes', async () => {
    const answer = { mcpUrl: 'https://t.example/mcp', deepLink: 'https://claude.ai/x', qrSvg: '<svg/>' };
    const describeConnector = vi.fn().mockResolvedValue(answer);
    const controller = new ClaudeConnectorController({
      describe: describeConnector,
    } as unknown as ClaudeConnectorService);
    expect(await controller.get()).toBe(answer);
    expect(describeConnector).toHaveBeenCalledOnce();
  });

  it('CLAUDE-005: follows the MCP addon, checks it before the session, and declares its contract', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ClaudeConnectorController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, ClaudeConnectorController)).toEqual({
      addonId: ADDON_IDS.MCP,
      label: 'MCP',
    });
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, ClaudeConnectorController.prototype.get)).toBe(
      aiClaudeConnectorResponseSchema,
    );
  });
});
