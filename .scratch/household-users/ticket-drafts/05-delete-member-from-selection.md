# 05: Xóa Thành viên ở góc màn hình chọn

Type: task
Status: draft
Blocked by: 04

**Parent:** [01 — Chọn Thành viên và lưu danh sách theo Gia đình](../issues/01-member-selection-screen.md).

**What to build:** Người dùng bật chế độ xóa từ nút góc trên bên phải, xác nhận đúng tên rồi gỡ Thành viên khỏi database. Xóa không ảnh hưởng nội dung chung hoặc bình luận cũ; xóa hết vẫn có thể thêm người rồi chọn để sử dụng.

**Blocked by:** 04 — Thêm Thành viên và lưu danh sách qua các lần mở.

**Trạng thái bản nháp:** Chờ duyệt cách chia; chưa xuất bản ticket triển khai.

- [ ] Nút Xóa ở góc trên bên phải bật chế độ xóa, hiện thùng rác trên các ô và đổi thành Xong. Bấm ô trong chế độ này mở xác nhận, không vào Kế hoạch.
- [ ] Xác nhận hiển thị đúng tên với Giữ lại và Xóa thành viên. Hủy giữ nguyên danh sách; Xong thoát chế độ và khôi phục bấm chọn.
- [ ] Bổ sung migration quyền/policy DELETE và schema khởi tạo cho public.member theo mô hình Mã nhà hiện có. Repository xóa lọc cả Mã nhà và ID; không xóa dây chuyền Menu/Kế hoạch/bình luận.
- [ ] Chỉ gỡ bản ghi sau database xác nhận. Chặn yêu cầu xóa lặp, lỗi giữ người trong danh sách và cho thử lại; phản hồi cũ không làm thay đổi Gia đình hiện tại.
- [ ] Có thể xóa người cuối: giữ Mã nhà, về trạng thái trống, thoát chế độ xóa, vô hiệu hóa nút xóa và tiếp tục thêm bằng luồng 04; thêm xong vẫn phải chọn.
- [ ] Menu/Kế hoạch và bình luận cũ giữ nguyên sau xóa, gồm tên tác giả đã lưu. Không đổi bình luận cũ sang tham chiếu Thành viên.
- [ ] Có kiểm thử App cho xác nhận đúng người, hủy, Xong, không vào Kế hoạch trong chế độ xóa, lỗi/gửi lặp, xóa cuối rồi thêm lại; kiểm tra hợp đồng xóa theo Gia đình và ID.
- [ ] Dùng dữ liệu thử để kiểm tra quyền xóa và lưu thay đổi trên database thật; mở lại không còn người đã xóa. Xác minh nội dung dùng chung và tên bình luận không bị tác động.
- [ ] Browser kiểm tra vị trí nút, xác nhận trên mobile và xóa cuối rồi thêm/chọn. Regression liên quan, typecheck và build đạt.

## Scope notes

Chặn bởi 04 vì nghiệm thu phải chứng minh xóa người cuối rồi thêm lại qua giao diện. Đồng bộ việc xóa ở màn hình đang mở trên thiết bị khác thuộc 06.

Nguồn: [spec](../spec.md), [prototype A cập nhật](../prototype.md) và ADR-0006. Ưu tiên spec/ảnh A hiện tại hơn snapshot ba prototype ban đầu khi khác biệt. Kiểm thử hành vi bên ngoài qua App/repository; không kiểm thử state riêng tư hoặc prototype dùng một lần.
