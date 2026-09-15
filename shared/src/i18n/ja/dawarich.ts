import type { TranslationStrings } from '../types';

const dawarich: TranslationStrings = {
  // ── Connection ─────────────────────────────────────────────────────────────
  'dawarich.title': 'Dawarich',
  'dawarich.intro':
    '自分の Dawarich インスタンスを接続すると、実際に訪れた場所がわかります。TREK はそれを読み取り、日記のエントリー、場所、国を提案します。確認するまで何も追加されず、Dawarich に書き戻すこともありません。',
  'dawarich.url': 'インスタンスのアドレス',
  'dawarich.apiKey': 'API キー',
  'dawarich.apiKeyPlaceholder': 'Dawarich の API キーを貼り付け',
  'dawarich.apiKeyHint':
    'Dawarich の「Account → API key」にあります。暗号化して保存され、以後は表示されません。',
  'dawarich.allowInsecureTls': '自己署名証明書を許可',
  'dawarich.allowInsecureTlsHint':
    'サーバーが信頼していない証明書をインスタンスが使っている場合にのみ必要です。',
  'dawarich.syncEnabled': '新しい滞在を自動で確認',
  'dawarich.syncEnabledHint': 'オフにすると、TREK は指示したときだけ Dawarich を読み取ります。',
  'dawarich.test.button': '接続をテスト',
  'dawarich.test.success': '接続しました。過去30日間で{count}件の滞在が見つかりました。',
  'dawarich.test.failed': 'Dawarich に接続できませんでした。',
  'dawarich.syncNow': '今すぐ確認',
  'dawarich.connected': '接続済み',
  'dawarich.notConnected': '未接続',
  'dawarich.disconnect': '接続解除',
  'dawarich.lastSync': '最終確認：{when}',
  'dawarich.neverSynced': 'まだ確認していません',
  'dawarich.syncPartial': '一部の旅行を読み取れませんでした',
  'dawarich.serverVersion': 'Dawarich {version}',

  'dawarich.toast.saved': 'Dawarich の接続を保存しました',
  'dawarich.toast.saveError': '接続を保存できませんでした',
  'dawarich.toast.disconnected': 'Dawarich の接続を解除しました',
  'dawarich.toast.synced': '{count}件の新しい滞在が見つかりました',
  'dawarich.toast.syncError': 'Dawarich を読み取れませんでした',
  'dawarich.toast.syncRunning': 'すでに確認中です',
  'dawarich.toast.acceptError': '追加できませんでした',
  'dawarich.toast.updateError': 'この提案を更新できませんでした',
  'dawarich.toast.accepted.place': '旅行に追加しました',
  'dawarich.toast.accepted.journal': '日記に追加しました',
  'dawarich.toast.accepted.bucket_list': 'ウィッシュリストにチェックを付けました',

  // ── What the connected instance can do ─────────────────────────────────────
  'dawarich.capability.visits': '滞在',
  'dawarich.capability.track': '記録されたルート',
  'dawarich.capability.locations': 'ウィッシュリストの照合',
  'dawarich.capability.visitedCities': '国と都市',
  'dawarich.capability.missing': 'この Dawarich のバージョンでは利用できません：{features}。',

  // ── Failure reasons, as sentences the reader can act on ────────────────────
  'dawarich.error.unreachable': 'TREK はそのアドレスに接続できませんでした。',
  'dawarich.error.unauthorized': 'Dawarich が API キーを拒否しました。',
  'dawarich.error.forbidden': 'その API キーにはこれを読み取る権限がありません。',
  'dawarich.error.not_found': 'この Dawarich のバージョンにはそのエンドポイントがありません。',
  'dawarich.error.rate_limited':
    'Dawarich からリクエストを控えるよう求められました。しばらくしてからお試しください。',
  'dawarich.error.server_error': 'Dawarich がエラーを返しました。',
  'dawarich.error.invalid_response': 'そのアドレスからの応答は Dawarich のものではありません。',
  'dawarich.error.too_large': 'Dawarich が、TREK が一度に読み取れる量を超えるデータを返しました。',
  'dawarich.error.not_connected': 'Dawarich インスタンスはまだ接続されていません。',
  'dawarich.error.addon_disabled': 'このインスタンスでは Dawarich アドオンが無効になっています。',
  'dawarich.error.offline': 'これには接続が必要です。TREK は現在オフラインです。',
  'dawarich.error.invalid_url': 'TREK はこのアドレスを使用できません。',
  'dawarich.warning.private_ip': 'このアドレスはプライベート IP ({ip}) を指しています。意図した設定かご確認ください。サーバー側に ALLOW_INTERNAL_NETWORK=true が必要な場合があります。',
  'dawarich.error.unknown': 'Dawarich との通信中に問題が発生しました。',

  // ── The recorded route on the map ──────────────────────────────────────────
  'dawarich.trail.show': '記録されたルートを表示',
  'dawarich.trail.hide': '記録されたルートを非表示',
  'dawarich.trail.loading': '記録されたルートを読み込み中…',
  'dawarich.trail.empty': 'この日付には記録がありません',
  'dawarich.trail.offline': '記録されたルートの表示には接続が必要です',
  'dawarich.trail.unavailable': '記録されたルートを読み込めませんでした',

  // ── Suggestions ────────────────────────────────────────────────────────────
  'dawarich.duration.minutes': '{minutes}分',
  'dawarich.duration.hours': '{hours}時間',
  'dawarich.duration.hoursMinutes': '{hours}時間{minutes}分',
  'dawarich.checkedAgo': '{ago}に確認',

  'dawarich.badge.lowConfidence': '不確か',
  'dawarich.badge.sourceChanged': 'Dawarich で変更',
  'dawarich.badge.sourceMissing': 'Dawarich から消失',

  'dawarich.suggestions.title': 'Dawarich から',
  'dawarich.suggestions.pending': '{count}件が未処理',
  'dawarich.suggestions.loading': 'Dawarich を読み取り中…',
  'dawarich.suggestions.notConnected':
    '設定で Dawarich を接続すると、ここに滞在が表示されます。',
  'dawarich.suggestions.unavailable': 'Dawarich を読み取れませんでした。',
  'dawarich.suggestions.allHandled': 'ここに記録されたものはすべて処理済みです。',
  'dawarich.suggestions.asJournal': '日記を書く',
  'dawarich.suggestions.asPlace': '場所として追加',
  'dawarich.suggestions.dismiss': '訪れていない場所',
  'dawarich.suggestions.dismissed': '却下済み',
  'dawarich.suggestions.restore': '戻す',
  'dawarich.suggestions.showHandled': '処理済みの{count}件を表示',
  'dawarich.suggestions.hideHandled': '処理済みのものを非表示',
  'dawarich.suggestions.matchesWish': 'ウィッシュリストにあります：{name}',
  'dawarich.suggestions.acceptedAs.place': '場所として追加済み',
  'dawarich.suggestions.acceptedAs.journal': '日記に記載済み',
  'dawarich.suggestions.acceptedAs.bucket_list': 'ウィッシュにチェック済み',
  'dawarich.suggestions.sourceChanged':
    'この滞在は、使用したあとに Dawarich 側で変更されました。TREK に書いた内容はそのままです。',
  'dawarich.suggestions.sourceMissing':
    'この滞在は Dawarich にもう存在しません。TREK に書いた内容はそのままです。',
  'dawarich.sourceStatus.suggested': '検出済み・未確認',
  'dawarich.confidence.high': '確度の高い検出',
  'dawarich.confidence.medium': 'ある程度確かな検出',
  'dawarich.confidence.low': '不確かな検出',

  // ── The review step ────────────────────────────────────────────────────────
  'dawarich.accept.title.place': 'この滞在を場所として追加',
  'dawarich.accept.title.journal': '日記を書く',
  'dawarich.accept.title.bucket_list': 'ウィッシュにチェックを付ける',
  'dawarich.accept.confirm.place': '場所を追加',
  'dawarich.accept.confirm.journal': 'エントリーを追加',
  'dawarich.accept.confirm.bucket_list': 'チェックを付ける',
  'dawarich.accept.recorded': '記録：{from}から{to}まで',
  'dawarich.accept.duration': '{minutes}分',
  'dawarich.accept.name': '名前',
  'dawarich.accept.date': '日付',
  'dawarich.accept.from': '到着',
  'dawarich.accept.to': '出発',
  'dawarich.accept.trip': '旅行',
  'dawarich.accept.thisTrip': 'この旅行',
  'dawarich.accept.pickTrip': '旅行を選択',
  'dawarich.accept.day': '日',
  'dawarich.accept.noDay': 'まだ日付が未設定',
  'dawarich.accept.journal': '日記',
  'dawarich.accept.pickJournal': '日記を選択',
  'dawarich.accept.notes': 'メモ',
  'dawarich.accept.story': 'あなたのストーリー',
  'dawarich.accept.storyPlaceholder': 'ここで何がありましたか？',
  'dawarich.accept.photosHint': '写真は、エントリーを作成したあとに追加できます。',

  // ── A place that came out of a recording ──────────────────────────────────
  'dawarich.place.fromDawarich': 'Dawarich の記録から追加されました',

  // ── Wishlist ───────────────────────────────────────────────────────────────
  'dawarich.bucket.title': 'ウィッシュリストを Dawarich と照合',
  'dawarich.bucket.description':
    '行きたかった場所を記録の中から探します。訪問と見なすには、近さと滞在時間の両方が必要です。通り過ぎただけでは含まれません。',
  'dawarich.bucket.scan': 'ウィッシュリストを照合',
  'dawarich.bucket.scanning': '照合中…',
  'dawarich.bucket.noMatches': 'ウィッシュリストの項目は記録の中に見つかりませんでした。',
  'dawarich.bucket.alreadyVisited': 'チェック済み',
  'dawarich.bucket.confirm': '{count}件にチェックを付ける',
  'dawarich.bucket.confirmed': '{count}件のウィッシュにチェックを付けました',
  'dawarich.bucket.skipped': '{count}件は座標がないため照合できませんでした。',
  'dawarich.bucket.truncated':
    '最初の項目のみ照合しました。残りはもう一度実行してください。',
  'dawarich.bucket.visitedFrom': 'Dawarich の記録からチェックを付けました',
  'dawarich.bucket.clearVisit': '元に戻す',

  // ── Atlas ──────────────────────────────────────────────────────────────────
  'dawarich.atlas.title': 'Dawarich からの国',
  'dawarich.atlas.description':
    '記録から滞在したとみられる国です。Atlas に入れたいものを確認してください。自動では追加されず、手動で付けた印もそのまま残ります。',
  'dawarich.atlas.load': '国を探す',
  'dawarich.atlas.loading': '記録を読み取り中…',
  'dawarich.atlas.empty': '記録の中に、TREK にまだない国はありませんでした。',
  'dawarich.atlas.cities': '{count}都市',
  'dawarich.atlas.citiesOne': '1 都市',
  'dawarich.atlas.accept': '{count}か国を追加',
  'dawarich.atlas.accepted': '{count}か国を追加しました',
  'dawarich.atlas.unresolved': 'TREK はこれらを国と照合できませんでした：{names}。',
  'dawarich.atlas.source': 'Dawarich から',
  'dawarich.atlas.range': '{from}から{to}までを対象',

  'dawarich.atlas.trigger': '記録から見つかった願いと国',
  'dawarich.atlas.dialogSubtitle': '記録があなたの Atlas について語ること',
  'dawarich.atlas.tab.wishes': 'ウィッシュリスト',
  'dawarich.atlas.tab.countries': '国',
  'dawarich.atlas.window': '直近12か月を確認しました。',
  'dawarich.selected': '{count}件を選択中',
  'dawarich.again': 'もう一度確認',
  'dawarich.bucket.metersAway': '{meters} m 先',
  'dawarich.bucket.kilometersAway': '{km} km 先',
  'dawarich.bucket.rule': '{meters} m 以内に {minutes} 分以上滞在すると、願いがかなったとみなします。',

};

export default dawarich;
