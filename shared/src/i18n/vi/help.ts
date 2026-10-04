import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Trợ giúp & Tài liệu',
  'help.search': 'Tìm trong tài liệu…',
  'help.contents': 'Nội dung',
  'help.noResults': 'Không có trang nào phù hợp.',
  'help.errorTitle': 'Không thể tải trang này',
  'help.errorBody': 'Nội dung trợ giúp được lấy từ wiki TREK. Hãy kiểm tra kết nối và thử lại.',

  // center
  'help.center.button': 'Trợ giúp cho màn hình này',
  'help.center.title': 'Trợ giúp',
  'help.center.onThisScreen': 'Trên màn hình này',
  'help.center.screens': 'Màn hình',
  'help.center.thisScreen': 'Màn hình này',
  'help.center.subScreens': 'Màn hình con: {count}',
  'help.center.subScreensLabel': 'Màn hình con',
  'help.center.guidesCount': '{count} hướng dẫn',
  'help.center.goToScreen': 'Đi tới {screen}',
  'help.center.overview': 'Tổng quan',
  'help.center.howTo': 'Làm thế nào để…',
  'help.center.searchPlaceholder': 'Tìm trong hướng dẫn và tài liệu…',
  'help.center.searchEmpty': 'Không tìm thấy gì cho “{query}”.',
  'help.center.searchGuides': 'Hướng dẫn',
  'help.center.searchDocs': 'Tài liệu',
  'help.center.searchError': 'Hiện không thể tìm kiếm.',
  'help.center.back': 'Quay lại',
  'help.center.close': 'Đóng trợ giúp',
  'help.center.steps': '{count} bước',
  'help.center.step': 'Bước {n}',
  'help.center.stepsLabel': 'Các bước',
  'help.center.stepOf': 'Bước {n} / {total}',
  'help.center.screenshot': 'Ảnh chụp màn hình',
  'help.center.result': 'Kết quả',
  'help.center.tips': 'Nên biết',
  'help.center.related': 'Liên quan',
  'help.center.openDocs': 'Mở trong Trợ giúp & Tài liệu',
  'help.center.docsSection': 'Trong tài liệu',
  'help.center.noContext': 'Chưa có hướng dẫn cho màn hình này.',
  'help.center.noContextHint': 'Tìm trong tài liệu, hoặc cho chúng tôi biết bạn đang tìm gì.',
  'help.center.feedback': 'Thiếu gì đó?',
  'help.center.feedbackLink': 'Cho chúng tôi biết trên GitHub',
  'help.center.discord': 'Hỏi trên Discord',
  'help.center.quick': 'Nhanh',
  'help.center.guide': 'Hướng dẫn',
  'help.center.tour': 'Video hướng dẫn',
  'help.center.imageAlt': 'Bước {n} của “{title}”',

  // ctx
  'help.ctx.dashboard.title': 'Bảng điều khiển',
  'help.ctx.dashboard.summary':
    'Bảng điều khiển là cửa ngõ vào mọi chuyến đi. Thẻ lên máy bay ở trên cùng nổi bật chuyến đi đang diễn ra hoặc sắp tới, hàng bên dưới thống kê những gì bạn đã đi, và các thẻ liệt kê mọi thứ bạn đang lên kế hoạch, đã lưu trữ hoặc đã hoàn thành.',
  'help.ctx.dashboard.bullet.1':
    'Thẻ lên máy bay: chuyến đi đang diễn ra hoặc sắp tới với ngày tháng, người đi cùng, địa điểm và đếm ngược. Nhấp vào để mở chuyến đi.',
  'help.ctx.dashboard.bullet.2':
    'Thống kê: quốc gia đã đến, số chuyến đi, số ngày trên đường và quãng đường bay, tính trên tất cả chuyến đi của bạn.',
  'help.ctx.dashboard.bullet.3':
    'Thẻ chuyến đi, lọc theo Đã lên kế hoạch, Đã lưu trữ và Hoàn thành, dạng lưới hoặc danh sách. Ô tìm kiếm phía trên tìm trong mọi chuyến đi cùng lúc, theo tiêu đề, ngày hoặc một địa điểm trong đó. Di chuột lên thẻ để chỉnh sửa, nhân bản, lưu trữ và xóa.',
  'help.ctx.dashboard.bullet.4':
    'Tiện ích bên phải: đổi tiền tệ, đồng hồ thế giới, đặt chỗ sắp tới và bộ sưu tập. Mỗi tiện ích đều có thể tắt.',
  'help.ctx.dashboard.bullet.5': 'Thẻ “Chuyến đi mới” và nút ở góc dưới bên phải đều tạo một chuyến đi mới.',

  // create-trip
  'help.guide.create-trip.title': 'Tạo chuyến đi',
  'help.guide.create-trip.goal': 'Bắt đầu một chuyến đi mới với tên, ngày tháng và ảnh bìa.',
  'help.guide.create-trip.step.1':
    'Nhấp “Chuyến đi mới”. Thẻ ở cuối danh sách chuyến đi và nút ở góc dưới bên phải làm cùng một việc.',
  'help.guide.create-trip.step.2':
    'Đặt tên cho chuyến đi. Đó là trường bắt buộc duy nhất; mọi thứ khác có thể thêm sau.',
  'help.guide.create-trip.step.3':
    'Chọn ngày bắt đầu và kết thúc. TREK tạo một ngày cho mỗi mốc, nên lịch trình đã sẵn sàng để điền.',
  'help.guide.create-trip.step.4':
    'Tùy chọn: thêm ảnh bìa. Tải ảnh của bạn lên, kéo thả vào, hoặc tìm điểm đến trên Unsplash.',
  'help.guide.create-trip.step.5': 'Nhấp “Tạo chuyến đi mới”.',
  'help.guide.create-trip.result':
    'Chuyến đi xuất hiện trên bảng điều khiển. Nếu là chuyến tiếp theo, nó sẽ chiếm thẻ lên máy bay ở trên cùng.',
  'help.guide.create-trip.tip.1':
    'Ngày tháng có thể đổi sau. Nếu đã có đặt chỗ, TREK sẽ hỏi có dời chúng cùng với các ngày hay không.',
  'help.guide.create-trip.tip.2':
    'Tiền tệ chuyến đi bạn chọn ở đây là đơn vị mà mọi chi phí được quy đổi về. Hãy chọn tiền tệ của điểm đến.',

  // edit-trip
  'help.guide.edit-trip.title': 'Chỉnh sửa chuyến đi',
  'help.guide.edit-trip.goal': 'Đổi tên chuyến đi, đổi ngày hoặc điều chỉnh cài đặt.',
  'help.guide.edit-trip.step.1': 'Di chuột lên thẻ chuyến đi (hoặc thẻ lên máy bay) và nhấp vào biểu tượng bút chì.',
  'help.guide.edit-trip.step.2': 'Thay đổi những gì cần: tên, mô tả, ngày, ảnh bìa, tiền tệ, nhắc nhở hoặc thành viên.',
  'help.guide.edit-trip.step.3': 'Nhấp “Cập nhật”.',
  'help.guide.edit-trip.result': 'Thẻ cập nhật ngay lập tức, cho mọi thành viên của chuyến đi.',
  'help.guide.edit-trip.tip.1':
    'Dời ngày của chuyến đi đã có đặt chỗ sẽ mở bước thứ hai hỏi có dời cả đặt chỗ theo hay không.',

  // cover-image
  'help.guide.cover-image.title': 'Đặt ảnh bìa',
  'help.guide.cover-image.goal': 'Gán cho chuyến đi một hình ảnh hiển thị trên thẻ và trên thẻ lên máy bay.',
  'help.guide.cover-image.step.1': 'Mở biểu mẫu chỉnh sửa chuyến đi bằng biểu tượng bút chì trên thẻ.',
  'help.guide.cover-image.step.2':
    'Trong “Ảnh bìa”, thả ảnh vào, nhấp để tải lên, hoặc gõ điểm đến vào ô tìm kiếm Unsplash.',
  'help.guide.cover-image.step.3': 'Chọn ảnh và nhấp “Cập nhật”.',
  'help.guide.cover-image.result': 'Ảnh được lưu cùng chuyến đi và hiển thị ở mọi nơi chuyến đi xuất hiện.',
  'help.guide.cover-image.tip.1':
    'Ảnh từ tìm kiếm Unsplash được ghi nguồn tự động; ảnh bạn tự tải lên nằm trên máy chủ của bạn.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Nhân bản chuyến đi',
  'help.guide.duplicate-trip.goal': 'Dùng lại một chuyến đi làm mẫu cho chuyến mới.',
  'help.guide.duplicate-trip.step.1': 'Di chuột lên thẻ và nhấp biểu tượng nhân bản.',
  'help.guide.duplicate-trip.step.2': 'Đọc những gì sẽ và sẽ không được sao chép, rồi xác nhận.',
  'help.guide.duplicate-trip.result': 'Một bản sao xuất hiện cạnh bản gốc, sẵn sàng để đổi tên và đổi ngày.',
  'help.guide.duplicate-trip.tip.1':
    'Ngày, địa điểm, đặt chỗ, khoản ngân sách, danh sách đồ đạc và ghi chú theo ngày được sao chép. Thành viên, trò chuyện, bình chọn, tệp và liên kết chia sẻ thì không.',

  // archive-trip
  'help.guide.archive-trip.title': 'Lưu trữ và khôi phục chuyến đi',
  'help.guide.archive-trip.goal': 'Cất chuyến đi đi mà không xóa, rồi lấy lại sau.',
  'help.guide.archive-trip.step.1': 'Di chuột lên thẻ và nhấp “Lưu trữ”.',
  'help.guide.archive-trip.step.2': 'Chuyển bộ lọc phía trên các thẻ sang “Đã lưu trữ” để thấy lại.',
  'help.guide.archive-trip.step.3': 'Nhấp “Khôi phục” trên thẻ để đưa nó về “Đã lên kế hoạch”.',
  'help.guide.archive-trip.result':
    'Chuyến đi đã lưu trữ giữ nguyên mọi thứ. Chúng chỉ không còn chiếm chỗ trên bảng điều khiển và trong nguồn lịch của tất cả chuyến đi.',

  // delete-trip
  'help.guide.delete-trip.title': 'Xóa chuyến đi',
  'help.guide.delete-trip.goal': 'Xóa hẳn một chuyến đi.',
  'help.guide.delete-trip.step.1': 'Di chuột lên thẻ và nhấp biểu tượng thùng rác.',
  'help.guide.delete-trip.step.2': 'Xác nhận. Hộp thoại nêu tên chuyến đi để bạn chắc chắn chọn đúng.',
  'help.guide.delete-trip.result':
    'Chuyến đi cùng các ngày, địa điểm, đặt chỗ và tệp sẽ biến mất. Không thể hoàn tác; nếu chưa chắc, hãy lưu trữ thay vì xóa.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Tìm chuyến đi đã hoàn thành, chuyển giữa lưới và danh sách',
  'help.guide.filter-and-view.goal': 'Xem các chuyến đi đã kết thúc hoặc đã lưu trữ và chọn bố cục bạn thích.',
  'help.guide.filter-and-view.step.1':
    'Dùng “Đã lên kế hoạch”, “Đã lưu trữ” và “Hoàn thành” phía trên các thẻ. Hoàn thành là mọi chuyến đi đã qua ngày kết thúc.',
  'help.guide.filter-and-view.step.2':
    'Nhấp biểu tượng danh sách để chuyển sang danh sách gọn; nhấp lại để về dạng lưới.',
  'help.guide.filter-and-view.result': 'Bảng điều khiển ghi nhớ bố cục của bạn trên thiết bị này.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Đăng ký tất cả chuyến đi vào lịch của bạn',
  'help.guide.calendar-feed.goal':
    'Xem ngày và đặt chỗ của mọi chuyến đi đang hoạt động trong ứng dụng lịch, luôn được đồng bộ.',
  'help.guide.calendar-feed.step.1': 'Nhấp biểu tượng lịch cạnh nút chuyển chế độ xem.',
  'help.guide.calendar-feed.step.2': 'Nhấp “Enable calendar subscription”. TREK tạo một liên kết nguồn lịch riêng tư.',
  'help.guide.calendar-feed.step.3':
    'Thêm nguồn lịch bằng một trong các nút (Google, Apple, Outlook) hoặc sao chép liên kết vào bất kỳ ứng dụng lịch nào hỗ trợ đăng ký qua URL.',
  'help.guide.calendar-feed.result':
    'Mọi chuyến đi đang hoạt động hiện trong lịch của bạn và tự cập nhật. Chuyến đi đã lưu trữ và chuyến đã kết thúc hơn 90 ngày sẽ không được đưa vào.',
  'help.guide.calendar-feed.tip.1':
    'Liên kết là bí mật. Ai có nó đều đọc được nguồn lịch; nếu bị lộ, hãy thu hồi trong cùng hộp thoại.',

  // widgets
  'help.guide.widgets.title': 'Chọn tiện ích cho bảng điều khiển',
  'help.guide.widgets.goal': 'Hiện hoặc ẩn hàng thống kê và các tiện ích bên phải.',
  'help.guide.widgets.step.1': 'Mở menu ảnh đại diện ở góc trên bên phải và chọn “Cài đặt”.',
  'help.guide.widgets.step.2': 'Chuyển sang thẻ “Giao diện”.',
  'help.guide.widgets.step.3':
    'Trong “Tiện ích bảng điều khiển”, bật hoặc tắt từng tiện ích. Máy tính và điện thoại được cài riêng.',
  'help.guide.widgets.step.4': 'Quay lại bảng điều khiển. Thay đổi có hiệu lực ngay.',
  'help.guide.widgets.result': 'Tiện ích bị ẩn nhường chỗ cho các chuyến đi; tắt toàn bộ cột phải để căn giữa bố cục.',
  'help.guide.widgets.link': 'Mở cài đặt giao diện',

  // currency-widget
  'help.guide.currency-widget.title': 'Đổi tiền tệ',
  'help.guide.currency-widget.goal': 'Quy đổi một số tiền giữa hai loại tiền tệ theo tỷ giá hiện tại.',
  'help.guide.currency-widget.step.1': 'Nhập số tiền và chọn hai loại tiền tệ.',
  'help.guide.currency-widget.step.2': 'Mũi tên ở giữa hoán đổi cặp tiền; mũi tên tròn làm mới tỷ giá.',
  'help.guide.currency-widget.result': 'Cặp tiền tệ được lưu trong tài khoản, nên giống nhau trên mọi thiết bị.',
  'help.guide.currency-widget.tip.1': 'Tỷ giá lấy từ Ngân hàng Trung ương châu Âu và cập nhật mỗi ngày một lần.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Thêm đồng hồ thế giới',
  'help.guide.timezones-widget.goal': 'Theo dõi giờ địa phương tại các điểm đến của bạn.',
  'help.guide.timezones-widget.step.1': 'Nhấp + trong tiện ích “Múi giờ” và tìm một thành phố.',
  'help.guide.timezones-widget.step.2': 'Xóa đồng hồ bằng dấu × bên cạnh.',
  'help.guide.timezones-widget.result': 'Đồng hồ của bạn được lưu cùng tài khoản.',
  'help.guide.search-trips.title': 'Tìm chuyến đi của bạn',
  'help.guide.search-trips.goal':
    'Tìm một chuyến đi theo tên, ngày hoặc một địa điểm bạn đã lên kế hoạch trong đó, kể cả chuyến đi đã lưu trữ.',
  'help.guide.search-trips.step.1':
    'Gõ vào “Tìm chuyến đi hoặc địa điểm” phía trên các thẻ. Danh sách thu hẹp ngay khi bạn gõ, trên cả chuyến đi đã lên kế hoạch, đã lưu trữ và đã hoàn thành cùng lúc.',
  'help.guide.search-trips.step.2':
    'Một chuyến đi được tìm thấy qua một địa điểm của nó sẽ ghi tên địa điểm đó dưới tiêu đề. Nhấp dấu x trong ô, hoặc nhấn Escape, để thấy lại mọi chuyến đi.',
  'help.guide.search-trips.result':
    'Chỉ những chuyến đi khớp mới ở lại trên bảng điều khiển, và ô trống sẽ đưa mọi chuyến đi trở lại.',
  'help.guide.search-trips.tip.1':
    'Ngày cũng dùng được: gõ tháng và năm, ví dụ tháng 5 năm 2027, hoặc 2027-05, để tìm các chuyến đi rơi vào tháng đó.',
  'help.guide.search-trips.tip.2':
    'Khi đang tìm kiếm, nút chuyển “Đã lên kế hoạch”, “Đã lưu trữ” và “Hoàn thành” tạm lùi lại, để không chuyến đi nào bị khuất sau bộ lọc sai.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay là công cụ lên kế hoạch nghỉ phép cá nhân của bạn: mỗi năm bạn có bao nhiêu ngày phép, đã ghi những ngày nào và còn lại bao nhiêu. Lưới hiển thị cả năm trong một cái nhìn; thanh bên có bộ chọn năm, những người cùng lên kế hoạch, lịch được chia sẻ với bạn, chú giải và số ngày phép của bạn.',
  'help.ctx.vacay.bullet.1':
    'Lưới năm: mười hai thẻ tháng, mỗi ngày một ô. Nhấp vào một ngày để ghi hoặc xóa. Chấm xanh nhỏ đánh dấu những ngày đã có chuyến đi.',
  'help.ctx.vacay.bullet.2':
    'Thanh công cụ ở dưới: chế độ “Kì nghỉ” hoặc “Kỳ nghỉ của công ty”, cùng các công tắc “Nửa ngày” và “Nghỉ bù” thay đổi nội dung mà một cú nhấp ghi lại.',
  'help.ctx.vacay.bullet.3':
    '“Quyền lợi”: ngày phép trong năm, đã dùng bao nhiêu và còn bao nhiêu, kèm số ngày chuyển từ kỳ trước.',
  'help.ctx.vacay.bullet.4':
    '“Người” là những người đã hợp nhất với kế hoạch của bạn, mỗi người một màu. “Lịch được chia sẻ” là các vòng chỉ đọc hiển thị ngày nghỉ của người khác.',
  'help.ctx.vacay.bullet.5':
    '“Cài đặt” gồm cuối tuần, ngày bắt đầu tuần, chuyển phép, năm nghỉ phép của bạn, nghỉ công ty và lịch ngày lễ hoặc nghỉ học.',
  // log-day
  'help.guide.log-day.title': 'Ghi một ngày nghỉ phép',
  'help.guide.log-day.goal': 'Đánh dấu một ngày nghỉ trong lưới năm và xem số dư thay đổi theo.',
  'help.guide.log-day.step.1':
    'Nhìn thanh công cụ ở dưới: nút bên trái mang màu của bạn nghĩa là một cú nhấp sẽ ghi một ngày phép cho bạn.',
  'help.guide.log-day.step.2':
    'Nhấp vào một ngày trong bất kỳ thẻ tháng nào. Ô được tô màu của bạn và “Đã dùng” tăng thêm một ngày.',
  'help.guide.log-day.step.3': 'Nhấp lại cùng ngày đó để xóa.',
  'help.guide.log-day.result':
    'Ngày được ghi, “Ngày”, “Đã dùng” và “Bên trái” cập nhật ngay, và mọi người hợp nhất với kế hoạch của bạn thấy ngay lập tức.',
  'help.guide.log-day.tip.1': 'Không thể ghi cuối tuần khi “Các ngày cuối tuần” đang bật trong “Cài đặt”.',
  'help.guide.log-day.tip.2':
    'Chấm xanh trong ô nghĩa là một chuyến đi của bạn trùng ngày đó, nên bạn thấy nghỉ phép và chuyến đi trùng nhau ở đâu.',
  // half-day
  'help.guide.half-day.title': 'Ghi nửa ngày',
  'help.guide.half-day.goal': 'Nghỉ một buổi chiều mà không tốn cả ngày phép.',
  'help.guide.half-day.step.1': 'Bật “Nửa ngày” trên thanh công cụ. Chấm cam là dấu mà nửa ngày nhận được trong lưới.',
  'help.guide.half-day.step.2': 'Nhấp vào một ngày. Nó được ghi là 0,5 và có chấm cam ở góc.',
  'help.guide.half-day.step.3':
    'Tắt “Nửa ngày” khi xong; nhấp vào một nửa ngày với cài đặt khác sẽ chuyển đổi nó tại chỗ.',
  'help.guide.half-day.result':
    '“Đã dùng” tăng 0,5. “Nửa ngày” và “Nghỉ bù” độc lập nhau, nên nửa ngày nghỉ bù cũng được.',
  'help.guide.half-day.tip.1':
    'Thanh công cụ luôn hiển thị dấu mà cú nhấp tiếp theo sẽ đặt, để bạn kiểm tra trước khi ghi.',
  // comp-day
  'help.guide.comp-day.title': 'Ghi nghỉ bù hoặc giờ linh hoạt',
  'help.guide.comp-day.goal': 'Nghỉ bù mà không tốn ngày phép.',
  'help.guide.comp-day.step.1':
    'Bật “Nghỉ bù” trên thanh công cụ. Đĩa gạch chéo là hình dạng của ngày nghỉ bù trong lưới.',
  'help.guide.comp-day.step.2': 'Nhấp vào một ngày. Ô được tô gạch chéo theo màu của bạn thay vì khối đặc.',
  'help.guide.comp-day.result': 'Ngày nghỉ bù được đếm riêng cạnh các ô số ngày phép và không bao giờ giảm “Bên trái”.',
  'help.guide.comp-day.tip.1':
    'Giờ làm thêm được nghỉ bù, giờ linh hoạt, ngày nghỉ bù: mọi thứ là nghỉ nhưng không phải phép đều thuộc về đây.',
  // entitlement
  'help.guide.entitlement.title': 'Đặt số ngày phép',
  'help.guide.entitlement.goal': 'Cho Vacay biết bạn có bao nhiêu ngày phép trong năm.',
  'help.guide.entitlement.step.1': 'Trong thanh bên, nhấp vào ô “Ngày” dưới mục “Quyền lợi”.',
  'help.guide.entitlement.step.2': 'Nhập số ngày và nhấn Enter.',
  'help.guide.entitlement.result':
    '“Bên trái” được tính lại từ số ngày phép, phần chuyển sang (nếu có) và số ngày đã dùng.',
  'help.guide.entitlement.tip.1': 'Mỗi năm có số ngày phép riêng, nên thay đổi ở đây chỉ ảnh hưởng năm đang chọn.',
  // years
  'help.guide.years.title': 'Thêm và chuyển năm',
  'help.guide.years.goal': 'Lên kế hoạch sẵn cho năm sau, hoặc nhìn lại năm trước.',
  'help.guide.years.step.1': 'Nhấp dấu + bên phải năm để thêm năm sau, hoặc dấu + bên trái để thêm năm trước.',
  'help.guide.years.step.2': 'Chuyển năm bằng các mũi tên hoặc các thẻ năm bên dưới.',
  'help.guide.years.step.3':
    'Để xóa một năm, di chuột lên thẻ của nó và nhấp dấu trừ nhỏ. Các mục của năm đó cũng mất theo, nên hãy xác nhận cẩn thận.',
  'help.guide.years.result': 'Mỗi năm giữ số ngày phép và mục riêng; chuyển phép liên kết chúng với nhau.',
  // company-holidays
  'help.guide.company-holidays.title': 'Đánh dấu ngày nghỉ công ty',
  'help.guide.company-holidays.goal': 'Chặn những ngày cả công ty nghỉ mà không tốn ngày phép của ai.',
  'help.guide.company-holidays.step.1':
    'Mở “Cài đặt” và kiểm tra “Ngày lễ của công ty” đang bật. Mặc định là bật; thanh công cụ chỉ hiện chế độ này khi nó bật.',
  'help.guide.company-holidays.step.2': 'Trở lại lưới, chuyển thanh công cụ sang chế độ “Kỳ nghỉ của công ty”.',
  'help.guide.company-holidays.step.3': 'Nhấp vào các ngày. Chúng chuyển màu hổ phách và xuất hiện trong chú giải.',
  'help.guide.company-holidays.result':
    'Ngày nghỉ công ty hiển thị với mọi người hợp nhất trong kế hoạch và không bao giờ giảm “Bên trái”.',
  'help.guide.company-holidays.tip.1':
    'Bất kỳ ai đã hợp nhất đều có thể sửa ngày nghỉ công ty, nên hãy thống nhất ai quản lý.',
  // public-holidays
  'help.guide.public-holidays.title': 'Hiển thị ngày lễ',
  'help.guide.public-holidays.goal': 'Đưa ngày lễ của quốc gia hoặc vùng của bạn lên lưới.',
  'help.guide.public-holidays.step.1': 'Mở “Cài đặt” và bật “Ngày lễ”.',
  'help.guide.public-holidays.step.2': 'Nhấp “Thêm lịch”, chọn quốc gia và vùng nếu cần. Đặt màu và nhãn nếu muốn.',
  'help.guide.public-holidays.step.3': 'Đóng “Cài đặt”. Ngày lễ xuất hiện trên lưới và trong chú giải.',
  'help.guide.public-holidays.result':
    'Ngày lễ được đánh dấu bằng màu của lịch và không bao giờ tính vào số ngày phép của bạn.',
  'help.guide.public-holidays.tip.1':
    'Bạn có thể thêm nhiều lịch, ví dụ vùng của bạn và vùng của đồng nghiệp đã hợp nhất.',
  // school-holidays
  'help.guide.school-holidays.title': 'Hiển thị kỳ nghỉ học',
  'help.guide.school-holidays.goal': 'Xem kỳ nghỉ học của vùng bạn bên cạnh ngày nghỉ của bạn.',
  'help.guide.school-holidays.step.1': 'Mở “Cài đặt” và bật “School Holidays”.',
  'help.guide.school-holidays.step.2':
    'Nhấp “Thêm lịch” và chọn quốc gia. Nếu quốc gia chia lịch, hãy chọn cả vùng hoặc nhóm.',
  'help.guide.school-holidays.step.3': 'Đóng “Cài đặt”. Mỗi kỳ nghỉ có một dải màu ở cuối các ngày.',
  'help.guide.school-holidays.result': 'Kỳ nghỉ học chỉ mang tính hiển thị: không bao giờ giảm ngày phép của ai.',
  'help.guide.school-holidays.tip.1':
    'Thiếu vùng? Quản trị viên có thể quản lý kỳ nghỉ học thủ công trong “Quản trị viên”, “Cá nhân hóa”, “Kỳ nghỉ học”.',
  // weekends
  'help.guide.weekends.title': 'Chặn cuối tuần và đặt ngày bắt đầu tuần',
  'help.guide.weekends.goal': 'Giữ cuối tuần ngoài phép tính và bắt đầu tuần vào ngày bạn quen.',
  'help.guide.weekends.step.1': 'Mở “Cài đặt”.',
  'help.guide.weekends.step.2': 'Bật “Các ngày cuối tuần” và chọn những ngày được tính là cuối tuần của bạn.',
  'help.guide.weekends.step.3': 'Ở “Tuần bắt đầu vào”, chọn Thứ Hai hoặc Chủ Nhật.',
  'help.guide.weekends.result': 'Các ngày bị chặn hiện màu xám trong lưới và không thể ghi nhầm.',
  // leave-year
  'help.guide.leave-year.title': 'Đặt năm nghỉ phép',
  'help.guide.leave-year.goal':
    'Tính ngày phép theo năm tài chính hoặc từ ngày vào làm thay vì từ tháng Một đến tháng Mười Hai.',
  'help.guide.leave-year.step.1': 'Mở “Cài đặt” và tìm “Năm nghỉ phép”.',
  'help.guide.leave-year.step.2':
    'Chọn “Dương lịch”, “Tài chính” (với tháng và ngày bắt đầu) hoặc “Ngày vào làm” (với ngày bạn được tuyển).',
  'help.guide.leave-year.result':
    'Số ngày phép, ngày đã dùng và chuyển phép theo kỳ đó, và lưới bắt đầu từ tháng đầu tiên của kỳ.',
  'help.guide.leave-year.tip.1':
    'Cài đặt này là cá nhân: trong kế hoạch hợp nhất, mỗi người giữ năm nghỉ phép và con số của mình.',
  // carry-over
  'help.guide.carry-over.title': 'Chuyển ngày chưa dùng sang kỳ sau',
  'help.guide.carry-over.goal': 'Cộng phần còn lại cuối kỳ vào kỳ tiếp theo.',
  'help.guide.carry-over.step.1': 'Mở “Cài đặt”.',
  'help.guide.carry-over.step.2': 'Bật “Chuyển tiếp”.',
  'help.guide.carry-over.result': 'Số ngày chuyển được tính lại cho tất cả các năm và hiển thị dưới số ngày phép.',
  'help.guide.carry-over.tip.1': 'Tắt đi sẽ đưa mọi số dư chuyển phép về 0.',
  // invite
  'help.guide.invite.title': 'Lên kế hoạch cùng ai đó',
  'help.guide.invite.goal': 'Hợp nhất kế hoạch với một người dùng TREK khác để thấy ngày nghỉ của nhau trong một lưới.',
  'help.guide.invite.step.1': 'Nhấp biểu tượng người trong bảng “Người”.',
  'help.guide.invite.step.2': 'Chọn người dùng và gửi lời mời.',
  'help.guide.invite.step.3': 'Họ nhận thông báo và chấp nhận. Cho đến lúc đó lời mời hiển thị là đang chờ.',
  'help.guide.invite.result':
    'Hai kế hoạch hợp nhất: mỗi người một màu, các bạn có thể ghi ngày cho nhau, và mọi thứ đồng bộ trực tiếp.',
  'help.guide.invite.tip.1':
    'Để hủy hợp nhất, dùng “Hòa tan” trong “Cài đặt”. Các mục của mỗi người trở về kế hoạch riêng.',
  'help.guide.invite.tip.2': 'Nếu người kia chỉ cần xem ngày của bạn, hãy chia sẻ lịch thay vì hợp nhất.',
  // share-calendar
  'help.guide.share-calendar.title': 'Chia sẻ lịch ở chế độ chỉ đọc',
  'help.guide.share-calendar.goal': 'Cho ai đó xem khi nào bạn nghỉ mà không cho họ quyền với kế hoạch của bạn.',
  'help.guide.share-calendar.step.1': 'Nhấp biểu tượng chia sẻ trong bảng “Lịch được chia sẻ”.',
  'help.guide.share-calendar.step.2': 'Chọn người dùng và nhấp “Chia sẻ”. Không cần chấp nhận.',
  'help.guide.share-calendar.step.3':
    'Lịch được chia sẻ với bạn xuất hiện trong cùng bảng; biểu tượng mắt ẩn một lịch, “Ngừng chia sẻ” thu hồi lịch của bạn.',
  'help.guide.share-calendar.result':
    'Ngày nghỉ của bạn hiện dưới dạng vòng màu trên lưới của họ. Không gì bạn chia sẻ có thể bị chỉnh sửa từ phía họ.',
  'help.guide.share-calendar.tip.1':
    'Chia sẻ và hợp nhất độc lập nhau: bạn có thể hợp nhất với một người và chia sẻ với những người khác.',
  'help.guide.share-calendar.tip.2': 'Di chuột lên ngày có vòng để xem ai nghỉ và trong bao lâu.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas là dấu chân du lịch của bạn trên bản đồ thế giới: mọi quốc gia mà một chuyến đi đã đưa bạn tới đều được tô màu, và bạn có thể tự thêm những nước đã đến trước khi dùng TREK. Phóng to để xem khu vực, giữ một danh sách nhóm những nơi bạn vẫn muốn đến, và đọc các con số của bạn trong bảng kính ở dưới cùng.',
  'help.ctx.atlas.bullet.1':
    'Bản đồ: quốc gia đã ghé thăm mang một màu riêng không đổi, quốc gia đã lên kế hoạch có viền nét đứt, quốc gia trong danh sách nhóm có gạch chéo, mọi nơi khác màu xám. Di chuột lên một quốc gia để xem chuyến đi, địa điểm, lần đến đầu tiên và gần nhất.',
  'help.ctx.atlas.bullet.2':
    'Tìm kiếm ở trên cùng: gõ tên quốc gia hoặc địa điểm. Chọn một quốc gia sẽ bay bản đồ tới đó và mở cửa sổ bật lên của nó; chọn một địa điểm sẽ đáp xuống khu vực của nó để bạn đánh dấu khu vực đó.',
  'help.ctx.atlas.bullet.3':
    '“Hiện các quốc gia đã lên kế hoạch”, góc trên bên phải: hiện các quốc gia trong những chuyến đi sắp tới của bạn. Công tắc chỉ xuất hiện khi bạn có chuyến đi như vậy.',
  'help.ctx.atlas.bullet.4':
    'Bảng ở dưới cùng: tab Thống kê với quốc gia, chuyến đi, địa điểm, thành phố, ngày, châu lục và chuỗi liên tiếp của bạn; tab Danh sách nhóm với những gì còn ở phía trước.',
  'help.ctx.atlas.bullet.5':
    'Khu vực: từ mức thu phóng 5, bản đồ chuyển sang các bang và tỉnh, mỗi nơi đều nhấp được để đánh dấu hoặc bỏ đánh dấu.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: khi tiện ích bổ sung đã kết nối, một bảng bên trái phần thống kê sẽ đánh dấu hoàn thành các mong muốn và thêm quốc gia từ bản ghi của bạn, không bao giờ làm vậy mà không có xác nhận của bạn.',
  // mark-country
  'help.guide.mark-country.title': 'Đánh dấu một quốc gia là đã ghé thăm',
  'help.guide.mark-country.goal':
    'Thêm một quốc gia bạn đã đến trước khi dùng TREK, để bản đồ và số đếm của bạn tính cả nó.',
  'help.guide.mark-country.step.1': 'Gõ tên quốc gia vào ô tìm kiếm ở phía trên bản đồ.',
  'help.guide.mark-country.step.2':
    'Chọn nó trong danh sách. Bản đồ bay tới đó và một cửa sổ bật lên mở ra cho quốc gia đó.',
  'help.guide.mark-country.step.3': 'Chọn “Đánh dấu là đã ghé thăm”.',
  'help.guide.mark-country.result':
    'Quốc gia nhận màu của nó trên bản đồ và mục Quốc gia đếm thêm một. Màu đó là cố định: đánh dấu thêm quốc gia khác không bao giờ xáo trộn màu của những nước còn lại.',
  'help.guide.mark-country.tip.1':
    'Nhấp vào một quốc gia màu xám trên bản đồ cũng mở cùng cửa sổ bật lên; tìm kiếm là cách chắc chắn với các nước nhỏ.',
  'help.guide.mark-country.tip.2':
    'Quốc gia bạn tự đánh dấu luôn được tính là đã ghé thăm, bất kể ngày tháng của chuyến đi nào tới đó.',
  // unmark-country
  'help.guide.unmark-country.title': 'Gỡ một quốc gia bạn đã đánh dấu',
  'help.guide.unmark-country.goal': 'Bỏ một quốc gia đã đánh dấu thủ công ra khỏi bản đồ.',
  'help.guide.unmark-country.step.1':
    'Tìm quốc gia và chọn nó, hoặc nhấp vào nó trên bản đồ. Với quốc gia bạn tự đánh dấu, cửa sổ bật lên sẽ hỏi có gỡ nó không.',
  'help.guide.unmark-country.step.2': 'Xác nhận bằng “Di dời”.',
  'help.guide.unmark-country.result': 'Quốc gia trở lại màu xám và rời khỏi số đếm của bạn.',
  'help.guide.unmark-country.tip.1':
    'Chỉ quốc gia đánh dấu thủ công mới gỡ được theo cách này. Quốc gia có chuyến đi hoặc địa điểm vẫn giữ nguyên chừng nào chúng còn đó; nút “Di dời” cũng nằm trong thẻ chi tiết của nó ở bảng khi nó được đánh dấu thủ công.',
  // country-details
  'help.guide.country-details.title': 'Xem bạn đã làm gì ở một quốc gia',
  'help.guide.country-details.goal': 'Mở một quốc gia đã ghé thăm và nhảy tới các chuyến đi đã đưa bạn tới đó.',
  'help.guide.country-details.step.1': 'Tìm một quốc gia bạn đã ghé thăm.',
  'help.guide.country-details.step.2':
    'Chọn nó. Bản đồ bay tới đó và bảng ở dưới cùng hiện thêm một thẻ với quốc kỳ, địa điểm, chuyến đi và một chip cho mỗi chuyến đi.',
  'help.guide.country-details.result': 'Nhấp vào chip chuyến đi để mở chuyến đi đó trong trình lập kế hoạch.',
  'help.guide.country-details.tip.1':
    'Di chuột lên quốc gia trên bản đồ sẽ hiện cùng những con số đó cộng thêm lần đến đầu tiên và gần nhất.',
  // planned-countries
  'help.guide.planned-countries.title': 'Hiện các quốc gia bạn sắp đến',
  'help.guide.planned-countries.goal':
    'Đưa các quốc gia trong những chuyến đi sắp tới lên bản đồ mà không tính chúng là đã ghé thăm.',
  'help.guide.planned-countries.step.1':
    'Bật “Hiện các quốc gia đã lên kế hoạch” ở góc trên bên phải. Con số bên cạnh là số quốc gia đang chờ.',
  'help.guide.planned-countries.step.2':
    'Tìm một quốc gia đã lên kế hoạch và chọn nó: bảng ghi Đã lên kế hoạch và chú giải trên bản đồ cho biết khi nào bạn đi.',
  'help.guide.planned-countries.result':
    'Quốc gia đã lên kế hoạch hiện với viền nét đứt, nên không bao giờ trông giống nơi bạn đã đến. Công tắc ghi nhớ lựa chọn của bạn.',
  'help.guide.planned-countries.tip.1':
    'Một quốc gia được tính là đã ghé thăm khi chuyến đi tới đó đã bắt đầu; chuyến đi đang diễn ra cũng tính. Chuyến đi không có ngày hoàn toàn nằm ngoài thống kê.',
  'help.guide.planned-countries.tip.2': 'Công tắc chỉ tồn tại khi bạn có chuyến đi sắp tới.',
  // regions
  'help.guide.regions.title': 'Đánh dấu một khu vực',
  'help.guide.regions.goal': 'Chi tiết hơn quốc gia: đánh dấu các bang, tỉnh hoặc quận bạn đã đến.',
  'help.guide.regions.step.1':
    'Phóng to vào một quốc gia cho tới khi các khu vực hiện ra, từ mức thu phóng 5. Tìm quốc gia đó và chọn nó sẽ đưa bạn đủ gần.',
  'help.guide.regions.step.2':
    'Nhấp vào một khu vực. Di chuột lên sẽ hiện tên; cửa sổ bật lên hiện khu vực và quốc gia của nó.',
  'help.guide.regions.step.3': 'Chọn “Đánh dấu là đã ghé thăm”.',
  'help.guide.regions.result':
    'Khu vực được tô bằng màu của quốc gia. Đánh dấu một khu vực cũng tính quốc gia đó là đã ghé thăm nếu trước đó chưa.',
  'help.guide.regions.tip.1':
    'Nhấp vào một khu vực đã ghé thăm sẽ có nút “Di dời”, dù bạn đã đánh dấu nó hay một địa điểm đã đưa nó vào.',
  'help.guide.regions.tip.2': 'Khu vực có địa điểm thật của bạn được đánh dấu sẵn; không cần làm gì ở đó.',
  // search-place
  'help.guide.search-place.title': 'Tìm một địa điểm và đánh dấu khu vực của nó',
  'help.guide.search-place.goal':
    'Đánh dấu Lombardy bằng cách tìm Milan, mà không cần biết một thành phố nằm ở khu vực nào.',
  'help.guide.search-place.step.1':
    'Gõ một thành phố, một địa danh hoặc một địa chỉ vào ô tìm kiếm. Quốc gia hiện trước; các địa điểm khớp hiện phía dưới, dưới tiêu đề Địa điểm.',
  'help.guide.search-place.step.2': 'Chọn địa điểm. Bản đồ bay tới đó và xác định điểm đó nằm trong khu vực nào.',
  'help.guide.search-place.step.3':
    'Chọn “Đánh dấu là đã ghé thăm” cho khu vực đó, hoặc “Thêm vào danh sách nhóm” nếu nó vẫn còn ở phía trước.',
  'help.guide.search-place.result':
    'Khu vực được đánh dấu, và quốc gia cũng vậy. Quốc gia không có dữ liệu khu vực trong gói bản đồ sẽ quay về chính quốc gia đó.',
  'help.guide.search-place.tip.1':
    'Địa điểm đến từ cùng một tìm kiếm như mọi nơi khác trong TREK, nên đi theo nhà cung cấp mà quản trị viên của bạn đã thiết lập.',
  // bucket-country
  'help.guide.bucket-country.title': 'Đưa một quốc gia vào danh sách nhóm',
  'help.guide.bucket-country.goal':
    'Giữ một danh sách nhóm các quốc gia ngay trên bản đồ, tách khỏi những nước bạn đã đến.',
  'help.guide.bucket-country.step.1': 'Tìm quốc gia và chọn nó, hoặc nhấp vào nó trên bản đồ.',
  'help.guide.bucket-country.step.2': 'Chọn “Thêm vào danh sách nhóm”.',
  'help.guide.bucket-country.step.3':
    'Chọn tháng và năm nếu bạn đã biết khi nào, rồi xác nhận bằng “Thêm vào danh sách nhóm”.',
  'help.guide.bucket-country.result':
    'Quốc gia được vẽ bằng gạch chéo theo màu mà nó sẽ mang khi bạn tới đó, và xuất hiện trong tab Danh sách nhóm của bảng.',
  'help.guide.bucket-country.tip.1':
    'Cùng cửa sổ bật lên đó sẽ có “Xóa khỏi danh sách nhóm” khi quốc gia đã nằm trong danh sách.',
  'help.guide.bucket-country.tip.2':
    'Mỗi ngày dự kiến một mục: cùng một quốc gia có thể nằm trong danh sách cho hai tháng khác nhau, nhưng không hai lần cho cùng một tháng.',
  // bucket-place
  'help.guide.bucket-place.title': 'Thêm một địa điểm vào danh sách nhóm',
  'help.guide.bucket-place.goal':
    'Lưu một thành phố, một thắng cảnh hoặc một địa chỉ bạn mơ ước, kèm tọa độ và ngày dự kiến.',
  'help.guide.bucket-place.step.1': 'Mở tab Danh sách nhóm trong bảng ở dưới cùng.',
  'help.guide.bucket-place.step.2': 'Nhấp “Thêm địa điểm”.',
  'help.guide.bucket-place.step.3':
    'Gõ tên và bấm nút tìm kiếm; chọn kết quả khớp để địa điểm có tọa độ. Chỉ gõ tên và bỏ qua tìm kiếm cũng được.',
  'help.guide.bucket-place.step.4': 'Chọn tháng và năm nếu muốn rồi nhấp “Thêm”.',
  'help.guide.bucket-place.result':
    'Địa điểm nằm ở đầu danh sách nhóm của bạn cùng ngày dự kiến; dấu × bên cạnh sẽ xóa nó đi.',
  'help.guide.bucket-place.tip.1':
    'Một mong muốn có tọa độ là thứ Dawarich có thể đánh dấu hoàn thành cho bạn sau này, khi bản ghi của bạn cho thấy bạn đã ở đó.',
  // stats
  'help.guide.stats.title': 'Đọc thống kê của bạn',
  'help.guide.stats.goal': 'Biết các con số trong bảng đếm gì, và không đếm gì.',
  'help.guide.stats.step.1':
    'Quốc gia là số quốc gia khác nhau bạn đã thực sự đến; những nước đã lên kế hoạch hiện bên cạnh, không nằm trong đó. Chuyến đi, Địa điểm và Ngày là tổng trên tất cả chuyến đi của bạn. Thành phố được suy ra từ địa chỉ của các địa điểm, nên chỉ là ước tính.',
  'help.guide.stats.step.2':
    'Các châu lục hiện số quốc gia đã ghé thăm theo từng châu; Nam Cực sẽ vào hàng khi bạn đã đến đó. Rồi tới chuỗi liên tiếp của bạn, số năm liên tiếp có ít nhất một chuyến đi, và số chuyến đi bạn đã thực hiện trong năm nay.',
  'help.guide.stats.result':
    'Các con số đi theo chuyến đi của bạn khi bạn lên kế hoạch; ở đây không có gì cần bảo trì.',
  'help.guide.stats.tip.1':
    'Thành phố được đọc từ văn bản địa chỉ, không tra cứu, nên một địa chỉ ngắn như “Osteria Francescana, Italy” hoặc một địa chỉ kết thúc bằng tên tỉnh có thể cho ra một khu vực thay vì thành phố.',
  'help.guide.stats.tip.2':
    'Quốc gia bạn đánh dấu thủ công được tính vào Quốc gia và các châu lục, nhưng không mang theo chuyến đi, địa điểm hay ngày.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Thêm quốc gia từ các bản ghi của bạn',
  'help.guide.dawarich-countries.goal':
    'Để Dawarich cho biết bạn đã ở những quốc gia nào trong năm qua, và đưa những nước bạn xác nhận lên bản đồ.',
  'help.guide.dawarich-countries.step.1':
    'Khi tiện ích Dawarich đã kết nối, một bảng Dawarich nằm ở dưới cùng bản đồ, bên trái phần thống kê, với hai ô. Nhấp “Quốc gia”.',
  'help.guide.dawarich-countries.step.2':
    'Hộp thoại mở ra ở tab “Quốc gia” của nó. Nhấp “Tìm quốc gia”: TREK đọc các quốc gia và thành phố mà bản ghi của bạn bao phủ trong 12 tháng gần nhất, từng tháng một, nên hãy chờ một chút. Mỗi quốc gia mà Atlas của bạn chưa có được liệt kê với lá cờ, số thành phố và tên thành phố đầu tiên trong số đó, và được đánh dấu sẵn; nhấp vào một hàng để bỏ nó ra.',
  'help.guide.dawarich-countries.step.3':
    'Xác nhận bằng nút ở dưới cùng bên phải, nút này ghi “Thêm 5 quốc gia” khi năm hàng đang được đánh dấu. Hộp thoại cho biết bao nhiêu nước đã được thêm; đóng nó lại và bản đồ đã tự đọc lại.',
  'help.guide.dawarich-countries.result':
    'Các quốc gia đã xác nhận mang một màu trên bản đồ và được tính vào “Quốc gia”, được ghi là đến từ Dawarich. Những gì bạn đánh dấu bằng tay không bị đụng tới.',
  'help.guide.dawarich-countries.tip.1':
    'Những quốc gia mà Atlas đã hiện là đã ghé thăm, dù bằng tay, từ một chuyến đi hay từ một lần kiểm tra trước, đều được bỏ qua, nên các đánh dấu của riêng bạn không bao giờ bị gắn nhãn lại. Một quốc gia bạn đã gỡ khỏi Atlas trước đây sẽ trở lại khi bạn xác nhận nó ở đây.',
  'help.guide.dawarich-countries.tip.2':
    'Một tên quốc gia mà TREK không khớp được sẽ được liệt kê bên dưới các hàng thay vì bị bỏ đi, và “Kiểm tra lại” hỏi Dawarich thêm một lần nữa. Ghi chú dưới danh sách nói rằng đã xem 12 tháng gần nhất; khoảng thời gian đó là cố định.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Đánh dấu hoàn thành điều ước từ các bản ghi của bạn',
  'help.guide.dawarich-wishes.goal':
    'Tìm ra những nơi trong danh sách nhóm mà bạn đã thực sự đến, và đánh dấu hoàn thành chúng vào đúng ngày điều đó xảy ra.',
  'help.guide.dawarich-wishes.step.1':
    'Trong bảng Dawarich ở dưới cùng bản đồ, bên trái phần thống kê, nhấp “Danh sách điều ước”.',
  'help.guide.dawarich-wishes.step.2':
    'Hộp thoại mở ra ở tab “Danh sách điều ước” của nó. Nhấp “Kiểm tra danh sách mong muốn”: TREK dò qua các bản ghi của bạn cho mọi mục có tọa độ. Một điều ước bạn đã đến được liệt kê với khoảng cách bạn đã tới gần, thời gian bạn đã ở lại và ngày hôm đó, và được đánh dấu sẵn; mục đã đánh dấu hoàn thành từ trước ghi “Đã đánh dấu hoàn thành”. Dưới danh sách, một ghi chú đếm các mục không có tọa độ, và quy tắc cũng đứng ở đó: “Một điều ước được tính là đã đến khi trong vòng 250 m và sau 20 phút tại chỗ.”',
  'help.guide.dawarich-wishes.step.3':
    'Xác nhận bằng nút ở dưới cùng bên phải, nút này ghi “Đánh dấu 2 mục” khi hai hàng đang được đánh dấu. Rồi đóng hộp thoại và mở tab “Danh sách nhóm” của bảng bên cạnh.',
  'help.guide.dawarich-wishes.result':
    'Mỗi điều ước mang một dấu tích xanh lá với ngày của lần lưu lại, không phải ngày hôm nay; chú giải của nó ghi “Được đánh dấu từ các bản ghi Dawarich của bạn”, và một cú nhấp vào ngày sẽ hoàn tác.',
  'help.guide.dawarich-wishes.tip.1':
    'Đi ngang qua không được tính: quy tắc cần cả khoảng cách gần lẫn thời gian, và trong nhiều lần lưu lại đủ điều kiện thì lần dài nhất thắng. Một điều ước không có tọa độ không thể kiểm tra được, nên hãy thêm địa điểm qua ô tìm kiếm trong “Thêm địa điểm” thay vì chỉ bằng tên.',
  'help.guide.dawarich-wishes.tip.2':
    'Một lần kiểm tra xem tối đa 50 mục, ưu tiên những mục chưa đánh dấu hoàn thành, và sẽ nói rõ khi còn nhiều hơn. Một điều ước đã được đánh dấu hoàn thành từ trước giữ nguyên ngày của riêng nó.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Bộ sưu tập',
  'help.ctx.collections.summary':
    'Collections là thư viện địa điểm của bạn nằm ngoài mọi chuyến đi: những danh sách có tên gồm các địa điểm bạn đã tìm thấy và muốn giữ lại, mỗi địa điểm có trạng thái “Ý tưởng”, “Muốn đến” hoặc “Đã đến”. Địa điểm được sao chép vào và ra khỏi chuyến đi, không bao giờ liên kết, nên danh sách và chuyến đi không bao giờ làm thay đổi nhau.',
  'help.ctx.collections.bullet.1':
    'Thanh danh sách bên trái: danh sách của riêng bạn, những danh sách được chia sẻ với bạn, lời mời đang chờ bạn đồng ý, “Tất cả đã lưu” là hợp của mọi thứ bạn sở hữu, cùng “Danh sách mới” và nhập từ tệp ở trên cùng.',
  'help.ctx.collections.bullet.2':
    'Phần đầu của danh sách đang mở: màu, ảnh bìa, mô tả và liên kết, các thành viên, cùng các thao tác “Chỉnh sửa”, “Xuất” và “Chia sẻ” ở bên phải.',
  'help.ctx.collections.bullet.3':
    'Hàng bộ lọc phía trên các địa điểm: trạng thái, danh mục, đánh giá và sắp xếp, bộ lọc nhãn, nút + để thêm địa điểm, nhập từ chuyến đi, và “Chọn” cho các thao tác hàng loạt.',
  'help.ctx.collections.bullet.4':
    'Các hàng địa điểm: ảnh đại diện, tên và địa chỉ, nhãn và danh mục, cùng viên trạng thái ở bên phải đổi vòng chỉ với một cú nhấp.',
  'help.ctx.collections.bullet.5':
    'Bản đồ bên phải: một ghim cho mỗi địa điểm có tọa độ, nút chuyển giữa danh sách và bản đồ, ô tìm kiếm và bộ lọc nhãn. Nhấp vào ghim sẽ mở địa điểm đó.',
  'help.ctx.collections.bullet.6':
    'Bảng chi tiết: nhấp vào một hàng để xem ảnh bìa, danh mục, nhãn, trạng thái, mô tả và liên kết, cùng “Chỉnh sửa”, “Sao chép vào chuyến đi” và “Xóa khỏi danh sách”.',
  // create-list
  'help.guide.create-list.title': 'Tạo một danh sách',
  'help.guide.create-list.goal': 'Bắt đầu một danh sách mới có tên, với màu và ảnh bìa, sẵn sàng nhận địa điểm.',
  'help.guide.create-list.step.1': 'Nhấp vào “Danh sách mới” ở đầu thanh danh sách.',
  'help.guide.create-list.step.2':
    'Đặt tên cho danh sách và chọn một màu. Ảnh bìa, mô tả và liên kết là tùy chọn; bạn có thể thêm sau bằng “Chỉnh sửa”.',
  'help.guide.create-list.step.3': 'Nhấp vào “Tạo”.',
  'help.guide.create-list.result':
    'Danh sách mở ra trống, với “Thêm địa điểm” và “Nhập từ một chuyến đi” là hai cách để lấp đầy nó.',
  'help.guide.create-list.tip.1':
    'Ảnh bìa có thể là ảnh bạn tự tải lên hoặc một bức ảnh tìm được qua tìm kiếm Unsplash trong cùng hộp thoại.',
  // add-place
  'help.guide.add-place.title': 'Thêm một địa điểm',
  'help.guide.add-place.goal':
    'Tìm một địa điểm và lưu vào danh sách đang mở cùng tên, danh mục, trạng thái và ghi chú trong một lần.',
  'help.guide.add-place.step.1': 'Nhấp vào dấu + ở hàng bộ lọc phía trên các địa điểm.',
  'help.guide.add-place.step.2':
    'Gõ địa điểm vào ô tìm kiếm và chọn một kết quả. Tên, địa chỉ và tọa độ được điền từ đó.',
  'help.guide.add-place.step.3':
    'Đặt trạng thái và, nếu muốn, một danh mục, mô tả và liên kết, rồi nhấp vào “Thêm”. Hộp thoại vẫn mở cho địa điểm tiếp theo; “Hủy” sẽ đóng nó.',
  'help.guide.add-place.result': 'Địa điểm xuất hiện trong danh sách và, khi có tọa độ, cả dưới dạng ghim trên bản đồ.',
  'help.guide.add-place.tip.1':
    'Từ bên trong một chuyến đi, “Lưu vào Bộ sưu tập” trong trình xem địa điểm hoặc menu địa điểm sẽ đưa một địa điểm của chuyến đi vào danh sách mà không cần rời chuyến đi.',
  'help.guide.add-place.tip.2':
    'Danh sách phải là của bạn hoặc là nơi bạn là người sửa hay quản trị; dấu + không có trên “Tất cả đã lưu” hay trên danh sách bạn chỉ được xem.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Nhập địa điểm từ một chuyến đi',
  'help.guide.import-from-trip.goal':
    'Đưa toàn bộ địa điểm của một chuyến đi vào danh sách cùng lúc thay vì lưu từng cái một.',
  'help.guide.import-from-trip.step.1':
    'Nhấp vào nút nhập có mũi tên đám mây ở hàng bộ lọc. Trên danh sách trống, thao tác này nằm cạnh “Thêm địa điểm”.',
  'help.guide.import-from-trip.step.2': 'Chọn một trong các chuyến đi của bạn.',
  'help.guide.import-from-trip.step.3':
    'Đánh dấu các địa điểm bạn muốn. Địa điểm đã có trong danh sách bị làm mờ; những địa điểm không thuộc ngày nào của chuyến đi được chọn sẵn. “Chỉ cái mới” ẩn những gì bạn đã có.',
  'help.guide.import-from-trip.step.4': 'Nhấp vào “Nhập”. Nút luôn cho biết bao nhiêu địa điểm sắp được thêm.',
  'help.guide.import-from-trip.result':
    'Các địa điểm được sao chép vào danh sách với tên, địa chỉ, tọa độ, mô tả và danh mục của chúng. Chuyến đi vẫn nguyên như cũ.',
  'help.guide.import-from-trip.tip.1':
    'Các mục trùng theo tên hoặc tọa độ được tự động bỏ qua, nên nhập hai lần cũng không sao.',
  'help.guide.import-from-trip.tip.2':
    'Bên trong danh sách địa điểm của một chuyến đi, chế độ chọn thay vào đó cung cấp “Lưu vào Bộ sưu tập” cho một nhóm địa điểm do bạn tự chọn.',
  // place-status
  'help.guide.place-status.title': 'Đặt trạng thái cho một địa điểm',
  'help.guide.place-status.goal': 'Theo dõi đâu là ý tưởng, đâu là danh sách rút gọn và bạn đã đến những đâu.',
  'help.guide.place-status.step.1':
    'Nhấp vào viên trạng thái ở đầu bên phải của hàng địa điểm. “Ý tưởng” trở thành “Muốn đến”.',
  'help.guide.place-status.step.2': 'Nhấp lần nữa để thành “Đã đến”, và thêm lần nữa để quay lại “Ý tưởng”.',
  'help.guide.place-status.result':
    'Viên trạng thái và màu của nó đổi ngay; bộ lọc trạng thái phía trên danh sách cũng đếm theo.',
  'help.guide.place-status.tip.1':
    'Trạng thái là chuyện riêng của Collections: sao chép một địa điểm vào chuyến đi không mang nó theo.',
  'help.guide.place-status.tip.2':
    'Từ một chuyến đi, “Lưu vào Bộ sưu tập” hiện một viên trạng thái cho mỗi danh sách chứa địa điểm đó, và bảng địa điểm có thao tác “Đánh dấu đã đến” cho một nhóm đã chọn.',
  // place-detail
  'help.guide.place-detail.title': 'Mở một địa điểm đã lưu',
  'help.guide.place-detail.goal':
    'Xem mọi thứ về một địa điểm và thao tác với nó: chỉnh sửa, sao chép vào chuyến đi, xóa bỏ.',
  'help.guide.place-detail.step.1':
    'Nhấp vào một hàng địa điểm. Bảng chi tiết mở ra cạnh danh sách và bản đồ trượt tới địa điểm đó.',
  'help.guide.place-detail.step.2':
    'Ở dưới cùng có “Chỉnh sửa”, “Sao chép vào chuyến đi” và “Xóa khỏi danh sách”; biểu tượng máy ảnh trên ảnh bìa đổi ảnh tự động sang ảnh của riêng bạn.',
  'help.guide.place-detail.result':
    '“Chỉnh sửa” mở khóa tên, danh mục, nhãn, địa chỉ, tọa độ, mô tả và liên kết ngay trong bảng.',
  'help.guide.place-detail.tip.1':
    'Ảnh bìa được lấy tự động khi địa điểm không có ảnh riêng. Ảnh bạn tải lên có thể là JPG, PNG, GIF hoặc WebP, tối đa 20 MB.',
  'help.guide.place-detail.tip.2':
    'Thành viên của danh sách được chia sẻ cũng có thể để lại đánh giá sao ở đây, và bộ lọc đánh giá ở hàng bộ lọc dùng điểm trung bình.',
  // labels
  'help.guide.labels.title': 'Nhóm địa điểm bằng nhãn',
  'help.guide.labels.goal':
    'Cho danh sách những nhãn riêng của nó, chẳng hạn quận hay ngày, ngoài các danh mục dùng chung.',
  'help.guide.labels.step.1': 'Mở trình quản lý nhãn từ nút nhãn ở hàng bộ lọc.',
  'help.guide.labels.step.2':
    'Gõ một tên, chọn một màu và nhấp vào “Thêm nhãn”. Đổi tên, đổi màu hoặc xóa các nhãn hiện có trong cùng hộp thoại.',
  'help.guide.labels.step.3':
    'Bật “Chọn”, đánh dấu các địa điểm và nhấp vào “Gán nhãn” trên thanh chọn. Một địa điểm đơn lẻ cũng nhận nhãn qua “Chỉnh sửa” trên bảng chi tiết của nó.',
  'help.guide.labels.step.4':
    'Chọn một hoặc nhiều nhãn ở hàng bộ lọc để thu hẹp danh sách và bản đồ về những địa điểm mang bất kỳ nhãn nào trong số đó.',
  'help.guide.labels.result':
    'Địa điểm có nhãn hiện nhãn của nó trên hàng; bộ lọc nhãn có sẵn cho mọi thành viên, kể cả người xem.',
  'help.guide.labels.tip.1':
    'Nhãn thuộc về duy nhất danh sách nơi nó được tạo. Chuyển một địa điểm sang danh sách khác sẽ bỏ các nhãn đó.',
  'help.guide.labels.tip.2': 'Quản lý và gán nhãn cần quyền chỉnh sửa trên danh sách.',
  // filter-select
  'help.guide.filter-select.title': 'Lọc và chọn địa điểm',
  'help.guide.filter-select.goal': 'Thu hẹp danh sách và thao tác với nhiều địa điểm cùng lúc.',
  'help.guide.filter-select.step.1':
    'Dùng các menu thả xuống ở hàng bộ lọc: trạng thái, danh mục, đánh giá tối thiểu và thứ tự sắp xếp. Mỗi cái cho biết sẽ còn lại bao nhiêu địa điểm.',
  'help.guide.filter-select.step.2': 'Nhấp vào “Chọn”. Mỗi hàng có một ô đánh dấu và thanh chọn xuất hiện.',
  'help.guide.filter-select.step.3':
    'Đánh dấu địa điểm hoặc dùng “Chọn tất cả” cho mọi thứ đang được lọc, rồi chọn “Gán nhãn”, “Chuyển vào danh sách”, “Sao chép vào danh sách”, “Sao chép vào chuyến đi” hoặc “Xóa bỏ”.',
  'help.guide.filter-select.result':
    'Các thao tác áp dụng cho toàn bộ lựa chọn cùng lúc. Dấu × ở bên phải thoát chế độ chọn.',
  'help.guide.filter-select.tip.1':
    '“Chọn tất cả” đi theo bộ lọc, nên lọc theo “Muốn đến” rồi chọn tất cả là cách nhanh để xử lý danh sách rút gọn.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Sao chép địa điểm vào một chuyến đi',
  'help.guide.copy-to-trip.goal': 'Biến các địa điểm đã lưu thành điểm dừng trong một chuyến đi của bạn.',
  'help.guide.copy-to-trip.step.1':
    'Bật “Chọn” và đánh dấu các địa điểm, hoặc mở một địa điểm và dùng “Sao chép vào chuyến đi” trên bảng chi tiết của nó.',
  'help.guide.copy-to-trip.step.2': 'Nhấp vào “Sao chép vào chuyến đi” trên thanh chọn.',
  'help.guide.copy-to-trip.step.3': 'Chọn chuyến đi. Ô tìm kiếm giúp thu hẹp một danh sách dài.',
  'help.guide.copy-to-trip.result':
    'Các địa điểm vào danh sách địa điểm của chuyến đi đó với tên, mô tả, danh mục, ghi chú, giá, tọa độ, ảnh và thẻ. Không có gì thay đổi trong bộ sưu tập.',
  'help.guide.copy-to-trip.tip.1':
    'Người xem của danh sách được chia sẻ cũng làm được việc này; nó sao chép ra khỏi danh sách chứ không thay đổi danh sách.',
  // share-list
  'help.guide.share-list.title': 'Chia sẻ danh sách với ai đó',
  'help.guide.share-list.goal':
    'Cùng lên kế hoạch một danh sách với những người khác trên TREK này, theo thời gian thực.',
  'help.guide.share-list.step.1': 'Nhấp vào “Chia sẻ” ở phần đầu danh sách của bạn.',
  'help.guide.share-list.step.2': 'Chọn người dùng và một vai trò: “Người xem”, “Người sửa” hoặc “Quản trị”.',
  'help.guide.share-list.step.3':
    'Nhấp vào “Gửi lời mời”. Người đó hiện là “lời mời đang chờ” cho đến khi họ chấp nhận lời mời trong thanh danh sách của mình.',
  'help.guide.share-list.result':
    'Sau khi chấp nhận, danh sách xuất hiện dưới mục “Được chia sẻ” của họ và mọi thay đổi được đồng bộ trực tiếp. Thành viên và vai trò của họ vẫn sửa được trong cùng hộp thoại.',
  'help.guide.share-list.tip.1':
    'Người xem có thể xem, đánh giá và sao chép địa điểm vào chuyến đi của riêng họ. Người sửa thêm và sửa địa điểm cùng nhãn. Quản trị còn có thể xóa.',
  'help.guide.share-list.tip.2':
    'Chỉ chủ sở hữu mới mời và gỡ người; một thành viên có thể tự rời khỏi danh sách được chia sẻ.',
  // export-list
  'help.guide.export-list.title': 'Xuất danh sách ra tệp',
  'help.guide.export-list.goal': 'Trao danh sách cho ai đó trên một TREK khác, hoặc mang nó vào ứng dụng bản đồ.',
  'help.guide.export-list.step.1': 'Nhấp vào “Xuất” ở phần đầu danh sách.',
  'help.guide.export-list.step.2':
    'Chọn “Danh sách TREK” cho một TREK khác, kèm nhãn và trạng thái, hoặc GPX cho OsmAnd, Organic Maps, thiết bị Garmin và các ứng dụng khác đọc được waypoint.',
  'help.guide.export-list.result':
    'Tệp được tải xuống. Bất kỳ thành viên nào của danh sách được chia sẻ đều có thể xuất nó.',
  'help.guide.export-list.tip.1':
    'Địa điểm không có tọa độ không thể thành waypoint GPX; nó bị bỏ ra và TREK cho bạn biết có bao nhiêu địa điểm như vậy.',
  'help.guide.export-list.tip.2':
    'Đánh giá, thành viên và ảnh đã tải lên được cố ý giữ lại; chúng thuộc về TREK này, không thuộc về danh sách.',
  // import-file
  'help.guide.import-file.title': 'Nhập danh sách từ tệp',
  'help.guide.import-file.goal':
    'Đưa vào một tệp danh sách TREK hoặc tệp GPX, dưới dạng danh sách mới hoặc vào một danh sách bạn đang có.',
  'help.guide.import-file.step.1': 'Nhấp vào nút nhập có mũi tên tải lên cạnh “Danh sách mới” trong thanh danh sách.',
  'help.guide.import-file.step.2':
    'Chọn tệp. TREK cho thấy bên trong có gì trước khi bất cứ điều gì xảy ra: tên, bao nhiêu địa điểm và nhãn.',
  'help.guide.import-file.step.3':
    'Giữ “Danh sách mới” và đổi tên nếu muốn, hoặc chọn “Thêm vào một danh sách” để đưa địa điểm vào một danh sách bạn có thể sửa, rồi nhấp vào “Nhập”.',
  'help.guide.import-file.result':
    'Bạn được đưa tới danh sách với các địa điểm đã nhập. Thêm vào danh sách chỉ thêm mà thôi; địa điểm đã có sẵn giữ nguyên trạng thái, ghi chú và nhãn.',
  'help.guide.import-file.tip.1':
    'Từ GPX, mỗi waypoint có tên trở thành một địa điểm; track là các đường và bị bỏ ra, và bản xem trước cho biết đó là bao nhiêu điểm.',
  'help.guide.import-file.tip.2':
    'Tệp không phải danh sách TREK cũng không phải GPX bị từ chối kèm lý do; một địa điểm không đọc được thì chỉ bị bỏ qua, không phải cả tệp.',
  // edit-list
  'help.guide.edit-list.title': 'Chỉnh sửa hoặc xóa một danh sách',
  'help.guide.edit-list.goal': 'Đổi tên, màu, ảnh bìa, mô tả hoặc liên kết của danh sách, hoặc gỡ bỏ danh sách.',
  'help.guide.edit-list.step.1': 'Nhấp vào “Chỉnh sửa” ở phần đầu danh sách. Chỉ chủ sở hữu mới thấy nó.',
  'help.guide.edit-list.step.2':
    'Đổi những gì bạn muốn và nhấp vào “Lưu”. “Xóa danh sách” ở góc dưới bên trái gỡ bỏ danh sách cùng toàn bộ địa điểm của nó, sau một bước xác nhận.',
  'help.guide.edit-list.result': 'Phần đầu nhận ngay màu, ảnh bìa và mô tả mới.',
  'help.guide.edit-list.tip.1': 'Xóa danh sách không thể hoàn tác. Hãy xuất nó trước nếu bạn muốn giữ một bản sao.',
  // all-saved
  'help.guide.all-saved.title': 'Tìm kiếm trong toàn bộ thư viện của bạn',
  'help.guide.all-saved.goal': 'Nhìn qua mọi danh sách bạn sở hữu cùng một lúc.',
  'help.guide.all-saved.step.1':
    'Nhấp vào “Tất cả đã lưu” trong thanh danh sách. Nó gộp địa điểm của mọi danh sách bạn sở hữu hoặc đồng sở hữu.',
  'help.guide.all-saved.step.2':
    'Dùng ô tìm kiếm và các bộ lọc như trên bất kỳ danh sách nào; “Chọn” cũng hoạt động ở đây để sao chép vào chuyến đi.',
  'help.guide.all-saved.result':
    'Một góc nhìn duy nhất trên toàn bộ địa điểm đã lưu của bạn, không có thêm hay nhập, vì không có danh sách cụ thể nào để đặt chúng vào.',
  'help.guide.all-saved.tip.1': 'Nhãn là theo từng danh sách, nên bộ lọc nhãn không có trên “Tất cả đã lưu”.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Hành trình',
  'help.ctx.journey.summary':
    'Hành trình là nhật ký du lịch lấy ảnh làm trung tâm của bạn. Mỗi hành trình gắn với một hoặc nhiều chuyến đi và lớn dần từng ngày từ các mục có câu chuyện, ảnh, tâm trạng và thời tiết. Màn hình này liệt kê các hành trình của bạn; mở một hành trình để viết.',
  'help.ctx.journey.bullet.1':
    'Biểu ngữ ở trên cùng hiện hành trình đang diễn ra, hoặc hành trình mới nhất của bạn, kèm số mục, ảnh và địa điểm. “Tiếp tục viết” mở nó ở ngày hôm nay.',
  'help.ctx.journey.bullet.2':
    'Bên dưới, mỗi hành trình một thẻ với ảnh bìa, phụ đề, ngày tháng và các con số. Nhấp vào một thẻ để mở.',
  'help.ctx.journey.bullet.3':
    'Thẻ cuối cùng trong lưới, “Tạo một hành trình mới”, bắt đầu một hành trình từ các chuyến đi của bạn.',
  // create-journey
  'help.guide.create-journey.title': 'Tạo một hành trình',
  'help.guide.create-journey.goal':
    'Bắt đầu một nhật ký cho một chuyến đi, với các địa điểm của chuyến đi đã chờ sẵn dưới dạng gợi ý.',
  'help.guide.create-journey.step.1': 'Nhấp vào “Tạo một hành trình mới”, thẻ cuối cùng trong lưới.',
  'help.guide.create-journey.step.2':
    'Đặt tên và, nếu muốn, một phụ đề, rồi đánh dấu các chuyến đi mà nó thuộc về. Bộ đếm cho biết bao nhiêu địa điểm sẽ được đưa vào.',
  'help.guide.create-journey.step.3': 'Nhấp vào “Tạo hành trình”.',
  'help.guide.create-journey.result':
    'Nhật ký mở ra. Mọi địa điểm của các chuyến đi đã liên kết nằm trong dòng thời gian dưới dạng gợi ý, mỗi ngày nó thuộc về một gợi ý, sẵn sàng để bạn viết vào.',
  'help.guide.create-journey.tip.1': 'Có thể liên kết thêm chuyến đi sau này từ “Cài đặt hành trình”.',
  'help.guide.create-journey.tip.2': 'Hành trình không có chuyến đi cũng dùng được; khi đó bạn tự thêm các mục.',
  // open-journey
  'help.guide.open-journey.title': 'Mở một hành trình',
  'help.guide.open-journey.goal': 'Vào một nhật ký, và biết nó mở ở đâu.',
  'help.guide.open-journey.step.1':
    'Nhấp vào một thẻ. Mỗi thẻ hiện ảnh bìa, ngày tháng và hành trình có bao nhiêu mục, ảnh và địa điểm.',
  'help.guide.open-journey.result':
    'Hành trình đang diễn ra mở ở ngày hôm nay, hoặc ở mục cuối cùng trước hôm nay khi chưa có gì được viết; hành trình đã kết thúc mở ở đầu.',
  'help.guide.open-journey.tip.1':
    'Ảnh bìa là ảnh đầu tiên của hành trình trừ khi bạn đặt một ảnh trong “Cài đặt hành trình”.',
  // continue-writing
  'help.guide.continue-writing.title': 'Tiếp tục hành trình đang diễn ra',
  'help.guide.continue-writing.goal': 'Vào thẳng trang hôm nay của hành trình bạn đang đi.',
  'help.guide.continue-writing.step.1':
    'Nhấp vào “Tiếp tục viết” trong biểu ngữ ở trên cùng. Nó hiện hành trình đang diễn ra, hoặc hành trình mới nhất khi không có hành trình nào đang diễn ra.',
  'help.guide.continue-writing.result':
    'Nhật ký mở ở ngày hôm nay, hoặc ở mục cuối cùng trước hôm nay khi chưa có gì được viết.',
  'help.guide.continue-writing.tip.1':
    'Biểu ngữ cũng đưa ra gợi ý cho một chuyến đi chưa có hành trình; “Miễn nhiệm” ẩn gợi ý đó đi.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Nhật ký',
  'help.ctx.journey-detail.summary':
    'Một hành trình đang mở: dòng thời gian ở bên trái, từng ngày một, và bản đồ ở bên phải với mọi mục và các địa điểm của những chuyến đi đã liên kết. Mọi thứ thêm vào nhật ký nằm ở trên cùng; phần đầu trang giữ các con số, “Studio”, công tắc gợi ý và “Cài đặt hành trình”.',
  'help.ctx.journey-detail.bullet.1':
    'Đầu trang: ảnh bìa, tiêu đề và phụ đề, số ngày, địa điểm, mục và ảnh, và ở bên phải là “Studio”, công tắc gợi ý và “Cài đặt hành trình”.',
  'help.ctx.journey-detail.bullet.2':
    'Thanh công cụ: các tab “Dòng thời gian” và “Phòng trưng bày”, “Tìm trong hành trình này”, và “Thêm mục nhập”.',
  'help.ctx.journey-detail.bullet.3':
    'Dòng thời gian: mỗi ngày một phần với dấu + để thêm mục vào ngày đó; các thẻ mục với ảnh, tâm trạng, thời tiết và câu chuyện; các gợi ý từ chuyến đi ở kiểu nhạt hơn với “Bỏ qua gợi ý này”.',
  'help.ctx.journey-detail.bullet.4':
    'Bản đồ: các mục là ghim, nối theo thứ tự ngày bằng một đường nét đứt, các địa điểm của chuyến đi, mọi tuyến GPX đã nhập vào những chuyến đi đó, và ảnh có gắn vị trí của các mục.',
  'help.ctx.journey-detail.bullet.5':
    '“Cài đặt hành trình”: ảnh bìa, tên và phụ đề, trạng thái, tuyến trên bản đồ, các trường của mục, gợi ý đã bỏ qua, chuyến đi đã liên kết, cộng tác viên, chia sẻ công khai, lưu trữ và xóa.',
  'help.ctx.journey-detail.bullet.6':
    'Hai nút tròn nổi trên một dòng thời gian dài: lên đầu trang, và nhảy đến mục cuối cùng.',
  // add-entry
  'help.guide.add-entry.title': 'Viết một mục',
  'help.guide.add-entry.goal': 'Thêm câu chuyện của một ngày với tiêu đề, nội dung, tâm trạng và thời tiết.',
  'help.guide.add-entry.step.1':
    'Nhấp vào “Thêm mục nhập” trên thanh công cụ, hoặc dấu + ở đầu một ngày để bắt đầu ở ngày đó.',
  'help.guide.add-entry.step.2':
    'Đặt tên cho khoảnh khắc và viết câu chuyện. Thanh công cụ phía trên văn bản thêm chữ đậm, chữ nghiêng, tiêu đề, trích dẫn, liên kết và danh sách bằng Markdown.',
  'help.guide.add-entry.step.3':
    'Chọn tâm trạng và thời tiết, kiểm tra ngày, và ghim một vị trí nếu muốn: tìm một địa điểm hoặc dùng vị trí hiện tại của bạn.',
  'help.guide.add-entry.step.4': 'Nhấp vào “Lưu”.',
  'help.guide.add-entry.result':
    'Mục xuất hiện ở ngày của nó trong dòng thời gian và là một ghim trên bản đồ. Các con số của nó được cập nhật ở đầu trang.',
  'help.guide.add-entry.tip.1': 'Viết vào một gợi ý cũng là trình soạn thảo đó, với địa điểm đã được đặt sẵn.',
  'help.guide.add-entry.tip.2':
    'Thẻ ở dưới cùng là văn bản tự do, “hidden gem” hay “best meal”, và tìm kiếm sẽ tìm thấy chúng.',
  // entry-photos
  'help.guide.entry-photos.title': 'Thêm ảnh và video vào một mục',
  'help.guide.entry-photos.goal': 'Đặt ảnh lên một ngày; ảnh đầu tiên trở thành ảnh bìa của mục.',
  'help.guide.entry-photos.step.1': 'Mở menu của mục bằng dấu ⋯ trên thẻ của nó và chọn “Chỉnh sửa”.',
  'help.guide.entry-photos.step.2':
    'Nhấp vào “Tải ảnh lên” và chọn tệp. “Từ thư viện” lấy ảnh đã có trong thư viện của hành trình; “External photos” tìm trong thư viện Immich hoặc Synology đã kết nối cho ngày đó.',
  'help.guide.entry-photos.step.3': 'Di chuột lên một ảnh để thấy “làm số 1” và chọn ảnh bìa, rồi nhấp vào “Lưu”.',
  'help.guide.entry-photos.result': 'Ảnh hiện trên thẻ và trong thư viện; ảnh đầu tiên là ảnh thu nhỏ ở mọi nơi.',
  'help.guide.entry-photos.tip.1':
    'Video vào một mục theo cùng cách: mp4, m4v, webm hoặc mov tối đa 500 MB, được lưu nguyên như khi tải lên.',
  'help.guide.entry-photos.tip.2':
    'Tệp HEIC từ iPhone được chuyển sang JPEG khi tải lên, điều này làm mất siêu dữ liệu GPS và máy ảnh của chúng.',
  // suggestions
  'help.guide.suggestions.title': 'Dùng hoặc bỏ qua các gợi ý',
  'help.guide.suggestions.goal': 'Biến các địa điểm của chuyến đi thành mục, và dọn đi những gợi ý bạn sẽ không viết.',
  'help.guide.suggestions.step.1':
    'Gợi ý là một thẻ nhạt hơn với tên địa điểm in nghiêng. Nhấp vào nó để mở trình soạn thảo với địa điểm và ngày đã được đặt sẵn.',
  'help.guide.suggestions.step.2':
    'Nhấp vào “Bỏ qua gợi ý này” trên thẻ bạn sẽ không dùng. Nó rời khỏi dòng thời gian mà không bị xóa, và đồng bộ chuyến đi sẽ không đưa nó ra lần nữa.',
  'help.guide.suggestions.step.3':
    'Đổi ý? “Cài đặt hành trình” cho biết bao nhiêu gợi ý đã bị bỏ qua, và “Lấy lại các gợi ý đã bỏ qua” đưa tất cả trở lại.',
  'help.guide.suggestions.result':
    'Dòng thời gian chỉ giữ những gì bạn định viết; công tắc ở đầu trang ẩn mọi gợi ý cùng lúc trong khi bạn đọc.',
  'help.guide.suggestions.tip.1': 'Một địa điểm kéo dài qua hai ngày cho một gợi ý ở mỗi ngày.',
  'help.guide.suggestions.tip.2': 'Gợi ý không bao giờ được tính vào thống kê; chỉ các mục đã viết mới được tính.',
  // add-on-day
  'help.guide.add-on-day.title': 'Thêm một mục vào một ngày trước đó',
  'help.guide.add-on-day.goal': 'Viết về một ngày đã qua mà không phải sửa lại ngày sau đó.',
  'help.guide.add-on-day.step.1': 'Nhấp vào dấu + ở đầu ngày đó.',
  'help.guide.add-on-day.step.2': 'Trình soạn thảo mở ra với ngày đó đã được đặt. Viết và “Lưu” như thường lệ.',
  'help.guide.add-on-day.result': 'Mục nằm ngay vào đúng ngày.',
  'help.guide.add-on-day.tip.1': 'Trong một ngày, các mũi tên trong menu của mục chuyển nó lên sớm hơn hoặc muộn hơn.',
  // pros-cons
  'help.guide.pros-cons.title': 'Thêm một nhận xét',
  'help.guide.pros-cons.goal': 'Tóm tắt một ngày bằng điều gì tuyệt và điều gì không.',
  'help.guide.pros-cons.step.1':
    'Trong trình soạn thảo, tìm “Ưu và nhược điểm” dưới câu chuyện. Gõ một điểm vào “Ưu điểm” hoặc “Nhược điểm” và dùng “Thêm cái khác” cho điểm tiếp theo.',
  'help.guide.pros-cons.step.2': 'Lưu. Nhận xét hiện trên thẻ dưới dạng hai danh sách ngắn.',
  'help.guide.pros-cons.result': 'Thích và không thích thấy ngay trong nháy mắt, dưới câu chuyện.',
  'help.guide.pros-cons.tip.1':
    'Hành trình không dùng nhận xét có thể tắt phần này dưới “Các trường của mục” trong “Cài đặt hành trình”.',
  // search-journey
  'help.guide.search-journey.title': 'Tìm thứ gì đó trong một nhật ký dài',
  'help.guide.search-journey.goal': 'Đến đúng mục bạn muốn mà không phải cuộn qua hàng tuần.',
  'help.guide.search-journey.step.1':
    'Gõ vào “Tìm trong hành trình này” trên thanh công cụ. Dòng thời gian được lọc khi bạn gõ, trên tiêu đề, câu chuyện, địa điểm và thẻ. Dấu và chữ hoa chữ thường không quan trọng.',
  'help.guide.search-journey.step.2':
    'Công tắc gợi ý ở đầu trang ẩn các thẻ chưa viết trong khi bạn đọc. Khi dòng thời gian đã dài, hai nút tròn nổi phía trên cạnh dưới của nó: lên đầu trang, và nhảy đến mục cuối cùng.',
  'help.guide.search-journey.result': 'Chỉ các mục khớp còn lại; xóa trống ô để thấy lại mọi thứ.',
  'help.guide.search-journey.tip.1':
    'Hành trình đang diễn ra mở ở ngày hôm nay, nên trang hiện tại thường đã nằm trong tầm nhìn.',
  'help.guide.search-journey.tip.2': 'Thẻ cũng được tính: tìm “hidden gem” sẽ thấy mọi mục được gắn thẻ đó.',
  // gallery-map
  'help.guide.gallery-map.title': 'Duyệt thư viện ảnh và bản đồ',
  'help.guide.gallery-map.goal': 'Xem toàn bộ hành trình dưới dạng ảnh, và dưới dạng địa điểm trên bản đồ.',
  'help.guide.gallery-map.step.1':
    'Chuyển sang “Phòng trưng bày” trên thanh công cụ: mọi ảnh của mọi mục, cộng thêm ảnh tải thẳng lên thư viện. Nhấp vào một ảnh để mở hộp xem ảnh.',
  'help.guide.gallery-map.step.2':
    'Bản đồ ở bên phải hiện các mục là ghim theo thứ tự ngày, các địa điểm của những chuyến đi đã liên kết, và mọi tuyến GPX đã nhập vào những chuyến đi đó, với màu nó có trong trình lập kế hoạch.',
  'help.guide.gallery-map.result':
    'Di chuột lên một tuyến để thấy tên của nó. Đường nét đứt giữa các mục do TREK vẽ; tuyến là lộ trình bạn thực sự đã ghi lại.',
  'help.guide.gallery-map.tip.1': 'Có thể tắt tuyến cho một hành trình dưới “Cài đặt hành trình”.',
  'help.guide.gallery-map.tip.2':
    'Ảnh trong thư viện có vị trí cũng hiện trên bản đồ công khai, khi cả “Phòng trưng bày” và “Bản đồ” đều được chia sẻ.',
  // entry-fields
  'help.guide.entry-fields.title': 'Tắt các trường của mục',
  'help.guide.entry-fields.goal': 'Giữ trình soạn thảo chỉ với những gì hành trình này dùng.',
  'help.guide.entry-fields.step.1': 'Mở “Cài đặt hành trình” từ đầu trang.',
  'help.guide.entry-fields.step.2': 'Dưới “Các trường của mục”, tắt “Tâm trạng”, “Thời tiết” hoặc “Ưu và nhược”.',
  'help.guide.entry-fields.result':
    'Trình soạn thảo không còn hỏi chúng nữa. Không mất gì đã viết: bật lại một trường sẽ đưa các giá trị đã lưu trở lại tầm nhìn, và hành trình được chia sẻ ẩn đúng các trường đó.',
  'help.guide.entry-fields.tip.1':
    'Các công tắc là theo từng hành trình, nên một chuyến công tác và một kỳ nghỉ có thể khác nhau.',
  // link-trip
  'help.guide.link-trip.title': 'Liên kết một chuyến đi khác',
  'help.guide.link-trip.goal': 'Đưa các địa điểm của chuyến đi thứ hai vào nhật ký dưới dạng gợi ý.',
  'help.guide.link-trip.step.1': 'Mở “Cài đặt hành trình” từ đầu trang.',
  'help.guide.link-trip.step.2': 'Dưới các chuyến đi đã liên kết, nhấp vào “Thêm chuyến đi”.',
  'help.guide.link-trip.step.3': 'Chọn chuyến đi.',
  'help.guide.link-trip.result':
    'Các địa điểm của nó đến dòng thời gian dưới dạng gợi ý vào ngày của chúng, và các tuyến GPX của nó nhập vào bản đồ.',
  'help.guide.link-trip.tip.1': 'Dấu × cạnh một chuyến đi đã liên kết sẽ hủy liên kết nó; các mục bạn đã viết vẫn còn.',
  'help.guide.link-trip.tip.2': 'Các mục có ngày chỉ được tính một lần, dù bao nhiêu chuyến đi bao trùm ngày đó.',
  // share-public
  'help.guide.share-public.title': 'Chia sẻ hành trình công khai',
  'help.guide.share-public.goal': 'Cho những người không có tài khoản TREK một liên kết chỉ đọc.',
  'help.guide.share-public.step.1': 'Mở “Cài đặt hành trình” và tìm “Chia sẻ công khai”.',
  'help.guide.share-public.step.2': 'Nhấp vào “Tạo liên kết chia sẻ”.',
  'help.guide.share-public.step.3':
    'Chọn những gì khách xem thấy: “Dòng thời gian”, “Phòng trưng bày” và “Bản đồ” là các công tắc riêng. “Sao chép” đưa liên kết vào bảng nhớ tạm của bạn.',
  'help.guide.share-public.result':
    'Bất kỳ ai có liên kết đều thấy các phần đã bật và không gì khác; các trường bạn đã tắt trong “Các trường của mục” cũng bị ẩn ở đó.',
  'help.guide.share-public.tip.1':
    'Ảnh chỉ xuất hiện trên bản đồ công khai khi cả “Phòng trưng bày” và “Bản đồ” đều bật; khi “Bản đồ” tắt, tọa độ của chúng bị gỡ trước khi rời máy chủ.',
  'help.guide.share-public.tip.2': 'Xóa liên kết ở cùng chỗ đó để kết thúc chia sẻ.',
  // contributors
  'help.guide.contributors.title': 'Viết cùng nhau',
  'help.guide.contributors.goal': 'Cho một người bạn đồng hành thêm các mục và ảnh của riêng họ.',
  'help.guide.contributors.step.1': 'Mở “Cài đặt hành trình” và cuộn đến phần cộng tác viên.',
  'help.guide.contributors.step.2': 'Nhấp vào “Mời cộng tác viên” và tìm người dùng theo tên hoặc email.',
  'help.guide.contributors.step.3': 'Chọn một vai trò và xác nhận.',
  'help.guide.contributors.result':
    'Hành trình xuất hiện trong danh sách của họ và các mục của họ mang tên họ. Gỡ một cộng tác viên bằng dấu × cạnh họ.',
  'help.guide.contributors.tip.1':
    'Cộng tác viên dành cho những người trên TREK này. Với mọi người khác thì có liên kết công khai.',
  // studio
  'help.guide.studio.title': 'Dàn trang hành trình thành một sách ảnh',
  'help.guide.studio.goal': 'Biến nhật ký thành các trang in được.',
  'help.guide.studio.step.1': 'Nhấp vào “Studio” ở đầu trang. Trình thiết kế mở ra phía trên hành trình.',
  'help.guide.studio.step.2': 'Tên hành trình ở bên trái thanh trên cùng là đường quay lại; nó đưa bạn về đúng chỗ cũ.',
  'help.guide.studio.result':
    'Dải trang ở bên trái, trang đôi trên bàn làm việc, thuộc tính ở bên phải. “Auto layout” dựng cuốn sách từ các mục của bạn; “Export” tạo một PDF sẵn sàng để in.',
  'help.guide.studio.tip.1': 'Studio cần cửa sổ rộng ít nhất 1024 px và không được cung cấp trên điện thoại.',
  'help.guide.studio.tip.2':
    'Cuốn sách kế thừa quyền truy cập của hành trình: ai được đọc hành trình thì được mở nó, ai được chỉnh sửa thì được lưu.',
  // archive-journey
  'help.guide.archive-journey.title': 'Lưu trữ hoặc xóa một hành trình',
  'help.guide.archive-journey.goal': 'Đóng một hành trình đã kết thúc, hoặc xóa hẳn một hành trình.',
  'help.guide.archive-journey.step.1': 'Mở “Cài đặt hành trình”.',
  'help.guide.archive-journey.step.2':
    'Ở dưới cùng, “Hành trình lưu trữ” kết thúc nó và đánh dấu là đã lưu trữ; “Khôi phục hành trình” đưa nó trở lại. “Xóa bỏ” xóa nó cùng mọi mục và ảnh, sau một bước xác nhận.',
  'help.guide.archive-journey.result':
    'Hành trình đã lưu trữ vẫn đọc được và chia sẻ được; chỉ là nó không còn mở ở ngày hôm nay nữa.',
  'help.guide.archive-journey.tip.1':
    'Xóa không thể hoàn tác, và không đụng đến các chuyến đi mà hành trình đã liên kết.',
  'help.guide.archive-journey.tip.2': 'Ảnh bìa, tên và phụ đề nằm trong cùng hộp thoại, ở trên cùng.',
  'help.guide.journey-status.title': 'Đặt trạng thái của hành trình',
  'help.guide.journey-status.goal':
    'Tự đánh dấu một hành trình là “Bản nháp”, “Sống” hoặc “Hoàn thành” thay vì theo ngày của các chuyến đi trong đó.',
  'help.guide.journey-status.step.1': 'Mở “Cài đặt hành trình” ở phần đầu của hành trình.',
  'help.guide.journey-status.step.2':
    'Dưới “Trạng thái”, chọn “Bản nháp”, “Sống” hoặc “Hoàn thành”. Lựa chọn được lưu ngay.',
  'help.guide.journey-status.result':
    'Hành trình giữ trạng thái bạn đã chọn, và thẻ của nó trong danh sách hành trình hiển thị trạng thái đó.',
  'help.guide.journey-status.tip.1':
    '“Tự động” lại theo ngày của các chuyến đi đã liên kết. Không có chuyến đi liên kết, hành trình tự động vẫn là bản nháp.',
  'help.guide.journey-status.tip.2':
    'Trạng thái đặt thủ công được giữ cho đến khi bạn đổi nó, kể cả khi ngày của chuyến đi thay đổi.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio dàn trang một hành trình thành cuốn sách ảnh in được. Nó mở phía trên nhật ký: thanh trang và nội dung ở bên trái, trang đôi bạn đang làm ở giữa, thuộc tính của nó ở bên phải. Auto layout dựng bản nháp đầu tiên từ các mục của bạn; mọi thứ sau đó tùy bạn di chuyển, cắt và đổi kiểu, với hoàn tác cho từng bước.',
  'help.ctx.journey-studio.bullet.1':
    'Thanh trên cùng: Back to the journey, Book view, Undo và Redo, Page format, Auto layout và Export. Dấu “Đã lưu” cạnh tiêu đề cho bạn biết khi nào sách đã được lưu.',
  'help.ctx.journey-studio.bullet.2':
    'Thanh bên trái có năm mục: Pages, Content (ảnh và các mục của hành trình), Elements (văn bản, hình, đường kẻ, lưới, khung, icon), “Hành trình” (bản đồ, quốc gia, cờ và dấu dựng từ hành trình) và Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Vùng làm việc: trang đôi hiện tại với lề tràn và lề an toàn, thanh thu phóng bên dưới, Fit to view, và “Tải trang đôi này về” ở bên phải.',
  'help.ctx.journey-studio.bullet.4':
    'Properties ở bên phải: vị trí và kích thước, cắt và tiêu điểm, Fill hoặc Fit, diện mạo, góc, khung, thứ tự xếp lớp và khóa của thứ đang chọn; số trang và tài liệu khi không chọn gì.',
  'help.ctx.journey-studio.bullet.5':
    'Sách có hình dạng của một cuốn sách đóng gáy: bìa, một trang đầu đơn, các trang đôi, một trang cuối đơn và bìa sau. Số trang đếm từ trang đầu và in đúng như hiển thị.',
  'help.ctx.journey-studio.bullet.6':
    'Nhiều người có thể thiết kế cùng lúc: ai cũng thấy con trỏ của người khác kèm tên, và lưu đè lên phiên bản người khác đã thay đổi sẽ trả về một xung đột thay vì ghi đè công việc của họ.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Dựng sách tự động',
  'help.guide.studio-auto-layout.goal':
    'Có ngay bản nháp đầu tiên hoàn chỉnh từ các mục và ảnh của nhật ký chỉ với một cú nhấp.',
  'help.guide.studio-auto-layout.step.1': 'Nhấp Auto layout trên thanh trên cùng.',
  'help.guide.studio-auto-layout.step.2':
    'Chọn “Toàn bộ sách”: nó thay thế mọi trang, giữ lại tiêu đề và thiết lập trang của bạn. “Trang này” chỉ dựng lại trang đôi đang trên màn hình, và chỉ hiện với trang đôi được tạo từ một mục.',
  'help.guide.studio-auto-layout.step.3':
    'Xem qua thanh trang. Undo lấy lại toàn bộ bố cục nếu bạn thích bản trước hơn.',
  'help.guide.studio-auto-layout.result':
    'Mỗi mục một trang đôi, theo thứ tự, với ảnh, tiêu đề và câu chuyện đã được đặt sẵn cho bạn. Mọi phần tử vẫn theo mục của nó cho đến khi bạn chỉnh sửa.',
  'help.guide.studio-auto-layout.tip.1': 'Cả hai lựa chọn đều là bước hoàn tác bình thường, nên cứ thoải mái thử.',
  'help.guide.studio-auto-layout.tip.2':
    'Phần tử mà Auto layout gắn với một mục sẽ theo kịp các chỉnh sửa của mục đó cho đến khi bạn chạm vào nó trong Properties; điều đó cắt liên kết.',
  // studio-pages
  'help.guide.studio-pages.title': 'Thêm, di chuyển và xóa trang đôi',
  'help.guide.studio-pages.goal': 'Định hình cuốn sách từng trang một.',
  'help.guide.studio-pages.step.1':
    'Mở Pages trên thanh bên. Các hình thu nhỏ là cuốn sách theo thứ tự: bìa, trang đầu, các trang đôi, trang cuối, bìa sau.',
  'help.guide.studio-pages.step.2':
    '“Thêm trang” ở dưới cùng đặt một trang đôi mới trước trang cuối; dấu + giữa hai hình thu nhỏ chèn một trang ngay tại đó.',
  'help.guide.studio-pages.step.3':
    'Di chuột lên hình thu nhỏ để thấy các thao tác: “Chuyển lên trước”, “Chuyển xuống sau”, “Nhân bản trang” và “Xóa trang”. Nhấp vào hình thu nhỏ để mở trang đôi đó trong vùng làm việc.',
  'help.guide.studio-pages.result':
    'Bìa, trang đầu, trang cuối và bìa sau giữ nguyên chỗ; trang đôi mới luôn nằm giữa chúng.',
  'help.guide.studio-pages.tip.1':
    'Book view trên thanh trên cùng hiện cả cuốn sách dưới dạng các tờ, đúng như khi đóng gáy.',
  'help.guide.studio-pages.tip.2': 'Số trang được bật dưới “Tài liệu” trong Properties, khi không chọn gì.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Áp dụng một bố cục cho trang đôi',
  'help.guide.studio-layouts.goal': 'Cho trang đôi một cách sắp xếp sẵn các khung ảnh và văn bản.',
  'help.guide.studio-layouts.step.1':
    'Mở Layouts trên thanh bên. Mười ba bố cục trang đôi, và một bộ riêng cho bìa, bìa sau và các trang đơn.',
  'help.guide.studio-layouts.step.2':
    'Nhấp một bố cục. Trang đôi trong vùng làm việc nhận các khung của nó; ảnh và văn bản bạn đã có được đổ vào các khung đó.',
  'help.guide.studio-layouts.result':
    'Khung trống chờ nội dung: kéo một ảnh từ Content vào, hoặc dùng Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Một bố cục là bước hoàn tác như mọi bước khác.',
  // studio-content
  'help.guide.studio-content.title': 'Đặt ảnh và mục lên trang',
  'help.guide.studio-content.goal': 'Đưa tư liệu của chính hành trình lên trang đôi.',
  'help.guide.studio-content.step.1':
    'Mở Content trên thanh bên. Photos liệt kê mọi ảnh của hành trình; Entries liệt kê các mục kèm văn bản.',
  'help.guide.studio-content.step.2':
    'Kéo một ảnh lên trang đôi, hoặc vào một khung trống, hoặc nhấp Add to this page bên dưới ảnh. “Tải ảnh lên” thêm ảnh chưa có trong hành trình.',
  'help.guide.studio-content.step.3':
    'Dưới một mục, Title, Story và Place đặt văn bản đó lên trang dưới dạng phần tử văn bản; ngày và tọa độ vào dưới dạng dấu, và ảnh của mục được liệt kê ngay tại đó.',
  'help.guide.studio-content.result':
    'Ảnh thả xuống trở thành phần tử ảnh; văn bản vẫn theo mục cho đến khi bạn chỉnh sửa.',
  'help.guide.studio-content.tip.1': 'Ô tìm kiếm ở đầu Content lọc cả hai danh sách.',
  'help.guide.studio-content.tip.2':
    'Thả một tệp từ màn hình máy tính vào vùng làm việc sẽ tải lên và đặt nó trong một lần.',
  // studio-elements
  'help.guide.studio-elements.title': 'Thêm văn bản, hình và icon',
  'help.guide.studio-elements.goal': 'Trang trí trang đôi ngoài ảnh và câu chuyện.',
  'help.guide.studio-elements.step.1': 'Mở Elements trên thanh bên.',
  'help.guide.studio-elements.step.2':
    'Nhấp một kiểu văn bản cho tiêu đề hoặc chú thích, một hình, một đường kẻ, một lưới, một khung trống với kiểu khung, hoặc một icon từ thư viện có thể tìm kiếm. Mỗi thứ rơi vào giữa trang đôi, sẵn sàng để di chuyển.',
  'help.guide.studio-elements.result':
    'Nhấp đúp vào phần tử văn bản để gõ vào; Properties chứa phông chữ, độ đậm, cỡ, khoảng cách và căn lề.',
  'help.guide.studio-elements.tip.1': 'Khung là ô ảnh trống: thả ảnh vào sau.',
  // studio-travel
  'help.guide.studio-travel.title': 'Thêm bản đồ, cờ và số liệu',
  'help.guide.studio-travel.goal': 'Biến chính hành trình thành số liệu trên trang.',
  'help.guide.studio-travel.step.1': 'Mở “Hành trình” trên thanh bên.',
  'help.guide.studio-travel.step.2':
    'Chọn thứ cần thêm: bản đồ lộ trình của các mục, đường viền quốc gia, danh sách hoặc lưới quốc gia, cờ, dấu ngày, ngày thứ hoặc khoảng cách, hoặc tóm tắt cả chuyến đi. Mỗi thứ được dựng từ dữ liệu của hành trình và cập nhật theo nó.',
  'help.guide.studio-travel.result':
    'Phần tử xuất hiện trên trang đôi; Properties chỉnh kiểu của nó, và với bản đồ là vùng hiển thị.',
  'help.guide.studio-travel.tip.1':
    'Dấu theo mục mà trang đôi được tạo ra, nên dấu ngày trên trang đôi được dàn tự động đã hiện đúng ngày đó.',
  // studio-properties
  'help.guide.studio-properties.title': 'Chỉnh sửa thứ bạn đã chọn',
  'help.guide.studio-properties.goal': 'Di chuyển, cắt, đổi kiểu và xếp lớp một phần tử bằng bảng thuộc tính.',
  'help.guide.studio-properties.step.1':
    'Nhấp vào một phần tử trên trang đôi. Các núm kéo xuất hiện để chỉnh kích thước và xoay; kéo phần tử để di chuyển.',
  'help.guide.studio-properties.step.2':
    'Properties ở bên phải theo lựa chọn: vị trí và kích thước, Crop với tiêu điểm quyết định phần nào ở lại trong khung, Fill hoặc Fit, bộ lọc Look, bán kính Corner, kiểu “Khung”, thứ tự xếp lớp và Lock.',
  'help.guide.studio-properties.step.3':
    '“Nhân bản” và Delete nằm ở đầu bảng thuộc tính; Undo trên thanh trên cùng hoàn tác bất kỳ thao tác nào.',
  'help.guide.studio-properties.result':
    'Phần tử đã khóa không thể nắm được trên trang nữa, giúp giữ an toàn bố cục đã xong trong khi bạn làm việc xung quanh.',
  'help.guide.studio-properties.tip.1':
    'Giữ Shift và nhấp để chọn nhiều phần tử; bảng thuộc tính sẽ chỉnh sửa chúng cùng lúc.',
  'help.guide.studio-properties.tip.2':
    'Chỉnh sửa một phần tử do Auto layout đặt sẽ cắt liên kết với mục; nó ngừng theo các thay đổi sau này của mục đó.',
  // studio-format
  'help.guide.studio-format.title': 'Chọn khổ trang',
  'help.guide.studio-format.goal': 'Đặt kích thước sách sẽ được in, trước khi bố cục phụ thuộc vào nó.',
  'help.guide.studio-format.step.1': 'Nhấp Page format trên thanh trên cùng.',
  'help.guide.studio-format.step.2':
    'Chọn Square 21 × 21 cm, Square 30 × 30 cm, A4 hoặc A5 ngang hoặc dọc, hoặc nhập chiều rộng và chiều cao tùy chỉnh theo milimét. Tràn lề và lề an toàn nằm bên dưới.',
  'help.guide.studio-format.result':
    'Mọi trang đôi được vẽ ở kích thước đó, mặc định với tràn lề 3 mm và lề an toàn 5 mm.',
  'help.guide.studio-format.tip.1': 'Đổi khổ trước, rồi chạy Auto layout; bố cục được dựng cho kích thước nó tìm thấy.',
  'help.guide.studio-format.tip.2': 'Hỏi xưởng in về giá trị tràn lề và lề an toàn của họ rồi nhập các giá trị đó.',
  // studio-export
  'help.guide.studio-export.title': 'Xuất sách thành PDF',
  'help.guide.studio-export.goal': 'Có một tệp sẵn sàng để in, hoặc một tệp để đọc trên màn hình.',
  'help.guide.studio-export.step.1': 'Nhấp Export trên thanh trên cùng.',
  'help.guide.studio-export.step.2':
    'Chọn “Trang đơn”, mỗi tờ một trang theo thứ tự đọc, là thứ xưởng in cần, hoặc “Trang đôi”, hai trang một lúc như khi mở sách. “Dấu cắt” thêm tràn lề ở mọi cạnh và đánh dấu chỗ cắt.',
  'help.guide.studio-export.step.3':
    'Nhấp “Xem trước khi in”. Trình duyệt mở các trang và “Lưu thành PDF” biến chúng thành tệp.',
  'help.guide.studio-export.result': 'Một tệp PDF với đúng số tờ mà hộp thoại đã báo, ở khổ trang bạn đã đặt.',
  'help.guide.studio-export.tip.1': 'Tạo PDF chỉ làm được trên máy tính, giống như chính Studio.',
  'help.guide.studio-export.tip.2':
    'Để in thử, xuất “Trang đôi” không có dấu cắt; cho xưởng in, xuất “Trang đơn” có dấu cắt.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Dùng lại một trang đôi trong sách khác',
  'help.guide.studio-spread-file.goal': 'Mang một thiết kế bạn thích từ sách của hành trình này sang hành trình khác.',
  'help.guide.studio-spread-file.step.1':
    'Với trang đôi đang ở vùng làm việc, nhấp “Tải trang đôi này về” ở đầu bên phải của thanh thu phóng. Tệp chứa thiết kế, không chứa ảnh.',
  'help.guide.studio-spread-file.step.2':
    'Trong cuốn sách kia, mở Pages và nhấp “Nhập” cạnh “Thêm trang”, rồi chọn tệp.',
  'help.guide.studio-spread-file.result':
    'Trang đôi đến cùng các khung và kiểu văn bản của nó; thả ảnh của hành trình mới vào các khung.',
  'help.guide.studio-spread-file.tip.1': 'Tệp không phải thiết kế trang đôi sẽ bị từ chối kèm lý do.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Cài đặt',
  'help.ctx.settings.summary':
    'Cài đặt cá nhân của bạn, mỗi chủ đề một tab trong thanh bên bên trái. Hầu hết công tắc có hiệu lực ngay khi bạn gạt; biểu mẫu có nút “Lưu” ở dưới cùng sẽ chờ bạn nhấn nút đó. Không có gì ở đây làm thay đổi TREK của người khác.',
  'help.ctx.settings.bullet.1':
    'Thanh bên bên trái: “Hiển thị”, “Giao diện”, “Bản đồ”, “Thông báo”, “Tích hợp”, “Ngoại tuyến” và “Tài khoản”. “Plugin” xuất hiện khi đã cài một plugin, “Về” xuất hiện ở bất cứ nơi nào người vận hành chưa gỡ nó đi.',
  'help.ctx.settings.bullet.2':
    '“Hiển thị” là ngôn ngữ, đơn vị, tiền tệ và màn hình ứng dụng mở lúc đầu; “Giao diện” là chủ đề, màu sắc, cỡ chữ và các tiện ích của bảng điều khiển.',
  'help.ctx.settings.bullet.3':
    '“Bản đồ” chọn công cụ vẽ và kiểu của nó; “Thông báo” chọn các kênh liên lạc tới bạn; “Tích hợp” gồm thư viện ảnh, khóa API và MCP; “Ngoại tuyến” là những gì ứng dụng giữ trên thiết bị này.',
  'help.ctx.settings.bullet.4':
    '“Tài khoản” chứa hồ sơ, mật khẩu, xác thực hai yếu tố, mật mã và việc xóa tài khoản của bạn.',
  'help.ctx.settings-display.title': 'Hiển thị',
  'help.ctx.settings-display.summary':
    'Ngôn ngữ, đơn vị và tiền tệ, cách bản đồ và đặt chỗ hoạt động, và màn hình TREK mở lúc đầu. Mọi thay đổi ở đây có hiệu lực ngay.',
  'help.ctx.settings-display.bullet.1':
    '“Ngôn ngữ & khu vực”: ngôn ngữ giao diện, định dạng thời gian, ngày đầu tuần, tiền tệ hiển thị, đơn vị khoảng cách và nhiệt độ.',
  'help.ctx.settings-display.bullet.2':
    '“Du lịch & bản đồ”: tuyến đường đặt chỗ luôn có trên bản đồ, nút khám phá địa điểm, tối ưu hóa tuyến đường từ chỗ ở của bạn, mã đặt chỗ được làm mờ và tuyến đường đặt chỗ có nhãn.',
  'help.ctx.settings-display.bullet.3':
    '“Khởi động”: TREK mở ở bảng điều khiển hay ở chuyến đi đang diễn ra, và tab nào của chuyến đi hiện ra trước.',
  'help.ctx.settings-appearance.title': 'Giao diện',
  'help.ctx.settings-appearance.summary':
    'TREK trông thế nào trên tài khoản này: sáng hay tối, màu nhấn, hiệu ứng kính và chuyển động, cỡ chữ, và bảng điều khiển hiện những tiện ích nào. Mọi thứ áp dụng ngay, trên mọi thiết bị bạn đăng nhập.',
  'help.ctx.settings-appearance.bullet.1':
    '“Chủ đề”: “Sáng”, “Tối” hoặc “Tự động”, và “Bảng màu” với “Màu nhấn tùy chỉnh” của riêng bạn.',
  'help.ctx.settings-appearance.bullet.2':
    '“Khả năng đọc”: “Độ trong suốt”, “Giảm chuyển động”, “Mật độ” và “Cỡ chữ”, với cỡ nâng cao cho từng cấp.',
  'help.ctx.settings-appearance.bullet.3':
    '“Tiện ích bảng điều khiển”: mỗi tiện ích một công tắc, riêng cho “Máy tính” và “Di động”.',
  'help.ctx.settings-appearance.bullet.4': '“Đặt lại về mặc định” ở dưới cùng đưa mọi thứ về như cũ.',
  'help.ctx.settings-map.title': 'Bản đồ',
  'help.ctx.settings-map.summary':
    'Công cụ nào vẽ bản đồ và theo kiểu nào. Leaflet là bản đồ raster cổ điển, MapLibre vẽ ô vector không cần mã thông báo nào, Mapbox thêm tòa nhà 3D và địa hình bằng mã thông báo của riêng bạn.',
  'help.ctx.settings-map.bullet.1':
    '“Nhà cung cấp bản đồ”: Leaflet, MapLibre hoặc Mapbox, mỗi cái có một dòng cho biết nó cần gì.',
  'help.ctx.settings-map.bullet.2':
    '“Kiểu bản đồ” và “Mẫu bản đồ”: diện mạo của các ô bản đồ, cộng với mã thông báo hoặc khóa mà nhà cung cấp yêu cầu.',
  'help.ctx.settings-map.bullet.3':
    '“Chế độ chất lượng cao” để khử răng cưa và phép chiếu địa cầu; “Lưu bản đồ” ghi lại lựa chọn.',
  'help.ctx.settings-notifications.title': 'Thông báo',
  'help.ctx.settings-notifications.summary':
    'TREK liên lạc với bạn ở đâu ngoài ứng dụng: thông báo đẩy trên thiết bị này, một chủ đề ntfy, một webhook, hoặc một kênh do plugin cung cấp. Bên dưới các kênh, mỗi sự kiện một hàng quyết định cái gì đi đâu.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: chủ đề, máy chủ riêng của bạn (tùy chọn) và mã thông báo truy cập (tùy chọn), với “Bài kiểm tra” để gửi ngay một tin.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: một URL nhận mọi sự kiện dưới dạng JSON, với “Bài kiểm tra”.',
  'help.ctx.settings-notifications.bullet.3':
    'Thông báo đẩy trên thiết bị này: “Bật cho thiết bị này” chỉ áp dụng cho trình duyệt bạn đang dùng, nên hãy lặp lại trên từng điện thoại hoặc máy tính. “Gửi thử” sẽ đến tất cả các thiết bị đó.',
  'help.ctx.settings-notifications.bullet.4':
    'Các hàng tùy chọn: với mỗi sự kiện, kênh nào đang bật. Kênh của plugin hiện “Cấu hình” cho đến khi được thiết lập.',
  'help.ctx.settings-integrations.title': 'Tích hợp',
  'help.ctx.settings-integrations.summary':
    'Mọi thứ kết nối vào TREK từ bên ngoài: thư viện ảnh cho nhật ký, khóa API cho các tập lệnh, và điểm cuối MCP với mã thông báo và máy khách OAuth cho trợ lý AI.',
  'help.ctx.settings-integrations.bullet.1':
    'Nhà cung cấp ảnh: Immich và Synology Photos, mỗi cái có URL và khóa riêng, “Kiểm tra kết nối” và “Lưu”.',
  'help.ctx.settings-integrations.bullet.2':
    '“Khóa API”: khóa cá nhân cho các tập lệnh và công cụ khác gọi API của TREK nhân danh bạn.',
  'help.ctx.settings-integrations.bullet.3':
    '“MCP Cấu hình”: điểm cuối, một cấu hình máy khách sẵn để sao chép, và các mã thông báo API.',
  'help.ctx.settings-integrations.bullet.4':
    '“OAuth 2.1 Khách hàng”: các ứng dụng đăng nhập qua TREK, với URI chuyển hướng, phạm vi được phép, máy khách không đăng nhập trình duyệt và các phiên đang hoạt động.',
  'help.ctx.settings-offline.title': 'Ngoại tuyến',
  'help.ctx.settings-offline.summary':
    'Những gì TREK giữ trên thiết bị này để chuyến đi vẫn mở được khi không có kết nối, và điều gì xảy ra khi một thay đổi làm lúc ngoại tuyến va chạm với một thay đổi làm ở nơi khác.',
  'help.ctx.settings-offline.bullet.1':
    '“Chế độ ngoại tuyến”: “Bắt buộc chế độ ngoại tuyến” làm ứng dụng hoạt động như thể mất mạng, để thử nghiệm hoặc khi dùng kết nối tính phí theo dung lượng.',
  'help.ctx.settings-offline.bullet.2':
    '“Chuẩn bị cho ngoại tuyến”: “Tải xuống để dùng ngoại tuyến” tải ngay các chuyến đi của bạn và ô bản đồ của chúng.',
  'help.ctx.settings-offline.bullet.3':
    '“Lưu trữ gì khi ngoại tuyến”: bật hoặc tắt ô bản đồ, và một công tắc cho mỗi chuyến đi.',
  'help.ctx.settings-offline.bullet.4':
    '“Xung đột đồng bộ hóa” và “Bộ nhớ đệm ngoại tuyến”: cách xử lý va chạm, số thay đổi đang chờ và thất bại, “Đồng bộ lại ngay” và “Xóa bộ nhớ đệm”.',
  'help.ctx.settings-account.title': 'Tài khoản',
  'help.ctx.settings-account.summary':
    'Bạn là ai trên TREK này và bạn đăng nhập thế nào: hồ sơ và ảnh đại diện, mật khẩu, xác thực hai yếu tố, mật mã, và ở dưới cùng là việc xóa tài khoản.',
  'help.ctx.settings-account.bullet.1': 'Hồ sơ: tên người dùng, email và ảnh đại diện, lưu bằng “Lưu hồ sơ”.',
  'help.ctx.settings-account.bullet.2':
    '“Thay đổi mật khẩu”: mật khẩu hiện tại, mật khẩu mới hai lần, “Cập nhật mật khẩu”.',
  'help.ctx.settings-account.bullet.3':
    '“Xác thực hai yếu tố (2FA)” bằng ứng dụng xác thực và mã dự phòng; “Mật mã” để đăng nhập không cần mật khẩu.',
  'help.ctx.settings-account.bullet.4':
    '“Xóa tài khoản” ở dưới cùng, sau một bước xác nhận. Quản trị viên cuối cùng không thể tự xóa mình.',
  // language-region
  'help.guide.language-region.title': 'Đặt ngôn ngữ, đơn vị và tiền tệ',
  'help.guide.language-region.goal': 'Để TREK nói ngôn ngữ của bạn và đếm theo cách của bạn.',
  'help.guide.language-region.step.1':
    'Chọn ngôn ngữ giao diện trong “Ngôn ngữ & khu vực”. TREK chuyển ngay, trên mọi thiết bị bạn đăng nhập.',
  'help.guide.language-region.step.2':
    'Bên dưới, chọn định dạng thời gian, ngày bắt đầu tuần trong mọi bộ chọn ngày, tiền tệ hiển thị, đơn vị khoảng cách và nhiệt độ.',
  'help.guide.language-region.result':
    'Ngày tháng, khoảng cách và tiền đọc đúng như bạn mong đợi; tiền tệ riêng của chuyến đi vẫn hiện bên cạnh số tiền đã quy đổi.',
  'help.guide.language-region.tip.1':
    'Tiền tệ hiển thị dùng cho tổng cộng giữa các chuyến đi; mỗi chuyến đi giữ loại tiền bạn đã gán cho nó.',
  'help.guide.language-region.tip.2': 'Ngôn ngữ cũng quyết định tên ngày và tháng trong Vacay và nhật ký.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Điều chỉnh cách bản đồ và đặt chỗ hoạt động',
  'help.guide.travel-map-prefs.goal': 'Quyết định bản đồ chuyến đi hiện gì theo mặc định.',
  'help.guide.travel-map-prefs.step.1':
    'Trong “Du lịch & bản đồ”, “Luôn hiển thị tuyến đường đặt chỗ” giữ chuyến bay và tàu trên bản đồ ngay cả khi ngày của chúng không được mở; “Khám phá các địa điểm trên bản đồ” hiện nút tìm địa điểm; “Tối ưu hóa tuyến đường từ chỗ ở” bắt đầu tuyến đường từ nơi bạn ngủ.',
  'help.guide.travel-map-prefs.step.2':
    '“Mã đặt chỗ mờ” ẩn số xác nhận cho đến khi bạn di chuột lên; “Nhãn lộ trình đặt chỗ” đặt mã sân bay hoặc tên nhà ga lên nhãn ở mỗi đầu lộ trình của một đặt chỗ, nơi mà nếu không có tùy chọn này thì chỉ có biểu tượng hiện ra.',
  'help.guide.travel-map-prefs.result':
    'Bản đồ chuyến đi tuân theo các lựa chọn này trên mọi chuyến đi, cho đến khi bạn gạt lại.',
  'help.guide.travel-map-prefs.tip.1':
    'Đây là cài đặt theo tài khoản, không theo chuyến đi. Mỗi thành viên của chuyến đi chung thấy lựa chọn riêng của mình.',
  'help.guide.travel-map-prefs.tip.2':
    '“Mở địa điểm bằng” chọn ứng dụng bản đồ mà nút dẫn đường mở ngay lập tức; “Hỏi mỗi lần” giữ lại lựa chọn giữa mọi ứng dụng bản đồ.',
  // startup
  'help.guide.startup.title': 'Chọn màn hình TREK mở lúc đầu',
  'help.guide.startup.goal': 'Đáp xuống nơi bạn làm việc nhiều nhất, thay vì bảng điều khiển mỗi lần.',
  'help.guide.startup.step.1':
    'Trong “Khởi động”, đặt “Trang khởi động” thành “Bảng điều khiển” hoặc “Chuyến đi đang diễn ra”.',
  'help.guide.startup.step.2': '“Tab khởi động” chọn tab nào của chuyến đi hiện ra trước khi bạn mở một chuyến đi.',
  'help.guide.startup.result': 'Lần đăng nhập tiếp theo và lần chạm tiếp theo vào logo sẽ đi thẳng tới đó.',
  'help.guide.startup.tip.1':
    '“Chuyến đi đang diễn ra” nghĩa là chuyến đi đang diễn ra hôm nay, hoặc chuyến tiếp theo khi không có chuyến nào.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Đặt chủ đề và màu nhấn',
  'help.guide.theme-scheme.goal': 'Để TREK sáng, tối hoặc theo thiết bị của bạn, với màu bạn thích.',
  'help.guide.theme-scheme.step.1':
    'Trong “Chủ đề”, chọn “Sáng”, “Tối” hoặc “Tự động”. “Tự động” theo thiết bị của bạn.',
  'help.guide.theme-scheme.step.2':
    'Chọn một “Bảng màu”: “Mặc định”, “Tương phản cao”, “Chàm”, “Xanh ngọc”, “Hồng”, “Hổ phách”, “Tím” hoặc “Tùy chỉnh”.',
  'help.guide.theme-scheme.step.3':
    'Với “Tùy chỉnh”, chọn một màu nhấn từ các màu có sẵn hoặc nhập màu của riêng bạn. Kiểm tra tương phản bên cạnh cho biết chữ có còn đọc được trên màu đó không.',
  'help.guide.theme-scheme.result':
    'Nút, liên kết và phần nổi bật nhận màu nhấn ở mọi nơi, trên mọi thiết bị bạn đăng nhập.',
  'help.guide.theme-scheme.tip.1': 'Thanh điều hướng cũng có công tắc nhanh sáng hoặc tối; nó đặt cùng một chủ đề.',
  'help.guide.theme-scheme.tip.2': '“Tương phản cao” là bảng màu nên chọn khi màu mặc định trông quá nhạt.',
  // readability
  'help.guide.readability.title': 'Điều chỉnh khả năng đọc và cỡ chữ',
  'help.guide.readability.goal': 'Ít kính hơn, ít chuyển động hơn, nhiều chỗ hơn hoặc chữ lớn hơn.',
  'help.guide.readability.step.1':
    'Trong “Khả năng đọc”, “Độ trong suốt” chuyển các bảng kính thành bề mặt đặc, “Giảm chuyển động” giảm hoạt ảnh xuống tối thiểu, và “Mật độ” chọn “Thoải mái” hoặc “Gọn”.',
  'help.guide.readability.step.2':
    '“Cỡ chữ” chỉnh “Tất cả” cùng lúc; “Cỡ chữ nâng cao” cho phép tiêu đề, phụ đề, thân bài và chú thích khác nhau.',
  'help.guide.readability.result': 'Toàn bộ ứng dụng tuân theo ngay, kể cả các bảng bản đồ và nhật ký.',
  'help.guide.readability.tip.1': '“Giảm chuyển động” cũng theo cài đặt hệ thống của bạn khi bạn không chạm vào nó.',
  'help.guide.readability.tip.2':
    'Cỡ chữ được áp dụng qua các cấp kiểu chữ, nên không có gì bị cắt; cỡ nào không còn vừa sẽ xuống dòng.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Chọn tiện ích cho bảng điều khiển',
  'help.guide.dashboard-widgets.goal': 'Chỉ hiện những tiện ích bạn dùng, riêng trên máy tính và trên điện thoại.',
  'help.guide.dashboard-widgets.step.1':
    'Trong “Tiện ích bảng điều khiển”, bật hoặc tắt từng tiện ích cho “Máy tính” và cho “Di động”: toàn bộ thanh bên phải, tiền tệ, Collections, múi giờ, đặt chỗ sắp tới, quốc gia trong Atlas và các con số du lịch.',
  'help.guide.dashboard-widgets.step.2': '“Đặt lại về mặc định” ở dưới cùng đưa cả tab về trạng thái ban đầu.',
  'help.guide.dashboard-widgets.result': 'Bảng điều khiển sắp xếp lại ngay; khi tắt thanh bên phải, nó được căn giữa.',
  'help.guide.dashboard-widgets.tip.1':
    'Tiện ích của một tiện ích bổ sung chỉ xuất hiện khi quản trị viên đang bật tiện ích bổ sung đó.',
  'help.guide.dashboard-widgets.tip.2':
    'Bản thân bảng điều khiển nhớ chế độ xem lưới hay danh sách và thứ tự sắp xếp theo từng thiết bị.',
  // map-provider
  'help.guide.map-provider.title': 'Chọn công cụ và kiểu bản đồ',
  'help.guide.map-provider.goal': 'Chuyển giữa bản đồ cổ điển, ô vector và bản đồ 3D của Mapbox.',
  'help.guide.map-provider.step.1':
    'Trong “Nhà cung cấp bản đồ”, chọn Leaflet cho bản đồ 2D cổ điển với mọi loại ô raster, MapLibre cho ô vector OpenFreeMap không cần mã thông báo, hoặc Mapbox cho ô vector có tòa nhà 3D và địa hình.',
  'help.guide.map-provider.step.2':
    'Chọn một “Kiểu bản đồ” hoặc “Mẫu bản đồ” cho diện mạo. Mapbox cần “Mapbox Mã thông báo truy cập”, một số kiểu raster cần “Khóa API CARTO”; liên kết bên cạnh ô nhập dẫn tới nơi bạn lấy chúng.',
  'help.guide.map-provider.step.3':
    '“Chế độ chất lượng cao” thêm khử răng cưa và phép chiếu địa cầu. Nhấp “Lưu bản đồ”.',
  'help.guide.map-provider.result':
    'Mọi bản đồ trong TREK, chuyến đi, Atlas, Collections và nhật ký, đều do công cụ bạn chọn vẽ.',
  'help.guide.map-provider.tip.1': 'Không có mã thông báo, Mapbox quay về bản đồ mặc định thay vì không hiện gì.',
  'help.guide.map-provider.tip.2': 'Ô bản đồ bạn lưu ngoại tuyến đến từ nhà cung cấp đang hoạt động lúc bạn tải chúng.',
  // notification-channels
  'help.guide.notification-channels.title': 'Thiết lập nơi thông báo tới bạn',
  'help.guide.notification-channels.goal':
    'Nhận lời nhắc chuyến đi và sự kiện cộng tác trên điện thoại hoặc trong công cụ khác.',
  'help.guide.notification-channels.step.1':
    'Trong “Thông báo”, điền “Ntfy Chủ đề”; thêm “Ntfy Máy chủ URL” của riêng bạn và “Mã thông báo truy cập” nếu bạn tự vận hành máy chủ. “Bài kiểm tra” gửi ngay một tin nhắn.',
  'help.guide.notification-channels.step.2':
    'Hoặc cung cấp một “Webhook URL” nhận mọi sự kiện dưới dạng JSON, và thử nó theo cách tương tự bằng “Bài kiểm tra”.',
  'help.guide.notification-channels.step.3':
    'Trong các hàng bên dưới, bật hoặc tắt từng sự kiện theo từng kênh. Kênh của plugin hiện “Cấu hình” cho đến khi được thiết lập trong cài đặt của plugin; “Gửi thử” gửi thử một tin.',
  'help.guide.notification-channels.result':
    'Sự kiện được gửi qua các kênh đang bật. Biểu tượng chuông trên thanh điều hướng vẫn hiện chúng trong ứng dụng bất kể thế nào.',
  'help.guide.notification-channels.tip.1':
    'Tùy chọn theo từng chuyến đi nằm ngay trên chuyến đi, trong cài đặt thông báo của nó.',
  'help.guide.notification-channels.tip.2':
    'Quản trị viên có thể điền sẵn một máy chủ ntfy mặc định cho mọi người; bạn vẫn tự chọn chủ đề của mình.',
  // photo-providers
  'help.guide.photo-providers.title': 'Kết nối một thư viện ảnh',
  'help.guide.photo-providers.goal': 'Để nhật ký lấy ảnh trong ngày từ Immich hoặc Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Trong “Tích hợp”, tìm phần của nhà cung cấp và nhập URL cùng khóa API của nó. Immich cũng đề nghị sao chép ngược các ảnh tải lên hành trình vào thư viện.',
  'help.guide.photo-providers.step.2': 'Nhấp “Kiểm tra kết nối”, rồi “Lưu”.',
  'help.guide.photo-providers.result':
    'Tab “External photos” của trình soạn mục tìm trong thư viện đã kết nối theo ngày của mục, ưu tiên ảnh gần vị trí của mục nhất.',
  'help.guide.photo-providers.tip.1':
    'Kết nối là của riêng bạn: các thành viên khác của hành trình kết nối thư viện của riêng họ.',
  'help.guide.photo-providers.tip.2':
    'Nhà cung cấp không có dữ liệu GPS trong ảnh vẫn hoạt động; khi đó danh sách theo thứ tự thời gian.',
  // api-keys
  'help.guide.api-keys.title': 'Tạo một khóa API',
  'help.guide.api-keys.goal': 'Để một tập lệnh hoặc công cụ khác gọi API của TREK với tư cách là bạn.',
  'help.guide.api-keys.step.1':
    'Trong “Khóa API”, nhấp “Tạo khóa” và đặt cho nó một cái tên cho biết nó sẽ được dùng ở đâu.',
  'help.guide.api-keys.step.2':
    'Sao chép khóa từ hộp thoại: nó chỉ hiện một lần. Xóa khóa khỏi danh sách khi công cụ không còn cần nữa.',
  'help.guide.api-keys.result':
    'Yêu cầu dùng khóa đó hoạt động với quyền của bạn; danh sách cho biết mỗi khóa được tạo khi nào và dùng lần cuối khi nào.',
  'help.guide.api-keys.tip.1': 'Mỗi công cụ một khóa giúp việc thu hồi nhẹ nhàng.',
  'help.guide.api-keys.tip.2':
    'Với trợ lý AI, hãy dùng MCP với OAuth thay vào đó; khóa API dành cho các máy khách HTTP thuần túy.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Kết nối trợ lý AI qua MCP',
  'help.guide.mcp-oauth.goal': 'Cho Claude, một IDE hoặc một máy khách MCP khác quyền truy cập vào chuyến đi của bạn.',
  'help.guide.mcp-oauth.step.1':
    'Trong “MCP Cấu hình”, sao chép “MCP Điểm cuối”, hoặc toàn bộ “Cấu hình máy khách” cho máy khách nhận đoạn JSON.',
  'help.guide.mcp-oauth.step.2':
    'Máy khách đăng nhập qua trình duyệt dùng OAuth 2.1: “Khách hàng mới” trong “OAuth 2.1 Khách hàng”, với “URI chuyển hướng”, “Phạm vi được phép” và, cho máy chủ không có trình duyệt, “Máy khách (không đăng nhập trình duyệt)”.',
  'help.guide.mcp-oauth.step.3':
    '“Xoay bí mật” và “Xóa khách hàng” nằm trên mỗi máy khách; “Phiên hoạt động OAuth” liệt kê những gì đang đăng nhập và cho bạn thu hồi. “API Mã thông báo” với “Tạo mã thông báo mới” là cách vào cũ hơn.',
  'help.guide.mcp-oauth.result':
    'Máy khách có thể đọc và thay đổi những gì phạm vi của nó cho phép, với tư cách là bạn, và mọi hành động hiện dưới tên bạn.',
  'help.guide.mcp-oauth.tip.1':
    'Phạm vi là lưới an toàn: chỉ cấp cho máy khách phạm vi đọc cho đến khi nó cần nhiều hơn.',
  'help.guide.mcp-oauth.tip.2': 'Quản trị viên có thể tắt MCP cho cả phiên bản cài đặt; khi đó phần này không có.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Mang chuyến đi ra ngoại tuyến',
  'help.guide.offline-prepare.goal': 'Có sẵn chuyến đi và bản đồ của chúng trên thiết bị này trước khi mất kết nối.',
  'help.guide.offline-prepare.step.1':
    'Trong “Lưu trữ gì khi ngoại tuyến”, giữ “Lưu ô bản đồ ngoại tuyến” bật và bật những chuyến đi bạn muốn có trên thiết bị này.',
  'help.guide.offline-prepare.step.2':
    'Nhấp “Tải xuống để dùng ngoại tuyến” trong “Chuẩn bị cho ngoại tuyến”. Nó tải các chuyến đi và các ô bản đồ quanh địa điểm của chúng.',
  'help.guide.offline-prepare.step.3':
    '“Bắt buộc chế độ ngoại tuyến” trong “Chế độ ngoại tuyến” cho bạn kiểm tra mọi thứ đã có đủ trước khi lên đường.',
  'help.guide.offline-prepare.result':
    'Chuyến đi mở được khi không có kết nối; thay đổi bạn thực hiện chờ trong hàng đợi và được gửi đi khi kết nối lại.',
  'help.guide.offline-prepare.tip.1':
    'Ô bản đồ chiếm nhiều dung lượng nhất: phần “Bộ nhớ đệm ngoại tuyến” cho biết những gì được lưu, theo từng chuyến đi.',
  'help.guide.offline-prepare.tip.2': 'Cài TREK như một ứng dụng từ trình duyệt để khởi động ngoại tuyến mượt nhất.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Quyết định bên nào thắng khi xung đột đồng bộ',
  'help.guide.offline-conflicts.goal':
    'Chọn cách TREK giải quyết một thay đổi làm lúc ngoại tuyến so với một thay đổi làm ở nơi khác.',
  'help.guide.offline-conflicts.step.1':
    'Trong “Xung đột đồng bộ hóa”, chọn “Hỏi tôi mỗi lần”, “Luôn giữ phiên bản của tôi” hoặc “Luôn giữ phiên bản của máy chủ”.',
  'help.guide.offline-conflicts.step.2':
    '“Bộ nhớ đệm ngoại tuyến” hiện các chuyến đi, thay đổi đang chờ và thất bại cùng các xung đột; “Đồng bộ lại ngay” đẩy hàng đợi đi, “Xóa bộ nhớ đệm” làm trống thiết bị.',
  'help.guide.offline-conflicts.result':
    'Với “Hỏi tôi mỗi lần”, xung đột hiện cả hai phiên bản và cho bạn chọn; với hai lựa chọn còn lại, nó được giải quyết âm thầm.',
  'help.guide.offline-conflicts.tip.1': '“Xóa bộ nhớ đệm” chỉ gỡ bản sao trên thiết bị này; không đụng gì đến máy chủ.',
  // profile
  'help.guide.profile.title': 'Thay đổi hồ sơ của bạn',
  'help.guide.profile.goal': 'Cập nhật tên, email và ảnh của bạn.',
  'help.guide.profile.step.1':
    'Trong “Tài khoản”, sửa “Tên người dùng” và “Email”. Ảnh đại diện nhận ảnh bạn tự tải lên; gỡ nó để quay về chữ cái đầu.',
  'help.guide.profile.step.2': 'Nhấp “Lưu hồ sơ”.',
  'help.guide.profile.result':
    'Tên và ảnh của bạn cập nhật ở mọi nơi ngay lập tức, kể cả trên các chuyến đi bạn chia sẻ.',
  'help.guide.profile.tip.1': 'Tài khoản đăng nhập qua OIDC sẽ hiện điều đó ở đây; khi đó email đến từ nhà cung cấp.',
  // password
  'help.guide.password.title': 'Thay đổi mật khẩu của bạn',
  'help.guide.password.goal': 'Đặt mật khẩu mới.',
  'help.guide.password.step.1': 'Trong “Thay đổi mật khẩu”, nhập mật khẩu hiện tại, rồi mật khẩu mới hai lần.',
  'help.guide.password.step.2': 'Nhấp “Cập nhật mật khẩu”.',
  'help.guide.password.result': 'Mật khẩu mới có hiệu lực từ lần đăng nhập tiếp theo; các phiên khác vẫn đăng nhập.',
  'help.guide.password.tip.1': 'Tài khoản đăng nhập qua OIDC không có mật khẩu TREK để thay đổi.',
  // mfa
  'help.guide.mfa.title': 'Bật xác thực hai yếu tố',
  'help.guide.mfa.goal': 'Bảo vệ tài khoản bằng mã từ ứng dụng xác thực.',
  'help.guide.mfa.step.1': 'Trong “Xác thực hai yếu tố (2FA)”, nhấp “Thiết lập trình xác thực”.',
  'help.guide.mfa.step.2':
    'Quét mã QR bằng ứng dụng của bạn, hoặc nhập bí mật bằng tay, rồi gõ mã sáu chữ số nó hiện và nhấp “Kích hoạt 2FA”.',
  'help.guide.mfa.step.3':
    'Lưu các mã dự phòng: sao chép, tải xuống hoặc in chúng. Mỗi mã dùng được một lần, khi bạn không có điện thoại bên mình.',
  'help.guide.mfa.result': 'Mỗi lần đăng nhập đều hỏi mã sau mật khẩu.',
  'help.guide.mfa.tip.1': '“Tắt 2FA” cần mật khẩu của bạn và một mã hiện tại.',
  'help.guide.mfa.tip.2': 'Quản trị viên có thể bắt buộc 2FA cho mọi người; khi đó không thể tắt nó ở đây.',
  // passkeys
  'help.guide.passkeys.title': 'Đăng nhập bằng mật mã',
  'help.guide.passkeys.goal': 'Dùng vân tay, khuôn mặt hoặc mã PIN của thiết bị thay cho mật khẩu.',
  'help.guide.passkeys.step.1':
    'Trong “Mật mã”, nhấp “Thêm mật mã” và xác nhận bằng thiết bị của bạn. Đặt cho nó một cái tên cho biết đó là thiết bị nào.',
  'help.guide.passkeys.step.2': 'Danh sách hiện mọi mật mã với tên và lần dùng cuối; nút xóa gỡ một mật mã.',
  'help.guide.passkeys.result': 'Trang đăng nhập đề xuất mật mã; mật khẩu vẫn là phương án dự phòng.',
  'help.guide.passkeys.tip.1':
    'Mật mã nằm trên thiết bị hoặc trong trình quản lý mật khẩu của nó, nên hãy thêm một mật mã cho mỗi thiết bị.',
  'help.guide.passkeys.tip.2':
    'Mật mã cần HTTPS; trên phiên bản cài đặt HTTP thuần túy, phần này giải thích vì sao chúng không khả dụng.',
  // delete-account
  'help.guide.delete-account.title': 'Xóa tài khoản của bạn',
  'help.guide.delete-account.goal': 'Gỡ tài khoản của bạn và dữ liệu chỉ thuộc về bạn.',
  'help.guide.delete-account.step.1': 'Ở dưới cùng của “Tài khoản”, nhấp “Xóa tài khoản” và xác nhận.',
  'help.guide.delete-account.result':
    'Tài khoản, các chuyến đi của riêng bạn và các hành trình của bạn biến mất; chuyến đi bạn chia sẻ với người khác vẫn ở lại với họ.',
  'help.guide.delete-account.tip.1':
    'Quản trị viên cuối cùng của một phiên bản cài đặt không thể tự xóa mình; hãy để người khác làm quản trị viên trước.',
  'help.guide.delete-account.tip.2': 'Không có hoàn tác. Xuất những gì bạn muốn giữ trước khi xác nhận.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Sự quản lý',
  'help.ctx.admin.summary':
    'Phiên bản TREK đứng sau tất cả mọi người: ai được đăng nhập và bằng cách nào, thứ gì đang bật, tệp nằm ở đâu, máy chủ liên lạc với mọi người ra sao, và nó được sao lưu thế nào. Chỉ quản trị viên thấy trang này; mỗi tab là một màn hình riêng trong thanh bên.',
  'help.ctx.admin.bullet.1':
    'Bốn thẻ ở trên cùng đếm người dùng, chuyến đi, địa điểm và tệp; một biểu ngữ phía trên chúng báo có bản phát hành TREK mới hơn.',
  'help.ctx.admin.bullet.2':
    '“Người dùng” và “Mặc định của người dùng”: tài khoản, liên kết mời, và cài đặt bản đồ mà một tài khoản mới bắt đầu với.',
  'help.ctx.admin.bullet.3':
    '“Cá nhân hóa”, “Cài đặt”, “Tiện ích bổ sung” và “Plugins”: mẫu đóng gói, danh mục và kỳ nghỉ học; phương thức đăng nhập và khóa API; các mô-đun tính năng; plugin bên thứ ba.',
  'help.ctx.admin.bullet.4':
    '“Lưu trữ”, “Thông báo”, “MCP Truy cập” và “GitHub”: tệp tải lên đi đâu, các kênh của toàn phiên bản, mã thông báo và phiên của các ứng dụng AI, và lịch sử phát hành.',
  'help.ctx.admin.bullet.5':
    '“Sao lưu” và “Lịch sử”: sao lưu theo yêu cầu và theo lịch, cùng nhật ký các sự kiện liên quan đến bảo mật.',
  'help.ctx.admin-users.title': 'Người dùng',
  'help.ctx.admin-users.summary':
    'Mọi tài khoản trên TREK này, với vai trò, email và lần đăng nhập gần nhất, cùng các liên kết mời cho phép người khác đăng ký trên một phiên bản đóng.',
  'help.ctx.admin-users.bullet.1':
    'Bảng: tên người dùng, email, vai trò, ngày tạo, lần đăng nhập cuối và các thao tác trên mỗi hàng. Bạn được đánh dấu là chính bạn.',
  'help.ctx.admin-users.bullet.2':
    '“Tạo người dùng” ở trên cùng thêm một tài khoản bằng tay, với mật khẩu do bạn trao lại.',
  'help.ctx.admin-users.bullet.3':
    '“Mời liên kết” ở dưới: liên kết đăng ký dùng một lần với giới hạn lượt dùng, thời hạn và, nếu bạn muốn, một chuyến đi mà người dùng mới tham gia ngay khi đến.',
  'help.ctx.admin-users.bullet.4':
    '“Cài đặt quyền” ở dưới cùng: với từng thao tác, ai được làm, “Mọi người”, “Thành viên”, “Người tạo” hoặc “Chỉ quản trị viên”.',
  'help.ctx.admin-defaults.title': 'Mặc định của người dùng',
  'help.ctx.admin-defaults.summary':
    'Cài đặt mà một tài khoản mới bắt đầu với, để không ai phải tìm tab bản đồ trước: nhà cung cấp bản đồ, kiểu, mã thông báo và chất lượng.',
  'help.ctx.admin-defaults.bullet.1':
    'Nhà cung cấp bản đồ, kiểu và mã thông báo Mapbox, khóa CARTO và chất lượng Mapbox, đúng như người dùng đặt trong “Cài đặt”, “Bản đồ”.',
  'help.ctx.admin-defaults.bullet.2':
    '“cài lại” ở mỗi trường trả về lựa chọn riêng của TREK; cài đặt riêng của người dùng luôn thắng các giá trị này.',
  'help.ctx.admin-config.title': 'Cá nhân hóa',
  'help.ctx.admin-config.summary':
    'Những gì mọi chuyến đi trên phiên bản này dùng chung: mẫu đóng gói, bộ danh mục cho địa điểm và bộ sưu tập, và danh mục kỳ nghỉ học mà Vacay lấy dữ liệu từ đó.',
  'help.ctx.admin-config.bullet.1':
    '“Mẫu đóng gói”: các danh sách có tên gồm danh mục và món đồ mà danh sách đóng gói của một chuyến đi có thể bắt đầu từ đó.',
  'help.ctx.admin-config.bullet.2':
    '“Thể loại”: tên, biểu tượng và màu của các danh mục dùng trên toàn TREK, từ trình xem địa điểm đến Bộ sưu tập.',
  'help.ctx.admin-config.bullet.3':
    '“Kỳ nghỉ học”: danh mục các quốc gia và khu vực, dành cho những nơi mà nguồn dữ liệu tích hợp sẵn không bao phủ.',
  'help.ctx.admin-settings.title': 'Cài đặt',
  'help.ctx.admin-settings.summary':
    'Mọi người vào bằng cách nào và máy chủ được nói chuyện với gì: phương thức đăng nhập và đăng ký, SSO, mật mã, chính sách hai yếu tố, khóa API cho bản đồ, địa điểm và hình ảnh, nhà cung cấp tìm kiếm và giao thông công cộng, và các loại tệp được phép tải lên.',
  'help.ctx.admin-settings.bullet.1':
    '“Phương thức xác thực”: “Mật khẩu Đăng nhập”, “Đăng ký mật khẩu”, “SSO Đăng nhập”, “SSO Tự động cấp phép” và “Yêu cầu xác thực hai yếu tố (2FA)”.',
  'help.ctx.admin-settings.bullet.2':
    '“Đăng nhập một lần (OIDC)” với nhà phát hành, ứng dụng và tên hiển thị; “Đăng nhập bằng mật mã” với Relying Party ID và các nguồn gốc.',
  'help.ctx.admin-settings.bullet.3':
    '“API Key”: Google Maps, Unsplash và Amap, mỗi khóa có “Bài kiểm tra”; “Khóa được dùng vào việc gì” giới hạn khóa Google vào những tính năng bạn muốn trả tiền.',
  'help.ctx.admin-settings.bullet.4':
    '“Nhà cung cấp tìm kiếm địa điểm” và “Nhà cung cấp giao thông công cộng” chọn ai trả lời tìm kiếm và tuyến đường; “Các loại tệp được phép” giới hạn tải lên.',
  'help.ctx.admin-addons.title': 'Tiện ích bổ sung',
  'help.ctx.admin-addons.summary':
    'Các mô-đun tính năng của TREK, mỗi cái có một công tắc: Danh sách, Chi phí, Tài liệu, Vacay, Atlas, Cộng tác, Hành trình, Bộ sưu tập, Chuyến đi đường bộ, MCP, AirTrail, Dawarich và phân tích AI. Tắt nghĩa là mục điều hướng, các tuyến và API biến mất với tất cả mọi người.',
  'help.ctx.admin-addons.bullet.1': 'Mỗi tiện ích một ô với công tắc của nó và, nếu có, các hàng con cho tùy chọn.',
  'help.ctx.admin-addons.bullet.2':
    'Nhà cung cấp ảnh và nhà cung cấp tài liệu cũng xuất hiện ở đây dưới dạng ô, để có thể cung cấp Immich hoặc Synology cho người dùng.',
  'help.ctx.admin-addons.bullet.3': '“Theo dõi túi” có công tắc riêng bên dưới các ô.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Plugin bên thứ ba chạy trong tiến trình riêng bên cạnh TREK, mỗi cái với các quyền nó yêu cầu lúc cài. Cài từ danh mục, tải lên một gói, hoặc liên kết một thư mục khi đang phát triển.',
  'help.ctx.admin-plugins.bullet.1':
    'Danh sách: mọi plugin đã cài với phiên bản, trạng thái, chữ ký và các quyền nó nắm giữ; kích hoạt, hủy kích hoạt, cập nhật hoặc gỡ trên từng hàng.',
  'help.ctx.admin-plugins.bullet.2':
    '“Tải plugin lên” nhận một tệp gói; “Quét lại” nhận thư mục plugin đã liên kết để phát triển.',
  'help.ctx.admin-plugins.bullet.3':
    '“Máy chủ được phép” cho từng plugin: các địa chỉ mà plugin được gọi, vì kết nối ra ngoài bị từ chối theo mặc định.',
  'help.ctx.admin-storage.title': 'Lưu trữ',
  'help.ctx.admin-storage.summary':
    'Nơi tệp tải lên nằm: đĩa cục bộ, một bucket S3, hoặc một bản sao gương ghi vào cả hai. Mỗi danh mục tải lên có thể đi tới một backend khác nhau, và “Tình trạng” cho biết mọi backend có phản hồi không.',
  'help.ctx.admin-storage.bullet.1':
    '“Backend”: tên và loại của từng cái, với “Kiểm tra”, “Chỉnh sửa” và “Xóa”; cái nào được đặt bằng biến môi trường thì ở đây chỉ đọc.',
  'help.ctx.admin-storage.bullet.2':
    '“Danh mục”: ảnh bìa, tài liệu, ảnh hành trình và phần còn lại, mỗi loại được gán cho một backend; đổi một loại sẽ đề nghị di chuyển các tệp hiện có.',
  'help.ctx.admin-storage.bullet.3':
    '“Tình trạng”: một kiểm tra cho từng backend, và tệp hạt giống chứng minh cấu hình đúng là thứ máy chủ nhìn thấy.',
  'help.ctx.admin-notifications.title': 'Thông báo',
  'help.ctx.admin-notifications.summary':
    'Các kênh mà phiên bản cung cấp cho người dùng, và các kênh tới bạn với tư cách quản trị viên. Người dùng chọn chủ đề và URL của họ trong “Cài đặt”; bạn quyết định có những kênh nào và cấu hình email.',
  'help.ctx.admin-notifications.bullet.1':
    '“Trong ứng dụng”, “Email (SMTP)”, “Ntfy”, “Webhook” và “Web Push”: mỗi kênh một bảng, với công tắc cung cấp kênh đó cho người dùng và cấu hình phía máy chủ mà nó cần.',
  'help.ctx.admin-notifications.bullet.2':
    '“Lời nhắc chuyến đi”: máy chủ có gửi lời nhắc trước khi chuyến đi bắt đầu hay không.',
  'help.ctx.admin-notifications.bullet.3':
    '“Quản trị viên Ntfy” và “Webhook quản trị viên”: nơi các sự kiện quản trị như sao lưu thất bại hay bản phát hành mới được gửi tới, có nút kiểm tra.',
  'help.ctx.admin-mcp-tokens.title': 'MCP Truy cập',
  'help.ctx.admin-mcp-tokens.summary':
    'Mọi mã thông báo và phiên OAuth mà các ứng dụng AI nắm giữ với TREK này, trên tất cả người dùng, cùng quyền thu hồi bất kỳ cái nào.',
  'help.ctx.admin-mcp-tokens.bullet.1': '“API Mã thông báo”: ai tạo, lần dùng cuối khi nào, và “Xóa bỏ”.',
  'help.ctx.admin-mcp-tokens.bullet.2': '“OAuth Phiên”: ứng dụng, người dùng và các phạm vi được cấp, và “Thu hồi”.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Có gì mới ở TREK: lịch sử phát hành từ GitHub, phiên bản bạn đang chạy, và có bản mới hơn chưa. Việc cập nhật diễn ra bên ngoài ứng dụng, trên máy chủ.',
  'help.ctx.admin-github.bullet.1':
    '“Lịch sử phát hành” liệt kê các bản phát hành cùng ghi chú; bản mới nhất mang nhãn “Mới nhất”, và phiên bản của bạn được đánh dấu.',
  'help.ctx.admin-github.bullet.2':
    '“Đã có bản cập nhật” xuất hiện ở phần đầu trang khi có bản phát hành mới hơn, kèm cách cập nhật cho Docker và các kiểu cài đặt khác.',
  'help.ctx.admin-backup.title': 'Sao lưu',
  'help.ctx.admin-backup.summary':
    'Bản sao lưu đầy đủ của cơ sở dữ liệu và tệp tải lên, tạo bằng tay hoặc theo lịch, giữ trên máy chủ và tải xuống được dưới dạng một tệp. “Khôi phục” đưa một bản trở lại.',
  'help.ctx.admin-backup.bullet.1':
    '“Sao lưu dữ liệu”: “Tạo bản sao lưu”, và danh sách các bản hiện có với “Tải xuống”, “Khôi phục” và xóa.',
  'help.ctx.admin-backup.bullet.2':
    '“Tải lên bản sao lưu” đưa vào một tệp được tạo trên phiên bản khác hoặc vào một ngày trước đó.',
  'help.ctx.admin-backup.bullet.3':
    '“Tự động sao lưu”: bật hoặc tắt, khoảng thời gian, giờ và ngày, và giữ lại bao nhiêu bản.',
  'help.ctx.admin-audit.title': 'Lịch sử',
  'help.ctx.admin-audit.summary':
    'Nhật ký các sự kiện bảo mật và quản trị: đăng nhập và thất bại, thay đổi MFA, thay đổi người dùng và cài đặt, sao lưu và khôi phục. Chỉ đọc, mới nhất ở trên.',
  'help.ctx.admin-audit.bullet.1':
    'Mỗi sự kiện một hàng với thời gian, người dùng, hành động, tài nguyên, IP và chi tiết.',
  'help.ctx.admin-audit.bullet.2': '“Làm mới” tải lại; “Tải thêm” đi lùi xa hơn.',
  // create-user
  'help.guide.create-user.title': 'Tạo một người dùng',
  'help.guide.create-user.goal': 'Thêm một tài khoản bằng tay, không cần lời mời.',
  'help.guide.create-user.step.1': 'Nhấp “Tạo người dùng” ở đầu tab “Người dùng”.',
  'help.guide.create-user.step.2':
    'Nhập “Tên người dùng”, “Email” và “Mật khẩu”, rồi chọn “Vai trò”: “người dùng” hoặc “Quản trị viên”.',
  'help.guide.create-user.step.3': 'Nhấp “Tạo người dùng”.',
  'help.guide.create-user.result':
    'Tài khoản xuất hiện trong bảng và có thể đăng nhập ngay; hãy trao mật khẩu qua một kênh bạn tin cậy.',
  'help.guide.create-user.tip.1': 'Với người nên tự chọn mật khẩu, liên kết mời là cách vào tốt hơn.',
  'help.guide.create-user.tip.2':
    'Quản trị viên thấy trang này và nhật ký lịch sử; mọi thứ khác giống nhau cho cả hai vai trò.',
  // edit-user
  'help.guide.edit-user.title': 'Đổi vai trò hoặc mật khẩu của một người dùng',
  'help.guide.edit-user.goal': 'Nâng ai đó lên, hạ họ xuống, hoặc đưa họ vào lại sau khi mất mật khẩu.',
  'help.guide.edit-user.step.1':
    'Nhấp cây bút chì trên hàng của người dùng. “Chỉnh sửa người dùng” mở ra với thông tin tài khoản.',
  'help.guide.edit-user.step.2':
    'Đổi “Vai trò”, đặt “Mật khẩu mới”, hoặc nhấp “Đặt lại mật khẩu” khi người đó mất thiết bị chứa mật mã của họ, rồi “Lưu”.',
  'help.guide.edit-user.result':
    'Thay đổi áp dụng từ yêu cầu tiếp theo; mật khẩu mới có hiệu lực từ lần đăng nhập kế tiếp.',
  'help.guide.edit-user.tip.1':
    'Bạn không thể tự bỏ vai trò quản trị viên của mình khi bạn là quản trị viên cuối cùng.',
  'help.guide.edit-user.tip.2':
    'Đặt lại mật mã vẫn giữ mật khẩu; người đó thêm mật mã mới trong “Cài đặt”, “Tài khoản”.',
  // invite-links
  'help.guide.invite-links.title': 'Mời ai đó bằng một liên kết',
  'help.guide.invite-links.goal': 'Cho một người đăng ký trên phiên bản đóng, và vào thẳng một chuyến đi nếu bạn muốn.',
  'help.guide.invite-links.step.1': 'Dưới “Mời liên kết”, nhấp “Tạo liên kết”.',
  'help.guide.invite-links.step.2':
    'Đặt “Tối đa. Công dụng” và “Hết hạn sau”, tùy chọn “Thêm vào chuyến đi (tùy chọn)”, rồi nhấp “Tạo & Sao chép”.',
  'help.guide.invite-links.step.3':
    'Gửi liên kết đi. Mỗi hàng cho biết nó đã được dùng bao nhiêu lần và ai tạo; “Sao chép liên kết” sao chép lại, còn liên kết đã dùng hết hoặc hết hạn được đánh dấu.',
  'help.guide.invite-links.result':
    'Ai mở liên kết sẽ đăng ký với mật khẩu riêng và, nếu đã chọn chuyến đi, tham gia ngay lập tức.',
  'help.guide.invite-links.tip.1': 'Liên kết mời vẫn hoạt động ngay cả khi “Đăng ký mật khẩu” đã tắt trong “Cài đặt”.',
  'help.guide.invite-links.tip.2':
    'Một liên kết dùng một lần với thời hạn ngắn là mặc định an toàn nhất cho một người.',
  // delete-user
  'help.guide.delete-user.title': 'Xóa một người dùng',
  'help.guide.delete-user.goal': 'Gỡ một tài khoản và mọi thứ chỉ thuộc về nó.',
  'help.guide.delete-user.step.1': 'Nhấp biểu tượng thùng rác trên hàng của người dùng và xác nhận “Xóa người dùng”.',
  'help.guide.delete-user.result':
    'Tài khoản, các chuyến đi của riêng nó và các hành trình của nó biến mất; chuyến đi chia sẻ với người khác vẫn ở lại với các thành viên còn lại.',
  'help.guide.delete-user.tip.1': 'Không có hoàn tác. Hãy sao lưu trước nếu bạn không chắc.',
  'help.guide.delete-user.tip.2': 'Không thể xóa quản trị viên cuối cùng; hãy đặt người khác làm quản trị viên trước.',
  // permissions
  'help.guide.permissions.title': 'Quyết định ai được làm gì',
  'help.guide.permissions.goal': 'Đặt, với từng thao tác, vai trò nào được phép làm trên TREK này.',
  'help.guide.permissions.step.1':
    'Trong “Cài đặt quyền”, tìm thao tác trong nhóm của nó, chẳng hạn “Xóa chuyến đi” dưới “Quản lý chuyến đi”, và chọn mức: “Mọi người”, “Thành viên”, “Người tạo” hoặc “Chỉ quản trị viên”. Hàng đã thay đổi được đánh dấu “tùy chỉnh”.',
  'help.guide.permissions.step.2': 'Nhấp “Lưu”. “Đặt lại về mặc định” đưa mọi hàng về mức có sẵn.',
  'help.guide.permissions.result':
    'Quy tắc áp dụng cho mọi chuyến đi cùng lúc; nút và menu của những người dưới mức đó biến mất.',
  'help.guide.permissions.tip.1': '“Người tạo” là người đã tạo chuyến đi; quản trị viên luôn được làm mọi thứ.',
  'help.guide.permissions.tip.2':
    'Hạ mức thay vì xóa thành viên: thành viên không được chỉnh sửa vẫn có thể đọc và bình luận.',
  // default-map
  'help.guide.default-map.title': 'Đặt mặc định bản đồ cho người dùng mới',
  'help.guide.default-map.goal': 'Cho mọi tài khoản mới một bản đồ hoạt động mà không cần mã thông báo cá nhân.',
  'help.guide.default-map.step.1':
    'Dưới “Bản đồ”, chọn “Công cụ bản đồ” và, với Mapbox hoặc MapLibre, “Kiểu bản đồ”, “Mã thông báo Mapbox được chia sẻ” và “Chế độ chất lượng cao”; với bản đồ raster, “Mẫu bản đồ” và “Khóa CARTO được chia sẻ”.',
  'help.guide.default-map.step.2':
    'Bên cạnh bất kỳ trường nào bạn đã đổi, “cài lại” trả về lựa chọn riêng của TREK. “Cài đặt người dùng mặc định” ở bên trái làm điều tương tự cho “Chế độ màu”, đơn vị và tiền tệ.',
  'help.guide.default-map.result':
    'Tài khoản mới bắt đầu với các giá trị này; ai đã tự đặt bản đồ trong “Cài đặt” vẫn giữ của mình.',
  'help.guide.default-map.tip.1':
    'Mã thông báo nhập ở đây được dùng chung bởi tất cả những ai không có mã riêng, nên hãy để ý hạn mức của nó.',
  'help.guide.default-map.tip.2': 'Tài khoản hiện có chưa từng chạm vào tab bản đồ cũng theo các mặc định này.',
  // packing-templates
  'help.guide.packing-templates.title': 'Xây dựng một mẫu đóng gói',
  'help.guide.packing-templates.goal': 'Cho các chuyến đi một danh sách đóng gói để bắt đầu thay vì danh sách trống.',
  'help.guide.packing-templates.step.1': 'Nhấp “Mẫu mới”, gõ tên và xác nhận bằng dấu tích.',
  'help.guide.packing-templates.step.2':
    'Mở mẫu và nhấp “Thêm danh mục”; dưới mỗi danh mục, dấu + thêm món đồ, và một món đồ chỉ cần tên.',
  'help.guide.packing-templates.step.3':
    'Mọi thứ được lưu ngay khi bạn làm. Bút chì đổi tên mẫu, danh mục hoặc món đồ, thùng rác xóa nó.',
  'help.guide.packing-templates.result':
    'Mẫu được đề xuất trên danh sách đóng gói của mọi chuyến đi; áp dụng nó sẽ sao chép các món đồ, nên chuyến đi có thể tự do thay đổi.',
  'help.guide.packing-templates.tip.1':
    'Mỗi loại chuyến đi một mẫu, biển, thành phố, leo núi, tốt hơn một danh sách khổng lồ.',
  'help.guide.packing-templates.tip.2': 'Xóa một mẫu không ảnh hưởng tới các chuyến đi đã áp dụng nó.',
  'help.guide.packing-templates.tip.3':
    'Mẫu ghi nhớ cân nặng, số lượng và túi của từng món đồ, nên chuyến đi áp dụng nó sẽ có các túi được xếp giống hệt.',
  // categories
  'help.guide.categories.title': 'Quản lý bộ danh mục',
  'help.guide.categories.goal':
    'Quyết định địa điểm và bộ sưu tập có thể mang những danh mục nào, và chúng trông ra sao.',
  'help.guide.categories.step.1':
    'Nhấp “Danh mục mới”, đặt tên, chọn biểu tượng và màu; “Xem trước” hiển thị kết quả. Nhấp “Tạo nên”.',
  'help.guide.categories.step.2':
    'Di chuột lên một danh mục trong danh sách để chỉnh sửa hoặc xóa. Xóa sẽ hỏi xác nhận.',
  'help.guide.categories.result':
    'Bộ danh mục áp dụng ở mọi nơi cùng lúc: trình xem địa điểm, ghim bản đồ, Bộ sưu tập và các bộ lọc.',
  'help.guide.categories.tip.1': 'Địa điểm giữ id danh mục, nên đổi tên một danh mục sẽ đổi tên nó trên mọi địa điểm.',
  'help.guide.categories.tip.2':
    'Danh mục bị xóa để lại các địa điểm không có danh mục; hãy gán lại trước nếu điều đó quan trọng.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Duy trì kỳ nghỉ học bằng tay',
  'help.guide.school-holiday-catalog.goal': 'Bao phủ một quốc gia hoặc khu vực mà nguồn kỳ nghỉ tích hợp sẵn không có.',
  'help.guide.school-holiday-catalog.step.1':
    'Dưới “Kỳ nghỉ học”, nhấp “Thêm quốc gia”, nhập “Quốc gia” và “Mã quốc gia (ví dụ: US)”, rồi “Lưu”; sau đó “Thêm khu vực” cho từng phần khác biệt của nó.',
  'help.guide.school-holiday-catalog.step.2':
    'Nhấp một khu vực để mở “Khu vực hoặc học khu”: “Thêm kỳ nghỉ”, cho mỗi kỳ một “Tên kỳ nghỉ”, “Ngày bắt đầu” và “Ngày kết thúc”, rồi “Lưu”. Thùng rác gỡ một kỳ nghỉ, một khu vực hoặc, khi không còn khu vực nào, một quốc gia.',
  'help.guide.school-holiday-catalog.result':
    'Người dùng tìm thấy quốc gia và khu vực trong “Cài đặt” của Vacay và thấy các kỳ nghỉ trên lưới năm của họ.',
  'help.guide.school-holiday-catalog.tip.1':
    'Khu vực từ nguồn tích hợp sẵn không chỉnh sửa được ở đây; hãy thêm một khu vực thủ công bên cạnh nếu có ngày sai.',
  // auth-methods
  'help.guide.auth-methods.title': 'Quyết định cách mọi người đăng nhập',
  'help.guide.auth-methods.goal': 'Mở hoặc đóng đăng nhập bằng mật khẩu, SSO và đăng ký, và yêu cầu 2FA.',
  'help.guide.auth-methods.step.1':
    'Dưới “Phương thức xác thực”, bật hoặc tắt “Mật khẩu Đăng nhập” và “Đăng ký mật khẩu”. Tắt đăng ký nghĩa là tài khoản mới chỉ qua liên kết mời, SSO hoặc tạo bằng tay.',
  'help.guide.auth-methods.step.2':
    '“SSO Đăng nhập” và “SSO Tự động cấp phép” cần “Đăng nhập một lần (OIDC)” được cấu hình bên dưới; tự động cấp phép tạo tài khoản lần đầu ai đó đăng nhập qua SSO.',
  'help.guide.auth-methods.step.3':
    '“Yêu cầu xác thực hai yếu tố (2FA)” buộc mọi đăng nhập bằng mật khẩu phải thiết lập ứng dụng xác thực ở lần đăng nhập tiếp theo. “Đăng nhập bằng mật mã” cần Relying Party ID và các nguồn gốc mà TREK của bạn được truy cập.',
  'help.guide.auth-methods.result': 'Trang đăng nhập cung cấp đúng những phương thức bạn để bật.',
  'help.guide.auth-methods.tip.1':
    'Một cảnh báo xuất hiện trước khi bạn tự khóa mình ra ngoài: ít nhất một lối vào cho quản trị viên vẫn được bật.',
  'help.guide.auth-methods.tip.2': 'Giá trị đặt qua biến môi trường hiển thị chỉ đọc ở đây.',
  // oidc
  'help.guide.oidc.title': 'Kết nối đăng nhập một lần',
  'help.guide.oidc.goal': 'Cho mọi người đăng nhập bằng nhà cung cấp danh tính của bạn.',
  'help.guide.oidc.step.1':
    'Dưới “Đăng nhập một lần (OIDC)”, nhập “Tên hiển thị” cho nút và “Nhà phát hành URL”, “Client ID” và “Client Secret” từ nhà cung cấp của bạn, rồi “Lưu”.',
  'help.guide.oidc.step.2': 'Bật “SSO Đăng nhập” dưới “Phương thức xác thực”.',
  'help.guide.oidc.result':
    'Trang đăng nhập hiện nút SSO; khi “SSO Tự động cấp phép” bật, người dùng lần đầu tự động có tài khoản.',
  'help.guide.oidc.tip.1':
    'URI chuyển hướng mà nhà cung cấp của bạn cần là địa chỉ TREK của bạn cộng với đường dẫn callback OIDC trong tài liệu.',
  'help.guide.oidc.tip.2':
    'Ánh xạ claim quyết định nhóm SSO nào trở thành quản trị viên; xem trang OIDC trong tài liệu.',
  // instance-keys
  'help.guide.instance-keys.title': 'Nhập các khóa API',
  'help.guide.instance-keys.goal': 'Mở khóa tìm kiếm địa điểm Google, ảnh bìa Unsplash và Amap cho toàn phiên bản.',
  'help.guide.instance-keys.step.1':
    'Dưới “API Key”, dán “Google Maps API Key” và nhấp “Bài kiểm tra”; trường sẽ cho biết khóa có phản hồi không.',
  'help.guide.instance-keys.step.2':
    'Dưới “Khóa được dùng vào việc gì”, chỉ bật những tính năng bạn muốn tính phí vào khóa đó: tự động hoàn thành, chi tiết, ảnh, làm giàu, nhật ký tìm kiếm địa điểm.',
  'help.guide.instance-keys.step.3':
    '“Khóa API Unsplash” cung cấp tìm kiếm ảnh bìa; “Khóa API Amap (高德地图)” tìm kiếm địa điểm ở Trung Quốc. Kiểm tra từng khóa theo cùng cách.',
  'help.guide.instance-keys.result':
    'Người dùng có các tính năng mà không cần khóa riêng; không có khóa Google, TREK tìm kiếm qua bộ OpenStreetMap miễn phí và TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'Khóa cá nhân của một người dùng trong “Cài đặt” thắng khóa của phiên bản đối với người dùng đó.',
  'help.guide.instance-keys.tip.2': 'Khóa cũng có thể đến từ biến môi trường; những khóa đó hiển thị chỉ đọc ở đây.',
  'help.guide.instance-keys.tip.3':
    '“Giới hạn lượt gọi Google mỗi ngày” giới hạn mức TREK được dùng khóa mỗi ngày; huy hiệu cạnh tiêu đề đếm số lượt gọi hôm nay. Khi đạt giới hạn, tìm kiếm dùng OpenStreetMap cho đến ngày hôm sau (UTC).',
  // places-transit
  'help.guide.places-transit.title': 'Chọn nhà cung cấp tìm kiếm và giao thông công cộng',
  'help.guide.places-transit.goal': 'Quyết định ai trả lời tìm kiếm địa điểm và tuyến giao thông công cộng.',
  'help.guide.places-transit.step.1':
    'Dưới “Nhà cung cấp tìm kiếm địa điểm”, chọn “Tự động”, “Google Places”, “Amap (高德地图)” hoặc “OpenStreetMap”. “Tự động” dùng khóa tốt nhất đang có.',
  'help.guide.places-transit.step.2':
    'Dưới “Nhà cung cấp giao thông công cộng”, chọn “Transitous (miễn phí)”, toàn cầu và không cần khóa, hoặc “Google”, cần khóa Google.',
  'help.guide.places-transit.result': 'Mọi ô tìm kiếm và mọi tuyến giao thông công cộng trong TREK theo lựa chọn này.',
  'help.guide.places-transit.tip.1': 'Nhà cung cấp thiếu khóa hiện cảnh báo ở đây và quay về OpenStreetMap.',
  'help.guide.places-transit.tip.2':
    'Tuyến giao thông công cộng của Google tính phí theo yêu cầu; Transitous thì không.',
  // file-types
  'help.guide.file-types.title': 'Giới hạn các loại tệp',
  'help.guide.file-types.goal': 'Quyết định tệp tải lên được có những phần mở rộng nào.',
  'help.guide.file-types.step.1':
    'Dưới “Các loại tệp được phép”, chỉnh sửa danh sách phần mở rộng phân cách bằng dấu phẩy và lưu.',
  'help.guide.file-types.result':
    'Tải lên bất kỳ loại nào khác bị từ chối với thông báo rõ ràng, trong tài liệu, nhật ký và ảnh bìa.',
  'help.guide.file-types.tip.1':
    'Giữ các loại ảnh trong danh sách; ảnh bìa và ảnh hành trình đi qua cùng một kiểm tra.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Bật hoặc tắt một tiện ích bổ sung',
  'help.guide.toggle-addon.goal': 'Cung cấp một mô-đun tính năng cho mọi người, hoặc rút nó đi.',
  'help.guide.toggle-addon.step.1':
    'Gạt công tắc trên ô của tiện ích. Mục điều hướng xuất hiện hoặc biến mất với mọi người cùng lúc.',
  'help.guide.toggle-addon.step.2':
    'Một số ô có hàng con cho tùy chọn, như “Theo dõi túi” dưới “Danh sách” hay nhà cung cấp ảnh dưới “Hành trình”; chúng chỉ hiện khi tiện ích đang bật.',
  'help.guide.toggle-addon.result': 'Dữ liệu của tiện ích đã tắt được giữ lại; bật lại sẽ hiện lại nó.',
  'help.guide.toggle-addon.tip.1': 'Tắt MCP gỡ bỏ điểm cuối và các phần “Tích hợp” phụ thuộc vào nó.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas và Hành trình là các tiện ích được người dùng yêu cầu nhiều nhất; Tài liệu cần lưu trữ cho tệp tải lên.',
  // install-plugin
  'help.guide.install-plugin.title': 'Cài một plugin',
  'help.guide.install-plugin.goal': 'Thêm một plugin bên thứ ba và cấp cho nó đúng các quyền nó yêu cầu.',
  'help.guide.install-plugin.step.1':
    'Mở “Khám phá”, chọn một plugin và nhấp “Cài đặt”; hoặc nhấp “Tải plugin lên” và chọn một gói .zip hoặc .tar.gz.',
  'help.guide.install-plugin.step.2':
    'Quay lại “Đã cài đặt”, đọc hàng: plugin được đọc hay ghi gì, các máy chủ nó gọi và nó có được ký không. Bật “Bật plugin”.',
  'help.guide.install-plugin.step.3':
    'Menu của hàng có “Khởi động lại”, “Xem nhật ký lỗi”, “Máy chủ được phép” và “Đổi phiên bản…”; “Xóa bỏ” gỡ cài đặt nó. Bản cập nhật được đề xuất trên hàng khi có phiên bản mới hơn, và bản nào xin quyền mới sẽ tắt cho tới khi bạn phê duyệt.',
  'help.guide.install-plugin.result':
    'Plugin chạy trong tiến trình riêng; những gì nó thêm vào, tiện ích, lớp bản đồ, công cụ, xuất hiện ở nơi plugin khai báo.',
  'help.guide.install-plugin.tip.1': '“Quét lại” nhận thư mục plugin đã liên kết để phát triển mà không cần gói.',
  'help.guide.install-plugin.tip.2': 'Plugin chưa ký được đánh dấu như vậy; chỉ cài khi bạn tin nguồn của nó.',
  // storage-backends
  'help.guide.storage-backends.title': 'Chuyển tệp tải lên sang S3 hoặc bản sao gương',
  'help.guide.storage-backends.goal': 'Giữ tệp trên lưu trữ đối tượng, hoặc trên cả đĩa lẫn bucket.',
  'help.guide.storage-backends.step.1':
    'Dưới “Backend”, nhấp “Thêm backend”, đặt “Tên”, chọn “Loại”, “Cục bộ”, “S3” hoặc “Bản sao gương”, điền các trường và “Áp dụng”. “Kiểm tra” kiểm tra kết nối, “Lưu thay đổi” ghi lại.',
  'help.guide.storage-backends.step.2':
    'Dưới “Danh mục”, gán từng danh mục tải lên cho một backend. Đổi một danh mục sẽ hỏi “Di chuyển các đối tượng hiện có” hay “Chỉ định tuyến các ghi mới”.',
  'help.guide.storage-backends.step.3':
    '“Tình trạng” ở trên cùng kiểm tra mọi backend; mục màu đỏ nêu tên thứ đã thất bại.',
  'help.guide.storage-backends.result': 'Tệp tải lên mới đi tới backend được gán; tệp đã di chuyển được phục vụ từ đó.',
  'help.guide.storage-backends.tip.1':
    'Backend cấu hình qua biến môi trường được hiển thị nhưng không chỉnh sửa được ở đây.',
  'help.guide.storage-backends.tip.2':
    'Bản sao gương ghi vào cả hai đích và đọc từ đích đầu tiên; dùng nó để di chuyển mà không gián đoạn.',
  // channels-instance
  'help.guide.channels-instance.title': 'Cấu hình các kênh thông báo',
  'help.guide.channels-instance.goal': 'Quyết định người dùng được chọn những kênh nào, và thiết lập email.',
  'help.guide.channels-instance.step.1':
    'Dưới “Email (SMTP)”, nhập SMTP Host, SMTP Port, SMTP User, SMTP Password và From Address; “Gửi email kiểm tra” gửi một thư tới bạn.',
  'help.guide.channels-instance.step.2':
    'Bật “Web Push”, “Ntfy” và “Webhook” để cung cấp chúng; người dùng sau đó bật thông báo đẩy cho từng thiết bị, hoặc nhập chủ đề hoặc URL của họ, trong “Cài đặt”, “Thông báo”.',
  'help.guide.channels-instance.step.3':
    '“Lời nhắc chuyến đi” bật tắt lời nhắc trước khi chuyến đi bắt đầu; “Trong ứng dụng” luôn bật và ở đây chỉ được giải thích.',
  'help.guide.channels-instance.result': 'Tab “Thông báo” của mọi người dùng hiện các kênh bạn đã bật.',
  'help.guide.channels-instance.tip.1':
    'Máy chủ ntfy mặc định nhập ở đây được điền sẵn cho người dùng; họ vẫn có thể nêu máy chủ riêng.',
  'help.guide.channels-instance.tip.2': 'Kênh của plugin tự xuất hiện khi một plugin có khả năng đó được kích hoạt.',
  // admin-channels
  'help.guide.admin-channels.title': 'Nhận sự kiện quản trị trên điện thoại của bạn',
  'help.guide.admin-channels.goal': 'Biết về sao lưu thất bại, bản phát hành mới và các sự kiện khác của phiên bản.',
  'help.guide.admin-channels.step.1':
    'Dưới “Quản trị viên Ntfy”, nhập một chủ đề và, nếu cần, máy chủ và mã thông báo; dưới “Webhook quản trị viên” một URL.',
  'help.guide.admin-channels.step.2': 'Nhấp “Gửi bài kiểm tra” hoặc “Gửi webhook thử nghiệm” để thấy một tin nhắn tới.',
  'help.guide.admin-channels.result':
    'Sự kiện quản trị đi tới đó bên cạnh chuông trong ứng dụng của mọi quản trị viên.',
  'help.guide.admin-channels.tip.1':
    'Giữ chủ đề quản trị tách khỏi chủ đề cá nhân của bạn, để một sự cố không chìm trong tin về chuyến đi.',
  'help.guide.admin-channels.tip.2':
    '“Mặc định cho người dùng” đặt trạng thái ban đầu cho thông báo của mọi người dùng, theo từng sự kiện và kênh: “Bật”, “Tắt” hoặc “Chặn”, tức là tắt cho tất cả mọi người và hiện là bị khóa trong cài đặt của họ.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Thu hồi quyền truy cập của AI',
  'help.guide.mcp-tokens-admin.goal':
    'Xem và cắt mọi mã thông báo và phiên mà một ứng dụng AI nắm giữ, cho bất kỳ người dùng nào.',
  'help.guide.mcp-tokens-admin.step.1':
    'Dưới “API Mã thông báo”, tìm mã theo người dùng và tên; thùng rác xóa nó và ứng dụng dừng ngay lập tức.',
  'help.guide.mcp-tokens-admin.step.2':
    'Dưới “OAuth Phiên”, tương tự cho các ứng dụng chạy trên trình duyệt: ứng dụng, người dùng và ngày, và thùng rác thu hồi phiên.',
  'help.guide.mcp-tokens-admin.result': 'Ứng dụng phải được người dùng của nó kết nối lại; không có gì khác thay đổi.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Phạm vi cho bạn biết một ứng dụng có thể làm gì; phạm vi chỉ đọc để lại cũng vô hại.',
  'help.guide.mcp-tokens-admin.tip.2': 'Tắt tiện ích MCP thu hồi mọi thứ cùng lúc.',
  // release-history
  'help.guide.release-history.title': 'Kiểm tra bản phát hành mới',
  'help.guide.release-history.goal': 'Biết TREK của bạn có mới nhất không và phiên bản tiếp theo mang gì tới.',
  'help.guide.release-history.step.1':
    'Khi có bản phát hành mới hơn, “Đã có bản cập nhật” hiện ở đầu trang quản trị; “Xem trên GitHub” mở nó, và “Cách cập nhật” giải thích việc cập nhật cho Docker và các kiểu cài đặt khác.',
  'help.guide.release-history.step.2':
    '“Lịch sử phát hành” liệt kê mọi bản phát hành cùng ghi chú; “Hiển thị chi tiết” mở rộng chúng, bản mới nhất mang nhãn “Mới nhất”, và “Tải thêm” đi lùi xa hơn.',
  'help.guide.release-history.result':
    'Việc cập nhật diễn ra trên máy chủ, bằng cách kéo image mới hoặc build tag mới; thư mục dữ liệu vẫn nguyên.',
  'help.guide.release-history.tip.1': 'Hãy sao lưu trước khi cập nhật; tab “Sao lưu” ở ngay bên cạnh.',
  'help.guide.release-history.tip.2':
    'Bản tiền phát hành được hiển thị nhưng không được báo là cập nhật trừ khi bạn đang chạy một bản như vậy.',
  // create-backup
  'help.guide.create-backup.title': 'Tạo và khôi phục một bản sao lưu',
  'help.guide.create-backup.goal': 'Chụp toàn bộ phiên bản, giữ một bản sao ở nơi khác, và có thể đưa nó trở lại.',
  'help.guide.create-backup.step.1':
    'Dưới “Sao lưu dữ liệu”, nhấp “Tạo bản sao lưu”. Nó đóng gói cơ sở dữ liệu và tệp tải lên thành một tệp trên máy chủ.',
  'help.guide.create-backup.step.2':
    '“Tải xuống” giữ một bản sao ngoài máy; thùng rác xóa các bản cũ để giải phóng dung lượng.',
  'help.guide.create-backup.step.3':
    '“Khôi phục” trên một bản sao lưu, hoặc “Tải lên bản sao lưu” với một tệp, thay thế dữ liệu hiện tại sau khi “Khôi phục bản sao lưu?” hỏi một lần.',
  'help.guide.create-backup.result':
    'Khôi phục đưa người dùng, chuyến đi, tệp và cài đặt về đúng thời điểm của bản sao lưu; mọi người bị đăng xuất.',
  'help.guide.create-backup.tip.1':
    'Khôi phục là hành động duy nhất ở đây không thể hoàn tác. Hãy tạo một bản sao lưu mới trước.',
  'help.guide.create-backup.tip.2':
    'Bản sao lưu nằm trong thư mục dữ liệu; một bản sao trên máy khác mới là thứ khiến chúng thành sao lưu thật sự.',
  // auto-backup
  'help.guide.auto-backup.title': 'Lên lịch sao lưu',
  'help.guide.auto-backup.goal': 'Để máy chủ tự sao lưu và chỉ giữ vài bản gần nhất.',
  'help.guide.auto-backup.step.1':
    'Dưới “Tự động sao lưu”, bật “Bật tự động sao lưu” và chọn “Khoảng thời gian”, “Chạy theo giờ” và, với hàng tuần hoặc hàng tháng, “Ngày trong tuần” hoặc “Ngày trong tháng”.',
  'help.guide.auto-backup.step.2':
    '“Xóa bản sao lưu cũ sau” đặt thời gian giữ một bản sao lưu; bản cũ hơn bị xóa khi bản mới được tạo.',
  'help.guide.auto-backup.result':
    'Bản sao lưu xuất hiện trong danh sách theo lịch; thất bại được gửi tới các kênh quản trị.',
  'help.guide.auto-backup.tip.1': 'Thời gian theo múi giờ của máy chủ, được hiển thị trong tab “Lịch sử”.',
  'help.guide.auto-backup.tip.2': 'Dung lượng trên máy chủ là hữu hạn; giữ ba tới năm bản thường là đủ.',
  // audit-log
  'help.guide.audit-log.title': 'Đọc nhật ký lịch sử',
  'help.guide.audit-log.goal': 'Tìm ra ai đã làm gì, và khi nào.',
  'help.guide.audit-log.step.1':
    'Đọc các hàng: thời gian, người dùng, hành động, tài nguyên, IP và chi tiết, mới nhất ở trên. Hành động được đặt tên theo việc đã xảy ra, như đăng nhập thất bại, thay đổi MFA hay khôi phục.',
  'help.guide.audit-log.step.2': '“Làm mới” tải lại phần đầu; “Tải thêm” đi lùi xa hơn.',
  'help.guide.audit-log.result': 'Một dấu vết bạn có thể đưa cho bất kỳ ai hỏi vì sao thứ gì đó đã thay đổi.',
  'help.guide.audit-log.tip.1': 'Thời gian hiển thị theo múi giờ của máy chủ, được nêu tên phía trên bảng.',
  'help.guide.audit-log.tip.2': 'Nhật ký chỉ thêm vào; không gì ở đây có thể chỉnh sửa hay xóa từ ứng dụng.',
  // document-providers
  'help.guide.document-providers.title': 'Cung cấp một kho tài liệu',
  'help.guide.document-providers.goal': 'Quyết định chuyến đi được phép giữ tài liệu đồng bộ với những kho nào.',
  'help.guide.document-providers.step.1':
    'Ô “Tài liệu” mang các kho dưới dạng hàng trên kệ của nó: Paperless-ngx, Papra, Nextcloud, OpenCloud và Synology Drive. Cả năm đều bắt đầu ở trạng thái tắt, và kệ chỉ có mặt khi chính “Tài liệu” đang bật.',
  'help.guide.document-providers.step.2':
    'Gạt công tắc trên hàng Nextcloud. Thông báo ghi “Đã cập nhật tiện ích bổ sung”, và từ giờ chủ chuyến đi thấy “Đồng bộ tài liệu” trong tab “Tập tin” của chuyến đi họ, với Nextcloud dưới “Kết nối nhà cung cấp”.',
  'help.guide.document-providers.result':
    'Kho được cung cấp trên mọi chuyến đi của TREK này; chưa có gì được kết nối cho đến khi một chủ chuyến đi làm việc đó.',
  'help.guide.document-providers.tip.1':
    'Ở đây chỉ quyết định một kho có được phép cung cấp hay không. Địa chỉ và thông tin đăng nhập thuộc về một chuyến đi và được chủ chuyến đi nhập trong tab “Tập tin” của nó, không bao giờ trong bảng quản trị.',
  'help.guide.document-providers.tip.2':
    'Tắt “Tài liệu” sẽ tắt mọi kho theo, và không thể bật một kho khi “Tài liệu” đang tắt: máy chủ trả lời “Enable the Documents addon first”. Một kho trên mạng riêng của bạn còn cần ALLOW_INTERNAL_NETWORK=true trên máy chủ.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Chuyến đi',
  'help.ctx.trip.summary':
    'Một chuyến đi, trọn vẹn: kế hoạch với các ngày, bản đồ và địa điểm, cùng các tab cho di chuyển, đặt chỗ, danh sách, chi phí, tập tin và cộng tác. Mỗi phần đó có màn hình trợ giúp riêng bên dưới màn hình này.',
  'help.ctx.trip.bullet.1':
    'Thanh tab: “Kế hoạch”, “Di chuyển”, “Đặt”, “Danh sách”, “Chi phí”, “Tập tin” và “Cộng tác”. Tiện ích bổ sung và plugin quyết định tab nào có trên TREK của bạn.',
  'help.ctx.trip.bullet.2':
    '“Kế hoạch” gồm ba cột: các ngày bên trái, bản đồ ở giữa, địa điểm bên phải. Đặt chỗ và di chuyển nằm trong kế hoạch, tại điểm dừng và giữa các điểm dừng; các tab liệt kê chúng.',
  'help.ctx.trip.bullet.3':
    '“Chia sẻ” ở góc trên bên phải mở ra những người trong chuyến đi: thành viên, khách, liên kết mời và liên kết công khai chỉ đọc.',
  'help.ctx.trip.bullet.4':
    'Tiêu đề, ngày, ảnh bìa và tiền tệ được sửa từ “Chuyến đi”, bằng cây bút chì trên thẻ chuyến đi.',
  'help.ctx.trip.bullet.5':
    'Tab nhỏ ở mép trong của một cột sẽ gập cột đó đi và bản đồ chiếm chỗ; vạch chia mỏng cạnh cột thay đổi độ rộng của nó.',
  'help.ctx.trip.bullet.6': 'Mũi tên hoàn tác trên thanh công cụ của các ngày lấy lại thay đổi gần nhất trên kế hoạch.',
  // add-member
  'help.guide.add-member.title': 'Thêm thành viên',
  'help.guide.add-member.goal': 'Cho một người có tài khoản TREK quyền truy cập chuyến đi này.',
  'help.guide.add-member.step.1': 'Nhấp “Chia sẻ” ở góc trên bên phải.',
  'help.guide.add-member.step.2': 'Dưới “Mời người dùng”, chọn người đó trong danh sách và nhấp “Mời”.',
  'help.guide.add-member.step.3':
    'Người đó giờ xuất hiện dưới “Truy cập”. Vương miện đánh dấu người sở hữu; biểu tượng ở cuối hàng xóa quyền truy cập trở lại.',
  'help.guide.add-member.result':
    'Thành viên xem và sửa chuyến đi như bạn, trong các mức mà quản trị viên đã đặt dưới “Cài đặt quyền”.',
  'help.guide.add-member.tip.1':
    'Ai không có trong danh sách là chưa có tài khoản TREK: thêm họ làm khách, hoặc để họ đăng ký qua liên kết mời.',
  'help.guide.add-member.tip.2':
    'Con số cạnh “Truy cập” đếm số người trong chuyến đi; khách được liệt kê riêng ở bên dưới.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Mời bằng liên kết',
  'help.guide.trip-invite-link.goal': 'Để mọi người tự tham gia chuyến đi.',
  'help.guide.trip-invite-link.step.1':
    'Nhấp “Chia sẻ”, rồi dưới “Liên kết mời tham gia chuyến đi” nhấp “Tạo liên kết mời”.',
  'help.guide.trip-invite-link.step.2':
    'Nhấp “Sao chép” và gửi liên kết. Bất kỳ ai có tài khoản TREK mở nó sẽ tham gia với tư cách thành viên.',
  'help.guide.trip-invite-link.step.3':
    '“Tạo lại” thay thế liên kết và làm liên kết cũ vô dụng; “Vô hiệu hóa” tắt nó đi.',
  'help.guide.trip-invite-link.result': 'Ai mở liên kết sẽ có mặt trong chuyến đi và hiện dưới “Truy cập”.',
  'help.guide.trip-invite-link.tip.1':
    'Người không có tài khoản không dùng được. Quản trị viên phát liên kết đăng ký dưới “Sự quản lý”, “Người dùng”, và có thể gắn một liên kết với chuyến đi này.',
  'help.guide.trip-invite-link.tip.2':
    'Tạo lại khi liên kết đã đi nhầm vào cuộc trò chuyện khác: liên kết cũ ngừng hoạt động ngay lập tức.',
  // add-guest
  'help.guide.add-guest.title': 'Thêm khách không có tài khoản',
  'help.guide.add-guest.goal': 'Tính cả một người không dùng TREK.',
  'help.guide.add-guest.step.1': 'Nhấp “Chia sẻ” và cuộn tới “Khách”.',
  'help.guide.add-guest.step.2': 'Gõ tên vào “Tên khách” và nhấp “Thêm khách”.',
  'help.guide.add-guest.result':
    'Khách có thể được gán vào chi phí, món đồ cần mang và việc cần làm, nhưng không thể đăng nhập.',
  'help.guide.add-guest.tip.1':
    'Bút chì đổi tên khách; biểu tượng ở cuối hàng xóa khách cùng với các phần chia và phân công của họ.',
  'help.guide.add-guest.tip.2': 'Nếu người đó có tài khoản sau này, hãy mời họ làm thành viên và xóa khách đi.',
  // public-link
  'help.guide.public-link.title': 'Đăng liên kết chỉ đọc',
  'help.guide.public-link.goal': 'Cho những người không nên sửa chuyến đi xem nó.',
  'help.guide.public-link.step.1':
    'Nhấp “Chia sẻ”; ở bên phải, dưới “Liên kết công khai”, đánh dấu những gì liên kết được phép hiển thị. “Bản đồ & Kế hoạch” luôn bật; “Đặt chỗ”, “Đóng gói”, “Chi phí” và “Trò chuyện” tùy bạn chọn.',
  'help.guide.public-link.step.2': 'Nhấp “Tạo liên kết”, rồi “Sao chép”.',
  'help.guide.public-link.step.3': 'Các dấu chọn có thể thay đổi khi liên kết còn tồn tại; “Xóa liên kết” dừng nó.',
  'help.guide.public-link.result':
    'Bất kỳ ai có liên kết đều xem được các phần đã chọn mà không cần đăng nhập và không thể thay đổi gì.',
  'help.guide.public-link.tip.1':
    'Liên kết không được liệt kê ở đâu cả; ai có nó đều mở được, nên hãy coi nó như mật khẩu.',
  'help.guide.public-link.tip.2': 'Để cấp quyền sửa, hãy thêm người đó làm thành viên thay vì thế.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Chuyển giao chuyến đi hoặc rời khỏi nó',
  'help.guide.transfer-ownership.goal':
    'Đặt người khác làm chủ sở hữu, hoặc rút khỏi một chuyến đi không phải của bạn.',
  'help.guide.transfer-ownership.step.1':
    'Nhấp “Chia sẻ”. Dưới “Truy cập”, vương miện trên hàng của một thành viên đặt người đó làm chủ sở hữu; xác nhận câu hỏi.',
  'help.guide.transfer-ownership.step.2':
    '“Rời khỏi chuyến đi” trên hàng của chính bạn đưa bạn ra khỏi chuyến đi; nếu là chủ sở hữu, hãy chuyển giao trước.',
  'help.guide.transfer-ownership.result':
    'Chủ sở hữu mới quản lý thành viên và có thể xóa chuyến đi; bạn vẫn là thành viên bình thường.',
  'help.guide.transfer-ownership.tip.1':
    'Chủ sở hữu là người đã tạo chuyến đi cho đến khi nó được chuyển giao; chỉ riêng họ mới xóa được chuyến đi.',
  'help.guide.transfer-ownership.tip.2':
    '“Xóa quyền truy cập” trên hàng của người khác là cùng nút đó theo chiều ngược lại: chủ sở hữu đưa một thành viên ra.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Nhường chỗ cho bản đồ',
  'help.guide.collapse-columns.goal': 'Gập một cột lại hoặc cho nó rộng hơn.',
  'help.guide.collapse-columns.step.1':
    'Nhấp tab nhỏ ở mép trong của cột các ngày, cái có biểu tượng bảng điều khiển, để gập cột đi; bản đồ chiếm chỗ đó. Cột địa điểm có tab nhỏ giống vậy.',
  'help.guide.collapse-columns.step.2':
    'Một cột đã gập để lại một ô ở góc bản đồ, “Kế hoạch” cho các ngày và “Địa điểm” cho các địa điểm. Nhấp vào ô đó để đưa cột trở lại.',
  'help.guide.collapse-columns.step.3': 'Kéo vạch chia mỏng giữa cột và bản đồ để thay đổi độ rộng của cột.',
  'help.guide.collapse-columns.result': 'Độ rộng được ghi nhớ; các cột trở lại ở trạng thái mở trong lần truy cập sau.',
  'help.guide.collapse-columns.tip.1': 'Có thể gập cả hai cột cùng lúc để chỉ xem bản đồ.',
  'help.guide.collapse-columns.tip.2':
    'Trên điện thoại không có cột: “Kế hoạch” và “Địa điểm” là hai nút ở dưới cùng bản đồ.',
  // undo-change
  'help.guide.undo-change.title': 'Hoàn tác thay đổi gần nhất',
  'help.guide.undo-change.goal': 'Lấy lại điều bạn vừa làm với kế hoạch.',
  'help.guide.undo-change.step.1':
    'Nhấp mũi tên hoàn tác trên thanh công cụ phía trên các ngày; chú giải của nó nêu tên thay đổi sẽ được lấy lại.',
  'help.guide.undo-change.result': 'Kế hoạch trở lại như cũ, và mũi tên chuyển xám cho đến thay đổi tiếp theo.',
  'help.guide.undo-change.tip.1':
    'Hoàn tác bao gồm kế hoạch: gán, gỡ, sắp xếp lại và di chuyển địa điểm, tối ưu hóa tuyến đường, xóa địa điểm, đổi danh mục và nhập dữ liệu.',
  'help.guide.undo-change.tip.2':
    'Chỉ sâu một bước: chỉ thay đổi gần nhất mới lấy lại được, và một thay đổi mới sẽ thay thế nó.',
  'help.guide.clear-day.title': 'Xóa trống một ngày',
  'help.guide.clear-day.goal': 'Gỡ mọi địa điểm khỏi một ngày cùng lúc, ví dụ để lên kế hoạch lại từ đầu.',
  'help.guide.clear-day.step.1': 'Nhấp chuột phải vào phần đầu của ngày trong kế hoạch.',
  'help.guide.clear-day.step.2': 'Chọn “Xóa trống ngày” và xác nhận.',
  'help.guide.clear-day.result':
    'Ngày trở nên trống và các địa điểm của nó trở lại danh sách ở dạng chưa có kế hoạch. Mũi tên hoàn tác phía trên các ngày sẽ đưa chúng trở lại.',
  'help.guide.clear-day.tip.1': 'Chỉ các địa điểm bị gỡ đi. Ngày vẫn giữ ghi chú và đặt chỗ của nó.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Địa điểm',
  'help.ctx.trip-places.summary':
    'Cột bên phải của kế hoạch: mọi địa điểm của chuyến đi, đã lên kế hoạch hay chưa, cùng tìm kiếm và bộ lọc, và các cách đưa địa điểm vào: bằng tay, từ một tập tin hoặc từ một danh sách được chia sẻ.',
  'help.ctx.trip-places.bullet.1':
    '“Thêm địa điểm/Hoạt động” ở trên cùng mở biểu mẫu cho một địa điểm bạn gõ vào hoặc tìm kiếm. Khi một ngày đang mở, nút đó ghi “Địa điểm mới”, và “Vào ngày” bên cạnh tạo địa điểm thẳng vào ngày đó.',
  'help.ctx.trip-places.bullet.2':
    'Nút nhập bên cạnh nó có “Nhập tập tin” cho các tập tin .gpx, .kml và .kmz, và “Danh sách Google” (“Nhập danh sách” khi danh sách Naver cũng được bật) cho một danh sách được chia sẻ từ Google Maps hoặc Naver Maps. Bạn cũng có thể chỉ cần thả tập tin lên cột này.',
  'help.ctx.trip-places.bullet.3':
    'Bên dưới là ô tìm kiếm, cạnh đó là dấu tích để bắt đầu một lượt chọn, và một hàng bộ lọc: “Hiển thị” chuyển giữa “Tất cả”, “Không có kế hoạch”, “Có kế hoạch” và, khi đã nhập một đường đi, “Đường đi”, mỗi mục kèm số lượng; nút nhãn lọc theo danh mục, ngôi sao lọc theo mức đánh giá tối thiểu, quả địa cầu lọc theo quốc gia hoặc vùng, và “Sắp xếp theo” đặt thứ tự của danh sách.',
  'help.ctx.trip-places.bullet.4':
    'Một hàng hiển thị hình ảnh, tên và mô tả hoặc địa chỉ. Nhấp vào đó để xem chi tiết địa điểm, kéo nó lên một ngày, hoặc nhấp chuột phải (hay nhấp ba chấm của nó) để có “Chỉnh sửa”, “+ Ngày”, “Mở trang web”, “Google Maps”, “Lưu vào Bộ sưu tập” và “Xóa bỏ”.',
  'help.ctx.trip-places.bullet.5':
    'Khi một ngày đang mở, “+ Ngày” ở cuối một hàng chưa có kế hoạch sẽ đặt địa điểm vào ngày đó, và “Có kế hoạch” chỉ liệt kê ngày đó, với “Hiện toàn bộ chuyến đi” để mở rộng trở lại.',
  'help.ctx.trip-places.bullet.6':
    'Dấu tích cạnh ô tìm kiếm bắt đầu một lượt chọn: từ thanh ở chân cột, nhiều hàng cùng lúc nhận một danh mục mới, vào một bộ sưu tập, được đánh dấu đã đến hoặc bị xóa.',
  // create-place
  'help.guide.create-place.title': 'Tạo một địa điểm',
  'help.guide.create-place.goal': 'Thêm một địa điểm hoặc hoạt động bằng tay, với mọi thứ mà kế hoạch cần biết về nó.',
  'help.guide.create-place.step.1':
    'Nhấp “Thêm địa điểm/Hoạt động” ở đầu cột địa điểm (“Địa điểm mới” khi một ngày đang mở). Biểu mẫu mở ra.',
  'help.guide.create-place.step.2':
    'Gõ địa điểm vào “Tìm kiếm địa điểm...” và chọn một kết quả. Tên ở phần đầu hộp thoại, “Địa chỉ”, “Vĩ độ”, “Kinh độ” và “Trang web” được điền, và “Chi tiết địa điểm” ở bên trái hiển thị hình ảnh, giờ mở cửa và một mô tả về nó. Trên một TREK có khóa Google, “Không đúng địa điểm? Tìm trên Google” nằm dưới danh sách và chạy đúng tìm kiếm đó qua Google. “Địa điểm đã lưu” ở bên phải đưa ra các địa điểm trong bộ sưu tập của bạn theo cùng cách đó.',
  'help.guide.create-place.step.3':
    'Trong “Chi tiết địa điểm”, một cú nhấp vào hình ảnh dưới “Chọn một hình ảnh” biến nó thành ảnh của địa điểm; “Dùng văn bản này” đưa phần mô tả sang biểu mẫu.',
  'help.guide.create-place.step.4':
    'Kiểm tra những gì biểu mẫu chứa: tên nằm ở phần đầu hộp thoại và là ô bắt buộc duy nhất; chip “Loại” bên dưới nó chọn một trong các danh mục của chuyến đi, và dấu + bên cạnh tạo ngay một danh mục mới. “Địa chỉ”, “Vĩ độ” và “Kinh độ” đến từ tìm kiếm hoặc do bạn gõ; “Miêu tả” và “Ghi chú” là của bạn; “Trang web” nhận liên kết.',
  'help.guide.create-place.step.5':
    'Nhấp “Thêm”. Nếu một địa điểm cùng tên hoặc ở cùng vị trí đã có trong chuyến đi, TREK sẽ báo và nút đổi thành “Vẫn thêm”.',
  'help.guide.create-place.result':
    'Địa điểm đã ở trong danh sách và trên bản đồ, dưới “Không có kế hoạch” cho đến khi được đặt vào một ngày.',
  'help.guide.create-place.tip.1':
    '“Tập tin” và “Chi phí” ở cuối biểu mẫu đính kèm một tài liệu vào địa điểm, hoặc mở trình soạn “Chi phí” cho khoản chi của nó ngay sau khi lưu.',
  'help.guide.create-place.tip.2':
    'Chỉ mục TREK và OpenStreetMap trả lời tìm kiếm trên mọi TREK, còn “Chi tiết địa điểm” tự điền từ Wikipedia, Wikivoyage và Wikimedia. Google chỉ được hỏi ở những chỗ cả hai đều không có gì, và chỉ nó mới mang lại đánh giá.',
  'help.guide.create-place.tip.3':
    'Một địa điểm cũng có thể bắt đầu từ bản đồ: nhấp chuột phải vào điểm đó, và biểu mẫu mở ra với tọa độ và địa chỉ đã điền sẵn.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Thêm địa điểm thẳng vào ngày đang mở',
  'help.guide.place-to-open-day.goal':
    'Bỏ qua bước thứ hai: tạo hoặc chọn địa điểm và có nó trên ngày đó ngay lập tức.',
  'help.guide.place-to-open-day.step.1':
    'Nhấp vào tiêu đề của một ngày ở cột các ngày. Ngày đó đang mở: thẻ của nó được làm nổi, và cột địa điểm có thêm nút “Vào ngày”.',
  'help.guide.place-to-open-day.step.2':
    '“Vào ngày” mở đúng biểu mẫu như “Địa điểm mới”, chỉ khác là địa điểm rơi vào ngày đang mở ngay khi bạn nhấp “Thêm”.',
  'help.guide.place-to-open-day.step.3':
    'Một địa điểm đã có sẵn sẽ vào ngày đang mở bằng “+ Ngày” ở cuối hàng của nó, hoặc bằng nhấp chuột phải rồi “+ Ngày”.',
  'help.guide.place-to-open-day.step.4':
    'Chiều ngược lại cũng được, mà không cần mở ngày trước: kéo hàng của địa điểm ra khỏi cột rồi thả lên thẻ của một ngày. Thả vào giữa hai điểm dừng thì nó nằm đúng chỗ đó.',
  'help.guide.place-to-open-day.result':
    'Địa điểm được liệt kê dưới ngày đó, ở cuối; kéo lên hoặc xuống tới chỗ nó thuộc về.',
  'help.guide.place-to-open-day.tip.1':
    'Ngày đang mở cũng dẫn hướng việc tìm kiếm: khi một ngày đang mở, bản đồ và tìm quanh đây bắt đầu từ nơi ngày đó vốn đã đi qua.',
  'help.guide.place-to-open-day.tip.2': '“Hoàn tác” trên thanh công cụ phía trên các ngày lấy lại việc gán đó.',
  // filter-places
  'help.guide.filter-places.title': 'Tìm một địa điểm trong danh sách',
  'help.guide.filter-places.goal': 'Thu hẹp cột lại còn những địa điểm bạn đang tìm.',
  'help.guide.filter-places.step.1':
    '“Hiển thị”, danh sách thả xuống dưới ô tìm kiếm, chuyển giữa “Tất cả”, “Không có kế hoạch” (chưa ở ngày nào), “Có kế hoạch” (đã ở một ngày) và “Đường đi” (các đường GPX đã nhập), mỗi mục kèm số lượng.',
  'help.guide.filter-places.step.2': 'Gõ vào “Tìm kiếm” ở trên cùng; danh sách thu hẹp lại khi bạn gõ.',
  'help.guide.filter-places.step.3':
    'Nút nhãn cạnh “Hiển thị” liệt kê các danh mục: tích một hoặc nhiều, trong đó có “Không có danh mục”. Nút này đếm những gì đã tích, và “Xóa bộ lọc” ở chân danh sách bỏ tất cả.',
  'help.guide.filter-places.step.4':
    'Ngôi sao bên cạnh nút đó đặt mức đánh giá tối thiểu: 5+, 4+ và cứ thế, chỉ hiện những địa điểm bạn chấm ít nhất từng đó.',
  'help.guide.filter-places.result':
    'Con số phía trên các hàng cho biết có bao nhiêu địa điểm khớp; các bộ lọc kết hợp với nhau.',
  'help.guide.filter-places.tip.1':
    'Khi một ngày đang mở, “Có kế hoạch” chỉ liệt kê ngày đó và nói rõ điều đó: “Chỉ hiển thị ngày đang mở”, với “Hiện toàn bộ chuyến đi” bên cạnh.',
  'help.guide.filter-places.tip.2':
    'Bản đồ cũng thu hẹp về ngày đang mở; “Tất cả” trong danh sách vẫn hiện mọi địa điểm của chuyến đi.',
  // edit-place
  'help.guide.edit-place.title': 'Thay đổi một địa điểm',
  'help.guide.edit-place.goal': 'Sửa một cái tên, dời ghim, thêm một trang web hoặc đổi danh mục.',
  'help.guide.edit-place.step.1':
    'Nhấp chuột phải vào hàng và chọn “Chỉnh sửa”, hoặc mở địa điểm và nhấp “Chỉnh sửa” trong phần chi tiết của nó.',
  'help.guide.edit-place.step.2':
    'Đổi những gì bạn cần: tên và chip “Loại” ở phần đầu hộp thoại, “Địa chỉ”, “Vĩ độ” và “Kinh độ”, “Miêu tả”, “Ghi chú” và “Trang web”. Khi mở từ một ngày, biểu mẫu còn có “Bắt đầu” và “Kết thúc” cùng “Ghi chú cho ngày này”.',
  'help.guide.edit-place.step.3': 'Nhấp “Cập nhật”.',
  'help.guide.edit-place.result': 'Thay đổi áp dụng ở mọi nơi địa điểm xuất hiện: danh sách, bản đồ và mọi ngày có nó.',
  'help.guide.edit-place.tip.1':
    '“Ghi chú cho ngày này” thuộc về địa điểm trong đúng ngày đó; “Ghi chú” thuộc về chính địa điểm.',
  'help.guide.edit-place.tip.2':
    '“Kết thúc” trước “Bắt đầu” sẽ chặn “Cập nhật”; “Thời gian trùng lặp với:” chỉ cảnh báo rằng một điểm dừng khác trong ngày có cùng giờ.',
  // delete-place
  'help.guide.delete-place.title': 'Xóa một địa điểm',
  'help.guide.delete-place.goal': 'Đưa một địa điểm ra khỏi chuyến đi vĩnh viễn.',
  'help.guide.delete-place.step.1':
    'Nhấp chuột phải vào hàng và chọn “Xóa bỏ”, hoặc nhấp “Xóa bỏ” trong phần chi tiết của địa điểm.',
  'help.guide.delete-place.step.2':
    'Nhấp “Xóa bỏ” trong câu hỏi. Nếu có một đêm đã đặt tại địa điểm đó, hoặc có một đặt chỗ liên kết với nó, câu hỏi sẽ nói rõ những gì mất theo.',
  'help.guide.delete-place.result':
    'Địa điểm biến mất khỏi danh sách, bản đồ và mọi ngày; “Hoàn tác” trên thanh công cụ phía trên các ngày mang nó trở lại.',
  'help.guide.delete-place.tip.1':
    'Để bỏ một địa điểm chỉ khỏi một ngày, thay vào đó hãy dùng “Xóa khỏi ngày” trên điểm dừng đó.',
  'help.guide.delete-place.tip.2': 'Nhiều địa điểm cùng lúc: dấu tích cạnh ô tìm kiếm bắt đầu một lượt chọn.',
  // select-places
  'help.guide.select-places.title': 'Thay đổi hoặc xóa nhiều địa điểm cùng lúc',
  'help.guide.select-places.goal': 'Dọn danh sách trong một lần thay vì từng địa điểm một.',
  'help.guide.select-places.step.1':
    'Nhấp dấu tích cạnh ô tìm kiếm. Các hàng có thêm ô đánh dấu tròn, và một thanh với các thao tác trồi lên ở chân cột.',
  'help.guide.select-places.step.2':
    'Nhấp vào các hàng để tích chúng. “Chọn tất cả”, dấu tích đôi trên thanh, lấy mọi hàng mà bộ lọc còn giữ lại.',
  'help.guide.select-places.step.3':
    'Thanh đó đếm các địa điểm đã tích. “Đổi danh mục” cho tất cả chúng một danh mục; “Lưu vào Bộ sưu tập” sao chép chúng vào một bộ sưu tập của bạn; “Xóa đã chọn” gỡ chúng sau một lần xác nhận.',
  'help.guide.select-places.step.4': '“Xong”, dấu X ở cuối thanh, rời khỏi lượt chọn.',
  'help.guide.select-places.result':
    'Thay đổi áp dụng cho mọi địa điểm được chọn; một lần xóa có thể hoàn tác từ thanh công cụ phía trên các ngày.',
  'help.guide.select-places.tip.1':
    'Các bộ lọc vẫn hoạt động trong khi bạn chọn: lọc về “Không có kế hoạch” trước, rồi “Chọn tất cả” sẽ bắt đúng những cái đó.',
  'help.guide.select-places.tip.2':
    '“Đánh dấu đã đến trong danh sách của bạn” xuất hiện trên thanh khi tiện ích Bộ sưu tập được bật: nó đánh dấu các địa điểm trong những bộ sưu tập mà chúng được lưu vào.',
  // import-places-file
  'help.guide.import-places-file.title': 'Nhập địa điểm từ tập tin GPX, KML hoặc KMZ',
  'help.guide.import-places-file.goal':
    'Đưa vào những gì Google My Maps, Google Earth hoặc một thiết bị theo dõi GPS đã xuất ra.',
  'help.guide.import-places-file.step.1':
    'Nhấp nút nhập cạnh nút thêm và chọn “Nhập tập tin”, hoặc thả tập tin vào bất cứ chỗ nào trên cột địa điểm.',
  'help.guide.import-places-file.step.2':
    'Chọn tập tin hoặc kéo nó vào ô. Với GPX, tích những gì cần nhập: “Điểm tham chiếu”, “Tuyến đường”, “Đường đi (có hình dạng đường dẫn)”; với KML và KMZ, “Điểm (Dấu vị trí)” và “Đường dẫn (LineStrings)”.',
  'help.guide.import-places-file.step.3':
    'Ô này nhận nhiều tập tin cùng lúc, và chỉ nhận .gpx, .kml và .kmz. Một loại tập tin khác, hoặc tập tin lớn hơn 10 MB, bị từ chối ngay trong hộp thoại và không được nhập.',
  'help.guide.import-places-file.step.4':
    'Nhấp “Nhập”. Một thông báo cho biết có bao nhiêu địa điểm đã vào; với tập tin KML hoặc KMZ, hộp thoại vẫn mở kèm phần tóm tắt những gì đã được tạo và những gì bị bỏ qua.',
  'help.guide.import-places-file.result':
    'Các địa điểm đã ở trong danh sách; một đường đi mang dấu tuyến trên hàng của nó, được vẽ trên bản đồ và có bộ lọc “Đường đi” riêng.',
  'help.guide.import-places-file.tip.1':
    'Tập tin quá lớn sẽ bị từ chối kèm giới hạn dung lượng; hãy xuất lại mà không có ảnh, hoặc chia nhỏ nó.',
  'help.guide.import-places-file.tip.2': 'Toàn bộ lần nhập có thể hoàn tác từ thanh công cụ phía trên các ngày.',
  // import-places-list
  'help.guide.import-places-list.title': 'Nhập một danh sách Google Maps hoặc Naver Maps được chia sẻ',
  'help.guide.import-places-list.goal': 'Biến liên kết của một danh sách được chia sẻ thành các địa điểm.',
  'help.guide.import-places-list.step.1':
    'Nhấp nút nhập cạnh nút thêm và chọn “Danh sách Google”. Khi danh sách Naver cũng được bật, mục đó ghi “Nhập danh sách” và hộp thoại hỏi bạn chọn loại nào trong hai.',
  'help.guide.import-places-list.step.2':
    'Dán liên kết chia sẻ của danh sách. Liên kết chỉ đường của Google Maps cũng được: các điểm dừng của nó trở thành địa điểm, theo thứ tự lái xe.',
  'help.guide.import-places-list.step.3': 'Nhấp “Nhập”.',
  'help.guide.import-places-list.result':
    'Mọi địa điểm của danh sách đều có trong chuyến đi, với tên như trong danh sách; những địa điểm đã có trong chuyến đi bị bỏ qua.',
  'help.guide.import-places-list.tip.1':
    'Danh sách phải được chia sẻ công khai; liên kết của một danh sách riêng tư không nhập được gì.',
  'help.guide.import-places-list.tip.2':
    '“Làm phong phú các địa điểm thông qua Google” xuất hiện trong hộp thoại khi TREK của bạn có khóa Google: nó tra cứu từng địa điểm đã nhập và điền ảnh, địa chỉ và chi tiết.',
  'help.guide.sort-places.title': 'Sắp xếp danh sách địa điểm',
  'help.guide.sort-places.goal':
    'Đặt danh sách theo thứ tự hữu ích lúc này: theo tên, theo đánh giá, hoặc theo những gì được thêm hay thay đổi gần nhất.',
  'help.guide.sort-places.step.1':
    'Mở “Sắp xếp theo” ở đầu cột. Nhãn của nó cho biết danh sách đang được sắp xếp thế nào.',
  'help.guide.sort-places.step.2':
    'Chọn một thứ tự, ví dụ “Tên” hoặc “Đánh giá cao nhất”. Danh sách thay đổi theo ngay.',
  'help.guide.sort-places.result':
    'Danh sách hiển thị địa điểm theo thứ tự bạn đã chọn, cho đến khi bạn chọn thứ tự khác.',
  'help.guide.sort-places.tip.1':
    'Mọi thứ tự khác “Mới thêm gần đây” đều đánh dấu nút, nên bạn nhận ra ngay danh sách đang được sắp xếp khác.',
  'help.guide.sort-places.tip.2': 'Sắp xếp chỉ thay đổi danh sách. Các ngày giữ thứ tự riêng của chúng.',
  'help.guide.place-by-hand.title': 'Thêm một địa điểm mà tìm kiếm không biết',
  'help.guide.place-by-hand.goal':
    'Tự nhập một địa điểm, kèm điện thoại, email và giờ mở cửa, khi tìm kiếm địa điểm không tìm thấy gì.',
  'help.guide.place-by-hand.step.1':
    'Trong hộp thoại địa điểm, gõ tên vào ô tìm kiếm và nhấn Enter. Khi không tìm thấy gì, hộp thoại sẽ báo như vậy và đề xuất “Thêm thủ công”.',
  'help.guide.place-by-hand.step.2':
    'Nhấp “Thêm thủ công”. Nội dung bạn đã tìm trở thành tên, và hộp thoại cuộn tới các trường liên hệ.',
  'help.guide.place-by-hand.step.3': 'Điền “Điện thoại” và “Email” trong phạm vi bạn biết.',
  'help.guide.place-by-hand.step.4':
    'Nhấp “Thêm giờ mở cửa” và đặt giờ mở và đóng cửa cho từng ngày. Nút sao chép áp giờ của ngày đầu tiên cho mọi ngày, và công tắc của mỗi ngày đánh dấu ngày đó là “Đóng cửa”.',
  'help.guide.place-by-hand.step.5': 'Nhấp “Thêm”.',
  'help.guide.place-by-hand.result':
    'Địa điểm được thêm vào danh sách. Chi tiết của nó hiển thị điện thoại, email và giờ mở cửa bạn đã nhập, giống như một địa điểm do tìm kiếm tìm thấy.',
  'help.guide.place-by-hand.tip.1':
    'Khi chỉnh sửa một địa điểm chưa có giờ riêng, giờ mở cửa từ “Chi tiết địa điểm” bên trái được tự động lấy sang; nếu nó đã có giờ, một nút bên cạnh sẽ lấy giờ tra được.',
  'help.guide.place-by-hand.tip.2':
    'Giờ bạn nhập được ưu tiên hơn giờ tra được, nên một quán cà phê có giờ theo mùa sẽ hiển thị điều bạn biết.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Ngày',
  'help.ctx.trip-days.summary':
    'Cột bên trái của kế hoạch: mỗi ngày một thẻ, với các điểm dừng theo thứ tự, các ghi chú, các đặt chỗ và phương tiện di chuyển của ngày đó, và lộ trình giữa các điểm dừng. Đây là nơi chuyến đi thực sự được lên kế hoạch.',
  'help.ctx.trip-days.bullet.1':
    'Thanh công cụ ở trên cùng: “Xuất” (PDF, lịch, GPX), “Mở rộng tất cả các ngày” / “Thu gọn tất cả các ngày”, mũi tên hoàn tác, “Sắp xếp lại ngày” và “Hiển thị tất cả lộ trình đặt chỗ”.',
  'help.ctx.trip-days.bullet.2':
    'Một thẻ ngày: một ô với số thứ tự ngày và dự báo thời tiết, tiêu đề và ngày tháng, cùng các chip cho đêm đã đặt, xe thuê và chi phí của ngày. Nhấp vào phần đầu để mở ngày đó, mũi nhọn gập thẻ lại, và dấu + mở một menu: “Thêm địa điểm vào ngày này”, “Thêm chỗ ở”, “Thêm phương tiện di chuyển”, “Giao thông công cộng” và “Thêm ghi chú”.',
  'help.ctx.trip-days.bullet.3':
    'Bên trong một ngày: các điểm dừng theo thứ tự, mỗi điểm có hình ảnh, tên, thời gian, một ổ khóa trên hình và các đặt chỗ được ghim vào nó; các ghi chú; các đặt chỗ và phương tiện di chuyển của ngày, được tô màu theo loại; và giữa các điểm dừng là thời gian đi của từng chặng. Mỗi hàng có một menu ba chấm, giống với menu mở ra khi nhấp chuột phải.',
  'help.ctx.trip-days.bullet.4':
    'Dưới các điểm dừng là thanh lộ trình: “Chỉ đường” vẽ ngày đó lên bản đồ, “Tối ưu hóa” sắp xếp các điểm dừng, “Lái xe”, “Đi bộ” hoặc “Đạp xe” đặt phương thức di chuyển của ngày, “Mở trong Google Maps” và “Mở trong CoMaps” giao ngày đó sang ứng dụng khác.',
  'help.ctx.trip-days.bullet.5':
    'Địa điểm vào một ngày bằng cách kéo một hàng từ cột địa điểm, bằng “+ Ngày” trên hàng đó, bằng “Thêm địa điểm vào ngày này” từ dấu + của ngày hoặc trên một ngày trống, hoặc từ chi tiết của địa điểm.',
  'help.ctx.trip-days.bullet.6':
    '“Tổng chi phí” ở dưới cùng cộng các khoản chi trong “Chi phí” thuộc về các điểm dừng và đặt chỗ của ngày, mỗi khoản một lần, theo tiền tệ của chuyến đi.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Đọc một ngày',
  'help.guide.read-day-plan.goal': 'Biết từng phần của thẻ ngày nói gì trước khi bạn thay đổi bất cứ thứ gì.',
  'help.guide.read-day-plan.step.1':
    'Phần đầu thẻ: một ô với số thứ tự ngày và dự báo thời tiết, rồi “Ngày 1” hoặc tiêu đề bạn đặt, ngày tháng, và các chip cho đêm đã đặt (nhận phòng hoặc trả phòng), xe thuê và chi phí của ngày. Nhấp vào phần đầu để mở ngày đó (bảng “Chi tiết ngày” mở ra trên bản đồ); dấu + bên phải thêm một địa điểm, một chỗ ở, một phương tiện di chuyển, một chuyến giao thông công cộng hoặc một ghi chú, và mũi nhọn gập thẻ lại.',
  'help.guide.read-day-plan.step.2':
    'Một điểm dừng: tay nắm ở bên trái để kéo nó, hình ảnh mang một ổ khóa dành cho việc tối ưu hóa lộ trình, rồi đến tên, một huy hiệu thời gian khi điểm dừng có “Bắt đầu” và “Kết thúc”, mô tả và, nếu có, “Ghi chú cho ngày này”. Các mũi tên ở đầu bên phải đưa nó lên hoặc xuống, và ba chấm mở menu của nó.',
  'help.guide.read-day-plan.step.3':
    'Một đặt chỗ tại một điểm dừng nằm trên điểm dừng đó dưới dạng huy hiệu “Sự đặt chỗ”, màu xanh lá khi đã xác nhận và màu hổ phách khi còn chờ, kèm giờ và nhà cung cấp; nhấp vào huy hiệu để mở đặt chỗ, và nút lộ trình bên cạnh vẽ lộ trình của nó. Một phương tiện di chuyển là một hàng riêng, được tô màu theo loại, với “Khởi hành” hoặc “Đến” và giờ của nó. Nhấp vào một đặt chỗ thì chi tiết của nó mở ra; “Chỉnh sửa” ở đó thay đổi nó.',
  'help.guide.read-day-plan.step.4':
    'Giữa hai điểm dừng, đường nối cho biết chặng đó mất bao lâu và xa bao nhiêu, theo phương thức di chuyển của ngày; nhấp vào đó để đổi phương thức cho riêng chặng ấy.',
  'help.guide.read-day-plan.step.5':
    'Thanh lộ trình ở cuối: “Chỉ đường” vẽ đường đi của ngày lên bản đồ, “Tối ưu hóa” sắp xếp lại các điểm dừng, các nút phương thức chọn “Lái xe” hoặc “Đi bộ”, “Mở trong Google Maps” và “Mở trong CoMaps” mở ngày đó ở ứng dụng ấy.',
  'help.guide.read-day-plan.result':
    'Mọi ký hiệu trên thẻ đều có nghĩa; các hướng dẫn bên dưới thay đổi từng ký hiệu một.',
  'help.guide.read-day-plan.tip.1':
    'Nhấp chuột phải vào một điểm dừng, hoặc nhấp ba chấm của nó, để có menu của nó: “Chỉnh sửa”, “Xóa khỏi ngày”, “Mở trang web”, các ứng dụng dẫn đường (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), “Lưu vào Bộ sưu tập”, “Xóa bỏ”.',
  'help.guide.read-day-plan.tip.2':
    'Đưa chuột lên một điểm dừng và “Thêm đặt chỗ” hiện ra ở cuối: một đặt chỗ tạo ở đó gắn với điểm dừng này trong ngày này.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Đưa một địa điểm vào một ngày',
  'help.guide.place-onto-day.goal':
    'Biến một địa điểm trong danh sách thành điểm dừng của một ngày, đúng chỗ của nó trong thứ tự.',
  'help.guide.place-onto-day.step.1':
    'Kéo một hàng từ cột địa điểm lên thẻ ngày. Thả giữa hai điểm dừng để đặt nó đúng ở đó, hoặc thả bất kỳ chỗ nào trên thẻ để thêm vào cuối.',
  'help.guide.place-onto-day.step.2':
    'Không cần kéo: mở ngày bằng cách nhấp vào phần đầu thẻ, rồi nhấp “+ Ngày” ở cuối hàng của địa điểm, hoặc nhấp chuột phải vào hàng đó và chọn “+ Ngày”.',
  'help.guide.place-onto-day.step.3':
    '“Thêm địa điểm vào ngày này”, trong menu + của ngày hoặc trên một ngày trống, mở biểu mẫu địa điểm, và địa điểm mới nằm ngay vào ngày đó.',
  'help.guide.place-onto-day.step.4':
    'Từ chi tiết của một địa điểm, “Thêm vào ngày” hỏi bạn ngày nào; khi một ngày đang mở, “Vào ngày” ở cột địa điểm tạo một địa điểm mới ngay trong ngày đang mở.',
  'help.guide.place-onto-day.result':
    'Địa điểm đã là điểm dừng của ngày, nằm trên bản đồ với số của ngày đó, và cột địa điểm tính nó vào mục “Có kế hoạch”.',
  'help.guide.place-onto-day.tip.1':
    'Một địa điểm có thể nằm trong nhiều ngày: hãy đặt nó vào ngày thứ hai từ cột địa điểm. Còn kéo một điểm dừng từ thẻ ngày này sang thẻ ngày khác thì sẽ chuyển nó đi.',
  'help.guide.place-onto-day.tip.2': 'Mũi tên hoàn tác trên thanh công cụ lấy lại việc gán đó.',
  'help.guide.place-onto-day.tip.3':
    'Không thể thả một điểm dừng vào giữa hai mục có giờ cố định, hoặc trước một đặt chỗ đã có giờ; kế hoạch giữ đúng trình tự thời gian.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Đổi thứ tự của một ngày',
  'help.guide.reorder-stops.goal': 'Chuyển một điểm dừng lên hoặc xuống, hoặc sang một ngày khác.',
  'help.guide.reorder-stops.step.1': 'Kéo điểm dừng bằng tay nắm của nó đến vị trí mới trong thẻ.',
  'help.guide.reorder-stops.step.2':
    'Hoặc dùng các mũi tên ở đầu bên phải của điểm dừng: mỗi lần nhấp là một bậc lên hoặc xuống.',
  'help.guide.reorder-stops.step.3': 'Kéo điểm dừng sang một thẻ ngày khác để chuyển nó sang đó; nó rời khỏi ngày cũ.',
  'help.guide.reorder-stops.step.4':
    'Một điểm dừng có giờ cố định sẽ hỏi “Xóa thời gian?” khi việc chuyển nó làm hỏng thứ tự của ngày, vì chính giờ đó quyết định chỗ của nó: “Xác nhận” bỏ giờ đi và để nó đi đâu cũng được.',
  'help.guide.reorder-stops.result': 'Lộ trình và thời gian đi lập tức theo thứ tự mới.',
  'help.guide.reorder-stops.tip.1':
    'Đặt chỗ với thời gian cố định không thể được sắp xếp lại; chúng nằm ở chỗ mà giờ của chúng đặt để.',
  'help.guide.reorder-stops.tip.2':
    '“Tối ưu hóa” trên thanh lộ trình sắp cả ngày theo đường ngắn nhất; hãy khóa một điểm dừng trước để nó ở yên chỗ cũ.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Cho một điểm dừng một khung giờ',
  'help.guide.set-stop-times.goal':
    'Ấn định khi nào một điểm dừng bắt đầu và kết thúc, để ngày đó đọc như một lịch trình.',
  'help.guide.set-stop-times.step.1':
    'Nhấp chuột phải vào điểm dừng, hoặc nhấp ba chấm của nó, và chọn “Chỉnh sửa”. Khi mở từ ngày, biểu mẫu có “Bắt đầu” và “Kết thúc” cho ngày đó, ngay dưới vị trí.',
  'help.guide.set-stop-times.step.2':
    'Nhập “Bắt đầu” và, nếu muốn, “Kết thúc”. “Thời gian trùng lặp với:” cảnh báo rằng một điểm dừng có giờ khác trong ngày bị trùng; một “Kết thúc” trước “Bắt đầu” sẽ chặn “Cập nhật”.',
  'help.guide.set-stop-times.step.3':
    'Nhấp “Cập nhật”. Điểm dừng nhận một huy hiệu thời gian và chuyển tới chỗ mà giờ của nó thuộc về trong ngày.',
  'help.guide.set-stop-times.result':
    'Các điểm dừng có giờ giữ nguyên chỗ trong thứ tự; các điểm dừng không có giờ sắp xếp quanh chúng.',
  'help.guide.set-stop-times.tip.1':
    'Giờ thuộc về điểm dừng trong ngày đó; cùng một địa điểm ở ngày khác có thể có giờ khác.',
  'help.guide.set-stop-times.tip.2':
    'Để chuyển bằng tay một điểm dừng có giờ, hãy kéo nó: câu hỏi “Xóa thời gian?” bỏ giờ đi trên đường, một khi bạn nhấn “Xác nhận”.',
  'help.guide.set-stop-times.tip.3':
    '“Ghi chú cho ngày này” trong cùng biểu mẫu chứa những gì chỉ áp dụng cho ngày này, một bàn đã đặt, một số vé.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Bỏ một điểm dừng khỏi một ngày',
  'help.guide.remove-from-day.goal': 'Hủy kế hoạch cho một địa điểm mà không xóa nó khỏi chuyến đi.',
  'help.guide.remove-from-day.step.1': 'Nhấp chuột phải vào điểm dừng và chọn “Xóa khỏi ngày”.',
  'help.guide.remove-from-day.step.2':
    'Điểm dừng biến khỏi ngày đó; địa điểm vẫn ở cột địa điểm, nằm dưới “Không có kế hoạch” nếu nó không có trong ngày nào khác.',
  'help.guide.remove-from-day.result':
    'Ngày đó, lộ trình và chi phí của nó được cập nhật; mũi tên hoàn tác mang điểm dừng trở lại.',
  'help.guide.remove-from-day.tip.1': '“Xóa bỏ” trong cùng menu gỡ địa điểm khỏi cả chuyến đi, kể cả mọi ngày.',
  'help.guide.remove-from-day.tip.2':
    '“Xóa khỏi ngày” cũng nằm trong bảng chi tiết của địa điểm, cạnh “Thêm vào ngày”.',
  // lock-stop
  'help.guide.lock-stop.title': 'Khóa một điểm dừng tại chỗ',
  'help.guide.lock-stop.goal': 'Giữ một điểm dừng ở nguyên chỗ khi lộ trình được tối ưu hóa.',
  'help.guide.lock-stop.step.1':
    'Đưa chuột lên hình của điểm dừng và nhấp vào ổ khóa: “Giữ vị trí trong quá trình tối ưu hóa tuyến đường”.',
  'help.guide.lock-stop.step.2':
    'Giờ đây “Tối ưu hóa” sắp các điểm dừng khác quanh nó; nhấp ổ khóa lần nữa (“Bấm để mở khóa”) để thả nó ra.',
  'help.guide.lock-stop.result': 'Ổ khóa hiện trên hình; điểm dừng giữ nguyên vị trí cho tới khi bạn mở khóa.',
  'help.guide.lock-stop.tip.1':
    'Một điểm dừng có giờ cố định thì bị chính giờ của nó khóa lại; nó không bao giờ dịch chuyển trong lúc tối ưu hóa.',
  'help.guide.lock-stop.tip.2':
    'Ổ khóa chỉ kéo dài trong lần truy cập này: sau khi tải lại trang, mọi điểm dừng lại tự do, chỉ các điểm dừng có giờ là vẫn cố định.',
  // day-note
  'help.guide.day-note.title': 'Thêm một ghi chú vào một ngày',
  'help.guide.day-note.goal': 'Giữ một lời nhắc, một số vé hay một phương án dự phòng ngay trong ngày.',
  'help.guide.day-note.step.1': 'Nhấp dấu + ở phần đầu thẻ ngày và chọn “Thêm ghi chú”.',
  'help.guide.day-note.step.2':
    'Gõ tên ghi chú vào phần đầu hộp thoại, chỗ ghi “Ghi chú”; đó là phần mà thẻ ngày hiển thị. Viết phần còn lại ở mục “Ghi chú hàng ngày”: thanh công cụ phía trên định dạng văn bản (đậm, danh sách, liên kết, trích dẫn), và “Xem trước” ở bên trái cho thấy hàng mà nó sẽ trở thành.',
  'help.guide.day-note.step.3':
    'Chọn một “Biểu tượng” và một “Màu”, để ghi chú nổi lên giữa các điểm dừng, rồi “Thêm”.',
  'help.guide.day-note.step.4':
    'Ghi chú nằm trong ngày như một điểm dừng: kéo nó vào chỗ, và nhấp chuột phải hoặc dùng ba chấm của nó để có “Chỉnh sửa” và “Xóa bỏ”.',
  'help.guide.day-note.result':
    'Ghi chú là một phần của ngày, có cả trong PDF; một ghi chú có giờ sẽ sắp cùng với các điểm dừng có giờ.',
  'help.guide.day-note.tip.1':
    'Một ghi chú có giờ có thể thay cho một chuyến đi mà bạn không có đặt chỗ: “08:15 tàu S3 từ ga trung tâm”.',
  'help.guide.day-note.tip.2': 'Ghi chú là theo từng ngày; một ghi chú cho cả chuyến đi thuộc về “Cộng tác”.',
  // day-route
  'help.guide.day-route.title': 'Hiện và tối ưu hóa lộ trình của ngày',
  'help.guide.day-route.goal': 'Xem đường đi giữa các điểm dừng, chọn cách bạn di chuyển, và để TREK sắp thứ tự.',
  'help.guide.day-route.step.1':
    'Mở ngày và nhấp “Chỉ đường” trên thanh lộ trình: đường đi giữa các điểm dừng được vẽ lên bản đồ, và các đường nối giữa các điểm dừng hiển thị thời gian và quãng đường của từng chặng.',
  'help.guide.day-route.step.2':
    '“Lái xe” và “Đi bộ” bên cạnh đó đặt phương thức di chuyển của ngày; các chặng được tính lại. Các plugin có thể thêm phương thức riêng của chúng.',
  'help.guide.day-route.step.3':
    'Nhấp vào một đường nối để đổi phương thức cho riêng chặng đó: chọn một phương thức, hoặc “Dùng mặc định của ngày” để quay về phương thức của ngày.',
  'help.guide.day-route.step.4':
    '“Tối ưu hóa” sắp xếp lại các điểm dừng theo đường ngắn nhất. Các điểm dừng có ổ khóa hoặc giờ cố định giữ nguyên chỗ; nếu ngày đó có chỗ ở, lộ trình bắt đầu từ đấy.',
  'help.guide.day-route.step.5':
    '“Mở trong Google Maps” hoặc “Mở trong CoMaps” mở cả ngày như một lộ trình trong ứng dụng đó, để dẫn đường trên đường đi.',
  'help.guide.day-route.result':
    'Ngày trở thành một lộ trình có thời gian; “Tổng chi phí” và các chặng được cập nhật khi thứ tự thay đổi.',
  'help.guide.day-route.tip.1':
    'Lộ trình mặc định đến từ OSRM; quản trị viên có thể trỏ TREK sang một công cụ định tuyến khác trong “Mặc định của người dùng”.',
  'help.guide.day-route.tip.2':
    'Một chặng không định tuyến được thì không hiện thời gian; hãy kiểm tra xem cả hai điểm dừng có tọa độ chưa.',
  'help.guide.day-route.tip.3': 'Mũi tên hoàn tác lấy lại một lần tối ưu hóa.',
  // manage-days
  'help.guide.manage-days.title': 'Thêm, sắp xếp lại và đổi tên các ngày',
  'help.guide.manage-days.goal': 'Tạo hình cho chính các ngày, không chỉ những gì nằm trên chúng.',
  'help.guide.manage-days.step.1':
    'Các ngày đến từ ngày tháng của chuyến đi; đổi ngày tháng trên thẻ chuyến đi trong “Bảng điều khiển” và các ngày sẽ được thêm vào hoặc bỏ bớt ở hai đầu. Trước khi một ngày có nội dung bị bỏ đi, một danh sách cho biết những ngày nào sẽ mất và trên đó có gì.',
  'help.guide.manage-days.step.2':
    '“Sắp xếp lại ngày” trên thanh công cụ mở một danh sách: “Di chuyển lên” và “Di chuyển xuống” dời một ngày cùng mọi thứ trên nó, còn “Xóa ngày”, thùng rác bên cạnh, bỏ ngày đó đi. Dưới danh sách, nút có ngày tiếp theo thêm một ngày ngay sau ngày có ngày tháng cuối cùng và kéo dài chuyến đi thêm một ngày; “Không ngày tháng” nối thêm một ngày không có ngày tháng ở cuối.',
  'help.guide.manage-days.step.3':
    '“Xóa ngày” hỏi trước: danh sách cho thấy những gì mất theo ngày đó, gồm địa điểm, ghi chú và đặt chỗ, một chỗ ở có nhận phòng hoặc trả phòng vào ngày đó, và những ngày dời lên một ngày tháng. “Xóa ngày” bỏ ngày đó đi, “Hủy” giữ lại; không thể xóa ngày cuối cùng.',
  'help.guide.manage-days.step.4':
    'Để đổi tên một ngày, hãy mở nó và nhấp cây bút chì cạnh tiêu đề của nó trong bảng chi tiết trên bản đồ; tên đó thay cho “Ngày 1” trong thẻ và trong PDF.',
  'help.guide.manage-days.step.5':
    '“Mở rộng tất cả các ngày” và “Thu gọn tất cả các ngày” trên thanh công cụ gập mọi thẻ cùng lúc; một thẻ riêng lẻ gập bằng mũi nhọn của nó.',
  'help.guide.manage-days.result':
    'Ngày tháng gắn với vị trí: một ngày được đưa lên trên nhận ngày tháng sớm hơn, còn các điểm dừng, ghi chú và đặt chỗ của nó đi theo.',
  'help.guide.manage-days.tip.1': 'Việc di chuyển ngày có thể hoàn tác từ thanh công cụ; việc xóa một ngày thì không.',
  'help.guide.manage-days.tip.2':
    'Chi phí ở phần đầu thẻ của một ngày cộng các điểm dừng và đặt chỗ của ngày đó có mang giá.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Đọc đặt chỗ và phương tiện di chuyển trong kế hoạch',
  'help.guide.bookings-in-plan.goal': 'Biết một đặt chỗ hiện ra ở đâu khi nó đã tồn tại, và màn hình nào tạo ra nó.',
  'help.guide.bookings-in-plan.step.1':
    'Một phương tiện di chuyển (chuyến bay, xe lửa, phà, xe buýt, xe hơi) là một hàng được tô màu theo loại: “Khởi hành” vào ngày đi, “Đến” vào ngày tới nơi, kèm giờ và lộ trình; loại kéo dài nhiều ngày thì trải qua những ngày ở giữa. Nhấp vào hàng thì đặt chỗ mở ra.',
  'help.guide.bookings-in-plan.step.2':
    'Một đặt chỗ gắn với một điểm dừng (một nhà hàng, một chuyến du lịch) là một huy hiệu “Sự đặt chỗ” trên điểm dừng đó, màu xanh lá khi đã xác nhận và màu hổ phách khi còn chờ, kèm giờ của nó; một đặt chỗ có ngày nhưng không có điểm dừng thì thành một hàng riêng trong ngày.',
  'help.guide.bookings-in-plan.step.3':
    'Một đêm ở khách sạn là chỗ ở: nó nằm trong bảng chi tiết của ngày, dưới mục “Chỗ ở”, từ “Nhận phòng” đến “Trả phòng”, và lộ trình của từng ngày trong số đó bắt đầu từ đấy.',
  'help.guide.bookings-in-plan.step.4':
    'Trên bản đồ, công tắc ở hàng phương tiện di chuyển vẽ lộ trình của nó; “Hiển thị tất cả lộ trình đặt chỗ” trên thanh công cụ vẽ tất cả.',
  'help.guide.bookings-in-plan.step.5':
    'Tạo mới: “Thêm đặt chỗ” trên một điểm dừng đang được trỏ chuột, “Thêm phương tiện di chuyển” và “Giao thông công cộng” trong menu + của ngày, và các tab “Đặt” và “Di chuyển” cho danh sách đầy đủ kèm nhập dữ liệu và tệp.',
  'help.guide.bookings-in-plan.result':
    'Một đặt chỗ, một chỗ trong kế hoạch; các tab chính là những đặt chỗ ấy dưới dạng danh sách.',
  'help.guide.bookings-in-plan.tip.1':
    '“Đã xác nhận” và “Chưa giải quyết” là trạng thái bạn đặt trên đặt chỗ; kế hoạch hiện nó trên điểm dừng, còn tab “Đặt” đếm cả hai.',
  'help.guide.bookings-in-plan.tip.2':
    'Một phương tiện di chuyển có giờ cố định thì không kéo được; hãy đổi giờ của nó trong đặt chỗ.',
  // export-plan
  'help.guide.export-plan.title': 'Xuất kế hoạch',
  'help.guide.export-plan.goal': 'Mang kế hoạch theo dưới dạng tài liệu, vào lịch của bạn hoặc lên một thiết bị GPS.',
  'help.guide.export-plan.step.1': 'Nhấp “Xuất” trên thanh công cụ phía trên các ngày.',
  'help.guide.export-plan.step.2':
    '“Tài liệu”: “PDF” mở chế độ xem in của mọi ngày cùng các điểm dừng, ghi chú và đặt chỗ của chúng; “Ngắt trang cho mỗi ngày” bắt đầu mỗi ngày ở một trang mới, “Lưu dưới dạng PDF” tải nó về.',
  'help.guide.export-plan.step.3':
    '“Lịch”: “Tải xuống .ics” lưu các đặt chỗ thành một tệp lịch; “Đăng ký lịch” cho bạn một liên kết mà ứng dụng lịch của bạn tự làm mới.',
  'help.guide.export-plan.step.4':
    '“Bản đồ và GPS · GPX”: “Toàn bộ chuyến đi” xuất các địa điểm, lộ trình từng ngày và các vệt đường; “Chỉ địa điểm” chỉ xuất các ghim; “Các ngày dưới dạng lộ trình” mỗi ngày một lộ trình, dành cho bản đồ ngoại tuyến và thiết bị GPS.',
  'help.guide.export-plan.result': 'Tệp được tải về; không có gì trong chuyến đi thay đổi.',
  'help.guide.export-plan.tip.1':
    'Một ngày riêng lẻ đi sang ứng dụng bản đồ từ thanh lộ trình của nó: “Mở trong Google Maps” hoặc “Mở trong CoMaps”.',
  'help.guide.export-plan.tip.2':
    '“Đăng ký lịch” cần bật đăng ký lịch trong phần cài đặt của bạn; “Bảng điều khiển” có một hướng dẫn cho việc đó.',
  'help.guide.export-plan.tip.3': 'Xuất là đọc: mọi thành viên của chuyến đi đều làm được.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Chi tiết địa điểm',
  'help.ctx.trip-place.summary':
    'Thẻ mở ra trên bản đồ khi bạn chọn một địa điểm: mọi thứ chuyến đi biết về nó, những ngôi sao mọi người đã cho nó, hình ảnh và tập tin của nó, cùng các nút đặt nó vào ngày đang mở, vào một danh sách hoặc vào một ứng dụng bản đồ.',
  'help.ctx.trip-place.bullet.1':
    'Nhấp một hàng trong cột địa điểm, một điểm dừng bên trong một ngày, hoặc một điểm đánh dấu trên bản đồ, và thẻ mở ra trên bản đồ. Chọn nó bên trong một ngày sẽ cho thẻ biết bạn muốn nói đến điểm dừng nào, và chính điều đó mang theo người tham gia của điểm dừng cùng đặt chỗ của nó.',
  'help.ctx.trip-place.bullet.2':
    'Phần đầu mang hình tròn, tên, địa chỉ trên một dòng và các chip cho những gì đã biết: mở hay đóng cửa, danh mục, giá, số điện thoại và tọa độ. Nhấp vào hình để dùng ảnh của riêng bạn, nhấp đúp vào tên để đổi tên địa điểm ngay tại chỗ, và dấu X bên phải đóng thẻ.',
  'help.ctx.trip-place.bullet.3':
    'Bên dưới: những ngôi sao mà mỗi người đi đã cho địa điểm, phần mô tả và ghi chú, cùng “Ghi chú cho ngày này” khi điểm dừng có mang nó.',
  'help.ctx.trip-place.bullet.4':
    '“Giờ mở cửa”, “Màu đường đi”, “Theo dõi số liệu thống kê” và “Tập tin” theo sau, trong chừng mực chúng áp dụng. “Tập tin” nhận bất cứ thứ gì từ các thư mục của bạn và cũng liệt kê những gì treo trên đặt chỗ của điểm dừng này.',
  'help.ctx.trip-place.bullet.5':
    'Hàng ở dưới cùng: “Thêm vào ngày” hoặc “Xóa khỏi ngày” khi một ngày đang mở, rồi “Lưu vào Bộ sưu tập”, “Điều hướng”, “Mở trang web”, “Chỉnh sửa” và “Xóa bỏ”.',
  'help.ctx.trip-place.bullet.6':
    'Một địa điểm được chọn ra từ tìm kiếm mang theo những gì chỉ mục của TREK hoặc OpenStreetMap biết về nó: “Mở” hoặc “Đã đóng” trong các chip của phần đầu, với một vòng xanh lá hoặc đỏ quanh hình ảnh, xét theo giờ của chính địa điểm, số điện thoại cũng là một chip, “Giờ mở cửa” xa hơn bên dưới với dòng của ngày hôm đó trên hàng và cả tuần phía sau một cú nhấp, cùng trang web của nó phía sau “Mở trang web”. Đánh giá của Google chỉ hiện ở địa điểm tìm được qua Google, trên một TREK có khóa Google.',
  // read-place
  'help.guide.read-place.title': 'Thẻ cho bạn biết gì về một địa điểm',
  'help.guide.read-place.goal': 'Đọc mọi thứ chuyến đi biết về một địa điểm, trong một thẻ.',
  'help.guide.read-place.step.1':
    'Ở cột các ngày, nhấp vào điểm dừng bạn muốn đọc. Thẻ mở ra trên bản đồ và điểm dừng vẫn được đánh dấu trong ngày của nó.',
  'help.guide.read-place.step.2':
    'Phần đầu: hình tròn, tên và địa chỉ trên một dòng; chú thích khi di chuột của nó chứa toàn bộ địa chỉ. Các chip bên dưới cho biết lúc này là “Mở” hay “Đã đóng”, theo giờ của chính địa điểm, với một vòng xanh lá hoặc đỏ quanh hình ảnh tương ứng, và mang số điện thoại, mà một cú nhấp sẽ chuyển cho ứng dụng điện thoại của bạn, cùng tọa độ chính xác. Dấu X bên phải đóng thẻ lại.',
  'help.guide.read-place.step.3':
    '“Đánh giá” đứng đầu tiên dưới phần đầu: những ngôi sao mà mỗi người đi đã cho địa điểm, kèm mức trung bình và số người đã bình chọn. “Chưa có đánh giá” khi chưa ai cho.',
  'help.guide.read-place.step.4':
    'Rồi đến phần mô tả và, bên dưới nó, ghi chú. Cả hai là văn bản từ biểu mẫu của địa điểm, đã được kết xuất: danh sách, liên kết và chữ đậm đều hoạt động.',
  'help.guide.read-place.step.5':
    '“Người tham gia” nói ai sẽ đến điểm dừng này. Mọi người đều có mặt cho đến khi bạn đưa ai đó ra.',
  'help.guide.read-place.step.6':
    '“Giờ mở cửa”, xa hơn bên dưới: hàng mang giờ của ngày bạn đang xem, và một cú nhấp vào nó mở ra cả tuần với ngày đó in đậm. “Tập tin” đứng bên cạnh.',
  'help.guide.read-place.result':
    'Thẻ vẫn mở cho đến khi bạn đóng bằng dấu X hoặc chọn địa điểm khác, giờ mở cửa cả tuần vẫn được mở ra, và điểm dừng mà nó thuộc về vẫn được đánh dấu ở cột các ngày.',
  'help.guide.read-place.tip.1':
    'Chọn từ cột địa điểm thì thẻ biết địa điểm nhưng không biết điểm dừng, nên nó không hiện người tham gia và không hiện đặt chỗ. Hãy chọn điểm dừng bên trong ngày, và cả hai đều có.',
  'help.guide.read-place.tip.2':
    'Nhấp đúp vào tên để đổi tên địa điểm mà không cần mở biểu mẫu. Enter lưu lại, Escape bỏ thay đổi.',
  'help.guide.read-place.tip.3':
    'Một địa điểm gõ vào bằng tay không cho thấy gì trong số đó: thẻ chỉ biết những gì biểu mẫu của nó chứa. Mở nó bằng “Chỉnh sửa”, chọn nó từ các gợi ý dưới “Tìm kiếm địa điểm...” và nhấp “Cập nhật”, và giờ mở cửa, số điện thoại cùng trang web sẽ đi theo. Đánh giá của Google cần một khóa Google.',
  // rate-place
  'help.guide.rate-place.title': 'Đánh giá một địa điểm',
  'help.guide.rate-place.goal': 'Cho địa điểm những ngôi sao của riêng bạn, và xem mọi người khác đã cho gì.',
  'help.guide.rate-place.step.1':
    'Mở địa điểm. Hàng sao nằm ngay dưới phần đầu và mang mức trung bình của các lượt bình chọn đến lúc này, với số lượng của chúng trong ngoặc.',
  'help.guide.rate-place.step.2':
    'Nhấp vào ngôi sao bạn muốn. Các ngôi sao đầy dần khi bạn di chuột qua chúng, nên bạn thấy mình sắp cho bao nhiêu.',
  'help.guide.rate-place.step.3':
    'Lá phiếu của bạn vào ngay mức trung bình, và những gương mặt bên cạnh là người đã bình chọn. Di chuột lên hàng đó để thấy sao của từng người.',
  'help.guide.rate-place.step.4':
    'Cùng mức trung bình đó nằm trên hàng của địa điểm ở cột địa điểm, nên những nơi tốt nổi bật trong danh sách.',
  'help.guide.rate-place.result':
    'Sao của bạn nằm trên địa điểm cho cả chuyến đi thấy, và ngôi sao ở hàng bộ lọc phía trên danh sách giờ có thể chỉ giữ lại những địa điểm đạt một mức sàn.',
  'help.guide.rate-place.tip.1':
    'Mọi người đi đều có thể đánh giá, kể cả trong chuyến đi mà chỉ một số người được “Thêm/sửa/xóa địa điểm”.',
  'help.guide.rate-place.tip.2':
    'Nhấp vào ngôi sao bạn đã cho để rút lại lá phiếu. Khi không còn ai bình chọn, địa điểm lại ghi “Chưa có đánh giá”.',
  'help.guide.rate-place.tip.3':
    'Tối đa sáu người bình chọn nằm vừa bên cạnh các ngôi sao dưới dạng gương mặt; chú giải gọi tên tất cả họ, và đánh dấu lá phiếu của bạn.',
  // place-image
  'help.guide.place-image.title': 'Đặt ảnh của riêng bạn lên một địa điểm',
  'help.guide.place-image.goal': 'Thay ảnh thu nhỏ tự động bằng một tấm ảnh của riêng bạn.',
  'help.guide.place-image.step.1': 'Mở địa điểm từ cột địa điểm.',
  'help.guide.place-image.step.2':
    'Di chuột lên hình tròn ở phần đầu: một máy ảnh hiện ra và chú giải ghi “Tải ảnh lên”. Nhấp vào đó và chọn tập tin của bạn.',
  'help.guide.place-image.step.3': 'Phần đầu bây giờ hiện ảnh của bạn, với một dấu X đỏ nhỏ ở góc.',
  'help.guide.place-image.step.4':
    'Cùng tấm ảnh đó nằm trên hàng của địa điểm ở cột địa điểm, và trên điểm đánh dấu của nó trên bản đồ.',
  'help.guide.place-image.result':
    'Ảnh của bạn là ảnh của địa điểm ở mọi nơi: trên thẻ, ở cột địa điểm, ở điểm dừng trong ngày, ở điểm đánh dấu trên bản đồ và trong chuyến đi được chia sẻ.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF và WebP đều được nhận, và một tập tin HEIC từ iPhone được chuyển đổi trên đường vào.',
  'help.guide.place-image.tip.2':
    'Dấu X ở góc gỡ ảnh của bạn đi và ảnh tự động quay lại. Bản thân địa điểm không bị đụng đến.',
  'help.guide.place-image.tip.3':
    'Không có ảnh của riêng bạn, TREK tra một tấm từ tọa độ của địa điểm, và lùi về biểu tượng của danh mục.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Đặt địa điểm vào ngày đang mở, hoặc lấy nó ra',
  'help.guide.place-day-assign.goal': 'Dùng chính nút của thẻ thay vì kéo hàng ngang qua trình lập kế hoạch.',
  'help.guide.place-day-assign.step.1':
    'Nhấp vào tiêu đề của một ngày ở cột các ngày. Ngày đó giờ là ngày đang mở, và thẻ làm việc với nó.',
  'help.guide.place-day-assign.step.2':
    'Nhấp vào một địa điểm chưa có trong ngày đó ở cột địa điểm. Thẻ của nó mở ra và hàng ở dưới cùng đưa ra “Thêm vào ngày”.',
  'help.guide.place-day-assign.step.3':
    'Nhấp “Thêm vào ngày”. Điểm dừng rơi vào cuối ngày và nút đổi thành “Xóa khỏi ngày”.',
  'help.guide.place-day-assign.step.4': 'Điểm dừng giờ đã ở trong ngày, cuối danh sách. Kéo nó lên đúng chỗ của nó.',
  'help.guide.place-day-assign.step.5':
    '“Xóa khỏi ngày” lấy điểm dừng đó ra khỏi ngày lần nữa, và thẻ lại đưa ra “Thêm vào ngày”.',
  'help.guide.place-day-assign.result':
    'Ngày đó mang điểm dừng, hoặc không còn mang nó nữa, và bản thân địa điểm không bị đụng đến trong cả hai trường hợp.',
  'help.guide.place-day-assign.tip.1':
    'Nút này chỉ tồn tại khi một ngày đang mở. Không có ngày nào thì thẻ chẳng có chỗ nào để thêm địa điểm vào.',
  'help.guide.place-day-assign.tip.2':
    'Lấy một điểm dừng ra khỏi một ngày vẫn để địa điểm lại trong chuyến đi và ở cột địa điểm. “Xóa bỏ” mới là thứ gỡ nó đi khắp nơi.',
  'help.guide.place-day-assign.tip.3':
    'Một điểm dừng do đặt chỗ lưu trú đặt vào ngày thì không có nút nào trong hai nút đó: đêm ấy được thêm và gỡ ở khối “Chỗ ở” của ngày.',
  // place-participants
  'help.guide.place-participants.title': 'Nói ai sẽ đến điểm dừng này',
  'help.guide.place-participants.goal': 'Tách nhóm cho một điểm dừng mà không tách chuyến đi.',
  'help.guide.place-participants.step.1':
    'Nhấp vào điểm dừng bên trong ngày. Thẻ mở ra và “Người tham gia” liệt kê tất cả mọi người trong chuyến đi.',
  'help.guide.place-participants.step.2':
    'Nhấp vào thẻ tên của một người đi để đưa họ ra khỏi điểm dừng này. Tên bị gạch ngang khi bạn di chuột lên nó.',
  'help.guide.place-participants.step.3':
    'Một dấu + nét đứt xuất hiện ngay khi có người vắng. Nhấp vào đó để xem ai không có mặt ở điểm dừng.',
  'help.guide.place-participants.step.4':
    'Nhấp một cái tên để đưa họ trở lại. Khi mọi người đã trở lại, điểm dừng lại là của cả nhóm.',
  'help.guide.place-participants.result':
    'Điểm dừng mang những người đi bạn đã chọn, và phần còn lại của nhóm có buổi chiều đó cho riêng họ.',
  'help.guide.place-participants.tip.1':
    '“Người tham gia” chỉ xuất hiện khi có một điểm dừng được chọn, nên hãy chọn địa điểm bên trong ngày chứ không phải ở cột địa điểm, và chỉ trong chuyến đi có nhiều hơn một người đi.',
  'help.guide.place-participants.tip.2':
    'Không chọn ai nghĩa là mọi người đều đi, và vì thế người cuối cùng còn lại ở một điểm dừng không thể bị lấy ra.',
  'help.guide.place-participants.tip.3':
    'Một “Khách”, người không có tài khoản riêng, có thể là người tham gia như bất kỳ ai khác.',
  // place-booking
  'help.guide.place-booking.title': 'Đặt chỗ trên một điểm dừng',
  'help.guide.place-booking.goal': 'Đọc đặt chỗ thuộc về một điểm dừng, mở nó ra, và ghim một đặt chỗ mới vào đó.',
  'help.guide.place-booking.step.1':
    'Mở điểm dừng mà đặt chỗ thuộc về. Thẻ liệt kê nó dưới “Đặt chỗ” như một thẻ nhỏ riêng, với tên của đặt chỗ và “Đã xác nhận” hoặc “Chưa giải quyết”.',
  'help.guide.place-booking.step.2':
    'Thẻ đặt chỗ mang “Ngày”, “Thời gian” và “Mã đặt chỗ”, cùng bất kỳ ghi chú nào mà đặt chỗ có.',
  'help.guide.place-booking.step.3': 'Nhấp vào thẻ đặt chỗ. Đặt chỗ mở ra phía trên bản đồ.',
  'help.guide.place-booking.step.4':
    '“Chỉnh sửa” ở chân đặt chỗ mở biểu mẫu riêng của nó. Trong đó, “Liên kết đến bài tập trong ngày” là thứ ghim một đặt chỗ vào một điểm dừng, và ở đây nó đã gọi tên điểm dừng này. Đóng biểu mẫu lại.',
  'help.guide.place-booking.step.5':
    'Một đặt chỗ mới cho một điểm dừng bắt đầu ở cột các ngày: di chuột lên điểm dừng và nhấp “Thêm đặt chỗ”, biểu tượng vé ở cuối nó. Biểu mẫu mở ra dưới tên “Đặt chỗ mới”, đã được liên kết sẵn với nó.',
  'help.guide.place-booking.result':
    'Đặt chỗ treo trên điểm dừng: nó ở trên thẻ, nó ở trong ngày, và các tập tin của nó cũng được liệt kê dưới “Tập tin” ở đây.',
  'help.guide.place-booking.tip.1':
    'Thẻ đặt chỗ chỉ hiện với điểm dừng mà đặt chỗ được ghim vào. Một đặt chỗ không có điểm dừng thì nằm ở tab “Đặt”.',
  'help.guide.place-booking.tip.2':
    'Nhiều đặt chỗ có thể dùng chung một điểm dừng: bữa trưa và chuyến tham quan khởi hành từ cùng một cửa.',
  'help.guide.place-booking.tip.3':
    'Một chuyến tàu, một chuyến bay hay một chuyến phà thì mở biểu mẫu di chuyển thay vào đó, đúng biểu mẫu mà tab “Di chuyển” dùng.',
  // place-files
  'help.guide.place-files.title': 'Giữ vé của một địa điểm cùng với địa điểm',
  'help.guide.place-files.goal': 'Đặt vé, phiếu hoặc bản đồ của một địa điểm ở nơi bạn sẽ tìm nó.',
  'help.guide.place-files.step.1':
    'Mở địa điểm. “Tập tin” nằm ở chân thẻ và ghi “Tập tin” khi địa điểm chưa có tập tin nào.',
  'help.guide.place-files.step.2': 'Nhấp “Tải lên” bên cạnh và chọn tập tin.',
  'help.guide.place-files.step.3': 'Nút đó đếm những gì địa điểm đang giữ, và danh sách tự mở ra.',
  'help.guide.place-files.step.4': 'Mỗi hàng là tên tập tin kèm kích thước. Nhấp vào để mở tập tin.',
  'help.guide.place-files.result':
    'Tập tin nằm trên địa điểm, được đếm trong thẻ, và nó cũng có ở tab “Tập tin” của chuyến đi.',
  'help.guide.place-files.tip.1':
    '“Tập tin” cũng liệt kê những gì treo trên đặt chỗ của điểm dừng này, nên xác nhận khách sạn hiện ra ở khách sạn.',
  'help.guide.place-files.tip.2': '“Tải lên” nhận nhiều tập tin cùng lúc.',
  'help.guide.place-files.tip.3':
    'Không có quyền “Tải tập tin lên” thì nút “Tải lên” không có ở đó; những tập tin đã có trên địa điểm thì vẫn còn.',
  // place-navigation
  'help.guide.place-navigation.title': 'Mở một địa điểm trong ứng dụng bản đồ hoặc trên trang web của nó',
  'help.guide.place-navigation.goal': 'Giao địa điểm cho ứng dụng thực sự sẽ đưa bạn đến đó.',
  'help.guide.place-navigation.step.1': 'Mở địa điểm và nhấp “Điều hướng” ở hàng dưới cùng.',
  'help.guide.place-navigation.step.2':
    'Danh sách là các ứng dụng bản đồ phù hợp với địa điểm này: Google Maps, Waze, Apple Maps, OpenStreetMap và CoMaps.',
  'help.guide.place-navigation.step.3':
    'Nhấp vào ứng dụng bạn dùng. Nơi nào làm được, TREK giao chính địa điểm đó chứ không chỉ một cặp tọa độ, nên bạn đến đúng lối vào.',
  'help.guide.place-navigation.step.4':
    '“Mở trang web” bên cạnh sẽ mở trang riêng của địa điểm, giờ giấc và vé của nó, trong một tab mới.',
  'help.guide.place-navigation.result':
    'Ứng dụng bản đồ mở ra ở địa điểm, trang web ở một tab riêng, và không có gì trong chuyến đi thay đổi.',
  'help.guide.place-navigation.tip.1':
    'Waze bắt đầu dẫn đường ngay. Các ứng dụng khác mở địa điểm, và bắt đầu từ đó là thêm một lần chạm.',
  'help.guide.place-navigation.tip.2':
    'Ứng dụng nào được đưa ra tùy vào địa điểm và thiết bị của bạn: Apple Maps bị bỏ ra trên Android, 高德地图 chỉ xuất hiện với địa điểm ở Trung Quốc, còn Waze, Apple Maps và CoMaps cần tọa độ của địa điểm.',
  'help.guide.place-navigation.tip.3': 'Khi chỉ một ứng dụng phù hợp, nút mang tên ứng dụng đó và mở nó ngay lập tức.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Lưu một địa điểm vào một trong các danh sách của bạn',
  'help.guide.place-to-collection.goal': 'Giữ lại một địa điểm bạn tìm thấy trong chuyến đi này cho chuyến sau.',
  'help.guide.place-to-collection.step.1': 'Mở địa điểm và nhấp “Lưu vào Bộ sưu tập” ở cuối thẻ.',
  'help.guide.place-to-collection.step.2':
    '“Lưu vào danh sách” hiện mọi danh sách bạn sở hữu hoặc được chia sẻ. Một dấu tích đánh dấu những danh sách đã có địa điểm này.',
  'help.guide.place-to-collection.step.3': 'Nhấp vào danh sách. Địa điểm vào trong đó ngay lập tức.',
  'help.guide.place-to-collection.step.4': 'Đóng lại, và nút trên thẻ ghi “Đã lưu”.',
  'help.guide.place-to-collection.result':
    'Địa điểm đã ở trong danh sách của bạn cùng hình ảnh, ghi chú và địa chỉ của nó, sẵn sàng cho chuyến đi sau.',
  'help.guide.place-to-collection.tip.1':
    'Nút đó chỉ có khi tiện ích bổ sung “Bộ sưu tập” đang bật, do quản trị viên bật ở mục “Tiện ích bổ sung”.',
  'help.guide.place-to-collection.tip.2':
    'Một địa điểm có thể nằm trong nhiều danh sách cùng lúc, với trạng thái riêng ở mỗi danh sách: “Ý tưởng” ở danh sách này, “Đã đến” ở danh sách khác.',
  'help.guide.place-to-collection.tip.3':
    '“Đánh dấu đã đến”, bên cạnh tên địa điểm trong hộp chọn, đánh dấu nó trong danh sách đó; khi địa điểm nằm trong nhiều danh sách của bạn, viên nút ghi “Đã đến ở mọi danh sách” và làm tất cả cùng một lúc.',
  // place-track
  'help.guide.place-track.title': 'Đọc một đường đi và cho nó màu riêng',
  'help.guide.place-track.goal':
    'Xem một chuyến đi bộ được nhập vào dài bao nhiêu, và phân biệt đường của nó với những đường khác trên bản đồ.',
  'help.guide.place-track.step.1':
    'Hàng của một đường đi ở cột địa điểm mang một nét ngắn theo màu mà đường của nó được vẽ. Nhấp vào đó.',
  'help.guide.place-track.step.2':
    '“Theo dõi số liệu thống kê” cho biết chiều dài của lối đi, theo “Đơn vị khoảng cách” bạn đã đặt.',
  'help.guide.place-track.step.3': '“Màu đường đi” phía trên nó cho thấy màu đang dùng. Nhấp vào hàng để mở bảng màu.',
  'help.guide.place-track.step.4': 'Chọn một màu. Đường trên bản đồ và nét trên hàng đổi theo.',
  'help.guide.place-track.step.5':
    'Ô nét đứt bên trái, “Màu tự động”, trả lại cho đường đi màu mà nó thừa hưởng; ống nhỏ giọt bên phải, “Chọn màu tùy chỉnh”, mở bộ chọn màu của hệ thống cho mọi màu khác.',
  'help.guide.place-track.result':
    'Đường đi được vẽ bằng màu bạn đã chọn, trên thẻ, trên hàng của nó ở cột địa điểm và trên bản đồ.',
  'help.guide.place-track.tip.1':
    'Chỉ địa điểm mang một lối đi, được nhập từ tập tin GPX, KML hoặc KMZ, mới có hai khối này.',
  'help.guide.place-track.tip.2':
    'Một đường đi được ghi kèm độ cao còn cho thấy điểm cao nhất và thấp nhất, số mét lên và xuống, cùng trắc đồ của chuyến đi bộ.',
  'help.guide.place-track.tip.3':
    'Mỗi lần nhập sẽ cho mỗi đường đi nó mang vào một màu riêng, nên hai chuyến đi bộ không bao giờ đến với cùng một màu.',
  // read-place
  'help.guide.read-place.step.7':
    'Hàng ở dưới cùng là những gì bạn làm được từ đây: đưa địa điểm ra khỏi ngày đang mở hoặc đặt nó vào, lưu nó vào một danh sách, mở nó trong ứng dụng bản đồ, chỉnh sửa hoặc xóa nó.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Tập tin',
  'help.ctx.trip-files.summary':
    'Mọi tài liệu của chuyến đi trong một danh sách: vé, xác nhận, thẻ và hình ảnh, mỗi thứ kèm một ghi chú, một liên kết tới địa điểm hoặc đặt chỗ mà nó thuộc về, và một thùng rác mà từ đó nó có thể trở lại.',
  'help.ctx.trip-files.bullet.1':
    '“Thả tập tin ở đây”, ô nét đứt dưới thanh, nhận các tập tin; một cú nhấp vào đó mở hộp chọn tập tin. Bên trong ô là các loại tập tin mà TREK này chấp nhận và “Max 50 MB”, giới hạn cho mỗi tập tin.',
  'help.ctx.trip-files.bullet.2':
    'Thanh ở trên cùng chứa “Tập tin” và các thẻ lọc “Tất cả”, “PDF”, “Hình ảnh” và “Tài liệu”, mỗi thẻ kèm số đếm. Một ngôi sao góp mặt sau “Tất cả” ngay khi có tập tin được đánh dấu sao, và “Ghi chú cộng tác” ở cuối ngay khi một ghi chú mang tệp đính kèm.',
  'help.ctx.trip-files.bullet.3':
    'Một hàng mang hình thu nhỏ hoặc loại tập tin, người đã tải lên, tên, ghi chú bên dưới, kích thước và ngày, cùng một huy hiệu cho mỗi liên kết: địa điểm, đặt chỗ hoặc phương tiện theo tên của nó (trỏ vào sẽ thấy “Kế hoạch ngày”, “Đặt chỗ” hoặc “Chuyên chở”), và “Từ ghi chú cộng tác”.',
  'help.ctx.trip-files.bullet.4':
    'Ở cuối một hàng có tối đa năm biểu tượng, mỗi biểu tượng hiện tên khi bạn trỏ vào: “Ngôi sao”, “Giao phó” (cây bút chì), “Mở”, “Tải xuống” và “Xóa bỏ”. “Xóa bỏ” không hỏi: tập tin đi vào thùng rác, nơi nó có thể được mang trở lại.',
  'help.ctx.trip-files.bullet.5':
    'Một hình ảnh hay video mở toàn màn hình, với các phím mũi tên và một dải hình thu nhỏ; mọi tài liệu khác mở trong một hộp thoại có tên của nó ở trên cùng, với “Mở trong tab mới” và “Tải xuống” bên dưới. Một thẻ ví thì được tải xuống ngay.',
  'help.ctx.trip-files.bullet.6':
    'Biểu tượng thùng rác ở đầu bên phải của thanh (“Rác”) chuyển danh sách sang các tập tin đã xóa, nơi từng tập tin được khôi phục hoặc xóa vĩnh viễn và “Dọn sạch thùng rác” trên thanh xóa hết. Khi chuyến đi đã được gắn với một kho tài liệu, hoặc với chủ chuyến đi hay quản trị viên ngay khi một kho được bật, “Đồng bộ tài liệu” nằm bên trái biểu tượng thùng rác.',
  // files-upload
  'help.guide.files-upload.title': 'Đưa một tài liệu vào chuyến đi',
  'help.guide.files-upload.goal':
    'Đưa một tấm vé, một xác nhận hay một bức ảnh ra khỏi thư mục tải xuống của bạn và vào chuyến đi, nơi mọi người trong đó đều với tới được.',
  'help.guide.files-upload.step.1':
    'Mở chuyến đi và nhấp “Tập tin” trên thanh thẻ. Tài liệu của chuyến đi nằm ở đó, với ô tải lên phía trên chúng.',
  'help.guide.files-upload.step.2':
    'Nhấp “Thả tập tin ở đây” và chọn một hoặc nhiều tập tin. Chúng được tải lên lần lượt và ô đó ghi “Đang tải lên...” trong lúc chạy. Bên trong ô, dưới “hoặc bấm vào để duyệt”, là các loại mà TREK này nhận và “Max 50 MB”, dung lượng tối đa của một tập tin.',
  'help.guide.files-upload.step.3':
    'Ngay khi tập tin cuối cùng lên xong, “Gán tập tin” tự mở cho nó (miễn là chuyến đi có địa điểm hoặc đặt chỗ nào đó), với tên tập tin ở phần đầu hộp thoại. “Thêm ghi chú...” dưới “Ghi chú” cho tập tin một dòng của riêng nó, và các danh sách bên dưới buộc nó vào một địa điểm hoặc một đặt chỗ. Đóng bằng dấu × ở góc trên bên phải; đóng lại không làm mất gì cả.',
  'help.guide.files-upload.step.4':
    'Các tập tin mới đứng ở đầu danh sách; chỉ các tập tin có dấu sao đứng trên chúng. Một hàng cho thấy ai đã tải lên, tên, kích thước và ngày; một hình ảnh có hình thu nhỏ, mọi tập tin khác có loại của nó.',
  'help.guide.files-upload.result':
    'Tài liệu đã ở trong chuyến đi, và mọi người thấy được chuyến đi đều có thể mở và tải chúng xuống.',
  'help.guide.files-upload.tip.1':
    'Một tập tin cũng có thể được kéo từ màn hình nền thẳng lên ô đó, và ô được làm nổi bật trong lúc tập tin ở trên nó.',
  'help.guide.files-upload.tip.2':
    'Một hình ảnh trong bộ nhớ tạm vào danh sách bằng Ctrl+V, nên ảnh chụp màn hình một đặt chỗ không bao giờ phải lưu trước.',
  'help.guide.files-upload.tip.3':
    'Tải lên cần quyền “Tải tập tin lên”; không có quyền đó thì ô kia hoàn toàn không có mặt. Một loại không có trong danh sách bị từ chối kèm một thông báo và không có gì được tải lên. Một tập tin trên 50 MB bị chính ô đó loại bỏ, trước khi có gì được gửi đi.',
  // files-link
  'help.guide.files-link.title': 'Buộc một tài liệu vào một địa điểm hoặc một đặt chỗ',
  'help.guide.files-link.goal': 'Làm cho tấm vé tìm được từ chính ngày nó thuộc về, chứ không chỉ từ danh sách này.',
  'help.guide.files-link.step.1':
    'Nhấp cây bút chì ở cuối hàng (“Giao phó”). “Gán tập tin” mở ra, với tên tập tin bên dưới trong phần đầu hộp thoại.',
  'help.guide.files-link.step.2':
    'Dưới “Ghi chú”, “Thêm ghi chú...” nhận một dòng, và dòng đó sau đấy đứng dưới tên tập tin trong danh sách. Nó được lưu khi bạn nhấn Enter hoặc rời khỏi ô.',
  'help.guide.files-link.step.3':
    'Dưới “Địa điểm”, ở bên trái, là các địa điểm của chuyến đi, gom theo ngày chúng nằm kèm ngày tháng của ngày đó, và “Chưa được chỉ định” ở cuối cho những địa điểm không thuộc ngày nào. Nhấp vào một cái và nó có dấu tích.',
  'help.guide.files-link.step.4':
    'Dưới “Đặt chỗ” và “Chuyên chở”, ở bên phải, là các đặt chỗ của chuyến đi. Nhấp cái mà tài liệu thuộc về; nó cũng có dấu tích của mình.',
  'help.guide.files-link.step.5':
    'Đóng bằng dấu × ở góc trên bên phải. Ở đây không có nút lưu: mỗi cú nhấp đã được ghi ngay lúc bạn thực hiện.',
  'help.guide.files-link.result':
    'Hàng đó mang ghi chú và một huy hiệu cho mỗi liên kết, một cái mang tên địa điểm và một cái mang tên chuyến bay (trỏ vào một huy hiệu sẽ thấy “Kế hoạch ngày” hoặc “Chuyên chở”), và tài liệu cũng treo trên địa điểm và trên chuyến bay.',
  'help.guide.files-link.tip.1':
    'Một tập tin có thể giữ nhiều liên kết cùng lúc, nên cùng một xác nhận có thể đồng thời thuộc về đặt chỗ khách sạn và địa điểm khách sạn.',
  'help.guide.files-link.tip.2': 'Nhấp lại một mục đã có dấu tích sẽ gỡ liên kết đó; bản thân tập tin vẫn còn.',
  'help.guide.files-link.tip.3':
    'Chiều ngược lại cũng vậy: một tài liệu đính kèm vào một địa điểm hoặc vào một đặt chỗ cũng nằm trong danh sách này, với chính huy hiệu ấy trên hàng của nó.',
  // files-star
  'help.guide.files-star.title': 'Giữ những tài liệu quan trọng ở trên cùng',
  'help.guide.files-star.goal':
    'Rút hai ba tờ giấy bạn thật sự sẽ cần ra khỏi một danh sách cứ dài thêm suốt chuyến đi.',
  'help.guide.files-star.step.1':
    'Nhấp ngôi sao ở cuối một hàng (“Ngôi sao”). Ngôi sao được tô vàng kim, một ngôi sao thứ hai hiện ra trước tên tập tin, và trỏ vào nút giờ sẽ thấy “Bỏ dấu sao”.',
  'help.guide.files-star.step.2':
    'Danh sách tự sắp lại: các tập tin có dấu sao đứng trên tất cả những tập tin khác, mới nhất trước trong từng nhóm.',
  'help.guide.files-star.step.3':
    'Một ngôi sao đã góp mặt cùng các thẻ lọc trên thanh, ngay sau “Tất cả”, với số tập tin có dấu sao bên cạnh. Nhấp vào đó để chỉ thấy những tập tin ấy.',
  'help.guide.files-star.result':
    'Những tờ giấy bạn cần ở quầy đứng ở đầu danh sách, và một thẻ không hiện gì khác ngoài chúng.',
  'help.guide.files-star.tip.1':
    'Thẻ ngôi sao chỉ tồn tại khi còn có thứ gì đó được đánh dấu sao. Bỏ dấu sao ở tập tin cuối cùng thì thẻ cũng biến mất theo.',
  'help.guide.files-star.tip.2':
    'Đánh dấu sao cần cùng quyền với “Giao phó”, là “Chỉnh sửa siêu dữ liệu tập tin”. Một thành viên không có quyền đó vẫn thấy các ngôi sao, nhưng một cú nhấp vào “Ngôi sao” không thay đổi gì với họ.',
  // files-filter
  'help.guide.files-filter.title': 'Tìm một tài liệu trong danh sách',
  'help.guide.files-filter.goal': 'Thu một danh sách có tất cả xuống còn đúng loại giấy tờ bạn đang cần.',
  'help.guide.files-filter.step.1':
    'Các thẻ lọc nằm trên thanh ở trên cùng, cạnh “Tập tin”: “Tất cả”, “PDF”, “Hình ảnh” và “Tài liệu”, mỗi thẻ có số tập tin bên cạnh.',
  'help.guide.files-filter.step.2': 'Nhấp “PDF”: danh sách giữ lại các tập tin PDF và không giữ gì khác.',
  'help.guide.files-filter.step.3':
    'Hai thẻ nữa đến rồi đi theo những gì có trong chuyến đi. Nhấp “Ghi chú cộng tác”, thẻ có mặt ngay khi một ghi chú trong thẻ “Cộng tác” mang tệp đính kèm: danh sách chỉ giữ lại những tập tin đó, không gì khác. Một ngôi sao cũng nhập vào hàng theo cách ấy, ngay khi có tập tin được đánh dấu sao.',
  'help.guide.files-filter.step.4': '“Tất cả” mang toàn bộ danh sách trở lại.',
  'help.guide.files-filter.result':
    'Danh sách chỉ hiện đúng thứ mà thẻ đã nêu, và con số trên mỗi thẻ cho biết đó là bao nhiêu.',
  'help.guide.files-filter.tip.1':
    'Ở đây không có thư mục và không có việc đổi tên: ghi chú trong “Gán tập tin”, các liên kết tới địa điểm và đặt chỗ, cùng ngôi sao, là cách để bạn phân biệt các tài liệu.',
  'help.guide.files-filter.tip.2':
    'Bản thân danh sách luôn xếp có dấu sao trước, rồi mới nhất trước, nên một tài liệu tải lên hôm nay đứng trên một tài liệu từ tháng trước.',
  // files-preview
  'help.guide.files-preview.title': 'Đọc một tài liệu mà không rời TREK',
  'help.guide.files-preview.goal':
    'Xem một tấm vé hay một bức ảnh ngay tại chỗ, và đưa nó về máy của bạn khi bạn cần nó ở đó.',
  'help.guide.files-preview.step.1':
    'Nhấp tên một hình ảnh hoặc hình thu nhỏ của nó. Nó mở toàn màn hình, với tên tập tin và vị trí của nó trong loạt ảnh ở góc trên bên trái.',
  'help.guide.files-preview.step.2':
    'Các mũi tên tròn ở hai bên, phím mũi tên trái và phải cùng dải hình thu nhỏ ở dưới đưa bạn qua mọi hình ảnh mà danh sách đang hiện.',
  'help.guide.files-preview.step.3':
    '“Mở trong tab mới” và “Tải xuống” là các nút tròn ở góc trên bên phải, cạnh dấu ×. Dấu ×, phím Escape hoặc một cú nhấp vào nền tối sẽ đóng hình ảnh lại.',
  'help.guide.files-preview.step.4':
    'Một tài liệu không phải hình ảnh thì thay vào đó mở trong một hộp thoại: tên của nó ở trên cùng, với “Mở trong tab mới” và “Tải xuống” dưới dạng nhãn bên dưới, và với tệp PDF thì chính trang đó ở phía dưới. Dấu × ở góc trên bên phải, phím Escape hoặc một cú nhấp bên cạnh hộp thoại sẽ đóng nó.',
  'help.guide.files-preview.step.5':
    'Mũi tên ở cuối một hàng (“Tải xuống”) lưu tập tin thẳng về máy của bạn, không mở gì trước.',
  'help.guide.files-preview.result':
    'Tài liệu đã ở trên màn hình, và chính hai nút đó đưa nó vào một tab trình duyệt hoặc lên ổ đĩa của bạn.',
  'help.guide.files-preview.tip.1': 'Trên màn hình cảm ứng, bạn vuốt qua các hình ảnh thay vì nhấp vào các mũi tên.',
  'help.guide.files-preview.tip.2':
    'Một thẻ ví không bao giờ mở bản xem trước: nó được tải xuống ngay, để điện thoại trao nó cho ứng dụng ví.',
  'help.guide.files-preview.tip.3':
    '“Mở trong tab mới” và “Tải xuống” đều lấy tập tin bằng phiên của bạn, nên một liên kết sao ra từ thanh địa chỉ chẳng dùng được cho ai khác.',
  // files-trash
  'help.guide.files-trash.title': 'Vứt một tài liệu đi, rồi lấy lại',
  'help.guide.files-trash.goal': 'Dọn đi những gì chuyến đi không còn cần, mà không mất thứ gì hóa ra bạn vẫn cần.',
  'help.guide.files-trash.step.1':
    'Nhấp thùng rác ở cuối một hàng (“Xóa bỏ”). Tập tin rời danh sách ngay lập tức và thông báo ghi “Đã chuyển vào thùng rác”. Không có gì hỏi trước.',
  'help.guide.files-trash.step.2':
    'Biểu tượng thùng rác ở đầu bên phải của thanh (“Rác”) chuyển danh sách sang những gì đã bị vứt đi. Tiêu đề của thanh ghi “Rác”, và các thẻ lọc cùng ô tải lên biến mất.',
  'help.guide.files-trash.step.3':
    'Một hàng đã bị vứt đi thì xám lại và chỉ còn hai biểu tượng: “Khôi phục”, đưa tập tin trở lại, và “Xóa bỏ”, gỡ nó đi vĩnh viễn sau một câu hỏi.',
  'help.guide.files-trash.step.4':
    'Nhấp “Khôi phục”. Thông báo ghi “Đã khôi phục tệp” và hàng đó rời thùng rác, vẫn còn nguyên ghi chú và các liên kết của nó.',
  'help.guide.files-trash.step.5':
    '“Dọn sạch thùng rác”, trên thanh cạnh biểu tượng thùng rác, xóa vĩnh viễn mọi thứ còn ở đây, và trình duyệt hỏi một lần trước khi làm. Biểu tượng thùng rác chuyển trở lại các tập tin.',
  'help.guide.files-trash.result': 'Tập tin đã trở lại danh sách đúng chỗ cũ, như thể chưa có chuyện gì xảy ra.',
  'help.guide.files-trash.tip.1':
    '“Xóa bỏ” trên một hàng không hỏi trước, và thùng rác là để dành cho đúng việc đó: không gì rời khỏi TREK cho tới khi bạn nói vậy ở trong đây.',
  'help.guide.files-trash.tip.2':
    'Vứt một tập tin đi rồi lấy lại cần quyền “Xóa tập tin”. Một thành viên không có quyền đó thì không thấy “Xóa bỏ” trên hàng, cũng không thấy các nút trong thùng rác.',
  'help.guide.files-trash.tip.3': 'Một tập tin đã bị xóa vĩnh viễn trong thùng rác thì không thể mang trở lại.',
  // files-sync
  'help.guide.files-sync.title': 'Giữ tài liệu đồng bộ với kho tài liệu của bạn',
  'help.guide.files-sync.goal':
    'Gắn chuyến đi với kho tài liệu của riêng bạn, để những gì tải lên ở đây đến được đó và những gì lưu ở đó xuất hiện ở đây.',
  'help.guide.files-sync.step.1':
    'Nhấp “Đồng bộ tài liệu”, cạnh biểu tượng thùng rác ở đầu bên phải của thanh. Hộp thoại mở ra với tên chuyến đi dưới tiêu đề. Bên trái, dưới “Kết nối nhà cung cấp”, là các kho mà quản trị viên đã bật, mỗi kho kèm một dòng về cách nó lưu trữ: Paperless-ngx và Papra theo thẻ, Nextcloud và Synology Drive theo thư mục, OpenCloud theo không gian. Bên phải ghi “Chưa kết nối gì”.',
  'help.guide.files-sync.step.2':
    'Nhấp vào kho của bạn, ở đây là Nextcloud. Một hộp thoại nhỏ hơn mở ra cho kết nối, mang tên kho và hỏi những thông tin mà kho đó dùng để đăng nhập.',
  'help.guide.files-sync.step.3':
    'Điền “Địa chỉ” và thông tin đăng nhập riêng của kho: “Mã thông báo API” cho Paperless-ngx, “Khóa API” và “ID tổ chức” cho Papra, “Tên đăng nhập” và “Mật khẩu ứng dụng” cho Nextcloud, “Tên đăng nhập” và “Mã thông báo ứng dụng” cho OpenCloud, còn với Synology Drive là “Tên đăng nhập”, “Mật khẩu” và, nếu tài khoản yêu cầu, “Mã xác thực hai yếu tố”. Hãy dùng mật khẩu ứng dụng hoặc mã thông báo ở bất cứ đâu kho cung cấp, không bao giờ dùng mật khẩu tài khoản của bạn. Nextcloud và Synology Drive còn nhận một “Thư mục gốc” tùy chọn, nơi TREK tìm các thư mục chuyến đi, ở đây là /Reisen. “Chấp nhận chứng chỉ tự ký” ở dưới cùng chỉ dành cho kho trên mạng riêng của bạn có chứng chỉ như vậy.',
  'help.guide.files-sync.step.4':
    'Nhấp “Kiểm tra kết nối”. TREK liên hệ kho bằng những gì bạn đã gõ và phần chân ghi “Đã kết nối, đăng nhập với tư cách” theo sau là tên tài khoản. Thông tin đăng nhập bị từ chối hay một địa chỉ không liên hệ được sẽ được nêu ở đó thay vào, và dù thế nào cũng chưa có gì được lưu.',
  'help.guide.files-sync.step.5':
    'Nhấp “Kết nối”. Kết nối được lưu cùng chuyến đi và TREK hỏi chuyến đi nên nằm ở đâu trong kho: thẻ, thư mục hay không gian chứa tài liệu của nó. Chỉ những gì nằm trong đó được đồng bộ. “Tạo mục mới” tạo nó khi nhấn “Tạo”, với tên điền sẵn từ tiêu đề chuyến đi; dưới “Hoặc dùng mục bạn đã có” là các mục đã có sẵn. Nhấp một mục, ở đây là thư mục Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Hộp thoại trở lại: kho của bạn đứng dưới “Chuyến đi này” ở bên trái, và thẻ của nó ở bên phải cho biết nơi nó đồng bộ tới, lần chạy gần nhất và “Đồng bộ ngay”. Lần chạy đầu tiên tự bắt đầu; “Đồng bộ ngay” chạy một lần bất cứ khi nào bạn muốn. Khi một lần chạy xong, huy hiệu “Chưa đồng bộ” cạnh tên nhường chỗ cho một chấm xanh lá, “Đã đồng bộ” khi bạn trỏ vào, và thanh luồng đếm số tài liệu mà TREK và kho mỗi bên đang giữ, với các làn “Gửi ra kho” và “Nhận từ kho” ở giữa. Đóng hộp thoại bằng dấu × ở góc trên bên phải.',
  'help.guide.files-sync.result':
    'Những tài liệu đã có sẵn ở đó đứng đầu danh sách, được tải lên dưới tên bạn, và mọi tài liệu của chuyến đi cũng đã ở trong kho, trừ những tài liệu đến từ “Ghi chú cộng tác”. Từ giờ TREK kiểm tra kho ở nền và kho theo sát danh sách.',
  'help.guide.files-sync.tip.1':
    'Chỉ chủ chuyến đi hoặc quản trị viên của máy chủ mới gắn được một chuyến đi, vì thông tin đăng nhập chạm tới toàn bộ tài khoản đó trong kho. Mọi thành viên đều thấy “Đồng bộ tài liệu” khi chuyến đi đã được gắn, và có thể mở nó, đọc thẻ và nhấn “Đồng bộ ngay”.',
  'help.guide.files-sync.tip.2':
    'Một kho trên mạng riêng của bạn cần ALLOW_INTERNAL_NETWORK=true trên máy chủ TREK, và địa chỉ của nó phải là địa chỉ của máy trong mạng, không bao giờ là localhost. Không có vậy, “Kiểm tra kết nối” trả lời “Địa chỉ đó không được phép.”',
  'help.guide.files-sync.tip.3':
    '“Ngắt kết nối”, biểu tượng cạnh “Đồng bộ ngay”, hỏi một lần, rồi chấm dứt ghép nối và giữ mọi tài liệu ở cả hai bên. Một thẻ, thư mục hay không gian được gắn lần thứ hai được coi là mới, và mọi thứ trong đó lại đi vào lần nữa, nên sau một lần “Ngắt kết nối” hãy gắn một mục trống thay vì mục cũ.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Chi tiết ngày',
  'help.ctx.trip-day-detail.summary':
    'Bảng mà tiêu đề của một ngày mở ra trên bản đồ: cả ngày đó, tên và ngày tháng của nó, thời tiết nơi bạn sẽ ở, các đặt chỗ rơi vào ngày đó và những đêm đã đặt cho nó.',
  'help.ctx.trip-day-detail.bullet.1':
    'Nhấp vào tiêu đề của một ngày trong cột ngày và bảng mở ra trên giữa bản đồ. Nhấp lại chính tiêu đề đó, hoặc dấu X ở bên phải nó, sẽ đóng bảng và bỏ chọn ngày.',
  'help.ctx.trip-day-detail.bullet.2':
    'Tiêu đề mang tên ngày và ngày tháng của nó. Cây bút chì cạnh tên đổi tên ngày, mũi tên kép gập bảng thành một thanh mỏng để bản đồ lại trống.',
  'help.ctx.trip-day-detail.bullet.3':
    'Trên cùng là thời tiết của ngày. “Dự báo cho” nêu tên nơi mà nó nói tới: điểm dừng đầu tiên của ngày, hoặc khách sạn nơi bạn thức dậy.',
  'help.ctx.trip-day-detail.bullet.4':
    '“Đặt chỗ” liệt kê các đặt chỗ của ngày đó, mỗi mục với loại của nó, điểm dừng mà nó thuộc về và giờ giấc. Màu xanh lá nghĩa là đã xác nhận, màu hổ phách là chưa giải quyết, và nhấp vào một hàng sẽ mở đặt chỗ đó.',
  'help.ctx.trip-day-detail.bullet.5':
    '“Chỗ ở” hiển thị mọi đêm đã đặt trên ngày này, với “Nhận phòng” và “Trả phòng” đúng vào ngày diễn ra, khung giờ nhận phòng, giờ trả phòng và số xác nhận.',
  'help.ctx.trip-day-detail.bullet.6':
    '“Thêm chỗ ở” đặt một đêm trên ngày này: chọn chỗ nghỉ từ các địa điểm của chuyến đi, cho biết nó phủ những ngày nào, rồi thêm giờ giấc và mã.',
  // day-panel
  'help.guide.day-panel.title': 'Mở một ngày và đọc chi tiết của nó',
  'help.guide.day-panel.goal': 'Nhìn trọn một ngày, thời tiết, các đặt chỗ và nơi bạn ngủ, mà không rời bản đồ.',
  'help.guide.day-panel.step.1':
    'Nhấp vào tiêu đề của một ngày trong cột ngày. Ngày đó được chọn và chi tiết của nó mở ra trên giữa bản đồ.',
  'help.guide.day-panel.step.2':
    'Tiêu đề nêu tên ngày, là “Ngày 1” cho tới khi bạn đặt tên cho nó, với ngày tháng bên dưới.',
  'help.guide.day-panel.step.3':
    'Trên cùng là thời tiết của ngày. “Dự báo cho” cho biết nó nói về nơi nào: điểm dừng đầu tiên của ngày, hoặc khách sạn nơi bạn thức dậy.',
  'help.guide.day-panel.step.4': '“Đặt chỗ” bên dưới liệt kê các đặt chỗ rơi vào ngày này, cùng giờ giấc của chúng.',
  'help.guide.day-panel.step.5':
    '“Chỗ ở” hiển thị những đêm đã đặt trên ngày này, với “Nhận phòng” và “Trả phòng” đúng vào ngày diễn ra.',
  'help.guide.day-panel.step.6':
    'Mũi tên kép trên tiêu đề gập bảng thành một thanh mỏng. Dấu X cạnh nó đóng bảng và bỏ chọn ngày.',
  'help.guide.day-panel.result':
    'Khi gập lại thành thanh, bảng để bản đồ trống mà vẫn giữ ngày được chọn; khi đóng, ngày bị bỏ chọn và kế hoạch trở lại như cũ.',
  'help.guide.day-panel.tip.1':
    'Nhấp vào bất cứ đâu trên thanh tiêu đề của bảng cũng gập nó lại. Mũi tên kép chỉ là cái nút cho việc đó.',
  'help.guide.day-panel.tip.2':
    'Mở một địa điểm từ cột địa điểm sẽ đặt chi tiết địa điểm vào chỗ của bảng. Đóng chúng lại thì ngày quay về.',
  // day-weather
  'help.guide.day-weather.title': 'Đọc thời tiết của ngày',
  'help.guide.day-weather.goal': 'Biết ngày đó sẽ thế nào ở nơi bạn thực sự có mặt hôm đó.',
  'help.guide.day-weather.step.1':
    '“Dự báo cho” nêu tên nơi mà các con số nói tới: điểm dừng đầu tiên của ngày, hoặc, vào một ngày không có điểm dừng nào, khách sạn nơi bạn thức dậy.',
  'help.guide.day-weather.step.2':
    'Con số lớn là nhiệt độ của ngày, cạnh nó là mức thấp và mức cao, và tình trạng thời tiết bằng chữ.',
  'help.guide.day-weather.step.3':
    'Các chip ở bên phải nó: xác suất mưa, lượng mưa, cơn gió mạnh nhất, cùng bình minh và hoàng hôn.',
  'help.guide.day-weather.step.4':
    'Dưới cùng là ngày theo từng giờ, cách hai giờ một: giờ, biểu tượng, nhiệt độ và xác suất mưa. Giờ nào trên 50% thì được tô xanh.',
  'help.guide.day-weather.result':
    'Thẻ của ngày trong cột ngày cũng mang đúng thời tiết đó ở cỡ nhỏ dưới số của nó, nên cả chuyến đi đọc được trong một cái nhìn.',
  'help.guide.day-weather.tip.1':
    'Độ và gió theo “Đơn vị nhiệt độ” trong “Hiển thị” ở Cài đặt: chọn “°F Fahrenheit” và vẫn dự báo đó được đọc ra bằng °F và mph.',
  'help.guide.day-weather.tip.2':
    'Một ngày không có điểm dừng nào có tọa độ và không có khách sạn để thức dậy thì không hiện thời tiết nào cả: dự báo luôn dành cho một nơi, không bao giờ cho cả chuyến đi.',
  'help.guide.day-weather.tip.3':
    'Xa hơn 16 ngày thì không có dự báo nào để lấy. Khi đó các con số là trung bình của những năm trước cho ngày đó, được đánh dấu bằng Ø và ghi rõ bên dưới.',
  // rename-day
  'help.guide.rename-day.title': 'Đặt tên cho ngày',
  'help.guide.rename-day.goal': 'Gọi một ngày đúng như nó là, “Đến Kyoto” hay “Ngày nghỉ”, thay vì “Ngày 5”.',
  'help.guide.rename-day.step.1': 'Mở ngày đó. Tiêu đề của nó ghi “Ngày 5”, với ngày tháng bên dưới.',
  'help.guide.rename-day.step.2': 'Nhấp vào cây bút chì cạnh tên.',
  'help.guide.rename-day.step.3': 'Tên biến thành một ô nhập. Gõ tên bạn muốn.',
  'help.guide.rename-day.step.4':
    'Nhấn Enter, hoặc chỉ cần nhấp ra chỗ khác; Escape vứt bỏ thay đổi. Thẻ của ngày trong cột ngày cũng mang tên đó.',
  'help.guide.rename-day.result':
    'Tên thay cho “Ngày 5” trong bảng và trên thẻ của ngày ở cột ngày; ngày tháng vẫn ở nguyên chỗ cũ.',
  'help.guide.rename-day.tip.1':
    'Xóa trống ô nhập rồi lưu, và ngày đó lại là “Ngày 5”: con số là thứ hiện ra khi không có tên.',
  'help.guide.rename-day.tip.2':
    'Tên thuộc về ngày, không thuộc về ngày tháng của nó. Sắp xếp lại các ngày thì nó đi theo cùng mọi thứ khác của ngày đó.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Đặt một đêm trên một ngày',
  'help.guide.add-accommodation.goal':
    'Đưa khách sạn vào kế hoạch một lần, cùng những ngày nó phủ, giờ giấc và số xác nhận của nó.',
  'help.guide.add-accommodation.step.1':
    'Chỗ nghỉ trước hết phải là một địa điểm của chuyến đi. Hãy tạo nó trong cột địa điểm như bạn tạo bất kỳ địa điểm nào khác: bộ chọn chỉ đưa ra những gì đã có sẵn.',
  'help.guide.add-accommodation.step.2': 'Mở ngày bạn đến và nhấp “Thêm chỗ ở” dưới “Chỗ ở”.',
  'help.guide.add-accommodation.step.3':
    '“Áp dụng cho ngày” cho biết kỳ nghỉ phủ những đêm nào: “Bắt đầu” là ngày nhận phòng, “Kết thúc” là ngày trả phòng, và “Tất cả” phủ cả chuyến đi. Phần đầu hộp thoại hiển thị khoảng ngày và số đêm.',
  'help.guide.add-accommodation.step.4':
    'Điền “Nhận phòng”, “Cho đến khi” và “Trả phòng”, và đặt số đặt chỗ dưới “Xác nhận”. Cả bốn đều có thể để trống.',
  'help.guide.add-accommodation.step.5':
    'Chọn chỗ nghỉ từ các địa điểm của chuyến đi. “Loại” phía trên danh sách thu hẹp nó về một danh mục.',
  'help.guide.add-accommodation.step.6': 'Nhấp “Lưu”.',
  'help.guide.add-accommodation.result':
    'Kỳ nghỉ hiện trên mọi ngày nó phủ, “Nhận phòng” ở ngày đầu và “Trả phòng” ở ngày cuối. Chỗ nghỉ trở thành một điểm dừng trên ngày nhận phòng, nên bản đồ vẽ đường tới đó, và một đặt chỗ “Chỗ ở” xuất hiện trên tab “Đặt”.',
  'help.guide.add-accommodation.tip.1':
    'Bộ chọn mở ở ngày bạn vừa rời, với trả phòng vào ngày kế tiếp; cả hai đều có thể dời trước khi bạn lưu.',
  'help.guide.add-accommodation.tip.2':
    'Hãy cho khách sạn danh mục Hotel của chuyến đi khi bạn tạo nó, và “Loại” phía trên danh sách sẽ thu về đúng các khách sạn của bạn chỉ bằng một cú nhấp.',
  'help.guide.add-accommodation.tip.3':
    'Giờ giấc đều là tùy chọn: một kỳ nghỉ không có giờ nhận phòng và không có mã vẫn phủ các đêm của nó và vẫn vẽ tuyến đường của nó.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Thay đổi hoặc hủy một đêm đã đặt',
  'help.guide.edit-accommodation.goal': 'Dời một kỳ nghỉ, sửa giờ giấc của nó, hoặc lấy nó ra khỏi kế hoạch.',
  'help.guide.edit-accommodation.step.1':
    'Thẻ hiển thị chỗ nghỉ và số xác nhận, vào ngày bạn đến kèm khung giờ nhận phòng và vào ngày bạn đi kèm giờ trả phòng.',
  'help.guide.edit-accommodation.step.2':
    'Cây bút chì ở bên phải nó mở lại kỳ nghỉ. Cửa sổ bật lên giờ ghi “Chỉnh sửa chỗ ở”.',
  'help.guide.edit-accommodation.step.3':
    'Sửa “Nhận phòng”, “Cho đến khi”, “Trả phòng” và “Xác nhận”. Các ngày ở trên chúng và chỗ nghỉ ở dưới cũng đổi được tại đây.',
  'help.guide.edit-accommodation.step.4': 'Nhấp “Lưu”.',
  'help.guide.edit-accommodation.step.5':
    'Dấu X cạnh cây bút chì kết thúc kỳ nghỉ. Nó không hỏi gì, và đặt chỗ “Chỗ ở” thuộc về nó cũng đi theo.',
  'help.guide.edit-accommodation.result':
    'Thay đổi tới mọi ngày mà kỳ nghỉ phủ cùng một lúc, và tới cả đặt chỗ “Chỗ ở” trên tab “Đặt”.',
  'help.guide.edit-accommodation.tip.1':
    'Một đêm ở giữa kỳ nghỉ không mang nhãn “Nhận phòng” lẫn “Trả phòng”: chỉ ngày đầu và ngày cuối của khoảng mới có.',
  'help.guide.edit-accommodation.tip.2':
    'Hủy một kỳ nghỉ cũng lấy đi điểm dừng mà nó đặt trên ngày nhận phòng và mọi chi phí gắn với đặt chỗ của nó. Hãy đặt lại đêm đó nếu đó là một nhầm lẫn.',
  // day-bookings
  'help.guide.day-bookings.title': 'Các đặt chỗ của ngày trong một cái nhìn',
  'help.guide.day-bookings.goal': 'Xem ở một chỗ những gì đã được đặt cho ngày này và chúng đã xác nhận hay chưa.',
  'help.guide.day-bookings.step.1':
    '“Đặt chỗ” liệt kê các đặt chỗ của ngày: những cái ghi ngày đúng vào đó, và những cái treo trên một trong các điểm dừng của nó.',
  'help.guide.day-bookings.step.2':
    'Một hàng hiển thị đó là loại đặt chỗ nào, tên của nó và, khi nó thuộc về một điểm dừng, điểm dừng đó màu xám theo sau. Giờ giấc nằm ở đầu bên phải, trước chấm trạng thái.',
  'help.guide.day-bookings.step.3':
    'Màu sắc cho biết một đặt chỗ đang ở đâu: hàng màu xanh lá là đã xác nhận, hàng màu hổ phách là chưa giải quyết. Khách sạn không nằm trong danh sách này, chúng có khối riêng ở bên dưới.',
  'help.guide.day-bookings.step.4':
    'Nhấp vào một hàng và đặt chỗ mở ra. “Chỉnh sửa” ở chân nó dùng để thay đổi; đặt chỗ mới được tạo trên tab “Đặt”.',
  'help.guide.day-bookings.result':
    'Mọi thứ ghi ngày vào ngày đó, và mọi thứ treo trên một trong các điểm dừng của nó, đều nằm trong danh sách duy nhất này.',
  'help.guide.day-bookings.tip.1':
    'Một đặt chỗ rơi vào một ngày theo ngày tháng của chính nó. Đổi ngày trên tab “Đặt” và nó tự chuyển sang ngày kia.',
  'help.guide.day-bookings.tip.2':
    'Không có khối “Đặt chỗ” nghĩa là ngày đó không có đặt chỗ nào: nó bị ẩn đi thay vì hiện ra trống.',
  'help.guide.map-lock.title': 'Khóa bản đồ',
  'help.guide.map-lock.goal': 'Giữ bản đồ đứng yên trong khi bạn nhấp qua các ngày và địa điểm.',
  'help.guide.map-lock.step.1':
    'Nhấp vào ổ khóa trên bản đồ. Khi khóa đóng, việc mở một ngày hay chọn một địa điểm không còn thu phóng hay di chuyển bản đồ.',
  'help.guide.map-lock.result': 'Bản đồ giữ nguyên chỗ bạn để lại trong khi bạn làm việc với kế hoạch.',
  'help.guide.map-lock.tip.1': 'Nhấp lại vào ổ khóa để bản đồ đi theo mục đang chọn.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Bản đồ',
  'help.ctx.trip-map.summary':
    'Phần giữa của kế hoạch: mọi địa điểm của chuyến đi dưới dạng ghim, các tuyến nối chúng lại, và các nút dọc theo mép bản đồ cho vệ tinh, cho toàn bộ chuyến đi cùng lúc và cho những địa điểm quanh khu phố bạn đang xem.',
  'help.ctx.trip-map.bullet.1':
    'Một ghim là một địa điểm: ảnh riêng của nó nếu có, nếu không thì màu danh mục cùng biểu tượng danh mục. Đưa con trỏ lên một ghim để có một thẻ với hình ảnh, tên và địa chỉ của nó, thêm đánh giá và danh mục ở những địa điểm có mang chúng. Kéo một ghim lên thẻ của một ngày để lên kế hoạch cho địa điểm vào ngày đó.',
  'help.ctx.trip-map.bullet.2':
    'Những ghim quá gần nhau đến mức không phân biệt được sẽ gộp vào một bong bóng sẫm màu kèm một con số. Nhấp vào bong bóng và bản đồ phóng tới những gì bên trong.',
  'help.ctx.trip-map.bullet.3':
    'Nhấp một ghim để mở địa điểm trong một thẻ ở chân bản đồ, với đánh giá, “Tập tin” và những gì có thể làm tiếp với nó; nhấp vào một chỗ trống của bản đồ để thả nó ra.',
  'help.ctx.trip-map.bullet.4':
    'Khi một ngày đang mở trong cột các ngày, các điểm dừng của nó mang một phù hiệu trắng nhỏ ghi số thứ tự trong ngày đó, và một địa điểm xuất hiện hai lần trong ngày mang cả hai số của nó.',
  'help.ctx.trip-map.bullet.5':
    'Hàng biểu tượng ở trên cùng tìm trong phần bản đồ bạn đang thấy: “Nhà hàng”, “Quán cà phê”, “Quán bar & cuộc sống về đêm”, “Chỗ ở”, “Điểm tham quan”, “Bảo tàng & văn hóa”, “Thiên nhiên & công viên” và “Các hoạt động”. “Tìm kiếm khu vực này” chạy lại sau khi bạn di chuyển bản đồ.',
  'help.ctx.trip-map.bullet.6':
    'Nhấp chuột phải ở bất cứ đâu trên bản đồ để mở biểu mẫu địa điểm tại điểm đó, với địa chỉ đã được tra sẵn. Nút tròn ở góc dưới bên trái đổi bản đồ vẽ lấy ảnh chụp từ trên không, còn ổ khóa giữ nguyên góc nhìn trong khi bạn nhấp qua các ngày và địa điểm.',
  'help.ctx.trip-map.bullet.7':
    '“Hiện toàn bộ chuyến đi” ở góc dưới bên phải vẽ mọi ngày di chuyển cùng lúc và liệt kê mỗi ngày đi qua những gì; biểu tượng tuyến trên hàng của một đặt chỗ vẽ đặt chỗ đó, còn biểu tượng trên thanh công cụ phía trên các ngày vẽ tất cả. Nhấp vào một đầu của đặt chỗ đã vẽ để mở chi tiết của nó.',
  'help.ctx.trip-map.bullet.8':
    'Khi tiện ích Dawarich đang bật, nút Dawarich tròn bên dưới “Hiện toàn bộ chuyến đi” vẽ lộ trình mà điện thoại của bạn thực sự đã ghi lại: “Hiện lộ trình đã ghi” đặt nó dưới dạng nét đứt bên dưới lộ trình đã lên kế hoạch, mỗi ngày một màu, và nhãn của nút cho biết vì sao không có đường nào khi không có.',
  // map-markers
  'help.guide.map-markers.title': 'Đọc bản đồ',
  'help.guide.map-markers.goal': 'Biết mỗi ghim, phù hiệu và bong bóng trên bản đồ đang nói gì với bạn.',
  'help.guide.map-markers.step.1':
    'Bản đồ chứa mọi địa điểm của chuyến đi. Ở nơi các ghim nằm quá gần nhau đến mức không phân biệt được, chúng gộp vào một bong bóng sẫm màu mang con số bên trong; nhấp vào bong bóng thì bản đồ phóng tới những gì đã ở trong đó, còn ở mức phóng sâu nhất thì xòe các ghim ra.',
  'help.guide.map-markers.step.2':
    'Một ghim là ảnh riêng của địa điểm nếu có, nếu không thì màu danh mục cùng biểu tượng danh mục. Đưa con trỏ lên một ghim và một thẻ mở ra bên cạnh nó: cùng tấm ảnh đó nhưng lớn hơn, tên và địa chỉ, cùng đánh giá và danh mục ở những địa điểm có mang chúng.',
  'help.guide.map-markers.step.3':
    'Nhấp một ghim và địa điểm mở ra trong một thẻ ở chân bản đồ: hình ảnh, tên và địa chỉ ở phần đầu thẻ, rồi đến các ngôi sao, phần mô tả và “Tập tin”, và dọc phía dưới là những việc làm tiếp với nó, trong đó có “Điều hướng”, “Lưu vào Bộ sưu tập” (“Đã lưu” khi địa điểm đã ở trong một bộ sưu tập), “Chỉnh sửa” và “Xóa bỏ”, và khi đang mở một ngày thì có “Thêm vào ngày”, hoặc “Xóa khỏi ngày” khi địa điểm đã có trong ngày đó. Dấu X ở phần đầu thẻ, hoặc một cú nhấp vào chỗ trống của bản đồ, sẽ đóng nó lại.',
  'help.guide.map-markers.step.4':
    'Mở một ngày trong cột các ngày và các điểm dừng của nó được đánh số: phù hiệu trắng nhỏ ở góc ghim là vị trí của điểm dừng đó trong ngày. Một địa điểm xuất hiện hai lần trong ngày mang cả hai số của nó. Không có ngày nào đang mở thì không có số, và góc ghim mang đánh giá của địa điểm thay vào đó, nếu địa điểm có đánh giá.',
  'help.guide.map-markers.step.5':
    'Kéo một ghim khỏi bản đồ lên thẻ của một ngày trong cột các ngày và địa điểm được lên kế hoạch cho ngày đó, y như khi kéo hàng của nó ra khỏi danh sách địa điểm.',
  'help.guide.map-markers.result':
    'Không có gì trong chuyến đi thay đổi: bản đồ là một cách nhìn nó, và mỗi ghim nói rõ địa điểm nào, ngày nào và theo thứ tự nào.',
  'help.guide.map-markers.tip.1':
    'Một ngày được gập lại trong cột các ngày sẽ mang các điểm dừng của nó rời khỏi bản đồ theo; mở lại ngày đó và chúng trở về.',
  'help.guide.map-markers.tip.2':
    'Bộ lọc phía trên danh sách địa điểm cũng quyết định bản đồ vẽ gì: chọn “Không có kế hoạch” và chỉ còn lại trên đó những địa điểm chưa có ngày.',
  'help.guide.map-markers.tip.3':
    'Bản đồ này không có nút thu phóng: con lăn phóng to thu nhỏ, nhấp đúp phóng thêm một bậc, và kéo chính bản đồ thì di chuyển nó.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Tìm địa điểm quanh bạn trên bản đồ',
  'help.guide.map-nearby-places.goal':
    'Để bản đồ tìm nhà hàng, điểm tham quan hay một khách sạn trong khu phố bạn đang xem, rồi đưa một trong số đó vào chuyến đi.',
  'help.guide.map-nearby-places.step.1':
    'Hàng biểu tượng ở trên cùng bản đồ là phần tìm theo danh mục: “Nhà hàng”, “Quán cà phê”, “Quán bar & cuộc sống về đêm”, “Chỗ ở”, “Điểm tham quan”, “Bảo tàng & văn hóa”, “Thiên nhiên & công viên” và “Các hoạt động”.',
  'help.guide.map-nearby-places.step.2':
    'Nhấp một danh mục. TREK tìm loại địa điểm đó trong phần bản đồ bạn đang thấy và thả một ghim theo màu của danh mục cho mỗi kết quả. Mỗi lần một danh mục: nhấp danh mục khác sẽ đổi, và nhấp danh mục đang bật sẽ tắt nó.',
  'help.guide.map-nearby-places.step.3':
    'Di chuyển bản đồ và một nút thứ hai xuất hiện dưới hàng đó: “Tìm kiếm khu vực này” chạy đúng tìm kiếm ấy cho khung nhìn mới. Chỉ di chuyển thôi thì không bao giờ tìm lại, nhờ vậy số lượt yêu cầu được giữ thấp.',
  'help.guide.map-nearby-places.step.4':
    'Đưa con trỏ lên một ghim để xem tên của thứ nó tìm thấy. Nhấp vào ghim và biểu mẫu địa điểm mở ra, đã được điền sẵn từ đó: tên ở phần đầu hộp thoại, “Địa chỉ”, “Vĩ độ” và “Kinh độ”, cùng “Trang web” ở những nơi tìm kiếm tìm được một trang.',
  'help.guide.map-nearby-places.step.5':
    'Kiểm tra những gì đã được điền và bổ sung những gì tìm kiếm không thể biết: một danh mục từ nhãn dưới tên, nhãn này ghi “Không có danh mục” cho đến khi bạn chọn, một “Miêu tả”, những ghi chú của riêng bạn.',
  'help.guide.map-nearby-places.step.6':
    'Nhấp “Thêm”. Nếu một địa điểm cùng tên hoặc ở cùng vị trí đã có trong chuyến đi, TREK sẽ nói vậy và nút đổi thành “Vẫn thêm”.',
  'help.guide.map-nearby-places.result':
    'Địa điểm nằm trong danh sách địa điểm và trên bản đồ như một trong những ghim của chính chuyến đi, dưới “Không có kế hoạch” cho đến khi bạn đặt nó vào một ngày. Các ghim tìm kiếm còn đó cho đến khi bạn tắt danh mục.',
  'help.guide.map-nearby-places.tip.1':
    'Hàng đó biến mất khi “Khám phá các địa điểm trên bản đồ” bị tắt trong “Cài đặt”, ở mục “Du lịch & bản đồ”.',
  'help.guide.map-nearby-places.tip.2':
    'Câu trả lời đến từ chỉ mục địa điểm của TREK và từ OpenStreetMap, nên đây là một trong số ít thứ trong kế hoạch cần có kết nối.',
  'help.guide.map-nearby-places.tip.3':
    'Một lượt tìm kiếm bao phủ những gì đang trên màn hình, nên hãy phóng tới con phố bạn đang hỏi: cả một thành phố sẽ trả về sáu mươi kết quả đầu tiên và gần như không có thứ tự.',
  // map-add-place
  'help.guide.map-add-place.title': 'Tạo một địa điểm bằng cách nhấp chuột phải lên bản đồ',
  'help.guide.map-add-place.goal': 'Đặt một địa điểm đúng nơi bạn muốn, mà không cần tìm nó trước.',
  'help.guide.map-add-place.step.1':
    'Nhấp chuột phải vào điểm bạn muốn trên bản đồ. Biểu mẫu địa điểm mở ra, với phần đầu ghi “Thêm địa điểm/Hoạt động”.',
  'help.guide.map-add-place.step.2':
    '“Vĩ độ” và “Kinh độ” đã sẵn ở điểm đó, và TREK tra tọa độ rồi điền “Địa chỉ” từ những gì nó tìm thấy ở đó, và điền cả tên ở phần đầu hộp thoại khi việc tra cứu có tên để đưa ra. Chưa có gì được lưu, nên hãy ghi đè lên bất cứ chỗ nào sai.',
  'help.guide.map-add-place.step.3':
    'Gõ một cái tên mà bạn sẽ nhận ra vào phần đầu hộp thoại, chọn một danh mục từ nhãn bên dưới nó, nhãn này ghi “Không có danh mục” cho đến khi bạn chọn, và thêm phần còn lại mà kế hoạch nên biết: “Miêu tả”, “Ghi chú”, “Trang web”.',
  'help.guide.map-add-place.step.4':
    'Nhấp “Thêm”. Địa điểm rơi vào danh sách ở trạng thái chưa có kế hoạch ngay cả khi một ngày đang mở: nhấp chuột phải trên bản đồ nói ở đâu, chứ không nói khi nào.',
  'help.guide.map-add-place.result':
    'Địa điểm nằm trong danh sách và trên bản đồ, dưới “Không có kế hoạch” cho đến khi bạn đặt nó vào một ngày.',
  'help.guide.map-add-place.tip.1':
    'Địa chỉ đến từ một lượt tra ngược tọa độ, nên nó có thể đọc ra như một con phố chứ không phải một cái tên, và ở vùng đồng không mông quạnh nó có thể trở về rỗng. Cả hai ô đều là của bạn để ghi đè.',
  'help.guide.map-add-place.tip.2':
    'Trên bản đồ MapLibre GL và Mapbox GL, nhấp chuột giữa cũng làm điều tương tự, và trên màn hình cảm ứng thì nhấn giữ lâu.',
  // map-satellite
  'help.guide.map-satellite.title': 'Chuyển sang vệ tinh',
  'help.guide.map-satellite.goal': 'Đổi bản đồ vẽ lấy ảnh chụp từ trên không, rồi quay lại.',
  'help.guide.map-satellite.step.1':
    'Nút tròn ở góc dưới bên trái bản đồ là nút đổi lớp nền. Biểu tượng của nó luôn cho thấy lớp mà nó sẽ chuyển tới, và đưa con trỏ lên sẽ nói rõ lớp nào: “Chuyển sang chế độ xem vệ tinh”. Nhấp vào nút.',
  'help.guide.map-satellite.step.2':
    'Bản đồ giờ là ảnh chụp từ trên không, đủ sâu để nhận ra một tòa nhà riêng lẻ, và không cần khóa riêng của bạn. Mọi thứ TREK vẽ vẫn nằm trên đó: các ghim, tuyến của ngày, các tuyến đường đã ghi và các lộ trình đặt chỗ.',
  'help.guide.map-satellite.step.3': 'Nút giờ ghi “Chuyển sang chế độ xem bản đồ”. Nhấp vào nó để quay lại bản đồ vẽ.',
  'help.guide.map-satellite.result': 'Bản đồ lại được vẽ, và lớp bạn để lại được nhớ trên tài khoản của bạn.',
  'help.guide.map-satellite.tip.1':
    'Lựa chọn này được giữ trên tài khoản của bạn chứ không phải trên chuyến đi, nên mọi chuyến đi đều mở ra đúng như bạn đã để, dù bạn dùng trình dựng bản đồ nào.',
  'help.guide.map-satellite.tip.2':
    'Ảnh chụp từ trên không không mang chữ viết: tên phố, quận và số nhà nằm trên bản đồ vẽ, nên hãy chuyển về khi bạn đang tìm một địa chỉ.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Xem toàn bộ chuyến đi và các quãng đường của nó',
  'help.guide.map-whole-trip.goal':
    'Đổi một ngày đang mở lấy mọi ngày di chuyển của chuyến đi, và đọc mỗi ngày đi xa đến đâu.',
  'help.guide.map-whole-trip.step.1':
    'Nút tròn “Hiện toàn bộ chuyến đi” nằm ở góc dưới bên phải bản đồ. Nhấp vào nút và mọi ngày di chuyển của chuyến đi được vẽ cùng lúc, mỗi ngày một màu riêng, nên các ngày kề nhau vẫn tách bạch.',
  'help.guide.map-whole-trip.step.2':
    'Thẻ phía trên nút liệt kê những ngày đó: một chấm màu, tên ngày, một biểu tượng cho mỗi cách bạn di chuyển trong ngày, và quãng đường ngày đó đi qua. “Tổng quãng đường” ở trên cùng.',
  'help.guide.map-whole-trip.step.3':
    'Nhấp một ngày trong thẻ để chọn nó: hàng của nó được tô nền và ngày đó mở ra trong cột các ngày. Lăn bánh xe chuột trên một thành phố để phóng to, và các ngày đi qua đó nằm cạnh nhau, mỗi ngày mang màu của nó.',
  'help.guide.map-whole-trip.step.4': 'Nút giờ ghi “Ẩn toàn bộ chuyến đi”. Nhấn nó để trở về một ngày đang mở.',
  'help.guide.map-whole-trip.result':
    'Mọi ngày di chuyển được vẽ bằng màu riêng, và thẻ cho biết mỗi ngày đi qua những gì và cả chuyến đi cộng lại là bao nhiêu.',
  'help.guide.map-whole-trip.tip.1':
    'Tổng số đến dần theo từng vài chặng. Khi còn một … theo sau nó, con số vẫn là tổng một phần; nó ổn định khi mọi chặng đã trả lời.',
  'help.guide.map-whole-trip.tip.2':
    'Một chặng mà bộ định tuyến từ chối sẽ vẫn là một đường thẳng và không được tính, và thẻ nói rõ điều đó thay vì lặng lẽ hiển thị thấp hơn thực tế.',
  'help.guide.map-whole-trip.tip.3':
    'Một ngày không có gì để nối, tức là có ít hơn hai điểm dừng đã xác định vị trí và không có chặng lái xe tới hay từ khách sạn của nó, thì không có tuyến nào để vẽ, nên nó bị bỏ hẳn khỏi thẻ.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Hiện lộ trình của một đặt chỗ trên bản đồ',
  'help.guide.map-booking-routes.goal':
    'Vẽ lên bản đồ các chuyến bay, chuyến tàu và chặng lái xe bạn đã đặt, rồi gỡ chúng đi.',
  'help.guide.map-booking-routes.step.1':
    'Lộ trình đặt chỗ tắt cho đến khi bạn yêu cầu một cái. Ở đầu bên phải hàng của một phương tiện trong cột các ngày có một biểu tượng tuyến nhỏ: “Hiển thị lộ trình đặt vé”.',
  'help.guide.map-booking-routes.step.2':
    'Nhấp vào nó. Đặt chỗ hiện lên trên bản đồ: chuyến bay là một cung vòng tròn lớn, chặng lái xe bám theo đường thật, chuyến tàu là chuỗi các ga của nó. “Đã xác nhận” được vẽ liền nét, “Chưa giải quyết” vẽ nét đứt, và hai đầu của lộ trình là những viên thuốc màu xanh mang biểu tượng phương tiện.',
  'help.guide.map-booking-routes.step.3':
    'Nhấp một viên thuốc ở đầu tuyến và chi tiết của đặt chỗ mở ra: trạng thái, loại và các ngày dưới dạng nhãn ở phần đầu được tô màu, giờ ở cả hai đầu, phần còn lại bên dưới, và ở chân là “Trên bản đồ”, nút tắt lại lộ trình này, thùng rác xóa đặt chỗ, và “Chỉnh sửa”. Dấu X ở phần đầu đóng chi tiết lại.',
  'help.guide.map-booking-routes.step.4':
    'Biểu tượng tuyến trên thanh công cụ phía trên các ngày làm việc đó cho cả chuyến đi cùng lúc: “Hiển thị tất cả lộ trình đặt chỗ” vẽ mọi đặt chỗ có lộ trình.',
  'help.guide.map-booking-routes.step.5':
    'Đó là một khởi đầu sạch chứ không phải một lớp chồng lên, nên những gì bạn đã chọn theo từng đặt chỗ sẽ bị bỏ. Nhấn lại, giờ đây ghi “Ẩn tất cả lộ trình đặt chỗ”, và bản đồ sạch trơn.',
  'help.guide.map-booking-routes.result':
    'Những đặt chỗ bạn yêu cầu được vẽ trên bản đồ, và lựa chọn đó được giữ cho chuyến đi này trong trình duyệt này cho đến khi bạn thay đổi.',
  'help.guide.map-booking-routes.tip.1':
    'Hai đầu chỉ mang mã sân bay hoặc tên nhà ga khi “Nhãn lộ trình đặt chỗ” được bật trong “Cài đặt”, ở mục “Du lịch & bản đồ”; nếu không, chúng chỉ hiện biểu tượng.',
  'help.guide.map-booking-routes.tip.2':
    '“Luôn hiển thị tuyến đường đặt chỗ”, trong cùng phần cài đặt đó, vẽ chúng ngay từ đầu trên mọi chuyến đi bạn chưa quyết định.',
  'help.guide.map-booking-routes.tip.3':
    'Một đặt chỗ cần hai đầu có tọa độ trước khi có thể được vẽ, nên một khách sạn hay một nhà hàng không mang biểu tượng tuyến.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Hiện lộ trình bạn đã thực sự đi',
  'help.guide.map-dawarich-trail.goal':
    'Đặt lộ trình mà Dawarich đã ghi trên điện thoại của bạn lên bản đồ, dưới dạng nét đứt bên cạnh lộ trình bạn đã lên kế hoạch, và đọc chuyến đi từng ngày một như nó đã thực sự diễn ra.',
  'help.guide.map-dawarich-trail.step.1':
    'Nút Dawarich tròn nằm ở góc dưới bên phải bản đồ, bên dưới “Hiện toàn bộ chuyến đi”; đưa con trỏ lên nó thì hiện “Hiện lộ trình đã ghi”. Nhấp vào nó. TREK hỏi Dawarich của bạn về các ngày của chuyến đi, và một vòng quay quanh nút trong khi câu trả lời đang trên đường tới.',
  'help.guide.map-dawarich-trail.step.2':
    'Lộ trình đã ghi hiện ra dưới dạng một đường nét đứt, mỗi ngày một màu, được vẽ bên dưới lộ trình đã lên kế hoạch để kế hoạch vẫn đọc được. Nút giờ ghi “Ẩn lộ trình đã ghi”. Các ngày được cắt ở nửa đêm giờ địa phương, và một ngày được gập lại trong cột các ngày sẽ mang đường nét đứt của nó rời khỏi bản đồ cùng với các điểm dừng.',
  'help.guide.map-dawarich-trail.step.3':
    'Nhấp cả “Hiện toàn bộ chuyến đi” và mọi ngày đã lên kế hoạch được vẽ bằng nét liền bên cạnh bản ghi nét đứt. Nơi hai đường chạy cùng nhau là ngày đã diễn ra như kế hoạch; nơi đường nét đứt lạc đi là nơi nó đã không như vậy.',
  'help.guide.map-dawarich-trail.result':
    'Những gì bạn đã lên kế hoạch và những gì bạn thực sự đã làm cùng nằm trên bản đồ, nét đứt bên nét liền, và thẻ phía trên các nút vẫn liệt kê các ngày đã lên kế hoạch cùng khoảng cách của chúng.',
  'help.guide.map-dawarich-trail.tip.1':
    'Bật hay tắt được nhớ theo từng chuyến đi cho phiên trình duyệt này. Khi lộ trình đang bật, TREK hỏi lại Dawarich mỗi hai phút, nên một chuyến đi đang diễn ra sẽ cập nhật mà không cần tải lại; bản thân lộ trình không bao giờ được lưu, nên nó không nằm trong cơ sở dữ liệu của TREK, không trong bản sao lưu và không có khi ngoại tuyến.',
  'help.guide.map-dawarich-trail.tip.2':
    'Nhãn của nút giải thích một bản đồ trống: “Đang tải lộ trình đã ghi…” khi nó đang trên đường tới, “Không có gì được ghi lại trong những ngày này”, “Không tải được lộ trình đã ghi”, hoặc “Lộ trình đã ghi cần có kết nối” khi TREK đang ngoại tuyến.',
  // map-compass
  'help.guide.map-compass.title': 'Xoay bản đồ và tìm lại hướng bắc',
  'help.guide.map-compass.goal': 'Xoay bản đồ theo hướng bạn đang đi, và đưa nó về hướng bắc chỉ bằng một cú nhấp.',
  'help.guide.map-compass.step.1':
    'Xoay bản đồ bằng cách kéo với nút chuột phải, hoặc giữ Ctrl và kéo với nút trái; trên màn hình cảm ứng, vặn bằng hai ngón tay. La bàn tròn cạnh hàng biểu tượng danh mục ở trên cùng bản đồ xoay theo: mũi tên của nó luôn chỉ hướng bắc, nên nó nghiêng đúng bằng mức bạn đã xoay.',
  'help.guide.map-compass.step.2':
    'Nhấp vào la bàn. “Reset north”, như tên của nút, đưa bản đồ nhẹ nhàng trở về với hướng bắc ở trên và góc nhìn phẳng, và mũi tên lại đứng thẳng.',
  'help.guide.map-compass.result':
    'Bản đồ lại hướng bắc lên trên và phẳng, và không có gì trong chuyến đi thay đổi: la bàn chỉ di chuyển máy quay.',
  'help.guide.map-compass.tip.1':
    'La bàn chỉ có trên bản đồ MapLibre GL và Mapbox GL; bản đồ Leaflet không xoay được, nên không có la bàn. “Nhà cung cấp bản đồ” trong “Cài đặt”, ở mục “Bản đồ”, quyết định bạn dùng cái nào, và “Lưu bản đồ” giữ lựa chọn đó.',
  'help.guide.map-compass.tip.2':
    'Cú nhấp cũng bỏ độ nghiêng: kéo với nút chuột phải lên hoặc xuống làm nghiêng góc nhìn, và “Reset north” làm phẳng nó cùng với xoay. Trên Mapbox GL với “Tòa nhà & địa hình 3D” đang bật, điều đó cũng làm phẳng góc nhìn 3D, cho đến khi bạn nghiêng lại.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Cộng tác',
  'help.ctx.trip-collab.summary':
    'Tab nơi cả nhóm cùng lên kế hoạch, trong năm thẻ: “Trò chuyện” ở bên trái, “Ghi chú” và “Liên kết” bên cạnh, “Thăm dò ý kiến” và “Tiếp theo là gì” ở dưới chúng. Mọi thứ viết ở đây đều có mặt trên màn hình của mọi thành viên khác ngay lập tức, không cần tải lại.',
  'help.ctx.trip-collab.bullet.1':
    '“Trò chuyện” là thẻ bên trái. Viết vào “Nhập tin nhắn...” rồi nhấn Enter; Shift và Enter tạo một dòng mới. Mặt cười thêm một biểu tượng cảm xúc, “Đính kèm ảnh” treo tối đa bốn tấm ảnh lên tin nhắn.',
  'help.ctx.trip-collab.bullet.2':
    'Rê chuột lên một tin nhắn để có “Hồi đáp” và, với tin nhắn của chính bạn, “Xóa bỏ”; nhấp chuột phải để có tám phản ứng nhanh. Một tin nhắn đã xóa để lại một dòng cho biết ai đã xóa nó.',
  'help.ctx.trip-collab.bullet.3':
    '“Ghi chú” là tập giấy dùng chung: “Ghi chú mới” ở phần đầu thẻ viết một tờ, và bánh răng bên cạnh mở “Quản lý danh mục” để đặt tên và màu cho chúng. Một thẻ ghi chú hiện danh mục của nó dưới dạng một chấm màu và liên kết của nó dưới dạng một nút tròn, và ba chấm của nó (“Tùy chọn khác”) chứa “Mở rộng”, “Ghim”, “Chỉnh sửa” và “Xóa bỏ”.',
  'help.ctx.trip-collab.bullet.4':
    '“Liên kết” gom những địa chỉ mà chuyến đi dựa vào. “Thêm liên kết” nhận một tiêu đề và một địa chỉ http hoặc https; “Chỉnh sửa liên kết”, “Ghim liên kết” và “Xóa liên kết” nằm ở đuôi chip, và những liên kết đã ghim ở lại phía trước.',
  'help.ctx.trip-collab.bullet.5':
    '“Thăm dò ý kiến” quyết định mọi chuyện. “Cuộc thăm dò mới” đặt một câu hỏi với ít nhất hai tùy chọn; một cú nhấp vào một tùy chọn là lá phiếu của bạn, còn ổ khóa (“Đóng”) và thùng rác (“Xóa bỏ”) ở bên phải phần đầu một cuộc thăm dò kết thúc việc bỏ phiếu hoặc gỡ cuộc thăm dò đi.',
  'help.ctx.trip-collab.bullet.6':
    '“Tiếp theo là gì” liệt kê các điểm dừng của chuyến đi còn ở phía trước, nhiều nhất là tám, cùng giờ giấc và những người có mặt ở đó. Nó chỉ đọc kế hoạch ngày; giờ giấc được đặt ở đó.',
  // write-note
  'help.guide.write-note.title': 'Viết một ghi chú chung',
  'help.guide.write-note.goal':
    'Đặt những gì cả nhóm cần, một quy định, một địa chỉ, một lời nhắc, vào nơi ai cũng tìm lại được.',
  'help.guide.write-note.step.1':
    'Nhấp “Ghi chú mới” ở phần đầu thẻ “Ghi chú”. Hộp thoại ghi chú mở ra, với con trỏ đã nằm sẵn ở phần đầu của nó.',
  'help.guide.write-note.step.2':
    'Gõ tiêu đề vào chỗ ghi “tiêu đề ghi chú”, ở phần đầu hộp thoại. Đó là thứ duy nhất hộp thoại bắt buộc: “Tạo nên” vẫn bị làm xám cho tới khi có gì đó trong đó, và Enter trong ô tiêu đề tạo ghi chú ngay lập tức.',
  'help.guide.write-note.step.3':
    '“Nội dung” chứa phần chữ và nhận Markdown: một từ in đậm, một danh sách, một tiêu đề. Thẻ hiện ba dòng đầu, và “Mở rộng” trong menu của thẻ mở toàn bộ ghi chú.',
  'help.guide.write-note.step.4':
    'Dưới “Loại”, chọn loại mà ghi chú thuộc về; màu của nó tô phần đầu hộp thoại ngay bây giờ và phần đầu thẻ về sau. Những viên thuốc là các danh mục đã có, còn danh mục mới được tạo trong “Quản lý danh mục”.',
  'help.guide.write-note.step.5':
    '“Trang web” nhận một liên kết thuộc về ghi chú. Khi đó thẻ mang một nút liên kết tròn ở phần đầu để mở nó.',
  'help.guide.write-note.step.6':
    'Nhấp “Tạo nên”. Chỉ có “Hủy” và dấu nhân của hộp thoại mới đóng được nó, nên một cú nhấp lạc ra bên cạnh hay phím Esc không làm mất những gì bạn đã viết.',
  'help.guide.write-note.result':
    'Ghi chú là một thẻ trong bảng “Ghi chú”, phần đầu được tô màu của danh mục, và đã có sẵn trên màn hình của mọi thành viên khác.',
  'help.guide.write-note.tip.1':
    'Ba chấm trên một thẻ (“Tùy chọn khác”) chứa “Mở rộng”, “Ghim”, “Chỉnh sửa” và “Xóa bỏ”. “Ghim” giữ ghi chú ở đầu bảng trong một khung mang màu của nó; mọi thứ bên dưới được sắp theo lần thay đổi gần nhất.',
  'help.guide.write-note.tip.2':
    'Bánh răng bên cạnh “Ghi chú mới” mở “Quản lý danh mục”: ở đó một danh mục nhận màu của nó, được đổi tên ở mọi nơi cùng lúc, hoặc được thêm vào trước khi có ghi chú nào dùng tới. Không có gì thay đổi cho tới khi bạn nhấp “Lưu”.',
  'help.guide.write-note.tip.3':
    '“Đính kèm tập tin” treo một tài liệu lên ghi chú. “Gắn” mở trình chọn tập tin, và một hình ảnh hay một tệp PDF cũng có thể chỉ cần dán thẳng vào hộp thoại.',
  'help.guide.write-note.tip.4':
    '“Ghi chú” là một công tắc riêng dưới “Tiện ích bổ sung”, bên dưới “Cộng tác”: quản trị viên có thể tắt nó đi mà vẫn để “Trò chuyện”, “Liên kết”, “Thăm dò ý kiến” và “Tiếp theo là gì” chạy tiếp.',
  // shared-links
  'help.guide.shared-links.title': 'Gom các liên kết của chuyến đi',
  'help.guide.shared-links.goal':
    'Giữ cổng đặt chỗ, album chung và bảng giờ ở một chỗ thay vì cuộn phần trò chuyện để tìm chúng.',
  'help.guide.shared-links.step.1':
    'Nhấp “Thêm liên kết” ở phần đầu thẻ “Liên kết”. Hộp thoại mở ra với con trỏ ở phần đầu của nó.',
  'help.guide.shared-links.step.2':
    'Gõ tên vào chỗ ghi “Tiêu đề liên kết”, dán địa chỉ vào “Liên kết” bên dưới, rồi nhấp “Lưu liên kết”.',
  'help.guide.shared-links.step.3':
    'Chip hiện cái tên và trang mà nó trỏ tới. Một cú nhấp lên nó mở trang đó trong một tab mới.',
  'help.guide.shared-links.step.4':
    'Ba nút tròn ở đuôi nó là “Chỉnh sửa liên kết”, “Ghim liên kết” và “Xóa liên kết”. “Ghim liên kết” đưa chip ra đầu bảng, với sắc màu nhấn; “Xóa liên kết” hỏi trước, vì liên kết sẽ mất với mọi thành viên.',
  'help.guide.shared-links.result':
    'Liên kết là một chip trong bảng “Liên kết”, được ghim ra phía trước, và có trên màn hình của mọi thành viên cùng lúc.',
  'help.guide.shared-links.tip.1':
    'Chỉ nhận một địa chỉ http hoặc https: mọi thứ khác bị từ chối, và hộp thoại vẫn mở với những gì bạn đã gõ.',
  'help.guide.shared-links.tip.2':
    'Liên kết đã ghim đứng trước, rồi tới cái mới nhất. Biểu tượng nhỏ bên cạnh một tiêu đề là favicon của chính trang đó, được lấy từ trang ấy, nên khi không có internet chip hiện một biểu tượng liên kết thường thay vào đó.',
  'help.guide.shared-links.tip.3':
    '“Liên kết” là một công tắc riêng dưới “Tiện ích bổ sung”, bên dưới “Cộng tác”, nên quản trị viên có thể tắt bảng này mà không đụng tới phần còn lại của tab.',
  // create-poll
  'help.guide.create-poll.title': 'Hỏi cả nhóm',
  'help.guide.create-poll.goal':
    'Biến một câu hỏi không ai trả lời trong phần trò chuyện thành một cuộc thăm dò mà ai cũng đánh dấu được.',
  'help.guide.create-poll.step.1': 'Nhấp “Cuộc thăm dò mới” ở phần đầu thẻ “Thăm dò ý kiến”. Hộp thoại mở ra.',
  'help.guide.create-poll.step.2':
    'Viết câu hỏi dưới “Câu hỏi”. “Hỗ trợ Markdown” dưới ô đó nghĩa là một từ in đậm, một lần xuống dòng hay một danh sách ngắn đều dùng được ở đây.',
  'help.guide.create-poll.step.3':
    'Điền “Tùy chọn 1” và “Tùy chọn 2” dưới “Tùy chọn”. Hai tùy chọn có nội dung là mức tối thiểu, và một tùy chọn có thể dài nhiều dòng.',
  'help.guide.create-poll.step.4':
    '“Thêm tùy chọn” bên dưới chúng thêm cái thứ ba, cái thứ tư, bao nhiêu tùy bạn; dấu nhân nhỏ bên cạnh một hàng, có mặt khi bạn có hơn hai tùy chọn, lại lấy đi một cái.',
  'help.guide.create-poll.step.5':
    '“Nhiều lựa chọn” cho phép mọi người đánh dấu hơn một tùy chọn. Nếu để tắt, một lá phiếu sẽ chuyển sang khi ai đó chọn thứ khác.',
  'help.guide.create-poll.step.6': 'Nhấp “Tạo cuộc thăm dò ý kiến”.',
  'help.guide.create-poll.result':
    'Cuộc thăm dò đứng ở đầu bảng “Thăm dò ý kiến”, đang mở, với “0 phiếu bầu” ở phần đầu.',
  'help.guide.create-poll.tip.1': 'Câu hỏi được dựng theo Markdown; các tùy chọn vẫn là văn bản thuần.',
  'help.guide.create-poll.tip.2':
    '“Tạo cuộc thăm dò ý kiến” vẫn bị làm xám cho tới khi có một câu hỏi và ít nhất hai tùy chọn có nội dung.',
  'help.guide.create-poll.tip.3':
    'Thời hạn chỉ đặt được trong ứng dụng điện thoại. Một cuộc thăm dò có thời hạn sẽ hiện thời gian còn lại trong một chip màu hổ phách ở phần đầu của nó và được tính là đã đóng khi hết giờ.',
  'help.guide.create-poll.tip.4':
    '“Thăm dò ý kiến” là một công tắc riêng dưới “Tiện ích bổ sung”, bên dưới “Cộng tác”: quản trị viên có thể tắt nó đi mà vẫn để bốn bảng còn lại chạy tiếp.',
  // vote-poll
  'help.guide.vote-poll.title': 'Bỏ phiếu và đọc kết quả',
  'help.guide.vote-poll.goal': 'Bỏ lá phiếu của bạn, xem cả nhóm đang đứng ở đâu, và đổi ý.',
  'help.guide.vote-poll.step.1':
    'Nhấp tùy chọn bạn muốn. Vòng tròn của nó được tô đầy kèm dấu tích, tùy chọn có một khung màu nhấn và thanh phía sau dài ra.',
  'help.guide.vote-poll.step.2':
    'Giờ thì đọc được toàn bộ kết quả: thanh là tỉ lệ, phần trăm đứng bên phải, và những vòng tròn nhỏ là những người đã chọn tùy chọn đó, tối đa ba người.',
  'help.guide.vote-poll.step.3':
    'Đổi ý rồi? Nhấp một tùy chọn khác. Trong một cuộc thăm dò không có “Nhiều lựa chọn”, lá phiếu của bạn chuyển sang chứ không thêm một lá thứ hai.',
  'help.guide.vote-poll.step.4':
    'Số phiếu của cuộc thăm dò nằm trong một chip dưới câu hỏi. Một cú nhấp vào tùy chọn bạn đã chọn sẽ rút lá phiếu của bạn ra, và con số lại giảm xuống.',
  'help.guide.vote-poll.result':
    'Dấu của bạn nằm trên một tùy chọn, các thanh cho thấy nhóm chia ra thế nào, và các vòng tròn nói ai chọn gì.',
  'help.guide.vote-poll.tip.1':
    'Phần trăm và ai đã bầu cho gì chỉ hiện ra khi chính bạn đã bỏ phiếu, hoặc khi cuộc thăm dò đã đóng. Số phiếu ở phần đầu thì ai cũng thấy.',
  'help.guide.vote-poll.tip.2':
    'Một lá phiếu không bao giờ ẩn danh: rê chuột lên một trong các vòng tròn của một tùy chọn để thấy cái tên đằng sau nó.',
  // close-poll
  'help.guide.close-poll.title': 'Đóng một cuộc thăm dò, hoặc gỡ nó đi',
  'help.guide.close-poll.goal': 'Dừng việc bỏ phiếu khi cả nhóm đã quyết, và dọn đi một cuộc thăm dò không ai còn cần.',
  'help.guide.close-poll.step.1':
    '“Đóng”, cái ổ khóa ở bên phải phần đầu một cuộc thăm dò, kết thúc việc bỏ phiếu. Các tùy chọn thôi nhận cú nhấp.',
  'help.guide.close-poll.step.2':
    'Một cuộc thăm dò đã đóng chìm xuống dưới tiêu đề “Đã đóng” ở đáy bảng, mang chip “Đã đóng” và cho mọi người thấy kết quả, dù họ có bỏ phiếu hay không. Tùy chọn thắng được in đậm trên một thanh xanh lá; nếu đó là tùy chọn bạn đã chọn, thanh giữ màu nhấn của bạn thay vào đó.',
  'help.guide.close-poll.step.3':
    '“Xóa bỏ”, thùng rác ở bên phải phần đầu, gỡ cuộc thăm dò đi; ở một cuộc thăm dò đã đóng, nó đứng đó một mình, vì ổ khóa đã biến mất. Không có gì hỏi lại lần nữa, và các lá phiếu đi theo.',
  'help.guide.close-poll.result':
    'Cuộc thăm dò biến khỏi bảng của mọi thành viên. Cái mà bạn chỉ đóng thì vẫn đọc được ở dưới cùng, cùng với kết quả của nó.',
  'help.guide.close-poll.tip.1':
    'Đóng thì không hoàn tác được: không có mở lại. Một cuộc thăm dò lỡ tay đóng phải hỏi lại từ đầu.',
  'help.guide.close-poll.tip.2':
    '“Xóa bỏ” lấy đi cuộc thăm dò và mọi lá phiếu trong đó khỏi tất cả mọi người, ngay lập tức và không hỏi gì.',
  // whats-next
  'help.guide.whats-next.title': 'Đọc “Tiếp theo là gì”',
  'help.guide.whats-next.goal': 'Xem cả nhóm sắp làm gì mà không cần mở kế hoạch.',
  'help.guide.whats-next.step.1':
    'Thẻ này liệt kê các điểm dừng của chuyến đi còn ở phía trước, nhiều nhất là tám, theo thứ tự thời gian, dưới một tiêu đề cho mỗi ngày: “Hôm nay”, “Ngày mai” hoặc ngày tháng, kèm tiêu đề của ngày bên cạnh khi ngày đó có tiêu đề. Phần đầu thẻ đếm số điểm dừng.',
  'help.guide.whats-next.step.2':
    'Bên trái mỗi điểm dừng là giờ của nó: giờ bắt đầu, “ĐẾN”, và giờ kết thúc khi điểm dừng có, hoặc TBD khi chưa đặt giờ nào cho nó.',
  'help.guide.whats-next.step.3':
    'Bên cạnh là tên, địa chỉ và, dưới dạng chip, những người có mặt ở điểm dừng đó. Khi không chọn ai cho nó, tất cả mọi người trong chuyến đi được liệt kê.',
  'help.guide.whats-next.result':
    'Một danh sách những gì sắp tới, chỉ để đọc: nó đi theo kế hoạch, và không gì ở đây thay đổi kế hoạch.',
  'help.guide.whats-next.tip.1':
    'Ở đây không đặt gì cả. Giờ giấc đến từ kế hoạch ngày; đổi ở đó thì danh sách này theo ngay.',
  'help.guide.whats-next.tip.2':
    'Chỉ những gì còn ở phía trước mới được liệt kê: một điểm dừng đã qua giờ sẽ rơi ra, và vào cuối chuyến đi bảng này trống.',
  'help.guide.whats-next.tip.3':
    '“Tiếp theo là gì” là một công tắc riêng dưới “Tiện ích bổ sung”, bên dưới “Cộng tác”, và nó là một bảng dành cho máy tính: tab “Cộng tác” của ứng dụng điện thoại không có nó.',
  // trip-chat
  'help.guide.trip-chat.title': 'Nói chuyện với cả nhóm',
  'help.guide.trip-chat.goal':
    'Nói một điều gì đó, trả lời đúng một tin nhắn, phản ứng với một tin khác, và rút lại tin của chính bạn.',
  'help.guide.trip-chat.step.1':
    'Viết vào “Nhập tin nhắn...” rồi nhấn Enter. Mũi tên tròn bên cạnh ô đó làm y như vậy; còn Shift và Enter thì tạo một dòng mới.',
  'help.guide.trip-chat.step.2':
    'Mặt cười mở bảng chọn biểu tượng cảm xúc, trong đó có Smileys, Reactions và Travel. Cái bạn chọn được thêm vào những gì bạn đang viết, nó không tự gửi đi.',
  'help.guide.trip-chat.step.3':
    'Rê chuột lên tin nhắn của người khác: một nút tròn nhỏ hiện ra ở góc. Đó là “Hồi đáp”.',
  'help.guide.trip-chat.step.4':
    'Tin nhắn bạn trả lời được trích ở trên ô nhập. Viết và gửi, phần trích đi theo trong bong bóng của bạn; dấu nhân trên phần trích bỏ nó đi.',
  'help.guide.trip-chat.step.5':
    'Nhấp chuột phải một tin nhắn để có tám phản ứng nhanh. Phản ứng của bạn nằm dưới bong bóng, và một cú nhấp thứ hai lên đúng nó sẽ rút lại.',
  'help.guide.trip-chat.step.6':
    'Tin nhắn của chính bạn mang “Xóa bỏ”, thùng rác, bên cạnh “Hồi đáp”. Nó lấy tin nhắn đi ngay lập tức và để lại một dòng ghi “đã xóa một tin nhắn”: không có đường quay lại.',
  'help.guide.trip-chat.result':
    'Câu trả lời của bạn là tin nhắn mới nhất, với tin nhắn mà nó trích ở trên cùng; một phản ứng treo trên một tin thứ ba, và cái bạn rút lại để lại đúng một dòng nói vậy.',
  'help.guide.trip-chat.tip.1':
    'Enter gửi đi, Shift và Enter tạo một dòng mới. Một tin nhắn chỉ gồm một đến ba biểu tượng cảm xúc và không có gì khác được hiện to.',
  'help.guide.trip-chat.tip.2':
    '“Đính kèm ảnh” nhận tối đa bốn tấm ảnh cho một tin nhắn; ảnh cũng có thể chỉ cần dán hoặc thả lên ô nhập.',
  'help.guide.trip-chat.tip.3':
    'Một tin nhắn có liên kết sẽ có thẻ xem trước bên dưới, do chính TREK của bạn lấy về, nên một liên kết tới thứ chỉ mình bạn vào được vẫn chỉ là một liên kết thường.',
  'help.guide.trip-chat.tip.4':
    '“Trò chuyện” là một công tắc riêng dưới “Tiện ích bổ sung”, bên dưới “Cộng tác”: quản trị viên có thể tắt nó đi mà vẫn để “Ghi chú”, “Liên kết”, “Thăm dò ý kiến” và “Tiếp theo là gì” chạy tiếp.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Danh sách',
  'help.ctx.trip-lists.summary':
    'Hai danh sách cho một chuyến đi: danh sách đóng gói, với ai mang gì và nặng bao nhiêu, và danh sách việc cần làm gồm mọi thứ phải xảy ra trước và trong chuyến đi. Tab này có mặt khi tiện ích bổ sung “Danh sách” đang bật.',
  'help.ctx.trip-lists.bullet.1':
    '“Danh sách đóng gói” và “Việc cần làm” trên thanh ở trên cùng chuyển qua lại giữa hai bên và đếm những gì có ở mỗi bên; các nút ở đầu bên phải của thanh thuộc về bên nào đang mở.',
  'help.ctx.trip-lists.bullet.2':
    'Danh sách đóng gói được gom thành các danh sách, Tài liệu, Quần áo, hay bất cứ tên nào bạn đặt, mỗi danh sách là một thẻ có dải đầu chứa một chấm màu, một huy hiệu đã đóng gói trên tổng số, ba chấm với “Đổi tên”, “Kiểm tra tất cả”, “Bỏ chọn tất cả” và “Xóa danh sách”, và một mũi tên gập thẻ lại. “Thêm danh sách” trên thanh phía trên tạo một danh sách mới.',
  'help.ctx.trip-lists.bullet.3':
    'Một hàng gồm ô đánh dấu và tên, rồi ai mang nó dưới dạng một ảnh đại diện nhỏ và số lượng dưới dạng một huy hiệu nhỏ, khi “Theo dõi túi” đang bật thì thêm trọng lượng tính bằng gam và một vòng tròn túi, rồi thùng rác và ba chấm chứa “Chuyển sang danh sách”, “Chia sẻ”, “Đổi tên” và “Xóa bỏ”. Những gì một hàng không dùng sẽ mờ đi cho đến khi bạn trỏ vào, và tay nắm bên trái kéo hàng lên hoặc xuống trong danh sách của nó.',
  'help.ctx.trip-lists.bullet.4':
    '“Chung” và “Danh sách của tôi” chia danh sách đóng gói làm hai: kho chung mọi người đều thấy, và của riêng bạn. “Tất cả”, “Mở” và “Xong” bên cạnh chúng thu hẹp bên nào đang mở, và thẻ tiến độ phía trên đếm những gì đã đóng gói.',
  'help.ctx.trip-lists.bullet.5':
    '“Áp dụng mẫu” và “Lưu dưới dạng mẫu” lấp đầy hoặc giữ lại một danh sách mà không phải gõ ra, còn hai biểu tượng sau chúng, “Xuất” và “Nhập”, đưa danh sách ra dưới dạng bản in, PDF hoặc tập tin, và đưa một danh sách vào. Nút đỏ ở đầu bên phải thẻ tiến độ nêu có bao nhiêu mục đã được đánh dấu rồi dọn chúng đi.',
  'help.ctx.trip-lists.bullet.6':
    '“Việc cần làm” có thanh bên riêng: thẻ tiến độ, các bộ lọc “Tất cả”, “Nhiệm vụ của tôi”, “Quá hạn” và “Xong”, một hàng cho mỗi danh sách và “Thêm danh sách” bên dưới. Các nhiệm vụ nằm trong một thẻ có phần đầu ghi tên bộ lọc và chứa cách sắp xếp, “Sự ưu tiên” hoặc “Ngày đến hạn”. Nhấp vào một nhiệm vụ sẽ mở nó ở khung bên phải, và “Thêm nhiệm vụ mới” trên thanh mở hộp thoại “Nhiệm vụ mới”.',
  // packing-categories
  'help.guide.packing-categories.title': 'Dựng danh sách đóng gói',
  'help.guide.packing-categories.goal':
    'Gom những thứ bạn mang theo thành các danh sách, đổ mục vào đó và nói ai lo mỗi danh sách.',
  'help.guide.packing-categories.step.1':
    'Nhấp “Thêm danh sách” trên thanh phía trên các danh sách. Một hộp thoại nhỏ mở ra: gõ tên vào dải đầu của nó, chỗ có “Tên danh sách (vd. Quần áo)”, và nhấp “Thêm”.',
  'help.guide.packing-categories.step.2':
    'Danh sách mới bắt đầu với một hàng giữ chỗ chỉ hiện ba chấm mờ. Nhấp “Thêm mục” ở chân danh sách, gõ tên mục vào “Tên mặt hàng...” rồi nhấn Enter: mục đầu tiên thế chỗ hàng giữ chỗ, và ô nhập vẫn mở cho mục kế tiếp.',
  'help.guide.packing-categories.step.3':
    'Đổi tên một hàng bằng cách nhấp vào tên của nó, hoặc bằng “Đổi tên” trong ba chấm ở đầu bên phải của nó.',
  'help.guide.packing-categories.step.4':
    'Vòng tròn nét đứt có hình người trên dải đầu của danh sách gán thành viên chuyến đi vào danh sách. Chọn một tên; chiếc thẻ hiện ra sẽ gỡ người đó ra lại khi bạn nhấp vào.',
  'help.guide.packing-categories.step.5':
    'Ba chấm cạnh số đếm chứa phần còn lại: “Đổi tên”, “Kiểm tra tất cả”, “Bỏ chọn tất cả”, và “Xóa danh sách”, thứ lấy đi cả danh sách lẫn mọi thứ trong đó mà không hỏi lại. Mũi tên ở tận cùng bên phải gập danh sách lại.',
  'help.guide.packing-categories.result':
    'Danh sách mới nằm trong lưới với các mục của nó ở dưới và chấm màu của nó, và huy hiệu đếm những gì đã đóng gói.',
  'help.guide.packing-categories.tip.1':
    'Một danh sách chỉ là các mục của nó. Xóa mục cuối cùng thì hàng đó biến thành chỗ giữ chỗ để danh sách giữ được vị trí và màu của mình; xóa luôn hàng đó thì danh sách biến mất.',
  'help.guide.packing-categories.tip.2':
    'Gán ai đó vào một danh sách sẽ gửi cho họ một thông báo đóng gói. Việc đó không đổi ai được thấy các mục, đó là “Chia sẻ” trong ba chấm của một hàng.',
  'help.guide.packing-categories.tip.3':
    'Hai danh sách có thể mang cùng một tên. TREK phân biệt chúng bên trong, nên các tên vẫn y như bạn đã gõ.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Đánh dấu trong lúc xếp đồ',
  'help.guide.check-off-packing.goal':
    'Đánh dấu thứ đã nằm trong túi, theo dõi thanh tiến độ, và dọn đi các mục đã đóng gói.',
  'help.guide.check-off-packing.step.1': 'Nhấp vào ô ở bên trái một hàng. Tên bị gạch đi và thanh tiến độ nhích lên.',
  'help.guide.check-off-packing.step.2':
    'Thẻ tiến độ phía trên các danh sách đếm những gì đã đóng gói so với mọi thứ trong danh sách, bằng con số, bằng phần trăm và bằng một thanh.',
  'help.guide.check-off-packing.step.3':
    'Cả một danh sách cùng lúc: ba chấm trên dải đầu của danh sách chứa “Kiểm tra tất cả” và “Bỏ chọn tất cả”.',
  'help.guide.check-off-packing.step.4':
    '“Tất cả”, “Mở” và “Xong” bên cạnh “Chung” và “Danh sách của tôi” thu hẹp lưới. “Mở” chỉ để lại những gì còn thiếu, nên một danh sách đã đóng gói xong sẽ rơi ra khỏi đó.',
  'help.guide.check-off-packing.step.5':
    '“Xóa 3 đã chọn” ở đầu bên phải thẻ tiến độ xóa mọi mục đã đánh dấu cùng lúc, sau một lần xác nhận từ trình duyệt.',
  'help.guide.check-off-packing.result':
    'Chỉ những gì còn dang dở được liệt kê, và thanh phía trên cho biết việc đóng gói đã đi được tới đâu.',
  'help.guide.check-off-packing.tip.1': 'Một mục đã đánh dấu vẫn đổi tên được: nhấp vào tên của nó.',
  'help.guide.check-off-packing.tip.2':
    '“Kiểm tra tất cả” và “Bỏ chọn tất cả” chỉ tác động lên một danh sách mỗi lần, từ ba chấm của chính danh sách đó.',
  'help.guide.check-off-packing.tip.3':
    'Khi mọi mục đều được đánh dấu, bộ đếm được thay bằng “Tất cả đã được đóng gói!” và thanh chuyển sang màu xanh lá.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Áp dụng một mẫu đóng gói',
  'help.guide.apply-packing-template.goal':
    'Đưa một danh sách làm sẵn vào chuyến đi, và giữ danh sách của chuyến này cho chuyến sau.',
  'help.guide.apply-packing-template.step.1': 'Nhấp “Áp dụng mẫu” ở thanh phía trên danh sách.',
  'help.guide.apply-packing-template.step.2':
    'Chọn một mẫu. Mỗi dòng nêu tên mẫu và cho biết nó chứa bao nhiêu mặt hàng.',
  'help.guide.apply-packing-template.step.3':
    'Các mục rơi vào chế độ xem bạn đang ở: “Chung” đặt chúng vào kho chung mọi người đều thấy, “Danh sách của tôi” biến chúng thành của bạn.',
  'help.guide.apply-packing-template.step.4':
    'Giữ danh sách của chuyến này cho chuyến sau: “Lưu dưới dạng mẫu” mở một hộp thoại nhỏ. Gõ một cái tên vào dải đầu của nó, chỗ có “Tên mẫu”, rồi nhấp “Lưu”.',
  'help.guide.apply-packing-template.result':
    'Các danh sách và mục của mẫu đã ở trong chuyến đi, bên cạnh những gì vốn có.',
  'help.guide.apply-packing-template.tip.1':
    'Một mẫu chỉ mang theo tên và danh sách. Số lượng, trọng lượng, túi và những gì đã được đánh dấu thì không đi theo.',
  'help.guide.apply-packing-template.tip.2':
    '“Áp dụng mẫu” chỉ có mặt khi đã tồn tại một mẫu. Không có mẫu nào thì nút đó không hiện ra.',
  'help.guide.apply-packing-template.tip.3':
    '“Lưu dưới dạng mẫu” chỉ hiện với quản trị viên của phiên bản cài đặt, và chỉ khi danh sách còn có mục. Nó lưu kho chung cùng các mục của riêng bạn, không bao giờ lưu mục riêng tư của thành viên khác.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Dán nguyên một danh sách đóng gói vào',
  'help.guide.import-packing-list.goal':
    'Biến một danh sách bạn đã có ở nơi khác thành các mục đóng gói trong một lần.',
  'help.guide.import-packing-list.step.1':
    'Nhấp “Nhập”, biểu tượng có mũi tên hướng xuống ở đầu bên phải của thanh phía trên danh sách.',
  'help.guide.import-packing-list.step.2':
    'Mỗi dòng một mục: Danh mục, Tên, Trọng lượng tính bằng g (tùy chọn), Túi (tùy chọn), checked/unchecked (tùy chọn). Mẫu màu xám trong ô cho thấy cả bốn dạng, và các con số dọc mép trái của ô đếm số dòng bạn gõ. Danh sách Markdown cũng dùng được: tiêu đề đặt tên cho danh sách, còn "- [ ]" và "- [x]" trở thành mục.',
  'help.guide.import-packing-list.step.3':
    'Hoặc nạp các dòng từ một tập tin bằng “Tải CSV/TXT/MD”, ở góc dưới bên trái hộp thoại. Nó nhận một tập tin .csv, .txt hoặc .md và thay thế mọi thứ đang có trong ô.',
  'help.guide.import-packing-list.step.4':
    'Nhấp “Nhập 3” ở góc dưới bên phải; con số trên nút đếm số dòng mà TREK hiểu được.',
  'help.guide.import-packing-list.result':
    'Mỗi dòng thành một hàng, nằm trong danh sách mà trường đầu tiên của nó nêu tên, và không có gì vốn đã ở đó bị đụng tới.',
  'help.guide.import-packing-list.tip.1':
    'Dấu phẩy, dấu chấm phẩy và dấu tab đều tách các trường, còn dấu nháy kép giữ một trường lại với nhau, nên “Shirt, blue” vẫn là một cái tên. Một dòng chỉ có một giá trị thì đó là tên, một dòng không có danh sách riêng sẽ rơi vào “Khác”, và "3x" trước tên sẽ đặt số lượng.',
  'help.guide.import-packing-list.tip.2':
    'Túi được nêu tên ở trường thứ tư sẽ được tạo nếu chuyến đi chưa có nó. Đây là nơi duy nhất nạp trọng lượng và túi hàng loạt; một mẫu chỉ mang theo tên và danh sách.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'In hoặc xuất danh sách đóng gói',
  'help.guide.export-packing-list.goal':
    'Mang danh sách theo trên giấy, dưới dạng PDF, hoặc dưới dạng tập tin cho ứng dụng khác hay cho chuyến đi sau.',
  'help.guide.export-packing-list.step.1':
    'Nhấp “Xuất”, biểu tượng có mũi tên hướng lên ở thanh phía trên danh sách, ngay trước “Nhập”.',
  'help.guide.export-packing-list.step.2':
    '“Danh sách kiểm tra Markdown (.md)” và “CSV để nhập (.csv)” lưu danh sách thành tập tin ngay lập tức.',
  'help.guide.export-packing-list.step.3':
    'Nhấp “In hoặc lưu thành PDF”. Bản xem trước hiển thị danh sách như một trang: chuyến đi, ngày tháng và mức đã đóng gói ở trên cùng, rồi mỗi danh sách là một thẻ, mỗi mục có một ô để đánh dấu.',
  'help.guide.export-packing-list.step.4':
    'Nhấp “In hoặc lưu thành PDF” bên dưới bản xem trước. Trình duyệt mở hộp thoại in của nó: chọn một máy in, hoặc “Lưu dưới dạng PDF” để giữ một tập tin.',
  'help.guide.export-packing-list.result':
    'Bản in và các tập tin chứa chế độ xem đang mở, “Chung” hoặc “Danh sách của tôi”, kèm số lượng, trọng lượng và dấu tích.',
  'help.guide.export-packing-list.tip.1':
    'CSV là định dạng mà “Nhập” đọc được, kể cả túi, nên nó dùng được như một mẫu đóng gói của riêng bạn: hãy nhập nó vào chuyến đi sau.',
  'help.guide.export-packing-list.tip.2':
    'Tập tin Markdown mở ra thành danh sách kiểm tra trong Obsidian, Notion hoặc GitHub, và cũng quay lại được qua “Nhập” như vậy.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Quyết định ai thấy một mục và ai mang nó',
  'help.guide.share-packing-item.goal':
    'Chuyển một mục qua lại giữa kho chung của nhóm, danh sách riêng của bạn và những người bạn mang giùm.',
  'help.guide.share-packing-item.step.1':
    '“Chung” phía trên các danh sách là kho mọi người đều thấy, “Danh sách của tôi” là của riêng bạn, và mỗi bên đều đếm những gì có trong đó. Nhấp “Danh sách của tôi” để xem phần của bạn.',
  'help.guide.share-packing-item.step.2': 'Quay lại “Chung”, mở ba chấm ở cuối một hàng và nhấp “Chia sẻ”.',
  'help.guide.share-packing-item.step.3':
    'Ba mức: “Chung”, nằm trong kho của nhóm và mọi người đều thấy; “Cá nhân”, chỉ mình bạn thấy; và “Chia sẻ với…”, nơi bạn chọn những người mà mục đó lo cho.',
  'help.guide.share-packing-item.step.4': 'Một mục “Cá nhân” chỉ nằm ở “Danh sách của tôi”. Chuyển qua đó để tìm nó.',
  'help.guide.share-packing-item.step.5':
    'Mở “Chia sẻ” lần nữa và đánh dấu một tên dưới “Chia sẻ với…”. Mục đó cũng hiện trên danh sách của người ấy, và hàng có thêm một huy hiệu nhỏ đếm số người được chia sẻ.',
  'help.guide.share-packing-item.result': 'Mục nằm ở mức bạn đã chọn, và hàng cho biết ai đang mang nó.',
  'help.guide.share-packing-item.tip.1':
    'Chỉ người mang một mục mới đổi được cách chia sẻ của nó. Người bạn chia sẻ cùng sẽ thấy nó trên “Danh sách của tôi” của chính họ với một huy hiệu bàn tay nhỏ nêu tên bạn khi họ trỏ vào, và có thể đánh dấu nó.',
  'help.guide.share-packing-item.tip.2':
    'Trên một mục được chia sẻ do người khác mang, ba chấm chứa hai mục khác thay cho “Chia sẻ”: “Tôi cũng có thể mang”, thêm bạn vào bên cạnh họ, và “Sao chép vào danh sách của tôi”, tạo một bản riêng tư của bạn.',
  'help.guide.share-packing-item.tip.3':
    'Mục mới thừa hưởng chế độ xem nơi bạn thêm chúng. Thêm ở “Danh sách của tôi” thì chúng là “Cá nhân”, thêm ở “Chung” thì chúng vào kho chung.',
  // packing-bags
  'help.guide.packing-bags.title': 'Cân các túi',
  'help.guide.packing-bags.goal':
    'Đặt trọng lượng cho từng mục, xếp các mục vào túi và giữ mỗi túi dưới giới hạn của hãng bay.',
  'help.guide.packing-bags.step.1':
    'Nhấp huy hiệu trọng lượng trước vòng tròn và gõ trọng lượng của mục tính bằng gam.',
  'help.guide.packing-bags.step.2': 'Vòng tròn sau trọng lượng là túi của mục đó. Nhấp vào nó.',
  'help.guide.packing-bags.step.3':
    'Chưa có túi nào: “Thêm túi”, một cái tên, Enter. Túi được tạo và mục đi thẳng vào đó.',
  'help.guide.packing-bags.step.4':
    'Thẻ “Túi xách” hiện ra bên phải các danh sách ngay khi có một túi: tên, ai mang nó, một thanh mức đầy, có bao nhiêu mặt hàng trong đó và trọng lượng của nó, rồi “Chưa được chỉ định” và “Tổng trọng lượng”.',
  'help.guide.packing-bags.step.5':
    'Nhấp “Đặt giới hạn” cạnh trọng lượng của túi và gõ giới hạn tính bằng kilôgam, đúng cách các hãng bay nêu ra.',
  'help.guide.packing-bags.step.6':
    'Dấu cộng nét đứt ở cuối dòng tên túi, ngay trước dấu nhân, mở “Gán thành viên”: tích những ai đang mang túi, và họ hiện ra bên cạnh dấu cộng.',
  'help.guide.packing-bags.result':
    'Thẻ “Túi xách” bên phải cho thấy trọng lượng từng túi so với giới hạn của nó, những gì không nằm trong túi nào, và tổng cộng.',
  'help.guide.packing-bags.tip.1':
    'Ô trọng lượng, vòng tròn túi và thẻ “Túi xách” chỉ tồn tại khi một quản trị viên đã bật “Theo dõi túi” trong tiện ích bổ sung “Danh sách”. Trên cửa sổ hẹp hơn, các túi được mở từ nút “Túi xách” phía trên thẻ tiến độ thay vào đó.',
  'help.guide.packing-bags.tip.2':
    'Trọng lượng của một túi được cộng trên máy chủ trên các mục của mọi thành viên, kể cả những mục bạn không thấy, nên con số đó đúng là trọng lượng thật của túi.',
  'help.guide.packing-bags.tip.3':
    'Một túi không có giới hạn được vẽ so với túi nặng nhất, để các thanh vẫn so sánh được với nhau. Đặt cho nó một giới hạn thì thanh sẽ đọc theo giới hạn đó.',
  // create-todo
  'help.guide.create-todo.title': 'Thêm một nhiệm vụ',
  'help.guide.create-todo.goal':
    'Ghi lại một việc phải làm, kèm một danh sách, một mức ưu tiên, một ngày và một cái tên.',
  'help.guide.create-todo.step.1': 'Nhấp “Thêm nhiệm vụ mới” ở đầu bên phải của thanh.',
  'help.guide.create-todo.step.2':
    'Hộp thoại “Nhiệm vụ mới” mở ra với con trỏ ở dải đầu của nó: gõ tên vào chỗ có “Tên nhiệm vụ”, và ghi mọi thứ đáng nhớ vào “Miêu tả”.',
  'help.guide.create-todo.step.3':
    '“Danh sách” gom nhóm nhiệm vụ. Chọn một, hoặc dùng dấu cộng bên cạnh để đặt tên cho một danh sách mới trong một hộp thoại nhỏ.',
  'help.guide.create-todo.step.4': '“Sự ưu tiên” là bốn nút: “Không có”, P1, P2 và P3, từ đỏ xuống xanh lam.',
  'help.guide.create-todo.step.5':
    '“Ngày đến hạn”, cạnh “Danh sách”, mở một lịch, và “Được giao cho” đặt một cái tên lên nhiệm vụ.',
  'help.guide.create-todo.step.6': 'Nhấp “Tạo nhiệm vụ”.',
  'help.guide.create-todo.result':
    'Nhiệm vụ nằm trong danh sách với mức ưu tiên, ngày đến hạn và danh sách dưới dạng huy hiệu cùng ảnh đại diện của người được giao ở cuối hàng, và nó mở ra ở khung bên phải.',
  'help.guide.create-todo.tip.1': 'Chỉ cái tên là bắt buộc. Mọi thứ khác có thể điền sau từ khung bên phải.',
  'help.guide.create-todo.tip.2':
    'Khi một danh sách đang được chọn ở thanh bên, nhiệm vụ mới bắt đầu trong danh sách đó.',
  'help.guide.create-todo.tip.3': 'Nhấn Enter trong ô tên sẽ tạo nhiệm vụ ngay, không cần đụng tới các ô còn lại.',
  // todo-filters
  'help.guide.todo-filters.title': 'Tìm và sửa một nhiệm vụ',
  'help.guide.todo-filters.goal':
    'Rút danh sách nhiệm vụ xuống còn những gì quan trọng lúc này, rồi sửa nhiệm vụ bạn vừa mở.',
  'help.guide.todo-filters.step.1':
    '“Nhiệm vụ” ở thanh bên: “Tất cả” là mọi thứ còn dang dở, “Nhiệm vụ của tôi” là phần thuộc về bạn, “Quá hạn” là những gì có ngày đã qua, “Xong” là những gì đã hoàn thành. Mỗi mục đều mang con số của nó; nhấp “Quá hạn”.',
  'help.guide.todo-filters.step.2':
    'Dưới “Danh sách” là một hàng cho mỗi danh sách. Chọn một hàng sẽ hiện danh sách đó, gồm cả các nhiệm vụ đã hoàn thành.',
  'help.guide.todo-filters.step.3':
    'Phần sắp xếp ở đầu danh sách xếp lại những gì đang trên màn hình: “Sự ưu tiên” đưa P1 lên trước, “Ngày đến hạn” đưa hạn gần nhất lên trước. Mỗi lần chỉ một trong hai, và nhấp lần thứ hai sẽ trở về thứ tự riêng của bạn.',
  'help.guide.todo-filters.step.4': 'Nhấp một nhiệm vụ để mở nó ở khung bên phải.',
  'help.guide.todo-filters.step.5':
    'Đổi những gì bạn cần, tên, “Miêu tả”, “Sự ưu tiên”, “Danh sách”, “Ngày đến hạn” hoặc “Được giao cho”, rồi “Lưu thay đổi” ở chân khung. Ô ở đầu khung đánh dấu nhiệm vụ là đã xong, và “Xóa bỏ” cạnh “Lưu thay đổi” xóa nó đi ngay lập tức.',
  'help.guide.todo-filters.result':
    'Danh sách chỉ hiện những nhiệm vụ bạn đã yêu cầu, và khung bên phải sửa nhiệm vụ bạn đã chọn.',
  'help.guide.todo-filters.tip.1':
    'Một hàng danh sách chỉ đếm những gì còn dang dở, nhưng chọn nó thì các nhiệm vụ đã hoàn thành cũng hiện ra. “Tất cả”, “Nhiệm vụ của tôi” và “Quá hạn” giấu những gì đã xong; “Xong” thì không hiện gì khác.',
  'help.guide.todo-filters.tip.2':
    '“Sự ưu tiên” và “Ngày đến hạn” trong phần sắp xếp loại trừ lẫn nhau, và khi một trong hai đang bật thì không còn kéo các hàng vào thứ tự riêng của bạn được nữa.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Đặt chỗ',
  'help.ctx.trip-bookings.summary':
    'Tab chứa mọi thứ đã đặt cho chuyến đi mà không phải là cách di chuyển: chỗ ở, bàn ăn, vé, chuyến du lịch, bãi đỗ xe. Mỗi đặt chỗ là một thẻ, một hàng trong danh sách hoặc một thanh trên dòng thời gian, mang theo mã, giấy tờ, người đi và chi phí của nó, và một cú nhấp sẽ mở chi tiết của nó.',
  'help.ctx.trip-bookings.bullet.1':
    '“Thêm đặt chỗ” ở đầu bên phải của thanh mở “Đặt chỗ mới”. Sáu loại nó tạo ra là “Chỗ ở”, “Nhà hàng”, “Sự kiện”, “Chuyến du lịch”, “Bãi đỗ xe” và “Khác”; chuyến bay, tàu hỏa và phần còn lại nằm ở tab “Di chuyển” và không bao giờ xuất hiện ở đây.',
  'help.ctx.trip-bookings.bullet.2':
    'Biểu tượng tải xuống trước “Thêm đặt chỗ”, “Nhập xác nhận đặt chỗ”, giao các bản xác nhận cho bộ phân tích: EML, PDF, PKPass, HTML hoặc TXT, nhiều nhất năm tập tin 10 MB. Biểu tượng đó chỉ có mặt khi máy chủ đọc được chúng.',
  'help.ctx.trip-bookings.bullet.3':
    '“Tìm kiếm” tìm trong tiêu đề, loại, địa điểm, ghi chú, mã đặt chỗ và người đi. “Lọc”, cái phễu bên cạnh, thu hẹp tab theo “Trạng thái”, theo “Loại” kèm số đếm cho từng loại, và theo “Người đi” khi một đặt chỗ đã nêu tên người; một con số trên cái phễu đếm những gì đang bật.',
  'help.ctx.trip-bookings.bullet.4':
    'Ba biểu tượng sau “Lọc” chuyển chế độ xem: “Thẻ”, “Danh sách” và “Dòng thời gian”. “Tùy chọn hiển thị”, biểu tượng thanh trượt bên cạnh, nhóm và sắp xếp thẻ và danh sách, hoặc đặt các làn của dòng thời gian. Theo mặc định các thẻ đứng trong “Đã xác nhận” và “Chưa giải quyết”, và một cú nhấp lên tiêu đề của một phần sẽ gấp nó lại.',
  'help.ctx.trip-bookings.bullet.5':
    'Một thẻ có dải đầu được tô màu theo trạng thái, với chấm trạng thái (một cú nhấp chuyển giữa “Chưa giải quyết” và “Đã xác nhận”), loại, tiêu đề, cây bút chì và thùng rác. Bên dưới là những gì đặt chỗ có: “Ngày”, “Thời gian”, “Mã đặt chỗ”, “Nhận phòng” và “Trả phòng”, “Vị trí / Địa chỉ”, “Chỗ ở”, “Liên kết với” (điểm dừng trong kế hoạch), “Liên kết”, “Ghi chú”, “Người đi”, “Tập tin” và các chi phí liên kết.',
  'help.ctx.trip-bookings.bullet.6':
    'Một cú nhấp lên một thẻ, một hàng hoặc một thanh mở chi tiết của đặt chỗ, với “Trên bản đồ”, thùng rác và “Chỉnh sửa” ở chân. Việc xóa hỏi một lần, rồi đặt chỗ biến mất cùng với các chi phí liên kết của nó, và một chỗ ở thì mang những đêm của nó ra khỏi “Kế hoạch ngày”.',
  // booking-views
  'help.guide.booking-views.title': 'Đổi chế độ xem và mở một đặt chỗ',
  'help.guide.booking-views.goal':
    'Xem các đặt chỗ dưới dạng thẻ, dưới dạng danh sách hoặc trên dòng thời gian, và mở một đặt chỗ để thấy mọi thứ nó chứa.',
  'help.guide.booking-views.step.1':
    'Ba biểu tượng sau “Lọc” trên thanh là các chế độ xem, và mỗi biểu tượng hiện tên khi bạn trỏ vào: “Thẻ”, “Danh sách” và “Dòng thời gian”. Tab mở ở chế độ “Thẻ”, mỗi đặt chỗ một thẻ trong các phần “Đã xác nhận” và “Chưa giải quyết”. Nhấp “Danh sách”, biểu tượng ở giữa.',
  'help.guide.booking-views.step.2':
    '“Danh sách” xếp mỗi đặt chỗ một hàng dưới một tiêu đề cho mỗi ngày, với ngày và giờ ở bên phải; các phím mũi tên di chuyển từ hàng này sang hàng khác. Nhấp “Dòng thời gian”, biểu tượng cuối cùng trong ba biểu tượng.',
  'help.guide.booking-views.step.3':
    '“Dòng thời gian” trải các đặt chỗ lên các ngày của chuyến đi, mỗi loại một làn và mỗi đặt chỗ một thanh từ lúc bắt đầu đến lúc kết thúc, đặt chỗ còn chờ có viền nét đứt. “Chuyến đi” đưa toàn bộ chuyến đi vừa khít chiều rộng; nhấp vào tiêu đề của một ngày để xem ngày đó theo từng giờ.',
  'help.guide.booking-views.step.4':
    '“Ngày” trải một ngày lên thang giờ, và các thanh dài ra để hiện giờ của chúng. Các mũi tên cạnh tên ngày chuyển sang ngày trước và ngày sau, và công tắc “Chuyến đi” và “Ngày” ở bên phải quay về toàn bộ chuyến đi.',
  'help.guide.booking-views.step.5':
    'Trỏ vào một thanh để xem ngày, giờ và địa điểm của nó, rồi nhấp vào để mở chi tiết của đặt chỗ. Một thẻ trong “Thẻ” và một hàng trong “Danh sách” mở cùng cửa sổ bật lên đó.',
  'help.guide.booking-views.step.6':
    'Dải đầu của phần chi tiết chứa tiêu đề và các nhãn cho trạng thái (một cú nhấp sẽ chuyển nó), loại, ngày và mã đặt chỗ, kèm một nút sao chép mã. Bên dưới là giờ giấc dưới dạng các ô, rồi địa điểm, người đi, ghi chú, chi phí và tập tin, những gì đặt chỗ có, và ở chân là “Trên bản đồ”, thùng rác và “Chỉnh sửa”.',
  'help.guide.booking-views.result':
    'Đặt chỗ đang mở trong phần chi tiết của nó: “Chỉnh sửa” mở biểu mẫu của nó, “Trên bản đồ” hiện nó trên kế hoạch, và “Đóng” hoặc Escape đưa bạn về chế độ xem bạn vừa ở.',
  'help.guide.booking-views.tip.1':
    '“Tùy chọn hiển thị”, biểu tượng thanh trượt sau các biểu tượng chế độ xem, nhóm và sắp xếp “Thẻ” và “Danh sách” bằng “Nhóm theo” và “Sắp xếp theo”. Trong “Dòng thời gian”, nó bật tắt “Mỗi loại một làn” và “Hiện cả tab còn lại”, tùy chọn đặt các mục của tab “Di chuyển” mờ đi trong một làn mỏng ở trên cùng. “Đặt lại chế độ xem” khôi phục mặc định, và mỗi tab nhớ chế độ xem của nó trong trình duyệt này.',
  'help.guide.booking-views.tip.2':
    'Một đặt chỗ trước hoặc sau chuyến đi, hoặc không có ngày, không thể nằm trên dòng thời gian: nó chờ bên dưới biểu đồ dưới dạng một thẻ nhỏ trong “Trước chuyến đi”, “Sau chuyến đi” hoặc “Chưa có ngày”.',
  'help.guide.booking-views.tip.3':
    'Cùng phần chi tiết đó mở ra ở bất cứ đâu một đặt chỗ xuất hiện: trên tab “Di chuyển”, trong kế hoạch ngày, trong chi tiết của một ngày và trong chi tiết của một địa điểm. Một cú nhấp vào tiêu đề của nó sẽ đổi tên đặt chỗ.',
  // create-booking
  'help.guide.create-booking.title': 'Tạo một đặt chỗ',
  'help.guide.create-booking.goal':
    'Đưa một nhà hàng, một sự kiện, một chuyến du lịch, một chỗ đỗ xe hay bất cứ thứ gì khác vào chuyến đi bằng tay.',
  'help.guide.create-booking.step.1':
    'Nhấp “Thêm đặt chỗ” ở đầu bên phải của thanh. “Đặt chỗ mới” mở ra, với tiêu đề và hai nhãn trong một dải đầu ở trên cùng.',
  'help.guide.create-booking.step.2':
    'Nhấp vào nhãn loại trên dải đầu, nhãn này ghi “Khác” ở một đặt chỗ mới, và chọn “Loại đặt chỗ”. “Chỗ ở”, “Nhà hàng”, “Sự kiện”, “Chuyến du lịch”, “Bãi đỗ xe” và “Khác” là sáu loại tab này tạo ra, và biểu mẫu thay đổi theo lựa chọn: chỉ “Chỗ ở” mới đổi ngày của nó lấy một khoảng các ngày.',
  'help.guide.create-booking.step.3':
    'Gõ tiêu đề vào dải đầu, ô nằm phía trên các nhãn. Đó là ô duy nhất biểu mẫu nhất định đòi, và “Thêm” vẫn bị làm xám cho tới khi nó có nội dung.',
  'help.guide.create-booking.step.4':
    'Đặt “Ngày” và “Thời gian bắt đầu”, cùng “Ngày kết thúc” và “Thời gian kết thúc” nếu đặt chỗ có điểm kết thúc. Lịch chỉ đưa ra những ngày nằm trong chuyến đi, và một điểm kết thúc không sau điểm bắt đầu sẽ báo bằng màu đỏ và chặn “Thêm”.',
  'help.guide.create-booking.step.5':
    'Điền “Mã đặt chỗ” từ bản xác nhận, rồi nhấp vào nhãn trạng thái trên dải đầu, cạnh loại. Ở một đặt chỗ mới, nó ghi “Chưa giải quyết” và chuyển sang “Đã xác nhận”, và điều đó quyết định thẻ rơi vào phần nào.',
  'help.guide.create-booking.step.6': 'Nhấp “Thêm” ở chân biểu mẫu.',
  'help.guide.create-booking.result':
    'Đặt chỗ là một thẻ trong phần của nó, dải đầu được tô màu theo trạng thái, với loại, ngày và giờ cùng mã của nó, và mọi người khác trong chuyến đi đều thấy nó xuất hiện.',
  'help.guide.create-booking.tip.1':
    '“Vị trí / Địa chỉ” đưa ra các địa chỉ có thật trong lúc bạn gõ; chọn một cái sẽ thay thế thứ bạn đã viết, còn địa chỉ bạn tự gõ thì được giữ nguyên.',
  'help.guide.create-booking.tip.2':
    '“Liên kết” nhận trang riêng của đặt chỗ ở phía nhà cung cấp. Thẻ và phần chi tiết biến nó thành một liên kết mở trong tab mới.',
  'help.guide.create-booking.tip.3':
    '“Ghi chú” dùng Markdown, nên một danh sách hay một dòng in đậm cũng được hiển thị đúng như vậy trên thẻ và trong phần chi tiết.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Đặt một chỗ ở',
  'help.guide.booking-hotel.goal':
    'Nhập một chỗ ở để nó vừa tính là một đặt chỗ vừa tính là những đêm trong “Kế hoạch ngày”.',
  'help.guide.booking-hotel.step.1':
    'Nhấp “Thêm đặt chỗ” và chọn “Chỗ ở” bằng nhãn loại trên dải đầu. Các ô ngày biến mất và một khối ô dành cho khách sạn thế chỗ chúng.',
  'help.guide.booking-hotel.step.2':
    'Chọn khách sạn dưới “Chỗ ở”. Danh sách chính là các địa điểm của chuyến đi, và chọn một cái sẽ viết tên nó vào tiêu đề nếu tiêu đề còn trống và địa chỉ nó vào “Vị trí / Địa chỉ”.',
  'help.guide.booking-hotel.step.3':
    'Đặt “Từ” và “Đến”: đêm đầu tiên và buổi sáng bạn rời đi. Cả hai đều đưa ra các ngày của chuyến đi kèm ngày tháng, và hai ô giữ cho nhau đúng thứ tự.',
  'help.guide.booking-hotel.step.4':
    'Điền “Nhận phòng”, “Nhận phòng cho đến khi” và “Trả phòng”, cùng “Mã đặt chỗ” từ bản xác nhận.',
  'help.guide.booking-hotel.step.5': 'Nhấp “Thêm”.',
  'help.guide.booking-hotel.result':
    'Thẻ mang khoảng các ngày dưới “Ngày”, giờ nhận phòng và trả phòng cùng địa chỉ, và chính kỳ lưu trú đó giờ nằm trên những ngày ấy của kế hoạch.',
  'help.guide.booking-hotel.tip.1':
    '“Chỗ ở” là loại duy nhất không có “Ngày” và “Thời gian bắt đầu”. Ngày của nó là “Từ” và “Đến”, và đó là các ngày của chuyến đi chứ không phải một cuốn lịch.',
  'help.guide.booking-hotel.tip.2':
    'Hãy để “Chỗ ở” trống và gõ địa chỉ thay vào đó: địa điểm sẽ được tra cứu, tạo ra và ghim lên bản đồ giúp bạn.',
  'help.guide.booking-hotel.tip.3': 'Xóa đặt chỗ sẽ mang những đêm ấy ra khỏi “Kế hoạch ngày” theo.',
  // link-booking
  'help.guide.link-booking.title': 'Buộc một đặt chỗ vào kế hoạch',
  'help.guide.link-booking.goal':
    'Treo một đặt chỗ vào điểm dừng và địa điểm mà nó thuộc về, để nó hiện ra ở nơi bạn sẽ cần đến nó.',
  'help.guide.link-booking.step.1':
    'Trỏ vào thẻ bạn muốn liên kết và nhấp cây bút chì trên dải đầu của nó. “Chỉnh sửa đặt chỗ” mở ra.',
  'help.guide.link-booking.step.2':
    'Mở “Liên kết đến bài tập trong ngày”. Danh sách chính là kế hoạch của bạn: một tiêu đề cho mỗi ngày, rồi các điểm dừng của ngày đó, được đánh số và kèm giờ. Chọn điểm mà đặt chỗ thuộc về.',
  'help.guide.link-booking.step.3':
    '“Địa điểm / Hoạt động” liên kết chính địa điểm đó. Chọn nó ở đấy, và tiêu đề cùng “Vị trí / Địa chỉ” sẽ tự điền ở bất cứ chỗ nào bạn đã để trống.',
  'help.guide.link-booking.step.4': 'Nhấp “Cập nhật”.',
  'help.guide.link-booking.result':
    'Thẻ nêu ngày và điểm dừng dưới “Liên kết với”, và đặt chỗ đi cùng điểm dừng ấy trong “Kế hoạch ngày”.',
  'help.guide.link-booking.tip.1':
    '“Không có liên kết (độc lập)” ở đầu danh sách gỡ liên kết ra lần nữa. “Chỗ ở” hoàn toàn không có ô chọn điểm dừng: nó liên kết qua những đêm của mình.',
  'help.guide.link-booking.tip.2':
    'Chọn một điểm dừng trên một ngày đã có ngày tháng sẽ điền giúp bạn ô “Ngày” còn trống. Một ngày bạn đã đặt sẵn thì được để yên.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Nói một đặt chỗ là dành cho ai',
  'help.guide.booking-travelers.goal': 'Đánh dấu những người đi mà một đặt chỗ bao gồm, rồi chỉ xem phần của họ.',
  'help.guide.booking-travelers.step.1':
    'Mở đặt chỗ bằng cây bút chì trên thẻ của nó. “Người đi” nằm cạnh “Mã đặt chỗ”, và hiện “Chỉ định người đi” khi chưa có ai trong đặt chỗ.',
  'help.guide.booking-travelers.step.2':
    'Nhấp vào đó và chọn những người mà đặt chỗ này dành cho; những “Khách” đã có tên cũng có trong danh sách. Người được chọn sẽ có một dấu tích và ảnh đại diện của họ trong ô. Nhấp lại vào tên để bỏ ra.',
  'help.guide.booking-travelers.step.3': 'Nhấp “Cập nhật”.',
  'help.guide.booking-travelers.step.4':
    'Nhấp “Lọc” trên thanh: dưới “Người đi”, nhấp vào một người để chỉ xem các đặt chỗ của họ. Có thể bật nhiều người cùng lúc.',
  'help.guide.booking-travelers.result':
    'Thẻ liệt kê những người mà nó dành cho, và “Lọc” thu hẹp tab về các đặt chỗ của những người bạn chọn.',
  'help.guide.booking-travelers.tip.1':
    'Trên thẻ và trong phần chi tiết, người đi chỉ được hiển thị chứ không bao giờ thay đổi được. Họ được đặt ở đây, trong biểu mẫu.',
  'help.guide.booking-travelers.tip.2':
    '“Người đi” xuất hiện trong “Lọc” khi chuyến đi có nhiều hơn một thành viên và ít nhất một đặt chỗ nêu tên ai đó. Thứ bạn chọn còn lại cho tới khi bạn đóng tab trình duyệt.',
  // booking-files
  'help.guide.booking-files.title': 'Giữ phiếu cùng với đặt chỗ',
  'help.guide.booking-files.goal': 'Đính bản xác nhận, vé hoặc thẻ vào đúng đặt chỗ mà nó thuộc về.',
  'help.guide.booking-files.step.1':
    'Mở đặt chỗ bằng cây bút chì trên thẻ của nó. “Tập tin” nằm cạnh “Liên kết”; nhấp “Đính kèm tập tin” ở đó. Trên một đặt chỗ đã tồn tại, giấy tờ được tải lên ngay và TREK báo “Tệp đã được tải lên”.',
  'help.guide.booking-files.step.2': 'Giấy tờ được liệt kê theo tên, kèm một nút để mở nó và một dấu X bên cạnh.',
  'help.guide.booking-files.step.3':
    '“Liên kết tập tin hiện có” đưa ra những giấy tờ của chuyến đi chưa nằm trên đặt chỗ này. Chọn một cái và nó được đính vào mà không phải tải lên lần nữa.',
  'help.guide.booking-files.step.4': 'Nhấp “Cập nhật”.',
  'help.guide.booking-files.result':
    'Thẻ và phần chi tiết liệt kê các giấy tờ dưới “Tập tin”, và một cú nhấp lên một trong số chúng sẽ mở nó ra.',
  'help.guide.booking-files.tip.1':
    'Trên một đặt chỗ bạn còn đang tạo, giấy tờ sẽ chờ và được tải lên đúng lúc bạn nhấp “Thêm”.',
  'help.guide.booking-files.tip.2':
    'Dấu X cạnh một giấy tờ chỉ gỡ liên kết, không gỡ giấy tờ. Nó vẫn nằm trong thẻ “Tập tin” của chuyến đi.',
  'help.guide.booking-files.tip.3':
    'Những loại tập tin nào được phép đính kèm là danh sách của quản trị viên dưới “Các loại tệp được phép”; tài liệu, văn bản và hình ảnh được cho phép ngay từ đầu.',
  // booking-cost
  'help.guide.booking-cost.title': 'Biến giá của một đặt chỗ thành chi phí',
  'help.guide.booking-cost.goal': 'Đưa số tiền một đặt chỗ tốn vào “Chi phí”, chia cho những người trả tiền cho nó.',
  'help.guide.booking-cost.step.1':
    'Mở đặt chỗ bằng cây bút chì trên thẻ của nó và đi xuống chân biểu mẫu. Dưới “Chi phí” là “Tạo chi phí” và “Liên kết chi phí hiện có”, kèm ghi chú “Lưu đặt chỗ, sau đó mở trình chỉnh sửa Chi phí.”',
  'help.guide.booking-cost.step.2':
    'Nhấp “Tạo chi phí”. Đặt chỗ được lưu, biểu mẫu của nó đóng lại và trình chỉnh sửa chi phí mở ra dưới dạng “Thêm chi phí”.',
  'help.guide.booking-cost.step.3':
    'Tên trên dải đầu đã sẵn là tiêu đề của đặt chỗ. Điền “Tổng số tiền” và kiểm tra “Tiền tệ” cùng “Ngày” bên cạnh.',
  'help.guide.booking-cost.step.4':
    'Nhãn trên dải đầu là “Loại”, đã sẵn là loại mà kiểu đặt chỗ gợi ra. Dưới “Ai đã trả tiền?”, chọn người đã trả, và dưới “Chia tiền”, chọn cách chia số tiền.',
  'help.guide.booking-cost.step.5': 'Nhấp “Thêm chi phí”.',
  'help.guide.booking-cost.result':
    'Thẻ mang số tiền ở chân, biểu mẫu của đặt chỗ liệt kê khoản chi dưới “Các chi phí liên kết”, và chính khoản chi ấy đứng trong tab “Chi phí”, buộc vào đặt chỗ này.',
  'help.guide.booking-cost.tip.1':
    'Loại đi theo kiểu: “Nhà hàng” thành “Thức ăn và đồ uống”, “Chỗ ở” thành “Chỗ ở”, “Bãi đỗ xe” thành “Bãi đỗ xe”, còn “Sự kiện” và “Chuyến du lịch” đều rơi vào “Khác”.',
  'help.guide.booking-cost.tip.2':
    'Một đặt chỗ có thể mang nhiều khoản chi. “Liên kết chi phí hiện có” đưa ra các khoản trong “Chi phí” chưa thuộc về đâu. Trên một khoản đã liên kết, “Hủy liên kết, giữ chi phí” thả nó ra và để nó lại trong “Chi phí”, còn thùng rác thì gỡ nó.',
  'help.guide.booking-cost.tip.3':
    '“Chi phí” chỉ có trong biểu mẫu khi tiện ích “Chi phí” đang bật, thứ mà quản trị viên bật tắt dưới “Tiện ích bổ sung”.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Tìm một đặt chỗ',
  'help.guide.filter-bookings.goal': 'Thu hẹp một tab dài về một từ, một trạng thái, một loại hoặc một người.',
  'help.guide.filter-bookings.step.1':
    'Gõ vào “Tìm kiếm” trên thanh. Nó tìm trong tiêu đề, loại, địa điểm và địa chỉ, ghi chú, mã đặt chỗ và tên người đi, và tab thu hẹp lại khi bạn gõ; Escape làm trống ô.',
  'help.guide.filter-bookings.step.2':
    'Nhấp “Lọc”, cái phễu cạnh ô tìm kiếm. Bảng của nó chứa “Trạng thái”, “Loại” và, khi một đặt chỗ đã nêu tên người, “Người đi”.',
  'help.guide.filter-bookings.step.3':
    'Dưới “Trạng thái”, chọn “Đã xác nhận” hoặc “Chưa giải quyết” để chỉ xem những đặt chỗ đó; “Tất cả” hiện cả hai.',
  'help.guide.filter-bookings.step.4':
    'Dưới “Loại”, nhấp một hoặc nhiều loại để chỉ giữ những loại đó. Mỗi loại cho biết nó chứa bao nhiêu đặt chỗ, và một dấu tích đánh dấu những loại đang bật.',
  'help.guide.filter-bookings.step.5':
    'Một con số trên “Lọc” đếm những gì đang bật, và một chip cạnh ô tìm kiếm cho biết còn lại bao nhiêu trên tổng số đặt chỗ. Nhấp vào chip đó, hoặc “Đặt lại bộ lọc” ở chân bảng, để xem lại mọi thứ.',
  'help.guide.filter-bookings.result':
    'Tab chỉ hiện thứ bạn đã chọn, trong “Thẻ”, “Danh sách” lẫn “Dòng thời gian”, và các bộ lọc được giữ cho chuyến đi này cho tới khi bạn đóng tab trình duyệt.',
  'help.guide.filter-bookings.tip.1':
    '“Loại” chỉ có mặt khi tab chứa nhiều hơn một loại, và nó chỉ liệt kê những loại mà tab chứa, nên một tab không có lấy một chuyến du lịch nào thì không có “Chuyến du lịch” trong đó.',
  'help.guide.filter-bookings.tip.2':
    'Một bộ lọc không khớp với gì cả sẽ để lại dòng “Không có mục nào khớp với các bộ lọc này” trong tab, với “Đặt lại bộ lọc” ngay bên dưới.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Đọc một đặt chỗ ra từ bản xác nhận của nó',
  'help.guide.import-booking-file.goal':
    'Để TREK rút đặt chỗ ra từ thư hay tập tin PDF mà nhà cung cấp đã gửi, thay vì gõ lại lần nữa.',
  'help.guide.import-booking-file.step.1':
    'Nhấp biểu tượng tải xuống trên thanh, “Nhập xác nhận đặt chỗ”; tên này hiện ra khi bạn trỏ vào. Hộp thoại cùng tên mở ra.',
  'help.guide.import-booking-file.step.2':
    'Thả các bản xác nhận lên ô đó, hoặc nhấp vào ô rồi chọn chúng: EML, PDF, PKPass, HTML và TXT, tối đa năm tập tin, mỗi tập tin 10 MB. Những tập tin bạn chọn được nêu tên trên ô.',
  'help.guide.import-booking-file.step.3': 'Nhấp “Nhập”. Hộp thoại đóng lại ngay, vì việc đọc diễn ra ở nền.',
  'help.guide.import-booking-file.step.4':
    'Một thẻ ở dưới cùng bên phải báo cáo lượt chạy dưới tên tập tin, và nó theo bạn khắp ứng dụng và qua cả một lần tải lại. “Đang phân tích tệp…” đổi thành dấu tích khi việc đọc xong, và thẻ đưa ra “Nhập”. Nhấp vào đó.',
  'help.guide.import-booking-file.step.5':
    'Mỗi đặt chỗ được tìm thấy mở ra trong “Đặt chỗ mới”, lần lượt từng cái, đã điền sẵn. Với một khách sạn, đó là tên của nó làm tiêu đề và, khi chuyến đi có địa điểm đó, dưới “Chỗ ở”, “Vị trí / Địa chỉ” của nó, “Từ” và “ĐẾN” theo các đêm của nó, “Nhận phòng” và “Trả phòng”, “Mã đặt chỗ”, bản xác nhận dưới “Tập tin” và, khi “Chi phí” đang bật, giá dưới dạng “Chi phí liên kết”. Kiểm tra rồi nhấp “Thêm”.',
  'help.guide.import-booking-file.result':
    'Đặt chỗ là một thẻ trong “Chưa giải quyết” với các đêm, mã và bản xác nhận dưới “Tập tin”, lần lưu trú nằm trên những ngày đó của kế hoạch, và khi “Chi phí” đang bật, giá là một khoản chi gắn với nó.',
  'help.guide.import-booking-file.tip.1':
    'Biểu tượng nhập chỉ có mặt khi máy chủ đọc được các bản xác nhận, việc này cần bộ trích xuất hoặc tiện ích “Phân tích bằng AI”; quản trị viên bật tắt cái sau dưới “Tiện ích bổ sung”. Một tab chưa có đặt chỗ nào cũng đưa ra nó dưới dạng nút “Nhập từ tập tin”.',
  'help.guide.import-booking-file.tip.2':
    'Nếu không đọc được gì, thẻ sẽ nói vậy và, khi “Phân tích bằng AI” đang bật, đưa ra “Thử phân tích bằng AI”, thứ gửi thẳng chính những tập tin ấy tới mô hình. Một lượt phân tích đã xong được giữ trong mười phút; hãy bắt đầu rà soát trong khoảng thời gian đó.',
  'help.guide.import-booking-file.tip.3':
    'Bản xác nhận chỉ được đính kèm khi loại của nó nằm trong “Các loại tệp được phép” của cài đặt quản trị. PDF có sẵn ngay từ đầu; một bức thư, EML, phải được thêm vào trước, nếu không đặt chỗ được lưu mà không có nó.',
  // edit-booking
  'help.guide.edit-booking.title': 'Thay đổi một đặt chỗ',
  'help.guide.edit-booking.goal':
    'Sửa một giờ, thêm mã đến muộn, hoặc chuyển một đặt chỗ từ “Chưa giải quyết” sang “Đã xác nhận”.',
  'help.guide.edit-booking.step.1':
    'Trỏ vào thẻ và nhấp cây bút chì trên dải đầu của nó. “Chỉnh sửa đặt chỗ” mở ra với mọi thứ mà đặt chỗ biết.',
  'help.guide.edit-booking.step.2':
    'Thay đổi thứ cần thay đổi, ở đây là “Mã đặt chỗ” mà nhà cung cấp cuối cùng cũng gửi tới.',
  'help.guide.edit-booking.step.3':
    'Nhấp vào nhãn “Chưa giải quyết” trên dải đầu. Nó chuyển sang “Đã xác nhận”, và dải đầu chuyển sang màu xanh lá.',
  'help.guide.edit-booking.step.4': 'Nhấp “Cập nhật”.',
  'help.guide.edit-booking.result':
    'Thẻ chuyển chỗ: một đặt chỗ đã xác nhận đứng trong phần “Đã xác nhận” với một chấm xanh lá và dải đầu màu xanh lá, và mọi người trong chuyến đi đều thấy nó chuyển.',
  'help.guide.edit-booking.tip.1':
    'Một “Mã đặt chỗ” bạn không đọc được chính là “Mã đặt chỗ mờ” trong Cài đặt, dưới “Hiển thị”. Đưa chuột lên, hoặc nhấp vào, là nó đọc được.',
  'help.guide.edit-booking.tip.2':
    'Đổi kiểu thì loại của khoản chi liên kết cũng đổi theo, trừ khi bạn đã tự tay chọn một loại trong trình chỉnh sửa chi phí.',
  'help.guide.edit-booking.tip.3':
    '“Chỉnh sửa” ở chân phần chi tiết của một đặt chỗ mở cùng biểu mẫu đó. Trạng thái cũng chuyển được mà không cần biểu mẫu nào: nhấp vào chấm trên một thẻ hoặc một hàng, hoặc vào nhãn trạng thái trong phần chi tiết.',
  // delete-booking
  'help.guide.delete-booking.title': 'Xóa một đặt chỗ',
  'help.guide.delete-booking.goal': 'Đưa một đặt chỗ đã đổ bể ra khỏi chuyến đi.',
  'help.guide.delete-booking.step.1':
    'Trỏ vào thẻ và nhấp thùng rác trên dải đầu của nó. Thùng rác ở chân phần chi tiết của một đặt chỗ cũng hỏi y như vậy.',
  'help.guide.delete-booking.step.2': '“Xóa đặt chỗ?” nêu tên cái bạn đã chọn và nói rằng nó sẽ bị xóa vĩnh viễn.',
  'help.guide.delete-booking.step.3': 'Nhấp “Xóa bỏ”.',
  'help.guide.delete-booking.result':
    'Thẻ biến mất, với mọi người trong chuyến đi. Một đặt chỗ không có hoàn tác, nên câu hỏi ấy là chặng cuối cùng.',
  'help.guide.delete-booking.tip.1':
    'Xóa một đặt chỗ cũng gỡ các chi phí liên kết với nó, và một chỗ ở thì mang những đêm của nó ra khỏi “Kế hoạch ngày”.',
  'help.guide.delete-booking.tip.2':
    'Những giấy tờ từng được đính kèm vẫn ở lại trong thẻ “Tập tin” của chuyến đi; chỉ liên kết của chúng với đặt chỗ là mất đi.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Chi phí',
  'help.ctx.trip-costs.summary':
    'Tiền bạc của chuyến đi: mọi khoản chi trong một sổ cái có ngày tháng hoặc một bảng, ai đã bỏ tiền ra và ai phải gánh phần của mình, bằng đúng loại tiền ghi trên biên lai, và ở cột bên phải là ai phải trả cho ai để mọi thứ cân trở lại.',
  'help.ctx.trip-costs.bullet.1':
    'Thanh ở trên cùng nêu ngày tháng của chuyến đi và những người đi cùng chia chi phí, rồi chứa “Tìm kiếm chi phí…”, “Lọc” (cái phễu), “Xuất CSV” (biểu tượng tải xuống) và công tắc “Danh sách” / “Bảng”.',
  'help.ctx.trip-costs.bullet.2':
    'Ở đầu bên phải của thanh, “Thanh toán” ghi nhận mọi khoản chuyển còn mở cùng một lúc, “Quét hóa đơn” điền một khoản chi từ một tấm ảnh khi tiện ích “Phân tích bằng AI” đọc được hình ảnh, và “Thêm chi phí” mở trình chỉnh sửa.',
  'help.ctx.trip-costs.bullet.3':
    'Bốn thẻ bên dưới thanh: “Bạn nợ” và “Người khác nợ bạn” là phía của chính bạn trong việc thanh toán, “Số tiền chưa thanh toán” là những gì đã ghi nhận nhưng chưa có người trả, còn “Tổng chi tiêu chuyến đi” cộng tất cả lại, với “Chia sẻ của bạn” và “Bạn đã trả tiền” ở bên dưới.',
  'help.ctx.trip-costs.bullet.4':
    'Sổ cái được nhóm theo ngày, mới nhất trước, mỗi ngày có tiêu đề cho biết nó chứa bao nhiêu mục và đã chi bao nhiêu trong ngày đó. Mỗi dòng mang danh mục dưới dạng một tab màu, tên, các chip người trả, ghi chú và số tiền, cùng với “bạn đã cho mượn” hoặc “bạn đã mượn” khi cách chia khiến bạn dư ra hay thiếu đi ở khoản đó.',
  'help.ctx.trip-costs.bullet.5':
    'Cột bên phải chính là câu trả lời: “Thanh toán” liệt kê ai trả cho ai, “Số dư” cho thấy phần dư hay phần thiếu của từng người, “Ngân sách cuối cùng” cho biết chuyến đi tốn của mỗi người bao nhiêu, và “Theo danh mục” cho biết tiền đã đi đâu.',
  'help.ctx.trip-costs.bullet.6':
    'Một khoản chi trả đã ghi nhận nằm trong cùng sổ cái như một dòng riêng, với một cây bút chì và “Hoàn tác” bên cạnh; một khoản chi có cây bút chì và một thùng rác, và thùng rác xóa nó mà không hỏi lại.',
  'help.ctx.trip-costs.bullet.7':
    '“Bảng” trên thanh hiển thị cùng các khoản chi đó dưới dạng một trang tính, nhóm theo danh mục, với “Người” và “Ngày” cùng số tiền tương ứng cho mỗi người và mỗi ngày; khi đó “Tóm tắt” thế chỗ “Theo danh mục”. “Chi phí” nhớ chế độ xem bạn đã chọn.',
  // add-expense
  'help.guide.add-expense.title': 'Thêm một khoản chi',
  'help.guide.add-expense.goal': 'Ghi lại một thứ đã tốn bao nhiêu, ai trả và nó được chia với những ai.',
  'help.guide.add-expense.step.1':
    'Nhấp “Thêm chi phí” ở đầu bên phải của thanh. Trình chỉnh sửa mở ra, mang ngày hôm nay, do bạn trả và với tất cả mọi người đã có sẵn trong phần chia.',
  'help.guide.add-expense.step.2':
    'Gõ khoản chi dùng để làm gì vào phần đầu hộp thoại, ô ghi “ví dụ. Ăn tối, quà lưu niệm, xăng…” khi còn trống. Đó là tên của khoản chi, và không có tên thì khoản chi không lưu được.',
  'help.guide.add-expense.step.3':
    'Nhãn dưới tên là “Loại”, là “Thức ăn và đồ uống” cho đến khi bạn chọn loại khác. Có mười bốn loại và không thể thay đổi: phần đầu mang màu của loại bạn chọn, và tab màu trên dòng cùng thanh của nó trong “Theo danh mục” cũng vậy.',
  'help.guide.add-expense.step.4':
    'Nhập con số trên biên lai vào “Tổng số tiền”. “Tiền tệ” bên cạnh bắt đầu bằng tiền tệ mà “Chi phí” đang hiển thị; đổi nó và trình chỉnh sửa cho thấy số tiền đó đáng bao nhiêu. “Ngày” bắt đầu từ hôm nay và đó là ngày mà sổ cái dùng để nhóm khoản chi.',
  'help.guide.add-expense.step.5':
    'Dưới “Ai đã trả tiền?”, nhấp vào người thực sự đã bỏ tiền ra. “Bạn” được chọn sẵn; “Chưa có ai trả tiền” ghi nhận số tiền mà không bắt ai phải gánh, còn “Nhiều người đã trả” trong công tắc cạnh tiêu đề chia hóa đơn cho nhiều người trả.',
  'help.guide.add-expense.step.6':
    '“Chia tiền” bên dưới bắt đầu ở “Chia đều”, với tất cả mọi người được tích và phần của mỗi người bên cạnh tên; để nguyên hoặc thay đổi. Nhấp “Thêm chi phí” ở chân hộp thoại để lưu.',
  'help.guide.add-expense.result':
    'Khoản chi nằm trong sổ cái dưới ngày của nó, được tính vào “Tổng chi tiêu chuyến đi”, và cột thanh toán đã tính lại ai nợ ai.',
  'help.guide.add-expense.tip.1':
    'Để nguyên như khi mở ra, khoản chi mang ngày hôm nay, do bạn trả và chia đều cho mọi người: thật ra chỉ có tên và số tiền là bắt buộc.',
  'help.guide.add-expense.tip.2':
    'Dấu ± bên cạnh số tiền biến khoản chi thành khoản hoàn. Tổng âm trả tiền lại thay vì lấy đi, và cách chia chạy theo hướng ngược lại.',
  'help.guide.add-expense.tip.3':
    '“Đính kèm”, cạnh “Hóa đơn & Biên lai” ở dưới cùng hộp thoại, nhận ảnh và tệp PDF. Chúng được tải lên khi bạn lưu, nằm trong Tập tin của chuyến đi, và một chip “Hóa đơn” xuất hiện cạnh tên trong danh sách.',
  // expense-payers
  'help.guide.expense-payers.title': 'Nói ai đã trả hóa đơn',
  'help.guide.expense-payers.goal':
    'Ghi lại ai đang phải bỏ tiền túi cho một khoản chi, nửa còn lại của phép tính thanh toán.',
  'help.guide.expense-payers.step.1':
    'Mở một khoản chi bằng cây bút chì bên cạnh dòng của nó và xem “Ai đã trả tiền?”. “Một người đã trả” là mặc định trong công tắc cạnh tiêu đề: mỗi người đi là một chip, và chip có viền là người đã bỏ tiền ra. Nhấp một chip khác để thay đổi.',
  'help.guide.expense-payers.step.2':
    '“Chưa có ai trả tiền”, chip nét đứt sau những người đi, ghi nhận số tiền mà không bắt ai nợ gì cả. Khoản chi vẫn được tính vào “Tổng chi tiêu chuyến đi”.',
  'help.guide.expense-payers.step.3':
    '“Nhiều người đã trả”, phía bên kia của công tắc đó, liệt kê mọi người đi kèm một ô để tích, và mỗi người được tích có một ô số tiền. Tích những ai đã trả và gõ số tiền từng người bỏ ra; các số tiền phải cộng lại bằng tổng.',
  'help.guide.expense-payers.step.4':
    'Một khoản chi chưa ai trả sẽ bị đánh dấu “Chưa xong” trên dòng của nó và được tính vào thẻ “Số tiền chưa thanh toán”, nơi gom những khoản chi tiêu chưa có người trả.',
  'help.guide.expense-payers.result':
    'Ai đã trả quyết định ai được trả lại, cách chia quyết định ai phải trả, và “Số dư” là chênh lệch giữa hai điều đó.',
  'help.guide.expense-payers.tip.1':
    '“Ai đã trả tiền?” và “Chia tiền” độc lập với nhau: bạn có thể trả cho một bữa tối bạn không dự, và bị chia vào một bữa tối bạn không trả.',
  'help.guide.expense-payers.tip.2':
    'Với nhiều người trả, các số tiền phải cộng lại bằng tổng. Tích thêm một người và những số tiền bạn chưa tự gõ sẽ chia lại phần còn lại; trong lúc chúng chưa khớp, trình chỉnh sửa nói rõ chúng phải cộng lại thành bao nhiêu và từ chối lưu.',
  'help.guide.expense-payers.tip.3':
    'Đặt một khoản chi trở lại “Chưa có ai trả tiền” không xóa nó: số tiền vẫn nằm trong “Tổng chi tiêu chuyến đi” và dòng đó trở thành “Chưa xong”.',
  // split-expense
  'help.guide.split-expense.title': 'Chia một hóa đơn giữa những người đi cùng',
  'help.guide.split-expense.goal':
    'Quyết định ai gánh một khoản chi: tất cả chia đều, theo số tiền, hoặc từng dòng trên biên lai.',
  'help.guide.split-expense.step.1':
    'Trong trình chỉnh sửa khoản chi, “Chia tiền” liệt kê mọi người kèm một ô để tích. Bỏ tích một tên để để người đó ra ngoài khoản chi này: tên đó chuyển xám, mất phần của mình và không gánh gì cho nó.',
  'help.guide.split-expense.step.2':
    '“Chia đều”, trong công tắc cạnh tiêu đề, là mặc định: mỗi người được tích nhận cùng một phần, hiện bên cạnh tên, và các huy hiệu dưới danh sách cho biết bao nhiêu người cùng chia và mỗi phần là bao nhiêu.',
  'help.guide.split-expense.step.3':
    '“Tùy chỉnh” đổi các phần đó thành các ô số tiền. Gõ số tiền mỗi người phải gánh; huy hiệu bên dưới đếm theo và chuyển xanh khi đạt “Phần chia khớp với tổng”. Nó sẽ không lưu khi còn lệch.',
  'help.guide.split-expense.step.4':
    '“Hóa đơn” chia biên lai theo từng dòng: “Thêm món”, rồi một tên và một giá cho mỗi dòng, và cạnh “Chia cho:” là những người cùng gánh dòng đó.',
  'help.guide.split-expense.step.5':
    '“Phần của từng người” dưới các dòng cho thấy mỗi người rốt cuộc gánh bao nhiêu, còn “Tổng số tiền” ở trên được cộng từ các dòng. Nhấp “Lưu” ở chân hộp thoại.',
  'help.guide.split-expense.result':
    'Cách chia là nền của mọi số dư. Nó được lưu cùng khoản chi và có thể đổi sau mà không đụng tới thứ gì khác.',
  'help.guide.split-expense.tip.1':
    'Người bạn bỏ tích không gánh gì cho riêng khoản chi này; những người còn lại nhận phần của họ.',
  'help.guide.split-expense.tip.2':
    '“Chia đều” chính xác đến từng xu: đồng xu lẻ luân phiên từ khoản chi này sang khoản chi khác, nên không ai là người luôn phải trả nó.',
  'help.guide.split-expense.tip.3':
    'Chế độ “Hóa đơn” tự cộng “Tổng số tiền” và làm mờ ô đó: các dòng của biên lai chính là tổng.',
  'help.guide.split-expense.tip.4':
    'Một cách chia tùy chỉnh cũng có thể nhập theo phần trăm: chuyển “Nhập phần theo” sang %, và tổng các phần phải bằng 100% thì khoản chi mới được lưu.',
  // expense-currency
  'help.guide.expense-currency.title': 'Nhập một khoản chi bằng loại tiền khác',
  'help.guide.expense-currency.goal': 'Nhập đúng những gì biên lai ghi và để TREK giữ tỷ giá.',
  'help.guide.expense-currency.step.1':
    'Mở “Thêm chi phí”, rồi gõ tên vào phần đầu hộp thoại và số tiền vào “Tổng số tiền” đúng như biên lai ghi, chính con số đó chứ không phải một bản quy đổi.',
  'help.guide.expense-currency.step.2':
    'Mở “Tiền tệ” cạnh số tiền và chọn loại tiền của biên lai. Danh sách mang mọi mã tiền mà TREK biết và có thể tìm kiếm: gõ ba chữ cái.',
  'help.guide.expense-currency.step.3':
    'Một hàng huy hiệu hiện ra dưới các ô: số bạn đã gõ và số tiền đó đáng bao nhiêu ngay lúc này, được đánh dấu “tỷ lệ trực tiếp”. Đó là bản xem trước, không phải thứ được lưu lại.',
  'help.guide.expense-currency.step.4':
    'Nhấp “Thêm chi phí” ở chân hộp thoại. Tỷ giá được đóng băng ngay tại chỗ: từ đây trở đi khoản chi này đáng đúng bằng giá trị của nó vào ngày bạn nhập.',
  'help.guide.expense-currency.step.5':
    'Trong sổ cái, dòng đó mang cả hai con số dưới tên: số bạn đã gõ, một mũi tên, và số tiền tương ứng theo tiền tệ của chuyến đi. Mọi tổng, số dư và thanh toán trên tab “Chi phí” đều được tính từ con số thứ hai.',
  'help.guide.expense-currency.result':
    'Khoản chi giữ nguyên số tiền và loại tiền bạn đã gõ. Sổ cái hiển thị cả hai, còn các tổng và số dư của chuyến đi được tính theo tiền tệ của chuyến đi.',
  'help.guide.expense-currency.tip.1':
    'Tỷ giá được đóng băng ngay khi bạn lưu, nên một món nợ đã thanh toán không mở lại chỉ vì thị trường nhúc nhích tuần sau đó. Chỉ khi đổi loại tiền của khoản chi thì một tỷ giá mới mới được đóng băng.',
  'help.guide.expense-currency.tip.2':
    '“Tiền tệ hiển thị” trong Cài đặt chỉ đổi những gì bạn đọc; các số tiền đã lưu không bao giờ dịch chuyển. Để trống thì mỗi chuyến đi hiện theo tiền tệ của chính nó.',
  'help.guide.expense-currency.tip.3':
    'Bản thân tiền tệ của chuyến đi nằm trên chuyến đi, dưới “Chỉnh sửa chuyến đi”, và cần quyền “Chỉnh sửa chi tiết chuyến đi”. Đổi nó sẽ neo lại mọi tỷ giá đã đóng băng chứ không đổi mệnh giá các số tiền.',
  // filter-costs
  'help.guide.filter-costs.title': 'Tìm một khoản chi, hoặc chi tiêu của một ngày',
  'help.guide.filter-costs.goal': 'Thu hẹp một sổ cái dài lại còn đúng thứ bạn đang tìm.',
  'help.guide.filter-costs.step.1':
    'Gõ vào “Tìm kiếm chi phí…” trên thanh. Nó khớp theo tên của khoản chi khi bạn gõ, và Esc xóa nó đi.',
  'help.guide.filter-costs.step.2':
    '“Lọc”, cái phễu cạnh ô tìm kiếm, mở các bộ lọc. Công tắc ở trên cùng là góc nhìn của riêng bạn về sổ cái: “Tất cả”, “Do tôi trả tiền” cho những gì bạn đã bỏ tiền ra, và “Người khác nợ tôi” cho những khoản chi mà bạn đã bỏ ra nhiều hơn phần của mình.',
  'help.guide.filter-costs.step.3':
    'Dưới “Loại”, chọn một trong mười bốn loại và chỉ những khoản chi của loại đó ở lại. Cái phễu đếm có bao nhiêu bộ lọc đang bật.',
  'help.guide.filter-costs.step.4':
    'Dưới “Ngày”, chọn một trong những ngày có chi tiêu. Một dải băng thay cho các tiêu đề ngày, cho biết đầy đủ ngày đó, nó chứa bao nhiêu khoản chi và tổng của nó.',
  'help.guide.filter-costs.step.5':
    '“Xuất CSV”, biểu tượng tải xuống cạnh cái phễu, ghi mọi khoản chi ra một tệp, kèm số tiền gốc, loại tiền của nó và số tiền đã quy đổi.',
  'help.guide.filter-costs.result':
    'Các bộ lọc kết hợp với nhau, và các nhóm ngày được vẽ lại với tổng riêng cho những gì còn lại.',
  'help.guide.filter-costs.tip.1':
    'Các khoản chi trả đã ghi nhận không mang tên và không mang danh mục, nên một lần tìm kiếm hay một bộ lọc danh mục sẽ giấu chúng đi. Bộ lọc ngày giữ chúng lại, dưới ngày khoản chi trả diễn ra.',
  'help.guide.filter-costs.tip.2':
    '“Xuất CSV” luôn xuất mọi khoản chi, dù màn hình đang lọc thế nào, mỗi khoản chi một dòng.',
  'help.guide.filter-costs.tip.3':
    '“Đặt lại bộ lọc”, ở chân menu lọc khi đã có một bộ lọc đang bật, tắt hết chúng cùng một lúc.',
  // settle-up
  'help.guide.settle-up.title': 'Tính ai nợ ai, rồi thanh toán',
  'help.guide.settle-up.goal':
    'Biến một đống chi phí chung thành số lần chuyển tiền ít nhất để mọi người cân bằng, và ghi nhận chúng khi chúng diễn ra.',
  'help.guide.settle-up.step.1':
    'Thẻ “Thanh toán” ở cột bên phải liệt kê những khoản chuyển sẽ khiến mọi người cân bằng: ai trả cho ai, dưới dạng hai ảnh đại diện có tên trong chú giải, và bao nhiêu. Con số ở phần đầu thẻ là số khoản vẫn còn mở.',
  'help.guide.settle-up.step.2':
    '“Thanh toán” bên cạnh một khoản chuyển ghi nhận nó là đã xong. Dòng chảy đó biến khỏi thẻ và các số dư được vẽ lại.',
  'help.guide.settle-up.step.3':
    'Khoản chuyển đã ghi nhận là một dòng trong sổ cái, dưới ngày nó diễn ra, được đánh dấu “Sự chi trả” cùng hai người và số tiền.',
  'help.guide.settle-up.step.4':
    'Cạnh dòng đó, cây bút chì sửa một khoản chi trả và “Hoàn tác” lấy lại nó, rồi khoản chuyển quay về thẻ “Thanh toán”.',
  'help.guide.settle-up.step.5':
    '“Thêm thanh toán” ở phần đầu thẻ ghi nhận một khoản chuyển không theo gợi ý nào. Chọn “Từ” và “ĐẾN”, số tiền, loại tiền của nó và ngày nó diễn ra, rồi nhấp “Thêm thanh toán” ở chân hộp thoại.',
  'help.guide.settle-up.step.6':
    '“Thanh toán” trên thanh ở trên cùng ghi nhận mọi khoản chuyển còn mở cùng một lúc, không hỏi lại, theo cách một nhóm tính sổ với nhau vào cuối chuyến đi.',
  'help.guide.settle-up.result':
    'Mỗi khoản chuyển đã ghi nhận là một dòng trong sổ cái và một dòng bớt đi khỏi thẻ “Thanh toán”. Khi thẻ hiện chữ “Chia đều”, chuyến đi đã trả xong.',
  'help.guide.settle-up.tip.1':
    'Thẻ cho thấy số lần chuyển ít nhất, không phải mọi món nợ: ba người nợ nhau thành vòng sẽ gộp lại thành một hoặc hai lần chi trả.',
  'help.guide.settle-up.tip.2':
    '“Thanh toán” ghi nhận một khoản chuyển, nó không chuyển tiền. Hãy gửi bằng cách bạn vẫn dùng, rồi nhấp vào nó.',
  'help.guide.settle-up.tip.3':
    'Một khoản chi trả có thể thực hiện bằng bất kỳ loại tiền nào, nên trả một món nợ yên bằng euro là chuyện bình thường: hộp thoại có bộ chọn tiền tệ riêng và cũng đóng băng tỷ giá đó.',
  // final-budget
  'help.guide.final-budget.title': 'Xem chuyến đi tốn của mỗi người bao nhiêu',
  'help.guide.final-budget.goal': 'Đọc phía từng người của sổ cái: số dư hôm nay, và chi phí thật cho mỗi người.',
  'help.guide.final-budget.step.1':
    '“Số dư” cho thấy vị trí của từng người: một thanh xanh về bên phải nếu chuyến đi nợ họ, một thanh đỏ về bên trái nếu họ nợ chuyến đi, và số tiền bên cạnh tên.',
  'help.guide.final-budget.step.2':
    '“Ngân sách cuối cùng” bên dưới trả lời một câu hỏi khác: không phải ai đang nợ gì ngay lúc này, mà chuyến đi tốn của mỗi người bao nhiêu khi mọi thứ đã được trả lại.',
  'help.guide.final-budget.step.3':
    'Nhấp vào một tên để mở phép tính: “Chi phí đã trả”, rồi “Hoàn trả ròng” và “Khoản hoàn trả đang chờ” bên dưới.',
  'help.guide.final-budget.step.4':
    'Bên dưới ba dòng đó, dưới tên của mỗi dòng là một danh sách chứa những mục làm nên dòng ấy: các khoản chi người đó đã trả, các khoản chuyển đã ghi nhận và các khoản còn mở. Mỗi danh sách cộng lại đúng bằng dòng cùng tên.',
  'help.guide.final-budget.result':
    '“Số dư” là ai đang dư hay thiếu hôm nay; “Ngân sách cuối cùng” là số tiền chuyến đi rốt cuộc tốn của từng người trong các bạn khi mọi thứ đã được trả lại.',
  'help.guide.final-budget.tip.1':
    'Ghi nhận một khoản chi trả không làm thay đổi ngân sách cuối cùng của ai cả. Nó chỉ chuyển một số tiền từ khoản hoàn trả đang chờ sang hoàn trả ròng.',
  'help.guide.final-budget.tip.2':
    'Một khoản chi không có người trả nằm ngoài cả hai thẻ, đúng như nó nằm ngoài các gợi ý thanh toán.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Biến một đặt chỗ thành khoản chi',
  'help.guide.expense-from-booking.goal':
    'Gắn chi phí thật của một chuyến bay, một khách sạn hay một địa điểm vào chính bản ghi của nó.',
  'help.guide.expense-from-booking.step.1':
    'Tìm đặt chỗ ở tab “Di chuyển” hoặc tab “Đặt” và nhấp vào cây bút chì ở phần đầu thẻ của nó.',
  'help.guide.expense-from-booking.step.2':
    'Cuộn tới “Chi phí” gần cuối biểu mẫu. Nó đưa ra “Tạo chi phí”, vốn lưu đặt chỗ trước, và “Liên kết chi phí hiện có” cho một khoản đã có trong “Chi phí”.',
  'help.guide.expense-from-booking.step.3':
    'Nhấp “Tạo chi phí”. Đặt chỗ được lưu, biểu mẫu đóng lại, và trình chỉnh sửa Chi phí mở ra với tiêu đề của đặt chỗ làm tên và loại của nó đã được khớp sẵn với một danh mục.',
  'help.guide.expense-from-booking.step.4':
    'Điền số tiền và đơn vị tiền tệ của nó, ai đã trả và cách chia như với mọi khoản chi, rồi nhấp “Thêm chi phí”. Mở lại đặt chỗ giờ sẽ thấy nó dưới “Các chi phí liên kết”, với một cây bút chì để sửa, “Hủy liên kết, giữ chi phí” để thả nó ra và một thùng rác để bỏ nó đi.',
  'help.guide.expense-from-booking.result':
    'Đặt chỗ mang theo chi phí của nó, và khoản chi là một dòng bình thường trên tab Chi phí, có người trả, cách chia và loại tiền như mọi khoản khác.',
  'help.guide.expense-from-booking.tip.1':
    'Xóa đặt chỗ sẽ xóa luôn các khoản chi liên kết với nó. “Xóa chi phí” trong khối “Chi phí” của đặt chỗ làm điều ngược lại: khoản chi biến mất, đặt chỗ ở lại. “Hủy liên kết, giữ chi phí” giữ lại cả hai.',
  'help.guide.expense-from-booking.tip.2':
    'Một địa điểm cũng có khối như vậy trong biểu mẫu của nó, với “Tạo chi phí” lưu địa điểm trước.',
  // costs-table
  'help.guide.costs-table.title': 'Lên kế hoạch chi phí trong một bảng',
  'help.guide.costs-table.goal':
    'Đọc và thay đổi các khoản chi dưới dạng một trang tính, sắp theo danh mục và tính theo mỗi người và mỗi ngày.',
  'help.guide.costs-table.step.1':
    'Nhấp “Bảng”, biểu tượng thứ hai của công tắc “Danh sách” / “Bảng” trên thanh. Sổ cái nhường chỗ cho một bảng gồm cùng các khoản chi đó, và ô tìm kiếm cùng các bộ lọc cũng áp dụng cho bảng.',
  'help.guide.costs-table.step.2':
    'Bảng được nhóm theo danh mục, mỗi nhóm có phần đầu ghi tên, số khoản chi nó chứa và tổng phụ của nó; nhấp vào phần đầu để gập nhóm lại. Các cột là “Tên”, “Ngày”, “Tổng cộng”, “Người” và “Ngày”, rồi “Mỗi người”, “mỗi ngày” và “P.p/Ngày”, được tính từ các cột trước trên nền xám.',
  'help.guide.costs-table.step.3':
    'Nhấp vào một ô để sửa ngay tại chỗ: tên, tổng, “Người” hoặc “Ngày”. Gõ, rồi nhấn Enter hoặc nhấp ra chỗ khác để giữ, hoặc Esc để để nguyên như cũ; ô ngày tháng mở lịch. “Mỗi người” và các cột tính toán khác cập nhật theo ngay lập tức.',
  'help.guide.costs-table.step.4':
    'Một tổng có ổ khóa thì không sửa được ở đây: đã có người trả nó, hoặc nó được nhập bằng một loại tiền khác, và chú giải của nó cho biết là trường hợp nào. Nhấp vào nó sẽ mở khoản chi thay vào đó, để số dư và tỷ giá đã đóng băng luôn đúng.',
  'help.guide.costs-table.step.5':
    '“Thêm chi phí” ở cuối một danh mục thêm vào đó một dòng tên “Mục mới”, mang ngày giống mục mới nhất ở đó, với tên đã mở sẵn để sửa. Cho nó một tổng theo cùng cách.',
  'help.guide.costs-table.step.6':
    'Ở chế độ xem này, cột bên phải hiện “Tóm tắt” thay cho “Theo danh mục”. Nó cộng các khoản chi theo bốn cách: “Danh mục”, “Ngày”, “Người trả”, với “Chưa có người trả” cho các khoản chưa trả, và “Trạng thái”, “Đã trả” so với “Chưa trả”.',
  'help.guide.costs-table.result':
    'Mỗi khoản chi đứng trong danh mục của nó cùng số tiền tương ứng cho mỗi người và mỗi ngày, và một tổng được sửa trong ô được tính ngay vào các thẻ phía trên và vào “Tóm tắt”.',
  'help.guide.costs-table.tip.1':
    '“Chi phí” nhớ chế độ xem trong trình duyệt này: nó mở ở dạng bảng cho đến khi bạn nhấp “Danh sách” lần nữa.',
  'help.guide.costs-table.tip.2':
    'Một khoản chi chia theo “Tùy chỉnh” hoặc “Hóa đơn” không có một phần duy nhất cho mỗi người, nên “Mỗi người” và “P.p/Ngày” của nó để trống.',
  'help.guide.costs-table.tip.3':
    'Người trả, cách chia, ghi chú và hóa đơn được sửa trong chính khoản chi: “Tùy chọn khác” ở cuối một dòng đưa ra “Chỉnh sửa”, và “Xóa bỏ” để gỡ dòng đó.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Di chuyển',
  'help.ctx.trip-transports.summary':
    'Mọi thứ đưa bạn đi giữa các điểm dừng: chuyến bay, xe lửa, xe buýt, xe hơi, taxi, xe đạp, du thuyền, phà và những tuyến giao thông công cộng mà TREK tra cứu giúp bạn. Tab này là danh sách của chúng; chúng cũng được tạo và đọc ngay trên kế hoạch, và được vẽ trên bản đồ.',
  'help.ctx.trip-transports.bullet.1':
    'Tab chỉ chứa các chuyến đi lại. Chỗ ở, nhà hàng, sự kiện và vé nằm ở tab “Đặt”, nên cùng một mục không bao giờ xuất hiện hai lần.',
  'help.ctx.trip-transports.bullet.2':
    'Thanh ở trên cùng có ô tìm kiếm, “Lọc” cho trạng thái, loại và người đi, ba chế độ xem “Thẻ”, “Danh sách” và “Dòng thời gian”, và “Tùy chọn hiển thị”. “Phương tiện” ở bên phải thêm một chuyến bằng tay, và các biểu tượng trước nó, “Nhập xác nhận đặt chỗ” và “Nhập từ AirTrail”, xuất hiện khi máy chủ đọc được các bản xác nhận hoặc khi có một AirTrail được kết nối.',
  'help.ctx.trip-transports.bullet.3':
    '“Thẻ” là chế độ xem mà tab mở ra: “Đã xác nhận” trước, rồi “Chưa giải quyết”, mỗi phần gập lại được bằng tiêu đề của nó. Các tuyến giao thông công cộng đã lên kế hoạch không có trạng thái và nằm giữa các chuyến đã xác nhận theo thứ tự thời gian, trừ khi “Tùy chọn hiển thị” cho chúng một phần riêng, “Giao thông công cộng tự động”. “Danh sách” nhóm theo ngày, và “Dòng thời gian” trải mọi chuyến lên các ngày của chuyến đi.',
  'help.ctx.trip-transports.bullet.4':
    'Dải đầu của một thẻ được tô màu theo trạng thái, xanh lá cho đã xác nhận, hổ phách cho còn chờ, xanh dương cho một tuyến đã lên kế hoạch, và chứa chấm trạng thái, loại, tiêu đề, cây bút chì và thùng rác. Bên dưới: “Ngày”, “Thời gian”, “Mã đặt chỗ”, “Tuyến đường” và “Hãng hàng không” cùng “Chuyến bay số”, hoặc “Số tàu”, “Sân ga” và “Ghế”. Một cú nhấp lên thẻ mở chi tiết của nó.',
  'help.ctx.trip-transports.bullet.5':
    'Phương tiện cũng được tạo ngay trên kế hoạch: dấu + ở phần đầu một ngày đưa ra “Thêm phương tiện di chuyển” và “Giao thông công cộng”, còn đoạn nối thời gian đi lại giữa hai điểm dừng mở đúng tìm kiếm đó cho riêng chặng ấy.',
  'help.ctx.trip-transports.bullet.6':
    'Một phương tiện đã đặt cả hai đầu sẽ vẽ một đường trên bản đồ. Biểu tượng tuyến trên hàng của nó trong kế hoạch ngày và “Trên bản đồ” trong chi tiết của nó bật đường đó lên, và “Hiển thị tất cả lộ trình đặt chỗ” ở thanh công cụ phía trên các ngày lật cả chuyến đi.',
  // transports-list
  'help.guide.transports-list.title': 'Đọc tab Di chuyển',
  'help.guide.transports-list.goal': 'Biết danh sách nói gì với bạn trước khi thay đổi bất cứ thứ gì trên đó.',
  'help.guide.transports-list.step.1':
    '“Di chuyển” là tab thứ hai của chuyến đi. Nó chỉ chứa các chuyến đi lại: khách sạn, nhà hàng, sự kiện và vé nằm ở tab “Đặt”.',
  'help.guide.transports-list.step.2':
    '“Lọc”, cái phễu trên thanh, mở các lựa chọn: “Trạng thái” với “Tất cả”, “Đã xác nhận” và “Chưa giải quyết”, rồi mọi loại đang dùng kèm số đếm. Tích một hoặc vài loại để chỉ giữ những loại đó; một con số trên cái phễu đếm những gì đang bật, và thanh cho biết đang hiện bao nhiêu chuyến, ví dụ “1 trên 4”. “Đặt lại bộ lọc” ở chân menu đưa mọi thứ trở lại.',
  'help.guide.transports-list.step.3':
    '“Thẻ”, “Danh sách” và “Dòng thời gian” bên cạnh sắp các chuyến thành thẻ, thành các hàng nhóm theo ngày, hoặc thành các thanh trải trên các ngày của chuyến đi. “Tùy chọn hiển thị”, biểu tượng thanh trượt, đặt “Nhóm theo” và “Sắp xếp theo” cho “Thẻ” và “Danh sách” và các làn cho “Dòng thời gian”, và “Đặt lại chế độ xem” quay về mặc định. Trong “Thẻ”, “Giao thông công cộng thành mục riêng” gom các tuyến đã lên kế hoạch dưới “Giao thông công cộng tự động”.',
  'help.guide.transports-list.step.4':
    'Một thẻ nói đủ mọi thứ. Dải đầu của nó màu xanh lá khi “Đã xác nhận” và màu hổ phách khi “Chưa giải quyết”, và mang chấm trạng thái, loại và tiêu đề. Bên dưới, “Ngày” cho biết những ngày nó kéo dài cùng ngày tháng, rồi đến “Thời gian”, “Mã đặt chỗ”, “Tuyến đường” với biểu tượng của loại giữa các điểm dừng, và “Hãng hàng không” cùng “Chuyến bay số”, hoặc “Số tàu”, “Sân ga” và “Ghế”. Nhấp vào thẻ và chi tiết của nó mở ra.',
  'help.guide.transports-list.step.5':
    'Một cú nhấp vào chấm trạng thái chuyển chuyến đó giữa “Chưa giải quyết” và “Đã xác nhận”. Cây bút chì trên dải đầu mở biểu mẫu của phương tiện, và thùng rác xóa nó sau câu hỏi “Xóa đặt chỗ?”, câu hỏi nêu tên thứ sắp mất.',
  'help.guide.transports-list.result':
    'Mỗi thẻ nói ngay trong một cái liếc rằng chuyến đi lại ấy đã được đặt hay chưa, và thanh thu hẹp hoặc sắp xếp lại danh sách bất cứ khi nào bạn cần.',
  'help.guide.transports-list.tip.1':
    'Tab nhớ bạn đã để nó ra sao: chế độ xem, cách nhóm và cách sắp xếp trong trình duyệt này, các phần đã gập theo từng chuyến đi, và các bộ lọc cho tới khi bạn đóng tab trình duyệt.',
  'help.guide.transports-list.tip.2':
    '“Nhập xác nhận đặt chỗ” và “Nhập từ AirTrail”, hai biểu tượng trước “Phương tiện”, chỉ có mặt khi máy chủ đọc được các bản xác nhận và khi có một máy chủ AirTrail được kết nối. Không có chúng, danh sách được điền bằng tay và bằng tìm kiếm giao thông công cộng.',
  // add-transport
  'help.guide.add-transport.title': 'Thêm một phương tiện vào một ngày',
  'help.guide.add-transport.goal':
    'Đặt chuyến đi lại đưa bạn từ điểm dừng này sang điểm dừng kế tiếp vào đúng ngày nó diễn ra.',
  'help.guide.add-transport.step.1':
    'Ở phần đầu của ngày có chuyến đi, nhấp dấu +, có chú giải ghi “Thêm vào ngày”, và chọn “Thêm phương tiện di chuyển”. Biểu mẫu mở ra với ngày đó đã được điền sẵn.',
  'help.guide.add-transport.step.2':
    'Nhãn loại trên dải đầu cho biết bạn sẽ đi gì, ban đầu là “Chuyến bay”. Nhấp vào đó để chọn “Chuyến bay”, “Xe lửa”, “xe buýt”, “Xe hơi”, “Taxi”, “Xe đạp”, “Du thuyền”, “Phà” hoặc “Khác”, và biểu mẫu thay đổi theo: chuyến bay nhận một sân bay ở mỗi điểm dừng, tàu hỏa nhận một chuỗi nhà ga, xe hơi nhận “Ngày đón” và “Ngày trở về” cùng “Điểm dừng dọc đường”.',
  'help.guide.add-transport.step.3':
    'Gõ tiêu đề thẳng vào dải đầu, chỗ có ví dụ màu xám. Đó là ô duy nhất bắt buộc phải điền: cho tới khi điền, dòng bên dưới ghi “Tiêu đề *” và “Thêm” vẫn xám. Hãy viết thứ bạn sẽ nhận ra trên bảng thông tin sân ga.',
  'help.guide.add-transport.step.4':
    'Dưới “Tuyến đường”, “Từ” và “ĐẾN” nhận một nhà ga, một bến cảng hoặc một địa chỉ. Các địa điểm của chuyến đi được đưa ra trước khi bạn gõ; gõ ít nhất ba chữ cái để tìm kiếm, và chọn một kết quả. Một cái tên chỉ được gõ vào mà không bao giờ được chọn thì không được lưu, và không vẽ gì trên bản đồ.',
  'help.guide.add-transport.step.5':
    '“Ngày” và “Thời gian bắt đầu” cho biết khi nào nó chạy, “Ngày kết thúc” và “Thời gian kết thúc” cho biết khi nào nó xong; một chuyến đến nơi vào hôm sau thì lấy ngày hôm sau ở đầu kia. “Mã đặt chỗ” và “Ghi chú” ở phía dưới là tùy chọn, và một cú nhấp vào nhãn “Chưa giải quyết” trên dải đầu chuyển nó sang “Đã xác nhận”.',
  'help.guide.add-transport.step.6': 'Nhấp “Thêm”.',
  'help.guide.add-transport.result':
    'Phương tiện trở thành một hàng trên ngày đó, đúng giờ của nó giữa các điểm dừng, và một thẻ trên tab “Di chuyển” dưới “Chưa giải quyết” hoặc “Đã xác nhận”.',
  'help.guide.add-transport.tip.1':
    'Hàng rơi vào chỗ mà giờ bắt đầu của nó quy định, sau điểm dừng cuối cùng bắt đầu sớm hơn. Tay nắm của nó kéo nó tới bất cứ đâu khác trong ngày, hoặc sang một ngày khác.',
  'help.guide.add-transport.tip.2':
    '“Đính kèm tập tin” dưới “Tập tin” nhận lấy vé, còn “Tạo chi phí” dưới “Chi phí” lưu đặt chỗ và mở trình biên tập “Chi phí” cho tiền vé.',
  'help.guide.add-transport.tip.3':
    '“Người đi”, khối đầu tiên của biểu mẫu, đánh dấu ai có mặt trên chuyến này. Khi chuyến đi có nhiều hơn một thành viên và một phương tiện nêu tên ai đó, “Lọc” trên tab cũng đưa ra “Người đi”, thứ thu hẹp danh sách về các chuyến của một người.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Đọc một chuyến bay ra từ vé điện tử của nó',
  'help.guide.import-transport-file.goal':
    'Để TREK rút một chuyến bay, một chuyến tàu hay một chuyến phà ra từ vé mà hãng vận chuyển đã gửi, và kiểm tra trước khi nó được lưu.',
  'help.guide.import-transport-file.step.1':
    'Trên thanh của tab “Di chuyển”, nhấp biểu tượng tải xuống trước “Phương tiện”, có chú giải ghi “Nhập xác nhận đặt chỗ”. Hộp thoại mang tên đó mở ra, cùng hộp thoại mà tab “Đặt” có.',
  'help.guide.import-transport-file.step.2':
    'Thả vé lên ô đó, hoặc nhấp vào ô rồi chọn nó: EML, PDF, PKPass, HTML và TXT, tối đa năm tập tin, mỗi tập tin 10 MB. Những tập tin bạn chọn được nêu tên trên ô.',
  'help.guide.import-transport-file.step.3': 'Nhấp “Nhập”. Hộp thoại đóng lại ngay; việc đọc diễn ra ở nền.',
  'help.guide.import-transport-file.step.4':
    'Một thẻ ở dưới cùng bên phải báo cáo lượt chạy dưới tên tập tin. “Đang phân tích tệp…” đổi thành dấu tích khi việc đọc xong, và thẻ đưa ra “Nhập”. Nhấp vào đó.',
  'help.guide.import-transport-file.step.5':
    'Một chuyến bay mở ra trong “Thêm phương tiện di chuyển”, đã điền sẵn: nhãn loại ở “Chuyến bay”, hãng hàng không và số hiệu chuyến bay làm tiêu đề trên dải đầu, cả hai sân bay dưới “Tuyến đường” với “Khởi hành” và “Đến”, giờ và múi giờ của chúng, “Hãng hàng không” và “Chuyến bay số”, “Mã đặt chỗ” và vé dưới “Tập tin”. Kiểm tra rồi nhấp “Thêm”.',
  'help.guide.import-transport-file.result':
    'Chuyến bay là một thẻ dưới “Chưa giải quyết” trên tab “Di chuyển” và một hàng trên ngày nó khởi hành, với vé dưới “Tập tin”, và khi cả hai sân bay đã biết, nó vẽ đường cong của mình trên bản đồ.',
  'help.guide.import-transport-file.tip.1':
    'Hai tab dùng chung một lần nhập: một tập tin chứa một chuyến bay và một khách sạn sẽ mở chuyến bay trong “Thêm phương tiện di chuyển” và khách sạn trong “Đặt chỗ mới”, lần lượt từng cái, bất kể bạn bắt đầu từ tab nào.',
  'help.guide.import-transport-file.tip.2':
    'Sân bay được đặt theo mã của chúng. Một nhà ga hay một cảng mà việc đọc không định vị được sẽ được nêu tên bằng màu hổ phách trên thẻ nhập ở góc dưới bên phải; hãy chọn bằng tay dưới “Tuyến đường” trước khi nhấp “Thêm”, nếu không phương tiện sẽ không vẽ gì trên bản đồ.',
  // plan-transit
  'help.guide.plan-transit.title': 'Lên kế hoạch một tuyến giao thông công cộng',
  'help.guide.plan-transit.goal':
    'Để TREK tra cứu những chuyến tàu và xe buýt có thật giữa hai điểm của một ngày và đưa chuyến bạn chọn vào kế hoạch.',
  'help.guide.plan-transit.step.1':
    'Nhấp dấu + ở phần đầu của ngày và chọn “Giao thông công cộng”. Tìm kiếm mở ra cho ngày đó: ngày là nhãn trên dải đầu, và “Thủ công” cùng “Tự động” bên cạnh chuyển giữa tìm kiếm này và biểu mẫu thông thường.',
  'help.guide.plan-transit.step.2':
    '“Điểm đi” và “Điểm đến” nhận một trạm dừng hoặc một nhà ga. Khi ô còn trống, chính các điểm dừng của ngày và các chỗ nghỉ của chuyến đi được gợi ý; gõ hai chữ cái thì thay vào đó nó tìm các nhà ga trong biểu đồ giờ chạy. “Đổi chiều” giữa hai ô đảo ngược tuyến.',
  'help.guide.plan-transit.step.3':
    '“Khởi hành” hoặc “Đến nơi” kèm một giờ cho biết bạn muốn đi lúc nào, còn “Tuyến tốt nhất”, “Ít chuyển tuyến hơn” hoặc “Ít đi bộ hơn” cho biết các câu trả lời nên được sắp xếp thế nào.',
  'help.guide.plan-transit.step.4':
    'Các chip bên dưới cho biết được dùng những phương thức nào: “Tàu hỏa”, “Tàu điện ngầm”, “Tàu điện”, “Xe buýt”, “Phà” và “Cáp treo”. Tắt một cái để loại nó ra, ít nhất một cái vẫn bật. Rồi nhấp “Tìm kiếm”.',
  'help.guide.plan-transit.step.5':
    'Mỗi kết quả cho biết giờ đi và giờ đến, mất bao lâu, bao nhiêu lần chuyển tuyến và bao nhiêu phần đi bộ, cùng các tuyến dưới dạng huy hiệu, mang màu riêng của chúng khi lịch trình có cung cấp. Nhấp vào một kết quả để mở nó ra từng chặng một, với các điểm dừng nơi bạn lên xe và đổi tuyến, sân ga và các đoạn đi bộ giữa các tuyến.',
  'help.guide.plan-transit.step.6': 'Nhấp “Thêm vào ngày”.',
  'help.guide.plan-transit.result':
    'Tuyến trở thành một hàng trên ngày đó với các huy hiệu tuyến xe, mũi nhọn của hàng mở nó ra từng chặng một, và một thẻ trên tab “Di chuyển” nằm giữa các chuyến đã xác nhận, được tô màu xanh dương.',
  'help.guide.plan-transit.tip.1':
    'Các tuyến đến từ Transitous, một dịch vụ cộng đồng miễn phí dựa trên dữ liệu biểu đồ giờ chạy công khai: không khóa, không tài khoản. Quản trị viên có thể trỏ tìm kiếm sang Google thay vì vậy.',
  'help.guide.plan-transit.tip.2':
    'Không tìm thấy gì? Các nguồn dữ liệu chỉ phủ một vùng và một khoảng thời gian. Hãy thử giờ khác, bật thêm phương thức, hoặc chọn một nhà ga thay vì chính địa điểm đó. Thông báo nêu tên dịch vụ đã trả lời.',
  'help.guide.plan-transit.tip.3':
    'Cùng tìm kiếm đó mở ra cho riêng một chặng: nhấp đoạn nối thời gian đi lại giữa hai điểm dừng và chọn “Giao thông công cộng”. “Điểm đi”, “Điểm đến” và giờ khởi hành đã được điền sẵn cho bạn.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Mở và thay đổi một tuyến đã lên kế hoạch',
  'help.guide.change-transit-route.goal': 'Đọc tuyến từng tuyến xe một, đổi tên nó, hoặc tra cứu lại lộ trình.',
  'help.guide.change-transit-route.step.1':
    'Trên tab “Di chuyển”, một tuyến đã lên kế hoạch là một thẻ có dải đầu màu xanh dương, nằm giữa các chuyến đã xác nhận theo thứ tự thời gian; khi “Giao thông công cộng thành mục riêng” được bật trong “Tùy chọn hiển thị”, nó nằm dưới “Giao thông công cộng tự động” thay vào đó. Nhấp vào thẻ; tuyến mở ra dưới dạng một đặt chỗ.',
  'help.guide.change-transit-route.step.2':
    'Các ô ở trên cùng cho biết giờ đi và giờ đến cùng các điểm dừng của chúng, “Thời lượng”, “Chuyển tuyến” và “Đi bộ”. “Lộ trình” bên dưới chúng đi qua tuyến từng tuyến xe một, kèm giờ giấc, sân ga và các đoạn đi bộ giữa các tuyến.',
  'help.guide.change-transit-route.step.3':
    '“Đổi tuyến” ở chân đặt chỗ mở lại tìm kiếm, đã điền sẵn hai đầu của tuyến này và ngày của nó.',
  'help.guide.change-transit-route.step.4':
    'Nhấp “Tìm kiếm”, mở ra một tuyến khác và nhấp “Thêm vào ngày”; nó thế chỗ tuyến cũ. Còn “Chỉnh sửa”, ở tận cùng bên phải chân đặt chỗ, mở biểu mẫu phương tiện thông thường, nơi có “Mã đặt chỗ”, người đi, ghi chú và các tập tin.',
  'help.guide.change-transit-route.result':
    'Hành trình mang lộ trình mới, và thẻ của nó trên tab “Di chuyển” hiển thị các tuyến xe và giờ giấc mới.',
  'help.guide.change-transit-route.tip.1':
    'Nhấp vào tiêu đề ở đầu đặt chỗ để đổi tên tuyến mà không động tới lộ trình. Ghi chú của tuyến được viết trong biểu mẫu phương tiện, sau nút “Chỉnh sửa”.',
  'help.guide.change-transit-route.tip.2':
    'Thùng rác ở chân đặt chỗ xóa tuyến sau một câu hỏi; ngày vẫn giữ các điểm dừng của nó.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Đổi cách đi một chặng',
  'help.guide.leg-travel-mode.goal':
    'Đi bộ một chặng của một ngày mà phần còn lại đi bằng xe, hoặc giao chặng đó cho tìm kiếm giao thông công cộng.',
  'help.guide.leg-travel-mode.step.1':
    'Các đoạn nối giữa những điểm dừng chỉ hiện ra khi lộ trình của ngày được bật. Nhấp vào phần đầu của ngày để mở nó, rồi “Chỉ đường” trên thanh dưới các điểm dừng của ngày.',
  'help.guide.leg-travel-mode.step.2':
    'Mỗi đoạn nối nêu thời gian đi lại và khoảng cách của chặng đó, kèm biểu tượng của phương thức đã dùng để tính lộ trình: một chiếc xe cho lái xe, một bàn chân cho đi bộ.',
  'help.guide.leg-travel-mode.step.3':
    'Nhấp vào đoạn nối. Trình đơn đưa ra “Lái xe” và “Đi bộ”, “Giao thông công cộng”, và “Dùng mặc định của ngày”.',
  'help.guide.leg-travel-mode.step.4':
    'Chọn “Đi bộ”. Chỉ chặng này thay đổi; phần còn lại của ngày giữ phương thức của nó.',
  'help.guide.leg-travel-mode.result':
    'Chặng hiển thị biểu tượng bàn chân và thời gian đi bộ của nó, còn các chặng khác trong ngày giữ phương thức của ngày.',
  'help.guide.leg-travel-mode.tip.1':
    'Phương thức thuộc về chặng, không thuộc về ngày: các nút “Lái xe” và “Đi bộ” của cả ngày không bao giờ ghi đè một chặng bạn đã đặt bằng tay. “Dùng mặc định của ngày” trả chặng đó lại cho chúng.',
  'help.guide.leg-travel-mode.tip.2':
    '“Giao thông công cộng” trong cùng trình đơn mở tìm kiếm tuyến cho đúng chặng này, với hai đầu và giờ khởi hành đã được điền sẵn.',
  'help.guide.leg-travel-mode.tip.3':
    'Thời gian đến từ một bộ tìm đường công khai chạy trên đường sá và lối đi bộ có thật. Một chặng mà nó không trả lời được sẽ giữ đường thẳng của mình và không hiện thời gian.',
  // edit-transport
  'help.guide.edit-transport.title': 'Thay đổi hoặc xóa một phương tiện',
  'help.guide.edit-transport.goal':
    'Sửa một giờ, một sân ga hay một mã đặt chỗ, hoặc bỏ chuyến đi lại ấy ra khỏi chuyến đi.',
  'help.guide.edit-transport.step.1':
    'Trong kế hoạch ngày, một phương tiện là một hàng nằm giữa các điểm dừng, được tô màu theo loại. Nhấp vào nó và đặt chỗ của nó mở ra: trạng thái, loại, các ngày và “Mã đặt chỗ” dưới dạng nhãn ở phần đầu, giờ khởi hành và giờ đến cùng sân bay hoặc nhà ga của chúng ở bên dưới.',
  'help.guide.edit-transport.step.2':
    '“Chỉnh sửa” ở chân đặt chỗ mở biểu mẫu đã tạo ra nó, với “Chỉnh sửa phương tiện đi lại” phía trên tiêu đề trên dải đầu. Mọi thứ đều đổi được ở đó: tiêu đề, nhãn trạng thái và nhãn loại, tuyến đường, ngày và giờ, “Mã đặt chỗ”.',
  'help.guide.edit-transport.step.3':
    'Tuyến đường của một chuyến bay là một chuỗi sân bay, của một chuyến tàu là một chuỗi nhà ga. “Thêm điểm dừng” đặt thêm một điểm ở giữa, và mỗi chặng giữ giờ giấc riêng cùng số hiệu chuyến bay hoặc số tàu riêng.',
  'help.guide.edit-transport.step.4':
    'Nhấp “Cập nhật”. Để bỏ hẳn phương tiện, dùng thùng rác ở bên trái của cùng thanh đó, thùng rác ở chân đặt chỗ của nó hoặc thùng rác trên thẻ của nó trong tab “Di chuyển”, rồi xác nhận.',
  'help.guide.edit-transport.result':
    'Thay đổi hiện ra ở mọi nơi phương tiện xuất hiện: tab “Di chuyển”, ngày nó chạy, và đường của nó trên bản đồ.',
  'help.guide.edit-transport.tip.1':
    'Cùng một biểu mẫu mở ra từ cả hai phía: qua “Chỉnh sửa” trong đặt chỗ mà một hàng của kế hoạch ngày mở ra, và qua cây bút chì trên thẻ trong tab “Di chuyển”. Một tuyến giao thông công cộng đã lên kế hoạch cũng mở ra dưới dạng đặt chỗ; “Đổi tuyến” ở đó mở lại tìm kiếm, còn “Chỉnh sửa” dẫn tới biểu mẫu này.',
  'help.guide.edit-transport.tip.2':
    'Chuyển một phương tiện sang ngày khác hoàn toàn không cần tới biểu mẫu: kéo hàng của nó từ thẻ ngày này sang thẻ ngày kế tiếp.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Vẽ một phương tiện trên bản đồ',
  'help.guide.transport-on-map.goal': 'Xem một chuyến bay, một chặng lái xe hay một tuyến thực sự đi qua đâu.',
  'help.guide.transport-on-map.step.1':
    'Một phương tiện đã đặt cả hai đầu mang một biểu tượng tuyến nhỏ trên hàng của nó trong kế hoạch ngày. Nhấp vào đó; chú giải của nó chuyển thành “Ẩn lộ trình đặt chỗ”.',
  'help.guide.transport-on-map.step.2':
    'Tuyến được vẽ trên bản đồ, với một dấu hình viên thuốc ở mỗi đầu mang biểu tượng của phương tiện.',
  'help.guide.transport-on-map.step.3':
    'Nhấp một dấu đầu tuyến và đặt chỗ mở ra ngay trên bản đồ: trạng thái, loại, các ngày và “Mã đặt chỗ” ở phần đầu, bên dưới là giờ giấc cùng sân bay hoặc nhà ga của chúng, hãng hàng không và số hiệu chuyến bay. “Đóng” trên dải đầu của nó cất nó đi.',
  'help.guide.transport-on-map.step.4':
    'Biểu tượng tuyến ở thanh công cụ phía trên các ngày làm việc đó cho cả chuyến đi một lượt: “Hiển thị tất cả lộ trình đặt chỗ”, và “Ẩn tất cả lộ trình đặt chỗ” để xóa chúng đi lần nữa.',
  'help.guide.transport-on-map.step.5':
    'Một tuyến giao thông công cộng đã lên kế hoạch không có biểu tượng tuyến riêng. Nó được vẽ bằng nút “Chỉ đường” của ngày, và vì thế “Ẩn tất cả lộ trình đặt chỗ” không xóa nó khi lộ trình của ngày đó vẫn đang bật.',
  'help.guide.transport-on-map.result':
    'Các tuyến nằm trên bản đồ với một dấu ở mỗi đầu, và ở lại đó cho tới khi bạn tắt chúng đi lần nữa.',
  'help.guide.transport-on-map.tip.1':
    'Một chuyến bay, một chuyến du thuyền và một chuyến phà được vẽ thành đường cong, còn xe hơi, xe buýt, taxi và xe đạp bám theo đường sá có thật, và một chuyến xe lửa hay một tuyến đã lên kế hoạch chạy qua những nhà ga nó dừng.',
  'help.guide.transport-on-map.tip.2':
    'Một đặt chỗ “Đã xác nhận” là đường liền, một đặt chỗ “Chưa giải quyết” là đường đứt nét. Cài đặt “Nhãn lộ trình đặt chỗ” in mã sân bay hoặc tên nhà ga vào các dấu đầu tuyến.',
  'help.guide.transport-on-map.tip.3':
    '“Hiển thị tất cả lộ trình đặt chỗ” là một tờ giấy trắng, không phải một lớp phủ: nó bỏ đi những gì các biểu tượng riêng lẻ đã đặt, nên bấm hai lần sẽ để bạn lại với tất cả đang bật hoặc tất cả đang tắt.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Nhập chuyến bay từ AirTrail',
  'help.guide.airtrail-import.goal':
    'Đưa các chuyến bay bạn đã giữ trong AirTrail vào chuyến đi trong một lần, và để chúng theo AirTrail từ đó về sau.',
  'help.guide.airtrail-import.step.1':
    'Khi tiện ích AirTrail đang bật và máy chủ của bạn đã kết nối dưới “Tích hợp” trong “Cài đặt”, thanh của tab “Di chuyển” mang một biểu tượng máy bay trước “Phương tiện”, “Nhập từ AirTrail”. Nhấp vào nó.',
  'help.guide.airtrail-import.step.2':
    '“Nhập từ AirTrail” liệt kê các chuyến bay của tài khoản bạn thành hai nhóm. “Trong chuyến đi này” chứa những chuyến có ngày nằm trong chuyến đi, đã được đánh dấu sẵn; “Các chuyến bay khác” chứa phần còn lại, chưa đánh dấu. Một chuyến bay đã có trong chuyến đi bị làm mờ và ghi “Đã nhập”.',
  'help.guide.airtrail-import.step.3':
    'Mỗi hàng là một ô đánh dấu với hãng hàng không và số hiệu chuyến bay, hai sân bay và ngày. Nhấp một hàng để lấy chuyến bay vào hoặc bỏ nó ra; những chuyến dưới “Các chuyến bay khác” chỉ vào khi bạn đánh dấu chúng.',
  'help.guide.airtrail-import.step.4':
    'Các chuyến bay nối tiếp nhau, mỗi chuyến cất cánh từ sân bay mà chuyến trước đó đã hạ cánh trong vòng một ngày, được đóng khung chung. Ô đánh dấu bên dưới, “Nhập thành một chuyến bay với điểm dừng tại” kèm tên sân bay đó, đã được bật sẵn: để nguyên để có một đặt chỗ với một điểm dừng, hoặc tắt đi để nhập các chặng thành những chuyến bay riêng.',
  'help.guide.airtrail-import.step.5':
    'Nhấp nút ở góc dưới bên phải, nút đếm số chuyến bay đã đánh dấu, ví dụ “Nhập 2”. Thông báo sau đó cho biết bao nhiêu chuyến đã vào.',
  'help.guide.airtrail-import.step.6':
    'Các chuyến bay là những thẻ dưới “Đã xác nhận”, mỗi thẻ có một nhãn AirTrail màu xanh dương cạnh tiêu đề, và là những hàng trên các ngày chúng bay. Một chuyến nối đã ghép là một thẻ, với tuyến đường chạy qua điểm dừng.',
  'help.guide.airtrail-import.result':
    'Các chuyến bay từ AirTrail là những thẻ trên tab “Di chuyển” và những hàng trên các ngày của chúng, mỗi thẻ mang nhãn AirTrail cho biết nó đến từ đâu.',
  'help.guide.airtrail-import.tip.1':
    'Một chuyến bay đã có trong chuyến đi với cùng số hiệu và ngày sẽ bị bỏ qua, và một thông báo cho biết có bao nhiêu chuyến như vậy. Mũi tên hoàn tác trên thanh công cụ phía trên các ngày rút lại toàn bộ lần nhập.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail vẫn là nguồn sự thật. TREK đọc các thay đổi của nó khi bạn mở chuyến đi và vài phút một lần ở nền; một chuyến bay bị xóa ở đó vẫn giữ thẻ, với nhãn chuyển thành “Chưa được đồng bộ hóa”. Các chỉnh sửa trong TREK chỉ đi ngược lại khi “Viết các thay đổi trở lại AirTrail” đang bật dưới “Tích hợp”.',
  'help.guide.airtrail-import.tip.3':
    'Một chuyến nối đã ghép không có chuyến bay AirTrail đơn lẻ nào để theo, nên nó là một lần nhập một chiều: nó giữ nhãn xanh dương, và trỏ vào nhãn sẽ thấy điều đó. Điều tương tự xảy ra với một chuyến bay đã đồng bộ mà bạn thêm điểm dừng bằng tay.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Chuyến đi đường bộ',
  'help.ctx.trip-roadtrip.summary':
    'Kế hoạch được đọc như một chuyến lái xe duy nhất: vẫn những ngày ấy và những địa điểm ấy, được nối thành các điểm dừng với quãng lái xe ở giữa, trên dải hành trình chạy dọc cột bên trái và trên bản đồ. Nó cho biết bao xa và bao lâu, chỗ nào hết nhiên liệu, và dọc đường có những gì.',
  'help.ctx.trip-roadtrip.bullet.1':
    '“Ngày” và “Chuyến đi đường bộ” ở đầu cột bên trái chuyển qua lại giữa kế hoạch theo ngày và chuyến lái xe. Không có gì được sao chép và không có gì bị đổi: “Ngày” trả lại kế hoạch đúng như cũ.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Đầu dải hành trình cộng cả chuyến đi: “Quãng đường”, “Thời gian lái xe” và “Điểm dừng”. Bên dưới là một thẻ cho mỗi ngày có lái xe, kèm quãng đường của riêng ngày đó, ngày đó dành cho mấy điểm dừng, nó vượt những gì, và huy hiệu “Tuyến”.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Điểm dừng có số là một địa điểm mà ngày đó hướng tới. Một điểm dừng dọc đường, như xăng dầu, sạc điện hay trạm dừng nghỉ, mang biểu tượng loại của nó thay cho số và không được tính. Nhấp vào một con số để đổi loại, và nhấp huy hiệu “Dừng” để nói nó mất bao lâu.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Giữa hai điểm dừng, dải lái xe cho biết chặng đó dài bao nhiêu và mất bao lâu. Nhấp vào đó để mở “Các lộ trình cho chặng này”, hoặc nhấp vào lộ trình vẽ trên bản đồ để bẻ chặng qua một điểm trung gian.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Cột bên phải trở thành “Dọc theo lộ trình”: chọn thứ cần tìm và ngày trên cùng một dòng, chọn bề rộng hành lang, rồi nhấn “Tìm kiếm”. Dấu cộng trên một kết quả, “Thêm”, mở một hộp thoại ngắn đặt kết quả lên hành trình ngay tại điểm thực sự đi qua nó.',
  'help.ctx.trip-roadtrip.bullet.6':
    '“Cài đặt lái xe” bên dưới chứa các giới hạn, chiếc xe và quãng đường của nó, giờ di chuyển hằng ngày, những gì cần tránh và cách vẽ đường tuyến. Chúng thuộc về chuyến đi, nên mọi người cùng lên kế hoạch với một chiếc xe.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Đọc chuyến đi như một chuyến lái xe',
  'help.guide.roadtrip-mode.goal':
    'Chuyển kế hoạch sang chế độ chuyến đi đường bộ và đọc những gì dải hành trình cho biết.',
  'help.guide.roadtrip-mode.step.1':
    'Nhấp “Chuyến đi đường bộ” trên nút chuyển “Ngày” và “Chuyến đi đường bộ” ở đầu cột bên trái. Kế hoạch theo ngày được thay bằng chuyến lái xe, và bản đồ vẽ mọi ngày đã có lộ trình.',
  'help.guide.roadtrip-mode.step.2':
    'Đầu dải hành trình cộng cả chuyến đi: “Quãng đường”, “Thời gian lái xe” và “Điểm dừng”.',
  'help.guide.roadtrip-mode.step.3':
    'Bên dưới là một thẻ cho mỗi ngày có lái xe; ngày không có gì để lái thì bị bỏ ra. Phần đầu thẻ mang số thứ tự và ngày tháng, quãng lái xe theo quãng đường và thời gian, và ngày đó dành cho mấy điểm dừng.',
  'help.guide.roadtrip-mode.step.4':
    'Trong thẻ, một ngày là một chuỗi: mỗi địa điểm một điểm dừng có số, giữa mỗi cặp là một dải lái xe, và giờ đến ở mép phải.',
  'help.guide.roadtrip-mode.step.5':
    'Nhấp vào phần đầu của một ngày để thu gọn nó. Ngày đã thu gọn cũng biến khỏi bản đồ; nhấp lại vào phần đầu để đưa nó trở lại.',
  'help.guide.roadtrip-mode.result':
    'Cột bên trái là chuyến lái xe và bản đồ hiện mọi ngày của nó. “Ngày” đưa thẳng về kế hoạch, không thay đổi gì.',
  'help.guide.roadtrip-mode.tip.1':
    'Lựa chọn này được nhớ cho từng chuyến đi chừng nào thẻ trình duyệt còn mở, nên tải lại trang vẫn quay về chuyến lái xe.',
  'help.guide.roadtrip-mode.tip.2':
    'Nút chuyển chỉ có sau khi quản trị viên bật tiện ích “Chuyến đi đường bộ” trong “Tiện ích bổ sung” ở “Sự quản lý”.',
  'help.guide.roadtrip-mode.tip.3':
    'Trên điện thoại không có nút chuyển: tiện ích thêm một thẻ “Chuyến đi đường bộ” riêng bên cạnh “Kế hoạch”.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Điểm dừng dọc đường, và bạn dừng bao lâu',
  'help.guide.roadtrip-stops.goal':
    'Biến một địa điểm trên hành trình thành điểm dừng dọc đường, và nói mỗi điểm dừng mất bao lâu.',
  'help.guide.roadtrip-stops.step.1':
    'Nhấp vào con số phía trước một điểm dừng trên dải hành trình. Nhãn của nó là “Biến thành điểm dừng dọc đường”, và nó mở các loại điểm dừng dưới dạng một hàng đĩa tròn nhiều màu bên dưới.',
  'help.guide.roadtrip-stops.step.2':
    'Chọn một loại; mỗi đĩa hiện tên khi bạn trỏ vào: “Chỗ ở”, “Xăng dầu”, “Sạc điện”, “Trạm dừng nghỉ”, “Khu cắm trại”, “Đồ ăn” hoặc “Điểm tham quan”. Con số biến thành biểu tượng của loại đó và các điểm dừng bên dưới được đánh số lại.',
  'help.guide.roadtrip-stops.step.3':
    'Điểm dừng dọc đường không phải điểm đến, nên phần đầu của ngày đếm ít đi một điểm dừng.',
  'help.guide.roadtrip-stops.step.4':
    'Nhấp lại vào biểu tượng, “Đổi loại điểm dừng”, rồi chọn “Trở lại là điểm đến” để trả lại con số cho điểm dừng.',
  'help.guide.roadtrip-stops.step.5':
    'Mọi điểm dừng đều mang huy hiệu “Dừng”. Nhấp vào đó để mở “Thời gian tại điểm dừng”.',
  'help.guide.roadtrip-stops.step.6':
    'Đặt độ dài bằng thanh trượt, bằng nút trừ và nút cộng, hoặc bằng một trong các mức có sẵn, xem “Rời đi” dịch chuyển trong khi “Đến nơi” giữ nguyên ở giờ hành trình tới nơi, rồi nhấp “Lưu”.',
  'help.guide.roadtrip-stops.result':
    'Điểm dừng bạn vừa định giờ mang độ dài mới trên phù hiệu “Dừng” của nó và mọi giờ đến sau nó đều đã xê dịch theo, còn điểm bạn đưa sang một loại rồi đưa về lại là một đích đến có số thứ tự.',
  'help.guide.roadtrip-stops.tip.1':
    'Thời gian dừng thuộc về địa điểm chứ không thuộc về một lần ghé: một địa điểm được xếp vào hai ngày thì cả hai ngày đều dừng lại bấy nhiêu lâu.',
  'help.guide.roadtrip-stops.tip.2':
    'Điểm dừng dọc đường cũng hiện trong “Ngày”. Tắt “Hiển thị cả trong Ngày”, nằm dưới “Điểm dừng dịch vụ” trong “Cài đặt lái xe”, thì chúng chỉ còn trong “Chuyến đi đường bộ”.',
  'help.guide.roadtrip-stops.tip.3': '“Không dừng lại”, trong cùng hộp thoại đó, lại bỏ khoảng thời gian ấy đi.',
  'help.guide.roadtrip-stops.tip.4':
    'Nhấp một điểm dừng dọc đường hoặc một đêm đã đặt để mở thẻ của nó trên bản đồ. Khi “Chuyến đi đường bộ” đang bật, “Chỉnh sửa” ở đó mở hộp thoại gọn mà tìm kiếm dùng thay cho biểu mẫu địa điểm, và “Thêm chi tiết” trong hộp thoại đó mở biểu mẫu đầy đủ.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Tìm xăng, đồ ăn và chỗ ngủ dọc theo lộ trình',
  'help.guide.roadtrip-corridor.goal': 'Tìm trên con đường bạn thực sự chạy qua, và đặt thứ tìm được vào đúng chặng.',
  'help.guide.roadtrip-corridor.step.1':
    'Dưới “Đang tìm”, mở danh sách và tích thứ bạn cần. “Xăng dầu”, “Sạc điện”, “Trạm dừng nghỉ”, “Khu cắm trại”, “Chỗ ở”, “Đồ ăn” và “Điểm tham quan” có thể kết hợp: danh sách vẫn mở để chọn thêm, và dòng đó sau đó hiện mỗi loại bằng biểu tượng của nó.',
  'help.guide.roadtrip-corridor.step.2':
    'Chọn ngày trong danh sách thả xuống ở cuối cùng dòng đó. Nó đưa ra những ngày mà dải hành trình có thẻ, và “Tìm kiếm” chờ cho đến khi ngày bạn chọn đã có lộ trình.',
  'help.guide.roadtrip-corridor.step.3':
    'Dưới “Trong vòng”, chọn tìm xa bao nhiêu về mỗi bên đường, 2 km, 5 km hay 10 km, rồi nhấp “Tìm kiếm”.',
  'help.guide.roadtrip-corridor.step.4':
    'Kết quả trở về được nhóm theo loại, theo thứ tự bạn đi qua, mỗi kết quả kèm theo nó nằm ở đoạn nào của ngày và cách lộ trình bao xa.',
  'help.guide.roadtrip-corridor.step.5':
    'Dấu cộng trên một kết quả, “Thêm”, mở “Thêm làm điểm dừng”. Nó cho biết điểm dừng rơi vào ngày nào và vị trí thứ mấy, và hỏi “Loại điểm dừng” cùng “Thời gian tại điểm dừng”. “Thêm” đặt nó lên hành trình; “Thêm chi tiết” mở biểu mẫu địa điểm đầy đủ thay vào đó. Một kết quả chỗ ở mang một chiếc giường thay cho dấu cộng, “Thêm làm nơi nghỉ đêm”, và hộp thoại của nó đưa ra “Nghỉ” hoặc “Qua đêm”; một đêm chỉ hỏi “Nhận phòng” của nó.',
  'help.guide.roadtrip-corridor.result':
    'Điểm dừng bạn đã thêm nằm trên hành trình ngay tại điểm thực sự đi qua nó, với biểu tượng loại của nó. Ngày đó được định tuyến lại qua điểm dừng, việc này làm trống danh sách: hãy tìm lại cho điểm tiếp theo.',
  'help.guide.roadtrip-corridor.tip.1':
    'Không có gì được tìm cho tới khi bạn nhấn “Tìm kiếm”: một lượt chạy là rất nhiều yêu cầu gửi tới một dịch vụ dùng chung.',
  'help.guide.roadtrip-corridor.tip.2':
    '“Lọc theo tên” thu hẹp những gì đã trở về mà không hỏi lại, còn “Xóa kết quả” dọn sạch danh sách và các ghim của nó. Nhấp một kết quả để đưa nó vào khung nhìn trên bản đồ.',
  'help.guide.roadtrip-corridor.tip.3':
    'Một kết quả cũng có thể được kéo từ bản đồ lên lộ trình đã vẽ, đó là cách bạn tự chọn chặng ở nơi cùng một con đường được chạy qua hai lần. “Thủ công”, bên cạnh “Tìm kiếm”, thêm một điểm mà tìm kiếm không tìm thấy bằng cách tra một địa điểm theo tên.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Bẻ một chặng qua điểm trung gian',
  'help.guide.roadtrip-via.goal':
    'Đưa một chặng đi theo con đường bạn thực sự muốn, mà không thêm điểm dừng nào vào đó.',
  'help.guide.roadtrip-via.step.1':
    'Đưa chặng bạn muốn vào khung nhìn: nhấp một điểm dừng trên dải hành trình, rồi đóng thẻ mở ra trên bản đồ.',
  'help.guide.roadtrip-via.step.2':
    'Nhấp vào lộ trình đã vẽ. Một điểm trung gian được thả xuống chặng bạn vừa nhấp, và chặng đó được định tuyến lại qua nó.',
  'help.guide.roadtrip-via.step.3':
    'Dải hành trình đi theo: phần đầu của ngày mang quãng đường và thời gian lái xe mới, và mọi giờ đến sau điểm trung gian đều dịch theo.',
  'help.guide.roadtrip-via.step.4':
    'Rê chuột lên tay nắm và nó nói nó làm được gì: “Kéo để định hình lại lộ trình, chuột phải để xóa”. Kéo nó sang chỗ khác thì chặng được vẽ lại qua chỗ mới.',
  'help.guide.roadtrip-via.step.5': 'Nhấp chuột phải lên tay nắm để bỏ nó đi. Chặng lại chạy đường thẳng nhất.',
  'help.guide.roadtrip-via.result':
    'Chặng đi theo con đường bạn đã chọn, và quãng đường, thời gian lái xe cùng các giờ đến của ngày được tính lại cho nó.',
  'help.guide.roadtrip-via.tip.1':
    'Điểm trung gian không phải điểm dừng: nó không có số, không có thời gian dừng và không có giờ đến, và không được tính vào số điểm dừng của ngày.',
  'help.guide.roadtrip-via.tip.2':
    'Các tay nắm chỉ được vẽ từ mức thu phóng 9 trở lên, nên bản đồ vừa khít cả chuyến đi chỉ hiện đường tuyến mà không có chúng.',
  'help.guide.roadtrip-via.tip.3':
    'Cú nhấp cách mọi chặng đã vẽ hơn hai ki lô mét sẽ bị bỏ qua, và cú nhấp lên một chuyến bay, một chuyến tàu hỏa hay một chuyến phà cũng vậy.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Thử một cách khác để chạy một chặng',
  'help.guide.roadtrip-alternatives.goal': 'Xem bộ định tuyến còn đưa ra gì cho một đoạn, rồi chọn lấy.',
  'help.guide.roadtrip-alternatives.step.1':
    'Nhấp một dải lái xe trên dải hành trình, là hàng giữa hai điểm dừng cho biết chặng đó dài bao nhiêu và mất bao lâu. Nhãn của nó là “Lộ trình khác”.',
  'help.guide.roadtrip-alternatives.step.2':
    '“Các lộ trình cho chặng này” mở ra trên bản đồ, mỗi con đường một mục kèm chiều dài của nó. Bản đồ vẽ mỗi con đường kèm thời gian lái xe: con đường bạn đang đi màu xanh dương đậm, những con đường khác màu xanh dương nhạt hơn.',
  'help.guide.roadtrip-alternatives.step.3':
    'Rê chuột lên một mục để làm sáng con đường đó. “Hiện tại” là con đường đang đi và “Nhanh nhất” là con đường nhanh nhất; các mục khác cho biết chúng chậm hơn bao nhiêu, hoặc chúng bỏ qua loại đường nào.',
  'help.guide.roadtrip-alternatives.step.4': 'Nhấp một mục để chạy đường đó, hoặc “Đóng” để giữ con đường đang đi.',
  'help.guide.roadtrip-alternatives.result':
    'Chặng chạy con đường bạn đã chọn, và quãng đường trên dải hành trình cùng các giờ đến sau đó cũng đổi theo.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Chọn một con đường khác trước hết sẽ kiểm tra nó bằng bộ định tuyến của chuyến đi đường bộ, rồi giữ chặng trên con đường đó với càng ít điểm trung gian càng tốt, thay thế những điểm chặng đã có. Một con đường mà bộ định tuyến không chịu đi theo sẽ không được lưu. Chọn chính con đường của bộ định tuyến thì các điểm trung gian lại bị bỏ đi.',
  'help.guide.roadtrip-alternatives.tip.2':
    '“Không đi cao tốc”, “Không thu phí” và “Không phà” đến từ một bộ máy thứ hai với mô hình tốc độ riêng, nên thời gian của chúng không so sánh được với những mục còn lại.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Đặt chiếc xe và các giới hạn lái xe',
  'help.guide.roadtrip-limits.goal': 'Cho TREK biết bạn lái xe gì và bạn sẵn lòng lái bao lâu trong một lần.',
  'help.guide.roadtrip-limits.step.1':
    '“Cài đặt lái xe” nằm dưới ô tìm kiếm ở cột bên phải. Các huy hiệu của nó cho biết những gì đã đặt; nhấp vào để mở.',
  'help.guide.roadtrip-limits.step.2':
    'Dưới “Lái xe”, “Chặng lái dài nhất” và “Lái xe mỗi ngày” tính bằng phút. Ô trống nghĩa là “tắt”, và không có gì bị đánh dấu.',
  'help.guide.roadtrip-limits.step.3':
    'Dưới “Phương tiện”, hãy nói bạn lái xe gì. “Xăng” chỉ tiếp nhiên liệu ở điểm dừng xăng dầu, “Điện” chỉ ở điểm dừng sạc, “Cả hai” thì ở cả hai.',
  'help.guide.roadtrip-limits.step.4':
    'Tự gõ “Quãng đường mỗi bình”, hoặc “Quãng đường mỗi lần sạc”. “Tính từ thông số xe” ở phía dưới lấy “Dung tích bình” và “Mức tiêu thụ”, hoặc “Pin”, “Mức tiêu thụ” và “Chai pin”, rồi tính hộ bạn.',
  'help.guide.roadtrip-limits.step.5':
    '“Tránh nếu có thể” là một ưu tiên, không phải lệnh cấm: ngày nào không có đường vòng thì vẫn đi qua con đường đó, và nói vậy ngay ở phần đầu của ngày.',
  'help.guide.roadtrip-limits.step.6':
    'Đóng hộp thoại. Thẻ cho biết những gì đã đặt, và dải hành trình đánh dấu mọi chặng và mọi ngày vượt quá giới hạn.',
  'help.guide.roadtrip-limits.result':
    'Các huy hiệu trên thẻ cho biết những gì đã đặt, và mọi chặng và ngày vượt giới hạn đều mang một huy hiệu trên dải hành trình.',
  'help.guide.roadtrip-limits.tip.1':
    'Các cài đặt thuộc về chuyến đi, nên mọi người trong chuyến đều lên kế hoạch với cùng một chiếc xe và cùng những giới hạn.',
  'help.guide.roadtrip-limits.tip.2':
    '“Đổ đến” cho biết một điểm dừng đổ đầy tới đâu, vì trên đường không ai sạc đến 100 %. Một điểm dừng xăng dầu hoặc sạc điện có thể tự đặt khác cho riêng nó.',
  'help.guide.roadtrip-limits.tip.3':
    'Dưới “Đường tuyến”, “Nối các ngày” còn định tuyến cả đoạn lái từ điểm dừng cuối của một ngày tới điểm dừng đầu của ngày kế tiếp, “Bắt đầu và kết thúc mỗi ngày tại nơi lưu trú” cho một ngày bắt đầu và kết thúc tại những đêm đã đặt quanh nó, và “Mỗi ngày một màu” vẽ mỗi ngày bằng một màu riêng.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Cho ngày lái xe một giờ bắt đầu và một giờ kết thúc',
  'help.guide.roadtrip-day-window.goal': 'Dừng lái vào giờ bạn chọn, và nói ngày nên kết thúc ở đâu.',
  'help.guide.roadtrip-day-window.step.1': 'Mở “Cài đặt lái xe” ở cột bên phải và tìm “Giờ di chuyển hằng ngày”.',
  'help.guide.roadtrip-day-window.step.2':
    'Đặt “Giờ bắt đầu ngày”. Một mình nó không làm gì cả: cần cả hai giờ, như ghi chú bên dưới đã nói.',
  'help.guide.roadtrip-day-window.step.3':
    'Đặt “Giờ kết thúc ngày”. Hành trình giờ dừng ở giờ đó và mang phần còn lại sang sáng hôm sau, dưới dạng một hàng “Kết thúc ngày” và một hàng “Tiếp tục hành trình” trên dải hành trình.',
  'help.guide.roadtrip-day-window.step.4':
    'Dưới “Kết thúc ngày”, chọn “Trên tuyến đường” để tạm dừng trên đường vào giờ kết thúc, hoặc “Tại địa điểm cuối” để dừng trước khi chặng lái tiếp theo đi quá nó.',
  'help.guide.roadtrip-day-window.step.5': 'Đóng hộp thoại. Thẻ “Cài đặt lái xe” mang hai giờ đó như một huy hiệu.',
  'help.guide.roadtrip-day-window.result':
    'Hành trình được cắt thành những ngày đi đường dài đúng như bạn đặt, và phần không vừa sẽ tiếp tục trên các ngày được tính thêm sau ngày cuối. Các ngày của bạn và địa điểm trong đó không bị đổi.',
  'help.guide.roadtrip-day-window.tip.1':
    'Xóa một trong hai giờ sẽ tắt toàn bộ. Những giờ bạn tự ghim trên một điểm dừng luôn được ưu tiên.',
  'help.guide.roadtrip-day-window.tip.2':
    'Khi đã đặt giờ di chuyển hằng ngày, các ngày luôn được nối: quãng lái từ điểm dừng cuối của một ngày tới điểm dừng đầu của ngày kế cũng được định tuyến và tính vào.',
  'help.guide.roadtrip-day-window.tip.3':
    'Mỗi điểm kết thúc ngày cũng là một dấu trên bản đồ, một mặt trăng kèm số ngày. Kéo nó dọc lộ trình, hoặc lên một địa điểm, để kết thúc ngày ở chỗ khác; nhấp chuột phải để trả lại điểm kết thúc tự động, còn “Khôi phục kết thúc ngày tự động” trong hộp thoại này hoàn tác tất cả.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Đổ nhiên liệu trước khi hết bình',
  'help.guide.roadtrip-refuel.goal': 'Tìm chỗ tiếp nhiên liệu trên đoạn xe còn tới được, và đặt nó lên hành trình.',
  'help.guide.roadtrip-refuel.step.1':
    'Khi đã đặt quãng đường, dải hành trình vẽ một dải ngang chặng ở chỗ hết nhiên liệu: “Hết xăng ở đây”, hoặc “Pin hết ở đây” với xe điện, và bên dưới là chỗ đó nằm sâu bao nhiêu trong chặng.',
  'help.guide.roadtrip-refuel.step.2':
    'Ngọn đèn trên dải đó chính là nút bấm: “Tìm trạm xăng”, hoặc “Tìm trạm sạc” với xe điện. Nó tìm dọc con đường trước điểm đó và hiện “Đang tìm dọc tuyến đường…” trong khi tìm.',
  'help.guide.roadtrip-refuel.step.3':
    'Tối đa ba trạm trở về, mỗi trạm kèm theo nó cách lộ trình bao xa và sẽ còn dư bao nhiêu quãng đường.',
  'help.guide.roadtrip-refuel.step.4':
    'Dấu cộng trên một đề xuất sẽ thêm nó làm điểm đổ xăng. “Thêm làm điểm dừng” mở ra với loại và thời gian đã điền sẵn, và “Thêm” đặt nó lên chặng ngay tại điểm thực sự đi qua.',
  'help.guide.roadtrip-refuel.result':
    'Điểm dừng nằm trên đúng chặng với biểu tượng riêng, và quãng đường được tính lại từ đó: dải kia dời tới chỗ giờ đây sẽ hết nhiên liệu, hoặc biến mất khi phần còn lại của hành trình đã nằm trong tầm với.',
  'help.guide.roadtrip-refuel.tip.1':
    'Quãng đường được tính từ điểm dừng xăng dầu hoặc sạc điện gần nhất, xuyên qua các ngày. Bạn lái xe gì sẽ quyết định điểm dừng nào được tính: “Xăng” chỉ tính xăng dầu, “Điện” chỉ tính sạc điện.',
  'help.guide.roadtrip-refuel.tip.2':
    'Việc tìm kiếm nhìn vào con đường trước điểm cạn nhiên liệu, chừa lại một phần dự trữ và tính quãng đi vòng hai lần, nên mọi thứ nó đưa ra đều thực sự tới được.',
  'help.guide.roadtrip-refuel.tip.3':
    'Một câu trả lời rỗng không phải ngõ cụt: ngọn đèn đổi thành “Thử lại”, vì tìm kiếm địa điểm là một dịch vụ dùng chung và đôi khi hết thời gian chờ.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Cho một ngày đi theo tuyến đã nhập',
  'help.guide.roadtrip-track.goal':
    'Đặt hành trình của một ngày lên một cung đường đẹp mà bạn đã nhập vào dưới dạng tuyến GPX hoặc KML.',
  'help.guide.roadtrip-track.step.1': 'Nhấp huy hiệu “Tuyến” ở phần đầu của một ngày. Hộp thoại mở ra ở ngày đó.',
  'help.guide.roadtrip-track.step.2':
    'Chọn một tuyến. Mỗi tuyến cho biết nó dài bao nhiêu và nó chạy dọc theo ngày này hay nằm cách bao xa, gần nhất đứng trước.',
  'help.guide.roadtrip-track.step.3':
    'Nhấp “Đi theo tuyến này”. TREK thả các điểm trung gian ở nơi hành trình lệch xa tuyến nhất, rồi định tuyến lại, vòng này qua vòng khác.',
  'help.guide.roadtrip-track.step.4':
    'Hộp thoại cho biết đã đặt bao nhiêu điểm trung gian và giờ hành trình bám tuyến sát đến đâu, hoặc rằng hành trình vốn đã đi theo tuyến. Khi có điểm trung gian được đặt, nút bên dưới sẽ bỏ chúng đi và trả ngày về cho bộ định tuyến; đóng hộp thoại thì giữ nguyên tuyến.',
  'help.guide.roadtrip-track.result':
    'Hành trình của ngày đi theo tuyến thay vì con đường mà bộ định tuyến lẽ ra đã chọn, và trỏ vào huy hiệu “Tuyến” của nó sẽ thấy tên tuyến. Khi có điểm trung gian giữ hành trình trên tuyến, huy hiệu cũng sáng lên.',
  'help.guide.roadtrip-track.tip.1':
    'Nhập tệp trong “Ngày”: ở cột địa điểm, “Nhập tập tin” sau nút nhập, có tích “Tuyến đường” hoặc “Đường đi (có hình dạng đường dẫn)” với tệp GPX, hoặc “Đường dẫn (LineStrings)” với tệp KML. Chừng nào chuyến đi chưa có tuyến nào thì không ngày nào mang huy hiệu này.',
  'help.guide.roadtrip-track.tip.2':
    'Đi theo một tuyến sẽ thay thế các điểm trung gian mà các chặng của ngày đã có, nên hãy nắn một chặng bằng tay sau khi theo tuyến, đừng làm trước.',
};

export default help;
