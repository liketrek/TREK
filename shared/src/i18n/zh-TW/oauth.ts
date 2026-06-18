import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': '行程',
  'oauth.scope.group.places': '地點',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': '行李',
  'oauth.scope.group.todos': '待辦事項',
  'oauth.scope.group.budget': '預算',
  'oauth.scope.group.reservations': '預訂',
  'oauth.scope.group.collab': '協作',
  'oauth.scope.group.notifications': '通知',
  'oauth.scope.group.vacay': '假期',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': '天氣',
  'oauth.scope.group.journey': '旅程',
  'oauth.scope.trips:read.label': '檢視行程與旅遊計畫',
  'oauth.scope.trips:read.description': '讀取行程、天數、每日筆記及成員',
  'oauth.scope.trips:write.label': '編輯行程與旅遊計畫',
  'oauth.scope.trips:write.description': '建立及更新行程、天數、筆記並管理成員',
  'oauth.scope.trips:delete.label': '刪除行程',
  'oauth.scope.trips:delete.description': '永久刪除整個行程——此操作無法復原',
  'oauth.scope.trips:share.label': '管理分享連結',
  'oauth.scope.trips:share.description': '建立、更新及撤銷行程的公開分享連結',
  'oauth.scope.places:read.label': '檢視地點與地圖資料',
  'oauth.scope.places:read.description': '讀取地點、每日指派、標籤及類別',
  'oauth.scope.places:write.label': '管理地點',
  'oauth.scope.places:write.description': '建立、更新及刪除地點、指派及標籤',
  'oauth.scope.atlas:read.label': '檢視 Atlas',
  'oauth.scope.atlas:read.description': '讀取已造訪的國家、地區及願望清單',
  'oauth.scope.atlas:write.label': '管理 Atlas',
  'oauth.scope.atlas:write.description': '標記已造訪的國家及地區，管理願望清單',
  'oauth.scope.packing:read.label': '檢視行李清單',
  'oauth.scope.packing:read.description': '讀取行李物品、行李袋及類別負責人',
  'oauth.scope.packing:write.label': '管理行李清單',
  'oauth.scope.packing:write.description': '新增、更新、刪除、勾選及重新排序行李物品和行李袋',
  'oauth.scope.todos:read.label': '檢視待辦清單',
  'oauth.scope.todos:read.description': '讀取行程待辦事項及類別負責人',
  'oauth.scope.todos:write.label': '管理待辦清單',
  'oauth.scope.todos:write.description': '建立、更新、勾選、刪除及重新排序待辦事項',
  'oauth.scope.budget:read.label': '檢視預算',
  'oauth.scope.budget:read.description': '讀取預算項目及費用明細',
  'oauth.scope.budget:write.label': '管理預算',
  'oauth.scope.budget:write.description': '建立、更新及刪除預算項目',
  'oauth.scope.reservations:read.label': '檢視預訂',
  'oauth.scope.reservations:read.description': '讀取預訂及住宿詳情',
  'oauth.scope.reservations:write.label': '管理預訂',
  'oauth.scope.reservations:write.description': '建立、更新、刪除及重新排序預訂',
  'oauth.scope.collab:read.label': '檢視協作',
  'oauth.scope.collab:read.description': '讀取協作筆記、投票及訊息',
  'oauth.scope.collab:write.label': '管理協作',
  'oauth.scope.collab:write.description': '建立、更新及刪除協作筆記、投票及訊息',
  'oauth.scope.notifications:read.label': '檢視通知',
  'oauth.scope.notifications:read.description': '讀取應用程式通知及未讀數量',
  'oauth.scope.notifications:write.label': '管理通知',
  'oauth.scope.notifications:write.description': '將通知標為已讀並回覆',
  'oauth.scope.vacay:read.label': '檢視假期計畫',
  'oauth.scope.vacay:read.description': '讀取假期計畫資料、項目及統計',
  'oauth.scope.vacay:write.label': '管理假期計畫',
  'oauth.scope.vacay:write.description': '建立及管理假期項目、節假日及團隊計畫',
  'oauth.scope.geo:read.label': '地圖與地理編碼',
  'oauth.scope.geo:read.description': '搜尋地點、解析地圖 URL 及反向地理編碼坐標',
  'oauth.scope.weather:read.label': '天氣預報',
  'oauth.scope.weather:read.description': '取得行程地點及日期的天氣預報',
  'oauth.scope.journey:read.label': '檢視旅程',
  'oauth.scope.journey:read.description': '讀取旅程、條目及貢獻者清單',
  'oauth.scope.journey:write.label': '管理旅程',
  'oauth.scope.journey:write.description': '建立、更新及刪除旅程及其條目',
  'oauth.scope.journey:share.label': '管理旅程連結',
  'oauth.scope.journey:share.description': '建立、更新及撤銷旅程的公開分享連結',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
