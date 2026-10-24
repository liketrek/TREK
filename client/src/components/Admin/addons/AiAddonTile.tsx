import { ChevronRight, Settings2, Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../../i18n';
import { StatusPill } from '../../Settings/settingsKit';
import { fs } from '../../shared/DialogShell';
import AddonSubRow from '../AddonSubRow';
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
    <article className="px-3.5 py-3 transition-colors duration-150 focus-within:bg-surface-secondary">
      <div className="flex items-start gap-3">
        <div
          className={`grid h-9 w-9 flex-none place-items-center rounded-[10px] transition-colors ${
            anyOn
              ? 'bg-surface-card text-content shadow-sm ring-1 ring-edge-faint'
              : 'bg-surface-tertiary text-content-faint'
          }`}
        >
          <Sparkles size={18} />
        </div>
        <div className="min-w-0 flex-1 pt-px">
          <h4 className="m-0 truncate font-semibold text-content" style={fs(13, 'body')}>
            {t('admin.addons.ai.name')}
          </h4>
          <p
            className={`m-0 mt-0.5 line-clamp-2 leading-snug ${anyOn ? 'text-content-muted' : 'text-content-faint'}`}
            style={fs(11.5)}
          >
            {t('admin.addons.ai.description')}
          </p>
        </div>
        <div className="flex-none pt-1">
          <StatusPill tone={anyOn ? 'success' : 'neutral'}>
            {tile.enabledCount}/{addons.length}
          </StatusPill>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-[12px] border border-edge-faint bg-surface-secondary">
        <ul className="m-0 list-none divide-y divide-edge-faint p-0">
          {addons.map((addon) => {
            const Icon = AI_ADDON_ICONS[addon.id as AiAddonId];
            const label = getAddonLabel(t, addon);
            return (
              <AddonSubRow
                key={addon.id}
                icon={<Icon size={14} />}
                title={label.name}
                description={label.description}
                enabled={addon.enabled}
                onToggle={() => onToggle(addon)}
              />
            );
          })}
        </ul>
        {tile.canSetUp && (
          <button
            type="button"
            onClick={tile.openDialog}
            className="flex min-h-[44px] w-full items-center gap-2.5 border-t border-edge-faint px-3 py-1.5 text-start transition-colors hover:bg-surface-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            <span className="grid h-6 w-6 flex-none place-items-center text-content-muted">
              <Settings2 size={14} />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(12.5, 'body')}>
              {t('admin.addons.ai.setup')}
            </span>
            <ChevronRight size={15} strokeWidth={2.2} className="flex-none text-content-faint rtl:rotate-180" />
          </button>
        )}
      </div>

      {tile.dialogOpen && <AiSettingsDialog addons={addons} onClose={tile.closeDialog} />}
    </article>
  );
}
