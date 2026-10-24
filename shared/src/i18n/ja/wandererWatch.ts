import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'トレイルの変更を確認する',
  'wanderer.watch.hint': 'インポートしたトレイルが変更された可能性があるときに通知します。',
  'wanderer.watch.info':
    'TREK はインポートした各トレイルの短い記録を1日に最大1回読み取ります。GPX ファイルは読み取りません。通知するだけで、変更を取り込むかどうかはツアーのソース確認からご自身で決めます。',
  'wanderer.watch.notConnected': '先に wanderer を接続してください',
  'wanderer.watch.on': 'バックグラウンド確認をオンにしました',
  'wanderer.watch.off': 'バックグラウンド確認をオフにしました',
  'wanderer.watch.failed': 'バックグラウンド確認を切り替えられませんでした',
  'wanderer.watch.lastRun': '最終確認 {date}',
  'wanderer.watch.neverRun': 'まだ確認していません',
  'wanderer.watch.paused': '{time} まで一時停止',
  'wanderer.watch.pausedHint':
    'wanderer から応答がありませんでした。失敗するたびに TREK は次の問い合わせまでの間隔を長くします。',
  'wanderer.watch.blocked': 'トークンが拒否されました',
  'wanderer.watch.blockedHint':
    'wanderer が API トークンを拒否しました。接続テストに成功するか新しいトークンを保存すると確認を再開します。',
  'wanderer.watch.hints': 'お知らせ',
  'wanderer.watch.hintsCount': '未対応のお知らせ {count} 件',
  'wanderer.watch.empty': '未対応のお知らせはありません',
  'wanderer.watch.dialogTitle': 'トレイルに関するお知らせ',
  'wanderer.watch.openTour': 'ツアーを開く',
  'wanderer.watch.checkedAt': '確認 {date}',
  'wanderer.watch.noticeLabel': 'バックグラウンド確認',
  'wanderer.watch.state.possible_change': '変更の可能性',
  'wanderer.watch.state.changed': '変更あり',
  'wanderer.watch.state.unverifiable': '確認できません',
  'wanderer.watch.stateHint.possible_change':
    'wanderer でトレイルのタイムスタンプが変わりました。内容が違うかどうかはソース確認でしか分かりません。',
  'wanderer.watch.stateHint.changed':
    'wanderer の記録で名前または説明が変わっています。変更内容のすべてはソース確認で表示されます。',
  'wanderer.watch.stateHint.unverifiable':
    'TREK はこのトレイルを判断できなかったため、変更の有無については何も示しません。',
  'wanderer.watch.reason.unavailable': 'トレイルにアクセスできません',
  'wanderer.watch.reason.no_change_time': 'タイムスタンプなし',
};
export default wandererWatch;
