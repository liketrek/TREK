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
  'system_notice.thank_you_support.title': 'TREKを使ってくれてありがとう',
  'system_notice.thank_you_support.body':
    'TREKをインストールしてくれて、ちょっとお礼を言わせてください。本当に、心から嬉しいです。\n\n私は一人で開発をしていて、TREKは空いた時間に作っています。もともとは自分の旅のためだけの小さなツールでしたが、それ以来コミュニティから寄せられる応援や関心に、正直なところ圧倒されています。TREKは私自身がたくさんの思いを込めて作っていますが、それと同時に、形づくるのを手伝ってくれた多くの素晴らしい外部コントリビューターのおかげでもあります。\n\n**TREKはオープンソースで、完全に無料です。そしてこれからもずっと変わりません。有料プランも、サブスクリプションも、隠れた仕掛けも、一切ありません。約束します。**\n\nもしTREKがあなたの役に立っていて、開発を応援したいと思ってもらえたなら、ちょっとしたコーヒー一杯が、これからも作り続ける本当の支えになります。まったく無理はしないでください。でも一杯ごとに、夜なべの作業が続けられます。\n\nここにいてくれて、ありがとう。\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': 'GitHubで100%オープンソース',
  'system_notice.thank_you_support.highlight_free': '永久に無料 — 有料プランは一切なし',
  'system_notice.thank_you_support.highlight_community': 'コミュニティと一緒に作っています',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Ko-fiで応援する',
  'system_notice.pager.prev': '前へ',
  'system_notice.pager.next': '次へ',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '通知{n}へ',
  'system_notice.pager.position': '{total}件中{current}件目',
  'system_notice.release_notes.eyebrow': 'アップデート完了',
  'system_notice.release_notes.headline': 'TREKが自前でできるようになった、3つのこと。',
  'system_notice.release_notes.intro':
    '自前の場所API、出発から到着まで計画できるロードトリップ、そしてあなたの手元に戻ってくる位置情報の履歴。',
  'system_notice.release_notes.features_label': '今回の目玉',
  'system_notice.release_notes.features_aside': 'ほんの一部です',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body':
    '場所APIを自前で運用する、初めてのオープンソース旅行プランナーです。7,360万件の場所を毎月作り直しています。APIキーも利用上限もありません。',
  'system_notice.release_notes.feature_roadtrip_title': 'ロードトリップアドオン',
  'system_notice.release_notes.feature_roadtrip_body':
    'ロードトリップモードは、ドライブそのものを計画します。ルート、距離、運転時間、立ち寄り先まで。アドオンなので、管理者が有効にするまではオフのままです。',
  'system_notice.release_notes.feature_dawarich_title': 'Dawarich連携',
  'system_notice.release_notes.feature_dawarich_body':
    'Google Timelineのセルフホスト版とも言えるDawarichを、TREKの中で読めるようになりました。TREKは読み取るだけで、それ以上のことはしません。書き戻すことは一切ありません。',
  'system_notice.release_notes.footnote': 'ほかにも、TREKのあちこちに細かな変更がたくさん入っています。',
  'system_notice.release_notes.notes_label': 'リリースノート',
  'system_notice.release_notes.note_eyebrow': '開発者より',
  'system_notice.release_notes.note_title': 'あなたがいるから、TREKを作り続けています。',
  'system_notice.release_notes.note_body':
    'TREKは、自分の旅のための小さなツールとして始まりました。もっといい計画の立て方が欲しくて、仕事のあとに書いたものです。それからずっと、大きくなり続けてきました。いま使っていただいている機能のほとんどは、本業のかたわら、深夜や週末、電車の中で作ったものです。こんなもの、誰かが開いてくれる日は来るのだろうか。そうひとりで考えた夜も、何度もありました。',
  'system_notice.release_notes.promise_label': '約束',
  'system_notice.release_notes.promise_lead': 'TREKは、ずっと無料です。',
  'system_notice.release_notes.promise_text':
    'すべての機能も、すべてのアップデートも、すべての人に。有料プランも、サブスクも、隠れた仕掛けもありません。',
  'system_notice.release_notes.note_body_after':
    'そして、あなたが開いてくれました。数か月のうちに、それが何千人にもなりました。スター、バグ報告、私の話せない言語への翻訳、会ったこともない人からのプルリクエスト。今でも毎朝いちばんにリポジトリを確認していますが、まだ少し夢のように感じています。',
  'system_notice.release_notes.note_closing': 'ここにいてくれて、ありがとう。Mauriceより',
  'system_notice.release_notes.support_lead':
    'TREKは無料で、これからもずっと無料です。でも、サーバーやドメイン、数えきれない夜なべはタダではありません。',
  'system_notice.release_notes.support_text':
    'TREKがあなたの旅に欠かせないものになっていたら、コーヒーを一杯おごってください。次のリリースを届ける力になります。',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Ko-fiで応援する',
};
export default system_notice;
