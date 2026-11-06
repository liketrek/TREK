import type { App, McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { MCP_APP_URL_META_KEY } from '@trek/shared/mcp-apps';
import { useEffect, useMemo, useState } from 'react';
import { isRtl, trekLanguage, translator, type Translate } from './i18n';

/** What a widget renders from: the last tool result the host handed over. */
export interface ToolResultState {
  structuredContent: unknown;
  /** The TREK address the tool result carried for links back into the app, or null. */
  appUrl: string | null;
}

export interface TrekAppState {
  app: App | null;
  result: ToolResultState | null;
  /** The arguments the tool was called with, once the host sent them. */
  input: Record<string, unknown> | null;
  error: Error | null;
  locale: string;
  t: Translate;
}

type ToolResult = Parameters<NonNullable<App['ontoolresult']>>[0];

/** The parts of a tool result a widget reads, with the app link checked to be a web address. */
export function readToolResult(result: ToolResult): ToolResultState {
  const link = result._meta?.[MCP_APP_URL_META_KEY];
  const appUrl = typeof link === 'string' && /^https?:\/\//.test(link) ? link.replace(/\/+$/, '') : null;
  return { structuredContent: result.structuredContent ?? null, appUrl };
}

/** The display modes every TREK view can be drawn in; a host that offers fullscreen may expand one. */
export const DISPLAY_MODES = ['inline', 'fullscreen'] as const;

type SafeArea = NonNullable<McpUiHostContext['safeAreaInsets']>;

/** Pads the page by the host's safe area (a phone's notch and home bar), or clears the padding. */
export function applySafeArea(insets: SafeArea | undefined, root: HTMLElement = document.documentElement): void {
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const value = insets?.[side];
    if (typeof value === 'number' && value > 0) root.style.setProperty(`--trek-safe-${side}`, `${value}px`);
    else root.style.removeProperty(`--trek-safe-${side}`);
  }
}

/**
 * Connects the widget to its host and keeps the latest tool result and the
 * host's locale. The handlers are set in `onAppCreated`, before the handshake,
 * so the result the host sends right after it is not missed.
 */
export function useTrekApp(name: string): TrekAppState {
  const [result, setResult] = useState<ToolResultState | null>(null);
  const [input, setInput] = useState<Record<string, unknown> | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>(undefined);
  const { app, error } = useApp({
    appInfo: { name: `trek-${name}`, version: '1.0.0' },
    capabilities: { availableDisplayModes: [...DISPLAY_MODES] },
    onAppCreated: (created) => {
      created.ontoolinput = (params) => setInput(params.arguments ?? null);
      created.ontoolresult = (params) => setResult(readToolResult(params));
      created.onhostcontextchanged = (params) => setHostContext((previous) => ({ ...previous, ...params }));
    },
  });
  useHostStyles(app, app?.getHostContext());
  const context = { ...app?.getHostContext(), ...hostContext };
  const locale = context.locale ?? navigator.language;
  const insets = context.safeAreaInsets;
  useEffect(() => applySafeArea(insets), [insets]);
  const language = trekLanguage(locale);
  const t = useMemo(() => translator(language), [language]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(language) ? 'rtl' : 'ltr';
  }, [locale, language]);
  return { app, result, input, error, locale, t };
}
