import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'Ảnh đã chuyển sang 3.0',
  'system_notice.v3_photos.body':
    '**Ảnh** trong Công cụ lập kế hoạch chuyến đi đã bị xóa. Ảnh của bạn được an toàn — TREK chưa bao giờ sửa đổi thư viện Immich hoặc Synology của bạn.\n\nẢnh hiện có trong tiện ích bổ sung **Journey**. Hành trình là tùy chọn — nếu nó chưa có sẵn, hãy yêu cầu quản trị viên của bạn kích hoạt nó trong Quản trị → Tiện ích bổ sung.',
  'system_notice.v3_journey.title': 'Hành Trình Gặp Gỡ - tạp chí du lịch',
  'system_notice.v3_journey.body':
    'Ghi lại chuyến đi của bạn dưới dạng những câu chuyện du lịch phong phú với dòng thời gian, thư viện ảnh và bản đồ tương tác.',
  'system_notice.v3_journey.cta_label': 'Hành trình mở',
  'system_notice.v3_journey.highlight_timeline': 'Dòng thời gian và thư viện hàng ngày',
  'system_notice.v3_journey.highlight_photos': 'Nhập từ Immich hoặc Synology',
  'system_notice.v3_journey.highlight_share': 'Chia sẻ công khai - không cần đăng nhập',
  'system_notice.v3_journey.highlight_export': 'Xuất dưới dạng sách ảnh PDF',
  'system_notice.v3_features.title': 'Nhiều điểm nổi bật hơn trong 3.0',
  'system_notice.v3_features.body': 'Một vài điều đáng biết nữa về phiên bản này.',
  'system_notice.v3_features.highlight_dashboard': 'Thiết kế lại bảng điều khiển ưu tiên thiết bị di động',
  'system_notice.v3_features.highlight_offline': 'Chế độ ngoại tuyến hoàn toàn dưới dạng PWA',
  'system_notice.v3_features.highlight_search': 'Tự động hoàn thành tìm kiếm địa điểm theo thời gian thực',
  'system_notice.v3_features.highlight_import': 'Nhập địa điểm từ tệp KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: OAuth nâng cấp 2.1',
  'system_notice.v3_mcp.body':
    'Tích hợp MCP đã được đại tu hoàn toàn. OAuth 2.1 hiện là phương pháp xác thực được đề xuất. Mã thông báo tĩnh cũ (trek_…) không được dùng nữa và sẽ bị xóa trong bản phát hành trong tương lai.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth Khuyến nghị 2.1 (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 phạm vi cấp phép chi tiết',
  'system_notice.v3_mcp.highlight_deprecated': 'Mã thông báo trek_ tĩnh không được dùng nữa',
  'system_notice.v3_mcp.highlight_tools': 'Bộ công cụ và lời nhắc mở rộng',
  'system_notice.v3_thankyou.title': 'Một lưu ý cá nhân từ tôi',
  'system_notice.v3_thankyou.body':
    'Trước khi bạn đi - tôi muốn dành một chút thời gian.\n\nTREK bắt đầu như một dự án phụ mà tôi xây dựng cho những chuyến đi của riêng mình. Tôi chưa bao giờ tưởng tượng nó sẽ phát triển thành thứ mà 4.000 người trong số các bạn hiện đang tin tưởng để lên kế hoạch cho chuyến phiêu lưu của mình. Mọi ngôi sao, mọi số báo, mọi yêu cầu về tính năng - tôi đọc tất cả và chúng khiến tôi phải thức khuya giữa công việc toàn thời gian và trường đại học.\n\nTôi muốn bạn biết: TREK sẽ luôn là nguồn mở, luôn tự lưu trữ, luôn là của bạn. Không theo dõi, không đăng ký, không ràng buộc. Chỉ là một công cụ được xây dựng bởi một người cũng yêu thích du lịch như bạn.\n\nĐặc biệt cảm ơn [jubnl](https://github.com/jubnl) - bạn đã trở thành một cộng tác viên đáng kinh ngạc. Rất nhiều điều tạo nên sự tuyệt vời của 3.0 đều mang dấu ấn của bạn. Cảm ơn bạn đã tin tưởng vào dự án này khi nó vẫn còn nhiều khó khăn.\n\nVà gửi tới từng người trong số các bạn đã phát hiện lỗi, dịch một chuỗi, chia sẻ TREK với bạn bè hoặc đơn giản sử dụng nó để lên kế hoạch cho chuyến đi — **cảm ơn**. Bạn là lý do điều này tồn tại.\n\nĐây là nhiều cuộc phiêu lưu cùng nhau.\n\n— Maurice\n\n---\n\n[Tham gia cộng đồng trên Discord](https://discord.gg/7Q6M6jDwzf)\n\nNếu TREK giúp chuyến du lịch của bạn trở nên thú vị hơn thì một [cà phê nhỏ](https://ko-fi.com/mauriceboe) luôn luôn bật đèn.',
  'system_notice.v3014_whitespace_collision.title': 'Hành động bắt buộc: xung đột tài khoản người dùng',
  'system_notice.v3014_whitespace_collision.body':
    'Bản nâng cấp 3.0.14 đã phát hiện một hoặc nhiều xung đột tên người dùng hoặc email do khoảng trắng ở đầu/cuối trong tài khoản được lưu trữ. Các tài khoản bị ảnh hưởng đã được đổi tên tự động. Kiểm tra nhật ký máy chủ để tìm các dòng bắt đầu bằng **[migration] WHITESPACE COLLISION** để xác định tài khoản nào cần xem xét.',
  'system_notice.welcome_v1.title': 'Chào mừng đến với TREK',
  'system_notice.welcome_v1.body':
    'Công cụ lập kế hoạch du lịch tất cả trong một của bạn. Xây dựng hành trình, chia sẻ chuyến đi với bạn bè và luôn ngăn nắp — trực tuyến hoặc ngoại tuyến.',
  'system_notice.welcome_v1.cta_label': 'Lên kế hoạch cho một chuyến đi',
  'system_notice.welcome_v1.hero_alt': 'Một điểm đến du lịch tuyệt đẹp với lớp phủ TREK quy hoạch UI',
  'system_notice.welcome_v1.highlight_plan': 'Lịch trình hàng ngày cho bất kỳ chuyến đi nào',
  'system_notice.welcome_v1.highlight_share': 'Hợp tác với các đối tác du lịch',
  'system_notice.welcome_v1.highlight_offline': 'Hoạt động ngoại tuyến trên thiết bị di động',
  'system_notice.dev_test_modal.title': '[Dev] Thông báo kiểm tra',
  'system_notice.dev_test_modal.body': 'Đây là thông báo kiểm tra chỉ dành cho nhà phát triển.',
  // Thank-you + support the project (shown once per install and once per upgrade)
  'system_notice.thank_you_support.title': 'Cảm ơn bạn đã sử dụng TREK',
  'system_notice.thank_you_support.body':
    'Xin gửi lời cảm ơn nhanh chóng đến bạn vì đã cài đặt TREK — nó thực sự có ý nghĩa rất lớn.\n\nTôi là nhà phát triển một mình và tôi xây dựng TREK trong thời gian rảnh rỗi. Nó bắt đầu như một công cụ nhỏ dành riêng cho những chuyến đi của tôi và tôi thực sự rất ngạc nhiên trước sự hỗ trợ và quan tâm từ cộng đồng kể từ đó. TREK được tạo ra bằng cả trái tim của tôi — nhưng cũng nhờ có nhiều cộng tác viên bên ngoài tuyệt vời đã giúp định hình nó.\n\n**TREK là mã nguồn mở và hoàn toàn miễn phí — và nó sẽ mãi mãi như vậy. Không có tầng trả phí, không đăng ký, không bắt được. Tôi hứa.**\n\nNếu TREK hữu ích cho bạn và bạn muốn hỗ trợ sự phát triển của nó, thì một tách cà phê nhỏ thực sự giúp tôi tiếp tục xây dựng — không có chút áp lực nào, nhưng mỗi tách cà phê sẽ giúp bạn tiếp tục những đêm khuya.\n\nCảm ơn bạn đã ở đây.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': 'Nguồn mở 100% trên GitHub',
  'system_notice.thank_you_support.highlight_free': 'Miễn phí mãi mãi - không bao giờ có bất kỳ cấp độ trả phí nào',
  'system_notice.thank_you_support.highlight_community': 'Được xây dựng cùng với cộng đồng',
  'system_notice.thank_you_support.cta_bmc': 'Mua cho tôi một ly cà phê',
  'system_notice.thank_you_support.cta_kofi': 'Hỗ trợ trên Ko-fi',
  'system_notice.pager.prev': 'Thông báo trước',
  'system_notice.pager.next': 'Thông báo tiếp theo',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Vào thông báo {n}',
  'system_notice.pager.position': 'Thông báo {current} của {total}',
  // 4.0.0 release modal — the release on the left, the note from the maintainer on the right
  'system_notice.release_400.eyebrow': 'Đã cập nhật',
  'system_notice.release_400.tag': 'Phiên bản',
  'system_notice.release_400.headline': 'Bản phát hành lớn nhất TREK từng có.',
  'system_notice.release_400.intro':
    'TREK có điện thoại, và một cuốn sách. Mười chín người đã viết nên bản này — cùng khoảng một trăm năm mươi lỗi được báo cáo.',
  'system_notice.release_400.feature_mobile_title': 'TREK lên di động',
  'system_notice.release_400.feature_mobile_body':
    'Mọi thứ dưới 768px giờ là giao diện riêng — thanh dock kính, các bảng riêng, công cụ lập kế hoạch riêng. Mở TREK trên điện thoại.',
  'system_notice.release_400.feature_studio_title': 'TREK Studio',
  'system_notice.release_400.feature_studio_badge': 'Beta',
  'system_notice.release_400.feature_studio_body':
    'Bản PDF của Journey đã thành một công cụ thiết kế sách ảnh. Nó tự dàn trang khi bạn yêu cầu, rồi lui ra một bên.',
  'system_notice.release_400.feature_vacay_title': 'Vacay học nốt',
  'system_notice.release_400.feature_vacay_body':
    'Nửa ngày, ngày bù và ngày linh hoạt, kỳ nghỉ học trên lưới — và một năm phép không nhất thiết bắt đầu từ tháng Một.',
  'system_notice.release_400.feature_places_title': 'Địa điểm tự hiện ra, tệp dọn ra ngoài',
  'system_notice.release_400.feature_places_body':
    'Ảnh và mô tả tự điền vào trước khi bạn lưu một địa điểm. Và các tệp tải lên không còn phải nằm trên ổ đĩa chạy TREK nữa.',
  'system_notice.release_400.footnote':
    'Và đây mới là bốn trong số đó. 4.0.0 mang theo vài trăm thay đổi khác, từ Collections và Atlas cho tới toàn bộ máy chủ bên dưới.',
  'system_notice.release_400.note_eyebrow': 'Lời nhắn từ người bảo trì',
  'system_notice.release_400.note_title': 'Cảm ơn bạn đã sử dụng TREK.',
  'system_notice.release_400.note_body':
    'TREK bắt đầu như một công cụ nhỏ cho chuyến đi của riêng tôi, viết trong thời gian rảnh. Đến giờ vẫn vậy: buổi tối, cuối tuần, những giờ bên cạnh công việc toàn thời gian.\n\nĐã có lúc chỉ mình tôi. Giờ thì không nữa — mười chín người đã làm nên bản phát hành này, và hàng nghìn bạn đã đến với sao, báo lỗi, bản dịch và pull request. Tôi biết ơn tất cả.',
  'system_notice.release_400.promise_label': 'Lời hứa',
  'system_notice.release_400.promise_text':
    'Phần mã nguồn mở của TREK vẫn miễn phí, mãi mãi. Không tầng trả phí, không đăng ký, không ràng buộc. Tôi hứa.',
  'system_notice.release_400.note_body_after':
    '4.0.0 tốn nhiều tuần thức khuya — một ứng dụng điện thoại, một công cụ thiết kế sách, một lần chuyển máy chủ, phần lớn viết từ nửa đêm đến hai giờ. Không phải than phiền: tôi thích làm việc này. Đó chỉ là câu trả lời thật lòng cho việc một bản cỡ này ra đời từ một dự án lúc rảnh.',
  'system_notice.release_400.note_closing': 'Cảm ơn bạn đã ở đây.',
  'system_notice.release_400.note_signature': '— Maurice',
  'system_notice.release_400.support_text':
    'Sự ủng hộ là thứ giữ cho mọi thứ chạy — máy chủ, tên miền, và những đêm khuya biến thành các bản phát hành như thế này. Nếu TREK có giá trị với bạn, một ly cà phê là cách trực tiếp nhất để duy trì nó.',
  'system_notice.release_400.cta_bmc': 'Buy me a coffee',
  'system_notice.release_400.cta_kofi': 'Hỗ trợ trên Ko-fi',
};
export default system_notice;
