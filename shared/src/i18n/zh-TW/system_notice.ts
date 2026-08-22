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
  // 4.0.0 release modal — the release on the left, the note from the maintainer on the right
  'system_notice.release_400.eyebrow': '更新已安裝',
  'system_notice.release_400.tag': '發布',
  'system_notice.release_400.headline': 'TREK 有史以來最大的一次更新。',
  'system_notice.release_400.intro':
    'TREK 有了手機端，也有了相簿書。這一版由十九個人寫成——隨之解決的還有大約一百五十個回報過的 bug。',
  'system_notice.release_400.feature_mobile_title': 'TREK 上手機',
  'system_notice.release_400.feature_mobile_body':
    '768px 以下現在是一套獨立的介面——毛玻璃底欄、自己的彈出面板、自己的行程規劃器。用手機開啟 TREK 試試。',
  'system_notice.release_400.feature_studio_title': 'TREK Studio',
  'system_notice.release_400.feature_studio_badge': 'Beta',
  'system_notice.release_400.feature_studio_body':
    'Journey 的 PDF 變成了一個相簿書設計器。你讓它排版，它就把書排好，然後退到一邊。',
  'system_notice.release_400.feature_vacay_title': 'Vacay 補齊了剩下的',
  'system_notice.release_400.feature_vacay_body':
    '半天、補休與彈性假、日曆上的學校假期——還有不必從一月開始的休假年度。',
  'system_notice.release_400.feature_places_title': '地點自己亮相，檔案搬出去',
  'system_notice.release_400.feature_places_body':
    '在你儲存一個地點之前，圖片和描述會自己填好。上傳的檔案也不必再放在 TREK 所在的磁碟上。',
  'system_notice.release_400.footnote':
    '這只是其中四項。4.0.0 還帶來數百項其他改動，從 Collections、Atlas 一直到底層的整個伺服器。',
  'system_notice.release_400.note_eyebrow': '來自維護者的話',
  'system_notice.release_400.note_title': '感謝你使用 TREK。',
  'system_notice.release_400.note_body':
    'TREK 最初只是我為自己的旅行、用業餘時間做的一個小工具。現在依然如此：晚上、週末，全職工作之外的那些時間。\n\n有一陣子只有我一個人。現在不是了——十九個人一起做出了這一版，還有成千上萬的你們帶著星標、issue、翻譯和 pull request 來到這裡。這一切我都心懷感激。',
  'system_notice.release_400.promise_label': '承諾',
  'system_notice.release_400.promise_text': 'TREK 的開源部分永遠免費。沒有付費方案，沒有訂閱，沒有任何套路。我保證。',
  'system_notice.release_400.note_body_after':
    '4.0.0 花掉了好幾個星期的深夜——一個手機端、一個相簿書設計器、一次伺服器遷移，大多寫在午夜到兩點之間。這不是抱怨：我喜歡做這件事。只是想誠實地說明，這麼大的一個版本是怎麼從一個業餘專案裡出來的。',
  'system_notice.release_400.note_closing': '謝謝你來到這裡。',
  'system_notice.release_400.note_signature': '— Maurice',
  'system_notice.release_400.support_text':
    '是這些支持讓它繼續跑著——伺服器、網域，還有那些變成這樣一個版本的深夜。如果 TREK 對你有價值，請我喝杯咖啡是最直接的支持方式。',
  'system_notice.release_400.cta_bmc': 'Buy me a coffee',
  'system_notice.release_400.cta_kofi': '在 Ko-fi 上支持我',
};
export default system_notice;
