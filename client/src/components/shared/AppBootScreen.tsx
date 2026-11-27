import { useTranslation } from '../../i18n';

/**
 * What the waiting states show while the app hands over from its address
 * screen (native/appBoot.ts): that screen's ground and its spinner, which only
 * comes up when the wait is long enough to notice. Styled in native/nativeApp.css.
 */
export default function AppBootScreen() {
  const { t } = useTranslation();
  return (
    <div className="app-boot" role="status" aria-label={t('common.loading')}>
      <span aria-hidden="true" />
    </div>
  );
}
