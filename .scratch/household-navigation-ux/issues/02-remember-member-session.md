# 02: Ghi nhớ Thành viên khi F5 và mở lại

**What to build:** Sau khi chọn người, F5/mở lại vào Kế hoạch bằng Thành viên đã được kiểm tra với database; link tham gia và nhiều tab dùng đúng lựa chọn đã chốt.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Lưu và khôi phục Gia đình + định danh Thành viên qua hợp đồng storage hiện có; thông tin từ bản chỉ nhớ Mã nhà vẫn dùng được, còn Biệt danh cục bộ không dùng để tự chọn người.
- [ ] Có trạng thái tải trước khi mở nội dung; Thành viên hợp lệ được khôi phục, người đã xóa dẫn về chọn với thông báo, lỗi tải giữ lựa chọn và có Thử lại cùng lối về chọn Gia đình.
- [ ] Mô hình lưu hỗ trợ chọn Gia đình, chọn Thành viên và đã chọn người. Tạo/tham gia, chọn người và thao tác đổi Gia đình hiện có cập nhật đúng trạng thái; F5 khi đang ở các bước này không quay vào người cũ.
- [ ] Các tab đang chạy giữ riêng lựa chọn, tab mới/F5 lấy trạng thái gần nhất; tab cũ trở lại từ nền hoặc request đến muộn không tự ghi đè trạng thái mới hơn.
- [ ] Link khác Gia đình mở chọn người, link cùng Gia đình giữ lựa chọn hợp lệ; xử lý chỉ thị tham gia một lần và bảo toàn các phần URL khác.
- [ ] Kiểm thử App qua storage/repository được truyền vào cho khôi phục, xóa người, lỗi/retry, chuyển mã và phản hồi đến muộn; có kiểm tra trình duyệt cho F5/tab mới/PWA theo phạm vi đã chốt.
