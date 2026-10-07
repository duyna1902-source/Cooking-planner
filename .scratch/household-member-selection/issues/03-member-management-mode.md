# 03: Member Management Mode (Edit & Delete with Safety Constraints)

**What to build:**
Cung cấp chế độ Quản lý Thành viên trực tiếp trên màn hình chọn Thành viên thông qua nút "Chỉnh sửa" ở góc trên bên phải. Khi bật chế độ này, các thẻ Thành viên có hiệu ứng rung nhẹ (wiggle) cùng nút xóa và nút chỉnh sửa. Người dùng có thể chạm vào thẻ để mở Bottom Drawer chỉnh sửa tên và biểu tượng đại diện. Người dùng có thể xóa một Thành viên khỏi danh sách với hộp thoại xác nhận. Áp dụng nghiêm ngặt các quy tắc bảo toàn dữ liệu: không cho phép xóa Thành viên cuối cùng trong gia đình, và khi xóa một Thành viên thì các bình luận/dặn dò cũ của họ trong Kế hoạch vẫn được giữ nguyên tên tác giả.

**Blocked by:** 02: Add New Member via Bottom Drawer

**Status:** ready-for-agent

- [ ] Hiển thị nút bấm "Chỉnh sửa" nhỏ gọn ở góc trên bên phải thanh tiêu đề màn hình chọn Thành viên.
- [ ] Bấm vào nút chuyển đổi trạng thái giao diện sang Chế độ Quản lý (`isManageMode`), nút đổi thành "Xong" với màu sắc nhấn rõ ràng.
- [ ] Trong Chế độ Quản lý, các thẻ Thành viên hiển thị biểu tượng xóa (dấu ✕ hoặc nút xóa màu đỏ ở góc thẻ) và hiệu ứng rung nhẹ (`animate-wiggle`).
- [ ] Bấm vào thẻ trong Chế độ Quản lý sẽ mở Bottom Drawer với tiêu đề "Chỉnh Sửa Thành Viên", nạp sẵn tên và biểu tượng hiện tại của Thành viên đó để người dùng cập nhật.
- [ ] Khi sửa tên, tiếp tục kiểm tra không được để trống và không được trùng với các Thành viên khác trong cùng gia đình; bấm "Lưu thay đổi" sẽ gọi `updateMember` và cập nhật dữ liệu.
- [ ] Bấm nút xóa trên thẻ sẽ hiển thị hộp thoại xác nhận (Confirm Dialog) ghi rõ tên Thành viên cần xóa.
- [ ] Ràng buộc an toàn 1: Nếu gia đình chỉ còn duy nhất 1 Thành viên, hệ thống từ chối xóa và hiển thị thông báo rõ ràng rằng gia đình phải có ít nhất 1 thành viên.
- [ ] Ràng buộc an toàn 2: Khi xóa một Thành viên, chỉ xóa bản ghi trong bảng `members`. Tất cả các bình luận dặn dò (`plan_comments`) do người đó tạo trước đây trong Kế hoạch vẫn giữ nguyên tên tác giả (`author_nickname`).
- [ ] Bộ kiểm thử tự động (Unit & Integration tests) bao phủ trọn vẹn việc bật/tắt quản lý, chỉnh sửa tên/icon, xóa thành viên, chặn xóa thành viên cuối cùng và kiểm tra giữ nguyên bình luận cũ.
