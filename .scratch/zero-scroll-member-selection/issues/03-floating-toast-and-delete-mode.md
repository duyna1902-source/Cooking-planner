# 03: Thông báo Toast nổi không xô lệch chiều cao & Tối ưu chế độ Xóa

**What to build:** Nâng cấp thông báo phản hồi (sau khi thêm hoặc xóa Thành viên thành công) thành dạng Toast nổi phía trên nút đáy, có vai trò trợ năng `role="status"`, tự động biến mất sau 3 giây, hoàn toàn không đẩy xô lệch các nút bên dưới. Khi người dùng bật chế độ quản lý "Xóa", thanh nút "+ Thêm thành viên" (hoặc dòng thông báo đã đạt tối đa 6 người) được ẩn đi để người dùng tập trung vào tác vụ xóa; khi bấm "Xong" hoặc khi xóa hết thì tự động thoát chế độ xóa và hiển thị lại nút tương ứng.

**Blocked by:** 01: Bố cục cố định không cuộn (Zero-Scroll) và Lưới thích ứng 2–3 cột, 02: Giới hạn tối đa 6 Thành viên và Chặn lưu ở Form

**Status:** ready-for-agent

- [ ] Thông báo sau khi thêm hoặc xóa Thành viên hiển thị dạng Toast nổi (overlay) trên màn hình, không chiếm chiều cao của layout chính.
- [ ] Thông báo có thuộc tính `role="status"`, hiển thị icon dấu kiểm và nội dung thông báo rõ ràng, tự động mờ dần và biến mất sau 3 giây.
- [ ] Khi bật chế độ quản lý "Xóa" (bấm nút "Xóa" trên header), nút "+ Thêm thành viên" (hoặc thông báo đạt tối đa) được ẩn đi.
- [ ] Khi bấm "Xong" hoặc hủy chế độ xóa, nút "+ Thêm thành viên" (hoặc thông báo đạt tối đa) xuất hiện lại bình thường.
- [ ] Toàn bộ 149+ bài kiểm thử hiện có tiếp tục vượt qua 100%, không xảy ra bất kỳ lỗi hồi quy nào.
