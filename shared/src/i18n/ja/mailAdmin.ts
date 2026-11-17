import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': '予約メールの取り込み',
  'mailAdmin.hint': '転送された予約確認メールが、適切な旅行の予約になります。',
  'mailAdmin.enabled': '予約メールを取り込む',
  'mailAdmin.enabledHint':
    'このインストールの全員に転送用アドレスを発行します。オフの間は、どのアドレスもメールを受け付けません。',
  'mailAdmin.transport.label': 'メールの受信方法',
  'mailAdmin.transport.off': 'アップロードのみ',
  'mailAdmin.transport.imap': 'IMAPメールボックス',
  'mailAdmin.transport.webhook': 'Webhook',
  'mailAdmin.transport.offInfo':
    'メールボックスは不要です。保存したメールを設定画面で .eml ファイルとしてアップロードすると、TREK が同じように読み取ります。お試しに最適です。',
  'mailAdmin.transport.imapInfo':
    'TREK は2分ごとにメールボックスを確認し、新しいメールを取り込みます。個人用ではなく、プラスアドレス(trek+…@your-domain)を受け取れる専用のメールボックスを使ってください。読み取ったメールは TREK/processed に移動します。',
  'mailAdmin.transport.webhookInfo':
    'Cloudflare Email Worker などのメールサービスが各メールを直接 TREK に渡し、下のキーで署名します。そのため他の誰もメールを紛れ込ませることはできません。メールボックスのない環境向けです。',
  'mailAdmin.aiDaily': '1人1日あたりのAI読み取りメール数',
  'mailAdmin.aiDailyHint': 'この数を超えると、機械で読み取れる予約データのみ読み取ります。',
  'mailAdmin.template': 'アドレスのテンプレート',
  'mailAdmin.templateHint': '転送先アドレスです。各ユーザーのコードが入る場所に{token}を入れてください。',
  'mailAdmin.imap.host': 'サーバー',
  'mailAdmin.imap.port': 'ポート',
  'mailAdmin.imap.tls': '暗号化',
  'mailAdmin.imap.user': 'ユーザー',
  'mailAdmin.imap.pass': 'パスワード',
  'mailAdmin.imap.mailbox': 'フォルダ',
  'mailAdmin.imap.mailboxHint': '読み取り済みのメールはTREK/processedに移動します。',
  'mailAdmin.webhook.secret': '署名シークレット',
  'mailAdmin.webhook.secretHint':
    '32文字以上。送信側がこの値ですべてのメールに署名します。空にするとWebhookはオフになります。',
  'mailAdmin.inboundUrl': 'Webhookのアドレス',
  'mailAdmin.inboundUrlHint': 'お使いのメールサービスが、各メールを加工せず署名付きでここに送信します。',
  'mailAdmin.copyUrl': 'アドレスをコピー',
  'mailAdmin.envHint': '環境変数（MAIL_INGEST_*）は、これらの項目より優先されます。',
  'mailAdmin.loadError': 'メール取り込みの設定を読み込めませんでした。',
  'mailAdmin.problem.secretShort': 'シークレットは32文字以上必要です。',
  'mailAdmin.problem.portInvalid': '1から65535までのポート番号を入力してください。',
  'mailAdmin.problem.templateToken': 'アドレスには、各ユーザーのコードの位置に{token}が必要です。',
  'mailAdmin.problem.dailyInvalid': '0から1000までの整数を入力してください。',
  'mailAdmin.status.lastRead': '最終読み取り：{time}',
  'mailAdmin.status.never': 'なし',
  'mailAdmin.status.mails': 'メール、24時間',
  'mailAdmin.status.added': '自動追加',
  'mailAdmin.status.waiting': '確認待ち',
  'mailAdmin.status.failed': '失敗',
  'mailAdmin.test.run': '接続をテスト',
  'mailAdmin.test.ok': '接続できました',
  'mailAdmin.test.failed': '接続できません',
};
export default mailAdmin;
