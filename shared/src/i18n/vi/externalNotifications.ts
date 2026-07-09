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
      title: `Lời mời chuyến đi: "${p.trip}"`,
      body: `${p.actor} đã mời ${p.invitee || 'a member'} tham gia chuyến đi "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Đặt chổ mới: ${p.booking}`,
      body: `${p.actor} đã thêm mới một ${p.type} "${p.booking}" vào "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Nhắc nhở chuyến đi: ${p.trip}`,
      body: `Hành trình "${p.trip}" sắp bất đầu!`,
    }),
    todo_due: (p) => ({
      title: `To-do due: ${p.todo}`,
      body: `"${p.todo}" trong "${p.trip}" đến hạn vào ngày ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Lời mời kết hợp kì nghỉ',
      body: `${p.actor} đã mời bạn kết hợp kế hoạch kỳ nghỉ. Mở TREK để chấp nhận hoặc từ chối.`,
    }),
    collection_invite: (p) => ({
      title: 'Lời mời bộ sưu tập',
      body: `${p.actor} đã mời bạn chia sẻ một bộ sưu tập. Mở TREK để chấp nhận hoặc từ chối.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} đã chia sẻ hình ảnh`,
      body: `${p.actor} đã chi sẻ ${p.count} ảnh trong "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Tin nhắn mới trong "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Đang đóng đồ: ${p.category}`,
      body: `${p.actor} đã giao cho bạn đóng "${p.category}" trong "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Đã có phiên bản TREK mới',
      body: `TREK ${p.version} có bản mới. Vui lòng truy cập bảng điều khiển quản trị để cập nhật.`,
    }),
    synology_session_cleared: () => ({
      title: 'Đã xóa phiên Synology',
      body: 'Tài khoản Synology của bạn hoặc URL đã thay đổi. Bạn đã đăng xuất khỏi Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Đặt lại mật khẩu của bạn',
    greeting: 'CHÀO',
    body: 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản TREK của bạn. Nhấp vào nút bên dưới để đặt mật khẩu mới.',
    ctaIntro: 'Đặt lại mật khẩu',
    expiry: 'Liên kết này sẽ hết hạn sau 60 phút.',
    ignore:
      'Nếu bạn không yêu cầu điều này, bạn có thể bỏ qua email này một cách an toàn — mật khẩu của bạn sẽ không thay đổi.',
  },
};

export default en;
