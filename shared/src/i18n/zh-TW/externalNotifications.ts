import type { NotificationLocale } from '../externalNotifications/types';
import { pluralForm } from '../plural';

const zhTW: NotificationLocale = {
  email: {
    footer: '您收到這封郵件是因為您在 TREK 中啟用了通知。',
    manage: '管理偏好設定',
    madeWith: 'Made with',
    openTrek: '開啟 TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `邀請加入「${p.trip}」`,
      body: `${p.actor} 邀請了 ${p.invitee || '成員'} 加入行程「${p.trip}」。`,
    }),
    booking_change: (p) => ({
      title: `新預訂：${p.booking}`,
      body: `${p.actor} 在「${p.trip}」中新增了預訂「${p.booking}」（${p.type}）。`,
    }),
    flight_departed: (p) => ({
      title: `${p.flight}已起飛`,
      body: `從${p.from}飛往${p.to}的${p.flight}已在空中。`,
    }),
    flight_delayed: (p) => ({
      title: `${p.flight}延誤`,
      body: `從${p.from}飛往${p.to}的${p.flight}比預定晚約${p.delay}分鐘。`,
    }),
    flight_landed: (p) => ({
      title: `${p.flight}已降落`,
      body: `從${p.from}出發的${p.flight}已降落在${p.to}。`,
    }),
    trip_reminder: (p) => ({
      title: `行程提醒：${p.trip}`,
      body: `您的行程「${p.trip}」即將開始！`,
    }),
    todo_due: (p) => ({
      title: `待辦事項即將到期：${p.todo}`,
      body: `「${p.trip}」中的「${p.todo}」將於 ${p.due} 到期。`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay 融合邀請',
      body: `${p.actor} 邀請您合併假期計畫。開啟 TREK 以接受或拒絕。`,
    }),
    vacay_share: (p) => ({
      title: 'Vacay 日曆已共享',
      body: `${p.actor} 與您共享了假期日曆。開啟 TREK 以檢視。`,
    }),
    collection_invite: (p) => ({
      title: '收藏邀請',
      body: `${p.actor} 邀請您共享收藏。開啟 TREK 以接受或拒絕。`,
    }),
    photos_shared: (p) => ({
      title: pluralForm(p.count, 'zh-TW', { other: `已分享 ${p.count} 張照片` }),
      body: pluralForm(p.count, 'zh-TW', { other: `${p.actor} 在「${p.trip}」中分享了 ${p.count} 張照片。` }),
    }),
    collab_message: (p) => ({
      title: `「${p.trip}」中的新訊息`,
      body: `${p.actor}：${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `打包清單：${p.category}`,
      body: `${p.actor} 已將您指派到「${p.trip}」中的「${p.category}」分類。`,
    }),
    version_available: (p) => ({
      title: '新版 TREK 可用',
      body: `TREK ${p.version} 現已可用。請前往管理面板進行更新。`,
    }),
    replica_failure: (p) => ({
      title: '儲存複本故障',
      body:
        `寫入複本 '${p.backend}' 失敗：${p.op} / ${p.key} — ${p.error}。` +
        (p.suppressed !== '0'
          ? pluralForm(p.suppressed, 'zh-TW', { other: `自上次通知以來，另有 ${p.suppressed} 次失敗未個別通知。` })
          : ''),
    }),
    paddle_region_requested: (p) => ({
      title: '划槳區域申請',
      body: `${p.actor} 正在 ${p.region} 規劃划槳行程。請在管理後台的附加元件中載入或拒絕其水域資料。`,
    }),
    synology_session_cleared: () => ({
      title: 'Synology 工作階段已清除',
      body: '您的 Synology 帳戶或 URL 已變更，您已登出 Synology Photos。',
    }),
    wanderer_source_hint: (p) => ({
      title: `wanderer 路線: ${p.tour}`,
      body:
        p.state === 'changed'
          ? `「${p.trip}」中的「${p.tour}」已在 wanderer 中變更。開啟行程並檢查其來源即可查看所有變更。旅行中的內容不會自行改變。`
          : p.state === 'unverifiable'
            ? `「${p.trip}」中的「${p.tour}」已無法在 wanderer 中檢查。你旅行中的行程保持不變。`
            : `「${p.trip}」中的「${p.tour}」可能已在 wanderer 中變更。請開啟行程並檢查其來源。旅行中的內容不會自行改變。`,
    }),
    mail_booking_added: (p) => ({
      title: `從郵件新增：${p.booking}`,
      body:
        p.role === 'traveller'
          ? `${p.actor} 從轉寄的郵件將「${p.booking}」新增到「${p.trip}」。`
          : `你轉寄的郵件中的「${p.booking}」已新增到「${p.trip}」。7 天內可以在 TREK 中復原。`,
    }),
    mail_booking_pending: (p) => ({
      title: '待檢查的轉寄預訂',
      body: `TREK 中等待你處理的轉寄預訂：${p.count}。每一筆都說明了為什麼沒有自動新增。`,
    }),
    mail_ingest_paused: () => ({
      title: '郵件匯入已暫停',
      body: 'TREK 暫時不接收轉寄的預訂郵件，請先不要轉寄。你的地址會保留，匯入恢復後即可再次使用，已新增的預訂仍保留在你的行程中。',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: '重設您的密碼',
    greeting: '您好',
    body: '我們收到了重設您 TREK 帳號密碼的請求。點擊下方按鈕以設定新密碼。',
    ctaIntro: '重設密碼',
    expiry: '此連結將於 60 分鐘後失效。',
    ignore: '若非您本人發起的請求，請忽略此郵件 — 您的密碼不會變更。',
  },
};

export default zhTW;
