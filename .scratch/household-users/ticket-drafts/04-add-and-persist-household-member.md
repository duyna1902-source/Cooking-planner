# 04: Thêm Thành viên và lưu danh sách qua các lần mở

Type: task
Status: draft
Blocked by: 02

**Parent:** [01 — Chọn Thành viên và lưu danh sách theo Gia đình](../issues/01-member-selection-screen.md).

**What to build:** Người dùng bấm + Thêm thành viên bên dưới danh sách, nhập tên và lưu vào database của Gia đình hiện tại. Lưu thành công trở lại danh sách chưa chọn; lần mở tiếp theo hoặc thiết bị khác tải lại thấy cả người cũ và mới.

**Blocked by:** 02 — Chọn Thành viên mỗi lần mở ứng dụng.

**Trạng thái bản nháp:** Chờ duyệt cách chia; chưa xuất bản ticket triển khai.

- [ ] Nút + Thêm thành viên nằm dưới danh sách, kể cả Gia đình trống. Ô tên bắt đầu trống mỗi lần mở, không lấy Biệt danh cũ; hủy không đổi danh sách.
- [ ] Tên trim dài 1–30 ký tự, giữ dấu tiếng Việt; từ chối tên rỗng/quá dài. Tên trùng cùng Gia đình khi bỏ qua hoa/thường và khoảng trắng đầu/cuối bị từ chối; Gia đình khác dùng cùng tên được phép.
- [ ] Repository thêm theo Mã nhà hiện tại vào public.member, giữ các ràng buộc database đã có và trả bản ghi được lưu. Database quyết định cuối cùng khi hai thiết bị thêm cùng tên.
- [ ] Chỉ báo thành công sau database xác nhận, đưa người mới cuối danh sách và vẫn cần bấm chọn để vào Kế hoạch. Không tự tạo mặc định hoặc tự chọn người mới.
- [ ] Trong lúc lưu chặn gửi lặp. Lỗi giữ tên đang nhập và cho thử lại; tên trùng từ database được giải thích rõ, không báo thành công hoặc chuyển sang lưu local.
- [ ] Phản hồi thêm đến muộn không đưa người thuộc Gia đình cũ vào danh sách hiện tại.
- [ ] Có kiểm thử App cho trạng thái trống, hủy, chuẩn hóa tên, ranh giới độ dài, tên trùng, lưu chậm/lỗi/gửi lặp và không tự chọn; kiểm thử hợp đồng adapter thêm.
- [ ] Kiểm tra database thật bằng dữ liệu thử: lưu, mở lại và tải từ phiên khác thấy đủ người; thêm đồng thời tên trùng chỉ tạo một bản ghi, cùng tên ở Gia đình khác được phép.
- [ ] Sau khi thêm người đầu tiên có thể chọn để vào Kế hoạch và gửi bình luận đúng tên. Regression liên quan, typecheck, build và kiểm tra browser mobile đạt.

## Scope notes

Ticket này bảo đảm lưu và tải lại dữ liệu, chưa cần tự cập nhật màn hình ở thiết bị đang mở. Đồng bộ trực tiếp thuộc 06.

Nguồn: [spec](../spec.md), [prototype A cập nhật](../prototype.md) và ADR-0006. Ưu tiên spec/ảnh A hiện tại hơn snapshot ba prototype ban đầu khi khác biệt. Kiểm thử hành vi bên ngoài qua App/repository; không kiểm thử state riêng tư hoặc prototype dùng một lần.
