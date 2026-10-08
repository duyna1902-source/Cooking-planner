# 02: Chọn Thành viên mỗi lần mở ứng dụng

Type: task
Status: draft
Blocked by: None (can start immediately)

**Parent:** [01 — Chọn Thành viên và lưu danh sách theo Gia đình](../issues/01-member-selection-screen.md).

**What to build:** Khi thiết bị đã nhớ Gia đình, mở ứng dụng sẽ tải danh sách Thành viên từ database và hiển thị Bạn là ai? theo bố cục A. Chọn một người mới vào Kế hoạch/Menu và dùng tên đó cho bình luận mới. Mọi lần tải lại, tab mới hoặc PWA khởi động lại đều hỏi chọn lại; phiên đang chạy giữ lựa chọn.

**Blocked by:** None (can start immediately).

**Trạng thái bản nháp:** Chờ duyệt cách chia; chưa xuất bản ticket triển khai.

- [ ] Mã nhà đã nhớ đủ để mở màn hình chọn; Biệt danh cục bộ cũ không được dùng để tự chọn hoặc tạo Thành viên. Chỉ Mã nhà được nhớ lâu dài, lựa chọn Thành viên ở bộ nhớ phiên.
- [ ] Danh sách từ public.member chỉ chứa Gia đình hiện tại, tăng dần theo thời điểm tạo và ID; giao diện A có chữ cái đầu, tên và Mã nhà, dùng được trên màn hình mobile và danh sách dài.
- [ ] Khi chưa chọn, đang tải, danh sách trống hoặc tải lỗi, Kế hoạch/Menu và điều hướng chính chưa được mount. Trống không tự tạo người; lỗi có Thử lại và khác trạng thái trống.
- [ ] Repository Thành viên được truyền vào cấp App theo mẫu hiện có, có adapter Supabase để đọc danh sách. Thiếu cấu hình hoặc lỗi cloud không chuyển sang danh sách local hay vượt bước chọn.
- [ ] Chọn bản ghi hiện có mở Kế hoạch; chuyển Menu/Kế hoạch giữ người. Không có nút hoặc luồng đổi Thành viên trong nội dung chính.
- [ ] Bình luận mới dùng tên Thành viên đang chọn; bình luận cũ giữ tên đã lưu. Các thao tác Menu/Kế hoạch đang có hoạt động sau khi chọn.
- [ ] Khởi tạo lại App với cùng storage vẫn hỏi chọn; hai instance chọn độc lập. Browser kiểm tra tải lại, tab mới, PWA khởi động lại và quay về phiên đang sống.
- [ ] Có kiểm thử App cho danh sách đúng Gia đình, chặn trước chọn, lỗi/thử lại, phiên độc lập và tác giả bình luận; kiểm thử adapter đọc dữ liệu. Dùng dữ liệu thử được xác định rõ để kiểm tra đọc Supabase thật; không tạo Thành viên mặc định.
- [ ] Cập nhật fixture các kiểm thử App chịu ảnh hưởng để chọn Thành viên rõ ràng. Regression liên quan, typecheck và build đạt; không đưa route, dữ liệu mẫu hoặc nút thử của prototype vào production.

## Scope notes

Luồng này dùng Gia đình đã nhớ và dữ liệu Thành viên thử có sẵn để nghiệm thu độc lập. Luồng tạo/tham gia/đổi Gia đình được mở rộng trong 03; thêm qua giao diện trong 04; xóa trong 05; cập nhật liên thiết bị trong 06.

Nguồn: [spec](../spec.md), [prototype A cập nhật](../prototype.md) và ADR-0006. Ưu tiên spec/ảnh A hiện tại hơn snapshot ba prototype ban đầu khi khác biệt. Kiểm thử hành vi bên ngoài qua App/repository; không kiểm thử state riêng tư hoặc prototype dùng một lần.
