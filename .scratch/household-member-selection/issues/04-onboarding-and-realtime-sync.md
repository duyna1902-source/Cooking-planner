# 04: Onboarding Integration & Realtime Multi-Device Sync

**What to build:**
Kết nối tính năng chọn Thành viên vào luồng Khởi tạo gia đình ban đầu (Onboarding) và kích hoạt tính năng Đồng bộ Thời Gian Thực (Realtime Sync) đa thiết bị. Khi một người dùng mới bấm "Tạo Nhà Mới", họ nhập tên Thành viên sáng lập đầu tiên và hệ thống tự động lưu Thành viên này vào Database để làm dữ liệu khởi đầu cho gia đình. Khi tham gia một gia đình cũ (bằng cách nhập Mã nhà hoặc bấm vào link chia sẻ `?join=BEP-XXX`), hệ thống chuyển ngay sang màn hình chọn Thành viên đã có của gia đình đó. Khi đang ở màn hình chọn Thành viên trên một thiết bị, nếu một thiết bị khác thêm, sửa hoặc xóa Thành viên thì danh sách sẽ tự động cập nhật ngay lập tức qua kênh WebSocket của Supabase Realtime mà không cần bấm F5.

**Blocked by:** 03: Member Management Mode (Edit & Delete with Safety Constraints)

**Status:** claimed

- [x] Cập nhật luồng "Tạo Nhà Mới" trong `OnboardingModal`: Người dùng xem mã nhà mới sinh và nhập tên Thành viên đầu tiên của họ.
- [x] Khi hoàn tất tạo nhà, tự động lưu Thành viên sáng lập đầu tiên vào `MemberRepository` với biểu tượng mặc định (`🍳` Chảo ốp la).
- [x] Sau khi tạo nhà, người tạo được tự động chọn làm Thành viên đang hoạt động và chuyển thẳng vào màn hình Kế hoạch. Lần sau mở lại web sẽ thấy Thành viên đó trên màn hình chọn.
- [x] Cập nhật luồng "Tham Gia Bằng Mã" và Link tham gia (`?join=...`): Sau khi nhập mã nhà hợp lệ hoặc click link chia sẻ, hệ thống lưu `household_code` và chuyển ngay sang màn hình chọn Thành viên của nhà đó (thay vì bắt nhập Biệt danh đơn lẻ như trước). Nếu chưa có tên mình trong danh sách, người mới có thể bấm "➕ Thêm thành viên mới".
- [x] Triển khai phương thức `subscribe` trong `SupabaseMemberRepository` lắng nghe các sự kiện `INSERT`, `UPDATE`, `DELETE` trên bảng `members` theo `household_code`.
- [x] Khi có sự kiện Realtime thay đổi danh sách Thành viên, giao diện màn hình chọn Thành viên tự động làm mới danh sách tức thì mà không cần reload trang web.
- [x] Kiểm thử tích hợp bao phủ toàn diện: Tạo nhà mới với thành viên đầu tiên, tham gia nhà cũ qua mã/link và sự kiện đồng bộ Realtime đa thiết bị.
