import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Kiểm tra thay đổi của các tuyến của tôi',
  'wanderer.watch.hint': 'Thông báo khi một tuyến đã nhập có thể đã thay đổi.',
  'wanderer.watch.info':
    'Tối đa mỗi ngày một lần, TREK đọc bản ghi ngắn của từng tuyến bạn đã nhập, không bao giờ đọc tệp GPX. TREK chỉ thông báo: nhận thay đổi hay không là do bạn quyết định qua việc kiểm tra nguồn của chuyến đi bộ.',
  'wanderer.watch.notConnected': 'Hãy kết nối wanderer trước',
  'wanderer.watch.on': 'Đã bật kiểm tra nền',
  'wanderer.watch.off': 'Đã tắt kiểm tra nền',
  'wanderer.watch.failed': 'Không thể chuyển kiểm tra nền',
  'wanderer.watch.lastRun': 'Kiểm tra lần cuối {date}',
  'wanderer.watch.neverRun': 'Chưa kiểm tra',
  'wanderer.watch.paused': 'Tạm dừng đến {time}',
  'wanderer.watch.pausedHint': 'wanderer không phản hồi. Sau mỗi lần thất bại, TREK chờ lâu hơn trước khi hỏi lại.',
  'wanderer.watch.blocked': 'Token bị từ chối',
  'wanderer.watch.blockedHint':
    'wanderer đã từ chối token API. Việc kiểm tra tiếp tục khi một lần kiểm tra kết nối thành công hoặc lưu token mới.',
  'wanderer.watch.hints': 'Gợi ý',
  'wanderer.watch.hintsCount': '{count} gợi ý đang mở',
  'wanderer.watch.empty': 'Không có gợi ý đang mở',
  'wanderer.watch.dialogTitle': 'Gợi ý về các tuyến của bạn',
  'wanderer.watch.openTour': 'Mở chuyến đi',
  'wanderer.watch.checkedAt': 'Đã kiểm tra {date}',
  'wanderer.watch.noticeLabel': 'Kiểm tra nền',
  'wanderer.watch.state.possible_change': 'Có thể đã thay đổi',
  'wanderer.watch.state.changed': 'Đã thay đổi',
  'wanderer.watch.state.unverifiable': 'Không kiểm tra được',
  'wanderer.watch.stateHint.possible_change':
    'wanderer đã đổi dấu thời gian của tuyến. Chỉ việc kiểm tra nguồn mới cho thấy nội dung có khác hay không.',
  'wanderer.watch.stateHint.changed':
    'Bản ghi trên wanderer có tên hoặc mô tả khác. Việc kiểm tra nguồn cho thấy mọi thứ đã thay đổi.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK không thể đánh giá tuyến này nên không nói gì về việc nó có thay đổi hay không.',
  'wanderer.watch.reason.unavailable': 'Không truy cập được tuyến',
  'wanderer.watch.reason.no_change_time': 'Không có dấu thời gian',
};
export default wandererWatch;
