import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': '文件同步',
  'docsync.noProviders': '沒有可用的文件提供者',
  'docsync.noProvidersHint': '執行個體管理員可在「管理 → 擴充套件 → 文件」中啟用這些提供者。',
  'docsync.addProvider': '連接提供者',
  'docsync.test': '測試連線',
  'docsync.connect.optional': '選填',
  'docsync.connected': '已連線',
  'docsync.chooseFolder': '選擇資料夾',
  'docsync.noFolders': '尚未在這個執行個體上找到任何項目。',
  'docsync.newFolderPlaceholder': '新資料夾名稱',
  'docsync.syncNow': '立即同步',
  'docsync.unlink': '中斷連線',
  'docsync.confirmUnlink': '文件會留在 TREK，也會留在儲存庫，只有兩者之間的配對會解除。',
  'docsync.syncEnabled': '自動同步',
  'docsync.deletePolicy': '當文件被刪除時',
  'docsync.deleteUnlink': '兩份都保留',
  'docsync.deleteTrash': '移到回收桶',
  'docsync.conflictPolicy': '當兩邊都有變更時',
  'docsync.onConflict.manual': '詢問我',
  'docsync.onConflict.trek_wins': '保留 TREK 的副本',
  'docsync.onConflict.provider_wins': '保留儲存端的副本',
  'docsync.webhookHint': '把這個 URL 貼到你的提供者，變更就會立刻送達。沒有它，TREK 只會定時檢查。',

  // 連線表單欄位。這些鍵對應 document_provider_fields 的 `label` 欄，
  // 該欄存的是鍵名後綴，而不是文字。
  'docsync.providerUrl': '位址',
  'docsync.providerApiToken': 'API 權杖',
  'docsync.providerApiKey': 'API 金鑰',
  'docsync.providerAppPassword': '應用程式密碼',
  'docsync.providerAppToken': '應用程式權杖',
  'docsync.providerUsername': '使用者名稱',
  'docsync.providerPassword': '密碼',
  'docsync.providerOrganization': '組織 ID',
  'docsync.providerBasePath': '基礎資料夾',
  'docsync.providerOTP': '雙因素驗證碼',
  'docsync.allowInsecureTls': '接受自簽憑證',

  'docsync.hintPaperlessToken': '在 Paperless 的「我的個人資料」中建立。它擁有該帳戶的完整權限。',
  'docsync.hintPapraKey': '在 Papra 的「API 金鑰」中建立。Papra 的金鑰一律能存取你所屬的每一個組織。',
  'docsync.hintPapraOrg': '來自 Papra 網址列的 org_… 識別碼。',
  'docsync.hintNextcloudLogin': '你的 Nextcloud 登入名稱，不是電子郵件地址。',
  'docsync.hintNextcloudAppPassword': '「設定 → 安全性 → 建立新的應用程式密碼」。絕對不要用你的帳戶密碼。',
  'docsync.hintOpenCloudToken': '在 OpenCloud 的應用程式權杖中建立。',
  'docsync.hintBasePath': 'TREK 會在這裡尋找旅行資料夾。預設為 /TREK。',
  'docsync.hintSynologyUrl': '請包含連接埠，例如 https://nas.example.com:5001',
  'docsync.hintSynologyUser': '最好使用一個專用的 DSM 帳戶，只能存取這個共用資料夾。',
  'docsync.hintSynologyOtp': '只有在該帳戶啟用雙因素驗證時才需要，而且只需一次。',

  'docsync.linkState.never': '尚未同步',
  'docsync.linkState.ok': '已同步',
  'docsync.linkState.partial': '部分已同步',
  'docsync.linkState.failed': '失敗',
  'docsync.linkState.needs_reauth': '請重新登入',
  'docsync.linkState.scope_lost': '資料夾已不存在',
  'docsync.linkState.orphaned': '擁有者已離開旅行',

  'docsync.state.pending': '等待中',
  'docsync.state.synced': '已同步',
  'docsync.state.conflict': '衝突',
  'docsync.state.rejected_type': '不允許的類型',
  'docsync.state.too_large': '檔案過大',
  'docsync.state.error': '錯誤',
  'docsync.state.remote_missing': '提供者上找不到',
  'docsync.state.local_deleted': '已在 TREK 中刪除',
  'docsync.state.scope_drift': '已移出資料夾',

  'docsync.conflict.resolve': "處理 {count} 個",

  'docsync.conflict.title': '兩份都有變更',
  'docsync.conflict.keepTrek': '保留 TREK 版本',
  'docsync.conflict.keepProvider': '保留提供者版本',
  'docsync.conflict.keepBoth': '兩份都保留',

  // 失敗原因以代碼傳遞，絕不沿用上游的文字：提供者會用英文回應，
  // 或回傳代理伺服器的 HTML 登入頁，兩者都不該出現在這裡。
  'docsync.error.unreachable': '無法連上提供者。',
  'docsync.error.tls_untrusted': '憑證遭到拒絕。如果你信任這個執行個體，請允許自簽憑證。',
  'docsync.error.unauthorized': '登入資訊遭到拒絕。',
  'docsync.error.forbidden': '這個帳戶沒有執行此操作的權限。',
  'docsync.error.not_found': '在提供者上找不到。',
  'docsync.error.scope_missing': '已連接的資料夾不存在了。',
  'docsync.error.rate_limited': '提供者正在限制我們的請求速率。TREK 稍後會再試。',
  'docsync.error.too_large': '這個檔案超過提供者接受的大小。',
  'docsync.error.unsupported_type': '提供者不接受這種檔案類型。',
  'docsync.error.quota_exceeded': '提供者的空間已用盡。',
  'docsync.error.conflict': '這份文件在兩邊都有變更。',
  'docsync.error.checksum_mismatch': '傳輸過程中檔案未完整送達。',
  'docsync.error.provider_error': '提供者回報了一個錯誤。',
  'docsync.error.timeout': '提供者回應逾時。',
  'docsync.error.ssrf_blocked': '不允許這個位址。',
  'docsync.error.mass_delete_guard': '大量文件同時消失，因此沒有做任何變更。請確認資料夾仍然掛載中。',
  'docsync.error.unknown': '發生錯誤。',

  // ── 對話框 ─────────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': '這趟旅行',
  'docsync.addAnother': '再新增一個',
  'docsync.syncing': '同步中',
  'docsync.card.pickFolder': '已連線，請選擇資料夾',

  'docsync.empty.title': '尚未連接任何項目',
  'docsync.empty.hintOwner': '請在左邊挑一個儲存庫。TREK 會自己留一份副本，就算那邊消失了也不會遺失任何東西。',
  'docsync.empty.hintMember': '這由旅行的擁有者設定。無論如何，文件都會留在 TREK。',

  // 各產品的歸檔方式。在任何人連線之前就會顯示，
  // 因為下一個畫面正是要問這些。
  'docsync.model.paperless': '以標籤歸檔',
  'docsync.model.papra': '在組織內以標籤歸檔',
  'docsync.model.nextcloud': '歸檔在資料夾中',
  'docsync.model.opencloud': '歸檔在空間中',
  'docsync.model.synologydrive': '歸檔在 NAS 的資料夾中',

  // ── 流向列 ─────────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': '送往儲存庫',
  'docsync.flow.toTrek': '來自儲存庫',
  'docsync.flow.documents': '份文件',
  'docsync.flow.summary.both': '文件雙向傳送。',
  'docsync.flow.summary.pull': '文件只會傳入。',
  'docsync.flow.summary.push': '文件只會傳出。',
  'docsync.flow.summaryEditable.both': '正在雙向傳送。點一下任一方向可停用。',
  'docsync.flow.summaryEditable.pull': '只會傳入。點另一個方向也可傳出。',
  'docsync.flow.summaryEditable.push': '只會傳出。點另一個方向也可傳入。',

  // ── 單一配對 ───────────────────────────────────────────────────────────────
  'docsync.binding.settings': '設定',
  'docsync.binding.folder': '資料夾',
  'docsync.binding.lastRun': '上次執行',
  'docsync.binding.autoOff': '已暫停',
  'docsync.binding.neverRun': '尚未執行',
  'docsync.binding.deleteHint': '另一邊那份副本會怎麼處理。',
  'docsync.binding.conflictHint': '當文件在兩邊都被修改時，保留哪一份副本。',
  'docsync.binding.autoHint': '在背景檢查是否有變更。',
  'docsync.binding.webhookTitle': '即時更新',
  'docsync.binding.copy': '複製',
  'docsync.binding.copied': '已複製',

  // ── 連線 ───────────────────────────────────────────────────────────────────
  'docsync.connect.submit': '連接',
  'docsync.connect.testing': '正在嘗試連線',
  'docsync.connect.okAs': '已連上，登入身分為 {account}',
  'docsync.connect.insecureHint': '適用於你自己網路上、使用自簽憑證的執行個體。',
  'docsync.connect.about.paperless': 'TREK 會把這趟旅行歸在自己的標籤下，不會動到你封存的其他內容。',
  'docsync.connect.about.papra': '選擇這趟旅行所屬的組織。TREK 會在其中以自己的標籤歸檔。',
  'docsync.connect.about.nextcloud': '請用應用程式密碼，不要用帳戶密碼：它不受雙因素驗證影響，也可以單獨撤銷。',
  'docsync.connect.about.opencloud': 'TREK 會為這趟旅行取得專屬的空間，與其他內容分開。',
  'docsync.connect.about.synologydrive': '最好使用只能存取這趟旅行所用共用資料夾的 DSM 帳戶。',

  // ── 挑選容器 ───────────────────────────────────────────────────────────────
  'docsync.scope.title': '這趟旅行要放在 {provider} 的哪裡？',
  'docsync.scope.intro': '只有放在這裡面的內容會同步。儲存庫裡的其他東西都不會進入 TREK。',
  'docsync.scope.createTitle': '建立新的',
  'docsync.scope.createAction': '建立',
  'docsync.scope.pickTitle': '或使用你已經有的',
  'docsync.scope.search': '搜尋',
  'docsync.scope.noMatch': '沒有符合的項目。',

  // ── 需要人來決定的事 ───────────────────────────────────────────────────────
  'docsync.issues.title': '需要查看',
  'docsync.issues.conflict': '兩邊都有變更。請選擇要保留哪一份。',
  'docsync.issues.remote_missing': '已從儲存庫消失。TREK 的副本還在。',
  'docsync.issues.rejected_type': '這裡不允許這種檔案類型。',
  'docsync.issues.too_large': '超過大小限制。',
  'docsync.issues.error': '傳輸沒有完成。',

  'docsync.error.unknown_provider': '這個提供者在此執行個體上無法使用。',
  'docsync.error.provider_disabled': '已暫停：管理員已停用此提供者。重新啟用後會繼續同步。',
};

export default docsync;
