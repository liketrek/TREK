import type { NotificationLocale } from '../externalNotifications/types';

const zh: NotificationLocale = {
  email: {
    footer: '您收到此邮件是因为您在 TREK 中启用了通知。',
    manage: '管理偏好设置',
    madeWith: 'Made with',
    openTrek: '打开 TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `邀请加入"${p.trip}"`,
      body: `${p.actor} 邀请了 ${p.invitee || '成员'} 加入旅行"${p.trip}"。`,
    }),
    booking_change: (p) => ({
      title: `新预订：${p.booking}`,
      body: `${p.actor} 在"${p.trip}"中添加了预订"${p.booking}"（${p.type}）。`,
    }),
    trip_reminder: (p) => ({
      title: `旅行提醒：${p.trip}`,
      body: `你的旅行"${p.trip}"即将开始！`,
    }),
    todo_due: (p) => ({
      title: `待办事项即将到期：${p.todo}`,
      body: `"${p.trip}" 中的"${p.todo}"将于 ${p.due} 到期。`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay 融合邀请',
      body: `${p.actor} 邀请你合并假期计划。打开 TREK 接受或拒绝。`,
    }),
    collection_invite: (p) => ({
      title: '收藏邀请',
      body: `${p.actor} 邀请你共享收藏。打开 TREK 接受或拒绝。`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} 张照片已分享`,
      body: `${p.actor} 在"${p.trip}"中分享了 ${p.count} 张照片。`,
    }),
    collab_message: (p) => ({
      title: `"${p.trip}"中的新消息`,
      body: `${p.actor}：${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `行李清单：${p.category}`,
      body: `${p.actor} 将你分配到"${p.trip}"中的"${p.category}"类别。`,
    }),
    version_available: (p) => ({
      title: '新版 TREK 可用',
      body: `TREK ${p.version} 现已可用。请前往管理面板进行更新。`,
    }),
    synology_session_cleared: () => ({
      title: 'Synology 会话已清除',
      body: '您的 Synology 账户或 URL 已更改，您已退出 Synology Photos。',
    }),
  },
  passwordReset: {
    subject: '重置您的密码',
    greeting: '您好',
    body: '我们收到了重置您的 TREK 账户密码的请求。点击下方按钮设置新密码。',
    ctaIntro: '重置密码',
    expiry: '此链接将在 60 分钟后失效。',
    ignore: '如果这不是您本人的请求，可以忽略本邮件 — 您的密码不会改变。',
  },
};

export default zh;
