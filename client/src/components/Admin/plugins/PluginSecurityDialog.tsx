import { ShieldCheck } from 'lucide-react';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../../shared/DialogShell';
import type { T } from './pluginModel';

/**
 * How plugins are contained and where that ends, opened from the shield in the panel's
 * header. It used to sit under the list as a card of its own, which pushed a wall of
 * text into the page every admin scrolls past.
 */
export default function PluginSecurityDialog({ t, onClose }: { t: T; onClose: () => void }) {
  const sections: Array<[string, string]> = [
    [t('admin.plugins.security.isolationTitle'), t('admin.plugins.security.isolationBody')],
    [t('admin.plugins.security.permsTitle'), t('admin.plugins.security.permsBody')],
    [t('admin.plugins.security.limitsTitle'), t('admin.plugins.security.limitsBody')],
    [t('admin.plugins.security.worstTitle'), t('admin.plugins.security.worstBody')],
    [t('admin.plugins.security.reviewedTitle'), t('admin.plugins.security.reviewedBody')],
    [t('admin.plugins.security.signedTitle'), t('admin.plugins.security.signedBody')],
    [t('admin.plugins.security.trustTitle'), t('admin.plugins.security.trustBody')],
  ];
  return (
    <DialogShell
      onClose={onClose}
      labelledBy="plugin-security-title"
      width="detail"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <ShieldCheck size={20} className="text-content-secondary" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId="plugin-security-title"
          title={t('admin.plugins.security.short')}
          sub={t('admin.plugins.reviewedMeaning')}
          subWraps
          onClose={onClose}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton variant="primary" onClick={onClose}>
            {t('common.ok')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {sections.map(([h, b]) => (
          <div key={h} className="rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3">
            <h4 className="m-0 font-semibold text-content" style={fs(12.5, 'body')}>
              {h}
            </h4>
            <p className="m-0 mt-1 leading-relaxed text-content-muted" style={fs(12, 'body')}>
              {b}
            </p>
          </div>
        ))}
      </div>
    </DialogShell>
  );
}
