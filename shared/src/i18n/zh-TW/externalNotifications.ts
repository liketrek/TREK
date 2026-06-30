import type { NotificationLocale } from '../externalNotifications/types';

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
    collection_invite: (p) => ({
      title: '收藏邀請',
      body: `${p.actor} 邀請您共享收藏。開啟 TREK 以接受或拒絕。`,
    }),
    photos_shared: (p) => ({
      title: `已分享 ${p.count} 張照片`,
      body: `${p.actor} 在「${p.trip}」中分享了 ${p.count} 張照片。`,
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
    synology_session_cleared: () => ({
      title: 'Synology 工作階段已清除',
      body: '您的 Synology 帳戶或 URL 已變更，您已登出 Synology Photos。',
    }),
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
