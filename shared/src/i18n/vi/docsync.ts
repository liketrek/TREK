import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Đồng bộ tài liệu',
  'docsync.noProviders': 'Không có nhà cung cấp tài liệu nào khả dụng',
  'docsync.noProvidersHint': 'Quản trị viên hệ thống bật chúng trong Quản trị → Tiện ích bổ sung → Tài liệu.',
  'docsync.addProvider': 'Kết nối nhà cung cấp',
  'docsync.test': 'Kiểm tra kết nối',
  'docsync.connect.optional': 'Tùy chọn',
  'docsync.connected': 'Đã kết nối',
  'docsync.chooseFolder': 'Chọn thư mục',
  'docsync.noFolders': 'Chưa tìm thấy gì trên máy chủ này.',
  'docsync.newFolderPlaceholder': 'Tên thư mục mới',
  'docsync.syncNow': 'Đồng bộ ngay',
  'docsync.unlink': 'Ngắt kết nối',
  'docsync.confirmUnlink': 'Tài liệu vẫn ở lại trong TREK và trong kho. Chỉ có liên kết giữa chúng bị gỡ.',
  'docsync.syncEnabled': 'Tự động đồng bộ',
  'docsync.deletePolicy': 'Khi một tài liệu bị xóa',
  'docsync.deleteUnlink': 'Giữ cả hai bản',
  'docsync.deleteTrash': 'Chuyển vào thùng rác',
  'docsync.conflictPolicy': 'Khi cả hai bên đều thay đổi',
  'docsync.onConflict.manual': 'Hỏi tôi',
  'docsync.onConflict.trek_wins': 'Giữ bản của TREK',
  'docsync.onConflict.provider_wins': 'Giữ bản của kho',
  'docsync.webhookHint':
    'Dán URL này vào nhà cung cấp của bạn để thay đổi đến ngay lập tức. Nếu không, TREK sẽ kiểm tra theo định kỳ.',

  // Các trường của biểu mẫu kết nối. Khóa phản chiếu cột `label` trong
  // document_provider_fields, nơi lưu hậu tố khóa chứ không phải văn bản.
  'docsync.providerUrl': 'Địa chỉ',
  'docsync.providerApiToken': 'Mã thông báo API',
  'docsync.providerApiKey': 'Khóa API',
  'docsync.providerAppPassword': 'Mật khẩu ứng dụng',
  'docsync.providerAppToken': 'Mã thông báo ứng dụng',
  'docsync.providerUsername': 'Tên đăng nhập',
  'docsync.providerPassword': 'Mật khẩu',
  'docsync.providerOrganization': 'ID tổ chức',
  'docsync.providerBasePath': 'Thư mục gốc',
  'docsync.providerOTP': 'Mã xác thực hai yếu tố',
  'docsync.allowInsecureTls': 'Chấp nhận chứng chỉ tự ký',

  'docsync.hintPaperlessToken': 'Tạo trong Paperless ở mục Hồ sơ của tôi. Mã này mang toàn bộ quyền của tài khoản đó.',
  'docsync.hintPapraKey': 'Tạo trong Papra ở mục Khóa API. Khóa Papra luôn truy cập được mọi tổ chức mà bạn tham gia.',
  'docsync.hintPapraOrg': 'Mã org_… lấy từ thanh địa chỉ của Papra.',
  'docsync.hintNextcloudLogin': 'Tên đăng nhập Nextcloud của bạn, không phải địa chỉ email.',
  'docsync.hintNextcloudAppPassword':
    'Cài đặt → Bảo mật → Tạo mật khẩu ứng dụng mới. Không bao giờ dùng mật khẩu tài khoản.',
  'docsync.hintOpenCloudToken': 'Được tạo trong OpenCloud ở mục mã thông báo ứng dụng.',
  'docsync.hintBasePath': 'Nơi TREK tìm thư mục chuyến đi. Mặc định là /TREK.',
  'docsync.hintSynologyUrl': 'Nhớ kèm cổng, ví dụ https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Tốt nhất là một tài khoản DSM riêng chỉ truy cập được thư mục chia sẻ này.',
  'docsync.hintSynologyOtp': 'Chỉ cần một lần, nếu tài khoản dùng xác thực hai yếu tố.',

  'docsync.linkState.never': 'Chưa đồng bộ',
  'docsync.linkState.ok': 'Đã đồng bộ',
  'docsync.linkState.partial': 'Đồng bộ một phần',
  'docsync.linkState.failed': 'Thất bại',
  'docsync.linkState.needs_reauth': 'Đăng nhập lại',
  'docsync.linkState.scope_lost': 'Thư mục không còn',
  'docsync.linkState.orphaned': 'Chủ sở hữu đã rời chuyến đi',

  'docsync.state.pending': 'Đang chờ',
  'docsync.state.synced': 'Đã đồng bộ',
  'docsync.state.conflict': 'Xung đột',
  'docsync.state.rejected_type': 'Loại không được phép',
  'docsync.state.too_large': 'Quá lớn',
  'docsync.state.error': 'Lỗi',
  'docsync.state.remote_missing': 'Không có ở nhà cung cấp',
  'docsync.state.local_deleted': 'Đã xóa trong TREK',
  'docsync.state.scope_drift': 'Đã chuyển ra khỏi thư mục',

  'docsync.conflict.resolve': "Giải quyết {count}",

  'docsync.conflict.title': 'Cả hai bản đều thay đổi',
  'docsync.conflict.keepTrek': 'Giữ bản TREK',
  'docsync.conflict.keepProvider': 'Giữ bản của nhà cung cấp',
  'docsync.conflict.keepBoth': 'Giữ cả hai',

  // Lý do thất bại được truyền dưới dạng mã, không bao giờ là văn bản từ phía
  // nhà cung cấp: nhà cung cấp trả lời bằng tiếng Anh, hoặc bằng trang đăng nhập
  // HTML của proxy, và cả hai đều không thuộc về đây.
  'docsync.error.unreachable': 'Không thể kết nối tới nhà cung cấp.',
  'docsync.error.tls_untrusted': 'Chứng chỉ bị từ chối. Hãy cho phép chứng chỉ tự ký nếu bạn tin cậy máy chủ này.',
  'docsync.error.unauthorized': 'Thông tin đăng nhập bị từ chối.',
  'docsync.error.forbidden': 'Tài khoản này không được phép làm việc đó.',
  'docsync.error.not_found': 'Không tìm thấy ở nhà cung cấp.',
  'docsync.error.scope_missing': 'Thư mục đã kết nối không còn tồn tại.',
  'docsync.error.rate_limited': 'Nhà cung cấp đang giới hạn số lượt gọi của chúng ta. TREK sẽ thử lại sau.',
  'docsync.error.too_large': 'Tệp lớn hơn mức nhà cung cấp chấp nhận.',
  'docsync.error.unsupported_type': 'Nhà cung cấp không chấp nhận loại tệp này.',
  'docsync.error.quota_exceeded': 'Nhà cung cấp đã hết dung lượng.',
  'docsync.error.conflict': 'Tài liệu đã thay đổi ở cả hai bên.',
  'docsync.error.checksum_mismatch': 'Dữ liệu truyền đi không đến nơi nguyên vẹn.',
  'docsync.error.provider_error': 'Nhà cung cấp báo lỗi.',
  'docsync.error.timeout': 'Nhà cung cấp phản hồi quá lâu.',
  'docsync.error.ssrf_blocked': 'Địa chỉ đó không được phép.',
  'docsync.error.mass_delete_guard':
    'Phần lớn tài liệu biến mất cùng lúc, nên không có gì được thay đổi. Hãy kiểm tra xem thư mục còn được gắn kết không.',
  'docsync.error.unknown': 'Đã xảy ra lỗi.',

  // ── Hộp thoại ──────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Chuyến đi này',
  'docsync.addAnother': 'Thêm nữa',
  'docsync.syncing': 'Đang đồng bộ',
  'docsync.card.pickFolder': 'Đã kết nối, hãy chọn thư mục',

  'docsync.empty.title': 'Chưa kết nối gì',
  'docsync.empty.hintOwner':
    'Hãy chọn một kho ở bên trái. TREK luôn giữ bản sao của riêng mình, nên không mất gì nếu kho đó biến mất.',
  'docsync.empty.hintMember': 'Chủ chuyến đi là người thiết lập việc này. Dù sao thì tài liệu vẫn ở lại trong TREK.',

  // Cách mỗi sản phẩm sắp xếp tài liệu. Hiển thị trước khi ai đó kết nối, vì đó
  // chính là thứ màn hình kế tiếp sẽ hỏi.
  'docsync.model.paperless': 'Lưu theo thẻ',
  'docsync.model.papra': 'Lưu theo thẻ, bên trong một tổ chức',
  'docsync.model.nextcloud': 'Lưu theo thư mục',
  'docsync.model.opencloud': 'Lưu theo không gian',
  'docsync.model.synologydrive': 'Lưu theo thư mục trên NAS',

  // ── Thanh luồng ────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Gửi ra kho',
  'docsync.flow.toTrek': 'Nhận từ kho',
  'docsync.flow.documents': 'tài liệu',
  'docsync.flow.summary.both': 'Tài liệu đi cả hai chiều.',
  'docsync.flow.summary.pull': 'Tài liệu chỉ đi vào.',
  'docsync.flow.summary.push': 'Tài liệu chỉ đi ra.',
  'docsync.flow.summaryEditable.both': 'Đang đi cả hai chiều. Chạm một làn để dừng làn đó.',
  'docsync.flow.summaryEditable.pull': 'Chỉ đi vào. Chạm làn kia để gửi ra nữa.',
  'docsync.flow.summaryEditable.push': 'Chỉ đi ra. Chạm làn kia để nhận vào nữa.',

  // ── Một liên kết ───────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Cài đặt',
  'docsync.binding.folder': 'Thư mục',
  'docsync.binding.lastRun': 'Lần chạy cuối',
  'docsync.binding.autoOff': 'Đã tạm dừng',
  'docsync.binding.neverRun': 'chưa chạy lần nào',
  'docsync.binding.deleteHint': 'Điều sẽ xảy ra với bản sao ở phía bên kia.',
  'docsync.binding.conflictHint': 'Bản nào được giữ lại khi tài liệu bị sửa ở cả hai nơi.',
  'docsync.binding.autoHint': 'Kiểm tra thay đổi ở chế độ nền.',
  'docsync.binding.webhookTitle': 'Cập nhật tức thì',
  'docsync.binding.copy': 'Sao chép',
  'docsync.binding.copied': 'Đã sao chép',

  // ── Kết nối ────────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Kết nối',
  'docsync.connect.testing': 'Đang thử kết nối',
  'docsync.connect.okAs': 'Đã kết nối, đăng nhập với tư cách {account}',
  'docsync.connect.insecureHint': 'Dành cho máy chủ trong mạng nội bộ của bạn dùng chứng chỉ tự ký.',
  'docsync.connect.about.paperless':
    'TREK lưu chuyến đi này dưới thẻ riêng của nó và không đụng tới phần còn lại trong kho của bạn.',
  'docsync.connect.about.papra':
    'Hãy chọn tổ chức mà chuyến đi này thuộc về. TREK sẽ lưu nó dưới thẻ riêng bên trong tổ chức đó.',
  'docsync.connect.about.nextcloud':
    'Hãy dùng mật khẩu ứng dụng, đừng dùng mật khẩu tài khoản: nó vẫn chạy được với xác thực hai yếu tố và bạn có thể thu hồi riêng.',
  'docsync.connect.about.opencloud': 'TREK có không gian riêng cho chuyến đi này, tách khỏi mọi thứ khác.',
  'docsync.connect.about.synologydrive':
    'Tốt nhất là một tài khoản DSM chỉ truy cập được thư mục chia sẻ dành cho chuyến đi này.',

  // ── Chọn nơi chứa ──────────────────────────────────────────────────────────
  'docsync.scope.title': 'Chuyến đi này nên nằm ở đâu trong {provider}?',
  'docsync.scope.intro': 'Chỉ những gì nằm trong đây mới được đồng bộ. Mọi thứ khác trong kho của bạn không vào TREK.',
  'docsync.scope.createTitle': 'Tạo mục mới',
  'docsync.scope.createAction': 'Tạo',
  'docsync.scope.pickTitle': 'Hoặc dùng mục bạn đã có',
  'docsync.scope.search': 'Tìm kiếm',
  'docsync.scope.noMatch': 'Không có gì khớp.',

  // ── Những việc cần người quyết định ────────────────────────────────────────
  'docsync.issues.title': 'Cần xem lại',
  'docsync.issues.conflict': 'Đã thay đổi ở cả hai nơi. Hãy chọn bản muốn giữ.',
  'docsync.issues.remote_missing': 'Không còn trong kho. Bản trong TREK vẫn còn.',
  'docsync.issues.rejected_type': 'Loại tệp này không được phép ở đây.',
  'docsync.issues.too_large': 'Lớn hơn giới hạn cho phép.',
  'docsync.issues.error': 'Việc truyền tệp không thành công.',

  'docsync.error.unknown_provider': 'Nhà cung cấp này không khả dụng trên máy chủ này.',
  'docsync.error.provider_disabled': 'Đã tạm dừng: quản trị viên đã tắt nhà cung cấp này. Việc đồng bộ sẽ tiếp tục khi nó được bật lại.',
  'docsync.binding.reconnect': 'Kết nối lại',
};

export default docsync;
