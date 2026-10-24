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
    vacay_share: (p) => ({
      title: 'Đã chia sẻ lịch Vacay',
      body: `${p.actor} đã chia sẻ lịch nghỉ phép của họ với bạn. Mở TREK để xem.`,
    }),
    collection_invite: (p) => ({
      title: 'Lời mời bộ sưu tập',
      body: `${p.actor} đã mời bạn chia sẻ một bộ sưu tập. Mở TREK để chấp nhận hoặc từ chối.`,
    }),
    photos_shared: (p) => ({
      title: `Đã chia sẻ ${p.count} ảnh`,
      body: `${p.actor} đã chia sẻ ${p.count} ảnh trong "${p.trip}".`,
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
    replica_failure: (p) => ({
      title: 'Lỗi bản sao lưu trữ',
      body:
        `Ghi vào bản sao '${p.backend}' thất bại: ${p.op} của ${p.key} — ${p.error}.` +
        (p.suppressed !== '0'
          ? ` Kể từ lần thông báo trước, có thêm ${p.suppressed} lỗi nhưng không được thông báo riêng.`
          : ''),
    }),
    paddle_region_requested: (p) => ({
      title: 'Có yêu cầu vùng chèo thuyền',
      body: `${p.actor} đang lên kế hoạch chèo thuyền ở ${p.region}. Tải hoặc từ chối dữ liệu nước trong khu quản trị, mục Tiện ích bổ sung.`,
    }),
    synology_session_cleared: () => ({
      title: 'Đã xóa phiên Synology',
      body: 'Tài khoản Synology của bạn hoặc URL đã thay đổi. Bạn đã đăng xuất khỏi Synology Photos.',
    }),
    wanderer_source_hint: (p) => ({
      title: `Tuyến wanderer: ${p.tour}`,
      body:
        p.state === 'changed'
          ? `“${p.tour}” trong “${p.trip}” đã được thay đổi trên wanderer. Hãy mở chuyến đi và kiểm tra nguồn để xem mọi thay đổi. Không có gì trong chuyến du lịch tự thay đổi.`
          : p.state === 'unverifiable'
            ? `“${p.tour}” trong “${p.trip}” không còn kiểm tra được trên wanderer. Chuyến đi trong chuyến du lịch của bạn vẫn giữ nguyên.`
            : `“${p.tour}” trong “${p.trip}” có thể đã thay đổi trên wanderer. Hãy mở chuyến đi và kiểm tra nguồn của nó. Không có gì trong chuyến du lịch tự thay đổi.`,
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
