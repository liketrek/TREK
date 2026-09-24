import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'ドキュメント同期',
  'docsync.noProviders': '利用できる連携先がありません',
  'docsync.noProvidersHint': 'インスタンスの管理者が「管理 → アドオン → ドキュメント」で有効にします。',
  'docsync.addProvider': '連携先を接続',
  'docsync.test': '接続をテスト',
  'docsync.connect.optional': '任意',
  'docsync.connected': '接続済み',
  'docsync.chooseFolder': 'フォルダーを選択',
  'docsync.noFolders': 'このインスタンスにはまだ何もありません。',
  'docsync.newFolderPlaceholder': '新しいフォルダー名',
  'docsync.syncNow': '今すぐ同期',
  'docsync.unlink': '接続解除',
  'docsync.confirmUnlink': 'ドキュメントは TREK にも保管先にも残ります。なくなるのは両者の対応付けだけです。',
  'docsync.syncEnabled': '自動で同期',
  'docsync.deletePolicy': 'ドキュメントが削除されたとき',
  'docsync.deleteUnlink': '両方のコピーを残す',
  'docsync.deleteTrash': 'ゴミ箱へ移動する',
  'docsync.conflictPolicy': '両方が変更された場合',
  'docsync.onConflict.manual': '確認する',
  'docsync.onConflict.trek_wins': 'TREK のコピーを残す',
  'docsync.onConflict.provider_wins': '保存先のコピーを残す',
  'docsync.webhookHint':
    'この URL を連携先に貼り付けると、変更がすぐに届きます。設定しない場合、TREK は一定間隔で確認します。',

  // 接続フォームの項目。キーは document_provider_fields の `label` 列に対応し、
  // この列にはテキストではなくキーの末尾だけが入ります。
  'docsync.providerUrl': 'アドレス',
  'docsync.providerApiToken': 'API トークン',
  'docsync.providerApiKey': 'API キー',
  'docsync.providerAppPassword': 'アプリパスワード',
  'docsync.providerAppToken': 'アプリトークン',
  'docsync.providerUsername': 'ユーザー名',
  'docsync.providerPassword': 'パスワード',
  'docsync.providerOrganization': '組織 ID',
  'docsync.providerBasePath': '基準フォルダー',
  'docsync.providerOTP': '二段階認証コード',
  'docsync.allowInsecureTls': '自己署名証明書を許可',

  'docsync.hintPaperlessToken': 'Paperless の「My Profile」で作成します。そのアカウントの権限をすべて引き継ぎます。',
  'docsync.hintPapraKey': 'Papra の「API keys」で作成します。Papra のキーは所属するすべての組織に届きます。',
  'docsync.hintPapraOrg': 'Papra のアドレスバーに表示される org_… の ID です。',
  'docsync.hintNextcloudLogin': 'Nextcloud のログイン名です。メールアドレスではありません。',
  'docsync.hintNextcloudAppPassword':
    '「設定 → セキュリティ → 新しいアプリパスワードを作成」で発行します。アカウントのパスワードは使わないでください。',
  'docsync.hintOpenCloudToken': 'OpenCloud のアプリトークンとして作成します。',
  'docsync.hintBasePath': 'TREK が旅行用フォルダーを探す場所です。既定は /TREK です。',
  'docsync.hintSynologyUrl': 'ポート番号も含めてください。例：https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'この共有フォルダーだけにアクセスできる専用の DSM アカウントが最適です。',
  'docsync.hintSynologyOtp': 'アカウントで二段階認証を使っている場合に、最初の一度だけ必要です。',

  'docsync.linkState.never': 'まだ同期していません',
  'docsync.linkState.ok': '同期済み',
  'docsync.linkState.partial': '一部のみ同期',
  'docsync.linkState.failed': '失敗',
  'docsync.linkState.needs_reauth': '再度サインインしてください',
  'docsync.linkState.scope_lost': 'フォルダーが見つかりません',
  'docsync.linkState.orphaned': '所有者が旅行から抜けました',

  'docsync.state.pending': '待機中',
  'docsync.state.synced': '同期済み',
  'docsync.state.conflict': '競合',
  'docsync.state.rejected_type': '許可されていない形式',
  'docsync.state.too_large': 'サイズ超過',
  'docsync.state.error': 'エラー',
  'docsync.state.remote_missing': '連携先に見つかりません',
  'docsync.state.local_deleted': 'TREK で削除済み',
  'docsync.state.scope_drift': 'フォルダー外へ移動',

  'docsync.conflict.resolve': "{count} 件を解決",

  'docsync.conflict.title': '両方のコピーが変更されました',
  'docsync.conflict.keepTrek': 'TREK のバージョンを残す',
  'docsync.conflict.keepProvider': '連携先のバージョンを残す',
  'docsync.conflict.keepBoth': '両方を残す',

  // 失敗の理由はコードとして扱い、連携先の文面をそのまま出しません。相手は英語で
  // 応答したり、プロキシのログイン画面の HTML を返したりするためです。
  'docsync.error.unreachable': '連携先に接続できませんでした。',
  'docsync.error.tls_untrusted':
    '証明書が拒否されました。このインスタンスを信頼できる場合は、自己署名証明書を許可してください。',
  'docsync.error.unauthorized': '認証情報が拒否されました。',
  'docsync.error.forbidden': 'このアカウントにはその権限がありません。',
  'docsync.error.not_found': '連携先に見つかりませんでした。',
  'docsync.error.scope_missing': '接続されたフォルダーはすでに存在しません。',
  'docsync.error.rate_limited': '連携先が要求を制限しています。TREK が後でもう一度試します。',
  'docsync.error.too_large': 'このファイルは連携先が受け付けるサイズを超えています。',
  'docsync.error.unsupported_type': '連携先はこのファイル形式を受け付けません。',
  'docsync.error.quota_exceeded': '連携先の空き容量がありません。',
  'docsync.error.conflict': 'このドキュメントは両方で変更されました。',
  'docsync.error.checksum_mismatch': '転送が完全な形で届きませんでした。',
  'docsync.error.provider_error': '連携先がエラーを返しました。',
  'docsync.error.timeout': '連携先の応答に時間がかかりすぎました。',
  'docsync.error.ssrf_blocked': 'このアドレスは許可されていません。',
  'docsync.error.mass_delete_guard':
    '多数のドキュメントが一度に消えたため、何も変更しませんでした。フォルダーがまだマウントされているか確認してください。',
  'docsync.error.unknown': '問題が発生しました。',

  // ── ダイアログ ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'この旅行',
  'docsync.addAnother': '別の連携先を追加',
  'docsync.syncing': '同期中',
  'docsync.card.pickFolder': '接続済み。フォルダーを選んでください',

  'docsync.empty.title': 'まだ何も接続されていません',
  'docsync.empty.hintOwner':
    '左から保管先を選んでください。TREK はすべてのコピーを自分で持つので、保管先がなくなっても失われるものはありません。',
  'docsync.empty.hintMember': 'この設定は旅行の所有者が行います。どちらにしてもドキュメントは TREK に残ります。',

  // それぞれの製品が何を単位に整理するか。接続する前に表示します。次の画面で
  // 聞かれるのがまさにこれだからです。
  'docsync.model.paperless': 'タグで整理',
  'docsync.model.papra': '組織の中でタグごとに整理',
  'docsync.model.nextcloud': 'フォルダーで整理',
  'docsync.model.opencloud': 'スペースで整理',
  'docsync.model.synologydrive': 'NAS 上のフォルダーで整理',

  // ── フローバー ─────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': '保管先へ',
  'docsync.flow.toTrek': '保管先から',
  'docsync.flow.documents': 'ドキュメント',
  'docsync.flow.summary.both': 'ドキュメントは双方向に流れます。',
  'docsync.flow.summary.pull': 'ドキュメントは取り込むだけです。',
  'docsync.flow.summary.push': 'ドキュメントは送り出すだけです。',
  'docsync.flow.summaryEditable.both': '双方向に流れています。レーンをタップすると止まります。',
  'docsync.flow.summaryEditable.pull': '取り込むだけです。もう一方のレーンをタップすると送信も行います。',
  'docsync.flow.summaryEditable.push': '送り出すだけです。もう一方のレーンをタップすると取り込みも行います。',

  // ── ひとつの対応付け ───────────────────────────────────────────────────────
  'docsync.binding.settings': '設定',
  'docsync.binding.folder': 'フォルダー',
  'docsync.binding.lastRun': '最終実行',
  'docsync.binding.autoOff': '一時停止中',
  'docsync.binding.neverRun': '未実行',
  'docsync.binding.deleteHint': 'もう一方に残るコピーをどう扱うかです。',
  'docsync.binding.conflictHint': '両方で編集された文書のうち、どちらのコピーを残すか。',
  'docsync.binding.autoHint': 'バックグラウンドで変更を確認します。',
  'docsync.binding.webhookTitle': '即時更新',
  'docsync.binding.copy': 'コピー',
  'docsync.binding.copied': 'コピーしました',

  // ── 接続 ───────────────────────────────────────────────────────────────────
  'docsync.connect.submit': '接続',
  'docsync.connect.testing': '接続を確認しています',
  'docsync.connect.okAs': '接続できました。{account} としてサインインしています',
  'docsync.connect.insecureHint': '自己署名証明書を使う、自分のネットワーク上のインスタンス向けです。',
  'docsync.connect.about.paperless': 'TREK はこの旅行を専用のタグで管理し、アーカイブのほかの部分には触れません。',
  'docsync.connect.about.papra': 'この旅行が属する組織を選びます。TREK はその中に専用のタグを作って管理します。',
  'docsync.connect.about.nextcloud':
    'アカウントのパスワードではなくアプリパスワードを使ってください。二段階認証があっても使えて、単独で失効できます。',
  'docsync.connect.about.opencloud': 'TREK はこの旅行のために専用のスペースを持ち、ほかとは分けて扱います。',
  'docsync.connect.about.synologydrive': 'この旅行で使う共有フォルダーだけにアクセスできる DSM アカウントが最適です。',

  // ── 置き場所を選ぶ ─────────────────────────────────────────────────────────
  'docsync.scope.title': 'この旅行を {provider} のどこに置きますか？',
  'docsync.scope.intro': 'ここに入っているものだけが同期されます。保管先のほかのものは TREK に入りません。',
  'docsync.scope.createTitle': '新しく作る',
  'docsync.scope.createAction': '作成',
  'docsync.scope.pickTitle': 'または既にあるものを使う',
  'docsync.scope.search': '検索',
  'docsync.scope.noMatch': '一致するものがありません。',

  // ── 人が判断する必要があるもの ─────────────────────────────────────────────
  'docsync.issues.title': '確認が必要',
  'docsync.issues.conflict': '両方で変更されました。どちらを残すか選んでください。',
  'docsync.issues.remote_missing': '保管先から消えました。TREK のコピーは残っています。',
  'docsync.issues.rejected_type': 'このファイル形式はここでは許可されていません。',
  'docsync.issues.too_large': '上限を超えています。',
  'docsync.issues.error': '転送できませんでした。',

  'docsync.error.unknown_provider': 'この連携先はこのインスタンスでは利用できません。',
  'docsync.error.provider_disabled': '一時停止中：管理者がこの連携先を無効にしました。再び有効になると同期が再開されます。',
  'docsync.binding.reconnect': '再接続',
};

export default docsync;
