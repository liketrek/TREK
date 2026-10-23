import { OauthService } from './oauth.service';
import { Injectable } from '@nestjs/common';
import type { AiClaudeConnectorResponse } from '@trek/shared';

import QRCode from 'qrcode';

/** claude.ai's "add custom connector" dialog, prefilled through its query string. */
const CLAUDE_ADD_CONNECTOR_URL = 'https://claude.ai/customize/connectors';

/**
 * "Connect with Claude": the link that opens claude.ai's custom-connector
 * dialog with this instance's MCP endpoint filled in, and the same link as a QR
 * code for the phone. claude.ai then runs the ordinary OAuth flow against
 * /oauth/authorize; nothing here touches the user's data or calls Anthropic.
 */
@Injectable()
export class ClaudeConnectorService {
  constructor(private readonly oauth: OauthService) {}

  async describe(): Promise<AiClaudeConnectorResponse> {
    const mcpUrl = `${this.oauth.mcpSafeUrl().replace(/(?<!\/)\/+$/, '')}/mcp`;
    const params = new URLSearchParams({
      modal: 'add-custom-connector',
      connectorName: 'TREK',
      connectorUrl: mcpUrl,
    });
    const deepLink = `${CLAUDE_ADD_CONNECTOR_URL}?${params.toString()}`;
    const qrSvg = await QRCode.toString(deepLink, { type: 'svg', margin: 1 });
    return { mcpUrl, deepLink, qrSvg };
  }
}
