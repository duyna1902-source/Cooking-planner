# 06: Đồng bộ danh sách Thành viên giữa các thiết bị

Type: task
Status: draft
Blocked by: 03, 05

**Parent:** [01 — Chọn Thành viên và lưu danh sách theo Gia đình](../issues/01-member-selection-screen.md).

**What to build:** Khi thiết bị khác thêm hoặc xóa Thành viên, màn hình chọn đang mở tự cập nhật danh sách Gia đình hiện tại. Đổi Gia đình, nhận sự kiện lặp hoặc kết quả đến muộn không làm trộn danh sách hay khôi phục người đã xóa.

**Blocked by:** 03 — Tạo, tham gia và đổi Gia đình qua bước chọn Thành viên; 05 — Xóa Thành viên ở góc màn hình chọn.

**Trạng thái bản nháp:** Chờ duyệt cách chia; chưa xuất bản ticket triển khai.

- [ ] Màn hình chọn đăng ký thay đổi của Gia đình hiện tại và tải lại danh sách từ database khi được thông báo thêm/xóa; không tự mở Kế hoạch hoặc tự chọn người.
- [ ] Thiết bị A thêm qua luồng 04 thì màn hình chọn thiết bị B tự hiện một ô mới đúng thứ tự, không cần tải lại thủ công. A xóa qua luồng 05 thì B tự gỡ đúng người.
- [ ] Sự kiện lặp và phản hồi tải chồng nhau không tạo ô trùng hoặc khiến kết quả cũ ghi đè danh sách mới. Sự kiện Gia đình khác không đưa dữ liệu vào danh sách hiện tại.
- [ ] Hủy subscription khi rời màn hình hoặc đổi Gia đình; bỏ qua sự kiện và phản hồi của Gia đình/phiên tải đã hết hiệu lực. Đổi Gia đình qua luồng 03 vẫn chọn từ danh sách đích.
- [ ] Lỗi tải lại có thông báo và cách thử lại phù hợp; không báo danh sách trống giả, không chuyển sang dữ liệu local để vượt bước chọn.
- [ ] Xác minh cơ chế thông báo xóa với RLS/publication và quyền database thực. Bảo đảm kết quả trên hai thiết bị; không chỉ suy luận từ subscription thêm hoặc mock SDK.
- [ ] Có kiểm thử App với repository có subscription và Promise có thể điều khiển cho thêm/xóa, sự kiện lặp, thứ tự phản hồi, đổi Gia đình và cleanup; kiểm tra hợp đồng đăng ký/hủy.
- [ ] Kiểm tra Supabase thật bằng hai phiên và dữ liệu thử cho thêm/xóa liên thiết bị, giữ thứ tự và không lẫn Gia đình. Phiên đã chọn vẫn giữ danh tính; thay đổi danh sách không thêm thao tác đổi Thành viên.
- [ ] Chạy regression suite, typecheck và build; browser kiểm tra danh sách dài/mobile và đồng bộ qua hai phiên. Ghi lại bằng chứng lưu/thêm/xóa và các yêu cầu của spec đã được nghiệm thu.

## Scope notes

Chặn bởi 03 để kiểm tra đổi Gia đình trong lúc có subscription, và bởi 05 để kiểm tra xóa liên thiết bị qua luồng thật. 04/02 là phụ thuộc bắc cầu, không cần lặp lại cạnh chặn.

Nguồn: [spec](../spec.md), [prototype A cập nhật](../prototype.md) và ADR-0006. Ưu tiên spec/ảnh A hiện tại hơn snapshot ba prototype ban đầu khi khác biệt. Kiểm thử hành vi bên ngoài qua App/repository; không kiểm thử state riêng tư hoặc prototype dùng một lần.
