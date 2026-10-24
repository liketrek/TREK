import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': '檢查我的路線是否有變更',
  'wanderer.watch.hint': '匯入的路線可能已變更時通知你。',
  'wanderer.watch.info':
    'TREK 每天最多讀取一次你匯入的每條路線的簡短紀錄，從不讀取其 GPX 檔案。它只會通知你：是否採用變更，由你透過行程的來源檢查自行決定。',
  'wanderer.watch.notConnected': '請先連接 wanderer',
  'wanderer.watch.on': '背景檢查已開啟',
  'wanderer.watch.off': '背景檢查已關閉',
  'wanderer.watch.failed': '無法切換背景檢查',
  'wanderer.watch.lastRun': '上次檢查 {date}',
  'wanderer.watch.neverRun': '尚未檢查',
  'wanderer.watch.paused': '暫停至 {time}',
  'wanderer.watch.pausedHint': 'wanderer 沒有回應。每次失敗後，TREK 會等待更久再詢問。',
  'wanderer.watch.blocked': '權杖遭拒',
  'wanderer.watch.blockedHint': 'wanderer 拒絕了 API 權杖。連線測試通過或儲存新權杖後，檢查會繼續。',
  'wanderer.watch.hints': '提示',
  'wanderer.watch.hintsCount': '{count} 則未處理提示',
  'wanderer.watch.empty': '沒有未處理的提示',
  'wanderer.watch.dialogTitle': '關於你的路線的提示',
  'wanderer.watch.openTour': '開啟行程',
  'wanderer.watch.checkedAt': '檢查於 {date}',
  'wanderer.watch.noticeLabel': '背景檢查',
  'wanderer.watch.state.possible_change': '可能已變更',
  'wanderer.watch.state.changed': '已變更',
  'wanderer.watch.state.unverifiable': '無法檢查',
  'wanderer.watch.stateHint.possible_change': 'wanderer 更改了路線的時間戳記。內容是否不同，只有來源檢查才能看出。',
  'wanderer.watch.stateHint.changed': 'wanderer 的紀錄顯示了不同的名稱或描述。來源檢查會顯示所有變更。',
  'wanderer.watch.stateHint.unverifiable': 'TREK 無法判斷這條路線，因此對是否變更不作任何說明。',
  'wanderer.watch.reason.unavailable': '無法存取路線',
  'wanderer.watch.reason.no_change_time': '沒有時間戳記',
};
export default wandererWatch;
