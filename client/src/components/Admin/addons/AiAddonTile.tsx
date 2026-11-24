import { Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../../i18n';
import { StatusPill } from '../../Settings/settingsKit';
import { fs } from '../../shared/DialogShell';
import AddonSetupRow from '../AddonSetupRow';
import AddonSubRow from '../AddonSubRow';
import AddonTile from '../AddonTile';
import { type Addon, getAddonLabel } from './addonModel';
import { AI_ADDON_ICONS, type AiAddonId } from './aiAddons';
import AiSettingsDialog from './AiAdminConfig';
import { useAiAddonTile } from './useAiAddonTile';

/**
 * The AI addons as one tile at the head of the integration column: the
 * assistant, AI parsing and MCP as switches in its shelf, and one button to
 * the dialog that holds their settings, so a page with all three on stays as
 * short as one with none.
 */
export default function AiAddonTile({
  addons,
  onToggle,
}: {
  addons: Addon[];
  onToggle: (addon: Addon) => void;
}): React.ReactElement {
  const { t } = useTranslation();
  const tile = useAiAddonTile(addons);
  const anyOn = tile.enabledCount > 0;
  return (
    <>
      <AddonTile
        icon={<Sparkles size={15} />}
        name={t('admin.addons.ai.name')}
        description={t('admin.addons.ai.description')}
        enabled={anyOn}
        trailing={
          <StatusPill tone={anyOn ? 'success' : 'neutral'}>
            {tile.enabledCount}/{addons.length}
          </StatusPill>
        }
      >
        {addons.map((addon) => {
          const Icon = AI_ADDON_ICONS[addon.id as AiAddonId];
          const label = getAddonLabel(t, addon);
          return (
            <AddonSubRow
              key={addon.id}
              icon={<Icon size={14} />}
              title={label.name}
              description={label.description}
              badge={addon.id === 'ai_assistant' ? <BetaBadge label={t('assistant.setup.beta')} /> : undefined}
              enabled={addon.enabled}
              onToggle={() => onToggle(addon)}
            />
          );
        })}
        {tile.canSetUp && <AddonSetupRow label={t('admin.addons.ai.setup')} onOpen={tile.openDialog} />}
      </AddonTile>
      {tile.dialogOpen && <AiSettingsDialog addons={addons} onClose={tile.closeDialog} />}
    </>
  );
}

/** The assistant is still young; its switch says so with a small accent pill. */
function BetaBadge({ label }: { label: string }): React.ReactElement {
  return (
    <span
      className="inline-flex flex-none items-center gap-1 rounded-full bg-accent px-[7px] py-[2px] font-geist font-bold uppercase leading-none tracking-[.08em] text-accent-text shadow-sm"
      style={fs(9)}
    >
      <Sparkles size={9} strokeWidth={2.6} aria-hidden />
      {label}
    </span>
  );
}
