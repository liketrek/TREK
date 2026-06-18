import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': '旅行',
  'oauth.scope.group.places': '場所',
  'oauth.scope.group.atlas': '地図',
  'oauth.scope.group.packing': '持ち物',
  'oauth.scope.group.todos': 'ToDo',
  'oauth.scope.group.budget': '予算',
  'oauth.scope.group.reservations': '予約',
  'oauth.scope.group.collab': 'コラボ',
  'oauth.scope.group.notifications': '通知',
  'oauth.scope.group.vacay': '休暇',
  'oauth.scope.group.geo': '地図',
  'oauth.scope.group.weather': '天気',
  'oauth.scope.group.journey': '日記',
  'oauth.scope.trips:read.label': '旅行・旅程を表示',
  'oauth.scope.trips:read.description': '旅行、日程、メモ、メンバーを閲覧',
  'oauth.scope.trips:write.label': '旅行・旅程を編集',
  'oauth.scope.trips:write.description': '旅行や日程、メモの作成・更新、メンバー管理',
  'oauth.scope.trips:delete.label': '旅行を削除',
  'oauth.scope.trips:delete.description': '旅行全体を完全に削除（元に戻せません）',
  'oauth.scope.trips:share.label': '共有リンクを管理',
  'oauth.scope.trips:share.description': '旅行の公開共有リンクを作成・更新・無効化',
  'oauth.scope.places:read.label': '場所・地図データを表示',
  'oauth.scope.places:read.description': '場所、日への割り当て、タグ、カテゴリを閲覧',
  'oauth.scope.places:write.label': '場所を管理',
  'oauth.scope.places:write.description': '場所、割り当て、タグの作成・更新・削除',
  'oauth.scope.atlas:read.label': '地図を表示',
  'oauth.scope.atlas:read.description': '訪問した国・地域、バケットリストを閲覧',
  'oauth.scope.atlas:write.label': '地図を管理',
  'oauth.scope.atlas:write.description': '訪問済みの国・地域を管理、バケットリスト編集',
  'oauth.scope.packing:read.label': '持ち物リストを表示',
  'oauth.scope.packing:read.description': '持ち物、バッグ、担当者を閲覧',
  'oauth.scope.packing:write.label': '持ち物リストを管理',
  'oauth.scope.packing:write.description': '持ち物やバッグの追加・編集・削除・並び替え',
  'oauth.scope.todos:read.label': 'ToDoリストを表示',
  'oauth.scope.todos:read.description': '旅行のToDoと担当者を閲覧',
  'oauth.scope.todos:write.label': 'ToDoリストを管理',
  'oauth.scope.todos:write.description': 'ToDoの作成・編集・完了・削除・並び替え',
  'oauth.scope.budget:read.label': '予算を表示',
  'oauth.scope.budget:read.description': '予算項目や内訳を閲覧',
  'oauth.scope.budget:write.label': '予算を管理',
  'oauth.scope.budget:write.description': '予算項目の作成・編集・削除',
  'oauth.scope.reservations:read.label': '予約を表示',
  'oauth.scope.reservations:read.description': '予約や宿泊情報を閲覧',
  'oauth.scope.reservations:write.label': '予約を管理',
  'oauth.scope.reservations:write.description': '予約の作成・編集・削除・並び替え',
  'oauth.scope.collab:read.label': 'コラボを表示',
  'oauth.scope.collab:read.description': '共同メモ、投票、メッセージを閲覧',
  'oauth.scope.collab:write.label': 'コラボを管理',
  'oauth.scope.collab:write.description': '共同メモ、投票、メッセージを管理',
  'oauth.scope.notifications:read.label': '通知を表示',
  'oauth.scope.notifications:read.description': 'アプリ内通知と未読数を閲覧',
  'oauth.scope.notifications:write.label': '通知を管理',
  'oauth.scope.notifications:write.description': '通知を既読にする・対応する',
  'oauth.scope.vacay:read.label': '休暇プランを表示',
  'oauth.scope.vacay:read.description': '休暇プランのデータや統計を閲覧',
  'oauth.scope.vacay:write.label': '休暇プランを管理',
  'oauth.scope.vacay:write.description': '休暇エントリーや予定を管理',
  'oauth.scope.geo:read.label': '地図・ジオコーディング',
  'oauth.scope.geo:read.description': '場所検索、地図URL解析、逆ジオコーディング',
  'oauth.scope.weather:read.label': '天気予報',
  'oauth.scope.weather:read.description': '旅行先・日程の天気予報を取得',
  'oauth.scope.journey:read.label': '日記を表示',
  'oauth.scope.journey:read.description': '日記、エントリー、参加者を閲覧',
  'oauth.scope.journey:write.label': '日記を管理',
  'oauth.scope.journey:write.description': '日記やエントリーの作成・編集・削除',
  'oauth.scope.journey:share.label': '日記共有を管理',
  'oauth.scope.journey:share.description': '公開共有リンクの作成・更新・無効化',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
