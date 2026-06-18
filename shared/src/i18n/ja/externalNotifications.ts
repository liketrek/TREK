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
    synology_session_cleared: () => ({
      title: 'Synologyセッションがクリアされました',
      body: 'SynologyアカウントまたはURLが変更されました。Synology Photosからログアウトされました。',
    }),
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
