import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': '連線到 TREK',
  'native.connect.hint': '請輸入你在瀏覽器中開啟 TREK 時使用的網址。',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': '連線',
  'native.connect.checking': '正在檢查…',
  'native.connect.errorInvalid': '這看起來不像網址。',
  'native.connect.errorUnreachable': '此網址沒有伺服器回應。請檢查網址與網路連線。',
  'native.connect.errorNotTrek': '此網址上的伺服器不是 TREK。',
  'native.connect.errorTooOld': '此 TREK 伺服器版本過舊，無法用於 App。請先更新伺服器。',
  'native.offline.title': '無法連線到伺服器',
  'native.offline.hint': 'TREK 無法連線到 {server}。請檢查網路連線後再試一次。',
  'native.offline.retry': '再試一次',
  'native.changeServer': '更換伺服器',
  'native.login.failed': '登入未成功，請再試一次。',
  'native.handoff.title': '在 App 中繼續',
  'native.handoff.hint': '你已以 {name} 身分登入。請開啟 TREK App，在那裡完成登入。',
  'native.handoff.open': '開啟 TREK App',
  'native.handoff.switchAccount': '使用其他帳號',
  'native.settings.server': '伺服器',
  'native.settings.serverHint': '此 App 已連線到 {server}。',
};

export default native;
