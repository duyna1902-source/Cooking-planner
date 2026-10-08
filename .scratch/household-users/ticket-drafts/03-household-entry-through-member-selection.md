# 03: Tạo, tham gia và đổi Gia đình qua bước chọn Thành viên

Type: task
Status: draft
Blocked by: 02

**Parent:** [01 — Chọn Thành viên và lưu danh sách theo Gia đình](../issues/01-member-selection-screen.md).

**What to build:** Người dùng mới tạo hoặc tham gia Gia đình bằng Mã nhà, rồi chọn Thành viên thay vì nhập Biệt danh riêng. Link tham gia cũng mở danh sách Gia đình đích. Người đã vào Kế hoạch có thể đổi Gia đình và phải chọn lại người thuộc Gia đình mới.

**Blocked by:** 02 — Chọn Thành viên mỗi lần mở ứng dụng.

**Trạng thái bản nháp:** Chờ duyệt cách chia; chưa xuất bản ticket triển khai.

- [ ] Tạo Gia đình giữ cách sinh Mã nhà/chia sẻ link đang có và kết thúc ở màn hình chọn, không nhập Biệt danh và không tự tạo Thành viên. Gia đình chưa có người hiển thị trạng thái trống.
- [ ] Tham gia thủ công chuẩn hóa/kiểm tra Mã nhà theo quy tắc hiện có, ghi nhớ Gia đình và chuyển tới màn hình chọn của Gia đình đó.
- [ ] Link ?join=CODE ưu tiên Gia đình đích dù có Mã nhà/Biệt danh cũ; không tái sử dụng danh tính cũ. Hoàn tất tiếp nhận link theo quy tắc URL đang có.
- [ ] Đổi Gia đình chỉ có trong Kế hoạch sau khi chọn; không có trên Menu hoặc màn hình chọn Thành viên. Hoàn tất đổi xóa lựa chọn cũ và nội dung Gia đình cũ, đưa về màn hình chọn mới.
- [ ] Kết quả tải đến muộn của Gia đình cũ không thay thế danh sách Gia đình đích. Lỗi tải Gia đình mới giữ bước chọn và cho thử lại.
- [ ] Không tạo hoặc điền sẵn Thành viên từ Biệt danh cũ. Không thêm mật khẩu/PIN hoặc thay cơ chế xác minh Gia đình trong database.
- [ ] Có kiểm thử App qua tạo mới, tham gia thủ công, link tới Gia đình khác, vị trí nút đổi và kết quả tải đến muộn; dùng repository Thành viên ở ranh giới đã có.
- [ ] Browser chứng minh từng đường vào dẫn tới đúng danh sách, giữ Mã nhà khi mở lại và chưa mở nội dung chính trước chọn. Chia sẻ Mã nhà, regression liên quan, typecheck và build đạt.

## Scope notes

Chỉ mở rộng các đường xác định Gia đình tới luồng chọn đã có. Có thể nghiệm thu với dữ liệu thử sẵn hoặc Gia đình trống; không phụ thuộc việc thêm/xóa Thành viên qua giao diện.

Nguồn: [spec](../spec.md), [prototype A cập nhật](../prototype.md) và ADR-0006. Ưu tiên spec/ảnh A hiện tại hơn snapshot ba prototype ban đầu khi khác biệt. Kiểm thử hành vi bên ngoài qua App/repository; không kiểm thử state riêng tư hoặc prototype dùng một lần.
