import ar from '../ar/externalNotifications';
import az from '../az/externalNotifications';
import br from '../br/externalNotifications';
import cs from '../cs/externalNotifications';
import de from '../de/externalNotifications';
import en from '../en/externalNotifications';
import es from '../es/externalNotifications';
import et from '../et/externalNotifications';
import fr from '../fr/externalNotifications';
import gr from '../gr/externalNotifications';
import hu from '../hu/externalNotifications';
import id from '../id/externalNotifications';
import it from '../it/externalNotifications';
import ja from '../ja/externalNotifications';
import ko from '../ko/externalNotifications';
import nl from '../nl/externalNotifications';
import pl from '../pl/externalNotifications';
import ru from '../ru/externalNotifications';
import sk from '../sk/externalNotifications';
import sv from '../sv/externalNotifications';
import th from '../th/externalNotifications';
import tr from '../tr/externalNotifications';
import uk from '../uk/externalNotifications';
import zhTW from '../zh-TW/externalNotifications';
import zh from '../zh/externalNotifications';
import type {
  NotificationLocale,
  EmailStrings,
  EventTextFn,
  PasswordResetStrings,
  NotificationEventKey,
} from './types';

export * from './types';

const LOCALES = {
  en,
  de,
  fr,
  es,
  et,
  hu,
  nl,
  br,
  cs,
  sk,
  pl,
  ru,
  zh,
  'zh-TW': zhTW,
  it,
  tr,
  ar,
  az,
  id,
  ja,
  ko,
  th,
  uk,
  gr,
  sv,
} satisfies Record<string, NotificationLocale>;

export const EMAIL_I18N: Record<string, EmailStrings> = Object.fromEntries(
  Object.entries(LOCALES).map(([k, v]) => [k, v.email]),
);

export const EVENT_TEXTS: Record<string, Record<NotificationEventKey, EventTextFn>> = Object.fromEntries(
  Object.entries(LOCALES).map(([k, v]) => [k, v.events]),
);

export const PASSWORD_RESET_I18N: Record<string, PasswordResetStrings> = Object.fromEntries(
  Object.entries(LOCALES).map(([k, v]) => [k, v.passwordReset]),
);
