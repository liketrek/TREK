import type { AiClaudeConnectorResponse } from '@trek/shared';
import { useEffect, useRef, useState } from 'react';
import { aiConnectionsRepo } from '../../../repo/aiConnectionsRepo';
import { copyText } from '../../../utils/clipboard';
import { isPublicHttpsUrl, svgDataUrl } from './aiConnectModel';

/**
 * Adding TREK to Claude as a connector (no AI connection of TREK's own
 * involved): the MCP address, the claude.ai link that adds it, and a QR code
 * for doing it from a phone. Claude reaches TREK from the internet, so on a
 * LAN or plain-http install the card explains that instead of offering a link
 * that would fail after the user did everything right.
 */
export function useClaudeConnector() {
  const [connector, setConnector] = useState<AiClaudeConnectorResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    aiConnectionsRepo.claudeConnector().then(
      (next) => {
        if (!cancelled) setConnector(next);
      },
      () => {
        // Without an answer the card keeps to its description; nothing to link to.
        if (!cancelled) setConnector(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const copyUrl = async () => {
    if (!connector || !(await copyText(connector.mcpUrl))) return;
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return {
    connector,
    reachable: connector ? isPublicHttpsUrl(connector.mcpUrl) : false,
    qrSrc: connector ? svgDataUrl(connector.qrSvg) : '',
    copied,
    copyUrl,
  };
}
