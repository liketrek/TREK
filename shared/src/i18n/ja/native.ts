import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'TREK に接続',
  'native.connect.hint': 'ブラウザで TREK を開くときのアドレスを入力してください。',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': '接続',
  'native.connect.checking': '確認中…',
  'native.connect.errorInvalid': 'Web アドレスではないようです。',
  'native.connect.errorUnreachable': 'このアドレスで応答するサーバーがありません。アドレスと接続を確認してください。',
  'native.connect.errorNotTrek': 'このアドレスのサーバーは TREK ではありません。',
  'native.connect.errorTooOld': 'この TREK サーバーはアプリに対して古すぎます。先に更新が必要です。',
  'native.offline.title': 'サーバーに接続できません',
  'native.offline.hint': 'TREK は {server} に接続できませんでした。接続を確認して、もう一度お試しください。',
  'native.offline.retry': '再試行',
  'native.changeServer': 'サーバーを変更',
  'native.login.failed': 'ログインできませんでした。もう一度お試しください。',
  'native.handoff.title': 'アプリで続行',
  'native.handoff.hint': '{name} としてログインしています。TREK アプリを開いて、そちらでログインを完了してください。',
  'native.handoff.open': 'TREK アプリを開く',
  'native.handoff.switchAccount': '別のアカウントを使う',
  'native.settings.server': 'サーバー',
  'native.settings.serverHint': 'このアプリは {server} に接続されています。',
};

export default native;
