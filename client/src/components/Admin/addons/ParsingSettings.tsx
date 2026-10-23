import { asLlmVision, LLM_VISION_MODES, type LlmVision } from '@trek/shared';
import { Check, RefreshCw } from 'lucide-react';
import React, { useId } from 'react';
import { useTranslation } from '../../../i18n';
import { ProviderMark } from '../../Settings/ai/AiConnectPanel';
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SettingsHint, StatusPill } from '../../Settings/settingsKit';
import { DialogSection, fs } from '../../shared/DialogShell';
import { EditorField, INPUT, PANEL, Segmented } from '../../shared/dialogParts';
import { type Addon, ANTHROPIC_HINT, MASKED, RECOMMENDED_MODELS } from './addonModel';
import type { useAiAdminConfig } from './useAiAdminConfig';
import { useLlmParsingConfig } from './useLlmParsingConfig';

type AiAdmin = ReturnType<typeof useAiAdminConfig>;
type Parsing = ReturnType<typeof useLlmParsingConfig>;
type MarkKind = Parameters<typeof ProviderMark>[0]['kind'];

/** Parsing's own providers, with the mark the assistant shows for each. */
const OWN_PROVIDERS = [
  { value: 'local', labelKey: 'settings.aiParsing.providerLocal', mark: 'custom' },
  { value: 'openai', labelKey: 'settings.aiParsing.providerOpenai', mark: 'openai' },
  { value: 'anthropic', labelKey: 'settings.aiParsing.providerAnthropic', mark: 'anthropic' },
] as const;

const markOf = (provider: string): MarkKind => OWN_PROVIDERS.find((p) => p.value === provider)?.mark ?? 'custom';

/** The connection parsing reads with, as one line: a mark, who answers, the model and where it comes from. */
function ReadsWith({ mark, title, model, tag }: { mark: MarkKind; title: string; model: string; tag: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] border border-edge-faint bg-surface-card p-3">
      <ProviderMark kind={mark} />
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-medium text-content" style={fs(13, 'body')}>
          {title}
        </p>
        <p className="m-0 truncate font-geist text-content-faint" style={fs(11)}>
          {model}
        </p>
      </div>
      <StatusPill>{tag}</StatusPill>
    </div>
  );
}

/** Which connection parsing reads with now, and the way to the other one. */
function ParsingSource({ A, P, onOpenConnection }: { A: AiAdmin; P: Parsing; onOpenConnection: () => void }) {
  const { t } = useTranslation();
  const live = A.instancePays ? A.instance.live : null;
  if (P.ownConnection) {
    const own = OWN_PROVIDERS.find((p) => p.value === P.savedProvider);
    return (
      <div className="flex flex-col gap-2">
        <ReadsWith
          mark={markOf(P.savedProvider)}
          title={own ? t(own.labelKey) : P.savedProvider}
          model={P.savedModel}
          tag={t('admin.addons.ai.parsing.own')}
        />
        <SettingsHint>{t('admin.addons.ai.parsing.ownHint')}</SettingsHint>
        <button
          type="button"
          onClick={() => void P.switchToShared()}
          disabled={P.saving}
          className={`${SETTINGS_BUTTON} self-start`}
          style={fs(12.5, 'body')}
        >
          {t('admin.addons.ai.parsing.useShared')}
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {live ? (
        <ReadsWith
          mark={live.kind}
          title={A.instance.provider}
          model={live.model}
          tag={t('admin.addons.ai.parsing.sharedTag')}
        />
      ) : (
        <SettingsHint>
          {t(A.policy === 'user' ? 'admin.addons.ai.parsing.perUser' : 'admin.addons.ai.parsing.none')}
        </SettingsHint>
      )}
      <div className="flex flex-wrap gap-2" style={fs(12.5, 'body')}>
        {!live && A.policy !== 'user' && (
          <button type="button" onClick={onOpenConnection} className={SETTINGS_BUTTON_PRIMARY}>
            {t('admin.addons.ai.tab.connection')}
          </button>
        )}
        {!P.formOpen && (
          <button type="button" onClick={P.startOwn} className={SETTINGS_BUTTON}>
            {t('admin.addons.ai.parsing.setupOwn')}
          </button>
        )}
      </div>
    </div>
  );
}

/** The models on the local server to pick from, and the recommended ones to pull. */
function LocalModels({ P }: { P: Parsing }) {
  const { t } = useTranslation();
  return (
    <div className={PANEL}>
      <div className="flex items-center gap-2">
        <span
          className="min-w-0 flex-1 truncate font-geist font-bold uppercase tracking-[.08em] text-content-faint"
          style={fs(9.5)}
        >
          {t('admin.addons.ai.parsing.installed')}
        </span>
        <button
          type="button"
          onClick={() => void P.loadModels()}
          disabled={P.loadingModels}
          className="inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 font-medium text-content-muted hover:bg-surface-card hover:text-content disabled:cursor-default disabled:opacity-60"
          style={fs(11.5, 'body')}
        >
          <RefreshCw size={11} strokeWidth={2.2} className={P.loadingModels ? 'animate-spin' : undefined} />
          {t('admin.addons.ai.parsing.refresh')}
        </button>
      </div>
      {P.modelsErr && (
        <p className="m-0 break-words text-danger" style={fs(11.5)}>
          {P.modelsErr}
        </p>
      )}
      {!P.modelsErr && P.installed.length === 0 && !P.loadingModels && (
        <SettingsHint>{t('admin.addons.ai.parsing.noModels')}</SettingsHint>
      )}
      {P.installed.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {P.installed.map((name) => (
            <button
              type="button"
              key={name}
              title={name}
              onClick={() => P.setModel(name)}
              aria-pressed={P.model === name}
              className={`max-w-full truncate rounded-full px-2.5 py-[3px] font-geist font-medium transition-colors ${P.model === name ? 'bg-accent text-accent-text' : 'border border-edge bg-surface-card text-content-muted hover:text-content'}`}
              style={fs(11.5)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 border-t border-edge-faint pt-2.5">
        <span className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>
          {t('admin.addons.ai.parsing.pullTitle')}
        </span>
        {RECOMMENDED_MODELS.map((m) => {
          const here = P.isInstalled(m.id);
          const chosen = P.model === m.id;
          return (
            <div key={m.id} className="min-w-0" title={m.note}>
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(12.5, 'body')}>
                  {m.label}
                </span>
                {m.recommended && <StatusPill tone="success">{t('assistant.model.recommended')}</StatusPill>}
                {here ? (
                  <button
                    type="button"
                    onClick={() => P.setModel(m.id)}
                    disabled={chosen}
                    className={SETTINGS_BUTTON}
                    style={fs(12, 'body')}
                  >
                    {chosen ? <Check size={13} strokeWidth={2.4} /> : null}
                    {t(chosen ? 'admin.addons.ai.parsing.selected' : 'admin.addons.ai.parsing.use')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void P.pull(m.id)}
                    disabled={!!P.pulling}
                    className={SETTINGS_BUTTON_PRIMARY}
                    style={fs(12, 'body')}
                  >
                    {t(P.pulling === m.id ? 'admin.addons.ai.parsing.pulling' : 'admin.addons.ai.parsing.pull')}
                  </button>
                )}
              </div>
              {P.pulling === m.id && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-200"
                      style={{ width: `${P.pullPct}%` }}
                    />
                  </div>
                  <div className="mt-1 truncate font-geist tabular-nums text-content-faint" style={fs(11)}>
                    {P.pullStatus}
                    {P.pullPct ? ` ${P.pullPct}%` : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A connection of parsing's own: the provider as tiles, its address, key and model. */
function OwnConnectionForm({ P }: { P: Parsing }) {
  const { t } = useTranslation();
  const fieldId = useId();
  return (
    <div className={`flex flex-col gap-3 ${P.saving ? 'opacity-60' : ''}`}>
      <div
        role="radiogroup"
        aria-label={t('settings.aiParsing.provider')}
        className="grid grid-cols-3 gap-2 max-sm:grid-cols-1"
      >
        {OWN_PROVIDERS.map((p) => {
          const on = P.provider === p.value;
          return (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => P.setProvider(p.value)}
              className={`flex min-w-0 items-center gap-2 rounded-[12px] border p-2.5 text-start transition-colors ${on ? 'border-[color:var(--text-primary)] bg-surface-card shadow-sm' : 'border-edge bg-surface-card hover:border-edge-secondary'}`}
            >
              <ProviderMark kind={p.mark} size="sm" />
              <span
                className={`min-w-0 flex-1 truncate font-medium ${on ? 'text-content' : 'text-content-muted'}`}
                style={fs(12.5, 'body')}
              >
                {t(p.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
      <EditorField
        label={t('settings.aiParsing.baseUrl')}
        htmlFor={`${fieldId}-url`}
        hint={t('settings.aiParsing.baseUrlHint')}
      >
        <input
          id={`${fieldId}-url`}
          type="url"
          autoComplete="off"
          className={INPUT}
          value={P.baseUrl}
          onChange={(e) => P.setBaseUrl(e.target.value)}
          onBlur={() => void P.loadModels()}
          placeholder={P.baseUrlPlaceholder}
        />
      </EditorField>
      <EditorField
        label={t('settings.aiParsing.apiKey')}
        htmlFor={`${fieldId}-key`}
        hint={P.provider === 'anthropic' ? ANTHROPIC_HINT : t('settings.aiParsing.apiKeyHint')}
      >
        <input
          id={`${fieldId}-key`}
          type="password"
          autoComplete="off"
          className={INPUT}
          value={P.apiKey}
          onChange={(e) => P.setApiKey(e.target.value)}
          placeholder={
            P.apiKey === MASKED ? MASKED : P.provider === 'local' ? t('admin.addons.ai.parsing.apiKeyOptional') : ''
          }
        />
      </EditorField>
      <EditorField label={t('settings.aiParsing.model')} htmlFor={`${fieldId}-model`}>
        <input
          id={`${fieldId}-model`}
          autoComplete="off"
          className={`${INPUT} font-geist`}
          value={P.model}
          onChange={(e) => P.setModel(e.target.value)}
        />
      </EditorField>
      {P.provider === 'local' && <LocalModels P={P} />}
      <div className="flex justify-end gap-2" style={fs(13, 'body')}>
        {!P.ownConnection && (
          <button type="button" onClick={P.cancelOwn} disabled={P.saving} className={SETTINGS_BUTTON}>
            {t('common.cancel')}
          </button>
        )}
        <button
          type="button"
          onClick={() => void P.save()}
          disabled={P.saving || !P.model.trim()}
          className={SETTINGS_BUTTON_PRIMARY}
        >
          {t(P.saving ? 'common.saving' : 'common.save')}
        </button>
      </div>
    </div>
  );
}

/**
 * AI parsing in the AI dialog: which connection reads the bookings (the shared
 * one, or one of its own an older install kept), a connection of its own when
 * wanted, and whether the model reads images. Each part saves on its own.
 */
export default function ParsingSettings({
  addon,
  A,
  onOpenConnection,
}: {
  addon: Addon;
  A: AiAdmin;
  onOpenConnection: () => void;
}): React.ReactElement {
  const { t } = useTranslation();
  const P = useLlmParsingConfig(addon);
  const visionOptions = LLM_VISION_MODES.map((value) => ({ value, label: t(`admin.addons.llm.vision.${value}`) }));
  const local =
    (P.ownConnection ? P.savedProvider : A.instance.live?.kind === 'custom' ? 'local' : 'cloud') === 'local';
  return (
    <div className="flex flex-col gap-5">
      <DialogSection label={t('admin.addons.ai.parsing.readsWith')}>
        <ParsingSource A={A} P={P} onOpenConnection={onOpenConnection} />
      </DialogSection>
      {P.formOpen && (
        <DialogSection label={t('admin.addons.ai.parsing.own')}>
          <OwnConnectionForm P={P} />
        </DialogSection>
      )}
      <DialogSection label={t('settings.aiParsing.multimodal')}>
        <Segmented<LlmVision>
          label={t('settings.aiParsing.multimodal')}
          value={P.vision}
          onChange={(v) => P.setVision(asLlmVision(v))}
          options={visionOptions}
          fill
        />
        <div className="mt-1.5">
          <SettingsHint>
            {t(local ? 'admin.addons.llm.vision.hintLocal' : 'admin.addons.llm.vision.hintCloud')}
          </SettingsHint>
        </div>
      </DialogSection>
    </div>
  );
}
