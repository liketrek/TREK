import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': '写真の場所が3.0で変更されました',
  'system_notice.v3_photos.body':
    '旅行プランナー内の写真は削除されましたが、写真データは安全です。TREKがImmichやSynologyのライブラリを変更することはありません。\n\n写真は現在日記アドオンにあります。日記は任意機能です。未有効の場合は、管理画面 → アドオンで有効にしてください。',
  'system_notice.v3_journey.title': '日記登場 — 旅の日記',
  'system_notice.v3_journey.body': 'タイムライン、写真ギャラリー、インタラクティブな地図で旅を物語に。',
  'system_notice.v3_journey.cta_label': '日記を開く',
  'system_notice.v3_journey.highlight_timeline': '日ごとのタイムラインとギャラリー',
  'system_notice.v3_journey.highlight_photos': 'ImmichやSynologyからインポート',
  'system_notice.v3_journey.highlight_share': 'ログイン不要で公開共有',
  'system_notice.v3_journey.highlight_export': 'PDFフォトブックとして書き出し',
  'system_notice.v3_features.title': '3.0のその他の注目点',
  'system_notice.v3_features.body': '今回のリリースで知っておきたいポイント。',
  'system_notice.v3_features.highlight_dashboard': 'モバイル重視のダッシュボード刷新',
  'system_notice.v3_features.highlight_offline': 'PWAとして完全オフライン対応',
  'system_notice.v3_features.highlight_search': 'リアルタイム場所検索',
  'system_notice.v3_features.highlight_import': 'KMZ/KMLから場所をインポート',
  'system_notice.v3_mcp.title': 'MCP：OAuth 2.1に更新',
  'system_notice.v3_mcp.body':
    'MCP連携が全面的に刷新されました。OAuth 2.1が推奨認証方式です。従来の静的トークン（trek_…）は非推奨となり、将来削除されます。',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1推奨（mcp-remote）',
  'system_notice.v3_mcp.highlight_scopes': '24の詳細な権限スコープ',
  'system_notice.v3_mcp.highlight_deprecated': '静的trek_トークンは非推奨',
  'system_notice.v3_mcp.highlight_tools': 'ツールとプロンプトを拡張',
  'system_notice.v3_thankyou.title': '開発者より一言',
  'system_notice.v3_thankyou.body':
    '少しだけお時間をください。\n\nTREKは、自分の旅のために作った小さな個人プロジェクトでした。それが今では4,000人以上に使ってもらえるとは思ってもいませんでした。スターも、Issueも、機能要望も、すべて目を通しています。\n\nTREKはこれからもオープンソース、自分でホストでき、あなたのものです。トラッキングなし、サブスクなし。旅が好きな人が作ったツールです。\n\nhttps://github.com/jubnlにも感謝を。3.0の多くはあなたのおかげです。\n\nバグ報告、翻訳、共有、利用してくれたすべての方へ—本当にありがとうございます。\n\nこれからも一緒に旅を。\n\n— Maurice',
  'system_notice.v3014_whitespace_collision.title': '対応が必要：ユーザーアカウントの競合',
  'system_notice.v3014_whitespace_collision.body':
    '3.0.14 へのアップグレードにより、保存されているアカウントの先頭または末尾の空白が原因で、ユーザー名またはメールアドレスの競合が1件以上検出されました。影響を受けたアカウントは自動的にリネームされています。対象となるアカウントを特定するには、サーバーログで **[migration] WHITESPACE COLLISION** で始まる行を確認してください。',
  'system_notice.welcome_v1.title': 'TREKへようこそ',
  'system_notice.welcome_v1.body': 'オールインワンの旅行プランナー。旅程作成、共有、整理をオンライン・オフラインで。',
  'system_notice.welcome_v1.cta_label': '旅行を計画',
  'system_notice.welcome_v1.hero_alt': 'TREKのUIが重なった風景写真',
  'system_notice.welcome_v1.highlight_plan': '日ごとの旅程作成',
  'system_notice.welcome_v1.highlight_share': '仲間と共同編集',
  'system_notice.welcome_v1.highlight_offline': 'モバイルでオフライン対応',
  'system_notice.dev_test_modal.title': '[Dev] テスト通知',
  'system_notice.dev_test_modal.body': 'これは開発用テスト通知です。',
  'system_notice.pager.prev': '前へ',
  'system_notice.pager.next': '次へ',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '通知{n}へ',
  'system_notice.pager.position': '{total}件中{current}件目',
};
export default system_notice;
