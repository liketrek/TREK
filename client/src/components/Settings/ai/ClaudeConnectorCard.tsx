import { Check, Copy, ExternalLink, MessagesSquare } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../../i18n';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON, SettingsCard, SettingsHint } from '../settingsKit';
import { CLAUDE_CONNECTOR_ANCHOR } from './aiConnectModel';
import { useClaudeConnector } from './useClaudeConnector';

type ClaudeConnector = ReturnType<typeof useClaudeConnector>;

/** The way in: the button that adds TREK on claude.ai, the address to copy, and the QR code for a phone. */
function ConnectorLinks({
  connector,
  qrSrc,
  copied,
  copyUrl,
}: Omit<ClaudeConnector, 'connector' | 'reachable'> & { connector: NonNullable<ClaudeConnector['connector']> }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-3">
        <div className="flex">
          <a
            href={connector.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className={SETTINGS_BUTTON_PRIMARY}
            style={fs(13, 'body')}
          >
            <ExternalLink size={14} strokeWidth={2.2} /> {t('assistant.claude.open')}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <code
            dir="ltr"
            className="block min-w-0 flex-1 truncate rounded-[10px] border border-edge-faint bg-surface-tertiary px-3 py-2 font-mono text-content"
            style={fs(12, 'body')}
          >
            {connector.mcpUrl}
          </code>
          <Tooltip label={copied ? t('common.copied') : t('assistant.claude.copyUrl')}>
            <button
              type="button"
              onClick={() => void copyUrl()}
              aria-label={t('assistant.claude.copyUrl')}
              className={SETTINGS_ICON_BUTTON}
            >
              {copied ? (
                <Check size={15} strokeWidth={2.2} className="text-success" />
              ) : (
                <Copy size={15} strokeWidth={2} />
              )}
            </button>
          </Tooltip>
        </div>
      </div>
      <figure className="m-0 flex flex-none flex-col items-center gap-1.5 max-sm:hidden">
        <img
          src={qrSrc}
          alt={t('assistant.claude.qrAlt')}
          width={112}
          height={112}
          className="rounded-[10px] shadow-sm ring-1 ring-edge-faint"
        />
        <figcaption className="text-content-faint" style={fs(11)}>
          {t('assistant.claude.scan')}
        </figcaption>
      </figure>
    </div>
  );
}

/**
 * "Connect with Claude": TREK as a connector inside Claude, over the MCP
 * server and its OAuth. One button adds it on claude.ai; the QR code does the
 * same from a phone, so it only shows where a phone is not already in hand.
 */
export default function ClaudeConnectorCard(): React.ReactElement {
  const { t } = useTranslation();
  const { connector, reachable, ...links } = useClaudeConnector();

  // Null keeps the card to its band until the address is known.
  let body: React.ReactNode = null;
  if (connector && reachable) body = <ConnectorLinks connector={connector} {...links} />;
  else if (connector) body = <SettingsHint>{t('assistant.claude.notPublic')}</SettingsHint>;

  return (
    <SettingsCard
      id={CLAUDE_CONNECTOR_ANCHOR}
      icon={MessagesSquare}
      title={t('assistant.claude.title')}
      hint={t('assistant.claude.description')}
    >
      {body}
    </SettingsCard>
  );
}
