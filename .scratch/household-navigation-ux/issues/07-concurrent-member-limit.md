# 07: Giới hạn 6 Thành viên khi nhiều thiết bị cùng thêm

**What to build:** Hai thiết bị cùng thêm khi Gia đình có 5 người thì chỉ một lượt thành công; lượt còn lại thấy thông báo đầy và danh sách đã xác nhận.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Thay đổi database bảo đảm kiểm tra giới hạn và thêm không thể cùng vượt qua dưới cạnh tranh; giữ chặn sớm trên form.
- [ ] Lỗi đầy đi qua hợp đồng repository và hiện đúng thông báo trên form; không bị nhầm với tên không hợp lệ hoặc lỗi kết nối.
- [ ] Thiết bị thêm thất bại cập nhật danh sách, không báo thành công giả hoặc chèn người cục bộ chưa xác nhận.
- [ ] Migration và schema khởi tạo giữ dữ liệu cũ hơn 6, vẫn đọc/xóa được và không ảnh hưởng dữ liệu Gia đình khác hoặc bình luận.
- [ ] Có kiểm tra database thật với hai request đồng thời, đọc kết quả đã commit, cùng kiểm thử adapter và App cho phản hồi người dùng. Mock hoặc khóa nút client không đủ để nghiệm thu cạnh tranh.
