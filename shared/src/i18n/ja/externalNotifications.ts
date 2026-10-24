import type { NotificationLocale } from '../externalNotifications/types';

const ja: NotificationLocale = {
  email: {
    footer: 'TREKで通知を有効にしているため、このメールが届きました。',
    manage: '設定で通知設定を管理',
    madeWith: 'Made with',
    openTrek: 'TREKを開く',
  },
  events: {
    trip_invite: (p) => ({
      title: `「${p.trip}」への旅行招待`,
      body: `${p.actor}が${p.invitee || 'メンバー'}を「${p.trip}」の旅行に招待しました。`,
    }),
    booking_change: (p) => ({
      title: `新しい予約：${p.booking}`,
      body: `${p.actor}が「${p.trip}」に「${p.booking}」（${p.type}）を追加しました。`,
    }),
    trip_reminder: (p) => ({
      title: `旅行リマインダー：${p.trip}`,
      body: `「${p.trip}」の旅行が近づいています！`,
    }),
    todo_due: (p) => ({
      title: `期限のタスク：${p.todo}`,
      body: `「${p.trip}」の「${p.todo}」は${p.due}が期限です。`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay Fusion招待',
      body: `${p.actor}が休暇プランの統合に招待しています。TREKを開いて承認または拒否してください。`,
    }),
    vacay_share: (p) => ({
      title: 'Vacayカレンダーが共有されました',
      body: `${p.actor}が休暇カレンダーを共有しました。TREKを開いて確認してください。`,
    }),
    collection_invite: (p) => ({
      title: 'コレクション招待',
      body: `${p.actor}がコレクションの共有に招待しています。TREKを開いて承認または拒否してください。`,
    }),
    photos_shared: (p) => ({
      title: `${p.count}枚の写真が共有されました`,
      body: `${p.actor}が「${p.trip}」で${p.count}枚の写真を共有しました。`,
    }),
    collab_message: (p) => ({
      title: `「${p.trip}」の新しいメッセージ`,
      body: `${p.actor}：${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `パッキング：${p.category}`,
      body: `${p.actor}が「${p.trip}」の「${p.category}」カテゴリにあなたを割り当てました。`,
    }),
    version_available: (p) => ({
      title: '新しいTREKバージョンが利用可能',
      body: `TREK ${p.version}が利用可能になりました。管理パネルからアップデートしてください。`,
    }),
    replica_failure: (p) => ({
      title: 'ストレージレプリカの障害',
      body:
        `レプリカ '${p.backend}' への書き込みに失敗しました：${p.op} / ${p.key} — ${p.error}。` +
        (p.suppressed !== '0' ? `前回の通知以降、${p.suppressed}件の追加の失敗が抑制されました。` : ''),
    }),
    paddle_region_requested: (p) => ({
      title: 'パドル地域のリクエスト',
      body: `${p.actor}が${p.region}でパドルツアーを計画しています。管理画面のアドオンで水域データを読み込むか却下してください。`,
    }),
    synology_session_cleared: () => ({
      title: 'Synologyセッションがクリアされました',
      body: 'SynologyアカウントまたはURLが変更されました。Synology Photosからログアウトされました。',
    }),
    wanderer_source_hint: (p) => ({
      title: `wanderer のトレイル: ${p.tour}`,
      body:
        p.state === 'changed'
          ? `「${p.trip}」の「${p.tour}」が wanderer で変更されました。ツアーを開いてソースを確認すると、すべての変更を確認できます。旅行の内容が勝手に変わることはありません。`
          : p.state === 'unverifiable'
            ? `「${p.trip}」の「${p.tour}」は wanderer で確認できなくなりました。旅行内のツアーはそのまま残ります。`
            : `「${p.trip}」の「${p.tour}」が wanderer で変更された可能性があります。ツアーを開いてソースを確認してください。旅行の内容が勝手に変わることはありません。`,
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'パスワードをリセット',
    greeting: 'こんにちは',
    body: 'TREKアカウントのパスワードリセットリクエストを受け付けました。以下のボタンをクリックして新しいパスワードを設定してください。',
    ctaIntro: 'パスワードをリセット',
    expiry: 'このリンクは60分後に期限切れになります。',
    ignore: 'このリクエストをご自身でしていない場合は、このメールを無視してください — パスワードは変更されません。',
  },
};

export default ja;
