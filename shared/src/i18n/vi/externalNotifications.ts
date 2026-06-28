import type { NotificationLocale } from '../externalNotifications/types';

const en: NotificationLocale = {
  email: {
    footer: 'Bạn nhận được thông báo này vì bạn đã bật thông báo trong TREK.',
    manage: 'Quản lý tùy chọn trong Cài đặt',
    madeWith: 'Được làm bằng',
    openTrek: 'Mở TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Trip invite: "${p.trip}"`,
      body: `${p.actor} invited ${p.invitee || 'a member'} to the trip "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `New booking: ${p.booking}`,
      body: `${p.actor} added a new ${p.type} "${p.booking}" to "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Trip reminder: ${p.trip}`,
      body: `Your trip "${p.trip}" is coming up soon!`,
    }),
    todo_due: (p) => ({
      title: `To-do due: ${p.todo}`,
      body: `"${p.todo}" in "${p.trip}" is due on ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Lời mời kết hợp Vacay',
      body: `${p.actor} invited you to fuse vacation plans. Open TREK to accept or decline.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} photos shared`,
      body: `${p.actor} shared ${p.count} photo(s) in "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `New message in "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Packing: ${p.category}`,
      body: `${p.actor} assigned you to the "${p.category}" packing category in "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Đã có phiên bản TREK mới',
      body: `TREK ${p.version} is now available. Visit the admin panel to update.`,
    }),
    synology_session_cleared: () => ({
      title: 'Đã xóa phiên Synology',
      body: 'Tài khoản Synology của bạn hoặc URL đã thay đổi. Bạn đã đăng xuất khỏi Synology Photos.',
    }),
  },
  passwordReset: {
    subject: 'Đặt lại mật khẩu của bạn',
    greeting: 'CHÀO',
    body: 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản TREK của bạn. Nhấp vào nút bên dưới để đặt mật khẩu mới.',
    ctaIntro: 'Đặt lại mật khẩu',
    expiry: 'Liên kết này sẽ hết hạn sau 60 phút.',
    ignore: "If you didn't request this, you can safely ignore this email — your password won't change.",
  },
};

export default en;
