import { useNativeServer } from '../../components/Settings/useNativeServer';
import { useTranslation } from '../../i18n';

/** Inside the iOS/Android app only: the way from the sign-in screen back to the address screen. */
export default function NativeServerLink() {
  const { t } = useTranslation();
  const { host, changeServer } = useNativeServer();
  if (!host) return null;
  return (
    <button
      type="button"
      onClick={changeServer}
      className="mt-4 w-full cursor-pointer border-none bg-transparent p-2 text-caption text-content-muted"
    >
      {t('native.changeServer')}
    </button>
  );
}
