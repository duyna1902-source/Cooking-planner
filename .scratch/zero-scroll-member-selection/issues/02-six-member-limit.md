# 02: Giới hạn tối đa 6 Thành viên và Chặn lưu ở Form

**What to build:** Giới hạn mỗi Gia đình có tối đa 6 Thành viên để bảo toàn công thái học chạm và bố cục không cuộn. Khi danh sách đã đủ 6 người, nút "+ Thêm thành viên" ở đáy được thay thế bằng thông báo trạng thái "Đã đạt tối đa 6 Thành viên trong Gia đình", ngăn mở dialog thêm. Trong dialog thêm Thành viên, nếu người dùng cố tình gửi lưu khi số lượng đã đạt 6 (ví dụ hai máy cùng mở form), hệ thống hiển thị cảnh báo lỗi "Gia đình đã có tối đa 6 Thành viên." và không lưu. Khi một Thành viên bị xóa đưa danh sách về dưới 6 người, nút "+ Thêm thành viên" tự động khôi phục lại.

**Blocked by:** 01: Bố cục cố định không cuộn (Zero-Scroll) và Lưới thích ứng 2–3 cột

**Status:** ready-for-agent

- [ ] Khi danh sách Thành viên đạt đủ 6 người, nút "+ Thêm thành viên" không còn xuất hiện, thay vào đó là dòng trạng thái "Đã đạt tối đa 6 Thành viên trong Gia đình".
- [ ] Khi danh sách có 6 người, không thể mở form thêm Thành viên từ giao diện.
- [ ] Trong form thêm Thành viên, hàm submit kiểm tra số lượng và chặn lưu kèm thông báo "Gia đình đã có tối đa 6 Thành viên." nếu số lượng >= 6.
- [ ] Khi xóa một Thành viên khiến số lượng giảm xuống còn 5 người hoặc ít hơn, nút "+ Thêm thành viên" tự động xuất hiện lại bình thường.
- [ ] Kiểm thử tích hợp bao phủ kịch bản đạt ngưỡng 6 người, chặn thêm người thứ 7 và phục hồi nút thêm sau khi xóa.
