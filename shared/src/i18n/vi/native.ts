import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Kết nối với TREK',
  'native.connect.hint': 'Nhập địa chỉ bạn dùng để mở TREK trong trình duyệt.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Kết nối',
  'native.connect.checking': 'Đang kiểm tra…',
  'native.connect.errorInvalid': 'Đây có vẻ không phải là địa chỉ web.',
  'native.connect.errorUnreachable': 'Không có máy chủ nào phản hồi tại địa chỉ này. Hãy kiểm tra địa chỉ và kết nối của bạn.',
  'native.connect.errorNotTrek': 'Máy chủ tại địa chỉ này không phải TREK.',
  'native.connect.errorTooOld': 'Máy chủ TREK này quá cũ đối với ứng dụng. Máy chủ cần được cập nhật trước.',
  'native.offline.title': 'Không kết nối được máy chủ',
  'native.offline.hint': 'TREK không thể kết nối tới {server}. Hãy kiểm tra kết nối và thử lại.',
  'native.offline.retry': 'Thử lại',
  'native.changeServer': 'Đổi máy chủ',
  'native.login.failed': 'Đăng nhập không thành công. Vui lòng thử lại.',
  'native.handoff.title': 'Tiếp tục trong ứng dụng',
  'native.handoff.hint': 'Bạn đã đăng nhập với tên {name}. Mở ứng dụng TREK để hoàn tất đăng nhập ở đó.',
  'native.handoff.open': 'Mở ứng dụng TREK',
  'native.handoff.switchAccount': 'Dùng tài khoản khác',
  'native.settings.server': 'Máy chủ',
  'native.settings.serverHint': 'Ứng dụng này đang kết nối với {server}.',
};

export default native;
