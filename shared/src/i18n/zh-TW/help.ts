import type { TranslationStrings } from '../types';

// English fallback until 'zh-TW' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': '此頁面的說明',
  'help.center.title': '說明',
  'help.center.onThisScreen': '關於此頁面',
  'help.center.screens': '頁面',
  'help.center.thisScreen': '目前頁面',
  'help.center.subScreens': '子頁面：{count}',
  'help.center.subScreensLabel': '子頁面',
  'help.center.guidesCount': '{count} 篇指南',
  'help.center.goToScreen': '前往{screen}',
  'help.center.overview': '總覽',
  'help.center.howTo': '如何操作',
  'help.center.searchPlaceholder': '搜尋指南與文件…',
  'help.center.searchEmpty': '找不到與「{query}」相關的內容。',
  'help.center.searchGuides': '指南',
  'help.center.searchDocs': '文件',
  'help.center.searchError': '搜尋目前無法使用。',
  'help.center.back': '返回',
  'help.center.close': '關閉說明',
  'help.center.steps': '{count} 個步驟',
  'help.center.step': '第 {n} 步',
  'help.center.stepsLabel': '步驟',
  'help.center.stepOf': '第 {n} 步，共 {total} 步',
  'help.center.screenshot': '截圖',
  'help.center.result': '結果',
  'help.center.tips': '小提醒',
  'help.center.related': '相關內容',
  'help.center.openDocs': '在「說明與文件」中開啟',
  'help.center.docsSection': '文件',
  'help.center.noContext': '此頁面尚無指南。',
  'help.center.noContextHint': '搜尋文件，或告訴我們您在找什麼。',
  'help.center.feedback': '缺了什麼？',
  'help.center.feedbackLink': '在 GitHub 上告訴我們',
  'help.center.discord': '在 Discord 發問',
  'help.center.quick': '快速',
  'help.center.guide': '指南',
  'help.center.tour': '操作示範',
  'help.center.imageAlt': '「{title}」第 {n} 步',

  // ctx
  'help.ctx.dashboard.title': '儀表板',
  'help.ctx.dashboard.summary':
    '儀表板是所有旅行的入口。頂端的登機證會突顯正在進行或即將出發的旅行，下方那一列統計你已走過的旅程，卡片則列出你正在規劃、已歸檔或已完成的全部旅行。',
  'help.ctx.dashboard.bullet.1': '登機證：正在進行或下一趟旅行，含日期、同行者、地點與倒數計時。點一下即可開啟旅行。',
  'help.ctx.dashboard.bullet.2': '旅行統計：去過的國家、旅行次數、在途天數與飛行距離，彙整你的全部旅行。',
  'help.ctx.dashboard.bullet.3':
    '旅行卡片：依「已規劃」「已歸檔」「已完成」篩選，以格狀或清單顯示。將滑鼠移到卡片上可編輯、複製、歸檔與刪除。',
  'help.ctx.dashboard.bullet.4': '右側小工具：貨幣換算、世界時鐘、即將到來的預訂與收藏集。每一項都可以關閉。',
  'help.ctx.dashboard.bullet.5': '「新建旅行」卡片與右下角的按鈕都能建立新旅行。',

  // create-trip
  'help.guide.create-trip.title': '建立旅行',
  'help.guide.create-trip.goal': '用名稱、日期與封面圖片開始一趟新旅行。',
  'help.guide.create-trip.step.1': '點選「新建旅行」。旅行清單末端的卡片與右下角的按鈕作用相同。',
  'help.guide.create-trip.step.2': '為旅行取個名字。這是唯一的必填欄位，其餘內容都可以稍後補上。',
  'help.guide.create-trip.step.3': '選擇開始與結束日期。TREK 會為每個日期建立一天，行程隨即可以開始填寫。',
  'help.guide.create-trip.step.4': '選填：加入封面圖片。上傳自己的照片、拖曳一張進來，或在 Unsplash 搜尋目的地。',
  'help.guide.create-trip.step.5': '點選「建立新旅行」。',
  'help.guide.create-trip.result': '旅行會出現在儀表板上。如果它是你的下一趟旅行，會顯示在頂端的登機證中。',
  'help.guide.create-trip.tip.1': '日期之後可以修改。如果已有預訂，TREK 會詢問是否連同日程一起移動。',
  'help.guide.create-trip.tip.2': '此處選擇的旅行貨幣是所有費用的換算目標。請選擇目的地的貨幣。',

  // edit-trip
  'help.guide.edit-trip.title': '編輯旅行',
  'help.guide.edit-trip.goal': '重新命名旅行、更改日期或調整設定。',
  'help.guide.edit-trip.step.1': '將滑鼠移到旅行卡片（或登機證）上，點選鉛筆圖示。',
  'help.guide.edit-trip.step.2': '依需要修改：名稱、描述、日期、封面、貨幣、提醒或成員。',
  'help.guide.edit-trip.step.3': '點選「更新」。',
  'help.guide.edit-trip.result': '卡片會立即更新，旅行的每位成員都看得到。',
  'help.guide.edit-trip.tip.1': '移動已有預訂的旅行日期時，會出現第二步，詢問預訂是否一併移動。',

  // cover-image
  'help.guide.cover-image.title': '設定封面圖片',
  'help.guide.cover-image.goal': '為旅行設定一張顯示在卡片與登機證上的圖片。',
  'help.guide.cover-image.step.1': '透過卡片上的鉛筆圖示開啟旅行的編輯表單。',
  'help.guide.cover-image.step.2': '在「封面圖片」處拖入照片、點選上傳，或在 Unsplash 搜尋框輸入目的地。',
  'help.guide.cover-image.step.3': '選擇一張照片，點選「更新」。',
  'help.guide.cover-image.result': '照片會隨旅行一起儲存，並在所有列出該旅行的地方顯示。',
  'help.guide.cover-image.tip.1': '來自 Unsplash 搜尋的照片會自動標註來源；你自己上傳的照片保存在你的伺服器上。',

  // duplicate-trip
  'help.guide.duplicate-trip.title': '複製旅行',
  'help.guide.duplicate-trip.goal': '把一趟旅行當作範本，重複用於新旅行。',
  'help.guide.duplicate-trip.step.1': '將滑鼠移到卡片上，點選複製圖示。',
  'help.guide.duplicate-trip.step.2': '查看哪些內容會被複製、哪些不會，然後確認。',
  'help.guide.duplicate-trip.result': '副本會出現在原旅行旁邊，改個名稱和日期就能使用。',
  'help.guide.duplicate-trip.tip.1':
    '日程、地點、預訂、預算項目、打包清單與每日備註會被複製。成員、聊天、投票、檔案與分享連結不會。',

  // archive-trip
  'help.guide.archive-trip.title': '歸檔與還原旅行',
  'help.guide.archive-trip.goal': '不刪除旅行，只是先收起來，之後再還原。',
  'help.guide.archive-trip.step.1': '將滑鼠移到卡片上，點選「歸檔」。',
  'help.guide.archive-trip.step.2': '把卡片上方的篩選切換為「已歸檔」即可再次看到它。',
  'help.guide.archive-trip.step.3': '點選卡片上的「恢復」，它就會回到「已規劃」。',
  'help.guide.archive-trip.result': '歸檔的旅行保留全部內容，只是不再佔據儀表板與全部旅行的行事曆訂閱。',

  // delete-trip
  'help.guide.delete-trip.title': '刪除旅行',
  'help.guide.delete-trip.goal': '永久刪除一趟旅行。',
  'help.guide.delete-trip.step.1': '將滑鼠移到卡片上，點選垃圾桶圖示。',
  'help.guide.delete-trip.step.2': '確認。對話方塊會顯示旅行名稱，方便你核對。',
  'help.guide.delete-trip.result': '旅行及其日程、地點、預訂與檔案都會被刪除，且無法復原。拿不準的話請改為歸檔。',

  // filter-and-view
  'help.guide.filter-and-view.title': '尋找已完成的旅行，切換格狀與清單',
  'help.guide.filter-and-view.goal': '查看已完成或已歸檔的旅行，並選擇喜歡的版面配置。',
  'help.guide.filter-and-view.step.1':
    '使用卡片上方的「已規劃」「已歸檔」「已完成」。結束日期已過的旅行都屬於「已完成」。',
  'help.guide.filter-and-view.step.2': '點選清單圖示切換為精簡清單，再點一次回到格狀。',
  'help.guide.filter-and-view.result': '儀表板會記住你在此裝置上的版面配置。',

  // calendar-feed
  'help.guide.calendar-feed.title': '在行事曆訂閱全部旅行',
  'help.guide.calendar-feed.goal': '在你的行事曆 App 中查看每趟進行中旅行的日程與預訂，並保持同步。',
  'help.guide.calendar-feed.step.1': '點選檢視切換旁邊的行事曆圖示。',
  'help.guide.calendar-feed.step.2': '點選「Enable calendar subscription」。TREK 會產生一個私密的訂閱連結。',
  'help.guide.calendar-feed.step.3':
    '用按鈕（Google、Apple、Outlook）加入訂閱，或把連結複製到任何支援 URL 訂閱的行事曆 App。',
  'help.guide.calendar-feed.result':
    '每趟進行中的旅行都會顯示在你的行事曆並自動更新。已歸檔的旅行與結束超過 90 天的旅行不包含在內。',
  'help.guide.calendar-feed.tip.1': '連結是私密的，任何取得連結的人都能讀取訂閱；一旦外洩，請在同一對話方塊中撤銷。',

  // widgets
  'help.guide.widgets.title': '選擇儀表板小工具',
  'help.guide.widgets.goal': '顯示或隱藏統計列與右側小工具。',
  'help.guide.widgets.step.1': '開啟右上角的頭像選單，選擇「設定」。',
  'help.guide.widgets.step.2': '切換到「Appearance」分頁。',
  'help.guide.widgets.step.3': '在「Dashboard widgets」下開啟或關閉各個小工具。桌面版與行動版分別設定。',
  'help.guide.widgets.step.4': '回到儀表板，變更立即生效。',
  'help.guide.widgets.result': '隱藏的小工具會把空間讓給旅行；關閉整個右欄後，版面會置中顯示。',
  'help.guide.widgets.link': '開啟外觀設定',

  // currency-widget
  'help.guide.currency-widget.title': '貨幣換算',
  'help.guide.currency-widget.goal': '依目前匯率在兩種貨幣之間換算金額。',
  'help.guide.currency-widget.step.1': '輸入金額並選擇兩種貨幣。',
  'help.guide.currency-widget.step.2': '中間的箭頭交換貨幣組合，圓形箭頭重新整理匯率。',
  'help.guide.currency-widget.result': '貨幣組合會儲存在你的帳號中，在每台裝置上都一致。',
  'help.guide.currency-widget.tip.1': '匯率來自歐洲中央銀行，每天更新一次。',

  // timezones-widget
  'help.guide.timezones-widget.title': '新增世界時鐘',
  'help.guide.timezones-widget.goal': '隨時掌握目的地的當地時間。',
  'help.guide.timezones-widget.step.1': '點選「時區」小工具中的 +，搜尋一個城市。',
  'help.guide.timezones-widget.step.2': '點選時鐘旁邊的 × 即可移除。',
  'help.guide.timezones-widget.result': '時鐘會隨你的帳號一起儲存。',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay 是你的個人休假規劃工具：一年有多少假、已登記哪些天、還剩多少。格線一覽整年；側欄包含年份選擇、一起規劃的人、與你分享的行事曆、圖例和你的假期額度。',
  'help.ctx.vacay.bullet.1':
    '年度格線：十二張月卡片，每天一格。點一下某天即可登記或清除。小藍點標記已有旅行涵蓋的日子。',
  'help.ctx.vacay.bullet.2':
    '底部工具列：「休假」或「公司假日」模式，加上改變點擊登記內容的「半天」與「補休 / 彈性」開關。',
  'help.ctx.vacay.bullet.3': '「年假額度」：本年的天數、已用與剩餘，含前一期間的結轉。',
  'help.ctx.vacay.bullet.4': '「成員」是與你的計畫合併的人，各有自己的顏色。「共享的日曆」以唯讀圓環顯示他人的休假日。',
  'help.ctx.vacay.bullet.5':
    '「設定」涵蓋週末、每週起始日、結轉、你的休假年度、公司假日，以及公共假日或學校假期行事曆。',
  // log-day
  'help.guide.log-day.title': '登記一個休假日',
  'help.guide.log-day.goal': '在年度格線標記一天休假，並看到餘額隨之變化。',
  'help.guide.log-day.step.1': '看底部工具列：帶你顏色的左側按鈕代表點一下就會為你登記一個休假日。',
  'help.guide.log-day.step.2': '在任一月卡片點某一天。它會填上你的顏色，「已用」多一天。',
  'help.guide.log-day.step.3': '再點同一天即可清除。',
  'help.guide.log-day.result': '該日已登記，「天」「已用」「剩餘」立即更新，與你合併計畫的人都能即時看到。',
  'help.guide.log-day.tip.1': '「設定」中「鎖定週末」開啟時，週末無法登記。',
  'help.guide.log-day.tip.2': '格子裡的藍點表示你的某次旅行涵蓋那天，這樣能看到休假與旅行重疊之處。',
  // half-day
  'help.guide.half-day.title': '登記半天',
  'help.guide.half-day.goal': '只休一個下午，而不花掉一整天額度。',
  'help.guide.half-day.step.1': '在工具列開啟「半天」。橘色圓點就是半天在格線中的標記。',
  'help.guide.half-day.step.2': '點某一天。它登記為 0.5，角落帶有橘色圓點。',
  'help.guide.half-day.step.3': '完成後關閉「半天」；用不同設定點半天會就地轉換。',
  'help.guide.half-day.result': '「已用」增加 0.5。「半天」與「補休 / 彈性」彼此獨立，所以也能登記半天補休。',
  'help.guide.half-day.tip.1': '工具列永遠顯示下一次點擊將放置的標記，登記前可先確認。',
  // comp-day
  'help.guide.comp-day.title': '登記補休或彈性時間',
  'help.guide.comp-day.goal': '使用不消耗假期額度的補休。',
  'help.guide.comp-day.step.1': '在工具列開啟「補休 / 彈性」。斜線圓盤就是補休日在格線中的樣子。',
  'help.guide.comp-day.step.2': '點某一天。它以你顏色的斜線填滿，而非實色方塊。',
  'help.guide.comp-day.result': '補休日在額度方塊旁另行統計，永不減少「剩餘」。',
  'help.guide.comp-day.tip.1': '補回的加班、彈性工時、補休日：凡是休息但不算休假的都屬於這裡。',
  // entitlement
  'help.guide.entitlement.title': '設定假期額度',
  'help.guide.entitlement.goal': '告訴 Vacay 你一年有多少休假天數。',
  'help.guide.entitlement.step.1': '在側欄「年假額度」下點「天」方塊。',
  'help.guide.entitlement.step.2': '輸入天數並按 Enter。',
  'help.guide.entitlement.result': '「剩餘」由額度、結轉（如有）與已用天數重新計算。',
  'help.guide.entitlement.tip.1': '每年各有額度，此處變更只影響所選年份。',
  // years
  'help.guide.years.title': '新增與切換年份',
  'help.guide.years.goal': '提前規劃明年，或回顧去年。',
  'help.guide.years.step.1': '點年份右側的 + 新增下一年，或左側的 + 新增上一年。',
  'help.guide.years.step.2': '用箭頭或下方的年份標籤切換年份。',
  'help.guide.years.step.3': '要刪除年份，將滑鼠移到其標籤上並點小減號。該年的登記會一併刪除，請謹慎確認。',
  'help.guide.years.result': '每年保留各自的額度與登記；結轉把它們連接起來。',
  // company-holidays
  'help.guide.company-holidays.title': '標記公司假日',
  'help.guide.company-holidays.goal': '封鎖全公司休息的日子，不消耗任何人的額度。',
  'help.guide.company-holidays.step.1':
    '開啟「設定」，確認「公司假日」已開啟。預設開啟；只有開啟時工具列才提供該模式。',
  'help.guide.company-holidays.step.2': '回到格線，把工具列切換到「公司假日」模式。',
  'help.guide.company-holidays.step.3': '點選相應日期。它們變為琥珀色並出現在圖例中。',
  'help.guide.company-holidays.result': '公司假日對所有合併計畫的人可見，且永不減少「剩餘」。',
  'help.guide.company-holidays.tip.1': '任何已合併的成員都能編輯公司假日，請約定由誰維護。',
  // public-holidays
  'help.guide.public-holidays.title': '顯示公共假日',
  'help.guide.public-holidays.goal': '把你所在國家或地區的公共假日放到格線上。',
  'help.guide.public-holidays.step.1': '開啟「設定」並開啟「公共假日」。',
  'help.guide.public-holidays.step.2': '點「新增日曆」，選擇國家，必要時再選地區。可選擇設定顏色與標籤。',
  'help.guide.public-holidays.step.3': '關閉「設定」。假日出現在格線與圖例中。',
  'help.guide.public-holidays.result': '公共假日以行事曆顏色標記，永不計入你的額度。',
  'help.guide.public-holidays.tip.1': '可以新增多個行事曆，例如你自己的地區和已合併同事的地區。',
  // school-holidays
  'help.guide.school-holidays.title': '顯示學校假期',
  'help.guide.school-holidays.goal': '把所在地區的學校假期與自己的休假並排查看。',
  'help.guide.school-holidays.step.1': '開啟「設定」並開啟「School Holidays」。',
  'help.guide.school-holidays.step.2': '點「新增日曆」並選擇國家。若該國按地區劃分，請再選地區或群組。',
  'help.guide.school-holidays.step.3': '關閉「設定」。每段假期在其日期底部顯示彩色條帶。',
  'help.guide.school-holidays.result': '學校假期僅供顯示，不會減少任何人的額度。',
  'help.guide.school-holidays.tip.1': '缺少地區？管理員可在「管理」、「配置」、「學校假期」中手動維護。',
  // weekends
  'help.guide.weekends.title': '鎖定週末並設定每週起始日',
  'help.guide.weekends.goal': '把週末排除在統計之外，並從你習慣的那天開始一週。',
  'help.guide.weekends.step.1': '開啟「設定」。',
  'help.guide.weekends.step.2': '開啟「鎖定週末」，並選擇哪些天算作你的週末。',
  'help.guide.weekends.step.3': '在「每週開始於」選擇週一或週日。',
  'help.guide.weekends.result': '被封鎖的日子在格線中顯示為灰色，無法誤登記。',
  // leave-year
  'help.guide.leave-year.title': '設定休假年度',
  'help.guide.leave-year.goal': '依會計年度或到職日計算額度，而不是一月到十二月。',
  'help.guide.leave-year.step.1': '開啟「設定」並找到「休假年度」。',
  'help.guide.leave-year.step.2': '選擇「日曆年」、「會計年度」（指定起始月日）或「到職日」（指定到職日期）。',
  'help.guide.leave-year.result': '額度、已用天數與結轉都依該期間計算，格線從其第一個月開始。',
  'help.guide.leave-year.tip.1': '此設定是個人的：在合併計畫中，每個人保留自己的休假年度與數字。',
  // carry-over
  'help.guide.carry-over.title': '結轉未用天數',
  'help.guide.carry-over.goal': '把期間末剩餘的天數加到下一期。',
  'help.guide.carry-over.step.1': '開啟「設定」。',
  'help.guide.carry-over.step.2': '開啟「結轉」。',
  'help.guide.carry-over.result': '結轉數量會在所有年份重新計算，並顯示在額度下方。',
  'help.guide.carry-over.tip.1': '關閉後所有結轉餘額歸零。',
  // invite
  'help.guide.invite.title': '與他人共同規劃',
  'help.guide.invite.goal': '與另一位 TREK 使用者合併計畫，在同一格線中看到彼此的休假。',
  'help.guide.invite.step.1': '點「成員」面板中的人形圖示。',
  'help.guide.invite.step.2': '選擇使用者並送出邀請。',
  'help.guide.invite.step.3': '對方收到通知並接受。在此之前邀請顯示為待處理。',
  'help.guide.invite.result': '兩個計畫合併：每人一種顏色，可以互相登記休假，一切即時同步。',
  'help.guide.invite.tip.1': '要撤銷合併，請使用「設定」中的「解除合併」。每個人的登記會回到自己的計畫。',
  'help.guide.invite.tip.2': '如果對方只需查看你的休假，請分享行事曆而非合併。',
  // share-calendar
  'help.guide.share-calendar.title': '以唯讀方式分享行事曆',
  'help.guide.share-calendar.goal': '讓別人看到你何時休假，而不給他們修改你計畫的權限。',
  'help.guide.share-calendar.step.1': '點「共享的日曆」面板中的分享圖示。',
  'help.guide.share-calendar.step.2': '選擇使用者並點「共享」。無需對方接受。',
  'help.guide.share-calendar.step.3': '與你分享的行事曆出現在同一面板；眼睛圖示可隱藏，「停止共享」撤銷你的分享。',
  'help.guide.share-calendar.result': '你的休假以彩色圓環顯示在對方格線中。你分享的內容對方無法編輯。',
  'help.guide.share-calendar.tip.1': '分享與合併彼此獨立：可以與一人合併，同時與其他人分享。',
  'help.guide.share-calendar.tip.2': '將滑鼠移到帶圓環的日子上，即可查看誰休假以及休多久。',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas 是你在世界地圖上的旅行足跡：每個旅行帶你去過的國家都會上色，在使用 TREK 之前去過的國家可以手動加入。放大可以看到地區，把還想去的地方記在心願單裡，並在底部的玻璃面板中查看你的數字。',
  'help.ctx.atlas.bullet.1':
    '地圖：已訪問的國家帶有專屬且不變的顏色，計劃中的國家是虛線輪廓，心願單裡的國家是斜線填滿，其餘都是灰色。將滑鼠移到國家上可查看它的旅行、地點以及首次和最近一次到訪。',
  'help.ctx.atlas.bullet.2':
    '頂部搜尋：輸入國家或地點。選一個國家，地圖會飛過去並開啟它的彈出視窗；選一個地點，會落在它所在的地區，方便你標記那裡。',
  'help.ctx.atlas.bullet.3':
    '右上角的「顯示計劃中的國家」：顯示你即將出發的旅行所涉及的國家。這個開關只在你有這類旅行時才出現。',
  'help.ctx.atlas.bullet.4':
    '底部面板：「統計」分頁有國家、旅行、地點、城市、天數、各大洲和你的連續紀錄；「心願單」分頁列出還在前方等你的地方。',
  'help.ctx.atlas.bullet.5': '地區：從縮放層級 5 起，地圖切換為州和省，每一個都可點選來標記或取消標記。',
  'help.ctx.atlas.bullet.6':
    'Dawarich：連接該擴充套件後，統計左側會出現一個面板，根據你的記錄勾掉心願並加入國家，但絕不會未經你確認就執行。',
  // mark-country
  'help.guide.mark-country.title': '將國家標記為已訪問',
  'help.guide.mark-country.goal': '加入一個你在使用 TREK 之前去過的國家，讓地圖和計數把它算進去。',
  'help.guide.mark-country.step.1': '在地圖頂部的搜尋框中輸入國家名稱。',
  'help.guide.mark-country.step.2': '從清單中選擇它。地圖飛過去，並為該國開啟一個彈出視窗。',
  'help.guide.mark-country.step.3': '選擇「標記為已訪問」。',
  'help.guide.mark-country.result':
    '該國在地圖上獲得自己的顏色，「國家」計數加一。這個顏色是永久的：再標記其他國家也不會打亂其餘國家的顏色。',
  'help.guide.mark-country.tip.1': '在地圖上點選灰色國家會開啟同一個彈出視窗；對小國來說，搜尋是最可靠的入口。',
  'help.guide.mark-country.tip.2': '手動標記的國家始終算作已訪問，不管前往那裡的旅行日期為何。',
  // unmark-country
  'help.guide.unmark-country.title': '移除你標記過的國家',
  'help.guide.unmark-country.goal': '把手動標記的國家再從地圖上拿掉。',
  'help.guide.unmark-country.step.1':
    '搜尋該國並選擇它，或在地圖上點選它。對於你自己標記的國家，彈出視窗會問是否移除。',
  'help.guide.unmark-country.step.2': '點選「移除」確認。',
  'help.guide.unmark-country.result': '該國變回灰色，並從你的計數中消失。',
  'help.guide.unmark-country.tip.1':
    '只有手動標記的國家才能這樣移除。有旅行或地點的國家會一直保留，直到這些旅行或地點不在為止；如果國家是手動標記的，面板裡它的詳細資料卡片上也有「移除」。',
  // country-details
  'help.guide.country-details.title': '查看你在某個國家做過什麼',
  'help.guide.country-details.goal': '開啟一個已訪問的國家，跳到帶你去那裡的旅行。',
  'help.guide.country-details.step.1': '搜尋一個你訪問過的國家。',
  'help.guide.country-details.step.2':
    '選擇它。地圖飛過去，底部面板會多出一張卡片，帶有國旗、地點、旅行以及每次旅行一個標籤。',
  'help.guide.country-details.result': '點選旅行標籤即可在規劃器中開啟那次旅行。',
  'help.guide.country-details.tip.1': '在地圖上將滑鼠移到該國會顯示同樣的數字，外加首次和最近一次到訪。',
  // planned-countries
  'help.guide.planned-countries.title': '顯示你即將前往的國家',
  'help.guide.planned-countries.goal': '把即將出發的旅行所涉及的國家放到地圖上，但不把它們算作已訪問。',
  'help.guide.planned-countries.step.1': '開啟右上角的「顯示計劃中的國家」。旁邊的數字是有多少個國家在等你。',
  'help.guide.planned-countries.step.2':
    '搜尋一個計劃中的國家並選擇它：面板會顯示「計劃中」，地圖提示會顯示你何時出發。',
  'help.guide.planned-countries.result':
    '計劃中的國家以虛線輪廓顯示，所以永遠不會看起來像你已經去過的地方。開關會記住你的選擇。',
  'help.guide.planned-countries.tip.1':
    '前往某國的旅行一旦開始，該國就算作已訪問；進行中的旅行也算。沒有日期的旅行完全不進入統計。',
  'help.guide.planned-countries.tip.2': '這個開關只在你有即將出發的旅行時才存在。',
  // regions
  'help.guide.regions.title': '標記地區',
  'help.guide.regions.goal': '比國家更細：標記你去過的州、省或縣。',
  'help.guide.regions.step.1': '放大一個國家，直到它的地區出現，從縮放層級 5 起。搜尋並選擇該國就能飛到夠近的位置。',
  'help.guide.regions.step.2': '點選一個地區。將滑鼠移上去會顯示它的名稱；彈出視窗顯示該地區及其所屬國家。',
  'help.guide.regions.step.3': '選擇「標記為已訪問」。',
  'help.guide.regions.result': '該地區填上其國家的顏色。標記地區時，如果該國尚未算作已訪問，也會一併算上。',
  'help.guide.regions.tip.1': '點選已訪問的地區會提供「移除」，無論是你標記的，還是某個地點讓它變成已訪問的。',
  'help.guide.regions.tip.2': '你有真實地點的地區會自動標記；那裡不需要操作。',
  // search-place
  'help.guide.search-place.title': '尋找地點並標記它所在的地區',
  'help.guide.search-place.goal': '透過搜尋米蘭來標記倫巴底，不需要知道某座城市屬於哪個地區。',
  'help.guide.search-place.step.1':
    '在搜尋框中輸入城市、地標或地址。國家排在最前；相符的地點顯示在它們下方的「地點」標題下。',
  'help.guide.search-place.step.2': '選擇該地點。地圖飛過去，並判斷這個點位於哪個地區。',
  'help.guide.search-place.step.3': '為該地區選擇「標記為已訪問」，或者如果它還在你的前方，選擇「新增到心願單」。',
  'help.guide.search-place.result':
    '該地區被標記，它所屬的國家也一併標記。地圖資料包中沒有地區資料的國家會退回到國家本身。',
  'help.guide.search-place.tip.1': '地點來自與 TREK 其他地方相同的搜尋，因此遵循管理員設定的供應商。',
  // bucket-country
  'help.guide.bucket-country.title': '把國家放進心願單',
  'help.guide.bucket-country.goal': '直接在地圖上維護一份想去國家的心願單，與你去過的國家分開。',
  'help.guide.bucket-country.step.1': '搜尋該國並選擇它，或在地圖上點選它。',
  'help.guide.bucket-country.step.2': '選擇「新增到心願單」。',
  'help.guide.bucket-country.step.3': '如果已經知道時間，就選一個月份和年份，然後點選「新增到心願單」確認。',
  'help.guide.bucket-country.result':
    '該國以斜線填滿繪製，顏色就是你抵達後它將擁有的顏色，並出現在面板的「心願單」分頁中。',
  'help.guide.bucket-country.tip.1': '國家進入心願單後，同一個彈出視窗會提供「從心願單移除」。',
  'help.guide.bucket-country.tip.2':
    '每個目標日期一筆：同一個國家可以用兩個不同的月份出現在心願單中，但同一個月不能出現兩次。',
  // bucket-place
  'help.guide.bucket-place.title': '把地點新增到心願單',
  'help.guide.bucket-place.goal': '儲存你夢想中的城市、景點或地址，帶有座標和目標日期。',
  'help.guide.bucket-place.step.1': '在底部面板中開啟「心願單」分頁。',
  'help.guide.bucket-place.step.2': '點選「新增地點」。',
  'help.guide.bucket-place.step.3':
    '輸入名稱並按搜尋按鈕；選擇相符的結果，讓該地點帶上座標。只輸入名稱、略過搜尋也可以。',
  'help.guide.bucket-place.step.4': '如果願意，選一個月份和年份，然後點選「新增」。',
  'help.guide.bucket-place.result': '該地點帶著目標日期出現在心願單頂端；旁邊的 × 可以把它再移除。',
  'help.guide.bucket-place.tip.1': '帶座標的心願，就是日後當你的記錄顯示你到過那裡時，Dawarich 可以替你勾掉的那種。',
  // stats
  'help.guide.stats.title': '讀懂你的統計',
  'help.guide.stats.goal': '了解面板中的數字統計什麼，不統計什麼。',
  'help.guide.stats.step.1':
    '「國家」是你真正去過的不同國家的數量；計劃中的國家顯示在旁邊，不計入其中。「旅行」「地點」和「天」是所有旅行的總計。「城市」由地點的地址推算而來，所以是估算值。',
  'help.guide.stats.step.2':
    '各大洲顯示每個大洲已訪問的國家數；去過南極洲後，它會加入這一行。然後是你的連續紀錄，即至少有一次旅行的連續年數，以及你今年的旅行次數。',
  'help.guide.stats.result': '數字會隨著你規劃旅行而自動更新；這裡沒有任何需要維護的地方。',
  'help.guide.stats.tip.1':
    '城市是從地址文字中讀出來的，不做查詢，所以像「Osteria Francescana, Italy」這樣的短地址，或以縣級行政區結尾的地址，可能得到一個地區而不是城市。',
  'help.guide.stats.tip.2': '手動標記的國家會計入「國家」和各大洲，但不會帶來旅行、地點或天數。',
  // dawarich-countries
  'help.guide.dawarich-countries.title': '從你的記錄裡新增國家',
  'help.guide.dawarich-countries.goal': '讓 Dawarich 說出你去年都在哪些國家待過，並把你確認的那些放到地圖上。',
  'help.guide.dawarich-countries.step.1':
    '連接 Dawarich 擴充套件後，地圖底部、統計左側會有一個 Dawarich 面板，帶兩個方塊。點選「國家」。',
  'help.guide.dawarich-countries.step.2':
    '對話框在它的「國家」分頁上開啟。點選「尋找國家」：TREK 逐月讀取你的記錄在最近 12 個月裡涵蓋的國家和城市，所以請稍等一下。你的 Atlas 還沒有的每個國家都會列出，帶著國旗、城市數量和其中第一個城市的名字，並且一開始就已打勾；點選一列可以把它排除。',
  'help.guide.dawarich-countries.step.3':
    '用右下角的按鈕確認，勾了五列時它寫著「新增 5 個國家」。對話框會說新增了多少個；關掉它，地圖已經自己重新讀取過了。',
  'help.guide.dawarich-countries.result':
    '確認過的國家在地圖上帶上顏色，並計入「國家」，記錄為來自 Dawarich。你手動標記的內容不受影響。',
  'help.guide.dawarich-countries.tip.1':
    'Atlas 已經顯示為已訪問的國家，不論是手動標記、來自某次旅行還是來自更早的一次核對，都會被排除，所以你自己的標記永遠不會被重新標註。你之前從 Atlas 移除的國家，在這裡確認後會回來。',
  'help.guide.dawarich-countries.tip.2':
    'TREK 比對不上的國家名稱會列在各列下方，而不是被丟掉，「再查一次」會再問 Dawarich 一遍。清單下方的備註說明查看的是最近 12 個月；這個範圍是固定的。',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': '從你的記錄裡為心願打勾',
  'help.guide.dawarich-wishes.goal': '找出你的心願單上實際已經到過的地方，並按實際到達的那一天為它們打勾。',
  'help.guide.dawarich-wishes.step.1': '在地圖底部、統計左側的 Dawarich 面板裡，點選「心願清單」。',
  'help.guide.dawarich-wishes.step.2':
    '對話框在它的「心願清單」分頁上開啟。點選「核對願望清單」：TREK 會在你的記錄裡查找每一條有座標的項目。你到過的心願會列出，帶著你靠得多近、待了多久和那一天，並且一開始就已打勾；已經打過勾的會寫著「已打勾」。清單下方有一條備註統計沒有座標的項目，規則也寫在那裡：「在 250 公尺內停留 20 分鐘以上，才算實現心願。」',
  'help.guide.dawarich-wishes.step.3':
    '用右下角的按鈕確認，勾了兩列時它寫著「為 2 項打勾」。然後關掉對話框，開啟旁邊面板的「心願單」分頁。',
  'help.guide.dawarich-wishes.result':
    '每個心願都帶一個綠色勾號，日期是停留的那一天，而不是今天；它的提示寫著「依據你的 Dawarich 記錄打勾」，點一下日期可以復原。',
  'help.guide.dawarich-wishes.tip.1':
    '路過不算：規則同時需要距離和時間，幾次都符合的停留裡，最長的那次勝出。沒有座標的心願無法核對，所以請透過「新增地點」裡的搜尋來新增地點，而不是只憑名字。',
  'help.guide.dawarich-wishes.tip.2':
    '一次核對最多查看 50 條，先看還沒打勾的，項目更多時會說明。已經打過勾的心願保留它自己的日期。',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': '收藏',
  'help.ctx.collections.summary':
    'Collections 是你在任何行程之外的地點庫：把你找到並想留下的地點整理成有名稱的清單，每個地點都有「想法」「想去」或「已造訪」其中之一的狀態。地點只會被複製進出行程，從不連結，所以清單和行程永遠不會互相改變。',
  'help.ctx.collections.bullet.1':
    '左側的清單列：你自己的清單、分享給你的清單、等待你接受的邀請、把你擁有的一切合在一起的「全部已儲存」，以及頂部的「新增清單」和檔案匯入。',
  'help.ctx.collections.bullet.2':
    '開啟清單的標題區：它的顏色、封面、描述和連結，成員，以及右側的「編輯」「匯出」「分享」操作。',
  'help.ctx.collections.bullet.3':
    '地點上方的篩選列：狀態、類別、評分和排序，標籤篩選，用來新增地點的 +，行程匯入，以及用於批次操作的「選擇」。',
  'help.ctx.collections.bullet.4': '地點列：頭像、名稱和地址、標籤和類別，以及右側一鍵循環切換的狀態膠囊。',
  'help.ctx.collections.bullet.5':
    '右側的地圖：每個有座標的地點一枚圖釘，清單與地圖切換，搜尋框和標籤篩選。點選圖釘會開啟該地點。',
  'help.ctx.collections.bullet.6':
    '詳細資料面板：點選一列可查看封面、類別、標籤、狀態、描述和連結，並有「編輯」「複製到行程」和「從清單中移除」。',
  // create-list
  'help.guide.create-list.title': '建立清單',
  'help.guide.create-list.goal': '新建一個有名稱的清單，配上顏色和封面，準備放入地點。',
  'help.guide.create-list.step.1': '點選清單列頂部的「新增清單」。',
  'help.guide.create-list.step.2': '為清單命名並選一個顏色。封面圖、描述和連結是選填的，之後可以透過「編輯」加上。',
  'help.guide.create-list.step.3': '點選「建立」。',
  'help.guide.create-list.result': '清單以空白狀態開啟，「新增地點」和「從行程匯入」是填滿它的兩種方式。',
  'help.guide.create-list.tip.1': '封面可以是你自己上傳的圖片，也可以是在同一個對話框裡透過 Unsplash 搜尋找到的照片。',
  // add-place
  'help.guide.add-place.title': '新增地點',
  'help.guide.add-place.goal': '找到一個地點，把名稱、類別、狀態和備註一次儲存到開啟的清單。',
  'help.guide.add-place.step.1': '點選地點上方篩選列裡的 +。',
  'help.guide.add-place.step.2': '在搜尋欄輸入地點並選一個結果。名稱、地址和座標會據此填入。',
  'help.guide.add-place.step.3':
    '設定狀態，如有需要再加上類別、描述和連結，然後點選「新增」。對話框會為下一個地點保持開啟；「取消」會關閉它。',
  'help.guide.add-place.result': '地點出現在清單中；如果有座標，也會以圖釘出現在地圖上。',
  'help.guide.add-place.tip.1':
    '在行程內部，地點檢視器或地點選單裡的「儲存到收藏」可以把行程中的地點放進清單，不必離開行程。',
  'help.guide.add-place.tip.2':
    '清單必須是你自己的，或是你在其中擔任編輯者或管理員；「全部已儲存」和你只能檢視的清單上沒有 +。',
  // import-from-trip
  'help.guide.import-from-trip.title': '從行程匯入地點',
  'help.guide.import-from-trip.goal': '把整個行程的地點一次搬到清單上，而不是逐一儲存。',
  'help.guide.import-from-trip.step.1':
    '點選篩選列裡帶雲朵箭頭的匯入按鈕。在空白清單上，同樣的操作位於「新增地點」旁邊。',
  'help.guide.import-from-trip.step.2': '選一個你的行程。',
  'help.guide.import-from-trip.step.3':
    '勾選你想要的地點。已經在清單裡的地點會變灰；行程中沒有任何一天包含的地點一開始就是選取的。「僅新增」會隱藏你已經擁有的。',
  'help.guide.import-from-trip.step.4': '點選「匯入」。按鈕上總會寫明即將新增多少個。',
  'help.guide.import-from-trip.result': '地點連同名稱、地址、座標、描述和類別被複製到清單上。行程保持原樣。',
  'help.guide.import-from-trip.tip.1': '名稱或座標相同的重複項會被自動略過，所以匯入兩次也沒有壞處。',
  'help.guide.import-from-trip.tip.2': '在行程的地點清單內部，選取模式則提供「儲存到收藏」，用於你親手挑選的一組地點。',
  // place-status
  'help.guide.place-status.title': '設定地點的狀態',
  'help.guide.place-status.goal': '記錄哪些是想法，哪些在候選名單上，以及你去過哪裡。',
  'help.guide.place-status.step.1': '點選地點列右端的狀態膠囊。「想法」變為「想去」。',
  'help.guide.place-status.step.2': '再點一次變為「已造訪」，再點一次回到「想法」。',
  'help.guide.place-status.result': '膠囊及其顏色立即改變；清單上方狀態篩選的計數也會跟著變。',
  'help.guide.place-status.tip.1': '狀態是 Collections 自己的東西：把地點複製到行程不會把它帶過去。',
  'help.guide.place-status.tip.2':
    '在行程中，「儲存到收藏」會為該地點所在的每個清單顯示一個狀態膠囊，地點面板裡則有針對所選地點的「標記為已造訪」操作。',
  // place-detail
  'help.guide.place-detail.title': '開啟已儲存的地點',
  'help.guide.place-detail.goal': '查看一個地點的全部資訊並進行操作：編輯、複製到行程、移除。',
  'help.guide.place-detail.step.1': '點選一個地點列。詳細資料面板在清單旁邊開啟，地圖平移到該地點。',
  'help.guide.place-detail.step.2':
    '底部是「編輯」「複製到行程」和「從清單中移除」；封面上的相機可以把自動取得的照片換成你自己的。',
  'help.guide.place-detail.result': '「編輯」會讓名稱、類別、標籤、地址、座標、描述和連結直接在面板裡變為可編輯。',
  'help.guide.place-detail.tip.1':
    '當地點沒有自己的圖片時，封面會自動取得。你自己上傳的圖片可以是 JPG、PNG、GIF 或 WebP，最大 20 MB。',
  'help.guide.place-detail.tip.2': '分享清單的成員也可以在這裡留下星級評分，篩選列裡的評分篩選使用的是平均值。',
  // labels
  'help.guide.labels.title': '用標籤為地點分組',
  'help.guide.labels.goal': '在共用的類別之外，為清單加上它自己的標籤，例如街區或天數。',
  'help.guide.labels.step.1': '從篩選列裡的標籤控制項開啟標籤管理員。',
  'help.guide.labels.step.2':
    '輸入名稱，選一個顏色，點選「新增標籤」。在同一個對話框裡可以重新命名、改色或刪除既有標籤。',
  'help.guide.labels.step.3':
    '開啟「選擇」，勾選地點，點選選取列裡的「指派標籤」。單一地點也可以透過其詳細資料面板上的「編輯」取得標籤。',
  'help.guide.labels.step.4': '在篩選列裡選一個或多個標籤，把清單和地圖縮小到帶有其中任一標籤的地點。',
  'help.guide.labels.result': '有標籤的地點會在列上顯示它們的標籤；標籤篩選對每位成員都可用，包括檢視者。',
  'help.guide.labels.tip.1': '標籤只屬於建立它的那一個清單。把地點移動到另一個清單會丟掉它們。',
  'help.guide.labels.tip.2': '管理和指派標籤需要對清單的編輯權限。',
  // filter-select
  'help.guide.filter-select.title': '篩選和選取地點',
  'help.guide.filter-select.goal': '縮小清單，並一次對許多地點進行操作。',
  'help.guide.filter-select.step.1':
    '使用篩選列裡的下拉選單：狀態、類別、最低評分和排序順序。每一個都會顯示它會留下多少地點。',
  'help.guide.filter-select.step.2': '點選「選擇」。每一列都會出現一個核取方塊，並出現一個選取列。',
  'help.guide.filter-select.step.3':
    '勾選地點，或用「全選」選取目前篩選出的全部，然後選擇「指派標籤」「移動到清單」「複製到清單」「複製到行程」或「刪除」。',
  'help.guide.filter-select.result': '操作會一次套用到整個選取範圍。右側的 × 離開選取模式。',
  'help.guide.filter-select.tip.1': '「全選」跟隨篩選，所以篩選到「想去」再全選，是處理候選名單的捷徑。',
  // copy-to-trip
  'help.guide.copy-to-trip.title': '把地點複製到行程',
  'help.guide.copy-to-trip.goal': '把已儲存的地點變成你某個行程裡的停留點。',
  'help.guide.copy-to-trip.step.1': '開啟「選擇」並勾選地點，或開啟一個地點並使用其詳細資料面板上的「複製到行程」。',
  'help.guide.copy-to-trip.step.2': '點選選取列裡的「複製到行程」。',
  'help.guide.copy-to-trip.step.3': '選擇行程。搜尋框可以縮小長清單。',
  'help.guide.copy-to-trip.result':
    '地點連同名稱、描述、類別、備註、價格、座標、照片和標籤進入該行程的地點清單。收藏中沒有任何改變。',
  'help.guide.copy-to-trip.tip.1': '分享清單的檢視者也可以這樣做；這是從清單中複製出去，不會改變清單。',
  // share-list
  'help.guide.share-list.title': '與他人分享清單',
  'help.guide.share-list.goal': '和這個 TREK 上的其他人一起即時規劃一個清單。',
  'help.guide.share-list.step.1': '點選你清單標題區裡的「分享」。',
  'help.guide.share-list.step.2': '選擇使用者和一個角色：「檢視者」「編輯者」或「管理員」。',
  'help.guide.share-list.step.3': '點選「傳送邀請」。在對方在自己的清單列裡接受邀請之前，此人顯示為「待處理邀請」。',
  'help.guide.share-list.result':
    '接受後，清單會出現在對方的「已分享」下，每一次變更都即時同步。成員及其角色在同一個對話框裡隨時可改。',
  'help.guide.share-list.tip.1':
    '檢視者可以查看、評分並把地點複製到自己的行程。編輯者可以新增和編輯地點與標籤。管理員還可以刪除。',
  'help.guide.share-list.tip.2': '只有擁有者能邀請和移除他人；成員可以自己退出分享的清單。',
  // export-list
  'help.guide.export-list.title': '把清單匯出為檔案',
  'help.guide.export-list.goal': '把清單交給另一個 TREK 上的人，或帶進地圖應用程式。',
  'help.guide.export-list.step.1': '點選清單標題區裡的「匯出」。',
  'help.guide.export-list.step.2':
    '選「TREK 清單」用於另一個 TREK，含標籤和狀態；或選 GPX 用於 OsmAnd、Organic Maps、Garmin 裝置以及其他能讀取航點的應用程式。',
  'help.guide.export-list.result': '檔案開始下載。分享清單的任何成員都可以匯出它。',
  'help.guide.export-list.tip.1': '沒有座標的地點無法成為 GPX 航點；它會被略過，TREK 會告訴你略過了多少個。',
  'help.guide.export-list.tip.2': '評分、成員和上傳的照片是刻意不帶走的；它們屬於這個 TREK，不屬於清單。',
  // import-file
  'help.guide.import-file.title': '從檔案匯入清單',
  'help.guide.import-file.goal': '匯入一個 TREK 清單檔案或 GPX 檔案，作為新清單或放進你已有的清單。',
  'help.guide.import-file.step.1': '點選清單列裡「新增清單」旁邊帶上傳箭頭的匯入按鈕。',
  'help.guide.import-file.step.2': '選擇檔案。在任何事情發生之前，TREK 會先顯示裡面有什麼：名稱、多少個地點和標籤。',
  'help.guide.import-file.step.3':
    '保留「新增清單」並視需要改名，或選「加入清單」把地點放進一個你能編輯的清單，然後點選「匯入」。',
  'help.guide.import-file.result':
    '你會來到帶有已匯入地點的清單。加入清單只會新增；已經在那裡的地點保留它們的狀態、備註和標籤。',
  'help.guide.import-file.tip.1':
    '從 GPX 匯入時，每個有名稱的航點都會成為一個地點；軌跡是線條，會被略過，預覽會說明那是多少個點。',
  'help.guide.import-file.tip.2':
    '既不是 TREK 清單也不是 GPX 的檔案會被拒絕並給出原因；某一個無法讀取的地點只會被略過，而不是整個檔案。',
  // edit-list
  'help.guide.edit-list.title': '編輯或刪除清單',
  'help.guide.edit-list.goal': '變更清單的名稱、顏色、封面、描述或連結，或移除該清單。',
  'help.guide.edit-list.step.1': '點選清單標題區裡的「編輯」。只有擁有者看得到它。',
  'help.guide.edit-list.step.2':
    '改你想改的，然後點選「儲存」。左下角的「刪除清單」會在確認後連同全部地點一起移除該清單。',
  'help.guide.edit-list.result': '標題區立即換上新的顏色、封面和描述。',
  'help.guide.edit-list.tip.1': '刪除清單無法復原。如果想保留副本，請先匯出。',
  // all-saved
  'help.guide.all-saved.title': '搜尋你的整個地點庫',
  'help.guide.all-saved.goal': '一次看遍你擁有的每一個清單。',
  'help.guide.all-saved.step.1': '點選清單列裡的「全部已儲存」。它把你擁有或共同擁有的每個清單的地點合在一起。',
  'help.guide.all-saved.step.2': '像在任何清單上一樣使用搜尋框和篩選；「選擇」在這裡也可用，用於複製到行程。',
  'help.guide.all-saved.result': '一個檢視看遍你所有已儲存的地點，沒有新增和匯入，因為沒有一個確定的清單可以放入它們。',
  'help.guide.all-saved.tip.1': '標籤是按清單的，所以「全部已儲存」上不提供標籤篩選。',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': '旅程',
  'help.ctx.journey.summary':
    '旅程是你以照片為主的旅行日記。每段旅程都關聯一次或多次旅行，並由帶有故事、照片、心情和天氣的條目一天天累積起來。這個頁面列出你的旅程；開啟一段就可以開始寫。',
  'help.ctx.journey.bullet.1':
    '頂部的橫幅顯示進行中的旅程，或是你最近的一段，連同它的條目、照片和地點數量。「繼續撰寫」會在今天這一頁開啟它。',
  'help.ctx.journey.bullet.2': '下方每段旅程一張卡片，帶有封面、副標題、日期和各項數量。點選卡片即可開啟。',
  'help.ctx.journey.bullet.3': '格線中的最後一張卡片「建立新旅程」，會從你的旅行開始一段新旅程。',
  // create-journey
  'help.guide.create-journey.title': '建立旅程',
  'help.guide.create-journey.goal': '為一次旅行開始一本日記，旅行的地點已經以建議的形式等在那裡。',
  'help.guide.create-journey.step.1': '點選格線中的最後一張卡片「建立新旅程」。',
  'help.guide.create-journey.step.2':
    '給它取個名稱，願意的話再加一個副標題，然後勾選它所屬的旅行。計數器會告訴你有多少地點會被帶進來。',
  'help.guide.create-journey.step.3': '點選「建立旅程」。',
  'help.guide.create-journey.result':
    '日記開啟。已關聯旅行的每個地點都以建議的形式出現在時間線上，它所在的每一天各一則，隨時可以寫進去。',
  'help.guide.create-journey.tip.1': '之後可以在「旅程設定」裡關聯更多旅行。',
  'help.guide.create-journey.tip.2': '沒有旅行的旅程也可以；這時你就手動新增條目。',
  // open-journey
  'help.guide.open-journey.title': '開啟旅程',
  'help.guide.open-journey.goal': '進入一本日記，並知道它會在哪裡開啟。',
  'help.guide.open-journey.step.1': '點選一張卡片。每張卡片都顯示封面、日期，以及這段旅程有多少條目、照片和地點。',
  'help.guide.open-journey.result':
    '進行中的旅程在今天這一頁開啟；如果還什麼都沒寫，則在今天之前的最後一則開啟；已結束的旅程從開頭開啟。',
  'help.guide.open-journey.tip.1': '除非你在「旅程設定」裡另外設定，封面就是旅程的第一張照片。',
  // continue-writing
  'help.guide.continue-writing.title': '繼續進行中的旅程',
  'help.guide.continue-writing.goal': '直接跳到你正在經歷的旅程的今天這一頁。',
  'help.guide.continue-writing.step.1':
    '點選頂部橫幅裡的「繼續撰寫」。橫幅顯示進行中的旅程，沒有的話則顯示最近的一段。',
  'help.guide.continue-writing.result': '日記在今天這一頁開啟；如果還什麼都沒寫，則在今天之前的最後一則開啟。',
  'help.guide.continue-writing.tip.1': '橫幅還會為尚未建立旅程的旅行給出建議；「忽略」會隱藏那則建議。',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': '日記',
  'help.ctx.journey-detail.summary':
    '一段開啟的旅程：左側是逐日排列的時間線，右側是地圖，帶有每個條目和已關聯旅行的地點。所有往日記裡新增內容的入口都在頂部；頁首包含各項數量、「Studio」、建議開關和「旅程設定」。',
  'help.ctx.journey-detail.bullet.1':
    '頁首：封面、標題和副標題，天數、地點、條目和照片數量，右側是「Studio」、建議開關和「旅程設定」。',
  'help.ctx.journey-detail.bullet.2': '工具列：「時間線」和「圖庫」分頁、「在這段旅程中搜尋」，以及「新增條目」。',
  'help.ctx.journey-detail.bullet.3':
    '時間線：每天一個區塊，帶一個 + 用來在那天新增條目；條目卡片帶有照片、心情、天氣和故事；來自旅行的建議以較淺的樣式顯示，並帶有「忽略這則建議」。',
  'help.ctx.journey-detail.bullet.4':
    '地圖：條目顯示為圖釘，按日期順序以虛線連接，還有旅行的地點，以及匯入到這些旅行中的任何 GPX 軌跡。',
  'help.ctx.journey-detail.bullet.5':
    '「旅程設定」：封面、名稱和副標題、地圖上的軌跡、紀錄欄位、已忽略的建議、已關聯的旅行、貢獻者、公開分享、封存和刪除。',
  'help.ctx.journey-detail.bullet.6': '兩個圓形按鈕懸浮在較長的時間線上：回到頂部，以及跳到最後一則。',
  // add-entry
  'help.guide.add-entry.title': '寫一則條目',
  'help.guide.add-entry.goal': '新增一天的故事，帶上標題、內文、心情和天氣。',
  'help.guide.add-entry.step.1': '點選工具列裡的「新增條目」，或者點選某一天頁首上的 +，從那天開始。',
  'help.guide.add-entry.step.2':
    '給這個瞬間取個名稱，寫下故事。文字上方的工具列可以用 Markdown 加入粗體、斜體、標題、引言、連結和清單。',
  'help.guide.add-entry.step.3':
    '選一個心情和天氣，核對日期，願意的話再釘上一個位置：搜尋一個地點，或者使用你的目前位置。',
  'help.guide.add-entry.step.4': '點選「儲存」。',
  'help.guide.add-entry.result': '條目出現在時間線上它所屬的那天，並在地圖上顯示為一枚圖釘。頁首裡的數量隨之更新。',
  'help.guide.add-entry.tip.1': '在建議裡寫作用的是同一個編輯器，只是地點已經設好。',
  'help.guide.add-entry.tip.2': '底部的標籤是自由文字，例如「hidden gem」或「best meal」，搜尋也能找到它們。',
  // entry-photos
  'help.guide.entry-photos.title': '為條目加入照片和影片',
  'help.guide.entry-photos.goal': '把圖片放到某一天；第一張會成為條目的封面。',
  'help.guide.entry-photos.step.1': '用卡片上的 ⋯ 開啟條目選單，選擇「編輯」。',
  'help.guide.entry-photos.step.2':
    '點選「上傳照片」並選擇檔案。「從相簿」取用旅程圖庫裡已有的圖片；「External photos」在已連接的 Immich 或 Synology 媒體庫裡搜尋那一天的照片。',
  'help.guide.entry-photos.step.3': '把滑鼠移到一張圖片上，用「設為第1張」選定封面，然後點選「儲存」。',
  'help.guide.entry-photos.result': '照片顯示在卡片上和圖庫裡；第一張在所有地方都作為縮圖。',
  'help.guide.entry-photos.tip.1': '影片以同樣的方式加到條目上：mp4、m4v、webm 或 mov，最大 500 MB，依上傳原樣儲存。',
  'help.guide.entry-photos.tip.2': '來自 iPhone 的 HEIC 檔案會在上傳時轉換為 JPEG，這會丟掉其中的 GPS 和相機中繼資料。',
  // suggestions
  'help.guide.suggestions.title': '使用或忽略建議',
  'help.guide.suggestions.goal': '把旅行中的地點變成條目，並清掉那些你不打算寫的。',
  'help.guide.suggestions.step.1': '建議是一張較淺的卡片，地點名稱為斜體。點選它會開啟編輯器，地點和日期已經設好。',
  'help.guide.suggestions.step.2':
    '在不會用到的卡片上點選「忽略這則建議」。它會離開時間線但不會被刪除，旅行同步也不會再次提供它。',
  'help.guide.suggestions.step.3':
    '改變主意了？「旅程設定」會顯示有多少則已被忽略，「找回已忽略的建議」會把它們全部找回。',
  'help.guide.suggestions.result': '時間線上只留下你打算寫的內容；閱讀時，頁首的開關可以一次隱藏所有建議。',
  'help.guide.suggestions.tip.1': '跨越兩天的地點會在每一天各給出一則建議。',
  'help.guide.suggestions.tip.2': '建議從不計入統計；只有已寫的條目才算。',
  // add-on-day
  'help.guide.add-on-day.title': '在更早的一天新增條目',
  'help.guide.add-on-day.goal': '寫一個已經過去的日子，不用事後再改日期。',
  'help.guide.add-on-day.step.1': '點選那一天頁首上的 +。',
  'help.guide.add-on-day.step.2': '編輯器開啟，日期已經設好。像往常一樣寫好並「儲存」。',
  'help.guide.add-on-day.result': '條目直接落在正確的那一天。',
  'help.guide.add-on-day.tip.1': '在同一天內，條目選單裡的箭頭可以把它往前或往後移。',
  // pros-cons
  'help.guide.pros-cons.title': '加入評價',
  'help.guide.pros-cons.goal': '用哪些很棒、哪些不怎麼樣來總結一天。',
  'help.guide.pros-cons.step.1':
    '在編輯器裡，故事下方找到「優缺點」。在「優點」或「缺點」裡輸入一則，用「再新增一個」寫下一則。',
  'help.guide.pros-cons.step.2': '儲存。評價會以兩個短清單的形式顯示在卡片上。',
  'help.guide.pros-cons.result': '故事下方，一眼就能看到讚與不讚。',
  'help.guide.pros-cons.tip.1': '不用評價的旅程可以在「旅程設定」的「紀錄欄位」下關閉這一部分。',
  // search-journey
  'help.guide.search-journey.title': '在長日記裡找東西',
  'help.guide.search-journey.goal': '不用翻過幾週的內容，直接找到你要的條目。',
  'help.guide.search-journey.step.1':
    '在工具列的「在這段旅程中搜尋」裡輸入。時間線會隨你輸入而篩選，範圍包括標題、故事、地點和標籤。不區分重音和大小寫。',
  'help.guide.search-journey.step.2':
    '頁首的建議開關會在你閱讀時隱藏尚未寫的卡片。時間線一旦變長，它的下緣上方會懸浮兩個圓形按鈕：回到頂部，以及跳到最後一則。',
  'help.guide.search-journey.result': '只留下相符的條目；清空搜尋框即可重新看到全部。',
  'help.guide.search-journey.tip.1': '進行中的旅程在今天這一頁開啟，所以目前的頁面通常已經在視野裡。',
  'help.guide.search-journey.tip.2': '標籤也算：搜尋「hidden gem」會找到所有加了這個標籤的條目。',
  // gallery-map
  'help.guide.gallery-map.title': '瀏覽圖庫和地圖',
  'help.guide.gallery-map.goal': '把整段旅程當作圖片來看，也當作地圖上的地點來看。',
  'help.guide.gallery-map.step.1':
    '在工具列切換到「圖庫」：每個條目的每張照片，加上直接上傳到圖庫的圖片。點選一張即可開啟燈箱。',
  'help.guide.gallery-map.step.2':
    '右側的地圖按日期順序把條目顯示為圖釘，還有已關聯旅行的地點，以及匯入到這些旅行中的任何 GPX 軌跡，顏色與它在規劃器中的一致。',
  'help.guide.gallery-map.result':
    '把滑鼠移到軌跡上可以看到它的名稱。條目之間的虛線是 TREK 畫的；軌跡則是你實際記錄下來的路線。',
  'help.guide.gallery-map.tip.1': '可以在「旅程設定」下為某段旅程關閉軌跡。',
  'help.guide.gallery-map.tip.2': '當「圖庫」和「地圖」都被分享時，帶有位置的圖庫照片也會出現在公開地圖上。',
  // entry-fields
  'help.guide.entry-fields.title': '關閉條目欄位',
  'help.guide.entry-fields.goal': '讓編輯器只保留這段旅程用得到的內容。',
  'help.guide.entry-fields.step.1': '從頁首開啟「旅程設定」。',
  'help.guide.entry-fields.step.2': '在「紀錄欄位」下，關閉「心情」、「天氣」或「優點與不足」。',
  'help.guide.entry-fields.result':
    '編輯器不再詢問這些內容。已寫的東西不會遺失：重新開啟某個欄位會讓儲存的值再次顯示，分享出去的旅程也會隱藏同樣的欄位。',
  'help.guide.entry-fields.tip.1': '開關是按旅程設定的，所以出差和度假可以不一樣。',
  // link-trip
  'help.guide.link-trip.title': '關聯另一次旅行',
  'help.guide.link-trip.goal': '把第二次旅行的地點以建議的形式帶進日記。',
  'help.guide.link-trip.step.1': '從頁首開啟「旅程設定」。',
  'help.guide.link-trip.step.2': '在已關聯的旅行下方，點選「新增旅行」。',
  'help.guide.link-trip.step.3': '選擇那次旅行。',
  'help.guide.link-trip.result': '它的地點會以建議的形式出現在時間線上各自的那一天，它的 GPX 軌跡也會加入地圖。',
  'help.guide.link-trip.tip.1': '已關聯旅行旁邊的 × 會再次取消關聯；你寫過的條目會保留。',
  'help.guide.link-trip.tip.2': '帶日期的條目只計一次，不管有多少次旅行涵蓋那一天。',
  // share-public
  'help.guide.share-public.title': '公開分享旅程',
  'help.guide.share-public.goal': '給沒有 TREK 帳號的人一個唯讀連結。',
  'help.guide.share-public.step.1': '開啟「旅程設定」，找到「公開分享」。',
  'help.guide.share-public.step.2': '點選「建立分享連結」。',
  'help.guide.share-public.step.3':
    '選擇訪客能看到什麼：「時間線」、「圖庫」和「地圖」是各自獨立的開關。「複製」會把連結放到你的剪貼簿。',
  'help.guide.share-public.result':
    '拿到連結的任何人只能看到已啟用的部分，其他什麼也看不到；你在「紀錄欄位」裡關閉的欄位在那裡同樣保持隱藏。',
  'help.guide.share-public.tip.1':
    '只有「圖庫」和「地圖」都開啟時，照片才會出現在公開地圖上；「地圖」關閉時，照片的座標會在離開伺服器之前被去除。',
  'help.guide.share-public.tip.2': '在同一個地方刪除連結即可結束分享。',
  // contributors
  'help.guide.contributors.title': '一起寫',
  'help.guide.contributors.goal': '讓同行的旅伴加入他們自己的條目和照片。',
  'help.guide.contributors.step.1': '開啟「旅程設定」，捲動到貢獻者。',
  'help.guide.contributors.step.2': '點選「邀請貢獻者」，依名稱或電子郵件搜尋使用者。',
  'help.guide.contributors.step.3': '選一個角色並確認。',
  'help.guide.contributors.result': '旅程會出現在他們的清單裡，他們的條目會帶上他們的名字。用旁邊的 × 移除貢獻者。',
  'help.guide.contributors.tip.1': '貢獻者面向這個 TREK 上的人。對其他所有人，則有公開連結。',
  // studio
  'help.guide.studio.title': '把旅程排成一本相片書',
  'help.guide.studio.goal': '把日記變成可列印的頁面。',
  'help.guide.studio.step.1': '點選頁首裡的「Studio」。設計器會在旅程之上開啟。',
  'help.guide.studio.step.2': '頂列左側的旅程名稱就是返回的入口；它會把你送回原來的位置。',
  'help.guide.studio.result':
    '左側是頁面列，工作台上是跨頁，右側是屬性。「Auto layout」會用你的條目組出整本書；「Export」產生可直接列印的 PDF。',
  'help.guide.studio.tip.1': 'Studio 需要至少 1024 px 寬的視窗，手機上不提供。',
  'help.guide.studio.tip.2': '這本書繼承旅程的存取權限：能讀旅程的人就能開啟它，能編輯的人就能儲存。',
  // archive-journey
  'help.guide.archive-journey.title': '封存或刪除旅程',
  'help.guide.archive-journey.goal': '關閉一段已結束的旅程，或者永久移除一段。',
  'help.guide.archive-journey.step.1': '開啟「旅程設定」。',
  'help.guide.archive-journey.step.2':
    '在底部，「封存旅程」會結束它並標記為已封存；「還原旅程」會把它帶回來。「刪除」會在確認後把它連同所有條目和照片一起移除。',
  'help.guide.archive-journey.result': '已封存的旅程仍然可以閱讀和分享；只是不再在今天這一頁開啟。',
  'help.guide.archive-journey.tip.1': '刪除無法復原，但不會影響旅程曾關聯的旅行。',
  'help.guide.archive-journey.tip.2': '封面、名稱和副標題在同一個對話框裡，就在頂部。',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio 把一段旅程排成可列印的相片書。它在日誌之上開啟：左側是頁面側欄和內容，中間是你正在編輯的跨頁，右側是它的屬性。Auto layout 依你的條目產生第一版草稿；之後的一切由你來移動、裁切和改樣式，每一步都可以復原。',
  'help.ctx.journey-studio.bullet.1':
    '頂部列：Back to the journey、Book view、Undo 和 Redo、Page format、Auto layout 和 Export。標題旁的「已儲存」標記告訴你書何時已經存好。',
  'help.ctx.journey-studio.bullet.2':
    '左側側欄有五個部分：Pages、Content（旅程的照片和條目）、Elements（文字、形狀、線條、格線、相框、圖示）、「旅程」（由旅程產生的地圖、國家、國旗和標記）和 Layouts。',
  'help.ctx.journey-studio.bullet.3':
    '工作區：目前的跨頁及其出血和安全區，下方的縮放列、Fit to view，以及右側的「下載這個跨頁」。',
  'help.ctx.journey-studio.bullet.4':
    '右側的 Properties：所選物件的位置和大小、裁切和焦點、Fill 或 Fit、外觀、圓角、相框、堆疊順序和鎖定；未選取任何物件時則是頁碼和文件。',
  'help.ctx.journey-studio.bullet.5':
    '這本書的結構和裝訂成冊的書一樣：封面、單獨的第一頁、各個跨頁、單獨的最後一頁和封底。頁碼從第一頁開始計數，並按顯示的樣子列印。',
  'help.ctx.journey-studio.bullet.6':
    '多人可以同時設計：每個人都能看到其他人帶名字的指標，在別人改過的版本上儲存會以衝突的形式返回，而不是覆蓋對方的工作。',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': '自動產生整本書',
  'help.guide.studio-auto-layout.goal': '一鍵從日誌的條目和照片得到完整的第一版草稿。',
  'help.guide.studio-auto-layout.step.1': '點選頂部列中的 Auto layout。',
  'help.guide.studio-auto-layout.step.2':
    '選擇「整本書」：它會取代每一頁，但保留你的標題和頁面設定。「本頁」只重建螢幕上的這個跨頁，且只在由條目產生的跨頁上提供。',
  'help.guide.studio-auto-layout.step.3': '翻看 Pages 側欄。如果你更喜歡原來的樣子，Undo 會把整個排版復原。',
  'help.guide.studio-auto-layout.result':
    '每個條目一個跨頁，按順序排列，照片、標題和故事都已為你放好。每個元素在你編輯它之前都會繼續跟隨它的條目。',
  'help.guide.studio-auto-layout.tip.1': '這兩個選項都是普通的復原步驟，放心嘗試。',
  'help.guide.studio-auto-layout.tip.2':
    'Auto layout 綁定到條目的元素會跟隨該條目的修改，直到你在 Properties 中動它為止；那會中斷連結。',
  // studio-pages
  'help.guide.studio-pages.title': '新增、移動和刪除跨頁',
  'help.guide.studio-pages.goal': '一頁一頁地塑造這本書。',
  'help.guide.studio-pages.step.1':
    '在側欄中開啟 Pages。縮圖就是按順序排列的書：封面、第一頁、各個跨頁、最後一頁、封底。',
  'help.guide.studio-pages.step.2':
    '底部的「新增頁面」把新跨頁放在最後一頁之前；兩張縮圖之間的 + 會正好在那裡插入一個。',
  'help.guide.studio-pages.step.3':
    '把滑鼠移到縮圖上可看到它的操作：「前移」、「後移」、「複製頁面」和「刪除頁面」。點選縮圖即可在工作區開啟那個跨頁。',
  'help.guide.studio-pages.result': '封面、第一頁、最後一頁和封底留在原處；新跨頁總是落在它們之間。',
  'help.guide.studio-pages.tip.1': '頂部列的 Book view 以紙張的形式顯示整本書，也就是裝訂後的樣子。',
  'help.guide.studio-pages.tip.2': '頁碼在未選取任何物件時，於 Properties 的「文件」下開啟。',
  // studio-layouts
  'help.guide.studio-layouts.title': '為跨頁套用版面',
  'help.guide.studio-layouts.goal': '給跨頁一套現成的照片框和文字框排布。',
  'help.guide.studio-layouts.step.1':
    '在側欄中開啟 Layouts。有十三種跨頁版面，以及一組單獨用於封面、封底和單頁的版面。',
  'help.guide.studio-layouts.step.2': '點選其中一個。工作區中的跨頁會採用它的框；你已有的照片和文字會被倒入這些框中。',
  'help.guide.studio-layouts.result': '空框等待內容：從 Content 拖一張照片到框上，或使用 Add to this page。',
  'help.guide.studio-layouts.tip.1': '版面和其他操作一樣，也是一個復原步驟。',
  // studio-content
  'help.guide.studio-content.title': '把照片和條目放到頁面上',
  'help.guide.studio-content.goal': '把旅程自己的素材放到跨頁上。',
  'help.guide.studio-content.step.1': '在側欄中開啟 Content。Photos 列出旅程的每一張照片；Entries 列出帶文字的條目。',
  'help.guide.studio-content.step.2':
    '把照片拖到跨頁或空框上，或點選它下方的 Add to this page。「上傳照片」可加入旅程中還沒有的照片。',
  'help.guide.studio-content.step.3':
    '在條目下方，Title、Story 和 Place 會把那段文字作為文字元素放到頁面上；日期和座標以標記的形式加入，條目的照片也就列在那裡。',
  'help.guide.studio-content.result': '放下的照片變成照片元素；文字在你編輯之前會繼續跟隨條目。',
  'help.guide.studio-content.tip.1': 'Content 頂部的搜尋框同時篩選兩個清單。',
  'help.guide.studio-content.tip.2': '把檔案從桌面拖到工作區，會一步完成上傳和放置。',
  // studio-elements
  'help.guide.studio-elements.title': '加入文字、形狀和圖示',
  'help.guide.studio-elements.goal': '在照片和故事之外裝飾跨頁。',
  'help.guide.studio-elements.step.1': '在側欄中開啟 Elements。',
  'help.guide.studio-elements.step.2':
    '點選一種用於標題或說明的文字樣式、一個形狀、一條線、一個格線、一個帶相框樣式的空框，或可搜尋圖庫中的一個圖示。每一個都會落在跨頁中央，隨時可以移動。',
  'help.guide.studio-elements.result': '雙擊文字元素即可輸入；Properties 裡有字型、字重、字級、間距和對齊。',
  'help.guide.studio-elements.tip.1': '相框是空的照片位：以後再把照片放進去。',
  // studio-travel
  'help.guide.studio-travel.title': '加入地圖、國旗和數據',
  'help.guide.studio-travel.goal': '把旅程本身變成頁面上的數據。',
  'help.guide.studio-travel.step.1': '在側欄中開啟「旅程」。',
  'help.guide.studio-travel.step.2':
    '選擇要加入的內容：條目的路線地圖、國家輪廓、國家清單或格線、國旗、日期、天數或距離標記，或整趟旅行的總覽。每一個都由旅程的資料產生，並隨之更新。',
  'help.guide.studio-travel.result': '元素出現在跨頁上；Properties 調整它的樣式，地圖還可以調整範圍。',
  'help.guide.studio-travel.tip.1': '標記跟隨跨頁所來自的條目，所以自動排版的跨頁上的日期標記已經顯示那一天。',
  // studio-properties
  'help.guide.studio-properties.title': '編輯你選取的物件',
  'help.guide.studio-properties.goal': '用檢閱器移動、裁切、設定樣式和堆疊元素。',
  'help.guide.studio-properties.step.1': '點選跨頁上的一個元素。會出現用於大小和旋轉的控制點；拖曳它即可移動。',
  'help.guide.studio-properties.step.2':
    '右側的 Properties 跟隨所選物件：位置和大小、帶焦點的 Crop（焦點決定什麼留在框內）、Fill 或 Fit、Look 濾鏡、Corner 半徑、「相框」樣式、堆疊順序和 Lock。',
  'help.guide.studio-properties.step.3': '「複製」和 Delete 位於檢閱器頂部；頂部列的 Undo 可復原其中任何操作。',
  'help.guide.studio-properties.result':
    '鎖定的元素在頁面上就再也抓不到了，這樣你在周圍繼續工作時，已完成的排版就不會被碰壞。',
  'help.guide.studio-properties.tip.1': '按住 Shift 點選可選取多個元素；檢閱器隨後會一起編輯它們。',
  'help.guide.studio-properties.tip.2': '編輯 Auto layout 放置的元素會中斷它與條目的連結；它不再跟隨該條目之後的改動。',
  // studio-format
  'help.guide.studio-format.title': '選擇頁面格式',
  'help.guide.studio-format.goal': '在排版依賴尺寸之前，先設定這本書要列印的尺寸。',
  'help.guide.studio-format.step.1': '點選頂部列中的 Page format。',
  'help.guide.studio-format.step.2':
    '選擇 Square 21 × 21 cm、Square 30 × 30 cm、A4 或 A5 的橫向或直向，或者以公釐輸入自訂的寬和高。出血和安全區就在下方。',
  'help.guide.studio-format.result': '每個跨頁都按該尺寸繪製，預設出血 3 mm、安全區 5 mm。',
  'help.guide.studio-format.tip.1': '先改格式，再執行 Auto layout；排版是按它當時找到的尺寸產生的。',
  'help.guide.studio-format.tip.2': '向你的印刷廠詢問他們的出血和安全數值，然後填入。',
  // studio-export
  'help.guide.studio-export.title': '把書匯出為 PDF',
  'help.guide.studio-export.goal': '得到一個可直接印刷的檔案，或一個在螢幕上閱讀的檔案。',
  'help.guide.studio-export.step.1': '點選頂部列中的 Export。',
  'help.guide.studio-export.step.2':
    '選擇「單頁」，按閱讀順序每張紙一頁，這是印刷廠需要的；或選擇「跨頁」，像翻開書那樣一次兩頁。「裁切標記」會在每條邊上加上出血並標出裁切位置。',
  'help.guide.studio-export.step.3': '點選「列印檢視」。瀏覽器會開啟這些頁面，「另存為 PDF」把它們變成檔案。',
  'help.guide.studio-export.result': '一個 PDF，張數與對話框所說的一致，頁面格式為你設定的格式。',
  'help.guide.studio-export.tip.1': '產生 PDF 只能在桌面端進行，和 Studio 本身一樣。',
  'help.guide.studio-export.tip.2': '校樣用不帶裁切標記的「跨頁」匯出；給印刷廠用帶裁切標記的「單頁」。',
  // studio-spread-file
  'help.guide.studio-spread-file.title': '在另一本書中重用跨頁',
  'help.guide.studio-spread-file.goal': '把你喜歡的設計從一段旅程的書帶到另一段旅程。',
  'help.guide.studio-spread-file.step.1':
    '跨頁在工作區中開啟時，點選縮放列右端的「下載這個跨頁」。檔案中儲存的是設計，不含照片。',
  'help.guide.studio-spread-file.step.2': '在另一本書裡開啟 Pages，點選「新增頁面」旁邊的「匯入」，然後選擇檔案。',
  'help.guide.studio-spread-file.result': '跨頁帶著它的框和文字樣式到達；把新旅程的照片放進這些框裡。',
  'help.guide.studio-spread-file.tip.1': '不是跨頁設計的檔案會被拒絕，並說明原因。',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': '設定',
  'help.ctx.settings.summary':
    '你的個人設定，左側邊欄裡每個主題一個分頁。大多數開關一撥就生效；底部帶「儲存」按鈕的表單要等你按下儲存。這裡的任何改動都不會影響別人的 TREK。',
  'help.ctx.settings.bullet.1':
    '左側邊欄：「顯示」「Appearance」「地圖」「通知」「整合」「Offline」和「帳戶」。裝了外掛後會出現「外掛」，營運者沒有把它拿掉的地方就會出現「關於」。',
  'help.ctx.settings.bullet.2':
    '「顯示」管語言、單位、貨幣和應用程式開啟時的頁面；「Appearance」管主題、顏色、文字大小和儀表板小工具。',
  'help.ctx.settings.bullet.3':
    '「地圖」選擇繪製引擎和樣式；「通知」選擇能聯絡到你的管道；「整合」管相片庫、API 金鑰和 MCP；「Offline」管應用程式在此裝置上保留的內容。',
  'help.ctx.settings.bullet.4': '「帳戶」包含你的個人資料、密碼、雙因素認證、Passkey 和刪除帳戶。',
  'help.ctx.settings-display.title': '顯示',
  'help.ctx.settings-display.summary':
    '語言、單位和貨幣，地圖與預訂的行為方式，以及 TREK 開啟時的頁面。這裡的每項變更都立即生效。',
  'help.ctx.settings-display.bullet.1':
    '「Language & region」：介面語言、時間格式、每週的第一天、顯示貨幣，以及距離和溫度單位。',
  'help.ctx.settings-display.bullet.2':
    '「Travel & map」：訂票路線一律顯示在地圖上、探索地點的小按鈕、從住宿地點最佳化路線、模糊預訂代碼，以及為預訂路線加上標籤。',
  'help.ctx.settings-display.bullet.3': '「啟動」：TREK 開啟時是進入儀表板還是進行中的旅行，以及旅行的哪個分頁先顯示。',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'TREK 在這個帳戶上的樣子：淺色還是深色、強調色、玻璃效果和動態效果、文字大小，以及儀表板顯示哪些小工具。一切即時生效，在你登入的每台裝置上都一樣。',
  'help.ctx.settings-appearance.bullet.1':
    '「Theme」：「淺色」「深色」或「自動」，以及帶你自己「Custom accent」的「Color scheme」。',
  'help.ctx.settings-appearance.bullet.2':
    '「Readability」：「Transparency」「Reduce motion」「Density」和「Text size」，還有按層級設定的進階大小。',
  'help.ctx.settings-appearance.bullet.3':
    '「Dashboard widgets」：每個小工具一個開關，「Desktop」和「Mobile」分開設定。',
  'help.ctx.settings-appearance.bullet.4': '底部的「Reset to defaults」把一切放回原樣。',
  'help.ctx.settings-map.title': '地圖',
  'help.ctx.settings-map.summary':
    '由哪個引擎以什麼樣式繪製地圖。Leaflet 是經典的點陣地圖，MapLibre 不需要任何權杖就能繪製向量圖磚，Mapbox 用你自己的權杖加上 3D 建築和地形。',
  'help.ctx.settings-map.bullet.1': '「地圖提供商」：Leaflet、MapLibre 或 Mapbox，每個都有一行說明它需要什麼。',
  'help.ctx.settings-map.bullet.2': '「地圖樣式」和「地圖模板」：圖磚的外觀，加上提供商要求的權杖或金鑰。',
  'help.ctx.settings-map.bullet.3': '「高畫質模式」提供反鋸齒和地球儀投影；「儲存地圖」寫入你的選擇。',
  'help.ctx.settings-notifications.title': '通知',
  'help.ctx.settings-notifications.summary':
    'TREK 在應用程式之外聯絡你的地方：此裝置上的推播通知、一個 ntfy 主題、一個 webhook，或者外掛提供的管道。管道下方每個事件一列，決定什麼送到哪裡。',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy：主題、選填的自建伺服器和選填的存取權杖，按「測試」可以立刻送一則。',
  'help.ctx.settings-notifications.bullet.2': 'Webhook：一個以 JSON 接收所有事件的 URL，附「測試」。',
  'help.ctx.settings-notifications.bullet.3':
    '此裝置上的推播通知：「為此裝置開啟」只對你正在使用的瀏覽器生效，所以要在每支手機或每台電腦上各開一次。「傳送測試」會送到所有這些裝置。',
  'help.ctx.settings-notifications.bullet.4':
    '偏好設定列：每個事件開啟了哪個管道。外掛管道在設定好之前顯示「前往設定」。',
  'help.ctx.settings-integrations.title': '整合',
  'help.ctx.settings-integrations.summary':
    '從外部連接到 TREK 的一切：日記用的相片庫、指令碼用的 API 金鑰，以及供 AI 助理使用的 MCP 端點及其令牌和 OAuth 客戶端。',
  'help.ctx.settings-integrations.bullet.1':
    '相片提供商：Immich 和 Synology Photos，各有自己的 URL 和金鑰、「測試連線」和「儲存」。',
  'help.ctx.settings-integrations.bullet.2': '「API 金鑰」：供指令碼和其他工具以你的名義呼叫 TREK API 的個人金鑰。',
  'help.ctx.settings-integrations.bullet.3': '「MCP 配置」：端點、可直接複製的客戶端配置，以及 API 令牌。',
  'help.ctx.settings-integrations.bullet.4':
    '「OAuth 2.1 客戶端」：透過 TREK 登入的應用程式，包括重新導向 URI、允許的授權範圍、機器客戶端和活躍的工作階段。',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'TREK 在此裝置上保留什麼，好讓旅行在沒有網路時也能開啟；以及離線時的變更與別處的變更衝突時會發生什麼。',
  'help.ctx.settings-offline.bullet.1':
    '「離線模式」：「強制離線模式」讓應用程式表現得像斷網一樣，用於測試或按流量計費的連線。',
  'help.ctx.settings-offline.bullet.2': '「準備離線使用」：「下載以供離線使用」現在就取得你的旅行及其地圖圖磚。',
  'help.ctx.settings-offline.bullet.3': '「要離線儲存哪些內容」：地圖圖磚開或關，以及每次旅行一個開關。',
  'help.ctx.settings-offline.bullet.4':
    '「同步衝突」和「離線快取」：衝突處理策略、待處理和失敗的數量、「立即重新同步」和「清除快取」。',
  'help.ctx.settings-account.title': '帳戶',
  'help.ctx.settings-account.summary':
    '你在這個 TREK 上是誰、如何登入：個人資料和頭像、密碼、雙因素認證、Passkey，以及最底部的刪除帳戶。',
  'help.ctx.settings-account.bullet.1': '個人資料：使用者名稱、郵箱和頭像，用「儲存資料」儲存。',
  'help.ctx.settings-account.bullet.2': '「修改密碼」：目前密碼、新密碼兩次，然後「更新密碼」。',
  'help.ctx.settings-account.bullet.3':
    '使用身份驗證器應用程式和備用代碼的「雙因素認證 (2FA)」；不用密碼登入的「Passkey」。',
  'help.ctx.settings-account.bullet.4': '底部的「刪除賬戶」，需要先確認。最後一位管理員不能刪除自己。',
  // language-region
  'help.guide.language-region.title': '設定語言、單位和貨幣',
  'help.guide.language-region.goal': '讓 TREK 說你的語言，按你的方式計數。',
  'help.guide.language-region.step.1':
    '在「Language & region」中選擇介面語言。TREK 立即切換，在你登入的每台裝置上都一樣。',
  'help.guide.language-region.step.2':
    '在它下方選擇時間格式、所有日期選擇器中每週從哪一天開始、顯示貨幣，以及距離和溫度單位。',
  'help.guide.language-region.result': '日期、距離和金額按你期望的方式顯示；旅行自己的貨幣仍然顯示在換算金額旁邊。',
  'help.guide.language-region.tip.1': '顯示貨幣用於跨旅行的合計；每次旅行保留你為它設定的貨幣。',
  'help.guide.language-region.tip.2': '語言還決定 Vacay 和日記裡的星期和月份名稱。',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': '調整地圖和預訂的行為',
  'help.guide.travel-map-prefs.goal': '決定旅行地圖預設顯示什麼。',
  'help.guide.travel-map-prefs.step.1':
    '在「Travel & map」中，「一律顯示訂票路線」讓航班和火車即使在它們的日期未開啟時也留在地圖上；「在地圖上探索地點」顯示尋找地點的小按鈕；「從住宿地點最佳化路線」從你過夜的地方開始規劃路線。',
  'help.guide.travel-map-prefs.step.2':
    '「模糊預訂程式碼」把確認號碼隱藏起來，滑鼠移上去才顯示；「預訂路線標籤」把預訂名稱寫在它的路線旁。',
  'help.guide.travel-map-prefs.result': '旅行地圖在每次旅行中都遵循這些設定，直到你再撥回去。',
  'help.guide.travel-map-prefs.tip.1': '這些是按帳戶而不是按旅行設定的。共享旅行的成員各自看到自己的選擇。',
  // startup
  'help.guide.startup.title': '選擇 TREK 開啟時的頁面',
  'help.guide.startup.goal': '落在你最常工作的地方，而不是每次都進儀表板。',
  'help.guide.startup.step.1': '在「啟動」下，把「啟動頁面」設為「儀表板」或「進行中的旅行」。',
  'help.guide.startup.step.2': '「啟動分頁」決定開啟一次旅行時先顯示哪個分頁。',
  'help.guide.startup.result': '下次登入和下次點選 logo 都直接去那裡。',
  'help.guide.startup.tip.1': '「進行中的旅行」指今天正在進行的旅行，沒有的話就是下一次旅行。',
  // theme-scheme
  'help.guide.theme-scheme.title': '設定主題和強調色',
  'help.guide.theme-scheme.goal': '讓 TREK 用淺色、深色或跟隨你的裝置，配上你喜歡的顏色。',
  'help.guide.theme-scheme.step.1': '在「Theme」下選擇「淺色」「深色」或「自動」。「自動」跟隨你的裝置。',
  'help.guide.theme-scheme.step.2':
    '選擇一個「Color scheme」：「Default」「High contrast」「Indigo」「Teal」「Rose」「Amber」「Violet」或「Custom」。',
  'help.guide.theme-scheme.step.3':
    '選「Custom」時，從預設裡挑一個強調色或輸入你自己的。旁邊的對比度檢查會告訴你文字在這個顏色上是否仍然清晰可讀。',
  'help.guide.theme-scheme.result': '按鈕、連結和高亮到處都用這個強調色，在你登入的每台裝置上都一樣。',
  'help.guide.theme-scheme.tip.1': '導覽列裡也有一個淺色或深色的快速開關；它設定的是同一個主題。',
  'help.guide.theme-scheme.tip.2': '當預設配色看起來太淡時，就選「High contrast」。',
  // readability
  'help.guide.readability.title': '調整可讀性和文字大小',
  'help.guide.readability.goal': '少一點玻璃效果，少一點動態效果，多一點空間或更大的字。',
  'help.guide.readability.step.1':
    '在「Readability」下，「Transparency」把玻璃面板切換為實色表面，「Reduce motion」把動畫降到最少，「Density」在「Comfortable」和「Compact」之間選擇。',
  'help.guide.readability.step.2':
    '「Text size」一次縮放「Everything」；「Advanced text sizes」讓標題、副標題、內文和說明文字可以各不相同。',
  'help.guide.readability.result': '整個應用程式立即跟隨，包括地圖面板和日記。',
  'help.guide.readability.tip.1': '不去動「Reduce motion」時，它還會跟隨你系統的設定。',
  'help.guide.readability.tip.2': '文字大小透過排版層級套用，所以不會有內容被截斷；放不下的尺寸會換行。',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': '選擇儀表板小工具',
  'help.guide.dashboard-widgets.goal': '只顯示你用的小工具，桌面和手機分開設定。',
  'help.guide.dashboard-widgets.step.1':
    '在「Dashboard widgets」下，為「Desktop」和「Mobile」分別開啟或關閉每個小工具：整個右側邊欄、貨幣、Collections、時區、即將到來的預訂、Atlas 國家和旅行數據。',
  'help.guide.dashboard-widgets.step.2': '底部的「Reset to defaults」把整個分頁恢復到出廠狀態。',
  'help.guide.dashboard-widgets.result': '儀表板立即重新排列；關掉右側邊欄後它會置中。',
  'help.guide.dashboard-widgets.tip.1': '擴充套件的小工具只有在管理員開啟了那個擴充套件時才會出現。',
  'help.guide.dashboard-widgets.tip.2': '儀表板本身會按裝置記住你的格線或清單檢視以及排序方式。',
  // map-provider
  'help.guide.map-provider.title': '選擇地圖引擎和樣式',
  'help.guide.map-provider.goal': '在經典地圖、向量圖磚和 Mapbox 的 3D 地圖之間切換。',
  'help.guide.map-provider.step.1':
    '在「地圖提供商」下，選 Leaflet 得到可用任意點陣圖磚的經典 2D 地圖，選 MapLibre 得到無需權杖的 OpenFreeMap 向量圖磚，選 Mapbox 得到帶 3D 建築和地形的向量圖磚。',
  'help.guide.map-provider.step.2':
    '選一個「地圖樣式」或「地圖模板」決定外觀。Mapbox 需要「Mapbox 存取權杖」，一些點陣樣式需要「CARTO API 金鑰」；欄位旁邊的連結會帶你去取得。',
  'help.guide.map-provider.step.3': '「高畫質模式」加上反鋸齒和地球儀投影。點選「儲存地圖」。',
  'help.guide.map-provider.result': 'TREK 裡的每張地圖，旅行、Atlas、Collections 和日記，都由你選的引擎繪製。',
  'help.guide.map-provider.tip.1': '沒有權杖時，Mapbox 會退回預設地圖，而不是什麼都不顯示。',
  'help.guide.map-provider.tip.2': '你離線儲存的地圖圖磚來自下載時處於啟用狀態的提供商。',
  // notification-channels
  'help.guide.notification-channels.title': '設定通知送達的地方',
  'help.guide.notification-channels.goal': '在手機上或另一個工具裡收到旅行提醒和協作事件。',
  'help.guide.notification-channels.step.1':
    '在「通知」下填寫「Ntfy 主題」；如果你自己執行伺服器，再加上你的「Ntfy 伺服器 URL」和「存取權杖」。「測試」會立刻送一則訊息。',
  'help.guide.notification-channels.step.2':
    '或者填一個以 JSON 接收所有事件的「Webhook URL」，用同樣的方式「測試」它。',
  'help.guide.notification-channels.step.3':
    '在下方的列裡，按管道開啟或關閉每個事件。外掛管道在外掛設定裡設定好之前顯示「前往設定」；「傳送測試」會試送一則。',
  'help.guide.notification-channels.result':
    '事件透過開啟的管道送出。無論如何，導覽列裡的鈴鐺仍會在應用程式內顯示它們。',
  'help.guide.notification-channels.tip.1': '按旅行的偏好設定在旅行本身的通知設定裡。',
  'help.guide.notification-channels.tip.2': '管理員可以為所有人預填一個預設 ntfy 伺服器；主題仍由你自己選。',
  // photo-providers
  'help.guide.photo-providers.title': '連接相片庫',
  'help.guide.photo-providers.goal': '讓日記從 Immich 或 Synology Photos 拉取當天的相片。',
  'help.guide.photo-providers.step.1':
    '在「整合」下找到提供商的區段，輸入它的 URL 和 API 金鑰。Immich 還可以把旅程上傳的相片鏡像回相片庫。',
  'help.guide.photo-providers.step.2': '點選「測試連線」，然後「儲存」。',
  'help.guide.photo-providers.result':
    '條目編輯器的「External photos」分頁會在已連接的相片庫中搜尋該條目當天的相片，離條目位置最近的排在前面。',
  'help.guide.photo-providers.tip.1': '這個連接是你自己的：旅程的其他成員各自連接自己的相片庫。',
  'help.guide.photo-providers.tip.2': '相片裡沒有 GPS 資料的提供商也能用；那時清單按時間排序。',
  // api-keys
  'help.guide.api-keys.title': '建立 API 金鑰',
  'help.guide.api-keys.goal': '讓指令碼或其他工具以你的身分呼叫 TREK API。',
  'help.guide.api-keys.step.1': '在「API 金鑰」下點選「建立金鑰」，取一個能說明它用在哪裡的名稱。',
  'help.guide.api-keys.step.2': '從對話方塊裡複製金鑰：它只顯示一次。當工具不再需要時，從清單裡刪除金鑰。',
  'help.guide.api-keys.result': '帶這個金鑰的請求以你的權限執行；清單顯示每個金鑰的建立時間和最後使用時間。',
  'help.guide.api-keys.tip.1': '每個工具一個金鑰，撤銷起來毫不費力。',
  'help.guide.api-keys.tip.2': 'AI 助理請改用帶 OAuth 的 MCP；API 金鑰是給一般 HTTP 客戶端的。',
  // mcp-oauth
  'help.guide.mcp-oauth.title': '透過 MCP 連接 AI 助理',
  'help.guide.mcp-oauth.goal': '讓 Claude、IDE 或其他 MCP 客戶端存取你的旅行。',
  'help.guide.mcp-oauth.step.1':
    '在「MCP 配置」下複製「MCP 端點」，或者為接受 JSON 片段的客戶端複製整個「客戶端配置」。',
  'help.guide.mcp-oauth.step.2':
    '透過瀏覽器登入的客戶端使用 OAuth 2.1：在「OAuth 2.1 客戶端」下「新增客戶端」，填寫「重新導向 URI」「允許的授權範圍」，沒有瀏覽器的伺服器則選「機器客戶端」。',
  'help.guide.mcp-oauth.step.3':
    '每個客戶端上都有「輪換密鑰」和「刪除客戶端」；「活躍的 OAuth 工作階段」列出已登入的工作階段並讓你撤銷。「API 令牌」和「建立新令牌」是較早的接入方式。',
  'help.guide.mcp-oauth.result': '客戶端可以以你的身分讀取和修改其授權範圍允許的內容，每個操作都顯示在你的名下。',
  'help.guide.mcp-oauth.tip.1': '授權範圍是安全網：在客戶端需要更多之前，只給它讀取範圍。',
  'help.guide.mcp-oauth.tip.2': '管理員可以為整個執行個體關閉 MCP；那時這個區段就不存在。',
  // offline-prepare
  'help.guide.offline-prepare.title': '把旅行帶到離線',
  'help.guide.offline-prepare.goal': '在斷網之前，把你的旅行和地圖放到這台裝置上。',
  'help.guide.offline-prepare.step.1':
    '在「要離線儲存哪些內容」下，保持「離線儲存地圖瓦片」開啟，並開啟你想放到這台裝置上的旅行。',
  'help.guide.offline-prepare.step.2': '在「準備離線使用」下點選「下載以供離線使用」。它會取得旅行以及地點周圍的圖磚。',
  'help.guide.offline-prepare.step.3': '「離線模式」下的「強制離線模式」讓你在出發前檢查一切是否齊全。',
  'help.guide.offline-prepare.result': '旅行在沒有網路時也能開啟；你做的變更在佇列裡等待，重新連線後送出。',
  'help.guide.offline-prepare.tip.1': '圖磚佔的空間最多：「離線快取」區段按旅行顯示儲存了什麼。',
  'help.guide.offline-prepare.tip.2': '從瀏覽器把 TREK 安裝為應用程式，離線啟動最順暢。',
  // offline-conflicts
  'help.guide.offline-conflicts.title': '決定同步衝突時誰勝出',
  'help.guide.offline-conflicts.goal': '選擇 TREK 如何處理離線變更與別處變更之間的衝突。',
  'help.guide.offline-conflicts.step.1':
    '在「同步衝突」下，選擇「每次都詢問我」「一律保留我的版本」或「一律保留伺服器版本」。',
  'help.guide.offline-conflicts.step.2':
    '「離線快取」顯示旅行、待處理和失敗的變更以及衝突；「立即重新同步」推送佇列，「清除快取」清空裝置。',
  'help.guide.offline-conflicts.result': '選「每次都詢問我」時，衝突會顯示兩個版本讓你挑；另外兩種則靜默處理。',
  'help.guide.offline-conflicts.tip.1': '「清除快取」只移除這台裝置上的副本；伺服器上的內容不受影響。',
  // profile
  'help.guide.profile.title': '修改你的個人資料',
  'help.guide.profile.goal': '更新你的名字、郵箱和相片。',
  'help.guide.profile.step.1': '在「賬戶」下編輯「使用者名稱」和「郵箱」。頭像可以上傳你自己的圖片；移除後回到首字母。',
  'help.guide.profile.step.2': '點選「儲存資料」。',
  'help.guide.profile.result': '你的名字和相片立即在各處更新，包括你共享的旅行。',
  'help.guide.profile.tip.1': '透過 OIDC 登入的帳戶會在這裡顯示出來；那時郵箱來自身分提供者。',
  // password
  'help.guide.password.title': '修改你的密碼',
  'help.guide.password.goal': '設定一個新密碼。',
  'help.guide.password.step.1': '在「修改密碼」下輸入目前密碼，然後輸入新密碼兩次。',
  'help.guide.password.step.2': '點選「更新密碼」。',
  'help.guide.password.result': '新密碼從下次登入起生效；其他工作階段保持登入。',
  'help.guide.password.tip.1': '透過 OIDC 登入的帳戶沒有可修改的 TREK 密碼。',
  // mfa
  'help.guide.mfa.title': '開啟雙因素認證',
  'help.guide.mfa.goal': '用身份驗證器應用程式的驗證碼保護帳戶。',
  'help.guide.mfa.step.1': '在「雙因素認證 (2FA)」下點選「設定身份驗證器」。',
  'help.guide.mfa.step.2': '用你的應用程式掃描 QR code，或手動輸入密鑰，然後輸入它顯示的六位驗證碼並點選「啟用 2FA」。',
  'help.guide.mfa.step.3': '儲存備用代碼：複製、下載或列印。每個只能用一次，在你手邊沒有手機時使用。',
  'help.guide.mfa.result': '每次登入在密碼之後都會要求驗證碼。',
  'help.guide.mfa.tip.1': '「停用 2FA」需要你的密碼和一個目前的驗證碼。',
  'help.guide.mfa.tip.2': '管理員可以要求所有人使用 2FA；那時在這裡無法關閉。',
  // passkeys
  'help.guide.passkeys.title': '用 Passkey 登入',
  'help.guide.passkeys.goal': '用裝置的指紋、臉部或 PIN 代替密碼。',
  'help.guide.passkeys.step.1': '在「Passkey」下點選「新增 Passkey」，並在裝置上確認。取一個能說明是哪台裝置的名稱。',
  'help.guide.passkeys.step.2': '清單顯示每個 Passkey 的名稱和最後使用時間；刪除按鈕移除一個。',
  'help.guide.passkeys.result': '登入頁會提供 Passkey；密碼仍作為備用方式保留。',
  'help.guide.passkeys.tip.1': 'Passkey 保存在裝置或它的密碼管理器裡，所以每台裝置新增一個。',
  'help.guide.passkeys.tip.2': 'Passkey 需要 HTTPS；在純 HTTP 的執行個體上，這個區段會解釋為什麼它們不可用。',
  // delete-account
  'help.guide.delete-account.title': '刪除你的帳戶',
  'help.guide.delete-account.goal': '移除你的帳戶和只屬於你的資料。',
  'help.guide.delete-account.step.1': '在「帳戶」的最底部點選「刪除賬戶」並確認。',
  'help.guide.delete-account.result': '你的帳戶、你自己的旅行和你的旅程都會消失；你與他人共享的旅行留給他們。',
  'help.guide.delete-account.tip.1': '執行個體的最後一位管理員不能刪除自己；先把別人設為管理員。',
  'help.guide.delete-account.tip.2': '沒有復原。確認之前，先匯出你想保留的內容。',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': '管理後臺',
  'help.ctx.admin.summary':
    '支撐所有人 TREK 的那個實例：誰可以登入、怎麼登入，什麼功能開著，檔案放在哪裡，伺服器怎麼聯絡到人，以及怎麼備份。只有管理員能看到這個頁面；每個分頁在側邊欄裡都是獨立的一屏。',
  'help.ctx.admin.bullet.1': '頂部的四張卡片統計使用者、行程、地點和檔案；上方的橫幅會通告更新的 TREK 版本。',
  'help.ctx.admin.bullet.2': '「使用者」和「用戶預設設定」：帳戶、邀請連結，以及新帳戶初始的地圖設定。',
  'help.ctx.admin.bullet.3':
    '「配置」「設定」「擴充套件」和「外掛」：打包模板、分類和學校假期；登入方式和 API 金鑰；功能模組；第三方外掛。',
  'help.ctx.admin.bullet.4':
    '「儲存」「通知」「MCP 存取」和「GitHub」：上傳檔案的去向、實例範圍的通知管道、AI 用戶端的令牌和工作階段，以及版本歷史。',
  'help.ctx.admin.bullet.5': '「備份」和「審計日誌」：手動和定時的備份，以及安全相關事件的日誌。',
  'help.ctx.admin-users.title': '使用者',
  'help.ctx.admin-users.summary':
    '這個 TREK 上的每個帳戶，帶角色、郵箱和最近登入時間，以及讓人們在封閉實例上註冊的邀請連結。',
  'help.ctx.admin-users.bullet.1':
    '表格：使用者名稱、郵箱、角色、建立日期、最近登入，以及每列的操作。你自己會被標出來。',
  'help.ctx.admin-users.bullet.2': '頂部的「建立使用者」手動新增一個帳戶，密碼由你交給對方。',
  'help.ctx.admin-users.bullet.3':
    '下方的「邀請連結」：一次性的註冊連結，帶使用次數上限和有效期，還可以選一個行程，讓新使用者註冊後直接加入。',
  'help.ctx.admin-users.bullet.4':
    '底部的「許可權設定」：按操作設定誰可以執行，「所有人」「旅行成員」「旅行所有者」或「僅管理員」。',
  'help.ctx.admin-defaults.title': '用戶預設設定',
  'help.ctx.admin-defaults.summary': '新帳戶初始的設定，這樣沒人需要先去找地圖分頁：地圖提供者、樣式、權杖和品質。',
  'help.ctx.admin-defaults.bullet.1':
    '地圖提供者、Mapbox 樣式和權杖、CARTO 金鑰和 Mapbox 品質，和使用者在「設定」的「地圖」裡設定的一模一樣。',
  'help.ctx.admin-defaults.bullet.2':
    '每個欄位旁的「重設」恢復 TREK 自身的選擇；使用者自己的設定永遠優先於這些預設值。',
  'help.ctx.admin-config.title': '配置',
  'help.ctx.admin-config.summary':
    '實例上所有行程共用的內容：打包模板、地點和收藏用的分類集合，以及 Vacay 所引用的學校假期目錄。',
  'help.ctx.admin-config.bullet.1': '「打包模板」：帶名稱的分類和物品清單，行程的打包清單可以由此起步。',
  'help.ctx.admin-config.bullet.2': '「分類」：TREK 全域使用的分類的名稱、圖示和顏色，從地點檢視器到收藏都在用。',
  'help.ctx.admin-config.bullet.3': '「學校假期」：國家和地區的目錄，用於內建資料來源未涵蓋的地方。',
  'help.ctx.admin-settings.title': '設定',
  'help.ctx.admin-settings.summary':
    '人們怎麼進來，伺服器可以和什麼通訊：登入和註冊方式、SSO、Passkey、雙因素政策，地圖、地點和圖片的 API 金鑰，搜尋和公共運輸的資料來源，以及上傳允許的檔案類型。',
  'help.ctx.admin-settings.bullet.1':
    '「Authentication Methods」：「Password Login」「Password Registration」「SSO Login」「SSO Auto-Provisioning」和「要求雙因素身份驗證（2FA）」。',
  'help.ctx.admin-settings.bullet.2':
    '「單點登入 (OIDC)」填頒發者、用戶端和顯示名稱；「Passkey 登入」填 Relying Party ID 和來源。',
  'help.ctx.admin-settings.bullet.3':
    '「API 金鑰」：Google Maps、Unsplash 和高德地圖，各自帶「測試」；「該金鑰的用途」把 Google 金鑰限定在你願意付費的功能上。',
  'help.ctx.admin-settings.bullet.4':
    '「地點搜尋來源」和「公共運輸資料來源」決定由誰回應搜尋和路線；「允許的檔案型別」限制上傳。',
  'help.ctx.admin-addons.title': '擴充套件',
  'help.ctx.admin-addons.summary':
    'TREK 的功能模組，每個都有一個開關：行李、費用、文件、Vacay、Atlas、Collab、旅程、收藏、公路旅行、MCP、AirTrail、Dawarich 和 AI 解析。關掉後，導覽項目、路由和 API 對所有人都消失。',
  'help.ctx.admin-addons.bullet.1': '每個擴充套件一張卡片，帶開關；有選項的還有子列。',
  'help.ctx.admin-addons.bullet.2':
    '相片提供者和文件提供者也以卡片的形式出現在這裡，這樣可以向使用者提供 Immich 或 Synology。',
  'help.ctx.admin-addons.bullet.3': '「行李追蹤」在卡片下方有自己的開關。',
  'help.ctx.admin-plugins.title': '外掛',
  'help.ctx.admin-plugins.summary':
    '在 TREK 旁邊以獨立程序執行的第三方外掛，每個都帶有安裝時申請的權限。可以從目錄安裝、上傳一個套件，或在開發時連結一個資料夾。',
  'help.ctx.admin-plugins.bullet.1':
    '清單：每個已安裝的外掛，帶版本、狀態、簽章和它持有的權限；每列可以啟用、停用、更新或解除安裝。',
  'help.ctx.admin-plugins.bullet.2': '「上傳外掛」接收一個套件檔案；「重新掃描」會擷取為開發而連結的外掛資料夾。',
  'help.ctx.admin-plugins.bullet.3': '每個外掛的「允許的主機」：外掛可以呼叫的位址，因為對外連線預設被拒絕。',
  'help.ctx.admin-storage.title': '儲存',
  'help.ctx.admin-storage.summary':
    '上傳檔案存放的地方：本機磁碟、S3 儲存桶，或者同時寫入兩者的鏡像。每個上傳分類可以走不同的後端，「健康狀態」告訴你是否每個後端都在回應。',
  'help.ctx.admin-storage.bullet.1':
    '「後端」：每個後端的名稱和類型，帶「測試」「編輯」和「移除」；由環境變數設定的後端在這裡是唯讀的。',
  'help.ctx.admin-storage.bullet.2':
    '「分類」：封面、文件、旅程相片等，每一類都指派給一個後端；變更某一類時會提議搬移現有檔案。',
  'help.ctx.admin-storage.bullet.3':
    '「健康狀態」：每個後端一項檢查，還有一個種子檔案，證明設定就是伺服器所看到的設定。',
  'help.ctx.admin-notifications.title': '通知',
  'help.ctx.admin-notifications.summary':
    '實例向使用者提供的管道，以及能聯絡到你這位管理員的管道。使用者在「設定」裡選自己的主題和 URL；你決定有哪些管道，並設定郵件。',
  'help.ctx.admin-notifications.bullet.1':
    '「應用程式內通知」「電子郵件 (SMTP)」「Ntfy」「Webhook」和「Web 推播」：各一個面板，帶一個向使用者開放該管道的開關，以及它需要的伺服器端設定。',
  'help.ctx.admin-notifications.bullet.2': '「行程提醒」：伺服器是否在行程開始前傳送提醒。',
  'help.ctx.admin-notifications.bullet.3':
    '「管理員 Ntfy」和「管理員 Webhook」：備份失敗或新版本發布這類管理員事件的去向，帶「測試」。',
  'help.ctx.admin-mcp-tokens.title': 'MCP 存取',
  'help.ctx.admin-mcp-tokens.summary':
    'AI 用戶端針對這個 TREK 持有的每個令牌和 OAuth 工作階段，涵蓋所有使用者，並且可以撤銷其中任何一個。',
  'help.ctx.admin-mcp-tokens.bullet.1': '「API 令牌」：誰建立的、最近何時使用，以及「刪除」。',
  'help.ctx.admin-mcp-tokens.bullet.2': '「OAuth 工作階段」：用戶端、使用者和被授予的範圍，以及「撤銷」。',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREK 有什麼新內容：來自 GitHub 的版本歷史、你執行的版本，以及是否有更新的版本。更新本身在應用程式之外、在主機上進行。',
  'help.ctx.admin-github.bullet.1': '「版本歷史」列出各個版本及其說明；最新的一個帶「最新」，你的版本會被標出。',
  'help.ctx.admin-github.bullet.2':
    '一旦有更新的版本，頁首會出現「有可用更新」，並附上 Docker 和其他安裝方式的更新方法。',
  'help.ctx.admin-backup.title': '備份',
  'help.ctx.admin-backup.summary':
    '資料庫和上傳檔案的完整備份，可手動或定時建立，保存在伺服器上，並可作為單一檔案下載。「恢復」把備份放回去。',
  'help.ctx.admin-backup.bullet.1': '「資料備份」：「建立備份」，以及現有備份的清單，帶「下載」「恢復」和刪除。',
  'help.ctx.admin-backup.bullet.2': '「上傳備份」匯入在另一個實例上或更早某天製作的檔案。',
  'help.ctx.admin-backup.bullet.3': '「自動備份」：開或關、間隔、時間和日期，以及保留多少個。',
  'help.ctx.admin-audit.title': '審計日誌',
  'help.ctx.admin-audit.summary':
    '安全相關和管理事件的日誌：登入和失敗、MFA 變更、使用者和設定變更、備份和恢復。唯讀，最新的在前。',
  'help.ctx.admin-audit.bullet.1': '每個事件一列，帶時間、使用者、操作、資源、IP 和詳情。',
  'help.ctx.admin-audit.bullet.2': '「重新整理」重新載入；「載入更多」繼續往回翻。',
  // create-user
  'help.guide.create-user.title': '建立使用者',
  'help.guide.create-user.goal': '不用邀請，手動新增一個帳戶。',
  'help.guide.create-user.step.1': '點選「使用者」分頁頂部的「建立使用者」。',
  'help.guide.create-user.step.2': '輸入「使用者名稱」「郵箱」和「密碼」，並選擇「角色」：「使用者」或「管理員」。',
  'help.guide.create-user.step.3': '點選「建立使用者」。',
  'help.guide.create-user.result': '帳戶出現在表格裡，可以立即登入；請透過你信任的管道把密碼交給對方。',
  'help.guide.create-user.tip.1': '對於應該自己選密碼的人，邀請連結是更好的入口。',
  'help.guide.create-user.tip.2': '管理員能看到這個頁面和審計日誌；其他一切對兩種角色都一樣。',
  // edit-user
  'help.guide.edit-user.title': '變更使用者的角色或密碼',
  'help.guide.edit-user.goal': '提升或降級某人，或在對方遺失密碼後讓其重新登入。',
  'help.guide.edit-user.step.1': '點選該使用者所在列的鉛筆。「編輯使用者」會帶著帳戶詳情開啟。',
  'help.guide.edit-user.step.2':
    '變更「角色」，設定「新密碼」，或者在對方遺失了存放 Passkey 的裝置時點選「重設 Passkey」，然後「儲存」。',
  'help.guide.edit-user.result': '變更從下一次請求起生效；新密碼從下一次登入起可用。',
  'help.guide.edit-user.tip.1': '只要你還是最後一位管理員，就不能去掉自己的管理員角色。',
  'help.guide.edit-user.tip.2': '重設 Passkey 會保留密碼；對方在「設定」的「帳戶」裡新增新的 Passkey。',
  // invite-links
  'help.guide.invite-links.title': '用連結邀請某人',
  'help.guide.invite-links.goal': '讓一個人在封閉實例上註冊，還可以讓其直接進入某個行程。',
  'help.guide.invite-links.step.1': '在「邀請連結」下點選「建立連結」。',
  'help.guide.invite-links.step.2':
    '設定「最大使用次數」和「有效期」，可選擇「加入行程（選填）」，然後點選「建立並複製」。',
  'help.guide.invite-links.step.3':
    '把連結送出去。每一列顯示它被使用了多少次以及由誰建立；「複製連結」可再次複製，用完或過期的連結會被標出。',
  'help.guide.invite-links.result': '開啟連結的人用自己的密碼註冊，如果選了行程，就會直接加入。',
  'help.guide.invite-links.tip.1': '即使「設定」裡關閉了「Password Registration」，邀請連結也照樣有效。',
  'help.guide.invite-links.tip.2': '只用一次、有效期很短的連結，是給單一個人的最安全預設。',
  // delete-user
  'help.guide.delete-user.title': '刪除使用者',
  'help.guide.delete-user.goal': '移除一個帳戶以及只屬於它的一切。',
  'help.guide.delete-user.step.1': '點選該使用者所在列的垃圾桶圖示，並確認「刪除使用者」。',
  'help.guide.delete-user.result': '帳戶、它自己的行程和旅程都沒了；與他人共享的行程留給其餘成員。',
  'help.guide.delete-user.tip.1': '沒有復原。不確定的話先做個備份。',
  'help.guide.delete-user.tip.2': '最後一位管理員不能被刪除；先把別人設為管理員。',
  // permissions
  'help.guide.permissions.title': '決定誰可以做什麼',
  'help.guide.permissions.goal': '按操作設定在這個 TREK 上允許哪個角色執行。',
  'help.guide.permissions.step.1':
    '在「許可權設定」裡，在對應分組中找到該操作，比如「旅行管理」下的「刪除旅行」，然後選擇級別：「所有人」「旅行成員」「旅行所有者」或「僅管理員」。改動過的列會標為「已自定義」。',
  'help.guide.permissions.step.2': '點選「儲存」。「恢復預設」把每一列都放回內建級別。',
  'help.guide.permissions.result': '規則一次對所有旅行生效；級別不夠的人的按鈕和選單會消失。',
  'help.guide.permissions.tip.1': '「旅行所有者」指建立該旅行的人；管理員始終可以做任何事。',
  'help.guide.permissions.tip.2': '寧可降低級別，也不要刪除成員：不能編輯的成員仍然可以查看和留言。',
  // default-map
  'help.guide.default-map.title': '為新使用者設定地圖預設值',
  'help.guide.default-map.goal': '讓每個新帳戶不用個人權杖也有一張能用的地圖。',
  'help.guide.default-map.step.1':
    '在「地圖」下選擇「地圖引擎」；對於 Mapbox 或 MapLibre，設定「地圖樣式」「共用的 Mapbox 權杖」和「高品質模式」；對於點陣地圖，設定「地圖模板」和「共用的 CARTO 金鑰」。',
  'help.guide.default-map.step.2':
    '在你改過的任何欄位旁，「重設」恢復 TREK 自身的選擇。左側的「用戶預設設定」對「顏色模式」、單位和貨幣做同樣的事。',
  'help.guide.default-map.result': '新帳戶以這些設定起步；任何在「設定」裡設過自己地圖的人保留自己的。',
  'help.guide.default-map.tip.1': '在這裡輸入的權杖由所有沒有自己權杖的人共用，所以留意它的配額。',
  'help.guide.default-map.tip.2': '從未動過地圖分頁的現有帳戶也會遵循這些預設值。',
  // packing-templates
  'help.guide.packing-templates.title': '建立打包模板',
  'help.guide.packing-templates.goal': '讓行程有一份可以起步的打包清單，而不是空白一片。',
  'help.guide.packing-templates.step.1': '點選「新建模板」，輸入名稱，用勾號確認。',
  'help.guide.packing-templates.step.2': '開啟模板並點選「新增分類」；每個分類下的 + 新增物品，物品只需要一個名稱。',
  'help.guide.packing-templates.step.3': '一切隨手儲存。鉛筆重新命名模板、分類或物品，垃圾桶刪除它。',
  'help.guide.packing-templates.result': '每個行程的打包清單都會提供這個模板；套用時會複製物品，所以行程可以隨意修改。',
  'help.guide.packing-templates.tip.1': '按行程類型各建一個模板，比如海灘、城市、健行，勝過一份巨大的清單。',
  'help.guide.packing-templates.tip.2': '刪除模板不影響已經套用它的行程。',
  // categories
  'help.guide.categories.title': '管理分類集合',
  'help.guide.categories.goal': '決定地點和收藏可以帶哪些分類，以及它們的樣子。',
  'help.guide.categories.step.1': '點選「新建分類」，取個名字，選一個圖示和一種顏色；「預覽」顯示效果。點選「建立」。',
  'help.guide.categories.step.2': '把滑鼠移到清單中的分類上即可編輯或刪除。刪除會要求確認。',
  'help.guide.categories.result': '這個集合同時套用到所有地方：地點檢視器、地圖圖釘、收藏和篩選器。',
  'help.guide.categories.tip.1': '地點保留的是分類 ID，所以重新命名一個分類會在每個地點上一併改名。',
  'help.guide.categories.tip.2': '被刪除的分類會讓它的地點沒有分類；如果這很重要，先重新指派。',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': '手動維護學校假期',
  'help.guide.school-holiday-catalog.goal': '補上內建假期資料來源沒有涵蓋的國家或地區。',
  'help.guide.school-holiday-catalog.step.1':
    '在「學校假期」下點選「新增國家」，輸入「國家」和它的「國家代碼（如 US）」，然後「儲存」；再為每個有差異的部分「新增地區」。',
  'help.guide.school-holiday-catalog.step.2':
    '點選一個地區開啟「地區或學區」：「新增假期」，為每一段填上「假期名稱」「開始日期」和「結束日期」，然後「儲存」。垃圾桶移除一段假期、一個地區，或者一個已經沒有地區的國家。',
  'help.guide.school-holiday-catalog.result':
    '使用者在 Vacay 的「設定」裡能找到該國家和地區，並在年曆格線上看到這些假期。',
  'help.guide.school-holiday-catalog.tip.1':
    '來自內建資料來源的地區不能在這裡編輯；如果某個日期有誤，就在旁邊新增一個手動地區。',
  // auth-methods
  'help.guide.auth-methods.title': '決定人們如何登入',
  'help.guide.auth-methods.goal': '開放或關閉密碼登入、SSO 和註冊，並要求 2FA。',
  'help.guide.auth-methods.step.1':
    '在「Authentication Methods」下開啟或關閉「Password Login」和「Password Registration」。關閉註冊意味著新帳戶只能透過邀請連結、SSO 或手動建立。',
  'help.guide.auth-methods.step.2':
    '「SSO Login」和「SSO Auto-Provisioning」需要在下方設定好「單點登入 (OIDC)」；自動佈建會在某人第一次透過 SSO 登入時建立帳戶。',
  'help.guide.auth-methods.step.3':
    '「要求雙因素身份驗證（2FA）」讓每個密碼登入的使用者在下次登入時設定驗證器。「Passkey 登入」需要 Relying Party ID 以及存取你的 TREK 所用的來源。',
  'help.guide.auth-methods.result': '登入頁面只提供你保持開啟的那些方式。',
  'help.guide.auth-methods.tip.1': '在你把自己鎖在門外之前會出現警告：至少會保留一條管理員的登入途徑。',
  'help.guide.auth-methods.tip.2': '透過環境變數設定的值在這裡顯示為唯讀。',
  // oidc
  'help.guide.oidc.title': '接入單點登入',
  'help.guide.oidc.goal': '讓人們用你的身分提供者登入。',
  'help.guide.oidc.step.1':
    '在「單點登入 (OIDC)」下輸入按鈕的「顯示名稱」，以及來自你的提供者的「頒發者 URL」「Client ID」和「Client Secret」，然後「儲存」。',
  'help.guide.oidc.step.2': '在「Authentication Methods」下開啟「SSO Login」。',
  'help.guide.oidc.result': '登入頁面顯示 SSO 按鈕；開啟「SSO Auto-Provisioning」後，首次登入的使用者會自動獲得帳戶。',
  'help.guide.oidc.tip.1': '你的提供者需要的重新導向 URI 是你的 TREK 位址加上文件裡的 OIDC 回呼路徑。',
  'help.guide.oidc.tip.2': '宣告對應決定哪些 SSO 群組成為管理員；見文件中的 OIDC 頁面。',
  // instance-keys
  'help.guide.instance-keys.title': '輸入 API 金鑰',
  'help.guide.instance-keys.goal': '為整個實例解鎖 Google 地點搜尋、Unsplash 封面和高德地圖。',
  'help.guide.instance-keys.step.1':
    '在「API 金鑰」下貼上「Google Maps API 金鑰」並點選「測試」；欄位會告訴你金鑰是否回應。',
  'help.guide.instance-keys.step.2':
    '在「該金鑰的用途」下只開啟你願意用該金鑰付費的功能：自動補全、詳情、照片、資訊補充、地點搜尋紀錄。',
  'help.guide.instance-keys.step.3':
    '「Unsplash API 金鑰」驅動封面搜尋；「高德地圖 API Key」驅動中國境內的地點搜尋。用同樣的方式逐個測試。',
  'help.guide.instance-keys.result':
    '使用者無需自己的金鑰就能使用這些功能；沒有 Google 金鑰時，TREK 透過免費的 OpenStreetMap 元件和 TREK Places API 搜尋。',
  'help.guide.instance-keys.tip.1': '使用者在「設定」裡的個人金鑰對該使用者來說優先於實例金鑰。',
  'help.guide.instance-keys.tip.2': '金鑰也可以來自環境變數；那些在這裡顯示為唯讀。',
  // places-transit
  'help.guide.places-transit.title': '選擇搜尋和公共運輸資料來源',
  'help.guide.places-transit.goal': '決定由誰回應地點搜尋和公共運輸路線。',
  'help.guide.places-transit.step.1':
    '在「地點搜尋來源」下選擇「自動」「Google Places」「高德地圖」或「OpenStreetMap」。「自動」使用現有的最佳金鑰。',
  'help.guide.places-transit.step.2':
    '在「公共運輸資料來源」下選擇「Transitous（免費）」，全球可用且無需金鑰，或者「Google」，需要 Google 金鑰。',
  'help.guide.places-transit.result': 'TREK 裡的每個搜尋框和每條公共運輸路線都遵循這個選擇。',
  'help.guide.places-transit.tip.1': '缺少金鑰的資料來源會在這裡顯示警告，並回退到 OpenStreetMap。',
  'help.guide.places-transit.tip.2': 'Google 的公共運輸路線按請求計費；Transitous 不計費。',
  // file-types
  'help.guide.file-types.title': '限制檔案類型',
  'help.guide.file-types.goal': '決定上傳允許哪些副檔名。',
  'help.guide.file-types.step.1': '在「允許的檔案型別」下編輯以逗號分隔的副檔名清單並儲存。',
  'help.guide.file-types.result': '其他類型的上傳會被明確的提示拒絕，無論是在文件、旅程還是封面裡。',
  'help.guide.file-types.tip.1': '把圖片類型留在清單裡；封面和旅程相片走的是同一道檢查。',
  // toggle-addon
  'help.guide.toggle-addon.title': '開啟或關閉擴充套件',
  'help.guide.toggle-addon.goal': '把一個功能模組提供給所有人，或者收回。',
  'help.guide.toggle-addon.step.1': '撥動擴充套件卡片上的開關。導覽項目對所有人同時出現或消失。',
  'help.guide.toggle-addon.step.2':
    '有些卡片帶有選項子列，比如「行李」下的「行李追蹤」或「旅程」下的相片提供者；它們只在擴充套件開啟時顯示。',
  'help.guide.toggle-addon.result': '關閉的擴充套件的資料會保留；重新開啟後再次顯示。',
  'help.guide.toggle-addon.tip.1': '關閉 MCP 會移除端點以及依賴它的「整合」部分。',
  'help.guide.toggle-addon.tip.2': 'Vacay、Atlas 和旅程是使用者要得最多的擴充套件；文件需要儲存空間來放上傳檔案。',
  // install-plugin
  'help.guide.install-plugin.title': '安裝外掛',
  'help.guide.install-plugin.goal': '新增一個第三方外掛，並只給它申請的權限。',
  'help.guide.install-plugin.step.1':
    '開啟「探索」，選一個外掛並點選「安裝」；或者點選「上傳外掛」，選擇一個 .zip 或 .tar.gz 套件。',
  'help.guide.install-plugin.step.2':
    '回到「已安裝」，閱讀該列：外掛可以讀寫什麼、它呼叫哪些主機，以及是否已簽章。開啟「啟用外掛」。',
  'help.guide.install-plugin.step.3':
    '該列的選單提供「重新啟動」「檢視錯誤日誌」「允許的主機」和「更換版本…」；「刪除」解除安裝它。有新版本時該列會提供更新，申請新權限的更新在你核准之前保持關閉。',
  'help.guide.install-plugin.result':
    '外掛在自己的程序裡執行；它新增的內容，如小工具、地圖圖層、工具，出現在外掛宣告的位置。',
  'help.guide.install-plugin.tip.1': '「重新掃描」不需要套件，直接擷取為開發而連結的外掛資料夾。',
  'help.guide.install-plugin.tip.2': '未簽章的外掛會被這樣標出；只在你信任其來源時才安裝。',
  // storage-backends
  'help.guide.storage-backends.title': '把上傳檔案搬到 S3 或鏡像',
  'help.guide.storage-backends.goal': '把檔案放在物件儲存上，或者同時放在磁碟和儲存桶上。',
  'help.guide.storage-backends.step.1':
    '在「後端」下點選「新增後端」，取個「名稱」，選擇「類型」：「本機」「S3」或「鏡像」，填好欄位並「套用」。「測試」檢查連線，「儲存變更」寫入設定。',
  'help.guide.storage-backends.step.2':
    '在「分類」下把每個上傳分類指派給一個後端。變更某一類時會詢問是「移動現有物件」還是「僅路由新寫入」。',
  'help.guide.storage-backends.step.3': '頂部的「健康狀態」檢查每個後端；紅色項目會指出失敗的是什麼。',
  'help.guide.storage-backends.result': '新的上傳進入指派的後端；已搬移的檔案從那裡提供。',
  'help.guide.storage-backends.tip.1': '透過環境變數設定的後端會顯示出來，但不能在這裡編輯。',
  'help.guide.storage-backends.tip.2': '鏡像寫入兩個目標，從第一個讀取；用它可以不停機地搬遷。',
  // channels-instance
  'help.guide.channels-instance.title': '設定通知管道',
  'help.guide.channels-instance.goal': '決定使用者可以選哪些管道，並設定郵件。',
  'help.guide.channels-instance.step.1':
    '在「電子郵件 (SMTP)」下輸入 SMTP Host、SMTP Port、SMTP User、SMTP Password 和 From Address；「傳送測試郵件」會給你發一封郵件。',
  'help.guide.channels-instance.step.2':
    '開啟「Web 推播」「Ntfy」和「Webhook」以提供它們；使用者隨後在「設定」的「通知」裡為每台裝置開啟推播，或輸入自己的主題或 URL。',
  'help.guide.channels-instance.step.3': '「行程提醒」開關行程開始前的提醒；「應用程式內通知」始終開啟，這裡只是說明。',
  'help.guide.channels-instance.result': '每個使用者的「通知」分頁會顯示你開啟的管道。',
  'help.guide.channels-instance.tip.1': '在這裡輸入的預設 ntfy 伺服器會為使用者預填；他們仍然可以指定自己的。',
  'help.guide.channels-instance.tip.2': '一旦具備該能力的外掛被啟用，外掛管道會自行出現。',
  // admin-channels
  'help.guide.admin-channels.title': '在手機上接收管理員事件',
  'help.guide.admin-channels.goal': '得知備份失敗、新版本發布和其他實例事件。',
  'help.guide.admin-channels.step.1':
    '在「管理員 Ntfy」下輸入一個主題，如有需要再填伺服器和令牌；在「管理員 Webhook」下輸入一個 URL。',
  'help.guide.admin-channels.step.2': '點選「傳送測試 Ntfy」或「傳送測試 Webhook」，看訊息是否到達。',
  'help.guide.admin-channels.result': '管理員事件除了發到每位管理員的應用程式內鈴鐺之外，也會發到那裡。',
  'help.guide.admin-channels.tip.1': '把管理員主題和你的個人主題分開，這樣故障通知不會淹沒在行程訊息裡。',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': '撤銷 AI 存取',
  'help.guide.mcp-tokens-admin.goal': '檢視並切斷任何使用者的 AI 用戶端持有的每個令牌和工作階段。',
  'help.guide.mcp-tokens-admin.step.1': '在「API 令牌」下按使用者和名稱找到令牌；垃圾桶刪除它，用戶端立即停止。',
  'help.guide.mcp-tokens-admin.step.2':
    '在「OAuth 工作階段」下對基於瀏覽器的用戶端做同樣的事：用戶端、使用者和日期，垃圾桶撤銷工作階段。',
  'help.guide.mcp-tokens-admin.result': '用戶端必須由它的使用者重新連線；其他一切不變。',
  'help.guide.mcp-tokens-admin.tip.1': '範圍告訴你用戶端能做什麼；唯讀範圍留著無妨。',
  'help.guide.mcp-tokens-admin.tip.2': '關閉 MCP 擴充套件會一次撤銷所有內容。',
  // release-history
  'help.guide.release-history.title': '檢查新版本',
  'help.guide.release-history.goal': '知道你的 TREK 是否最新，以及下一個版本帶來什麼。',
  'help.guide.release-history.step.1':
    '有更新的版本時，管理頁面頂部會顯示「有可用更新」；「在 GitHub 檢視」開啟它，「如何更新」說明 Docker 和其他安裝方式的更新步驟。',
  'help.guide.release-history.step.2':
    '「版本歷史」列出每個版本及其說明；「顯示詳情」展開它們，最新的一個帶「最新」，「載入更多」繼續往回翻。',
  'help.guide.release-history.result': '更新在主機上進行，拉取新映像檔或建置新標籤；資料目錄保持不變。',
  'help.guide.release-history.tip.1': '更新前先做備份；「備份」分頁就在隔壁。',
  'help.guide.release-history.tip.2': '預先發布版本會顯示，但除非你正在執行一個預先發布版本，否則不會作為更新通告。',
  // create-backup
  'help.guide.create-backup.title': '建立並恢復備份',
  'help.guide.create-backup.goal': '給整個實例做快照，在別處留一份副本，並且能夠放回去。',
  'help.guide.create-backup.step.1': '在「資料備份」下點選「建立備份」。它把資料庫和上傳檔案打包成伺服器上的一個檔案。',
  'help.guide.create-backup.step.2': '「下載」把副本保存到這台機器之外；垃圾桶刪除舊備份以釋放空間。',
  'help.guide.create-backup.step.3':
    '對某個備份點「恢復」，或用檔案「上傳備份」，在「恢復備份？」確認一次後取代目前資料。',
  'help.guide.create-backup.result': '恢復會把使用者、行程、檔案和設定帶回到那個備份的時刻；所有人都會被登出。',
  'help.guide.create-backup.tip.1': '恢復是這裡唯一無法復原的操作。先做一個新的備份。',
  'help.guide.create-backup.tip.2': '備份存放在資料目錄裡；只有放到另一台機器上的副本才算真正的備份。',
  // auto-backup
  'help.guide.auto-backup.title': '定時備份',
  'help.guide.auto-backup.goal': '讓伺服器自行備份，並只保留最近幾個。',
  'help.guide.auto-backup.step.1':
    '在「自動備份」下開啟「啟用自動備份」，選擇「間隔」「執行時間」，以及每週或每月時的「星期幾」或「每月幾號」。',
  'help.guide.auto-backup.step.2': '「自動刪除舊備份」設定備份保留多久；新備份產生時，更舊的會被刪除。',
  'help.guide.auto-backup.result': '備份按排程出現在清單裡；失敗會發到管理員管道。',
  'help.guide.auto-backup.tip.1': '時間遵循伺服器的時區，顯示在「審計日誌」分頁裡。',
  'help.guide.auto-backup.tip.2': '伺服器上的儲存空間是有限的；保留三到五個通常就夠了。',
  // audit-log
  'help.guide.audit-log.title': '閱讀審計日誌',
  'help.guide.audit-log.goal': '弄清誰在什麼時候做了什麼。',
  'help.guide.audit-log.step.1':
    '閱讀各列：時間、使用者、操作、資源、IP 和詳情，最新的在前。操作按發生的事情命名，比如登入失敗、MFA 變更或恢復。',
  'help.guide.audit-log.step.2': '「重新整理」重新載入頂部；「載入更多」繼續往回翻。',
  'help.guide.audit-log.result': '一份可以交給任何詢問為什麼有變動的人的紀錄。',
  'help.guide.audit-log.tip.1': '時間以伺服器的時區顯示，時區名稱在表格上方。',
  'help.guide.audit-log.tip.2': '日誌只增不改；這裡的任何內容都不能從應用程式裡編輯或刪除。',
  // document-providers
  'help.guide.document-providers.title': '提供一個文件儲存庫',
  'help.guide.document-providers.goal': '決定旅行可以讓它的文件與哪些儲存庫保持同步。',
  'help.guide.document-providers.step.1':
    '「文件」卡片在它的架子上以列的形式列著各個儲存庫：Paperless-ngx、Papra、Nextcloud、OpenCloud 和 Synology Drive。五個一開始都是關的，而且架子只在「文件」本身開著時才在。',
  'help.guide.document-providers.step.2':
    '撥動 Nextcloud 那一列的開關。提示寫著「擴充套件已更新」，從此旅行擁有者會在他們旅行的「檔案」標籤頁裡看到「文件同步」，Nextcloud 列在「連接提供者」下。',
  'help.guide.document-providers.result':
    '這個儲存庫在這台 TREK 的每趟旅行上都可供使用；在旅行擁有者去連接之前，什麼都沒有連上。',
  'help.guide.document-providers.tip.1':
    '這裡只決定一個儲存庫是否可以提供。位址和憑證屬於某趟旅行，由旅行的擁有者在它的「檔案」標籤頁裡輸入，絕不在管理面板裡。',
  'help.guide.document-providers.tip.2':
    '關掉「文件」會連帶關掉每個儲存庫，而「文件」關著時也開不了任何儲存庫：伺服器會回答「Enable the Documents addon first」。你自己網路裡的儲存庫還需要伺服器上設定 ALLOW_INTERNAL_NETWORK=true。',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': '旅行',
  'help.ctx.trip.summary':
    '一次旅行的全部：包含天數、地圖和地點的計劃，以及交通、預訂、清單、費用、檔案和協作的分頁。它們每一個都有自己的說明頁面，就在本頁面下方。',
  'help.ctx.trip.bullet.1':
    '分頁列：「計劃」「交通」「預訂」「清單」「費用」「檔案」和「Collab」。哪些分頁存在，由你的 TREK 上的擴充套件和外掛決定。',
  'help.ctx.trip.bullet.2':
    '「計劃」是三欄：左邊是天數，中間是地圖，右邊是地點。預訂和交通就住在計劃裡，位於停靠點上和停靠點之間；分頁把它們列出來。',
  'help.ctx.trip.bullet.3': '右上角的「分享」開啟旅行裡的人：成員、訪客、邀請連結和唯讀的公開連結。',
  'help.ctx.trip.bullet.4': '標題、日期、封面和貨幣在「我的旅行」裡編輯，用旅行卡片上的鉛筆。',
  'help.ctx.trip.bullet.5': '欄內側邊緣的折疊箭頭把這一欄收起來，地圖佔據空間；欄旁邊的細分隔線改變它的寬度。',
  'help.ctx.trip.bullet.6': '天數工具列裡的撤銷箭頭收回對計劃的上一次變更。',
  // add-member
  'help.guide.add-member.title': '新增成員',
  'help.guide.add-member.goal': '讓有 TREK 帳號的人可以存取這次旅行。',
  'help.guide.add-member.step.1': '點選右上角的「分享」。',
  'help.guide.add-member.step.2': '在「邀請使用者」下，從清單中選取此人並點選「邀請」。',
  'help.guide.add-member.step.3': '此人現在出現在「訪問許可權」下。皇冠標記所有者；列末的圖示可再次移除訪問許可權。',
  'help.guide.add-member.result': '成員像你一樣檢視和編輯旅行，範圍在管理員於「許可權設定」下設定的層級之內。',
  'help.guide.add-member.tip.1': '清單裡沒有的人還沒有 TREK 帳號：把他們新增為訪客，或者讓他們透過邀請連結註冊。',
  'help.guide.add-member.tip.2': '「訪問許可權」旁邊的數字統計旅行裡的人數；訪客在下方另外列出。',
  // trip-invite-link
  'help.guide.trip-invite-link.title': '透過連結邀請',
  'help.guide.trip-invite-link.goal': '讓別人自己加入旅行。',
  'help.guide.trip-invite-link.step.1': '點選「分享」，然後在「行程邀請連結」下點選「建立邀請連結」。',
  'help.guide.trip-invite-link.step.2': '點選「複製」並傳送連結。任何有 TREK 帳號的人開啟它就會以成員身分加入。',
  'help.guide.trip-invite-link.step.3': '「重新產生」會取代連結並讓舊連結失效；「停用」會關閉它。',
  'help.guide.trip-invite-link.result': '開啟連結的人就在旅行裡了，並顯示在「訪問許可權」下。',
  'help.guide.trip-invite-link.tip.1':
    '沒有帳號的人用不了它。管理員在「管理後臺」、「使用者」下發放註冊連結，並可以把其中一個綁定到這次旅行。',
  'help.guide.trip-invite-link.tip.2': '連結傳錯了聊天時就重新產生：舊連結立刻失效。',
  // add-guest
  'help.guide.add-guest.title': '新增沒有帳號的訪客',
  'help.guide.add-guest.goal': '把一個不用 TREK 的人算進來。',
  'help.guide.add-guest.step.1': '點選「分享」並捲動到「訪客」。',
  'help.guide.add-guest.step.2': '在「訪客姓名」中輸入名字，然後點選「新增訪客」。',
  'help.guide.add-guest.result': '訪客可以被指派到費用、行李物品和任務，但無法登入。',
  'help.guide.add-guest.tip.1': '鉛筆可以幫訪客改名；列末的圖示會把他們連同其分攤和指派一起移除。',
  'help.guide.add-guest.tip.2': '如果這個人後來有了帳號，就把他們邀請為成員，並移除訪客。',
  // public-link
  'help.guide.public-link.title': '發布唯讀連結',
  'help.guide.public-link.goal': '把旅行展示給不應編輯它的人。',
  'help.guide.public-link.step.1':
    '點選「分享」；在右側的「公開連結」下，勾選連結可以顯示的內容。「地圖與計劃」始終開啟；「預訂」「行李」「費用」和「聊天」由你決定。',
  'help.guide.public-link.step.2': '點選「建立連結」，然後點選「複製」。',
  'help.guide.public-link.step.3': '連結存在期間可以隨時變更勾選；「刪除連結」會讓它停止。',
  'help.guide.public-link.result': '任何有連結的人無需登入就能看到所選部分，並且什麼都改不了。',
  'help.guide.public-link.tip.1': '這個連結不會列在任何地方；誰拿到它都能開啟，所以要像對待密碼一樣對待它。',
  'help.guide.public-link.tip.2': '要給編輯權限，就改為把此人新增為成員。',
  // transfer-ownership
  'help.guide.transfer-ownership.title': '移交旅行或退出旅行',
  'help.guide.transfer-ownership.goal': '讓別人成為所有者，或者退出一次不屬於你的旅行。',
  'help.guide.transfer-ownership.step.1':
    '點選「分享」。在「訪問許可權」下，成員列上的皇冠會讓此人成為所有者；確認提問。',
  'help.guide.transfer-ownership.step.2': '你自己那一列上的「退出旅行」會把你帶出旅行；作為所有者，請先移交。',
  'help.guide.transfer-ownership.result': '新所有者管理成員並可以刪除旅行；你仍是一般成員。',
  'help.guide.transfer-ownership.tip.1': '在移交之前，所有者就是建立旅行的人；刪除旅行只有所有者能做。',
  'help.guide.transfer-ownership.tip.2': '另一列上的「移除訪問許可權」是同一個按鈕的反向操作：所有者把成員請出去。',
  // collapse-columns
  'help.guide.collapse-columns.title': '給地圖騰出空間',
  'help.guide.collapse-columns.goal': '收起一欄，或者給它更多寬度。',
  'help.guide.collapse-columns.step.1':
    '點選天數欄內側邊緣的折疊箭頭把它收起來；地圖佔據這塊空間。地點欄有同樣的箭頭。',
  'help.guide.collapse-columns.step.2': '再次點選折疊箭頭，把這一欄找回來。',
  'help.guide.collapse-columns.step.3': '拖曳欄與地圖之間的細分隔線來改變欄的寬度。',
  'help.guide.collapse-columns.result': '寬度會被記住；下次造訪時各欄會恢復展開。',
  'help.guide.collapse-columns.tip.1': '兩欄可以同時收起，得到只有地圖的檢視。',
  'help.guide.collapse-columns.tip.2': '手機上沒有欄：「計劃」和「地點」是地圖底部的兩個按鈕。',
  // undo-change
  'help.guide.undo-change.title': '撤銷上一次變更',
  'help.guide.undo-change.goal': '收回你剛剛對計劃做的事。',
  'help.guide.undo-change.step.1': '點選天數上方工具列裡的撤銷箭頭；它的提示會寫出將要收回的變更。',
  'help.guide.undo-change.result': '計劃恢復原樣，箭頭變灰，直到下一次變更。',
  'help.guide.undo-change.tip.1':
    '撤銷涵蓋計劃：指派、移除、重新排序和移動地點，最佳化路線，刪除地點，類別變更和匯入。',
  'help.guide.undo-change.tip.2': '它只有一步深：只能收回最新的一次變更，新的變更會取代它。',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': '地點',
  'help.ctx.trip-places.summary':
    '計劃的右欄：旅行的每一個地點，無論是否已規劃，帶搜尋和篩選，以及把地點帶進來的各種方式：手動新增、從檔案匯入或從共享清單匯入。',
  'help.ctx.trip-places.bullet.1':
    '頂部的「新增地點/活動」開啟一個表單，用來輸入或搜尋地點。當某一天開啟時，按鈕變成「新地點」，旁邊的「加入當天」直接把地點建立到那一天。',
  'help.ctx.trip-places.bullet.2':
    '「匯入檔案」接受 .gpx、.kml 和 .kmz 檔案；「列表匯入」接受共享的 Google Maps 或 Naver Maps 清單。檔案也可以直接拖放到這一欄上。',
  'help.ctx.trip-places.bullet.3':
    '下拉選單在「全部」「未規劃」「已規劃」之間切換，匯入軌跡之後還會有「路線」；它下方是搜尋框、分類篩選和用於最低評分的星號。',
  'help.ctx.trip-places.bullet.4':
    '一列顯示圖片、名稱以及描述或地址。點選它檢視地點詳細資料，把它拖曳到某一天，或者按右鍵，得到「編輯」「+ 天」「開啟網站」「Google Maps」「儲存到收藏」和「刪除」。',
  'help.ctx.trip-places.bullet.5':
    '在某一天開啟時，未規劃列末尾的 + 會把地點放到那一天，而「已規劃」只列出那一天，旁邊的「顯示整趟行程」可以再次放寬。',
  'help.ctx.trip-places.bullet.6': '篩選列右端的勾選開始一次選取：多列一次獲得新分類、進入某個收藏或被刪除。',
  // create-place
  'help.guide.create-place.title': '建立地點',
  'help.guide.create-place.goal': '手動新增一個地點或活動，連同計劃需要知道的一切。',
  'help.guide.create-place.step.1': '點選地點欄頂部的「新增地點/活動」（某一天開啟時是「新地點」）。表單開啟。',
  'help.guide.create-place.step.2':
    '在頂部的「搜尋地點...」裡輸入地點並選一個結果。「名稱」「地址」「緯度」「經度」和「網站」會自動填好，左側的「地點詳細資料」顯示圖片、營業時間和一段描述。在配了 Google 金鑰的 TREK 上，「不是想找的地點？改用 Google 搜尋」就在結果清單下方，它用 Google 跑同一個搜尋。',
  'help.guide.create-place.step.3':
    '在「地點詳細資料」裡，點選「選擇圖片」下方的一張圖片就把它設為地點的配圖；「使用此文字」把描述接過來填入表單。',
  'help.guide.create-place.step.4':
    '檢查各個欄位：「名稱」必填；「描述」和「備註」由你自己寫；「地址」「緯度」和「經度」來自搜尋或手動輸入；「分類」從旅行的分類裡選一個，旁邊的 + 可以當場新建一個；「網站」放連結。',
  'help.guide.create-place.step.5': '點選「新增」。如果旅行裡已經有同名的地點，表單會說明，按鈕變成「仍要新增」。',
  'help.guide.create-place.result': '地點已經在清單裡和地圖上，在被放到某一天之前位於「未規劃」下。',
  'help.guide.create-place.tip.1':
    '表單底部的「檔案」和「費用」可以給地點附上一份文件，或者在儲存之後立刻開啟它那筆支出的「費用」編輯器。',
  'help.guide.create-place.tip.2':
    '每個 TREK 上回答搜尋的都是 TREK 索引和 OpenStreetMap，「地點詳細資料」則自己從 Wikipedia、Wikivoyage 和 Wikimedia 取內容。只有在這兩者都查不到時才會去問 Google，而且只有 Google 會帶來評分。',
  'help.guide.create-place.tip.3': '地點也可以從地圖開始：在那個位置按右鍵，表單就會帶著座標和地址開啟。',
  // place-to-open-day
  'help.guide.place-to-open-day.title': '把地點直接加到開啟的那一天',
  'help.guide.place-to-open-day.goal': '跳過第二步：建立或選取地點，一次就把它放到那一天。',
  'help.guide.place-to-open-day.step.1':
    '在天數欄裡點選某一天的標題。這一天就開啟了：它的卡片醒目顯示，地點欄多出「加入當天」按鈕。',
  'help.guide.place-to-open-day.step.2':
    '「加入當天」開啟的表單和「新地點」一樣，只是你點選「新增」的那一刻地點就落在開啟的那一天上。',
  'help.guide.place-to-open-day.step.3': '已經存在的地點，用它那一列末尾的 + 或者按右鍵後的「+ 天」放到開啟的那一天。',
  'help.guide.place-to-open-day.step.4':
    '反過來也行，而且不用先打開某一天：把地點的那一列拖出清單，放到某天的卡片上。放在兩個停靠點之間，它就正好落在那裡。',
  'help.guide.place-to-open-day.result': '地點列在那一天下面，排在最後；上下拖曳把它放到該在的位置。',
  'help.guide.place-to-open-day.tip.1':
    '打開的那一天也會影響搜尋：有一天處於打開狀態時，地圖和附近搜尋都從這一天本來要去的地方開始。',
  'help.guide.place-to-open-day.tip.2': '天數上方工具列裡的「撤銷」收回這次指派。',
  // filter-places
  'help.guide.filter-places.title': '在清單裡找到地點',
  'help.guide.filter-places.goal': '把這一欄收窄到你要找的地點。',
  'help.guide.filter-places.step.1':
    '頂部的下拉選單在「全部」、「未規劃」（還不在任何一天上）、「已規劃」（在某一天上）和「路線」（匯入的 GPX 軌跡）之間切換，每一項都帶數量。',
  'help.guide.filter-places.step.2': '在「搜尋地點...」裡輸入；清單隨著輸入不斷收窄。',
  'help.guide.filter-places.step.3':
    '「所有分類」開啟一個清單，可以勾選一個或多個分類，「無分類」也在其中；底部的「清除篩選」把它重設。',
  'help.guide.filter-places.step.4': '旁邊的星號設定最低評分：5+、4+ 等等，只顯示你評分不低於該值的地點。',
  'help.guide.filter-places.result': '列上方的數字說明有多少地點符合；各個篩選條件會疊加。',
  'help.guide.filter-places.tip.1':
    '某一天開啟時，「已規劃」只列出那一天並會說明：「僅顯示目前開啟的日期」，旁邊是「顯示整趟行程」。',
  'help.guide.filter-places.tip.2': '地圖同樣收窄到開啟的那一天；清單裡的「全部」仍然顯示旅行的每一個地點。',
  // edit-place
  'help.guide.edit-place.title': '修改地點',
  'help.guide.edit-place.goal': '改個名字、挪一下圖釘、加上網站或者換個分類。',
  'help.guide.edit-place.step.1': '在該列按右鍵並選擇「編輯」，或者開啟地點並在它的詳細資料裡點選「編輯」。',
  'help.guide.edit-place.step.2':
    '改你需要的：「名稱」「描述」「備註」「地址」「緯度」和「經度」「分類」「網站」。從某一天開啟時，表單裡還有「當天備註」以及那一天的「開始」和「結束」。',
  'help.guide.edit-place.step.3': '點選「更新」。',
  'help.guide.edit-place.result': '變更在地點出現的所有地方生效：清單、地圖和它所在的每一天。',
  'help.guide.edit-place.tip.1': '「當天備註」屬於這個地點在那一天上的項目；「備註」屬於地點本身。',
  'help.guide.edit-place.tip.2':
    '「結束」早於「開始」會擋住「更新」；「時間衝突：」只是提醒當天另有一個停靠點用了相同的時間。',
  // delete-place
  'help.guide.delete-place.title': '刪除地點',
  'help.guide.delete-place.goal': '把一個地點徹底移出旅行。',
  'help.guide.delete-place.step.1': '在該列按右鍵並選擇「刪除」，或者在地點詳細資料裡點選「刪除」。',
  'help.guide.delete-place.step.2':
    '確認。如果這個地點上訂了一晚住宿，或者有預訂與它相關，提示會說明會一併消失的內容。',
  'help.guide.delete-place.result': '地點從清單、地圖和每一天都消失了；天數上方工具列裡的「撤銷」能把它找回來。',
  'help.guide.delete-place.tip.1': '只想把地點從某一天上拿掉，就改在那個停靠點上用「從當天移除」。',
  'help.guide.delete-place.tip.2': '一次處理多個地點：篩選旁邊的勾選開始一次選取。',
  // select-places
  'help.guide.select-places.title': '一次修改或刪除多個地點',
  'help.guide.select-places.goal': '一次整理清單，而不是一個一個來。',
  'help.guide.select-places.step.1': '點選篩選列右端的勾選。各列出現核取方塊，並出現一條帶有各項操作的操作列。',
  'help.guide.select-places.step.2': '勾選各列，或者用操作列上的「全選」；操作列會統計選取的數量。',
  'help.guide.select-places.step.3':
    '「Change category」給它們全部同一個分類；「儲存到收藏」把它們複製到你的某個收藏裡；「刪除所選」在確認之後把它們移除。',
  'help.guide.select-places.step.4': '再次點選勾選即可退出選取。',
  'help.guide.select-places.result': '變更作用於每一個選取的地點；刪除可以從天數上方的工具列撤銷。',
  'help.guide.select-places.tip.1': '選取期間篩選仍然有效：先篩到「未規劃」，再用「全選」就正好抓到那些。',
  'help.guide.select-places.tip.2':
    '收藏擴充套件開啟時，操作列上會出現「在清單中標記為已造訪」：它會在這些地點所儲存的收藏裡把它們勾掉。',
  // import-places-file
  'help.guide.import-places-file.title': '從 GPX、KML 或 KMZ 檔案匯入地點',
  'help.guide.import-places-file.goal': '把 Google My Maps、Google Earth 或 GPS 記錄器匯出的內容帶進來。',
  'help.guide.import-places-file.step.1': '點選「匯入檔案」，或者把檔案拖放到地點欄的任意位置。',
  'help.guide.import-places-file.step.2':
    '選擇檔案或把它拖進方框。對於 GPX，勾選要匯入的內容：「路點」「路線」「軌跡（含路徑幾何）」；對於 KML 和 KMZ，是「點（Placemarks）」和「路徑（LineStrings）」。',
  'help.guide.import-places-file.step.3':
    '方框一次可以接收多個檔案，而且只接收 .gpx、.kml 和 .kmz。其他類型的檔案，或者超過 10 MB 的檔案，會在對話方塊裡被拒絕，不會匯入。',
  'help.guide.import-places-file.step.4':
    '點選「匯入」。會有一則訊息說明進來了多少地點；如果是 KML 或 KMZ 檔案，對話方塊會繼續開著，並給出建立了什麼、跳過了什麼的摘要。',
  'help.guide.import-places-file.result':
    '地點已經在清單裡；軌跡的列上帶有路線標記，會畫在地圖上，並獲得自己的「路線」篩選項。',
  'help.guide.import-places-file.tip.1': '檔案過大會被拒絕並給出大小上限；去掉照片重新匯出，或者把它拆開。',
  'help.guide.import-places-file.tip.2': '整次匯入可以從天數上方的工具列撤銷。',
  // import-places-list
  'help.guide.import-places-list.title': '匯入共享的 Google Maps 或 Naver Maps 清單',
  'help.guide.import-places-list.goal': '把共享清單的連結變成地點。',
  'help.guide.import-places-list.step.1': '點選「列表匯入」並選擇「Google 列表」或「Naver 列表」。',
  'help.guide.import-places-list.step.2':
    '貼上該清單的共享連結。Google Maps 的路線規劃連結也可以：它的各個停靠點會按駕車順序變成地點。',
  'help.guide.import-places-list.step.3': '點選「匯入」。',
  'help.guide.import-places-list.result': '清單裡的每個地點都進了旅行，名稱與清單中一致；旅行裡已有的地點會被跳過。',
  'help.guide.import-places-list.tip.1': '清單必須公開共享；私人清單的連結什麼也匯不進來。',
  'help.guide.import-places-list.tip.2':
    '當你的 TREK 配有 Google 金鑰時，對話方塊裡會出現「透過 Google 豐富地點資訊」：它會逐個查詢匯入的地點，補上照片、地址和詳細資料。',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': '天',
  'help.ctx.trip-days.summary':
    '計劃的左欄：每天一張卡片，上面是按順序排列的停留點、備註、當天的預訂和交通，以及停留點之間的路線。行程真正被規劃的地方就在這裡。',
  'help.ctx.trip-days.bullet.1':
    '頂部的工具列：「匯出」（PDF、行事曆、GPX）、「Expand all days」/「Collapse all days」、撤銷箭頭、「重新排序日期」和「顯示所有預訂路線」。',
  'help.ctx.trip-days.bullet.2':
    '一張日期卡片：標題列裡有天數、天氣、標題、日期和當天的費用；點選標題列開啟這一天，它的摺疊箭頭把卡片收起來。「大眾運輸」「新增交通」和「新增備註」也在標題列裡。',
  'help.ctx.trip-days.bullet.3':
    '一天內部：按順序排列的停留點，每個都有圖片、名稱、時間和圖片上的鎖；備註；屬於這一天的預訂；以及停留點之間每一段的行程時間。',
  'help.ctx.trip-days.bullet.4':
    '停留點下方是路線列：「路線」把這一天畫在地圖上，「最佳化」給停留點排序，「開車」/「步行」設定當天的交通方式，「在 Google Maps 中開啟」和「在 CoMaps 中開啟」把這一天交出去。',
  'help.ctx.trip-days.bullet.5':
    '地點進入某一天的方式：從地點欄拖一列過來、用該列上的 +、在空的一天用「新增地點到這一天」，或者從地點詳細資料裡。',
  'help.ctx.trip-days.bullet.6': '底部的「總費用」把每一個帶價格的停留點和預訂按行程的貨幣加起來。',
  // read-day-plan
  'help.guide.read-day-plan.title': '讀懂一天',
  'help.guide.read-day-plan.goal': '在動手改動之前，先知道日期卡片的每一部分在告訴你什麼。',
  'help.guide.read-day-plan.step.1':
    '標題列：天數、當天的天氣預報、「第 1 天」或你給它起的標題、日期和當天的費用。點選標題列開啟這一天（它的「日程詳情」面板在地圖上方開啟）；右側的摺疊箭頭把卡片收起或展開。',
  'help.guide.read-day-plan.step.2':
    '一個停留點：左邊的握把用來拖曳，圖片上帶著用於路線最佳化的鎖，接著是名稱、描述，以及設定過的話，「當天備註」。停留點有時間時會顯示一個標出「開始」和「結束」的時間標籤；它右端出現的箭頭把它上移或下移。',
  'help.guide.read-day-plan.step.3':
    '當天的預訂：綁在某個停留點上的預訂會把這個停留點標為「預訂已確認」或「預訂待確認」；交通顯示為「出發」或「到達」，帶時間和路線，旁邊一個小開關把那條路線畫在地圖上。',
  'help.guide.read-day-plan.step.4':
    '兩個停留點之間的連接線按當天的交通方式說明這一段要多久、有多遠；點選它就能只改這一段的方式。',
  'help.guide.read-day-plan.step.5':
    '末尾的路線列：「路線」把這一天的路畫在地圖上，「最佳化」重排停留點，方式按鈕選擇「開車」或「步行」，「在 Google Maps 中開啟」和「在 CoMaps 中開啟」把這一天在那裡開啟。',
  'help.guide.read-day-plan.result': '卡片上的每個符號都有含義；下面的指南會逐個改動它們。',
  'help.guide.read-day-plan.tip.1':
    '按右鍵點一個停留點開啟它的選單：「編輯」「從當天移除」「開啟網站」、導航應用程式（Google Maps、Waze、Apple Maps、OpenStreetMap、CoMaps）、「儲存到收藏」「刪除」。',
  'help.guide.read-day-plan.tip.2':
    '把滑鼠停在一個停留點上，末尾會出現「新增預訂」：在那裡建立的預訂就綁在這一天的這個停留點上。',
  // place-onto-day
  'help.guide.place-onto-day.title': '把地點放到某一天',
  'help.guide.place-onto-day.goal': '把清單裡的地點變成某一天的停留點，放在順序中它該在的位置。',
  'help.guide.place-onto-day.step.1':
    '從地點欄把一列拖到日期卡片上。放在兩個停留點之間就正好插在那裡，放在卡片的任意位置則追加到末尾。',
  'help.guide.place-onto-day.step.2':
    '不用拖曳：點選標題列開啟這一天，然後點選地點列末尾的 +，或者按右鍵點該列並選擇「+ 天」。',
  'help.guide.place-onto-day.step.3': '在空的一天，「新增地點到這一天」開啟地點表單，新地點立刻落在這一天上。',
  'help.guide.place-onto-day.step.4':
    '在地點詳細資料裡，「新增到當天」會問放到哪一天；某一天開啟時，地點欄裡的「加入當天」直接在開啟的那一天建立一個新地點。',
  'help.guide.place-onto-day.result':
    '這個地點成了當天的停留點，在地圖上帶著這一天的編號，地點欄把它算在「已規劃」下。',
  'help.guide.place-onto-day.tip.1':
    '一個地點可以在多天上：第二天還是從地點欄放過去。把停留點從一張日期卡片拖到另一張，則是移動它。',
  'help.guide.place-onto-day.tip.2': '工具列裡的撤銷箭頭可以收回這次指派。',
  'help.guide.place-onto-day.tip.3':
    '停留點不能放在兩個有固定時間的條目之間，也不能放在已經定了時間的預訂之前；計劃會保持時間順序。',
  // reorder-stops
  'help.guide.reorder-stops.title': '改變一天的順序',
  'help.guide.reorder-stops.goal': '把停留點上移、下移，或者挪到另一天。',
  'help.guide.reorder-stops.step.1': '抓住停留點的握把，把它拖到卡片裡的新位置。',
  'help.guide.reorder-stops.step.2': '或者用停留點右端的箭頭：每點一次上移或下移一格。',
  'help.guide.reorder-stops.step.3': '把停留點拖到另一張日期卡片上就移到那一天，它會離開原來的一天。',
  'help.guide.reorder-stops.step.4':
    '移動一個有固定時間的停留點時，如果這次移動會打亂當天的順序，就會問「移除時間？」，因為決定它位置的正是這個時間：「確認」丟掉時間，讓它可以去任何位置。',
  'help.guide.reorder-stops.result': '路線和行程時間立刻跟著新的順序。',
  'help.guide.reorder-stops.tip.1': '有固定時間的預訂無法重新排序；它們停在時間給它們的位置上。',
  'help.guide.reorder-stops.tip.2': '路線列裡的「最佳化」按最短路徑給一整天排序；想讓某個停留點留在原處，先給它上鎖。',
  // set-stop-times
  'help.guide.set-stop-times.title': '給停留點一個時間',
  'help.guide.set-stop-times.goal': '定下停留點什麼時候開始、什麼時候結束，讓這一天讀起來像一份時間表。',
  'help.guide.set-stop-times.step.1': '按右鍵點停留點並選擇「編輯」。從這一天開啟時，表單底部有「開始」和「結束」。',
  'help.guide.set-stop-times.step.2':
    '填寫「開始」，需要的話再填「結束」。「時間衝突：」會提示當天另一個有時間的停留點與它重疊；早於「開始」的「結束」會擋住「更新」。',
  'help.guide.set-stop-times.step.3': '點選「更新」。停留點得到一個時間標籤，並移到這一天裡它的時間所屬的位置。',
  'help.guide.set-stop-times.result': '有時間的停留點保住它們在順序中的位置；沒有時間的停留點圍著它們排列。',
  'help.guide.set-stop-times.tip.1': '時間屬於那一天的那個停留點；同一個地點在另一天可以有另一個時間。',
  'help.guide.set-stop-times.tip.2':
    '要手動移動一個有時間的停留點，就拖它：只要你點「確認」，「移除時間？」這個問題就會在途中丟掉時間。',
  'help.guide.set-stop-times.tip.3':
    '同一個表單裡的「當天備註」裝的是只適用於這一天的內容，比如訂好的一張桌子、一個票號。',
  // remove-from-day
  'help.guide.remove-from-day.title': '把停留點從某一天拿掉',
  'help.guide.remove-from-day.goal': '取消一個地點的規劃，但不把它從行程裡刪掉。',
  'help.guide.remove-from-day.step.1': '按右鍵點停留點並選擇「從當天移除」。',
  'help.guide.remove-from-day.step.2':
    '停留點從這一天消失；地點留在地點欄裡，如果它不在任何其他天上，就在「未規劃」之下。',
  'help.guide.remove-from-day.result': '這一天、它的路線和費用都會更新；撤銷箭頭把停留點找回來。',
  'help.guide.remove-from-day.tip.1': '同一個選單裡的「刪除」會把這個地點從整趟行程裡移除，包括每一天。',
  'help.guide.remove-from-day.tip.2': '「從當天移除」也在地點的詳細資料面板裡，就在「新增到當天」旁邊。',
  // lock-stop
  'help.guide.lock-stop.title': '把停留點鎖在原位',
  'help.guide.lock-stop.goal': '在最佳化路線時讓停留點留在它現在的位置。',
  'help.guide.lock-stop.step.1': '把滑鼠停在停留點的圖片上並點選那把鎖：「路線最佳化時保持位置」。',
  'help.guide.lock-stop.step.2': '現在「最佳化」會圍著它給其他停留點排序；再點一次鎖（「點選解鎖」）就放開它。',
  'help.guide.lock-stop.result': '鎖會顯示在圖片上；在你解鎖之前，停留點保持它的位置。',
  'help.guide.lock-stop.tip.1': '有固定時間的停留點被它的時間鎖住；它在最佳化中絕不會移動。',
  'help.guide.lock-stop.tip.2':
    '鎖只在這次造訪期間有效：重新載入之後每個停留點又都自由了，只有有時間的停留點仍然固定。',
  // day-note
  'help.guide.day-note.title': '給一天加一則備註',
  'help.guide.day-note.goal': '把一個提醒、一個票號或者一個備用方案直接放在這一天裡。',
  'help.guide.day-note.step.1': '在這一天的標題列點選「新增備註」。',
  'help.guide.day-note.step.2':
    '在「備註」裡給它起個名字，日期卡片上顯示的就是它，其餘的寫在「每日備註」裡。上方的「格式」工具列負責排版（「粗體」「項目符號清單」「編號清單」「連結」「引用」），左邊的「預覽」顯示它將變成的卡片。',
  'help.guide.day-note.step.3': '挑一個「圖示」和一種「顏色」，讓備註從停留點中間顯出來，然後「新增」。',
  'help.guide.day-note.step.4': '備註像停留點一樣待在這一天裡：拖曳它到合適的位置，按右鍵點它得到「編輯」和「刪除」。',
  'help.guide.day-note.result': '備註是這一天的一部分，PDF 裡也有；帶時間的備註會和有時間的停留點一起排序。',
  'help.guide.day-note.tip.1': '帶時間的備註可以頂替一趟你沒有預訂的交通：「08:15 從中央車站搭 S3」。',
  'help.guide.day-note.tip.2': '備註是按天的；面向整趟行程的備註屬於 Collab。',
  // day-route
  'help.guide.day-route.title': '顯示並最佳化當天的路線',
  'help.guide.day-route.goal': '看清停留點之間的路，選擇怎麼出行，並讓 TREK 來排順序。',
  'help.guide.day-route.step.1':
    '開啟這一天並點選路線列裡的「路線」：停留點之間的路畫在地圖上，停留點之間的連接線顯示每一段的時間和距離。',
  'help.guide.day-route.step.2':
    '旁邊的「開車」和「步行」設定當天的交通方式；各段會重新計算。外掛可以加進自己的交通方式。',
  'help.guide.day-route.step.3': '點選一條連接線來改這一段的方式：選一種方式，或者用「使用當日預設」退回當天的方式。',
  'help.guide.day-route.step.4':
    '「最佳化」按最短路徑重排停留點。帶鎖或有固定時間的停留點保住它們的位置；當天有住宿時，路線從那裡開始。',
  'help.guide.day-route.step.5':
    '「在 Google Maps 中開啟」或「在 CoMaps 中開啟」會把一整天作為一條路線在那個應用裡開啟，方便路上導航。',
  'help.guide.day-route.result': '這一天成了一條帶時間的路線；順序一變，「總費用」和各段就會更新。',
  'help.guide.day-route.tip.1': '路線預設來自 OSRM；管理員可以在「用戶預設設定」裡把 TREK 指向另一個路線引擎。',
  'help.guide.day-route.tip.2': '算不出路線的一段不顯示時間；檢查兩個停留點是否都有座標。',
  'help.guide.day-route.tip.3': '撤銷箭頭可以收回一次最佳化。',
  // manage-days
  'help.guide.manage-days.title': '新增、重排和重新命名日期',
  'help.guide.manage-days.goal': '塑造日期本身，而不只是日期上的內容。',
  'help.guide.manage-days.step.1':
    '日期來自行程的日期範圍；在「儀表板」的行程卡片上改日期，兩端就會增加或減少天數。在刪掉有內容的日期之前，會有一個清單說明哪些日期會被去掉、上面有什麼。',
  'help.guide.manage-days.step.2':
    '工具列裡的「重新排序日期」開啟一個清單：「上移」和「下移」連同這一天上的一切一起挪動，旁邊的垃圾桶「刪除這一天」會刪掉它。清單下方，帶有下一個日期的按鈕會在最後一個有日期的天之後緊接著新增一天，並把行程延長一天；「無日期」在末尾追加一個沒有日期的天。',
  'help.guide.manage-days.step.3':
    '「刪除這一天」會先詢問：清單顯示會隨這一天一起消失的內容，包括地點、筆記和預訂、這天辦理入住或退房的住宿，以及會提前一個日期的天。「刪除這一天」會刪掉它，「取消」則保留；最後一天不能刪除。',
  'help.guide.manage-days.step.4':
    '要給一天改名，開啟它，在地圖上方的「日程詳情」面板裡點選標題旁邊的鉛筆；這個名字會在卡片裡和 PDF 裡代替「第 1 天」。',
  'help.guide.manage-days.step.5':
    '工具列裡的「Expand all days」和「Collapse all days」一次收起或展開所有卡片；單張卡片用它的摺疊箭頭收起。',
  'help.guide.manage-days.result': '日期跟著位置走：往上挪的一天拿到更早的日期，它的停留點、備註和預訂都跟著一起走。',
  'help.guide.manage-days.tip.1': '移動日期可以從工具列撤銷，刪除一天則不能。',
  'help.guide.manage-days.tip.2': '一天標題列裡的費用把這一天帶價格的停留點和預訂加起來。',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': '讀懂計劃裡的預訂和交通',
  'help.guide.bookings-in-plan.goal': '知道一份預訂存在之後會出現在哪裡，以及哪個畫面建立它。',
  'help.guide.bookings-in-plan.step.1':
    '一趟交通（航班、火車、渡輪、公車、汽車）在出發那天顯示為「出發」，在到達那天顯示為「到達」，帶時間和路線；跨多天的會橫跨中間的日子。',
  'help.guide.bookings-in-plan.step.2':
    '綁在某個停留點上的預訂（餐廳、旅遊團）會把那個停留點標為「預訂已確認」或「預訂待確認」；有日期但沒有停留點的預訂在這一天裡自成一列。',
  'help.guide.bookings-in-plan.step.3':
    '在飯店過的一夜是住宿：它在當天的「日程詳情」面板裡「住宿」下面，從「入住」到「退房」，而這幾天裡每一天的路線都從那裡開始。',
  'help.guide.bookings-in-plan.step.4':
    '在地圖上，交通那一列上的開關會畫出它的路線；工具列裡的「顯示所有預訂路線」把它們全都畫出來。',
  'help.guide.bookings-in-plan.step.5':
    '建立的地方：停留點停留滑鼠時出現的「新增預訂」、日期標題列裡的「新增交通」和「大眾運輸」，以及帶匯入和檔案的完整清單「預訂」和「交通」分頁。',
  'help.guide.bookings-in-plan.result': '一份預訂，在計劃裡只有一個位置；分頁裡是同樣這些預訂，只是列成了表。',
  'help.guide.bookings-in-plan.tip.1':
    '「已確認」和「待確認」是你在預訂上設定的狀態；計劃把它顯示在停留點上，「預訂」分頁兩者都計入。',
  'help.guide.bookings-in-plan.tip.2': '有固定時間的交通無法拖曳；請改到預訂裡去改它的時間。',
  // export-plan
  'help.guide.export-plan.title': '匯出計劃',
  'help.guide.export-plan.goal': '把計劃作為文件、帶進行事曆或放到 GPS 上隨身帶走。',
  'help.guide.export-plan.step.1': '點選日期上方工具列裡的「匯出」。',
  'help.guide.export-plan.step.2':
    '「文件」：「PDF」開啟每一天的列印檢視，連同它的停留點、備註和預訂；「每天分頁」讓每一天從新的一頁開始，「儲存為 PDF」把它下載下來。',
  'help.guide.export-plan.step.3':
    '「行事曆」：「下載 .ics」把預訂存成一個行事曆檔案；「訂閱行事曆」給出一個連結，你的行事曆應用會自己重新整理它。',
  'help.guide.export-plan.step.4':
    '「地圖與 GPS · GPX」：「整趟行程」匯出地點、每天的路線和軌跡；「僅地點」只匯出圖釘；「按天產生路線」每天一條路線，供離線地圖和 GPS 裝置使用。',
  'help.guide.export-plan.result': '檔案會下載下來；行程裡什麼都不會變。',
  'help.guide.export-plan.tip.1':
    '單獨一天可以從它的路線列送到地圖應用：「在 Google Maps 中開啟」或「在 CoMaps 中開啟」。',
  'help.guide.export-plan.tip.2': '「訂閱行事曆」需要在你的設定裡開啟行事曆訂閱；「儀表板」裡有相應的指南。',
  'help.guide.export-plan.tip.3': '匯出屬於讀取：行程的每一位成員都可以做。',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': '地點詳細資料',
  'help.ctx.trip-place.summary':
    '選取一個地點時在地圖上開啟的卡片：旅行關於它知道的一切、大家給它的星、它的圖片和檔案，以及把它放到開啟的那一天、放進某個清單或交給地圖應用程式的按鈕。',
  'help.ctx.trip-place.bullet.1':
    '點選地點欄裡的一列、某一天裡的一個停靠點，或者地圖上的一個標記，卡片就在地圖上開啟。在某一天裡選取它，卡片就知道你指的是哪個停靠點，這也正是把該停靠點的參與者和它的預訂一起帶出來的原因。',
  'help.ctx.trip-place.bullet.2':
    '頭部帶著圓形圖片、名稱、分類、地址和座標。點選圖片可以換成你自己的，按兩下名稱可以當場重新命名地點，右邊的 X 關閉卡片。',
  'help.ctx.trip-place.bullet.3':
    '下面是：有價格時的價格、每位旅行者給這個地點的星、描述和備註，以及停靠點帶有備註時的「當天備註」。',
  'help.ctx.trip-place.bullet.4':
    '接著按適用情況顯示「營業時間」「軌跡顏色」「軌跡資料」和「檔案」。「檔案」接收你資料夾裡的任何東西，也會列出掛在這個停靠點預訂上的檔案。',
  'help.ctx.trip-place.bullet.5':
    '底部那一列：某一天開啟時是「新增到當天」或「從當天移除」，然後是「儲存到收藏」「導航」「開啟網站」「編輯」和「刪除」。',
  'help.ctx.trip-place.bullet.6':
    '從搜尋裡挑出來的地點帶著 TREK 索引或 OpenStreetMap 對它的了解：圖片周圍綠色的「營業中」或紅色的「已關閉」圓環，按地點自己的時鐘判斷；星星下方的電話號碼；再往下的「營業時間」，那一列寫著當天的時段，點一下展開整週；以及「開啟網站」背後的網站。Google 的評分只在透過 Google 找到的地點上顯示，且這台 TREK 要有 Google 金鑰。',
  // read-place
  'help.guide.read-place.title': '卡片告訴你關於一個地點的什麼',
  'help.guide.read-place.goal': '在一張卡片裡讀到旅行關於一個地點知道的一切。',
  'help.guide.read-place.step.1': '在天數欄裡點選你想讀的停靠點。卡片在地圖上開啟，該停靠點在它那一天裡保持醒目。',
  'help.guide.read-place.step.2':
    '頭部：圓形圖片、名稱、地址和精確座標。圖片周圍帶「營業中」的綠色圓環或帶「已關閉」的紅色圓環，說明這個地點此刻是否營業，按它自己的時鐘判斷，前提是 TREK 知道它的營業時間。右邊的 X 再次關閉卡片。',
  'help.guide.read-place.step.3':
    '下面是每位旅行者給這個地點的星，帶平均分和投票人數。還沒有人評分時顯示「尚未評分」。緊接著是電話號碼，如果地點有的話：點一下就把號碼交給你的電話應用程式。',
  'help.guide.read-place.step.4':
    '然後是描述，下面是備註。兩者都是地點表單裡的文字算繪後的樣子：清單、連結和粗體都有效。',
  'help.guide.read-place.step.5': '「參與者」說明誰會去這個停靠點。在你把某人移出去之前，所有人都在。',
  'help.guide.read-place.step.6':
    '再往下是「營業時間」：那一列寫著你正在看的那一天的時段，點一下展開整週，那一天以粗體顯示。「檔案」就在它旁邊。',
  'help.guide.read-place.result':
    '卡片會一直開著，直到你用 X 關閉它或選取另一個地點，整週的營業時間保持展開，而它所屬的停靠點在天數欄裡保持醒目。',
  'help.guide.read-place.tip.1':
    '從地點欄選取時，卡片認得這個地點但不認得某個停靠點，所以不顯示參與者也不顯示預訂。改在某一天裡選取那個停靠點，兩者就都在。',
  'help.guide.read-place.tip.2': '按兩下名稱可以不開啟表單就重新命名地點。Enter 儲存，Escape 放棄修改。',
  'help.guide.read-place.tip.3':
    '手動輸入的地點不顯示這些：卡片只知道它表單裡的內容。用「編輯」開啟它，在「搜尋地點...」下方的建議裡選取它，再點選「更新」，營業時間、電話號碼和網站就會一起帶進來。Google 的評分需要 Google 金鑰。',
  // rate-place
  'help.guide.rate-place.title': '給一個地點評分',
  'help.guide.rate-place.goal': '給地點打上你自己的星，並看看別人都給了多少。',
  'help.guide.rate-place.step.1': '開啟這個地點。星號列就在頭部下面，帶著到目前為止投票的平均分，括號裡是票數。',
  'help.guide.rate-place.step.2': '點選你想給的那顆星。滑鼠劃過時星會依次點亮，所以你能看到自己將要給出多少。',
  'help.guide.rate-place.step.3':
    '你的一票立刻計入平均分，旁邊的頭像就是投過票的人。滑鼠移到這一列上可以看到每個人給的星。',
  'help.guide.rate-place.step.4': '同一個平均分也在地點欄裡該地點那一列上，所以好地點在清單裡很顯眼。',
  'help.guide.rate-place.result':
    '你的星留在地點上，整趟旅行都看得到，而清單上方篩選列裡的星號現在可以只保留達到某個下限的地點。',
  'help.guide.rate-place.tip.1': '每位旅行者都可以評分，即使在只有部分人可以「新增 / 編輯 / 刪除地點」的旅行裡也一樣。',
  'help.guide.rate-place.tip.2': '點選你已經給過的那顆星就能收回你的一票。當沒有人再投票時，地點又顯示「尚未評分」。',
  'help.guide.rate-place.tip.3': '星號旁邊最多能放下六位投票者的頭像；提示會列出他們全部，並標出你的那一票。',
  // place-image
  'help.guide.place-image.title': '給地點放上你自己的圖片',
  'help.guide.place-image.goal': '用你自己的照片取代自動的縮圖。',
  'help.guide.place-image.step.1': '從地點欄開啟這個地點。',
  'help.guide.place-image.step.2':
    '滑鼠移到頭部的圓形圖片上：出現一個相機，提示寫著「上傳圖片」。點選它並選擇你的檔案。',
  'help.guide.place-image.step.3': '頭部現在顯示你的圖片，角上有一個紅色小 X。',
  'help.guide.place-image.step.4': '同一張圖片也在地點欄裡該地點那一列上，以及它在地圖上的標記上。',
  'help.guide.place-image.result':
    '你的圖片在所有地方都是這個地點的圖片：卡片、地點欄、當天裡的停靠點、地圖上的標記，以及共享出去的旅行。',
  'help.guide.place-image.tip.1': 'JPG、PNG、GIF 和 WebP 都接收，來自 iPhone 的 HEIC 會在進來的路上轉換。',
  'help.guide.place-image.tip.2': '角上的 X 會再次移除你的圖片，自動圖片就回來了。地點本身不受影響。',
  'help.guide.place-image.tip.3': '沒有你自己的圖片時，TREK 會根據地點的座標去找一張，找不到就退回到分類的圖示。',
  // place-day-assign
  'help.guide.place-day-assign.title': '把地點放到開啟的那一天，或者移出來',
  'help.guide.place-day-assign.goal': '用卡片自己的按鈕，而不是把列拖過整個規劃器。',
  'help.guide.place-day-assign.step.1': '在天數欄裡點選某一天的標題。那一天現在是開啟的那天，卡片就針對它運作。',
  'help.guide.place-day-assign.step.2':
    '在地點欄裡點選一個還不在那一天的地點。它的卡片開啟，底部那一列給出「新增到當天」。',
  'help.guide.place-day-assign.step.3': '點選「新增到當天」。停靠點落在那一天的末尾，按鈕變成「從當天移除」。',
  'help.guide.place-day-assign.step.4': '停靠點現在在那一天裡，排在清單最後。把它往上拖到該在的位置。',
  'help.guide.place-day-assign.step.5': '「從當天移除」把那個停靠點再次從這一天拿掉，卡片又給出「新增到當天」。',
  'help.guide.place-day-assign.result': '這一天帶著這個停靠點，或者不再帶著它，而無論哪種情況地點本身都不受影響。',
  'help.guide.place-day-assign.tip.1': '這個按鈕只在某一天開啟時存在。沒有開啟的日子，卡片就沒有地方可以把地點加進去。',
  'help.guide.place-day-assign.tip.2':
    '把停靠點從某一天拿掉，地點仍留在旅行裡和地點欄裡。「刪除」才是把它從所有地方移除的操作。',
  'help.guide.place-day-assign.tip.3':
    '由住宿預訂放到當天的停靠點兩個按鈕都沒有：那一晚在當天的「住宿」區塊裡新增和移除。',
  // place-participants
  'help.guide.place-participants.title': '說明誰會去這個停靠點',
  'help.guide.place-participants.goal': '為一個停靠點把隊伍分開，而不用把旅行分開。',
  'help.guide.place-participants.step.1': '點選某一天裡的停靠點。卡片開啟，「參與者」列出旅行裡的所有人。',
  'help.guide.place-participants.step.2': '點選某位旅行者的名牌，把他移出這個停靠點。滑鼠移上去時名字會加上刪除線。',
  'help.guide.place-participants.step.3': '一旦有人缺席，就會出現一個虛線的 +。點選它可以看到誰不在這個停靠點上。',
  'help.guide.place-participants.step.4': '點選一個名字把他放回去。所有人都回來後，這個停靠點又屬於整個隊伍。',
  'help.guide.place-participants.result': '停靠點帶著你選取的旅行者，隊伍裡的其他人那個下午可以自己安排。',
  'help.guide.place-participants.tip.1':
    '「參與者」只在選取了停靠點時才出現，所以請在某一天裡選地點，而不是在地點欄裡，而且只在旅行者不止一位的旅行裡出現。',
  'help.guide.place-participants.tip.2':
    '一個人都沒選表示所有人都去，正因為如此，停靠點上剩下的最後一個人是沒法移出去的。',
  'help.guide.place-participants.tip.3': '沒有自己帳號的「訪客」也可以像其他人一樣成為參與者。',
  // place-booking
  'help.guide.place-booking.title': '停靠點上的預訂',
  'help.guide.place-booking.goal': '讀取屬於某個停靠點的預訂、開啟它，並把新的預訂掛上去。',
  'help.guide.place-booking.step.1':
    '開啟該預訂所屬的停靠點。卡片顯示一條橫條，上面是「已確認」或「待確認」以及預訂的名稱。',
  'help.guide.place-booking.step.2': '這條橫條帶著「日期」「時間」和「預訂碼」，以及這筆預訂的任何備註。',
  'help.guide.place-booking.step.3': '點選這條橫條。該預訂自己的表單就在上面開啟。',
  'help.guide.place-booking.step.4':
    '「關聯日程分配」就是把預訂掛到停靠點上的欄位，這裡它已經寫著這個停靠點。再把表單關掉。',
  'help.guide.place-booking.step.5':
    '為某個停靠點新建預訂要從天數欄開始：滑鼠移到停靠點上，點選它末尾的 +。表單以「新建預訂」開啟，並已經關聯到它。',
  'help.guide.place-booking.result': '預訂掛在停靠點上：它在卡片裡、在當天裡，它的檔案也列在這裡的「檔案」下面。',
  'help.guide.place-booking.tip.1': '這條橫條只對預訂所掛的那個停靠點顯示。沒有停靠點的預訂待在「預訂」分頁裡。',
  'help.guide.place-booking.tip.2': '多筆預訂可以共用一個停靠點：午餐，以及從同一個門口出發的那趟行程。',
  'help.guide.place-booking.tip.3': '火車、航班或渡輪開啟的是交通表單，也就是「交通」分頁用的那個。',
  // place-files
  'help.guide.place-files.title': '把地點的票券和地點放在一起',
  'help.guide.place-files.goal': '把某個地點的票、憑證或地圖放在你之後會去找的地方。',
  'help.guide.place-files.step.1': '開啟這個地點。「檔案」在卡片底部，地點還沒有檔案時它就顯示「檔案」。',
  'help.guide.place-files.step.2': '點選旁邊的「上傳」並選擇檔案。',
  'help.guide.place-files.step.3': '按鈕會數出地點擁有的數量，清單自己展開。',
  'help.guide.place-files.step.4': '每一列是檔案的名稱和大小。點選它就能開啟檔案。',
  'help.guide.place-files.result': '檔案留在地點上，在卡片裡被計數，同時也在旅行的「檔案」分頁裡。',
  'help.guide.place-files.tip.1': '「檔案」也會列出掛在這個停靠點預訂上的檔案，所以飯店的確認單會出現在飯店上。',
  'help.guide.place-files.tip.2': '「上傳」一次可以接收多個檔案。',
  'help.guide.place-files.tip.3': '沒有「上傳檔案」權限時，「上傳」按鈕就不在那裡；地點上已有的檔案仍然在。',
  // place-navigation
  'help.guide.place-navigation.title': '在地圖應用程式或網站上開啟一個地點',
  'help.guide.place-navigation.goal': '把地點交給真正能帶你過去的那個應用程式。',
  'help.guide.place-navigation.step.1': '開啟這個地點，點選底部那一列的「導航」。',
  'help.guide.place-navigation.step.2':
    '清單是適合這個地點的地圖應用程式：Google Maps、Waze、Apple Maps、OpenStreetMap 和 CoMaps。',
  'help.guide.place-navigation.step.3':
    '點選你用的那個。能做到的時候，TREK 交給它的是地點本身，而不只是一對座標，所以你會落在正確的入口。',
  'help.guide.place-navigation.step.4': '旁邊的「開啟網站」會在新分頁裡開啟地點自己的頁面、它的時間和它的門票。',
  'help.guide.place-navigation.result': '地圖應用程式在這個地點上開啟，網站在單獨的分頁裡開啟，旅行裡什麼都不會改變。',
  'help.guide.place-navigation.tip.1': 'Waze 會立刻開始導航。其他應用程式開啟這個地點，從那裡出發還要再點一下。',
  'help.guide.place-navigation.tip.2':
    '提供哪些應用程式取決於地點和你的裝置：Android 上不列出 Apple Maps，高德地图只對中國的地點出現，而 Waze、Apple Maps 和 CoMaps 需要地點的座標。',
  'help.guide.place-navigation.tip.3': '當只有一個應用程式適用時，按鈕會帶上那個應用程式的名字並直接開啟它。',
  // place-to-collection
  'help.guide.place-to-collection.title': '把地點儲存到你的某個清單',
  'help.guide.place-to-collection.goal': '把這趟旅行裡發現的地點留給下一趟。',
  'help.guide.place-to-collection.step.1': '開啟這個地點，點選卡片底部的「儲存到收藏」。',
  'help.guide.place-to-collection.step.2':
    '「儲存到清單」會顯示你擁有或共享的每一個清單。已經裝著這個地點的清單帶有勾選。',
  'help.guide.place-to-collection.step.3': '點選那個清單。地點立刻就在裡面了。',
  'help.guide.place-to-collection.step.4': '關閉後，卡片裡的按鈕顯示「已儲存」。',
  'help.guide.place-to-collection.result': '地點帶著它的圖片、備註和地址，留在你的清單裡，為下一趟旅行做好準備。',
  'help.guide.place-to-collection.tip.1': '這個按鈕只在「收藏」擴充套件開啟時才有，而它由管理員在「擴充套件」下開啟。',
  'help.guide.place-to-collection.tip.2':
    '一個地點可以同時待在多個清單裡，在每個清單裡有各自的狀態：在一個裡是「想法」，在另一個裡是「已造訪」。',
  'help.guide.place-to-collection.tip.3':
    '選擇器裡地點名稱旁的「標記為已造訪」會在那個清單裡把它勾掉；當地點在你的多個清單裡時，那個膠囊按鈕顯示「在所有清單中標記」，一次就把它們全部處理掉。',
  // place-track
  'help.guide.place-track.title': '讀一條軌跡並給它自己的顏色',
  'help.guide.place-track.goal': '看看匯入的一段步行有多長，並把它的線和地圖上其他的線區分開。',
  'help.guide.place-track.step.1': '地點欄裡軌跡那一列帶著一小段短線，顏色就是它的線所用的顏色。點選它。',
  'help.guide.place-track.step.2': '「軌跡資料」給出路徑的長度，使用你設定的「距離單位」。',
  'help.guide.place-track.step.3': '它上面的「軌跡顏色」顯示正在使用的顏色。點選這一列可以開啟色票。',
  'help.guide.place-track.step.4': '選一個顏色。地圖上的線和列上的那段短線會隨之改變。',
  'help.guide.place-track.step.5':
    '左邊的虛線格子「自動顏色」把軌跡交還給它繼承來的顏色；右邊的滴管「選擇自定義顏色」會開啟你系統的檢色器，用來選其他任何顏色。',
  'help.guide.place-track.result': '軌跡會用你選的顏色繪製，在卡片裡、在地點欄它那一列上，以及在地圖上都是如此。',
  'help.guide.place-track.tip.1': '只有帶著路徑的地點，也就是從 GPX、KML 或 KMZ 檔案匯入的地點，才有這兩個區塊。',
  'help.guide.place-track.tip.2':
    '記錄了高度的軌跡還會顯示它的最高點和最低點、上升和下降的公尺數，以及這段步行的剖面圖。',
  'help.guide.place-track.tip.3': '一次匯入會給它帶進來的每條軌跡一個各自的顏色，所以兩段步行絕不會以同一個顏色到達。',
  // read-place
  'help.guide.read-place.step.7':
    '底部那一列是你在這裡能做的事：把地點從開啟的那一天移出或放進去、儲存到某個清單、在地圖應用程式裡開啟、編輯或刪除。',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': '檔案',
  'help.ctx.trip-files.summary':
    '旅行的每一份文件都在一份清單裡：車票、確認單、通行證和圖片，每一份都帶一條備註、一條通往它所屬地點或預訂的連結，還有一個可以把它撈回來的回收站。',
  'help.ctx.trip-files.bullet.1':
    '頂部的「將檔案拖放到此處」接收檔案；點選這個方塊會開啟檔案選擇器。它下面那行列出這台 TREK 接受的檔案類型，以及每個檔案 50 MB 的上限。',
  'help.ctx.trip-files.bullet.2':
    '標籤決定清單顯示什麼：「全部」「PDF」「圖片」和「文件」，每個後面帶著數量。只要有檔案被收藏，就會多出一個星號標籤；只要有筆記帶了附件，就會多出「協作筆記」。',
  'help.ctx.trip-files.bullet.3':
    '一列帶著上傳者、名稱、下面的備註、大小和日期，以及每條連結一個徽章：「日程計劃」和那個地點，「預訂」或「交通」和那筆預訂，「來自協作筆記」。',
  'help.ctx.trip-files.bullet.4':
    '列末是「收藏」「分配」「開啟」「下載」和「刪除」。「刪除」不會先問：檔案進回收站，在那裡可以再拿回來。',
  'help.ctx.trip-files.bullet.5':
    '圖片或影片全螢幕開啟，可以用方向鍵和一條縮圖帶翻看；其他文件在頁面之上的預覽裡開啟，帶「在新標籤頁中開啟」和「下載」。錢包通行證則直接下載。',
  'help.ctx.trip-files.bullet.6':
    '右端的「回收站」把清單切換到已刪除的檔案，在那裡每一個都可以恢復或永久刪除，「清空回收站」把它們全部清掉。在管理員接好文件儲存的地方，「文件同步」就在它旁邊。',
  // files-upload
  'help.guide.files-upload.title': '把文件放進旅行',
  'help.guide.files-upload.goal':
    '把一張車票、一份確認單或一張照片從你的下載資料夾挪進旅行，讓旅行裡的每個人都能拿到。',
  'help.guide.files-upload.step.1': '開啟旅行，點選標籤列裡的「檔案」。旅行的文件列在那裡，上面是上傳方塊。',
  'help.guide.files-upload.step.2':
    '點選「將檔案拖放到此處」，選一個或多個檔案。檔案會一個接一個上傳，過程中方塊裡寫著「上傳中...」。方塊下面那行說明這台 TREK 接受哪些類型，以及一個檔案最多 50 MB。',
  'help.guide.files-upload.step.3':
    '最後一個檔案上傳完，「分配檔案」就自己為它開啟。「新增備註...」給這個檔案一行自己的說明，它下面的清單把檔案繫到某個地點或某筆預訂上。用 × 關掉；關掉不會遺失任何東西。',
  'help.guide.files-upload.step.4':
    '新檔案排在清單最上面。一列顯示上傳者、名稱、大小和日期；圖片有縮圖，其他檔案顯示它的類型。',
  'help.guide.files-upload.result': '文件已經在旅行裡，能看到這趟旅行的人都可以開啟和下載它們。',
  'help.guide.files-upload.tip.1': '檔案也可以從桌面直接拖到這個方塊上，檔案懸在上面時方塊會亮起來。',
  'help.guide.files-upload.tip.2': '剪貼簿裡的圖片用 Ctrl+V 就進了清單，所以預訂的截圖不必先存一份。',
  'help.guide.files-upload.tip.3':
    '上傳需要「上傳檔案」這項權限；沒有它，這個方塊根本不會出現。不在清單上的類型會連同一條提示被拒絕，什麼也不會上傳。超過 50 MB 的檔案在任何東西被送出之前，就被這個方塊自己擋下。',
  // files-link
  'help.guide.files-link.title': '把文件繫到地點或預訂上',
  'help.guide.files-link.goal': '讓這張票從它所屬的那一天也能找到，而不只是從這份清單裡。',
  'help.guide.files-link.step.1': '點選列末的鉛筆「分配」。以檔案命名的「分配檔案」開啟。',
  'help.guide.files-link.step.2':
    '在「備註」下面，「新增備註...」接收一行字，這行字隨後出現在清單中檔案名稱的下方。你一離開這個輸入框它就儲存了。',
  'help.guide.files-link.step.3':
    '「地點」下面是旅行的各個地點，按它們所在的那一天分組，最後是「未分配」，放不在任何一天裡的地點。點一個，它就打上勾。',
  'help.guide.files-link.step.4': '「預訂」和「交通」下面是旅行的各筆預訂。點文件所屬的那一筆，它也會打上勾。',
  'help.guide.files-link.step.5': '用 × 關掉。這裡沒有儲存按鈕：每一次點選在你點的那一刻就已經寫下了。',
  'help.guide.files-link.result':
    '這一列帶著備註，每條連結一個徽章，「日程計劃」和地點的名字，「交通」和航班的名字，同時這份文件也掛在那個地點和那個航班上。',
  'help.guide.files-link.tip.1': '一個檔案可以同時帶多條連結，所以同一份確認單既屬於飯店，也屬於它所涵蓋的那一晚。',
  'help.guide.files-link.tip.2': '再點一次已打勾的項目就取消那條連結；檔案本身還在。',
  'help.guide.files-link.tip.3': '反過來也成立：附在某個地點或某筆預訂上的文件同樣在這份清單裡，列上帶著同樣的徽章。',
  // files-star
  'help.guide.files-star.title': '把重要的文件留在最上面',
  'help.guide.files-star.goal': '從一份整趟旅行都在變長的清單裡，把你真正會用到的那兩三份資料挑出來。',
  'help.guide.files-star.step.1':
    '點選列末的「收藏」。星號被填成黃色，檔案名稱前面又出現一顆星，按鈕現在寫著「取消收藏」。',
  'help.guide.files-star.step.2': '清單會重新排序：收藏的檔案排在其他所有檔案之上，每一組之內按最新在前。',
  'help.guide.files-star.step.3': '頂部的標籤裡多了一顆星，後面跟著收藏檔案的數量。點選它，就只看這些檔案。',
  'help.guide.files-star.result': '你在櫃檯要用的資料排在清單最上面，還有一個標籤裡只有它們。',
  'help.guide.files-star.tip.1': '星號標籤只在有東西被收藏時才存在。取消最後一個檔案的收藏，這個標籤也跟著消失。',
  'help.guide.files-star.tip.2':
    '收藏算一次編輯：沒有「編輯檔案後設資料」權限、只能讀旅行檔案的成員看得見星號，卻按不動。',
  // files-filter
  'help.guide.files-filter.title': '在清單裡找到一份文件',
  'help.guide.files-filter.goal': '把一份什麼都有的清單，縮到你要找的那一類資料。',
  'help.guide.files-filter.step.1': '清單上方的標籤是「全部」「PDF」「圖片」和「文件」，每個後面帶著檔案數量。',
  'help.guide.files-filter.step.2': '點選「PDF」：清單只留下 PDF 檔案，別的都不留。',
  'help.guide.files-filter.step.3':
    '另外兩個標籤會隨旅行裡的內容來去。點選「協作筆記」，只要 Collab 標籤裡的筆記帶了附件它就在：清單裡只留下那些檔案，別的都沒有。一顆星也以同樣的方式加進這一排，只要有檔案被收藏。',
  'help.guide.files-filter.step.4': '「全部」把整份清單帶回來。',
  'help.guide.files-filter.result': '清單只顯示標籤所指的東西，每個標籤上的數字說明那是多少份。',
  'help.guide.files-filter.tip.1':
    '這裡沒有資料夾，也不能改名：「分配檔案」裡的備註、通往地點和預訂的連結，還有星號，就是文件的歸類方式。',
  'help.guide.files-filter.tip.2': '清單本身永遠是收藏在前，然後最新在前，所以今天上傳的文件排在上個月那份的上面。',
  // files-preview
  'help.guide.files-preview.title': '不離開 TREK 就讀一份文件',
  'help.guide.files-preview.goal': '就地看一張票或一張圖片，需要時再把它弄到自己的機器上。',
  'help.guide.files-preview.step.1': '點選圖片的名稱或它的縮圖。它會全螢幕開啟，頂部有檔案名稱和它在這組圖片中的位置。',
  'help.guide.files-preview.step.2':
    '兩側的圓形箭頭、左右方向鍵和底部的縮圖帶，都能在清單目前顯示的每一張圖片之間移動。',
  'help.guide.files-preview.step.3': '「在新標籤頁中開啟」和「下載」在頂部；× 或 Escape 再把圖片關掉。',
  'help.guide.files-preview.step.4':
    '不是圖片的文件改為在頁面之上的預覽裡開啟，頂部同樣是這兩個按鈕。這一個用 × 或點它旁邊就能關掉。',
  'help.guide.files-preview.step.5': '列末的「下載」把檔案直接存到你的機器上，不先開啟任何東西。',
  'help.guide.files-preview.result': '文件就在螢幕上，同樣這兩個按鈕把它放進瀏覽器標籤頁或你的硬碟。',
  'help.guide.files-preview.tip.1': '在觸控螢幕上，你是滑動著翻圖片，而不是點箭頭。',
  'help.guide.files-preview.tip.2': '錢包通行證從不開啟預覽：它會立即下載，好讓手機把它交給錢包應用程式。',
  'help.guide.files-preview.tip.3':
    '「在新標籤頁中開啟」和「下載」都用你的工作階段去取檔案，所以從網址列複製出來的連結對別人毫無用處。',
  // files-trash
  'help.guide.files-trash.title': '丟掉一份文件，再把它找回來',
  'help.guide.files-trash.goal': '清掉旅行不再需要的東西，又不會遺失其實還需要的。',
  'help.guide.files-trash.step.1': '點選列末的「刪除」。檔案立刻離開清單，提示寫著「已移至回收站」。沒有人先問你。',
  'help.guide.files-trash.step.2':
    '工具列右端的「回收站」把清單切換到被丟掉的東西。標題變成「回收站」，篩選標籤不見了。',
  'help.guide.files-trash.step.3':
    '被丟掉的列是灰的，只剩兩個按鈕：「恢復」，把檔案帶回來；「刪除」，先問一句再把它永久移除。',
  'help.guide.files-trash.step.4': '點選「恢復」。提示寫著「檔案已恢復」，這一列離開回收站，備註和連結都還在它身上。',
  'help.guide.files-trash.step.5':
    '頂部的「清空回收站」把還留在這裡的一切永久清掉，瀏覽器在動手前會問一次。「回收站」再切回檔案清單。',
  'help.guide.files-trash.result': '檔案回到了清單裡它原來的位置，就像什麼也沒發生過。',
  'help.guide.files-trash.tip.1':
    '列上的「刪除」不會先問，回收站正是為此而設：在你於此處發話之前，沒有東西會離開 TREK。',
  'help.guide.files-trash.tip.2':
    '丟掉一個檔案再把它找回來，需要「刪除檔案」這項權限。沒有這項權限的成員既看不到列上的「刪除」，也看不到回收站裡的按鈕。',
  'help.guide.files-trash.tip.3': '在回收站裡被永久刪除的檔案無法再找回來。',
  // files-sync
  'help.guide.files-sync.title': '讓文件與你的文件儲存庫保持同步',
  'help.guide.files-sync.goal':
    '把旅行綁定到你自己的文件儲存庫，這樣在這裡上傳的會落到那裡，在那裡歸檔的會出現在這裡。',
  'help.guide.files-sync.step.1':
    '點選「文件同步」，它在工具列右端「回收站」的旁邊。對話框開啟，標題下寫著旅行的名稱。左側「連接提供者」下列著管理員開啟的儲存庫，每個帶一行說明它怎樣歸檔：Paperless-ngx 和 Papra 以標籤歸檔，Nextcloud 和 Synology Drive 歸檔在資料夾中，OpenCloud 歸檔在空間中。右側寫著「尚未連接任何項目」。',
  'help.guide.files-sync.step.2':
    '點選你的儲存庫，這裡是 Nextcloud。一個較小的對話框為這次連線開啟，以儲存庫命名，詢問這個儲存庫登入所需的資訊。',
  'help.guide.files-sync.step.3':
    '填寫「位址」和該儲存庫自己的登入資訊：Paperless-ngx 要「API 權杖」，Papra 要「API 金鑰」和「組織 ID」，Nextcloud 要「使用者名稱」和「應用程式密碼」，OpenCloud 要「使用者名稱」和「應用程式權杖」，Synology Drive 要「使用者名稱」、「密碼」，如果帳戶要求，還要「雙因素驗證碼」。只要儲存庫提供應用程式密碼或權杖，就用它，絕不要用你的帳戶密碼。Nextcloud 和 Synology Drive 還可以填一個選填的「基礎資料夾」，TREK 會在那裡尋找旅行資料夾，這裡是 /Reisen。底部的「接受自簽憑證」只給你自己網路裡帶這種憑證的儲存庫用。',
  'help.guide.files-sync.step.4':
    '點選「測試連線」。TREK 用你輸入的內容去連儲存庫，頁尾寫著「已連上，登入身分為」加上帳戶名稱。登入資訊被拒絕或位址連不上時，會在那裡寫明，而且無論哪種情況都不會儲存。',
  'help.guide.files-sync.step.5':
    '點選「連接」。連線隨旅行儲存，TREK 會問這趟旅行要放在儲存庫的哪裡：存放其文件的標籤、資料夾或空間。只有那裡面的內容會同步。「建立新的」在點選「建立」時把它建好，名稱已按旅行標題預填；「或使用你已經有的」下列著已經存在的。點選一個，這裡是資料夾 Autumn in Japan。',
  'help.guide.files-sync.step.6':
    '對話框回來了：你的儲存庫在左側「這趟旅行」下，右側它的卡片帶著同步目標、上次執行時間和「立即同步」。第一次執行會自己開始；「立即同步」隨時再跑一次。一次執行完成後，名稱旁的「尚未同步」徽章讓位給一個綠點，指向它時顯示「已同步」，流向條統計 TREK 和儲存庫各自持有的文件數，中間是「送往儲存庫」和「來自儲存庫」兩條通道。用 × 關閉對話框。',
  'help.guide.files-sync.result':
    '那裡原本就有的文件排在清單頂部，以你的名義上傳，而旅行的每份文件也都進了儲存庫。從此 TREK 在背景檢查儲存庫，儲存庫跟隨清單。',
  'help.guide.files-sync.tip.1':
    '只有旅行的擁有者或實例管理員能綁定旅行，因為登入資訊能觸及儲存庫中的整個帳戶。每位成員都可以開啟「文件同步」、查看卡片並按「立即同步」。',
  'help.guide.files-sync.tip.2':
    '你自己網路裡的儲存庫需要 TREK 伺服器上設定 ALLOW_INTERNAL_NETWORK=true，而且它的位址必須是那台機器在網路裡的位址，絕不能是 localhost。沒有這些，「測試連線」會回答「不允許這個位址。」',
  'help.guide.files-sync.tip.3':
    '卡片上的「中斷連線」結束配對，並保留兩邊的每一份文件。第二次綁定的標籤、資料夾或空間被當作新的，裡面的一切都會再進來一次，所以「中斷連線」之後請綁定一個空的，而不是原來那個。',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': '日程詳情',
  'help.ctx.trip-day-detail.summary':
    '由某一天的標題列在地圖上方開啟的面板：這一整天、它的名稱和日期、你將身處之地的天氣、落在這一天的預訂，以及為它訂下的住宿夜晚。',
  'help.ctx.trip-day-detail.bullet.1':
    '在天數欄裡點選某一天的標題列，面板就在地圖中間上方開啟。再次點選同一個標題列，或者點它右端的 X，就關閉面板並放開這一天。',
  'help.ctx.trip-day-detail.bullet.2':
    '標題列上是這一天的名稱和日期。名稱旁的鉛筆用來重新命名這一天，雙箭頭把面板折疊成一條細列，地圖又空出來。',
  'help.ctx.trip-day-detail.bullet.3':
    '最上面是這一天的天氣。「…的天氣預報」指明它對應哪個地點：這一天的第一個停靠點，或者你醒來時所在的飯店。',
  'help.ctx.trip-day-detail.bullet.4':
    '「預訂」列出那一天的預訂，每筆都帶類型、所屬停靠點和時間。綠色表示已確認，琥珀色還是待確認；這裡只是讀數，預訂要在「預訂」分頁裡變更。',
  'help.ctx.trip-day-detail.bullet.5':
    '「住宿」顯示壓在這一天上的每一晚，「入住」和「退房」出現在各自發生的那一天，還有入住時間區間、退房時間和確認號。',
  'help.ctx.trip-day-detail.bullet.6':
    '「新增住宿」在這一天訂下一晚：從旅行的地點裡挑出住處，說明它涵蓋哪幾天，再補上時間和確認號。',
  // day-panel
  'help.guide.day-panel.title': '開啟一天並讀它的詳細資料',
  'help.guide.day-panel.goal': '不離開地圖，就看到完整的一天、它的天氣、它的預訂，以及你睡在哪裡。',
  'help.guide.day-panel.step.1': '在天數欄裡點選某一天的標題列。這一天被選取，它的詳細資料在地圖中間上方開啟。',
  'help.guide.day-panel.step.2': '標題列寫出這一天的名稱，在你給它取名之前是「第 1 天」，下面是日期。',
  'help.guide.day-panel.step.3':
    '最上面是這一天的天氣。「…的天氣預報」說明它對應哪個地點：這一天的第一個停靠點，或者你醒來時所在的飯店。',
  'help.guide.day-panel.step.4': '它下面的「預訂」列出落在這一天的預訂，連同它們的時間。',
  'help.guide.day-panel.step.5': '「住宿」顯示壓在這一天上的夜晚，「入住」和「退房」出現在各自發生的那一天。',
  'help.guide.day-panel.step.6': '標題列上的雙箭頭把面板折疊成一條細列。旁邊的 X 關閉面板並放開這一天。',
  'help.guide.day-panel.result':
    '折成細列時，面板讓地圖保持空閒，這一天仍然被選取；關閉之後，這一天取消選取，計劃回到原樣。',
  'help.guide.day-panel.tip.1': '點選面板標題列上的任何地方同樣會折疊它。那個箭頭只是為此準備的按鈕。',
  'help.guide.day-panel.tip.2': '從地點欄開啟一個地點，會把地點詳細資料放到面板的位置上。把它關掉，這一天就回來了。',
  // day-weather
  'help.guide.day-weather.title': '讀這一天的天氣',
  'help.guide.day-weather.goal': '知道那一天在你真正身處的地方會是什麼天氣。',
  'help.guide.day-weather.step.1':
    '「…的天氣預報」指明這些數字屬於哪個地點：這一天的第一個停靠點，或者在沒有停靠點的一天裡，你醒來時所在的飯店。',
  'help.guide.day-weather.step.2': '大數字是這一天的氣溫，旁邊是最低和最高，以及用文字說明的天氣狀況。',
  'help.guide.day-weather.step.3': '下面的小標籤：降水機率、降水量、最強的風，還有日出和日落。',
  'help.guide.day-weather.step.4':
    '最下面是這一天的逐小時情況，每隔兩小時一格：時間、圖示、氣溫和降水機率。超過 50% 的小時會染成藍色。',
  'help.guide.day-weather.result': '天數欄裡這一天的卡片，也在它的編號下面用小字帶著同樣的天氣，整趟行程一眼就能讀完。',
  'help.guide.day-weather.tip.1':
    '溫度和風跟隨設定裡「顯示」下的「溫度單位」：選「°F Fahrenheit」，同一份預報就用 °F 和 mph 讀出來。',
  'help.guide.day-weather.tip.2':
    '既沒有帶座標的停靠點、也沒有可以醒來的飯店的一天，完全不顯示天氣：預報永遠是針對一個地點，而不是針對整趟旅行。',
  'help.guide.day-weather.tip.3':
    '超過 16 天之後就沒有預報可拿。那時的數字是往年這個日期的平均值，用 Ø 標出，並在下面註明。',
  // rename-day
  'help.guide.rename-day.title': '給這一天取個名字',
  'help.guide.rename-day.goal': '把一天叫成它本來的樣子，「抵達 Kyoto」或者「休息日」，而不是「第 5 天」。',
  'help.guide.rename-day.step.1': '開啟這一天。它的標題列寫著「第 5 天」，下面是日期。',
  'help.guide.rename-day.step.2': '點選名稱旁邊的鉛筆。',
  'help.guide.rename-day.step.3': '名稱變成一個輸入框。輸入你想要的名字。',
  'help.guide.rename-day.step.4':
    '按 Enter，或者乾脆點別處；Escape 會丟掉這次修改。天數欄裡這一天的卡片也會帶上這個名字。',
  'help.guide.rename-day.result': '這個名字在面板裡和天數欄的卡片上取代「第 5 天」；日期還留在原處。',
  'help.guide.rename-day.tip.1': '把輸入框清空再儲存，這一天就又是「第 5 天」：沒有名字時顯示的就是編號。',
  'help.guide.rename-day.tip.2': '名字屬於這一天，而不屬於它的日期。重新排列各天，它會和這一天上的其他一切一起走。',
  // add-accommodation
  'help.guide.add-accommodation.title': '在某一天訂下一晚',
  'help.guide.add-accommodation.goal': '把飯店一次性放進計劃，連同它涵蓋的天數、時間和確認號。',
  'help.guide.add-accommodation.step.1':
    '住處必須先是旅行裡的一個地點。像建立其他地點一樣在地點欄裡建立它：選擇器只提供已經存在的東西。',
  'help.guide.add-accommodation.step.2': '開啟你抵達的那一天，點選「住宿」下面的「新增住宿」。',
  'help.guide.add-accommodation.step.3':
    '「應用到天數」說明這次住宿涵蓋哪幾晚：左邊是入住日，右邊是退房日。「全部」涵蓋整趟旅行。',
  'help.guide.add-accommodation.step.4': '填寫「入住」「截止」和「退房」，把預訂號填在「確認號」裡。這四項都可以留空。',
  'help.guide.add-accommodation.step.5': '從旅行的地點裡挑出住處。清單上方的小標籤把它收窄到一個分類。',
  'help.guide.add-accommodation.step.6': '點選「儲存」。',
  'help.guide.add-accommodation.result':
    '這次住宿出現在它涵蓋的每一天上，第一天是「入住」，最後一天是「退房」。住處成為入住日的一個停靠點，地圖因此畫出去那裡的路線，而「預訂」分頁裡出現一筆「住宿」預訂。',
  'help.guide.add-accommodation.tip.1': '選擇器以你開啟的那一天開始，退房是它的後一天；儲存之前兩者都可以移動。',
  'help.guide.add-accommodation.tip.2': '建立飯店時給它旅行裡的 Hotel 分類，清單上方的小標籤一點就只剩下你的飯店。',
  'help.guide.add-accommodation.tip.3':
    '時間全是選填的：沒有入住時間、也沒有確認號的住宿，照樣涵蓋它的夜晚，照樣畫出它的路線。',
  // edit-accommodation
  'help.guide.edit-accommodation.title': '變更或取消已訂下的住宿',
  'help.guide.edit-accommodation.goal': '挪動一次住宿、改正它的時間，或者把它再從計劃裡拿出去。',
  'help.guide.edit-accommodation.step.1': '在住宿的每一天裡，卡片都顯示住處、入住時間區間、退房時間和確認號。',
  'help.guide.edit-accommodation.step.2': '它右邊的鉛筆重新開啟這次住宿。彈出視窗此時寫著「編輯住宿」。',
  'help.guide.edit-accommodation.step.3':
    '改這一排欄位：「入住」「截止」「退房」和「確認號」。它上面的天數和它下面的住處，在這裡也能改。',
  'help.guide.edit-accommodation.step.4': '點選「儲存」。',
  'help.guide.edit-accommodation.step.5':
    '鉛筆旁邊的 X 結束這次住宿。它什麼都不問，屬於它的那筆「住宿」預訂也一併消失。',
  'help.guide.edit-accommodation.result':
    '這次變更一次就到達住宿涵蓋的每一天，「預訂」分頁裡那筆「住宿」預訂也跟著變。',
  'help.guide.edit-accommodation.tip.1':
    '住宿中間的夜晚不帶「入住」也不帶「退房」標籤：只有這個區間的第一天和最後一天才有。',
  'help.guide.edit-accommodation.tip.2':
    '取消一次住宿，也會帶走它放在入住日的那個停靠點，以及掛在它預訂上的任何費用。如果是弄錯了，就重新訂一次。',
  // day-bookings
  'help.guide.day-bookings.title': '一眼看完這一天的預訂',
  'help.guide.day-bookings.goal': '在一個地方看到這一天已經訂好了什麼，以及是否已確認。',
  'help.guide.day-bookings.step.1': '「預訂」列出這一天的預訂：日期落在這一天的，以及掛在它某個停靠點上的。',
  'help.guide.day-bookings.step.2':
    '一列顯示這是哪種預訂、它的名稱，如果它屬於某個停靠點，就在一個圓點之後寫出那個停靠點。它的時間在右端。',
  'help.guide.day-bookings.step.3':
    '顏色說明一筆預訂處在什麼狀態：綠色的列已確認，琥珀色的還在待確認。飯店不在這個清單裡，它們在下面有自己的區塊。',
  'help.guide.day-bookings.step.4': '這個清單只把預訂讀出來。預訂要在「預訂」分頁裡建立和變更。',
  'help.guide.day-bookings.result': '日期落在這一天的一切，以及掛在它某個停靠點上的一切，都在這一個清單裡。',
  'help.guide.day-bookings.tip.1':
    '一筆預訂按它自己的日期落到某一天上。在「預訂」分頁裡改掉日期，它就自己挪到另一天去。',
  'help.guide.day-bookings.tip.2': '沒有「預訂」區塊，就說明這一天沒有預訂：它被隱藏起來，而不是空著顯示。',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': '地圖',
  'help.ctx.trip-map.summary':
    '計劃的中間：旅行的每一個地點都是一枚圖釘，還有把它們連起來的路線，以及地圖邊緣那些開關，用於衛星影像、一次看完整趟行程，以及尋找你正在看的這片城區周圍的地點。',
  'help.ctx.trip-map.bullet.1':
    '一枚圖釘就是一個地點：有照片時用它自己的照片，否則用它的分類顏色加分類圖示。把指標停在一枚圖釘上，會出現一張卡片，寫著它的名稱和地址，地點帶有分類和評分時也會寫上。把圖釘拖到某一天的卡片上，就把這個地點安排到那一天。',
  'help.ctx.trip-map.bullet.2':
    '靠得太近分不開的圖釘會摺疊成一個深色泡泡，上面帶著數量。點選泡泡，地圖就縮放到裡面的內容。',
  'help.ctx.trip-map.bullet.3':
    '點選一枚圖釘，地點就在地圖下方開啟，帶著它的評分、它的「檔案」以及接下來可以對它做的事；點選地圖上空白的地方就又把它放開。',
  'help.ctx.trip-map.bullet.4':
    '當天數欄裡有某一天開啟時，它的停靠點會帶一個白色小徽章，寫著它在那一天裡的序號；被安排在兩天上的地點會帶著兩個序號，中間用 · 連起來。',
  'help.ctx.trip-map.bullet.5':
    '頂部那排圖示會在你看得見的那片地圖裡搜尋：「餐廳」「咖啡廳」「酒吧與夜生活」「住宿」「景點」「博物館與文化」「自然與公園」和「活動」。在你移動地圖之後，「搜尋此區域」會再跑一次。',
  'help.ctx.trip-map.bullet.6':
    '在地圖上任意位置按右鍵，就會在那個點開啟地點表單，地址已經查好了。左下角的圓形按鈕把繪製的地圖換成空拍影像。',
  'help.ctx.trip-map.bullet.7':
    '右下角的「顯示整趟行程」一次畫出每一個出行日，並列出每一天走了什麼；預訂那一列上的路線圖示畫出那一筆預訂，而天數欄上方工具列裡的那個圖示把它們全都畫出來。',
  // map-markers
  'help.guide.map-markers.title': '讀懂地圖',
  'help.guide.map-markers.goal': '知道地圖上每一枚圖釘、每一個徽章和每一個泡泡在告訴你什麼。',
  'help.guide.map-markers.step.1':
    '地圖上有旅行的每一個地點。圖釘靠得太近分不開的地方，它們會摺疊成一個深色泡泡，上面帶著裡面的數量；點選泡泡，地圖就縮放到剛才在裡面的內容，在最深的縮放層級上則把圖釘像扇子一樣攤開。',
  'help.guide.map-markers.step.2':
    '一枚圖釘是這個地點自己的照片（如果有的話），否則是它的分類顏色加分類圖示。把指標停在一枚上，卡片會給出它的名稱和地址，地點帶有分類和評分時也會給出。',
  'help.guide.map-markers.step.3':
    '點選一枚圖釘，地點就在地圖下方的一張卡片裡開啟：它的座標、它的評分、它的「檔案」，最下面一排則是接下來能對它做的事，其中有「導航」「編輯」和「刪除」，開啟了某一天時還有「新增到當天」。點選地圖上空白的地方就又把它放開。',
  'help.guide.map-markers.step.4':
    '在天數欄裡開啟某一天，它的停靠點就會被編號：圖釘角上的白色小徽章就是這個停靠點在這一天裡的次序。被安排在兩天上的地點會帶著兩個序號，中間用 · 連起來。沒有開啟任何一天時就沒有編號，角上改為顯示評分。',
  'help.guide.map-markers.step.5':
    '把一枚圖釘從地圖上拖到天數欄裡某一天的卡片上，這個地點就被安排到那一天，和把它在地點清單裡的那一列拖出去完全一樣。',
  'help.guide.map-markers.result':
    '旅行本身沒有任何變化：地圖只是看它的一種方式，而每一枚圖釘都說明是哪個地點、哪一天、按什麼順序。',
  'help.guide.map-markers.tip.1':
    '在天數欄裡被摺疊起來的一天，會把它的停靠點一起從地圖上帶走；再把這一天開啟，它們就回來了。',
  'help.guide.map-markers.tip.2':
    '地點清單上方的篩選也決定地圖畫什麼：選「未規劃」，地圖上就只剩下還沒有排進某一天的地點。',
  'help.guide.map-markers.tip.3': '這張地圖上沒有縮放按鈕：滾輪縮放，按兩下放大一級，拖曳地圖本身則移動它。',
  // map-nearby-places
  'help.guide.map-nearby-places.title': '在地圖上尋找你周圍的地點',
  'help.guide.map-nearby-places.goal': '讓地圖在你正在看的這片城區裡找餐廳、景點或一家旅館，並把其中一個帶進旅行。',
  'help.guide.map-nearby-places.step.1':
    '地圖頂部那排圖示就是分類搜尋：「餐廳」「咖啡廳」「酒吧與夜生活」「住宿」「景點」「博物館與文化」「自然與公園」和「活動」。',
  'help.guide.map-nearby-places.step.2':
    '點選一個分類。TREK 會在你看得見的那片地圖裡找這一類地點，並為每一個結果落下一枚該分類顏色的圖釘。一次只能開一個分類：點選另一個就會換過去，點選正在開著的那個就會關掉。',
  'help.guide.map-nearby-places.step.3':
    '移動地圖，那排圖示下面會出現第二個按鈕：「搜尋此區域」為新的視野跑同一個搜尋。光是移動永遠不會重新搜尋，這樣請求的次數就不會多。',
  'help.guide.map-nearby-places.step.4':
    '這些圖釘帶著它們找到的東西的名稱。點選其中一枚，地點表單就開啟，並且已經從它那裡填好了：「名稱」「地址」「緯度」和「經度」，以及 OpenStreetMap 有的話還有網站和電話號碼。',
  'help.guide.map-nearby-places.step.5':
    '檢查它填好的內容，再補上搜尋不可能知道的東西：一段「描述」、一個「分類」、你自己的備註。',
  'help.guide.map-nearby-places.step.6':
    '點選「新增」。如果行程裡已經有同名的地點，表單會這麼說，按鈕也會變成「仍要新增」。',
  'help.guide.map-nearby-places.result':
    '這個地點就在地點清單裡，也在地圖上，成為行程自己的一枚圖釘，在你把它排進某一天之前都在「未規劃」下面。搜尋出來的圖釘會一直留著，直到你把那個分類關掉。',
  'help.guide.map-nearby-places.tip.1':
    '當「設定」裡「Travel & map」下的「在地圖上探索地點」關閉時，這排圖示就不在了。',
  'help.guide.map-nearby-places.tip.2':
    '答案來自 TREK 的地點索引和 OpenStreetMap，所以這是計劃上少數幾件需要連線的事情之一。',
  'help.guide.map-nearby-places.tip.3':
    '一次搜尋涵蓋的是螢幕上的範圍，所以請放大到你要問的那條街：整座城市回答的是前六十個結果，而且它們之間幾乎沒有什麼順序。',
  // map-add-place
  'help.guide.map-add-place.title': '按右鍵在地圖上建立地點',
  'help.guide.map-add-place.goal': '把一個地點準確放在你想要的位置上，不必先去搜尋它。',
  'help.guide.map-add-place.step.1': '在地圖上你想要的位置按右鍵。地點表單開啟，標題是「新增地點/活動」。',
  'help.guide.map-add-place.step.2':
    '「緯度」和「經度」已經就在那個點上，TREK 會去查這組座標，並用在那裡找到的內容填好「地址」，查到名字時也把「名稱」填上。還什麼都沒有寫進去，所以哪裡不對就覆蓋掉。',
  'help.guide.map-add-place.step.3':
    '給它一個你認得出來的「名稱」，再寫上計劃應該知道的其餘內容：「描述」「備註」「分類」「網站」。',
  'help.guide.map-add-place.step.4':
    '點選「新增」。即使有某一天開啟著，這個地點也是以未規劃的狀態落進清單：在地圖上按右鍵說的是在哪裡，不是在什麼時候。',
  'help.guide.map-add-place.result': '這個地點就在清單裡，也在地圖上，在你把它排進某一天之前都在「未規劃」下面。',
  'help.guide.map-add-place.tip.1':
    '地址來自對座標的反查，所以它讀起來可能是一條街而不是一個名字，在曠野上還可能查回來是空的。這兩個欄位都由你來覆蓋。',
  'help.guide.map-add-place.tip.2':
    '在 MapLibre GL 和 Mapbox GL 的地圖上，按中鍵也是一樣的效果，在觸控螢幕上則是長按。',
  // map-satellite
  'help.guide.map-satellite.title': '切換到衛星',
  'help.guide.map-satellite.goal': '把繪製的地圖換成空拍影像，再換回來。',
  'help.guide.map-satellite.step.1':
    '地圖左下角的圓形按鈕就是底圖圖層開關。它的圖示始終顯示它將要切換到的那一層，把指標停上去會說明是哪一層：「切換到衛星檢視」。點選它。',
  'help.guide.map-satellite.step.2':
    '地圖現在是空拍影像，清晰到能分辨出單獨一棟建築，而且不需要你自己的金鑰。TREK 畫的一切都留在它上面：圖釘、當天的路線、軌跡和預訂路線。',
  'help.guide.map-satellite.step.3': '按鈕現在寫著「切換到地圖檢視」。點選它就回到繪製的地圖。',
  'help.guide.map-satellite.result': '地圖又變回繪製的地圖，而你最後停留的那一層會記在你的帳戶上。',
  'help.guide.map-satellite.tip.1':
    '這個選擇儲存在你的帳戶上，而不是在行程上，所以不管你用哪一種地圖算繪引擎，每一個行程都會按你離開時的樣子開啟。',
  'help.guide.map-satellite.tip.2':
    '空拍影像上沒有文字：街道名、行政區和門牌號都在繪製的地圖上，所以要找地址時就切換回去。',
  // map-whole-trip
  'help.guide.map-whole-trip.title': '檢視整趟行程和它的距離',
  'help.guide.map-whole-trip.goal': '把開啟的那一天換成行程的每一個出行日，並讀出每一天走了多遠。',
  'help.guide.map-whole-trip.step.1':
    '圓形的「顯示整趟行程」按鈕位於地圖右下角。點選它，行程的每一個出行日都會被一次畫出來，每一天用自己的顏色畫在白色外框之上，這樣相鄰的日子也分得清。',
  'help.guide.map-whole-trip.step.2':
    '按鈕上方的卡片把這些日子列出來：一個色點、這一天的名稱、你在這一天每種出行方式的圖示，以及它涵蓋的距離。「總距離」在最上面。',
  'help.guide.map-whole-trip.step.3':
    '在卡片裡點選某一天就選取它，和在天數欄裡選它是一樣的：地圖把那一天框進畫面，它的停靠點也重新有了編號。',
  'help.guide.map-whole-trip.step.4': '按鈕現在寫著「隱藏整趟行程」。按一下就回到開啟的那一天。',
  'help.guide.map-whole-trip.result':
    '每一個出行日都用自己的顏色畫出來，卡片說明每一天走了什麼，以及整趟行程加起來是多少。',
  'help.guide.map-whole-trip.tip.1':
    '總數是一段一段陸續到的。只要後面還跟著一個 …，這個數字就還是部分和；等每一段都回答了，它才穩定下來。',
  'help.guide.map-whole-trip.tip.2':
    '路線服務拒絕計算的那一段會保持為一條直線，並且不計入距離，卡片會把這件事說出來，而不是悄悄地顯示得偏低。',
  'help.guide.map-whole-trip.tip.3': '有定位的停靠點不足兩個的一天沒有路線可畫，因此它會被完全排除在卡片之外。',
  // map-booking-routes
  'help.guide.map-booking-routes.title': '在地圖上顯示一筆預訂的路線',
  'help.guide.map-booking-routes.goal': '把你訂好的航班、火車和自駕畫到地圖上，再把它們撤下來。',
  'help.guide.map-booking-routes.step.1':
    '預訂路線在你提出要求之前是關著的。天數欄裡預訂那一列上有一個小小的路線圖示：「顯示預訂路線」。',
  'help.guide.map-booking-routes.step.2':
    '點選它。這筆預訂就出現在地圖上：航班畫成一條大圓弧，自駕沿著真實的道路，火車畫成它各個車站串成的鏈條。「已確認」畫成實線，「待確認」畫成虛線，路線兩端是帶著交通方式圖示的藍色膠囊。',
  'help.guide.map-booking-routes.step.3':
    '點選其中一端的膠囊，就開啟它背後的那筆預訂，帶著它的時間、它的「預訂碼」和「地點 / 地址」；「關閉」把它收起來。',
  'help.guide.map-booking-routes.step.4':
    '天數欄上方工具列裡的那個路線圖示一次處理整趟行程：「顯示所有預訂路線」會把每一筆有路線的預訂都畫出來。',
  'help.guide.map-booking-routes.step.5':
    '它是從白紙開始，而不是疊在上面的一層，所以你一筆一筆挑出來的那些都會被丟掉。再按一次，它現在寫著「隱藏所有預訂路線」，地圖就清空了。',
  'help.guide.map-booking-routes.result':
    '你要求的那些預訂被畫在地圖上，而這個選擇會為這個行程儲存在這個瀏覽器裡，直到你改變它。',
  'help.guide.map-booking-routes.tip.1':
    '只有當「設定」裡「Travel & map」下的「預訂路線標籤」開著時，兩端才會帶上機場代碼或車站名稱；否則它們只顯示圖示。',
  'help.guide.map-booking-routes.tip.2':
    '同一處設定裡的「一律顯示訂票路線」，會在你還沒有做過決定的每一個行程上，從一開始就把它們畫出來。',
  'help.guide.map-booking-routes.tip.3': '一筆預訂必須有兩個帶座標的端點才能被畫出來，所以旅館或餐廳不會帶路線圖示。',
  'help.ctx.trip-map.bullet.8':
    '開著 Dawarich 擴充套件時，「顯示整趟行程」下方的圓形 Dawarich 按鈕會畫出你的手機實際記錄的路線：「顯示記錄的路線」把它用虛線鋪在計劃路線下方，每天一種顏色，而在沒有線的時候，按鈕的標籤會說明為什麼沒有。',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': '顯示你實際走過的路線',
  'help.guide.map-dawarich-trail.goal':
    '把 Dawarich 在你手機上記錄的路線鋪到地圖上，用虛線放在你計劃的路線旁邊，一天一天地讀這趟旅行實際是怎麼走的。',
  'help.guide.map-dawarich-trail.step.1':
    '圓形 Dawarich 按鈕在地圖右下角，「顯示整趟行程」的下方；游標停在上面時它寫著「顯示記錄的路線」。點選它。TREK 向你的 Dawarich 查詢這趟旅行的日期，答案還在路上時，按鈕周圍有一個圓環在轉。',
  'help.guide.map-dawarich-trail.step.2':
    '記錄的路線以一條虛線落到地圖上，每天一種顏色，畫在計劃路線下方，這樣計劃仍然可讀。按鈕現在寫著「隱藏記錄的路線」。天與天之間以當地午夜為界，在天數欄裡摺起的一天會把它的虛線連同它的停靠點一起從地圖上收走。',
  'help.guide.map-dawarich-trail.step.3':
    '再點選「顯示整趟行程」，每個計劃中的日子都以實線畫在虛線記錄旁邊。兩條線走在一起的地方，那一天按計劃進行了；虛線跑偏的地方，就是沒按計劃的地方。',
  'help.guide.map-dawarich-trail.result':
    '你計劃的和你實際做的一起在地圖上，虛線對實線，而按鈕上方的卡片仍然列著計劃中的日子和它們的距離。',
  'help.guide.map-dawarich-trail.tip.1':
    '開或關按旅行記住，在這個瀏覽器工作階段內有效。路線開著時，TREK 每兩分鐘再問一次 Dawarich，所以進行中的旅行不用重新載入也能跟上；路線本身從不儲存，所以它不在 TREK 的資料庫裡，不在備份裡，離線時也沒有。',
  'help.guide.map-dawarich-trail.tip.2':
    '按鈕的標籤會解釋空白的地圖：還在路上時是「正在載入記錄的路線…」，或者是「這幾天沒有任何記錄」「無法載入記錄的路線」，TREK 離線時則是「記錄的路線需要網路連線」。',
  // map-compass
  'help.guide.map-compass.title': '轉動地圖並重新找到北',
  'help.guide.map-compass.goal': '把地圖轉到你前進的方向，再用一下點選把它彈回正北。',
  'help.guide.map-compass.step.1':
    '用右鍵拖曳來轉動地圖，或者按住 Ctrl 用左鍵拖曳；在觸控螢幕上，用兩根手指扭轉。地圖頂部分類圖示那一排旁邊的圓形羅盤會跟著轉：它的箭頭始終指向北，所以你轉了多少，它就斜多少。',
  'help.guide.map-compass.step.2':
    '點選羅盤。這個按鈕叫「Reset north」，它把地圖平緩地轉回北在上方的平視狀態，箭頭重新豎直。',
  'help.guide.map-compass.result': '地圖重新北朝上、恢復水平，旅行裡什麼都沒變：羅盤只移動鏡頭。',
  'help.guide.map-compass.tip.1':
    '羅盤只在 MapLibre GL 和 Mapbox GL 地圖上有；Leaflet 地圖不能轉動，所以沒有羅盤。「設定」裡「地圖」下的「地圖提供商」決定你用哪一個，「儲存地圖」保留這個選擇。',
  'help.guide.map-compass.tip.2':
    '點選同時也去掉傾斜：右鍵上下拖曳會讓視角俯仰，「Reset north」在回正的同時把它放平。在 Mapbox GL 上開著「3D 建築和地形」時，這也會把 3D 視圖壓平，直到你再次傾斜。',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab',
  'help.ctx.trip-collab.summary':
    '群組一起規劃的分頁：左邊是「聊天」，旁邊是共用的「筆記」和「連結」，它們下面是「投票」，最後是「接下來」。這裡寫下的一切都會同時出現在其他每位成員的畫面上，不用重新載入。',
  'help.ctx.trip-collab.bullet.1':
    '「聊天」是左邊那一欄。在「輸入訊息...」裡寫字並按 Enter；Shift 加 Enter 換行。笑臉加上表情符號，「附加圖片」替訊息掛上最多四張圖片。',
  'help.ctx.trip-collab.bullet.2':
    '把滑鼠移到一則訊息上會出現「回覆」，自己的訊息上還有「刪除」；按右鍵可得到八個快捷反應。刪除的訊息只留下一行「刪除了一條訊息」。',
  'help.ctx.trip-collab.bullet.3':
    '「筆記」是共用的記事本：「新建筆記」寫一則，旁邊的齒輪開啟「管理分類」，處理分類的名稱和顏色。卡片上帶著「展開」「置頂」「編輯」和「刪除」。',
  'help.ctx.trip-collab.bullet.4':
    '「連結」收集旅行賴以運作的網址。「新增連結」接受一個標題和一個 http 或 https 位址；「編輯連結」「釘選連結」和「刪除連結」在小塊的尾端，釘選過的連結留在最前面。',
  'help.ctx.trip-collab.bullet.5':
    '「投票」用來拍板。「新建投票」提一個問題，至少配兩個選項；點一下某個選項就是你的一票，「關閉」結束投票，「刪除」移除這個投票。',
  'help.ctx.trip-collab.bullet.6':
    '「接下來」列出旅行中還在前面的停靠點，最多八個，連同它們的時間和參與的人。它只讀取當天的計劃；時間在那裡設定。',
  // write-note
  'help.guide.write-note.title': '寫一則共用筆記',
  'help.guide.write-note.goal': '把整個群組都需要的東西，一條規矩、一個地址、一個提醒，放在人人都能再找到的地方。',
  'help.guide.write-note.step.1': '點選「筆記」面板頂部的「新建筆記」。表單開啟。',
  'help.guide.write-note.step.2':
    '「筆記標題」是卡片帶的名字。它是表單唯一堅持要的東西：裡面沒有內容，「建立」就一直是灰的。',
  'help.guide.write-note.step.3':
    '它下面的大框放內文，接受 Markdown：一個粗體詞、一個清單、一個標題。卡片顯示開頭幾行，卡片上的「展開」開啟整則筆記。',
  'help.guide.write-note.step.4':
    '在「分類」下面選這則筆記所屬的那一個；它的顏色成為卡片的顏色。那些藥丸形狀的是已經存在的分類，新分類在「管理分類」裡建立。',
  'help.guide.write-note.step.5': '「網站」接受一個屬於這則筆記的連結。卡片隨後會帶一個開啟它的 Link 方塊。',
  'help.guide.write-note.step.6': '點選「建立」。',
  'help.guide.write-note.result':
    '筆記成為「筆記」面板裡的一張卡片，帶著所屬分類的顏色，而且已經在其他每位成員的畫面上。',
  'help.guide.write-note.tip.1': '卡片上的「置頂」把它留在面板最上面；它下面的一切按最後修改時間排序。',
  'help.guide.write-note.tip.2':
    '「新建筆記」旁邊的齒輪開啟「管理分類」：在那裡給分類配顏色，一次在所有地方改名，或者在任何筆記用到它之前就先建好。',
  'help.guide.write-note.tip.3':
    '「附加檔案」替筆記掛上一份文件。「附加」開啟檔案選擇器，圖片或 PDF 也可以直接貼進表單。',
  'help.guide.write-note.tip.4':
    '「筆記」在「擴充套件」下面、「Collab」之下有自己的開關：管理員可以把它關掉，讓「聊天」「連結」「投票」和「下一步」繼續運作。',
  // shared-links
  'help.guide.shared-links.title': '收集旅行的連結',
  'help.guide.shared-links.goal': '把訂房入口、共用相簿和時刻表放在一處，不必再翻聊天紀錄去找它們。',
  'help.guide.shared-links.step.1': '點選「連結」面板頂部的「新增連結」。',
  'help.guide.shared-links.step.2': '在「連結標題」裡給連結取個名字，把網址貼進它下面的欄位，然後點選「儲存連結」。',
  'help.guide.shared-links.step.3': '小塊顯示名字和它指向的網站。點一下就在新分頁裡開啟那個頁面。',
  'help.guide.shared-links.step.4':
    '它尾端的三個小按鈕是「編輯連結」「釘選連結」和「刪除連結」。「釘選連結」把小塊移到面板最前面；「刪除連結」什麼也不問。',
  'help.guide.shared-links.result': '連結成為「連結」面板裡的一個小塊，釘選在最前面，而且同時出現在每位成員的畫面上。',
  'help.guide.shared-links.tip.1': '只接受 http 和 https 位址；其他東西，欄位在儲存之前就拒絕。',
  'help.guide.shared-links.tip.2':
    '釘選的連結排在前面，然後是最新的。標題旁邊的小圖示是網站自己的網站圖示，從網站本身取來，所以沒有網路時小塊改為顯示一個普通的連結符號。',
  'help.guide.shared-links.tip.3':
    '「連結」在「擴充套件」下面、「Collab」之下有自己的開關，所以管理員可以關掉這個面板而不動分頁的其餘部分。',
  // create-poll
  'help.guide.create-poll.title': '問問群組',
  'help.guide.create-poll.goal': '把聊天裡沒人回答的問題，變成人人都能勾選的投票。',
  'help.guide.create-poll.step.1': '點選「投票」面板頂部的「新建投票」。',
  'help.guide.create-poll.step.2': '寫下問題。框下面的「支援 Markdown」意思是粗體詞、換行或者短清單在這裡都管用。',
  'help.guide.create-poll.step.3': '填寫「選項 1」和「選項 2」。兩個有內容的選項是最低要求。',
  'help.guide.create-poll.step.4': '「+ 新增選項」加上第三個、第四個，要多少加多少；某一列旁邊的小叉再把一個去掉。',
  'help.guide.create-poll.step.5': '「多選」讓每個人都能勾選不止一個選項。保持關閉時，有人改選別的，票就轉過去。',
  'help.guide.create-poll.step.6': '點選「建立投票」。',
  'help.guide.create-poll.result': '投票立在「投票」面板的最上面，處於開放狀態，還沒有人投過票。',
  'help.guide.create-poll.tip.1': '問題按 Markdown 呈現；選項保持純文字。',
  'help.guide.create-poll.tip.2': '在有了一個問題和至少兩個有內容的選項之前，「建立投票」一直是灰的。',
  'help.guide.create-poll.tip.3':
    '截止時間只能在手機應用程式裡設定。有截止時間的投票在這裡用一個琥珀色小塊顯示剩餘時間，時間一到就算已關閉。',
  'help.guide.create-poll.tip.4':
    '「投票」在「擴充套件」下面、「Collab」之下有自己的開關：管理員可以把它關掉，讓另外四個面板繼續運作。',
  // vote-poll
  'help.guide.vote-poll.title': '投票並讀懂結果',
  'help.guide.vote-poll.goal': '投下你的一票，看看群組的態度，再改變主意。',
  'help.guide.vote-poll.step.1': '點選你想要的選項。它的圓圈被填滿，後面的長條隨之變長。',
  'help.guide.vote-poll.step.2': '現在整個結果都可讀了：長條是占比，百分比在右邊，小圓圈是選了那個選項的人。',
  'help.guide.vote-poll.step.3': '改主意了？點選另一個選項。在沒有「多選」的投票裡，你的票會轉過去，而不是再加一票。',
  'help.guide.vote-poll.step.4':
    '問題下面寫著這個投票有多少票。點一下你已經選過的選項就把你的票收回來，計數也跟著降下去。',
  'help.guide.vote-poll.result': '你的勾在一個選項上，長條顯示群組怎樣分開，圓圈說明誰選了什麼。',
  'help.guide.vote-poll.tip.1':
    '長條和百分比只有在你自己投過票之後，或者投票關閉之後才出現，這樣沒人會被當前的票勢影響。',
  'help.guide.vote-poll.tip.2': '投票從不匿名：把滑鼠移到某個選項上的一個圓圈上，就能看到它背後的名字。',
  // close-poll
  'help.guide.close-poll.title': '關閉一個投票，或者移除它',
  'help.guide.close-poll.goal': '群組做出決定後停止投票，並清掉已經沒人需要的投票。',
  'help.guide.close-poll.step.1': '「關閉」，也就是投票角上的那把鎖，結束投票。選項不再接受點選。',
  'help.guide.close-poll.step.2':
    '關閉的投票沉到面板底部的「已關閉」標題下面，戴上「已關閉」徽章，並向所有人顯示結果，無論他們投沒投票。勝出的選項染成綠色。',
  'help.guide.close-poll.step.3': '同一個角上的垃圾桶「刪除」移除這個投票。沒有任何二次詢問，票也一起消失。',
  'help.guide.close-poll.result': '投票從每位成員的面板上消失了。只被你關閉的那個仍然留在底部可讀，連同它的結果。',
  'help.guide.close-poll.tip.1': '關閉不能復原：沒有重新開啟。誤關的投票只能重新再問一次。',
  'help.guide.close-poll.tip.2': '「刪除」把這個投票和上面的每一張票，對所有人一併拿走，立刻生效，也不會詢問。',
  // whats-next
  'help.guide.whats-next.title': '讀懂「接下來」',
  'help.guide.whats-next.goal': '不用開啟計劃，就看到群組接下來要做什麼。',
  'help.guide.whats-next.step.1':
    '這個面板按時間順序列出旅行中還在前面的停靠點，最多八個，每天一個標題：「今天」「明天」或者日期。',
  'help.guide.whats-next.step.2':
    '一列的左邊立著它的時間：開始時間、「至」，以及停靠點有結束時間時的結束時間；還沒有給它設定時間時則是 TBD。',
  'help.guide.whats-next.step.3': '名字下面的小塊是這個停靠點上的人。如果沒有給它選人，旅行裡的每個人都會列出來。',
  'help.guide.whats-next.result': '一份即將到來的清單，只供閱讀：它跟著計劃走，這裡的任何東西都不會改動計劃。',
  'help.guide.whats-next.tip.1': '這裡什麼也不設定。時間來自當天的計劃；在那裡改動，這份清單立刻跟上。',
  'help.guide.whats-next.tip.2': '只列出還在前面的：時間已過的停靠點會掉出去，旅行到了尾聲，面板就是空的。',
  'help.guide.whats-next.tip.3':
    '「下一步」在「擴充套件」下面、「Collab」之下有自己的開關，而且它是桌面版的面板：手機應用程式的「Collab」分頁裡沒有它。',
  // trip-chat
  'help.guide.trip-chat.title': '和群組說話',
  'help.guide.trip-chat.goal': '說點什麼，回答某一則特定的訊息，對另一則做出反應，再把自己的收回來。',
  'help.guide.trip-chat.step.1':
    '在「輸入訊息...」裡寫字並按 Enter。框旁邊的藍色箭頭做同樣的事；Shift 加 Enter 則是換行。',
  'help.guide.trip-chat.step.2':
    '笑臉開啟表情選擇器，裡面有 Smileys、Reactions 和 Travel。你選中的會加進正在寫的內容裡，它不會自己送出去。',
  'help.guide.trip-chat.step.3': '把滑鼠移到別人的訊息上：角落會出現一個小圓按鈕。那就是「回覆」。',
  'help.guide.trip-chat.step.4':
    '你要回答的訊息會被引用在輸入框上方。寫好並傳送，引用就跟著進入你的泡泡；引用上的叉再把它去掉。',
  'help.guide.trip-chat.step.5': '按右鍵點一則訊息可得到八個快捷反應。你的反應待在泡泡下面，再點一次同一個就收回。',
  'help.guide.trip-chat.step.6':
    '你自己的訊息在「回覆」旁邊帶著「刪除」。它把訊息拿走，只留下一行「刪除了一條訊息」：沒有回頭路。',
  'help.guide.trip-chat.result':
    '你的回答待在它引用的那則訊息下面，一個反應掛在第三則上，被你收回的那則只留下一行說明。',
  'help.guide.trip-chat.tip.1': 'Enter 傳送，Shift 加 Enter 換行。整則只有表情符號的訊息會放大顯示。',
  'help.guide.trip-chat.tip.2': '「附加圖片」一則訊息最多收四張圖片；圖片也可以直接貼上或拖放到框裡。',
  'help.guide.trip-chat.tip.3':
    '帶連結的訊息下面會有一張預覽卡片，由你自己的 TREK 取回，所以指向只有你能存取的東西的連結，仍然只是一個普通連結。',
  'help.guide.trip-chat.tip.4':
    '「聊天」在「擴充套件」下面、「Collab」之下有自己的開關：管理員可以把它關掉，讓「筆記」「連結」「投票」和「下一步」繼續運作。',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': '清單',
  'help.ctx.trip-lists.summary':
    '一趟旅行的兩份清單：行李清單，記下誰帶什麼、有多重；還有待辦清單，記下出發前和旅途中必須發生的每一件事。只要「行李」擴充套件開著，這個分頁就在。',
  'help.ctx.trip-lists.bullet.1':
    '頂部的「行李清單」和「待辦事項」在兩者之間切換，並各自數出裡面有多少；右邊的按鈕屬於當前開啟的那一邊。',
  'help.ctx.trip-lists.bullet.2':
    '行李清單依清單分組，證件、衣物，隨你怎麼叫，每份清單帶一個顏色圓點、一個已打包/總數的徽章，以及裝著「重新命名」「全部勾選」「取消全部勾選」和「刪除清單」的三個點。上方工具列裡的「新增清單」建立一份新的。',
  'help.ctx.trip-lists.bullet.3':
    '一列是一個勾選框和一個名稱，然後是誰帶它、數量和以克計的重量這幾個小徽章，以及行李圓圈（在「行李追蹤」開著時），再是垃圾桶和裝著「移動到清單」「共用」「重新命名」和「刪除」的三個點。一列沒用到的部分會保持淡色，直到你把指標移上去；左邊的抓手把它在所屬清單裡上下拖曳。',
  'help.ctx.trip-lists.bullet.4':
    '「共用」和「我的清單」把行李清單一分為二：所有人都看得到的公共區，和你自己的那份。「全部」「未完成」「已完成」收窄當前開啟的那一邊，上方的進度條數出已經打包了多少。',
  'help.ctx.trip-lists.bullet.5':
    '「應用模板」和「儲存為範本」不用一條條敲就能填滿或留下一份清單，旁邊的兩個圖示把清單匯出為列印稿、PDF 或檔案，也能匯入一份。進度條旁邊的紅色按鈕寫出有多少物品已勾選，並把它們清走。',
  'help.ctx.trip-lists.bullet.6':
    '「待辦事項」有自己的側欄：進度卡片，「全部」「我的任務」「已逾期」「已完成」幾個篩選，每份清單一列，下面是「新增清單」。任務放在一張卡片裡，卡片的標題列寫著篩選名稱，並帶有排序：「優先順序」或「到期日」。點選一個任務會在右側面板裡開啟它，「新增任務」則在螢幕中央開啟「新任務」表單。',
  // packing-categories
  'help.guide.packing-categories.title': '建立行李清單',
  'help.guide.packing-categories.goal': '把要帶的東西歸進清單，填上物品，並說明誰來負責每一份清單。',
  'help.guide.packing-categories.step.1':
    '點選清單上方工具列裡的「新增清單」，在「清單名稱（例如：衣物）」裡輸入名稱，然後點選「新增」。',
  'help.guide.packing-categories.step.2':
    '新清單以一個空列開始。點選「新增物品」，在「物品名稱...」裡輸入物品並按 Enter；輸入框會一直開著，等下一個。',
  'help.guide.packing-categories.step.3': '點選一列的名稱給它改名，或者用它右端三個點裡的「重新命名」。',
  'help.guide.packing-categories.step.4':
    '清單標題裡的虛線圓圈把旅行成員指派到這份清單。選一個名字；出現的標籤再點一下就把那個人移除。',
  'help.guide.packing-categories.step.5':
    '標題末尾的三個點裝著其餘的：「重新命名」「全部勾選」「取消全部勾選」，以及「刪除清單」，它會連清單帶裡面的一切一起拿走，不再問第二遍。',
  'help.guide.packing-categories.result':
    '新清單排在格線裡，物品在它下面，帶著自己的顏色圓點，徽章數出已經打包了多少。',
  'help.guide.packing-categories.tip.1':
    '一份清單就是它的物品。刪掉最後一個，那一列會變成佔位列，好讓清單保住位置和顏色；把那一列也刪掉，清單就沒了。',
  'help.guide.packing-categories.tip.2':
    '把某人指派到一份清單會給他發一則行李通知。這不會改變誰能看到這些物品，那是一列的三個點裡的「共用」。',
  'help.guide.packing-categories.tip.3': '兩份清單可以同名。TREK 在內部區分它們，所以名字保持你輸入的樣子。',
  // check-off-packing
  'help.guide.check-off-packing.title': '一邊收拾一邊打勾',
  'help.guide.check-off-packing.goal': '標記已經進包的東西，看著進度條，再把打包好的物品清走。',
  'help.guide.check-off-packing.step.1': '點選一列左邊的方框。名稱被劃掉，進度條往前走。',
  'help.guide.check-off-packing.step.2': '上方的進度條把已打包的數量對著清單上的全部來數，既給數字也給百分比。',
  'help.guide.check-off-packing.step.3': '整份清單一次搞定：它標題裡的三個點裝著「全部勾選」和「取消全部勾選」。',
  'help.guide.check-off-packing.step.4':
    '「全部」「未完成」「已完成」收窄格線。「未完成」只留下還缺的東西，所以已經裝齊的清單會從裡面消失。',
  'help.guide.check-off-packing.step.5':
    '進度條旁邊的「移除 3 個已勾選」在瀏覽器確認一次之後，把所有已勾選的物品一次刪掉。',
  'help.guide.check-off-packing.result': '列出的只剩還沒完成的，上方的進度條說出打包進行到哪一步。',
  'help.guide.check-off-packing.tip.1': '已勾選的物品仍然可以改名：點選它的名稱。',
  'help.guide.check-off-packing.tip.2':
    '「全部勾選」和「取消全部勾選」一次只對一份清單起作用，要從那份清單自己的三個點裡用。',
  'help.guide.check-off-packing.tip.3': '當每個物品都勾上時，計數會被「全部打包完成！」取代，進度條變綠。',
  // apply-packing-template
  'help.guide.apply-packing-template.title': '套用行李範本',
  'help.guide.apply-packing-template.goal': '把一份現成的清單帶進旅行，並把這趟旅行的清單留給下一趟。',
  'help.guide.apply-packing-template.step.1': '點選清單上方工具列裡的「應用模板」。',
  'help.guide.apply-packing-template.step.2': '挑一個範本。每一列寫出它的名字和裡面有多少物品。',
  'help.guide.apply-packing-template.step.3':
    '物品落在你當前所在的檢視裡：「共用」把它們放進所有人都看得到的公共區，「我的清單」讓它們歸你。',
  'help.guide.apply-packing-template.step.4':
    '把這趟旅行的清單留給下一趟：「儲存為範本」會開啟一個對話框，輸入名字後點選「儲存」。',
  'help.guide.apply-packing-template.result': '範本的清單和物品已經在旅行裡，就挨著原來就有的東西。',
  'help.guide.apply-packing-template.tip.1': '範本只帶名稱和清單。數量、重量、行李和已經勾選的狀態都留在原地。',
  'help.guide.apply-packing-template.tip.2': '只有存在範本時才有「應用模板」。一個都沒有的話，這個按鈕根本不出現。',
  'help.guide.apply-packing-template.tip.3':
    '「儲存為範本」只對執行個體管理員出現，而且只在清單裡有物品時出現。它儲存共用區加上你自己的物品，絕不會儲存別的成員的私人物品。',
  // import-packing-list
  'help.guide.import-packing-list.title': '整份行李清單貼上來',
  'help.guide.import-packing-list.goal': '把你已經放在別處的一份清單，一次性變成行李物品。',
  'help.guide.import-packing-list.step.1': '點選清單上方工具列裡帶向下箭頭的匯入按鈕。',
  'help.guide.import-packing-list.step.2':
    '每列一個物品：類別, 名稱, 以克計的重量（可選）, 行李（可選）, checked/unchecked（可選）。框裡的灰色範例把四種寫法都展示了。Markdown 清單也可以：標題就是清單名稱，「- [ ]」和「- [x]」會變成物品。',
  'help.guide.import-packing-list.step.3':
    '或者用「載入 CSV/TXT/MD」從檔案裡讀入這些列。它接受 .csv、.txt 或 .md 檔案，並取代掉框裡的內容。',
  'help.guide.import-packing-list.step.4': '點選「匯入」。按鈕會數出它讀懂了多少列。',
  'help.guide.import-packing-list.result':
    '每一列都成了一條物品，落在它第一個欄位指定的清單裡，原來就有的東西一點沒動。',
  'help.guide.import-packing-list.tip.1':
    '逗號、分號和定位字元都能分隔欄位，雙引號把一個欄位攏在一起，所以「Shirt, blue」還是一個名稱。只有一個值的列就只是一個名稱，沒有自己清單的列落進「其他」，名稱前的「3x」設定數量。',
  'help.guide.import-packing-list.tip.2':
    '第四個欄位裡點名的行李，如果旅行裡還沒有就會被建立。這是唯一一處能批次載入重量和行李的地方；範本只帶來名稱和清單。',
  // export-packing-list
  'help.guide.export-packing-list.title': '列印或匯出行李清單',
  'help.guide.export-packing-list.goal': '把清單帶走：印在紙上、存成 PDF，或存成檔案，給別的應用程式或下一趟旅行用。',
  'help.guide.export-packing-list.step.1': '點選清單上方工具列裡帶向上箭頭的匯出按鈕。',
  'help.guide.export-packing-list.step.2': '「Markdown 清單 (.md)」和「用於匯入的 CSV (.csv)」會直接把清單儲存為檔案。',
  'help.guide.export-packing-list.step.3':
    '點選「列印或儲存為 PDF」。預覽把清單排成一頁：頂部是旅行和日期，下面每份清單是一張帶勾選框的卡片。',
  'help.guide.export-packing-list.step.4':
    '點選預覽下方的「列印或儲存為 PDF」。瀏覽器會開啟列印對話框：選一台印表機，或選「儲存為 PDF」存成檔案。',
  'help.guide.export-packing-list.result':
    '列印稿和檔案包含當前開啟的檢視，即「共用」或「我的清單」，連同數量、重量和勾選狀態。',
  'help.guide.export-packing-list.tip.1':
    'CSV 正是「匯入」讀取的格式，連行李也包含在內，所以可以當作你自己的行李範本：匯入到下一趟旅行裡即可。',
  'help.guide.export-packing-list.tip.2':
    'Markdown 檔案在 Obsidian、Notion 或 GitHub 裡會顯示為勾選清單，也同樣可以透過「匯入」再匯回來。',
  // share-packing-item
  'help.guide.share-packing-item.title': '決定誰看得到一件物品、誰來帶',
  'help.guide.share-packing-item.goal': '把一件物品在群組公共區、你自己的清單和你替他們帶的人之間挪來挪去。',
  'help.guide.share-packing-item.step.1':
    '清單上方的「共用」是所有人都看得到的公共區，「我的清單」是你自己的，兩邊各自數出裡面有多少。點選「我的清單」看你自己的。',
  'help.guide.share-packing-item.step.2': '回到「共用」，開啟一列末端的三個點，點選「共用」。',
  'help.guide.share-packing-item.step.3':
    '一共三階：「共用」，在群組公共區裡，所有人可見；「個人」，只有你看得到；還有「共用給…」，在那裡挑出這件物品涵蓋到的人。',
  'help.guide.share-packing-item.step.4': '「個人」的物品只在「我的清單」裡。切過去才找得到。',
  'help.guide.share-packing-item.step.5':
    '再開啟一次「共用」，在「共用給…」下面勾一個名字。這件物品也會出現在那個人的清單上，列上會多出一個小徽章，數著它共用給了幾個人。',
  'help.guide.share-packing-item.result': '物品落在你選的那一階裡，列上寫著誰來帶它。',
  'help.guide.share-packing-item.tip.1':
    '只有帶這件物品的人才能改它的共用。被你分享到的人會在自己的「我的清單」上看到它，旁邊標著你的名字，並且可以把它勾掉。',
  'help.guide.share-packing-item.tip.2':
    '在別人帶的物品上，你拿到的是另外兩個按鈕：「我也可以帶」，把你加到他旁邊；還有「複製到我的清單」，給你自己做一份私人副本。',
  'help.guide.share-packing-item.tip.3':
    '新物品繼承你新增它時所在的檢視。在「我的清單」裡加的是「個人」，在「共用」裡加的進公共區。',
  // packing-bags
  'help.guide.packing-bags.title': '給行李秤重',
  'help.guide.packing-bags.goal': '給每件物品寫上重量，把物品分進各件行李，並讓每件行李都不超航空公司的限額。',
  'help.guide.packing-bags.step.1': '點選圓圈前面的重量徽章，輸入物品以克為單位的重量。',
  'help.guide.packing-bags.step.2': '列末的圓圈就是它的行李。點它。',
  'help.guide.packing-bags.step.3': '還沒有行李：「新增行李」，一個名字，Enter。行李被建立，物品直接進去。',
  'help.guide.packing-bags.step.4':
    '只要存在一件行李，右側就出現「行李」面板：名稱、重量、一條填充條、誰來背、裡面有多少物品，然後是「未分配」和「總重量」。',
  'help.guide.packing-bags.step.5': '點選「設定限制」，按航空公司的說法用公斤輸入限額。',
  'help.guide.packing-bags.step.6': '行李名字旁邊的虛線加號說明誰來背它。',
  'help.guide.packing-bags.result':
    '右側的「行李」面板把每件行李的重量對著它的限額顯示出來，還有不在任何行李裡的東西，以及總計。',
  'help.guide.packing-bags.tip.1':
    '重量輸入框、行李圓圈和「行李」面板，只有在管理員於「行李」擴充套件下開啟了「行李追蹤」時才存在。',
  'help.guide.packing-bags.tip.2':
    '一件行李的重量是在伺服器上把每位成員的物品加起來的，包括你看不到的那些，所以這個數字真的就是這件行李的重量。',
  'help.guide.packing-bags.tip.3':
    '沒有限額的行李按最重的那件來畫，好讓各條進度條仍然可比。給它一個限額，進度條就改成按那個來讀。',
  // create-todo
  'help.guide.create-todo.title': '新增一個任務',
  'help.guide.create-todo.goal': '把必須發生的事記下來，配上清單、優先順序、日期和負責人。',
  'help.guide.create-todo.step.1': '點選右上角的「新增任務」。',
  'help.guide.create-todo.step.2': '在「任務名稱」裡給它取名，把值得記住的內容寫在「說明」下面。',
  'help.guide.create-todo.step.3': '「清單」把任務歸類。選一個，或者用旁邊的加號在一個小對話框裡替新清單命名。',
  'help.guide.create-todo.step.4': '「優先順序」是四個按鈕：「無」、P1、P2 和 P3，從紅到藍。',
  'help.guide.create-todo.step.5': '「到期日」開啟一個日曆，「指派給」給任務寫上一個名字。',
  'help.guide.create-todo.step.6': '點選「建立任務」。',
  'help.guide.create-todo.result':
    '任務已經在清單裡，帶著它的徽章：優先順序、到期日、清單和被指派的人，並且在右側面板裡開啟。',
  'help.guide.create-todo.tip.1': '只有名稱是必填的。其餘的都可以之後從右側面板補上。',
  'help.guide.create-todo.tip.2': '側欄裡選中了某份清單時，新任務就從那份清單開始。',
  'help.guide.create-todo.tip.3': '在名稱框裡按 Enter 會直接建立任務，不用碰其他欄位。',
  // todo-filters
  'help.guide.todo-filters.title': '找到並修改一個任務',
  'help.guide.todo-filters.goal': '把任務清單削到眼下要緊的部分，再編輯你落到的那個任務。',
  'help.guide.todo-filters.step.1':
    '側欄裡的「任務」：「全部」是所有還沒完成的，「我的任務」是落在你身上的，「已逾期」是日期已經過去的，「已完成」是做完的。每一項都帶著自己的數字；點選「已逾期」。',
  'help.guide.todo-filters.step.2': '「清單」下面每份清單一列。選中一列就顯示那份清單，連已完成的任務也在內。',
  'help.guide.todo-filters.step.3':
    '清單標題列裡的排序會重新排列螢幕上的內容：「優先順序」把 P1 放最前，「到期日」把最近的期限放最前。兩者一次只能用一個，再點一次就回到你自己的順序。',
  'help.guide.todo-filters.step.4': '點選一個任務，在右側面板裡開啟它。',
  'help.guide.todo-filters.step.5':
    '改你需要改的，「說明」「優先順序」「清單」「到期日」或「指派給」，然後「儲存變更」。面板標題列裡的核取方塊把任務勾為完成，「刪除」立刻把它刪掉。',
  'help.guide.todo-filters.result': '清單只顯示你要的任務，右側面板編輯你選中的那一個。',
  'help.guide.todo-filters.tip.1':
    '清單那一列只數還沒完成的，但選中它連已完成的任務也會顯示。「全部」「我的任務」和「已逾期」藏起做完的；「已完成」則只顯示做完的。',
  'help.guide.todo-filters.tip.2':
    '排序裡的「優先順序」和「到期日」互相排斥，而且只要其中一個開著，列就不能再拖成你自己的順序了。',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': '預訂',
  'help.ctx.trip-bookings.summary':
    '這一欄裝著旅行中除交通之外預訂的一切：住的地方、餐位、門票、旅遊團、停車。每筆預訂都是「待確認」或「已確認」裡的一張卡片，帶著它的預訂碼、單據、出行成員和費用。',
  'help.ctx.trip-bookings.bullet.1':
    '右上角的「手動新增」開啟表單。它能做出的六類是「住宿」「餐廳」「活動」「旅遊團」「停車」和「其他」；航班、火車之類在「交通」欄裡，絕不會出現在這裡。',
  'help.ctx.trip-bookings.bullet.2':
    '「從檔案匯入」把一份訂位確認交給解析：EML、PDF、PKPass、HTML 或 TXT，最多 5 個檔案，每個不超過 10 MB。只有伺服器能讀它們時，這個按鈕才在。',
  'help.ctx.trip-bookings.bullet.3':
    '標題旁的篩選片按型別篩選，每片帶著自己的數量，「全部」把一切帶回來。一旦有預訂指定了人，篩選片旁邊那一排頭像就能把這一欄收窄到其中一個人。',
  'help.ctx.trip-bookings.bullet.4':
    '卡片分在兩個區裡，「待確認」和「已確認」，各帶自己的數量。點選區標題會把它摺起來，是否展開會為這次旅行記住。',
  'help.ctx.trip-bookings.bullet.5':
    '一張卡片帶著狀態圓點、型別、標題、日期和時間、「預訂碼」、「地點 / 地址」、這筆預訂關聯到什麼、它的「連結」、「備註」、「檔案」和「出行成員」。',
  'help.ctx.trip-bookings.bullet.6':
    '卡片上的鉛筆再次開啟同一個表單；垃圾桶問一次，然後這筆預訂就沒了。若是住宿，它在日程計劃裡的住宿日和關聯的支出會一併消失。',
  // create-booking
  'help.guide.create-booking.title': '建立一筆預訂',
  'help.guide.create-booking.goal': '把一家餐廳、一場活動、一個旅遊團、一個車位或別的什麼，手動放進這次旅行。',
  'help.guide.create-booking.step.1': '點選這一欄右上角的「手動新增」。「新建預訂」開啟。',
  'help.guide.create-booking.step.2':
    '從表單頂部「出行成員」旁邊的清單裡選「預訂型別」。這一欄做的六類是「住宿」「餐廳」「活動」「旅遊團」「停車」和「其他」，表單隨選擇而變：只有「住宿」會把日期換成一段日子的範圍。',
  'help.guide.create-booking.step.3': '填「標題」。這是表單唯一堅持要的欄位，在它有內容之前「新增」一直是灰的。',
  'help.guide.create-booking.step.4':
    '設定「日期」和「開始時間」，如果這筆預訂有結束，再設「結束日期」和「結束時間」。日曆只給出旅行之內的日子；結束不晚於開始時，會用紅色這樣提示並擋住「新增」。',
  'help.guide.create-booking.step.5':
    '填入確認單上的「預訂碼」，並設定「狀態」。是「待確認」還是「已確認」，決定卡片落進兩個區中的哪一個。',
  'help.guide.create-booking.step.6': '點選「新增」。',
  'help.guide.create-booking.result':
    '這筆預訂成了它那個區裡的一張卡片，帶著型別篩選片、日期和預訂碼，旅行中其他所有人也會看到它出現。',
  'help.guide.create-booking.tip.1':
    '「地點 / 地址」在你輸入時給出真實地址；選中一個會替換你寫下的內容，而你自己輸入的地址會原樣保留。',
  'help.guide.create-booking.tip.2': '「連結」放的是這筆預訂在服務商那裡的頁面。卡片會把它變成一個在新分頁開啟的連結。',
  'help.guide.create-booking.tip.3': '「備註」是 Markdown，所以一個清單或一行粗體在卡片上也照樣呈現。',
  // booking-hotel
  'help.guide.booking-hotel.title': '預訂一個住的地方',
  'help.guide.booking-hotel.goal': '錄入一處住宿，讓它同時算作一筆預訂和日程計劃裡的若干夜。',
  'help.guide.booking-hotel.step.1': '點選「手動新增」並選「住宿」。日期欄位消失，一組住宿欄位接替它們的位置。',
  'help.guide.booking-hotel.step.2':
    '在「住宿」下選飯店。清單是這次旅行自己的地點，選中一個會把它的名稱寫進「標題」，地址寫進「地點 / 地址」。',
  'help.guide.booking-hotel.step.3':
    '設定「從」和「到」：第一晚，以及離開的那個早上。兩者都給出旅行的日子及其日期，而且二者會彼此保持先後順序。',
  'help.guide.booking-hotel.step.4': '填寫「入住」「入住截止」「退房」，以及確認單上的「預訂碼」。',
  'help.guide.booking-hotel.step.5': '點選「新增」。',
  'help.guide.booking-hotel.result':
    '卡片帶的不是一個日期而是一段日子的範圍，附上入住和退房時間以及地址；同一段住宿現在也落在計劃的那些日子上。',
  'help.guide.booking-hotel.tip.1':
    '「住宿」是唯一沒有「日期」和「開始時間」的型別。它的日期是「從」和「到」，而且是旅行的日子，不是日曆。',
  'help.guide.booking-hotel.tip.2': '也可以讓「住宿」空著，改為輸入地址：這個地點會被查出來、建好，並替你釘在地圖上。',
  'help.guide.booking-hotel.tip.3': '刪除這筆預訂，會把日程計劃裡的那些夜一併帶走。',
  // link-booking
  'help.guide.link-booking.title': '把一筆預訂繫到計劃上',
  'help.guide.link-booking.goal': '把一筆預訂掛到它所屬的那一站和那個地點上，好讓它出現在你會需要它的地方。',
  'help.guide.link-booking.step.1': '點選你想關聯的那張卡片上的鉛筆。「編輯預訂」開啟。',
  'help.guide.link-booking.step.2':
    '開啟「關聯日程分配」。清單就是你的計劃：每天一個標題，下面是那天的各站，帶編號和時間。選中這筆預訂所屬的那一站。',
  'help.guide.link-booking.step.3':
    '「地點 / 活動」關聯的是地點本身。在那裡選中它，凡是你留空的「標題」和「地點 / 地址」都會被填上。',
  'help.guide.link-booking.step.4': '點選「更新」。',
  'help.guide.link-booking.result': '卡片在「關聯日程分配」下寫出那一天和那一站，這筆預訂也在日程計劃裡跟著那一站走。',
  'help.guide.link-booking.tip.1':
    '清單頂部的「無關聯（獨立）」再次取消關聯。「住宿」根本沒有選站的地方：它透過自己的住宿日來關聯。',
  'help.guide.link-booking.tip.2': '選中某個有日期的日子上的一站，會替你填上空著的「日期」。你已經設過的日期不會被動。',
  // booking-travelers
  'help.guide.booking-travelers.title': '說明一筆預訂是給誰的',
  'help.guide.booking-travelers.goal': '標出一筆預訂涵蓋的出行成員，然後只看他們的。',
  'help.guide.booking-travelers.step.1':
    '用鉛筆開啟這筆預訂。「出行成員」在表單頂部，「預訂型別」旁邊，只要這筆預訂上還沒有人，它就顯示「指派成員」。',
  'help.guide.booking-travelers.step.2':
    '點它，選出這筆預訂是給誰的那些人；有名字的「訪客」也在清單裡。被選中的人會得到一個勾，頭像也會出現在這個欄位中。再點一次名字就取消。',
  'help.guide.booking-travelers.step.3': '點選「更新」。',
  'help.guide.booking-travelers.step.4': '在上方工具列裡，型別篩選片旁邊，點選某位出行成員的頭像，就只看他的預訂。',
  'help.guide.booking-travelers.result': '卡片列出它是給誰的那些人，而頭像那一排把這一欄收窄到其中一個人。',
  'help.guide.booking-travelers.tip.1': '在卡片上，出行成員只是顯示，永遠改不了。要設定就在這裡，在表單裡。',
  'help.guide.booking-travelers.tip.2':
    '頭像那一排要等這次旅行不止一位成員、且至少有一筆預訂指定了某人時才出現。你選的內容在這個瀏覽器工作階段裡一直有效。',
  // booking-files
  'help.guide.booking-files.title': '把憑證和預訂放在一起',
  'help.guide.booking-files.goal': '把確認單、票或通行證附到它所屬的那筆預訂上。',
  'help.guide.booking-files.step.1':
    '用鉛筆開啟這筆預訂，往下到「檔案」，點選「附加檔案」。在一筆已經存在的預訂上，單據會立刻上傳，TREK 會說「檔案已上傳」。',
  'help.guide.booking-files.step.2': '單據按名稱列出，帶一個開啟它的按鈕，旁邊還有一個 X。',
  'help.guide.booking-files.step.3':
    '「關聯已有檔案」給出這次旅行中還不在這筆預訂上的單據。選中一個，它就被附上，不必再上傳一次。',
  'help.guide.booking-files.step.4': '點選「更新」。',
  'help.guide.booking-files.result': '卡片在「檔案」下列出這些單據，點選其中一個就能開啟。',
  'help.guide.booking-files.tip.1': '在一筆你還在建立的預訂上，單據會等著，在你點「新增」的那一刻上傳。',
  'help.guide.booking-files.tip.2': '單據旁的 X 去掉的是關聯，不是單據本身。它仍留在這次旅行的「檔案」欄裡。',
  'help.guide.booking-files.tip.3':
    '哪些種類的檔案可以附加，取決於管理員的「允許的檔案型別」清單；開箱即用地允許文件、文字和圖片。',
  // booking-cost
  'help.guide.booking-cost.title': '把一筆預訂的金額變成費用',
  'help.guide.booking-cost.goal': '把一筆預訂花掉的錢記進「費用」，並在付錢的人之間分攤。',
  'help.guide.booking-cost.step.1':
    '開啟這筆預訂，走到表單底部。「費用」下面是「建立支出」和「關聯已有支出」，附帶那行說明「先儲存預訂，然後開啟費用編輯器。」',
  'help.guide.booking-cost.step.2': '點選「建立支出」。預訂被儲存，它的表單關上，費用編輯器開啟。',
  'help.guide.booking-cost.step.3':
    '「這筆是什麼支出？」已經是這筆預訂的標題。填入「總金額」，並核對「貨幣」和「日期」。',
  'help.guide.booking-cost.step.4': '「分類」是預訂型別推出來的那一個。設定「誰付的款？」以及金額怎麼「Split」。',
  'help.guide.booking-cost.step.5': '點選「新增支出」。',
  'help.guide.booking-cost.result':
    '這筆預訂的表單現在在「已關聯支出」下列出這筆支出和它的金額，同一筆支出也立在「費用」欄裡，繫在這筆預訂上。',
  'help.guide.booking-cost.tip.1':
    '分類跟著型別走：「餐廳」變成「餐飲」，「住宿」變成「住宿」，「停車」變成「停車」，「活動」和「旅遊團」都落進「其他」。',
  'help.guide.booking-cost.tip.2':
    '一筆預訂可以帶多筆支出。「關聯已有支出」會列出「費用」裡還不屬於任何地方的支出。在已關聯的一筆上，「取消關聯，保留支出」會解開關聯並把它留在「費用」裡，而垃圾桶會把它移除。',
  'help.guide.booking-cost.tip.3': '只有在「費用」擴充套件開著時，「費用」才在表單裡，管理員在「擴充套件」下切換它。',
  // filter-bookings
  'help.guide.filter-bookings.title': '找到一筆預訂',
  'help.guide.filter-bookings.goal': '把一長欄收窄到你要的型別、人或狀態。',
  'help.guide.filter-bookings.step.1':
    '標題旁的篩選片是這次旅行實際用到的型別，每片帶著它所含的數量。「全部」就是整欄。',
  'help.guide.filter-bookings.step.2': '點一片篩選片，只留下那個型別。再點第二片，兩個都留下。',
  'help.guide.filter-bookings.step.3': '「全部」把一切放回來。',
  'help.guide.filter-bookings.step.4': '篩選片旁邊的頭像按出行成員篩選，一個人或一次幾個人都行。',
  'help.guide.filter-bookings.step.5':
    '「待確認」和「已確認」是那兩個區，各帶自己的數量。點選一個標題把它摺起來；你回來時它仍然是摺著的。',
  'help.guide.filter-bookings.result': '這一欄只顯示你挑出來的內容，而且在這個瀏覽器工作階段裡你回來時它仍然那樣挑著。',
  'help.guide.filter-bookings.tip.1':
    '篩選片只給出這次旅行有的型別，所以一次連一個旅遊團都沒有的旅行，就沒有「旅遊團」這一片。',
  'help.guide.filter-bookings.tip.2':
    '一個什麼都比對不到的篩選，會讓這一欄空著，只剩「未找到地點」。措辭是地點清單的；意思是一樣的。',
  // import-booking-file
  'help.guide.import-booking-file.title': '從確認單裡讀出一筆預訂',
  'help.guide.import-booking-file.goal': '讓 TREK 從服務商發來的郵件或 PDF 裡把預訂取出來，而不必再輸一遍。',
  'help.guide.import-booking-file.step.1': '點選工具列裡的「從檔案匯入」。「匯入訂位確認」開啟。',
  'help.guide.import-booking-file.step.2':
    '把確認單拖放到那個框上，或點選它來挑選：EML、PDF、PKPass、HTML 和 TXT，最多 5 個檔案，每個 10 MB。你挑的那些檔案的名字會寫在框上。',
  'help.guide.import-booking-file.step.3': '點選「匯入」。對話框立刻關上，因為讀取是在背景進行的。',
  'help.guide.import-booking-file.step.4':
    '右下角的一張卡片在檔案名稱下報告這次執行，它會跟著你走遍應用，也挺得過一次重新載入。讀取完成後，「正在解析檔案…」變成一個勾號，卡片給出「匯入」。點選它。',
  'help.guide.import-booking-file.result':
    '這筆預訂是「待確認」裡的一張卡片，帶著它的夜數、預訂碼和「檔案」下的確認單，住宿落在計劃裡的那幾天上，而在「費用」開著時，價格是一筆掛在它上面的支出。',
  'help.guide.import-booking-file.tip.1':
    '只有伺服器能讀訂位確認時，「從檔案匯入」才在，這需要擷取器或「AI 解析」擴充套件二者之一。後者由管理員在「擴充套件」下切換。',
  'help.guide.import-booking-file.tip.2':
    '如果什麼都讀不出來，卡片會這樣說，並給出「Try AI parsing」，它把同樣的檔案直接送給模型。一次完成的解析會保留十分鐘；請在這段時間內開始核對。',
  'help.guide.import-booking-file.tip.3':
    '只有確認單的類型在管理設定的「允許的檔案型別」裡時，它才會被附上。PDF 開箱即在；郵件，也就是 EML，得先加進去，否則預訂儲存時不帶它。',
  // edit-booking
  'help.guide.edit-booking.title': '修改一筆預訂',
  'help.guide.edit-booking.goal': '改正一個時間、補上晚到的預訂碼，或者把一筆預訂從「待確認」挪到「已確認」。',
  'help.guide.edit-booking.step.1': '點選卡片頭部的鉛筆。「編輯預訂」帶著這筆預訂知道的一切開啟。',
  'help.guide.edit-booking.step.2': '改該改的地方，這裡是業者終於發來的那個「預訂碼」。',
  'help.guide.edit-booking.step.3': '把「狀態」設為「已確認」。',
  'help.guide.edit-booking.step.4': '點選「更新」。',
  'help.guide.edit-booking.result':
    '卡片挪了位置：一筆已確認的預訂立在「已確認」區裡，前面是一個綠點，旅行中的每個人都看得到它挪動。',
  'help.guide.edit-booking.tip.1':
    '讀不出來的「預訂碼」，是設定裡「顯示」下的「模糊預訂程式碼」。把滑鼠停上去，或者點一下，它就清楚了。',
  'help.guide.edit-booking.tip.2': '改了型別，關聯支出的分類也跟著改，除非你曾在費用編輯器裡手動選過一個分類。',
  'help.guide.edit-booking.tip.3': '住宿也在這裡編輯：它的「從」和「到」那兩天就在同一個表單裡。',
  // delete-booking
  'help.guide.delete-booking.title': '刪除一筆預訂',
  'help.guide.delete-booking.goal': '把一筆泡湯的預訂從這次旅行裡拿掉。',
  'help.guide.delete-booking.step.1': '點選卡片頭部的垃圾桶。',
  'help.guide.delete-booking.step.2': '「刪除預訂？」會說出你選中的那一筆，並說明它將被永久刪除。',
  'help.guide.delete-booking.step.3': '點選「確認」。',
  'help.guide.delete-booking.result': '卡片沒了，對旅行中的所有人都是。預訂沒有復原，所以這個問題就是最後一道關。',
  'help.guide.delete-booking.tip.1': '刪除一筆住宿預訂，還會把它在日程計劃裡的那些夜取走，並移除關聯到它的那筆支出。',
  'help.guide.delete-booking.tip.2': '附上過的單據仍留在這次旅行的「檔案」欄裡；走掉的只是它們與這筆預訂的關聯。',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    '找到的每筆預訂都會在「新建預訂」裡逐筆開啟，內容已填好。對飯店來說，那是「標題」裡的名稱，旅行裡有這個地點時還有「住宿」下的地點，它的「地點 / 地址」，按住宿的夜數填好的「從」和「到」，「入住」和「退房」，「預訂碼」，「檔案」下的確認單，以及在「費用」開著時作為「關聯支出」的價格。檢查一遍，點選「新增」。',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': '費用',
  'help.ctx.trip-costs.summary':
    '行程的錢：每一筆支出都是一條帶日期的帳目，誰墊的錢、誰該分攤，用的是收據上原本的貨幣；右欄則寫明誰該付給誰，才能重新扯平。',
  'help.ctx.trip-costs.bullet.1':
    '頂部四張卡片：「你欠款」和「他人欠你」是你自己這一邊的結算，「未結算金額」是已記錄但還沒有付款人的部分，「旅程總支出」把一切加起來，下面帶上「你的分攤」和「你支付了」。',
  'help.ctx.trip-costs.bullet.2': '右上角的「新增支出」打開編輯器；旁邊的「結清」把所有未完成的轉帳一次全部記下。',
  'help.ctx.trip-costs.bullet.3':
    '帳目按日期分組，最新的在前，那一天的合計顯示在右側。每一列帶著作為彩色標籤的分類、名稱、付款人頭像、備註和金額，當分攤讓你多出或少出時，還會帶上「你借出」或「你借入」。',
  'help.ctx.trip-costs.bullet.4':
    '清單上方是「搜尋支出…」、一個類別篩選、一個日期篩選、「全部」/「我支付的」/「他人欠我」開關和「匯出 CSV」按鈕。',
  'help.ctx.trip-costs.bullet.5':
    '右欄就是答案：「結清」列出誰付給誰，「餘額」顯示每位旅伴的盈餘或虧空，「最終花費」是這趟行程讓他們每個人花了多少，「按分類」則是錢去了哪裡。',
  'help.ctx.trip-costs.bullet.6':
    '已記錄的付款在同一本帳裡佔著自己的一列，旁邊有「編輯」和「復原」；支出則有一支鉛筆和一個垃圾桶，而垃圾桶不問就直接刪除。',
  // add-expense
  'help.guide.add-expense.title': '新增一筆支出',
  'help.guide.add-expense.goal': '記下某樣東西花了多少、誰付的錢、和誰一起分攤。',
  'help.guide.add-expense.step.1': '點選「費用」分頁右上角的「新增支出」。編輯器打開，日期是今天，所有人已經在分攤裡。',
  'help.guide.add-expense.step.2':
    '把這筆錢花在哪寫進「這筆是什麼支出？」，這是唯一必須填寫的欄位；把收據上的數字填進「總金額」。',
  'help.guide.add-expense.step.3':
    '「貨幣」和「日期」在金額下方。「貨幣」從行程自己的貨幣開始；改掉它，編輯器就會顯示這筆金額折成行程貨幣是多少。「日期」從今天開始，帳目按它把支出歸到某一天下。',
  'help.guide.add-expense.step.4':
    '挑一個「分類」。一共十四個，而且不能更改：你挑的那個就是列上的彩色標籤，也是「按分類」裡的那根長條。',
  'help.guide.add-expense.step.5':
    '在「誰付的款？」下面，挑出真正掏錢的那個人。「你」是預先選好的；「尚無人付款」只記下金額而不讓任何人承擔，「多人支付」把這筆帳分給幾個付款人。',
  'help.guide.add-expense.step.6':
    'Split 從 Equally 開始，所有人都包含在內，每個名字後面顯示分到的分攤額。點選「新增支出」儲存。',
  'help.guide.add-expense.result': '這筆支出進了它那一天的帳目，計入「旅程總支出」，結算欄也重新算過了誰該付給誰。',
  'help.guide.add-expense.tip.1':
    '保持它打開時的樣子：支出用行程的貨幣，日期是今天，在所有人之間平均分攤，真正必須填的只有名稱和金額。',
  'help.guide.add-expense.tip.2': '金額旁邊的 ± 把支出變成退款。負的總額是把錢退回來而不是收走，分攤也反過來走。',
  'help.guide.add-expense.tip.3':
    '底部的「附加收據/發票」接受圖片和 PDF。它們在你儲存時上傳，落進行程的「檔案」裡，清單中名稱旁邊會出現一個「收據」標記。',
  // expense-payers
  'help.guide.expense-payers.title': '說明這筆帳是誰付的',
  'help.guide.expense-payers.goal': '記下誰為一筆支出先墊了錢，這是結算算式的另一半。',
  'help.guide.expense-payers.step.1':
    '用列旁邊的鉛筆打開一筆支出，看「誰付的款？」。預設是「一人支付」：下拉框裡寫著掏錢的那一個人。',
  'help.guide.expense-payers.step.2':
    '那個下拉框的第一項「尚無人付款」只記下金額，不讓任何人欠下什麼。這筆支出仍然計入「旅程總支出」。',
  'help.guide.expense-payers.step.3':
    '標籤旁邊的連結「多人支付」會為每位旅伴打開一列。把付過錢的人加入，並填寫每人各出了多少；這些金額必須加起來等於總額。',
  'help.guide.expense-payers.step.4':
    '沒有人付過的支出會在列上標記「未完成」，並計入「未結算金額」卡片，那裡正是已記錄但未結清的開銷匯集的地方。',
  'help.guide.expense-payers.result': '誰付的錢決定誰被還錢，分攤決定誰該付錢，「餘額」就是兩者之差。',
  'help.guide.expense-payers.tip.1':
    '「誰付的款？」和 Split 彼此獨立：你可以為一頓自己沒去的晚餐付錢，也可以被算進一頓自己沒付錢的晚餐。',
  'help.guide.expense-payers.tip.2':
    '有幾個付款人時，金額必須加起來等於總額。再加入一個人，其餘的人會圍著他重新排布；在它們還不相符時，編輯器會說出它們該加到多少，並拒絕儲存。',
  'help.guide.expense-payers.tip.3':
    '移除一個付款人並不會移除這筆支出：金額仍留在「旅程總支出」裡，而這一列會變成「未完成」。',
  // split-expense
  'help.guide.split-expense.title': '在旅伴之間分攤一筆帳',
  'help.guide.split-expense.goal': '決定誰為一筆支出買單：所有人平攤、按金額，或者照著收據一行一行來。',
  'help.guide.split-expense.step.1':
    '在支出編輯器裡，Split 列出每一位旅伴。點選一個名字就把他排除在這筆支出之外；被排除的旅伴顯示「不參與」，不必為它承擔任何金額。',
  'help.guide.split-expense.step.2':
    'Equally 是預設：每位被包含的旅伴分到相同的分攤額，清單下方的那一行會說明分成幾份、每份是多少。',
  'help.guide.split-expense.step.3':
    'Custom 把這些分攤額換成金額輸入框。填入每位旅伴該承擔的金額；下面那一行會一起計數，達到「分攤金額與總額相符」時變成綠色。不相符時它不會儲存。',
  'help.guide.split-expense.step.4':
    'Ticket 把收據一行一行拆開：「新增品項」，然後每行填一個名稱和一個價格，並在「分攤：」下面列出分擔這一行的旅伴。',
  'help.guide.split-expense.step.5':
    '品項下方的「每人分攤額」顯示每位旅伴最終該承擔多少，而頂部的「總金額」由這些品項相加得出。點選「儲存」。',
  'help.guide.split-expense.result': '分攤是所有餘額的根基。它隨支出一起儲存，之後可以修改而不牽動別的任何東西。',
  'help.guide.split-expense.tip.1': '你排除掉的旅伴顯示「不參與」，僅在這一筆支出上不必承擔；其餘的人接過他的分攤額。',
  'help.guide.split-expense.tip.2': 'Equally 精確到分：多出來的那一分會在支出之間輪轉，所以不會總是同一個人來付。',
  'help.guide.split-expense.tip.3': 'Ticket 模式會自己把「總金額」加出來，並把該欄位反灰：收據上的品項就是總額。',
  // expense-currency
  'help.guide.expense-currency.title': '用另一種貨幣輸入支出',
  'help.guide.expense-currency.goal': '照收據上真正寫著的輸入，讓 TREK 替你守住匯率。',
  'help.guide.expense-currency.step.1':
    '打開「新增支出」，按收據上寫的原樣填寫名稱和金額，填那個數字本身，而不是換算過的結果。',
  'help.guide.expense-currency.step.2':
    '打開「貨幣」，挑出收據上的貨幣。清單裡帶著 TREK 認識的每一個代碼，而且可以搜尋：輸入那三個字母。',
  'help.guide.expense-currency.step.3':
    '欄位下方會出現一行，寫明這筆金額此刻值多少，標著「即時匯率」。它只是預覽，不是最終存下來的東西。',
  'help.guide.expense-currency.step.4':
    '點選「新增支出」。匯率就在此刻凍結：從此以後，這筆支出就值你輸入那天它所值的數。',
  'help.guide.expense-currency.step.5':
    '在帳目裡，這一列在名稱下面帶著兩個數字：你輸入的金額、一個箭頭，以及它折成行程貨幣後的數。上方的每一項合計、餘額和結算用的都是第二個。',
  'help.guide.expense-currency.result':
    '這筆支出保留著你輸入的金額和貨幣。帳目把兩者都顯示出來，而行程的各項合計和餘額仍保持行程的貨幣。',
  'help.guide.expense-currency.tip.1':
    '匯率在你儲存的那一刻凍結，所以一筆已經結清的欠款不會因為下一週行情變動而重新翻起。只有改掉這筆支出的貨幣，才會凍結一個新的匯率。',
  'help.guide.expense-currency.tip.2':
    '「設定」裡的「顯示貨幣」只改變你讀到的內容；存下來的金額從不挪動。留空時，每次旅行都按它自己的貨幣顯示。',
  'help.guide.expense-currency.tip.3':
    '行程貨幣本身在行程上，位於「編輯旅行」下面，需要「編輯旅行詳情」的權限。更改它會把每一個凍結的匯率重新錨定，而不是把金額換算成另一種貨幣。',
  // filter-costs
  'help.guide.filter-costs.title': '找到一筆支出，或者某一天的開銷',
  'help.guide.filter-costs.goal': '把一本長長的帳目收窄到你真正要找的那一部分。',
  'help.guide.filter-costs.step.1': '在清單上方的「搜尋支出…」裡輸入。它會隨著你輸入比對支出的名稱。',
  'help.guide.filter-costs.step.2': '「所有類別」會展開十四個分類。挑一個，就只剩下那個分類的支出。',
  'help.guide.filter-costs.step.3':
    '「所有日期」列出每一個花過錢的日子。挑一個，就會有一條橫幅取代日期標題，寫著那一天、它包含多少筆支出以及它的合計。',
  'help.guide.filter-costs.step.4':
    '「全部」/「我支付的」/「他人欠我」開關是你自己這一邊看到的帳目：你為哪些掏了錢，又有哪些錢還沒回到你手裡。',
  'help.guide.filter-costs.step.5':
    '列尾的「匯出 CSV」把每一筆支出寫進一個檔案，帶上原始金額、它的貨幣和換算後的金額。',
  'help.guide.filter-costs.result': '篩選可以疊加，日期分組也會用剩下內容的合計重新繪製。',
  'help.guide.filter-costs.tip.1':
    '已記錄的付款沒有名稱也沒有分類，所以搜尋或類別篩選會把它們藏起來。日期篩選則把它們留著，歸在付款被記下的那一天。',
  'help.guide.filter-costs.tip.2': '「匯出 CSV」永遠匯出每一筆支出，無論螢幕上篩選成什麼樣，一筆支出一列。',
  // settle-up
  'help.guide.settle-up.title': '算出誰該付給誰，並且結清',
  'help.guide.settle-up.goal': '把一堆共同開銷變成讓所有人扯平所需的最少幾筆轉帳，並在它們發生時記錄下來。',
  'help.guide.settle-up.step.1':
    '右欄的「結清」卡片列出能讓所有人扯平的轉帳：誰付給誰，以及多少。標題旁邊的數字是還有幾筆未完成。',
  'help.guide.settle-up.step.2': '轉帳旁邊的「結算」把它記為已完成。這條流向從卡片上消失，餘額重新繪製。',
  'help.guide.settle-up.step.3': '已記錄的轉帳是帳目裡的一列，歸在它發生的那一天下，標著「付款」，帶著兩位旅伴和金額。',
  'help.guide.settle-up.step.4': '在那一列旁邊，鉛筆可以更正一筆付款，「復原」把它收回，轉帳就回到「結清」卡片上。',
  'help.guide.settle-up.step.5':
    '卡片標題處的「新增付款」用來記錄一筆沒有按建議進行的轉帳。挑選「來自」和「給」、金額、它的貨幣以及它發生的日期。',
  'help.guide.settle-up.step.6':
    '螢幕頂部標題列裡的「結清」把所有未完成的轉帳一次全部記下，就像一群人在行程結束時一起把帳清乾淨。',
  'help.guide.settle-up.result':
    '每一筆記錄下來的轉帳都是帳目裡的一列，也是「結清」卡片上少掉的一條。當卡片寫著「大家都已結清」，這趟行程就付清了。',
  'help.guide.settle-up.tip.1': '卡片顯示的是最少的轉帳，而不是每一筆欠款：三個人繞成一圈互相欠著，會收成一兩筆付款。',
  'help.guide.settle-up.tip.2': '「結算」記錄的是一筆轉帳，它並不搬動錢。用你慣用的方式把錢送出去，然後再點它。',
  'help.guide.settle-up.tip.3':
    '一筆付款可以用任何貨幣進行，所以用歐元還一筆日圓的欠款很正常：對話框有自己的貨幣選擇器，也會把那個匯率凍結下來。',
  // final-budget
  'help.guide.final-budget.title': '看看這趟行程讓每位旅伴花了多少',
  'help.guide.final-budget.goal': '讀帳目裡按人來的那一面：今天的餘額，以及每個人的真實花費。',
  'help.guide.final-budget.step.1':
    '「餘額」顯示每位旅伴的位置：如果行程欠他，就是一條向右的綠色長條；如果是他欠行程，就是一條向左的紅色長條，金額寫在名字旁邊。',
  'help.guide.final-budget.step.2':
    '它下面的「最終花費」回答的是另一個問題：不是此刻誰欠著什麼，而是等一切都還清之後，這趟行程讓每位旅伴花了多少。',
  'help.guide.final-budget.step.3':
    '點選一個名字，就能展開這筆算式：「已支付的支出」，其下是「還款淨額」和「待還款項」。',
  'help.guide.final-budget.step.4':
    '每一列下面坐著構成它的那些項目：那位旅伴付過的支出、已經記錄的轉帳以及仍然未完成的轉帳。它們加起來正好等於上面那一列。',
  'help.guide.final-budget.result':
    '「餘額」是今天誰多出誰少出；「最終花費」是等一切都還清之後，這趟行程最終讓你們每個人花了多少。',
  'help.guide.final-budget.tip.1': '記錄一筆付款不會改變任何人的最終花費。它只是把一筆金額從待還款項挪到還款淨額。',
  'help.guide.final-budget.tip.2': '沒有付款人的支出不會進入這兩張卡片，正如它也不會進入結算建議。',
  // expense-from-booking
  'help.guide.expense-from-booking.title': '把一次預訂變成一筆支出',
  'help.guide.expense-from-booking.goal': '把一趟航班、一家飯店或一個地點真正花掉的錢，附到它所屬的那條記錄上。',
  'help.guide.expense-from-booking.step.1': '在「交通」或「預訂」分頁打開該預訂，點選它的鉛筆。',
  'help.guide.expense-from-booking.step.2':
    '捲動到表單底部的「費用」區塊。它提供會先儲存預訂的「建立支出」，以及用於已在「費用」裡的支出的「關聯已有支出」。',
  'help.guide.expense-from-booking.step.3':
    '點選「建立支出」。預訂被儲存，表單關閉，費用編輯器隨即打開，預訂的標題作為名稱，它的類型也已經對應到了一個分類。',
  'help.guide.expense-from-booking.step.4':
    '像填任何一筆支出那樣填好金額和它的幣別、誰付的錢和分攤，然後儲存。此時再打開該預訂，就能在「已關聯支出」下看到它，旁邊有鉛筆可以編輯，有「取消關聯，保留支出」可以解開關聯，有垃圾桶可以移除。',
  'help.guide.expense-from-booking.result':
    '預訂帶上了它的花費，而這筆支出就是「費用」分頁上一條普通的列，和別的支出一樣有付款人、分攤和貨幣。',
  'help.guide.expense-from-booking.tip.1':
    '刪除預訂會連同它關聯的支出一起刪除。預訂的「費用」區塊裡的「移除支出」則相反：支出沒了，預訂還在。「取消關聯，保留支出」則兩者都保留。',
  'help.guide.expense-from-booking.tip.2': '地點的表單裡有同樣的區塊，其中的「建立支出」會先儲存地點。',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': '交通',
  'help.ctx.trip-transports.summary':
    '把你在各個地點之間送來送去的一切：航班、火車、公車、汽車、計程車、自行車、郵輪、渡輪，以及 TREK 替你查到的大眾運輸路線。這個標籤頁是它們的清單；它們也在計劃上建立和檢視，並畫在地圖上。',
  'help.ctx.trip-transports.bullet.1':
    '標籤頁裡只有交通。住宿、餐廳、活動和門票在「預訂」裡，所以同一筆記錄永遠不會出現兩次。',
  'help.ctx.trip-transports.bullet.2':
    '工具列在「全部」下統計全部數量，並給每個用到的型別一個帶自己計數的篩選塊：「航班」「火車」「汽車」「大眾運輸」。右側的「交通」手動新增一筆。',
  'help.ctx.trip-transports.bullet.3':
    '卡片分成三組，每組都能從標題摺疊：搜尋規劃出的路線放在「自動大眾運輸」，然後是「待確認」，然後是「已確認」。',
  'help.ctx.trip-transports.bullet.4':
    '一張卡片帶著狀態、型別、它跨越的日子、時間、「預訂碼」、路線，以及「航空公司」和「航班號」，或者「車次」「站臺」「座位」。鉛筆開啟它，垃圾桶在一次詢問之後刪除它。',
  'help.ctx.trip-transports.bullet.5':
    '交通也在計劃上建立：每個日期標題都有一個「新增交通」的 + 和一個「大眾運輸」的路面電車按鈕，而兩個地點之間的行車時間連線會為這一段開啟同一個搜尋。',
  'help.ctx.trip-transports.bullet.6':
    '兩端都設好的交通會在地圖上畫出一條線。日程裡它那一列上的路線圖示開啟這條線，而日期上方工具列裡的「顯示所有預訂路線」翻轉整趟旅行。',
  // transports-list
  'help.guide.transports-list.title': '讀懂「交通」標籤頁',
  'help.guide.transports-list.goal': '在你改動任何東西之前，先知道清單在告訴你什麼。',
  'help.guide.transports-list.step.1':
    '「交通」是旅行的第二個標籤頁。裡面只有交通：飯店、餐廳、活動和門票在「預訂」裡。',
  'help.guide.transports-list.step.2':
    '工具列在「全部」下統計每一筆交通，並給每個用到的型別一個帶自己計數的篩選塊。點選一個篩選塊只保留那個型別，再點一次就放開。多個篩選塊可以同時開啟，「全部」把它們清空。',
  'help.guide.transports-list.step.3':
    '「自動大眾運輸」自成一組，是大眾運輸搜尋規劃出的路線。「待確認」和「已確認」裝著所有手動輸入的內容。標題旁邊的箭頭把一組摺疊起來。',
  'help.guide.transports-list.step.4':
    '一張卡片什麼都說了：帶「待確認」或「已確認」的狀態圓點、型別、它跨越的日子和日期、時間、「預訂碼」、路線，以及「航空公司」和「航班號」，或者「車次」「站臺」「座位」。',
  'help.guide.transports-list.step.5': '鉛筆開啟交通以便編輯，垃圾桶在一次點名要刪什麼的詢問之後把它刪掉。',
  'help.guide.transports-list.result': '清單收窄到你要找的東西，每張卡片一眼就說明這趟交通訂沒訂上。',
  'help.guide.transports-list.tip.1':
    '篩選塊和摺疊起來的分組按每趟旅行分別記住，所以標籤頁會照你離開時的樣子重新開啟。',
  'help.guide.transports-list.tip.2':
    '只有當伺服器能讀取預訂確認檔、並且連線了一個 AirTrail 執行個體時，「從檔案匯入」和 AirTrail 才會和「交通」一起出現在工具列裡。沒有它們，清單就靠手動輸入和大眾運輸搜尋來填。',
  // add-transport
  'help.guide.add-transport.title': '把一段交通加到某一天',
  'help.guide.add-transport.goal': '把從一個地點帶你到下一個地點的路程，放進它發生的那一天。',
  'help.guide.add-transport.step.1':
    '每個日期標題右側有四個小按鈕。點選那個提示寫著「新增交通」的 +。表單開啟時，「日期」已經設成了那一天。',
  'help.guide.add-transport.step.2':
    '「預訂型別」選你要搭什麼：「航班」「火車」「公車」「汽車」「計程車」「自行車」「郵輪」「渡輪」或「其他」。表單隨之變化。航班在每一段上要一個機場，火車要一串車站，汽車用的是「取車日期」和「還車日期」的說法以及「沿途停靠點」。',
  'help.guide.add-transport.step.3':
    '「標題」是唯一必須填的欄位；沒有它，「新增」一直是灰的。寫上你在月臺資訊牌上能認出來的東西。',
  'help.guide.add-transport.step.4':
    '「出發」和「到達」搜尋車站、港口或地址。至少輸入三個字母，再從清單裡選一個結果。只是打上去的名稱不帶座標，因此在地圖上什麼也畫不出來。',
  'help.guide.add-transport.step.5':
    '「日期」和「開始時間」說明它什麼時候走，「結束日期」和「結束時間」說明它什麼時候結束；第二天才到的路程在那一頭取第二天。「預訂碼」、帶「待確認」或「已確認」的「狀態」以及「備註」都是選填的。',
  'help.guide.add-transport.step.6': '點選「新增」。',
  'help.guide.add-transport.result':
    '這段交通成為那一天的一列，按它的時間排在各地點之間，同時在「交通」標籤頁裡成為「待確認」或「已確認」下的一張卡片。',
  'help.guide.add-transport.tip.1':
    '這一列落在它的開始時間決定的位置，也就是最後一個開始得更早的地點之後。它的拖曳把手能把它拖到當天任何別的位置，或者拖到另一天。',
  'help.guide.add-transport.tip.2':
    '「檔案」下的「附加檔案」接住車票，「費用」下的「建立支出」儲存這筆預訂，並為票價開啟「費用」編輯器。',
  'help.guide.add-transport.tip.3':
    '「出行成員」標出誰在這趟交通上。只要有一筆交通帶了出行成員，標籤頁的工具列就長出他們的頭像，並按他們篩選清單。',
  // plan-transit
  'help.guide.plan-transit.title': '規劃一條大眾運輸路線',
  'help.guide.plan-transit.goal': '讓 TREK 查出某一天兩點之間真實的火車和公車，把你選中的那一條放進計劃。',
  'help.guide.plan-transit.step.1': '在日期標題裡點選路面電車按鈕，「大眾運輸」。搜尋為那一天開啟。',
  'help.guide.plan-transit.step.2':
    '「起點」和「終點」接受一個站點或車站。欄位還空著時，會先給出當天自己的地點和這趟旅行的住處；輸入兩個字母則改為搜尋時刻表裡的車站。兩個欄位之間的「對調」把路線掉頭。',
  'help.guide.plan-transit.step.3':
    '「出發」或「抵達」加上一個時間說明你想什麼時候走，「最佳路線」「較少轉乘」或「較少步行」說明結果該怎麼排序。',
  'help.guide.plan-transit.step.4':
    '下面的篩選塊說明可以用哪些方式：「火車」「捷運」「路面電車」「公車」「渡輪」和「纜車」。關掉一個就把它排除在外，至少要留一個開著。然後點選「搜尋」。',
  'help.guide.plan-transit.step.5':
    '每個結果給出發車和抵達時間、要多久、轉乘幾次、步行多少，以及各條路線各自的顏色。點選其中一個可以一站一站展開，連月臺和路線之間的步行都在。',
  'help.guide.plan-transit.step.6': '點選「加入當日行程」。',
  'help.guide.plan-transit.result':
    '這條路線成為那一天的一列，帶著它的路線、轉乘和步行時間，同時在「交通」標籤頁裡成為「自動大眾運輸」下的一張卡片。',
  'help.guide.plan-transit.tip.1':
    '路線來自 Transitous，一個建立在公開時刻表資料之上的免費社群服務：不用金鑰，不用帳號。管理員可以把搜尋改指向 Google。',
  'help.guide.plan-transit.tip.2':
    '什麼也沒找到？資料來源只涵蓋一個區域和一段時期。換個時間試試，多開啟幾種方式，或者選一個車站而不是地點本身。提示訊息會寫出回應的那個服務的名字。',
  'help.guide.plan-transit.tip.3':
    '同一個搜尋也能為單獨一段開啟：點選兩個地點之間的行車時間連線，選「大眾運輸」。「起點」「終點」和出發時間都已經替你填好。',
  // change-transit-route
  'help.guide.change-transit-route.title': '開啟並變更一條規劃好的路線',
  'help.guide.change-transit-route.goal': '一站一站地讀這條路線，給它改名，或者重新查一次路線。',
  'help.guide.change-transit-route.step.1': '在「交通」標籤頁裡，規劃好的路線在「自動大眾運輸」下面。點選卡片。',
  'help.guide.change-transit-route.step.2':
    '「行程時間」「轉乘次數」和「步行」在最上面。它們下面的「行程」一站一站地走完這條路線，連月臺和路線之間的步行都在。',
  'help.guide.change-transit-route.step.3': '「變更路線」重新跑一次搜尋，這條路線的兩端和它的日期都已經填好。',
  'help.guide.change-transit-route.step.4':
    '選另一條路線並點選「加入當日行程」，它就頂替舊的那條。而「變更路線」旁邊的「編輯詳細資料」開啟的是普通的交通表單，「預訂碼」、「狀態」、出行成員和檔案都在那裡。',
  'help.guide.change-transit-route.result':
    '這趟行程帶上了新的行程內容，它在「交通」標籤頁裡的卡片顯示新的路線和時間。',
  'help.guide.change-transit-route.tip.1':
    '行程的標題只是文字：旁邊的鉛筆給它改名，不會動到路線。下面的「備註」接受 markdown，並有「編輯」和「預覽」兩個標籤。',
  'help.guide.change-transit-route.tip.2': '行程底部的「刪除」把這條路線從這趟旅行裡拿走；那一天仍然保留它的地點。',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': '變更某一段的交通方式',
  'help.guide.leg-travel-mode.goal': '在其餘路段都開車的一天裡，把其中一段改成步行，或者把那一段交給大眾運輸搜尋。',
  'help.guide.leg-travel-mode.step.1':
    '地點之間的連線只有在當天的路線開啟之後才出現。點選這一天把它展開，然後點它地點下方的「路線」。',
  'help.guide.leg-travel-mode.step.2':
    '每條連線說明那一段的行車時間和距離，並帶上算路時所用方式的圖示：開車是汽車，步行是腳。',
  'help.guide.leg-travel-mode.step.3': '點選連線。選單提供「開車」和「步行」、「大眾運輸」，以及「使用當日預設」。',
  'help.guide.leg-travel-mode.step.4': '選「步行」。只有這一段會變；當天其餘部分保留自己的方式。',
  'help.guide.leg-travel-mode.result': '這一段顯示腳的圖示和它的步行時間，當天其他各段保留當天的方式。',
  'help.guide.leg-travel-mode.tip.1':
    '方式屬於路段，不屬於當天：整天的「開車」和「步行」按鈕從不覆蓋你手動設過的路段。「使用當日預設」把這一段還給它們。',
  'help.guide.leg-travel-mode.tip.2': '同一個選單裡的「大眾運輸」正好為這一段開啟路線搜尋，兩端和出發時間都已經填好。',
  'help.guide.leg-travel-mode.tip.3':
    '時間來自一個跑在真實道路和步道上的公開路徑服務。它算不出來的路段保留直線，並且不顯示時間。',
  // edit-transport
  'help.guide.edit-transport.title': '變更或刪除一段交通',
  'help.guide.edit-transport.goal': '改一個時間、一個月臺或一個預訂碼，或者把這趟交通從旅行裡去掉。',
  'help.guide.edit-transport.step.1': '在日程裡，一段交通是地點之間一條有顏色的列。點選它。',
  'help.guide.edit-transport.step.2':
    '表單就是建立它的那一個，標題列寫著「編輯交通」。什麼都能改：型別、路線、日期和時間、「預訂碼」、「狀態」。',
  'help.guide.edit-transport.step.3':
    '航班的路線是一串機場，火車的路線是一串車站。「新增中轉站」在中間再放一個，每一段都保留自己的時間和自己的航班號或車次。',
  'help.guide.edit-transport.step.4':
    '點選「更新」。要把這段交通徹底移除，用它在「交通」標籤頁那張卡片上的垃圾桶，並確認。',
  'help.guide.edit-transport.result':
    '改動在這段交通出現的每個地方都會顯示：「交通」標籤頁、它所在的那一天，以及它在地圖上的線。',
  'help.guide.edit-transport.tip.1':
    '同一個表單從兩邊都能開啟：「交通」標籤頁卡片上的鉛筆，和日程裡這段交通自己的列。規劃好的大眾運輸路線是例外：它的列開啟的是行程檢視，那裡的「編輯詳細資料」才通向這個表單。',
  'help.guide.edit-transport.tip.2': '把一段交通挪到另一天根本不需要表單：把它的列從一張日期卡片拖到下一張。',
  // transport-on-map
  'help.guide.transport-on-map.title': '把一段交通畫到地圖上',
  'help.guide.transport-on-map.goal': '看看一次航班、一段開車或一條路線實際走的是哪裡。',
  'help.guide.transport-on-map.step.1':
    '兩端都設好的交通，會在日程裡它那一列上帶一個小小的路線圖示。點選它，它的標籤就變成「隱藏預訂路線」。',
  'help.guide.transport-on-map.step.2': '路線畫在地圖上，兩端各有一個帶著這段交通圖示的膠囊形標記。',
  'help.guide.transport-on-map.step.3':
    '點選端點標記，不用離開地圖就能讀到這筆預訂：時間、「航空公司」和「航班號」、「預訂碼」以及地址。「關閉」把這張卡片收起來。',
  'help.guide.transport-on-map.step.4':
    '日期上方工具列裡的路線圖示一次處理整趟旅行：「顯示所有預訂路線」，以及用來再次清空的「隱藏所有預訂路線」。',
  'help.guide.transport-on-map.step.5':
    '規劃好的大眾運輸路線沒有自己的圖示。它是靠當天的「路線」開關畫出來的，所以只要那一天的路線還開著，「隱藏所有預訂路線」就清不掉它。',
  'help.guide.transport-on-map.result': '各條路線帶著兩端的標記留在地圖上，直到你再次把它們關掉。',
  'help.guide.transport-on-map.tip.1':
    '航班、郵輪和渡輪畫成一條曲線，汽車、公車、計程車和自行車沿著真實道路走，火車或規劃好的路線則穿過它停靠的各個車站。',
  'help.guide.transport-on-map.tip.2':
    '「已確認」的預訂是實線，「待確認」的是虛線。「預訂路線標籤」這個設定會把機場代碼或車站名稱印進端點標記裡。',
  'help.guide.transport-on-map.tip.3':
    '「顯示所有預訂路線」是重新來過，而不是疊一層：它會丟掉單個圖示設過的狀態，所以按兩次之後，留給你的不是全開就是全關。',
  // import-transport-file
  'help.guide.import-transport-file.title': '從電子機票裡讀出一趟航班',
  'help.guide.import-transport-file.goal':
    '讓 TREK 從承運方發來的票裡取出一趟航班、一趟火車或一班渡輪，並在儲存前檢查一遍。',
  'help.guide.import-transport-file.step.1':
    '點選「交通」標籤頁工具列裡的「從檔案匯入」，就在「交通」按鈕旁邊。「匯入訂位確認」開啟，和「預訂」標籤頁用的是同一個對話框。',
  'help.guide.import-transport-file.step.2':
    '把票拖放到那個框上，或點選它來挑選：EML、PDF、PKPass、HTML 和 TXT，最多 5 個檔案，每個 10 MB。你挑的那些檔案的名字會寫在框上。',
  'help.guide.import-transport-file.step.3': '點選「匯入」。對話框立刻關上；讀取在背景進行。',
  'help.guide.import-transport-file.step.4':
    '右下角的一張卡片在檔案名稱下報告這次執行。讀取完成後，「正在解析檔案…」變成一個勾號，卡片給出「匯入」。點選它。',
  'help.guide.import-transport-file.step.5':
    '一趟航班在「新增交通」裡開啟，內容已填好：「預訂型別」是「航班」，航空公司和航班號在「標題」裡，兩個機場在「航線」下，帶「出發日期」和「到達日期」、它們的時間和時區，「航空公司」和「航班號」，「預訂碼」，以及「檔案」下的票。檢查一遍，點選「新增」。',
  'help.guide.import-transport-file.result':
    '這趟航班是「交通」標籤頁裡「待確認」中的一張卡片，也是它出發那天的一列，票在「檔案」下；兩個機場都已知時，它會在地圖上畫出自己的弧線。',
  'help.guide.import-transport-file.tip.1':
    '兩個標籤頁共用一個匯入：一份既有航班又有飯店的檔案，會先後把航班在「新增交通」裡、把飯店在「新建預訂」裡開啟，不論你從哪個標籤頁開始。',
  'help.guide.import-transport-file.tip.2':
    '機場按代碼定位。讀取時定位不到的車站或港口會在卡片上以琥珀色標出名字；在點選「新增」之前先在「航線」下手動選好它，否則這筆交通在地圖上什麼都畫不出來。',
  // airtrail-import
  'help.guide.airtrail-import.title': '從 AirTrail 匯入航班',
  'help.guide.airtrail-import.goal': '把你已經記在 AirTrail 裡的航班一次帶進旅行，並讓它們從此跟隨 AirTrail。',
  'help.guide.airtrail-import.step.1':
    '開著 AirTrail 擴充套件，並在「設定」的「整合」下連接了你的實例之後，「交通」標籤頁的工具列裡「交通」旁邊會有一個「AirTrail」按鈕。點選它。',
  'help.guide.airtrail-import.step.2':
    '「從 AirTrail 匯入」把你帳戶裡的航班分兩組列出。「行程期間」是日期落在旅行內的那些，已經打勾；「其他航班」是其餘的，未打勾。已經在旅行裡的航班會變灰並標著「已匯入」。',
  'help.guide.airtrail-import.step.3':
    '每一列是一個核取方塊，帶航空公司和航班號、兩個機場和日期。點選一列把航班收進來或排除出去；「其他航班」下的只有在你打勾時才會進來。',
  'help.guide.airtrail-import.step.4':
    '相連的航班，即每一趟都在一天之內從上一趟降落的機場起飛，會被框在一起。下方的核取方塊「匯入為一個航班（在該機場轉機）」已經勾上：留著它就得到一筆帶轉機的預訂，取消它則把各航段作為單獨的航班匯入。',
  'help.guide.airtrail-import.step.5': '點選「匯入」。按鈕會統計打勾的航班數，之後的提示會說進來了多少趟。',
  'help.guide.airtrail-import.step.6':
    '這些航班是「已確認」下的卡片，每張狀態旁邊都帶一個藍色的 AirTrail 徽章，也是它們飛行那些天上的列。合併的聯程是一張卡片，航線穿過轉機地。',
  'help.guide.airtrail-import.result':
    '來自 AirTrail 的航班是「交通」標籤頁裡的卡片和各自日期上的列，每一筆都帶著說明來源的 AirTrail 徽章。',
  'help.guide.airtrail-import.tip.1':
    '同一航班號、同一日期已經在旅行裡的航班會被跳過，提示會說跳過了多少趟。天數上方工具列裡的「撤銷」把整次匯入收回。',
  'help.guide.airtrail-import.tip.2':
    'AirTrail 仍是事實來源。TREK 在你開啟旅行時以及背景每隔幾分鐘讀取它的變更；在那邊刪掉的航班保留它的卡片，徽章變為「未同步」。在 TREK 裡做的修改只有在「整合」下開著「將變更寫回 AirTrail」時才會傳回去。',
  'help.guide.airtrail-import.tip.3':
    '合併的聯程沒有單獨一趟 AirTrail 航班可跟隨，所以它是一次性匯入：它保留藍色徽章，游標停在徽章上會這樣說明。你手動加了轉機的已同步航班也是如此。',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': '公路旅行',
  'help.ctx.trip-roadtrip.summary':
    '把計劃當作一次駕駛來讀：同樣的日期、同樣的地點，串成一個個停靠點，中間是行駛的路段，落在左欄的行程條裡和地圖上。它會說明有多遠、要多久、油在哪裡耗盡，以及路上有什麼。',
  'help.ctx.trip-roadtrip.bullet.1':
    '左欄頂部的「依日」和「公路旅行」在每日計劃和駕駛之間切換。什麼都不會被複製，什麼都不會被改動：「依日」原封不動地把計劃還給你。',
  'help.ctx.trip-roadtrip.bullet.2':
    '行程條的頂部彙總整趟旅行：「距離」「駕駛時間」和「停靠點」。它下面每天一張卡片，帶著當天自己的公里數、這一天是為幾個停靠點而設、超出了什麼，以及一個「軌跡」標記。',
  'help.ctx.trip-roadtrip.bullet.3':
    '帶編號的停靠點是這一天要去的地點。途中停靠，比如加油、充電、休息站，戴的是它那一類的圖示而不是編號，也不計入數量。點選編號可以改變它是哪一種，點選「停留」標記可以說明它要花多久。',
  'help.ctx.trip-roadtrip.bullet.4':
    '兩個停靠點之間，駕駛條把這一段顯示為距離和時間。點選它開啟「這一段的走法」，或者點選地圖上畫出的路線，用一個途經點把這一段拗過去。',
  'help.ctx.trip-roadtrip.bullet.5':
    '右欄變成「沿線」：選一天、選要找什麼、選走廊有多寬，然後點「搜尋」。「新增」會把結果放到駕駛上真正經過它的那一點。',
  'help.ctx.trip-roadtrip.bullet.6':
    '它下面的「駕駛設定」裝著各項上限、車和它的續航、每日出行時間、要避開什麼以及線條怎麼畫。它們屬於這趟旅行，所以每個人都用同一輛車來計劃。',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': '把旅行當成一次駕駛來讀',
  'help.guide.roadtrip-mode.goal': '把計劃切換到公路旅行模式，讀懂行程條告訴你的內容。',
  'help.guide.roadtrip-mode.step.1':
    '在左欄頂部的「依日」和「公路旅行」切換裡點選「公路旅行」。每日計劃被駕駛取代，地圖會畫出每一個已經算出路線的日子。',
  'help.guide.roadtrip-mode.step.2': '行程條的頂部彙總整趟旅行：「距離」「駕駛時間」和「停靠點」。',
  'help.guide.roadtrip-mode.step.3':
    '它下面每天一張卡片。卡片標題帶著這一天的編號和日期、以距離和時間表示的駕駛，以及這一天是為幾個停靠點而設。',
  'help.guide.roadtrip-mode.step.4':
    '卡片裡面，一天是一條鏈：每個地點一個帶編號的停靠點，每兩個之間一個駕駛條，右端是抵達時間。',
  'help.guide.roadtrip-mode.step.5':
    '點選某一天的標題把它摺疊起來。摺疊的一天也會從地圖上消失；再次點選標題就能讓它回來。',
  'help.guide.roadtrip-mode.result': '左欄就是駕駛，地圖顯示它的每一天。「依日」直接切回計劃，計劃沒有變化。',
  'help.guide.roadtrip-mode.tip.1': '只要瀏覽器分頁還開著，這個選擇就按旅行記住，所以重新載入還會回到駕駛。',
  'help.guide.roadtrip-mode.tip.2':
    '只有管理員在「管理後臺」的「擴充套件」裡開啟了「公路旅行」擴充套件之後，這個切換才存在。',
  'help.guide.roadtrip-mode.tip.3': '手機上沒有切換：擴充套件會在「計劃」旁邊加一個自己的「公路旅行」分頁。',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': '途中的停靠，以及停留多久',
  'help.guide.roadtrip-stops.goal': '把駕駛途中的一個地點變成途中停靠，並說明每個停靠要花多久。',
  'help.guide.roadtrip-stops.step.1':
    '點選行程條裡某個停靠點前面的編號。它的標籤是「設為途中停靠」，點開後是「停靠類型」。',
  'help.guide.roadtrip-stops.step.2':
    '選一個類型：「住宿」「加油」「充電」「休息站」「露營地」「餐飲」或「景點」。編號變成那一類的圖示，它下面的停靠點重新編號。',
  'help.guide.roadtrip-stops.step.3': '途中停靠不是目的地，所以這一天的標題少算一個停靠點。',
  'help.guide.roadtrip-stops.step.4': '再次點選圖示，進入「變更停靠類型」，選擇「恢復為目的地」，編號就回來了。',
  'help.guide.roadtrip-stops.step.5': '每個停靠點都帶著「停留」標記。點選它開啟「在此停留時間」。',
  'help.guide.roadtrip-stops.step.6':
    '用滑桿、用減號和加號按鈕，或者用其中一個預設值來設定時長，看看「抵達」和「出發」怎麼變，然後點「儲存」。',
  'help.guide.roadtrip-stops.result':
    '你定了時間的那個停靠點在它的「停留」標記上帶著鐘點，它之後的每一個抵達時間都跟著移動了；那個被你送去某一類又送回來的停靠點，重新成了帶編號的目的地。',
  'help.guide.roadtrip-stops.tip.1': '停留屬於地點，而不屬於某一次到訪：安排在兩天裡的同一個地點，兩天都停留同樣久。',
  'help.guide.roadtrip-stops.tip.2':
    '途中停靠在「依日」下面也會顯示。把「駕駛設定」中「服務停靠點」裡的「也顯示於每日行程」關掉，它們就只留在「公路旅行」裡。',
  'help.guide.roadtrip-stops.tip.3': '同一個對話方塊裡的「不停留」會再次去掉這段時間。',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': '沿線找加油站、餐飲和住處',
  'help.guide.roadtrip-corridor.goal': '在你真正開過的路上搜尋，把找到的放在正確的路段上。',
  'help.guide.roadtrip-corridor.step.1': '在「沿線」頂部選一天。只提供已經算出路線的日子。',
  'help.guide.roadtrip-corridor.step.2':
    '在「尋找」下面勾選你需要的。「加油」「充電」「休息站」「露營地」「住宿」「餐飲」和「景點」可以組合。',
  'help.guide.roadtrip-corridor.step.3': '在「範圍內」裡選擇在道路兩側找多遠，2 km、5 km 或 10 km，然後點「搜尋」。',
  'help.guide.roadtrip-corridor.step.4':
    '結果按類型分組返回，順序就是你經過它們的順序，每一條都帶著它在這一天的哪個位置，以及離路線有多遠。',
  'help.guide.roadtrip-corridor.step.5':
    '結果上的「新增」會開啟「新增為停靠點」。它會說明這個停靠點落在哪一天、第幾個位置，詢問類型和停靠時間，「新增」把它放到駕駛上。',
  'help.guide.roadtrip-corridor.result':
    '結果按你經過的順序列出並畫在地圖上，你新增的那一個就坐落在駕駛上真正經過它的那一點。',
  'help.guide.roadtrip-corridor.tip.1':
    '在你按下「搜尋」之前什麼都不會被搜尋：跑一次就是對一個共享服務發出的許多請求。',
  'help.guide.roadtrip-corridor.tip.2':
    '「依名稱篩選」不再發起請求就把返回的結果縮小，「清除結果」清空清單和它的標記點。點選一條結果可以讓它在地圖上顯示出來。',
  'help.guide.roadtrip-corridor.tip.3':
    '結果也可以從地圖拖到畫出的路線上，同一條路被開過兩次時，你就是這樣自己挑路段的。「搜尋」旁邊的「手動新增」則按名稱查詢一個地點。',
  // roadtrip-via
  'help.guide.roadtrip-via.title': '用途經點把一段路拗彎',
  'help.guide.roadtrip-via.goal': '讓一段路走你真正想要的那條道，而不用給它加一個停靠點。',
  'help.guide.roadtrip-via.step.1':
    '先讓你想要的那一段進入視野：在行程條裡點選一個停靠點，然後關掉在地圖上開啟的卡片。',
  'help.guide.roadtrip-via.step.2': '點選畫出的路線。一個途經點落在你點選的那一段上，這一段會經由它重新算一次路線。',
  'help.guide.roadtrip-via.step.3':
    '行程條隨之改變：這一天的標題帶上新的距離和駕駛時間，途經點之後的每一個抵達時間都跟著移動。',
  'help.guide.roadtrip-via.step.4':
    '把滑鼠停在把手上，它會說明自己能做什麼：「拖曳可改變路線，右鍵刪除」。把它拖到別處，這一段就經由新位置重新畫出。',
  'help.guide.roadtrip-via.step.5': '按右鍵點選把手可以把它去掉。這一段又走最直接的路。',
  'help.guide.roadtrip-via.result': '這一段走你選的路，這一天的距離、駕駛時間和抵達時間都會為它重新算過。',
  'help.guide.roadtrip-via.tip.1': '途經點不是停靠點：它沒有編號、沒有停留、沒有抵達時間，也不計入這一天的停靠點。',
  'help.guide.roadtrip-via.tip.2': '把手從縮放級別 9 開始才畫出來，所以一張適配整趟旅行的地圖只會顯示線條而沒有把手。',
  'help.guide.roadtrip-via.tip.3': '距離任何已畫路段超過兩公里的點選會被忽略，點在航班、火車或渡輪上的點選也一樣。',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': '換一條路來開這一段',
  'help.guide.roadtrip-alternatives.goal': '看看路線引擎對某一段還給出什麼，然後採用它。',
  'help.guide.roadtrip-alternatives.step.1':
    '點選行程條裡的一條駕駛條，就是兩個停靠點之間那一列、把這一段顯示為距離和時間的那一列。它的標籤是「其他路線」。',
  'help.guide.roadtrip-alternatives.step.2':
    '「這一段的走法」在地圖上方開啟，每條路一項，每一項都以自己的顏色畫在地圖上。',
  'help.guide.roadtrip-alternatives.step.3':
    '把滑鼠停在某一項上會點亮那條路。「目前」是正在走的那條路，「最快」是最快的那條；其他項則說明自己慢多少，或者避開了哪一類道路。',
  'help.guide.roadtrip-alternatives.step.4': '點選一項就走那條路，點「關閉」就保持你正在走的路。',
  'help.guide.roadtrip-alternatives.result': '這一段走你選的路，行程條上的距離和它之後的抵達時間也隨之改變。',
  'help.guide.roadtrip-alternatives.tip.1':
    '選另一條路會在這一段上放一個途經點，並替換掉它原有的途經點；選擇路線引擎自己的那條路又會把它們去掉。',
  'help.guide.roadtrip-alternatives.tip.2':
    '「不走高速」「免收費」和「不搭渡輪」來自第二個引擎，它有自己的速度模型，所以它們的用時不能和其他項相比。',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': '設定車輛和駕駛上限',
  'help.guide.roadtrip-limits.goal': '告訴 TREK 你開什麼車，以及你願意一口氣開多久。',
  'help.guide.roadtrip-limits.step.1': '「駕駛設定」位於右欄搜尋的下方。它的標記說明已經設了什麼；點選它即可開啟。',
  'help.guide.roadtrip-limits.step.2':
    '在「駕駛」下面，「單次最長駕駛」和「每天駕駛」以分鐘計。空著的欄位意味著「關閉」，也就不會標出任何東西。',
  'help.guide.roadtrip-limits.step.3':
    '在「車輛」下面，說明你開什麼車。「燃油」只在加油停靠點補給，「電動」只在充電停靠點補給，「兩者」在兩種停靠點都補給。',
  'help.guide.roadtrip-limits.step.4':
    '「單箱續航」或「每次充電續航」由你自己填。它下面的「依車輛資料推算」會取「油箱容量」和「能耗」，或者「電池容量」和「能耗」，替你算出來。',
  'help.guide.roadtrip-limits.step.5':
    '「盡量避開」是一種偏好，不是禁令：沒有繞行辦法的一天照樣會走那條路，並在標題裡說明這一點。',
  'help.guide.roadtrip-limits.step.6': '關閉對話方塊。卡片會說明已經設了什麼，行程條會標出每一個超出上限的路段和日子。',
  'help.guide.roadtrip-limits.result':
    '卡片上的標記說明已經設了什麼，每一個超出上限的路段和日子都在行程條裡帶著一個標記。',
  'help.guide.roadtrip-limits.tip.1': '這些設定屬於這趟旅行，所以同行的每個人都用同一輛車、同樣的上限來計劃。',
  'help.guide.roadtrip-limits.tip.2':
    '「加到」說明一個停靠點加到多滿，因為路上沒有人會充到 100 %。加油或充電停靠點可以為自己單獨覆蓋它。',
  'help.guide.roadtrip-limits.tip.3':
    '「路線線條」決定駕駛怎麼畫：「連接各天」會把兩天之間的那一夜也算出路線，「每天一種顏色」則給每一天自己的顏色。',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': '給駕駛的一天定個開始和結束',
  'help.guide.roadtrip-day-window.goal': '在你選定的時刻停止駕駛，並說明這一天應該在哪裡結束。',
  'help.guide.roadtrip-day-window.step.1': '開啟右欄的「駕駛設定」，找到「每日出行時間」。',
  'help.guide.roadtrip-day-window.step.2':
    '設一個「一天開始時間」。光有它什麼都不會發生：正如它們下面的說明所講，兩個時間都要有。',
  'help.guide.roadtrip-day-window.step.3':
    '設一個「一天結束時間」。駕駛現在會在那個時刻停下，把剩下的帶到第二天早上，在行程條裡表現為一列「當天行程結束」和一列「繼續行程」。',
  'help.guide.roadtrip-day-window.step.4':
    '在「一天的結束地點」裡，選「路線途中」表示在結束時間停在路上，或者選「最後一個地點」表示在下一段駕駛會越過它之前就停下。',
  'help.guide.roadtrip-day-window.step.5': '關閉對話方塊。「駕駛設定」卡片把這兩個時間當作標記帶著。',
  'help.guide.roadtrip-day-window.result':
    '駕駛被切成你設定長度的出行日，裝不下的部分會接在最後一天之後的推算日上繼續。你的日期和它們的地點不會改變。',
  'help.guide.roadtrip-day-window.tip.1': '清空任何一個時間又會把整件事關掉。你自己釘在某個停靠點上的時間始終優先。',
  'help.guide.roadtrip-day-window.tip.2':
    '設了每日出行時間之後，各天總是相連的：從某一天最後一個停靠點到第二天第一個停靠點的駕駛也會算出路線並計入。',
  'help.guide.roadtrip-day-window.tip.3':
    '每一個當天終點在地圖上也是一個標記，一個帶著日期編號的月亮。沿路線拖動它，或者把它拖到某個地點上，就能讓這一天在別處結束；按右鍵點選它可以恢復自動的終點，而這個對話方塊裡的「恢復自動每日終點」會把全部撤銷。',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': '在油耗盡之前加滿',
  'help.guide.roadtrip-refuel.goal': '在車還能到達的那一段上找個加油的地方，並把它放到駕駛上。',
  'help.guide.roadtrip-refuel.step.1':
    '設了續航之後，行程條會在油耗盡的那一段上畫一條帶子：「此處將耗盡油量」，下面是它在這一段裡走了多遠。',
  'help.guide.roadtrip-refuel.step.2':
    '帶子上的那盞燈就是按鈕。「尋找加油站」會沿著你已經開過的路去找，找的時候顯示「正在沿路線尋找…」。',
  'help.guide.roadtrip-refuel.step.3': '最多返回三個加油站，每一個都帶著它離路線有多遠，以及還會剩下多少續航。',
  'help.guide.roadtrip-refuel.step.4':
    '某個候選上的加號會把它新增為加油停靠點。「新增為停靠點」開啟時類型和時間已經填好，「新增」把它放到這一段上真正經過它的那一點。',
  'help.guide.roadtrip-refuel.result': '這個停靠點帶著自己的圖示落在正確的路段上，續航從它開始重新計算，帶子也不見了。',
  'help.guide.roadtrip-refuel.tip.1':
    '續航從上一個加油或充電停靠點開始計算，跨越日期。你開什麼車決定哪些停靠點算數：「燃油」只算加油，「電動」只算充電。',
  'help.guide.roadtrip-refuel.tip.2':
    '搜尋只看耗盡點之前的路，留出一份餘量，並且把繞行距離算兩遍，所以它給出的每一個都真的到得了。',
  'help.guide.roadtrip-refuel.tip.3':
    '空的結果不是死路：那盞燈會變成「重試」，因為地點搜尋是一個共享服務，確實會逾時。',
  // roadtrip-track
  'help.guide.roadtrip-track.title': '讓某一天沿著匯入的軌跡走',
  'help.guide.roadtrip-track.goal': '把某一天的駕駛放到你以 GPX 或 KML 軌跡匯入的風景路線上。',
  'help.guide.roadtrip-track.step.1': '點選某一天標題裡的「軌跡」標記。對話方塊就在那一天上開啟。',
  'help.guide.roadtrip-track.step.2':
    '選一條軌跡。每一條都會說明它有多長，以及它是沿著這一天走的，還是離這一天有多遠，最近的排在最前面。',
  'help.guide.roadtrip-track.step.3':
    '點選「沿此軌跡行駛」。TREK 會在駕駛偏離軌跡最遠的地方放下途經點，然後一輪又一輪地重新算路線。',
  'help.guide.roadtrip-track.step.4':
    '它會說明放了多少個途經點，以及駕駛現在貼得有多近。它下面的按鈕會再把那些途經點去掉，把這一天交回給路線引擎；關閉對話方塊則保留軌跡。',
  'help.guide.roadtrip-track.result':
    '這一天的駕駛沿著軌跡走，而不是路線引擎挑的那條路，它的「軌跡」標記亮著，把指標停上去就會說出那條軌跡的名字。',
  'help.guide.roadtrip-track.tip.1':
    '在「依日」下面用「匯入檔案」匯入這個檔案，並勾上「路線」或「軌跡（含路徑幾何）」。在旅行裡有一條之前，沒有哪一天會帶著這個標記。',
  'help.guide.roadtrip-track.tip.2':
    '沿著軌跡走會替換這一天各路段原有的途經點，所以要手動調整某一段，請在軌跡之後做，而不是之前。',
};

export default help;
