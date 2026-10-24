import type { TranslationStrings } from '../types';

// English fallback until 'zh-TW' is translated.
const help: TranslationStrings = {
  'help.title': '說明與文件',
  'help.search': '搜尋說明文件…',
  'help.contents': '目錄',
  'help.noResults': '沒有符合的頁面。',
  'help.errorTitle': '無法載入此頁面',
  'help.errorBody': '說明內容取自 TREK Wiki。請檢查網路連線後再試一次。',

  // center
  'help.center.button': '此畫面的說明',
  'help.center.title': '說明',
  'help.center.onThisScreen': '此頁面相關',
  'help.center.screens': '頁面',
  'help.center.thisScreen': '目前頁面',
  'help.center.subScreens': '{count} 個子畫面',
  'help.center.subScreensLabel': '子畫面',
  'help.center.guidesCount': '{count} 篇指南',
  'help.center.goToScreen': '前往{screen}',
  'help.center.overview': '總覽',
  'help.center.howTo': '如何操作',
  'help.center.searchPlaceholder': '搜尋指南與文件…',
  'help.center.searchEmpty': '找不到與「{query}」相關的內容。',
  'help.center.searchGuides': '指南',
  'help.center.searchDocs': '文件',
  'help.center.searchError': '目前無法搜尋。',
  'help.center.back': '返回',
  'help.center.close': '關閉說明',
  'help.center.steps': '{count} 個步驟',
  'help.center.step': '步驟 {n}',
  'help.center.stepsLabel': '步驟',
  'help.center.stepOf': '步驟 {n}，共 {total} 步',
  'help.center.screenshot': '截圖',
  'help.center.result': '完成後的結果',
  'help.center.tips': '小提醒',
  'help.center.related': '相關內容',
  'help.center.openDocs': '在「說明與文件」中開啟',
  'help.center.docsSection': '文件中',
  'help.center.noContext': '這個畫面還沒有指南。',
  'help.center.noContextHint': '搜尋說明文件，或告訴我們你想找什麼。',
  'help.center.feedback': '找不到想要的內容？',
  'help.center.feedbackLink': '到 GitHub 告訴我們',
  'help.center.discord': '到 Discord 提問',
  'help.center.quick': '快速',
  'help.center.guide': '指南',
  'help.center.tour': '操作導覽',
  'help.center.imageAlt': '「{title}」第 {n} 步',

  // ctx
  'help.ctx.dashboard.title': '儀表板',
  'help.ctx.dashboard.summary':
    '儀表板會顯示你所有的旅行。最上方外型像登機證的卡片，是正在進行或即將出發的旅行。下方一列會統計你目前為止的旅行成果，卡片則列出你正在規劃、已封存或已完成的每一趟旅行。',
  'help.ctx.dashboard.bullet.1':
    '登機證：進行中或下一趟旅行，附日期、旅伴、地點和倒數計時。點擊即可開啟旅行。右上角的四個按鈕可編輯、複製、封存或刪除旅行。',
  'help.ctx.dashboard.bullet.2': '旅行統計：去過的國家、旅行次數、在外天數和飛行距離，涵蓋你所有的旅行。',
  'help.ctx.dashboard.bullet.3':
    '旅行卡片，可依「計劃中」、「已歸檔」和「已完成」篩選，以網格或列表顯示。上方的搜尋框會一次搜尋所有旅行，可依標題、日期或其中的地點查找。編輯、複製、歸檔和刪除按鈕位於每張卡片照片的右上角。',
  'help.ctx.dashboard.bullet.4':
    '右側的小工具：匯率換算、「收藏」（啟用收藏擴充套件時）、世界時鐘、即將到來的預訂，以及外掛提供的小工具。內建的小工具可以在「設定」的「外觀」中關閉。',
  'help.ctx.dashboard.bullet.5': '「新建旅行」卡片與右下角的按鈕都可以建立新旅行。',

  // create-trip
  'help.guide.create-trip.title': '建立旅行',
  'help.guide.create-trip.goal': '用名稱、日期和封面照片開始一趟新旅行。',
  'help.guide.create-trip.step.1': '點選「新建旅行」。旅行清單最後的那張卡片和右下角的按鈕，功能都一樣。',
  'help.guide.create-trip.step.2': '為旅行取個名字。這是唯一必填的欄位，其他內容之後再補就好。',
  'help.guide.create-trip.step.3':
    '選擇開始和結束日期。TREK 會為每個日期建立一天，讓你的行程表可以直接開始填寫。還沒有日期嗎？兩個都留空，改為輸入「天數」。',
  'help.guide.create-trip.step.4':
    '選填：加入封面照片。你可以上傳自己的照片、拖曳或貼上一張，也可以搜尋 Unsplash 上目的地的照片。',
  'help.guide.create-trip.step.5': '點選「建立新旅行」。',
  'help.guide.create-trip.result': '旅行會出現在儀表板上。如果它是你的下一趟旅行，就會顯示在最上方的登機證中。',
  'help.guide.create-trip.tip.1': '日期之後還能修改。如果已經有預訂，TREK 會問你要不要連同日程一起移動。',
  'help.guide.create-trip.tip.2': '你在這裡選擇的旅行貨幣，就是所有費用換算的目標貨幣。請選擇目的地的貨幣。',

  // edit-trip
  'help.guide.edit-trip.title': '編輯旅行',
  'help.guide.edit-trip.goal': '重新命名旅行、更改日期或調整設定。',
  'help.guide.edit-trip.step.1': '點擊旅行卡片（或登機證）右上角的鉛筆。',
  'help.guide.edit-trip.step.2': '修改你需要的內容：名稱、描述、日期、封面、貨幣、提醒或旅伴。',
  'help.guide.edit-trip.step.3': '點選「更新」。',
  'help.guide.edit-trip.result': '卡片會立即更新，旅行的所有成員都會看到。',
  'help.guide.edit-trip.tip.1':
    '移動有預訂的旅行的開始日期時，系統會詢問預訂是否也要一起移動。縮短旅行時，會列出即將被移除的天數及其上的行程，點擊「移除天數並儲存」後才會真正儲存。',

  // cover-image
  'help.guide.cover-image.title': '設定封面照片',
  'help.guide.cover-image.goal': '為旅行設定一張圖片，顯示在卡片與登機證上。',
  'help.guide.cover-image.step.1': '用卡片上的鉛筆開啟旅行的編輯表單。',
  'help.guide.cover-image.step.2': '在「封面圖片」下，拖放或貼上照片、點擊上傳，或輸入目的地並點擊「搜尋 Unsplash」。',
  'help.guide.cover-image.step.3': '選擇一張照片，然後點選「更新」。',
  'help.guide.cover-image.result': '照片會隨旅行一起儲存，並顯示在所有列出該旅行的地方。',
  'help.guide.cover-image.tip.1': '從 Unsplash 搜尋選用的照片會自動標註出處；你自己上傳的照片只會存放在你的伺服器上。',

  // duplicate-trip
  'help.guide.duplicate-trip.title': '複製旅行',
  'help.guide.duplicate-trip.goal': '把一趟旅行當作範本，建立新的旅行。',
  'help.guide.duplicate-trip.step.1': '點擊卡片右上角的複製圖示。',
  'help.guide.duplicate-trip.step.2': '看一下哪些內容會複製、哪些不會，然後點擊「複製旅行」。',
  'help.guide.duplicate-trip.result':
    '你的儀表板上會出現一份副本，名稱是原名稱加上（副本）。你可以重新命名，也可以更改日期。',
  'help.guide.duplicate-trip.tip.1':
    '天數、地點、遊程和公路旅行路線、預訂、預算項目、行李清單、待辦事項和每日筆記都會複製，其中行李清單和待辦事項會以未勾選的狀態帶過來。成員、聊天、投票、檔案和分享連結則不會複製。',

  // archive-trip
  'help.guide.archive-trip.title': '封存並還原旅行',
  'help.guide.archive-trip.goal': '不用刪除旅行，先從旅行清單中收起來，之後隨時可以還原。',
  'help.guide.archive-trip.step.1': '點擊卡片右上角的封存圖示。',
  'help.guide.archive-trip.step.2': '把卡片上方的篩選切換為「已歸檔」，就能再次看到它。',
  'help.guide.archive-trip.step.3': '點擊卡片上的「恢復」，旅行會回到「計劃中」；如果日期已過，則回到「已完成」。',
  'help.guide.archive-trip.result':
    '歸檔的旅行會保留所有資料，只是不再顯示在儀表板，也不會出現在全部旅行的行事曆訂閱中。',

  // delete-trip
  'help.guide.delete-trip.title': '刪除旅行',
  'help.guide.delete-trip.goal': '永久刪除一趟旅行。',
  'help.guide.delete-trip.step.1': '點擊卡片右上角的垃圾桶圖示。',
  'help.guide.delete-trip.step.2': '點擊「刪除」確認。對話方塊會列出旅行的名稱，讓你確認沒選錯。',
  'help.guide.delete-trip.result':
    '旅行與其中的天數、地點、預訂和檔案都會被刪除，而且無法復原。如果不確定，請改成封存旅行。',

  // filter-and-view
  'help.guide.filter-and-view.title': '尋找已完成的旅行，切換格狀與清單檢視',
  'help.guide.filter-and-view.goal': '查看已完成或已歸檔的旅行，並選擇你喜歡的版面。',
  'help.guide.filter-and-view.step.1':
    '使用卡片上方的「計劃中」「已歸檔」和「已完成」。結束日期已過的旅行都算「已完成」。',
  'help.guide.filter-and-view.step.2': '點選清單圖示可切換成精簡清單，再點一次則回到格狀。',
  'help.guide.filter-and-view.result': '儀表板會記住你在這台裝置上選的版面。',

  // calendar-feed
  'help.guide.calendar-feed.title': '在行事曆中訂閱所有旅行',
  'help.guide.calendar-feed.goal': '在行事曆應用程式中查看每趟進行中旅行的日期與預訂，並保持同步。',
  'help.guide.calendar-feed.step.1': '點選檢視切換旁邊的行事曆圖示。',
  'help.guide.calendar-feed.step.2': '點擊「啟用日曆訂閱」。TREK 會建立一個私人的訂閱連結。',
  'help.guide.calendar-feed.step.3':
    '點擊「加入 Google 日曆」或「加入 Apple 日曆 / Outlook」。如果你用的是其他日曆 App，請打開「或手動複製連結」，從那裡複製連結。',
  'help.guide.calendar-feed.result':
    '所有進行中的旅行都會顯示在你的行事曆裡，並自動更新。已歸檔的旅行，以及結束超過 90 天的旅行不會包含在內。',
  'help.guide.calendar-feed.tip.1':
    '請妥善保管這個連結：任何拿到連結的人都能讀取訂閱內容。如果連結被別人拿到，點擊「重新產生」就會得到新連結，舊連結隨即失效。「關閉」則會完全移除連結。',

  // widgets
  'help.guide.widgets.title': '選擇儀表板小工具',
  'help.guide.widgets.goal': '顯示或隱藏統計列和右側的小工具。',
  'help.guide.widgets.step.1': '點選右上角的頭像選單，選擇「設定」。',
  'help.guide.widgets.step.2': '切換到「外觀」分頁。',
  'help.guide.widgets.step.3':
    '在「儀表板小工具」下，分別為桌面版和手機版開啟或關閉每個小工具。「右側邊欄」可一次關閉整個右欄。',
  'help.guide.widgets.step.4': '回到儀表板，變更會立即生效。',
  'help.guide.widgets.result': '隱藏小工具後，旅行會有更多空間。關閉整個右側欄，版面就會置中。',
  'help.guide.widgets.link': '開啟外觀設定',

  // currency-widget
  'help.guide.currency-widget.title': '換算貨幣',
  'help.guide.currency-widget.goal': '用目前的匯率在兩種貨幣之間換算金額。',
  'help.guide.currency-widget.step.1': '輸入金額，再選擇兩種貨幣。',
  'help.guide.currency-widget.step.2': '兩者之間的箭頭可以對調貨幣，圓形箭頭則會更新匯率。',
  'help.guide.currency-widget.result': '你選的貨幣組合會記在你的帳號上，所以每台裝置都一樣。',
  'help.guide.currency-widget.tip.1': '匯率來自免費的 Frankfurter 服務。點擊小工具角落的圓形箭頭，可取得最新匯率。',

  // timezones-widget
  'help.guide.timezones-widget.title': '新增世界時鐘',
  'help.guide.timezones-widget.goal': '隨時查看各個目的地的當地時間。',
  'help.guide.timezones-widget.step.1': '點擊「時區」小工具中的 +，搜尋城市（例如 Lisbon），然後從列表中選擇。',
  'help.guide.timezones-widget.step.2': '要移除某個時鐘，將游標移到它上面，點擊右側出現的 ×。',
  'help.guide.timezones-widget.result': '你的時鐘設定會隨帳號一起儲存。',
  'help.guide.search-trips.title': '搜尋你的旅行',
  'help.guide.search-trips.goal': '用名稱、日期或旅行中規劃的地點找出旅行，已封存的旅行也找得到。',
  'help.guide.search-trips.step.1':
    '在卡片上方的「搜尋行程或地點」中輸入文字。清單會隨著輸入即時篩選，已規劃、已封存和已完成的旅行會一併搜尋。',
  'help.guide.search-trips.step.2':
    '如果旅行是因為其中某個地點而符合搜尋，該地點會顯示在旅行標題下方。點選搜尋框中的 x 或按 Escape，就能再看到所有旅行。',
  'help.guide.search-trips.result': '儀表板只會顯示符合的旅行。清空搜尋框，就會再顯示所有旅行。',
  'help.guide.search-trips.tip.1': '也可以用日期搜尋：輸入年月，例如 2027年5月 或 2027-05，就能找到該月份的旅行。',
  'help.guide.search-trips.tip.2':
    '搜尋進行中時，「計劃中」「已歸檔」和「已完成」的切換不會生效，所以不會有旅行因為篩選錯誤而被藏起來。',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay 是你個人的休假規劃工具：一年有幾天假、已登記哪幾天、還剩幾天。格線會顯示整年的狀況。側邊欄有年份選擇、一起規劃的人、與你共享的行事曆、圖例和你的「年假額度」。',
  'help.ctx.vacay.bullet.1':
    '年度格線：十二張月份卡片，每天一格。點一下某一天即可登記或清除。旅行已涵蓋的日子會有一個小藍點。',
  'help.ctx.vacay.bullet.2':
    '底部的工具列：第一個按鈕帶有你的名字和顏色，用來記錄休假；「公司假日」標記全公司放假的日子。「半天」和「補休 / 彈性」會改變點擊所記錄的內容，「半天」也適用於公司假日。',
  'help.ctx.vacay.bullet.3':
    '年假額度：所選年份的「天」、「已使用」和「剩餘」，旁邊是結轉天數和補休 / 彈性天數。點擊卡片標題可將它收合。',
  'help.ctx.vacay.bullet.4':
    '「人數」是與你合併計畫的人，每個人各有自己的顏色。「共享的日曆」會用彩色圓環顯示其他人的休假日，這些日子你無法編輯。',
  'help.ctx.vacay.bullet.5':
    '設定涵蓋週末、每週起始日、結轉、你的休假年度、公司假日、公共假期與學校假期日曆，以及和他人一起規劃時的「解除合併」。',
  // log-day
  'help.guide.log-day.title': '登記休假日',
  'help.guide.log-day.goal': '在年度格線上標記休假日，並即時看到餘額的變化。',
  'help.guide.log-day.step.1':
    '看一下底部工具列的第一個按鈕。當它顯示你的名字和顏色時，點擊某一天就會為你登記一天休假。',
  'help.guide.log-day.step.2': '在任一月份卡片中點選某一天。那一天會填上你的顏色，「使用於」的天數也會加一天。',
  'help.guide.log-day.step.3': '再點一次同一天即可清除。',
  'help.guide.log-day.result':
    '這一天已登記。「天」、「已使用」和「剩餘」會立即更新，與你合併計畫的人也會馬上看到變更。',
  'help.guide.log-day.tip.1': '如果在「設定」中開啟了「鎖定週末」，就無法登記週末。先前已登記的週末仍可清除。',
  'help.guide.log-day.tip.2': '格子裡的藍點代表你的某趟旅行涵蓋了那一天，方便你看出休假和旅行重疊的地方。',
  // half-day
  'help.guide.half-day.title': '登記半天假',
  'help.guide.half-day.goal': '只休一個下午，只用掉半天的額度。',
  'help.guide.half-day.step.1': '在工具列開啟「半天」。格線中的橘色圓點就是半天的標記。',
  'help.guide.half-day.step.2': '點選某一天。它會記為 0.5 天，角落會出現橘色圓點。',
  'help.guide.half-day.step.3': '用完後請再次關閉「半天」。如果你點選的半天設定與目前不同，它會改成目前的設定。',
  'help.guide.half-day.result': '「已使用」會增加 0.5。「半天」與「補休 / 彈性」互相獨立，所以你也可以登記半天補休。',
  'help.guide.half-day.tip.1': '工具列會一直顯示你下一次點選會放上的標記，登記前可以先確認。',
  // comp-day
  'help.guide.comp-day.title': '登記補休或彈性時間',
  'help.guide.comp-day.goal': '休補休假，不動用年假天數。',
  'help.guide.comp-day.step.1': '在工具列開啟「補休 / 彈性」。格線中的斜線圓盤就是補休日的標記。',
  'help.guide.comp-day.step.2': '點選某一天。它會以你的顏色填滿斜線，而不是整片實心色塊。',
  'help.guide.comp-day.result': '補休日會另外計在額度方塊旁邊，不會減少「剩餘」。',
  'help.guide.comp-day.tip.1': '加班換來的休假、彈性工時或補休日都適用：只要是休假以外的休息日，都登記在這裡。',
  // entitlement
  'help.guide.entitlement.title': '設定年假額度',
  'help.guide.entitlement.goal': '告訴 Vacay 你這一年有幾天假。',
  'help.guide.entitlement.step.1':
    '在側邊欄的「年假額度」卡片中，點擊你那一列的「天」方塊。如果卡片已收合，點擊標題即可展開。',
  'help.guide.entitlement.step.2': '輸入你的天數並按 Enter。按 Escape 會保留舊的數值。',
  'help.guide.entitlement.result': '「剩餘」會依你的額度、結轉天數和已使用的天數重新計算。',
  'help.guide.entitlement.tip.1': '每一年都有各自的額度，所以在這裡的變更只會影響所選的年份。',
  // years
  'help.guide.years.title': '新增與切換年份',
  'help.guide.years.goal': '提早規劃明年，或回頭看看去年。',
  'help.guide.years.step.1': '點選年份右邊的 + 可新增下一年，點選左邊的 + 則新增上一年。',
  'help.guide.years.step.2': '用箭頭或下方的年份標籤切換年份。',
  'help.guide.years.step.3':
    '要移除某一年，請把游標移到年份標籤上，點選小小的減號。這也會刪除該年所有的登記，請小心確認。',
  'help.guide.years.result': '每一年都有自己的額度和登記紀錄，結轉則把前後兩年連起來。',
  // company-holidays
  'help.guide.company-holidays.title': '標記公司假日',
  'help.guide.company-holidays.goal': '封鎖全公司休息的日子，而且不會扣除任何人的額度。',
  'help.guide.company-holidays.step.1':
    '開啟「設定」，確認「公司假日」已開啟。預設就是開啟的。只有開啟時，工具列才會顯示這個模式。',
  'help.guide.company-holidays.step.2': '回到表格，將工具列切換到「公司假日」。',
  'help.guide.company-holidays.step.3': '點擊要設定的日期，它們會變成琥珀色並出現在圖例中。再點一次同一天即可清除。',
  'help.guide.company-holidays.result': '所有合併計畫的人都看得到公司假日，而且不會減少「剩餘」天數。',
  'help.guide.company-holidays.tip.1': '任何已合併的成員都能編輯公司假日，所以最好先說好由誰負責維護。',
  // public-holidays
  'help.guide.public-holidays.title': '顯示國定假日',
  'help.guide.public-holidays.goal': '把你所在國家或地區的國定假日顯示在格線上。',
  'help.guide.public-holidays.step.1': '開啟「設定」，然後開啟「公共假日」。',
  'help.guide.public-holidays.step.2':
    '點擊「新增日曆」，選擇國家，必要時再選擇地區。你也可以為它設定顏色和標籤，然後點擊「新增」。',
  'help.guide.public-holidays.step.3': '關閉「設定」。假日會顯示在格線和圖例中。',
  'help.guide.public-holidays.result': '公共假日會以行事曆的顏色標示，不會計入你的額度。',
  'help.guide.public-holidays.tip.1': '你可以新增多個行事曆，例如自己所在地區的，以及已合併的同事所在地區的。',
  // school-holidays
  'help.guide.school-holidays.title': '顯示學校假期',
  'help.guide.school-holidays.goal': '在自己的休假旁邊，一併查看所在地區的學校假期。',
  'help.guide.school-holidays.step.1': '開啟「設定」，並開啟「School Holidays」。',
  'help.guide.school-holidays.step.2':
    '點擊「新增日曆」並選擇國家。如果該國的日曆分成不同地區，也請選擇地區或群組，再點擊「新增」。',
  'help.guide.school-holidays.step.3': '關閉「設定」。學校假期會以日曆的顏色淡淡染色，並在當天格子的底部有一條色帶。',
  'help.guide.school-holidays.result': '學校假期只會顯示在行事曆上，不會減少任何人的額度。',
  'help.guide.school-holidays.tip.1': '沒有你的地區嗎？管理員可以在「管理員」、「配置」、「學校假期」中手動維護。',
  // weekends
  'help.guide.weekends.title': '封鎖週末並設定每週起始日',
  'help.guide.weekends.goal': '不把週末算進天數，並讓一週從你習慣的那一天開始。',
  'help.guide.weekends.step.1': '開啟「設定」。',
  'help.guide.weekends.step.2': '開啟「鎖定週末」，然後在「週末」下選擇算作你週末的日子。',
  'help.guide.weekends.step.3': '在「每週開始於」下，選擇「週一」或「週日」。',
  'help.guide.weekends.result': '排除的日子在格線中會顯示為灰色，不會被誤登記。',
  // leave-year
  'help.guide.leave-year.title': '設定休假年度',
  'help.guide.leave-year.goal': '以會計年度或到職日來計算額度，而不是從一月算到十二月。',
  'help.guide.leave-year.step.1': '開啟「設定」，找到「休假年度」。',
  'help.guide.leave-year.step.2': '選擇「行事曆」、「會計年度」（並指定起始的月和日）或「到職日」（並指定到職日期）。',
  'help.guide.leave-year.result': '年假額度、已使用天數和結轉天數都會依這段期間計算，格線也從這段期間的第一個月開始。',
  'help.guide.leave-year.tip.1': '這項設定屬於個人：在合併的計畫中，每個人都保有自己的休假年度和數字。',
  // carry-over
  'help.guide.carry-over.title': '把未用完的天數結轉',
  'help.guide.carry-over.goal': '把一個期間結束時剩下的天數，加到下一個期間。',
  'help.guide.carry-over.step.1': '開啟「設定」。',
  'help.guide.carry-over.step.2': '開啟「結轉」。',
  'help.guide.carry-over.result': '結轉的數量會依你所有年份重新計算，並顯示在額度下方。',
  'help.guide.carry-over.tip.1': '關閉後，所有結轉的餘額都會歸零。',
  // invite
  'help.guide.invite.title': '與他人一起規劃',
  'help.guide.invite.goal': '與另一位 TREK 使用者合併計畫，兩個人的休假就能在同一個格線上看到。',
  'help.guide.invite.step.1': '點擊「人數」卡片中的人像圖示。',
  'help.guide.invite.step.2': '選擇使用者並點擊「傳送邀請」。',
  'help.guide.invite.step.3':
    '對方下次開啟 Vacay 時會收到通知和「合併請求」。在此之前，邀請會顯示為待處理，將游標移上去即可取消。',
  'help.guide.invite.result': '兩份計畫會合併：每個人有自己的顏色，可以互相幫對方登記休假，所有內容即時同步。',
  'help.guide.invite.tip.1': '要取消合併，請在「設定」中點擊「解除」。每個人的條目都會回到各自的計畫。',
  'help.guide.invite.tip.2': '如果對方只需要看到你的休假日，請改為分享行事曆，不要合併。',
  // share-calendar
  'help.guide.share-calendar.title': '以唯讀方式分享你的行事曆',
  'help.guide.share-calendar.goal': '讓對方看到你什麼時候休假，但無法更動你的計畫。',
  'help.guide.share-calendar.step.1': '點擊「共享的日曆」卡片中的分享圖示。',
  'help.guide.share-calendar.step.2': '選擇使用者，再點選「分享」。不需要對方接受。',
  'help.guide.share-calendar.step.3':
    '與你共享的日曆會顯示在卡片頂部：點擊其中一個可隱藏或顯示它，或將游標移上去，點擊 x 移除它。在「你共享給」下，將游標移到名字上，點擊「停止分享」。',
  'help.guide.share-calendar.result': '你的休假會在對方的格線上顯示為彩色圓環。對方無法編輯你分享的內容。',
  'help.guide.share-calendar.tip.1': '分享與合併互不相干：你可以和一個人合併，同時與其他人分享。',
  'help.guide.share-calendar.tip.2': '將滑鼠移到有圓環的日期上，就能看到誰休假、休多久。',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas 用世界地圖顯示你去過的地方：旅行帶你去過的每個國家都會上色，在使用 TREK 之前去過的國家則可以手動加入。放大可以看到各地區，也可以建立心願單，記下還想去的地方，並在底部的玻璃面板中查看你的統計數字。',
  'help.ctx.atlas.bullet.1':
    '地圖：去過的國家各有固定的專屬顏色，計畫前往的國家以虛線框標示，口袋名單上的國家以斜線標示，其餘國家則是灰色。把游標移到國家上，就能看到該國的旅行、地點，以及第一次和最近一次造訪的時間。',
  'help.ctx.atlas.bullet.2':
    '頂部的搜尋：輸入國家或地點。還沒去過的國家會開啟彈出視窗，去過的國家則會在面板中顯示它的卡片。如果選擇的是某個地點，地圖會開啟它所屬的地區，讓你可以標記該地區。',
  'help.ctx.atlas.bullet.3':
    '右上角的「顯示計劃中的國家」：顯示你即將出發的旅行所涉及的國家。只有在你有這類旅行時，才會出現這個開關。',
  'help.ctx.atlas.bullet.4':
    '底部面板：「統計」分頁顯示國家（旁邊是計劃中的）、地區、旅行、地點、城市、天數、大洲、連續天數和今年的旅行；「心願單」分頁顯示還沒去的地方；啟用遊程擴充套件後，還有「遊程」分頁，顯示你完成的遊程的距離和爬升。',
  'help.ctx.atlas.bullet.5': '地區：放大到近處，地圖會切換為州和省，每個都可以點擊來標記、取消標記或加入心願單。',
  'help.ctx.atlas.bullet.6':
    'Dawarich：連接擴充套件後，統計資料左邊會出現一個面板，可以根據你的行蹤記錄勾掉願望並加入國家。這些動作都要等你確認後才會執行。',
  // mark-country
  'help.guide.mark-country.title': '將國家標記為已訪問',
  'help.guide.mark-country.goal': '加入你在使用 TREK 之前去過的國家，讓地圖和統計數字也算進去。',
  'help.guide.mark-country.step.1': '在地圖頂部的搜尋框輸入國家名稱。',
  'help.guide.mark-country.step.2': '從清單中選擇該國家。地圖會移到那個國家，並開啟它的彈出視窗。',
  'help.guide.mark-country.step.3': '選擇「標記為已訪問」。',
  'help.guide.mark-country.result':
    '該國會在地圖上取得專屬顏色，「國家」的數量加一。這個顏色是固定的：之後再標記其他國家，也不會改變其他國家的顏色。',
  'help.guide.mark-country.tip.1':
    '在地圖上點選灰色的國家，會開啟同樣的彈出視窗。如果是面積小的國家，用搜尋會比較準確。',
  'help.guide.mark-country.tip.2': '你手動標記的國家一律算作已訪問，不論前往該國的旅行日期為何。',
  // unmark-country
  'help.guide.unmark-country.title': '移除你標記過的國家',
  'help.guide.unmark-country.goal': '把你手動標記的國家從地圖上移除。',
  'help.guide.unmark-country.step.1':
    '搜尋並選擇該國家，或直接在地圖上點選它。如果是你自己標記的國家，彈出視窗會問你是否要移除。',
  'help.guide.unmark-country.step.2': '點選「移除」確認。',
  'help.guide.unmark-country.result': '該國會變回灰色，也不再計入統計。',
  'help.guide.unmark-country.tip.1':
    '只有手動標記的國家，才能用這個方式移除。有旅行或地點的國家會一直保持標記，直到那些旅行或地點被移除為止。如果是手動標記的國家，面板中它的詳細資料卡片上也有「移除」。',
  // country-details
  'help.guide.country-details.title': '查看你在某個國家做了什麼',
  'help.guide.country-details.goal': '開啟一個去過的國家，再前往帶你到那裡的旅行。',
  'help.guide.country-details.step.1': '在地圖頂部的搜尋框中輸入你去過的國家。',
  'help.guide.country-details.step.2':
    '選擇它。地圖會飛到那裡，底部的面板會多出一張卡片，顯示國旗、地點、旅行和已造訪地區的徽章，以及前三趟旅行各一個標籤。',
  'help.guide.country-details.result': '點選旅行標籤，就能在規劃器中開啟該趟旅行。',
  'help.guide.country-details.tip.1':
    '將滑鼠移到地圖上的該國家，會顯示相同的數字，另外還有第一次和最近一次造訪的時間。',
  // planned-countries
  'help.guide.planned-countries.title': '顯示你要去的國家',
  'help.guide.planned-countries.goal': '在地圖上顯示即將出發的旅行所涉及的國家，但不把它們算作已訪問。',
  'help.guide.planned-countries.step.1': '開啟右上角的「顯示計劃中的國家」。旁邊的數字是計畫前往的國家數量。',
  'help.guide.planned-countries.step.2':
    '搜尋並選擇一個計畫前往的國家：面板會顯示「計劃中」，地圖提示則會顯示你的出發時間。',
  'help.guide.planned-countries.result': '計劃中的國家會以虛線輪廓顯示，不會和你已去過的國家混淆。開關會記住你的選擇。',
  'help.guide.planned-countries.tip.1':
    '前往某國的旅行一旦開始，該國就算去過；進行中的旅行也一樣。沒有日期的旅行完全不會納入統計。',
  'help.guide.planned-countries.tip.2': '只有在你有即將出發的旅行時，才會有這個開關。',
  // regions
  'help.guide.regions.title': '標記地區',
  'help.guide.regions.goal': '標記你去過的州、省或縣，不只是國家。',
  'help.guide.regions.step.1':
    '放大某個國家，直到出現它的州和省邊界。如果你搜尋該國家並選擇它，地圖會自動移到夠近的位置。',
  'help.guide.regions.step.2': '點選一個地區。游標移上去時會顯示地區名稱，彈出視窗則會顯示該地區和所屬的國家。',
  'help.guide.regions.step.3': '選擇「標記為已訪問」。',
  'help.guide.regions.result': '該地區會填上所屬國家的顏色。標記地區時，如果該國還沒算作去過，也會一併算進去。',
  'help.guide.regions.tip.1':
    '點選已造訪的地區時，會出現「移除」，不論這個地區是你自己標記的，還是因為某個地點而加入的。',
  'help.guide.regions.tip.2': '你有實際去過地點的地區會自動標記，不需要另外操作。',
  // search-place
  'help.guide.search-place.title': '搜尋地點並標記它所在的地區',
  'help.guide.search-place.goal': '不需要知道城市屬於哪個地區，只要搜尋 Munich 就能標記 Bavaria。',
  'help.guide.search-place.step.1':
    '在搜尋框中輸入城市、地標或地址。國家會排在最前面，符合的地點則顯示在下方的「地點」之下。',
  'help.guide.search-place.step.2': '選擇該地點。地圖會移到那裡，並找出這個位置所在的地區。',
  'help.guide.search-place.step.3': '如果去過，就為該地區選擇「標記為已訪問」；如果還沒去過，就選擇「新增到心願單」。',
  'help.guide.search-place.result':
    '該地區會被標記，所屬國家也一樣。如果地圖資料包裡沒有某個國家的地區資料，則改為標記整個國家。',
  'help.guide.search-place.tip.1': '地點搜尋和 TREK 其他地方使用的是同一套，所以會用管理員設定的提供商。',
  // bucket-country
  'help.guide.bucket-country.title': '把國家加入心願單',
  'help.guide.bucket-country.goal': '在地圖上維護一份想去的國家口袋名單，與你已去過的國家分開。',
  'help.guide.bucket-country.step.1': '搜尋該國並選取，或直接在地圖上點選。',
  'help.guide.bucket-country.step.2': '選擇「新增到心願單」。',
  'help.guide.bucket-country.step.3': '如果已經知道出發時間，就選擇月份和年份，再點選「新增到心願單」確認。',
  'help.guide.bucket-country.result':
    '該國會以斜線填滿，顏色就是你造訪之後它會呈現的顏色，同時也會出現在面板的「心願單」分頁中。',
  'help.guide.bucket-country.tip.1': '國家加入心願單後，同一個彈出視窗會提供「從心願單移除」。',
  'help.guide.bucket-country.tip.2':
    '每個目標日期只能有一筆：同一個國家可以在兩個不同的月份各出現一次，但同一個月份不能出現兩次。',
  // bucket-place
  'help.guide.bucket-place.title': '把地點加入口袋名單',
  'help.guide.bucket-place.goal': '儲存你想去的城市、景點或地址，並附上座標和預計出發日期。',
  'help.guide.bucket-place.step.1': '在底部面板中開啟「心願單」分頁。',
  'help.guide.bucket-place.step.2': '點選「新增地點」。',
  'help.guide.bucket-place.step.3':
    '輸入名稱後按搜尋按鈕，再選擇相符的結果，地點就會帶有座標。你也可以只輸入名稱，略過搜尋。',
  'help.guide.bucket-place.step.4': '如果想要，可以選擇月份和年份，然後點選「新增」。',
  'help.guide.bucket-place.result':
    '該地點會連同它的目標日期出現在心願單的最上方。將游標移上去會出現 ×，可再次將它移除。',
  'help.guide.bucket-place.tip.1':
    '只有帶有座標的心願，Dawarich 才能在你的記錄顯示你到過那裡之後，自動將它標示為完成。',
  // stats
  'help.guide.stats.title': '查看你的統計資料',
  'help.guide.stats.goal': '了解面板上的數字統計了什麼，又沒有統計什麼。',
  'help.guide.stats.step.1':
    '「國家」是你實際去過的不同國家數量；計劃中的顯示在它下方，不計入其中。「地區」計算你去過的州和省。「旅行」、「地點」和「天」是你所有旅行的總計。「城市」是根據地點的位址推算的，所以只是估計值。',
  'help.guide.stats.step.2':
    '各大洲顯示每個大洲已造訪的國家數。去過南極洲之後，這一列才會出現南極洲。接著是你的連續紀錄（每年至少旅行一次的連續年數），以及你今年的旅行次數。',
  'help.guide.stats.result': '數字會隨著你規劃旅行自動更新，你不需要在這裡維護任何東西。',
  'help.guide.stats.tip.1':
    '城市是從地址文字讀取的，並不會另外查詢。所以像「Osteria Francescana, Italy」這種簡短的地址，或是以縣級行政區結尾的地址，可能會被算成地區，而不是城市。',
  'help.guide.stats.tip.2': '手動標記的國家會計入「國家」和各大洲的統計，但不會增加旅行、地點或天數。',
  // dawarich-countries
  'help.guide.dawarich-countries.title': '從你的記錄新增國家',
  'help.guide.dawarich-countries.goal': '用 Dawarich 找出你過去一年去過哪些國家，並把你確認的國家加到地圖上。',
  'help.guide.dawarich-countries.step.1':
    '連接 Dawarich 擴充套件後，地圖底部、統計資料的左邊會出現 Dawarich 面板，裡面有兩個圖塊。點選「國家」。',
  'help.guide.dawarich-countries.step.2':
    '對話框會開啟在「國家」分頁。點選「尋找國家」：TREK 會逐月讀取你的行蹤記錄在最近 12 個月內涵蓋的國家和城市，所以可能需要一點時間。你的 Atlas 中還沒有的國家都會列出，並附上國旗、城市數量和第一個城市的名稱，預設全部勾選。點選某一列即可排除該國家。',
  'help.guide.dawarich-countries.step.3':
    '點選右下角的按鈕確認，勾選五列時會顯示「新增 5 個國家」。對話框會告訴你新增了幾個國家，關閉後地圖就已經更新了。',
  'help.guide.dawarich-countries.result':
    '確認過的國家會在地圖上上色，並計入「國家」，來源記錄為 Dawarich。你手動標記的國家不會有任何變動。',
  'help.guide.dawarich-countries.tip.1':
    'Atlas 已經顯示為去過的國家，不論是手動標記、來自旅行，還是來自先前的檢查，都會被排除，所以你自己的標記絕不會被更動。你之前從 Atlas 移除的國家，在這裡確認後會重新加入。',
  'help.guide.dawarich-countries.tip.2':
    '如果 TREK 比對不到某個國家名稱，該名稱會列在各列下方，不會被捨棄。「再查一次」會再向 Dawarich 查詢一次。清單下方的說明會寫明檢查的是最近 12 個月，這個期間無法更改。',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': '根據你的行蹤記錄勾掉願望',
  'help.guide.dawarich-wishes.goal': '找出口袋名單上你實際到過的地點，並以你到達的日期標記為已到達。',
  'help.guide.dawarich-wishes.step.1': '在地圖底部、統計資料左邊的 Dawarich 面板中，點選「心願清單」。',
  'help.guide.dawarich-wishes.step.2':
    '對話框會開啟在「心願清單」分頁。點選「核對願望清單」：TREK 會在你的行蹤記錄中查找每一筆有座標的項目。已達成的願望會列出你離目標多近、停留多久，以及日期，並預設勾選。已經勾掉的則會顯示「已打勾」。清單下方有一則備註，會統計沒有座標的項目，並說明規則：「在 250 公尺內停留 20 分鐘以上，才算達成願望。」',
  'help.guide.dawarich-wishes.step.3':
    '按右下角的按鈕確認，勾選兩列時按鈕會顯示「為 2 項打勾」。接著關閉對話框，開啟旁邊面板的「心願單」分頁。',
  'help.guide.dawarich-wishes.result':
    '每個心願都會有一個綠色勾號，日期是當時停留的日期，不是今天的日期。提示會顯示「依據你的 Dawarich 記錄打勾」。點選日期即可復原。',
  'help.guide.dawarich-wishes.tip.1':
    '只是開車經過不算：你必須靠近該地點，並停留一段時間。如果有多次停留符合條件，會採用最長的那一次。沒有座標的心願無法核對，所以請透過「新增地點」中的搜尋來新增地點，不要只輸入名稱。',
  'help.guide.dawarich-wishes.tip.2':
    '每次檢查最多看 50 筆，並優先檢查還沒勾掉的項目。如果還有更多，TREK 會告訴你。已經勾掉的願望會保留它原本的日期。',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': '收藏',
  'help.ctx.collections.summary':
    '「收藏」是旅行之外的個人資料庫：你找到並想留著的地點會放進有名稱的清單，每個地點的狀態是「想法」、「想去」或「已造訪」；開啟遊程後，也可以放進你從旅行保存下來的整個遊程。地點和遊程是複製進出旅行的，不是連結，所以清單和旅行不會互相影響。',
  'help.ctx.collections.bullet.1':
    '左邊的清單欄會顯示你自己的清單、分享給你的清單、尚未回覆的邀請，以及「全部已儲存」（彙整你擁有的所有清單內容）。「新增清單」和檔案匯入在最上方。',
  'help.ctx.collections.bullet.2':
    '開啟清單的頂部區塊：清單的顏色、封面、描述和連結、成員，右側有「編輯」（僅所有者）、「匯出」和「分享」。在與你共享的清單上，「分享」會顯示為「已分享」。',
  'help.ctx.collections.bullet.3':
    '地點上方的篩選列：用來新增地點的 +、「狀態」、「分類」、「評分」和「排序」下拉選單、「選擇」的核取方塊圖示，以及「從行程匯入」的雲端圖示。只有在畫面上沒有地圖時，才會出現標籤篩選。',
  'help.ctx.collections.bullet.4': '地點列：照片、名稱和位址、標籤和分類，右側是一鍵就能切換下一個狀態的狀態標籤。',
  'help.ctx.collections.bullet.5':
    '右側的地圖：每個有座標的地點一枚圖釘。頂部列有「展開地圖」（地圖全開後為「顯示清單」）、標籤篩選與管理標籤的按鈕，以及「搜尋地點」框。點擊圖釘會開啟該地點。',
  'help.ctx.collections.bullet.6':
    '詳細資料頁：點擊某一列，可查看封面、分類、狀態、星級評分、標籤、描述和連結。封面上的相機可更換照片。底部有「編輯」、「複製到行程」、導航按鈕和「從清單中移除」。',
  // create-list
  'help.guide.create-list.title': '建立清單',
  'help.guide.create-list.goal': '建立一份有名稱的新清單，並設定顏色和封面，準備放入地點。',
  'help.guide.create-list.step.1': '點選清單側欄頂部的「新增清單」。',
  'help.guide.create-list.step.2': '為清單命名並選擇顏色。封面圖片、描述和連結都是選填，之後可以用「編輯」加上。',
  'help.guide.create-list.step.3': '點選「建立」。',
  'help.guide.create-list.result': '清單開啟時是空的，你可以用「新增地點」和「從行程匯入」這兩種方式來填入內容。',
  'help.guide.create-list.tip.1': '封面可以是你自己上傳的圖片，也可以是在同一個對話框中透過 Unsplash 搜尋找到的照片。',
  // add-place
  'help.guide.add-place.title': '新增地點',
  'help.guide.add-place.goal': '找到一個地點，一次把名稱、分類、狀態和備註儲存到目前開啟的清單。',
  'help.guide.add-place.step.1': '點擊地點上方篩選列開頭的 +。如果清單還是空的，請點擊頁面中間的「新增地點」。',
  'help.guide.add-place.step.2': '在搜尋欄輸入地點，並選擇一個結果。名稱、地址和座標會自動從結果填入。',
  'help.guide.add-place.step.3':
    '設定狀態，如果想要，也可以加上分類、描述和連結，然後點選「新增」。對話框會保持開啟，讓你繼續新增下一個地點；「取消」則會關閉它。',
  'help.guide.add-place.result': '地點會出現在清單中；如果有座標，也會在地圖上顯示為圖釘。',
  'help.guide.add-place.tip.1':
    '在旅行中，使用地點檢視器或地點選單裡的「儲存到收藏」，不必離開旅行就能把旅行地點放進清單。',
  'help.guide.add-place.tip.2':
    '這份清單必須是你自己的，或是你擔任編輯者或管理員的清單；在「全部已儲存」或你只能檢視的清單裡不會出現 +。',
  // import-from-trip
  'help.guide.import-from-trip.title': '從旅行匯入地點',
  'help.guide.import-from-trip.goal': '一次把整趟旅行的地點放進清單，不必逐一儲存。',
  'help.guide.import-from-trip.step.1':
    '點選篩選列中帶有雲朵箭頭的匯入按鈕。清單是空的時候，同一個按鈕就在「新增地點」旁邊。',
  'help.guide.import-from-trip.step.2': '選擇你的其中一趟旅行。',
  'help.guide.import-from-trip.step.3':
    '勾選你想要的地點。清單中已有的地點會呈灰色；旅行中沒有排入任何一天的地點預設為選取狀態，如果每個地點都已排入某一天，則所有新地點都會被選取。「僅新增」會隱藏你已經有的地點。',
  'help.guide.import-from-trip.step.4': '點選「匯入」。按鈕上一定會寫明即將新增幾個地點。',
  'help.guide.import-from-trip.result':
    '地點會連同名稱、地址、座標、描述和分類一起複製到清單中，旅行本身不會有任何變動。',
  'help.guide.import-from-trip.tip.1': 'TREK 會自動略過名稱或座標重複的地點，所以重複匯入也不用擔心。',
  'help.guide.import-from-trip.tip.2': '在旅行的地點清單中，選擇模式提供「儲存到收藏」，可改為儲存一組手動挑選的地點。',
  // place-status
  'help.guide.place-status.title': '設定地點的狀態',
  'help.guide.place-status.goal': '記錄哪些只是想法、哪些在候選名單上，以及你去過哪裡。',
  'help.guide.place-status.step.1': '點選地點列右端的狀態標籤。「想法」會變成「想去」。',
  'help.guide.place-status.step.2': '再點一次變成「已造訪」，再點一次就回到「想法」。',
  'help.guide.place-status.result': '標籤和它的顏色會立即改變，清單上方狀態篩選中的數量也會跟著更新。',
  'help.guide.place-status.tip.1': '狀態只存在於「收藏」中。把地點複製到旅行時，不會一併複製狀態。',
  'help.guide.place-status.tip.2':
    '在旅行中，「儲存到收藏」會開啟「儲存到清單」，地點所在的每個清單各有一個狀態標籤；地點面板的選取列則有「在清單中標記為已造訪」。',
  // place-detail
  'help.guide.place-detail.title': '開啟已儲存的地點',
  'help.guide.place-detail.goal': '查看地點的所有資訊並進行操作：編輯、複製到旅行、找路、移除。',
  'help.guide.place-detail.step.1': '點選地點所在的那一列。詳細資料面板會在清單旁邊開啟，地圖也會移到該地點。',
  'help.guide.place-detail.step.2':
    '底部有「編輯」、「複製到行程」、在地圖 App 中開啟地點的導航按鈕，以及「從清單中移除」。封面上的相機可把自動取得的照片換成你自己的。',
  'help.guide.place-detail.result': '點選「編輯」後，名稱、分類、標籤、地址、座標、描述和連結都可以直接在面板中修改。',
  'help.guide.place-detail.tip.1':
    '地點沒有自己的圖片時，會自動取得封面。你自己上傳的圖片可以是 JPG、PNG、GIF、WebP 或 HEIC，最大 20 MB。相機旁的垃圾桶可恢復自動取得的照片。',
  'help.guide.place-detail.tip.2':
    '每位成員（包括你）都可以在狀態下方留下星級評分。篩選列中的「評分」篩選會依平均評分篩選。',
  // labels
  'help.guide.labels.title': '用標籤為地點分組',
  'help.guide.labels.goal': '除了共用的分類之外，再為清單加上自己的標籤，例如區域或天數。',
  'help.guide.labels.step.1':
    '點擊地圖上方標籤旁的「新增標籤」（清單有標籤後則是「管理標籤」）。畫面上沒有地圖時，這個按鈕位於篩選列的末端。',
  'help.guide.labels.step.2':
    '輸入名稱、選擇顏色，然後點選「新增標籤」。你也可以在同一個對話框中重新命名、換顏色或刪除既有的標籤。',
  'help.guide.labels.step.3':
    '開啟「選擇」，勾選地點，在選取列點擊「指派標籤」，然後選擇標籤並再次點擊「指派標籤」確認。單一地點也可以在其詳情頁面透過「編輯」加上標籤。',
  'help.guide.labels.step.4':
    '點擊地圖上方的一個或多個標籤，將列表和地圖縮小到帶有其中任一標籤的地點。再次點擊標籤可取消。',
  'help.guide.labels.result': '有標籤的地點會在該列上顯示標籤；標籤篩選對每位成員都適用，包括只能檢視的成員。',
  'help.guide.labels.tip.1': '標籤屬於建立它們的那份清單。如果你把地點移到另一份清單，它的標籤就會被移除。',
  'help.guide.labels.tip.2': '管理和指派標籤需要有該清單的編輯權限。',
  // filter-select
  'help.guide.filter-select.title': '篩選並選取地點',
  'help.guide.filter-select.goal': '篩選清單，並一次修改多個地點。',
  'help.guide.filter-select.step.1':
    '使用篩選列中的下拉選單：狀態、分類、最低評分和排序方式。狀態和分類會顯示每個選項剩下多少地點。',
  'help.guide.filter-select.step.2': '點擊下拉選單後面的核取方塊圖示「選擇」。每一列都會出現核取方塊，並出現選取列。',
  'help.guide.filter-select.step.3':
    '勾選地點，或用「全選」選取篩選結果中的所有地點，然後選擇「指派標籤」、「移動到清單」、「複製到清單」、「複製到行程」或「刪除」。只有清單的擁有者或管理員可以使用移動和刪除。',
  'help.guide.filter-select.result': '操作會一次套用到所有選取的地點。右側的 × 可離開選取模式。',
  'help.guide.filter-select.tip.1':
    '「全選」只會選取符合篩選條件的地點。要處理所有「想去」的地點，請先篩選為「想去」，再點選「全選」。',
  // copy-to-trip
  'help.guide.copy-to-trip.title': '把地點複製到旅行中',
  'help.guide.copy-to-trip.goal': '把已儲存的地點加入你的某一趟旅行，成為停留點。',
  'help.guide.copy-to-trip.step.1': '開啟「選擇」並勾選地點，或是開啟單一地點，使用詳細資料面板上的「複製到行程」。',
  'help.guide.copy-to-trip.step.2': '點選選取列中的「複製到行程」。',
  'help.guide.copy-to-trip.step.3': '選擇旅行。清單很長時，可以用搜尋框篩選。',
  'help.guide.copy-to-trip.result':
    '地點會連同名稱、描述、分類、備註、價格、座標、照片和標籤，一起加入該旅行的地點清單。收藏本身不會有任何變動。',
  'help.guide.copy-to-trip.tip.1': '共用清單的檢視者也可以這麼做。這只會把清單中的地點複製出去，不會更動清單。',
  // share-list
  'help.guide.share-list.title': '與他人分享清單',
  'help.guide.share-list.goal': '與這個 TREK 上的其他人即時一起規劃一份清單。',
  'help.guide.share-list.step.1': '點選清單頂端區塊中的「分享」。',
  'help.guide.share-list.step.2': '選擇使用者和角色：「檢視者」、「編輯者」或「管理員」。',
  'help.guide.share-list.step.3': '點擊「傳送邀請」。在對方從清單欄或通知中接受邀請之前，此人會顯示為待處理。',
  'help.guide.share-list.result':
    '對方接受後，清單會出現在他們的「已分享」下，之後每一項變更都會即時同步。你仍然可以在同一個對話框中編輯成員及其角色。',
  'help.guide.share-list.tip.1':
    '「檢視者」可以查看、評分，並把地點複製到自己的旅行中。「編輯者」可以新增和編輯地點與標籤。「管理員」還可以移動和刪除。',
  'help.guide.share-list.tip.2': '只有擁有者可以邀請和移除成員；成員則可以自行退出共用的清單。',
  // export-list
  'help.guide.export-list.title': '把清單匯出成檔案',
  'help.guide.export-list.goal': '把清單交給另一台 TREK 伺服器上的人，或用地圖應用程式開啟。',
  'help.guide.export-list.step.1': '點選清單頂端區塊中的「匯出」。',
  'help.guide.export-list.step.2':
    '要在另一個 TREK 中使用，請選「TREK 清單」，會連同標籤和狀態一起匯出；要在 OsmAnd、Organic Maps、Garmin 和其他能讀取航點的應用程式中使用，請選 GPX。',
  'help.guide.export-list.result': '檔案會開始下載。共用清單的任何成員都可以匯出。',
  'help.guide.export-list.tip.1': '沒有座標的地點無法成為 GPX 航點，會被略過，TREK 也會告訴你略過了幾個。',
  'help.guide.export-list.tip.2': '評分、成員和上傳的照片刻意不會匯出，因為它們屬於這個 TREK，而不是清單本身。',
  // import-file
  'help.guide.import-file.title': '從檔案匯入清單',
  'help.guide.import-file.goal': '匯入 TREK 清單檔案或 GPX 檔案，可以建成新清單，也可以放進現有的清單。',
  'help.guide.import-file.step.1': '點選清單側欄中「新增清單」旁邊、帶有上傳箭頭的匯入按鈕。',
  'help.guide.import-file.step.2': '選擇檔案。TREK 在匯入前會先顯示檔案內容：名稱、地點數量和標籤數量。',
  'help.guide.import-file.step.3':
    '保留「新增清單」，需要的話修改名稱，然後點擊「匯入」。也可以選擇「新增到清單」，把地點放進你可以編輯的清單，再點擊「加入清單」。',
  'help.guide.import-file.result':
    '清單會開啟並顯示匯入的地點。匯入清單只會新增地點；已經在清單中的地點會保留原有的狀態、備註和標籤。',
  'help.guide.import-file.tip.1':
    '匯入 GPX 時，每個有名稱的航點都會成為地點。軌跡是線條，會被略過，預覽會告訴你有幾個點。',
  'help.guide.import-file.tip.2':
    '如果檔案既不是 TREK 清單也不是 GPX，就會被拒絕，TREK 也會顯示原因。如果只有某個地點無法讀取，則只會略過該地點，不會影響整個檔案。',
  // edit-list
  'help.guide.edit-list.title': '編輯或刪除清單',
  'help.guide.edit-list.goal': '更改清單的名稱、顏色、封面、描述或連結，或是刪除清單。',
  'help.guide.edit-list.step.1': '點選清單頂端區塊中的「編輯」。只有擁有者看得到這個按鈕。',
  'help.guide.edit-list.step.2':
    '隨意修改，然後點擊「儲存」。左下角的垃圾桶「刪除清單」在確認後會刪除清單及其所有地點。',
  'help.guide.edit-list.result': '頂端區塊會立即顯示新的顏色、封面和描述。',
  'help.guide.edit-list.tip.1': '刪除清單後無法復原。如果想保留副本，請先匯出。',
  // all-saved
  'help.guide.all-saved.title': '搜尋你的整個地點庫',
  'help.guide.all-saved.goal': '一次查看你擁有的所有清單中的地點。',
  'help.guide.all-saved.step.1': '點擊清單欄中的「全部已儲存」。它會把你擁有或共同擁有的每個清單中的地點集中在一起。',
  'help.guide.all-saved.step.2':
    '在地圖上方的「搜尋地點」中輸入，並像在任何清單中一樣使用篩選器。「選擇」在這裡同樣可用：可跨清單移動、複製、複製到旅行或刪除。',
  'help.guide.all-saved.result':
    '這個檢視會把你儲存的所有地點放在一起。這裡無法新增或匯入地點，因為沒有明確的清單可以放入。',
  'help.guide.all-saved.tip.1': '標籤和保存的遊程都屬於單一清單，所以「全部已儲存」中兩者都不提供。',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': '旅程',
  'help.ctx.journey.summary':
    '旅程是以照片為主的旅行日誌。每段旅程都會連結到一趟或多趟旅行，你每天可以寫下一則條目，內容包括故事、照片、心情和天氣。這個頁面會列出你的旅程，開啟其中一段就能開始寫。',
  'help.ctx.journey.bullet.1':
    '頂部的橫幅會顯示進行中的旅程，或你最新的旅程，以及條目、照片和地點的數量。點擊「繼續撰寫」會開啟到今天。旅行剛結束時，上方會出現「旅行剛結束」橫幅，可直接把那趟旅行變成旅程。',
  'help.ctx.journey.bullet.2':
    '在「所有旅程」下方，每個旅程一張卡片，附封面、狀態、日期和數量；橫幅中的旅程不會在此重複出現。點擊卡片即可開啟。',
  'help.ctx.journey.bullet.3': '格狀排列中的最後一張卡片「建立新旅程」，可以從你的旅行建立新的旅程。',
  // create-journey
  'help.guide.create-journey.title': '建立旅程',
  'help.guide.create-journey.goal': '為旅行建立一本日記，旅行中的地點會先列為建議。',
  'help.guide.create-journey.step.1': '點選格線中的最後一張卡片「建立新旅程」。',
  'help.guide.create-journey.step.2':
    '為旅程取個名稱，也可以加上副標題，然後勾選它所屬的旅行。計數器會顯示將加入多少個地點。',
  'help.guide.create-journey.step.3': '點選「建立旅程」。',
  'help.guide.create-journey.result':
    '日誌會開啟。所連結旅行中的每個地點，都會以建議的形式出現在時間線上，排在幾天就各出現一次。你可以為每一則建議寫一則條目。',
  'help.guide.create-journey.tip.1': '之後可以在「旅程設定」中連結更多旅行。',
  'help.guide.create-journey.tip.2': '沒有連結旅行的旅程也可以，這時請手動新增條目。',
  // open-journey
  'help.guide.open-journey.title': '開啟旅程',
  'help.guide.open-journey.goal': '開啟一本日記，並了解它會從哪裡開始顯示。',
  'help.guide.open-journey.step.1': '點選一張卡片。每張卡片都會顯示封面、日期，以及這段旅程有多少則紀錄、照片和地點。',
  'help.guide.open-journey.result':
    '進行中的旅程會停在今天那一天；如果今天還沒寫，就停在今天之前的最後一則條目。已結束的旅程則從頭開始。',
  'help.guide.open-journey.tip.1': '除非你在「旅程設定」中另外指定，否則封面會用旅程的第一張照片。',
  // continue-writing
  'help.guide.continue-writing.title': '繼續寫進行中的旅程',
  'help.guide.continue-writing.goal': '直接開啟你正在進行的旅程的今天這一頁。',
  'help.guide.continue-writing.step.1':
    '點選頂部橫幅中的「繼續撰寫」。橫幅會顯示進行中的旅程，如果沒有進行中的旅程，則顯示最近的一個。',
  'help.guide.continue-writing.result': '日記會開啟在今天；如果還沒寫任何內容，則開啟在今天之前的最後一則紀錄。',
  'help.guide.continue-writing.tip.1':
    '旅行剛結束時，這個橫幅上方會有「旅行剛結束」橫幅：「建立旅程」會以勾選該旅行的方式開始建立旅程，「忽略」則在這個瀏覽器中隱藏這項提議。',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': '日誌',
  'help.ctx.journey-detail.summary':
    '一個開啟的旅程：左邊是按天排列的時間軸，右邊是地圖，可切換計畫、你記錄的內容、條目和照片等圖層。標題包含數量、Studio、建議開關，以及用於「旅程設定」的 ⋯；它下方的工具列用來新增條目。',
  'help.ctx.journey-detail.bullet.1':
    '標題區：返回箭頭和狀態徽章、封面、標題與副標題，以及天數、地點、條目和照片的數量。右側是 Studio、用來隱藏或顯示建議的眼睛，以及通往「旅程設定」的 ⋯。',
  'help.ctx.journey-detail.bullet.2':
    '工具列：「時間線」和「圖庫」分頁、「在這段旅程中搜尋」，以及「新增條目」。在「圖庫」中，「上傳」會取代「新增條目」。',
  'help.ctx.journey-detail.bullet.3':
    '時間線：每天一個區段，標示天數編號、地點數量，以及用來在當天新增條目的 +。下方是附有照片、心情、天氣和故事的條目卡片，以及來自旅行的虛線建議卡片，每張卡片都有一個用來忽略的 ×。',
  'help.ctx.journey-detail.bullet.4':
    '地圖：頂部的圖層列可切換「計畫」（空心圖釘和旅行的虛線 GPX 路線）、「記錄」（從 Dawarich 保存的實線路線）、「條目」（以當天顏色標示的圖釘，依日期順序用細虛線連起來）和「照片」。旁邊的 (i) 會說明每個符號。',
  'help.ctx.journey-detail.bullet.5':
    '「旅程設定」（⋯）：封面、名稱和副標題、狀態、GPX 軌跡、已記錄的日子、依照片定位的地點、條目欄位、已忽略的建議、已同步的旅行、貢獻者以及旅行允許誰加入、公開分享、封存和刪除。',
  'help.ctx.journey-detail.bullet.6':
    '在很長的時間軸底部會浮現「回到頂部」、一個可跳到任何一天或條目的天數計數，以及「跳到最後一則」。',
  // add-entry
  'help.guide.add-entry.title': '寫一則條目',
  'help.guide.add-entry.goal': '寫下一天的故事，包括標題、內文、心情和天氣。',
  'help.guide.add-entry.step.1': '點擊工具列中的「新增條目」，或點擊某天標題右端的 +，從那一天開始寫。',
  'help.guide.add-entry.step.2':
    '為條目取個標題，再寫下內文。文字上方的工具列可以用 Markdown 加入粗體、斜體、標題、引言、連結和清單。',
  'help.guide.add-entry.step.3': '在右欄中確認日期和時間，搜尋地點或使用你目前的位置，並選擇心情和天氣。',
  'help.guide.add-entry.step.4': '點選「儲存」。',
  'help.guide.add-entry.result': '紀錄會出現在時間線上對應的日期，並在地圖上以圖釘顯示。頁首的數量也會隨之更新。',
  'help.guide.add-entry.tip.1': '從建議開始寫時，用的是同一個編輯器，地點也已經設定好了。',
  'help.guide.add-entry.tip.2':
    '有地點的條目會有「不計入路線」選項：條目仍留在日誌中，但不計入距離和國家數，也不會顯示在 Studio 的地圖上。',
  // entry-photos
  'help.guide.entry-photos.title': '為紀錄加入照片和影片',
  'help.guide.entry-photos.goal': '為某一天加入照片，第一張會成為該條目的封面。',
  'help.guide.entry-photos.step.1': '點選條目卡片上的 ⋯ 開啟選單，再選擇「編輯」。',
  'help.guide.entry-photos.step.2':
    '點選「上傳照片」並選擇檔案。「從相簿」會使用旅程圖庫中已有的照片；「External photos」則會在已連接的 Immich 或 Synology 相片庫中搜尋當天的照片。',
  'help.guide.entry-photos.step.3': '把游標移到圖片上，點選「設為第1張」選定封面，再點選「儲存」。',
  'help.guide.entry-photos.result': '照片會顯示在卡片和圖庫中，第一張在所有地方都會作為縮圖。',
  'help.guide.entry-photos.tip.1':
    '影片也能用同樣的方式加入紀錄：支援 mp4、m4v、webm 或 mov，最大 500 MB，並以原檔儲存，不會經過轉檔。',
  'help.guide.entry-photos.tip.2': '來自 iPhone 的 HEIC 檔案會在上傳時轉成 JPEG，同時會移除其中的 GPS 和相機中繼資料。',
  // suggestions
  'help.guide.suggestions.title': '採用或忽略建議',
  'help.guide.suggestions.goal': '把旅行中的地點變成條目，並略過你不打算寫的地點。',
  'help.guide.suggestions.step.1':
    '建議是一張有虛線邊框、帶「新增條目」按鈕的卡片，內容是已連結旅行中的某個地點，位於它原本規劃的那一天。點擊它會開啟編輯器，地點和日期都已經填好。',
  'help.guide.suggestions.step.2':
    '點擊不打算使用的卡片右端的 ×。卡片會從時間軸移除但不會被刪除，旅行同步也不會再次建議它。',
  'help.guide.suggestions.step.3':
    '改變心意了嗎？點擊標題中的 ⋯ 開啟「旅程設定」：「找回已忽略的建議」會顯示被忽略的數量，並一次全部找回。',
  'help.guide.suggestions.result': '時間軸只保留你打算寫的內容；標題列中的眼睛圖示可在你閱讀時一次隱藏所有建議。',
  'help.guide.suggestions.tip.1': '排在兩天的地點，會在這兩天各產生一則建議。',
  'help.guide.suggestions.tip.2': '建議不會計入統計，只有已寫好的條目才算。',
  // add-on-day
  'help.guide.add-on-day.title': '在較早的日期新增紀錄',
  'help.guide.add-on-day.goal': '補寫已經過去的某一天，之後不用再修改日期。',
  'help.guide.add-on-day.step.1': '點擊那一天標題右端的 +。',
  'help.guide.add-on-day.step.2': '編輯器會開啟，日期已經設定好。像平常一樣撰寫，然後「儲存」。',
  'help.guide.add-on-day.result': '條目會立即加到正確的那一天。',
  'help.guide.add-on-day.tip.1': '要更改一天之內的順序，將游標移到條目上：它左側會出現「上移」和「下移」。',
  // pros-cons
  'help.guide.pros-cons.title': '加上評價',
  'help.guide.pros-cons.goal': '用這一天哪裡很棒、哪裡不太好來作總結。',
  'help.guide.pros-cons.step.1':
    '在編輯器中，故事下方有「優缺點」。在「優點」或「缺點」中輸入一項，再用「再新增一個」輸入下一項。',
  'help.guide.pros-cons.step.2': '儲存。在卡片上，「顯示更多」會把故事和評語展開成兩個簡短的列表。',
  'help.guide.pros-cons.result': '讚與倒讚會顯示在故事下方，讓你一眼就能看到。',
  'help.guide.pros-cons.tip.1': '如果旅程不需要評價，可以在「旅程設定」的「紀錄欄位」中關閉這個區塊。',
  // search-journey
  'help.guide.search-journey.title': '在很長的日誌中找東西',
  'help.guide.search-journey.goal': '不必翻過好幾週的條目，就能找到想看的那一則。',
  'help.guide.search-journey.step.1':
    '在工具列的「在這段旅程中搜尋」中輸入文字。時間線會隨著輸入即時篩選，搜尋範圍包括標題、故事、地點和標籤，不分大小寫，也不分重音符號。',
  'help.guide.search-journey.step.2':
    '如果想直接跳到某一天，請點擊時間軸底部、位於「回到頂部」和「跳到最後一則」之間的天數。',
  'help.guide.search-journey.result':
    '時間軸會捲動到你選的日期或條目，地圖也會移到那裡。在你清空搜尋框之前，只會顯示符合的條目。',
  'help.guide.search-journey.tip.1': '進行中的旅程會停在今天那一頁，所以目前這一頁通常已經看得到。',
  'help.guide.search-journey.tip.2': '標題中的眼睛會隱藏建議，這樣就只會看到你自己寫的條目。',
  // gallery-map
  'help.guide.gallery-map.title': '瀏覽圖庫和地圖',
  'help.guide.gallery-map.goal': '用圖片瀏覽整段旅程，也能在地圖上看到所有地點。',
  'help.guide.gallery-map.step.1':
    '在工具列切換到「圖庫」。這裡會顯示每則紀錄的所有照片，以及直接上傳到圖庫的圖片。點選任一張即可在燈箱中開啟。',
  'help.guide.gallery-map.step.2':
    '右側的「上傳」會把圖片加入相簿；如果已連接 Immich 或 Synology，會有一個以該相簿命名的按鈕，可從那裡挑選圖片。',
  'help.guide.gallery-map.result': '圖釘帶有當天的顏色，並按日期順序以細虛線相連；地圖頂部的圖層列可切換繪製的內容。',
  'help.guide.gallery-map.tip.1':
    '旅行的 GPX 軌跡隨地圖的「計畫」圖層一起顯示，以虛線繪製；「旅程設定」中的「顯示所有行程的 GPX 軌跡」可將它們關閉。',
  'help.guide.gallery-map.tip.2': '當「圖庫」和「地圖」都已分享時，圖庫中帶有位置的照片也會顯示在公開地圖上。',
  // entry-fields
  'help.guide.entry-fields.title': '關閉條目欄位',
  'help.guide.entry-fields.goal': '讓編輯器只顯示這段旅程用得到的欄位。',
  'help.guide.entry-fields.step.1': '點擊標題右上角的 ⋯ 開啟「旅程設定」。',
  'help.guide.entry-fields.step.2': '在「紀錄欄位」下，關閉「心情」、「天氣」或「優點與不足」。',
  'help.guide.entry-fields.result':
    '編輯器不會再顯示這些欄位，但你寫過的內容都不會遺失：重新開啟欄位後，儲存的內容就會再次顯示。分享出去的旅程也會隱藏相同的欄位。',
  'help.guide.entry-fields.tip.1': '開關是依旅程分別設定的，所以出差和度假可以有不同的設定。',
  // link-trip
  'help.guide.link-trip.title': '連結另一趟旅行',
  'help.guide.link-trip.goal': '把第二趟旅行的地點以建議的形式加入日誌。',
  'help.guide.link-trip.step.1': '點擊標題區右上角的 ⋯，開啟「旅程設定」。',
  'help.guide.link-trip.step.2': '在「已同步的旅行」下，點擊「新增旅行」。',
  'help.guide.link-trip.step.3': '依名稱或目的地搜尋旅行，然後點擊它旁邊的「連結」。',
  'help.guide.link-trip.result':
    '旅行的地點會作為建議出現在時間軸的對應日期上，並與其 GPX 軌跡一起加入地圖的「計畫」圖層。',
  'help.guide.link-trip.tip.1': '已連結旅行旁的垃圾桶會在詢問後取消連結，你寫的條目會保留。',
  'help.guide.link-trip.tip.2': '有日期的條目只會計算一次，不論有幾趟旅行涵蓋那一天。',
  // share-public
  'help.guide.share-public.title': '公開分享旅程',
  'help.guide.share-public.goal': '提供沒有 TREK 帳號的人一個唯讀連結。',
  'help.guide.share-public.step.1': '點擊標題區的 ⋯ 開啟「旅程設定」，再捲動到「公開分享」。',
  'help.guide.share-public.step.2': '點選「建立分享連結」。',
  'help.guide.share-public.step.3':
    '選擇訪客能看到的內容：「時間線」、「圖庫」和「地圖」。在「地圖」下，「行程計畫」會加入已規劃的地點和路線，「記錄的路線」則加入你記錄過的日子的路線。「複製」會把連結複製到剪貼簿。',
  'help.guide.share-public.result':
    '拿到連結的人只能看到已開啟的部分，其他內容都看不到。你在「紀錄欄位」中關閉的欄位，在那裡也會保持隱藏。',
  'help.guide.share-public.tip.1':
    '只有「圖庫」和「地圖」都開啟時，照片才會出現在公開地圖上。如果「地圖」關閉，伺服器在送出照片之前會先移除其座標。',
  'help.guide.share-public.tip.2': '點擊「複製」旁邊的「刪除連結」即可停止分享。',
  // contributors
  'help.guide.contributors.title': '一起撰寫',
  'help.guide.contributors.goal': '讓其他旅伴加入他們自己的紀錄和照片。',
  'help.guide.contributors.step.1': '用標題列的 ⋯ 開啟「旅程設定」，找到「貢獻者」。',
  'help.guide.contributors.step.2': '點選「邀請貢獻者」，並用名稱或電子郵件搜尋使用者。',
  'help.guide.contributors.step.3': '選擇「檢視者」或「編輯者」，然後點擊「邀請」。',
  'help.guide.contributors.result':
    '旅程會出現在對方的清單中，他們寫的條目也會顯示他們的名字。要移除貢獻者，請點選他們旁邊的 ×。',
  'help.guide.contributors.tip.1': '貢獻者是給這個 TREK 上的使用者。其他人請使用公開連結。',
  // studio
  'help.guide.studio.title': '把旅程排成相簿',
  'help.guide.studio.goal': '把日誌變成可以印刷的頁面。',
  'help.guide.studio.step.1': '點選頁首的「Studio」。設計器會疊在旅程上方開啟。',
  'help.guide.studio.step.2': '要返回時，點選頂部列最右端的 ×，就會回到你原本所在的位置。',
  'help.guide.studio.result':
    '側欄和面板在左側，跨頁在工作區上，屬性在右側。自動排版會根據你的條目產生整本相簿。匯出會產生可直接印刷的 PDF。',
  'help.guide.studio.tip.1': 'Studio 需要寬度至少 1024 px 的視窗，手機上無法使用。',
  'help.guide.studio.tip.2': '相簿的存取權限和旅程相同：能閱讀旅程的人都能開啟相簿，能編輯旅程的人都能儲存相簿。',
  // archive-journey
  'help.guide.archive-journey.title': '封存或刪除旅程',
  'help.guide.archive-journey.goal': '封存已結束的旅程，或永久刪除旅程。',
  'help.guide.archive-journey.step.1': '點擊標題右上角的 ⋯ 開啟「旅程設定」。',
  'help.guide.archive-journey.step.2':
    '在底部，「封存旅程」會結束並將旅程標示為已封存，「還原旅程」則會把它還原。「刪除」經過確認後，會連同所有紀錄和照片一起移除。',
  'help.guide.archive-journey.result': '封存的旅程仍然可以閱讀和分享，只是不會再停在今天這一天開啟。',
  'help.guide.archive-journey.tip.1': '刪除後無法復原，但不會影響旅程曾連結的旅行。',
  'help.guide.archive-journey.tip.2': '封面、名稱和副標題在同一個對話框的頂部。',
  'help.guide.journey-status.title': '設定旅程的狀態',
  'help.guide.journey-status.goal': '自己把旅程標為草稿、進行中或已完成，不依照所屬旅行的日期。',
  'help.guide.journey-status.step.1': '點擊旅程標題右上角的 ⋯ 開啟「旅程設定」。',
  'help.guide.journey-status.step.2': '在「狀態」下選擇「草稿」、「即時」或「已完成」。選擇後會立即儲存。',
  'help.guide.journey-status.result':
    '旅程會保留你選擇的狀態：「草稿」和「已完成」會以徽章顯示在卡片和標題上，「即時」旅程則占據旅程列表頂部的橫幅。',
  'help.guide.journey-status.tip.1':
    '選擇「自動」後，會再次依照已連結旅行的日期判斷。沒有連結旅行時，自動狀態的旅程會維持草稿。',
  'help.guide.journey-status.tip.2': '手動設定的狀態會一直維持到你再次更改，即使旅行日期有變動也一樣。',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio 會把旅程排成可以印刷的相簿。它疊在日誌上方開啟：左側是側欄和面板，中間是你正在處理的跨頁，右側是它的屬性。自動排版會根據你的條目產生第一版草稿，主題為相簿配上顏色和字體，助理可以和你一起設計頁面。之後你可以移動、裁切、重新設定任何內容的樣式，每一步都能復原。',
  'help.ctx.journey-studio.bullet.1':
    '頂部列：左側是旅程的封面和名稱。右側依序是還有誰在這本相簿裡以及是否已儲存、頁面格式、復原、重做、貼上、自動排版、助理、說明、匯出，以及關閉 Studio 的按鈕。',
  'help.ctx.journey-studio.bullet.2':
    '左側側欄：頁面、內容（旅程的照片和條目）、版面、元素（文字、形狀、線條、相框、圖示和貼紙）、旅程（由旅程產生的數字、地圖、國家和標記），下方獨立分開的是主題和圖層。',
  'help.ctx.journey-studio.bullet.3':
    '工作區：目前的跨頁，附有出血和安全邊界，下方的縮放列有符合檢視、書本檢視和下載這個跨頁。',
  'help.ctx.journey-studio.bullet.4':
    '右側屬性：所選元素的一切設定，從位置、尺寸和裁切，到顏色、效果、堆疊順序和鎖定。沒有選取任何物件時，這裡會顯示頁面背景、主題、頁碼和文件。',
  'help.ctx.journey-studio.bullet.5':
    '相簿的編排和印刷的書一樣：封面、與封面內頁空白面相對的單獨第一頁、各個跨頁、單獨的最後一頁和封底。頁碼從第一頁開始計算，並依顯示的樣子印出。',
  'help.ctx.journey-studio.bullet.6':
    '多人可以同時設計：每個人都能看到其他人的游標和名字。如果你儲存的版本已被別人修改過，TREK 會顯示衝突，而不會覆蓋對方的成果。',
  'help.ctx.journey-studio.bullet.7':
    '主題：整本相簿統一的外觀，包括紙張、墨色、三種強調色、字體和裝飾圖案。與主題連結的元素會在你更換主題時跟著改變。',
  'help.ctx.journey-studio.bullet.8':
    '助理：管理員設定好 AI 之後，頂部列的對話氣泡會開啟助理，和你一起排頁面、寫圖說、調整整本相簿的風格。它做的每一項變更都是一個可復原的步驟。',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': '自動排出整本相簿',
  'help.guide.studio-auto-layout.goal': '只要點一下，就能根據日誌的條目和照片得到完整的第一版草稿。',
  'help.guide.studio-auto-layout.step.1': '點選頂部列的 Auto layout。',
  'help.guide.studio-auto-layout.step.2':
    '選擇「整本書」：會取代所有頁面，但保留你的標題和頁面設定。「本頁」則只重建畫面上的這個跨頁，而且只有在由紀錄產生的跨頁上才能使用。',
  'help.guide.studio-auto-layout.step.3': '瀏覽 Pages 側欄。如果你比較喜歡先前的版本，Undo 可以還原整個版面。',
  'help.guide.studio-auto-layout.result':
    '每則條目一個跨頁，依序排好，照片、標題和文字都已經放好。在你編輯元素之前，每個元素都會與條目連動，並隨條目更新。',
  'help.guide.studio-auto-layout.tip.1': '這兩個項目都屬於一般的復原步驟，所以放心試，不滿意就復原。',
  'help.guide.studio-auto-layout.tip.2':
    '當 Auto layout 把元素連結到條目時，你修改該條目，元素就會跟著更新。一旦你在「Properties」中修改元素，連結就會中斷。',
  // studio-pages
  'help.guide.studio-pages.title': '新增、移動和刪除跨頁',
  'help.guide.studio-pages.goal': '一頁一頁地編輯這本書。',
  'help.guide.studio-pages.step.1':
    '在側欄開啟頁面。縮圖會依序顯示整本相簿：封面、第一頁、各個跨頁、最後一頁和封底。第一頁和最後一頁會畫在各自封面內頁空白面的旁邊，就像裝訂好的書翻開時那樣。',
  'help.guide.studio-pages.step.2':
    '底部的「新增頁面」會在最後一頁之前加入新的跨頁。兩張縮圖之間的 + 則會在該位置插入一個。',
  'help.guide.studio-pages.step.3':
    '把游標移到縮圖上，就會看到它的操作：「前移」、「後移」、「複製頁面」和「刪除頁面」。點選縮圖，就能在工作區開啟那個跨頁。',
  'help.guide.studio-pages.result': '封面、第一頁、最後一頁和封底都會留在原位，新的跨頁一律加在它們之間。',
  'help.guide.studio-pages.tip.1': '頂端列的「Book view」會以紙張的形式顯示整本相簿，也就是裝訂後的樣子。',
  'help.guide.studio-pages.tip.2': '頁碼要在不選取任何物件的狀態下，到 Properties 的「文件」下開啟。',
  // studio-layouts
  'help.guide.studio-layouts.title': '為跨頁套用版面',
  'help.guide.studio-layouts.goal': '為跨頁套用現成的照片框和文字框排版。',
  'help.guide.studio-layouts.step.1':
    '在側欄開啟版面。設計好的頁面排在最前：套用了相簿主題的整套封面和跨頁，樣式標籤可以把它們篩選成某一種風格。我的版面和內建排在它們下方，使用同樣的格狀排列。',
  'help.guide.studio-layouts.step.2':
    '點選其中一個。工作區中的跨頁會套用這個版型的框，你原有的照片和文字也會放進這些框裡。',
  'help.guide.studio-layouts.result': '空框是內容的預留位置：從 Content 把照片拖到框上，或使用 Add to this page。',
  'help.guide.studio-my-layouts.title': '把頁面儲存為你自己的版面',
  'help.guide.studio-my-layouts.goal': '重複使用你在相簿其他頁面排好的版面。',
  'help.guide.studio-my-layouts.step.1': '把一個頁面排成你喜歡的樣子，然後在側欄開啟版面。',
  'help.guide.studio-my-layouts.step.2': '點選我的版面下的將此頁面儲存為版面。這個頁面會以卡片的形式出現在清單中。',
  'help.guide.studio-my-layouts.tip.1':
    '在另一個頁面點選你的版面，就能用同樣的方式排好那一頁，並保留它自己的照片和文字。',
  'help.guide.studio-my-layouts.result':
    '你的版面會隨相簿一起儲存，並出現在同類型的頁面上：封面的版面用於封面，跨頁的版面用於跨頁。',
  'help.guide.studio-layouts.tip.1': '套用版型和其他操作一樣，都是一個可以復原的步驟。',
  // studio-content
  'help.guide.studio-content.title': '把照片和條目放到頁面上',
  'help.guide.studio-content.goal': '把旅程本身的照片和紀錄加到跨頁上。',
  'help.guide.studio-content.step.1': '在側欄開啟 Content。Photos 會列出旅程的所有照片，Entries 則列出帶有文字的紀錄。',
  'help.guide.studio-content.step.2':
    '把照片拖到跨頁或空白相框上，或點擊照片下方的「新增至此頁」。「上傳照片」會加入尚未在旅程中的圖片，「來自 Immich」或「來自 Synology」則從已連接的相簿中挑選。',
  'help.guide.studio-content.step.3':
    '在紀錄下方，Title、Story 和 Place 會把該段文字作為文字元素放到頁面上。日期和座標會加為標記，紀錄的照片也列在那裡。',
  'help.guide.studio-content.result': '拖進去的照片會成為照片元素。在你編輯之前，文字會一直與條目連動。',
  'help.guide.studio-theme.title': '為整本相簿選一個主題',
  'help.guide.studio-theme.goal': '一次設定整本相簿的顏色和字體。',
  'help.guide.studio-theme.step.1': '在側欄開啟主題。每張卡片把一個主題顯示成小小的頁面：它的紙張、字體和三種強調色。',
  'help.guide.studio-theme.step.2':
    '點選一個主題試用。在卡片下方，你可以修改它的配色、選擇其他字體，並挑選裝飾圖案和裝飾元素。',
  'help.guide.studio-theme.step.3': '點選套用到整本書，或是點選套用到此頁，只作用於螢幕上的這個跨頁。',
  'help.guide.studio-theme.tip.1':
    '與主題連結的元素會採用主題的顏色和字體，並在你更換主題時跟著改變。同時重新設定未連結元素的樣式會先連結其餘的元素。',
  'help.guide.studio-theme.tip.2': '從照片取色會根據旅程的圖片產生一組配色。',
  'help.guide.studio-theme.result': '相簿中所有已連結的顏色和字體會同時改變，套用主題是一個可復原的步驟。',
  'help.guide.studio-content.tip.1': '「內容」頂端的搜尋框會同時篩選下面兩份清單。',
  'help.guide.studio-content.tip.2': '把桌面上的檔案拖到工作區時，TREK 會一次完成上傳和放置。',
  // studio-elements
  'help.guide.studio-elements.title': '加入文字、形狀、圖示和貼紙',
  'help.guide.studio-elements.goal': '除了照片和故事之外，再為跨頁加上裝飾。',
  'help.guide.studio-elements.step.1': '在側欄開啟元素。可加入的內容分成六個分頁：文字、形狀、線條、相框、圖示和貼紙。',
  'help.guide.studio-elements.step.2':
    '點選一種文字樣式或設計好的標題、形狀、線條、空相框、圖示或貼紙。每一項都會放在跨頁中央，之後你可以再移動它。',
  'help.guide.studio-elements.result': '雙擊文字元素即可輸入文字；「Properties」裡有字型、字重、字級、間距和對齊方式。',
  'help.guide.studio-stickers.title': '用貼紙裝飾',
  'help.guide.studio-stickers.goal': '加入插畫，從地標和美食到動物和箭頭都有。',
  'help.guide.studio-stickers.step.1': '在側欄開啟元素，選擇貼紙。',
  'help.guide.studio-stickers.step.2': '搜尋一個詞或瀏覽各個貨架，然後點選一張貼紙，把它放到跨頁上。',
  'help.guide.studio-stickers.tip.1': '選取貼紙後，屬性可以為它的各個部分重新上色，也可以鏡射翻轉。',
  'help.guide.studio-stickers.result': '貼紙是向量繪製的，所以無論放多大都保持清晰。',
  'help.guide.studio-elements.tip.1': '相框是空的照片位置，之後再放入照片就行。',
  // studio-travel
  'help.guide.studio-travel.title': '加入地圖、數字、國家和標記',
  'help.guide.studio-travel.goal': '把旅程本身變成頁面上設計好的元素。',
  'help.guide.studio-travel.step.1': '在側欄開啟旅程。可加入的內容分成四個分頁：數字、地圖、國家和標記。',
  'help.guide.studio-travel.step.2':
    '每張卡片都用旅程自己的數據，依主題的顏色展示元素：彙整可以是海報、車票、路牌或里程表，地圖可以帶編號的停留點或裁成某個國家，國家可以是郵戳、明信片或圖釘，日期或距離可以是印章、標籤或緞帶。',
  'help.guide.studio-travel.step.3': '點選一張卡片。元素會放在跨頁中央，之後你可以移動它並調整大小。',
  'help.guide.studio-travel.result':
    '元素會出現在跨頁上。屬性可以改變它的外觀，旅程有變動時，每個數字、地圖和國家都會跟著更新。',
  'help.guide.studio-text-effects.title': '為文字加入效果',
  'help.guide.studio-text-effects.goal': '為標題加上外框、陰影、弧形，或是用圖案填滿文字。',
  'help.guide.studio-text-effects.step.1': '點選頁面上的文字元素將其選取。',
  'help.guide.studio-text-effects.step.2':
    '在屬性中開啟效果，加入外框、陰影或醒目提示，也可以用漸層或圖案填滿文字。位置可以把文字行彎成弧形，並讓它符合文字框。',
  'help.guide.studio-text-effects.tip.1': '符合會縮小文字直到放進文字框，所以很長的標題也不會溢出。',
  'help.guide.studio-text-effects.result': '效果會和文字一起繪製，印刷出來和螢幕上一樣。',
  'help.guide.studio-background.title': '變更頁面背景',
  'help.guide.studio-background.goal': '為頁面塗上純色、漸層或圖案，或是在底下鋪一張照片。',
  'help.guide.studio-background.step.1': '點選頁面的空白處，讓任何物件都不被選取。頁面背景位於屬性的最上方。',
  'help.guide.studio-background.step.2': '選擇紙張、純色、漸層或圖案並挑一個顏色，或在照片作背景下點選一張照片。',
  'help.guide.studio-background.tip.1': '套用到所有頁面會讓整本相簿的每一頁都使用同一個背景。',
  'help.guide.studio-background.result': '背景會延伸到出血區，所以會印到頁面邊緣。',
  'help.guide.studio-layers.title': '用圖層排列、隱藏和鎖定',
  'help.guide.studio-layers.goal': '依堆疊順序查看跨頁上的所有內容，並在那裡操作。',
  'help.guide.studio-layers.step.1': '在側欄開啟圖層。清單最上方是頁面的最前面。',
  'help.guide.studio-layers.step.2':
    '拖曳一列來調整堆疊順序，用眼睛圖示隱藏元素，用鎖定讓它固定不動。選取多個後群組，就能一起移動。',
  'help.guide.studio-layers.tip.1': '連按兩下一列，可以為元素取一個自己的名稱。',
  'help.guide.studio-layers.tip.2': '隱藏的元素不會出現在 PDF 中。',
  'help.guide.studio-layers.result': '內容很多的頁面也容易編輯，已經完成的部分不會被誤移動。',
  'help.guide.studio-travel.tip.1':
    '在地圖下，停留點列出路線上的每一個停留點。關閉某一個，就能把它從地圖和數字中排除，例如你的出發機場。',
  'help.guide.studio-travel.tip.2':
    '國家地圖只會顯示該國的停留點，所以即使旅程以一趟長途飛行開始，這個國家也會鋪滿整個頁面。',
  // studio-properties
  'help.guide.studio-properties.title': '編輯選取的內容',
  'help.guide.studio-properties.goal': '用檢視面板移動、裁切、調整樣式和排列元素的上下層順序。',
  'help.guide.studio-properties.step.1': '點選跨頁上的元素。四周會出現調整大小和旋轉的控制點，拖曳元素即可移動。',
  'help.guide.studio-properties.step.2':
    '右側的 Properties 會顯示所選物件的設定：位置和大小、Crop（焦點會決定哪些部分留在框內）、Fill 或 Fit、Look 濾鏡、Corner 圓角半徑、「相框」樣式、堆疊順序和 Lock。',
  'help.guide.studio-properties.step.3': '「複製」和 Delete 位於檢視器頂部。頂部列的 Undo 可以復原其中任何一項變更。',
  'help.guide.studio-properties.result':
    '鎖定的元素無法在頁面上選取或移動，這樣你處理其他元素時，就不會不小心弄亂已完成的版面。',
  'help.guide.studio-properties.tip.1': '按住 Shift 點選可以選取多個元素，檢視器會同時編輯它們。',
  'help.guide.studio-properties.tip.2':
    '如果你編輯了自動版面放上去的元素，它就不再與條目連動，之後條目的變更也不會套用到它。',
  // studio-format
  'help.guide.studio-format.title': '選擇頁面格式',
  'help.guide.studio-format.goal': '在排版之前，先設定相簿的印刷尺寸。',
  'help.guide.studio-format.step.1': '點選頂部列中編輯工具旁邊的頁面格式，那裡會顯示格式的名稱和形狀。',
  'help.guide.studio-format.step.2':
    '選擇 Square 21 × 21 cm、Square 30 × 30 cm、A4 或 A5 的橫向或直向，也可以用公釐輸入自訂的寬度和高度。出血和安全邊界設定在下方。',
  'help.guide.studio-format.result': '所有跨頁都會以這個尺寸繪製，預設出血 3 mm，安全邊界 5 mm。',
  'help.guide.studio-format.tip.1': '請先更改格式，再執行 Auto layout。Auto layout 會採用執行當下設定的格式。',
  'help.guide.studio-format.tip.2': '請向印刷廠詢問出血與安全範圍的數值，再填入這裡。',
  // studio-export
  'help.guide.studio-export.title': '把相簿匯出為 PDF',
  'help.guide.studio-export.goal': '取得可直接印刷的檔案，或是用來在螢幕上閱讀的檔案。',
  'help.guide.studio-export.step.1': '點選頂部列的 Export。',
  'help.guide.studio-export.step.2':
    '選擇「單頁」，會依閱讀順序每張紙一頁，這是印刷廠需要的格式；或選擇「跨頁」，像翻開書那樣一次兩頁。「裁切標記」會在每一邊加上出血，並標示裁切位置。',
  'help.guide.studio-export.step.3': '點選「列印檢視」。瀏覽器會開啟這些頁面，選擇「儲存為 PDF」即可產生檔案。',
  'help.guide.studio-export.result': '會得到一份 PDF，張數與對話框顯示的一致，頁面格式則是你設定的格式。',
  'help.guide.studio-export.tip.1': '和 Studio 本身一樣，PDF 只能在桌面版產生。',
  'help.guide.studio-export.tip.2':
    '要打樣的話，請匯出不含裁切標記的「跨頁」；要交給印刷廠，則匯出含裁切標記的「單頁」。',
  // studio-spread-file
  'help.guide.studio-spread-file.title': '在另一本相簿中重複使用跨頁',
  'help.guide.studio-spread-file.goal': '把你喜歡的設計從一段旅程的書複製到另一段旅程。',
  'help.guide.studio-spread-file.step.1':
    '將跨頁放在工作區後，點選縮放列右端的「下載這個跨頁」。檔案裡只有設計，不包含照片。',
  'help.guide.studio-spread-file.step.2': '在另一本書中開啟 Pages，點選「新增頁面」旁邊的「匯入」，然後選擇檔案。',
  'help.guide.studio-spread-file.result': '跨頁會連同其中的框和文字樣式一起匯入。再把新旅程的照片放進這些框裡即可。',
  'help.guide.studio-spread-file.tip.1': '如果檔案不是跨頁設計，TREK 會拒絕匯入並說明原因。',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': '設定',
  'help.ctx.settings.summary':
    '你的個人設定，左側邊欄中每個主題各有一個分頁。大多數開關一切換就立即生效。有「儲存」按鈕的表單，則要點擊「儲存」才會儲存。這裡的任何設定都不會影響其他人的 TREK。',
  'help.ctx.settings.bullet.1':
    '左側邊欄有「顯示」、「外觀」、「地圖」、「通知」、「整合」、「離線」和「帳戶」。有外掛啟用後才會出現「外掛」，除非營運者隱藏了「關於」，否則它也會顯示。版本顯示在底部。',
  'help.ctx.settings.bullet.2':
    '預設會先開啟「顯示」，內有語言、地點名稱的語言、單位、時間格式、每週起始日和顯示貨幣，以及旅行地圖的行為。「外觀」則包含主題、顏色、易讀性、文字大小和儀表板小工具。',
  'help.ctx.settings.bullet.3':
    '「地圖」選擇引擎及其樣式；「通知」決定哪些事件傳送到哪個管道；「整合」連接相簿服務、AirTrail、Dawarich 和 wanderer，並管理 API 金鑰和 MCP；「離線」決定這台裝置保留哪些內容。',
  'help.ctx.settings.bullet.4': '「帳戶」包含你的個人資料、密碼、雙因素認證、Passkey，以及刪除帳號的選項。',
  'help.ctx.settings-display.title': '顯示',
  'help.ctx.settings-display.summary':
    'TREK 開啟時的狀態、使用的語言和單位，以及旅行地圖和預訂的行為。每次變更都會立即套用。',
  'help.ctx.settings-display.bullet.1':
    '「啟動」：「啟動頁面」開啟時進入「儀表板」或「進行中的旅行」；選擇「進行中的旅行」時，「啟動分頁」可選擇該旅行開啟時顯示的分頁。',
  'help.ctx.settings-display.bullet.2':
    '語言與地區：「顯示貨幣」（或選擇「行程貨幣」表示不換算）、「語言」、「地點名稱」、「溫度單位」、「距離單位」、「時間格式」和「每週開始於」。',
  'help.ctx.settings-display.bullet.3':
    '旅行與地圖：「開啟地點方式」、「每日標題中日期在前」、「預訂路線標籤」、「一律顯示訂票路線」、「未規劃地點使用精簡標記」、「在地圖上探索地點」、「模糊預訂程式碼」和「從住宿地點最佳化路線」。',
  'help.ctx.settings-appearance.title': '外觀',
  'help.ctx.settings-appearance.summary':
    'TREK 在這個帳號上的外觀：淺色或深色、強調色、玻璃效果和動態效果、文字大小，以及儀表板要顯示哪些小工具。所有設定都會即時生效，並套用到你登入的每台裝置。',
  'help.ctx.settings-appearance.bullet.1':
    '主題：「顏色模式」的「淺色」、「深色」或「自動」，以及配色方案。選擇「自訂」後，可以分別為淺色和深色模式設定你自己的強調色，並附有對比度檢查。',
  'help.ctx.settings-appearance.bullet.2':
    '標示為「實驗性」的易讀性設定：透明度、減少動態效果、密度，以及「文字大小」，其中「全部」有一個滑桿，「大」、「中」、「普通」和「小」各有一個。',
  'help.ctx.settings-appearance.bullet.3':
    '儀表板小工具：桌面版（主視覺下方、右側邊欄）和手機版（主視覺下方、頁面底部）各有獨立的開關。',
  'help.ctx.settings-appearance.bullet.4': '卡片下方的「恢復預設」會讓整個分頁恢復原狀。',
  'help.ctx.settings-map.title': '地圖',
  'help.ctx.settings-map.summary':
    '旅行規劃器和日誌地圖由哪個引擎繪製，以及使用什麼樣式。Leaflet 是傳統的點陣地圖，Mapbox GL 搭配你自己的權杖可加入 3D 建築和地形，MapLibre GL 則無需權杖就能繪製 OpenFreeMap 向量圖磚。Atlas 一律使用 Leaflet。',
  'help.ctx.settings-map.bullet.1':
    '「地圖提供商」：Leaflet、Mapbox GL（「實驗性」）或 MapLibre GL，每個選項都有一行說明它是什麼。',
  'help.ctx.settings-map.bullet.2':
    'Leaflet 使用「地圖模板」和「CARTO API 金鑰」；兩種 GL 引擎使用「地圖樣式」，Mapbox GL 另外需要「Mapbox 存取權杖」。',
  'help.ctx.settings-map.bullet.3':
    '僅限 Mapbox GL：「3D 建築和地形」和「高畫質模式」。「儲存地圖」上方有即時預覽，按下「儲存地圖」才會儲存你的選擇。',
  'help.ctx.settings-notifications.title': '通知',
  'help.ctx.settings-notifications.summary':
    'TREK 在應用程式之外如何聯絡你。頂部的表格每個事件一列、每個管道一欄，用來決定什麼通知送到哪裡。表格下方是 Webhook、ntfy、此裝置上的推播，以及外掛管道的卡片。',
  'help.ctx.settings-notifications.bullet.1':
    '通知：依管道開啟或關閉每個事件。出現鎖頭，表示管理員已對所有人關閉該項。',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook URL：可填 Discord、Slack 或自訂的 Webhook，附「測試」和「儲存」。',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy：「Ntfy 主題」、選填的「Ntfy 伺服器 URL」和存取權杖，附「測試」和「儲存」。',
  'help.ctx.settings-notifications.bullet.4':
    '「此裝置上的推播通知」：「為此裝置開啟」只涵蓋這個瀏覽器；「傳送測試」可試用。外掛管道在設定完成之前會顯示「前往設定」。',
  'help.ctx.settings-integrations.title': '整合',
  'help.ctx.settings-integrations.summary':
    '所有從外部連接到 TREK 的項目：日誌用的相簿服務、航班用的 AirTrail、記錄你實際去向的 Dawarich、路線用的 wanderer、供其他軟體使用的唯讀 API 金鑰，以及供 AI 客戶端使用的 MCP。與其他服務的連線，必須由管理員開啟後才會顯示。',
  'help.ctx.settings-integrations.bullet.1':
    'Immich 和 Synology Photos、AirTrail、Dawarich 和 wanderer：每張卡片都有位址和金鑰、「儲存」和「測試連線」，以及「已連線」或「未連線」徽章。',
  'help.ctx.settings-integrations.bullet.2':
    '「API 金鑰」：公開 API 的唯讀金鑰，每把金鑰只限於你選定的範圍，並附有可複製的「端點」。',
  'help.ctx.settings-integrations.bullet.3':
    '「MCP 配置」：包含「MCP 端點」，以及「OAuth 2.1 客戶端」下你已註冊的客戶端、可複製的「客戶端配置」，還有附「撤銷」的「活躍的 OAuth 工作階段」。',
  'help.ctx.settings-integrations.bullet.4':
    '「API 令牌」：連接 MCP 的舊方式，標示為「已棄用」，請改用「OAuth 2.1 客戶端」。',
  'help.ctx.settings-offline.title': '離線',
  'help.ctx.settings-offline.summary':
    'TREK 會在這台裝置上儲存哪些內容，讓旅行在沒有網路時也能開啟；以及離線時所做的變更與其他地方的變更衝突時，會發生什麼事。',
  'help.ctx.settings-offline.bullet.1':
    '「離線模式」：「強制離線模式」會先下載所有內容，之後只使用快取運作，並把你的變更排入佇列。',
  'help.ctx.settings-offline.bullet.2':
    '「準備離線使用」：「下載以供離線使用」會取得旅行資料、文件和地圖圖磚，「立即重新同步」則可手動再同步一次。',
  'help.ctx.settings-offline.bullet.3':
    '「要離線儲存哪些內容」：「離線儲存地圖瓦片」，以及每趟旅行各一個開關。已結束的旅行要由你開啟才會儲存。',
  'help.ctx.settings-offline.bullet.4':
    '「同步衝突」只在有變更發生衝突時才會出現，附有「用我的」、「保留對方的」和「發生衝突時」。「離線快取」會統計旅行以及待處理或失敗的變更，附有「重試」、「捨棄」和「清除快取」。',
  'help.ctx.settings-account.title': '帳戶',
  'help.ctx.settings-account.summary':
    '你在這個 TREK 上的身份和登入方式：大頭貼、使用者名稱和電子郵件、密碼、雙因素身份驗證和 Passkey。「刪除賬戶」位於「帳戶」卡片的底部。',
  'help.ctx.settings-account.bullet.1':
    '帳戶：圖片上的相機圖示可上傳圖片，紅色垃圾桶可移除；「使用者名稱」和「郵箱」透過「儲存資料」儲存。',
  'help.ctx.settings-account.bullet.2':
    '「修改密碼」：目前密碼、兩次輸入新密碼（輸入時會逐項勾選規則），然後點擊「更新密碼」。如果這個 TREK 僅透過 SSO 登入，就沒有這張卡片。',
  'help.ctx.settings-account.bullet.3':
    '使用驗證器應用程式和備用代碼的「雙因素認證 (2FA)」，以及不用密碼就能登入的「Passkey」。',
  'help.ctx.settings-account.bullet.4': '「刪除賬戶」位於「帳戶」卡片底部的左側，需經確認。唯一的管理員無法刪除自己。',
  // language-region
  'help.guide.language-region.title': '設定語言、單位和貨幣',
  'help.guide.language-region.goal': '用你的語言使用 TREK，並採用你所在地區的格式。',
  'help.guide.language-region.step.1':
    '在「語言與地區」下，從那一排標籤中選擇「語言」。TREK 會立刻切換，並套用到你登入的所有裝置。',
  'help.guide.language-region.step.2':
    '「地點名稱」設定地點搜尋、建議和位址使用的語言，「與 App 相同」則跟隨介面語言。',
  'help.guide.language-region.result':
    '日期、距離和金額都以你習慣的方式顯示。在「費用」中，金額只是以你的顯示貨幣呈現，輸入時的內容保持不變。',
  'help.guide.language-region.tip.1': '「行程貨幣」會讓每趟旅行保持自己的貨幣，不做換算。',
  'help.guide.language-region.tip.2': '語言也會決定 Vacay 和日記中的星期與月份名稱。',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': '調整旅行地圖和每日標題',
  'help.guide.travel-map-prefs.goal': '決定旅行地圖顯示哪些內容，以及每日標題的呈現方式，並套用到每一趟旅行。',
  'help.guide.travel-map-prefs.step.1':
    '在「旅行與地圖」中，「開啟地點方式」決定導航按鈕直接開啟哪個地圖 App，選「每次詢問」則每次都讓你選擇 App。「每日標題中日期在前」會讓每天的標題以日曆日期開頭。',
  'help.guide.travel-map-prefs.step.2':
    '「一律顯示訂票路線」會在地圖上畫出每個航班、火車和其他預訂，「預訂路線標籤」會在兩端標上車站或機場名稱。「未規劃地點使用精簡標記」會縮小尚未排入某一天的地點，讓已規劃的停靠點更容易辨認。',
  'help.guide.travel-map-prefs.result': '旅行地圖在每趟旅行中都會使用這些設定，直到你再次更改。',
  'help.guide.travel-map-prefs.tip.1': '這些設定是依帳號而不是依旅行。共用旅行的每位成員，看到的是各自的選擇。',
  'help.guide.travel-map-prefs.tip.2': '管理員可以為所有人設定預設值；你在這裡切換的設定只適用於你自己。',
  // startup
  'help.guide.startup.title': '選擇 TREK 開啟時顯示的頁面',
  'help.guide.startup.goal': '讓 TREK 開啟時直接進入你最常用的頁面，而不是每次都先進儀表板。',
  'help.guide.startup.step.1': '在「顯示」頂部的「啟動」下，將「啟動頁面」設為「儀表板」或「進行中的旅行」。',
  'help.guide.startup.step.2': '選擇「進行中的旅行」後，會出現「啟動分頁」：選擇該旅行開啟時顯示的分頁。',
  'help.guide.startup.result': '下次開啟 TREK 時，它會直接進入那裡。',
  'help.guide.startup.tip.1':
    '「進行中的旅行」是指今天正在進行的旅行，或接下來最近的一趟，也就是儀表板最上方顯示的那一趟。',
  // theme-scheme
  'help.guide.theme-scheme.title': '設定主題和強調色',
  'help.guide.theme-scheme.goal': '讓 TREK 使用淺色、深色或跟隨裝置的主題，並搭配你喜歡的顏色。',
  'help.guide.theme-scheme.step.1':
    '在「主題」下，將「顏色模式」設為「淺色」、「深色」或「自動」。「自動」會跟隨你的裝置。',
  'help.guide.theme-scheme.step.2':
    '選擇一個「Color scheme」：「Default」、「High contrast」、「Indigo」、「Teal」、「Rose」、「Amber」、「Violet」或「Custom」。',
  'help.guide.theme-scheme.step.3':
    '選擇「自訂」後，挑選其中一個色點，或分別為「淺色」和「深色」設定你自己的強調色。旁邊的標籤會顯示對比良好或對比偏低。',
  'help.guide.theme-scheme.result': '按鈕、連結和醒目標示都會統一使用強調色，在你登入的每台裝置上都一樣。',
  'help.guide.theme-scheme.tip.1': '導覽列上也有淺色與深色的快速切換開關，兩者設定的是同一個主題。',
  'help.guide.theme-scheme.tip.2': '如果預設配色不好閱讀，請選擇「High contrast」配色。',
  // readability
  'help.guide.readability.title': '調整可讀性和文字大小',
  'help.guide.readability.goal': '減少玻璃效果和動態效果，增加留白或放大文字。',
  'help.guide.readability.step.1':
    '在「Readability」下，「Transparency」可把玻璃質感面板改成實色面板，「Reduce motion」可把動畫減到最少，「Density」則可選擇「Comfortable」或「Compact」。',
  'help.guide.readability.step.2':
    '「文字大小」：拖曳「全部」可一次縮放所有文字，也可以分別設定「大」、「中」、「普通」和「小」。每個大小都有範例，拖曳時就能看到效果。',
  'help.guide.readability.result': '整個應用程式會立即套用變更，包括地圖面板和日誌。',
  'help.guide.readability.tip.1':
    '當你的裝置設為減少動態效果時，TREK 的部分區域已經會減少動畫。「減少動態效果」則會減少其餘區域的動畫。',
  'help.guide.readability.tip.2': '文字大小是透過排版層級套用的，所以內容不會被截掉；放不下的文字會自動換行。',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': '選擇儀表板小工具',
  'help.guide.dashboard-widgets.goal': '只顯示你會用到的小工具，電腦版和手機版可以分開設定。',
  'help.guide.dashboard-widgets.step.1':
    '在「儀表板小工具」下，「桌面」列出「主視覺下方」和「右側邊欄」的小工具。關閉「右側邊欄」會隱藏整個欄位並讓儀表板置中，它的小工具會呈淡色，直到你再次開啟。',
  'help.guide.dashboard-widgets.step.2': '手機有自己的開關，「主視覺下方」和「頁面底部」，用於你手機上的儀表板。',
  'help.guide.dashboard-widgets.result': '儀表板會立即更新。如果關閉右側欄，儀表板會置中。',
  'help.guide.dashboard-widgets.tip.1': '擴充套件的小工具，必須在管理員開啟該擴充套件時才會出現。',
  'help.guide.dashboard-widgets.tip.2': '儀表板本身會依裝置記住你選的格狀或清單檢視，以及排序方式。',
  // map-provider
  'help.guide.map-provider.title': '選擇地圖引擎和樣式',
  'help.guide.map-provider.goal': '在經典地圖、向量圖磚和 Mapbox 的 3D 地圖之間切換。',
  'help.guide.map-provider.step.1':
    '在「地圖提供商」下，選擇 Leaflet 可使用傳統 2D 地圖和任何點陣圖磚，Mapbox GL 可使用帶 3D 建築和地形的向量圖磚，MapLibre GL 則使用無需權杖的 OpenFreeMap 向量圖磚。',
  'help.guide.map-provider.step.2':
    '為 Leaflet 選擇「地圖模板」，或為 GL 引擎選擇「地圖樣式」，也可以貼上你自己的 URL。Mapbox GL 需要「Mapbox 存取權杖」，CARTO 模板需要「CARTO API 金鑰」；每個欄位下方的連結會帶你到取得的地方。',
  'help.guide.map-provider.step.3':
    '使用 Mapbox GL 時，開啟「3D 建築和地形」，裝置效能夠好的話也可以開啟「高畫質模式」。確認預覽效果後，點擊「儲存地圖」。',
  'help.guide.map-provider.result': '旅行規劃器和日誌的地圖會使用你選擇的引擎。Atlas 一律使用 Leaflet。',
  'help.guide.map-provider.tip.1': '沒有填入權杖時，Mapbox GL 會改用 Leaflet，不會顯示空白地圖。',
  'help.guide.map-provider.tip.2': '你離線儲存的地圖圖磚，來自下載當時使用中的提供商。',
  // notification-channels
  'help.guide.notification-channels.title': '設定通知的接收方式',
  'help.guide.notification-channels.goal': '在手機或其他工具上接收旅行提醒和協作事件。',
  'help.guide.notification-channels.step.1':
    '若要使用 Webhook，請貼上 Discord、Slack 或自訂的 Webhook URL，點擊「測試」，然後點擊「儲存」。',
  'help.guide.notification-channels.step.2':
    '若使用 ntfy，請填寫「Ntfy 主題」，如果你自己架設了伺服器，再加上自己的「Ntfy 伺服器 URL」和存取權杖。「測試」會立即傳送訊息；「儲存」會保存設定。',
  'help.guide.notification-channels.step.3':
    '在頂部的「通知」卡片中，依管道開啟或關閉每個事件。鎖頭表示管理員已對所有人關閉它。外掛管道在設定完成之前會顯示「前往設定」；「傳送測試」可試用。',
  'help.guide.notification-channels.result':
    '事件會透過你為它開啟的管道送出；「應用程式內通知」欄決定導覽列的鈴鐺顯示什麼。',
  'help.guide.notification-channels.tip.1': '旅行本身的「提醒」（出發前幾天提醒）要在該旅行的編輯表單中設定。',
  'help.guide.notification-channels.tip.2': '管理員可以為所有人預先填入預設的 ntfy 伺服器，但主題仍由你自己選擇。',
  // photo-providers
  'help.guide.photo-providers.title': '連接相片庫',
  'help.guide.photo-providers.goal': '讓日誌從 Immich 或 Synology Photos 載入當天的照片。',
  'help.guide.photo-providers.step.1':
    '在「整合」下，找到 Immich 或 Synology Photos 的卡片，填入它要求的資料：Immich 需要「伺服器 URL」和「API 金鑰」，Synology Photos 則需要「使用者名稱」和「密碼」。Immich 也可以在你上傳旅程照片時，把照片複製到 Immich 相簿中。',
  'help.guide.photo-providers.step.2': '點擊「測試連線」，再點擊「儲存」。徽章會變成「已連線」。',
  'help.guide.photo-providers.result':
    '條目編輯器的「External photos」分頁會在已連接的相片庫中搜尋該條目當天的照片，並優先顯示離條目位置最近的。',
  'help.guide.photo-providers.tip.1': '這個連線只屬於你的帳號：旅程的其他成員要各自連接自己的相簿。',
  'help.guide.photo-providers.tip.2': '照片沒有 GPS 資料的提供商仍然可以使用，這時清單會依時間排序。',
  // api-keys
  'help.guide.api-keys.title': '建立 API 金鑰',
  'help.guide.api-keys.goal': '讓其他軟體透過公開 API 讀取你的旅行。',
  'help.guide.api-keys.step.1':
    '在「API 金鑰」下，點擊「建立金鑰」，為它取一個說明用途的名稱，並在「這組金鑰可讀取的內容」下只保留它需要的範圍。點擊「建立」。',
  'help.guide.api-keys.step.2':
    '從「API 金鑰已建立」複製金鑰：它只會顯示一次。點擊「完成」；要呼叫的「端點」位於列表下方。',
  'help.guide.api-keys.result':
    '持有金鑰的軟體可以讀取你選定的範圍，但絕不會更改任何內容。列表會顯示每把金鑰的建立時間和最後使用時間，垃圾桶則會刪除它。',
  'help.guide.api-keys.tip.1': '每個工具各用一把金鑰，這樣撤銷其中一把時，就不會影響其他工具。',
  'help.guide.api-keys.tip.2': '如果要讓 AI 客戶端修改內容，請改用搭配 OAuth 的 MCP。API 金鑰只能讀取。',
  // mcp-oauth
  'help.guide.mcp-oauth.title': '透過 MCP 連接 AI 助理',
  'help.guide.mcp-oauth.goal': '讓 Claude、IDE 或其他 MCP 用戶端存取你的旅行。',
  'help.guide.mcp-oauth.step.1': '在「MCP 配置」下，複製要給你的客戶端使用的「MCP 端點」。',
  'help.guide.mcp-oauth.step.2':
    '在「OAuth 2.1 客戶端」下，點擊「新增客戶端」，選擇快速預設（例如 Claude Desktop 或 Cursor），或自行填寫「應用程式名稱」、「重新導向 URI」和「允許的授權範圍」。沒有瀏覽器的伺服器請選擇「機器」客戶端。點擊「註冊客戶端」並複製「客戶端密鑰」，它只會顯示一次。',
  'help.guide.mcp-oauth.step.3':
    '每個客戶端都有「輪換密鑰」和「刪除客戶端」；「活躍的 OAuth 工作階段」列出目前登入的項目，並附「撤銷」。「客戶端配置」會展開一段現成的設定片段，適用於接受 JSON 的客戶端。',
  'help.guide.mcp-oauth.result': '用戶端能以你的身分，讀取並修改其權限範圍允許的內容，每個動作都會記在你的名下。',
  'help.guide.mcp-oauth.tip.1': '「權限範圍」會限制用戶端能做的事：在用戶端需要更多權限之前，只給它讀取範圍就好。',
  'help.guide.mcp-oauth.tip.2': '管理員可以為整個實例關閉 MCP，關閉後就不會顯示這個區塊。',
  // offline-prepare
  'help.guide.offline-prepare.title': '讓旅行可離線使用',
  'help.guide.offline-prepare.goal': '在斷線之前，先把旅行和地圖存到這台裝置上。',
  'help.guide.offline-prepare.step.1':
    '在「要離線儲存哪些內容」下，保持「離線儲存地圖瓦片」開啟，並開啟你想放在這台裝置上的旅行。已結束的旅行只有在你開啟後才會儲存。',
  'help.guide.offline-prepare.step.2':
    '回到頂部，在「準備離線使用」下，點擊「下載以供離線使用」。它會取得旅行資料、文件和地圖圖磚，並說明儲存了多少趟旅行。',
  'help.guide.offline-prepare.step.3':
    '「強制離線模式」會再下載一次，然後只使用這台裝置運作，讓你在出發前確認一切都在。',
  'help.guide.offline-prepare.result': '即使沒有網路，旅行也能開啟。你所做的變更會先存進佇列，等重新連線後再送出。',
  'help.guide.offline-prepare.tip.1': '地圖圖磚佔用的空間最大，關閉它們就只會保留旅行資料和文件。',
  'help.guide.offline-prepare.tip.2': '從瀏覽器把 TREK 安裝成應用程式，離線啟動會最順暢。',
  // offline-conflicts
  'help.guide.offline-conflicts.title': '同步衝突時決定保留哪個版本',
  'help.guide.offline-conflicts.goal': '選擇 TREK 要如何處理離線變更與其他地方變更之間的衝突。',
  'help.guide.offline-conflicts.step.1':
    '如果你離線時做的變更與較新的變更衝突，「同步衝突」會出現在「離線」頁面靠近頂部的位置。針對每項變更，點擊「用我的」或「保留對方的」。',
  'help.guide.offline-conflicts.step.2':
    '在同一張卡片中，「發生衝突時」決定下次如何處理：「每次都詢問我」、「一律保留我的版本」或「一律保留伺服器版本」。',
  'help.guide.offline-conflicts.result':
    '選擇「每次都詢問我」時，衝突會停留在「同步衝突」中等你選擇；其他兩種則會自動解決。',
  'help.guide.offline-conflicts.tip.1': '「清除快取」只會移除這台裝置上的副本，伺服器上的內容不會有任何變動。',
  // profile
  'help.guide.profile.title': '修改你的個人資料',
  'help.guide.profile.goal': '更新你的姓名、電子郵件和大頭貼。',
  'help.guide.profile.step.1':
    '在「帳戶」卡片中，點擊圖片上的相機可上傳圖片；紅色垃圾桶可再次移除，並帶回你的姓名首字。',
  'help.guide.profile.step.2': '在圖片下方編輯「使用者名稱」和「郵箱」。',
  'help.guide.profile.result': '你的名字和大頭貼會立即在所有地方更新，包括你共享的旅行。',
  'help.guide.profile.tip.1': '透過 SSO 連結的帳號會顯示 SSO 徽章，以及與其供應商「已關聯」。',
  // password
  'help.guide.password.title': '更改密碼',
  'help.guide.password.goal': '設定新密碼。',
  'help.guide.password.step.1':
    '在「修改密碼」下，輸入「當前密碼」，再輸入「新密碼」，並在「確認新密碼」中重複輸入一次。下方的列表會在你輸入時，逐條標示已符合的規則。',
  'help.guide.password.step.2': '點選「更新密碼」。',
  'help.guide.password.result':
    '新密碼會立即生效。其他所有裝置都會登出，你的 MCP API 令牌會被刪除，OAuth 客戶端也必須重新登入，只有這台裝置維持登入狀態。',
  'help.guide.password.tip.1': '如果這個 TREK 僅透過 SSO 登入，就沒有 TREK 密碼，也沒有「修改密碼」卡片。',
  // mfa
  'help.guide.mfa.title': '開啟雙因素驗證',
  'help.guide.mfa.goal': '用驗證器應用程式產生的驗證碼來保護帳號。',
  'help.guide.mfa.step.1': '在「雙因素認證 (2FA)」下點選「設定身份驗證器」。',
  'help.guide.mfa.step.2':
    '用驗證器應用程式掃描 QR code，或手動輸入密鑰，再輸入應用程式顯示的六位數驗證碼，然後點選「啟用 2FA」。',
  'help.guide.mfa.step.3':
    '用「複製程式碼」、「下載 TXT」或「列印 / PDF」保存備用碼，然後點擊「確定」。每組碼只能使用一次，適合手邊沒有手機的時候。',
  'help.guide.mfa.result': '之後每次登入，輸入密碼後還會要求輸入驗證碼。',
  'help.guide.mfa.tip.1': '「停用 2FA」需要你的密碼，以及目前的驗證碼或一組未使用的備用碼。',
  'help.guide.mfa.tip.2': '管理員可以要求所有人都使用 2FA，這時就無法在這裡關閉。',
  // passkeys
  'help.guide.passkeys.title': '使用 Passkey 登入',
  'help.guide.passkeys.goal': '用裝置的指紋、臉部辨識或 PIN 碼取代密碼。',
  'help.guide.passkeys.step.1':
    '在「Passkey」下，點擊「新增 Passkey」，確認你目前的密碼，並為它取一個說明是哪台裝置的名稱，然後依照裝置的提示操作。',
  'help.guide.passkeys.step.2':
    '每個 Passkey 都會顯示它是「已同步」還是綁定於「本裝置」，以及上次使用的時間。「重新命名」可更改名稱，刪除按鈕則會在你輸入密碼後將它移除。',
  'help.guide.passkeys.result': '登入頁面會提供 Passkey 登入。你仍然可以用密碼登入。',
  'help.guide.passkeys.tip.1': 'Passkey 存放在裝置或其密碼管理工具中，所以每台裝置都要各新增一組 Passkey。',
  'help.guide.passkeys.tip.2':
    '要等管理員開啟後，才會出現 Passkey。如果伺服器還沒有設定 WebAuthn 網域，卡片會顯示說明，而不會提供「新增 Passkey」。',
  // delete-account
  'help.guide.delete-account.title': '刪除你的帳號',
  'help.guide.delete-account.goal': '刪除你的帳號，以及只屬於你的資料。',
  'help.guide.delete-account.step.1': '在「帳戶」卡片中，點擊底部左側的「刪除賬戶」，然後點擊「永久刪除」。',
  'help.guide.delete-account.result': '你的帳戶連同你擁有的旅行、地點和檔案都會被刪除。由其他人擁有的旅行則會保留。',
  'help.guide.delete-account.tip.1': '如果你是唯一的管理員，TREK 會回應「無法刪除」：請先將另一位使用者升為管理員。',
  'help.guide.delete-account.tip.2': '刪除後無法復原。確認之前，請先匯出你想保留的內容。',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': '管理員',
  'help.ctx.admin.summary':
    '每個人的 TREK 背後的執行個體：誰可以登入以及如何登入、開啟了什麼、檔案存放在哪裡、伺服器如何聯繫使用者，以及如何備份。只有管理員看得到這個頁面。側邊欄把分頁分組在「使用者」、「設定」、「整合」和「維護」下，每個分頁都是獨立的畫面。',
  'help.ctx.admin.bullet.1':
    '標題右側會統計使用者、旅行、地點和檔案的數量。其下方，當有較新的 TREK 版本發布時，會出現「有可用更新」橫幅。',
  'help.ctx.admin.bullet.2': '「使用者」和「用戶預設設定」：帳戶、邀請連結和權限，以及新帳戶一開始使用的設定和地圖。',
  'help.ctx.admin.bullet.3':
    '「配置」、「設定」、「擴充套件」、「外掛」和「儲存」：行李範本、分類和學校假期；登入、Passkey、2FA、API 金鑰和搜尋服務；功能模組；第三方外掛；上傳檔案的存放位置。',
  'help.ctx.admin.bullet.4':
    '「通知」、「MCP 存取」和 GitHub：使用者可選用的管道及其預設值、AI 客戶端的權杖和工作階段，以及版本歷史。',
  'help.ctx.admin.bullet.5': '「備份」和「審計日誌」：手動與排程備份，以及與安全相關的事件記錄。',
  'help.ctx.admin-users.title': '使用者',
  'help.ctx.admin-users.summary':
    '這個 TREK 上的所有帳號及其角色、電子郵件和上次活動時間，讓人在封閉執行個體上註冊的邀請連結，以及誰可以在旅行中做什麼。',
  'help.ctx.admin-users.bullet.1':
    '表格欄位有使用者、郵箱、角色、建立時間和「最後活動」，每列附有「編輯使用者」和「刪除使用者」。頭像上的綠點代表此人目前在線，你自己那一列標有「（你）」。',
  'help.ctx.admin-users.bullet.2': '「使用者」卡片右上角的「建立使用者」可手動新增帳戶，並由你交付密碼。',
  'help.ctx.admin-users.bullet.3':
    '下方的「邀請連結」：有使用次數上限和到期時間的註冊連結，如果你願意，還可以指定新使用者到達時加入的旅行。',
  'help.ctx.admin-users.bullet.4':
    '底部的「許可權設定」：每個操作由誰可以執行（「所有人」、「旅行成員」、「旅行所有者」或「僅管理員」），用卡片標題中的「儲存」保存。',
  'help.ctx.admin-defaults.title': '用戶預設設定',
  'help.ctx.admin-defaults.summary':
    '新帳戶一開始的設定，這樣就沒有人需要先自己設定：顏色模式、單位、時間格式、每週起始日、顯示貨幣和模糊的預訂程式碼，還有地圖、其金鑰和路線規劃伺服器。',
  'help.ctx.admin-defaults.bullet.1':
    '左側是「用戶預設設定」：「顏色模式」、「溫度單位」、「距離單位」、「時間格式」、「每週開始於」、「顯示貨幣」和「模糊預訂程式碼」。',
  'help.ctx.admin-defaults.bullet.2':
    '右側的地圖設定：「地圖模板」、「共用的 CARTO 金鑰」、「自建路徑規劃服務」和「自建 Valhalla 執行個體」，接著是預覽，然後是「地圖引擎」，以及「地圖樣式」、「共用的 Mapbox 權杖」、「3D 建築物與地形」和「高品質模式」。',
  'help.ctx.admin-config.title': '配置',
  'help.ctx.admin-config.summary':
    '實例上所有旅行共用的設定：行李模板、地點和收藏用的分類組合，以及 Vacay 使用的學校假期目錄。',
  'help.ctx.admin-config.bullet.1': '「打包模板」：有名稱的分類與物品清單，旅行的行李清單可以從這裡開始。',
  'help.ctx.admin-config.bullet.2':
    '分類：TREK 各處使用的分類的名稱、圖示和顏色，從地點檢視器到「收藏」都會用到，每個分類都在附預覽的對話方塊中編輯。',
  'help.ctx.admin-config.bullet.3': '「學校假期」：各國家和地區及其假期期間的目錄，所有人都可以在 Vacay 中選用。',
  'help.ctx.admin-settings.title': '設定',
  'help.ctx.admin-settings.summary':
    '人們如何進入，以及伺服器可以連到哪些服務。左側：驗證方式、「Passkey 登入」、「要求雙因素身份驗證（2FA）」和「單點登入 (OIDC)」。右側：「允許的檔案型別」以及「API 金鑰」，含搜尋和交通服務提供者。「危險區域」位於底部。',
  'help.ctx.admin-settings.bullet.1':
    '驗證方式：密碼登入、密碼註冊，設定 OIDC 之後還有 SSO 登入和 SSO 自動建立帳戶。「要求雙因素身份驗證（2FA）」有自己的卡片。',
  'help.ctx.admin-settings.bullet.2':
    '「Passkey 登入」：「啟用 Passkey 登入」、「Relying Party ID（網域）」和「允許的來源」。「單點登入 (OIDC)」：「顯示名稱」、「頒發者 URL」、選填的「Discovery URL（選填）」、「客戶端 ID」和「客戶端密鑰」。',
  'help.ctx.admin-settings.bullet.3':
    '「API 金鑰」：最前面是 TREK Places API，不需要金鑰。其下依序是「Google Maps API 金鑰」（附「測試」和「該金鑰的用途」）、Unsplash 和高德地圖的金鑰，卡片底部只有一個「儲存」。',
  'help.ctx.admin-settings.bullet.4':
    '「公共運輸資料來源」和「地點搜尋來源」決定由誰負責大眾運輸和地點搜尋。「地點搜尋紀錄」會記下最後選了哪個結果。「允許的檔案型別」則限制可上傳的檔案。',
  'help.ctx.admin-addons.title': '擴充套件',
  'help.ctx.admin-addons.summary':
    'TREK 的功能模組，每個都有開關：行李、費用、文件、Vacay、Atlas、Collab、旅程、收藏、公路旅行、MCP、AirTrail、Dawarich 和 AI 解析。關閉後，導覽項目、路由和 API 會對所有人移除。',
  'help.ctx.admin-addons.bullet.1': '每個擴充套件一個圖塊，附有開關；如果有選項，圖塊下方還有對應的子列。',
  'help.ctx.admin-addons.bullet.2':
    '相片提供者和文件提供者也會以圖塊的形式列在這裡，所以可以向使用者提供 Immich 或 Synology。',
  'help.ctx.admin-addons.bullet.3': '「行李追蹤」在圖塊下方有自己的開關。',
  'help.ctx.admin-plugins.title': '外掛',
  'help.ctx.admin-plugins.summary':
    '第三方外掛會在 TREK 旁以獨立程序執行，每個外掛只擁有安裝時申請的權限。你可以從目錄安裝、上傳套件，或在開發外掛時連結資料夾。',
  'help.ctx.admin-plugins.bullet.1':
    '「已安裝」和「探索」，附有「搜尋外掛…」以及「型別」、「狀態」和「排序」篩選器。每一列顯示版本、「已審核」、「已簽署」或「未簽署」、外掛可存取的內容、一個開關和一個 ⋯ 選單。',
  'help.ctx.admin-plugins.bullet.2':
    '卡片標題列中的兩個圖示：「上傳外掛」接受 .zip、.tgz 或 .tar.gz（也可以把 .zip 拖放到頁面上）；「重新掃描」會載入為開發而連結的外掛資料夾。',
  'help.ctx.admin-plugins.bullet.3': '每個外掛的「允許的主機」：外掛可以呼叫的位址，因為對外連線預設為封鎖。',
  'help.ctx.admin-storage.title': '儲存',
  'help.ctx.admin-storage.summary':
    '上傳檔案存放的位置：本機磁碟或 S3 儲存貯體，也可以另外複製到其他後端。每個上傳類別都可以放到不同的後端，在你點擊「儲存變更」之前不會有任何改變。',
  'help.ctx.admin-storage.bullet.1': '頂部的「健康」：鏡像目標的寫入失敗記錄，或「未記錄任何複本失敗。」',
  'help.ctx.admin-storage.bullet.2':
    '「後端」：名稱、型別、用量和「鏡像」目標，附「測試」、「編輯」和「移除」。「立即計算」會統計已儲存的內容；由環境變數定義的後端是唯讀的。',
  'help.ctx.admin-storage.bullet.3':
    '「分類」：行程文件、旅程照片、封面、大頭貼、地點圖片、照片快取和備份，每一項都指派給一個後端。',
  'help.ctx.admin-notifications.title': '通知',
  'help.ctx.admin-notifications.summary':
    '這個實例向使用者提供的通知管道，以及你身為管理員會收到的通知管道。使用者在「設定」中自行選擇主題和 URL；你則決定有哪些管道，並設定電子郵件。',
  'help.ctx.admin-notifications.bullet.1':
    '「電子郵件 (SMTP)」、Webhook、Ntfy 和「Web 推播」各有一個開關，用來決定是否把該管道開放給使用者；電子郵件還需要填寫伺服器設定。「應用程式內通知」一律開啟。',
  'help.ctx.admin-notifications.bullet.2': '「行程提醒」：伺服器是否要在旅行開始前傳送提醒。',
  'help.ctx.admin-notifications.bullet.3':
    '「管理員 Webhook」、「管理員 Ntfy」和「通知」卡片：決定管理員事件（「有新版本可用」、「儲存複本故障」、「划槳區域申請」）送到哪裡，每個都有測試按鈕。',
  'help.ctx.admin-mcp-tokens.title': 'MCP 存取',
  'help.ctx.admin-mcp-tokens.summary':
    '所有使用者的 AI 用戶端在這個 TREK 上持有的每個權杖和 OAuth 工作階段。你可以撤銷其中任何一個。',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '「OAuth 工作階段」：客戶端、授予的權限範圍、擁有者和日期，垃圾桶圖示可撤銷它。',
  'help.ctx.admin-mcp-tokens.bullet.2': '「API 令牌」：名稱、擁有者、「建立時間」和「最後使用」，垃圾桶圖示可刪除它。',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'TREK 的最新動態：來自 GitHub 的發布歷史，以及是否有比你的版本更新的版本。更新本身在應用程式之外、在主機上進行。',
  'help.ctx.admin-github.bullet.1':
    '「版本歷史」以時間軸列出各版本及其說明；最新的標有「最新」，預發行版本標示「預釋出」，GitHub 會開啟發布頁面。',
  'help.ctx.admin-github.bullet.2':
    '有較新的版本時，頁面標題下方會出現「有可用更新」。「如何更新」會顯示 Docker 的指令，或其他安裝方式的更新指南。',
  'help.ctx.admin-backup.title': '備份',
  'help.ctx.admin-backup.summary':
    '資料庫與上傳檔案的完整備份，可手動建立或排程自動建立，存放在伺服器上，並能下載成單一檔案。要還原備份，請使用「恢復」。',
  'help.ctx.admin-backup.bullet.1':
    '「資料備份」：卡片頂部的「建立備份」和「上傳備份」，以及備份列表，每筆備份都有「下載」、「恢復」和用來刪除的垃圾桶圖示。',
  'help.ctx.admin-backup.bullet.2':
    '「上傳備份」可從另一個執行個體或更早的日子製作的檔案還原，確認方式與「恢復」相同。',
  'help.ctx.admin-backup.bullet.3':
    '「自動備份」：開或關、「間隔」、「執行時間」和星期幾，以及「自動刪除舊備份」（從「1 天」到「永久保留」），按「儲存」後套用。',
  'help.ctx.admin-audit.title': '審計日誌',
  'help.ctx.admin-audit.summary':
    '安全相關與管理事件的日誌：登入與失敗紀錄、MFA 變更、使用者與設定變更、備份與還原。僅供閱讀，最新的在最前面。',
  'help.ctx.admin-audit.bullet.1': '每個事件一列，包含時間、使用者、動作、資源、IP 和詳細資料。',
  'help.ctx.admin-audit.bullet.2':
    '卡片標題中的「重新整理」會重新載入；標題旁的徽章顯示已載入數量與總數，「載入更多」可繼續往前翻。',
  // create-user
  'help.guide.create-user.title': '建立使用者',
  'help.guide.create-user.goal': '不用邀請，直接手動新增帳號。',
  'help.guide.create-user.step.1': '點擊「使用者」卡片右上角的「建立使用者」。',
  'help.guide.create-user.step.2':
    '輸入「使用者名稱」、「郵箱」和「密碼」；密碼下方的核對清單會逐項勾選必須符合的規則。選擇「角色」：使用者或管理員。',
  'help.guide.create-user.step.3': '點選「建立使用者」。',
  'help.guide.create-user.result': '帳號會出現在表格中，而且可以馬上登入。請透過你信任的管道把密碼告訴對方。',
  'help.guide.create-user.tip.1': '如果希望對方自己設定密碼，改用邀請連結會比較好。',
  'help.guide.create-user.tip.2':
    '「管理員」看得到這個頁面，也可以做任何事。「使用者」在旅行中能做什麼，則由下方的「許可權設定」決定。',
  // edit-user
  'help.guide.edit-user.title': '更改使用者的資料或密碼',
  'help.guide.edit-user.goal': '重新命名使用者、升級或降級其角色，或在他們忘記密碼後協助他們重新登入。',
  'help.guide.edit-user.step.1': '點擊使用者那一列的鉛筆（「編輯使用者」）。對話方塊頂部會顯示該帳戶的電子郵件。',
  'help.guide.edit-user.step.2':
    '修改「使用者名稱」、「郵箱」或「角色」，或輸入「新密碼」（留空則保留目前密碼），然後點擊「儲存」。底部的「重設 Passkey」在你確認後會移除該帳戶的所有 Passkey。',
  'help.guide.edit-user.result': '變更會立即生效。新密碼也會讓此人在所有裝置上登出，所以舊的工作階段會失效。',
  'help.guide.edit-user.tip.1': '只要你還是最後一位管理員，就無法移除自己的管理員角色。',
  'help.guide.edit-user.tip.2': '重設 Passkey 不會影響密碼，對方可以到「設定」的「帳戶」新增新的 Passkey。',
  // invite-links
  'help.guide.invite-links.title': '用連結邀請他人',
  'help.guide.invite-links.goal': '讓某人在封閉的實例上註冊，也可以視需要將對方加入某趟旅行。',
  'help.guide.invite-links.step.1': '點擊「邀請連結」卡片右上角的「建立連結」。',
  'help.guide.invite-links.step.2':
    '選擇「最大使用次數」（1× 到 5×，或 ∞）和「有效期」（1d 到 14d，或 ∞），可在「加入行程（選填）」下選填一趟旅行，然後點擊「建立並複製」。',
  'help.guide.invite-links.step.3':
    '把連結傳出去。每一列會顯示已使用次數、到期時間、可加入的旅行和建立者，旁邊標有「有效」、「已過期」或「已用完」。「複製連結」可再次複製，垃圾桶則會刪除連結。',
  'help.guide.invite-links.result': '開啟連結的人會用自己的密碼註冊。如果選擇了旅行，對方會立即加入。',
  'help.guide.invite-links.tip.1': '即使在「設定」中關閉了「Password Registration」，邀請連結仍然有效。',
  'help.guide.invite-links.tip.2': '只能使用一次、有效期限又短的連結，是邀請單一個人時最安全的預設選項。',
  // delete-user
  'help.guide.delete-user.title': '刪除使用者',
  'help.guide.delete-user.goal': '移除一個帳號及其擁有的所有內容。',
  'help.guide.delete-user.step.1': '點擊使用者那一列的垃圾桶（「刪除使用者」），再點擊「刪除」確認。',
  'help.guide.delete-user.result':
    '該帳戶連同它擁有的所有旅行和旅程都會被刪除，即使旅行曾與其他人共享也一樣。它只是成員的旅行，則留給原本的擁有者。',
  'help.guide.delete-user.tip.1': '刪除後無法復原。如果不確定，請先備份。',
  'help.guide.delete-user.tip.2': '你自己的那一列垃圾桶無法使用：你不能刪除自己。必須由另一位管理員來做。',
  // permissions
  'help.guide.permissions.title': '決定誰可以做什麼',
  'help.guide.permissions.goal': '依操作設定，在這個 TREK 上哪些角色可以執行。',
  'help.guide.permissions.step.1':
    '在「許可權設定」下，找到所屬群組中的操作，例如「旅行管理」下的「刪除行程」，並選擇誰可以執行：「所有人」、「旅行成員」、「旅行所有者」或「僅管理員」。被修改的列會標示為「已自定義」。',
  'help.guide.permissions.step.2':
    '點擊卡片右上角的「儲存」。「恢復預設」會讓每一列恢復內建的等級；之後同樣要點擊「儲存」。',
  'help.guide.permissions.result': '規則會一次套用到所有旅行。權限層級不足的人，將不會看到相關的按鈕和選單。',
  'help.guide.permissions.tip.1': '「旅行所有者」是指建立該旅行的人；管理員永遠可以執行所有操作。',
  'help.guide.permissions.tip.2': '每個操作各佔一列，所以你可以讓成員規劃地點和天數，但把刪除旅行留給旅行的所有者。',
  // default-map
  'help.guide.default-map.title': '為新使用者設定地圖預設值',
  'help.guide.default-map.goal': '讓每個新帳號不需要個人權杖，也有一張可用的地圖。',
  'help.guide.default-map.step.1':
    '在「地圖」下，選擇「地圖模板」或貼上圖磚 URL，若使用 CARTO 圖磚，請輸入「共用的 CARTO 金鑰」。下方的預覽會顯示結果。',
  'help.guide.default-map.step.2':
    '往下選擇「地圖引擎」：「標準（免費）」、「Mapbox（3D）」或 MapLibre (OpenFreeMap)。選擇 Mapbox 或 MapLibre 時，請再選「地圖樣式」。選擇 Mapbox 時，另外填入「共用的 Mapbox 權杖」，並決定是否開啟「3D 建築物與地形」和「高品質模式」。',
  'help.guide.default-map.result': '新帳號一開始會使用這些設定；已在「設定」中設定自己地圖的人，則保留自己的設定。',
  'help.guide.default-map.tip.1': '在這裡填入的權杖或金鑰，會由所有沒有自己金鑰的人共用，所以請留意用量額度。',
  'help.guide.default-map.tip.2': '從未更動過地圖分頁的既有帳號，也會套用這些預設值。',
  // packing-templates
  'help.guide.packing-templates.title': '建立行李範本',
  'help.guide.packing-templates.goal': '讓旅行有一份現成的行李清單可以開始，而不是從空白開始。',
  'help.guide.packing-templates.step.1': '點選「新建模板」，輸入名稱，再按勾號確認。',
  'help.guide.packing-templates.step.2':
    '點擊範本名稱開啟它，然後點擊「新增分類」。分類頂部的 + 可新增物品，物品只需要填名稱。',
  'help.guide.packing-templates.step.3':
    '所有內容都會隨操作自動儲存。鉛筆用來重新命名範本、分類或項目。垃圾桶會立即刪除項目，刪除範本或分類時會先詢問，因為其中的所有內容也會一併刪除。',
  'help.guide.packing-templates.result':
    '每趟旅行的行李清單都能使用這個模板。套用時會複製其中的物品，所以旅行中可以隨意修改。',
  'help.guide.packing-templates.tip.1': '依旅行類型（海灘、城市、健行）各建一個模板，比一份超長的清單好用。',
  'help.guide.packing-templates.tip.2': '刪除模板不會影響已經套用過它的旅行。',
  'help.guide.packing-templates.tip.3':
    '旅行行李清單上的「儲存為範本」會建立一個範本，包含每個物品的重量、數量和行李袋。它們會顯示在這裡的物品旁邊，套用範本時也會以相同方式填入行李袋。',
  // categories
  'help.guide.categories.title': '管理分類',
  'help.guide.categories.goal': '決定地點和收藏可以使用哪些分類，以及它們的外觀。',
  'help.guide.categories.step.1':
    '點擊「新分類」，在對話方塊的標題行輸入名稱，選擇「圖示」和「顏色」，並查看「預覽」。點擊「建立」。',
  'help.guide.categories.step.2':
    '在列表中，鉛筆（「編輯」）會開啟分類，「更新」會儲存。垃圾桶（「刪除」）在你確認後會將它移除。',
  'help.guide.categories.result': '這組分類會同時套用到所有地方：地點檢視器、地圖圖釘、收藏和篩選器。',
  'help.guide.categories.tip.1': '地點記錄的是分類 ID，所以重新命名分類後，每個地點上的分類名稱都會一起更新。',
  'help.guide.categories.tip.2':
    '刪除分類後，原本屬於該分類的地點就會變成沒有分類。如果這很重要，請先把它們改指派到其他分類。',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': '手動維護學校假期',
  'help.guide.school-holiday-catalog.goal': '維護某個國家或地區的學校假期，讓所有人都可以在 Vacay 中選用。',
  'help.guide.school-holiday-catalog.step.1':
    '在「學校假期」下選擇國家，或點擊 +（「新增國家」），輸入國家和「國家代碼（如 US）」後儲存。「新增地區」可加入其中各自有獨立日期的每個地區。',
  'help.guide.school-holiday-catalog.step.2':
    '點擊某個地區，開啟「地區或學區」：點擊「新增假期」，為每個假期填入「假期名稱」、「開始日期」和「結束日期」，然後「儲存」。垃圾桶可移除一個假期或一個地區；國家要等到沒有任何地區後才能刪除。',
  'help.guide.school-holiday-catalog.result':
    '使用者可以在 Vacay 的「設定」中找到該國家和地區，並在年度格線上看到這些假期。',
  'help.guide.school-holiday-catalog.tip.1': '已被某人在其 Vacay 日曆中選用的地區無法刪除。',
  // auth-methods
  'help.guide.auth-methods.title': '決定登入方式',
  'help.guide.auth-methods.goal': '開啟或關閉密碼登入、SSO 和註冊，並要求使用 2FA。',
  'help.guide.auth-methods.step.1':
    '在「驗證方式」下，開啟或關閉「密碼登入」和「密碼註冊」，每個開關都會立即生效。關閉註冊後，新帳戶只能透過邀請連結、SSO 或「建立使用者」產生。',
  'help.guide.auth-methods.step.2':
    '「SSO Login」和「SSO Auto-Provisioning」需要先在下方設定「單點登入 (OIDC)」。自動佈建會在有人第一次透過 SSO 登入時建立帳號。',
  'help.guide.auth-methods.step.3':
    '開啟「要求雙因素身份驗證（2FA）」，讓所有尚未設定 2FA 的人必須先在「設定」中完成設定，才能使用 TREK。',
  'help.guide.auth-methods.result': '登入頁面只會提供你保持開啟的登入方式。',
  'help.guide.auth-methods.tip.1':
    'TREK 不會讓你關閉最後一種登入方式：它的開關會變灰，提示文字會顯示「至少要保留一種登入方式」。',
  'help.guide.auth-methods.tip.2': '伺服器設定了 OIDC_ONLY 時，密碼開關會被鎖定，並有說明提示。',
  // oidc
  'help.guide.oidc.title': '設定單一登入',
  'help.guide.oidc.goal': '讓大家用你的身分提供者登入。',
  'help.guide.oidc.step.1':
    '在「單點登入 (OIDC)」下，輸入按鈕的「顯示名稱」、「頒發者 URL」，以及來自你的供應商的「客戶端 ID」和「客戶端密鑰」。只有當你的供應商沒有在常用位址發布 Discovery URL 時（例如 Authentik），才填寫「Discovery URL（選填）」。點擊「儲存」。',
  'help.guide.oidc.step.2': '在「Authentication Methods」下開啟「SSO Login」。',
  'help.guide.oidc.result':
    '登入頁面會顯示 SSO 按鈕；開啟「SSO Auto-Provisioning」後，首次登入的使用者會自動取得帳號。',
  'help.guide.oidc.tip.1': '你的提供者需要的重新導向 URI，是你的 TREK 位址加上文件中的 OIDC 回呼路徑。',
  'help.guide.oidc.tip.2': '宣告對應會決定哪些 SSO 群組成為管理員，請參閱文件中的 OIDC 頁面。',
  // instance-keys
  'help.guide.instance-keys.title': '輸入 API 金鑰',
  'help.guide.instance-keys.goal': '為整個執行個體加入 Google 照片和評分、Unsplash 封面，以及高德地圖搜尋。',
  'help.guide.instance-keys.step.1':
    '在「API 金鑰」下，最上面的 TREK Places API 不需要金鑰就能處理地點搜尋。「裡面有什麼」會列出它涵蓋與不涵蓋的內容。',
  'help.guide.instance-keys.step.2':
    '若要使用照片、評分和營業時間，請貼上「Google Maps API 金鑰」並點擊「測試」，結果會顯示「已連線」或「無效」。開啟「該金鑰的用途」，只打開你願意付費的項目：「地點照片」、「地點自動補全」、「地點詳情」、「地點資訊補充」和「僅使用 Google 搜尋」，另外還可以設定「Google 呼叫每日上限」。',
  'help.guide.instance-keys.step.3':
    '貼上用於搜尋封面的「Unsplash API 金鑰」，以及用於中國大陸地點搜尋的「高德地圖 API Key」，然後點擊卡片底部的「儲存」。',
  'help.guide.instance-keys.result':
    '使用者無需自己的金鑰就能使用這些功能。沒有 Google 金鑰時，搜尋會使用 TREK Places API 和 OpenStreetMap。',
  'help.guide.instance-keys.tip.1':
    '如果使用者在「設定」中有自己的金鑰，TREK 對該使用者就會優先使用個人金鑰，而不是實例金鑰。',
  'help.guide.instance-keys.tip.2': '金鑰也可以來自環境變數，這類金鑰在這裡會顯示為唯讀。',
  'help.guide.instance-keys.tip.3':
    '「Google 呼叫每日上限」限制 TREK 每天可以在這把金鑰上花多少額度，標題旁的徽章會顯示今天的呼叫次數。達到上限後，搜尋會改用 OpenStreetMap，直到隔天（UTC）。',
  // places-transit
  'help.guide.places-transit.title': '選擇搜尋與大眾運輸的提供商',
  'help.guide.places-transit.goal': '選擇由哪個服務來回應地點搜尋和大眾運輸路線的請求。',
  'help.guide.places-transit.step.1':
    '在「公共運輸資料來源」下，選擇「Transitous（免費）」（不需金鑰，在歐洲表現最佳），或使用 Google 金鑰的 Google。選擇會立即儲存。',
  'help.guide.places-transit.step.2':
    '在「地點搜尋來源」下，選擇當 TREK 索引和 OpenStreetMap 都找不到時要詢問誰：「自動」（有金鑰時用 Google，其次是高德地圖）、Google Places、高德地圖或 OpenStreetMap。',
  'help.guide.places-transit.result': 'TREK 中的每個搜尋框和每條大眾運輸路線，都會使用這個選擇。',
  'help.guide.places-transit.tip.1':
    '沒有對應金鑰的選項會在這裡顯示警告。此時地點搜尋只會使用 TREK 索引和 OpenStreetMap，大眾運輸則只會使用 Transitous。',
  'help.guide.places-transit.tip.2': 'Google 的大眾運輸路線依請求次數計費，Transitous 則不收費。',
  // file-types
  'help.guide.file-types.title': '限制檔案類型',
  'help.guide.file-types.goal': '決定上傳檔案可以使用哪些副檔名。',
  'help.guide.file-types.step.1':
    '在「允許的檔案型別」下，編輯以逗號分隔的副檔名列表，或輸入 * 以允許所有類型，然後點擊「儲存」。',
  'help.guide.file-types.result': '上傳其他類型的檔案時會被拒絕，並顯示清楚的訊息，不論是在文件、日誌或封面中都一樣。',
  'help.guide.file-types.tip.1': '請保留圖片類型：封面和旅程照片會依同一份清單檢查。',
  // toggle-addon
  'help.guide.toggle-addon.title': '開啟或關閉擴充套件',
  'help.guide.toggle-addon.goal': '讓所有人都能使用某個功能模組，或將它移除。',
  'help.guide.toggle-addon.step.1': '點選擴充套件圖塊上的開關。導覽列中的項目會立即對所有人顯示或隱藏。',
  'help.guide.toggle-addon.step.2':
    '有些圖塊有選項的子列，例如「行李」下的「行李追蹤」，或「旅程」下的相片提供者，這些子列只有在擴充套件開啟時才會顯示。',
  'help.guide.toggle-addon.result': '關閉擴充套件時，它的資料會保留。重新開啟後，資料就會再次出現。',
  'help.guide.toggle-addon.tip.1': '關閉 MCP 會移除端點，以及依賴它的「整合」區段。',
  'help.guide.toggle-addon.tip.2':
    'Vacay、Atlas 和旅程是使用者最常要求的擴充套件；文件則需要儲存空間來存放上傳的檔案。',
  // install-plugin
  'help.guide.install-plugin.title': '安裝外掛',
  'help.guide.install-plugin.goal': '新增第三方外掛，並只授予它所申請的權限。',
  'help.guide.install-plugin.step.1':
    '開啟「探索」，用「搜尋外掛…」或「型別」篩選器找到外掛，然後點擊「安裝」。如果是套件檔案，請點擊「上傳外掛」（卡片右上角的雲端圖示），或把 .zip 檔拖放到頁面上。',
  'help.guide.install-plugin.step.2':
    '在「已安裝」下查看該列：外掛可存取什麼、它連線的主機，以及它是否「已審核」和「已簽署」。接著開啟「啟用外掛」，該列會顯示「有效」。',
  'help.guide.install-plugin.step.3':
    '該列的 ⋯ 選單提供「重新啟動」、「檢視錯誤日誌」、「允許的主機」和「更換版本…」，以及原始碼的連結。「刪除」會解除安裝外掛並刪除其資料。有較新的版本時，該列會顯示更新提示；要求新權限的版本，在你核准之前會維持關閉。',
  'help.guide.install-plugin.result':
    '外掛會在自己的程序中執行。它新增的內容，例如小工具、地圖圖層或工具，會出現在外掛指定的位置。',
  'help.guide.install-plugin.tip.1': '「重新掃描」可以找到為了開發而連結、但沒有套件的外掛資料夾。',
  'help.guide.install-plugin.tip.2': '未簽署的外掛會有相應的標示，請只在信任來源時才安裝。',
  // storage-backends
  'help.guide.storage-backends.title': '將上傳檔案移到 S3 或建立鏡像',
  'help.guide.storage-backends.goal': '將檔案保存在物件儲存空間，或把每個上傳檔案複製到第二個後端。',
  'help.guide.storage-backends.step.1':
    '在「後端」下，點擊「新增後端」，取個「名稱」，選擇「型別」（「本地」或 S3），並填寫它的欄位。若要在別處保留一份複本，請勾選「鏡像目標」。點擊「套用」，然後在新的一列上點擊「測試」檢查連線。',
  'help.guide.storage-backends.step.2':
    '在「分類」下，將每種上傳類型指派給一個後端，例如「行程文件」、「旅程相片」或「備份」。',
  'help.guide.storage-backends.step.3':
    '點擊底部的「儲存變更」。如果某個分類現在改指向別處，TREK 會詢問要「移動現有物件」還是「僅路由新寫入」。',
  'help.guide.storage-backends.result':
    '新的上傳會存到指派的後端。已移動的檔案從新位置提供，你選擇不移動的檔案則留在原處。',
  'help.guide.storage-backends.tip.1': '透過環境變數設定的後端會顯示出來，但無法在這裡編輯。',
  'help.guide.storage-backends.tip.2':
    '鏡像目標會收到每次新寫入的副本，該列的「立即同步」則會複製先前已儲存的內容。速度慢的目標會拖慢該後端上的每次上傳。',
  // channels-instance
  'help.guide.channels-instance.title': '設定通知管道',
  'help.guide.channels-instance.goal': '決定使用者可以選擇哪些管道，並設定電子郵件。',
  'help.guide.channels-instance.step.1':
    '在其卡片標題中開啟「電子郵件 (SMTP)」，輸入 SMTP Host、SMTP Port、SMTP User、SMTP Password 和寄件地址，然後點擊「儲存」。「傳送測試郵件」會寄一封信給你。「略過 TLS 憑證檢查」只適用於使用自有憑證的本機郵件伺服器。',
  'help.guide.channels-instance.step.2':
    '開啟 Webhook、Ntfy 和「Web 推播」以供使用者選用。使用者隨後可在「設定」的「通知」中輸入自己的 URL 或主題，或為每台裝置開啟推播。',
  'help.guide.channels-instance.step.3': '「行程提醒」開關控制旅行開始前的提醒；「應用程式內通知」一律開啟。',
  'help.guide.channels-instance.result': '每位使用者的「通知」分頁，都會顯示你開啟的管道。',
  'help.guide.channels-instance.tip.1':
    '「管理員 Ntfy」卡片中的「Ntfy 伺服器 URL」，同時也是使用者的預設伺服器。使用者仍可自行指定伺服器。',
  'help.guide.channels-instance.tip.2': '只要有具備該功能的外掛啟用，外掛提供的管道就會自動出現。',
  // admin-channels
  'help.guide.admin-channels.title': '在手機上接收管理員事件',
  'help.guide.admin-channels.goal': '接收新版本、儲存鏡像失敗和划槳區域申請的通知。',
  'help.guide.admin-channels.step.1':
    '在「管理員 Ntfy」下，輸入「管理員主題」，必要時再填入「Ntfy 伺服器 URL」和「存取權杖（選填）」。在「管理員 Webhook」下輸入 URL。每張卡片都要點擊「儲存」。',
  'help.guide.admin-channels.step.2': '點選「傳送測試 Ntfy」或「傳送測試 Webhook」，確認訊息有送達。',
  'help.guide.admin-channels.result':
    '管理員事件會送達應用程式內的每位管理員，如果你開啟了，也會送到管理員的 ntfy 主題和 Webhook。',
  'help.guide.admin-channels.tip.1': '請把管理員用的主題和你個人的主題分開，這樣服務中斷的通知才不會淹沒在旅行訊息中。',
  'help.guide.admin-channels.tip.2': '管理員 Webhook 和主題與你在「設定」的「通知」下的個人管道是分開的。',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': '撤銷 AI 存取權',
  'help.guide.mcp-tokens-admin.goal': '查看並撤銷 AI 用戶端持有的所有權杖和工作階段，不論屬於哪位使用者。',
  'help.guide.mcp-tokens-admin.step.1':
    '在「OAuth 工作階段」下，依名稱和擁有者找到客戶端；它的標籤顯示授予的權限範圍。垃圾桶在你確認後會撤銷該工作階段。',
  'help.guide.mcp-tokens-admin.step.2':
    '在「API 令牌」下，對令牌也是一樣：名稱、擁有者、「建立時間」和「最後使用」。垃圾桶會刪除令牌，客戶端隨即停止運作。',
  'help.guide.mcp-tokens-admin.result': '用戶端的使用者必須重新連線，其他一切都不會改變。',
  'help.guide.mcp-tokens-admin.tip.1': '「權限範圍」代表用戶端能做哪些事；唯讀的權限範圍可以放心保留。',
  'help.guide.mcp-tokens-admin.tip.2':
    '關閉 MCP 擴充套件會立刻停止所有客戶端並隱藏這個分頁，但不會刪除任何資料。重新開啟後，權杖就能再次使用。',
  // release-history
  'help.guide.release-history.title': '檢查是否有新版本',
  'help.guide.release-history.goal': '了解你的 TREK 是否為最新版本，以及下一個版本有什麼新內容。',
  'help.guide.release-history.step.1':
    '有較新的版本時，頁面標題下方會顯示「有可用更新」，並附上你目前執行的版本。「在 GitHub 檢視」會開啟該版本，「如何更新」則顯示 Docker 的指令，或其他安裝方式的更新指南。',
  'help.guide.release-history.step.2':
    '「版本歷史」會列出每個版本和更新說明。「顯示詳情」可以展開說明，最新的版本會標示「最新」，「載入更多」則會顯示更舊的版本。',
  'help.guide.release-history.result': '更新要在主機上進行，也就是拉取新映像檔或建置新標籤；資料目錄會保留不變。',
  'help.guide.release-history.tip.1': '更新之前請先備份。「備份」分頁就在旁邊。',
  'help.guide.release-history.tip.2': '預釋出版本會顯示，但不會當作更新通知，除非你正在執行預釋出版本。',
  // create-backup
  'help.guide.create-backup.title': '建立並恢復備份',
  'help.guide.create-backup.goal': '備份整個實例，在別處保留一份副本，並且能夠還原。',
  'help.guide.create-backup.step.1':
    '在「資料備份」下，點擊右上角的「建立備份」。它會把資料庫和上傳的檔案打包成伺服器上的一個檔案。',
  'help.guide.create-backup.step.2': '「下載」可在伺服器之外另存一份副本，垃圾桶則會在你確認後刪除舊備份。',
  'help.guide.create-backup.step.3':
    '對備份點擊「恢復」，或用檔案「上傳備份」，在「恢復備份？」下點擊「確認恢復」後，會取代所有目前的資料。',
  'help.guide.create-backup.result': '恢復會讓使用者、旅行、檔案和設定完全回到該備份當時的樣子。',
  'help.guide.create-backup.tip.1': '還原是這裡唯一無法復原的操作。請先建立一份新的備份。',
  'help.guide.create-backup.tip.2': '備份存放在資料目錄中。請複製到另一台機器，這樣這台機器故障時，備份才安全。',
  // auto-backup
  'help.guide.auto-backup.title': '排程備份',
  'help.guide.auto-backup.goal': '讓伺服器自動備份自己，並清除舊的備份。',
  'help.guide.auto-backup.step.1':
    '在「自動備份」下，開啟「啟用自動備份」，並選擇「間隔」（「每小時」、「每天」、「每週」或「每月」）、「執行時間」，每週或每月的備份還需選擇「星期幾」或「每月幾號」。',
  'help.guide.auto-backup.step.2':
    '在「自動刪除舊備份」下，選擇備份要保留多久，從「1 天」到「永久保留」都可以，然後點擊「儲存」。',
  'help.guide.auto-backup.result': '備份會依排程出現在列表中。超過你所選保留期限的舊備份會被刪除。',
  'help.guide.auto-backup.tip.1': '「執行時間」使用伺服器的時間，下方的提示會顯示伺服器的時區。',
  'help.guide.auto-backup.tip.2': '伺服器上的儲存空間有限：通常保留 7 或 14 天就夠了，另外把下載的副本存放在別處。',
  // audit-log
  'help.guide.audit-log.title': '查看審計日誌',
  'help.guide.audit-log.goal': '查明誰在什麼時候做了什麼。',
  'help.guide.audit-log.step.1':
    '閱讀各列，最新的在前：「時間」、「使用者」、「操作」、「資源」、IP 和「詳細資訊」。操作以發生的事件命名，例如登入失敗、MFA 變更或恢復。',
  'help.guide.audit-log.step.2':
    '右上角的「重新整理」會重新載入。標題旁的徽章顯示已載入數量與總數，「載入更多」可繼續往前翻。',
  'help.guide.audit-log.result': '有了這份紀錄，別人問起某項變更的原因時，你就能拿出來給對方看。',
  'help.guide.audit-log.tip.1': '時間以伺服器的時區顯示。',
  'help.guide.audit-log.tip.2': '日誌只能新增，不能修改：在應用程式中無法編輯或刪除任何一筆紀錄。',
  // document-providers
  'help.guide.document-providers.title': '提供文件儲存庫',
  'help.guide.document-providers.goal': '決定旅行可以和哪些儲存庫同步文件。',
  'help.guide.document-providers.step.1':
    '「文件」圖塊以列的方式列出各個儲存服務：Paperless-ngx、Papra、Nextcloud、OpenCloud 和 Synology Drive。這五項一開始都是關閉的，而且只有在「文件」本身開啟時才會顯示這些列。',
  'help.guide.document-providers.step.2':
    '開啟 Nextcloud 那一列的開關。畫面會顯示「擴充套件已更新」，之後旅行所有者就能在旅行的「檔案」分頁看到「文件同步」，Nextcloud 則列在「連接提供者」之下。',
  'help.guide.document-providers.result':
    '這個儲存服務可用於這個 TREK 的每一趟旅行。在旅行所有者連接之前，不會連上任何東西。',
  'help.guide.document-providers.tip.1':
    '這裡只決定是否提供某個儲存服務。位址和憑證屬於個別旅行，由旅行所有者在該旅行的「檔案」分頁中輸入，絕不會在管理面板中輸入。',
  'help.guide.document-providers.tip.2':
    '關閉「文件」時，所有儲存庫也會一併關閉，而且「文件」關閉期間無法開啟任何儲存庫：伺服器會回應「Enable the Documents addon first」。位於你自己網路內的儲存庫，還需要在伺服器上設定 ALLOW_INTERNAL_NETWORK=true。',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': '旅行',
  'help.ctx.trip.summary':
    '一趟旅行的所有內容：有天數、地圖和地點的計畫，以及遊程、交通、預訂、行李、費用、檔案、協作和已連結日誌的分頁。每個分頁在這一頁下方都有各自的說明畫面。',
  'help.ctx.trip.bullet.1':
    '頂部列下方的分頁列：計畫、遊程、交通、預訂、行李、費用、檔案、協作，以及連結日誌後出現的日誌。擴充套件和外掛決定你的 TREK 上有哪些分頁。',
  'help.ctx.trip.bullet.2':
    '「計畫」分為三欄：左邊是天數，中間是地圖，右邊是地點。啟用公路旅行擴充套件後，天數欄的開頭會有「天數」和「公路旅行」的切換；啟用遊程擴充套件後，地點欄的開頭會有「地點」和「遊程」。預訂和交通都在計畫裡面，位於停靠點上和停靠點之間；分頁則將它們列成清單。',
  'help.ctx.trip.bullet.3':
    '「旅行設定」是左上角旅行名稱旁的標籤，會開啟旅行的設定：「成員」（成員和訪客）、「分享中」（唯讀的公開連結和邀請連結）以及「日誌」。',
  'help.ctx.trip.bullet.4':
    '標題、日期、封面和貨幣在「我的旅行」中用旅行卡片上的鉛筆編輯。左上角的旅行名稱會帶你回到那裡。',
  'help.ctx.trip.bullet.5':
    '欄位內側邊緣的分頁標籤可以收合該欄，地圖會使用騰出的空間。收合的欄位會在地圖頂角留下一個小方塊，點擊即可再次顯示。拖曳欄位旁的細分隔線可調整欄寬。',
  'help.ctx.trip.bullet.6': '天數工具列中的復原箭頭可以一步一步復原你最近對計畫所做的變更。',
  // add-member
  'help.guide.add-member.title': '新增成員',
  'help.guide.add-member.goal': '讓有 TREK 帳號的人可以存取這趟旅行。',
  'help.guide.add-member.step.1': '點擊「旅行設定」，也就是左上角旅行名稱旁邊的標籤。它會開啟到「成員」。',
  'help.guide.add-member.step.2': '在「邀請使用者」下，從「選擇使用者…」中選擇人，然後點擊「邀請」。',
  'help.guide.add-member.step.3':
    '這個人現在會出現在「訪問許可權」下。「所有者」徽章標示擁有者；該列末端的「移除訪問許可權」在你確認後會將此人移除。',
  'help.guide.add-member.result': '成員可以像你一樣查看和編輯這趟旅行，範圍在管理員於「許可權設定」中設定的層級之內。',
  'help.guide.add-member.tip.1': '清單中找不到的人，表示還沒有 TREK 帳號：請把對方加為訪客，或讓他們透過邀請連結註冊。',
  'help.guide.add-member.tip.2': '「訪問許可權」旁邊的數字是旅行中的人數；訪客另外列在下方。',
  // trip-invite-link
  'help.guide.trip-invite-link.title': '用連結邀請',
  'help.guide.trip-invite-link.goal': '讓別人自己加入旅行。',
  'help.guide.trip-invite-link.step.1':
    '點擊旅行名稱旁的「旅行設定」，並在左側選擇「分享中」。在「行程邀請連結」下，點擊「建立邀請連結」。',
  'help.guide.trip-invite-link.step.2': '點選「複製」並傳送連結。任何有 TREK 帳號的人開啟連結，就會以成員身分加入。',
  'help.guide.trip-invite-link.step.3': '「重新產生」會換成新連結，舊連結隨即失效；「停用」則會關閉連結。',
  'help.guide.trip-invite-link.result': '任何人開啟連結就會加入旅行，並列在「訪問許可權」下。',
  'help.guide.trip-invite-link.tip.1':
    '沒有帳號的人無法使用這個連結。管理員可以在「管理員」、「使用者」下建立註冊連結，並將其中一個連結到這趟旅行。',
  'help.guide.trip-invite-link.tip.2': '如果連結傳錯了聊天室，請重新產生連結，舊連結會立刻失效。',
  // add-guest
  'help.guide.add-guest.title': '新增沒有帳號的訪客',
  'help.guide.add-guest.goal': '把不使用 TREK 的人加入旅行。',
  'help.guide.add-guest.step.1':
    '點擊旅行名稱旁的「旅行設定」。在「成員」中，「訪客」是最後一個部分，位於「訪問許可權」下方。',
  'help.guide.add-guest.step.2': '在「訪客姓名」中輸入名字，再點選「新增訪客」。',
  'help.guide.add-guest.result': '訪客可以被指派到費用、行李物品和任務，但無法登入。',
  'help.guide.add-guest.tip.1':
    '「重新命名」（鉛筆）可更改訪客的名稱。「移除訪問許可權」（垃圾桶）在你確認後會將訪客移除：他們的指派會消失，他們在每筆支出中的份額會轉給該分攤中的其他人。',
  'help.guide.add-guest.tip.2': '如果對方之後有了帳號，請邀請他們成為成員，並移除訪客。',
  // public-link
  'help.guide.public-link.title': '發布唯讀連結',
  'help.guide.public-link.goal': '讓不該編輯旅行的人也能看到旅行內容。',
  'help.guide.public-link.step.1': '點擊旅行名稱旁的「旅行設定」，然後在左側選擇「分享中」。',
  'help.guide.public-link.step.2':
    '在「公開連結」卡片中，開啟連結可以顯示的內容。「地圖與計劃」一律開啟，「預訂」、「行李」、「費用」和「聊天」由你決定。',
  'help.guide.public-link.step.3':
    '在「選項」下，「僅交通與住宿」只會略過活動、每日筆記和空白的日子，「不含照片」則略過地點照片。',
  'help.guide.public-link.result': '任何拿到連結的人都不用登入，就能看到你選的部分，而且無法更動任何內容。',
  'help.guide.public-link.tip.1': '這個連結不會公開列出，但任何拿到連結的人都能開啟。請像保管密碼一樣保管它。',
  'help.guide.public-link.tip.2': '如果要給予編輯權限，請改為把對方新增為成員。',
  // transfer-ownership
  'help.guide.transfer-ownership.title': '移交旅行或退出旅行',
  'help.guide.transfer-ownership.goal': '讓其他人成為擁有者，或退出不屬於你的旅行。',
  'help.guide.transfer-ownership.step.1':
    '點擊旅行名稱旁的「旅行設定」。在「訪問許可權」下，點擊成員那一列的「設為擁有者」（皇冠）並確認。',
  'help.guide.transfer-ownership.step.2':
    '點擊你自己那一列的「退出旅行」，確認後就會離開這趟旅行。如果你是擁有者，請先移交擁有權。',
  'help.guide.transfer-ownership.result': '新的擁有者可以管理成員，也可以刪除旅行；你則成為一般成員。',
  'help.guide.transfer-ownership.tip.1': '在轉移所有權之前，所有者就是建立旅行的人。只有所有者能刪除旅行。',
  'help.guide.transfer-ownership.tip.2':
    '另一位成員那一列的「移除訪問許可權」則是相反的操作：由所有者把該成員移出旅行。',
  // collapse-columns
  'help.guide.collapse-columns.title': '為地圖騰出空間',
  'help.guide.collapse-columns.goal': '收合某個欄位，或把它加寬。',
  'help.guide.collapse-columns.step.1':
    '點選天數欄內側邊緣、帶有面板圖示的小分頁，即可收合該欄，地圖會使用空出來的空間。地點欄也有同樣的小分頁。',
  'help.guide.collapse-columns.step.2':
    '欄位收合後，地圖頂角會出現一個帶面板圖示的小方塊，提示文字是「計畫」或「地點」。點擊它即可再次顯示該欄位。',
  'help.guide.collapse-columns.step.3': '拖曳欄與地圖之間的細分隔線，即可調整該欄的寬度。',
  'help.guide.collapse-columns.result': '寬度會被記住。下次造訪時，各欄會重新展開。',
  'help.guide.collapse-columns.tip.1': '兩個欄位可以同時收合，這樣畫面上就只剩地圖。',
  'help.guide.collapse-columns.tip.2':
    '視窗較窄時只容得下一欄：開啟一欄會收合另一欄。手機上沒有欄位；頂部的「旅程」、「計畫」和「地點」用來切換不同檢視。',
  // undo-change
  'help.guide.undo-change.title': '復原上一次變更',
  'help.guide.undo-change.goal': '復原你對計畫做的上一次變更。',
  'help.guide.undo-change.step.1': '點選天數上方工具列中的復原箭頭，提示文字會顯示即將復原的變更。',
  'help.guide.undo-change.result': '計畫回到原來的樣子，並有一則簡短訊息說明復原了什麼。',
  'help.guide.undo-change.tip.1':
    '復原涵蓋計畫：新增、指派、移除、重新排序、移動和鎖定地點、清空一天、最佳化路線、刪除地點、分類變更和匯入。',
  'help.guide.undo-change.tip.2':
    '再點一次可繼續往回復原：TREK 會保留你在這趟旅行最近的 30 次變更（最新的在前），直到你離開旅行為止。',
  'help.guide.clear-day.title': '清空某一天',
  'help.guide.clear-day.goal': '一次移除某一天的所有地點，例如想從頭重新規劃那一天。',
  'help.guide.clear-day.step.1': '在計畫中，對當天的標題按右鍵。',
  'help.guide.clear-day.step.2': '選擇「清空當天」並確認。',
  'help.guide.clear-day.result':
    '這一天會清空，其中的地點會回到清單中，成為未規劃的地點。點選天數上方的復原箭頭，就能把它們放回去。',
  'help.guide.clear-day.tip.1': '只會移除地點。那一天的筆記和預訂都會保留。',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': '地點',
  'help.ctx.trip-places.summary':
    '計畫的右欄：旅行的所有地點（無論是否已排入行程），提供搜尋、篩選和排序，也提供加入地點的方式：透過搜尋、手動輸入，或從分享的清單加入。頂部的「地點」和「遊程」可以在地點和旅行的遊程之間切換。',
  'help.ctx.trip-places.bullet.1':
    '欄位頂部的「地點」和「遊程」用來切換列表。進入時預設是「地點」。「遊程」會列出旅行的遊程，並可用「匯入 GPX 或 KML」匯入 GPX、KML 和 KMZ 檔案。遊程不會出現在地點列表中。',
  'help.ctx.trip-places.bullet.2':
    '「新增地點/活動」會開啟表單，讓你搜尋或手動輸入地點。展開某一天時，按鈕會變成「新地點」，旁邊的「加入當天」則直接在那一天建立地點。',
  'help.ctx.trip-places.bullet.3':
    '旁邊的圖示按鈕「匯入地點」提供「列表匯入」，可用於從 Google 地圖或 Naver Maps 分享的清單。如果管理員已關閉遊程擴充套件，它還提供「匯入檔案」，支援 .gpx、.kml 和 .kmz 檔案，檔案也可以直接拖放到這一欄。',
  'help.ctx.trip-places.bullet.4':
    '下方是「搜尋」，它也會搜尋描述和筆記，旁邊是「選擇」勾選框。再下一列是篩選器：「顯示」可切換「全部」、「未規劃」和「計畫」，每項都附數量。標籤按鈕依分類篩選，星星依最低評分篩選，地球儀（當旅行跨越多個國家或地區時才有）依國家或地區篩選，「排序方式」則決定列表的順序。',
  'help.ctx.trip-places.bullet.5':
    '一列顯示圖片、名稱和描述或位址，有人評分後還有帶平均評分的星星。點擊它可查看地點的詳細資訊，拖到某一天上，或按右鍵（或點擊三個點「更多選項」）來使用「編輯」、「+ 天」、「開啟網站」、Google 地圖、「儲存到收藏」和「刪除」。',
  'help.ctx.trip-places.bullet.6':
    '開啟某一天後，列末端的圓形 +（「+ 天」）會把地點放到那一天。它會顯示在每個尚未排入那一天的地點上。「計畫」此時只列出那一天，「僅顯示目前開啟的日期」標籤會說明這一點；它的 x「顯示整趟行程」會關閉該日。',
  // create-place
  'help.guide.create-place.title': '建立地點',
  'help.guide.create-place.goal': '手動新增地點或活動，並填入行程所需的所有詳細資料。',
  'help.guide.create-place.step.1':
    '點擊地點欄頂部的「新增地點/活動」（開啟某一天時則是「新地點」）。表單開啟後，游標會停在搜尋框。',
  'help.guide.create-place.step.2':
    '在「搜尋地點…」中輸入地點並選擇結果。對話方塊頂部的名稱、「位址」、「緯度」、「經度」和「網站」會自動填入，左側的「地點詳細資料」會顯示圖片、營業時間和描述。如果 TREK 設有 Google 金鑰，結果下方的「不是正確的地點？改用 Google 搜尋」會改用 Google 執行同樣的搜尋。開啟收藏後，右側的「已儲存的地點」也會以同樣的方式提供你清單中的地點。',
  'help.guide.create-place.step.3':
    '在「地點詳細資料」中，點擊「選擇圖片」下的一張圖片，將它設為地點的圖片。「使用此文字」會把描述複製到表單中。',
  'help.guide.create-place.step.4':
    '檢查表單中的內容。對話方塊標題中的名稱是唯一必填的欄位。下方的「分類」標籤可選擇旅行的其中一個分類，旁邊的 + 可建立新分類。「位址」、「緯度」和「經度」來自搜尋，或手動輸入。「描述」和「筆記」由你自己填寫。「網站」填入連結，「檔案」下的「附加」可加入文件，「電話」、「電子郵件」和「新增營業時間」則填入搜尋沒有查到的資料。',
  'help.guide.create-place.step.5':
    '點選「新增」。如果旅行中已經有同名或位置相同的地點，TREK 會顯示警告，按鈕也會變成「仍要新增」。',
  'help.guide.create-place.result': '地點會出現在清單和地圖上，在你把它排到某一天之前，會顯示在「未規劃」之下。',
  'help.guide.create-place.tip.1':
    '開啟預算擴充套件後，表單底部的「費用」會在儲存後立即開啟該地點支出的「費用」編輯器。貼到對話方塊中的圖片或 PDF，會像「檔案」下的檔案一樣被附加。',
  'help.guide.create-place.tip.2':
    '每個 TREK 的搜尋結果都來自 TREK 索引和 OpenStreetMap，「地點詳細資料」則會自動從 Wikipedia、Wikivoyage 和 Wikimedia 補上內容。只有在這兩者都找不到時，TREK 才會去問 Google，而且只有 Google 會提供評分。',
  'help.guide.create-place.tip.3': '你也可以直接在地圖上建立地點：在該位置按右鍵，表單就會開啟，並已填好座標和地址。',
  // place-to-open-day
  'help.guide.place-to-open-day.title': '直接把地點加到目前開啟的日期',
  'help.guide.place-to-open-day.goal': '一個步驟就建立或選擇地點，並加到那一天。',
  'help.guide.place-to-open-day.step.1':
    '在天數欄中點擊某一天的標題。這一天就開啟了：它的卡片會反白，地點欄的「新地點」旁邊也會出現「加入當天」按鈕。',
  'help.guide.place-to-open-day.step.2':
    '「加入當天」會開啟和「新地點」相同的表單，但你點擊「新增」後，地點會直接加到目前展開的那一天。',
  'help.guide.place-to-open-day.step.3':
    '要把已有的地點加到展開的那一天，請點擊該列末端的圓形 +（「+ 天」），或對它按右鍵並選擇「+ 天」。每個尚未排入那一天的地點都會顯示這個 +。',
  'help.guide.place-to-open-day.step.4':
    '反過來也可以，不必先展開某一天：把地點那一列從欄位中拖出來，放到某一天的卡片上。如果放在兩個停靠點之間，它就會剛好插在那個位置。',
  'help.guide.place-to-open-day.result': '地點會列在那一天的最後面，把它上下拖曳到適合的位置。',
  'help.guide.place-to-open-day.tip.1':
    '展開的那一天也會影響搜尋：展開某一天時，地圖和附近搜尋會以那一天已有的地點為起點。',
  'help.guide.place-to-open-day.tip.2': '點選天數上方工具列的「復原」，就能取消這次指派。',
  // filter-places
  'help.guide.filter-places.title': '在清單中找出地點',
  'help.guide.filter-places.goal': '讓欄位中只顯示你要找的地點。',
  'help.guide.filter-places.step.1':
    '搜尋框下方的下拉選單「顯示」可切換「全部」、「未規劃」（尚未排入任何一天）和「計畫」（已排入某天），每項都附數量。如果遊程擴充套件已關閉且匯入過 GPX 軌跡，還會多一個「軌跡」。',
  'help.guide.filter-places.step.2':
    '在頂部的「搜尋」中輸入。列表會隨著輸入縮小範圍，依名稱、位址、描述和筆記搜尋；欄位中的 x 可清除。',
  'help.guide.filter-places.step.3':
    '「顯示」旁的標籤按鈕會列出分類：勾選一個或多個，其中包含「無分類」。按鈕上會顯示勾選了多少個，列表底部的「清除篩選」可全部移除。',
  'help.guide.filter-places.step.4':
    '旁邊的星星設定最低評分：5+、4+ 等只保留平均評分至少達到該值的地點。沒有人評過分的地點會被排除。',
  'help.guide.filter-places.result': '「顯示」上的數字代表符合條件的地點數量，各項篩選條件可以組合使用。',
  'help.guide.filter-places.tip.1':
    '開啟某一天時，「已規劃」只會列出那一天，並加上說明：「僅顯示目前開啟的日期」，旁邊是「顯示整趟行程」。',
  'help.guide.filter-places.tip.2':
    '地圖也會套用「顯示」、分類和評分；展開某一天時，地圖上的「計畫」只會顯示那一天。搜尋和地球儀則只篩選列表。',
  // edit-place
  'help.guide.edit-place.title': '修改地點',
  'help.guide.edit-place.goal': '修正名稱、移動圖釘、加上網站，或更換分類。',
  'help.guide.edit-place.step.1':
    '對該列按右鍵並選擇「編輯」，或點擊該列末端的「更多選項」，也可以開啟地點後，在詳細資訊中點擊「編輯」。',
  'help.guide.edit-place.step.2':
    '在「編輯地點」中修改你需要的內容：對話方塊頂部的名稱和「分類」標籤、「位址」、「緯度」和「經度」、「描述」、「筆記」、「網站」、「電話」、「電子郵件」以及營業時間。當地點剛好只在一天，或你是從某一天開啟它時，表單還會有該天的「開始」、「結束」和「筆記」。',
  'help.guide.edit-place.step.3': '點選「更新」。',
  'help.guide.edit-place.result': '變更會套用到該地點出現的所有位置：清單、地圖，以及它所在的每一天。',
  'help.guide.edit-place.tip.1': '「當天備註」是屬於這個地點在那一天的備註，「備註」則是屬於地點本身。',
  'help.guide.edit-place.tip.2':
    '「結束」早於「開始」時，無法按「更新」；「時間衝突：」則只是提醒當天另一個停留點的時間與它相同。',
  // delete-place
  'help.guide.delete-place.title': '刪除地點',
  'help.guide.delete-place.goal': '把地點從旅行中永久移除。',
  'help.guide.delete-place.step.1':
    '在該列上按右鍵並選擇「刪除」（該列末端的「更多選項」中也有），或在地點的詳細資訊中點擊「刪除」。',
  'help.guide.delete-place.step.2':
    '在確認提示中點選「刪除」。如果這個地點訂過住宿，或有預訂連結到它，提示會說明一併刪除的內容。',
  'help.guide.delete-place.result': '地點會從清單、地圖和每一天中移除。點選天數上方工具列的「復原」，就能把它找回來。',
  'help.guide.delete-place.tip.1': '如果只想把地點從某一天移除，請改用該停留點上的「從當天移除」。',
  'help.guide.delete-place.tip.2': '要一次刪除多個地點，請點選搜尋框旁邊的勾選圖示開始選取。',
  // select-places
  'help.guide.select-places.title': '一次更改或刪除多個地點',
  'help.guide.select-places.goal': '一次修改多個地點，不用一個一個來。',
  'help.guide.select-places.step.1':
    '點選搜尋框旁邊的勾選圖示。每一列會出現圓形核取方塊，欄位底部也會出現帶有各項操作的列。',
  'help.guide.select-places.step.2': '點選各列來勾選。操作列中的雙勾選圖示「全選」，會選取篩選後顯示的每一列。',
  'help.guide.select-places.step.3':
    '選取列會統計勾選的地點。「變更類別」會為它們全部指定同一個分類；「儲存到收藏」（開啟收藏時）會將它們複製到你的某個收藏中；「刪除所選」在確認後將它們移除。',
  'help.guide.select-places.step.4': '點選「完成」，也就是列尾的 X，結束選取。',
  'help.guide.select-places.result': '變更會套用到所有選取的地點；刪除後也可以用天數上方的工具列復原。',
  'help.guide.select-places.tip.1': '選取期間篩選仍然有效：先篩選「未規劃」，再按「全選」，就只會選到那些地點。',
  'help.guide.select-places.tip.2':
    '「收藏」擴充套件開啟時，操作列中會出現「在清單中標記為已造訪」：它會在這些地點所屬的收藏中，把它們標記為已造訪。',
  // import-places-file
  'help.guide.import-places-file.title': '從 GPX、KML 或 KMZ 檔案匯入地點',
  'help.guide.import-places-file.goal':
    '在遊程擴充套件關閉時，把 Google My Maps、Google Earth 或 GPS 追蹤器匯出的圖釘和路徑，匯入為地點。',
  'help.guide.import-places-file.step.1':
    '點擊新增按鈕旁邊的圖示按鈕「匯入地點」，選擇「匯入檔案」，或把檔案拖放到地點欄的任何位置。只有管理員關閉了遊程擴充套件，才會有這兩個選項。',
  'help.guide.import-places-file.step.2':
    '選擇檔案，或將它拖進方框。對於 GPX，勾選要匯入的內容：「路點」、「路線」、「軌跡（含路徑幾何）」。對於 KML 和 KMZ，勾選「點（Placemarks）」和「路徑（LineStrings）」。',
  'help.guide.import-places-file.step.3':
    '方框一次可接受多個檔案，但只限 .gpx、.kml 和 .kmz。任何其他類型的檔案，或超過 10 MB 的檔案，都會在對話方塊中被拒絕且不會匯入。',
  'help.guide.import-places-file.step.4':
    '點擊「匯入」。訊息會說明匯入了多少地點。對於 KML 或 KMZ 檔案，對話方塊會保持開啟，並顯示建立了什麼、略過了什麼的摘要。',
  'help.guide.import-places-file.result':
    '地點已進入列表。軌跡在其列上帶有彩色線條，會繪製在地圖上，並有自己的「軌跡」篩選。',
  'help.guide.import-places-file.tip.1':
    '檔案太大會被拒絕，TREK 也會顯示大小上限；請去掉照片後重新匯出，或把檔案拆開。',
  'help.guide.import-places-file.tip.2': '你可以從天數上方的工具列復原整次匯入。',
  // import-places-list
  'help.guide.import-places-list.title': '匯入共用的 Google Maps 或 Naver Maps 清單',
  'help.guide.import-places-list.goal': '從共用清單的連結匯入地點。',
  'help.guide.import-places-list.step.1': '點擊新增按鈕旁邊的圖示按鈕「匯入地點」，然後選擇「列表匯入」。',
  'help.guide.import-places-list.step.2':
    '在「供應商」下選擇「Google 列表」或「Naver 列表」，然後把清單的分享連結貼到「連結」。Google Maps 的路線連結也可以：其中的停靠點會依行車順序變成地點。',
  'help.guide.import-places-list.step.3': '點選「匯入」。',
  'help.guide.import-places-list.result': '清單中的每個地點都會加入旅行，名稱與清單中一致；旅行中已有的地點則會略過。',
  'help.guide.import-places-list.tip.1': '清單必須公開分享；私人清單的連結無法匯入任何內容。',
  'help.guide.import-places-list.tip.2':
    '如果你的 TREK 設有 Google 金鑰，對話框中會出現「透過 Google 豐富地點資訊」：它會逐一查詢匯入的地點，並補上照片、地址和詳細資料。',
  'help.guide.sort-places.title': '排序地點清單',
  'help.guide.sort-places.goal': '依名稱、評分，或最近新增或更改的順序排列清單。',
  'help.guide.sort-places.step.1':
    '點擊「排序方式」，也就是篩選列最後面的箭頭按鈕。目前的排序方式會打勾，按鈕的提示文字則顯示它的名稱。',
  'help.guide.sort-places.step.2': '選擇排序方式，例如「評分最高」，或依名稱排序。列表會立即更新。',
  'help.guide.sort-places.result': '清單會依你選的順序顯示地點，直到你改選其他順序為止。',
  'help.guide.sort-places.tip.1': '只要排序不是「最近新增」，按鈕就會醒目標示，讓你一眼看出清單的排序方式不同。',
  'help.guide.sort-places.tip.2': '排序只會改變列表，各天仍保持自己的順序，你的瀏覽器也會記住你選的排序方式。',
  'help.guide.place-by-hand.title': '新增搜尋找不到的地點',
  'help.guide.place-by-hand.goal': '地點搜尋找不到結果時，自行輸入地點，包括電話、電子郵件和營業時間。',
  'help.guide.place-by-hand.step.1':
    '在地點對話框中，於搜尋欄輸入名稱並按 Enter。找不到結果時，對話框會告訴你，並提供「手動新增」。',
  'help.guide.place-by-hand.step.2': '點選「手動新增」。你搜尋的文字會成為名稱，對話框也會捲動到聯絡資料欄位。',
  'help.guide.place-by-hand.step.3': '如果知道，就填入「電話」和「電子郵件」。',
  'help.guide.place-by-hand.step.4':
    '點選「新增營業時間」，設定地點每天的開門和關門時間。複製按鈕會把第一天的時間套用到每一天，每天的開關則可以把那一天標示為「公休」。',
  'help.guide.place-by-hand.step.5': '點選「新增」。',
  'help.guide.place-by-hand.result':
    '地點會加入清單。它的詳細資料會顯示你輸入的電話、電子郵件和營業時間，就和搜尋找到的地點一樣。',
  'help.guide.place-by-hand.tip.1':
    '編輯沒有自己營業時間的地點時，會自動從左側的「地點詳細資料」複製營業時間。如果地點已經有營業時間，旁邊的按鈕可以改用查到的時間。',
  'help.guide.place-by-hand.tip.2':
    '你輸入的營業時間會取代查到的時間，所以有季節性營業時間的咖啡廳，會顯示你知道的時間。',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': '天',
  'help.ctx.trip-days.summary':
    '計畫的左欄：每天一張卡片，依序列出當天的停留點、備註、預訂和交通，以及停留點之間的路線。旅行真正是在這裡規劃的。',
  'help.ctx.trip-days.bullet.1':
    '頂部的標題列：左側是「匯出」（PDF、日曆、GPX）；右側是復原箭頭、「展開所有天數」／「收合所有天數」、「重新排序日期」，以及在有預訂可繪製路線時出現的「顯示所有預訂路線」。',
  'help.ctx.trip-days.bullet.2':
    '每日卡片：一個帶有天數和天氣預報的方塊、標題（命名之前為「第 1 天」）和日期，其下是住宿的標籤（入住日為綠色，退房日為紅色，尚未確認時為虛線；它的票券可開啟預訂）以及租車的標籤。點擊標題可開啟當天，箭頭可將它收合，+（「新增到當天」）會開啟選單：「新增地點到這一天」、「新增住宿」、「新增交通」、「大眾運輸」和「新增備註」。在標題上按右鍵可得到相同的選項，另外還有「清空當天」。',
  'help.ctx.trip-days.bullet.3':
    '一天之內：依序排列的停靠點，每個都有圖片、分類圖示、名稱、時間和描述、釘在其上的預訂以及同行的人；筆記；當天的預訂和交通，依類型著色。將游標移到停靠點上會看到握把、圖片上的鎖、箭頭、「新增預訂」和三個點（「更多選項」）；停靠點和筆記也可以按右鍵開啟選單。',
  'help.ctx.trip-days.bullet.4':
    '展開的那一天有兩個停靠點之後，下方會出現路線列。「路線」會在地圖上顯示當天路線和停靠點之間每一段的行車時間。三個圖示用來設定當天的「開車」、「步行」或「騎單車」，接著是「最佳化」、「在 Google Maps 中開啟」和「在 CoMaps 中開啟」。',
  'help.ctx.trip-days.bullet.5':
    '把地點加到某一天有幾種方式：從地點欄拖曳一列過來、使用該列上的「+ 天」、使用當天的 + 或空白日期上的「新增地點到這一天」，或是從地點詳細資料中加入。',
  'help.ctx.trip-days.bullet.6':
    '底部的「總費用」會加總「費用」中屬於當天停靠點和預訂的支出，每筆只算一次，並以你的顯示貨幣表示。',
  // read-day-plan
  'help.guide.read-day-plan.title': '看懂一天的計畫',
  'help.guide.read-day-plan.goal': '在更動任何內容之前，先了解日期卡片的每個部分代表什麼。',
  'help.guide.read-day-plan.step.1':
    '標題區：一個顯示天數和天氣預報的方塊，接著是「第 1 天」或你取的標題，以及日期。下方有住宿的標籤（入住日為綠色，退房日為紅色，尚未確認時為虛線，標籤上的票券可開啟預訂）和租車。點擊標題區可展開當天（詳細資訊面板會在地圖上方開啟）。右側的 +（「新增到當天」）可新增地點、住宿、交通、大眾運輸接駁或筆記，箭頭則用來收合卡片。',
  'help.guide.read-day-plan.step.2':
    '一個停靠點：它的圖片、分類圖示和名稱，有「開始」時間時會顯示時間，然後是描述；「當天備註」顯示在下方。將游標移到該列上，控制項就會出現：左邊的握把用來拖曳，圖片會變成鎖頭用於路線最佳化，右端則有箭頭（「上移」、「下移」）、「新增預訂」和三個點（「更多選項」）。',
  'help.guide.read-day-plan.step.3':
    '停靠點上的預訂會以「預訂」徽章的形式附在它上面，確認後為綠色，待確認時為琥珀色，附其時間和承運方；點擊徽章可開啟預訂，旁邊的路線按鈕會繪製它的路線。交通是獨立的一列，依類型著色，附其時間以及「出發日期」或「到達日期」。點擊預訂會開啟詳細資訊；在那裡的「編輯」可修改它。',
  'help.guide.read-day-plan.step.4':
    '開啟「路線」後，兩個停靠點之間的連接線會依當天的交通方式顯示該段需要多久、有多遠；點擊它可以只為那一段更改交通方式。',
  'help.guide.read-day-plan.step.5':
    '開啟的那一天的停靠點下方有路線列：「路線」會在地圖上繪製當天的路線，三個圖示可選擇「開車」、「步行」或「騎單車」，然後「最佳化」會重新排序停靠點，「在 Google Maps 中開啟」和「在 CoMaps 中開啟」會在那裡開啟當天行程。',
  'help.guide.read-day-plan.result': '卡片上的每個符號都有它的意義；下面的指南會說明如何修改每一個。',
  'help.guide.read-day-plan.tip.1':
    '在停靠點上按右鍵，或點擊它的三個點，即可開啟選單：「編輯」、「從當天移除」、「從路線中排除」、「開啟網站」、「儲存到收藏」、「刪除」。導航 App 則在地點詳細資訊的「導航」下。',
  'help.guide.read-day-plan.tip.2':
    '將滑鼠移到停留點上，列的末端會出現「新增預訂」。在這裡建立的預訂，會連結到當天的這個停留點。',
  // place-onto-day
  'help.guide.place-onto-day.title': '把地點放到某一天',
  'help.guide.place-onto-day.goal': '把清單中的地點加入某一天，成為停留點，並放在順序中適當的位置。',
  'help.guide.place-onto-day.step.1':
    '把地點欄中的一列拖到當天的卡片上。放在兩個停靠點之間，就會剛好插在那個位置；放在當天的標題上，則會加到最後。',
  'help.guide.place-onto-day.step.2':
    '不用拖曳也可以：點擊標題展開那一天，然後點擊地點那一列末端的圓形 +（「+ 天」），或對該列按右鍵並選擇「+ 天」。',
  'help.guide.place-onto-day.step.3':
    '在當天的 + 選單或空白日期上點選「新增地點到這一天」，會開啟地點表單，新地點會立即加到那一天。',
  'help.guide.place-onto-day.step.4':
    '展開某一天後，地點詳細資訊中的「新增到當天」會把地點加到那一天。地點欄標題中的「加入當天」則會直接在展開的那一天建立新地點。',
  'help.guide.place-onto-day.result':
    '這個地點現在是當天的停留點，會以當天的編號顯示在地圖上，地點欄也會把它算在「計劃中」之下。',
  'help.guide.place-onto-day.tip.1':
    '一個地點可以排在好幾天：第二天也從地點欄加入即可。如果是把停留點從一張日期卡片拖到另一張，則是移動它。',
  'help.guide.place-onto-day.tip.2': '標題列中的復原箭頭可以取消這次指派。',
  'help.guide.place-onto-day.tip.3':
    '停留點不能放在兩個有固定時間的紀錄之間，也不能放在已有時間的預訂之前，因為行程會維持時間順序。',
  // reorder-stops
  'help.guide.reorder-stops.title': '調整一天的順序',
  'help.guide.reorder-stops.goal': '把停留點上移或下移，或移到另一天。',
  'help.guide.reorder-stops.step.1': '將游標移到停靠點上，拖曳它的握把到卡片中的新位置。',
  'help.guide.reorder-stops.step.2': '或者使用游標所在停靠點右端的箭頭（「上移」、「下移」）：每點一次移動一格。',
  'help.guide.reorder-stops.step.3': '把停留點拖到另一天的卡片上，就會移到那一天，原來那天就不再有這個停留點。',
  'help.guide.reorder-stops.step.4':
    '有固定時間的停靠點，在移動會破壞當天順序時會詢問「移除時間？」，因為時間決定了它的位置：「確認」會移除時間並讓它去任何地方，「取消」則保持當天原樣。',
  'help.guide.reorder-stops.result': '路線和行車時間會立即依新的順序更新。',
  'help.guide.reorder-stops.tip.1':
    '有固定時間的預訂會停在它的時間所對應的位置。如果你把它放到當天的其他位置，它會自動移回去。如果把它拖到另一天的卡片上，它就會移到那一天。',
  'help.guide.reorder-stops.tip.2':
    '當天有三個以上停靠點時，路線列中的「最佳化」會依最短路徑重新排序整天的行程。想讓某個停靠點留在原位，請先鎖定它。',
  // set-stop-times
  'help.guide.set-stop-times.title': '為停留點設定時間',
  'help.guide.set-stop-times.goal': '設定停留點的開始和結束時間，讓這一天像一份行程時間表。',
  'help.guide.set-stop-times.step.1':
    '在停留點上按右鍵，或點選它的三個點，然後選擇「編輯」。從當天開啟表單時，位置欄正下方就有該天的「開始」和「結束」。',
  'help.guide.set-stop-times.step.2':
    '填寫「開始」，需要的話也填寫「結束」。「時間衝突：」會提醒你，當天另一個有時間的停留點與它重疊。「結束」早於「開始」時，無法按「更新」。',
  'help.guide.set-stop-times.step.3': '點選「更新」。停留點會出現時間標籤，並依時間移到當天正確的位置。',
  'help.guide.set-stop-times.result': '有設定時間的停留點會維持在順序中的位置，沒有時間的停留點則排在它們前後。',
  'help.guide.set-stop-times.tip.1': '時間是屬於那一天的停留點；同一個地點在另一天可以設定不同的時間。',
  'help.guide.set-stop-times.tip.2':
    '要手動移動有時間的停留點，請直接拖曳它。TREK 會詢問「移除時間？」，按下「確認」後，時間就會被移除。',
  'help.guide.set-stop-times.tip.3':
    '同一個表單中的「當天備註」，適合記錄只適用於這一天的資訊，例如餐廳訂位或票券編號。',
  // remove-from-day
  'help.guide.remove-from-day.title': '從某一天移除停留點',
  'help.guide.remove-from-day.goal': '從某一天移除地點，但不從旅行中刪除。',
  'help.guide.remove-from-day.step.1': '對停靠點按右鍵，或點擊它的三個點，然後選擇「從當天移除」。',
  'help.guide.remove-from-day.step.2':
    '停留點會從那一天移除。地點仍留在地點欄中，如果它不在其他任何一天，就會列在「未規劃」下。',
  'help.guide.remove-from-day.result': '當天的內容、路線和費用都會更新。點選「復原」箭頭可以還原這個停留點。',
  'help.guide.remove-from-day.tip.1': '同一個選單中的「刪除」則會把地點從整趟旅行移除，包括每一天。',
  'help.guide.remove-from-day.tip.2': '「從當天移除」也在地點的詳細資料面板中，就在「新增到當天」旁邊。',
  // lock-stop
  'help.guide.lock-stop.title': '鎖定停留點的位置',
  'help.guide.lock-stop.goal': '最佳化路線時，讓停留點維持原本的位置。',
  'help.guide.lock-stop.step.1': '將滑鼠移到停留點的圖片上，點選鎖頭：「路線最佳化時保持位置」。',
  'help.guide.lock-stop.step.2': '接著「最佳化」會圍繞它排序其他停留點。再點一次鎖頭（「點選解鎖」）即可解鎖。',
  'help.guide.lock-stop.result': '圖片上會顯示鎖頭；在你解除鎖定之前，這個停留點的位置都不會變動。',
  'help.guide.lock-stop.tip.1': '有固定時間的停留點會被它的時間鎖定，最佳化時不會被移動。',
  'help.guide.lock-stop.tip.2':
    '鎖定只維持到你重新載入頁面為止。重新載入後，所有停留點都會解除鎖定，只有設有時間的停留點仍然固定。',
  // day-note
  'help.guide.day-note.title': '為某一天加上備註',
  'help.guide.day-note.goal': '把提醒、票號或備案直接記在那一天。',
  'help.guide.day-note.step.1': '點擊當天標題中的 +（「新增到當天」），然後選擇「新增備註」。',
  'help.guide.day-note.step.2':
    '在對話框頂部「備註」的位置輸入備註名稱，日期卡片上顯示的就是這個名稱。其餘內容寫在「每日備註」：上方的工具列可以設定格式（粗體、清單、連結、引用），左邊的「預覽」會顯示這一列的樣子。',
  'help.guide.day-note.step.3': '選擇「圖示」和「顏色」，讓備註容易和停留點區分，然後點選「新增」。',
  'help.guide.day-note.step.4':
    '備註會像停靠點一樣放在當天：拖曳到位置，或使用它的箭頭。點擊即可編輯。「刪除」在對話方塊裡，也在它的三個點或右鍵選單中，並且會先詢問「刪除筆記？」。',
  'help.guide.day-note.result': '備註成為當天和 PDF 的一部分，位置就是你拖放到的地方。',
  'help.guide.day-note.tip.1': '備註中的連結會在新分頁開啟，單一的換行會保持為換行。',
  'help.guide.day-note.tip.2': '備註是依天數記錄的。整趟旅行的備註請寫在 Collab。',
  // day-route
  'help.guide.day-route.title': '顯示並最佳化當天路線',
  'help.guide.day-route.goal': '查看停留點之間的路線，選擇交通方式，並讓 TREK 幫你排出順序。',
  'help.guide.day-route.step.1':
    '開啟當天，並點擊停靠點下方路線列中的「路線」：停靠點之間的路線會繪製在地圖上，停靠點之間的連接線會顯示每一段的時間和距離。',
  'help.guide.day-route.step.2':
    '旁邊的三個圖示用來設定當天的交通方式：「開車」、「步行」或「騎單車」。各段會重新計算。外掛也可以新增自己的交通方式。',
  'help.guide.day-route.step.3':
    '點擊連接線可更改該段的交通方式：選一種方式；在有提供的地方選「大眾運輸」來搜尋接駁班次；或選「使用當日預設」，改回跟隨當天的交通方式。',
  'help.guide.day-route.step.4':
    '「最佳化」（圓形箭頭）會在有三個以上停靠點時，依最短路徑重新排列停靠點。有鎖定或固定時間的停靠點會維持原位。如果當天有住宿，路線會從住宿出發。',
  'help.guide.day-route.step.5':
    '「在 Google Maps 中開啟」或「在 CoMaps 中開啟」會在該 App 中把整天當作一條路線開啟，方便途中導航，CoMaps 也會沿用當天的交通方式。',
  'help.guide.day-route.result': '這一天成為一條附有時間的路線；順序一改變，「總費用」和各路段就會更新。',
  'help.guide.day-route.tip.1': '路線預設由 OSRM 提供；管理員可以在「用戶預設設定」中，讓 TREK 改用其他路線引擎。',
  'help.guide.day-route.tip.2': '無法規劃路線的路段不會顯示時間。請確認兩個停留點都有座標。',
  'help.guide.day-route.tip.3': '復原箭頭可以還原一次最佳化。',
  // manage-days
  'help.guide.manage-days.title': '新增、重新排序與重新命名天數',
  'help.guide.manage-days.goal': '調整天數本身，而不只是各天裡的地點。',
  'help.guide.manage-days.step.1':
    '天數來自旅行的日期；在儀表板上旅行的編輯表單中修改日期，兩端就會新增或移除天數。在移除有內容的日子之前，會有一份清單說明哪幾天會被移除以及上面有什麼。',
  'help.guide.manage-days.step.2':
    '標題列中的「重新排序日期」會開啟一份列表：拖曳握把移動某一天，或使用「上移」和「下移」，這一天會連同它的地點、備註和預訂一起移動。列表下方，「新增」搭配下一個日期會在最後一個有日期的日子後加一天，並將旅行延長一天；「無日期」則附加一個沒有日期的日子。沒有日期的旅行只有「新增日期」。',
  'help.guide.manage-days.step.3':
    '列末端的垃圾桶「刪除這一天」會先詢問：它會列出隨這一天一起消失的內容，包括地點、筆記和預訂、在這天入住或退房的住宿，以及日期要往前移的天數。「刪除這一天」會移除它，「取消」則保留；最後一天無法刪除。',
  'help.guide.manage-days.step.4':
    '要重新命名某一天，請開啟那一天，點選地圖上方詳細資料面板中標題旁邊的鉛筆。這個名稱會取代卡片和 PDF 中的「第 1 天」。',
  'help.guide.manage-days.step.5':
    '標題列中的「展開所有天數」和「收合所有天數」可一次展開或收合所有卡片。要收合單張卡片，請點擊它的箭頭。',
  'help.guide.manage-days.result':
    '日期是跟著位置的：把某一天往上移，它就會取得較早的日期，而它的停留點、備註和預訂也會跟著一起移動。',
  'help.guide.manage-days.tip.1': '移動天數可以用復原箭頭復原，刪除某一天則無法復原。',
  'help.guide.manage-days.tip.2': '計畫底部的「總費用」會加總整趟旅行，「費用」分頁則提供明細。',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': '看懂行程中的預訂與交通',
  'help.guide.bookings-in-plan.goal': '了解預訂建立之後會出現在哪裡，以及要從哪個畫面建立。',
  'help.guide.bookings-in-plan.step.1':
    '交通（航班、火車、渡輪、公車、汽車）是依類型上色的一列，標有時間，並在出發當天顯示「出發日期」、抵達當天顯示「到達日期」。旁邊的地球儀標示時區，有中途停留的航班，每一段各佔一列。大眾運輸接駁可點擊箭頭展開路線。點擊某一列會開啟預訂，在那裡點擊「編輯」即可修改。',
  'help.guide.bookings-in-plan.step.2':
    '連結到停留點的預訂（餐廳、旅遊團）會在該停留點上顯示為「預訂」標籤，並附上時間。已確認時是綠色，待確認時是琥珀色。有日期但沒有停留點的預訂，在當天會自成一列。',
  'help.guide.bookings-in-plan.step.3':
    '旅館住一晚屬於「住宿」：它在當天標題中的標籤在入住日為綠色，退房日為紅色，點擊它的票券可開啟預訂。當天的詳情面板會將它列在「住宿」下，這些天的路線也從那裡開始。',
  'help.guide.bookings-in-plan.step.4':
    '在地圖上，預訂列上的路線按鈕會繪製它的路線；標題列中的「顯示所有預訂路線」則會全部繪製出來。',
  'help.guide.bookings-in-plan.step.5':
    '建立方式：在游標所在的停靠點上使用「新增預訂」，在每日的 + 選單中使用「新增交通」和「大眾運輸」，以及「預訂」和「交通」分頁，後者有完整列表，並支援匯入和檔案。',
  'help.guide.bookings-in-plan.result': '每筆預訂在計畫中只會出現一次。各分頁則是用清單的形式顯示同樣的預訂。',
  'help.guide.bookings-in-plan.tip.1':
    '已確認和待確認是你在預訂上設定的狀態；計畫在停靠點上顯示它，「預訂」分頁則兩者都計算。',
  'help.guide.bookings-in-plan.tip.2':
    '如果你把有時間的預訂放到當天的其他位置，它會移回自己的時間所對應的位置。如果把它拖到另一天的卡片上，它就會移到那一天。要更改時間，請編輯該預訂。',
  // export-plan
  'help.guide.export-plan.title': '匯出計畫',
  'help.guide.export-plan.goal': '把計畫匯出成文件、匯入行事曆，或存到 GPS 裝置。',
  'help.guide.export-plan.step.1': '點擊天數上方標題列左側的「匯出」。',
  'help.guide.export-plan.step.2':
    '「文件」：PDF 會開啟每一天的列印檢視，內含停靠點、筆記和預訂，開頭是路線總覽地圖。「我的計劃 PDF」則只保留你參與的部分。在檢視中，「每天分頁」會讓每一天從新的一頁開始，「交通備註」會加入你的交通備註，「儲存為 PDF」則下載檔案。',
  'help.guide.export-plan.step.3':
    '「行事曆」：「下載 .ics」會把預訂存成行事曆檔案；「訂閱行事曆」會提供連結，你的行事曆應用程式會自動更新。',
  'help.guide.export-plan.step.4':
    '「地圖與 GPS」(GPX)：「整趟行程」會匯出地點、每日路線和軌跡，「僅地點」只匯出圖釘，「按天產生路線」則每天一條路線，適合離線地圖和 GPS 裝置。',
  'help.guide.export-plan.result': '檔案會下載到你的裝置，旅行本身不會有任何變動。',
  'help.guide.export-plan.tip.1':
    '要用地圖應用程式開啟單獨一天，請使用它的路線列：「在 Google Maps 中開啟」或「在 CoMaps 中開啟」。',
  'help.guide.export-plan.tip.2':
    '「訂閱行事曆」需要在你的設定中開啟行事曆訂閱，並有分享旅行的權限；「儀表板」中有相關指南。',
  'help.guide.export-plan.tip.3': '匯出屬於閱讀行為：旅行的每位成員都可以匯出 PDF、.ics 和 GPX。',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': '地點詳細資料',
  'help.ctx.trip-place.summary':
    '選擇地點時在地圖上方開啟的卡片：旅行對它所知的一切、大家給它的星級、它的圖片和檔案，以及把它放到開啟的那一天、在地圖應用程式中開啟或儲存到清單的按鈕。',
  'help.ctx.trip-place.bullet.1':
    '點擊地點欄中的某一列、某一天內的停靠點，或地圖上的標記，卡片就會在地圖上方開啟。如果是從某一天開啟，卡片會知道你指的是哪個停靠點，也會顯示該停靠點的參與者和預訂。遊程（「遊程」分頁中的健行、騎行或散步）則會開啟自己的遊程卡片，而不是這張。',
  'help.ctx.trip-place.bullet.2':
    '標題區有圓形圖片、名稱、單行位址，以及顯示已知資訊的標籤：營業中或已關閉、分類、時間、價格、電話號碼、電子郵件和座標。點擊圖片可改用你自己的圖片，或使用地點檔案中的照片。雙擊名稱可直接重新命名地點，右側的 X 可關閉卡片。圖片、重新命名、「編輯」和「刪除」只提供給有權修改地點的旅伴。',
  'help.ctx.trip-place.bullet.3':
    '再往下是：每位旅伴給這個地點的星數、描述和備註，以及停留點有備註時顯示的「當天備註」。',
  'help.ctx.trip-place.bullet.4':
    '接著依實際情況，會出現「營業時間」、「軌跡顏色」、「軌跡資料」和「檔案」。「檔案」標題中的「上傳」可從你的電腦新增檔案。列表也會顯示釘選在這個停靠點上的檔案，以及它的預訂檔案，包括旅館的確認文件。外掛可以在下方新增自己的列。',
  'help.ctx.trip-place.bullet.5':
    '底部那一列：展開某一天時有「新增到當天」或「從當天移除」，接著是「導航」（在「設定」中選好地圖 App 後，會顯示該 App 的名稱）、「開啟網站」和「儲存到收藏」。右側的紅色垃圾桶用來刪除地點，「編輯」則開啟地點表單。',
  'help.ctx.trip-place.bullet.6':
    '從搜尋中選取的地點會帶有 TREK 索引或 OpenStreetMap 所知的資訊：標題標籤中的「開啟」或「已關閉」，圖片周圍有綠色或紅色外圈，依該地點自己的時間判定；電話號碼同樣是標籤；下方是「營業時間」，該列顯示當天的時段，整週的時段點擊後展開；網站在「開啟網站」後面。Google 的評分只會在透過 Google 找到的地點上顯示，且需要這個 TREK 有 Google 金鑰。你在地點表單中親自輸入的營業時間、電話號碼和電子郵件，優先於查詢到的內容，也會決定外圈的顏色。',
  // read-place
  'help.guide.read-place.title': '從卡片了解一個地點',
  'help.guide.read-place.goal': '在一張卡片上看完旅行中關於某個地點的所有資訊。',
  'help.guide.read-place.step.1':
    '在天數欄中，點選你想查看的停留點。卡片會在地圖上方開啟，該停留點在它所屬的那一天中也會持續標示。',
  'help.guide.read-place.step.2':
    '標題：圓形圖片、名稱和位址在同一行；提示文字包含完整位址。下方的標籤依地點自己的時間顯示現在是「開啟」還是「已關閉」，圖片周圍也有相應的綠色或紅色外圈。它們還包含分類、時間、電話號碼和電子郵件（點擊會交給你的手機或郵件應用程式），在寬螢幕上還有精確的座標。右側的 X 會再次關閉卡片。',
  'help.guide.read-place.step.3':
    '標題下方的第一個區塊是「評分」：顯示每位旅伴給這個地點的星等，以及平均分數和投票人數。還沒有人投票時，會顯示「尚未評分」。',
  'help.guide.read-place.step.4':
    '接著是描述，描述下方是備註。兩者都是地點表單裡的文字，並套用格式：清單、連結和粗體都有效。',
  'help.guide.read-place.step.5': '「參與者」會顯示誰要去這個停留點。在你移除某人之前，所有人都會包含在內。',
  'help.guide.read-place.step.6':
    '再往下是「營業時間」：這一列會顯示你正在查看的那一天的時段，點選即可展開整週，當天以粗體顯示。「檔案」就在旁邊。',
  'help.guide.read-place.result':
    '卡片會一直開著，直到你按 X 關閉，或改選另一個地點。整週的營業時間會保持展開，它所屬的停留點也會在天數欄中持續標示。',
  'help.guide.read-place.tip.1':
    '從地點欄選取時，卡片只認得地點而不認得停靠點，所以不會顯示參與者，只顯示屬於地點本身的預訂，例如旅館的住宿。要看到全部內容，請在當天內選擇停靠點。',
  'help.guide.read-place.tip.2':
    '如果你有權修改地點，雙擊名稱就能直接重新命名，不必開啟表單。按 Enter 儲存，按 Escape 取消更改。',
  'help.guide.read-place.tip.3':
    '手動輸入的地點只有表單中填寫的資料。你可以點擊「編輯」，自行填寫「電話」、「電子郵件」和營業時間；也可以從「搜尋地點…」下的建議中選擇地點，再點擊「更新」讓系統查詢這些資料。Google 的評分需要 Google 金鑰。',
  // rate-place
  'help.guide.rate-place.title': '為地點評分',
  'help.guide.rate-place.goal': '為地點打上自己的星等，也能看到其他人給的評分。',
  'help.guide.rate-place.step.1': '開啟地點。星號列就在標題正下方，顯示目前投票的平均分數，括號中是票數。',
  'help.guide.rate-place.step.2': '點選你想給的星星。滑鼠移過時星星會跟著亮起，讓你看到自己即將給幾顆星。',
  'help.guide.rate-place.step.3':
    '你的評分會立即計入平均，旁邊的頭像則是投過票的人。將滑鼠移到這一列上，就能看到每個人給的星數。',
  'help.guide.rate-place.step.4': '相同的平均分數也會顯示在地點欄中該地點的那一列，讓你輕鬆在清單裡找到最好的地點。',
  'help.guide.rate-place.result':
    '旅行中的所有人都能在這個地點上看到你的星等。清單上方篩選列中的星號，現在可以只顯示達到最低評分的地點。',
  'help.guide.rate-place.tip.1': '每位旅伴都可以評分，即使在只有部分人能更動地點的旅行中也一樣。',
  'help.guide.rate-place.tip.2': '再點一次你已經給過的星，就能收回你的評分。如果沒有人評分，地點又會顯示「尚未評分」。',
  'help.guide.rate-place.tip.3': '星號旁邊最多顯示六位投票者的頭像。提示文字會列出所有投票者，並標出你自己。',
  // place-image
  'help.guide.place-image.title': '為地點放上你自己的圖片',
  'help.guide.place-image.goal': '用你自己的照片取代自動產生的縮圖。',
  'help.guide.place-image.step.1': '從地點欄開啟這個地點。',
  'help.guide.place-image.step.2':
    '將游標移到標題中的圓形圖片上：會出現相機圖示，提示文字顯示「上傳圖片」。點擊它並選擇你的檔案。如果地點的檔案中已有照片，TREK 會先請你選擇：「從裝置上傳」，或「從附加檔案選擇」下的其中一張圖片。',
  'help.guide.place-image.step.3': '卡片頂端現在會顯示你的圖片，圖片角落有一個紅色的小 X。',
  'help.guide.place-image.step.4': '同一張圖片也會顯示在地點欄中該地點的那一列，以及它在地圖上的標記。',
  'help.guide.place-image.result':
    '你的圖片會在所有地方作為這個地點的圖片：卡片、地點欄、當天的停留點、地圖上的標記，以及分享出去的旅行。',
  'help.guide.place-image.tip.1': '支援 JPG、PNG、GIF 和 WebP，iPhone 的 HEIC 檔案則會在上傳時自動轉換。',
  'help.guide.place-image.tip.2': '角落的 X 可以移除你的圖片，自動圖片就會重新顯示。地點本身不受影響。',
  'help.guide.place-image.tip.3':
    '如果你沒有加入圖片，TREK 會依地點座標查找一張，找不到時就改用分類的圖示。只有有權修改地點的旅伴才能設定圖片。',
  // place-day-assign
  'help.guide.place-day-assign.title': '把地點加到目前開啟的日期，或從中移除',
  'help.guide.place-day-assign.goal': '使用卡片上的按鈕，不用把該列拖過整個規劃器。',
  'help.guide.place-day-assign.step.1':
    '在天數欄中點選某一天的標題。那一天就會成為展開的那一天，卡片的操作會套用到那一天。',
  'help.guide.place-day-assign.step.2':
    '在地點欄中點選一個還沒排進那一天的地點。它的卡片會開啟，底部那一列會出現「新增到當天」。',
  'help.guide.place-day-assign.step.3': '點選「新增到當天」。停留點會加到那一天的最後，按鈕也會變成「從當天移除」。',
  'help.guide.place-day-assign.step.4': '停留點現在已在那一天，排在清單最後。請把它往上拖到適當的位置。',
  'help.guide.place-day-assign.step.5': '「從當天移除」會把停留點從那一天再次移除，卡片也會重新顯示「新增到當天」。',
  'help.guide.place-day-assign.result': '停留點會加入那一天，或從那一天移除。地點本身不會有任何變動。',
  'help.guide.place-day-assign.tip.1':
    '這個按鈕只有在開啟某一天時才會出現。沒有開啟任何一天時，就沒有可以加入地點的日期。',
  'help.guide.place-day-assign.tip.2':
    '如果你把停留點從某一天移除，地點仍會留在旅行和地點欄中。「刪除」才會把它從所有地方移除。',
  'help.guide.place-day-assign.tip.3':
    '由住宿預訂加到當天的停留點，兩個按鈕都不會出現。要新增或移除那一晚，請在當天的住宿區塊中操作。',
  // place-participants
  'help.guide.place-participants.title': '指定誰要去這個停留點',
  'help.guide.place-participants.goal': '選擇誰要去某個停留點，而不更動旅行的成員。',
  'help.guide.place-participants.step.1': '點選某一天裡的停留點，卡片會開啟，「參與者」會列出旅行中的所有人。',
  'help.guide.place-participants.step.2':
    '點選某位旅伴的標籤，即可把他從這個停留點移除。將滑鼠移到標籤上時，名字會出現刪除線。',
  'help.guide.place-participants.step.3': '只要有人不在，就會出現虛線的 +。點選它即可看到誰不在這個停留點上。',
  'help.guide.place-participants.step.4':
    '點選名字，就能把那個人重新加回來。所有人都加回來之後，這個停留點就又屬於整個團體。',
  'help.guide.place-participants.result': '這個停留點只會顯示你選的旅伴，團體裡的其他人那段時間可以自由活動。',
  'help.guide.place-participants.tip.1':
    '「參與者」只有在選取停留點時才會出現，所以請在某一天中選取地點，而不是在地點欄中。而且只有旅行者超過一位的旅行才會有這項功能。',
  'help.guide.place-participants.tip.2': '如果沒有選任何人，就代表所有人都去。所以你無法從停留點移除最後一位旅行者。',
  'help.guide.place-participants.tip.3': '沒有自己帳號的訪客，也可以和其他人一樣成為參與者。',
  // place-booking
  'help.guide.place-booking.title': '停留點上的預訂',
  'help.guide.place-booking.goal': '查看屬於某個停留點的預訂、開啟它，並把新的預訂連結上去。',
  'help.guide.place-booking.step.1':
    '開啟預訂所屬的停留點。卡片會在「預訂」下，以一張獨立的小卡片列出這筆預訂，上面有預訂名稱，以及「已確認」或「待確認」。',
  'help.guide.place-booking.step.2':
    '預訂卡片會顯示「日期」、「時間」和「預訂碼」、預訂其他資訊的標籤（航班編號、月台、入住），以及預訂的備註（如果有的話）。',
  'help.guide.place-booking.step.3': '點選預訂卡片，預訂內容會在地圖上方開啟。',
  'help.guide.place-booking.step.4':
    '預訂底部的「編輯」會開啟預訂本身的表單。在這個表單中，「關聯日程分配」就是把預訂連結到停留點的欄位，這裡已經顯示了這個停留點。確認後再關閉表單即可。',
  'help.guide.place-booking.step.5':
    '要為某個停留點建立新預訂，請從天數欄開始：把游標移到停留點上，點選它末端的票券圖示「新增預訂」。表單會以「新建預訂」開啟，並已連結到該停留點。',
  'help.guide.place-booking.result':
    '預訂會連結到停留點：它會顯示在卡片和當天的行程中，它的檔案也會列在這裡的「檔案」下。',
  'help.guide.place-booking.tip.1':
    '預訂會顯示在它所釘選的停靠點上，旅館預訂則無論你從哪裡開啟旅館，都會一併顯示。沒有停靠點的預訂，則顯示在「預訂」分頁。',
  'help.guide.place-booking.tip.2': '多筆預訂可以共用同一個停留點，例如午餐，以及從同一地點出發的行程。',
  'help.guide.place-booking.tip.3':
    '火車、航班或渡輪的預訂，「編輯」會改為開啟交通表單，也就是「交通」分頁使用的那個表單。',
  // place-files
  'help.guide.place-files.title': '把地點的票券和地點放在一起',
  'help.guide.place-files.goal': '把票券、憑證或地圖附加到它所屬的地點。',
  'help.guide.place-files.step.1':
    '開啟地點。「檔案」位於詳細資訊下方，如果地點有營業時間，則在「營業時間」旁邊；地點沒有檔案時，僅顯示「檔案」。',
  'help.guide.place-files.step.2': '點擊「檔案」標題右側的「上傳」並選擇檔案。',
  'help.guide.place-files.step.3': '按鈕會顯示該地點有幾個檔案，清單也會自動展開。',
  'help.guide.place-files.step.4': '每一列會顯示檔案名稱和大小。點選即可開啟檔案。',
  'help.guide.place-files.result': '檔案會附加在地點上，並計入卡片上的數量，同時也會出現在旅行的「檔案」分頁中。',
  'help.guide.place-files.tip.1':
    '「檔案」也會列出固定在這個停靠點上以及掛在其預訂上的內容，所以旅館的確認文件會顯示在旅館上。',
  'help.guide.place-files.tip.2': '「上傳」一次可接受多個檔案，其中的照片可以成為地點的圖片。',
  'help.guide.place-files.tip.3': '如果你沒有上傳檔案的權限，就不會顯示「上傳」按鈕；地點上已有的檔案仍會顯示。',
  // place-navigation
  'help.guide.place-navigation.title': '用地圖應用程式或網站開啟地點',
  'help.guide.place-navigation.goal': '用你平常導航的應用程式開啟地點，前往那裡。',
  'help.guide.place-navigation.step.1': '開啟地點，點選底部那一列的「導航」。',
  'help.guide.place-navigation.step.2':
    '列表中是適用於這個地點的地圖 App：Google Maps、Waze、Apple Maps、OpenStreetMap 和 CoMaps，在 Android 上還有「其他地圖 App」。',
  'help.guide.place-navigation.step.3':
    '點選你常用的那一個。TREK 會盡可能把地點本身傳給該應用程式，而不只是座標，這樣你就能抵達正確的入口。',
  'help.guide.place-navigation.step.4': '旁邊的「開啟網站」會在新分頁中開啟地點自己的網站，上面有營業時間和票券資訊。',
  'help.guide.place-navigation.result':
    '地圖 App 會開啟該地點，網站則在新分頁中開啟，旅行中的任何內容都不會改變。如果 TREK 已安裝為 App，就會直接開啟地圖 App，而不是新分頁。',
  'help.guide.place-navigation.tip.1':
    'Waze 會直接開始導航。其他應用程式則是開啟該地點，你還需要再點一下才會開始導航。',
  'help.guide.place-navigation.tip.2':
    '提供哪些 App 取決於地點和你的裝置：Android 上不提供 Apple Maps，高德地圖只會出現在位於中國的地點，Waze、Apple Maps 和 CoMaps 則需要地點的座標。「其他地圖 App」會用你 Android 手機上的任何地圖 App 開啟該地點。',
  'help.guide.place-navigation.tip.3':
    '在「設定」的「開啟地點方式」下選一次你慣用的地圖 App，按鈕就會顯示它的名稱並直接開啟。如果某個地點只適用一個 App，也是這樣。',
  // place-to-collection
  'help.guide.place-to-collection.title': '把地點儲存到你的某份清單',
  'help.guide.place-to-collection.goal': '把這趟旅行中發現的地點存起來，留給下一趟旅行。',
  'help.guide.place-to-collection.step.1': '開啟地點，點擊卡片底部那一列的「儲存到收藏」。',
  'help.guide.place-to-collection.step.2':
    '「儲存到清單」會顯示你擁有或共享的每個清單。右側實心的書籤標記表示已包含此地點的清單。',
  'help.guide.place-to-collection.step.3': '點選那份清單。地點會立刻加入其中。',
  'help.guide.place-to-collection.step.4': '用 X 關閉對話方塊，卡片中的按鈕會顯示「已儲存」。',
  'help.guide.place-to-collection.result': '地點會連同圖片、備註和地址一起存進你的清單，下次旅行就能直接使用。',
  'help.guide.place-to-collection.tip.1':
    '這個按鈕只有在「收藏」擴充套件開啟時才會出現，管理員可以在「擴充套件」中開啟。',
  'help.guide.place-to-collection.tip.2':
    '一個地點可以同時放在多份清單中，並在每份清單中有各自的狀態：在一份是「想法」，在另一份是「已造訪」。',
  'help.guide.place-to-collection.tip.3':
    '選擇器頂部地點名稱下方的「標記為已造訪」會在清單中勾掉它；如果地點在你的多個清單中，它會顯示「在所有清單中標記」並一次完成所有清單。「檢視」會在「收藏」中開啟你的清單。',
  // place-track
  'help.guide.place-track.title': '查看軌跡並為它設定專屬顏色',
  'help.guide.place-track.goal': '查看匯入的步行路線有多長，並看出地圖上哪一條線是這條路線。',
  'help.guide.place-track.step.1': '地點欄中軌跡那一列有一小段線，顏色與它在地圖上的線相同。點選它。',
  'help.guide.place-track.step.2': '「軌跡資料」會顯示路徑長度，單位依你的設定。',
  'help.guide.place-track.step.3': '上方的「軌跡顏色」會顯示目前使用的顏色。點選這一列即可開啟色票。',
  'help.guide.place-track.step.4': '選擇一個顏色。地圖上的線條和該列上的色條會跟著改變。',
  'help.guide.place-track.step.5':
    '左邊的虛線格子「自動顏色」會讓軌跡恢復成預設顏色；右邊的滴管會開啟系統的顏色選擇器，讓你選其他任何顏色。',
  'help.guide.place-track.result': '軌跡會以你選的顏色繪製，不論是在卡片中、地點欄的那一列，還是地圖上。',
  'help.guide.place-track.tip.1':
    '只有帶有路徑的地點才有這兩個區塊：在遊程功能推出前從 GPX、KML 或 KMZ 檔案匯入的地點，或是在關閉遊程的 TREK 上匯入的地點。開啟遊程後，新的 GPX 檔案會成為遊程，並開啟自己的遊程卡片。',
  'help.guide.place-track.tip.2':
    '記錄了高度的軌跡，還會顯示最高點和最低點、上升和下降的公尺數，以及這段路線的剖面圖。',
  'help.guide.place-track.tip.3': '匯入時，每條軌跡都會分到自己的顏色，所以兩段步行路線不會是同一個顏色。',
  // read-place
  'help.guide.read-place.step.7':
    '底部的一列是你可以從這裡做的事：把地點放到開啟的那一天或移除、在地圖應用程式或它的網站中開啟、儲存到清單，右側則是刪除（紅色垃圾桶）或編輯。',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': '檔案',
  'help.ctx.trip-files.summary':
    '旅行的所有文件都在同一份清單中：車票、確認單、通行證和圖片。每份文件都有備註、連結到所屬地點或預訂的連結，以及可以還原它的回收站。',
  'help.ctx.trip-files.bullet.1':
    '「將檔案拖放到此處」是列下方的虛線框，可以接收拖放進去的檔案，點擊它則會開啟檔案選擇器。方框內會列出這個 TREK 接受的檔案類型，以及每個檔案的大小上限（最大 50 MB，除非管理員另外設定）。',
  'help.ctx.trip-files.bullet.2':
    '頂端的列包含「檔案」，以及篩選分頁「全部」、「PDF」、「圖片」和「文件」，每個分頁都附有數量。只要有檔案被加上星號，「全部」之後就會出現星號分頁；只要有筆記附有附件，最後就會出現「協作筆記」分頁。',
  'help.ctx.trip-files.bullet.3':
    '每一列會顯示縮圖或檔案類型、上傳者、名稱、名稱下方的備註、大小和日期，以及每個連結各一個徽章：地點、以名稱顯示的預訂或交通（把游標移上去會顯示「日程計劃」、「預訂」或「交通」），以及「來自協作筆記」。',
  'help.ctx.trip-files.bullet.4':
    '每一列末端最多有五個圖示，將游標移上去會顯示名稱：「收藏」、「分配」（鉛筆）、開啟、「下載」和「刪除」。「刪除」不會先詢問：檔案會進入垃圾桶，之後可以復原。離線時，筆記、連結、星號和垃圾桶仍可使用，並會在 TREK 重新上線後送出，只有上傳和移除其他連結需要網路連線。',
  'help.ctx.trip-files.bullet.5':
    '圖片或影片會以全螢幕開啟，可用方向鍵切換，並附有一排縮圖。其他文件則在對話框中開啟，頂端是名稱，下方有「在新標籤頁中開啟」和「下載」。錢包票卡會直接下載。',
  'help.ctx.trip-files.bullet.6':
    '工具列右端的垃圾桶圖示（「回收站」）會把清單切換到已刪除的檔案。在那裡可以還原或永久刪除每個檔案，工具列上的「清空回收站」則會全部刪除。旅行連接了文件儲存服務時，或只要有儲存服務開啟，對旅行所有者或管理員而言，「文件同步」就位於垃圾桶圖示的左邊。',
  // files-upload
  'help.guide.files-upload.title': '把文件加到旅行中',
  'help.guide.files-upload.goal': '把下載資料夾中的票券、確認單或照片上傳到旅行，讓旅行中的每個人都能開啟。',
  'help.guide.files-upload.step.1': '開啟旅行，點選分頁列中的「檔案」。旅行的文件會列在那裡，上方是上傳區。',
  'help.guide.files-upload.step.2':
    '點擊「將檔案拖放到此處」，選擇一個或多個檔案。檔案會逐一上傳，上傳期間方框會顯示「上傳中...」。方框內「或點選瀏覽」下方，會列出這個 TREK 接受的檔案類型和單一檔案的大小上限。',
  'help.guide.files-upload.step.3':
    '最後一個檔案上傳完成後，如果旅行中有任何地點或預訂，「分配檔案」就會自動為它開啟，對話框頂端會顯示檔案名稱。在「備註」下的「新增備註...」可以為檔案加一則備註，下方的清單則可以把檔案連結到地點或預訂。點選右上角的 × 關閉；關閉也不會遺失任何內容。',
  'help.guide.files-upload.step.4':
    '新檔案會出現在清單最上方，只有加了星號的檔案會排在它們之前。每一列會顯示上傳者、名稱、大小和日期。圖片會有縮圖，其他檔案則顯示類型。',
  'help.guide.files-upload.result': '文件已加入旅行，能看到這趟旅行的人都可以開啟和下載。',
  'help.guide.files-upload.tip.1': '你也可以直接把檔案從桌面拖到方塊上。檔案拖到方塊上方時，方塊會醒目標示。',
  'help.guide.files-upload.tip.2': '按 Ctrl+V 就能把剪貼簿中的圖片加到清單，所以不必先把預訂的截圖另存成檔案。',
  'help.guide.files-upload.tip.3':
    '上傳需要有上傳檔案的權限；沒有權限時，上傳方框根本不會出現。不在清單上的檔案類型會被拒絕並顯示訊息，且不會上傳任何東西。超過上限的檔案（除非管理員另外設定，否則為 50 MB）會在傳送前就被拒絕，訊息會指出上限。上傳也需要網路連線：離線時 TREK 會告知，且不會上傳任何東西。',
  // files-link
  'help.guide.files-link.title': '把文件連結到地點或預訂',
  'help.guide.files-link.goal': '讓你不只能從這份清單找到票券，也能從它所屬的那一天找到。',
  'help.guide.files-link.step.1': '點選該列最後的鉛筆圖示（「分配」）。「分配檔案」會開啟，對話框頂端顯示檔案名稱。',
  'help.guide.files-link.step.2':
    '在「備註」下，「新增備註...」可以輸入一行文字，之後會顯示在清單中檔案名稱的下方。按 Enter 或離開輸入框時就會儲存。',
  'help.guide.files-link.step.3':
    '左邊的「地點」下會列出旅行中的地點，依所在日期分組並附上日期，最後的「未分配」則是不在任何一天的地點。點選一個地點即可勾選。',
  'help.guide.files-link.step.4': '右邊的「預訂」和「交通」下是旅行中的預訂。點選文件所屬的那一筆，它也會打勾。',
  'help.guide.files-link.step.5': '點選右上角的 × 關閉。這裡沒有儲存按鈕：每次點選都已立即儲存。',
  'help.guide.files-link.result':
    '該列會顯示備註，以及每個連結各一個徽章：一個是地點的名稱，一個是航班的名稱。將滑鼠移到徽章上會顯示「日程計劃」或「交通」。這份文件同時也會附加在該地點和該航班上。',
  'help.guide.files-link.tip.1': '一個檔案可以同時有多個連結，所以同一份確認單可以同時屬於飯店預訂和飯店地點。',
  'help.guide.files-link.tip.2':
    '再次點擊已勾選的項目會取消那個連結；檔案本身仍會保留。離線時，備註和新的勾選會等待，並在 TREK 重新上線後傳送；只有取消其他連結才需要網路連線。',
  'help.guide.files-link.tip.3': '反過來也行：附加在地點或預訂上的文件，同樣會出現在這份清單中，該列也會有相同的徽章。',
  // files-star
  'help.guide.files-star.title': '把重要文件固定在最上面',
  'help.guide.files-star.goal': '在不斷變長的清單中，標出你真正會用到的幾份文件，方便快速找到。',
  'help.guide.files-star.step.1':
    '點選該列末端的星號（「收藏」）。星號會變成金色，檔案名稱前面會多一顆星，游標移到按鈕上時，現在會顯示「取消收藏」。',
  'help.guide.files-star.step.2': '清單會重新排序：收藏的檔案會排在其他所有檔案之上，每一組內則由新到舊排列。',
  'help.guide.files-star.step.3':
    '工具列的篩選分頁中，緊接在「全部」之後會出現星號，旁邊是已收藏檔案的數量。點選它就只會顯示這些檔案。',
  'help.guide.files-star.result': '已收藏的檔案會顯示在清單頂部，另外有一個分頁只顯示已收藏的檔案。',
  'help.guide.files-star.tip.1': '只有在有檔案加上星號時，才會有星號分頁。取消最後一個檔案的星號後，這個分頁就會消失。',
  'help.guide.files-star.tip.2':
    '加星號需要和「分配」相同的權限，也就是「編輯檔案後設資料」。沒有這項權限的成員看得到星號，但點選「收藏」不會有任何作用。',
  // files-filter
  'help.guide.files-filter.title': '在清單中找出文件',
  'help.guide.files-filter.goal': '只顯示你要找的那類文件。',
  'help.guide.files-filter.step.1':
    '篩選分頁位於頂部列的「檔案」旁邊：「全部」「PDF」「圖片」和「文件」，每個旁邊都有檔案數量。',
  'help.guide.files-filter.step.2': '點選「PDF」：清單只會顯示 PDF 檔案。',
  'help.guide.files-filter.step.3':
    '另外還有兩個分頁，只有在旅行中有符合的檔案時才會出現。點選「協作筆記」，只要 Collab 分頁中的筆記有附件就會顯示：清單接著只會顯示這些檔案。星號分頁也是一樣，只要有檔案被收藏就會出現。',
  'help.guide.files-filter.step.4': '點選「全部」即可顯示完整清單。',
  'help.guide.files-filter.result': '清單只會顯示所選分頁的檔案，每個分頁上的數字則是該分頁的檔案數量。',
  'help.guide.files-filter.tip.1':
    '這裡沒有資料夾，也不能重新命名檔案。想區分文件，請善用「分配檔案」中的備註、連結到地點和預訂，以及星號。',
  'help.guide.files-filter.tip.2':
    '清單一律先排已加星號的檔案，再依最新的在前排序，所以今天上傳的文件會排在上個月的文件前面。',
  // files-preview
  'help.guide.files-preview.title': '不離開 TREK 就能閱讀文件',
  'help.guide.files-preview.goal': '立即查看票券或圖片，需要時再下載到自己的裝置。',
  'help.guide.files-preview.step.1':
    '點擊圖片的名稱或縮圖。它會全螢幕開啟，左上角顯示檔案名稱及其在圖片中的順序。影片以同樣方式開啟並在那裡播放。',
  'help.guide.files-preview.step.2':
    '使用兩側的圓形箭頭、鍵盤的左右方向鍵，或底部的縮圖列，即可瀏覽清單目前顯示的所有圖片。',
  'help.guide.files-preview.step.3':
    '「在新標籤頁中開啟」和「下載」是右上角 × 旁邊的圓形按鈕。點選 ×、按 Escape，或點選深色背景，都可以關閉圖片。',
  'help.guide.files-preview.step.4':
    '不是圖片的文件會改在對話框中開啟：頂端是名稱，下方有「在新標籤頁中開啟」和「下載」兩個標籤按鈕，如果是 PDF，再下方就是頁面內容。點選右上角的 ×、按 Escape，或點選對話框外面，都可以關閉。',
  'help.guide.files-preview.step.5': '列末的箭頭（「下載」）會不先開啟檔案，直接把它存到你的裝置。',
  'help.guide.files-preview.result': '文件會顯示在畫面上，同樣的兩個按鈕可以在瀏覽器分頁中開啟它，或把它存到你的硬碟。',
  'help.guide.files-preview.tip.1': '在觸控螢幕上，直接滑動即可翻看圖片，不用點箭頭。',
  'help.guide.files-preview.tip.2': '電子錢包票券不會開啟預覽，而是直接下載，讓手機用錢包應用程式開啟。',
  'help.guide.files-preview.tip.3':
    '「在新標籤頁中開啟」和「下載」都是透過你的登入工作階段載入檔案，所以從網址列複製的連結，對其他人無效。',
  // files-trash
  'help.guide.files-trash.title': '刪除文件並復原',
  'help.guide.files-trash.goal': '刪除旅行不再需要的檔案，也能還原仍然需要的檔案。',
  'help.guide.files-trash.step.1':
    '點選列末的垃圾桶（「刪除」）。檔案會立即從清單中移除，並顯示「已移至回收站」的訊息。不會先詢問你。',
  'help.guide.files-trash.step.2':
    '工具列右端的垃圾桶圖示（「回收站」）會把清單切換到已刪除的檔案。工具列的標題會變成「回收站」，篩選分頁和上傳方塊都會隱藏。',
  'help.guide.files-trash.step.3':
    '垃圾桶裡的列是灰色的，只有兩個圖示：「恢復」會還原檔案，「刪除」則會在確認後永久刪除。',
  'help.guide.files-trash.step.4':
    '點選「恢復」。會出現「檔案已恢復」的訊息，該檔案也會從垃圾桶中移除，備註和連結則會保留。',
  'help.guide.files-trash.step.5':
    '工具列中垃圾桶圖示旁的「清空回收站」會永久刪除回收站裡的所有內容。執行前，瀏覽器會先詢問一次確認。再點一次垃圾桶圖示即可切換回檔案清單。',
  'help.guide.files-trash.result': '檔案會回到清單中原來的位置。',
  'help.guide.files-trash.tip.1':
    '一列上的「刪除」不會先詢問，這正是垃圾桶的用途：在你到這裡確認之前，沒有任何東西會離開 TREK。這一切離線時也能運作，並在 TREK 重新上線後傳送。',
  'help.guide.files-trash.tip.2':
    '刪除和還原檔案需要「刪除檔案」的權限。沒有這項權限的成員，在該列上看不到「刪除」，在垃圾桶裡也看不到那些按鈕。',
  'help.guide.files-trash.tip.3': '在回收站中永久刪除的檔案就無法再找回來。',
  // files-sync
  'help.guide.files-sync.title': '讓文件與文件儲存服務保持同步',
  'help.guide.files-sync.goal':
    '把旅行連接到你自己的文件儲存庫，這樣在這裡上傳的檔案會存到儲存庫，儲存庫裡的檔案也會出現在這裡。',
  'help.guide.files-sync.step.1':
    '點選「文件同步」，它位於工具列右端的垃圾桶圖示旁邊。對話框會開啟，標題下方是旅行名稱。左側「連接提供者」下列出管理員已開啟的儲存庫，每個都有一行說明它如何存放檔案：Paperless-ngx 和 Papra 用標籤，Nextcloud 和 Synology Drive 用資料夾，OpenCloud 用空間。右側顯示「尚未連接任何項目」。',
  'help.guide.files-sync.step.2':
    '點選你的儲存庫，這裡以 Nextcloud 為例。會開啟一個較小的對話框來設定連線，顯示儲存庫名稱，並要求輸入該儲存庫所需的登入資料。',
  'help.guide.files-sync.step.3':
    '填入「位址」，以及該儲存服務自己的登入資料：Paperless-ngx 需要「API 權杖」，Papra 需要「API 金鑰」和「組織 ID」，Nextcloud 需要「使用者名稱」和「應用程式密碼」，OpenCloud 需要「使用者名稱」和「應用程式權杖」，Synology Drive 需要「使用者名稱」、「密碼」，如果帳號有要求，還要填「雙因素驗證碼」。只要儲存服務提供應用程式密碼或權杖，就請使用它們，千萬不要用你的帳號密碼。Nextcloud 和 Synology Drive 還可以填選填的「基礎資料夾」，TREK 會在那裡尋找旅行資料夾，這裡填 /Reisen。底部的「接受自簽憑證」只適用於你自己網路內、使用這類憑證的儲存服務。',
  'help.guide.files-sync.step.4':
    '點選「測試連線」。TREK 會用你輸入的資料連接儲存服務，頁尾會顯示「已連上，登入身分為」，後面接帳號名稱。如果憑證被拒絕，或連不到該位址，頁尾會改為顯示相關訊息。不論哪種情況，都不會儲存任何內容。',
  'help.guide.files-sync.step.5':
    '點選「連接」。連線會隨旅行一起儲存，TREK 接著會詢問旅行的文件要放在儲存服務的哪裡：存放文件的標籤、資料夾或空間。只有裡面的內容會同步。點選「建立」時，「建立新的」會依旅行標題自動命名並建立。在「或使用你已經有的」下，可以看到現有的項目。點選其中一個，這裡以資料夾 Autumn in Japan 為例。',
  'help.guide.files-sync.step.6':
    '對話框會再次開啟：你的儲存服務列在左邊的「這次旅行」下，右邊的卡片會顯示同步目標、上次執行時間，以及「立即同步」。第一次同步會自動開始，之後隨時可以點選「立即同步」手動執行。同步後，名稱旁的「尚未同步」徽章會變成綠點，游標移上去會顯示「已同步」。流程列會顯示 TREK 與儲存服務各有多少文件，中間是「送往儲存庫」和「來自儲存庫」兩條通道。點選右上角的 × 關閉對話框。',
  'help.guide.files-sync.result':
    '儲存庫裡原本就有的文件會出現在清單頂部，並以你的名義上傳；旅行中的每份文件（來自協作筆記的除外）也都會存進儲存庫。從此 TREK 會在背景檢查儲存庫，清單中的變更也會同步到儲存庫。',
  'help.guide.files-sync.tip.1':
    '只有旅行的擁有者或實例管理員可以連接旅行，因為這組憑證可以存取儲存庫中的整個帳號。旅行連接之後，每位成員都會看到「文件同步」，可以開啟它、查看卡片，並按「立即同步」。',
  'help.guide.files-sync.tip.2':
    '位於你自己網路內的儲存庫，需要在 TREK 伺服器上設定 ALLOW_INTERNAL_NETWORK=true，而且它的位址必須是那台機器在網路中的位址，不能是 localhost。否則「測試連線」會回應「不允許這個位址。」',
  'help.guide.files-sync.tip.3':
    '「立即同步」旁邊的「中斷連線」圖示只會詢問你確認一次，然後結束連線，兩邊的文件都會保留。如果你再次連接同一個標籤、資料夾或空間，TREK 會把它當成新的，並重新匯入裡面的所有內容。所以中斷連線後，請連接一個空的，不要連回舊的。',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': '日程詳情',
  'help.ctx.trip-day-detail.summary':
    '點選某一天的標題後，會在地圖上方開啟的面板。它呈現這一天的整體概況：名稱和日期、你當天所在地的天氣、這一天的預訂，以及為這一天訂下的住宿夜數。',
  'help.ctx.trip-day-detail.bullet.1':
    '點擊天數欄中某一天的標題，面板會在地圖中間上方開啟。再次點擊同一個標題，或點擊面板右側的 X，就會關閉面板並取消選取該天。從地點欄或地圖開啟某個地點時，面板會關閉，改為顯示該地點。',
  'help.ctx.trip-day-detail.bullet.2':
    '標題列顯示這一天的名稱和日期。名稱旁邊的鉛筆可以重新命名這一天，雙箭頭則會把面板收成窄窄一條，讓你重新看到地圖。',
  'help.ctx.trip-day-detail.bullet.3':
    '最上方是當天的天氣。「Forecast for」會標明預報是針對哪個地點：當天的第一個停留點，或是你醒來時所在的飯店。',
  'help.ctx.trip-day-detail.bullet.4':
    '「預訂」會列出當天的預訂，每筆都標示種類、所屬的停靠點和時間。綠色代表已確認，琥珀色代表仍待確認，大眾運輸行程則是藍色且沒有狀態。點擊某一列就會開啟該預訂。',
  'help.ctx.trip-day-detail.bullet.5':
    '「住宿」會顯示涵蓋這一天的每一晚預訂，並在對應的日子標示「入住」和「退房」，還有入住時段、退房時間和確認編號。如果住宿有預訂，下方的「預訂」方塊會寫出預訂名稱，以及「待確認」或「已確認」。點擊它即可開啟預訂。',
  'help.ctx.trip-day-detail.bullet.6':
    '「新增住宿」會為這一天預訂一晚：從旅行的地點中選擇住處，說明它涵蓋哪幾天，再加上時間和預訂碼。每天標題中的 +（提示文字為「新增到當天」）也有「新增住宿」：它會開啟這個面板並直接展開表單。',
  // day-panel
  'help.guide.day-panel.title': '開啟某一天並查看詳細資料',
  'help.guide.day-panel.goal': '不用離開地圖，就能看到一整天的資訊，包括天氣、預訂和住宿。',
  'help.guide.day-panel.step.1': '在天數欄點選某一天的標題列。那一天會被選取，詳細資料會在地圖中間上方開啟。',
  'help.guide.day-panel.step.2': '標題列會顯示那一天的名稱，在你取名之前是「第 1 天」，下方是日期。',
  'help.guide.day-panel.step.3':
    '最上方是當天的天氣。「Forecast for」會標明天氣預報是針對哪個地點：當天的第一個停留點，或是你前一晚入住的飯店。',
  'help.guide.day-panel.step.4': '其下的「預訂」會列出落在這一天的預訂和時間。',
  'help.guide.day-panel.step.5': '「住宿」會顯示涵蓋這一天的住宿夜數，「入住」和「退房」則出現在實際發生的那一天。',
  'help.guide.day-panel.step.6': '標題列上的雙箭頭可以把面板收成窄窄一條。旁邊的 X 則會關閉面板，並取消選取那一天。',
  'help.guide.day-panel.result':
    '把面板收合成細列時，地圖會空出來，那一天仍維持選取。關閉面板時，那一天會取消選取，行程則維持原樣。',
  'help.guide.day-panel.tip.1': '點選面板標題列的任何位置，也能將面板收合。箭頭只是其中一種方式。',
  'help.guide.day-panel.tip.2':
    '從地點欄或地圖開啟地點，會關閉當天的面板，改為顯示地點的詳細資訊。再次點擊當天的標題，即可回到當天。',
  // day-weather
  'help.guide.day-weather.title': '查看當天的天氣',
  'help.guide.day-weather.goal': '查看你當天實際所在地點的天氣。',
  'help.guide.day-weather.step.1':
    '「Forecast for」會標明這些數字是針對哪個地點：當天的第一個停留點，或是沒有停留點的日子裡，你前一晚入住的飯店。',
  'help.guide.day-weather.step.2': '大數字是當天的氣溫，旁邊是最低溫和最高溫，以及以文字描述的天氣狀況。',
  'help.guide.day-weather.step.3': '右邊的標籤依序是：降雨機率、降雨量、最大風速，以及日出和日落時間。',
  'help.guide.day-weather.step.4':
    '最下方是逐小時的天氣，每兩小時一格：時間、圖示、氣溫和降雨機率。超過 50% 的時段會以藍色標示。',
  'help.guide.day-weather.result':
    '天數欄中那一天的卡片，也會在編號下方以小字顯示天氣，所以你可以一眼看完整趟旅行的天氣。',
  'help.guide.day-weather.tip.1':
    '氣溫和風速使用「設定」中「顯示」下的「溫度單位」：如果選擇「°F Fahrenheit」，同一份預報就會以 °F 和 mph 顯示。',
  'help.guide.day-weather.tip.2':
    '如果某一天沒有已定位的停留點，前一晚也沒有入住的飯店，就完全不會顯示天氣：天氣預報一定是針對某個地點，而不是整趟旅行。',
  'help.guide.day-weather.tip.3':
    '超過 16 天後就沒有天氣預報了。這時顯示的是往年同一天的平均值，會用 Ø 標示，下方也會有說明。',
  // rename-day
  'help.guide.rename-day.title': '為這一天命名',
  'help.guide.rename-day.goal': '為某一天取個名字，例如「抵達 Kyoto」或「休息日」，不再只是「第 5 天」。',
  'help.guide.rename-day.step.1': '開啟那一天。標題列會顯示「第 5 天」，下方是日期。',
  'help.guide.rename-day.step.2': '點選名稱旁邊的鉛筆。',
  'help.guide.rename-day.step.3': '名稱會變成輸入框。輸入你想要的名稱。',
  'help.guide.rename-day.step.4':
    '按 Enter 或點一下其他地方即可確認，按 Escape 則取消變更。天數欄中那一天的卡片也會顯示新名稱。',
  'help.guide.rename-day.result': '新名稱會取代面板中以及天數欄卡片上的「第 5 天」，日期則維持不變。',
  'help.guide.rename-day.tip.1': '如果清空欄位後儲存，這一天又會變回「第 5 天」：沒有名稱時，就會顯示編號。',
  'help.guide.rename-day.tip.2':
    '名稱屬於那一天，而不是它的日期。如果你重新排列天數，名稱會連同那一天的其他內容一起移動。',
  // add-accommodation
  'help.guide.add-accommodation.title': '為某一天預訂住宿',
  'help.guide.add-accommodation.goal': '只要一次，就能把飯店加入行程，包括涵蓋的天數、時間和確認編號。',
  'help.guide.add-accommodation.step.1':
    '住宿必須先是旅行中的一個地點。請像建立其他地點一樣，在地點欄中建立它：選擇器只會列出已經存在的地點。',
  'help.guide.add-accommodation.step.2': '開啟你抵達的那一天，在「住宿」下點選「新增住宿」。',
  'help.guide.add-accommodation.step.3':
    '「應用到天數」決定這次住宿涵蓋哪幾晚：「開始」是入住日，「結束」是退房日，「全部」則涵蓋整趟旅行。對話框頂端會顯示日期範圍和晚數。',
  'help.guide.add-accommodation.step.4':
    '填寫「入住」、「截止」和「退房」，並把預訂編號填在「確認號」下。這四項都可以留空。',
  'help.guide.add-accommodation.step.5': '在「選擇住宿」下選擇住處。列表上方的「分類」可縮小到單一分類。',
  'help.guide.add-accommodation.step.6': '點選「儲存」。',
  'help.guide.add-accommodation.result':
    '住宿會顯示在它涵蓋的每一天，第一天標示「入住」，最後一天標示「退房」。該住處會成為入住日的一個停靠點，所以地圖會顯示前往那裡的路線，「預訂」分頁也會多出一筆旅館預訂。',
  'help.guide.add-accommodation.tip.1': '選擇器會從你開啟的那一天開始，退房日為隔天；儲存之前，兩個日期都可以修改。',
  'help.guide.add-accommodation.tip.2':
    '建立飯店時，請把它設為 Hotel 分類。這樣只要點一下清單上方的「分類」，就只會顯示你的飯店。',
  'help.guide.add-accommodation.tip.3':
    '時間都是選填的：沒有入住時間、也沒有預訂碼的住宿，仍會涵蓋那幾晚，路線也照樣會畫出來。',
  // edit-accommodation
  'help.guide.edit-accommodation.title': '變更或取消已訂的住宿',
  'help.guide.edit-accommodation.goal': '更改住宿的日期、修正時間，或從計畫中移除。',
  'help.guide.edit-accommodation.step.1':
    '卡片會顯示住處及其位址、對應日期的「入住」或「退房」及時間、確認編號，以及「預訂」下隨住宿一起建立的預訂。',
  'help.guide.edit-accommodation.step.2': '右側的鉛筆「編輯住宿」會重新開啟這筆住宿。彈出視窗現在顯示「編輯住宿」。',
  'help.guide.edit-accommodation.step.3':
    '修改「入住」、「截止」、「退房」和「確認號」。上方的天數和下方的住宿地點，也可以在這裡更改。',
  'help.guide.edit-accommodation.step.4': '點選「儲存」。',
  'help.guide.edit-accommodation.step.5':
    '鉛筆旁的 X「移除」會結束這筆住宿。它不會詢問，屬於它的旅館預訂也會一併消失。',
  'help.guide.edit-accommodation.result': '變更會一次影響這筆住宿涵蓋的每一天，「預訂」分頁上的旅館預訂也會隨之更新。',
  'help.guide.edit-accommodation.tip.1':
    '住宿期間中間的夜晚不會有「入住」和「退房」標籤，只有這段期間的第一天和最後一天才有。',
  'help.guide.edit-accommodation.tip.2':
    '取消住宿時，也會一併移除它加在入住日的停留點，以及連結到該預訂的所有費用。如果是誤刪，請重新預訂那幾晚。',
  // day-bookings
  'help.guide.day-bookings.title': '一眼看完當天的預訂',
  'help.guide.day-bookings.goal': '一眼看出這一天已訂了什麼，以及是否已確認。',
  'help.guide.day-bookings.step.1':
    '「預訂」會列出當天的預訂：日期落在當天的預訂，以及釘選在當天某個停靠點上的預訂。釘選在另一天停靠點上的預訂，只會顯示在那個停靠點。',
  'help.guide.day-bookings.step.2':
    '每一列會顯示預訂的類型和名稱；如果預訂屬於某個停留點，名稱後面會用灰色顯示該停留點。時間顯示在最右邊，位於狀態圓點之前。',
  'help.guide.day-bookings.step.3':
    '顏色代表預訂的狀態：綠色是已確認，琥珀色是仍待確認，大眾運輸行程則是藍色且沒有狀態。旅館不在這份列表中，下方有它們自己的區塊。',
  'help.guide.day-bookings.step.4':
    '點擊某一列會開啟預訂。標題中的標籤可在「待確認」和「已確認」之間切換，底部的「編輯」可修改其餘內容。新的預訂要在「預訂」分頁建立，交通則在「交通」分頁建立。',
  'help.guide.day-bookings.result':
    '日期落在這一天的所有項目，以及連結到這一天任何停留點的所有項目，都會列在這份清單中。',
  'help.guide.day-bookings.tip.1':
    '預訂會依自己的日期落在某一天。在「預訂」或「交通」分頁修改日期，它就會自動移到另一天。',
  'help.guide.day-bookings.tip.2': '如果沒有「預訂」區塊，代表那一天沒有預訂：該區塊是被隱藏，而不是顯示為空白。',
  'help.guide.map-lock.title': '鎖定地圖',
  'help.guide.map-lock.goal': '在你逐一點選各天和地點時，讓地圖維持在原位。',
  'help.guide.map-lock.step.1':
    '鎖頭是地圖左下角兩個圓形按鈕中較上面的那個；將指標移上去會顯示「鎖定地圖視角」。點擊它。鎖上期間，開啟某一天或選擇地點不會再縮放或平移地圖，按鈕此時會顯示「讓地圖跟隨所選項目」。',
  'help.guide.map-lock.result': '在你處理計畫的期間，地圖會停留在你設定的位置。',
  'help.guide.map-lock.tip.1':
    '再次點擊鎖頭（此時顯示「讓地圖跟隨所選項目」），地圖就會恢復跟隨你的選擇。鎖頭只在電腦上有；在手機上，地圖一律跟隨。',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': '地圖',
  'help.ctx.trip-map.summary':
    '計畫的中間部分：旅行的每個地點是一枚圖釘，每條遊程是一條線，還有連接它們的路線，以及地圖邊緣的開關，用來鎖定檢視、切換衛星、一次顯示整趟旅行，以及查看你目前所看街區周圍的地點。',
  'help.ctx.trip-map.bullet.1':
    '圖釘代表一個地點：有照片時使用它自己的照片，否則使用分類顏色加分類圖示。將指標停在圖釘上，會出現一張卡片，顯示它的圖片、名稱和位址，地點若有評分和分類也會顯示。把圖釘拖到某一天的卡片上，即可把地點規劃到那天。預訂仍待確認的住宿會以淡色顯示，並帶有虛線外圈。',
  'help.ctx.trip-map.bullet.2':
    '靠得太近而無法區分的圖釘會合併成一個帶數字的深色氣泡。點擊氣泡，地圖會放大到氣泡內的內容。在「設定」的「顯示」> 旅行與地圖下開啟「未規劃地點使用精簡標記」後，尚未排入任何一天的地點會變成沒有照片的小圓點，讓計劃中的停靠點更醒目。',
  'help.ctx.trip-map.bullet.3':
    '點選圖釘，地點會以卡片形式在地圖底部開啟，顯示評分、檔案和接下來可以做的操作。點選地圖上的空白處即可關閉卡片。',
  'help.ctx.trip-map.bullet.4':
    '在天數欄中開啟某一天後，該天的停靠點會帶有一個白色小徽章，顯示它在當天的編號。如果某個地點在當天出現兩次，就會顯示兩個編號。地點列表上方的篩選器（「顯示」、分類，以及代表最低評分的星星）也會同步篩選地圖上的圖釘。',
  'help.ctx.trip-map.bullet.5':
    '頂部那一排圖示會搜尋你目前看得到的地圖範圍：「餐廳」、「咖啡廳」、「酒吧與夜生活」、「住宿」、「景點」、「博物館與文化」、「自然與公園」和「活動」。外掛新增的分類會排在一條細分隔線之後。當這一排比地圖還寬時，可用滑鼠滾輪橫向捲動。移動地圖後，點擊「搜尋此區域」會重新搜尋。',
  'help.ctx.trip-map.bullet.6':
    '在地圖上任何位置按右鍵，就能在該點開啟地點表單，位址已自動查好。左下角有兩個圓形按鈕：鎖頭「鎖定地圖視角」可在你逐一點選天數和地點時，讓地圖視角保持不動，下方的「切換到衛星檢視」則把繪製的地圖換成衛星影像。',
  'help.ctx.trip-map.bullet.7':
    '右下角的「顯示整趟行程」會一次畫出所有行程日，並列出每天涵蓋的內容。預訂那一列的路線圖示會畫出該筆預訂，天數欄上方工具列的路線圖示則會畫出所有預訂。點選已畫出的預訂的一端，即可開啟詳細資料。',
  'help.ctx.trip-map.bullet.8':
    '開啟 Dawarich 擴充套件後，「顯示整趟行程」下方會有圓形的 Dawarich 按鈕，可顯示你手機實際記錄的路線。「顯示記錄的路線」會以虛線畫在計畫路線下方，每天一種顏色。如果沒有畫出線條，按鈕上的標籤會說明原因。',
  // map-markers
  'help.guide.map-markers.title': '看懂地圖',
  'help.guide.map-markers.goal': '了解地圖上每一個圖釘、徽章和氣泡代表什麼意思。',
  'help.guide.map-markers.step.1':
    '地圖會顯示旅行中的每個地點。當圖釘靠得太近而無法分辨時，會合併成一個深色圓圈，上面標示其中的圖釘數量。點選圓圈，地圖會放大到這些圖釘；如果已經放到最大，則會把圖釘散開。',
  'help.guide.map-markers.step.2':
    '圖釘若地點本身有照片就使用該照片，否則使用分類顏色加分類圖示；預訂仍待確認的住宿會以淡色顯示，並帶有虛線外圈。將指標停在圖釘上，旁邊會開啟一張卡片：同一張照片但更大，加上名稱和位址，地點若有評分和分類也會一併顯示。',
  'help.guide.map-markers.step.3':
    '點擊圖釘，地點會在地圖底部上方的卡片中開啟：標題中有圖片、名稱和位址，然後是星級、描述和檔案，其中也包括它的預訂。底部是接下來可以做的事：開啟某一天時的「新增到當天」（地點已在當天時則為「從當天移除」）、「導航」、「開啟網站」、「儲存到收藏」（已在收藏中時顯示「已儲存」），右側是垃圾桶和「編輯」。標題中的 X，或點擊地圖上的空白處，都會再次關閉它。',
  'help.guide.map-markers.step.4':
    '在天數欄開啟某一天，那天的停留點就會出現編號：圖釘角落的白色小徽章，就是該停留點在當天的順序。同一天出現兩次的地點會顯示兩個編號。沒有開啟任何一天時就沒有編號，如果地點有評分，角落會改為顯示評分。',
  'help.guide.map-markers.step.5':
    '把圖釘從地圖拖到天數欄中某一天的卡片上，地點就會排進那一天，效果和從地點清單拖曳該列一樣。',
  'help.guide.map-markers.result':
    '旅行本身沒有任何改變：地圖只是顯示旅行的一種方式。每個圖釘都會顯示它是哪個地點、在哪一天，以及順序。',
  'help.guide.map-markers.tip.1':
    '在天數欄中收合某一天後，那一天的停留點也會從地圖上隱藏。再次展開那一天，就會重新顯示。',
  'help.guide.map-markers.tip.2':
    '地點列表上方的篩選器也決定地圖繪製的內容：「顯示」（「未規劃」、「計畫」）、標籤按鈕下的分類，以及星星下的最低評分，都會讓圖釘變少。國家篩選只會縮小列表。',
  'help.guide.map-markers.tip.3': '這張地圖沒有縮放按鈕：用滾輪縮放，雙擊可放大一級，拖曳地圖則可以移動。',
  // map-nearby-places
  'help.guide.map-nearby-places.title': '在地圖上尋找附近的地點',
  'help.guide.map-nearby-places.goal': '在地圖上目前顯示的這一區搜尋餐廳、景點或飯店，並把其中一個加進旅行。',
  'help.guide.map-nearby-places.step.1':
    '地圖頂部那一排圖示是分類搜尋：「餐廳」、「咖啡廳」、「酒吧與夜生活」、「住宿」、「景點」、「博物館與文化」、「自然與公園」和「活動」。外掛新增的分類會排在一條細分隔線之後。將游標移到圖示上可看到名稱。',
  'help.guide.map-nearby-places.step.2':
    '點選一個分類。TREK 會在地圖目前可見的範圍內搜尋這類地點，並為每個結果放上該分類顏色的圖釘。一次只能選一個分類：點選另一個會取代目前的分類，再點選已啟用的分類則會關閉。',
  'help.guide.map-nearby-places.step.3':
    '移動地圖後，這一排下方會出現第二個按鈕：「搜尋此區域」會針對新的可見範圍執行相同的搜尋。光是移動地圖不會自動重新搜尋，這樣可以減少請求次數。',
  'help.guide.map-nearby-places.step.4':
    '將游標停在圖釘上，可看到搜尋找到的項目名稱。點擊圖釘會開啟地點表單，並已填入相關資料：對話方塊頂部的名稱、「位址」、「緯度」和「經度」，以及搜尋有找到時的網站與電話號碼。',
  'help.guide.map-nearby-places.step.5':
    '檢查自動填入的內容，並補上搜尋無法得知的資料。如果旅行中有相符的分類（例如餐廳對應餐廳），名稱下方的分類標籤已經設好，否則會顯示「無分類」，直到你選擇一個。再加上你自己的描述和筆記。',
  'help.guide.map-nearby-places.step.6':
    '點選「新增」。如果旅行中已有同名或位在相同位置的地點，TREK 會告訴你，按鈕也會變成「仍要新增」。',
  'help.guide.map-nearby-places.result':
    '這個地點會出現在地點清單和地圖上，成為旅行自己的圖釘，在你把它排進某一天之前，會放在「未規劃」下。搜尋出的圖釘會一直保留，直到你關閉該分類。',
  'help.guide.map-nearby-places.tip.1':
    '如果在「設定」的「顯示」> 旅行與地圖下關閉了「在地圖上探索地點」，這一排就會隱藏。',
  'help.guide.map-nearby-places.tip.2':
    '結果來自 TREK 的地點索引和 OpenStreetMap，所以這是計畫中少數需要網路連線的功能之一。',
  'help.guide.map-nearby-places.tip.3':
    '搜尋只涵蓋螢幕上顯示的範圍，所以請放大到你想查的那條街。如果搜尋整座城市，只會回傳前六十筆結果，而且順序沒有明確規則。',
  // map-add-place
  'help.guide.map-add-place.title': '在地圖上按右鍵建立地點',
  'help.guide.map-add-place.goal': '把地點準確放在你想要的位置，不必先搜尋。',
  'help.guide.map-add-place.step.1': '在地圖上的目標位置按右鍵。地點表單會開啟，標題為「新增地點/活動」。',
  'help.guide.map-add-place.step.2':
    '「緯度」和「經度」已經設為該點。TREK 會查詢座標，並用查到的內容填入「地址」。如果查到名稱，TREK 也會填入對話框頂部的名稱。目前還沒有儲存任何內容，所以如有錯誤請自行更正。',
  'help.guide.map-add-place.step.3':
    '在對話框頂端的欄位輸入一個你認得的名稱。從下方的標籤選一個分類，選取之前會顯示「無分類」。接著再補上其他想放進計畫的資訊：「描述」、「備註」和「網站」。',
  'help.guide.map-add-place.step.4':
    '點選「新增」。即使目前展開了某一天，這個地點也會以未規劃的狀態加入清單：在地圖上按右鍵設定的是位置，不是日期。',
  'help.guide.map-add-place.result': '地點會出現在清單和地圖上，在你把它排進某一天之前，會顯示在「未規劃」之下。',
  'help.guide.map-add-place.tip.1':
    '地址是根據座標反查而來，所以可能顯示的是街道而不是地名，在荒郊野外也可能是空白。這兩個欄位你都可以自行覆寫。',
  'help.guide.map-add-place.tip.2':
    '在 MapLibre GL 和 Mapbox GL 地圖上，按滑鼠中鍵也能達到相同效果；在觸控螢幕上則是長按。',
  // map-satellite
  'help.guide.map-satellite.title': '切換到衛星影像',
  'help.guide.map-satellite.goal': '從繪製的地圖切換到空拍影像，再切換回來。',
  'help.guide.map-satellite.step.1':
    '底圖切換是地圖左下角兩個圓形按鈕中較下面的那個，位於鎖頭下方。它的圖示一律顯示它將切換到的圖層，將游標移上去會說明是哪個：「切換到衛星檢視」。點擊它。',
  'help.guide.map-satellite.step.2':
    '地圖現在會顯示空拍影像，清晰到能看出單一建築物，而且你不需要自備金鑰。TREK 繪製的內容都會疊在最上層：圖釘、當天的路線、軌跡和預訂路線。',
  'help.guide.map-satellite.step.3': '按鈕現在會顯示「切換到地圖檢視」。點選它就能回到一般地圖。',
  'help.guide.map-satellite.result': '地圖會重新繪製，你選的圖層也會記在你的帳號上。',
  'help.guide.map-satellite.tip.1':
    '這個選擇是儲存在你的帳號，而不是旅行中，所以不論你使用哪種地圖算繪引擎，每趟旅行開啟時都會是你上次的設定。',
  'help.guide.map-satellite.tip.2':
    '衛星影像上沒有標示文字：街道名稱、行政區和門牌號碼只會出現在繪製的地圖上，所以要找地址時，請切換回去。',
  // map-whole-trip
  'help.guide.map-whole-trip.title': '查看整趟行程和各段距離',
  'help.guide.map-whole-trip.goal': '顯示旅行的每個旅行日，而不只是展開的那一天，並查看每天走了多遠。',
  'help.guide.map-whole-trip.step.1':
    '圓形的「顯示整趟行程」按鈕位於地圖右下角。點選後，旅行的每個旅行日會一次畫出，每天各用一種顏色，所以相鄰的幾天也分得清楚。',
  'help.guide.map-whole-trip.step.2':
    '按鈕上方的卡片會列出這些日期：色點、當天的名稱、當天每種移動方式的圖示，以及行駛的距離。「總距離」顯示在最上方。',
  'help.guide.map-whole-trip.step.3':
    '在卡片中點選某一天即可選取：那一列會加上底色，該天也會在天數欄中開啟。在城市上方捲動滑鼠滾輪即可放大，經過該城市的各天會並排顯示，各自使用自己的顏色。',
  'help.guide.map-whole-trip.step.4': '按鈕現在會顯示「隱藏整趟行程」。點選它即可再次只顯示目前開啟的那一天。',
  'help.guide.map-whole-trip.result':
    '每個旅行日都會用自己的顏色畫出來，卡片則會顯示每天涵蓋的範圍，以及整趟旅行的總計。',
  'help.guide.map-whole-trip.tip.1':
    '總距離是一次計算幾段陸續得出的。只要後面還顯示 …，這個數字就只是部分的加總；等每一段都計算完成，才是最終數字。',
  'help.guide.map-whole-trip.tip.2':
    '如果路線服務無法計算某一段，該段會維持為直線，也不會計入距離。卡片會說明這一點，所以總距離不會在沒有提示的情況下變少。',
  'help.guide.map-whole-trip.tip.3':
    '如果某一天已定位的停留點不到兩個，也沒有往返飯店的車程，就沒有路線可畫，所以完全不會出現在卡片中。',
  // map-booking-routes
  'help.guide.map-booking-routes.title': '在地圖上顯示預訂的路線',
  'help.guide.map-booking-routes.goal': '在地圖上顯示你已預訂的航班、火車和自駕路線，也可以再次隱藏。',
  'help.guide.map-booking-routes.step.1':
    '預訂路線預設為關閉，直到你開啟為止。天數欄中交通那一列的右端有一個小小的路線圖示：「顯示預訂路線」。',
  'help.guide.map-booking-routes.step.2':
    '點選它，這筆預訂就會顯示在地圖上：航班畫成大圓弧線，開車沿著實際道路，火車則串連各個車站。「已確認」畫成實線，「待確認」畫成虛線，路線兩端是帶有交通工具圖示的藍色膠囊標籤。',
  'help.guide.map-booking-routes.step.3':
    '點擊路線末端的標籤，就會開啟預訂的詳細資訊：著色標題中以標籤顯示狀態、類型和天數，接著是兩端的時間，其餘細節在下方。底部有「在地圖上」（可再次關閉這條路線）、大眾運輸接駁上的「變更路線」、刪除預訂的垃圾桶，以及「編輯」。標題中的 X 可關閉詳細資訊。',
  'help.guide.map-booking-routes.step.4':
    '天數上方工具列中的路線圖示可以一次套用到整趟旅行：「顯示所有預訂路線」會畫出每一筆有路線的預訂。',
  'help.guide.map-booking-routes.step.5':
    '這會取代你先前的選擇，所以你逐筆開啟的路線都會被重設。再按一次（這時按鈕會顯示「隱藏所有預訂路線」），就會隱藏所有預訂路線。',
  'help.guide.map-booking-routes.result':
    '你選擇的預訂會畫在地圖上，這個選擇會儲存在這個瀏覽器中這趟旅行的設定裡，直到你更改為止。',
  'help.guide.map-booking-routes.tip.1':
    '只有在「設定」的「顯示」> 旅行與地圖下開啟「預訂路線標籤」時，兩端才會顯示機場代碼或車站名稱，否則只顯示圖示。',
  'help.guide.map-booking-routes.tip.2':
    '同一區段中的「一律顯示訂票路線」，會從一開始就在你尚未決定過的每趟旅行中繪製這些路線。',
  'help.guide.map-booking-routes.tip.3': '預訂必須有帶座標的起點和終點才能畫出來，所以飯店或餐廳沒有路線圖示。',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': '顯示你實際走過的路線',
  'help.guide.map-dawarich-trail.goal':
    '把 Dawarich 在你手機上記錄的路線顯示在地圖上，以虛線呈現在你規劃的路線旁邊，一天一天看這趟旅行實際是怎麼走的。',
  'help.guide.map-dawarich-trail.step.1':
    '圓形的 Dawarich 按鈕位於地圖右下角，在「顯示整趟行程」下方。把游標移到上面，會顯示「顯示記錄的路線」。點選它，TREK 就會向你的 Dawarich 要求這趟旅行日期內的資料，等待回應期間，按鈕周圍會有一圈轉動的圓環。',
  'help.guide.map-dawarich-trail.step.2':
    '記錄的路線會以虛線顯示在地圖上，每天一種顏色，並畫在計畫路線的下方，讓計畫仍然清楚易讀。按鈕現在會顯示「隱藏記錄的路線」。每一天都以當地的午夜為界。在天數欄中收合某一天時，那一天的虛線和停留點也會從地圖上隱藏。',
  'help.guide.map-dawarich-trail.step.3':
    '再點選「顯示整趟行程」，每個計畫中的日子都會以實線畫在虛線的記錄旁邊。兩條線重疊的地方，代表那一天照計畫進行；虛線偏離計畫路線的地方，就是沒有照計畫走。',
  'help.guide.map-dawarich-trail.result':
    '計畫的路線和實際走的路線會一起顯示在地圖上，分別是實線和虛線。按鈕上方的卡片仍會列出計畫中的天數和距離。',
  'help.guide.map-dawarich-trail.tip.1':
    '開啟或關閉會依旅行記錄在你的帳號中，因此在每個瀏覽器、每台裝置上都一樣。路線開啟時，TREK 每兩分鐘會再向 Dawarich 查詢一次，所以進行中的旅行不用重新載入頁面也會更新。路線本身不會被儲存，因此不在 TREK 的資料庫和備份中，離線時也無法使用。',
  'help.guide.map-dawarich-trail.tip.2':
    '按鈕上的文字會告訴你地圖為什麼是空的：載入中會顯示「正在載入記錄的路線…」，也可能是「這幾天沒有任何記錄」或「無法載入記錄的路線」，TREK 離線時則是「記錄的路線需要網路連線」。',
  // map-compass
  'help.guide.map-compass.title': '旋轉地圖並重新找到北方',
  'help.guide.map-compass.goal': '把地圖轉到你前進的方向，需要時點一下就能轉回正北。',
  'help.guide.map-compass.step.1':
    '按住右鍵拖曳，或按住 Ctrl 再用左鍵拖曳，就能旋轉地圖；在觸控螢幕上則用兩指旋轉。地圖頂端分類圖示旁邊的圓形羅盤會跟著轉動：箭頭永遠指向北方，所以它傾斜的角度和地圖旋轉的角度相同。',
  'help.guide.map-compass.step.2':
    '點選羅盤。這個按鈕叫「Reset north」，會把地圖轉回正北朝上，恢復成平面視角，箭頭也會重新朝上。',
  'help.guide.map-compass.result': '地圖會恢復成北方朝上，且視角變平。旅行本身沒有任何變動：羅盤只會改變視角。',
  'help.guide.map-compass.tip.1':
    '只有 MapLibre GL 和 Mapbox GL 地圖才有羅盤；Leaflet 地圖無法旋轉，所以沒有羅盤。你使用哪一種地圖，由「設定」中「地圖」下的「地圖提供商」決定，「儲存地圖」則會儲存你的選擇。',
  'help.guide.map-compass.tip.2':
    '點選時也會取消傾斜。用滑鼠右鍵上下拖曳可以傾斜視角，「Reset north」則會讓地圖回正並重設旋轉。在 Mapbox GL 且開啟「3D 建築和地形」時，這也會把 3D 視圖壓平，直到你再次傾斜為止。',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': '協作',
  'help.ctx.trip-collab.summary':
    '團體一起規劃的分頁，由五張卡片組成：左邊是聊天，旁邊是「筆記」和「連結」，下方是「投票」和「接下來」。在這裡寫下的所有內容，都會立即出現在其他每位成員的畫面上，不需要重新載入。',
  'help.ctx.trip-collab.bullet.1':
    '聊天是左邊的那張卡片。在「輸入訊息...」中輸入文字，按 Enter 送出；按 Shift 加 Enter 則換行。笑臉圖示可加入表情符號，「附加圖片」最多可為訊息附上四張圖片。',
  'help.ctx.trip-collab.bullet.2':
    '將滑鼠移到訊息上會出現「回覆」，自己的訊息還會有「刪除」；按右鍵可以使用八種快速表情回應。刪除的訊息會換成一行說明，註明是誰刪除的。',
  'help.ctx.trip-collab.bullet.3':
    '「筆記」是共用的便條板：標題中的「新建筆記」可寫一則，旁邊的齒輪會開啟「管理分類」，用來設定分類的名稱和顏色。有了分類之後，標題下方的一排標籤會篩選卡片：「全部」，或某一個分類。筆記卡片以彩色圓點顯示它的分類，以圓形按鈕顯示它的連結，三個點（「更多選項」）裡有「展開」、「置頂」、「編輯」和「刪除」。',
  'help.ctx.trip-collab.bullet.4':
    '「連結」用來收集旅行相關的網址。「新增連結」需要輸入標題和 http 或 https 位址。「編輯連結」「釘選連結」和「刪除連結」位於標籤的末端，釘選的連結會排在最前面。',
  'help.ctx.trip-collab.bullet.5':
    '用「投票」來做決定。「新建投票」可以提出問題，並附上至少兩個選項。點選某個選項即可投票。投票標題列右側的鎖頭（「關閉」）和垃圾桶（「刪除」），分別可以結束投票或移除投票。',
  'help.ctx.trip-collab.bullet.6':
    '「接下來」會列出旅行中還沒到的停留點，最多八個，並附上時間和同行的人。它只讀取每日計畫，時間要在那裡設定。',
  // write-note
  'help.guide.write-note.title': '寫一則共用筆記',
  'help.guide.write-note.goal': '把整個團體都需要的資訊，例如規則、地址或提醒，放在大家都找得到的地方。',
  'help.guide.write-note.step.1': '點選「筆記」卡片標題列上的「新建筆記」。筆記對話框會開啟，游標已經在標題欄位中。',
  'help.guide.write-note.step.2':
    '在對話框頂部的「筆記標題」輸入標題。這是唯一必填的欄位：標題沒有內容時，「建立」會保持灰色；在標題欄按 Enter 則會立即建立筆記。',
  'help.guide.write-note.step.3':
    '「內容」放正文，支援 Markdown：粗體、清單、標題都可以使用。卡片會顯示前三行，選單中的「展開」可以開啟整則筆記。',
  'help.guide.write-note.step.4':
    '在「分類」下，選擇筆記所屬的分類；它的顏色現在會為對話方塊的標題著色，之後則為卡片的標題著色。第一個分類已替你選好。標籤是已存在的分類，新的分類要在「管理分類」下建立。旅行還沒有任何分類時，這一列不會出現。',
  'help.guide.write-note.step.5':
    '「網站」可填入與這則筆記相關的連結。卡片頂部隨後會出現一個圓形的連結按鈕，點選即可開啟。',
  'help.guide.write-note.step.6':
    '點選「建立」。只有「取消」和它的叉號能關閉對話框，所以點到對話框外面或按 Esc，都不會讓你寫的內容遺失。',
  'help.guide.write-note.result': '筆記會成為「筆記」面板中的一張卡片，頂端是所屬分類的顏色，其他成員也會立刻看到。',
  'help.guide.write-note.tip.1':
    '卡片上的三個點（「更多選項」）可以選擇「展開」、「置頂」、「編輯」和「刪除」。「置頂」會讓筆記固定在面板最上方，並加上與其顏色相同的外框；其他筆記則依最後修改時間排序。',
  'help.guide.write-note.tip.2':
    '「新建筆記」旁邊的齒輪會開啟「管理分類」。你可以在那裡為分類設定顏色、一次在所有地方重新命名，或是在還沒有筆記用到之前就先新增。在你點選「儲存」之前，不會有任何變動。',
  'help.guide.write-note.tip.3':
    '如果你有權限向旅行上傳檔案，「附加檔案」可以把文件加到筆記中。「附加」會開啟檔案選擇器，你也可以直接把圖片或 PDF 貼到對話方塊中。',
  'help.guide.write-note.tip.4':
    '「筆記」在「擴充套件」下、「Collab」之後有自己的開關：管理員可以將它關閉，其他的聊天、連結、投票和「下一項」仍會照常運作。',
  // shared-links
  'help.guide.shared-links.title': '收集旅行的連結',
  'help.guide.shared-links.goal': '把訂房入口、共用相簿和時刻表放在同一處，不用再到聊天記錄裡翻找。',
  'help.guide.shared-links.step.1': '點選「連結」卡片標題列的「新增連結」。對話框開啟後，游標會停在最上面的欄位。',
  'help.guide.shared-links.step.2': '在「連結標題」中輸入名稱，把網址貼到下方的「連結」欄位，再點選「儲存連結」。',
  'help.guide.shared-links.step.3': '小標籤會顯示名稱和所連結的網站。點一下就會在新分頁中開啟該頁面。',
  'help.guide.shared-links.step.4':
    '末端的三個圓形按鈕分別是「編輯連結」、「釘選連結」和「刪除連結」。「釘選連結」會把小標籤移到面板最前面，並以強調色顯示。「刪除連結」會先要求確認，因為連結會對所有成員移除。',
  'help.guide.shared-links.result':
    '連結會以小標籤的形式出現在「連結」面板中，並釘選在最前面，同時立即顯示在每位成員的畫面上。',
  'help.guide.shared-links.tip.1':
    '只接受 http 或 https 位址，其他格式都會被拒絕，對話框會保持開啟，也會保留你輸入的內容。',
  'help.guide.shared-links.tip.2':
    '釘選的連結排在最前面，其次是最新的。標題旁邊的小圖示是網站自己的圖示，直接從網站載入，所以沒有網路時，標籤會改為顯示一般的連結圖示。',
  'help.guide.shared-links.tip.3':
    '「連結」在「擴充套件」中，位於 Collab 下方，有自己獨立的開關，所以管理員可以關閉這個面板，而不影響分頁的其他部分。',
  // create-poll
  'help.guide.create-poll.title': '向大家發起投票',
  'help.guide.create-poll.goal': '把聊天室裡沒人回答的問題，變成大家都能投票的投票。',
  'help.guide.create-poll.step.1': '點選「投票」卡片標題列上的「新建投票」。對話框會開啟。',
  'help.guide.create-poll.step.2':
    '在「問題」下寫出問題。輸入框下方的「支援 Markdown」表示粗體文字、換行或簡短清單都可以使用。',
  'help.guide.create-poll.step.3':
    '在「選項」下填寫「選項 1」和「選項 2」。至少要有兩個不是空白的選項，而且每個選項可以有好幾行。',
  'help.guide.create-poll.step.4':
    '它們下方的「新增選項」可以加上第三個、第四個，需要幾個就加幾個。選項超過兩個時，每一列旁邊會出現小叉叉，可以移除該選項。',
  'help.guide.create-poll.step.5':
    '開啟「多選」後，每個人都能勾選多個選項。如果關閉，某人改選其他選項時，他的票就會移到新的選項。',
  'help.guide.create-poll.step.6': '點選「建立投票」。',
  'help.guide.create-poll.result': '投票會出現在「投票」面板最上方，狀態為開放，標題列顯示「0 票」。',
  'help.guide.create-poll.tip.1': '問題會以 Markdown 呈現，選項則維持純文字。',
  'help.guide.create-poll.tip.2': '在有問題，且至少有兩個填了文字的選項之前，「建立投票」會保持灰色。',
  'help.guide.create-poll.tip.3':
    '截止時間只能在手機應用程式中設定。有截止時間的投票，標題列會以琥珀色標籤顯示剩餘時間，時間一到就會關閉。',
  'help.guide.create-poll.tip.4':
    '「投票」在「擴充套件」下、「Collab」之後有自己的開關：管理員可以將它關閉，其他四個面板則照常運作。',
  // vote-poll
  'help.guide.vote-poll.title': '投票並查看結果',
  'help.guide.vote-poll.goal': '投票、查看大家的結果，也可以改票。',
  'help.guide.vote-poll.step.1': '點選你想選的選項。它的圓圈會出現勾號，選項會加上強調色外框，後面的長條也會變長。',
  'help.guide.vote-poll.step.2':
    '現在可以看到完整結果：長條代表占比，右邊是百分比，小圓圈則是選了該選項的人，最多顯示三位。',
  'help.guide.vote-poll.step.3':
    '改變心意了？點選另一個選項即可。在沒有「多選」的投票中，你的票會移到新的選項，而不是再多投一票。',
  'help.guide.vote-poll.step.4': '票數會顯示在問題下方的標籤中。再次點選你已選的選項會收回你的票，票數也會減少。',
  'help.guide.vote-poll.result': '你選的選項會打勾，長條顯示群組的投票分布，圓圈則顯示誰選了哪個選項。',
  'help.guide.vote-poll.tip.1':
    '必須等你自己投過票，或投票關閉後，才會顯示百分比和每個人投了什麼。標題列上的票數則所有人都看得到。',
  'help.guide.vote-poll.tip.2': '投票不是匿名的：把游標移到某個選項的圓圈上，就能看到投票者的名字。',
  // close-poll
  'help.guide.close-poll.title': '關閉或移除投票',
  'help.guide.close-poll.goal': '大家做出決定後結束投票，並刪除不再需要的投票。',
  'help.guide.close-poll.step.1': '點選投票標題列右側的鎖頭「關閉」，即可結束投票，之後就不能再點選選項。',
  'help.guide.close-poll.step.2':
    '已關閉的投票會沉到面板底部，在開放投票位於其上方時，位於「已關閉」標題下，帶有「已關閉」標籤，並向所有人顯示結果，無論有沒有投票。得票最多的選項以粗體顯示在綠色長條上；如果那是你選的，長條會改用你的強調色。',
  'help.guide.close-poll.step.3':
    '標題列右側的垃圾桶「刪除」會刪除投票。已關閉的投票因為沒有鎖頭了，這就是唯一的按鈕。刪除前不會再次確認，票數也會一併刪除。',
  'help.guide.close-poll.result': '刪除的投票會從每位成員的面板中消失。只是關閉的投票，則會連同結果保留在底部。',
  'help.guide.close-poll.tip.1': '關閉後無法復原，也沒有重新開啟的功能。如果誤關了投票，只能重新發起一次。',
  'help.guide.close-poll.tip.2': '「刪除」會立即移除這個投票和所有票數，對所有人都生效，而且不會再詢問確認。',
  // whats-next
  'help.guide.whats-next.title': '查看「接下來」',
  'help.guide.whats-next.goal': '不用開啟計畫，就能看到團體接下來要做什麼。',
  'help.guide.whats-next.step.1':
    '這張卡片會依時間順序列出旅行接下來的停留點，最多八個，並依日期分組，標題為「今天」「明天」或日期，如果那天有標題，也會顯示在旁邊。標題列會顯示總共有幾個。',
  'help.guide.whats-next.step.2':
    '每個停留點的左邊是它的時間：開始時間、「至」，以及停留點有結束時間時的結束時間；還沒設定時間時則顯示 TBD。',
  'help.guide.whats-next.step.3':
    '旁邊是名稱、地址，以及以標籤顯示的該停留點的參與者。如果沒有指派任何人，則會列出旅行中的所有人。',
  'help.guide.whats-next.result': '這是一份即將到來的項目清單，僅供閱讀：內容依照計畫而定，在這裡不能更動計畫。',
  'help.guide.whats-next.tip.1': '你不需要在這裡設定任何東西。時間來自每日計畫，在那裡更改後，這份清單會立即更新。',
  'help.guide.whats-next.tip.2':
    '只會列出還沒到的項目：停靠點的開始時間一過就會從列表移除，今天沒有時間的停靠點會保留到當天結束，旅行結束後面板就會是空的。',
  'help.guide.whats-next.tip.3':
    '「接下來」在「擴充套件」中、位於 Collab 之下，有自己的開關。它是桌面版的面板：手機應用程式的 Collab 分頁不會顯示它。',
  // trip-chat
  'help.guide.trip-chat.title': '和團體聊天',
  'help.guide.trip-chat.goal': '傳送訊息、回覆特定訊息、對另一則訊息做出回應，以及刪除自己的訊息。',
  'help.guide.trip-chat.step.1':
    '在「輸入訊息...」中輸入文字，然後按 Enter。輸入框旁邊的圓形箭頭效果相同。按 Shift 加 Enter 則是換行。',
  'help.guide.trip-chat.step.2':
    '笑臉圖示會開啟表情符號選擇器，裡面有 Smileys、Reactions 和 Travel。你選的表情符號會加到正在輸入的文字中，不會自動送出。',
  'help.guide.trip-chat.step.3': '把游標移到別人的訊息上，角落會出現一個小圓鈕，那就是「回覆」。',
  'help.guide.trip-chat.step.4':
    '你要回覆的訊息會以引用的形式顯示在輸入框上方。寫好訊息並傳送，引用內容會一併送出。點選引用上的叉號可以移除引用。',
  'help.guide.trip-chat.step.5':
    '對訊息按右鍵，會出現八個快速回應。你的回應會顯示在訊息下方。再點一次同樣的回應即可取消。',
  'help.guide.trip-chat.step.6':
    '你自己的訊息在「回覆」旁邊會有垃圾桶圖示「刪除」。它會立即刪除訊息，並留下一則說明你刪除了訊息的提示。刪除後無法復原。',
  'help.guide.trip-chat.result':
    '你的回覆會是最新的一則訊息，被引用的訊息顯示在它的上方。你的回應會出現在另一則訊息下方。你刪除的訊息則會換成一行說明，表示是你刪除的。',
  'help.guide.trip-chat.tip.1': '按 Enter 傳送，按 Shift 加 Enter 換行。只有一到三個表情符號的訊息會放大顯示。',
  'help.guide.trip-chat.tip.2': '使用「附加圖片」，一則訊息最多可加入四張圖片。你也可以直接貼上，或拖曳到輸入框。',
  'help.guide.trip-chat.tip.3':
    '含有連結的訊息下方會顯示預覽卡片，由你自己的 TREK 擷取，所以只有你能連到的網址，仍然只會顯示為一般連結。',
  'help.guide.trip-chat.tip.4':
    '「聊天」在「擴充套件」中、位於 Collab 之下，有自己的開關：管理員可以關閉聊天，同時保留筆記、連結、投票和「下一項」。',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': '行李',
  'help.ctx.trip-lists.summary':
    '一趟旅行有兩份清單：行李清單，記錄誰帶什麼以及重量；以及待辦清單，記錄出發前和旅途中需要完成的所有事項。只要「行李」擴充套件開啟，就會顯示這個分頁。',
  'help.ctx.trip-lists.bullet.1':
    '頂端工具列的「行李清單」和「待辦事項」可在兩者之間切換，並顯示各自的項目數量；工具列右端的按鈕則屬於目前開啟的那一份清單。',
  'help.ctx.trip-lists.bullet.2':
    '行李清單分成多個清單，例如文件、衣物，隨你命名。每個清單是一張卡片，標題列有握把可將整個清單拖到另一個位置、一個色點、一個已打包／總數徽章、三個點（含「重新命名」、「全部勾選」、「取消全部勾選」和「刪除清單」），以及一個收合卡片的箭頭。上方列中的「新增清單」可建立新清單。',
  'help.ctx.trip-lists.bullet.3':
    '一列包含握把、勾選框和名稱，然後以小頭像顯示誰負責攜帶。數量大於一的物品還會有已打包計數，例如 3/10，附減號和加號。接著是以小徽章顯示的數量，以及在「行李追蹤」開啟時的公克重量和行李袋圓圈，然後是垃圾桶和三個點，裡面有「移動到清單」、「分享中」、「重新命名」和「刪除」。這一列沒有用到的部分會保持淡色，直到你把指標移上去。',
  'help.ctx.trip-lists.bullet.4':
    '「已分享」和「我的清單」把行李清單分成兩份：大家都看得到的共用池，以及你自己的。旁邊的「全部」、「未支付」和「完成」會縮小目前開啟的那一份。一列末端的「依名稱」會按名稱順序顯示每個清單的物品，再點一次則回到你自己的順序。上方的進度卡片計算已打包的數量。',
  'help.ctx.trip-lists.bullet.5':
    '「應用模板」和「儲存為範本」可以套用或儲存清單，省去重新輸入的麻煩。後面的兩個圖示「匯出」和「匯入」，可以把清單匯出為列印稿、PDF 或檔案，也能匯入清單。進度卡片右端的紅色按鈕會顯示已勾選的物品數量，點選即可移除這些物品。',
  'help.ctx.trip-lists.bullet.6':
    '「待辦事項」有自己的側邊欄：進度卡片、「全部」、「我的任務」、「已逾期」和「已完成」等篩選條件、每份清單各一列，最下面是「新增清單」。任務列在一張卡片中，卡片標題列顯示篩選名稱和排序方式「優先順序」或「到期日」。點選任務會在右側面板中開啟，工具列中的「新增任務」則會開啟「新任務」對話框。',
  // packing-categories
  'help.guide.packing-categories.title': '建立行李清單',
  'help.guide.packing-categories.goal': '把要帶的東西分組成清單，在清單中加入物品，並指定每份清單由誰負責。',
  'help.guide.packing-categories.step.1':
    '點選清單上方列中的「新增清單」。會開啟一個小對話框，在頂部標題區「清單名稱（例如：衣物）」的位置輸入名稱，然後點選「新增」。',
  'help.guide.packing-categories.step.2':
    '新清單一開始有一個佔位列，上面只有三個淡淡的點。點選該列底部的「新增品項」，在「物品名稱...」中輸入物品並按 Enter：第一個物品會取代佔位列，輸入框則會保持開啟，讓你繼續輸入下一個。',
  'help.guide.packing-categories.step.3': '點選分類名稱，或點選它右端三個點中的「重新命名」，就能為這一列改名。',
  'help.guide.packing-categories.step.4':
    '清單頂端色帶中帶有人形的虛線圓圈，可以把旅行成員指派到這份清單。選擇一個名字；要再移除那個人，請點選出現的標籤。',
  'help.guide.packing-categories.step.5':
    '數量旁邊的三個點可以開啟更多選項：「重新命名」、「全部勾選」、「取消全部勾選」和「刪除清單」。「刪除清單」會直接刪除清單和其中所有物品，不會再次詢問。最右邊的箭頭可以收合清單。',
  'help.guide.packing-categories.result':
    '新清單會出現在格狀排列中，物品列在下方，並附有顏色圓點，徽章則會顯示已打包的數量。',
  'help.guide.packing-categories.tip.1':
    '清單是靠物品存在的。如果刪掉最後一個物品，那一列會變成佔位列，讓清單保留位置和顏色；把佔位列也刪掉，清單就會消失。',
  'help.guide.packing-categories.tip.2':
    '指派某人負責一份清單時，對方會收到打包通知。這不會改變誰能看到這些物品，那是在每一列三個點選單的「分享中」設定。',
  'help.guide.packing-categories.tip.3': '兩份清單可以同名。TREK 會在內部區分它們，所以名稱會維持你輸入的樣子。',
  // check-off-packing
  'help.guide.check-off-packing.title': '邊打包邊打勾',
  'help.guide.check-off-packing.goal': '標記已放進行李的物品，看著進度條前進，並移除已打包好的物品。',
  'help.guide.check-off-packing.step.1': '點選該列左邊的方框。名稱會被劃掉，進度條也會更新。',
  'help.guide.check-off-packing.step.2':
    '清單上方的進度卡片會以數字、百分比和進度條，顯示已打包的物品數量與清單中物品總數的比例。',
  'help.guide.check-off-packing.step.3': '要一次勾選整份清單：標題列的三個點裡有「全部勾選」和「取消全部勾選」。',
  'help.guide.check-off-packing.step.4':
    '「已分享」和「我的清單」旁邊的「全部」「未完成」和「完成」可以篩選格線。「未完成」只顯示還缺的東西，所以已經全部裝好的清單會被隱藏。',
  'help.guide.check-off-packing.step.5':
    '進度卡片右端的紅色「移除…已勾選」按鈕，裡面有已勾選物品的數量，在瀏覽器確認一次後會一次刪除它們全部。',
  'help.guide.check-off-packing.result': '只會列出未完成的物品，上方的進度條則顯示打包完成了多少。',
  'help.guide.check-off-packing.tip.1': '已打勾的物品仍可重新命名：點選它的名稱即可。',
  'help.guide.check-off-packing.tip.2':
    '「全部勾選」和「取消全部勾選」一次只作用於一份清單，請從該清單自己的三個點選單使用。',
  'help.guide.check-off-packing.tip.3': '所有物品都勾選後，計數會換成「全部打包完成！」，進度條也會變成綠色。',
  // apply-packing-template
  'help.guide.apply-packing-template.title': '套用行李模板',
  'help.guide.apply-packing-template.goal': '把現成的清單加到旅行中，並將這趟旅行的清單存起來，留給下一趟使用。',
  'help.guide.apply-packing-template.step.1': '點選清單上方列中的「應用模板」。',
  'help.guide.apply-packing-template.step.2': '選擇一個範本。每一行都會顯示範本名稱和包含多少個物品。',
  'help.guide.apply-packing-template.step.3':
    '物品會加到你目前所在的檢視：「已分享」會加到所有人都看得到的共用清單，「我的清單」則加到你自己的清單。',
  'help.guide.apply-packing-template.step.4':
    '要把這趟旅行的清單留給下一趟，請點選「儲存為範本」。會開啟一個小對話框，在頂端顯示「範本名稱」的欄位輸入名稱，然後點選「儲存」。',
  'help.guide.apply-packing-template.result': '模板中的清單和物品會加入旅行，與原本已有的內容並存。',
  'help.guide.apply-packing-template.tip.1':
    '範本會帶入每個物品的清單、數量、重量和行李袋，並建立旅行中還沒有的行李袋。勾選狀態不會帶入，清單上已有的內容也不會被移除。',
  'help.guide.apply-packing-template.tip.2':
    '只有在已有模板時，才會出現「應用模板」。如果一個模板都沒有，這個按鈕根本不會顯示。',
  'help.guide.apply-packing-template.tip.3':
    '「儲存為範本」只有實例管理員看得到，而且只在清單中有物品時才會出現。它會儲存共用的物品和你自己的物品，絕不會包含其他成員的私人物品。',
  // import-packing-list
  'help.guide.import-packing-list.title': '貼上整份行李清單',
  'help.guide.import-packing-list.goal': '把你在別處已有的清單，一次轉成行李物品。',
  'help.guide.import-packing-list.step.1': '點選「匯入」，也就是清單上方工具列右端帶有向下箭頭的圖示。',
  'help.guide.import-packing-list.step.2':
    '每行一個物品：分類, 名稱, 重量（公克，選填）, 行李（選填）, checked/unchecked（選填）。方塊中的灰色範例列出了這四種格式，左邊的數字則是你輸入的行號。也可以使用 Markdown 清單：標題會成為清單名稱，「- [ ]」和「- [x]」則會變成物品。',
  'help.guide.import-packing-list.step.3':
    '也可以用對話框左下角的「載入 CSV/TXT/MD」從檔案載入這些行。它接受 .csv、.txt 或 .md 檔案，並會取代方塊中原有的內容。',
  'help.guide.import-packing-list.step.4': '點選右下角的「匯入 3」，按鈕上的數字是 TREK 讀懂的行數。',
  'help.guide.import-packing-list.result':
    '每一行都會成為一個物品，放進第一個欄位所指定的清單。原本就有的物品不會變動。',
  'help.guide.import-packing-list.tip.1':
    '逗號、分號和 Tab 都可以分隔欄位，雙引號則會把欄位包在一起，所以「Shirt, blue」仍是一個名稱。只有一個值的行就只是名稱。沒有指定清單的行會放進「其他」。名稱前面加上「3x」可以設定數量。',
  'help.guide.import-packing-list.tip.2':
    '如果旅行還沒有第四欄中指定名稱的行李袋，就會自動建立。「匯入」和「應用模板」是一次帶入大量重量和行李袋的兩種方式。',
  // export-packing-list
  'help.guide.export-packing-list.title': '列印或匯出行李清單',
  'help.guide.export-packing-list.goal': '列印清單、存成 PDF，或匯出成檔案，供其他應用程式或下一趟旅行使用。',
  'help.guide.export-packing-list.step.1': '點選清單上方工具列中帶有向上箭頭的「匯出」圖示，它就在「匯入」前面。',
  'help.guide.export-packing-list.step.2': '「Markdown 清單 (.md)」和「用於匯入的 CSV (.csv)」會直接把清單存成檔案。',
  'help.guide.export-packing-list.step.3':
    '點選「列印或儲存為 PDF」。預覽會把清單排成一頁：最上方是旅行、日期和已打包的數量，下方每份清單各是一張卡片，每件物品都有一個可勾選的方塊。',
  'help.guide.export-packing-list.step.4':
    '點選預覽下方的「列印或儲存為 PDF」。瀏覽器會開啟列印對話框：選擇印表機，或選擇「儲存為 PDF」來儲存成檔案。',
  'help.guide.export-packing-list.result':
    '列印內容和檔案會包含目前開啟的檢視，也就是「已分享」或「我的清單」，並附上數量、重量和勾選狀態。',
  'help.guide.export-packing-list.tip.1':
    'CSV 就是「匯入」讀取的格式，連行李也包含在內，所以你可以把它當作自己的行李範本：直接匯入到下一趟旅行。',
  'help.guide.export-packing-list.tip.2':
    'Markdown 檔案在 Obsidian、Notion 或 GitHub 中會顯示為待勾選的清單，也可以再用「匯入」匯入回來。',
  // share-packing-item
  'help.guide.share-packing-item.title': '決定誰能看到物品、誰負責帶',
  'help.guide.share-packing-item.goal': '在團體共用區、你自己的清單，以及你幫忙帶的人之間，調整物品的歸屬。',
  'help.guide.share-packing-item.step.1':
    '清單上方的「已分享」是所有人都看得到的清單，「我的清單」則是你自己的，兩者都會顯示物品數量。點選「我的清單」查看你自己的。',
  'help.guide.share-packing-item.step.2': '回到「已分享」，開啟某一列末端的三個點，然後點選「分享中」。',
  'help.guide.share-packing-item.step.3':
    '共有三個層級：「已分享」，群組中的所有人都看得到；「個人」，只有你看得到；以及「共用給…」，由你挑選這件物品要給哪些人看。',
  'help.guide.share-packing-item.step.4': '「個人」物品只會出現在「我的清單」中。請切換到「我的清單」來找到它。',
  'help.guide.share-packing-item.step.5':
    '再次開啟「分享中」，在「共用給…」下勾選一個名字。這件物品也會出現在對方的清單中，這一列也會多一個小徽章，顯示共用的人數。',
  'help.guide.share-packing-item.result': '物品會歸入你選的層級，該列也會顯示由誰負責帶。',
  'help.guide.share-packing-item.tip.1':
    '只有負責帶這件物品的人，才能更改它的分享設定。被你分享的人會在自己的「我的清單」中看到這件物品，並附有小手徽章，游標移上去會顯示你的名字。對方也可以勾選這件物品。',
  'help.guide.share-packing-item.tip.2':
    '在別人負責帶的共用物品上，三點選單中不會有「分享中」，而是另外兩個選項：「我也可以帶」，會把你加到對方旁邊；「複製到我的清單」，則為你建立一份私人副本。',
  'help.guide.share-packing-item.tip.3':
    '新物品會沿用你新增時所在的檢視。在「已分享」中新增的會進入共用池。在「我的清單」中新增的屬於「個人」，除非該清單的每個物品都與同一批人共享：這時新物品也會與他們共享。',
  // packing-bags
  'help.guide.packing-bags.title': '為行李秤重',
  'help.guide.packing-bags.goal': '為每件物品加上重量，把物品分進各個行李，並讓每個行李都不超過航空公司的限額。',
  'help.guide.packing-bags.step.1': '點選圓圈前方的重量徽章，輸入物品的重量，單位為公克。',
  'help.guide.packing-bags.step.2': '重量後面的圓圈代表物品所屬的行李袋。點選它。',
  'help.guide.packing-bags.step.3':
    '如果還沒有行李袋，請點選「新增行李」，輸入名稱後按 Enter。行李袋建立後，物品會直接放進去。',
  'help.guide.packing-bags.step.4':
    '只要存在一個行李袋，「行李」卡片就會出現在清單右側。每個行李袋顯示其名稱、由誰攜帶、一條填充條、裡面有多少物品以及它的重量。行李袋下方是「未分配」和「總重量」，其下方是「已打包」：已打包的重量，以及一條顯示其占比的細長條。',
  'help.guide.packing-bags.step.5': '點選行李袋重量旁邊的「設定限制」，並依航空公司的標示，以公斤輸入限制。',
  'help.guide.packing-bags.step.6':
    '行李袋名稱行末端、叉號之前的虛線加號會開啟「分配成員」。勾選誰來攜帶這個行李袋：他們會顯示在加號旁邊，卡片底部的「每人」會列出每個人攜帶的物品。',
  'help.guide.packing-bags.result':
    '右側的「行李」卡片會顯示每個行李袋的重量與上限、不在任何行李袋裡的物品、每個人攜帶的物品，以及總計和其中已打包的比例。',
  'help.guide.packing-bags.tip.1':
    '重量欄位、行李袋圓圈和「行李」卡片，只有在管理員於「行李」擴充套件下開啟「行李追蹤」時才會出現。視窗比較窄時，行李袋則改由進度卡片上方的「行李」按鈕開啟。',
  'help.guide.packing-bags.tip.2':
    '行李的重量由伺服器根據每位成員的物品計算，包括你看不到的物品，所以這個數字就是行李的實際重量。',
  'help.guide.packing-bags.tip.3':
    '沒有設定限額的行李，會和最重的行李比較，這樣各個長條才能互相比較。如果為行李設定了限額，它的長條就會改為與該限額比較。',
  // create-todo
  'help.guide.create-todo.title': '新增任務',
  'help.guide.create-todo.goal': '記下一項任務，並設定清單、優先順序、日期和負責人。',
  'help.guide.create-todo.step.1': '點選工具列右端的「新增任務」。',
  'help.guide.create-todo.step.2':
    '「新任務」對話框會開啟，游標在標題列中。在「任務名稱」輸入名稱，並在「描述」下寫下想記住的內容。',
  'help.guide.create-todo.step.3': '「清單」用來為任務分類。選一個，或點選旁邊的加號，在小對話框中為新清單命名。',
  'help.guide.create-todo.step.4': '「優先順序」有四個按鈕：「無」、P1、P2 和 P3，顏色從紅到藍。',
  'help.guide.create-todo.step.5': '「清單」旁邊的「到期日」會開啟日曆，「指派給」則可以把任務指派給某人。',
  'help.guide.create-todo.step.6': '點選「建立任務」。',
  'help.guide.create-todo.result':
    '任務會出現在清單中，優先順序、到期日和所屬清單以徽章顯示，列尾則是負責人的頭像，右側面板也會同時開啟這項任務。',
  'help.guide.create-todo.tip.1': '只有名稱是必填的，其他內容之後可以在右側面板補上。',
  'help.guide.create-todo.tip.2': '如果在側邊欄選取了某份清單，新任務就會建立在那份清單中。',
  'help.guide.create-todo.tip.3': '在名稱欄位按 Enter，會直接建立任務，不需要填其他欄位。',
  // todo-filters
  'help.guide.todo-filters.title': '尋找並修改任務',
  'help.guide.todo-filters.goal': '只顯示現在重要的任務，然後編輯你找到的那一個。',
  'help.guide.todo-filters.step.1':
    '側欄中的「任務」：「全部」顯示所有未完成的任務，「我的任務」顯示指派給你的任務，「已逾期」顯示日期已過的任務，「完成」則顯示已完成的任務。每一項都會顯示數量。點選「已逾期」。',
  'help.guide.todo-filters.step.2': '「清單」下每份清單各占一列。選一份就會顯示該清單的任務，包括已完成的。',
  'help.guide.todo-filters.step.3':
    '清單頂端的排序會改變畫面上內容的順序：「優先順序」把 P1 排在最前面，「到期日」則把最近的期限排在最前面。兩者一次只能用一個，再點一次就會回到你自己的順序。',
  'help.guide.todo-filters.step.4': '點選任務，即可在右側面板中開啟。',
  'help.guide.todo-filters.step.5':
    '修改你需要的內容：名稱、「優先順序」、「清單」、「到期日」或「指派給」。「描述」會顯示文字並附有可點擊的連結，點進去即可編輯。然後點擊窗格底部的「儲存變更」。窗格標題中的方框用來把任務標示為完成，「儲存變更」旁的「刪除」則會立刻刪除任務。',
  'help.guide.todo-filters.result': '清單只會顯示你要的任務，右側面板則可編輯你選的那一項。',
  'help.guide.todo-filters.tip.1':
    '清單列只計算未完成的任務，但選取該清單後，已完成的任務也會顯示。「全部」「我的任務」和「已逾期」會隱藏已完成的任務；「完成」則只顯示已完成的任務。',
  'help.guide.todo-filters.tip.2':
    '排序中的「優先順序」和「到期日」不能同時使用。只要其中一個開啟，就無法再把列拖曳成你自己的順序。',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': '預訂',
  'help.ctx.trip-bookings.summary':
    '這個分頁收錄旅行中除了交通以外的所有預訂：住宿、餐廳訂位、票券、旅遊團和停車。每筆預訂可以是一張卡片、清單中的一列，或是時間線上的一條橫條，並附有預訂碼、文件、旅客和費用。點選預訂即可開啟詳細資料。',
  'help.ctx.trip-bookings.bullet.1':
    '工具列右端的「手動新增」會開啟「新建預訂」。它可以建立六種預訂：「住宿」、「餐廳」、「活動」、「旅遊團」、「停車」和「其他」。航班、火車和其他交通請到「交通」分頁，不會出現在這裡。',
  'help.ctx.trip-bookings.bullet.2':
    '「手動新增」前面的下載圖示「匯入訂位確認」會把確認信交給解析器：EML、PDF、PKPass、HTML 或 TXT，最多五個檔案，每個最大 10 MB，AI 模型可讀取圖片時也支援照片。只有在伺服器能讀取它們時才會有這個圖示。',
  'help.ctx.trip-bookings.bullet.3':
    '「搜尋」會查找標題、類型、地點、備註、預訂碼和出行成員。旁邊的漏斗「篩選」可依「狀態」、依「類型」（每項附有數量）縮小範圍；一旦有預訂指定了人員，還能依「出行成員」篩選。漏斗上的數字代表目前啟用的篩選條件數量。',
  'help.ctx.trip-bookings.bullet.4':
    '「篩選」後面的三個圖示用來切換檢視：「卡片」、「清單」和「時間線」。「檢視選項」（旁邊的滑桿）會為卡片和清單分組與排序，或設定時間軸的泳道；它後面的試算表圖示「匯出為試算表 (CSV)」會把分頁顯示的內容下載為檔案。卡片預設依「已確認」和「待確認」分組，清單依日期分組，點擊區段標題可將它收合。',
  'help.ctx.trip-bookings.bullet.5':
    '卡片的標題列會依狀態著色，上面有狀態圓點（點一下就會在「待確認」和「已確認」之間切換）、類型、標題、鉛筆和垃圾桶。下方是預訂已有的詳細資料：「日期」「時間」「預訂碼」「入住」和「退房」「地點 / 地址」「住宿」「關聯到」（行程中的停留點）「連結」「備註」「出行成員」「檔案」，以及關聯的費用。',
  'help.ctx.trip-bookings.bullet.6':
    '點擊卡片、一列或一條橫條會開啟預訂的詳細資訊，底部有「在地圖上」（預訂有地點時）、垃圾桶和「編輯」。刪除只會詢問一次（「刪除預訂？」，若有費用一併刪除會說明），然後預訂連同其關聯的支出一起消失，住宿也會把它的住宿夜從每日計畫中移除。',
  // booking-views
  'help.guide.booking-views.title': '切換檢視並開啟預訂',
  'help.guide.booking-views.goal': '以卡片、清單或時間線查看預訂，並開啟其中一筆查看所有詳細資料。',
  'help.guide.booking-views.step.1':
    '工具列中「篩選」後面的三個圖示是不同的檢視，把游標移上去會顯示名稱：「卡片」、「清單」和「時間線」。這個分頁預設為「卡片」，每筆預訂一張卡片，分在「已確認」和「待確認」兩區。請點選中間的「清單」。',
  'help.guide.booking-views.step.2':
    '「清單」會把每筆預訂排成一列，歸在各天的標題下，右邊是日期和時間，也可以用方向鍵在各列之間移動。請點選三個圖示中的最後一個「時間線」。',
  'help.guide.booking-views.step.3':
    '「時間線」把預訂排在旅行的各天上：每種類型一條橫列，每筆預訂是從開始到結束的橫條，待確認的預訂以虛線框表示。「Trip」會把整趟旅行縮放到符合畫面寬度；點選某一天的標題，就能按小時查看那一天。',
  'help.guide.booking-views.step.4':
    '「日」會把一天攤開在以小時為單位的刻度上，橫條的長度代表時間。日期名稱旁的箭頭可切換到前一天和後一天。旅行進行期間，「今天」會跳到當天，右側的「旅行」和「日」切換開關則可回到整趟旅行。',
  'help.guide.booking-views.step.5':
    '把游標移到橫條上，可以看到日期、時間和地點，再點一下就會開啟該預訂的詳細資料。「卡片」中的卡片和「清單」中的列，也會開啟同樣的彈出視窗。',
  'help.guide.booking-views.step.6':
    '詳細檢視的標題列會顯示標題，以及狀態（點一下就會切換）、類型、日期和預訂碼的標籤，預訂碼旁有複製按鈕。下方先是以方塊顯示的時間，接著是地點、出行成員、備註、費用和檔案（預訂有的才會顯示），最底部是「在地圖上」、垃圾桶和「編輯」。',
  'help.guide.booking-views.result':
    '預訂會在詳細檢視中開啟：「編輯」會開啟表單，「在地圖上」會在行程中顯示，「關閉」或 Esc 鍵則會回到你原本的檢視。',
  'help.guide.booking-views.tip.1':
    '檢視圖示後方的滑桿圖示「檢視選項」，可以用「分組依據」和「排序方式」為「卡片」和「清單」分組與排序。在「時間線」中，它提供「每種類型單獨一列」和「同時顯示另一個分頁」。「同時顯示另一個分頁」會把「交通」分頁的項目以淡化的方式，顯示在頂部一條細窄的列中。「重設檢視」會恢復預設值，每個分頁都會在這個瀏覽器中記住自己的檢視。',
  'help.guide.booking-views.tip.2':
    '旅行之前或之後的預訂，以及沒有日期的預訂，無法顯示在時間線上。它們會以小卡片的形式顯示在圖表下方，分別歸在「旅行之前」、「旅行之後」或「無日期」下。',
  'help.guide.booking-views.tip.3':
    '不論預訂出現在哪裡，開啟的都是同樣的詳細資料：「交通」分頁、每日計畫、某一天的詳細資料和某個地點的詳細資料。點一下標題就能重新命名預訂。',
  // create-booking
  'help.guide.create-booking.title': '建立預訂',
  'help.guide.create-booking.goal': '手動把餐廳、活動、旅遊團、停車位或其他項目加入旅行。',
  'help.guide.create-booking.step.1':
    '點選工具列右端的「手動新增」。「新建預訂」會開啟，頂部的標題列有標題和兩個標籤。',
  'help.guide.create-booking.step.2':
    '點選頂部標題區的類型標籤（新預訂上顯示「其他」），然後選擇「預訂型別」。這個分頁可以建立六種類型：「住宿」「餐廳」「活動」「旅遊團」「停車」和「其他」。表單會隨你的選擇而改變：只有「住宿」使用日期範圍，而不是單一日期。',
  'help.guide.create-booking.step.3':
    '在頂部標題區、標籤上方的欄位輸入標題。這是唯一必填的欄位，在你輸入內容之前，「新增」會保持灰色。',
  'help.guide.create-booking.step.4':
    '設定「日期」和「開始時間」，如果預訂有結束時間，再設定「結束日期」和「結束時間」。日曆只提供旅行期間內的日子。結束日期和時間不晚於開始時間時會顯示為紅色，並且無法點擊「新增」。如果有結束時間但沒有結束日期，而結束時間早於開始時間，只會出現警告：如果預訂在隔天結束，請設定結束日期。',
  'help.guide.create-booking.step.5':
    '輸入確認信上的「預訂碼」，再點選標題列上類型旁邊的狀態標籤。新預訂會顯示「待確認」，點一下就變成「已確認」。狀態決定卡片會歸在哪一區。',
  'help.guide.create-booking.step.6': '點選表單底部的「新增」。',
  'help.guide.create-booking.result':
    '預訂會成為所屬區塊中的一張卡片，標題列的顏色代表狀態，卡片上會顯示類型、日期、時間和預訂碼。旅行中的其他人也會立即看到。',
  'help.guide.create-booking.tip.1':
    '輸入時，「地點 / 地址」會提供真實地址；選一個就會取代你已輸入的內容，而你自己輸入的地址則會維持原樣。',
  'help.guide.create-booking.tip.2':
    '在「連結」中填入這筆預訂在服務供應商那邊的頁面。卡片和詳細檢視會把它顯示為連結，並在新分頁開啟。',
  'help.guide.create-booking.tip.3': '備註支援 Markdown，所以清單或粗體文字在卡片和詳細檢視中，也會以清單或粗體顯示。',
  // booking-hotel
  'help.guide.booking-hotel.title': '預訂住宿',
  'help.guide.booking-hotel.goal': '輸入住宿資料，讓它同時算作預訂，以及每日計畫中的住宿夜數。',
  'help.guide.booking-hotel.step.1':
    '點選「手動新增」，再用標題列上的類型標籤選擇「住宿」。日期欄位會換成一組住宿欄位。',
  'help.guide.booking-hotel.step.2':
    '在「住宿」下選擇旅館。清單包含旅行的地點，但不含匯入的軌跡和遊程。選擇一個後，會把它的名稱寫入空白的標題，把它的地址寫入「地點 / 地址」。',
  'help.guide.booking-hotel.step.3':
    '設定「從」和「到」：第一晚，以及退房的那天早上。兩者都會列出旅行的各天和日期，TREK 也會確保「到」不會早於「從」。',
  'help.guide.booking-hotel.step.4': '填寫「入住」、「入住截止」和「退房」，以及確認信上的「預訂碼」。',
  'help.guide.booking-hotel.step.5': '點選「新增」。',
  'help.guide.booking-hotel.result':
    '卡片會在「日期」下顯示日期範圍，以及入住和退房時間和地址。這段住宿現在也會出現在行程中對應的日期上。',
  'help.guide.booking-hotel.tip.1':
    '「住宿」是唯一沒有「日期」和「開始時間」的類型。它的日期是「從」和「到」，而且選的是旅行中的日子，不是行事曆上的日期。',
  'help.guide.booking-hotel.tip.2': '「住宿」欄位可以留空，改為輸入地址：TREK 會幫你查詢該地點、建立並釘在地圖上。',
  'help.guide.booking-hotel.tip.3': '刪除這筆預訂時，每日計畫中的住宿夜數也會一併移除。',
  // link-booking
  'help.guide.link-booking.title': '把預訂連結到計畫',
  'help.guide.link-booking.goal': '把預訂連結到對應的停留點和地點，讓它出現在你需要的位置。',
  'help.guide.link-booking.step.1': '將滑鼠移到要關聯的卡片上，點選標題列的鉛筆。「編輯預訂」會開啟。',
  'help.guide.link-booking.step.2':
    '開啟「關聯日程分配」。清單就是你的行程：每一天有一個標題，下面是當天的停留點，附有編號和時間。選擇這筆預訂所屬的停留點。',
  'help.guide.link-booking.step.3':
    '「地點 / 活動」連結的是地點本身。在那裡選好之後，如果標題和「地點 / 地址」是空的，就會自動填入。',
  'help.guide.link-booking.step.4': '點選「更新」。',
  'help.guide.link-booking.result': '卡片會在「關聯到」下顯示日期和停留點，這筆預訂也會連同該停留點出現在每日計畫中。',
  'help.guide.link-booking.tip.1':
    '清單最上方的「無關聯（獨立）」可以再次取消連結。「住宿」沒有選擇停留點的欄位：它是透過住宿的夜數來連結的。',
  'help.guide.link-booking.tip.2':
    '在有日期的那天選擇停留點時，會自動填入空白的「日期」。你已經設定的日期則不會被更動。',
  // booking-travelers
  'help.guide.booking-travelers.title': '指定預訂是為誰訂的',
  'help.guide.booking-travelers.goal': '標示預訂是為哪些旅伴訂的，之後可以只查看他們的預訂。',
  'help.guide.booking-travelers.step.1':
    '用卡片上的鉛筆開啟預訂。「出行成員」在「預訂碼」旁邊。預訂還沒有指派任何人時，會顯示「指派成員」。',
  'help.guide.booking-travelers.step.2':
    '點選後，選擇這筆預訂適用的人；有名字的訪客也會列在清單中。選中的人會打勾，頭像也會顯示在欄位中。再點一次名字就會取消選取。',
  'help.guide.booking-travelers.step.3': '點選「更新」。',
  'help.guide.booking-travelers.step.4':
    '點選工具列中的「篩選」：在「出行成員」下點選某個人，就只顯示他的預訂。可以同時選多個人。',
  'help.guide.booking-travelers.result': '卡片會列出這筆預訂適用的人，「篩選」則能讓這個分頁只顯示你所選的人的預訂。',
  'help.guide.booking-travelers.tip.1': '在卡片和詳細檢視中，出行成員只供顯示，無法在那裡修改。請在這裡的表單中設定。',
  'help.guide.booking-travelers.tip.2':
    '旅行有超過一位成員，且至少有一筆預訂指定了某人之後，「篩選」中才會出現「出行成員」。你的選擇會保留到關閉這個瀏覽器分頁為止。',
  // booking-files
  'help.guide.booking-files.title': '把憑證和預訂放在一起',
  'help.guide.booking-files.goal': '把確認信、票券或通行證附加到它所屬的預訂。',
  'help.guide.booking-files.step.1':
    '點選卡片上的鉛筆開啟預訂。「檔案」在「連結」旁邊，點選那裡的「附加檔案」。如果是已存在的預訂，文件會立即上傳，TREK 會顯示「檔案已上傳」。',
  'help.guide.booking-files.step.2': '文件會以名稱列出，旁邊有開啟它的按鈕和一個 X。',
  'help.guide.booking-files.step.3':
    '「關聯已有檔案」會列出旅行中尚未附加到這筆預訂的文件。選一個就會附上，不必重新上傳。',
  'help.guide.booking-files.step.4': '點選「更新」。',
  'help.guide.booking-files.result':
    '卡片和詳細資訊會在「檔案」下列出這些文件，點擊其中一個即可開啟。詳細資訊中列表上方的「在檔案中顯示」會帶你到「檔案」分頁。',
  'help.guide.booking-files.tip.1':
    '在還在建立中的預訂上，文件會等待，並在你點擊「新增」的瞬間上傳。上傳需要網路連線。',
  'help.guide.booking-files.tip.2': '文件旁的 X 移除的是連結，不是文件本身。文件仍會保留在旅行的「檔案」分頁中。',
  'help.guide.booking-files.tip.3':
    '可以附加哪些檔案類型，由管理員在「允許的檔案型別」中設定。預設允許文件、文字和圖片。',
  // booking-cost
  'help.guide.booking-cost.title': '把預訂金額轉為費用',
  'help.guide.booking-cost.goal': '把預訂的花費加入「費用」，並由要付錢的人分攤。',
  'help.guide.booking-cost.step.1':
    '點選卡片上的鉛筆開啟預訂，捲到表單底部。在「費用」下有「建立支出」和「關聯已有支出」，並附有說明：先儲存預訂，然後開啟費用編輯器。',
  'help.guide.booking-cost.step.2': '點選「建立支出」。預訂會被儲存，表單關閉，費用編輯器則以「新增支出」開啟。',
  'help.guide.booking-cost.step.3':
    '標題列中的名稱已經是預訂的標題，「日期」也已經是預訂的日期。填入「總金額」，並檢查旁邊的「貨幣」。',
  'help.guide.booking-cost.step.4':
    '標題列的標籤是「分類」，已經設為與預訂類型相符的分類。在「誰付的款？」下選擇付款的人，在「分攤」下選擇金額的分攤方式。',
  'help.guide.booking-cost.step.5': '點選「新增支出」。',
  'help.guide.booking-cost.result':
    '卡片底部會顯示金額，預訂的表單會在「已關聯支出」下列出這筆支出，同一筆支出也會出現在「費用」分頁中，並連結到這筆預訂。',
  'help.guide.booking-cost.tip.1':
    '分類會依類型而定：「餐廳」歸為「餐飲」，「住宿」歸為「住宿」，「停車」歸為「停車」，「活動」和「旅遊團」則都歸為「其他」。',
  'help.guide.booking-cost.tip.2':
    '一筆預訂可以有多筆支出。「關聯已有支出」會列出「費用」中尚未關聯到任何項目的支出。在已關聯的支出上，「取消關聯，保留支出」會解除關聯，但支出仍留在「費用」中，垃圾桶則會刪除該筆支出。',
  'help.guide.booking-cost.tip.3':
    '只有在「費用」擴充套件開啟時，表單中才會有「費用」，管理員可以在「擴充套件」中切換。',
  // filter-bookings
  'help.guide.filter-bookings.title': '找出預訂',
  'help.guide.filter-bookings.goal': '用關鍵字、狀態、類型或人員，篩選很長的分頁。',
  'help.guide.filter-bookings.step.1':
    '在工具列的「搜尋」中輸入。它會搜尋標題、類型、地點和地址、備註、預訂碼和旅伴的名字，分頁中的結果會隨著你輸入而減少。按 Esc 鍵可清空搜尋框。',
  'help.guide.filter-bookings.step.2':
    '點選搜尋旁邊的漏斗圖示「篩選」。面板裡有「狀態」和「類型」，一旦有預訂指派了人員，還會有「出行成員」。',
  'help.guide.filter-bookings.step.3':
    '在「狀態」下選擇「已確認」或「待確認」，就只顯示該狀態的預訂；選「全部」則兩者都顯示。',
  'help.guide.filter-bookings.step.4':
    '在「類型」下點選一個或多個類型，就只保留這些類型。每個類型都會顯示預訂數量，已選取的類型會打勾。',
  'help.guide.filter-bookings.step.5':
    '「篩選」上的數字代表已啟用的篩選條件數量，搜尋旁邊的小標籤則顯示所有預訂中還剩幾筆。點選這個小標籤，或點選面板底部的「重設篩選」，就能再次看到全部預訂。',
  'help.guide.filter-bookings.result':
    '這個分頁只會顯示你所選的內容，在「卡片」、「清單」和「時間線」中都一樣。這些篩選條件會在這趟旅行中保留，直到你關閉瀏覽器分頁為止。',
  'help.guide.filter-bookings.tip.1':
    '只有分頁中有不只一種類型時，才會顯示「類型」，而且只會列出該分頁中有的類型。所以如果分頁裡沒有任何旅遊團，「類型」裡就不會有「旅遊團」。',
  'help.guide.filter-bookings.tip.2':
    '如果沒有任何項目符合篩選條件，分頁會顯示「沒有符合這些篩選條件的項目」，正下方就是「重設篩選」。',
  // import-booking-file
  'help.guide.import-booking-file.title': '從確認單匯入預訂',
  'help.guide.import-booking-file.goal': '讓 TREK 從業者寄來的電子郵件或 PDF 讀取預訂資訊，你就不用再重新輸入。',
  'help.guide.import-booking-file.step.1':
    '點選工具列中的下載圖示「匯入訂位確認」，把游標移上去就會顯示這個名稱。同名的對話框隨即開啟。',
  'help.guide.import-booking-file.step.2':
    '把確認信拖放到方框上，或點擊方框選擇檔案。支援 EML、PDF、PKPass、HTML 和 TXT，最多五個檔案，每個 10 MB；如果 AI 模型能讀取圖片，也支援照片（JPG、PNG、WEBP）。你選擇的檔案會顯示在方框上。',
  'help.guide.import-booking-file.step.3': '點選「匯入」。對話框會立刻關閉，因為檔案是在背景讀取的。',
  'help.guide.import-booking-file.step.4':
    '右下角的卡片會在檔案名稱下方顯示進度。你在應用程式中切換頁面，或重新載入後，它仍會保留。讀取完成後，「正在解析檔案…」會變成勾號，卡片上也會出現「匯入」。點選它。',
  'help.guide.import-booking-file.step.5':
    '找到的每筆預訂都會依序在「新建預訂」中開啟，內容已事先填好。以飯店來說，會填入名稱作為標題；如果旅行中有這個地點，還會填入「住宿」下的地點、「地點 / 地址」、依住宿晚數填好的「從」和「到」、「入住」和「退房」、「預訂碼」、「檔案」下的確認單，以及在開啟「費用」時，作為「關聯支出」的價格。確認內容後，點選「新增」。',
  'help.guide.import-booking-file.result':
    '預訂會以卡片形式出現在「待確認」中，附有住宿晚數、預訂碼，以及「檔案」下的確認單。這段住宿會出現在行程中對應的日期上。如果「費用」已開啟，價格會新增為連結到該預訂的支出。',
  'help.guide.import-booking-file.tip.1':
    '只有在伺服器能讀取確認單時，才會顯示匯入圖示。這需要擷取器或「AI 解析」擴充套件其中之一。管理員可以在「擴充套件」下開啟「AI 解析」擴充套件。沒有任何預訂的分頁，也會以「從檔案匯入」按鈕提供這個功能。',
  'help.guide.import-booking-file.tip.2':
    '如果什麼都讀不到，卡片會告訴你。若已開啟「AI 解析」，卡片會提供「試試 AI 解析」，直接把同樣的檔案送給模型。解析完成的結果會保留十分鐘，請在這段時間內開始檢查。',
  'help.guide.import-booking-file.tip.3':
    '只有在確認檔的類型屬於管理設定中的「允許的檔案型別」時，才會附加到預訂上。PDF 預設就允許；郵件檔（EML）要先加入，否則預訂儲存時不會附上該檔案。',
  // edit-booking
  'help.guide.edit-booking.title': '更改預訂',
  'help.guide.edit-booking.goal': '修正時間、補上後來才收到的預訂碼，或是把預訂從「待確認」改成「已確認」。',
  'help.guide.edit-booking.step.1':
    '將滑鼠移到卡片上，點選標題列的鉛筆。「編輯預訂」會開啟，並顯示這筆預訂的所有詳細資料。',
  'help.guide.edit-booking.step.2': '修改需要更正的部分，例如業者稍後才寄來的「預訂碼」。',
  'help.guide.edit-booking.step.3': '點選頂部標題區的「待確認」標籤。它會變成「已確認」，標題區也會變成綠色。',
  'help.guide.edit-booking.step.4': '點選「更新」。',
  'help.guide.edit-booking.result':
    '卡片會移動位置：已確認的預訂會出現在「已確認」區，帶有綠點和綠色頂端色帶，旅行中的所有人都看得到它的移動。',
  'help.guide.edit-booking.tip.1':
    '如果看不清楚「預訂碼」，是因為在設定的「顯示」下開啟了「模糊預訂程式碼」。把游標移到預訂碼上，或點一下，就能看清楚。',
  'help.guide.edit-booking.tip.2': '更改類型時，所連結支出的分類也會跟著變，除非你曾在費用編輯器中手動選過分類。',
  'help.guide.edit-booking.tip.3':
    '預訂詳細檢視底部的「編輯」開啟的是同一個表單。你也可以不開表單直接切換狀態：點選卡片或列上的圓點，或詳細檢視中的狀態標籤。',
  // delete-booking
  'help.guide.delete-booking.title': '刪除預訂',
  'help.guide.delete-booking.goal': '把已取消的預訂從旅行中移除。',
  'help.guide.delete-booking.step.1': '把游標移到卡片上，點選標題列的垃圾桶。預訂詳細資料底部的垃圾桶功能相同。',
  'help.guide.delete-booking.step.2':
    '「刪除預訂？」會寫出你選的預訂，並說明它將被永久刪除。如果有費用與它關聯，也會說明這些費用會一併刪除。',
  'help.guide.delete-booking.step.3': '點選「刪除」。',
  'help.guide.delete-booking.result':
    '卡片會對旅行中的所有人一併刪除。刪除預訂後無法復原，所以確認的提問是你最後一次取消的機會。',
  'help.guide.delete-booking.tip.1':
    '刪除預訂時，連結到它的支出也會一併移除。如果刪除的是住宿，每日計畫中的住宿夜數也會一併移除。',
  'help.guide.delete-booking.tip.2': '附加過的文件會保留在旅行的「檔案」分頁中，只會移除它們與這筆預訂的連結。',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': '費用',
  'help.ctx.trip-costs.summary':
    '旅行的花費：每筆支出都列在依日期排列的帳本或表格中，包括誰輸入的、誰要分攤，金額以收據上的貨幣顯示。右欄會顯示誰要付錢給誰，才能把帳結清。',
  'help.ctx.trip-costs.bullet.1':
    '頂端的列顯示旅行日期，以及分攤費用的旅伴。此外還有「搜尋支出…」、「篩選」（漏斗圖示）、「匯出 CSV」（下載圖示），以及「清單」/「表格」切換。',
  'help.ctx.trip-costs.bullet.2':
    '右端的「結清」可以一次記錄所有未結清的轉帳；當「AI 解析」擴充套件能讀取圖片時，「掃描收據」可以根據照片填好支出；「新增支出」則會開啟編輯器。',
  'help.ctx.trip-costs.bullet.3':
    '工具列下方有四張卡片：「你欠款」和「他人欠你」是你自己這一邊的結算，「未結算金額」是已記錄但還沒有付款人的金額，「旅程總支出」則是全部加總，下方還有「你的分攤」和「你支付了」。',
  'help.ctx.trip-costs.bullet.4':
    '帳本依日期分組，最新的在前，每天的標題會顯示該天的項目數量和花費。每一列包含以彩色標籤顯示的分類、名稱、付款人標籤和各自付了多少，其下是「分攤」及每位出行成員的份額（勾號代表已付清自己的份額），然後是備註和金額。如果分攤的結果是別人欠你或你欠別人，還會顯示「你借出」或「你借入」。',
  'help.ctx.trip-costs.bullet.5':
    '右欄顯示結果：「結清」列出誰要付給誰，「餘額」顯示每位旅伴的結餘或欠款，「最終花費」顯示這趟旅行每個人各花了多少，「按分類」則顯示錢花在哪些項目上。',
  'help.ctx.trip-costs.bullet.6':
    '已記錄的付款會作為獨立的一列出現在同一帳本中，旁邊有鉛筆和「復原」；支出有鉛筆和垃圾桶，垃圾桶會在刪除支出前先詢問。帶有收據的支出在名稱旁有「收據」標籤，點擊即可開啟。',
  'help.ctx.trip-costs.bullet.7':
    '工具列中的「表格」會把相同的支出以試算表的形式顯示，依分類分組，並附上「人數」和「天數」，以及每人和每天的金額。這時「摘要」會取代「按分類」。「費用」會記住你選的檢視。',
  // add-expense
  'help.guide.add-expense.title': '新增支出',
  'help.guide.add-expense.goal': '記錄某項花費的金額、付款人，以及分攤的對象。',
  'help.guide.add-expense.step.1':
    '點選工具列右端的「新增支出」。編輯器開啟後，日期預設為今天，付款人是你，所有人都已在分攤名單中。',
  'help.guide.add-expense.step.2':
    '在對話框頂端的欄位輸入這筆支出的用途，欄位空白時會顯示「例如：晚餐、紀念品、油費…」。這是支出的名稱，沒有名稱就無法儲存。',
  'help.guide.add-expense.step.3':
    '名稱下方的標籤是「分類」，在你選別的分類之前，預設是「餐飲」。共有十四種，無法更改。標題列會換成你所選分類的顏色，該列上的標籤，以及「按分類」中的長條也一樣。',
  'help.guide.add-expense.step.4':
    '把收據上的金額填入「總金額」。旁邊的「貨幣」一開始會是「費用」所顯示的貨幣；如果更改，編輯器會顯示換算後的金額。「日期」一開始是今天，這筆支出會在清單中歸入這一天。',
  'help.guide.add-expense.step.5':
    '在「誰付的款？」下，點選實際付錢的人。「你」是預設選取的。「尚無人付款」只記錄金額，不會讓任何人欠這筆錢；標題旁開關中的「多人支付」則可以把帳單分給多位付款人。',
  'help.guide.add-expense.step.6':
    '下方的「分攤」預設為「平均」，所有人都已勾選，每個名字旁邊是各自的份額。你可以保留或修改。點選對話框底部的「新增支出」即可儲存。',
  'help.guide.add-expense.result':
    '這筆支出會出現在帳本中它所屬的那一天，並計入「旅程總支出」，結算欄也會重新計算誰該付錢給誰。',
  'help.guide.add-expense.tip.1':
    '如果不更改預設值，這筆支出的日期就是今天，由你付款，並由所有人平均分攤：只需要填入名稱和金額。',
  'help.guide.add-expense.tip.2': '金額旁邊的 ± 可以把支出變成退款。總額為負數表示款項退回，分攤方向也會反過來。',
  'help.guide.add-expense.tip.3':
    '對話方塊底部「收據與發票」旁的「附加」接受圖片和 PDF。它們會在你儲存時上傳並放進旅行的「檔案」，列表中名稱旁會出現「收據」標籤。',
  // expense-payers
  'help.guide.expense-payers.title': '設定誰付了款',
  'help.guide.expense-payers.goal': '記錄這筆支出是誰付的，這是結算計算的另一半。',
  'help.guide.expense-payers.step.1':
    '點選該列旁的鉛筆開啟支出，查看「誰付的款？」。標題旁的開關預設為「一人支付」：每位旅伴都是一個標籤，有外框的那一個就是付款的人。點選另一個標籤即可更換。',
  'help.guide.expense-payers.step.2':
    '旅伴後面的虛線標籤「尚無人付款」只記錄金額，不會讓任何人欠款。這筆支出仍會計入「旅程總支出」。',
  'help.guide.expense-payers.step.3':
    '切換開關的另一個選項「多人支付」，會列出每位旅伴，並附上可勾選的方塊，每位勾選的人都會有一個金額欄位。請勾選付過錢的人，並輸入各自付了多少；金額加總必須等於總額。',
  'help.guide.expense-payers.step.4':
    '沒有人付款的支出，該列會標示「未完成」，並計入「未結算金額」卡片，這張卡片會加總尚無付款人的支出。',
  'help.guide.expense-payers.result': '付款人決定誰會收到還款，分攤決定誰要付錢，「餘額」則是兩者之間的差額。',
  'help.guide.expense-payers.tip.1':
    '「誰付的款？」和「分攤」互不相干：你可以幫一頓你沒參加的晚餐付款，也可以被分攤到一頓你沒付款的晚餐。',
  'help.guide.expense-payers.tip.2':
    '有多位付款人時，金額加總必須等於總額。多勾選一位付款人時，剩下的金額會重新分配給你沒有親自輸入金額的人。金額不符時，編輯器會顯示它們必須加總到多少，並且不會儲存。',
  'help.guide.expense-payers.tip.3':
    '把支出改回「尚無人付款」並不會移除它：金額仍會計入「旅程總支出」，而那一列會變成「未完成」。',
  // split-expense
  'help.guide.split-expense.title': '在旅伴之間分攤帳單',
  'help.guide.split-expense.goal': '決定這筆支出由誰分攤：所有人平均分攤、依金額分攤，或依收據逐項分攤。',
  'help.guide.split-expense.step.1':
    '在支出編輯器中，「分攤」會列出每位旅伴，各附一個可勾選的方塊。取消勾選某個名字，就能把對方排除在這筆支出之外：名字會變灰，沒有分攤額，也不需要為此付錢。',
  'help.guide.split-expense.step.2':
    '標題旁邊切換開關中的「平均」是預設值：每位勾選的旅伴分到相同的份額，顯示在名字旁邊。清單下方的徽章會顯示分攤人數和每人的份額。',
  'help.guide.split-expense.step.3':
    '「自訂」會把份額換成金額欄位。輸入每位旅伴該負擔的金額。下方的徽章會隨著你輸入即時更新，並在金額加總相符時變成綠色，顯示「分攤金額與總額相符」。金額與總額不符時，無法儲存。',
  'help.guide.split-expense.step.4':
    '「收據」會逐行拆分收據：點選「新增品項」，每行填入名稱和價格，並在「分攤：」旁邊選擇分攤該行的旅伴。',
  'help.guide.split-expense.step.5':
    '品項下方的「每人分攤額」會顯示每位旅伴最終要付多少，頂部的「總金額」則是各品項的加總。點選對話框底部的「儲存」。',
  'help.guide.split-expense.result':
    '分攤是每筆餘額的計算基礎。它與支出一起儲存，在其列上以「分攤」顯示每位出行成員的部分，之後可以修改，而不影響其他任何內容。',
  'help.guide.split-expense.tip.1': '你取消勾選的旅伴，只在這一筆支出上不用付錢，其他人則各自分攤自己的部分。',
  'help.guide.split-expense.tip.2':
    '「平均」會精確分到分：多出的一分會在每筆支出落到不同人身上，所以不會總是同一個人負擔。',
  'help.guide.split-expense.tip.3':
    '「Ticket」模式會自動算出「總金額」，並把該欄位設為灰色：總額就是收據上各品項的加總。',
  'help.guide.split-expense.tip.4':
    '自訂分攤也可以用百分比輸入：把「份額輸入方式」切換成 %，各份額加起來必須是 100%，支出才能儲存。',
  // expense-currency
  'help.guide.expense-currency.title': '用其他貨幣輸入支出',
  'help.guide.expense-currency.goal': '輸入收據上的金額，TREK 會幫你記下匯率。',
  'help.guide.expense-currency.step.1':
    '開啟「新增支出」。在對話框頂部輸入名稱，並把收據上的金額原樣填入「總金額」，不要填換算後的金額。',
  'help.guide.expense-currency.step.2':
    '開啟金額旁邊的「貨幣」，選擇收據上的貨幣。清單包含 TREK 認得的所有代碼，也可以搜尋：輸入三個字母即可。',
  'help.guide.expense-currency.step.3':
    '欄位下方會出現一排徽章：你輸入的金額，以及它目前的價值，並標示「即時匯率」。這只是預覽，不是最後儲存的金額。',
  'help.guide.expense-currency.step.4':
    '點選對話框底部的「新增支出」。匯率會在這一刻固定下來：這筆支出會保留你輸入當天的價值。',
  'help.guide.expense-currency.step.5':
    '在帳本中，該列的名稱下方會顯示兩個金額：你輸入的金額、一個箭頭，以及換算成旅行貨幣的金額。「費用」分頁上的所有合計、餘額和結算，都是用第二個金額計算的。',
  'help.guide.expense-currency.result':
    '支出會保留你輸入的金額和貨幣。帳本會同時顯示兩者，而旅行的合計與餘額則以旅行的貨幣計算。',
  'help.guide.expense-currency.tip.1':
    '匯率會在你儲存時固定下來，所以已結清的欠款不會因為下週匯率變動而改變。只有更改這筆支出的貨幣時，才會記錄新的匯率。',
  'help.guide.expense-currency.tip.2':
    '「設定」中的「顯示貨幣」只會改變金額的顯示方式，儲存的金額不會改變。如果留空，每趟旅行都會用它自己的貨幣顯示。',
  'help.guide.expense-currency.tip.3':
    '旅行貨幣是在旅行本身設定的，位於「編輯旅行」下，並需要「編輯旅行詳情」權限。更改後，所有已固定的匯率都會依新貨幣重新計算，但金額本身不會被換算。',
  // filter-costs
  'help.guide.filter-costs.title': '找出一筆支出或某一天的花費',
  'help.guide.filter-costs.goal': '把很長的支出清單篩選成你要找的部分。',
  'help.guide.filter-costs.step.1':
    '在工具列的「搜尋支出…」中輸入文字。它會隨著輸入即時比對支出名稱，按 Esc 可以清除。',
  'help.guide.filter-costs.step.2':
    '搜尋旁邊的漏斗「篩選」會開啟篩選條件。最上方的切換開關是你自己看帳本的方式：「全部」；「我支付的」是你付款的支出；「他人欠我」是你付的錢比自己分攤的金額多的支出。',
  'help.guide.filter-costs.step.3':
    '在「分類」下，從十四個分類中選一個，就只會顯示該分類的支出。漏斗圖示會顯示目前啟用了多少個篩選條件。',
  'help.guide.filter-costs.step.4':
    '在「日期」下，選擇有支出的其中一天。橫幅會取代日期標題，完整顯示那一天，以及它有幾筆支出和合計金額。',
  'help.guide.filter-costs.step.5':
    '漏斗旁邊的下載圖示「匯出 CSV」會把所有支出儲存成檔案，包含原始金額、貨幣和換算後的金額。',
  'help.guide.filter-costs.result': '篩選條件可以合併使用，日期分組也會針對剩下的支出，更新各自的合計。',
  'help.guide.filter-costs.tip.1':
    '已記錄的付款沒有名稱也沒有分類，所以搜尋或分類篩選會把它們隱藏，「他人欠我」也一樣。日期篩選則會保留它們，並歸在付款發生的那一天。',
  'help.guide.filter-costs.tip.2': '不論畫面上篩選了什麼，「匯出 CSV」一律匯出每一筆支出，每筆支出一列。',
  'help.guide.filter-costs.tip.3': '只要啟用了任何篩選，篩選選單底部就會出現「重設篩選」，可以一次關閉所有篩選。',
  // settle-up
  'help.guide.settle-up.title': '查看誰欠誰，並結清款項',
  'help.guide.settle-up.goal': '把許多共同支出，化簡成讓所有債務結清所需的最少筆轉帳，並在轉帳完成時記錄下來。',
  'help.guide.settle-up.step.1':
    '右欄的「結清」卡片會列出能讓所有債務結清的轉帳：誰付給誰（以兩個頭像顯示，名字在提示中），以及金額。卡片標題上的數字是尚未完成的筆數。',
  'help.guide.settle-up.step.2': '轉帳旁邊的「結算」會將它記錄為已完成。這筆轉帳會從卡片上消失，餘額也會更新。',
  'help.guide.settle-up.step.3':
    '記錄下來的轉帳會成為帳本中的一列，歸在轉帳當天下，標示「付款」，並列出兩位旅伴和金額。',
  'help.guide.settle-up.step.4': '那一列旁邊的鉛筆可以修正付款紀錄，「復原」則會取消這筆付款，轉帳會回到「結清」卡片。',
  'help.guide.settle-up.step.5':
    '卡片標題中的「新增付款」可記錄一筆未依建議進行的轉帳。選擇「來自」和「到」、金額、貨幣和發生的日期，需要的話加上「備註」（例如付款方式），然後點擊對話方塊底部的「新增付款」。',
  'help.guide.settle-up.step.6':
    '頂端工具列的「結清」會不經詢問，一次記錄所有未結清的轉帳，例如旅行結束時大家一次把帳清掉。',
  'help.guide.settle-up.result':
    '每一筆記錄下來的轉帳，都會成為帳本中的一列，同時從「結清」卡片中減少一行。當卡片顯示「大家都已結清」，這趟旅行的帳就全部付清了。',
  'help.guide.settle-up.tip.1':
    '卡片顯示的是最少的轉帳筆數，而不是每一筆債務：如果三個人繞成一圈互相欠錢，就會化簡成一到兩筆付款。',
  'help.guide.settle-up.tip.2':
    '「結算」只會記錄一筆轉帳，並不會真的匯款。請先用你慣用的付款方式付款，再點選「結算」。',
  'help.guide.settle-up.tip.3':
    '付款可以使用任何貨幣，所以用歐元償還日圓的欠款很正常：對話框有自己的貨幣選擇器，也會固定那個匯率。',
  // final-budget
  'help.guide.final-budget.title': '查看每位旅伴這趟旅行花了多少',
  'help.guide.final-budget.goal': '查看每個人的數字：目前的餘額，以及每個人實際的花費。',
  'help.guide.final-budget.step.1':
    '「餘額」會顯示每位旅伴的狀況：如果旅行欠他錢，就是向右的綠色長條；如果他欠旅行錢，就是向左的紅色長條，金額則顯示在名字旁邊。',
  'help.guide.final-budget.step.2':
    '下方的「最終花費」回答的是另一個問題：不是現在誰欠誰多少，而是所有款項還清之後，這趟旅行每位旅伴實際花了多少。',
  'help.guide.final-budget.step.3':
    '點選某個名字，就能看到計算過程：「已支付的支出」，下方是「還款淨額」和「待還款項」。',
  'help.guide.final-budget.step.4':
    '三行的下方，每位旅伴的名字下都有一份清單，列出組成該行的項目：這位旅伴付過的支出、已記錄的轉帳，以及尚未完成的轉帳。每份清單的加總都剛好等於同名的那一行。',
  'help.guide.final-budget.result':
    '「餘額」顯示今天誰該收錢、誰該付錢。「最終花費」顯示一切都還清之後，這趟旅行讓你們每個人各花了多少。',
  'help.guide.final-budget.tip.1': '記錄一筆付款並不會改變任何人的最終預算，只會把一筆金額從待償還款項移到淨償還款項。',
  'help.guide.final-budget.tip.2': '沒有付款人的支出不會計入這兩張卡片，就像它不會出現在結算建議中一樣。',
  // expense-from-booking
  'help.guide.expense-from-booking.title': '把預訂轉成支出',
  'help.guide.expense-from-booking.goal': '把航班、飯店或地點實際花的錢，附加到它所屬的紀錄上。',
  'help.guide.expense-from-booking.step.1': '在「交通」或「預訂」分頁找到該預訂，點擊其卡片標題中的鉛筆。',
  'help.guide.expense-from-booking.step.2':
    '捲動到表單接近底部的「費用」。那裡有「建立支出」（會先儲存預訂），以及「關聯已有支出」（用於已經在「費用」中的支出）。',
  'help.guide.expense-from-booking.step.3':
    '點擊「建立支出」。預訂會被儲存，表單關閉，「費用」編輯器隨即開啟，名稱採用預訂的標題，類型對應到某個分類，支出的日期採用預訂的日期。',
  'help.guide.expense-from-booking.step.4':
    '像處理任何支出一樣，填入金額和貨幣、誰付的款和分攤方式，然後點選「新增支出」。再次開啟預訂時，支出會顯示在「已關聯支出」下，旁邊有可以編輯的鉛筆、「取消關聯，保留支出」（移除連結但保留支出），以及用來刪除的垃圾桶。',
  'help.guide.expense-from-booking.result':
    '預訂會顯示它的費用，而這筆支出就是「費用」分頁中的一般列，和其他支出一樣有付款人、分攤方式和貨幣。',
  'help.guide.expense-from-booking.tip.1':
    '刪除預訂會連同它關聯的支出一起刪除，刪除前的詢問會這麼說明。預訂「費用」區塊中的「移除支出」則相反：支出消失，預訂保留。「取消關聯，保留支出」則兩者都保留。',
  'help.guide.expense-from-booking.tip.2': '地點的表單中也有同樣的區塊，其中的「建立支出」會先儲存地點。',
  // costs-table
  'help.guide.costs-table.title': '用表格規劃費用',
  'help.guide.costs-table.goal': '用表格查看並修改支出，依分類排列，並計算出每人和每天的金額。',
  'help.guide.costs-table.step.1':
    '點選工具列中「清單」/「表格」切換的第二個圖示「表格」。同樣的支出會以表格取代帳本顯示，搜尋與篩選也同樣適用。',
  'help.guide.costs-table.step.2':
    '表格依分類分組，每組的標題顯示名稱、支出筆數和小計，點擊標題即可收合該組。欄位有「名稱」、「日期」、「合計」、「人數」和「天」，後面是「人均」、「日均」和「人日均」，這三欄由前面的欄位計算而來，以灰色背景顯示。底部的「合計」列會把全部加總。',
  'help.guide.costs-table.step.3':
    '點選儲存格即可直接修改：名稱、合計、「人數」或「天數」。輸入後按 Enter 或點選其他地方即可儲存，按 Esc 則取消；日期欄會開啟日曆。「人均」和其他計算欄位會立即更新。',
  'help.guide.costs-table.step.4':
    '帶有鎖頭的合計無法在這裡修改：可能是已經有人付款，或是用另一種貨幣輸入的，提示會說明是哪一種。點選它會改為開啟該筆支出，讓餘額和固定的匯率維持正確。',
  'help.guide.costs-table.step.5':
    '分類末端的「新增支出」會在其中加入一列名為「新建條目」的項目，日期與該處最新一筆相同。名稱欄位已經開啟，可以直接修改。合計的輸入方式也一樣。',
  'help.guide.costs-table.step.6':
    '在這個檢視中，右欄會顯示「摘要」，取代「按分類」。它會用四種方式加總支出：「分類」、「日期」、「付款人」（尚未付款的歸在「尚無付款人」），以及「狀態」，也就是「已支付」與「未支付」。',
  'help.guide.costs-table.result':
    '每筆支出都會列在所屬分類下，並顯示每人和每天的金額。你在儲存格中修改合計時，上方的卡片和「摘要」會立即更新。',
  'help.guide.costs-table.tip.1': '「費用」會在這個瀏覽器中記住檢視方式：在你再次點選「清單」之前，都會以表格開啟。',
  'help.guide.costs-table.tip.2':
    '以「自訂」或「收據」分攤的支出，沒有統一的每人份額，所以它的「人均」和「人日均」會保持空白。',
  'help.guide.costs-table.tip.3':
    '付款人、分攤、備註和收據要在支出本身編輯：列末的「更多選項」裡有「編輯」，以及用來移除該列的「刪除」。',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': '交通',
  'help.ctx.trip-transports.summary':
    '所有載你往返各停靠點的交通：航班、火車、公車、汽車、計程車、自行車、郵輪、渡輪、纜車，以及 TREK 為你查詢的大眾運輸接駁。這個分頁是它們的列表；它們同樣可在計畫中建立和閱讀，並繪製在地圖上。',
  'help.ctx.trip-transports.bullet.1':
    '這個分頁只放交通。住宿、餐廳、活動和票券都在「預訂」分頁，所以同一個項目不會重複出現。',
  'help.ctx.trip-transports.bullet.2':
    '頂部列有「搜尋」，用於狀態、類型和出行成員的「篩選」，「卡片」、「清單」和「時間線」三種檢視，「檢視選項」，以及會下載目前所顯示內容的「匯出為試算表 (CSV)」。右側的「交通」可手動新增行程。它前面的圖示「匯入訂位確認」和「從 AirTrail 匯入」，會在伺服器能讀取確認信，或已連接 AirTrail 時出現。分頁是空的時候，這些操作會顯示在中間，名稱為「交通」、「從檔案匯入」和 AirTrail。',
  'help.ctx.trip-transports.bullet.3':
    '這個分頁預設以「卡片」檢視開啟：先列「已確認」，再列「待確認」，點選標題即可收合各區。規劃好的大眾運輸路線沒有狀態，會依時間順序排在已確認的交通之間，除非你在「檢視選項」中讓它們獨立成區，也就是「自動大眾運輸」。「清單」依天數分組，「時間線」則把整趟旅行每一天的交通全部列出。',
  'help.ctx.trip-transports.bullet.4':
    '卡片頂端的色帶依狀態上色：已確認為綠色，待確認為琥珀色，規劃好的大眾運輸路線為藍色。色帶上有狀態圓點、類型、標題、鉛筆和垃圾桶。下方則是：「日期」、「時間」、「預訂碼」、「路線」，以及航空公司和航班編號，或是車次、月台和座位。點選卡片即可開啟詳細資料。',
  'help.ctx.trip-transports.bullet.5':
    '你也可以直接在計畫中建立交通：當天標題中的 +（提示文字為「新增到當天」），或在標題上按右鍵，都有「新增交通」和「大眾運輸」。兩個停靠點之間的行程時間連接線，則會針對那一段開啟同樣的搜尋。',
  'help.ctx.trip-transports.bullet.6':
    '兩端都已設定的交通，會在地圖上畫出一條線。每日計畫中該列的路線圖示，以及詳細資料中的「在地圖上」，可以開啟這條線。天數上方工具列的「顯示所有預訂路線」則可一次開啟或關閉整趟旅行的路線。',
  // transports-list
  'help.guide.transports-list.title': '看懂「交通」分頁',
  'help.guide.transports-list.goal': '在修改任何內容之前，先了解清單顯示的是什麼。',
  'help.guide.transports-list.step.1':
    '「交通」是旅行的一個分頁，位於「計畫」之後（開啟遊程擴充套件時，則在「遊程」之後）。它只放交通，旅館、餐廳、活動和票券都在「預訂」分頁。',
  'help.guide.transports-list.step.2':
    '列左側的「搜尋」會在你輸入時縮小交通範圍。旁邊的漏斗「篩選」會開啟選項：「狀態」含「全部」、「已確認」和「待確認」，然後是使用中的每種類型及其數量。勾選一種或多種類型即可只保留這些；漏斗上的數字表示開啟了幾項，列上也會顯示目前顯示幾筆，例如 4 筆中的 1 筆。選單底部的「重設篩選」會恢復全部。',
  'help.guide.transports-list.step.3':
    '旁邊的「卡片」「清單」和「時間線」，會把交通顯示為卡片、依日期分組的列，或橫跨旅行各天的長條。滑桿圖示的「檢視選項」可以設定「卡片」和「清單」的「分組依據」與排序，以及「時間線」的各列。「重設檢視」會恢復預設值。在「卡片」中，開啟「大眾運輸獨立成區」後，已規劃的轉乘路線會顯示在「自動大眾運輸」下。',
  'help.guide.transports-list.step.4':
    '每張卡片都會顯示完整的詳細資料。頂部的標題區在「已確認」時為綠色，「待確認」時為琥珀色，上面有狀態圓點、類型和標題。下方的「日期」顯示它橫跨的日子和日期。接著是「時間」「預訂碼」，以及站點之間帶有類型圖示的「路線」，還有航空公司和航班號，或車次、月台和座位。點選卡片即可開啟詳細資料。',
  'help.guide.transports-list.step.5':
    '點擊狀態圓點可在「待確認」和「已確認」之間切換；提示文字會說明切換方向，例如「設為待確認」。標題列中的鉛筆會開啟交通的表單，垃圾桶則會在詢問「刪除預訂？」後刪除，該提示會說明哪些內容將消失，包括關聯的費用。',
  'help.guide.transports-list.result': '每張卡片都會顯示這段交通是否已訂好，你也可以隨時用工具列篩選或排序清單。',
  'help.guide.transports-list.tip.1':
    '這個分頁會記住你的設定：檢視方式、分組和排序記在這個瀏覽器中，收合的區塊則依旅行分別記住，篩選條件會保留到你關閉瀏覽器分頁為止。',
  'help.guide.transports-list.tip.2':
    '「交通」前面的兩個圖示「匯入訂位確認」和「從 AirTrail 匯入」，只有在伺服器能讀取訂位確認，以及已連接 AirTrail 實例時才會出現。沒有這些功能時，請手動填寫清單，或使用大眾運輸搜尋。',
  // add-transport
  'help.guide.add-transport.title': '把交通加到某一天',
  'help.guide.add-transport.goal': '把從一個停留點前往下一個停留點的交通，加到它發生的那一天。',
  'help.guide.add-transport.step.1':
    '在行程所在那一天的標題中，點擊 +（提示文字為「新增到當天」），並選擇「新增交通」。在當天的標題上按右鍵也有同樣的選單。表單開啟時已填入那一天。',
  'help.guide.add-transport.step.2':
    '標題列中的類型標籤說明你搭乘什麼，一開始是「飛行」。點擊它可選擇「飛行」、「火車」、「公車」、「汽車」、「計程車」、「自行車」、「郵輪」、「渡輪」、「纜車」或「其他」，表單也隨之改變：航班每個停靠點都有機場，火車是一串車站，郵輪有「登船」、「停靠港」和「下船」，汽車有「取車日期」、「還車日期」和「沿途停靠點」。',
  'help.guide.add-transport.step.3':
    '直接在頂部標題區灰色範例文字的位置輸入標題。這是唯一必填的欄位：填寫之前，下方那一行會顯示「標題 *」，「新增」也會維持灰色。請用你在出發看板上認得出來的名稱。',
  'help.guide.add-transport.step.4':
    '在「路線」下，「出發」和「抵達」可輸入車站、港口或地址。還沒輸入時，會先列出旅行本身的地點。至少輸入三個字母才會搜尋，然後選擇一個結果。只輸入而沒有從結果中選取的名稱不會被儲存，地圖上也不會顯示任何內容。',
  'help.guide.add-transport.step.5':
    '「日期」和「開始時間」是出發時間，「結束日期」和「結束時間」是抵達時間；如果隔天才抵達，請在這裡填隔天的日期。下方的「預訂碼」和「備註」可以不填。點選標題列上的「待確認」標籤，就能改成「已確認」。',
  'help.guide.add-transport.step.6': '點選「新增」。',
  'help.guide.add-transport.result':
    '這筆交通會成為當天的一列，依時間排在各停留點之間，同時也會成為「交通」分頁中「待確認」或「已確認」下的一張卡片。',
  'help.guide.add-transport.tip.1':
    '這一列會依開始時間排在最後一個較早開始的停留點之後。拖曳它的把手，可以移到當天的其他位置，或是移到另一天。',
  'help.guide.add-transport.tip.2':
    '在「檔案」下用「附加檔案」加入票券。在「費用」下按「建立支出」會先儲存預訂，並開啟「費用」編輯器讓你填寫票價。',
  'help.guide.add-transport.tip.3':
    '表單的第一個區塊「出行成員」用來設定誰搭乘這段交通。當旅行有超過一位成員，且有交通指定了某人之後，分頁上的「篩選」也會多出「出行成員」，讓你只看某個人的交通。',
  // import-transport-file
  'help.guide.import-transport-file.title': '從電子機票匯入航班',
  'help.guide.import-transport-file.goal': '讓 TREK 從承運商寄來的票券中讀取航班、火車或渡輪資訊，並在儲存前讓你檢查。',
  'help.guide.import-transport-file.step.1':
    '在「交通」分頁的列中，點擊「交通」前面的下載圖示，提示文字為「匯入訂位確認」。同名的對話方塊隨即開啟，與「預訂」分頁的相同。分頁是空的時候，中間的「從檔案匯入」也有同樣的作用。',
  'help.guide.import-transport-file.step.2':
    '將票券拖放到方框上，或點擊方框選擇檔案：支援 EML、PDF、PKPass、HTML 和 TXT，最多五個檔案，每個 10 MB；如果你的伺服器有 AI 模型可以讀取，也支援票券照片（JPG、PNG、WEBP）。你選擇的檔案會顯示在方框上。',
  'help.guide.import-transport-file.step.3': '點選「匯入」。對話框會立刻關閉，檔案則在背景讀取。',
  'help.guide.import-transport-file.step.4':
    '右下角的卡片會在檔案名稱下方顯示進度。讀取完成後，「正在解析檔案…」會變成勾號，卡片上也會出現「匯入」。點選它。',
  'help.guide.import-transport-file.step.5':
    '航班會在「新增交通」中開啟，並已填好內容：類型標籤是「航班」，標題列的標題是航空公司和航班編號，「航線」下是兩個機場，附有「出發日期」和「到達日期」、時間與時區、「航空公司」和「航班號」、「預訂碼」，以及「檔案」下的票券。檢查無誤後，點選「新增」。',
  'help.guide.import-transport-file.result':
    '這趟航班會以卡片形式出現在「交通」分頁的「待確認」下，並在出發當天多出一列，票券則在「檔案」下。兩個機場都已知時，航班會在地圖上以弧線顯示。',
  'help.guide.import-transport-file.tip.1':
    '兩個分頁使用的是同一個匯入功能。檔案同時包含航班和飯店時，不論你從哪個分頁開始，都會先在「新增交通」中開啟航班，再在「新建預訂」中開啟飯店。',
  'help.guide.import-transport-file.tip.2':
    '機場是依代碼定位。如果車站或港口無法定位，名稱會以琥珀色顯示在右下角的匯入卡片上。請在點選「新增」之前，先在「路線」下手動選好，否則這筆交通不會顯示在地圖上。',
  // plan-transit
  'help.guide.plan-transit.title': '規劃大眾運輸路線',
  'help.guide.plan-transit.goal': '讓 TREK 查出某一天兩個地點之間實際的火車和公車，並把你選的那一班加入計畫。',
  'help.guide.plan-transit.step.1':
    '點選當天標題中的 +，選擇「大眾運輸」。搜尋會針對那一天開啟：當天會以標籤形式顯示在標題列，旁邊的「手動」和「自動」可以在這個搜尋與一般表單之間切換。',
  'help.guide.plan-transit.step.2':
    '「來自」和「到」可選擇停靠點或車站。欄位仍為空白時，會提供當天的住宿、當天預訂的車站和機場，以及當天自己的停靠點；輸入兩個字母則改為搜尋時刻表中的車站。兩個欄位之間的「對調」會把行程反過來。',
  'help.guide.plan-transit.step.3':
    '選擇「出發」或「抵達」並輸入時間，表示你想在何時出行；選擇「最佳路線」、「較少轉乘」或「較少步行」，則決定結果的排序方式。',
  'help.guide.plan-transit.step.4':
    '下方的標籤顯示可以使用哪些交通方式：「火車」「捷運」「路面電車」「公車」「渡輪」和「纜車」。關閉其中一個就會排除該方式，但至少要保留一個開啟。然後點選「搜尋」。',
  'help.guide.plan-transit.step.5':
    '每個結果都會顯示出發和抵達時間、所需時間、轉乘次數和步行距離，以及以徽章顯示的路線，時刻表有提供顏色時就會用各自的顏色。點選其中一個即可展開，查看每一段，包括上車和轉乘的站點、月台，以及路線之間的步行。',
  'help.guide.plan-transit.step.6': '點選「新增到當天」。',
  'help.guide.plan-transit.result':
    '這條路線會成為當天的一列，並附上路線徽章。點選列上的箭頭，就能查看每一段。它也會以藍色卡片的形式，出現在「交通」分頁的已確認交通之間。',
  'help.guide.plan-transit.tip.1':
    '路線來自 Transitous，這是一項使用公開時刻表資料的免費社群服務，不需要金鑰，也不需要帳號。管理員也可以把搜尋改用 Google。',
  'help.guide.plan-transit.tip.2':
    '找不到嗎？資料來源涵蓋一個地區和一段期間。試試其他時間、開啟更多交通方式，或選擇車站而不是地點本身。訊息會說明是哪個服務回應的。沒有日期的旅行沒有可搜尋的日子，所以只提供一般表單。',
  'help.guide.plan-transit.tip.3':
    '同樣的搜尋也能針對單一路段開啟：點選兩個停留點之間顯示行車時間的連接線，再選擇「大眾運輸」。「起點」、「終點」和出發時間都會自動填好。',
  // change-transit-route
  'help.guide.change-transit-route.title': '開啟並更改已規劃的路線',
  'help.guide.change-transit-route.goal': '逐段查看轉乘路線、為它重新命名，或重新搜尋路線。',
  'help.guide.change-transit-route.step.1':
    '在「交通」分頁中，已規劃的轉乘路線是頂部標題區為藍色的卡片，依時間順序與已確認的交通排在一起。如果在「檢視選項」下開啟了「大眾運輸獨立成區」，則會改為顯示在「自動大眾運輸」下。點選卡片，轉乘路線會以預訂的形式開啟。',
  'help.guide.change-transit-route.step.2':
    '頂部的方塊顯示出發和抵達及其站點，以及「時長」「轉乘次數」和「步行」。下方的「行程」逐段列出轉乘路線，包括時間、月台和路線之間的步行。',
  'help.guide.change-transit-route.step.3':
    '點選預訂底部的「變更路線」，會重新開啟搜尋，並且已填好這條路線的兩個端點和日期。',
  'help.guide.change-transit-route.step.4':
    '點選「搜尋」，開啟另一條路線並點選「新增到當天」，就會取代舊的路線。預訂底部最右邊的「編輯」則會開啟一般的交通表單，可以在那裡修改「預訂碼」、旅客、備註和檔案。',
  'help.guide.change-transit-route.result': '這趟行程會改用新的路線，它在「交通」分頁中的卡片也會顯示新的路線和時間。',
  'help.guide.change-transit-route.tip.1':
    '點選預訂標題列中的標題，可以重新命名這條路線，而不改變路線本身。路線的備註要在「編輯」開啟的交通表單中填寫。',
  'help.guide.change-transit-route.tip.2': '預訂底部的垃圾桶會在確認後刪除這條轉乘路線；那一天的停留點會保留。',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': '變更某一段的移動方式',
  'help.guide.leg-travel-mode.goal': '把開車行程日中的某一段改成步行，或改用大眾運輸搜尋規劃那一段。',
  'help.guide.leg-travel-mode.step.1':
    '停留點之間的連接線，要在當天的路線開啟後才會出現。點選當天的標題展開，再點選停留點下方列中的「路線」。',
  'help.guide.leg-travel-mode.step.2':
    '每個連接線都會顯示該段的行車時間和距離，並附上規劃時所用交通方式的圖示：汽車代表開車，腳代表步行，自行車代表騎單車。',
  'help.guide.leg-travel-mode.step.3':
    '點擊連接線。選單中有「開車」、「步行」、「騎單車」、僅適用於這一段的「大眾運輸」，以及「使用當日預設」。',
  'help.guide.leg-travel-mode.step.4': '選擇「步行」。只有這一段會改變，當天其餘路段維持原本的交通方式。',
  'help.guide.leg-travel-mode.result': '這一段會顯示步行圖示和步行時間，當天的其他路段則維持當天的交通方式。',
  'help.guide.leg-travel-mode.tip.1':
    '交通方式屬於該段，而不是整天：整天的「開車」、「步行」和「騎單車」按鈕不會覆寫你手動設定的路段。「使用當日預設」可讓該段重新跟隨這些按鈕。',
  'help.guide.leg-travel-mode.tip.2': '同一個選單中的「大眾運輸」會針對這一段開啟路線搜尋，兩端和出發時間都已填好。',
  'help.guide.leg-travel-mode.tip.3':
    '時間是由公開的路線服務，依實際的道路和步道計算而來。如果路線服務算不出某一段，該段會維持直線，也不會顯示時間。',
  // edit-transport
  'help.guide.edit-transport.title': '變更或刪除交通',
  'help.guide.edit-transport.goal': '修正時間、月台或預訂碼，或把這段交通從旅行中移除。',
  'help.guide.edit-transport.step.1':
    '在每日計畫中，交通是停靠點之間的一列，依類型著色。點擊它就會開啟其預訂：狀態、類型、日期和「預訂碼」（附複製按鈕）以標籤形式顯示在標題中，下方則是出發和到達時間及其機場或車站。',
  'help.guide.edit-transport.step.2':
    '點選預訂底部的「編輯」，會開啟當初建立它的表單，標題列的標題上方會顯示「編輯交通」。所有內容都能在這裡修改：標題、狀態和類型標籤、路線、日期和時間，以及「預訂碼」。',
  'help.guide.edit-transport.step.3':
    '航班的路線是一串機場，火車是一串車站，郵輪是一串港口。「新增中轉站」（郵輪上為「新增港口」）會在中間再加一個，每一段都保留自己的時間和自己的航班或車次編號。',
  'help.guide.edit-transport.step.4':
    '點選「更新」。要完全移除這筆交通，可以使用同一列左邊的垃圾桶、預訂底部的垃圾桶，或「交通」分頁中該卡片上的垃圾桶，然後確認。',
  'help.guide.edit-transport.result':
    '變更會顯示在這筆交通出現的每個地方：「交通」分頁、它所在的那一天，以及地圖上的路線。',
  'help.guide.edit-transport.tip.1':
    '同一個表單可以從兩個地方開啟：從每日計畫的某一列開啟預訂，再點選其中的「編輯」，或是點選「交通」分頁中卡片上的鉛筆。已規劃的大眾運輸路線也會以預訂的形式開啟，其中的「變更路線」會重新開啟搜尋，「編輯」則會開啟這個表單。',
  'help.guide.edit-transport.tip.2': '要把交通移到另一天，不需要開啟表單：直接把它的列從一張日期卡片拖到另一張即可。',
  // transport-on-map
  'help.guide.transport-on-map.title': '在地圖上顯示交通',
  'help.guide.transport-on-map.goal': '查看航班、開車或轉乘路線實際走的路線。',
  'help.guide.transport-on-map.step.1':
    '如果某筆交通的兩端都已設定，它在每日計畫中的那一列會出現一個小小的路線圖示。點選它，提示文字就會變成「隱藏預訂路線」。',
  'help.guide.transport-on-map.step.2': '路線會畫在地圖上，兩端各有一個膠囊形標記，上面是該交通工具的圖示。',
  'help.guide.transport-on-map.step.3':
    '點選端點標記，預訂會直接在地圖上方開啟。標題列顯示狀態、類型、日期和「預訂碼」，下方是時間與機場或車站、航空公司和航班編號。點選標題列的「關閉」即可收起。',
  'help.guide.transport-on-map.step.4':
    '天數上方工具列中的路線圖示可以一次套用到整趟旅行：「顯示所有預訂路線」，以及用來再次隱藏的「隱藏所有預訂路線」。',
  'help.guide.transport-on-map.step.5':
    '已規劃的大眾運輸路線沒有自己的路線圖示，而是由當天的「路線」開關畫出來。所以只要那一天的路線還開著，「隱藏所有預訂路線」就不會把它隱藏。',
  'help.guide.transport-on-map.result': '路線會連同兩端的標記顯示在地圖上，並會一直保留，直到你再次關閉。',
  'help.guide.transport-on-map.tip.1':
    '航班、郵輪和渡輪會畫成曲線。汽車、公車、計程車和自行車則沿著真實道路。火車或已規劃的轉乘路線，會經過它停靠的各個車站。',
  'help.guide.transport-on-map.tip.2':
    '已確認的預訂是實線，待確認的是虛線。「預訂路線標籤」設定可以讓端點標記顯示機場代碼或車站名稱。',
  'help.guide.transport-on-map.tip.3':
    '「顯示所有預訂路線」不是在原有顯示的路線上追加，而是重新套用：它會取代你用單一圖示所做的設定。按下之後，所有路線不是全部顯示，就是全部隱藏。',
  // airtrail-import
  'help.guide.airtrail-import.title': '從 AirTrail 匯入航班',
  'help.guide.airtrail-import.goal': '一次把你已記錄在 AirTrail 的航班匯入旅行，之後也會隨 AirTrail 保持更新。',
  'help.guide.airtrail-import.step.1':
    'AirTrail 擴充套件開啟，且你已在「設定」的「整合」下連接了實例時，「交通」分頁的工具列在「交通」前面會多出一個飛機圖示的「從 AirTrail 匯入」。點選它。',
  'help.guide.airtrail-import.step.2':
    '「從 AirTrail 匯入」會把你帳號中的航班分成兩組。「行程期間」是日期落在旅行內的航班，已預先勾選；「其他航班」是其餘的航班，未勾選。已經在旅行中的航班會呈灰色，並標示為「已匯入」。',
  'help.guide.airtrail-import.step.3':
    '每一列都是核取方塊，附有航空公司和航班號、兩個機場和日期。點選一列即可納入或排除該航班。「其他航班」下的航班，只有在你勾選時才會匯入。',
  'help.guide.airtrail-import.step.4':
    '轉機航班會歸為一組：每一段都是從上一段降落的機場出發，且在同一天內。下方的核取方塊「匯入為一個航班（在該機場轉機）」預設已勾選。如果要當成一筆含轉機的預訂，就保持勾選；如果要把各航段匯入為獨立的航班，就取消勾選。',
  'help.guide.airtrail-import.step.5':
    '點選右下角的按鈕，上面會顯示已勾選的航班數量，例如「匯入 2」。完成後的訊息會告訴你匯入了幾個航班。',
  'help.guide.airtrail-import.step.6':
    '這些航班會以卡片形式出現在「已確認」下，每張卡片的標題旁邊都有藍色的 AirTrail 標籤，也會出現在航班當天的列中。轉機航班只有一張卡片，航線會經過轉機地點。',
  'help.guide.airtrail-import.result':
    '來自 AirTrail 的航班會成為「交通」分頁上的卡片，以及各自日期上的列，每一筆都帶有 AirTrail 標籤，標明資料來源。',
  'help.guide.airtrail-import.tip.1':
    '旅行中已有相同航班號碼和日期的航班時會被略過，並提示略過了幾趟。天數上方工具列的復原箭頭，可以復原整次匯入。',
  'help.guide.airtrail-import.tip.2':
    'AirTrail 仍是資料的主要來源。TREK 會在你開啟旅行時，以及每隔幾分鐘在背景讀取它的變更。在 AirTrail 中刪除的航班，在 TREK 中仍會保留卡片，標籤會變成「未同步」。只有在「整合」下開啟「將變更寫回 AirTrail」時，你在 TREK 中的修改才會傳回 AirTrail。',
  'help.guide.airtrail-import.tip.3':
    '合併的轉乘行程不是單一的 AirTrail 航班，無法同步，所以只能一次性匯入：它會保留藍色標籤，將滑鼠移到標籤上時會有說明。你手動為已同步的航班加入中途停靠點時，也會發生同樣的情況。',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': '公路旅行',
  'help.ctx.trip-roadtrip.summary':
    '把計畫呈現成一趟行車：同樣的天數、同樣的地點，串成一個個停靠點，中間是行車路段，顯示在左欄的導軌和地圖上。它會顯示距離和行車時間、需要加油的位置，以及沿途有什麼。',
  'help.ctx.trip-roadtrip.bullet.1':
    '左欄頂部的「天」和「公路旅行」可在每日行程與行駛路線之間切換。不會複製任何內容，也不會改動任何內容：「天」會完整顯示原本的行程。',
  'help.ctx.trip-roadtrip.bullet.2':
    '側欄頂部是整趟旅行的統計：「距離」、「駕駛時間」和「停留點」。下方每個有行車的日子各有一張卡片：方塊上顯示當天的編號和日期，接著是代表公里數和駕駛時間的標籤、當天有幾個停靠點、途經的地方，以及「軌跡」徽章。你預訂的航班、火車或渡輪，會以獨立的卡片出現在順序中。',
  'help.ctx.trip-roadtrip.bullet.3':
    '有編號的停靠點是當天特地要去的地點。途中的停靠點（例如加油、充電或休息區）會顯示其種類的圖示而不是編號，也不會被計入。點擊編號可更改它是哪一種，點擊「停留點」徽章可設定要停留多久，拖曳停靠點則可在當天內移動，或移到另一天。',
  'help.ctx.trip-roadtrip.bullet.4':
    '兩個停留點之間，行駛條會顯示該路段的距離和時間。點選它可開啟「這一段的走法」，也可以點選地圖上的路線，讓該路段改為經過某個途經點。',
  'help.ctx.trip-roadtrip.bullet.5':
    '右欄會變成「路線途中」：在一行中選擇要找什麼和哪一天，走廊有多寬，然後按「搜尋」。結果上的加號「新增」會把它放在行駛路線上真正經過的位置，旅館上的床鋪圖示則會預訂當晚住宿。「手動」可加入搜尋沒找到的項目，標題旁的三個點可匯入 Google 地圖路線。',
  'help.ctx.trip-roadtrip.bullet.6':
    '它下方的「駕駛設定」包含限制、車輛及其續航里程、每日行車時間、要避開的項目、線條的繪製方式，以及目前的警告是否顯示在地圖上。這些屬於旅行本身，所以每個人都用同一輛車來規劃。',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': '把旅行當作一趟行駛來查看',
  'help.guide.roadtrip-mode.goal': '把計畫切換為公路旅行模式，並看懂導軌顯示的內容。',
  'help.guide.roadtrip-mode.step.1':
    '在左欄頂端的「天」與「公路旅行」切換開關中，點選「公路旅行」。每日計畫會換成行車內容，地圖則會顯示每一天已有的路線。',
  'help.guide.roadtrip-mode.step.2':
    '側欄頂部的卡片統計整趟旅行：「距離」、「駕駛時間」和「停留點」。當天數在它下方捲動時，它會停留在原位。',
  'help.guide.roadtrip-mode.step.3':
    '它下方是每個有行車的日子各一張卡片；沒有行車的日子會被略過。卡片標題顯示當天的編號，下方是日期，然後是行車距離與時間的標籤，以及當天有多少個停靠點的標籤。',
  'help.guide.roadtrip-mode.step.4':
    '在卡片內，一天會以順序呈現：每個地點是一個有編號的停靠點，每兩個停靠點之間是一段行車，右邊緣是抵達時間。你預訂的航班、火車或渡輪，會以獨立的卡片出現在這個順序中。',
  'help.guide.roadtrip-mode.step.5':
    '點擊某一天的標題即可收合，標題末端的箭頭也會跟著轉動。收合的天數在地圖上也會一併隱藏。再點一次標題就會重新顯示。',
  'help.guide.roadtrip-mode.result':
    '左欄會顯示行車內容，地圖則顯示行車的每一天。切換回「天」就能回到原本的計畫，計畫不會有任何變動。',
  'help.guide.roadtrip-mode.tip.1':
    '這個選擇是依旅行儲存在你的帳號上，所以重新載入、換瀏覽器或換裝置後，旅行都會再次以公路旅行檢視開啟。',
  'help.guide.roadtrip-mode.tip.2':
    '只有管理員在管理面板的「擴充套件」下開啟「公路旅行」擴充套件後，才會顯示這個切換。',
  'help.guide.roadtrip-mode.tip.3': '手機上沒有切換開關：擴充套件會在「計畫」旁加上自己的「公路旅行」分頁。',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': '途中的停靠點，以及停留多久',
  'help.guide.roadtrip-stops.goal': '把行車途中的地點設為沿途停靠點，並設定每個停靠點要花多久。',
  'help.guide.roadtrip-stops.step.1':
    '點選導軌中停留點前面的編號。它的標籤是「設為途中停靠」，點開後，下方會出現一排彩色圓片，代表各種停靠類型。',
  'help.guide.roadtrip-stops.step.2':
    '選擇一種類型。把游標移到圓片上會顯示名稱：「住宿」、「燃油」、「充電」、「休息站」、「露營地」、「餐飲」或「景點」。編號會換成該類型的圖示，下方的停靠點也會重新編號。',
  'help.guide.roadtrip-stops.step.3': '途中停靠不是目的地，所以當天標題的停靠點數會少算一個。',
  'help.guide.roadtrip-stops.step.4':
    '再次點選該圖示「變更停靠類型」，然後選擇「恢復為目的地」，停留點就會重新取得編號。',
  'help.guide.roadtrip-stops.step.5':
    '每個停靠點都有「停留點」徽章，尚未規劃時顯示為加號。點擊它即可開啟「在此停留時間」。',
  'help.guide.roadtrip-stops.step.6':
    '用滑桿、減號和加號按鈕，或其中一個預設值來設定時間長度。「出發」會跟著調整，「抵達」則維持在行車到達的時間。然後點選「儲存」。',
  'help.guide.roadtrip-stops.result':
    '你修改的停靠點，其「停留」標記會顯示新的時間長度，之後每一個抵達時間也會跟著調整。如果你把停靠點改成其他類型，之後又改回來，它會恢復成有編號的目的地。',
  'help.guide.roadtrip-stops.tip.1': '停留時間屬於地點，而不是某一次造訪：同一個地點排在兩天，兩天的停留時間會相同。',
  'help.guide.roadtrip-stops.tip.2':
    '途中停靠點也會顯示在「天」之下。若在「駕駛設定」的「服務停靠點」中關閉「也顯示於每日行程」，這些停靠點就只會留在「公路旅行」中。',
  'help.guide.roadtrip-stops.tip.3': '同一個對話框中的「不停留」可以再次移除停留時間。',
  'help.guide.roadtrip-stops.tip.4':
    '點選途中停靠點或已預訂的住宿夜，就會在地圖上方開啟它的卡片。開啟「公路旅行」後，卡片上的「編輯」不會開啟地點表單，而是開啟搜尋所用的精簡對話框；該對話框中的「更多詳情」才會開啟完整表單。',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': '沿途尋找加油站、餐廳和住處',
  'help.guide.roadtrip-corridor.goal': '沿著你實際行駛的道路搜尋，並把找到的地點加到正確的路段。',
  'help.guide.roadtrip-corridor.step.1':
    '在「尋找」下開啟清單，勾選你需要的項目。「燃油」「充電」「休息站」「露營地」「住宿」「餐飲」和「景點」可以組合選擇：清單會保持開啟，讓你繼續選下一項，欄位上則會顯示每種類型的圖示。',
  'help.guide.roadtrip-corridor.step.2':
    '在同一行末端的下拉選單中選擇日期。選單只提供導軌上有卡片的日期，而「搜尋」要等你所選那一天的路線計算完成後才會開始。',
  'help.guide.roadtrip-corridor.step.3':
    '在「範圍內」選擇要搜尋道路兩側多遠的範圍：2 km、5 km 或 10 km，然後點選「搜尋」。',
  'help.guide.roadtrip-corridor.step.4':
    '結果會依種類分組，並依你經過的順序排列。每一項都會說明它離路線多遠，以及位於當天行程的第幾個位置。',
  'help.guide.roadtrip-corridor.step.5':
    '點擊結果上的加號「新增」。「新增為停靠點」會說明它落在哪一天、哪個位置，並詢問「停靠類型」和「在此停留時間」；充電站還會顯示「可用狀態與費率」。「新增」會把它放到行車路線上，「更多詳情」則改為開啟完整的地點表單。',
  'help.guide.roadtrip-corridor.result':
    '你新增的停靠點會依經過的位置顯示在路線上，並帶有該類型的圖示。當天的路線會重新規劃，經過這個停靠點，同時清空結果清單：要找下一個停靠點，請再搜尋一次。',
  'help.guide.roadtrip-corridor.tip.1': '按下「搜尋」之前不會進行任何搜尋：一次搜尋會向共用服務發出許多請求。',
  'help.guide.roadtrip-corridor.tip.2':
    '「依名稱篩選」不用重新搜尋就能篩選結果，「清除結果」則會清空清單並移除圖釘。點選結果即可在地圖上顯示。',
  'help.guide.roadtrip-corridor.tip.3':
    '你也可以把地圖上的結果拖到路線上。當你同一條路走兩次時，就能自己選擇路段。「搜尋」旁邊的「手動」可以依名稱查詢，加入搜尋沒找到的地點。',
  // roadtrip-via
  'help.guide.roadtrip-via.title': '讓某一段路線經過途經點',
  'help.guide.roadtrip-via.goal': '讓某一段路線走你想走的道路，又不必為它加停靠點。',
  'help.guide.roadtrip-via.step.1':
    '先在地圖上顯示你要調整的那一段：點選導軌中的一個停留點，再關閉在地圖上方開啟的卡片。',
  'help.guide.roadtrip-via.step.2': '點選畫出的路線。你點的那一段會加入一個途經點，並重新計算經過該點的路線。',
  'help.guide.roadtrip-via.step.3':
    '導軌會跟著更新：當天標題顯示新的距離和行車時間，途經點之後的每個抵達時間也會隨之改變。',
  'help.guide.roadtrip-via.step.4':
    '將滑鼠移到控制點上，就會看到它的功能：「拖曳可改變路線，右鍵刪除」。把它拖到別的地方，該路段就會改為經過新的點重新繪製。',
  'help.guide.roadtrip-via.step.5': '在控制點上按右鍵即可移除，該路段會重新走最直接的路線。',
  'help.guide.roadtrip-via.result': '該路段會沿著你選的道路行駛，當天的距離、行駛時間和抵達時間也會重新計算。',
  'help.guide.roadtrip-via.tip.1':
    '途經點不是停靠點：它沒有編號、不含停留時間，也沒有抵達時間，而且不會計入當天的停靠點數。',
  'help.guide.roadtrip-via.tip.2':
    '控制點要在縮放層級 9 以上才會顯示，所以地圖縮小到顯示整趟旅行時，只看得到線條，看不到控制點。',
  'help.guide.roadtrip-via.tip.3':
    '如果點選的位置離任何已畫出的路段超過兩公里，點選會被忽略；點在航班、火車或渡輪上也一樣。',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': '嘗試換一條路線開某一段',
  'help.guide.roadtrip-alternatives.goal': '查看路線引擎針對行程某一段提供的其他路線，並從中選擇一條。',
  'help.guide.roadtrip-alternatives.step.1':
    '點選側欄中的行駛條，也就是兩個停留點之間顯示該路段距離和時間的那一列。它的標籤是「其他路線」。',
  'help.guide.roadtrip-alternatives.step.2':
    '「這一段的走法」會在地圖上方開啟，每條道路一個項目，並附上長度。地圖會畫出每條道路和它的行駛時間：目前使用的道路是飽和的藍色，其他則是較淺的藍色。',
  'help.guide.roadtrip-alternatives.step.3':
    '把游標移到某一項上，就會標亮那條道路。「目前」是你正在使用的道路，「最快」是最快的那條；其他項目會顯示慢了多少，或避開了哪種道路類型。',
  'help.guide.roadtrip-alternatives.step.4': '點選一個項目就改走那條路線，點選「關閉」則維持目前的路線。',
  'help.guide.roadtrip-alternatives.result': '這一段現在會走你選的道路，側欄中的距離，以及之後的抵達時間也會跟著改變。',
  'help.guide.roadtrip-alternatives.tip.1':
    '選擇另一條道路時，TREK 會先用公路旅行的路線規劃器檢查，再以盡可能少的途經點，把這一段固定在那條路上，並取代這一段原有的途經點。路線規劃器無法走的道路不會被儲存。選回路線規劃器自己的道路，就會再次移除這些途經點。',
  'help.guide.roadtrip-alternatives.tip.2':
    '「不走高速」「免收費」和「不搭渡輪」來自另一個有自己速度模型的引擎，所以它們的時間無法和其他路線比較。',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': '設定車輛與行駛限制',
  'help.guide.roadtrip-limits.goal': '告訴 TREK 你開的是什麼車，以及你希望不休息最多開多遠。',
  'help.guide.roadtrip-limits.step.1': '「駕駛設定」位於右欄的搜尋下方。上面的徽章會顯示已設定的內容，點選即可開啟。',
  'help.guide.roadtrip-limits.step.2':
    '在「駕駛」下，「單次最長駕駛」和「每天駕駛」的單位是分鐘。欄位留空代表關閉，不會標示任何提醒。',
  'help.guide.roadtrip-limits.step.3':
    '在「車輛」下，選擇你開的車型。「燃油」只在加油停靠點補給，「電動」只在充電停靠點補給，「兩者」則兩種停靠點都可以。',
  'help.guide.roadtrip-limits.step.4':
    '自行輸入「單箱續航」或「每次充電續航」。也可以在「加到」下開啟「依車輛資料推算」：它會根據「油箱容量」和「能耗」，或「電池容量」、「能耗」和「電池衰減」計算出續航里程。',
  'help.guide.roadtrip-limits.step.5':
    '左欄的「盡量避開」是偏好而不是禁令：沒有其他路可走的日子仍會走那條路，並在標題中說明。',
  'help.guide.roadtrip-limits.step.6':
    '點擊「關閉」。卡片的徽章會顯示已設定的內容，側欄會標出每個超出限制的路段和每一天。',
  'help.guide.roadtrip-limits.result': '卡片上的徽章會顯示已設定的內容，每個超過上限的路段和日期，在導軌中都會有徽章。',
  'help.guide.roadtrip-limits.tip.1': '這些設定屬於這趟旅行，所以同行的每個人都會以同一輛車、同樣的限制來規劃。',
  'help.guide.roadtrip-limits.tip.2':
    '「加到」說明停靠點加到多滿，因為沒有人會在路上充電到 100%。加油或充電停靠點可以用其所在列上的電池徽章覆寫它。',
  'help.guide.roadtrip-limits.tip.3':
    '在「路線線條」下，「連接各天」也會規劃從前一天最後一個停留點到隔天第一個停留點的路線。「每天從住宿地點出發，並在住宿地點結束」會讓每天從那幾晚預訂的住宿出發，並在住宿結束。「每天一種顏色」則以不同顏色顯示每一天。',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': '設定行駛日的開始和結束時間',
  'help.guide.roadtrip-day-window.goal': '在你指定的時間停止行車，並設定當天的終點。',
  'help.guide.roadtrip-day-window.step.1': '在右欄中開啟「駕駛設定」，並找到對話方塊左欄中的「每日出行時間」。',
  'help.guide.roadtrip-day-window.step.2':
    '設定「一天開始時間」。只設定這一項不會有任何作用：如下方的說明所述，兩個時間都需要設定。',
  'help.guide.roadtrip-day-window.step.3':
    '設定「一天結束時間」。行車會在該時間停止，並在隔天早上繼續，側欄中會顯示為「當天行程結束」和「繼續行程」兩列。',
  'help.guide.roadtrip-day-window.step.4':
    '在「一天的結束地點」下，選擇「路線途中」表示在結束時間於路上暫停，或選擇「最後一個地點」表示在下一段行車會超過結束時間之前，就在最後一個地點停下。',
  'help.guide.roadtrip-day-window.step.5': '點擊「關閉」。「駕駛設定」卡片會以徽章顯示這兩個時間。',
  'help.guide.roadtrip-day-window.result':
    '行駛路程會依你設定的長度切分成行駛日，放不下的部分會接在最後一天之後的推算日繼續。你原有的日期和地點不會改變。',
  'help.guide.roadtrip-day-window.tip.1':
    '如果你清除其中任何一個時間，這個功能就會再次關閉。你自己在停留點上設定的時間一律優先。',
  'help.guide.roadtrip-day-window.tip.2':
    '設定每日行駛時間後，各天一定會相連：從某一天最後一個停靠點到隔天第一個停靠點的行駛，也會規劃路線並計算在內。',
  'help.guide.roadtrip-day-window.tip.3':
    '每天的終點在地圖上也是一個標記，是一個帶有天數的月亮。沿著路線拖曳它，或拖到某個地點上，就能讓當天結束在別的地方。對它按右鍵可恢復自動終點。這個對話方塊中的「恢復自動每日終點」則會還原所有調整。若要讓某天結束在某個停靠點，請點擊該停靠點，並在它的卡片中開啟「在此結束當天行程」。',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': '在油箱見底前先加油',
  'help.guide.roadtrip-refuel.goal': '在車輛還開得到的路段上找加油的地方，並加入行程。',
  'help.guide.roadtrip-refuel.step.1':
    '設定續航里程後，側欄會在燃料或電量耗盡的路段上顯示一條色帶：「此處將耗盡油量」，電動車則是「電量將在此耗盡」。下方會顯示它位於該路段的哪個位置。',
  'help.guide.roadtrip-refuel.step.2':
    '色帶上的燈泡圖示就是按鈕：「尋找加油站」，電動車則是「尋找充電站」。它會沿著該點之前的道路搜尋，搜尋時會顯示「正在沿路線尋找…」。',
  'help.guide.roadtrip-refuel.step.3': '最多會顯示三個加油站，每個都會標示與路線的距離，以及到那裡時還剩多少續航里程。',
  'help.guide.roadtrip-refuel.step.4':
    '候選項目上的加號會把它新增為加油停靠點。「新增為停靠點」開啟時，類型和時間已事先填好，按「新增」會把它放到路段中路線實際經過它的位置。',
  'help.guide.roadtrip-refuel.result':
    '停靠點會以自己的圖示出現在正確的路段上，續航里程也會從該停靠點重新計算。標示條會移到油箱現在用完的位置，如果不需再停靠就能到達終點，標示條則會消失。',
  'help.guide.roadtrip-refuel.tip.1':
    '續航里程會從上一次加油或充電的停靠點開始計算，且可跨天。哪些停靠點算數，取決於你的車型：「燃油」只算加油站，「電動」只算充電站。',
  'help.guide.roadtrip-refuel.tip.2':
    '搜尋只會看油量耗盡點之前的路段，並保留一點餘裕，繞路的距離也會算兩次，所以它提供的每個地點都確實到得了。',
  'help.guide.roadtrip-refuel.tip.3':
    '如果沒有結果，可以再搜尋一次：燈號會變成「重試」，因為地點搜尋是共用的服務，有時會逾時。',
  // roadtrip-track
  'help.guide.roadtrip-track.title': '讓某一天沿著匯入的軌跡行駛',
  'help.guide.roadtrip-track.goal': '把你匯入的 GPX 或 KML 軌跡中的風景路線，用在某一天的行駛上。',
  'help.guide.roadtrip-track.step.1': '點選某一天標題中的「軌跡」標記，對話框會針對那一天開啟。',
  'help.guide.roadtrip-track.step.2':
    '選擇一條軌跡。每條軌跡都會顯示長度，以及它是否沿著這一天的路線，或離路線多遠。最近的軌跡排在最前面。',
  'help.guide.roadtrip-track.step.3':
    '點選「沿此軌跡行駛」。TREK 會在行車路線與軌跡相距最遠的地方加入途經點，並重新計算路線，這個過程會重複數次。',
  'help.guide.roadtrip-track.step.4':
    '對話方塊會說明放置了多少個途經點、行車現在貼近軌跡到什麼程度，或行車本來就已經沿著軌跡行駛。左下角的「移除途經點」會將它們移除，並把當天交還給路線規劃器。關閉對話方塊會保留軌跡。',
  'help.guide.roadtrip-track.result':
    '當天的行車路線會沿著軌跡走，而不是路線規劃器原本會選的道路。把游標移到「軌跡」徽章上，就能看到軌跡的名稱。如果途經點讓行車路線保持在軌跡上，徽章也會亮起。',
  'help.guide.roadtrip-track.tip.1':
    '對話方塊會列出旅行中帶有路徑的地點：在「天數」下方的地點欄用「匯入檔案」匯入的 GPX 或 KML，GPX 需勾選「路線」或「軌跡（含路徑幾何）」，KML 需勾選「路徑（LineStrings）」。只有在遊程擴充套件關閉時才提供「匯入檔案」；遊程開啟時，GPX 會變成遊程，而這個對話方塊不會列出它。旅行中沒有軌跡之前，沒有任何一天會帶有該徽章。',
  'help.guide.roadtrip-track.tip.2':
    '沿著軌跡行駛會取代當天各路段原有的途經點，所以如果要手動調整某一段，請在套用軌跡之後再做，不要在之前做。',
  'help.guide.dateless-trip.step.1': '點擊「新建旅行」，為旅行取個名稱。',
  'help.guide.edit-trip.tip.2': '在這裡新增或移除的旅伴會立即生效，不需要按「更新」。',
  'help.guide.trip-reminder.result': '提醒會在旅行開始前你選定的天數送達，並透過你接收通知的管道傳送。',
  'help.guide.upcoming-reservations.step.1':
    '在右欄找到「即將到來的預訂」。它會依時間先後列出你所有旅行中接下來的六筆預訂，附日期、時間和類型。',
  'help.guide.half-company-holiday.step.1': '將工具列切換到「公司假日」。',
  'help.guide.edit-holiday-calendar.result': '表格和圖例會隨每次變更立即更新。',
  'help.guide.person-color.result': '這個人記錄的每一天都會以新顏色顯示。',
  'help.guide.answer-fusion-request.step.1': '有人邀請你之後，開啟 Vacay。「合併請求」對話方塊會自動開啟。',
  'help.guide.log-for-partner.step.1': '在「人數」卡片中，點擊該人的名字。出現勾號表示已選取。',
  'help.guide.dissolve-fusion.step.1': '開啟「設定」。',
  'help.guide.country-places.step.2': '點擊卡片中的「地點」徽章，就是有圖釘的那個。',
  'help.guide.search-place.tip.2': '如果該地區已被標記，彈出視窗會詢問是否改為移除。',
  'help.guide.tour-activity-stats.step.4':
    '右側的徽章說明這些總計依據什麼：「計劃於」表示與你的旅行規劃一起計算的遊程，「記錄」表示已連結實際軌跡的遊程。「即將進行」、「未排入日期」和「無日期」計算的是尚未計入的遊程。點擊 i 可查看規則說明。',
  'help.guide.move-to-list.step.2':
    '點擊「複製到清單」可讓地點在這裡也保留一份，點擊「移動到清單」則會把它們從這個清單中移走。',
  'help.guide.accept-list-invite.title': '接受清單邀請',
  'help.guide.tour-collection-add-to-trip.step.3':
    '在「路點」下，選擇包含路點的方塊可依序帶入起點、停靠點和終點，選擇「僅線路」則只保留已儲存的線路。',
  'help.guide.tour-collection-manage.step.1':
    '開啟一個清單。每條保存的遊程會顯示其難度、類型、儲存來源的旅行、距離和爬升，以及保存的路點數量。將游標移到旅行名稱上可看到是誰保存的。',
  'help.guide.entry-draft.step.1': '在編輯器中，開啟右欄的「草稿」。',
  'help.guide.journey-map-layers.step.3':
    '點擊地圖上的空心圖釘或小圓點。卡片會說明它是什麼：計劃的地點及其所在的日子，或是帶有「開啟日記」的停留點，點擊後會帶你到它所屬的當日記述。',
  'help.guide.journey-keep-route.step.3': '點擊「保存路線」。',
  'help.guide.journey-day-stays.step.3': '在你不想要的停留點上點擊「我沒去過這個地方」。它就會從列表中消失。',
  'help.guide.journey-take-over-day.step.3':
    '想讓整天只有一則條目？將「條目」切換為「當日記述」：一則條目會列出每個選取的停留點及其時間。',
  'help.guide.journey-auto-prepare.step.2': '在「已記錄的日子」下，開啟「自動準備記錄的日子」。',
  'help.guide.photo-location.step.2': '在「照片」下，開啟「依照片定位條目」。',
  'help.guide.link-trip.tip.3': '要在尚未關聯的旅行日期上寫條目嗎？編輯器會直接提供「關聯旅行」。',
  'help.ctx.settings-plugins.summary':
    '管理員安裝的外掛的個人設定：每個外掛向你要求的金鑰和偏好，以及外掛以你的名義執行的操作記錄。只有在有外掛啟用時才會出現這個分頁。',
  'help.ctx.settings-about.bullet.3': 'Ko-fi、Buy Me a Coffee 和 Discord 是你支持 TREK 或認識幕後團隊的地方。',
  'help.guide.language-region.step.3':
    '設定「顯示貨幣」，或保持「行程貨幣」，讓每趟旅行以自己的貨幣顯示。然後選擇「溫度單位」、「距離單位」、「時間格式」和「每週開始於」哪一天。',
  'help.guide.travel-map-prefs.step.3':
    '「在地圖上探索地點」會顯示用來尋找附近地點的分類標籤。「模糊預訂程式碼」會隱藏確認編號，直到你將游標移上去或點按。「從住宿地點最佳化路線」會讓每天的行程從旅館出發並回到旅館。',
  'help.guide.web-push-device.step.2': '在頂部的「通知」卡片中，「推播」欄決定哪些事件會傳送到你的裝置。',
  'help.guide.connect-airtrail.goal': '讓 TREK 匯入並同步你自己的 AirTrail 中的航班。',
  'help.guide.connect-dawarich.goal': '讓 TREK 從你自己的 Dawarich 讀取你實際去過的地方。',
  'help.guide.tour-connect-wanderer.goal': '讓 TREK 讀取你自己的 wanderer 中的路線，這樣你就能把它們匯入為遊程。',
  'help.guide.tour-wanderer-watch.title': '在 wanderer 路線變更時收到通知',
  'help.guide.plugin-settings.tip.2': '「通知」下的外掛管道會透過「前往設定」帶你來到這裡。',
  'help.guide.default-user-settings.result': '新帳戶，以及所有從未更改這些設定的人，都會看到你的選擇。',
  'help.guide.own-routing-engine.goal':
    '讓每日行程和公路旅行改用你自己架設的 OSRM 或 Valhalla 伺服器規劃路線，而不是公共伺服器。',
  'help.guide.admin-passkeys.tip.1':
    '如果目前還無法判斷出網域，會顯示警告，且在你設定 APP_URL 或 Relying Party ID 之前，Passkey 會保持隱藏。',
  'help.guide.rotate-jwt-secret.step.1': '在「設定」分頁底部的「危險區域」下，點擊「輪替 JWT 密鑰」旁的「輪換」。',
  'help.guide.storage-backends.tip.3': '照片快取可以重新取得，所以替它們建立鏡像通常只是浪費空間。',
  'help.guide.admin-channels.step.3':
    '在下方的「通知」卡片中，依事件選擇由哪些管道傳送：「有新版本可用」、「儲存複本故障」和「划槳區域申請」。每個開關都會立即儲存。',
  'help.guide.notification-defaults.tip.1': '「關閉」是預設值，每位使用者仍可自行開啟；「封鎖」則會對所有人關閉。',
  'help.ctx.notifications.bullet.4':
    '每則通知時間旁邊的「標為已讀」（雙勾號）和「刪除」（垃圾桶）只作用於那一則。頂部的「全部標為已讀」和「全部刪除」則作用於整個列表。',
  'help.guide.read-notifications.tip.2': '沒有按鈕的通知只是消息。在面板中閱讀，並在那裡標為已讀即可。',
  'help.guide.filter-notifications.result': '列表只顯示尚未閱讀的內容，最新的在前。',
  'help.guide.delete-notifications.title': '刪除通知',
  'help.guide.notification-settings.goal':
    '決定哪些事件顯示在鈴鐺中，哪些還會透過電子郵件、Webhook、ntfy 或推播通知你。',
  'help.guide.public-link.step.4': '點擊「建立連結」，再點擊「複製」，然後傳送出去。',
  'help.guide.link-journal.step.2': '點擊「連結日誌」，並從「選擇日誌」中挑選你的其中一本日誌。',
  'help.guide.dawarich-stays.title': '將記錄的停留點變成地點',
  'help.guide.dawarich-stays.tip.2': '刪除由停留點建立的地點後，該停留點會以「等待中」的狀態回到列表。',
  'help.guide.leave-stop-off-route.goal':
    '讓某個停靠點保留在當天，但路線不經過那裡，適合步行經過或只想放在地圖上的地點。',
  'help.guide.day-route.tip.4': '想把某個停靠點放在當天但不在路線上：使用它選單中的「從路線中排除」。',
  'help.guide.move-booking-day.step.2':
    '將該列拖到另一天的卡片標題上。單日的預訂會整筆移過去；跨多日的預訂，「出發日期」列會移動起始那天，「到達日期」列則移動結束那天。',
  'help.guide.place-image-from-file.title': '使用附加的照片作為地點的圖片',
  'help.guide.place-image-from-file.tip.2': '釘在停靠點上或附加在其預訂上的照片也會列出供你選擇。',
  'help.guide.place-own-hours.step.5':
    '點擊「更新」。卡片現在會在「營業時間」下顯示你設定的時間，標題中的「開啟」或「已關閉」也會依此判定。',
  'help.guide.confirm-stay-booking.step.3': '點擊標題中的「待確認」。提示文字會顯示「設為已確認」，圓點變成綠色。',
  'help.guide.map-nearby-places.tip.4':
    '搜尋失敗的分類會出現紅點，「搜尋此區域」也會變紅並帶有警告標誌：點擊它可重試。',
  'help.guide.tour-map-lines.tip.1': '在天數欄中收合的一天，它的遊程和停靠點會一起從地圖上移除。',
  'help.guide.car-stops.step.3':
    '在標題列輸入標題。在「路線」下，於「來自」選擇取車地點，在「到」選擇還車地點；輸入前會先列出旅行本身的地點。「取車日期」和「取車時間」說明何時取車，「還車日期」和「還車時間」說明何時還車。',
  'help.guide.transport-details.step.1':
    '在「交通」分頁中，點擊一張卡片。詳細資訊會在分頁上方開啟，標題列的色調與卡片一致。每日計畫中的交通列開啟的是同樣的詳細資訊。',
  'help.guide.export-transports-csv.tip.2': '「預訂」分頁有相同的圖示，會寫出自己的檔案，檔名以 bookings.csv 結尾。',
  'help.guide.group-sort-bookings.step.2':
    '在「分組依據」下，選擇「狀態」、「日期」、「類型」或「不分組」。分頁會立即依這些區段排序。',
  'help.guide.export-bookings-csv.result':
    '你的瀏覽器會下載一個以旅行和分頁命名的檔案，例如 autumn-in-japan-bookings.csv，分頁顯示的每筆預訂各佔一列。',
  'help.guide.arrange-packing-list.result':
    '清單會依你拖曳後的順序排列，物品則依「依名稱」排序，直到你關閉它為止。你自己的順序會保留在底層。',
  'help.guide.count-packed-pieces.step.2':
    '數量前面會出現一個計數器：0/5，附減號和加號。每放一件進行李袋就點一次加號。',
  'help.guide.expense-receipts.step.4':
    '回到帳本，該列的名稱旁會有「收據」標籤，有多張時會在括號中顯示數量。點擊即可開啟收據。',
  'help.guide.final-budget.tip.3':
    '已離開旅行的人，只要還有與他有關的款項需要結算，就會在「餘額」和「最終花費」中保留一列。',
  'help.guide.files-sync-settings.step.2':
    '流程列顯示 TREK 和你的儲存空間，以及各自持有的文件，中間有兩條通道：「送往儲存庫」和「來自儲存庫」。點擊「送往儲存庫」可將它關閉。通道會變灰，通道下方的那行字會顯示「僅接收」。再點擊一次可重新開啟。',
  'help.guide.files-sync-settings.tip.4':
    '只有旅行的所有者或管理員可以變更這些設定。其他成員會看到流程列，附帶像「文件雙向同步」這樣的說明，但沒有「設定」。',
  'help.guide.manage-notes.step.2':
    '「展開」會開啟整則筆記：完整文字、它的「網站」和「檔案」，點擊檔案即可預覽。底部的「編輯」會直接切換到編輯器；右上角的叉號會再次關閉筆記。',
  'help.guide.note-categories.goal': '為群組的筆記設定有名稱、有顏色的分類，並一次只顯示一個分類。',
  'help.guide.note-categories.tip.1':
    '垃圾桶只能移除沒有筆記使用的分類。仍有筆記使用的分類會留在清單中，直到這些筆記被移到其他分類。',
  'help.guide.roadtrip-reorder.title': '調整停靠點順序，或移到另一天',
  'help.guide.roadtrip-reorder.tip.3': '你固定的時間不會被詢問：側欄會立即重新計算當天，並標出已無法準時到達的停靠點。',
  'help.guide.roadtrip-overnight.step.3':
    '在對話方塊頂部，「過夜」會預訂一晚，「停留」則讓它成為停留一段時間的停靠點。旅館預設為「過夜」，露營地預設為「停留」。過夜只需要填寫「入住」，也可以留空。',
  'help.guide.roadtrip-stop-fill.step.1':
    '在側欄的加油或充電停靠點上，點擊電池徽章。它顯示這個停靠點加到多少：跟隨你的「加到」設定時顯示為淡色，有自己的數值後則顯示為實色。',
  'help.guide.roadtrip-bookings.step.1':
    '在當天將該段行程預訂為「飛行」、「火車」、「渡輪」、「郵輪」或「公車」預訂，並標出兩端的位置。行車路線會自動納入：道路在乘載工具出發的站點結束，並在抵達處重新開始。',
  'help.guide.roadtrip-google-import.result':
    '該路線的停靠點會加在當天最後一個停靠點之後，側欄和地圖都會經過它們行駛。',
  'help.guide.roadtrip-hazards.step.3':
    '警告會在地圖上以區域繪製。點擊其中一個可查看它的內容、哪個服務回報的，以及最後更新時間。',
  'help.ctx.trip-tours.bullet.2':
    '頂部的「匯入 GPX 或 KML」會將檔案匯入為遊程。下方的篩選按鈕（起初是「全部」，附遊程數量）可依狀態、來源、路線限制和類型縮小列表範圍。',
  'help.guide.tour-show-list.step.2':
    '每一列是一條遊程。彩色條是它在地圖上的線條，圓形方塊顯示在 TREK 中規劃的健行的路線限制（T1 到 T6），或其類型的圖示。名稱下方的徽章顯示它排在哪些天、時間、距離和爬升；多日遊程旁邊帶數字的月亮表示它的階段數。',
  'help.guide.tour-add-to-day.title': '把遊程排到某一天',
  'help.guide.tour-add-to-day.tip.2':
    '當旅行在最後一個階段之前就結束時，選項會說明最多排到哪個階段，之後的階段則不會排入任何一天。',
  'help.guide.tour-day-times.step.3':
    '點擊「更新」。該列現在顯示 開始 → 結束。計算出的結束時間顏色較淡，≈ 表示估算，≥ 表示停留點尚無時間，+1 表示過了午夜；將指標指向它可查看是怎麼算出來的。',
  'help.guide.tour-remove-from-day.goal': '取消遊程的排程，但不刪除它。',
  'help.guide.tour-filter-list.goal': '把很長的列表縮小到你要找的遊程：尚未規劃的、來自檔案的、某一類型的。',
  'help.guide.tour-filter-list.result': '列表中只有你篩選的遊程；其他的仍留在旅行中。',
  'help.guide.tour-hide-on-map.result': '你的地圖上只有你想要的遊程，被隱藏的會留在列表中並顯示為淡色。',
  'help.guide.tour-import-plan-tab.result': '這條軌跡成為旅行的一條遊程：列表中有一列帶 GPX 徽章，地圖上有一條線。',
  'help.guide.tour-detail-read.title': '開啟遊程並閱讀它的卡片',
  'help.guide.tour-detail-read.step.7': '用標題中的 X 關閉卡片，或按 Escape。',
  'help.guide.tour-rename-colour.goal': '為遊程取一個你認得的名稱，以及一個在地圖上醒目的線條顏色。',
  'help.guide.tour-take-along.title': '把遊程帶到手機或 GPS',
  'help.guide.tour-take-along.tip.4':
    '在「遊程」分頁，同樣的下載按鈕位於左欄頂部。遊程有未儲存的變更時，下載前會先請你儲存。',
  'help.guide.tour-copy-keep.tip.1': '兩者都是副本：之後對遊程的修改既不會影響副本，也不會影響你保存在收藏中的內容。',
  'help.guide.tour-packing-link.step.2':
    '在「連結到」下，選擇「整份行李清單」或其中一份清單。每一列都會顯示它包含多少物品。',
  'help.guide.tour-files.title': '將檔案與遊程放在一起',
  'help.guide.tour-activity-link.title': '連結你實際走過的軌跡',
  'help.guide.tour-activity-link.tip.2': '只有未用於規劃遊程的匯入軌跡才能連結，而且每條軌跡只能連結到一條遊程。',
  'help.guide.tour-activity-compare.step.4':
    '軌跡底部的「更換」可選擇另一份記錄。「取消關聯」會將它從遊程上移除，軌跡則以匯入的形式留在旅行中。',
  'help.guide.tour-origin-check.step.3':
    '在「遊程」分頁中自己繪製的遊程會標示「在 TREK 中規劃」，並顯示它的「建立時間」。',
  'help.ctx.trip-tour-planner.bullet.2':
    '左側欄是編輯器。沒有開啟任何遊程時，它提供「規劃新遊程」。其中的遊程會顯示名稱、類型、路點、其類型的卡片和詳細資訊，底部有「捨棄」和「儲存」。',
  'help.guide.tour-open-workspace.step.2':
    '左側欄是編輯器。沒有開啟遊程時，它提供「規劃新遊程」，可在地圖上開始一條遊程。',
  'help.guide.tour-open-workspace.tip.3': '編輯器有未儲存的變更時開啟另一條遊程，會先詢問：「捨棄變更」，或繼續編輯。',
  'help.guide.tour-draw-route.step.5':
    '依照你走的順序點擊接下來的地點。每次點擊都會把該點加為新的終點，從兩個點開始，TREK 會沿著小徑規劃路線。',
  'help.guide.tour-type-profile.goal': '選擇遊程類型，自行車遊程還要選擇它的設定檔，讓路線走對的道路。',
  'help.guide.tour-edit-points.title': '移動、重新排序和移除點',
  'help.guide.tour-edit-points.tip.1':
    '第一個點帶有「開始」徽章，最後一個點帶有「結束」。把某個點移到最上面或最下面，就會讓它成為起點或終點。',
  'help.guide.tour-shaping-points.step.4':
    '要把停靠點變成塑形點或改回來，開啟該列的「更多操作」，選擇「設為塑形點」或「設為停靠點」。',
  'help.guide.tour-loop-reverse.step.2': '最後一列現在顯示「返回起點」，地圖上的路線在起點處結束。',
  'help.guide.tour-leg-by-hand.step.1': '在這一段起點的點上開啟「更多操作」，選擇「手動繪製下一段」。',
  'help.guide.tour-trip-places.goal': '把你已在旅行中規劃好的地點加為遊程的停靠點。',
  'help.guide.tour-trip-places.result': '遊程多了一個停靠點，對應旅行中的這個地點，名稱相同。',
  'help.guide.tour-details-times.tip.2':
    '健行時，「詳細資訊」還包含「步道最高難度」和「路線偏好」，健行指南中有說明。城市散步沒有「休息」：由各停靠點的停留取而代之。',
  'help.guide.tour-save.step.4': '這條遊程現在列在「這趟旅行的遊程」下，尚未排入任何一天。',
  'help.guide.tour-edit-saved.step.2':
    '像新遊程一樣修改你需要的內容：移動或新增點、切換類型，或編輯詳細資訊，例如這裡的「描述」。',
  'help.guide.tour-summary-profile.goal': '查看遊程有多長、多陡，以及路線上每個高度位於何處。',
  'help.guide.tour-summary-profile.result': '你知道遊程有多長、爬升多少、要花多久，以及哪裡會變陡。',
  'help.guide.tour-list-manage.tip.1':
    '每條遊程在總計中只算一次，即使排在好幾天。前面帶 ≥ 的總和表示缺少部分遊程；將指標指向它可看到缺少幾條。',
  'help.guide.tour-delete.tip.1': '此操作無法復原，「復原」也無法找回遊程。',
  'help.guide.tour-saved-elsewhere.step.3': '如果你仍然點擊「儲存」，會改為開啟「期間已被變更」，且不會覆寫任何內容。',
  'help.ctx.trip-tour-import.bullet.2':
    '「匯入預覽」會在儲存任何內容之前，於地圖上顯示檔案中的每條軌跡及其距離、爬升、下降和點數。在「匯入為」下，你可以說明這些軌跡是什麼。',
  'help.guide.tour-import-gpx.step.3':
    '「匯入預覽」會開啟，此時尚未儲存任何內容。地圖顯示完整路線，檔案中的每條軌跡是一列編號的資料，附距離、爬升、下降和點數。錄製的軌跡還會顯示建立時間和花費時間。',
  'help.guide.tour-import-gpx.result':
    '這條遊程位於「這趟旅行的遊程」中，尚未排入任何一天。單獨一條會直接在地圖上開啟，作為「GPX 遊程」。',
  'help.guide.tour-view-import.tip.3': '來自 wanderer 的路線以同樣的方式開啟，作為「wanderer 遊程」。',
  'help.guide.tour-plan-from-import.tip.1': '「捨棄」會放棄這項建議。在你儲存之前不會儲存任何內容。',
  'help.guide.tour-restore-recorded.step.2': '點擊「還原錄製的軌跡」。',
  'help.guide.tour-take-over.step.2': '選擇「從其他行程引入路線」。',
  'help.guide.tour-take-over.result': '會有訊息確認引入成功，遊程會在編輯器中開啟，可以直接排到某一天。',
  'help.guide.tour-import-wanderer.tip.2':
    '匯入的是副本：之後在 wanderer 中的變更不會影響這條遊程。遊程「來源」中的「檢查出處」會告訴你路線何時有變更。',
  'help.ctx.trip-tour-map.bullet.3':
    '地圖頂部的「搜尋地點或地址」會把地圖移到某個城鎮、山屋或山頂，而不會在遊程中加入任何內容。',
  'help.guide.tour-map-layers.result': '遊程會繪製在適合它的地圖上，標籤會顯示目前開啟的是哪一個。',
  'help.guide.tour-along-search.step.3':
    '在「距路線的範圍」下，選擇要搜尋離路線多遠的範圍：250 公尺、500 公尺、1 公里或 2 公里。',
  'help.guide.tour-along-add-stop.goal': '讓遊程經過你在途中發現的觀景點、山屋或泉水。',
  'help.guide.tour-along-add-stop.tip.3':
    '無法加入停靠點的路段（以固定線路鋪設的飛拉達或搬運路段，或手動繪製的路段）會以淡色留在列表中，旁邊註明原因。',
  'help.guide.tour-3d-terrain.result': '你已在 3D 地形上看過這條遊程，陡峭路段以顏色標示；規劃時再切回平面地圖。',
  'help.guide.tour-3d-flyover.step.3':
    '「停留」會讓飛行停在原地，「播放飛越」則從那裡繼續。「從頭開始」會回到開頭並重新飛行。',
  'help.guide.tour-map-overlays.step.1':
    '在「遊程」分頁中開啟一條滑雪遊程。雪道一開始就是開啟的：它的開關是左下角標籤中的雪山圖示，「雪道、越野滑雪道與纜車」。點擊可將它們從地圖上移除，再點一次則恢復。',
  'help.ctx.trip-tour-stages.title': '多日遊程',
  'help.guide.tour-multi-day.goal': '把一條路線切成多個階段，每天行進一個階段。',
  'help.guide.tour-multi-day.tip.2':
    '要再次合併兩個階段，請在帶月亮的停靠點選單中選擇「移除階段終點」。移除該停靠點也會將它們合併，並出現可「復原」的通知。',
  'help.guide.tour-stages-on-days.step.3':
    '選擇「從這一天起按階段安排」：第 1 階段排在那一天，之後每個階段依序排在隔天。「整條路線放在這一天」則改為把整條路線都放在那一天。',
  'help.guide.tour-stages-on-days.result': '每個階段都排在旅行的對應日期，你開啟的那個階段則在編輯器中。',
  'help.ctx.trip-tour-hike.bullet.6':
    '右側的「遊程摘要」顯示距離、爬升、預估步行或跑步時間、休息和計劃的總時間，下方是海拔剖面。編輯器底部的「儲存」會保存遊程。',
  'help.guide.tour-hike-plan.step.6': '點擊左欄底部的「儲存」。',
  'help.guide.tour-hike-trail-details.step.1':
    '從「這趟旅行的遊程」開啟健行，在「路點」卡片下方找到「路徑詳情」。開啟「沿路線顯示」。',
  'help.guide.tour-hike-trail-details.tip.3':
    '卡片中的任何內容都不會改變遊程，而且需要網路連線。匯入的健行在檢視中顯示同樣的卡片，但沒有路線限制。',
  'help.guide.tour-hike-round.result':
    '健行會沿著你選擇的環線回到起點。地圖底部的「已選用環線」有「復原」，「儲存」則會保存它。',
  'help.guide.tour-hike-compare-ways.step.3':
    '每列上的徽章顯示它比目前路線長多少、高多少或慢多少。點擊你想要的那一條。',
  'help.guide.tour-ferrata-add.step.1':
    '開啟健行後，點擊左下角那一排地圖按鈕中的「飛拉達」。徽章會計算視野內的飛拉達數量；如果它要求你放大，請放大地圖。',
  'help.guide.tour-ferrata-add.tip.3':
    '飛拉達上的路段會在海拔剖面上以色帶標出，這樣你就能看到它出現在一天中的哪個位置。',
  'help.guide.tour-run-plan.step.5': '在「遊程名稱」下為這次跑步取個名稱，然後點擊「儲存」。',
  'help.guide.tour-run-ways.step.1':
    '從「這趟旅行的遊程」開啟跑步，並在「路點」卡片下方的「路徑詳情」中開啟「沿路線顯示」。',
  'help.ctx.trip-tour-walk.bullet.1':
    '遊程類型「城市散步 / 觀光」會把遊程變成散步。它的點是帶有「標籤」、停留時間和重要性的停靠點。散步沒有健行限制，也沒有「休息」欄位：由停留取而代之。',
  'help.guide.tour-walk-plan.step.2':
    '新增停靠點：確認「新增地點」已開啟，並在每個地點點擊地圖，或點擊「行程地點」選用旅行中已有的地點。',
  'help.guide.tour-walk-plan.result':
    '散步會列出它的停靠點及停留時間，「遊程摘要」會將它們加總。把它排到某一天，就能看到你何時到達每個停靠點。',
  'help.guide.tour-walk-sights.tip.1': '它會成為散步的停靠點，而不是旅行的地點。',
  'help.guide.tour-walk-day-times.step.3':
    '在「遊程」分頁中再次開啟散步。在「路點」頂部，「時間依據」會指出日期和開始時間。若散步排在多天，點擊它可選擇另一天。',
  'help.guide.tour-walk-google-import.goal': '貼上從 Google 地圖分享的步行路線，並把它的停靠點載入為散步。',
  'help.guide.tour-walk-google-import.result':
    '一條新的城市散步會在編輯器中開啟，附帶來自 Google 地圖的停靠點，可以直接儲存。',
  'help.guide.tour-walk-check-off.tip.2': '每日計畫中的散步列也會顯示計數，例如 3/7。',
  'help.ctx.trip-tour-bike.bullet.4':
    '在「登山」設定檔下，同一張卡片會讀取地圖編輯者提供的步道等級（mtb:scale）。沒有等級的路段是未知，而不是容易。',
  'help.guide.tour-bike-profile.step.6': '在「遊程名稱」下輸入名稱，然後點擊左側欄底部的「儲存」。',
  'help.guide.tour-bike-surfaces.goal': '了解路線有多少是柏油、碎石或未知，以及它經過哪些類型的道路。',
  'help.guide.tour-bike-surfaces.tip.3':
    '卡片讀取的是路線規劃器規劃出的路線，不會更動遊程。它需要網路連線；離線時會告知，路線不受影響。',
  'help.guide.tour-bike-mtb-grades.tip.1': '「資料中無難度」表示未知，而不是容易。難度等級不代表這條步道是否適合你。',
  'help.ctx.trip-tour-ski.bullet.3':
    '你在地圖上點擊的每個點，都會沿著雪道、纜車和步道與前一個點相連。每個點下方以標籤列出它的路段，雪道以其難度等級的顏色顯示，附分鐘數。無法規劃的路段會變紅，說明原因，並提供修正方式或「畫直線」。',
  'help.guide.tour-ski-plan.step.4':
    '確認「新增地點」已開啟，然後依序點擊地圖上你的起點和每個想到達的地方。雪道路線規劃器會沿著雪道、纜車和步道，把每個點與前一個點相連。',
  'help.guide.tour-ski-options.title': '告訴雪道路線規劃器你怎麼滑雪',
  'help.guide.tour-ski-options.tip.2':
    '「搭乘纜車」對「高山滑雪」和「單板滑雪」預設開啟，對其他項目預設關閉。「排除」和「需要時搭纜車下山」只在搭乘纜車時才會顯示。',
  'help.guide.tour-ski-fix-leg.tip.1': '你也可以在地圖上把該點拖近雪道、步道或纜車。放開時，該路段會重新規劃。',
  'help.guide.tour-ski-summary.step.2':
    '「滑行」、「搭纜車」、「等待」和「步行」給出各自的時間。「雪道」、「雪道下降」和「纜車次數」給出雪道的長度、你在雪道上滑降的高度，以及你搭了幾次纜車。',
  'help.guide.tour-ski-pistes-layer.goal': '查看滑雪遊程周圍的雪道、越野滑雪道和纜車，以及它們的顏色代表什麼。',
  'help.guide.tour-ski-import.title': '匯入滑雪軌跡並說明它是什麼',
  'help.guide.tour-ski-import.tip.1':
    '匯入的軌跡會依錄製時的樣子保留：TREK 不會把它貼合到雪道上，其卡片會將「滑雪時間」顯示為「未計算」。',
  'help.ctx.trip-tour-paddle.bullet.3':
    '點上的「更多操作」包含划槳工具：在水上規劃下一段或手動繪製、「從這裡開始搬運船隻」，以及「在此點標記船閘」。',
  'help.guide.tour-paddle-setup.step.3':
    '在「船」下，選擇「獨木舟（Kayak）」、「加拿大式獨木舟」、SUP 或「其他」。船的種類決定 TREK 建議的速度。',
  'help.guide.tour-paddle-setup.tip.4': '欄位底部的「划槳有風險」會開啟「水上安全」。第一次出發前請先讀一遍。',
  'help.guide.tour-paddle-water-route.step.5':
    '若要一次規劃所有手動繪製的路段，點擊「路點」標題中的波浪圖示「沿水路規劃手繪的路段」。',
  'help.guide.tour-paddle-portage.step.1': '將游標移到你上岸的停靠點，點擊「更多操作」，也就是那三個點。',
  'help.guide.tour-paddle-portage.result': '這段路在地圖和路點中都成為搬運路段，「時間估算」也將它計為搬運。',
  'help.guide.tour-paddle-lock.tip.2':
    '如果有搬運路段繞過船閘，船閘會變暗並標示「繞行搬運」。這時以搬運時間計算，不含船閘的分鐘數。',
  'help.guide.tour-paddle-time.step.4':
    '遊程中有搬運路段時，「搬運」列會計算搬運。點擊它的速度，輸入你搬運船的速度。「上岸與重新下水」會在每個搬運路段加上相應的分鐘數。',
  'help.guide.tour-paddle-wind.step.1': '將划槳遊程排到旅行的某一天。左欄的「風速」卡片就會顯示當天遊程起點的預報。',
  'help.guide.tour-paddle-wind.result': '你知道當天下水處每小時的風況。',
  'help.guide.tour-paddle-checklist.tip.1':
    '針對每個障礙，選擇你要怎麼做：「划行通過」、「搬運繞過」、「繞行」或「不受影響」。「下一項」會帶你到下一個未處理的項目。',
  'help.guide.tour-paddle-track-marks.step.1':
    '在「遊程」分頁中，點擊右欄的「新增行程」，選擇「匯入 GPX 或 KML」並選取檔案。',
  'help.guide.tour-paddle-track-marks.tip.2': '「捨棄」會放棄你尚未儲存的標記。錄製的軌跡本身永遠不會被重新繪製。',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK 不會計算騎乘時間。如果你想在當天顯示時間，請在「詳細資訊」的「計劃於」下輸入。',
  'help.guide.tour-horse-plan.step.5': '在「區段」下選擇一個區段。查看你騎乘它的「方向」，以及沿途的「馬匹通行」說明。',
  'help.guide.tour-horse-plan.tip.5':
    '騎馬行程中沒有任何內容是規劃出來的：點擊繪製的線條不會新增塑形點，區段兩端的點也會停留在路線原有的位置。',
  'help.guide.tour-horse-gap.tip.1': '沒有路線規劃器或馬匹路線檢查過手動區段。請查看地圖，了解它實際通往何處。',
  'help.guide.tour-horse-recorded.step.4':
    '騎馬行程會在左欄開啟。「已記錄的騎馬遊」卡片顯示「依記錄保留」、「無騎乘時間」和「通行未經檢查」。將指標指向徽章可查看原因。',
  'help.guide.dateless-trip.step.2': '將「開始日期」和「結束日期」留空。下方會出現「天數」欄位：輸入你想規劃的天數。',
  'help.guide.trip-reminder.tip.1':
    '只有旅行的所有者（或管理員）看得到「提醒」區塊。如果它呈灰色，管理員必須先在「管理員」的「通知」中開啟旅行提醒。',
  'help.guide.upcoming-reservations.step.2': '點擊一筆預訂，即可開啟它所屬的旅行。',
  'help.guide.timezones-widget.tip.1':
    '列表使用官方時區名稱，例如 Europe/Lisbon 或 America/New_York，所以請搜尋這些名稱所代表的城市。',
  'help.guide.half-company-holiday.step.2': '在同一個工具列中開啟「半天」。',
  'help.guide.edit-holiday-calendar.tip.1': '每次變更都會立即儲存，沒有「儲存」按鈕。',
  'help.guide.person-color.tip.1': '同樣的顏色也用來標示工具列和「年假額度」卡片中的這個人。',
  'help.guide.answer-fusion-request.step.2': '閱讀合併的意思：共用一份日曆、可以互相編輯條目，以及共用的假日設定。',
  'help.guide.log-for-partner.step.2': '查看工具列：它的第一個按鈕現在顯示對方的名字和顏色。',
  'help.guide.dissolve-fusion.step.2': '在底部的「解除合併」下，點擊「解除」。',
  'help.guide.country-places.step.3':
    '對話方塊會列出該國家計入的每個地點，依旅行分組；超過六個時，頂部的「搜尋地點」可縮小列表範圍。點擊地點或旅行標題，即可在規劃器中開啟那趟旅行。',
  'help.guide.tour-activity-stats.step.5':
    '點擊「查看遊程」。「我的遊程紀錄」會開啟，顯示總計、「依類型」的拆分，以及該期間的每條遊程，附日期、旅行、距離和爬升。標題列上的標籤在這裡同樣可以切換期間和類型。',
  'help.guide.move-to-list.step.3': '選擇要放入的清單。清單超過三個時，頂部會有搜尋框可縮小範圍。',
  'help.guide.accept-list-invite.goal': '加入別人與你分享的清單，或婉拒邀請。',
  'help.guide.tour-collection-add-to-trip.step.4': '如果你願意，可修改「在行程中的名稱」，然後點擊「加入行程」。',
  'help.guide.tour-collection-manage.step.2': '在「搜尋地點」中輸入。它會連同地點一起依名稱縮小遊程範圍。',
  'help.guide.create-journey.tip.3':
    '旅行剛結束時，頂部「旅行剛結束」橫幅中的「建立旅程」會開始建立，並已勾選該趟旅行。',
  'help.guide.entry-draft.step.2': '點擊「儲存」。卡片現在會帶有「草稿」徽章。',
  'help.guide.gallery-map.step.3':
    '回到「時間線」，右側的地圖會跟著你的捲動：目前可見的條目會以當天的顏色圈起，點擊圖釘則會讓時間線捲動到對應的條目。',
  'help.guide.journey-map-layers.tip.1': '有顏色的虛線是旅行的 GPX 路線，屬於計畫的一部分；實線則是當天錄製的路線。',
  'help.guide.journey-keep-route.tip.1': '錄製停止的地方，線條也停止。沒有錄製到的道路不會被畫出來。',
  'help.guide.journey-day-stays.tip.1':
    '這一列只會顯示給可編輯日誌且已連接自己 Dawarich 的人，而且只出現在還有內容待決定的日子。',
  'help.guide.journey-take-over-day.step.4':
    '保持開啟「同時儲存當天的路線」可一併保留路線，然後點擊引入按鈕，按鈕上會顯示它將寫入的草稿數量。',
  'help.guide.journey-auto-prepare.step.3':
    '下方那行字會說明上次取得停留點的時間，或失敗的原因；「立即取得」會馬上向 Dawarich 詢問。',
  'help.guide.photo-location.tip.1': '你自己設定的地點永遠不會被移動。',
  'help.ctx.settings-plugins.bullet.1':
    '「外掛設定」：下方是每個向你要求資料的外掛各一張卡片，附其欄位和「儲存」。機密欄位一旦儲存就不會再顯示。',
  'help.guide.dashboard-widgets.step.3': '卡片下方的「恢復預設」會讓整個「外觀」分頁恢復為出廠狀態。',
  'help.guide.web-push-device.result': '卡片會顯示「已為此裝置開啟」，在「推播」下開啟的事件即使 TREK 已關閉也會送達。',
  'help.guide.connect-airtrail.step.1':
    '在「整合」下找到 AirTrail，輸入它的「執行個體網址」和 API 金鑰。金鑰需要在 AirTrail 的「設定」、「安全性」中建立。',
  'help.guide.connect-dawarich.step.1':
    '在「整合」下找到 Dawarich，輸入它的「執行個體位址」，以及 Dawarich 中「帳戶」、「API 金鑰」裡的 API 金鑰。',
  'help.guide.tour-connect-wanderer.step.1':
    '在「整合」下找到 wanderer，輸入它的「執行個體網址」和 API 權杖。權杖需要在 wanderer 的「設定」、「帳戶」、「API 權杖」中建立，開頭為 wanderer_key_。',
  'help.guide.tour-wanderer-watch.goal': '讓 TREK 在背景檢查你匯入的路線是否有變更。',
  'help.guide.mcp-oauth.tip.3': '「API 令牌」仍可使用，但被標示為「已棄用」；請改用 OAuth 客戶端。',
  'help.guide.offline-conflicts.tip.2': '這個選擇只適用於這台裝置。',
  'help.guide.default-user-settings.tip.1':
    '使用者自己在「設定」中的選擇永遠優先；這些預設值適用於所有尚未更改該設定的人。',
  'help.guide.own-routing-engine.step.1':
    '在「用戶預設設定」的「地圖」下，於「自建路徑規劃服務」中輸入你的 OSRM 伺服器位址。',
  'help.guide.admin-passkeys.tip.2': '之後更改網域，會讓人們已新增的所有 Passkey 失效。',
  'help.guide.instance-keys.tip.4': '高德地圖的金鑰必須是 Web 服务 (web service) 金鑰，而不是 JS API 金鑰。',
  'help.guide.rotate-jwt-secret.step.2': '閱讀警告，然後點擊「輪替並登出」。',
  'help.guide.notification-defaults.tip.2': '預設值只會影響尚未自行更改該格設定的人。',
  'help.ctx.notifications.bullet.5':
    '哪些事件會在這裡通知你，以及哪些會透過電子郵件、Webhook、ntfy 或推播送達，是在「設定」的「通知」中設定的。',
  'help.guide.read-notifications.result': '你會來到該通知所指的畫面，鈴鐺的計數也少了一個。',
  'help.guide.mark-notifications-read.title': '將通知標為已讀',
  'help.guide.delete-notifications.goal': '移除不再需要的通知，讓列表保持簡短。',
  'help.guide.notification-settings.step.1': '點擊右上角你的名字。',
  'help.guide.public-link.step.5': '連結存在期間可以修改這些選項；「刪除連結」會讓它失效。',
  'help.guide.link-journal.step.3':
    '為旅行的每個人選擇「無權限」、「閱讀」或「編輯」。「全部可讀」和「無人」可一次全部設定。',
  'help.guide.collapse-columns.tip.3': '分隔線取得焦點後，也可以用方向鍵移動。',
  'help.guide.edit-place.tip.3':
    '點擊對話方塊旁邊不會丟掉你的變更：TREK 會先詢問「放棄變更？」，「繼續編輯」則帶你回到表單。',
  'help.guide.dawarich-stays.goal': '逐一檢查後，引入 Dawarich 在旅行期間看到你停留過的地點。',
  'help.guide.leave-stop-off-route.step.1': '在停靠點上按右鍵，或點擊它的三個點，然後選擇「從路線中排除」。',
  'help.guide.move-booking-day.step.3': '該列現在位於新的一天，時間保持不變；如果時間也要改，請開啟預訂修改。',
  'help.guide.place-image-from-file.goal': '把地點檔案中已有的照片設為它的圖片，不需要再次上傳。',
  'help.guide.place-image-from-file.tip.3': '只有可以修改地點的旅伴才能更改圖片。',
  'help.guide.place-own-hours.result':
    '卡片會顯示你的電話號碼、電子郵件和營業時間，圖片周圍的外圈也依你的營業時間顯示綠色或紅色。',
  'help.guide.confirm-stay-booking.step.4': '用右上角的 X 關閉預訂。在「預訂」下，住宿的卡片現在顯示「已確認」。',
  'help.guide.tour-map-lines.title': '在地圖上找到你的遊程',
  'help.guide.tour-map-lines.tip.2':
    '隱藏只對你自己有效，並保存在這個瀏覽器中、僅限這趟旅行：遊程、它的日期和顏色對所有人保持不變。遊程列表上方的「全部顯示」會讓所有隱藏的遊程回來，手機地圖則一律顯示每條遊程。',
  'help.guide.car-stops.step.4':
    '在「沿途停靠點」下，為行車經過的每個地點點擊「新增中轉站」並選擇該地點，也可以在旁邊填上時間。沒有選擇地點的停靠點會在儲存時被捨棄。',
  'help.guide.transport-details.step.2':
    '標題中的標籤包含狀態、類型、日期和「預訂碼」；點擊狀態標籤可切換「待確認」和「已確認」。預訂碼標籤中的小複製圖示「複製預訂碼」會把預訂碼放進剪貼簿，方便在報到櫃檯使用。',
  'help.guide.group-sort-bookings.step.3':
    '在「排序方式」下，選擇「日期」、「標題」、「類型」或「狀態」。它們下方的一列可以翻轉順序：日期為「最早的在前」或「最晚的在前」，其餘為「依名稱」或「Z 到 A」。',
  'help.guide.booking-on-map.title': '在地圖上找到預訂',
  'help.guide.export-bookings-csv.tip.1':
    '欄位有「類型」、「標題」、「狀態」、「開始」、「結束」、「來自」、「到」、「地點」、「確認號」和「筆記」。',
  'help.guide.arrange-packing-list.tip.1': '「依名稱」開啟時，物品無法拖曳，但整個清單仍然可以。',
  'help.guide.count-packed-pieces.step.3':
    '只有部分件數放進行李時，計數器會以你的強調色顯示，勾選框也會有同色外框。減號可以再把一件拿出來。',
  'help.guide.expense-receipts.step.5':
    '預覽會顯示收據，標題中有「在新標籤頁中開啟」和「下載」。有多張收據時，可用方向鍵在它們之間切換，按 Esc 關閉。',
  'help.guide.files-sync-settings.step.3': '點擊流程列下方的「設定」，展開其餘選項。',
  'help.guide.manage-notes.step.3':
    '同一個選單中的「置頂」會讓筆記留在面板頂端，以其分類的顏色框起，標題旁有圖釘。同一處的「取消置頂」則讓它回到一般排序。',
  'help.guide.note-categories.step.1':
    '點擊「筆記」卡片標題中「新建筆記」旁的齒輪。「管理分類」會開啟，每個分類各佔一列：顏色、名稱、六個色點和一個垃圾桶。',
  'help.guide.note-categories.tip.2':
    '沒有筆記的分類只會保存在你的瀏覽器中。其他成員要等有筆記歸入該分類後才會看到它。',
  'help.guide.roadtrip-reorder.goal': '直接在側欄中更改行車順序，或把停靠點移到另一天。',
  'help.guide.roadtrip-overnight.step.4':
    '旁邊的「尋找住宿」包含可複製的名稱和預訂網站的連結：旅館有 trivago 或 CHECK24，露營地有 PiNCAMP 或 Pitchup。請在網站上核對地點、日期和人數。',
  'help.guide.roadtrip-stop-fill.step.2': '在「加到」下選擇 50 到 100。按鈕下方的那行字會說明從這裡可以開多遠。',
  'help.guide.roadtrip-bookings.step.2':
    '在側欄中，這段行程是一張依類型著色的卡片，時刻表在到達欄中，兩端位於標題下方。',
  'help.guide.roadtrip-google-import.tip.1': 'TREK 會自行計算停靠點之間的路線；不會複製 Google 的道路。',
  'help.guide.roadtrip-hazards.result': '地圖會顯示旅行周圍目前的警告，路線保持原樣。',
  'help.ctx.trip-tours.bullet.3':
    '一列：彩色條是遊程在地圖上的線條，圓形方塊顯示路線限制（T1 到 T6）或類型，小的 GPX 或 wanderer 徽章標示匯入，其他徽章顯示天數、時間、距離和爬升。帶數字的月亮表示多日遊程的階段數。',
  'help.guide.tour-show-list.step.3': '點擊一列。遊程的卡片會在地圖上方開啟。',
  'help.guide.tour-add-to-day.goal': '規劃你什麼時候進行遊程，讓它出現在當天，並在地圖上顯示它的線條。',
  'help.guide.tour-add-to-day.tip.3':
    '一條遊程只能排在一天一次。把它放到已經有它的那一天，只會顯示「這個遊程已在那一天。」',
  'help.guide.tour-day-times.step.4':
    '如果遊程在當天的下一個項目開始之後才結束，該列下方會有一行說明，例如「13:30 結束，晚於 12:30 開始的 Lunch at Gostner Schwaige」。不會移動任何內容。',
  'help.guide.tour-remove-from-day.step.1':
    '在天數欄中，將指標指向遊程的那一列，點擊「更多選項」並選擇「從當天移除」。',
  'help.guide.tour-filter-list.step.1':
    '點擊「匯入 GPX 或 KML」下方的篩選按鈕。它會顯示目前的狀態名稱，起初是「全部」，旁邊是遊程數量。',
  'help.guide.tour-hide-on-map.title': '在地圖上隱藏遊程的線條',
  'help.guide.tour-import-plan-tab.title': '從「計畫」分頁匯入軌跡',
  'help.ctx.trip-tour-detail.title': '遊程詳細資訊',
  'help.guide.tour-detail-read.goal': '查看旅行對遊程所知的一切：它的日期、各項數據、剖面，以及它的來源。',
  'help.guide.tour-detail-read.tip.1':
    '琥珀色的「謹慎使用」標籤表示匯入的資料帶有不完整的高度或數據。閱讀它的爬升和剖面時請記住這一點。',
  'help.guide.tour-rename-colour.step.1': '開啟遊程的卡片，點擊名稱旁的鉛筆。名稱會變成輸入欄位。',
  'help.guide.tour-take-along.goal': '前往遊程的起點、在網頁上開啟它的頁面，或把它的路線存成 GPX 檔案帶走。',
  'help.guide.tour-take-along.result': '你的地圖應用程式中有前往起點的路線，並有整條路線的 GPX 檔案。',
  'help.guide.tour-copy-keep.tip.2':
    '每日計畫中遊程選單裡的「儲存到收藏」會開啟同一個對話方塊，所以路線也會一併帶過去。',
  'help.guide.tour-packing-link.step.3': '點擊「連結」。',
  'help.guide.tour-files.goal': '把預訂、地圖或路線說明放在遊程旁邊，並可從它的卡片再次開啟。',
  'help.guide.tour-activity-link.goal': '把錄製的 GPX 軌跡放在計劃的遊程旁邊，而不更動計畫。',
  'help.guide.tour-activity-link.tip.3': '「花費時間」從軌跡中第一個到最後一個時間戳記，包含休息。',
  'help.guide.tour-activity-compare.tip.1': '「在地圖上比較」只有在卡片位於地圖旁邊時才會出現，手機上沒有。',
  'help.guide.tour-origin-check.tip.1': '從其他旅行引入的遊程，會在「引入自」下列出那趟旅行和遊程的名稱。',
  'help.ctx.trip-tour-planner.bullet.3':
    '右側欄的「這趟旅行的遊程」列出每條遊程，列表上方有篩選器和「行程總覽」。開啟遊程時，頂部的「遊程摘要」顯示它的距離、爬升、時間和海拔剖面。頂部的加號「新增行程」可規劃、匯入或引入遊程。',
  'help.guide.tour-open-workspace.step.3':
    '右側欄的「這趟旅行的遊程」列出旅行的每條遊程，列表上方有篩選器和「行程總覽」。',
  'help.guide.tour-open-workspace.result': '「遊程」分頁：編輯器在左邊，旅行的遊程在右邊，地圖在它們之間。',
  'help.guide.tour-draw-route.step.6':
    '在「路點」下，每個點都有一列帶編號，名稱載入後會以地點命名。TREK 工作時，「新遊程」旁的小圓點會顯示它在做什麼。',
  'help.guide.tour-type-profile.step.1': '點擊「遊程名稱」下的「路線類型」。它會顯示目前的類型，並附一行說明如何規劃。',
  'help.guide.tour-edit-points.goal': '透過在地圖上或列表中移動點，改變遊程的走向。',
  'help.guide.tour-edit-points.tip.2': '地點名稱載入之前，一列會顯示座標。「復原」和「重做」沒有鍵盤快速鍵。',
  'help.guide.tour-shaping-points.tip.1': '起點和終點一律是停靠點。',
  'help.guide.tour-loop-reverse.step.3': '點擊旁邊的「反轉方向」，可讓整條遊程反方向行走。',
  'help.guide.tour-leg-by-hand.step.2': '這一段會變成虛線直線，列表中該列下方會顯示「手動繪製，未規劃」及其長度。',
  'help.guide.tour-trip-places.step.1': '點擊「路點」下「新增地點」旁的「行程地點」。旅行的地點會在它下方展開。',
  'help.guide.tour-details-times.title': '為遊程命名並規劃時間',
  'help.guide.tour-details-times.tip.3':
    '「詳細資訊」可用旁邊的箭頭收合，當其中某個欄位的值被「儲存」拒絕時，會自動展開。',
  'help.guide.tour-save.tip.1': '「儲存」旁的「捨棄」會在確認後丟掉未儲存的變更。已儲存的遊程不受影響。',
  'help.guide.tour-edit-saved.step.3': '點擊「儲存」。「遊程已儲存」會出現，遊程仍保留它的日期、檔案和筆記。',
  'help.guide.tour-summary-profile.step.1':
    '「這趟旅行的遊程」頂部的「遊程摘要」會給出編輯器中遊程的「距離」、「累計爬升」和「累計下降」、預估時間、休息和計劃的總時間。',
  'help.guide.tour-list-manage.title': '讓旅行的遊程井然有序',
  'help.guide.tour-list-manage.tip.2':
    '已經有該遊程的那一天，在日期選單中會呈灰色。多日遊程會詢問是從那一天起安排各階段，還是整條遊程放在那一天。',
  'help.guide.tour-delete.tip.2': '如果只想把它從某一天移除，請改用該天選單中的「從當天移除」。',
  'help.guide.tour-saved-elsewhere.step.4':
    '選擇「另存為新遊程」可兩者都保留，「載入較新版本」可採用另一個版本，「覆寫」則是刻意用你的版本蓋過去。',
  'help.ctx.trip-tour-import.bullet.3':
    '匯入的遊程會以「GPX 遊程」或「wanderer 遊程」開啟：它的線條、「遊程摘要」和海拔剖面，維持匯入時的樣子。列表中它的那一列帶有「GPX 匯入」徽章。',
  'help.guide.tour-import-gpx.step.4':
    '在「匯入為」下，確認這些軌跡是什麼。預設為「健行」。「單車遊程」或「跑步」會要求選擇設定檔，「划槳行程」要求船和水域，「滑雪與冬季」要求滑雪項目。',
  'help.guide.tour-view-import.title': '查看匯入的軌跡',
  'help.guide.tour-view-import.result': '你看到的就是匯入時的錄製軌跡，沒有重新計算任何東西。',
  'help.guide.tour-plan-from-import.tip.2':
    '當卡片說明建議路線在較長的路段偏離了軌跡時，請先在地圖上檢查那些部分，再用它來規劃。',
  'help.guide.tour-restore-recorded.step.3': '用「還原錄製的軌跡」確認。路點和規劃出的線條會被捨棄，日期和筆記則保留。',
  'help.guide.tour-take-over.step.3': '找到遊程：在「依名稱搜尋」中輸入，或用「旅行」和「類型」篩選器縮小列表範圍。',
  'help.guide.tour-import-wanderer.title': '從 wanderer 匯入路線',
  'help.guide.tour-import-wanderer.tip.3':
    '已在旅行中的路線會標示「已在這趟旅行中」，並提供「開啟遊程」。之後有變更的路線會提供「匯入為新版本」，放在舊版本旁邊。',
  'help.ctx.trip-tour-map.bullet.4':
    '「沿途」是左側面板中的一張卡片，會在路線附近尋找觀景點、水源、山屋、餐飲等，並列出找到的結果。列表中的地點可以作為停靠點加入遊程。',
  'help.guide.tour-map-layers.tip.1':
    '你選擇的地圖會對你開啟的每條遊程保持，直到你重新載入頁面為止。類型不提供該地圖的遊程會以「地圖」開啟，「計畫」分頁中的地圖和「設定」中的設定都保持不變。',
  'help.guide.tour-along-search.step.4': '點擊「沿途搜尋」。TREK 只是查看：遊程不會有任何改變。',
  'help.guide.tour-along-add-stop.step.1':
    '點擊「沿途」列表中的地點，或它在地圖上的圖釘。它的卡片會在地圖上方開啟：它是什麼、離路線多遠，以及位於遊程的哪個位置。',
  'help.guide.tour-3d-terrain.title': '以 3D 查看遊程',
  'help.guide.tour-3d-terrain.tip.1': '同一列中的「概覽」會在你移動視角後，再次框出整條路線。',
  'help.guide.tour-3d-flyover.step.4': '點擊「概覽」，再次框出整條遊程。',
  'help.guide.tour-map-overlays.step.2': '點擊「雪道圖例」，就是開關旁邊那個有彩色圓點的小方塊。',
  'help.ctx.trip-tour-stages.summary':
    '多日遊程是被切成多個階段的一條路線，每天行進一個階段。在這裡你可以設定每天在哪裡結束、查看每個階段的各項數據，並把階段排到旅行的各天上。',
  'help.guide.tour-multi-day.step.1': '在「這趟旅行的遊程」中，點擊該遊程，在編輯器中開啟它。',
  'help.guide.tour-multi-day.tip.3': '階段的時間不含休息。以警告色顯示的時間「移動時間超過一天」，表示超過一天。',
  'help.guide.tour-stages-on-days.step.4': '點擊帶月亮和階段數的收合按鈕「顯示階段」，將它們展開。',
  'help.ctx.trip-tour-hike.title': '健行與跑步',
  'help.guide.tour-hike-plan.title': '在你設定的難度內規劃健行',
  'help.guide.tour-hike-plan.result': '健行會列在「這趟旅行的遊程」下，附距離、爬升和步行時間，可以直接排到某一天。',
  'help.guide.tour-hike-trail-details.step.2':
    '選擇要顯示的內容：SAC 表示健行等級，「路面」，或「道路類型」。地圖上的路線採用與列表相同的顏色。',
  'help.guide.tour-hike-round.title': '尋找大約指定長度的環線健行',
  'help.guide.tour-hike-round.tip.1': '環線會遵守健行的「步道最高難度」；卡片中的 T 標籤會顯示是哪一級。',
  'help.guide.tour-hike-compare-ways.step.4': '點擊「採用這條道路」。TREK 會向路線規劃器確認路線確實沿著它走。',
  'help.guide.tour-ferrata-add.step.2': '在地圖上點擊一條飛拉達，點它的虛線或標誌。它的卡片會顯示名稱、等級和長度。',
  'help.guide.tour-ferrata-add.tip.4':
    '卡片上的「在 OpenStreetMap 中檢視」會開啟該飛拉達本身的資料。無法載入任何資料時，徽章會變成琥珀色，原因顯示在提示文字中。',
  'help.guide.tour-run-plan.result':
    '跑步會列在「這趟旅行的遊程」下，附「跑步時間（計畫）」，其設定檔和配速也一併保留。',
  'help.guide.tour-run-ways.step.2': '卡片標題現在會顯示跑步有多少比例是未鋪面，以及其中難度最高的路徑。',
  'help.ctx.trip-tour-walk.bullet.2':
    '「路點」依序列出停靠點。停靠點編號外圍的圓環表示「必去」（實線）或選填（虛線），小盾牌表示「受保護」，名稱下方的標籤顯示停留時間。',
  'help.guide.tour-walk-plan.step.3': '將指標指向「路點」中的某個停靠點，點擊旁邊的「更多操作」並選擇「編輯站點」。',
  'help.guide.tour-walk-sights.title': '在城市散步沿途加入景點',
  'help.guide.tour-walk-sights.tip.2': '更改路線後，按鈕會顯示「重新搜尋」，因為找到的地點屬於更改前的路線。',
  'help.guide.tour-walk-day-times.step.4':
    '在每個停靠點下，你可以看到何時到達以及停留多久。如果地點在那個時間已關門，或在停留期間關門，會出現警告。',
  'help.guide.tour-walk-google-import.step.1':
    '在「這趟旅行的遊程」中，點擊「新增行程」（頂部的 +），並選擇「從 Google Maps 匯入漫步」。',
  'help.guide.tour-walk-check-off.title': '在當天勾選散步的停靠點',
  'help.guide.tour-walk-check-off.tip.3': '離線時排到某一天的散步，要等同步完成後才能勾選。',
  'help.guide.tour-bike-profile.title': '為你的騎乘方式規劃單車遊程',
  'help.guide.tour-bike-profile.result':
    '單車遊程已儲存並列在「這趟旅行的遊程」下，依其設定檔規劃路線，騎乘時間顯示在「遊程摘要」中。',
  'help.guide.tour-bike-surfaces.step.1':
    '在右側的「這趟旅行的遊程」中，點擊單車遊程將它開啟。路線計算完成後，「路面與道路」卡片會出現在「路點」下方。',
  'help.guide.tour-bike-surfaces.tip.4': '點擊卡片的標題可將它收合。重新載入後，它在這個瀏覽器中仍保持收合。',
  'help.guide.tour-bike-mtb-grades.tip.2':
    '如果地圖編輯者為上坡路段評了級，「上坡難度（mtb:scale:uphill）」會在下方以自己的列顯示。',
  'help.ctx.trip-tour-ski.bullet.4':
    '路點下方的「雪道路線」卡片把當天分成「滑行」、「搭纜車」、「等待」和「步行」，並附雪道長度、在雪道上滑降的高度和纜車次數。每一段都規劃完成後，右側「遊程摘要」中的「滑雪時間」會將它們加總。',
  'help.guide.tour-ski-plan.step.5':
    '在每個點下方，它的路段以標籤列出：每條雪道、纜車和步行路段，以名稱或種類顯示，雪道前面有其難度顏色的圓點，並附每段的分鐘數。',
  'help.guide.tour-ski-options.goal': '設定最難的雪道、偏好、你的速度，以及要搭乘哪些纜車，讓路段適合你。',
  'help.guide.tour-ski-options.tip.3':
    '「避開推測的連接」會讓路線避開地圖資料只是猜測的銜接處，例如兩條雪道之間未標示的路段。',
  'help.guide.tour-ski-fix-leg.tip.2': '當某個區域的雪道資料仍在下載時，規劃器會等待並自動再次詢問。',
  'help.guide.tour-ski-summary.step.3':
    '在右側的「遊程摘要」中，「滑雪時間」會把一切加總。它的資訊圓點說明了計算方式。',
  'help.guide.tour-ski-pistes-layer.step.1':
    '開啟「滑雪與冬季」遊程時，地圖會自動顯示雪道。地圖左下角那一排的雪山開關可以將它們關閉和重新開啟；它的提示文字是「雪道、越野滑雪道與纜車」。',
  'help.guide.tour-ski-import.goal': '匯入錄製的滑雪、越野滑雪或雪鞋健行軌跡，並為它指定正確的項目。',
  'help.guide.tour-ski-import.tip.2':
    '若要像規劃的遊程一樣編輯它，請使用其「可編輯版本」卡片中的「規劃可編輯版本」。它的點會以直線相連。',
  'help.ctx.trip-tour-paddle.bullet.4':
    '「時間估算」會把水上、搬運、上岸與重新下水、船閘和休息加總，依據你可以更改的速度和分鐘數。',
  'help.guide.tour-paddle-setup.step.4': '在「水域」下選擇「河流」或「湖泊」。在船和水域都選定之前，遊程無法儲存。',
  'help.guide.tour-paddle-setup.result': '一條新的划槳遊程，附有船、水域和速度，可以在地圖上放置第一個點了。',
  'help.guide.tour-paddle-water-route.tip.1':
    '缺少水域資料時，TREK 會依實例的設定自行取得該地區的資料，或向管理員索取。該路段會顯示「正在載入水域資料」，資料到位後會自行規劃，通常在一到三分鐘內完成。',
  'help.guide.tour-paddle-portage.step.2': '選擇「從這裡開始搬運船隻」。到下一個點的路段會成為搬運路段，繪製在陸地上。',
  'help.guide.tour-paddle-lock.title': '加入船閘及其等待時間',
  'help.guide.tour-paddle-lock.tip.3': '「移除船閘」位於開啟的卡片底部，也在「更多操作」中。',
  'help.guide.tour-paddle-time.step.5':
    '在每個船閘都填入時間之前，估算會顯示「不完整」，各列下方的備註會指出缺少什麼。',
  'help.guide.tour-paddle-wind.step.2':
    '查看風從哪裡來、「平均」和「陣風」。「平均」是當天最強的每小時平均風速，「陣風」是最強的陣風。',
  'help.guide.tour-paddle-checklist.title': '逐項檢查障礙清單',
  'help.guide.tour-paddle-checklist.tip.2':
    '「搬運繞過」本身不會規劃任何搬運路段。點擊「規劃陸上搬運」可在地圖上設定。',
  'help.guide.tour-paddle-track-marks.step.2':
    '在「匯入預覽」中，將「匯入為」設為「划槳行程」，然後選擇「船」和「水域」。匯入會等待這兩項都選好。',
  'help.guide.tour-paddle-track-marks.tip.3':
    '在錄製的軌跡上，「時間估算」的「水域」列有自己的速度：點擊它並輸入你划槳的速度。',
  'help.ctx.trip-tour-horse.bullet.5':
    '從 GPX 檔案匯入的騎馬行程會維持錄製時的樣子，其「已記錄的騎馬遊」卡片會說明匯入沒有計算出的內容。',
  'help.guide.tour-horse-plan.step.6':
    '點擊「採用路段」。該路段會以帶有路線名稱的徽章加到「路點」卡片的騎馬行程中。以同樣方式採用更多路段。',
  'help.guide.tour-horse-gap.title': '銜接馬匹路線之間的缺口',
  'help.guide.tour-horse-gap.tip.2': '你在地圖上點擊的點會以同樣的方式加入騎馬行程，成為未經檢查的直線路段。',
  'help.guide.tour-horse-recorded.result': '騎馬行程會以你騎乘時的樣子留在旅行中，距離和高度取自檔案。',
  'help.guide.dateless-trip.step.3': '點擊「建立新旅行」。',
  'help.guide.trip-reminder.tip.2': '新旅行預設在出發前 3 天提醒。透過哪些管道通知你，是在「設定」的「通知」中設定的。',
  'help.guide.upcoming-reservations.result': '旅行隨即開啟。回到儀表板後，小工具會繼續顯示接下來的行程。',
  'help.guide.entitlement.tip.2': '在合併的計畫中，每個人都有自己的一列，你也可以設定其他人的年假額度。',
  'help.guide.half-company-holiday.step.3': '點擊那一天。格子的一半會變成琥珀色。',
  'help.guide.school-holidays.tip.2': '將指標移到假期中的某一天，可在「學校假期」下看到它的名稱。',
  'help.guide.answer-fusion-request.step.3': '點擊「接受併合並」來合併計畫，或點擊「拒絕」讓你的計畫保持獨立。',
  'help.guide.log-for-partner.step.3': '點擊要記錄的日子，然後再次點擊「人數」中你自己的名字。',
  'help.guide.dissolve-fusion.result': '每個人都回到自己的計畫和自己的條目，「人數」只會列出你。',
  'help.guide.country-places.result': '規劃器會開啟該地點所屬的旅行。',
  'help.guide.tour-activity-stats.step.6':
    '對於沒有成行的遊程，點擊該列末端的圓形按鈕「排除」。遊程仍會留在列表中，顯示為淡色並標示「已排除」；同一個按鈕此時變成「重新計入」，可以把它找回來。',
  'help.guide.move-to-list.tip.1': '標籤屬於單一清單，所以移動或複製的地點抵達時不會帶著標籤。',
  'help.guide.accept-list-invite.step.1':
    '在清單欄的「邀請」下找到邀請。如果你是透過邀請通知進來的，卡片會等在頁面頂部。它會說明清單名稱和邀請來自誰。',
  'help.guide.tour-collection-add-to-trip.tip.1': '新遊程尚未排入任何一天，也不會新增地點。清單和原始遊程都不會改變。',
  'help.guide.tour-collection-manage.step.3': '點擊遊程該列末端的垃圾桶，並用「從收藏中移除」確認。',
  'help.ctx.journey-detail.bullet.7':
    '連接 Dawarich 後，每天的標題還會有「匯入記錄」（或當天保留的路線距離）和「匯入當天」，有待處理停留點的日子會把它們收合成該日末尾的一列。',
  'help.guide.entry-draft.tip.1': '貢獻者仍然看得到草稿；只有公開連結會在你關閉「草稿」之前排除它。',
  'help.guide.journey-map-layers.tip.2':
    '變淡的開關表示還沒有可繪製的內容，提示文字會說明原因。你的選擇會依旅程保存在這個瀏覽器中。',
  'help.guide.journey-keep-route.tip.2':
    '之後點擊當天標題中的距離，可再次與 Dawarich 比較：「取代」會採用新版本，「移除路線」則把這一天從旅程中拿掉。',
  'help.guide.journey-day-stays.tip.2': '遇到事情很多的一天，該列末尾的「匯入當天」可一次處理它的所有停留點。',
  'help.guide.journey-take-over-day.tip.1':
    '在那個按鈕之前不會寫入任何內容，也不會重複寫入：已經在日誌中的停留點會被標記，無法再次選取。',
  'help.guide.journey-auto-prepare.tip.1': '只會準備已連結且有日期的旅行中的日子，而且不會自行把任何內容寫入日誌。',
  'help.guide.photo-location.result': '沒有地點的條目會採用其第一張帶 GPS 的照片的拍攝位置，並出現在地圖上。',
  'help.guide.contributors.tip.2':
    '「透過旅行」列出已連結的旅行所允許的人；他們的存取權限請到那趟旅行的設定中修改，而不是在這裡。',
  'help.ctx.settings-plugins.bullet.2':
    '外掛可以在其卡片上新增「操作」，在你確認後執行；當它代你登入其他服務時，還有「連接」或「中斷連線」。',
  'help.guide.web-push-device.tip.1':
    '推播是依瀏覽器運作的：想讓哪支手機或電腦收到，就在上面重複一次。「為此裝置關閉」只會在該裝置上停止。',
  'help.guide.connect-airtrail.step.2':
    '「允許自簽憑證」只適用於你自己網路中受信任的執行個體。「將變更寫回 AirTrail」預設為關閉，所以 TREK 只讀取；開啟後才會把你的編輯傳回去。',
  'help.guide.connect-dawarich.step.2':
    '「自動檢查新的停留點」讓 TREK 自行查看；關閉時，只有你要求時它才會讀取 Dawarich。「允許自簽憑證」只適用於你的伺服器不信任的執行個體。',
  'help.guide.tour-connect-wanderer.step.2': '只有在你自己網路中的執行個體，才需要開啟「允許自我簽署憑證」。',
  'help.guide.tour-wanderer-watch.step.1': '在 wanderer 卡片中，開啟「檢查我的路線是否有變更」。這需要先儲存連線設定。',
  'help.guide.plugin-settings.title': '為自己設定外掛',
  'help.guide.default-user-settings.tip.2': '「顯示貨幣」只會換算顯示的金額。在「費用」中輸入的金額保持不變。',
  'help.guide.own-routing-engine.step.2':
    '若要避開收費站、高速公路或渡輪的路線，請在「自建 Valhalla 執行個體」下輸入你的 Valhalla 位址。每個欄位在你離開時儲存；然後重新啟動 TREK 伺服器並重新載入頁面。',
  'help.guide.admin-passkeys.tip.3':
    '弄丟了存放 Passkey 的裝置的人，可以在「編輯使用者」中用「重設 Passkey」將它們移除。',
  'help.guide.rotate-jwt-secret.result': '新的簽署密鑰已就位，包括你在內的所有使用者都必須重新登入。',
  'help.guide.read-notifications.title': '閱讀你的通知',
  'help.guide.filter-notifications.title': '查看所有通知，或只看未讀的',
  'help.guide.mark-notifications-read.goal': '在看過新消息後，清除鈴鐺上的色調和數字。',
  'help.guide.delete-notifications.step.1': '點擊通知時間旁的垃圾桶「刪除」，只會移除那一則。',
  'help.guide.notification-settings.step.2': '在選單中點擊「設定」。',
  'help.guide.public-link.tip.3': '將指標移到選項上，可以看到它省略了什麼。',
  'help.guide.link-journal.step.4': '閱讀黃色的提示：它會說明誰將首次獲得這本日誌。然後點擊「連結日誌」。',
  'help.guide.dawarich-stays.step.1':
    '在「設定」的「整合」中連接 Dawarich 後，「來自 Dawarich」會出現在地點列表頂部。它的標題會顯示 TREK 上次檢查的時間以及有多少停留點在等待處理。點擊它即可開啟列表。',
  'help.guide.leave-stop-off-route.step.2':
    '名稱旁會出現「不在路線內」徽章。停靠點仍保留在當天和地圖上，但當天的路線及其各段時間會略過它。',
  'help.guide.move-booking-day.result': '預訂在計畫中屬於新的一天，時間保持不變。',
  'help.guide.clear-day.tip.2': '只有當天有地點時，才會顯示這個選項。',
  'help.guide.place-image-from-file.step.1':
    '開啟一個「檔案」中有照片的地點。卡片底部附近的「檔案」區塊會統計地點有多少檔案。',
  'help.guide.place-own-hours.title': '更正地點的營業時間、電話或電子郵件',
  'help.guide.place-own-hours.tip.1':
    '你輸入的時間優先於查詢到的時間，所以有季節性營業時間的咖啡館會顯示你所知道的資訊。',
  'help.guide.day-panel.tip.3':
    '想依日曆規劃？先在「設定」的「顯示」下開啟「每日標題中日期在前」，標題就會以日期開頭，下方是「第 1 天」或當天的名稱。',
  'help.guide.confirm-stay-booking.result': '旅館預訂已確認，住宿的卡片和「預訂」分頁上都是如此。',
  'help.guide.tour-map-lines.goal': '在地圖上區分旅行的各條遊程、從線條開啟其中一條，並把你現在不需要的從地圖上清除。',
  'help.guide.tour-map-lines.tip.3':
    '每日計畫中遊程那一列選單裡的「從路線中排除」，會阻止當天的路線連到遊程的兩端；「重新加入路線」則再次把它們連起來。',
  'help.guide.car-stops.step.5':
    '停靠點的順序就是路線。停靠點左側的「上移」和「下移」可更改順序，右側的叉號「移除停靠點」則將它移除。',
  'help.guide.transport-details.step.3':
    '下方的方塊給出出發和到達及其車站或機場，設定後還有月台和座位。中間有停靠的行程會在「路線」下列出，逐段預訂的行程則在「各段預訂碼」下列出每段的代碼。接下來是「出行成員」、「筆記」、「費用」和「檔案」；「在檔案中顯示」會在「檔案」分頁開啟票券。',
  'help.guide.export-transports-csv.title': '將交通匯出為試算表',
  'help.guide.group-sort-bookings.step.4':
    '點擊區段標題可將它收合。旁邊的數字顯示裡面有多少預訂，再點一次即可重新展開。',
  'help.guide.booking-on-map.goal': '從預訂直接跳到它在計畫和地圖上的地點。',
  'help.guide.export-bookings-csv.tip.2': '各欄以分號分隔，Excel 開啟檔案時重音符號會完整保留。',
  'help.guide.arrange-packing-list.tip.2':
    'TREK 會在這個瀏覽器中記住「依名稱」，所以下次列表開啟時也是排序好的。它只改變你看到的內容，不會改變其他人看到的順序。',
  'help.guide.count-packed-pieces.step.4': '計數器達到數量後，物品會自動勾選，並算作已打包。',
  'help.guide.expense-receipts.result': '收據會與支出放在一起：其列上的標籤可開啟它，檔案也同時在旅行的「檔案」中。',
  'help.guide.files-sync-settings.step.4':
    '在「當文件被刪除時」下，選擇另一端的副本會怎麼處理。「兩份都保留」會讓儲存庫中的副本留在原處。「移到回收桶」會在文件於 TREK 中被刪除時，把它送到儲存庫的回收桶。',
  'help.ctx.trip-collab.bullet.7':
    '這裡的一切都需要網路連線。離線時，訊息、筆記、連結、投票或投的票不會被儲存，TREK 會顯示「此操作需要連線」。待 TREK 重新上線後再試一次。無權編輯協作的成員可以閱讀所有內容，但看不到「新建筆記」、「新增連結」和「新建投票」，訊息框也呈灰色。',
  'help.guide.manage-notes.step.4':
    '「編輯」會開啟已填好所有內容的筆記對話方塊。修改你需要的部分，這裡是在「內容」下多加一行，然後點擊「儲存」。',
  'help.guide.note-categories.step.2':
    '在底部的「新建分類...」中輸入名稱，按 Enter 或點擊旁邊的加號。新分類會獲得下一個顏色和獨立的一列。',
  'help.guide.note-categories.tip.3': '在卡片上，分類只是標題中的彩色圓點。將指標指向圓點可看到它的名稱。',
  'help.guide.roadtrip-reorder.step.1':
    '拖曳停靠點所在的那一列，放到同一天的另一個停靠點上。它會取代那個停靠點的位置，當天會依新順序重新規劃路線。',
  'help.guide.roadtrip-overnight.step.5':
    '點擊「新增」。從這一天到隔天的住宿就預訂好了，該地點也會作為當天的過夜地加入行車路線。',
  'help.guide.roadtrip-stop-fill.step.3': '若要把停靠點交還給你自己的設定，再次開啟徽章並點擊「使用我的預設值」。',
  'help.guide.roadtrip-bookings.step.3':
    '「入住」或「上車」標籤說明行車必須在何時把你送到站點：出發時間會比時刻表提前固定在那麼早。',
  'help.guide.roadtrip-google-import.title': '從 Google Maps 匯入路線',
  'help.guide.roadtrip-google-import.tip.2': '連結至少需要兩個 TREK 能定位的停靠點，最多 30 個。',
  'help.guide.roadtrip-hazards.tip.1':
    '警告不是封路：路線不會因為它們而改變，而且它們是目前的通知，不是針對你日期的預報。',
  'help.ctx.trip-tours.bullet.4':
    '將指標指向某一列，會出現它的眼睛（「在地圖上隱藏」）和圓形 +（「新增到當天」）。把一列拖到左欄的某一天上即可在那天規劃它，或點擊它在地圖上開啟遊程的卡片。',
  'help.guide.tour-show-list.step.4':
    '卡片顯示遊程的各項數據，並在「旅行日期」下顯示它排在哪些天。若要修改路線本身，請開啟「遊程」分頁，並點擊「這趟旅行的遊程」下的遊程。',
  'help.guide.tour-add-to-day.step.1': '將指標指向列表中的遊程，並點擊該列右側的圓形 +（「新增到當天」）。',
  'help.guide.tour-add-to-day.tip.4':
    '開啟某一天時（點擊它的標題），遊程的卡片也會提供針對那一天的「新增到當天」。天數上方的復原箭頭可取消這次指派。',
  'help.guide.tour-day-times.tip.1': '你輸入的結束時間優先於計算出的時間。',
  'help.guide.tour-remove-from-day.step.2':
    '遊程仍留在右側的列表中。它的日期徽章消失了，篩選器也再次把它歸入「未規劃」。',
  'help.guide.tour-filter-list.step.2':
    '在「狀態」下，選擇「未規劃」查看尚未排入任何一天的遊程，或選擇「計劃中」查看已排入某天的遊程。每一行都會顯示保留了多少條遊程。',
  'help.guide.tour-hide-on-map.goal': '把你現在不需要的遊程從地圖上清掉，而不為其他任何人更改它們。',
  'help.guide.tour-import-plan-tab.goal': '在規劃各天行程時，把 GPX 或 KML 軌跡匯入為遊程。',
  'help.ctx.trip-tour-detail.summary':
    '在「計畫」分頁選擇遊程時，在地圖上方開啟的卡片：它的日期、各項數據和剖面、來源，以及把它帶到手機、複製、保存到收藏或連結到行李清單的按鈕。',
  'help.guide.tour-detail-read.step.1':
    '在右欄頂部，從「地點」切換到「遊程」，然後點擊一條遊程。它的卡片會在地圖上方開啟。每日內該遊程的那一列，或它在地圖上的線條，開啟的是同一張卡片。',
  'help.guide.tour-detail-read.tip.2': '划槳遊程不顯示高度和剖面：它的點位於河岸上，所以高度不會反映真實情況。',
  'help.guide.tour-rename-colour.step.2': '輸入新名稱，並點擊圓形的勾選按鈕，或按 Enter。按 Escape 會保留舊名稱。',
  'help.guide.tour-take-along.step.1':
    '開啟遊程的卡片。底部的「導航」會在地圖應用程式中開啟遊程的起點，有多個應用程式時會先列出它們。它帶你到起點，而不是沿著路線走。',
  'help.guide.tour-copy-keep.title': '複製遊程，或把它保存到收藏',
  'help.guide.tour-copy-keep.tip.3':
    '在「遊程」分頁中，左欄頂部的書籤對開啟的遊程做同樣的事。遊程有未儲存的變更時，它會要求你先儲存遊程。',
  'help.guide.tour-packing-link.step.4':
    '卡片現在顯示清單、其中已打包多少物品、一條進度條，以及最前面的幾個物品。已打包的物品會加上刪除線。',
  'help.guide.tour-files.step.1':
    '開啟遊程的卡片，捲動到末尾的「檔案」。點擊該區段標題中的「上傳」，並選擇一個或多個檔案。',
  'help.guide.tour-activity-link.step.1': '開啟計劃遊程的卡片，捲動到「實際軌跡」。點擊「新增實際軌跡」。',
  'help.guide.tour-activity-link.result': '軌跡已連結到遊程，卡片會並排顯示計畫和你實際做的。',
  'help.guide.tour-activity-compare.tip.2': 'Atlas 中的遊程紀錄會以連結的軌跡取代計劃的數值來計算。',
  'help.guide.tour-origin-check.tip.2':
    '來自 wanderer 的遊程，在其來源旁有一個箭頭「在 wanderer 中開啟」，區段標題中還有「檢查出處」。檢查會詢問 wanderer 路線在匯入後是否有變更。接著「作為新快照匯入」會把新版本帶進來，放在這條遊程旁邊，這條遊程則保留它的日期和筆記。',
  'help.ctx.trip-tour-planner.bullet.4':
    '「新增地點」開啟時（地圖標籤中的「放置點」），點擊地圖會放置一個點。拖曳圖釘可移動它，點擊繪製的路線可在該處新增塑形點，並可用「行程地點」選擇旅行中的地點。',
  'help.guide.tour-open-workspace.step.4':
    '右側欄頂部的加號「新增行程」提供「匯入 GPX 或 KML」、「從 Google Maps 匯入漫步」和「從其他行程引入路線」。開啟遊程時，也有「規劃新遊程」。',
  'help.guide.tour-draw-route.title': '繪製新遊程',
  'help.guide.tour-draw-route.tip.1':
    '「放置點」開啟時，指標是十字準線。關閉它即可拖曳地圖而不新增點。在 3D 中它預設為關閉，因為那裡每次環顧四周都是拖曳。',
  'help.guide.tour-type-profile.step.2':
    '在列表中選擇類型：「健行」、「城市散步 / 觀光」、「跑步」、「單車遊程」、「划槳行程」、「騎馬遊」或「滑雪與冬季」。每個類型都會說明它規劃什麼，選用新類型會重新規劃路線。',
  'help.guide.tour-edit-points.step.1': '把地圖上有編號的圖釘拖到點應該在的位置。路線會經由新位置重新規劃。',
  'help.guide.tour-edit-points.result': '這些點位於你想要的位置，也依你想要的順序，路線也已重新規劃。',
  'help.guide.tour-shaping-points.tip.2': '塑形點不能作為多日遊程某個階段的終點。',
  'help.guide.tour-loop-reverse.tip.1': '遊程成為環線後，「返回起點」會顯示「行程已返回起點」。',
  'help.guide.tour-leg-by-hand.step.3': '若要把它交還給路線規劃器，開啟同一個選單並選擇「重新規劃下一段」。',
  'help.guide.tour-trip-places.step.2':
    '搜尋旅行的地點，或查看「遊程附近」：路線兩公里範圍內的地點，由近到遠排列，每個都附距離。',
  'help.guide.tour-details-times.goal': '為遊程取名稱、加上描述和連結，並在其時間中加入休息。',
  'help.guide.tour-details-times.result': '遊程帶有它的名稱、筆記，以及你為它規劃的時間。',
  'help.guide.tour-save.tip.2': '側欄標題中的「返回遊程清單」會關閉編輯器，有未儲存的變更時會先詢問。',
  'help.guide.tour-edit-saved.step.4':
    '點擊「返回遊程清單」關閉它。有未儲存的變更時，它會先詢問「捨棄遊程中尚未儲存的變更？」',
  'help.guide.tour-summary-profile.step.2': '預估時間旁的資訊圓點說明了它的計算方式。',
  'help.guide.tour-list-manage.goal': '查看旅行的遊程加總起來是多少、把一條排到某一天，並將列表縮小到你需要的內容。',
  'help.guide.tour-list-manage.tip.3':
    '一列上的垃圾桶會刪除遊程。當「計畫」分頁的右欄切換到「遊程」時，會列出同樣的遊程。',
  'help.guide.tour-delete.tip.3': '遊程在「遊程」分頁刪除。垃圾桶只對可以編輯旅行地點的旅伴顯示。',
  'help.guide.tour-saved-elsewhere.tip.1': '「另存為新遊程」會以遊程名稱命名你的副本，後面加上（我的版本）。',
  'help.ctx.trip-tour-import.bullet.4':
    '「可編輯版本」會把匯入變成帶有可移動路點的遊程。「取代匯入」會保留錄製的軌跡，編輯器中的「錄製的軌跡」卡片可帶你回到它。',
  'help.guide.tour-import-gpx.step.5': '點擊「匯入 1 條遊程」（若檔案有三條軌跡，則為「匯入 3 條遊程」）。',
  'help.guide.tour-view-import.goal': '查看匯入遊程匯入時的路線、各項數據和海拔。',
  'help.guide.tour-plan-from-import.title': '從匯入的軌跡規劃可編輯的遊程',
  'help.guide.tour-plan-from-import.tip.3': '划槳或滑雪的匯入，其點之間以直線相連，而不是經過路線規劃。',
  'help.guide.tour-restore-recorded.tip.1': '只有曾經以「取代匯入」重新規劃並儲存的遊程，才有這張卡片。',
  'help.guide.tour-take-over.step.4': '點擊遊程。右側會顯示它的線條、各項數據和它來自的旅行。',
  'help.guide.tour-import-wanderer.goal': '把你自己 wanderer 中的某條路線作為遊程匯入旅行。',
  'help.guide.tour-import-wanderer.tip.4': '「在 wanderer 中開啟」會在你的執行個體上開啟這條路線。',
  'help.ctx.trip-tour-map.bullet.5':
    '在 3D 中，路線貼合在地形上，依坡度著色，並附有概括其等級的圖例，以及從起點到終點跟隨路線的飛越。',
  'help.guide.tour-map-layers.tip.2':
    '「健行」和「騎單車」來自志工伺服器，只有在管理員允許時才會出現。其中一個停止回應時，它的區段會顯示 !，你可以切換到另一張地圖；你的遊程保持不變。',
  'help.guide.tour-along-search.step.5':
    '找到的地點會列出它們離路線的距離，並以各自的顏色繪製在地圖上。星星標示最知名的地點，「已在遊程中」標示已是停靠點的地點。按鈕現在顯示「重新搜尋」。',
  'help.guide.tour-along-add-stop.step.2':
    '「插入位置」會建議最適合這個地點的路段。點擊它可選擇改插入哪兩個停靠點之間，或選擇「作為新終點」。在任何內容改變之前，地圖會以虛線顯示新的路線。',
  'help.guide.tour-3d-terrain.goal': '在真實的地形上查看遊程，並依坡度著色。',
  'help.guide.tour-3d-terrain.tip.2':
    '你選擇的地圖會一起進入 3D，飛拉達、雪道和海上標誌也一樣。編輯遊程時，你可以在地形上拖曳它的點，開啟「放置點」時點擊則會新增一個。',
  'help.guide.tour-3d-flyover.result': '你已從空中看過遊程，從起點到終點，速度是你選擇的。',
  'help.guide.tour-map-overlays.step.3':
    '圖例說明顏色的意思：從「入門」到「野雪」的下坡雪道、「越野滑雪道」、「冬季健行與雪鞋路線」、「雪橇道」，以及「纜車與索道」。「OpenSnowMap 上的完整圖例」會開啟每個符號。按 Escape 關閉。',
  'help.ctx.trip-tour-stages.bullet.1':
    '編輯器中的「天數」可讓開啟的遊程成為「一日遊」或「多日」。改回一日遊時，每個階段終點都會在確認後移除，路線保持不變。',
  'help.guide.tour-multi-day.step.2': '在「天數」下，點擊「多日」。會有提示說明第一個階段終點放在哪裡。',
  'help.guide.tour-multi-day.tip.4':
    '點擊「儲存」後，階段才會被保留。當某項變更會移除已排在旅行某一天的階段時，會有通知說明儲存後將把它從那一天移除。',
  'help.guide.tour-stages-on-days.step.5':
    '每個階段都會顯示它所在的日期。點擊該日期可將階段移到另一天，或選擇「無日期」將它移除。',
  'help.ctx.trip-tour-hike.summary':
    '在「遊程」分頁中開啟的健行或跑步：左邊是編輯器，中間是地圖，右邊是遊程摘要和旅行的其他遊程。健行遵守你允許的步道難度，跑步依你自己的配速計時，兩者都會顯示 OpenStreetMap 記錄的沿途資訊。',
  'help.guide.tour-hike-plan.goal': '開始一次健行，設定它的停靠點，選擇路線可使用的最高步道等級，並儲存它。',
  'help.guide.tour-hike-plan.tip.1':
    '新的健行從 T2（「山區健行」）開始。T3 會加上警告，說明這類小徑可能暴露在險境中，需要腳步穩健且不懼高。',
  'help.guide.tour-hike-trail-details.step.3':
    '徽章會總結：路線有多少是「已知」、「已知最高」等級，以及另外列出的、健行規劃時採用的「路線上限」。',
  'help.guide.tour-hike-round.goal': '讓 TREK 從健行的某個停靠點出發，建議你想要長度的環線。',
  'help.guide.tour-hike-round.tip.2': '接受 1 到 60 公里的距離，並會提供與你的距離相差 20% 以內的環線。',
  'help.guide.tour-hike-compare-ways.result':
    '那一段會沿著你選的路走，健行的其餘部分保持原樣。地圖底部的「已採用道路」有「復原」。',
  'help.guide.tour-ferrata-add.step.3': '點擊「加入行程」。這條飛拉達會作為獨立的一段加在路線末端，兩端各有一個點。',
  'help.guide.tour-run-plan.title': '以自己的配速規劃跑步',
  'help.guide.tour-run-plan.tip.1': '沒有配速就無法儲存跑步。',
  'help.guide.tour-run-ways.step.3': '點擊「路面」，然後點擊列表中的某種路面，只在地圖上繪製這些路段。',
  'help.ctx.trip-tour-walk.bullet.3':
    '散步排到有開始時間的一天後，「路點」頂部的「時間依據」會指出那一天，每個停靠點都會顯示它的到達時間、停留時間以及營業時間的說明。',
  'help.guide.tour-walk-plan.step.4':
    '為停靠點設定「標籤」和「停留時間（分鐘）」。還不知道停留時間時請留空，只是路過的點則輸入 0。',
  'help.guide.tour-walk-sights.goal': '選擇一個主題，沿著散步路線搜尋，並把一個地點收進來作為停靠點。',
  'help.guide.tour-walk-sights.tip.3': '營業時間和網站來自資料來源，主要是 OpenStreetMap。出發前請再確認一下。',
  'help.guide.tour-walk-day-times.tip.1':
    '沒有開始時間時，該行會說明：「請為散步設定這一天的時間，才能看到到達時間和營業時間。」',
  'help.guide.tour-walk-google-import.step.2': '將連結貼到「步行路線的連結」下，並點擊「讀取連結」。',
  'help.guide.tour-walk-check-off.goal': '在當天將停靠點標記為已造訪或已略過，並查看還剩多少路要走。',
  'help.guide.tour-walk-check-off.result': '已造訪的停靠點會被勾選，略過的會加上刪除線，剩餘時間只計算尚未走的部分。',
  'help.guide.tour-bike-profile.goal': '開始一次單車遊程，讓 TREK 依旅遊、公路、碎石或登山模式規劃路線。',
  'help.guide.tour-bike-profile.tip.1': '之後更改設定檔，會為新的設定檔重新規劃整條路線。',
  'help.guide.tour-bike-surfaces.step.2': '卡片標題中的徽章顯示已知為未鋪面的路線比例。',
  'help.guide.tour-bike-mtb-grades.title': '查看登山自行車遊程的步道等級',
  'help.guide.tour-bike-mtb-grades.tip.3': '如果無法讀取等級，卡片會告知。點擊「重試」。',
  'help.ctx.trip-tour-ski.bullet.5':
    '開啟「滑雪與冬季」遊程時，地圖會顯示來自 OpenSnowMap 的雪道，開關旁邊有「雪道圖例」。這一切都是地圖資料：這裡沒有任何內容說明雪道或纜車是否開放、雪況如何，也沒有任何關於雪崩的資訊。',
  'help.guide.tour-ski-plan.step.6': '在「遊程名稱」下為遊程取個名稱，並點擊「儲存」。',
  'help.guide.tour-ski-options.step.1':
    '在「滑雪與冬季」遊程中，路線規劃器的選項位於「項目」下方。你只會看到所選項目會用到的選項：例如「越野滑雪」就沒有「最難的雪道」。',
  'help.guide.tour-ski-options.result': '遊程會在你的限制內重新規劃，「雪道路線」卡片會列出它避開的較難雪道。',
  'help.guide.tour-ski-fix-leg.tip.3': '離線時，路段暫時以直線繪製。關於夏季小徑的灰色一列是備註，不是錯誤。',
  'help.guide.tour-ski-summary.tip.1': '「已避開」列出路線規劃器因為你的「最難的雪道」限制而避開的較難雪道。',
  'help.guide.tour-ski-pistes-layer.step.2': '點擊「雪道圖例」，就是開關旁邊有四個彩色圓點的按鈕。',
  'help.guide.tour-ski-import.step.1':
    '在「遊程」分頁中，點擊「新增行程」（「這趟旅行的遊程」上方的加號），選擇「匯入 GPX 或 KML」並選取檔案。',
  'help.guide.tour-ski-import.tip.3': '你也可以把 GPX、KML 或 KMZ 檔案拖放到「遊程」分頁的任何位置，開啟同樣的預覽。',
  'help.ctx.trip-tour-paddle.bullet.5':
    '「風速」顯示遊程計劃當天起點的預報。「檢查清單」列出已儲存路線上的障礙，以及你對每一項的決定。',
  'help.guide.tour-paddle-setup.step.5':
    '在湖上，「穿越湖泊」決定路線：「直線穿越」最短，「沿岸」則在有風的日子貼近湖岸。',
  'help.guide.tour-paddle-water-route.title': '沿水路規劃路段',
  'help.guide.tour-paddle-water-route.tip.2':
    '路線規劃器繞過堰或穿過船閘的地方，TREK 會自行設一個點並標示為「已偵測」。移動或修改它之後，它就屬於你了。',
  'help.guide.tour-paddle-portage.step.3':
    '點的下方會出現「陸上搬運」卡片，顯示它的長度和額外的分鐘數。點擊它即可開啟。',
  'help.guide.tour-paddle-lock.goal': '在遊程中加入船閘，並計入等待和通過的時間。',
  'help.guide.tour-paddle-lock.result': '船閘已加入遊程並帶有它的分鐘數，「時間估算」會將它們加總。',
  'help.guide.tour-paddle-time.tip.1':
    'TREK 的起始值為水上 4 公里/小時、搬運 2 公里/小時，每個搬運路段 10 分鐘。這些是供你調整的起始值，不是實測值。',
  'help.guide.tour-paddle-wind.step.3':
    '長條顯示一天中的各小時，陣風疊在平均值之後。將指標指向某個長條，可看到那個小時的數值和風向。',
  'help.guide.tour-paddle-checklist.goal': '查看已儲存路線上關於堰、船閘和通行規則的已知資訊，並決定在每一處怎麼做。',
  'help.guide.tour-paddle-checklist.tip.3':
    '標示為「再查一次」的項目，是在路線或資料變更之前做出的決定。請重新決定，或選擇「保留決定」或「移除決定」。不再適用的決定會留在「先前的決定」下。',
  'help.guide.tour-paddle-track-marks.step.3': '點擊「匯入 1 條遊程」。',
  'help.guide.tour-paddle-track-marks.result': '錄製的軌跡帶有它的搬運路段和船閘，其「時間估算」也會計入它們。',
  'help.guide.tour-horse-plan.title': '沿著馬匹路線規劃騎馬行程',
  'help.guide.tour-horse-plan.step.7': '在「遊程名稱」下為騎馬行程取個名稱，然後點擊左欄底部的「儲存」。',
  'help.guide.tour-horse-gap.goal': '接續一個起點離你騎馬行程終點有一段距離的路段。',
  'help.guide.tour-horse-gap.tip.3':
    '起點在你騎馬行程終點 25 公尺以內的路段，會直接從終點接續，「與騎馬遊的銜接」會顯示「接在騎馬遊終點之後」。',
  'help.guide.tour-horse-recorded.tip.1':
    '線條與檔案錄製時完全一致。不會重新規劃任何路線，錄製的騎馬行程也沒有可編輯版本。',
  'help.guide.dateless-trip.result': '卡片會顯示「想法」和「未設定日期」，旅行則有你指定數量的空白天數。',
  'help.guide.trip-reminder.title': '在旅行前收到提醒',
  'help.guide.upcoming-reservations.tip.1': '旅館住宿會出現兩次，一次是入住，一次是退房。',
  'help.guide.half-company-holiday.result': '公司放半天假，當天記錄的休假只扣半天。',
  'help.guide.edit-holiday-calendar.title': '修改或移除假日日曆',
  'help.guide.answer-fusion-request.result':
    '點擊「接受併合並」後，兩份計畫會顯示在同一個表格中，每個人各用自己的顏色。',
  'help.guide.log-for-partner.result': '這些日子會帶有對方的顏色，並計入對方的年假額度，而不是你的。',
  'help.guide.dissolve-fusion.tip.1': '在該視窗中點擊「取消」會維持計畫不變；無論哪種情況，你的項目都會保留。',
  'help.guide.country-places.tip.1':
    '歸在錯誤國家下的地點，通常是位址或座標有誤。從這裡開啟它的旅行，並在那裡修正地點。',
  'help.guide.tour-activity-stats.title': '查看你在遊程中的成果',
  'help.guide.tour-activity-stats.result':
    '對話方塊和「遊程」分頁中的總計不再包含你排除的遊程。它的路線、日期和旅行保持不變。',
  'help.guide.move-to-list.tip.2':
    '移動會把地點從清單中拿走，所以只有清單的擁有者或管理員看得到「移動到清單」。「複製到清單」則適用於任何你能開啟的清單。',
  'help.guide.accept-list-invite.step.2': '點擊「接受」加入，或點擊「拒絕」婉拒。',
  'help.guide.tour-collection-add-to-trip.tip.2': '沒有線條而保存的遊程必須帶著它的路點；對話方塊會說明並替你選好。',
  'help.guide.tour-collection-manage.tip.1': '從清單移除遊程，絕不會影響你已在旅行中據此建立的遊程。',
  'help.guide.entry-draft.tip.2': '從 Dawarich 匯入的一天會以草稿形式出現，所以在分享之前請留意徽章。',
  'help.guide.journey-map-layers.result': '地圖只顯示你想要的圖層，每個圖釘、圓點和線條都可以從圖例中看懂。',
  'help.guide.journey-keep-route.result':
    '當天的標題會顯示距離，路線會以實線繪製在地圖的「記錄」圖層上，旅程中的所有人都看得到。分享連結只有在「記錄的路線」開啟時才會顯示它。',
  'help.guide.journey-day-stays.result':
    '你已決定的停留點會離開該列；你寫下的條目與其他條目一樣位於它的日期上，並照常接受照片和文字。',
  'help.guide.journey-take-over-day.tip.2':
    '草稿不會出現在分享連結中。請加入照片和文字，然後在每則條目中關閉「草稿」。',
  'help.guide.journey-auto-prepare.tip.2': '某天列表按鈕上的圓點表示這一天還不是最終狀態；提示文字會說明原因。',
  'help.ctx.settings-plugins.bullet.3':
    '底部的「外掛活動」按時間由新到舊列出外掛代你執行的每個操作，並附「重新整理」。',
  'help.guide.language-region.tip.3': '「每週開始於」設定每個日期選擇器的第一欄；Vacay 有自己的設定。',
  'help.guide.web-push-device.tip.2': '在 iPhone 和 iPad 上，請先將 TREK 加入主畫面，再從那裡開啟。',
  'help.guide.connect-airtrail.step.3':
    '點擊「儲存」，然後點擊「測試連線」。它會說明找到多少趟航班，徽章會變成「已連線」。',
  'help.guide.connect-dawarich.step.3':
    '點擊「儲存」，然後點擊「測試連線」：它會計算過去 30 天的停留點。連線後，「立即檢查」會馬上查看，右側的「中斷連線」則結束連結。',
  'help.guide.tour-connect-wanderer.step.3':
    '點擊「儲存」，然後點擊「測試連線」。它會說明你可以匯入多少條路線，徽章會變成「已連線」。',
  'help.guide.tour-wanderer-watch.step.2':
    'TREK 最多每天一次讀取你匯入的每條路線的簡短記錄，該列會顯示上次查看的時間。當路線可能有變更時，你會收到通知，「提示」也會計入：點擊「提示」可看到每條遊程標示為「可能已變更」、「已變更」或「無法檢查」，並可從那裡開啟。',
  'help.guide.plugin-settings.goal': '為外掛設定你自己的金鑰和偏好，並查看它以你的名義做了什麼。',
  'help.guide.own-routing-engine.result': '每趟旅行中的路線都在你的伺服器上計算。',
  'help.guide.admin-passkeys.title': '提供 Passkey 登入',
  'help.guide.rotate-jwt-secret.tip.1': '你也會被登出，所以之後請立刻重新登入。',
  'help.guide.notification-defaults.title': '為使用者設定通知預設值',
  'help.ctx.notifications.title': '通知',
  'help.guide.read-notifications.goal': '查看你不在時旅行中發生了什麼，並直接前往處理。',
  'help.guide.filter-notifications.goal': '瀏覽 TREK 告訴你的所有事，或只看你還沒讀的。',
  'help.guide.mark-notifications-read.step.1': '點擊通知時間旁的雙勾號「標為已讀」，只標記那一則。',
  'help.guide.delete-notifications.step.2': '頂部的「全部刪除」會在視窗詢問你是否確定之後，一次清空整個清單。',
  'help.guide.notification-settings.step.3':
    '點擊「設定」側邊欄中的「通知」。它的第一張卡片每個事件各佔一列，「應用程式內通知」欄決定哪些會進入鈴鐺。',
  'help.guide.link-journal.result':
    '旅行的分頁列會出現「日誌」分頁，所有你給予「閱讀」或「編輯」權限的人都能在那裡即時開啟日誌。',
  'help.guide.create-place.tip.4':
    '從 Google 地圖複製的連結在搜尋中也有效：貼上、按 Enter，TREK 就會從中讀取地點。表單有了位置之後，搜尋旁邊的十字準線「這個圖釘附近的地點」會列出周圍的地點。',
  'help.guide.dawarich-stays.step.2':
    '停留點依日期分組，每個都附到達和離開的時間；量表標記表示 Dawarich 不確定的停留點。點擊停留點旁的圖釘「新增為地點」。',
  'help.guide.leave-stop-off-route.step.3': '若要再次納入路線，開啟同一個選單並選擇「重新加入路線」。',
  'help.guide.move-booking-day.tip.1': '多日預訂中間幾天上淡色的列無法拖曳，有中途停留的航班的單一航段也不行。',
  'help.guide.place-image-from-file.step.2':
    '點擊標題中的圓形圖片。由於地點有照片，會出現一個小視窗詢問圖片應該從哪裡來。',
  'help.guide.place-own-hours.goal': '當查詢到的營業時間有誤或缺失時，把你實際確認過的時間放到卡片上。',
  'help.guide.place-own-hours.tip.2': '電話號碼和電子郵件會成為卡片標題中的標籤：點擊會交給你的手機或郵件應用程式。',
  'help.guide.edit-accommodation.tip.3':
    '如果在「設定」的「顯示」下開啟了「模糊預訂程式碼」，確認編號會保持模糊。將游標移上去或點擊即可閱讀。',
  'help.guide.confirm-stay-booking.tip.1': '再次點擊標籤，預訂會回到「待確認」。',
  'help.guide.map-markers.tip.4':
    '在「設定」的「顯示」> 旅行與地圖下開啟「未規劃地點使用精簡標記」後，尚未排入任何一天的地點會變成沒有照片或評分的小圓點。你選擇的地點一律完整顯示。',
  'help.guide.tour-map-lines.step.1':
    '旅行的每條遊程都以其顏色的線條繪製在地圖上，起點處有它的圖釘。為遊程選定的顏色優先；否則線條採用其分類的顏色。',
  'help.guide.car-stops.step.6': '點擊「新增」。',
  'help.guide.transport-details.step.4':
    '點擊標題即可重新命名行程，無需開啟表單。「重新命名」開啟時已填入名稱：輸入新名稱並點擊「儲存」。',
  'help.guide.export-transports-csv.goal': '把旅行的交通匯出為 CSV 檔案，用於試算表、旅行社或列印。',
  'help.guide.group-sort-bookings.result': '預訂會依你選擇的區段和順序排列，這個瀏覽器會為下次造訪記住你的選擇。',
  'help.guide.booking-on-map.step.1':
    '點擊有地點的預訂卡片，地點連結在「地點 / 活動」下，住宿則連結在「住宿」下。它的詳細資訊會開啟。',
  'help.guide.export-bookings-csv.title': '將預訂匯出為試算表',
  'help.guide.export-bookings-csv.tip.3': '只要分頁中有預訂，就會出現這個按鈕。「交通」分頁以同樣方式匯出自己的項目。',
  'help.guide.arrange-packing-list.title': '依你的順序排列行李清單',
  'help.guide.count-packed-pieces.result': '該列會顯示已打包幾件，最後一件放入後物品就會被勾選。',
  'help.guide.expense-receipts.title': '為支出附加收據',
  'help.guide.expense-receipts.tip.1':
    '在編輯器中，點擊列出的檔案名稱會開啟同樣的預覽。這時按 Esc 只會關閉預覽，而不是支出。',
  'help.guide.files-sync-settings.step.5':
    '「當兩邊都有變更時」決定一份在兩處都被編輯的文件保留哪份副本：「詢問我」、「保留 TREK 的副本」或「保留儲存端的副本」。「自動同步」讓 TREK 在背景檢查變更；關閉時，卡片顯示「已暫停」，只有「立即同步」會執行同步。這裡的每項變更在你操作時就已儲存。',
  'help.guide.manage-notes.step.5':
    '「刪除」會先詢問「刪除筆記？」，因為筆記對每位成員都會消失，它的檔案也一併刪除。點擊「刪除」確認。',
  'help.guide.note-categories.step.3': '點擊分類的名稱可重新命名。輸入新名稱並按 Enter；按 Esc 則保留舊名稱。',
  'help.guide.roadtrip-reorder.step.2':
    '若要把停靠點推到另一天，請把它放到那一天卡片中的某個停靠點上。拖曳時，停靠點不足兩個的日子會在側欄末端顯示為虛線卡片，你也可以放到那裡。',
  'help.guide.roadtrip-corridor.tip.4':
    '在篩選器下方，選擇當天的某個停靠點，或「兩者中間」，只保留距該點 25、50 或 100 公里以內的內容。列表中有充電站時，「任意接口」和「任意功率」可依插座和功率縮小範圍。',
  'help.guide.roadtrip-overnight.result':
    '該地點會作為當天的過夜地出現在行車路線上，住宿也像其他預訂一樣記錄在旅行中。',
  'help.guide.roadtrip-stop-fill.result':
    '停靠點會加到你選擇的數值，之後的續航里程（包括任何「此處將耗盡油量」色帶）都從這個數值開始計算。',
  'help.guide.roadtrip-bookings.step.4': '點擊卡片即可開啟預訂。',
  'help.guide.roadtrip-google-import.goal': '把你在 Google Maps 中規劃的路線變成你某一天的停靠點。',
  'help.guide.roadtrip-google-import.tip.3': '匯入需要網路連線，以及同時編輯地點和日期的權限。',
  'help.guide.roadtrip-hazards.tip.2': 'DWD 涵蓋德國，GDACS 回報全球的災害。僅以點位給出的警告會說明其影響範圍未知。',
  'help.ctx.trip-tours.bullet.5':
    '在天數欄中，遊程是像停靠點一樣的一列。有「開始」時間時顯示為 開始 → 結束，結束時間由遊程的時間推算，「更多選項」包含「編輯」、「從當天移除」、「從路線中排除」和「儲存到收藏」。',
  'help.guide.tour-show-list.step.5': '在同一個切換開關中點擊「地點」，即可回到地點列表。',
  'help.guide.tour-add-to-day.step.2': '選擇日期。選單會列出旅行的每一天及其日期和標題；已經有該遊程的那一天會呈灰色。',
  'help.guide.tour-add-to-day.result': '遊程列在它所屬的那一天下，它的線條也成為地圖上那一天的一部分。',
  'help.guide.tour-day-times.tip.2':
    '包含多日遊程其中一個階段的那一天不會有計算出的結束時間，因為遊程的時間是整條路線的時間。',
  'help.guide.tour-remove-from-day.step.3':
    '或者點擊該天的標題開啟當天，點擊列表中的遊程，並點擊其卡片底部的「從當天移除」。',
  'help.guide.tour-filter-list.step.3':
    '當列表混合了多種項目時，「來源」（TREK、GPX 匯入、wanderer）、「路線上限」（T1 到 T6）和「類型」（「健行」、「單車遊程」等）可進一步縮小範圍。再次點擊已勾選的值即可清除。',
  'help.guide.tour-hide-on-map.step.1': '將指標指向列表中的遊程，並點擊該列右側出現的眼睛（「在地圖上隱藏」）。',
  'help.guide.tour-import-plan-tab.step.1': '在「計畫」分頁中，點擊右欄頂部切換開關中的「遊程」。',
  'help.ctx.trip-tour-detail.bullet.1':
    '點擊「遊程」列表中的遊程（先將右欄從「地點」切換到「遊程」）、每日內它的那一列，或它在地圖上的線條，它的卡片就會在地圖上方開啟。卡片開啟時，地圖仍可使用。',
  'help.guide.tour-detail-read.step.2':
    '標題會寫出遊程的名稱，並用標籤總結：遊程的種類、匯入時它的來源、計劃花費的時間、距離、累計爬升和累計下降。',
  'help.guide.tour-detail-read.tip.3':
    '有些遊程帶有更多內容：城市散步有它的站點，划槳遊程有檢查項目和風況，已完成的遊程有它的「實際軌跡」，連結到清單的遊程有它的「行李清單」。',
  'help.guide.tour-rename-colour.step.3':
    '點擊遊程圓形方塊角落的彩色圓點「軌跡顏色」。「軌跡顏色」區段會在標題下方開啟。',
  'help.guide.tour-take-along.step.2':
    '遊程有網頁時，旁邊的按鈕會顯示網站的名稱（Komoot、AllTrails、Outdooractive 或 Wanderer），其他網站則顯示「網站」。它會在新分頁中開啟該頁面。',
  'help.guide.tour-copy-keep.goal': '在這趟旅行中製作遊程的變體，或把它保存到你的某個收藏中，供之後的旅行使用。',
  'help.guide.tour-copy-keep.tip.4':
    '「收藏」只在收藏擴充套件開啟時才有。你只能閱讀的清單無法選擇，還沒有任何清單時，對話方塊會提供「開啟收藏」。',
  'help.guide.tour-packing-link.step.5': '點擊「開啟行李清單」來勾選物品。TREK 會切換到「行李」分頁，停在行李清單上。',
  'help.guide.tour-files.step.2': '下方的一列現在會統計它們的數量，列表也隨之展開。',
  'help.guide.tour-activity-link.step.2': '在「完成於」下，勾選你進行的那一天。若不屬於任何一天，請選擇「無日期」。',
  'help.guide.tour-activity-compare.title': '比較計畫與你實際做的',
  'help.guide.tour-activity-compare.result': '你一眼就能在卡片和地圖上看出這一天與計畫相比進行得如何。',
  'help.guide.tour-origin-check.tip.3': '「未連線 wanderer」表示你的帳戶尚未連接。請在「設定」的「整合」中連接。',
  'help.ctx.trip-tour-planner.bullet.5':
    '地圖頂部的「搜尋地點或地址」會移動地圖。左下角的標籤可在遊程類型提供的地圖之間切換，例如「地形圖」或「衛星影像」，並包含開啟中遊程的開關，例如「放置點」和 3D。',
  'help.guide.tour-open-workspace.step.5':
    '地圖頂部的「搜尋地點或地址」會將地圖移到某個地方，這樣你就能從遊程所在處開始。',
  'help.guide.tour-draw-route.goal': '在地圖上設定新遊程的點，讓 TREK 計算它們之間的路線。',
  'help.guide.tour-draw-route.tip.2':
    '地圖標籤中的「地形圖」或「健行」會顯示小徑，讓你更容易點擊其中一條。離該類型可用的任何道路太遠的點，會收到通知而不是路線。',
  'help.guide.tour-type-profile.step.3':
    '單車遊程會在類型下要求選擇「設定檔」：「旅行」、「公路」、「礫石」或「登山」。其下方的一行說明該設定檔偏好什麼。',
  'help.guide.tour-edit-points.step.2': '點擊「路點」下的一列來選取它的點。它的圖釘會在地圖上突出顯示。',
  'help.guide.tour-shaping-points.title': '用塑形點引導路線',
  'help.guide.tour-shaping-points.tip.3': '騎馬行程中點擊線條不會新增任何東西，因為沒有路線規劃器為它塑形。',
  'help.guide.tour-loop-reverse.tip.2':
    '移除「返回起點」那一列，可再次讓它成為單程遊程。手動繪製的路段在遊程反轉後仍保持手動繪製。',
  'help.guide.tour-leg-by-hand.step.4': '「重新計算下一段」會只為那一段再次詢問路線規劃器，而不動其他路段。',
  'help.guide.tour-trip-places.step.3': '點擊一個地點。它會被加為遊程的新終點，列表保持開啟，方便加下一個。',
  'help.guide.tour-details-times.step.1':
    '左側欄頂部的「遊程名稱」存放名稱。新遊程中，那裡的灰色文字（例如「未命名的健行」）只是預留文字：請輸入你自己的名稱。',
  'help.guide.tour-save.title': '儲存遊程',
  'help.guide.tour-save.tip.3':
    '「儲存」也會等待任何被它拒絕的欄位，例如不是位址的網站。「詳細資訊」會自動展開以顯示它。',
  'help.guide.tour-edit-saved.tip.1': '沒有變更過的遊程，「儲存」會保持灰色。',
  'help.guide.tour-summary-profile.step.3':
    '將指標沿著「海拔剖面圖」移動。它會顯示該處的距離和高度，地圖上有一個圓點標出同一個位置。',
  'help.guide.tour-list-manage.step.1':
    '「行程總覽」位於列表上方。收合時，它會統計遊程數量，以及有多少「計劃中」和「未規劃」；右側的箭頭會展開每種類型各一行，附距離、爬升、下降和時間的加總。',
  'help.guide.tour-list-manage.result': '篩選結果的總計，以及每條遊程都在你想要的那一天。',
  'help.guide.tour-delete.result': '遊程已從列表、地圖和每一天中消失。',
  'help.guide.tour-saved-elsewhere.tip.2':
    '當你在另一台裝置上修改了遊程時也是一樣。你沒有修改過的遊程只會重新載入，並有提示說明。',
  'help.ctx.trip-tour-import.bullet.5':
    '在「設定」的「整合」中連接 wanderer 後，沒有開啟遊程時，「規劃新遊程」旁會有一個 wanderer 按鈕。它會列出你自己的路線供匯入。',
  'help.guide.tour-import-gpx.tip.1': '你也可以從電腦把檔案拖到「遊程」分頁上再放開。會開啟同樣的預覽。',
  'help.guide.tour-view-import.step.1': '在「遊程」分頁的「這趟旅行的遊程」中，點擊帶有「GPX 匯入」徽章的遊程。',
  'help.guide.tour-plan-from-import.goal': '從錄製的軌跡取得可移動的路點，並查看新路線與它貼合的程度。',
  'help.guide.tour-plan-from-import.tip.4': '「騎馬遊」沒有可編輯版本：它會維持騎乘時的樣子。',
  'help.guide.tour-restore-recorded.tip.2': '用「規劃為新遊程」建立的遊程沒有自己的錄製軌跡。它來源的匯入仍在列表中。',
  'help.guide.tour-take-over.step.5': '如果你願意，可在「在本行程中的名稱」下給它另一個名稱。',
  'help.guide.tour-import-wanderer.step.1': '在「遊程」分頁中，沒有開啟任何遊程時，點擊「規劃新遊程」旁的 wanderer。',
  'help.guide.tour-import-wanderer.result': '這條路線成為旅行的一條遊程，並在地圖上作為 wanderer 遊程開啟。',
  'help.guide.tour-map-layers.title': '為遊程選擇地圖',
  'help.guide.tour-map-layers.tip.3':
    '划槳遊程和城市散步只提供「地圖」和「衛星影像」；跑步、滑雪遊程和騎馬行程提供「地圖」、「地形圖」和「衛星影像」。',
  'help.guide.tour-along-search.result': '路線沿途的地點已列在列表中並顯示在地圖上，可以查看了。',
  'help.guide.tour-along-add-stop.step.3': '點擊「新增為停靠點」。旁邊的徽章是繞路的粗略估計，以直線距離測量。',
  'help.guide.tour-3d-terrain.step.1':
    '在「遊程」分頁中開啟遊程，並點擊左下角標籤末端的 3D。地圖會傾斜成立體地形，路線覆蓋在上面。',
  'help.guide.tour-3d-terrain.tip.3':
    '地形需要網路連線：它的高度來自開放的 Mapzen 地形圖磚。划槳遊程以自己的顏色繪製，沒有坡度等級，因為水面是平的。',
  'help.guide.tour-3d-flyover.tip.1': '飛行過程中滾動滾輪可拉近或拉遠；鏡頭會停在圓點上。暫停之前無法拖曳地圖。',
  'help.guide.tour-map-overlays.step.4':
    '在划槳遊程中，標籤改為提供「航標」。點擊它即可在水面上疊加浮標、燈標和港口標誌。',
  'help.ctx.trip-tour-stages.bullet.2':
    '停靠點「更多操作」選單中的「在此結束階段」會在該停靠點結束一個階段。「路點」隨後會為每個階段加上「階段 N」及其距離和時間作為標題，結束階段的停靠點則帶有月亮。',
  'help.guide.tour-multi-day.step.3': '將指標指向第一天結束的停靠點，點擊「更多操作」並選擇「在此結束階段」。',
  'help.guide.tour-multi-day.result': '一條路線及其各階段，每個階段各自測量。點擊「儲存」保存它們。',
  'help.guide.tour-stages-on-days.step.6': '旁邊的箭頭「在規劃器中開啟此階段」，會在編輯器中開啟該階段的遊程。',
  'help.ctx.trip-tour-hike.bullet.1':
    '編輯器頂部的「路線類型」決定路線如何規劃。「健行」沿著不超過「詳細資訊」下「步道最高難度」的小徑行走；「跑步」採用可跑的道路，並要求你的「計畫配速」。',
  'help.guide.tour-hike-plan.step.1': '點擊左欄頂部的「規劃新遊程」。編輯器會以「新遊程」開啟。',
  'help.guide.tour-hike-plan.tip.2':
    'T4 及以上會先詢問「啟用高山路線規劃？」只有在路線可以穿越暴露或沒有標示的地形時才確認；這個詢問每個編輯工作階段只會出現一次。',
  'help.guide.tour-hike-trail-details.step.4': '點擊列表中的某個等級，只在地圖上繪製這些路段。再次點擊則顯示整條路線。',
  'help.guide.tour-hike-round.step.1':
    '開啟健行後，點擊「路點」卡片標題中的「從起點規劃環線」。若要從其他停靠點出發，開啟它的「更多操作」並選擇「從這裡規劃環線」。',
  'help.guide.tour-hike-round.tip.3': '「重新搜尋」會回到距離設定，「取消」則關閉卡片而不更動任何內容。',
  'help.guide.tour-hike-compare-ways.tip.1':
    '只有健行提供這項功能，而且只適用於路線規劃器規劃的路段，不適用於手動繪製的路段。',
  'help.guide.tour-ferrata-add.step.4': '在「路點」中，這兩個點之間的路段會帶有飛拉達的名稱、等級和長度。',
  'help.guide.tour-run-plan.goal': '在可跑的道路上規劃跑步，並依你的配速取得時間。',
  'help.guide.tour-run-plan.tip.2': '爬升、下降和路況的技術難度都不計入時間：它就是距離乘以配速，僅此而已。',
  'help.guide.tour-run-ways.result': '出發前你就知道跑步在哪裡離開柏油路。',
  'help.ctx.trip-tour-walk.bullet.4':
    '「沿途」依「漫步主題」在路線一定距離內尋找景點，「新增為停靠點」則把其中一個依你選擇的位置規劃進散步中。',
  'help.guide.tour-walk-plan.step.5':
    '將「重要程度」設為「普通」、選填或「必去」。對於之後建議的變更必須保留在原位的停靠點，開啟「受保護」，然後點擊「儲存」。',
  'help.guide.tour-walk-sights.step.1':
    '開啟城市散步後，在左欄找到「沿途」，並選擇「漫步主題」：「文化與歷史」、「公園與景觀」、「美食與在地生活」或「綜合」。',
  'help.guide.tour-walk-sights.result': '這個景點成為散步的停靠點，規劃在你選擇的停靠點之間的路線中。',
  'help.guide.tour-walk-day-times.tip.2': '尚未設定停留時間的停靠點，會讓其後的到達時間顯示為最早時間。',
  'help.guide.tour-walk-google-import.step.3': '查看「連結中的站點」。連結沒有提供位置的停靠點會被標記並略過。',
  'help.guide.tour-walk-check-off.step.1': '在「計畫」分頁中，點擊當天的城市散步。它的卡片會在地圖旁邊開啟。',
  'help.ctx.trip-tour-bike.title': '單車遊程',
  'help.guide.tour-bike-profile.step.1': '在「遊程」分頁中，點擊左側欄頂部的「規劃新遊程」。',
  'help.guide.tour-bike-profile.tip.2':
    '設定檔只會引導路線規劃器。它不代表某條路是否能騎：「路面與道路」卡片會顯示路線實際騎在什麼上面。',
  'help.guide.tour-bike-surfaces.step.3':
    '在「路面」下，點擊「礫石」或「自然地面」等列。它的路段會在地圖上亮起。再次點擊該列即可放開。',
  'help.guide.tour-bike-mtb-grades.goal': '在騎乘之前，先看看登山自行車遊程上的步道有多難。',
  'help.guide.tour-bike-mtb-grades.tip.4':
    '把「設定檔」從「登山」切換到別的，等級區段就會消失。路線隨後會為新的設定檔重新規劃。',
  'help.guide.tour-ski-plan.title': '規劃滑雪與冬季遊程',
  'help.guide.tour-ski-plan.tip.1':
    '對於「越野滑雪」，還要選擇「技術」：「傳統式」、「自由式」或「未知」。欄位下方的提示會說明還缺少什麼。',
  'help.guide.tour-ski-options.step.2':
    '開啟「最難的雪道」並選擇你想滑的最高等級，從「入門」到「專家」。預設為「中級」。',
  'help.guide.tour-ski-fix-leg.title': '修正無法規劃的滑雪路段',
  'help.guide.tour-ski-fix-leg.tip.4': '在每個路段都規劃完成之前，「雪道路線」卡片會說明尚無滑雪時間。',
  'help.guide.tour-ski-summary.tip.2':
    '在每個路段都規劃完成之前，「滑雪時間」會一直顯示「未計算」。若想仍為遊程設定時間，請在它的詳細資訊中輸入計劃的總時間。',
  'help.guide.tour-ski-pistes-layer.step.3':
    '圖例依難度顯示下坡雪道、越野滑雪道、冬季健行與雪鞋路線、雪橇道和纜車。「OpenSnowMap 上的完整圖例」會開啟完整的圖例。',
  'help.guide.tour-ski-import.step.2': '在「匯入預覽」中，開啟「匯入為」並選擇「滑雪與冬季」。',
  'help.guide.tour-ski-import.result': '這條軌跡位於「這趟旅行的遊程」中，其「滑雪軌跡」卡片上有它的項目和技術。',
  'help.ctx.trip-tour-paddle.bullet.6':
    '欄位底部的那一列「划槳有風險」會開啟「水上安全」。地圖提供「地圖」和「衛星影像」，並有「航標」疊加圖層。',
  'help.guide.tour-paddle-setup.step.6':
    '「划槳速度」會以灰色顯示船的建議值。輸入你自己的速度後，欄位會顯示「自訂速度」；其下方的連結「使用建議值」會再次採用船的速度。',
  'help.guide.tour-paddle-water-route.goal': '讓 TREK 沿著河流或湖泊規劃路段，並看懂它無法規劃的路段告訴你什麼。',
  'help.guide.tour-paddle-water-route.tip.3':
    '已規劃路段下方的備註會標示「急流」及其等級、「獨木舟通道」，或以直線銜接的「地圖資料缺口」。',
  'help.guide.tour-paddle-portage.step.4':
    '在「路線」下，「沿道路」會沿著已標示的道路搬運，「直線」則直接穿越。TREK 會自行尋找路徑，若沒有不必繞遠路的路徑，也會說明。',
  'help.guide.tour-paddle-lock.step.1': '將指標指向船閘處的停靠點，並點擊「更多操作」，就是那三個點。',
  'help.guide.tour-paddle-time.title': '閱讀並調整划槳遊程的時間',
  'help.guide.tour-paddle-time.tip.2': '水流和風不計入估算。',
  'help.guide.tour-paddle-wind.step.4': '開啟「風對划槳的影響」，了解逆風、側風、開闊水域橫渡和陣風對船的影響。',
  'help.guide.tour-paddle-checklist.step.1':
    '儲存划槳遊程，然後在左欄找到「檢查清單」。它標題中的徽章總結了清單的進度。',
  'help.guide.tour-paddle-checklist.tip.4':
    '障礙來自 TREK 所持有地區的 OpenStreetMap 資料。沒有資料的地方，卡片會說明，你需要自己檢查堰、船閘和搬運路段。',
  'help.guide.tour-paddle-track-marks.step.4':
    '在「這趟旅行的遊程」中點擊該軌跡。左欄會顯示錄製時的樣子，並附有「陸上搬運與船閘」卡片。',
  'help.ctx.trip-tour-horse.title': '騎馬行程',
  'help.guide.tour-horse-plan.goal': '在地圖檢視中，用有路標的馬匹路線的路段組成一次騎馬行程。',
  'help.guide.tour-horse-plan.result':
    '騎馬行程會沿著你採用的路段前進，每段都有其路線名稱、通行圓點和長度，並列在「這趟旅行的遊程」下。',
  'help.guide.tour-horse-gap.step.1':
    '行程中已有一個路段時，開啟另一條路線並選擇一個不接觸你行程終點的路段。在「與騎馬遊的銜接」下，會有提示說明兩者相距多遠。',
  'help.guide.tour-horse-recorded.title': '保留 GPX 檔案中的已記錄騎馬行程',
  'help.guide.tour-horse-recorded.tip.2': '沒有高度的檔案會顯示「檔案中沒有海拔」，而不是爬升為零。',
  'help.guide.dateless-trip.tip.1':
    '確定出發時間後，點擊卡片上的鉛筆開啟表單，選好日期。你已規劃的天數會維持原有順序，並依序套用這些日期。',
  'help.guide.trip-reminder.goal': '在出發前幾天收到提醒。',
  'help.guide.upcoming-reservations.tip.2': '「待確認」代表尚未確認的預訂。已取消的預訂和已封存的旅行不會列出。',
  'help.guide.half-company-holiday.tip.1': '當天已登記的休假會縮減為半天。之後才登記那一天的人，也只會扣 0.5 天。',
  'help.guide.edit-holiday-calendar.goal': '重新命名、更改顏色、移動或刪除你新增的公共假期或學校假期日曆。',
  'help.guide.person-color.title': '更改某人的顏色',
  'help.guide.answer-fusion-request.tip.1': '在你回覆之前，請求會一直保留。如果有多個請求，會一個接著一個顯示。',
  'help.guide.log-for-partner.tip.1': '「半天」和「補休 / 彈性」對選取的對象同樣適用。',
  'help.guide.dissolve-fusion.tip.2': '如果只是想讓對方看到你的日期，請改為分享你的日曆。',
  'help.guide.country-details.tip.2': '點擊「地點」徽章，就能看到該國家計入的所有地點，並依旅行分組。',
  'help.guide.country-places.tip.2': '只有國家本身有地點時，才會出現這個徽章。只用手動標記的國家沒有地點。',
  'help.guide.tour-activity-stats.goal':
    '查看你所有旅行中，在指定期間和類型下完成的遊程距離、爬升與數量，並排除沒有成行的遊程。',
  'help.guide.tour-activity-stats.tip.1':
    '遊程要等最後一天結束後才會計入。沒有排在任何一天，或只排在沒有日期的日子上的遊程，永遠不會計入。想要計入的話，請把它排到旅行中有日期的某一天。',
  'help.guide.move-to-list.result': '地點已出現在另一個清單中，並有一則簡短提示告訴你移動或複製了幾個。',
  'help.guide.accept-list-invite.tip.1':
    '你在清單上能做什麼，取決於擁有者給你的角色：「檢視者」、「編輯者」或「管理員」。',
  'help.guide.tour-collection-add-to-trip.title': '把清單中的遊程加入旅行',
  'help.guide.tour-collection-add-to-trip.tip.3':
    '若要把遊程留在清單中，請在旅行裡開啟已儲存的遊程，然後點擊頁尾的「收藏」。',
  'help.guide.tour-collection-manage.tip.2': '只有清單的擁有者和管理員看得到垃圾桶。',
  'help.guide.entry-draft.result': '條目會留在你的時間軸中並標示為「草稿」，不會顯示在分享連結上。',
  'help.guide.journey-map-layers.title': '選擇旅程地圖要顯示的內容',
  'help.guide.journey-keep-route.title': '保留你在某一天錄下的路線',
  'help.guide.journey-day-stays.title': '依 Dawarich 記錄的停留點撰寫條目',
  'help.guide.journey-take-over-day.title': '匯入整個已記錄的一天',
  'help.guide.journey-take-over-day.result':
    '這一天會為每個停留點或合併後的群組各建立一則草稿，或只建立一則當日記述，這些停留點也不再列為待處理。',
  'help.guide.journey-auto-prepare.result': '已連結的旅行進行期間，每天的停留點會列在該天底下，隨時可以「匯入當天」。',
  'help.ctx.settings-about.title': '關於',
  'help.guide.web-push-device.tip.3':
    '推播需要透過 HTTPS 開啟 TREK。如果通知被封鎖，請到瀏覽器設定中允許，然後再試一次。',
  'help.guide.connect-airtrail.result': '徽章顯示「已連線」，旅行的「交通」分頁也會出現「從 AirTrail 匯入」。',
  'help.guide.connect-dawarich.result': '徽章顯示「已連線」，旅行規劃器、日誌和 Atlas 都能使用 Dawarich 記錄的內容。',
  'help.guide.tour-connect-wanderer.result':
    '徽章顯示「已連線」，旅行的「遊程」分頁就能搜尋你的 wanderer 並匯入其中的路線。',
  'help.guide.tour-wanderer-watch.result':
    'TREK 會留意你匯入的路線，其中一條可能有變動時會通知你。你接受變更之後，遊程才會跟著改變。',
  'help.guide.plugin-settings.step.1':
    '在設定側邊欄中開啟「外掛」。「外掛設定」下方，每個需要你提供設定的外掛都有一張卡片，上面有各項欄位：填寫後點擊「儲存」。卡片上的操作會在你確認後執行。',
  'help.guide.profile.step.3': '點擊卡片底部右側的「儲存資料」。',
  'help.guide.default-user-settings.title': '設定新使用者的初始設定',
  'help.guide.own-routing-engine.tip.1':
    '公用的 OSRM 伺服器大約每秒只允許一次請求。規劃一天的行程夠用，但用在公路旅行可能會太慢。',
  'help.guide.admin-passkeys.goal': '讓使用者用指紋、臉部辨識或裝置 PIN 碼登入。',
  'help.guide.rotate-jwt-secret.tip.2':
    '如果只想讓某一個人登出，請在「編輯使用者」中給他「新密碼」。這只會結束他的工作階段。',
  'help.guide.notification-defaults.goal': '決定每位使用者的通知一開始如何設定，並可針對某個事件完全封鎖某個管道。',
  'help.ctx.notifications.summary':
    'TREK 在應用程式內通知你的所有內容，最新的在前：有人更改的預訂、旅行聊天室的新訊息、與你分享的日曆。右上角的鈴鐺顯示最新的十則，這個頁面則顯示全部。',
  'help.guide.read-notifications.step.1': '點擊右上角的鈴鐺。鈴鐺上的紅色數字是你尚未閱讀的通知數量。',
  'help.guide.filter-notifications.step.1': '點擊右上角的鈴鐺。',
  'help.guide.mark-notifications-read.step.2': '點擊頂部的「全部標為已讀」，一次把所有通知標為已讀。',
  'help.guide.delete-notifications.tip.1': '刪除只會移除你自己的通知。通知所指的預訂、訊息或分享內容都不會受影響。',
  'help.guide.notification-settings.tip.1': '格子裡出現鎖頭，表示管理員已對所有人關閉該事件。',
  'help.guide.add-guest.tip.3':
    '只有旅行的擁有者可以新增、重新命名和移除訪客。替某筆支出付過款的訪客無法移除，除非你先更換付款人或刪除該筆付款。',
  'help.guide.link-journal.tip.1': '你只能連結自己擁有的日誌。你只有撰寫權限的日誌無法連結。',
  'help.ctx.trip-places.bullet.7':
    '搜尋旁邊的勾選框會開始選取。使用欄位底部的列，可以一次為多個項目指定新分類、加入收藏、標記為已造訪或刪除。',
  'help.guide.filter-places.step.5':
    '旅行涵蓋多個國家或地區後，地球儀可以把列表篩選成單一國家，或其中的某個地區，每一項都附有數量。「清除篩選」會回到「所有國家」。',
  'help.guide.import-places-file.tip.3':
    '遊程開啟時（預設就是開啟），檔案要透過欄位頂部的「遊程」和「匯入 GPX 或 KML」來匯入，檔案中的線條會成為遊程。檔案中的圖釘不會在那裡匯入，因為遊程只包含線條。',
  'help.guide.dawarich-stays.step.3':
    '確認「名稱」、「抵達」和「離開」，選擇「日期」或保持「尚未安排在任何一天」，需要的話加上「筆記」，然後點擊「新增地點」。',
  'help.guide.leave-stop-off-route.result':
    '這個停靠點仍屬於當天，也會出現在 PDF 中。標示為「不在路線內」期間，路線會直接從它前一個停靠點連到後一個。',
  'help.guide.move-booking-day.tip.2': '在所屬的那一天內，有時間的預訂一律會移回自己的時間所對應的位置。',
  'help.guide.place-image-from-file.step.3':
    '在「從附加檔案選擇」下，點擊你要的照片。如果想從電腦選一張新的，請點擊上方的「從裝置上傳」。',
  'help.guide.place-own-hours.step.1': '開啟地點，點擊卡片右下角的「編輯」，地點的表單就會開啟。',
  'help.guide.place-own-hours.tip.3': '點擊「移除營業時間」，再點擊「更新」，卡片就會恢復顯示自動查到的營業時間。',
  'help.guide.confirm-stay-booking.title': '確認住宿預訂',
  'help.guide.confirm-stay-booking.tip.2': '每一筆預訂都能用同樣的標籤，包括當天「預訂」下的那些。',
  'help.guide.map-lock.tip.2':
    '這個瀏覽器會記住每趟旅行的鎖定狀態。開啟旅行時，地圖仍會先縮放到該趟旅行一次，所以不會停在空白區域。',
  'help.guide.tour-map-lines.step.2':
    '點擊線條或它起點的圖釘。遊程卡片會在地圖下半部上方開啟，線條也會加粗並加上白色邊框，讓你在其他線條中一眼認出。卡片標題的 X 可關閉卡片。',
  'help.guide.car-stops.title': '規劃沿途有停靠點的行車',
  'help.guide.car-stops.result':
    '行車在「交通」分頁上是一張卡片，在它所屬的那一天是一列。它在地圖上的線條從取車處出發，依序經過每個停靠點，最後到還車處。',
  'help.guide.transport-details.step.5':
    '詳細資訊底部的「在地圖上」會顯示該段行程的線條，並帶你到它所在那一天的「計畫」。最右邊的「編輯」會開啟完整表單，旁邊的垃圾桶會在你確認後刪除該段行程。',
  'help.guide.export-transports-csv.step.1':
    '如果只想匯出一部分，請先縮小列表範圍。「搜尋」、「篩選」和「檢視選項」下的排序都會生效：檔案內容和順序都與分頁上顯示的一致。',
  'help.guide.group-sort-bookings.tip.1':
    '「卡片」和「清單」各自保留自己的分組：卡片預設從「狀態」開始，清單從「日期」開始。「檢視選項」上的圓點表示有設定與預設不同，面板底部的「重設檢視」可恢復預設。',
  'help.guide.booking-on-map.step.2': '點擊詳細資訊底部的「在地圖上」。',
  'help.guide.export-bookings-csv.goal': '把旅行的預訂匯出為 CSV 檔，可用 Excel、Numbers 或其他試算表開啟。',
  'help.guide.arrange-packing-list.goal': '把整份清單和單一物品移到你想要的位置，或依名稱順序查看每份清單。',
  'help.guide.check-off-packing.tip.4':
    '數量大於一的物品，也可以一件一件勾選已打包的件數。請參閱「一項物品打包多件」。',
  'help.guide.count-packed-pieces.tip.1': '勾選方框會一次打包所有件數，取消勾選則會全部取消打包。',
  'help.guide.expense-receipts.goal': '把收據或發票與所屬的支出放在一起，並可隨時從帳本再次開啟。',
  'help.guide.expense-receipts.tip.2':
    '收據旁的垃圾桶會在你儲存時，把收據從支出中移除。檔案本身仍留在「檔案」中，要完全刪除，請到那裡刪除。',
  'help.guide.files-sync.tip.4':
    '如果卡片出現帶有「重新連線」的黃色提示，表示儲存空間已不再接受先前儲存的登入資訊。點擊「重新連線」，輸入新的應用程式密碼或權杖，同步就會恢復。',
  'help.guide.files-sync-settings.result':
    '從下次執行起，旅行只會依你選擇的方向同步，刪除和衝突的編輯則依你設定的規則處理。',
  'help.guide.manage-notes.result':
    '筆記會從「筆記」卡片中消失，所有成員同時生效。你只是置頂或修改過的筆記會保留，其他人看到的是你修改後的樣子。',
  'help.guide.note-categories.step.4':
    '一列中的色點用來設定該分類的顏色：靛藍、紅色、琥珀色、翠綠、藍色或紫羅蘭。這裡「住宿」變成了琥珀色。',
  'help.guide.roadtrip-reorder.step.3':
    '使用鍵盤時，先聚焦在某個停靠點，再按住 Alt 並按上或下方向鍵，就能把它在當天內移動一個位置。',
  'help.guide.roadtrip-overnight.title': '在路線沿途過夜',
  'help.guide.roadtrip-overnight.tip.1':
    '這一晚會住到隔天。如果要換成其他日期，請修改預訂：在「天」下連同其餘住宿資訊一起更改日期。',
  'help.guide.roadtrip-stop-fill.tip.1':
    '只有你的車能補給的停靠點才會顯示這個徽章：「燃油」車顯示加油站，「電動」車顯示充電站，「兩者」則兩種都顯示。',
  'help.guide.roadtrip-bookings.result':
    '每筆已預訂的交通都會出現在行車路線中實際發生的位置，它前後的路段則分別連到它的起訖站點。',
  'help.guide.roadtrip-google-import.step.1': '點擊「路線途中」頂部的三個點，然後選擇「匯入 Google Maps 路線」。',
  'help.guide.roadtrip-hazards.title': '在地圖上顯示目前的警示',
  'help.guide.roadtrip-hazards.tip.3':
    '資料每十分鐘更新一次，而且需要網路連線。和其他駕駛設定一樣，這個開關會儲存在該趟旅行中。',
  'help.ctx.trip-tours.bullet.6': '更改路線和刪除遊程，都要在「遊程」分頁的「這趟旅行的遊程」下進行。',
  'help.guide.tour-show-list.tip.1': '點擊地圖上遊程的線條，列表就會標示該遊程並捲動到它。',
  'help.guide.tour-add-to-day.step.3':
    '出現「已加入第 10 天」表示成功。該列會多出日期徽章，左欄的那一天也會列出這個遊程及其時間、距離和爬升。',
  'help.guide.tour-day-times.title': '為遊程設定當天的開始時間',
  'help.guide.tour-day-times.tip.3':
    '同一個選單中的「從路線中排除」會讓遊程留在當天，但不納入地圖上當天的路線。「重新加入路線」可以還原。',
  'help.guide.tour-remove-from-day.tip.1': '多日遊程要一天一天地移除，因為每一天都有自己的階段。',
  'help.guide.tour-filter-list.step.4':
    '關閉選單。按鈕現在會顯示狀態、剩餘的遊程數量，以及你每多設定一個篩選條件就加 +1。',
  'help.guide.tour-hide-on-map.step.2':
    '遊程的線條會從地圖上隱藏。該列仍留在列表中，顯示為淡色，並出現一個劃掉的眼睛（「在地圖上顯示」），點擊即可重新顯示線條。',
  'help.guide.tour-import-plan-tab.step.2': '點擊列表頂部的「匯入 GPX 或 KML」，選擇你的檔案（GPX、KML 或 KMZ）。',
  'help.ctx.trip-tour-detail.bullet.2':
    '標題區有遊程的圓形圖示、名稱（旁邊的鉛筆可重新命名）、代表線條顏色的色點，以及類型、來源、計劃時間、距離、累計爬升和累計下降的標籤。右側的 X 可關閉卡片，按 Escape 也可以。',
  'help.guide.tour-detail-read.step.3': '將游標停在時間上，可看到它的組成：移動時間、休息時間和計劃的總時間。',
  'help.guide.tour-detail-read.tip.4':
    '這張卡片不會更改路線。要移動某個點或重畫某一段，請開啟「遊程」分頁，點擊「這趟旅行的遊程」下的那個遊程。',
  'help.guide.tour-rename-colour.step.4':
    '選擇一種顏色。第一格「自動顏色」會讓線條恢復預設顏色，最後一格「選擇自定義顏色」可以選用任何顏色。地圖上的線條和「遊程」列表中的色條會立即跟著改變。',
  'help.guide.tour-take-along.step.3':
    '點擊 GPX，就能把已儲存的遊程下載成 GPX 檔：內含完整路線和高度資料，可直接用於導航 App 或 GPS 裝置。',
  'help.guide.tour-copy-keep.step.1':
    '開啟遊程的卡片，點擊底部的「複製」。TREK 會建立一個全新、獨立且不含日期的遊程，原本的遊程維持不變。',
  'help.guide.tour-copy-keep.result':
    '旅行裡多了第二個可以隨意修改的遊程，收藏中也有它自己的副本，隨時可以加入另一趟旅行。',
  'help.guide.tour-packing-link.tip.1':
    '這只是一個連結，不會複製或移動任何東西，物品仍留在「行李」中。在那裡勾選一項，遊程會立刻同步顯示。',
  'help.guide.tour-files.step.3': '點擊檔案即可開啟。',
  'help.guide.tour-activity-link.step.3': '在「軌跡」下選擇錄下的記錄，或點擊「匯入 GPX」匯入新檔案。',
  'help.guide.tour-activity-compare.goal': '查看實際軌跡與計畫的差異，並可更換或取消關聯。',
  'help.guide.tour-origin-check.title': '查看遊程的來源',
  'help.guide.tour-origin-check.result': '你會知道這個遊程來自哪裡、是什麼時候來的，以及之後有沒有被更改過。',
  'help.ctx.trip-tour-planner.bullet.6':
    '未儲存的草稿會被保留：再次開啟「遊程」分頁時會自動還原，並標示「已還原尚未儲存的草稿」。「返回遊程清單」和「捨棄」在放棄變更前都會先詢問。',
  'help.guide.tour-open-workspace.step.6':
    '左下角的標籤用來切換地圖，一開始是「地圖」或「衛星影像」。開啟遊程後，它會提供該類型的地圖，例如「地形圖」或「健行」，以及「放置點」和 3D 等開關。',
  'help.guide.tour-draw-route.step.1':
    '點擊左側欄頂部的「規劃新遊程」。側欄會變成「新遊程」，除非你另外選擇類型，否則預設是健行。',
  'help.guide.tour-draw-route.tip.3':
    '如果草稿有未儲存的變更，「新增行程」選單中的「規劃新遊程」會先詢問「開始新的遊程？」，並提供「放棄並開始」。',
  'help.guide.tour-type-profile.step.4': '路線會依所選的設定檔重新規劃，右側的「遊程摘要」會顯示它的距離和時間。',
  'help.guide.tour-edit-points.step.3': '要更改順序，請將游標移到某一列上，拖曳它左邊緣出現的握把。',
  'help.guide.tour-shaping-points.goal': '把路線拉到另一條路徑上，而不新增停靠點。',
  'help.guide.tour-shaping-points.result': '路線會沿著你拖過去的位置走，停靠點的編號與之前相同。',
  'help.guide.tour-loop-reverse.tip.3': '健行時，旁邊的「從起點規劃環線」會依你選定的長度尋找環線健行路線。',
  'help.guide.tour-leg-by-hand.tip.1': '手動繪製的路段沒有經過路線規劃器檢查，可能會穿過水域、私人土地或懸崖。',
  'help.guide.tour-trip-places.step.4':
    '它那一列的名稱下方會顯示「行程地點」。「更多操作」中的「解除與地點的連結」會保留該點，但移除連結。',
  'help.guide.tour-details-times.step.2': '在「詳細資訊」下填寫「描述」，有的話也可以加上「網站」。',
  'help.guide.tour-save.goal': '把畫好的遊程保存在旅行中。',
  'help.guide.tour-save.result': '遊程已儲存在旅行中，隨時可以排到某一天。',
  'help.guide.tour-edit-saved.tip.2':
    '匯入的 GPX 或 KML 軌跡會以「GPX 遊程」開啟，僅供查看。在那裡使用「規劃可編輯版本」，就能得到可以修改的遊程。',
  'help.guide.tour-summary-profile.step.4': '標題旁的箭頭「收合海拔剖面圖」可以收起剖面圖，再點一次即可重新顯示。',
  'help.guide.tour-list-manage.step.2': '將游標移到某個遊程上，點擊該列的圓形加號「新增到當天」，即可開啟旅行的各天。',
  'help.guide.tour-delete.title': '刪除遊程',
  'help.guide.tour-saved-elsewhere.title': '遊程在別處被儲存時',
  'help.guide.tour-saved-elsewhere.result': '除非有人選擇捨棄，否則不會遺失任何變更。',
  'help.guide.tour-import-gpx.title': '把 GPX、KML 或 KMZ 檔匯入為遊程',
  'help.guide.tour-import-gpx.tip.2': '檔案中的每條軌跡或路線都會成為各自獨立的遊程，軌跡不會被合併。',
  'help.guide.tour-view-import.step.2':
    '左欄會以「GPX 遊程」顯示：「遊程摘要」附有距離、高度和錄製時間，下方是海拔剖面圖。地圖上會畫出它的線條。',
  'help.guide.tour-plan-from-import.step.1':
    '在「遊程」分頁中開啟匯入的遊程，然後在左側的「可編輯版本」卡片中點擊「規劃可編輯版本」。',
  'help.guide.tour-plan-from-import.result': '遊程現在有可以拖曳的路點，「來源」顯示「已重新規劃，記錄的軌跡已保留」。',
  'help.guide.tour-restore-recorded.result': '遊程再次成為 GPX 遊程，並顯示錄製時的線條。',
  'help.guide.tour-take-over.step.6': '點擊「引入」。',
  'help.guide.tour-import-wanderer.step.2':
    '在「搜尋步道」中輸入關鍵字。「搜尋這個地圖範圍」只會顯示位於目前地圖可見範圍內的步道。',
  'help.ctx.trip-tour-map.title': '遊程地圖',
  'help.guide.tour-map-layers.goal':
    '在最適合該類型遊程的地圖上規劃：用等高線看爬升、用標示的步道或單車路線，或是用空拍影像。',
  'help.guide.tour-along-search.title': '尋找遊程沿途的地點',
  'help.guide.tour-along-search.tip.1':
    '更改路線、類型或距離後，「重新搜尋」會反白，並說明目前的列表是依先前的路線找到的。點擊它即可更新列表。',
  'help.guide.tour-along-add-stop.step.4':
    '路線會重新規劃並經過該地點，「沿途」會說明遊程增加了多少距離和時間。同一行的「復原」可再次移除這個停靠點。',
  'help.guide.tour-3d-terrain.step.2':
    '路線會依坡度著色。點擊底部那一列的「坡度」，可改用遊程本身的顏色繪製，再點一次則恢復坡度顏色。',
  'help.guide.tour-3d-flyover.title': '沿著遊程飛越',
  'help.guide.tour-3d-flyover.tip.2':
    '要等整條路線沿途的地形都載入後，飛越才會開始，所以不會在半途停下來載入地圖資料。將游標停在圓環上，可看到載入進度。',
  'help.guide.tour-map-overlays.result': '雪道或航標會畫在地圖上，圖例會說明如何閱讀。',
  'help.ctx.trip-tour-stages.bullet.3':
    '「遊程摘要」在「階段」下列出每個階段，從起點停靠點到終點停靠點。點擊某個階段會選取它的最後一個停靠點，並在海拔剖面圖中標出該位置。',
  'help.guide.tour-multi-day.step.4':
    '「路點」現在分成「階段 1」和「階段 2」，各附距離和時間。結束某個階段的停靠點會帶有月亮圖示。',
  'help.guide.tour-stages-on-days.title': '把多日遊程排到旅行的各天',
  'help.guide.tour-stages-on-days.tip.1':
    '如果旅行在最後一個階段之前就結束，選項會說明最多可以排到哪個階段，之後的階段則不會排入任何一天。',
  'help.ctx.trip-tour-hike.bullet.2':
    '「路點」依序列出停靠點。「新增地點」一開始就是開啟的，所以點擊地圖就會放置下一個點。旁邊的「行程地點」可把旅行中的山屋或旅館變成停靠點。',
  'help.guide.tour-hike-plan.step.2': '開啟「路線類型」並選擇「健行」：以步行為主，並符合你設定的難度。',
  'help.guide.tour-hike-plan.tip.3':
    '難度下方的「路線偏好」可設定路線的取捨：「避開陡坡」、「避開階梯」和「避開渡輪」。如果沒有其他路可走，路線仍會經過那裡。',
  'help.guide.tour-hike-trail-details.step.5':
    '點擊「路面」，就能依你走過的地面來看同一條路線，從柏油路到自然地面和岩石都有。',
  'help.guide.tour-hike-round.step.2':
    '「環線健行」卡片會在地圖上方開啟。在「來自」下確認起點，並輸入你想要的「距離」。旁邊的標籤會顯示環線可能的長度範圍。',
  'help.guide.tour-hike-compare-ways.title': '比較健行某一段的其他路線',
  'help.guide.tour-hike-compare-ways.tip.2':
    '如果路線規劃器找不到其他路線，卡片會告訴你。如果它無法沿著你選的路線走，該段會維持原樣，卡片也會告訴你。',
  'help.guide.tour-ferrata-add.step.5':
    '右側的「遊程摘要」會顯示附有等級的「岩釘路線」徽章，編輯器標題則會提醒「路線經過岩釘路線」。',
  'help.guide.tour-run-plan.step.1': '點擊「規劃新遊程」，開啟「路線類型」並選擇「跑步」。',
  'help.guide.tour-run-plan.tip.3': '如果你的距離單位是英里，配速也會以每英里計算。',
  'help.guide.tour-run-ways.tip.1': '這裡的任何設定都不會改變跑步的路線或時間。',
  'help.ctx.trip-tour-walk.bullet.5':
    '「這趟旅行的遊程」中的「新增行程」可以匯入從 Google Maps 分享的步行路線。在「計畫」分頁中，從某一天開啟的散步，可讓你在當天勾選它的停靠點。',
  'help.guide.tour-walk-plan.step.6':
    '右側的「遊程摘要」會顯示「預估時間」、「停留點」和「計劃中」，後者是前兩者的總和。點擊左欄底部的「儲存」即可保存這次散步。',
  'help.guide.tour-walk-sights.step.2':
    '主題會自動填入「要找什麼」。開啟後可勾選或取消各種類型，並在「距路線的範圍」下設定要找多遠。',
  'help.guide.tour-walk-day-times.title': '查看當天的抵達時間和營業時間',
  'help.guide.tour-walk-day-times.tip.3':
    '營業時間來自 OpenStreetMap，或來自該停靠點對應的行程地點，旁邊的標籤會說明是哪一個。出發前請再確認一次。',
  'help.guide.tour-walk-google-import.step.4':
    '點擊「作為漫步載入」。TREK 會自行規劃停靠點之間的步行路線。點擊「儲存」即可保存這次散步。',
  'help.guide.tour-walk-check-off.step.2':
    '捲動到「漫步站點」。每個停靠點都會顯示停留多久，如果這次散步有設定開始時間，也會顯示你幾點抵達。',
  'help.ctx.trip-tour-bike.summary':
    '在「遊程」分頁的編輯器中開啟的單車遊程：包括路線所依據的設定檔、騎乘時間、路線經過的路面類型，以及登山自行車遊程中步道的難度等級。',
  'help.guide.tour-bike-profile.step.2': '開啟「路線類型」欄位並選擇「單車遊程」。',
  'help.guide.tour-bike-profile.tip.3':
    '如果某個點附近沒有單車可通行的道路，側欄會顯示「沒有適合單車的道路通往第 N 點」。請移動該點，或開啟前一個點的「更多操作」並選擇「手動繪製下一段」。',
  'help.guide.tour-bike-surfaces.step.4':
    '在「道路類型」下，點擊「農用或林間道路」或「有車流的道路」等列，就能看到路線在哪些地方經過這類道路。',
  'help.guide.tour-bike-mtb-grades.step.1':
    '在編輯器中開啟單車遊程，並確認「設定檔」設為「登山」。只有這個設定檔才會讀取步道等級。',
  'help.ctx.trip-tour-ski.title': '滑雪與冬季遊程',
  'help.guide.tour-ski-plan.goal':
    '沿著地圖上標示的雪道、纜車和步道，規劃一天的雪道滑雪、越野滑雪環線、滑雪遊程或雪鞋健行。',
  'help.guide.tour-ski-plan.tip.2':
    '「項目」旁的資訊圓點會說明 TREK 如何處理滑雪遊程。這裡和其他地方都不提供雪況、雪崩，或雪道、纜車、步道是否開放的資訊。',
  'help.guide.tour-ski-options.step.3':
    '在「優先」下選擇「最快」、「滑得最多」或「最輕鬆」。在「節奏」下選擇「悠閒」、「普通」或「運動」，這會改變路線規劃器為每條雪道估算的時間。',
  'help.guide.tour-ski-fix-leg.goal': '一鍵完成紅色路段的規劃，或直接畫成直線。',
  'help.guide.tour-ski-fix-leg.result': '不再有紅色路段：每一段不是沿著雪道走，就是在兩點之間直線連接。',
  'help.guide.tour-ski-summary.tip.3':
    '已儲存的遊程會維持儲存時的樣子開啟。移動一個點或更改一個選項，就會依目前的雪道資料重新規劃。',
  'help.guide.tour-ski-pistes-layer.tip.1': '如果開關呈灰色並顯示「放大地圖以查看雪道」，請放大到滑雪場一帶。',
  'help.guide.tour-ski-import.step.3':
    '選擇「項目」，如果是「越野滑雪」，還要選擇「技術」。在你選好之前，對話方塊會顯示「請選擇項目，才能將軌跡匯入為滑雪」。',
  'help.ctx.trip-tour-paddle.title': '划槳遊程',
  'help.guide.tour-paddle-setup.title': '規劃划槳遊程',
  'help.guide.tour-paddle-setup.step.7':
    '確認「新增地點」已開啟，然後點擊地圖：先點下水處，接著是途中的各個點，最後是上岸處。',
  'help.guide.tour-paddle-water-route.step.1':
    '手動繪製的路段會在其點下方顯示「手動繪製，未規劃」及其長度。TREK 會保留你畫的線條。',
  'help.guide.tour-paddle-water-route.tip.4': '只要有路段尚未規劃就無法儲存。請先在水上規劃，或手動繪製。',
  'help.guide.tour-paddle-portage.step.5':
    '在「上岸與下水」下，輸入你上岸、卸貨並重新下水所需的分鐘數。留空的話，TREK 會以 10 分鐘計算。',
  'help.guide.tour-paddle-lock.step.2': '選擇「在此點標記船閘」。該點下方會出現「船閘」卡片，並標示「缺少時間」。',
  'help.guide.tour-paddle-time.goal': '查看水上、搬運、船閘和休息的時間如何加總，並設定你自己的數值。',
  'help.guide.tour-paddle-time.tip.3':
    '休息時間和你自己的計劃總時間，都在「詳細資訊」下設定。設定了計劃總時間後，卡片會在估算值旁顯示「你的預計總時長」。',
  'help.guide.tour-paddle-wind.tip.1':
    '預報只涵蓋未來 16 天。更遠的日期會說明從哪一天起才有預報，過去的日期則會說明該日已經過去。',
  'help.guide.tour-paddle-checklist.step.2':
    '下方的一行會說明資料有多新：「OSM 資料截至」表示 OpenStreetMap 的資料日期，「取得時間」表示 TREK 讀取的時間，「障礙物資料」則在資料未涵蓋整條路線時顯示。',
  'help.guide.tour-paddle-checklist.tip.5':
    '檢查清單不等於安全或法律上的許可。你的決定無法解除 OpenStreetMap 中記錄的禁令或「私人」土地。',
  'help.guide.tour-paddle-track-marks.step.5': '點擊「陸上搬運」，再點擊線條上你上岸和重新下水的位置。',
  'help.ctx.trip-tour-horse.summary':
    '騎馬行程不會自動規劃路線。它由 OpenStreetMap 已知、有路標的馬匹路線路段組成，中間以你手動繪製的路段銜接，或是完全保留你錄製時的樣子。',
  'help.guide.tour-horse-plan.step.1': '先把你要騎行的區域移到地圖視野內，再點擊左欄頂部的「規劃新遊程」。',
  'help.guide.tour-horse-plan.tip.1':
    '路線屬於馬匹路線，並不代表你可以騎行。「馬匹通行」只反映 OpenStreetMap 的標籤，請務必遵守現場的標示。',
  'help.guide.tour-horse-gap.step.2': '開啟「用手動路段連接」。缺口會被畫成一條未經檢查的直線。',
  'help.guide.tour-horse-recorded.goal': '匯入你用 GPS 裝置或 App 錄下的騎馬行程，並完整保留你騎乘時的樣子。',
  'help.guide.tour-horse-recorded.tip.3': '你也可以把檔案拖放到「遊程」分頁的任何位置，同樣會開啟預覽。',
  'help.guide.create-trip.tip.3': '在「旅伴」下，你可以加入已經在這裡有帳號的人。旅行一建立，他們就會成為旅行成員。',
  'help.guide.trip-reminder.step.1': '點擊旅行卡片上的鉛筆。新旅行的「新建旅行」表單中也有同樣的區塊。',
  'help.guide.company-holidays.tip.2': '整天的公司假日會清除當天已登記的所有休假，所以沒有人會為它扣年假額度。',
  'help.guide.half-company-holiday.tip.2':
    '用同樣的設定再點一次該天即可清除；或是關閉「半天」後點擊，把它改成整天的公司假日。',
  'help.guide.edit-holiday-calendar.step.1': '開啟「設定」，在「公共假日」或「學校假期」下找到該日曆。',
  'help.guide.person-color.goal': '為你自己或一起規劃的人換上更容易分辨的顏色。',
  'help.guide.answer-fusion-request.tip.2': '之後你們任何一方都可以解除合併，你的條目會保留。',
  'help.guide.log-for-partner.tip.2': '對方會立刻看到變更，他們的「年假額度」列也會馬上更新。',
  'help.guide.country-places.title': '查看某個國家的所有地點',
  'help.guide.tour-activity-stats.step.1': '在地圖底部的面板中，開啟「統計」和「心願單」旁邊的「遊程」分頁。',
  'help.guide.tour-activity-stats.tip.2':
    '在遊程詳細資訊中用「新增實際軌跡」連結你實際走過的軌跡，這裡就會以它的記錄數值取代計畫數值。排在多天的遊程只算一次。',
  'help.ctx.collections.bullet.7':
    '保存的遊程：從旅行保存下來的遊程會排在清單最前面，附有難度、類型、來源旅行和各項數據。「加入行程」會依其中一個遊程建立新遊程，垃圾桶則會把它從清單中移除。',
  'help.guide.move-to-list.title': '把地點移動或複製到另一個清單',
  'help.guide.copy-to-trip.tip.2': '旅行中已經有的地點會被略過，TREK 會告訴你略過了幾個。',
  'help.guide.accept-list-invite.tip.2': '點擊清單頂部的「已分享」可查看成員，在那裡點擊「退出清單」就能離開這個清單。',
  'help.guide.tour-collection-add-to-trip.goal':
    '根據清單中保存的遊程，在你的某趟旅行中建立新遊程，可以連同路點一起帶入，也可以不帶。',
  'help.guide.tour-collection-add-to-trip.result':
    '對話方塊會告訴你這個遊程已屬於那趟旅行。「開啟行程」會帶你過去，「關閉」則讓你留在「收藏」。',
  'help.guide.tour-collection-manage.tip.3': '保存的遊程只會顯示在自己的清單中，不會出現在「全部已儲存」。',
  'help.guide.search-journey.step.3': '點擊某一天可捲動到那裡，點擊它的箭頭則會列出當天的條目，讓你選一則。',
  'help.guide.journey-map-layers.goal': '對照計畫與實際發生的情況，並開啟或關閉各圖層。',
  'help.guide.journey-keep-route.goal': '把 Dawarich 記錄的某一天實際路線加到旅程地圖上，並保留在那裡。',
  'help.guide.journey-day-stays.goal': '把 Dawarich 記錄的停留點逐一變成條目。',
  'help.guide.journey-take-over-day.goal': '一步就把某一天的停留點變成草稿條目，或一則當日記述。',
  'help.guide.journey-auto-prepare.title': '讓 TREK 自動準備你記錄的日子',
  'help.guide.photo-location.title': '把條目放在照片的拍攝地點',
  'help.ctx.settings-about.summary':
    '介紹 TREK 是什麼、這台伺服器執行的版本，以及專案的相關資源：文件、回報錯誤的管道，和支持專案的方式。',
  'help.guide.startup.tip.2': '如果啟動分頁屬於你已關閉的擴充套件，就會改為開啟計畫。',
  'help.guide.web-push-device.title': '在這台裝置上接收推播通知',
  'help.guide.connect-airtrail.tip.1': '只有管理員開啟 AirTrail 擴充套件時，才會看到這張卡片。',
  'help.guide.connect-dawarich.tip.1':
    'TREK 只會建議條目、地點和國家。在你確認之前不會新增任何內容，也不會寫回 Dawarich。',
  'help.guide.tour-connect-wanderer.tip.1': '只有管理員在「遊程」下允許 wanderer 時，才會看到這張卡片。',
  'help.guide.tour-wanderer-watch.tip.1': '提示不會改動任何遊程。遊程的來源檢查會顯示實際變更了什麼。',
  'help.guide.api-keys.tip.3':
    '將金鑰以 Authorization: Bearer 或 X-API-Key 的形式傳送到 /api/v1。一個帳號最多可持有 10 把金鑰。',
  'help.guide.plugin-settings.step.2':
    '「外掛活動」會依時間由新到舊列出外掛代你執行的每個操作，點擊「重新整理」可載入最新內容。',
  'help.ctx.admin-github.bullet.3': '「關於」：Ko-fi、Buy Me a Coffee、Discord、「回報錯誤」、「功能建議」和 Wiki。',
  'help.guide.default-user-settings.goal': '為每個帳號預設合適的單位、顏色模式和貨幣，不用每個人自己開啟「設定」。',
  'help.guide.default-map.step.3': '每個欄位在你離開時就會儲存。欄位名稱旁的重設連結可恢復 TREK 的預設值。',
  'help.guide.own-routing-engine.tip.2':
    '如果只設定了你自己的路徑規劃服務，也不會使用公用的 Valhalla。欄位旁的重設連結可再次清空它。',
  'help.guide.admin-passkeys.step.1': '在「設定」分頁的「Passkey 登入」下，開啟「啟用 Passkey 登入」。',
  'help.guide.storage-backends.step.4':
    '頂部的「健康」會列出寫入鏡像目標失敗的紀錄。如果顯示「未記錄任何複本失敗。」，就表示一切正常。',
  'help.guide.channels-instance.tip.3': '「Web 推播」需要 HTTPS。在 iPhone 和 iPad 上，使用者要先把 TREK 加入主畫面。',
  'help.guide.notification-defaults.step.1':
    '在「通知」分頁中，捲動到底部的「使用者預設值」。每一列是一個事件，每一欄是一個管道。',
  'help.ctx.notifications.bullet.1':
    '右上角的鈴鐺會顯示你尚未閱讀的通知數量。點擊它可看到最新的十則，底部的「檢視所有通知」則會前往這個頁面。',
  'help.guide.read-notifications.step.2':
    '面板會列出你最新的十則通知。每一則都會說明誰在哪裡做了什麼，未讀的通知背景會帶有底色。',
  'help.guide.filter-notifications.step.2': '在面板底部，點擊「檢視所有通知」。',
  'help.guide.mark-notifications-read.tip.1': '透過按鈕開啟通知，也會把它標為已讀。',
  'help.guide.delete-notifications.tip.2':
    '刪除的通知無法復原。如果只想讓通知不再顯眼但仍保留，請把它標為已讀，再用「未讀」篩選。',
  'help.guide.notification-settings.tip.2': '沒有逐趟旅行的設定：一個開關適用於你所有的旅行。',
  'help.guide.link-journal.title': '把日誌連結到旅行',
  'help.guide.link-journal.tip.2': '從此以後，你開放存取權限的人，也會在自己的「旅程」列表中看到這本日誌。',
  'help.ctx.trip-places.bullet.8':
    '連接 Dawarich 後，清單頂部的「來自 Dawarich」會顯示 Dawarich 在旅行期間記錄的停留點。「新增為地點」可把停留點變成地點，「我沒去過這個地方」則會把它從清單中移除。',
  'help.guide.dawarich-stays.step.4':
    '如果某個停留點不是真正的造訪，請點擊旁邊的 x「我沒去過這個地方」把它移除。列表底部的「顯示…已處理」會顯示你已新增或移除的停留點，「放回去」可把移除的停留點放回列表。',
  'help.guide.leave-stop-off-route.tip.1':
    '只有帶座標的停靠點才有這個選項，而且設定只對當天有效：同一個地點在另一天仍會納入路線。',
  'help.guide.move-booking-day.title': '把預訂移到另一天',
  'help.guide.place-image-from-file.step.4': '這張照片現在就是地點的圖片。點擊圖片角落的紅色小 X 可再次移除。',
  'help.guide.place-own-hours.step.2': '在「網站」下方，如果知道「電話」和「電子郵件」，請一併填入。',
  'help.guide.add-accommodation.tip.4':
    '更快的方法：當天標題中的 +（提示文字為「新增到當天」）裡有「新增住宿」。它會展開當天，並直接開啟這個表單。',
  'help.guide.confirm-stay-booking.goal': '直接在當天把住宿背後的旅館預訂標記為已確認。',
  'help.guide.map-whole-trip.tip.4':
    '是否顯示整趟旅行，是依每趟旅行記錄在你的帳號中，所以在另一個瀏覽器開啟旅行時也是同樣的狀態。',
  'help.guide.tour-map-lines.step.3':
    '在天數欄中開啟遊程所在的那一天，這個遊程就會成為當天路線的一部分：路線會通往遊程的起點，並從終點繼續往下走。',
  'help.guide.car-stops.goal': '為租來的車或自己的車設定取車處、還車處，以及中途停靠的地點。',
  'help.guide.car-stops.tip.1': '沒有單獨的租車類型：租來的車和自己的車都是「汽車」。',
  'help.guide.transport-details.result':
    '「計畫」會在該行程所屬的那一天開啟，地圖上畫出它的線條，它那一列的路線圖示也會開啟。',
  'help.guide.export-transports-csv.step.2': '點擊「檢視選項」後面的試算表圖示，它的提示文字是「匯出為試算表 (CSV)」。',
  'help.guide.group-sort-bookings.title': '為預訂分組和排序',
  'help.guide.group-sort-bookings.tip.2':
    '在「時間線」中，同一個按鈕裡有「每種類型單獨一列」和「同時顯示另一個分頁」。',
  'help.guide.booking-on-map.result': '詳細資訊會關閉，「計畫」分頁會開啟到預訂所在的那一天，並在地圖上選取它的地點。',
  'help.guide.export-bookings-csv.step.1':
    '如果只想匯出分頁的一部分，請先用「搜尋」或「篩選」縮小範圍。檔案內容會與分頁上顯示的完全一致。',
  'help.guide.import-booking-file.tip.4':
    '讀取確認信需要網路連線。離線時「匯入」會提示這一點，等 TREK 重新上線後再試一次即可。',
  'help.guide.arrange-packing-list.step.1':
    '抓住清單標題列左端、色點前面的握把，把清單拖放到另一張卡片上。目標卡片會出現強調色外框，清單會取代那張卡片的位置，旅行中的所有人看到的都是這個順序。',
  'help.guide.count-packed-pieces.title': '同一項物品打包多件',
  'help.guide.count-packed-pieces.tip.2': '開啟「行李追蹤」後，「行李」卡片中的「已打包」只會計算已經點算放入的件數。',
  'help.guide.packing-bags.tip.4':
    '由多人共同攜帶的行李袋，重量會在「每人」下平均分給每個人。這個重量帶有點狀底線，將游標指上去會顯示相關說明。',
  'help.guide.expense-receipts.step.1': '點擊該筆支出那一列旁的鉛筆。編輯器會開啟，底部附近有「收據與發票」。',
  'help.guide.expense-receipts.tip.3': '附加收據需要網路連線，也需要上傳檔案的權限，因為收據會作為旅行的檔案之一儲存。',
  'help.guide.files-sync-settings.title': '選擇文件的同步方向',
  'help.guide.files-sync-settings.tip.1': '至少會有一個方向保持開啟：點擊唯一還開著的方向不會有任何變化。',
  'help.guide.manage-notes.title': '閱讀、置頂和編輯筆記',
  'help.guide.manage-notes.tip.1':
    '只有筆記含有文字時，選單中才會有「展開」。沒有權限編輯協作內容的成員，只會看到「展開」。',
  'help.guide.note-categories.step.5':
    '點擊「儲存」。重新命名或更改顏色的分類下的所有筆記會立刻一起改變，所有成員都會看到。「取消」會捨棄你的變更。',
  'help.guide.trip-chat.tip.5': '聊天室會先顯示最新的訊息。點擊聊天室頂部的「載入更早的訊息」，就會載入更早的訊息。',
  'help.guide.roadtrip-reorder.result':
    '停靠點會依你設定的順序排列，你調整過的每一天的距離、行車時間和抵達時間都會重新計算。',
  'help.guide.roadtrip-overnight.goal': '在路上找個過夜的地方，並把這一晚以預訂的形式加入行車路線。',
  'help.guide.roadtrip-overnight.tip.2':
    '要把已預訂的過夜改回「停留」，請在它的卡片點擊「編輯」，系統會先詢問「取消這次過夜？」。點擊「改為休息」會移除這一晚，連同它的預訂和相關支出，但停靠點仍留在行車路線上。',
  'help.guide.roadtrip-stop-fill.tip.2': '如果你選的值和停靠點目前的值一樣，停靠點就會恢復成你的預設值。',
  'help.guide.roadtrip-bookings.tip.1':
    '在站點的時間會比時刻表提早，預留辦理報到的時間：航班或郵輪提早一小時，渡輪提早半小時，火車或公車提早十分鐘。',
  'help.guide.roadtrip-google-import.step.2': '貼上你從 Google Maps 分享的路線連結，然後點擊「預覽」。',
  'help.guide.roadtrip-hazards.goal': '在地圖上查看行車路線周圍的天氣警報和災害警示。',
  'help.ctx.trip-tours.title': '計畫中的遊程',
  'help.guide.tour-show-list.title': '在計畫中顯示旅行的遊程',
  'help.guide.tour-show-list.tip.2':
    '還沒有遊程嗎？列表頂部的「匯入 GPX 或 KML」可匯入檔案，「遊程」分頁上的「規劃新遊程」則可建立新的遊程。',
  'help.guide.tour-add-to-day.step.4':
    '或者把該列從列表中拖出來，放到左欄的某一天上。如果放在兩個停靠點之間，就會插在那個位置。',
  'help.guide.tour-day-times.goal': '查看遊程何時結束，以及是否與當天接下來的行程重疊。',
  'help.guide.tour-day-times.tip.4':
    '同一個選單中的「儲存到收藏」會把遊程連同路線保存到收藏中，效果和卡片上的「收藏」按鈕一樣。',
  'help.guide.tour-remove-from-day.tip.2':
    '這些選單和卡片上都沒有「刪除」。遊程要在「遊程」分頁中，用「這趟旅行的遊程」下該列的垃圾桶來刪除。',
  'help.guide.tour-filter-list.tip.1': '「路線上限」是規劃路線時允許的最高難度，而不是在步道上實測到的難度。',
  'help.guide.tour-hide-on-map.step.3':
    '只要有任何遊程被隱藏，列表上方就會出現一行「已在地圖上隱藏」，並顯示隱藏的數量。「全部顯示」可一次讓所有遊程重新顯示。',
  'help.guide.tour-import-plan-tab.step.3':
    '「匯入預覽」會在儲存任何內容之前，先顯示每一條軌跡。在「匯入為」下選擇類型（「健行」、「單車遊程」等），然後點擊「匯入 1 條遊程」。',
  'help.ctx.trip-tour-detail.bullet.3':
    '下方是「旅行日期」，遊程所在的每一天各有一個方塊，接著是各項數據和海拔剖面圖，然後依實際情況顯示：城市散步的站點、划槳遊程的檢查項目和風況、「實際軌跡」、「行李清單」、「描述」、「筆記」、「來源」和「檔案」。',
  'help.guide.tour-detail-read.step.4':
    '「旅行日期」會為遊程所在的每一天顯示一個方塊和日期。如果顯示「旅行中尚未排入任何一天」，代表這個遊程還沒排進行程。',
  'help.guide.tour-detail-read.tip.5': '在手機上，卡片會以從底部滑出的面板開啟，方便閱讀，也方便帶著遊程出門。',
  'help.guide.tour-rename-colour.tip.1':
    '名稱和顏色屬於旅行，所以旅行中的每個人都看得到。如果只想在自己的地圖上隱藏某個遊程，又不影響其他人，請使用「遊程」列表中的眼睛。',
  'help.guide.tour-take-along.tip.1':
    '在可以分享檔案的裝置上，GPX 旁邊會出現「分享」，可把同一個檔案直接傳給另一個 App。',
  'help.guide.tour-copy-keep.step.2': '副本會立即開啟，名稱是原名稱加上（副本）。點擊鉛筆可以幫它改個自己的名稱。',
  'help.guide.tour-packing-link.title': '把遊程連結到行李清單',
  'help.guide.tour-packing-link.tip.2':
    '區段標題中的「更換」可讓遊程改連結到另一份清單。該對話方塊中的「移除關聯」會取消連結，清單本身維持不變。',
  'help.guide.tour-files.tip.1': '這些檔案同時也是旅行的檔案，所以也會顯示在「檔案」分頁中。',
  'help.guide.tour-activity-link.step.4': '在「實際」下查看它量測到的數值，然後點擊「連結」。',
  'help.guide.tour-activity-compare.step.1':
    '開啟遊程的卡片。「計畫與實際」會把計畫的「距離」、「累計爬升」、「累計下降」和「含休息時間」與軌跡的數值並排顯示，並附上「差異」。',
  'help.guide.tour-origin-check.goal': '查明遊程是在 TREK 中繪製的還是匯入的、來自哪個檔案，以及之後有沒有被更改過。',
  'help.ctx.trip-tour-planner.title': '遊程',
  'help.guide.tour-open-workspace.title': '熟悉「遊程」分頁',
  'help.guide.tour-open-workspace.step.7':
    '點擊右側欄中的遊程。在 TREK 中規劃的遊程會在編輯器中開啟；匯入的軌跡則維持匯入時的樣子，以「GPX 遊程」開啟，僅供查看。',
  'help.guide.tour-draw-route.step.2': '在「搜尋地點或地址」中輸入遊程的起點，並選擇搜尋結果，地圖就會移到那裡。',
  'help.guide.tour-draw-route.tip.4':
    '未儲存的草稿會被保留。再次開啟旅行的「遊程」分頁時會自動還原，並標示「已還原尚未儲存的草稿」。',
  'help.guide.tour-type-profile.tip.1':
    '更改類型在歷史記錄中算作一步：側欄標題中的「復原路線點編輯」可恢復原本的類型和路線。',
  'help.guide.tour-edit-points.step.4': '或者開啟該列的「更多操作」（三個點），選擇「上移路線點」或「下移路線點」。',
  'help.guide.tour-shaping-points.step.1':
    '在地圖上畫好的路線中，點擊想讓路線改走的位置，那裡會出現一個小圓點：塑形點。',
  'help.guide.tour-loop-reverse.title': '做成環線或反向走遊程',
  'help.guide.tour-loop-reverse.result': '得到一條終點回到起點的環線，或是方向相反的同一個遊程。',
  'help.guide.tour-leg-by-hand.tip.2':
    '任何道路都到不了的點，會顯示一則帶有「顯示該點」及其編號的提示。請把該點移到道路上，或手動繪製通往它的路段。',
  'help.guide.tour-trip-places.tip.1': '已在遊程中的地點會標示「已在遊程中」，無法重複選擇。',
  'help.guide.tour-details-times.step.3': '輸入「休息」時間，例如 0:45。這段時間會加到預估時間中。',
  'help.guide.tour-save.step.1': '在「遊程名稱」中輸入名稱。沒有名稱時，「儲存」會維持灰色。',
  'help.guide.tour-edit-saved.title': '修改已儲存的遊程',
  'help.guide.tour-edit-saved.tip.3': '側欄標題中的「下載 GPX」和「保存到收藏」，要在變更儲存後才能使用。',
  'help.guide.tour-summary-profile.tip.1': '點擊卡片本身的標題，可收合整個摘要。',
  'help.guide.tour-list-manage.step.3': '選擇日期。遊程會加到那一天，該列也會顯示這一天。',
  'help.guide.tour-delete.goal': '把遊程從旅行中永久移除。',
  'help.guide.tour-saved-elsewhere.goal': '決定當你修改遊程時，如果別人已先儲存了它，該怎麼處理。',
  'help.ctx.trip-tour-import.title': '匯入遊程',
  'help.guide.tour-import-gpx.goal':
    '把 GPS 手錶、App 或 Google Earth 的軌跡變成旅行的遊程，並在儲存任何內容之前先檢查。',
  'help.guide.tour-import-gpx.tip.3': '旅行中已經有的軌跡會呈灰色並標示「已在旅程中」，匯入時會被略過。',
  'help.guide.tour-view-import.step.3': '左上角的箭頭「返回遊程清單」可再次關閉它。',
  'help.guide.tour-plan-from-import.step.2':
    'TREK 會從軌跡中取出控制點並重新規劃路線。地圖上，匯入的軌跡以點線繪製，建議的路線以實線繪製，卡片則會比較兩者的長度、「與軌跡相距 50 公尺以內」的比例，以及「最大偏差」。',
  'help.guide.tour-restore-recorded.title': '回到錄製的軌跡',
  'help.guide.tour-take-over.title': '從其他旅行引入遊程',
  'help.guide.tour-take-over.tip.1':
    '副本是獨立的遊程，目前還沒排入任何一天。之後對原件的修改不會影響副本，反過來也一樣。副本的「來源」會註明是從哪趟旅行引入的。',
  'help.guide.tour-import-wanderer.step.3':
    '點擊一條步道，它會畫在地圖上，欄位中則會顯示它的 GPX 檔案測得的數據、描述，以及它在 wanderer 中是公開還是「私人」。',
  'help.ctx.trip-tour-map.summary':
    '「遊程」分頁中間的地圖，針對你目前開啟的遊程：適合其類型的地圖、疊加在上面的雪道或航標、路線沿途的地點，以及同一個遊程在真實地形上的 3D 檢視。',
  'help.guide.tour-map-layers.step.1':
    '開啟「遊程」分頁，點擊右側「這趟旅行的遊程」下的遊程。它會在規劃器中開啟，地圖左下角的標籤會列出這類遊程可用的地圖。',
  'help.guide.tour-along-search.goal': '在你正在規劃的遊程路線附近，尋找觀景點、水源、山屋或用餐的地方。',
  'help.guide.tour-along-search.tip.2': '在城市散步中，列表上方的四個主題會自動幫你選好合適的類型。',
  'help.guide.tour-along-add-stop.result':
    '遊程現在會經過該地點，新的距離和時間顯示在「遊程摘要」中。請儲存遊程以保留這項變更。',
  'help.guide.tour-3d-terrain.step.3':
    '點擊右側的「坡度分布」標籤。展開後會顯示遊程中有多少路段落在「低於 5 %」、「5 至 10 %」、「10 至 18 %」、「18 至 27 %」和「27 % 以上」。收合時，它則顯示最高點和最陡的路段。',
  'help.guide.tour-3d-flyover.goal': '在你步行、騎行或滑雪之前，先從起點到終點完整看一遍遊程。',
  'help.guide.tour-3d-flyover.tip.3':
    '飛行暫停時，沿著海拔剖面圖移動，圓點就會跳到那個位置。點擊「播放飛越」會從那裡繼續。',
  'help.guide.tour-map-overlays.tip.1':
    '雪道是地圖資料，不是即時資訊，不會顯示哪些雪道開放或已整理，也不含雪況或雪崩資訊。縮小到超出滑雪場範圍時，開關會顯示「放大地圖以查看雪道」。',
  'help.ctx.trip-tour-stages.bullet.4':
    '在「這趟旅行的遊程」中，多日遊程會顯示一個帶有階段數的月亮圖示。這個按鈕就是「顯示階段」，點擊後會展開各階段，並顯示每個階段所在的日期，以及「整條路線」的總計。',
  'help.guide.tour-multi-day.step.5':
    '「遊程摘要」在「階段」下列出每個階段。點擊其中一個，可看到它在哪裡結束：它的最後一個停靠點會被選取，海拔剖面圖也會標出該位置。',
  'help.guide.tour-stages-on-days.goal': '把每個階段各排到一天，或把整個遊程排在同一天。',
  'help.guide.tour-stages-on-days.tip.2':
    '如果某一天已經有這個遊程，「整條路線放在這一天」就會呈灰色。「從這一天起按階段安排」在那裡仍可使用，並會取代當天的整個遊程。',
  'help.ctx.trip-tour-hike.bullet.3':
    '「路點」卡片的標題區有路線工具：「反轉方向」、「返回起點」，以及健行專用的「從起點規劃環線」。停靠點上的「更多操作」裡有「比較下一段的道路」。',
  'help.guide.tour-hike-plan.step.3': '在「遊程名稱」下輸入名稱。',
  'help.guide.tour-hike-plan.tip.4':
    '步行時間依健行路標規則（DIN 33466）計算，不含休息時間。請在「詳細資訊」的「休息」下加入，這些時間就會顯示在計劃的總時間中。',
  'help.guide.tour-hike-trail-details.result':
    '你會知道健行路線的各個部分分別是什麼等級、由什麼構成，以及位於地圖上的哪裡。',
  'help.guide.tour-hike-round.step.3':
    '點擊「尋找環線」。「環線 A」、「環線 B」等結果會出現在列表和地圖上，各自使用不同的顏色。',
  'help.guide.tour-hike-compare-ways.goal': '查看健行在兩個停靠點之間還有哪些其他路徑可走，並改走其中一條。',
  'help.guide.tour-hike-compare-ways.tip.3': '「取消」會關閉卡片，路線維持不變。',
  'help.guide.tour-ferrata-add.result':
    '健行路線會沿著 OpenStreetMap 中岩釘路線自己的線條前進。點擊地圖可從頂端繼續。路線規劃器只會規劃前往岩釘路線和離開之後的路段。',
  'help.guide.tour-run-plan.step.2':
    '選擇「設定檔」：「跑步」適合城鎮、公園和河邊大多已鋪面的道路，「越野跑」適合林間道路和自然小徑。',
  'help.guide.tour-run-plan.tip.4': '「越野跑」最高會走到山徑（T2）等級，不會走更難的路。',
  'help.guide.tour-run-ways.tip.2':
    '將「設定檔」切換為「越野跑」，路線會走更多自然小徑；切換為「跑步」，則會讓路線保持在堅實的地面上。',
  'help.guide.tour-walk-plan.title': '逐站規劃城市散步',
  'help.guide.tour-walk-plan.tip.1':
    '停靠點編號周圍的圓環代表重要程度：實線表示「必去」，虛線表示選填。小盾牌則標示「受保護」的停靠點。',
  'help.guide.tour-walk-sights.step.3': '點擊「沿途搜尋」。名稱前面的星星代表「亮點」，也就是這裡最知名的地點之一。',
  'help.guide.tour-walk-day-times.goal': '知道你在散步當天幾點到達每個停靠點，以及哪些地方到時已經關門。',
  'help.guide.tour-walk-day-times.tip.4':
    '同一天有兩次散步：在「計畫」分頁中，點擊兩次散步之間的路段（「變更交通方式」）並選擇「大眾運輸」。搜尋會從第一次散步結束的地點和時間出發，如果接駁班次比下一次散步的開始時間還晚抵達，就會提醒你。',
  'help.guide.tour-walk-google-import.tip.1': '只會讀取以步行規劃的路線。分享之前，請先把 Google Maps 切換成步行。',
  'help.guide.tour-walk-check-off.step.3': '對已經逛過的停靠點點擊「標記為已造訪」，對要跳過的點擊「略過」。',
  'help.ctx.trip-tour-bike.bullet.1':
    '「路線類型」下的「設定檔」決定路線規劃器依哪種騎乘方式規劃：「旅行」、「公路」、「礫石」或「登山」。下方的一行文字說明路線規劃器在找什麼，更改設定檔會重新規劃整條路線。',
  'help.guide.tour-bike-profile.step.3':
    '在「設定檔」下，選擇「旅行」、「公路」、「礫石」或「登山」。下方的一行文字說明路線規劃器在該設定檔下會找什麼。',
  'help.guide.tour-bike-profile.tip.4': '在遊程有名稱，且路線與高度都計算完成之前，「儲存」會維持灰色。',
  'help.guide.tour-bike-surfaces.result':
    '地圖會標出你所選那一列對應的路段，你就能知道路線騎的是哪些路面。遊程本身不會改變。',
  'help.guide.tour-bike-mtb-grades.step.2':
    '在「路面與道路」卡片中查看「路徑難度（mtb:scale）」：顯示路線中各等級所占的比例，從「S0，無特別難度」到「S4 以上，專家級地形」。',
  'help.ctx.trip-tour-ski.summary':
    '「遊程」分頁上類型為「滑雪與冬季」的遊程：一天的雪道滑雪、越野滑雪環線、滑雪遊程、雪鞋健行或冬季散步。它的路段沿著 OpenStreetMap 上標示的雪道、纜車和步道，由雪道路線規劃器依你選的項目和限制來規劃；錄製的滑雪軌跡則會連同項目一起匯入。',
  'help.guide.tour-ski-plan.step.1': '在「遊程」分頁中，點擊左側欄頂部的「規劃新遊程」。',
  'help.guide.tour-ski-plan.tip.3': '之後更改項目，會保留你的點，並依該項目使用的選項重新規劃各路段。',
  'help.guide.tour-ski-options.step.4':
    '使用這些開關：「搭乘纜車」、「允許野雪路線」、「需要時搭纜車下山」和「避開推測的連接」。「越野滑雪」另有「僅限壓雪道」和「僅限有照明的雪道」，「登山滑雪」則另有「沿雪道邊緣上行」。',
  'help.guide.tour-ski-fix-leg.step.1':
    '路線規劃器無法規劃的路段，會在它的點下方顯示一列紅色文字，說明原因（例如「這些點之間只有被你排除的纜車相連」）以及相關的雪道或纜車。',
  'help.guide.tour-ski-summary.title': '閱讀滑雪遊程的雪道路線',
  'help.guide.tour-ski-summary.tip.4': '卡片底部會列出滑雪場，以及規劃這個遊程時所依據的地圖資料日期。',
  'help.guide.tour-ski-pistes-layer.tip.2': '如果雪道載入失敗，開關上會出現警告標誌。地圖和你的路線仍可正常使用。',
  'help.guide.tour-ski-import.step.4': '點擊「匯入 1 條遊程」。',
  'help.ctx.trip-tour-paddle.summary':
    '在河流或湖泊上的皮艇、獨木舟或直立式划槳（SUP）遊程。它會註明船隻和水域，在 TREK 有資料的地方沿著水路規劃，把陸上搬運與船閘計入時間，並顯示你划槳當天的風況，以及沿途已知的障礙資訊。',
  'help.guide.tour-paddle-setup.goal':
    '開始規劃皮艇、獨木舟或直立式划槳（SUP）遊程，並設定你划什麼船、在什麼水域、速度多快。',
  'help.guide.tour-paddle-setup.tip.1':
    '「船」設為「其他」時，不會有建議速度。請自行輸入一個速度，否則水上時間會維持空白。',
  'help.guide.tour-paddle-water-route.step.2':
    '若要讓某一段在水上規劃，請將游標移到它前一個停靠點，然後點擊「更多操作」，也就是那三個點。',
  'help.guide.tour-paddle-water-route.result':
    '每一段不是沿著水路，就是你刻意手動繪製的，TREK 無法規劃的路段則會說明原因。',
  'help.guide.tour-paddle-portage.tip.1':
    '如果之後想改成直接划過這一段，請再次開啟該點的「更多操作」，選擇「這一段恢復划槳」。這一段會變回手動繪製的路段。',
  'help.guide.tour-paddle-lock.step.3': '點擊「船閘」卡片即可開啟。',
  'help.guide.tour-paddle-time.step.1': '「時間估算」位於左欄路點下方。標題中的徽章是總時間，已包含休息。',
  'help.guide.tour-paddle-time.result': '估算會把你輸入的內容算進去，並指出還缺少什麼。',
  'help.guide.tour-paddle-wind.tip.2':
    '跨多天的遊程會在卡片標題中為每一天顯示一個「日」標籤。點擊其中一個即可查看那一天。',
  'help.guide.tour-paddle-checklist.step.3':
    '項目依路線順序排列：包含來自 OpenStreetMap 的堰、船閘、急流、下水處和通行規則，以及你自己加入的陸上搬運和船閘，後者標示為「自行規劃」。',
  'help.guide.tour-paddle-checklist.result': '路線上的每個項目都有了決定，你也讀過安全提示。',
  'help.guide.tour-paddle-track-marks.step.6': '點擊「船閘」，再點擊線條上船閘所在的位置。',
  'help.ctx.trip-tour-horse.bullet.1':
    '在編輯器中把「路線類型」設為「騎馬遊」，左欄就會出現「騎馬路線」卡片。「在地圖畫面中尋找」會列出目前地圖畫面中的路線。',
  'help.guide.tour-horse-plan.step.2':
    '點擊「遊程名稱」下的「路線類型」欄位，選擇「騎馬遊」。「騎馬路線」卡片會出現在「路點」下方。',
  'help.guide.tour-horse-plan.tip.2':
    'TREK 不會為騎馬行程估算騎乘時間。如果你想在當天顯示時間，請在「詳細資訊」的「計劃中」下自行輸入。',
  'help.guide.tour-horse-gap.step.3': '點擊「採用路段」。在開關開啟之前，這個按鈕會維持灰色。',
  'help.guide.tour-horse-recorded.step.1':
    '在「這趟旅行的遊程」中，點擊「新增行程」（+），選擇「匯入 GPX 或 KML」，然後選取你的騎馬行程檔案。',
  'help.guide.dateless-trip.title': '規劃還沒有日期的旅行',
  'help.guide.trip-reminder.step.2':
    '在「提醒」下選擇 1、3 或 9 天。如果想設其他提前天數，請點擊「自訂」，輸入 1 到 30 之間的天數。',
  'help.guide.upcoming-reservations.title': '快速跳到接下來的預訂',
  'help.guide.half-company-holiday.title': '標記半天的公司假日',
  'help.guide.edit-holiday-calendar.step.2': '點擊色塊選擇新顏色，或輸入新標籤後按 Enter。',
  'help.guide.person-color.step.1': '在「人數」卡片中，點擊名字前面的彩色圓點。',
  'help.guide.answer-fusion-request.title': '回覆合併請求',
  'help.guide.log-for-partner.title': '替一起規劃的人登記休假日',
  'help.guide.dissolve-fusion.title': '停止共同規劃',
  'help.guide.country-places.goal':
    '列出 TREK 為某個國家計入的地點，方便你回顧在那裡去過哪些地方，或找出被歸到錯誤國家的地點。',
  'help.guide.regions.tip.3': '「新增到心願單」對地區也適用。地區會以和心願單上的國家相同的斜線圖樣顯示。',
  'help.guide.tour-activity-stats.step.2':
    '用左側的兩個標籤選擇「時間範圍」和類型。「時間範圍」提供「全部時間」、「今年」、「最近 12 個月」，以及你有遊程的每個更早年份。「型別」可把數字縮小到某一種遊程，或選「所有型別」。',
  'help.guide.tour-activity-stats.tip.3':
    '有指定參與者的日子只計入他們，沒有指定任何人的日子則計入旅行中的所有人。這個分頁會即時載入資料，需要網路連線。',
  'help.guide.move-to-list.goal': '重新整理你的清單：在清單之間移動地點，或把地點複製到第二個清單。',
  'help.guide.accept-list-invite.result':
    '清單會出現在側欄的「已分享」下，點開就能看到其中的地點。其他成員所做的變更會即時顯示。',
  'help.guide.tour-collection-add-to-trip.step.1':
    '開啟清單。保存的遊程是最前面的幾列，位於地點上方。點擊遊程上的「加入行程」，或直接點擊該列。',
  'help.guide.tour-collection-manage.title': '尋找並移除保存的遊程',
  'help.guide.tour-collection-manage.result': '遊程已從清單中移除，並有一則簡短訊息確認。',
  'help.guide.entry-draft.title': '把條目保留為草稿',
  'help.guide.journey-map-layers.step.1':
    '在地圖頂部，圖層列有「計畫」、「記錄」、「條目」和「照片」，各自附有數量。點擊其中一個可隱藏或顯示它。',
  'help.guide.journey-keep-route.step.1': '在當天的標題中，點擊 Dawarich 按鈕「匯入記錄」。',
  'help.guide.journey-day-stays.step.1':
    '有停留點待檢視的那一天，末尾會有一列，例如「4 個來自 Dawarich 的停留點」和時間範圍。點擊它即可展開停留點。',
  'help.guide.journey-take-over-day.step.1':
    '點擊當天停留點那一列末端的「匯入當天」，或當天標題中的列表按鈕，後者會顯示有多少停留點在等待處理。',
  'help.guide.journey-auto-prepare.goal': '旅行進行期間，自動把每天的停留點準備好供你檢視。',
  'help.guide.photo-location.goal': '不必逐一搜尋地點，就能把條目放到地圖上。',
  'help.ctx.settings-about.bullet.1': '這台伺服器執行的版本顯示在標題旁邊。',
  'help.guide.readability.tip.3':
    '易讀性標示為「實驗性」。如果畫面看起來不對勁，請點擊分頁底部的「恢復預設」，恢復預設設定。',
  'help.guide.web-push-device.goal': '即使 TREK 已關閉，也能在手機或電腦上收到 TREK 的通知。',
  'help.guide.connect-airtrail.tip.2': '金鑰會加密儲存，之後不會再顯示。欄位中出現圓點，表示已儲存了一把金鑰。',
  'help.guide.connect-dawarich.tip.2':
    '按鈕下方，卡片會說明 TREK 上次檢查的時間，以及你的 Dawarich 版本不支援哪些功能。',
  'help.guide.tour-connect-wanderer.tip.2': '如果執行個體位於私有位址，可能需要管理員允許內部網路。',
  'help.guide.tour-wanderer-watch.tip.2':
    '「暫停至」表示 wanderer 沒有回應，「權杖遭拒」表示權杖需要通過連線測試，或需要換一個新權杖。',
  'help.guide.plugin-settings.result': '外掛會依你的設定運作，它代你執行的每個操作都會列在「外掛活動」下。',
  'help.ctx.admin-defaults.bullet.3':
    '你設定過的欄位旁邊有重設連結，可恢復 TREK 自己的預設值。使用者自己的設定一律優先於這裡的預設值。',
  'help.ctx.admin-settings.bullet.5': '「危險區域」：「輪替 JWT 密鑰」會讓所有使用者登出，包括你自己。',
  'help.guide.default-user-settings.step.1':
    '在「用戶預設設定」下，選擇「顏色模式」（「淺色」、「深色」或「自動」）、「溫度單位」、「距離單位」、「時間格式」、「每週開始於」、「顯示貨幣」，以及「模糊預訂程式碼」要開啟還是關閉。每個選擇都會立即儲存。',
  'help.guide.admin-passkeys.step.2':
    '輸入「Relying Party ID（網域）」（例如 trek.example.org），以及你的 TREK 對外使用的「允許的來源」，然後點擊「儲存」。兩者都留空的話，會使用 APP_URL。',
  'help.guide.rotate-jwt-secret.title': '一次讓所有人登出',
  'help.guide.notification-defaults.step.2':
    '點擊格子可切換到下一個狀態：開啟、「關閉」、「封鎖」。提示文字會顯示下一個狀態，每次點擊都會立即儲存。',
  'help.ctx.notifications.bullet.2':
    '頂部的「全部」和「未讀」可在顯示所有通知和只顯示尚未閱讀的通知之間切換。捲動時列表會載入更多。',
  'help.guide.read-notifications.step.3':
    '點擊通知下方的按鈕（例如「查看 Vacay」），即可開啟通知所指的內容，同時也會把它標為已讀。',
  'help.guide.filter-notifications.step.3': '點擊「未讀」，只看尚未閱讀的通知。點擊「全部」則再次顯示所有通知。',
  'help.guide.mark-notifications-read.tip.2': '標為已讀只會改變背景色和計數。通知仍會留在列表中，直到你刪除它。',
  'help.guide.delete-notifications.result': '通知已從列表和鈴鐺中移除。',
  'help.guide.notification-settings.result': '「設定」會開啟到「通知」，每個事件和管道各有一個開關。',
  'help.guide.link-journal.goal': '把你的某本 Journey 日誌顯示在旅行中，讓你指定的人查看。',
  'help.guide.link-journal.tip.3':
    '之後在旅行設定的「日誌」中，可以使用「編輯存取權限」、「更換日誌」和「取消關聯」。取消關聯會移除該分頁，但你在日誌本身加入的人仍保有存取權。',
  'help.guide.dawarich-stays.result':
    '這個停留點成為旅行的地點，位於你選擇的那一天或「未規劃」下，面板也會把它標示為已處理。',
  'help.ctx.trip-days.bullet.7': '旅行進行期間，計畫會開啟並自動捲動到今天。',
  'help.guide.leave-stop-off-route.tip.2': '「從當天移除」會把停靠點整個從當天拿掉，「從路線中排除」則讓它留在計畫中。',
  'help.guide.move-booking-day.goal': '直接在計畫中把交通或預訂移到另一天，不必開啟表單。',
  'help.guide.place-image-from-file.result': '這張照片就是地點的圖片，會顯示在卡片上、地點欄、當天的行程和地圖上。',
  'help.guide.place-own-hours.step.3':
    '它們下方的「營業時間」以每天一列顯示整週。如果 TREK 找到了地點的營業時間，就會已經填好，否則請先點擊「新增營業時間」。輸入每天的開門和關門時間，不營業的日子則點擊「已關閉」。',
  'help.guide.add-accommodation.tip.5': 'GPX 軌跡和遊程地點不會被當作住宿地點，只有旅行中一般的地點才可以。',
  'help.guide.confirm-stay-booking.step.1':
    '開啟入住的那一天。在住宿的卡片上，「預訂」下方是這一晚的旅館預訂，顯示「待確認」或「已確認」。點擊那個方塊。',
  'help.guide.tour-map-lines.step.4':
    '若要把遊程從地圖上移開，請將右欄切換到「遊程」，將游標移到遊程上，點擊眼睛「在地圖上隱藏」。它的線條和圖釘會從地圖上消失，該列仍留在列表中，顯示為淡色並帶有劃掉的眼睛「在地圖上顯示」，點擊即可重新顯示。',
  'help.guide.car-stops.step.1': '在取車那一天的標題中，點擊 +（提示文字為「新增到當天」），然後選擇「新增交通」。',
  'help.guide.car-stops.tip.2': '行車至少有兩個停靠點後，才會出現「上移」和「下移」。',
  'help.guide.transport-details.title': '開啟交通並使用詳細資訊',
  'help.guide.transport-details.tip.1': '在已畫出線條的行程上再次點擊「在地圖上」，就會關閉該線條。',
  'help.guide.export-transports-csv.result':
    '瀏覽器會儲存一個以旅行命名的檔案，例如 autumn-in-japan-transports.csv，每段行程佔一列，欄位有：類型、標題、狀態、開始、結束、來自、到、地點、確認號和筆記。',
  'help.guide.group-sort-bookings.goal': '依狀態、日期或類型，用你想要的順序排列卡片或清單。',
  'help.guide.booking-on-map.tip.1':
    '只有含地點的預訂才有「在地圖上」。在表單的「地點 / 活動」下選一個地點，按鈕就會出現。',
  'help.guide.export-bookings-csv.step.2':
    '開啟「檢視選項」（檢視圖示後面的滑桿圖示），在「排序方式」下選擇順序。各列會依此排列，每筆預訂一列，不分區段。',
  'help.guide.edit-booking.tip.4':
    '如果你已修改了內容，點擊表單外面或按 Escape，會先詢問「放棄變更？」。點擊「繼續編輯」就會回到表單。',
  'help.guide.arrange-packing-list.step.2':
    '在清單內，抓住某一列左側的握把，就能把該物品向上或向下拖曳。該列左邊緣的強調色線條會顯示它將落在哪裡。',
  'help.guide.count-packed-pieces.goal': '為物品設定數量，並逐件標記已打包的件數。',
  'help.guide.count-packed-pieces.tip.3': '數量為一的物品不會顯示計數器，只有勾選框。',
  'help.guide.expense-receipts.step.2':
    '點擊「收據與發票」旁邊的「附加」，選擇照片或 PDF，也可以一次選擇多個。每個檔案都會列在標題下方，旁邊有垃圾桶可移除。',
  'help.guide.files-sync-settings.goal':
    '決定文件只從你的儲存空間匯入、只匯出到儲存空間，還是雙向同步，以及文件在兩邊被刪除或修改時如何處理。',
  'help.guide.files-sync-settings.tip.2':
    '選擇「詢問我」後，在兩邊都被編輯過的文件，會等在卡片下方的「需要查看」。點擊「解決」，再選擇「保留 TREK 版本」、「保留提供者版本」或「兩份都保留」。',
  'help.guide.manage-notes.goal': '完整開啟一則筆記、把重要的筆記置頂，並更正或移除過時的內容。',
  'help.guide.manage-notes.tip.2':
    '編輯時，已附加檔案上的紅色叉號會在你點擊「儲存」之前就立即刪除檔案，而且檔案不會進入垃圾桶。筆記的每個檔案也都會出現在旅行的「檔案」分頁中。',
  'help.guide.note-categories.step.6':
    '回到「筆記」卡片，標題下方的標籤可用來篩選卡片。點擊某個分類就只看它的筆記，點擊「全部」或再點一次同一個標籤，則顯示全部。',
  'help.guide.roadtrip-reorder.tip.1': '在這裡移動停靠點，每日計畫中的位置也會跟著改變：「天」顯示的是相同的順序。',
  'help.guide.roadtrip-overnight.step.1':
    '在「路線途中」的「尋找」下勾選「住宿」（要找營位則勾選「露營地」），選擇你要停留的日子，然後點擊「搜尋」。',
  'help.guide.roadtrip-overnight.tip.3':
    '在「駕駛設定」的「路線線條」下開啟「每天從住宿地點出發，並在住宿地點結束」後，隔天的行車會從你過夜的地方出發。',
  'help.guide.roadtrip-stop-fill.title': '設定一個停靠點要加滿多少',
  'help.guide.roadtrip-bookings.title': '把航班、火車或渡輪納入行車路線',
  'help.guide.roadtrip-bookings.tip.2':
    '在某個停靠點訂的餐桌或票券，會以標籤形式顯示在該停靠點上。不屬於任何停靠點的內容，則列在「當天的其他預訂」下。',
  'help.guide.roadtrip-google-import.step.3':
    '檢查它找到的停靠點。每一個都會顯示所在位置，標示為「無法定位」的停靠點會被略過。',
  'help.guide.roadtrip-hazards.step.1': '在右欄中開啟「駕駛設定」。',
  'help.ctx.trip-tours.summary':
    '「計畫」分頁在遊程模式下的右欄：旅行的所有遊程集中在同一份列表，位於天數旁邊。你可以在這裡把遊程排到某一天、篩選列表、在地圖上隱藏線條，以及匯入 GPX 或 KML 檔案。路線的繪製和修改則在「遊程」分頁進行。',
  'help.guide.tour-show-list.goal': '把地點欄換成旅行的遊程，在天數旁邊查看並挑選它們。',
  'help.guide.tour-show-list.tip.3':
    '開啟遊程擴充套件後，軌跡不會出現在「地點」列表中：每條匯入的軌跡都是遊程，會列在這裡。',
  'help.guide.tour-add-to-day.step.5':
    '如果遊程有分階段，同一個選單接著會詢問。「從這一天起按階段安排」會把第 1 階段排在那一天，之後每個階段依序排在隔天，「整條路線放在這一天」則把整個遊程排在同一天。',
  'help.guide.tour-day-times.step.1': '在天數欄中，將游標移到遊程那一列，點擊「更多選項」（三個點）並選擇「編輯」。',
  'help.guide.tour-day-times.result': '遊程會和其他有時間的停靠點一樣，連同開始與結束時間顯示在當天的時間軸上。',
  'help.guide.tour-remove-from-day.result': '當天不再列出該遊程，列表中它那一列的日期徽章也消失了。',
  'help.guide.tour-filter-list.tip.2':
    '只有當遊程在某一項上有差異時，才會顯示對應的區段，所以遊程很少時，可能只會出現「狀態」。',
  'help.guide.tour-hide-on-map.tip.1':
    '隱藏只對你自己有效，而且只儲存在這個瀏覽器、僅限這趟旅行：遊程、它的日期和顏色都不會改變，其他人的地圖上仍會看到這個遊程。',
  'help.guide.tour-import-plan-tab.tip.1': '已經在旅行中的軌跡會標示「已在旅程中」，不會重複匯入。',
  'help.ctx.trip-tour-detail.bullet.4':
    '底部那一列有：開啟某一天時的「新增到當天」或「從當天移除」、前往起點的「導航」、遊程的網頁、GPX、裝置可分享檔案時出現的「分享」、「收藏」和「複製」。',
  'help.guide.tour-detail-read.step.5':
    '下方是各項數據：「距離」、「最低海拔」、「最高海拔」、「累計爬升」和「累計下降」，再下面是時間，最後是以遊程線條顏色繪製的海拔剖面圖。',
  'help.guide.tour-detail-read.result':
    '遊程的卡片在計畫旁邊開啟，你可以看到它排在哪幾天、有多長、多陡，以及來自哪裡。',
  'help.guide.tour-rename-colour.tip.2': '鉛筆和圓點只對有權編輯地點的成員有效。',
  'help.guide.tour-take-along.tip.2': '在「設定」中選好偏好的地圖 App 後，「導航」會直接開啟該 App，不再列出所有選項。',
  'help.guide.tour-copy-keep.step.3': '如果想把遊程保存下來，供其他旅行使用，請開啟遊程，點擊卡片底部的「收藏」。',
  'help.guide.tour-packing-link.goal': '直接在遊程的卡片中顯示這個遊程要帶什麼，內容來自旅行的行李清單或其中一份清單。',
  'help.guide.tour-packing-link.tip.3': '建立連結需要編輯地點的權限。其他人看得到連結的清單，但不能更改連結。',
  'help.guide.tour-files.tip.2': '只有可以修改遊程並新增檔案的成員，才看得到「上傳」。',
  'help.guide.tour-activity-link.step.5': '軌跡現在會顯示在「實際軌跡」下，有自己的數值和剖面圖，與計畫並排比較。',
  'help.guide.tour-activity-compare.step.2':
    '「距計畫最遠」顯示軌跡與計畫線條之間的最大距離，「偏離計畫」則顯示軌跡有多少部分偏離了計畫線條。',
  'help.guide.tour-origin-check.step.1':
    '開啟遊程的卡片，捲動到「來源」。「來源」會說明它來自哪裡：「GPX 匯入」（附檔案名稱）、KML 或 KMZ 匯入，或 wanderer（附其位址）。',
  'help.ctx.trip-tour-planner.summary':
    '旅行的遊程規劃器：左邊是編輯器，右邊是旅行的所有遊程，中間是地圖。在這裡你可以逐點繪製遊程、沿著真實的步道和道路規劃路線、補上詳細資訊，並把它儲存到旅行中。',
  'help.guide.tour-open-workspace.goal': '開啟遊程規劃器，了解它每個部分的用途。',
  'help.guide.tour-open-workspace.tip.1':
    '每個側欄內側邊緣分頁標籤上的「折疊」可收起側欄，讓地圖有更多空間；「計畫」和「這趟旅行的遊程」則可讓側欄重新顯示。拖曳側欄邊緣可調整寬度。',
  'help.guide.tour-draw-route.step.3':
    '確認「路點」下的「新增地點」已開啟（它和地圖標籤中的「放置點」是同一個開關），然後在遊程起點的位置點擊地圖。',
  'help.guide.tour-draw-route.result': '地圖上會出現一條有編號的路線，「路點」下列出它的各個點，接著就可以命名並儲存。',
  'help.guide.tour-type-profile.tip.2':
    '有些類型需要補充更多資料才能儲存：「跑步」需要「計畫配速」，「划槳行程」需要船和水域，「滑雪與冬季」遊程則需要項目。',
  'help.guide.tour-edit-points.step.5': '旁邊的垃圾桶「刪除路線點」會把該點從遊程中移除。',
  'help.guide.tour-shaping-points.step.2': '把圓點拖到路線應該走的小徑上，路線會改為經過這個點重新規劃。',
  'help.guide.tour-loop-reverse.goal': '讓遊程的終點回到起點，或反方向走。',
  'help.guide.tour-leg-by-hand.title': '手動繪製路段，或重新規劃',
  'help.guide.tour-leg-by-hand.result': '該路段會依你選的位置畫成直線並標示為手動繪製，或是重新規劃路線。',
  'help.guide.tour-trip-places.tip.2': '移除停靠點或解除連結，地點仍會留在旅行中，包括它排定的日期，一切保持原樣。',
  'help.guide.tour-details-times.step.4':
    '「計劃中」顯示總時間。你也可以輸入自己的數值來覆寫，此時會標示為「手動覆寫」。',
  'help.guide.tour-save.step.2': '等「新遊程」旁的圓點消失。「儲存」需要完整的路線和所有高度資料。',
  'help.guide.tour-edit-saved.goal': '開啟你之前規劃的遊程，修改後再儲存一次。',
  'help.guide.tour-edit-saved.result': '已儲存的遊程現在包含你的變更。',
  'help.guide.tour-summary-profile.tip.2': '經過岩釘路線的路線，數據上方會顯示帶有等級的警告徽章。',
  'help.guide.tour-list-manage.step.4':
    '「行程總覽」上方的按鈕是篩選器。它會顯示目前的狀態（一開始是「全部」）和遊程數量。',
  'help.guide.tour-delete.step.1':
    '將游標移到「這趟旅行的遊程」下的遊程上，點擊該列右側的垃圾桶，提示文字為「刪除」加上遊程名稱。',
  'help.guide.tour-saved-elsewhere.step.1':
    '編輯時，側欄頂部會出現「這個遊程已在別處儲存」。在你做出決定之前，你的變更都會保留。',
  'help.ctx.trip-tour-import.summary':
    '在這裡可以把已存在於別處的遊程匯入旅行：來自手錶或 App 的 GPX、KML 或 KMZ 檔案、你另一趟旅行的遊程，或你自己 wanderer 中的步道。匯入的內容會完全維持錄製時的樣子，你也可以據此規劃一個可編輯的版本。',
  'help.guide.tour-import-gpx.step.1': '開啟旅行的「遊程」分頁。在右側「這趟旅行的遊程」頂部，點擊 +（「新增行程」）。',
  'help.guide.tour-import-gpx.tip.4':
    '匯入 KML 或 KMZ 檔案時，「不匯入」下也會列出檔案中除了線條之外的內容，例如圖釘、區域和其他項目。',
  'help.guide.tour-view-import.tip.1':
    '匯入的遊程無法逐點編輯。使用上方「可編輯版本」卡片中的「規劃可編輯版本」，就能據此建立一個可以修改的遊程。',
  'help.guide.tour-plan-from-import.step.3':
    '點擊「取代匯入」，就能在原處重新規劃這個遊程：它的日期和筆記會保留，錄製的軌跡也會留著，隨時可以還原。「規劃為新遊程」則不會更動匯入的內容，而是在旁邊另外建立第二個遊程。',
  'help.guide.tour-restore-recorded.goal': '取消匯入遊程的重新規劃，找回原始軌跡，即使過了很久也可以。',
  'help.guide.tour-take-over.goal': '重複使用你在另一趟旅行中已規劃或匯入的遊程，不必重新繪製。',
  'help.guide.tour-take-over.tip.2': '只會列出你的其他旅行，而且只列出前 100 個遊程。其餘的請用搜尋或篩選來找。',
  'help.guide.tour-import-wanderer.step.4': '點擊「匯入旅行」。',
  'help.ctx.trip-tour-map.bullet.1':
    '地圖左下角的標籤包含目前開啟的遊程類型所提供的底圖：「地圖」、「地形圖」、健行時的「健行」、單車遊程時的「騎單車」，以及「衛星影像」。你在這裡的選擇只適用於規劃器，不會更改「設定」中的地圖設定。',
  'help.guide.tour-map-layers.step.2':
    '點擊「地形圖」，可顯示等高線和暈渲地形，這張地圖能讓你看出地面有多陡。你選擇的地圖會在標籤中維持反白。',
  'help.guide.tour-along-search.step.1':
    '在「遊程」分頁中開啟遊程，將左側面板向下捲動到遊程停靠點下方的「沿途」。遊程有了路線之後，才會出現這張卡片。',
  'help.guide.tour-along-search.tip.3':
    '搜尋結果來自 OpenStreetMap 和 TREK 的地點索引，所以搜尋需要網路連線。什麼都沒找到時，「擴大範圍至」會改用下一個距離再找。伺服器忙碌時，「重試」會顯示倒數，倒數結束就能再試一次。',
  'help.guide.tour-along-add-stop.tip.1': '該地點會成為遊程的停靠點，而不是旅行的地點，所以不會出現在地點列表中。',
  'help.guide.tour-3d-terrain.step.4': '拖曳「地形暈渲」滑桿，可把山丘放大到最高三倍，在地勢平緩的地方特別有用。',
  'help.guide.tour-3d-flyover.step.1':
    '將遊程切換到 3D。路線沿途的地形載入期間，播放按鈕的位置會有一個圓環逐漸填滿；填滿後，點擊「播放飛越」。鏡頭會跟著沿路線移動的圓點，「遊程摘要」中海拔剖面圖上的游標也會一起移動。',
  'help.guide.tour-map-overlays.title': '在地圖上疊加雪道或航標',
  'help.guide.tour-map-overlays.tip.2':
    '沒有開啟任何遊程時，雪道開關也在，所以你可以在規劃之前先查看滑雪場。健行時，標籤會改為提供「飛拉達」，並顯示視野內的路線數量。',
  'help.ctx.trip-tour-stages.bullet.5':
    '遊程那一列上的加號「新增到當天」，會從你選的那一天起，每天排一個階段，或是把整個遊程放在同一天。',
  'help.guide.tour-multi-day.step.6':
    '若要改回一日遊，請點擊「一日遊」，並在「改為一日遊？」中點擊「移除全部階段終點」確認。路線維持不變。',
  'help.guide.tour-stages-on-days.step.1': '在「這趟旅行的遊程」中，將游標移到多日遊程上，點擊加號「新增到當天」。',
  'help.guide.tour-stages-on-days.tip.3':
    '在「計畫」分頁中把多日遊程拖到某一天上，會用對話方塊詢問同樣的問題，遊程卡片中的「新增到當天」也一樣。',
  'help.ctx.trip-tour-hike.bullet.4':
    '路點下方的「路徑詳情」會從 OpenStreetMap 讀取每個路段的 SAC 等級、路面和道路類型，並依此為地圖上的路線著色。這裡的任何內容都不會更改遊程。',
  'help.guide.tour-hike-plan.step.4':
    '「新增地點」一開始就是開啟的：在地圖上點擊健行的起點和終點。旁邊的「行程地點」則可改為選擇旅行中的山屋或旅館。有兩個點之後，TREK 就會計算步行路線。',
  'help.guide.tour-hike-trail-details.title': '查看健行沿途的等級、路面和道路類型',
  'help.guide.tour-hike-trail-details.tip.1':
    'OpenStreetMap 上沒有數值的道路會列在「未知」下，而未知不代表好走。如果有些項目顯示「本次無法查詢」，請點擊「重試」。',
  'help.guide.tour-hike-round.step.4':
    '點擊某條環線即可選取。它那一列會顯示距離、爬升和時間，以及與你輸入的距離相差多少。',
  'help.guide.tour-hike-compare-ways.step.1':
    '將游標移到該路段起點的停靠點上，點擊它那一列的「更多操作」，然後選擇「比較下一段的道路」。',
  'help.guide.tour-ferrata-add.title': '在健行中加入岩釘路線',
  'help.guide.tour-ferrata-add.tip.1': '岩釘路線需要裝備和經驗。將游標移到徽章上，提示文字會顯示路線經過了其中多少。',
  'help.guide.tour-run-plan.step.3': '以每公里幾分幾秒輸入你的「計畫配速」，例如 7:30。',
  'help.guide.tour-run-ways.title': '查看跑步經過哪些路面',
  'help.ctx.trip-tour-walk.title': '城市散步',
  'help.guide.tour-walk-plan.goal': '用一個個停靠點組成一次觀光散步，並設定每處停留多久，以及哪些是重點。',
  'help.guide.tour-walk-plan.tip.2': '城市散步沒有健行的限制，也沒有「休息」欄位，而是改用停留時間。',
  'help.guide.tour-walk-sights.step.4':
    '點擊列表中的地點，它的卡片會在地圖上方開啟：在「插入位置」下，選擇它要放在哪兩個停靠點之間。',
  'help.guide.tour-walk-day-times.step.1':
    '把散步排到某一天：在「這趟旅行的遊程」中，點擊該列的圓形 +（「新增到當天」），然後選擇日期。',
  'help.guide.tour-walk-day-times.result': '你可以調整停靠點順序或停留時間，直到你抵達時每個地點都有營業。',
  'help.guide.tour-walk-google-import.tip.2':
    '「換一個連結」會回到連結輸入欄。載入會取代規劃器中尚未儲存的變更，對話方塊會先提醒你。',
  'help.guide.tour-walk-check-off.step.4':
    '列表頂部會統計已造訪的停靠點，並顯示剩餘的步行時間。點擊停靠點上的「復原」，可取消它的標記。',
  'help.ctx.trip-tour-bike.bullet.2':
    '右側的「遊程摘要」會顯示「騎乘時間（估算）」，也就是路線規劃器依設定檔算出的時間，並已計入爬升。不含休息時間。',
  'help.guide.tour-bike-profile.step.4':
    '在「路點」下，點擊「行程地點」並選擇起點和終點，這裡是 Hotel Alpenroyal，接著是 Hotel Greif。你也可以確認「新增地點」已開啟，然後直接點擊地圖。有兩個點之後，TREK 就會計算路線。',
  'help.guide.tour-bike-profile.tip.5':
    '如果管理員允許使用 CyclOSM 地圖，開啟單車遊程時，地圖上的圖層列也會提供「騎單車」。如果它載入失敗，請切換到「地圖」。遊程不會改變。',
  'help.guide.tour-bike-surfaces.tip.1':
    '「資料中沒有」表示 OpenStreetMap 沒有記錄那裡的路面。這代表路面未知，不代表路況良好。',
  'help.guide.tour-bike-mtb-grades.step.3': '點擊某個等級列，可在地圖上突顯對應的步道。',
  'help.ctx.trip-tour-ski.bullet.1':
    '「項目」排在最前面，而且沒有預設選項：「高山滑雪」、「單板滑雪」、「越野滑雪」、「登山滑雪」、「雪鞋」或「冬季健行」。選擇「越野滑雪」時，還要選「技術」：「傳統式」、「自由式」或「未知」。沒有選擇項目就無法儲存遊程。',
  'help.guide.tour-ski-plan.step.2': '開啟「路線類型」並選擇「滑雪與冬季」。',
  'help.guide.tour-ski-plan.tip.4':
    '沒有雪道資料的地方，路段會在兩點之間直接連成直線。雪鞋和冬季健行也可能改走夏季小徑，路段上會以灰色備註說明。',
  'help.guide.tour-ski-options.step.5':
    '在「排除」下，按下你不想搭乘的纜車類型：「拖牽」、「開放式吊椅」、「吊廂」、「索道」或「纜索鐵路和火車」。已按下的項目會加上刪除線。',
  'help.guide.tour-ski-fix-leg.step.2':
    '點擊該列提供的修正方式：「允許更難的雪道」、「允許這條纜車」、「搭纜車下山」、「切換技術」或「切換項目」。選項會隨之改變，該路段也會重新規劃。',
  'help.guide.tour-ski-summary.goal': '查看一天的時間如何分配在滑行、纜車、等待和步行上。',
  'help.guide.tour-ski-summary.result': '你會知道這一天在雪道上、在纜車上，以及排隊等纜車各花了多少時間。',
  'help.guide.tour-ski-pistes-layer.tip.3':
    '這個圖層是地圖資料，不是即時資訊，不會顯示哪些雪道開放或已整理，也沒有雪況或雪崩資訊。沒有開啟任何遊程時開關也在，所以你可以在規劃之前先查看滑雪場。',
  'help.guide.tour-ski-import.step.5':
    '在「這趟旅行的遊程」中點擊該軌跡將它開啟。之後如果要更正項目，請點擊它的「滑雪軌跡」卡片中的「更換」。',
  'help.ctx.trip-tour-paddle.bullet.1':
    '在「路線類型」下，「划槳行程」需要選擇「船」（「獨木舟（Kayak）」、「加拿大式獨木舟」、SUP 或「其他」）和「水域」（「河流」或「湖泊」）。兩者都選好之前，無法儲存遊程。',
  'help.guide.tour-paddle-setup.step.1': '在「遊程」分頁中，點擊左欄頂部的「規劃新遊程」。',
  'help.guide.tour-paddle-setup.tip.2':
    '划槳遊程的地圖提供「地圖」和「衛星影像」，另有來自 OpenSeaMap 的「航標」可作為疊加圖層。',
  'help.guide.tour-paddle-water-route.step.3':
    '選擇「沿水路規劃下一段」。TREK 會沿著河流或湖泊，規劃從這個點到下一個點的路段。',
  'help.guide.tour-paddle-portage.title': '搬運船隻繞過障礙',
  'help.guide.tour-paddle-portage.tip.2':
    '在最後一個點上，「從這裡開始搬運船隻」要等你設好下一個點才會生效。該列會顯示「從這裡開始搬運」，點擊旁邊的叉號「不再搬運」即可撤銷。',
  'help.guide.tour-paddle-lock.step.4': '輸入「等待」和「過閘」的分鐘數。兩者都填好後，卡片會顯示兩者的總和。',
  'help.guide.tour-paddle-time.step.2':
    '長條圖顯示從起點到終點的路線：水面、棕色的陸上搬運，以及以刻度表示的船閘。路線上的障礙是可以點擊的標記，點擊後會在地圖上找到它們。',
  'help.guide.tour-paddle-wind.title': '查看划槳當天的風況',
  'help.guide.tour-paddle-wind.tip.3': '在有風又要橫渡湖泊的日子，卡片會提供「沿岸規劃」，沿著湖岸規劃湖泊路段。',
  'help.guide.tour-paddle-checklist.step.4':
    '點擊一個項目，地圖會移到它的位置：障礙會開啟附有你的決定的卡片，你自己加的陸上搬運或船閘則會選取它的點。',
  'help.guide.tour-paddle-track-marks.title': '在錄製的划槳軌跡上標記陸上搬運與船閘',
  'help.guide.tour-paddle-track-marks.step.7': '開啟卡片，輸入所需的分鐘數，然後點擊「儲存」。',
  'help.ctx.trip-tour-horse.bullet.2':
    '路線會在自己的對話方塊中開啟：選擇一個路段和你騎乘的「方向」，查看「馬匹通行」，然後點擊「採用路段」。',
  'help.guide.tour-horse-plan.step.3':
    '在「騎馬路線」卡片中，點擊「在地圖畫面中尋找」。畫面中每條有路標的馬匹路線都會列在那裡，並附上長度。',
  'help.guide.tour-horse-plan.tip.3':
    '搜尋後移動了地圖嗎？按鈕會顯示「搜尋此畫面」。如果畫面範圍太大，會要求你先放大。',
  'help.guide.tour-horse-gap.step.4':
    '在「路點」卡片中，銜接路段會顯示為「手動，未經檢查」，並附上長度。將游標移上去可看到原因。',
  'help.guide.tour-horse-recorded.step.2':
    '「匯入預覽」隨即開啟，此時還沒有儲存任何內容。在「匯入為」下，將「路線類型」設為「騎馬遊」。三個徽章會說明匯入保留了哪些內容，以及哪些內容沒有計算。',
  'help.guide.dateless-trip.goal': '還不確定何時出發，也可以先開始規劃。',
  'help.guide.trip-reminder.step.3': '點擊「更新」。',
  'help.guide.upcoming-reservations.goal': '查看所有旅行中接下來預訂了什麼，並開啟預訂所屬的旅行。',
  'help.guide.log-day.tip.3': '標記為整天公司假日的日子無法登記休假。在半天的公司假日，一天休假只扣 0.5。',
  'help.guide.half-company-holiday.goal': '讓所有人放半天假（例如平安夜），而不必把整天都設為休息。',
  'help.guide.public-holidays.tip.2': '將游標移到表格中的假日上，就能看到它的名稱。',
  'help.guide.edit-holiday-calendar.step.3': '在列表中更改國家或地區，或點擊垃圾桶移除該日曆。',
  'help.guide.person-color.step.2': '選擇一種顏色。顏色會立即儲存，對話方塊也會隨之關閉。',
  'help.guide.answer-fusion-request.goal': '決定要不要和邀請你的人合併休假計畫。',
  'help.guide.log-for-partner.goal': '替已合併到你計畫中的人登記休假日，例如他們請你幫忙時。',
  'help.guide.dissolve-fusion.goal': '把合併的計畫拆回各自獨立的計畫。',
  'help.guide.country-places.step.1': '搜尋你去過的國家並選擇它，底部的面板就會出現該國家的卡片。',
  'help.guide.tour-activity-stats.step.3':
    '查看數字：距離（角落標有遊程數量），接著是「累計爬升」和「累計下降」。選擇「所有型別」時，後面會列出你完成最多的三種類型，各附數量和距離。',
  'help.guide.move-to-list.step.1': '點擊篩選列中的核取方塊圖示「選擇」，然後勾選地點。',
  'help.guide.tour-collection-add-to-trip.step.2': '在「加入的行程」下選擇旅行。你無權新增遊程的旅行會顯示為淡色。',
  'help.guide.tour-collection-manage.goal': '查看清單裡有哪些遊程、它們來自哪裡，並移除不再需要的遊程。',
  'help.guide.entry-draft.goal': '現在就寫下條目，並在準備好之前不讓它出現在共享的旅程中。',
  'help.guide.journey-map-layers.step.2': '點擊圖層列末端的 (i) 查看地圖圖例，它會說明每種圖釘、圓點和線條。',
  'help.guide.journey-keep-route.step.2':
    '確認決定一天從何時開始、何時結束的「這一天的時區」，並查看錄製內容：距離、時間範圍、片段和缺口。',
  'help.guide.journey-day-stays.step.2':
    '在停留點上點擊「寫一篇日誌條目」。條目會加到那一天，時間為抵達時間，並帶有停留點的名稱和位置。',
  'help.guide.journey-take-over-day.step.2':
    '勾選要保留的停留點，並修正它們的名稱。兩個已勾選的停留點之間的「合併為一個項目」可將它們合併，「保持分開」則再次拆開。',
  'help.guide.journey-auto-prepare.step.1': '點擊標題區右上角的 ⋯，開啟「旅程設定」。',
  'help.guide.photo-location.step.1': '點擊標題區右上角的 ⋯，開啟「旅程設定」。',
  'help.guide.share-public.tip.3': '草稿不會出現在連結上，記錄的路線也只會顯示在有已發布條目的日子。',
  'help.ctx.settings-plugins.title': '外掛',
  'help.ctx.settings-about.bullet.2': '「回報錯誤」和「功能建議」會在 GitHub 上開啟專案，Wiki 則開啟文件。',
  'help.guide.map-provider.tip.3': '在 GL 地圖上，按住右鍵拖曳可旋轉和傾斜地圖，按滑鼠中鍵可新增地點。',
  'help.guide.web-push-device.step.1':
    '在「此裝置上的推播通知」下，點擊「為此裝置開啟」，並在瀏覽器詢問時允許通知。「傳送測試」可確認通知有沒有送達。',
  'help.guide.connect-airtrail.title': '連接你的 AirTrail',
  'help.guide.connect-dawarich.title': '連接你的 Dawarich',
  'help.guide.tour-connect-wanderer.title': '連接你的 wanderer',
  'help.guide.tour-connect-wanderer.tip.3': '右側的「中斷連線」會再次移除權杖。',
  'help.guide.tour-wanderer-watch.tip.3':
    '這些提示要透過哪些管道通知你，請在「通知」中「wanderer：關於你的路線的提示」那一列設定。',
  'help.guide.plugin-settings.tip.1': '這些設定只屬於你自己，其他成員要各自設定外掛。',
  'help.guide.offline-conflicts.step.3':
    '伺服器一再拒絕的變更會顯示在「離線快取」下的「失敗的變更」：「重試」會再送出一次，「捨棄」則保留伺服器的版本。',
  'help.ctx.admin-notifications.bullet.4':
    '底部的「使用者預設值」：針對還沒自行更改設定的所有人，依事件和管道設為開啟、「關閉」或「封鎖」。',
  'help.guide.default-user-settings.step.2': '你設定過的欄位，名稱旁會出現重設連結，點擊可恢復 TREK 內建的預設值。',
  'help.guide.own-routing-engine.title': '使用你自己的路線規劃伺服器',
  'help.guide.admin-passkeys.result': '登入頁面會出現「使用 Passkey 登入」，使用者也可以在自己的設定中新增 Passkey。',
  'help.guide.rotate-jwt-secret.goal': '在懷疑金鑰外洩後，結束所有工作階段。',
  'help.guide.notification-defaults.result':
    '尚未更改格子的使用者，都會從你的設定開始；被封鎖的格子在他們的設定中會顯示為鎖定。',
  'help.ctx.notifications.bullet.3':
    '每則通知都會說明誰在哪裡做了什麼，未讀的通知背景會帶有底色。通知下方的按鈕（例如「查看旅行」或「查看 Vacay」）會帶你過去，同時把通知標為已讀。',
  'help.guide.read-notifications.tip.1': '鈴鐺會出現在每個有導覽列的畫面上，有新通知時，上面的數字會自動更新。',
  'help.guide.filter-notifications.tip.1': '往下捲動時，頁面會載入更早的通知，所以不會只顯示第一個畫面的內容。',
  'help.guide.mark-notifications-read.result': '所有通知都不再有底色，鈴鐺上的紅色數字也消失了。',
  'help.guide.notification-settings.title': '選擇哪些事件要通知你',
  'help.guide.link-journal.step.1': '點擊旅行名稱旁的「旅行設定」，然後在左側選擇「日誌」。',
  'help.guide.dawarich-stays.tip.1':
    '在你點擊「新增地點」之前，不會有任何內容加入旅行。由停留點新增的地點，詳細資訊中會註明「來自你的 Dawarich 紀錄」。',
  'help.guide.leave-stop-off-route.title': '讓停靠點不納入路線',
  'help.guide.move-booking-day.step.1': '將游標移到當天預訂的那一列：左側出現握把，表示可以拖曳。',
  'help.guide.place-image-from-file.tip.1': '只會列出 JPG、PNG、GIF 和 WebP 檔案，PDF 票券不在其中。',
  'help.guide.place-own-hours.step.4':
    '「營業時間」右側的按鈕：複製按鈕會把週一的時間套用到每一天，X 則再次移除你設定的時間。如果 TREK 原本找到了這個地點的營業時間，點擊「從地點詳情帶入」可把那些時間放回來。',
  'help.guide.confirm-stay-booking.step.2': '預訂會在計畫上方開啟，標題中的第一個標籤顯示它的狀態。',
  'help.ctx.trip-map.bullet.9':
    '旅行的每個遊程都以其顏色的線條顯示，起點有一枚圖釘。點擊線條可開啟遊程的卡片。在有遊程的那一天，當天路線會通往遊程的起點，並從終點繼續。點擊「遊程」列表中遊程旁的眼睛「在地圖上隱藏」，可把它的線條從你的地圖上移開。',
  'help.guide.tour-map-lines.result':
    '你想看的遊程會以各自的顏色顯示在地圖上，你隱藏的那個則以淡色留在「遊程」列表中。',
  'help.guide.car-stops.step.2':
    '點擊標題列中的類型標籤並選擇「汽車」。表單會隨之改變：「日期」和「開始時間」變成「取車日期」和「取車時間」，「結束日期」和「結束時間」變成「還車日期」和「還車時間」，「沿途停靠點」則出現在「來自」和「到」下方。',
  'help.guide.transport-details.goal': '在同一處查看行程的所有詳細資料、複製預訂碼、重新命名，或直接跳到地圖上的位置。',
  'help.guide.transport-details.tip.2':
    '按 Escape 或點擊詳細資訊外面即可關閉。如果「重新命名」或刪除確認正開啟著，會先關閉它們。',
  'help.guide.export-transports-csv.tip.1': '分頁中至少有一段行程時，工具列才會出現這個圖示。',
  'help.guide.group-sort-bookings.step.1': '在「卡片」或「清單」中，點擊三個檢視圖示後面的滑桿圖示「檢視選項」。',
  'help.guide.create-booking.tip.4':
    '離線時，預訂會先儲存在這台裝置上，等重新上線後再同步。新增檔案需要網路連線，所以請先移除檔案，或晚點再儲存。如果不小心點到表單外面或按了 Escape，TREK 會先詢問「放棄變更？」，不會讓你輸入的內容直接消失。',
  'help.guide.booking-on-map.tip.2': '住宿會開啟到入住的第一晚。',
  'help.guide.export-bookings-csv.step.3': '點擊「檢視選項」後面的試算表圖示「匯出為試算表 (CSV)」。',
  'help.guide.arrange-packing-list.step.3':
    '在「已分享」和「我的清單」那一列最右邊，點擊「依名稱」，會依名稱順序顯示每份清單的物品，方便你快速確認某樣東西是否已在清單上。再點一次就會回到你自己的順序。',
  'help.guide.count-packed-pieces.step.1':
    '點擊該列的數量徽章（後面帶 x 的小數字），輸入你要帶幾件（例如 5），然後按 Enter。',
  'help.guide.expense-receipts.step.3':
    '點擊對話方塊底部的「儲存」。檔案會隨支出一起上傳，也會出現在旅行的「檔案」中。',
  'help.guide.files-sync-settings.step.1':
    '點擊列最右端的「文件同步」。如果旅行已綁定儲存空間，該儲存空間的卡片會在右側開啟；如果有多個儲存空間，請在左側「這次旅行」下點擊你要的那一個。',
  'help.guide.files-sync-settings.tip.3':
    '「即時更新」是帶有「複製」的連結，只有 TREK 無法自動訂閱變更的儲存空間才會有。把連結貼到儲存空間中，變更就會立即送達，不必等到下次檢查。',
  'help.guide.manage-notes.step.1':
    '點擊筆記卡片標題中的三個點（「更多選項」）。選單裡有「展開」、「置頂」、「編輯」和「刪除」。',
  'help.guide.note-categories.title': '把筆記分類整理',
  'help.guide.note-categories.result': '筆記會顯示新的名稱和顏色，「筆記」卡片也只會顯示你選的分類。',
  'help.guide.roadtrip-stops.tip.5':
    '在每日計畫中有結束時間的停靠點，會停留到該時間為止。它的對話方塊會顯示行車何時離開，點擊「移除結束時間」就能重新自己設定停留時間。',
  'help.guide.roadtrip-reorder.tip.2': '已預訂的行程及其站點會留在預訂決定的位置，只有地點可以拖曳。',
  'help.guide.roadtrip-overnight.step.2':
    '旅館顯示的是床鋪圖示，而不是加號。點擊它（「新增為過夜住宿」），就會開啟「新增為停靠點」來安排過夜。露營地則使用一般的「新增」。',
  'help.guide.roadtrip-stop-fill.goal':
    '為某個加油或充電的停靠點設定專屬的補給量，例如快速充電站充到 80 %，過夜則充到 100 %。',
  'help.guide.roadtrip-bookings.goal': '查看已預訂的行程在行車路線中的位置，以及你必須在什麼時間抵達那裡。',
  'help.guide.roadtrip-bookings.tip.3':
    '不在旅行任何一天的行程不會納入行車路線。側欄頂部會有提示指出這筆行程，並附「開啟預訂」讓你為它設定日期。',
  'help.guide.roadtrip-google-import.step.4': '在「日期」下選擇要放入這些停靠點的那一天，然後點擊「匯入」。',
  'help.guide.roadtrip-hazards.step.2': '在對話方塊右欄底部的「目前警報」下，開啟「顯示危險區域」，然後點擊「關閉」。',
  'help.ctx.trip-tours.bullet.1':
    '右欄頂部的「地點」和「遊程」開關，會把地點列表換成遊程。只有開啟遊程擴充套件時才會有這個開關，而且此時遊程不會出現在「地點」列表中。',
  'help.guide.tour-show-list.step.1':
    '在「計畫」分頁中，點擊右欄頂部開關裡的「遊程」。這一欄現在會列出遊程，而不是地點。',
  'help.guide.tour-show-list.result': '右欄會列出旅行的遊程，你點擊的那個遊程會在它的卡片中開啟。',
  'help.guide.tour-add-to-day.tip.1':
    '把有階段的遊程拖到某一天，會用小對話方塊詢問同樣的問題。點擊「取消」則計畫維持原樣。',
  'help.guide.tour-day-times.step.2':
    '設定「開始」，「結束」留空。欄位下方的那行字會顯示 TREK 算出的結束時間，也就是開始時間加上遊程所需的時間。',
  'help.guide.tour-remove-from-day.title': '把遊程從某一天移除',
  'help.guide.tour-filter-list.title': '篩選遊程列表',
  'help.guide.tour-filter-list.tip.3':
    '如果沒有符合的遊程，列表會顯示「沒有符合這些篩選條件的遊程」，點擊「重設篩選」可全部清除。篩選只會改變列表顯示的內容，不會更動任何遊程或日期。',
  'help.guide.tour-hide-on-map.tip.2':
    '手機版地圖一律顯示所有遊程，「遊程」分頁也沒有眼睛圖示，隱藏功能只能在這裡的「計畫」分頁使用。',
  'help.guide.tour-import-plan-tab.tip.2':
    '匯入的遊程會留在這裡的列表中，不會在規劃器中開啟。你可以點擊它的圓形 + 排到某一天，也可以開啟「遊程」分頁在那裡查看。',
  'help.ctx.trip-tour-detail.bullet.5':
    '這張卡片用來閱讀，以及處理與遊程相關的事項。路線本身要到「遊程」分頁修改：開啟該分頁，點擊「這趟旅行的遊程」下的遊程。刪除遊程也是在那裡，不是在這裡。',
  'help.guide.tour-detail-read.step.6':
    '繼續往下捲動，可看到「描述」和「筆記」，接著是「來源」：在 TREK 中規劃、匯入來源的檔案，或它所來自的 wanderer 路線，並附日期。',
  'help.guide.tour-rename-colour.title': '重新命名遊程並更改顏色',
  'help.guide.tour-rename-colour.result': '遊程在旅行各處都會顯示新名稱，它的線條也會改用你選的顏色。',
  'help.guide.tour-take-along.tip.3': '檔案由伺服器提供，所以需要網路連線。離線建立的遊程，要等同步後才能下載。',
  'help.guide.tour-copy-keep.step.4': '在「收藏」下選擇清單，確認「在收藏中的名稱」，然後點擊「保存」。',
  'help.guide.tour-packing-link.step.1': '開啟遊程的卡片，捲動到「行李清單」，然後點擊「連結行李清單」。',
  'help.guide.tour-packing-link.result': '你會進入「行李」分頁中的行李清單，遊程的卡片也會即時顯示你勾選的每個物品。',
  'help.guide.tour-files.result': '檔案已附加到遊程，可以從它的卡片開啟。',
  'help.guide.tour-activity-link.tip.1': '計畫維持不變，軌跡只是被連結，點擊「取消關聯」即可再次移除連結。',
  'help.guide.tour-activity-compare.step.3':
    '點擊「在地圖上比較」，實際軌跡會以點線畫在計畫旁邊。點擊「結束比較」即可移除。',
  'help.guide.tour-origin-check.step.2':
    '「已匯入」顯示匯入的日期。「這裡」說明目前的狀態：「與匯入時相同」、「已在 TREK 中編輯」，或「已重新規劃，記錄的軌跡已保留」。',
  'help.ctx.trip-tour-planner.bullet.1':
    '開啟遊程擴充套件後，「遊程」會出現在旅行分頁列中「計畫」的後面。這個分頁只在電腦和平板上提供，在手機上則可從「計畫」分頁查看遊程並排到各天，但不能繪製。',
  'help.guide.tour-open-workspace.step.1': '點擊旅行分頁列中「計畫」後面的「遊程」。地圖會佔滿畫面，兩側各有一個側欄。',
  'help.guide.tour-open-workspace.tip.2':
    '把 GPX、KML 或 KMZ 檔案拖放到這個分頁的任何位置，就能將它們匯入為旅行的遊程。',
  'help.guide.tour-draw-route.step.4': '地圖底部會出現「已放置點」。旁邊的「復原」可再次移除該點。',
  'help.guide.tour-type-profile.title': '選擇遊程的類型',
  'help.guide.tour-type-profile.result': '遊程會依你選的類型和設定檔規劃路線。',
  'help.guide.tour-edit-points.step.6':
    '側欄標題中的「復原路線點編輯」和「重做路線點編輯」，可以逐步復原或重做每一項變更。',
  'help.guide.tour-shaping-points.step.3': '它會在「路點」下列出，帶有「塑形點」徽章但沒有編號，所以停靠點的編號不變。',
  'help.guide.tour-loop-reverse.step.1': '點擊「路點」卡片標題中的「返回起點」。遊程會多出最後一段，回到第一個點。',
  'help.guide.tour-leg-by-hand.goal': '在路線規劃器找不到路的地方，用直線連接兩個點，或讓某一段重新規劃。',
  'help.guide.tour-trip-places.title': '把旅行中的地點當作停靠點',
  'help.guide.tour-trip-places.tip.3': '旅行中的其他遊程不能被當作停靠點。',
  'help.guide.tour-details-times.tip.1': '時間可以輸入為 2:56、2 小時 56 或 176 分鐘。',
  'help.guide.tour-save.step.3': '點擊左側欄底部的「儲存」。畫面會顯示「遊程已儲存」，側欄標題也會變成「編輯遊程」。',
  'help.guide.tour-edit-saved.step.1':
    '點擊「這趟旅行的遊程」下的遊程。它會以「編輯遊程」在左側欄開啟，地圖上則顯示它的路線。',
  'help.guide.tour-summary-profile.title': '閱讀遊程摘要和海拔剖面圖',
  'help.guide.tour-summary-profile.tip.3': '划槳遊程不顯示高度，因為在水面上，唯一能取得的高度只會是河岸的高度。',
  'help.guide.tour-list-manage.step.5':
    '選擇「未規劃」可查看尚未排入任何一天的遊程，也可以依「來源」、「路線上限」或「型別」縮小範圍。每一行都會顯示符合的遊程數量，總計也會隨篩選而變。',
  'help.guide.tour-delete.step.2': '看一下一併刪除的內容：路線、可編輯的路點和日期安排。然後點擊「永久刪除」。',
  'help.guide.tour-saved-elsewhere.step.2': '「載入較新版本」會在你確認後，用較新的版本取代你的變更。',
  'help.ctx.trip-tour-import.bullet.1':
    '「這趟旅行的遊程」頂部的 + 是「新增行程」，有「匯入 GPX 或 KML」、「從 Google Maps 匯入漫步」和「從其他行程引入路線」。檔案也可以直接拖放到「遊程」分頁的任何位置。',
  'help.guide.tour-import-gpx.step.2':
    '選擇「匯入 GPX 或 KML」，然後選取一個或多個 .gpx、.kml 或 .kmz 檔案，每個檔案最大 10 MB。',
  'help.guide.tour-import-gpx.tip.5':
    '沒有高度資料的檔案會顯示「檔案中沒有海拔」。線條和距離仍然正確，但爬升和下降會維持未知。',
  'help.guide.tour-view-import.tip.2': '標題中的下載圖示可再次將它儲存為 GPX 檔，書籤圖示則會把它保存到收藏中。',
  'help.guide.tour-plan-from-import.step.4':
    '遊程會連同路點在編輯器中開啟。需要的話可以修改，然後點擊欄位底部的「儲存」。',
  'help.guide.tour-restore-recorded.step.1':
    '在「這趟旅行的遊程」中，點擊你重新規劃過的遊程。編輯器中的「錄製的軌跡」卡片會說明，錄製時的軌跡仍保留著。',
  'help.guide.tour-take-over.step.1':
    '開啟要放入遊程的那趟旅行的「遊程」分頁，在「這趟旅行的遊程」頂部點擊 +（「新增行程」）。',
  'help.guide.tour-take-over.tip.3':
    '引入路線需要網路連線。如果編輯器中有未儲存的變更，副本仍會加入列表，但不會直接開啟，以免蓋掉你正在進行的編輯。',
  'help.guide.tour-import-wanderer.tip.1':
    '要先在「設定」的「整合」中連接 wanderer，才會有這個按鈕。在那之前，列表會提供「在設定中連結」。',
  'help.ctx.trip-tour-map.bullet.2':
    '標籤中分隔線之後是各遊程類型專用的開關：編輯遊程時的「放置點」、健行時的「飛拉達」、划槳遊程時的「航標」，以及滑雪遊程時的雪道。最後的 3D 會把遊程顯示在立體地形上。',
  'help.guide.tour-map-layers.step.3':
    '健行時，點擊「健行」可看到標示的步道及其編號；單車遊程則改為提供「騎單車」，顯示單車路線。「衛星影像」提供空拍影像，「地圖」則回到標準地圖。',
  'help.guide.tour-along-search.step.2':
    '點擊「要找什麼」並勾選你想要的類型，一次最多六個：「觀景點」、「山頂」、「山屋與避難處」、「飲用水」、「餐飲」等。列表只會提供適合該遊程類型的項目，遊程一開始會勾選其中三個。',
  'help.guide.tour-along-add-stop.title': '把遊程沿途的地點加為停靠點',
  'help.guide.tour-along-add-stop.tip.2':
    '如果某個地點會成為新的終點，會標示「會延長路線」：原本的終點不再是終點，遊程會繼續延伸到這個地點。',
  'help.guide.tour-3d-terrain.step.5': '再次點擊 3D，即可回到平面地圖繼續規劃。',
  'help.guide.tour-3d-flyover.step.2':
    '在「速度」下選擇 1×、2× 或 4×。在 1× 時，大多數遊程從起點到終點大約需要 45 秒。',
  'help.guide.tour-map-overlays.goal': '規劃滑雪或划槳遊程時，把滑雪雪道和纜車，或浮標和港口標誌，疊加顯示在地圖上。',
  'help.guide.tour-map-overlays.tip.3':
    '某個圖層停止載入時，它的開關會顯示 ! 和說明，地圖和你的路線不受影響，仍可正常使用。',
  'help.guide.tour-multi-day.title': '規劃跨多日的遊程',
  'help.guide.tour-multi-day.tip.1':
    '「在此結束階段」對一日遊也有效，遊程會自動變成多日遊程。第一個和最後一個停靠點以及塑形點，不能作為階段的終點。',
  'help.guide.tour-stages-on-days.step.2': '選擇第一個階段開始的日期。',
  'help.guide.tour-stages-on-days.tip.4':
    '在每日計畫中，每個階段會顯示為「階段 N」，附有各自的距離和時間。「計畫」分頁中天數上方的「復原」，可一步取消整個排程。',
  'help.ctx.trip-tour-hike.bullet.5':
    '健行時，左下角那一排地圖按鈕中的「飛拉達」會顯示附近的飛拉達。飛拉達的卡片可以把它作為獨立的一段加入路線。',
  'help.guide.tour-hike-plan.step.5':
    '在「詳細資訊」下，開啟「步道最高難度」，選擇步道最多可以多難，從 T1（健行）到 T6（高難度高山健行）。路線會在這個範圍內重新規劃。',
  'help.guide.tour-hike-trail-details.goal': '查看 OpenStreetMap 記錄的健行路徑資訊，並在地圖上找到對應的路段。',
  'help.guide.tour-hike-trail-details.tip.2': '等級高於健行上限的路段，該列會顯示「超出上限」徽章。',
  'help.guide.tour-hike-round.step.5': '點擊「選用此環線」，當系統詢問是否取代已規劃的路線時，點擊「取代」。',
  'help.guide.tour-hike-compare-ways.step.2':
    '「這一段的其他道路」會在地圖上方開啟，列出「目前道路」和「道路 A」、「道路 B」等。每一條都以各自的顏色畫在地圖上，將游標移到某一列上，就會突顯它的線條。',
  'help.guide.tour-ferrata-add.goal': '找出健行路線周圍的飛拉達，並把其中一條納入路線。',
  'help.guide.tour-ferrata-add.tip.2':
    '飛拉達只提供給健行使用。路線已經經過的飛拉達，卡片上會顯示「行程的一部分」，而不是「加入行程」。',
  'help.guide.tour-run-plan.step.4':
    '在地圖上設定起點和終點，或用「行程地點」選擇。配速下方會顯示跑步時間，也就是距離乘以配速。',
  'help.guide.tour-run-ways.goal': '查看一次跑步中有多少路段是未鋪面，以及路徑有多難。',
  'help.ctx.trip-tour-walk.summary':
    '在「遊程」分頁規劃的逐站步行遊程：每個停靠點停留多久、哪些是重點、沿途的景點，以及散步當天何時抵達每個停靠點，並與營業時間比對。',
  'help.guide.tour-walk-plan.step.1': '點擊左欄頂部的「規劃新遊程」，然後開啟「路線類型」並選擇「城市散步 / 觀光」。',
  'help.guide.tour-walk-plan.tip.3':
    '停靠點「更多操作」中的「解除與地點的連結」只會取消與行程地點的連結，地點本身仍留在旅行中。',
  'help.guide.tour-walk-sights.step.5': '點擊「新增為停靠點」。通知會說明散步增加了多少時間，旁邊有「復原」。',
  'help.guide.tour-walk-day-times.step.2':
    '為它設定那一天的開始時間：在「計畫」分頁中，對當天的散步按右鍵，選擇「編輯」並輸入「開始」。',
  'help.guide.tour-walk-google-import.title': '把 Google Maps 步行路線變成城市散步',
  'help.guide.tour-walk-google-import.tip.3':
    '只會引入停靠點，不包含在 Google Maps 中畫出的線條。縮短的 maps.app.goo.gl 連結需要網路連線才能展開。',
  'help.guide.tour-walk-check-off.tip.1': '標記是依天儲存的：請從計畫中該天開啟散步，而不是從遊程列表開啟。',
  'help.ctx.trip-tour-bike.bullet.3':
    '路點下方的「路面與道路」卡片會顯示路線經過的路況：路面、道路類型，以及已知為未鋪面的比例。點擊某一列，可在地圖上突顯對應的路段。',
  'help.guide.tour-bike-profile.step.5':
    '查看右側「遊程摘要」中的「騎乘時間（估算）」。將游標停在它的資訊圓點上，可看到計算方式。',
  'help.guide.tour-bike-surfaces.title': '查看單車遊程經過的路面',
  'help.guide.tour-bike-surfaces.tip.2':
    '在「公路」設定檔下，長條圖上方的警告會說明已知有多長是未鋪面。點擊「在地圖上顯示」可標出這些路段。',
  'help.guide.tour-bike-mtb-grades.result': '地圖會標出你所選等級的步道，你也就知道遊程中哪些路段比較難。',
  'help.ctx.trip-tour-ski.bullet.2':
    '項目下方是雪道路線規劃器的選項，只會顯示你的項目用得到的：「最難的雪道」、「優先」、「節奏」、「搭乘纜車」等開關，以及用來排除不想搭乘的纜車類型的「排除」。每次更改都會重新規劃遊程。',
  'help.guide.tour-ski-plan.step.3':
    '在「項目」下選擇你要做的活動：「高山滑雪」、「單板滑雪」、「越野滑雪」、「登山滑雪」、「雪鞋」或「冬季健行」。沒有預設選項，沒選的話就無法儲存遊程。',
  'help.guide.tour-ski-plan.result':
    '「這趟旅行的遊程」中有一個已儲存的「滑雪與冬季」遊程，各路段沿著地圖上標示的雪道、纜車和步道，所需時間則顯示在「遊程摘要」中。',
  'help.guide.tour-ski-options.tip.1': '每次更改都會逐段重新規劃遊程。',
  'help.guide.tour-ski-fix-leg.step.3': '如果沒有適合的修正方式，請點擊「畫直線」。該路段會變成兩點之間的直線。',
  'help.guide.tour-ski-summary.step.1': '在路點下方找到「雪道路線」卡片。點擊它的標題可收合，再點一次即可展開。',
  'help.guide.tour-ski-pistes-layer.title': '在地圖上顯示雪道',
  'help.guide.tour-ski-pistes-layer.result': '雪道會畫在遊程下方，你也能看懂它們的顏色。',
  'help.guide.tour-ski-import.step.6': '在「為滑雪軌跡分類」中選擇正確的項目或技術，然後點擊「儲存」。',
  'help.ctx.trip-tour-paddle.bullet.2':
    '每個點都用徽章標示它的角色：「下水點」、「上岸點」、「重新下水點」或「最終上岸點」。點的下方會顯示接下來的內容：手動繪製的路段、陸上搬運、船閘，或路段無法規劃的原因。',
  'help.guide.tour-paddle-setup.step.2': '開啟「路線類型」並選擇「划槳行程」，也就是「水上，獨木舟、加拿大艇或立槳」。',
  'help.guide.tour-paddle-setup.tip.3': '在划槳遊程中，「沿途」會優先尋找「下水點」、「租船」和「飲用水」。',
  'help.guide.tour-paddle-water-route.step.4':
    'TREK 無法規劃的路段會變紅並說明原因，例如該區域還沒有水域資料。你可以先點擊「畫直線」手動繪製。',
  'help.guide.tour-paddle-portage.goal': '標記你需要搬運船隻的路段，讓它算作陸地，並計入上岸和重新下水的時間。',
  'help.guide.tour-paddle-portage.tip.3':
    '在你於「時間估算」卡片中設定自己的「搬運速度」之前，搬運一律以每小時 2 公里計算。',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK 不知道船閘的運作時間表，這些時間完全是你輸入的內容，所以請自己確認船閘的開放時間。',
  'help.guide.tour-paddle-time.step.3':
    '「水域」列是以你的「划槳速度」在水上划行的距離。要更改速度，請使用欄位頂部的「划槳速度」欄位。',
  'help.guide.tour-paddle-wind.goal': '查看你划槳當天，遊程起點的預報風力。',
  'help.guide.tour-paddle-wind.tip.4': '沒有預報數值不代表安全，請到現場確認實際狀況。',
  'help.guide.tour-paddle-checklist.step.5': '在欄位底部點擊「划槳有風險」，出發前先閱讀「水上安全」。',
  'help.guide.tour-paddle-track-marks.goal': '從你的手錶匯入划槳軌跡，並標上你搬運船隻和通過船閘的位置。',
  'help.guide.tour-paddle-track-marks.tip.1': '請直接點在軌跡上：離線條太遠的點擊會被拒絕，卡片也會說明。',
  'help.ctx.trip-tour-horse.bullet.3':
    '每個路段在「路點」卡片中都是一個徽章，附有路線名稱、通行圓點和長度。沒有任何馬匹路線涵蓋的路段，會顯示「手動，未經檢查」。',
  'help.guide.tour-horse-plan.step.4': '點擊列表中的路線。它會在自己的地圖上開啟，路段已編號。',
  'help.guide.tour-horse-plan.tip.4': '左欄標題中的「復原路線點編輯」可一步復原整個路段。',
  'help.guide.tour-horse-gap.result': '騎馬行程不再有缺口，銜接的路段會標示為手動繪製。',
  'help.guide.tour-horse-recorded.step.3': '點擊「匯入 1 條遊程」。',
  'help.guide.dissolve-fusion.step.3': '在彈出的視窗中點選「解除」確認。',
};

export default help;
