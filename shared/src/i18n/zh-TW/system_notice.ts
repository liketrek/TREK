import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': '歡迎使用 TREK',
  'system_notice.welcome_v1.body':
    '您的全方位旅遊規劃器。建立行程、與朋友分享旅遊，隨時保持條理分明——無論線上或離線皆可。',
  'system_notice.welcome_v1.cta_label': '規劃行程',
  'system_notice.welcome_v1.hero_alt': '風景優美的旅遊目的地與 TREK 介面',
  'system_notice.welcome_v1.highlight_plan': '逐日行程規劃',
  'system_notice.welcome_v1.highlight_share': '與旅伴協作規劃',
  'system_notice.welcome_v1.highlight_offline': '行動裝置支援離線使用',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': '感謝你使用 TREK',
  'system_notice.thank_you_support.body':
    '想簡單地對你說聲謝謝——謝謝你安裝了 TREK，這對我來說真的意義重大。\n\n我是一名獨立開發者，利用業餘時間打造 TREK。它最初只是我為自己的旅行做的一個小工具，而自那以後社群給予的支持與關注，老實說讓我感到無比驚喜。TREK 是我傾注了許多心血做出來的——但也要感謝許多了不起的外部貢獻者，是他們一起塑造了它。\n\n**TREK 是開源且完全免費的——而且永遠都會如此。沒有付費方案，沒有訂閱，沒有任何附加條件。我保證。**\n\n如果 TREK 對你有幫助，而你願意支持它的開發，一杯小小的咖啡真的能幫助我繼續做下去——完全不必有任何壓力，但每一杯都讓那些熬夜的時光更有動力。\n\n謝謝你來到這裡。\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '在 GitHub 上 100% 開源',
  'system_notice.thank_you_support.highlight_free': '永遠免費 — 絕無任何付費方案',
  'system_notice.thank_you_support.highlight_community': '與社群一起攜手打造',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': '在 Ko-fi 上支持我',
  'system_notice.pager.prev': '上一則通知',
  'system_notice.pager.next': '下一則通知',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': '前往通知 {n}',
  'system_notice.pager.position': '通知 {current}/{total}',
  'system_notice.v3_photos.title': '3.0 版相片已移至',
  'system_notice.v3_photos.body':
    '行程規劃器中的​**相片**標籤已被移除。您的相片安全— TREK 從未修改您的 Immich 或 Synology 相簿。\n\n相片現在位於 **Journey** 附加元件中。Journey 為選用 — 若尚未啟用，請聯絡管理員於 Admin → 附加元件 中開啟。',
  'system_notice.v3_journey.title': '認識 Journey — 旅行日記',
  'system_notice.v3_journey.body': '將您的旅程記錄為具有時間軸、相片畫庫與互動地圖的豐富旅行故事。',
  'system_notice.v3_journey.cta_label': '開啟 Journey',
  'system_notice.v3_journey.highlight_timeline': '每日時間軸與畫庫',
  'system_notice.v3_journey.highlight_photos': '從 Immich 或 Synology 匯入',
  'system_notice.v3_journey.highlight_share': '公開分享 — 無需登入',
  'system_notice.v3_journey.highlight_export': '匯出為 PDF 相簿书',
  'system_notice.v3_features.title': '3.0 版更多亮點',
  'system_notice.v3_features.body': '這個版本還有一些其他專項值得了解。',
  'system_notice.v3_features.highlight_dashboard': '行動先行儀表板重設計',
  'system_notice.v3_features.highlight_offline': '作為 PWA 的完整離線模式',
  'system_notice.v3_features.highlight_search': '地點搜尋即時自動補全',
  'system_notice.v3_features.highlight_import': '從 KMZ/KML 檔案匯入地點',
  'system_notice.v3_mcp.title': 'MCP：OAuth 2.1 升級',
  'system_notice.v3_mcp.body':
    'MCP 整合已全面重構。OAuth 2.1 現為建議的身份驗證方式。靜態令牌（trek_…）已棄用，將於未來版本移除。',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 建議（mcp-remote）',
  'system_notice.v3_mcp.highlight_scopes': '24 個細粒度權限範圍',
  'system_notice.v3_mcp.highlight_deprecated': '靜態 trek_ 令牌已棄用',
  'system_notice.v3_mcp.highlight_tools': '擴展工具集與提示詞',
  'system_notice.v3_thankyou.title': '來自我的一封私人信',
  'system_notice.v3_thankyou.body':
    '在你繼續之前——我想停下來說幾句。\n\nTREK 最初只是我為自己的旅行而做的一個業餘專案。我從未想過它會成長為 4,000 人信賴的冒險規劃工具。每一顆星標、每一個 issue、每一個功能請求——我都會讀，它們在全職工作和大學學業之間的深夜裡支撐著我繼續前行。\n\n我想讓你們知道：TREK 將永遠開源，永遠可自託管，永遠屬於你們。沒有追蹤，沒有訂閱，沒有任何附加條件。只是一個熱愛旅行的人為同樣熱愛旅行的你們打造的工具。\n\n特別感謝 [jubnl](https://github.com/jubnl)——你已經成為一位不可思議的合作者。3.0 版本中許多精彩之處都留下了你的印記。感謝你在這個專案還很粗糙的時候就選擇了相信它。\n\n也感謝你們每一位——回報了 bug、翻譯了文字、向朋友分享了 TREK，或者只是用它規劃了一次旅行——**謝謝你們**。你們是這一切存在的原因。\n\n願我們一起踏上更多的冒險旅程。\n\n— Maurice\n\n---\n\n[加入 Discord 社群](https://discord.gg/7Q6M6jDwzf)\n\n如果 TREK 讓你的旅行更美好，一杯[小小的咖啡](https://ko-fi.com/mauriceboe)能讓這盞燈一直亮著。',
  'system_notice.v3014_whitespace_collision.title': '需要操作：使用者帳戶衝突',
  'system_notice.v3014_whitespace_collision.body':
    '3.0.14 版本升級偵測到一個或多個由儲存帳戶中前後空白字元引發的使用者名稱或電子郵件衝突。受影響的帳戶已自動重新命名。請檢查伺服器日誌中以 **[migration] WHITESPACE COLLISION** 開頭的行，以確認哪些帳戶需要審查。',
};
export default system_notice;
