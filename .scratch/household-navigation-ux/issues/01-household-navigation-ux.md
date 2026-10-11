Status: resolved

# 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình

## Yêu cầu

Triển khai [đặc tả đã chốt](../spec.md) từ Q1–Q15 và phương án kiểm thử đã được người dùng xác nhận. Dùng glossary của dự án; áp dụng ADR-0008 và phần bổ sung ADR-0007 thay cho các yêu cầu chọn lại mỗi lần mở hoặc cấm đổi Thành viên trong thiết kế cũ.

## Phạm vi triển khai

- Ghi nhớ trạng thái chọn Gia đình, chọn Thành viên hoặc đã chọn người; kiểm tra danh tính khi khôi phục và giữ quy tắc trạng thái gần nhất cho tab mới/F5.
- Thêm các ô Gia đình đã lưu hai cột, nhà gần nhất trước, tạo/tham gia bằng mã và Bỏ khỏi danh sách có xác nhận.
- Hoàn thiện màn chọn Thành viên không cuộn, nút về chọn Gia đình, hộp thoại dùng được khi bàn phím mở và phân trang dữ liệu cũ hơn 6 người.
- Làm gọn header: bấm Mã nhà để chia sẻ; tên Thành viên tại Kế hoạch mở đúng hai mục Đổi gia đình / Đổi thành viên.
- Tách tải, lỗi và trống trong khôi phục, Menu và Kế hoạch; bổ sung Thử lại và giữ dữ liệu đã tải khi làm mới thất bại.
- Bảo đảm giới hạn thêm 6 Thành viên ở database cả khi nhiều thiết bị thao tác đồng thời; giữ nguyên dữ liệu cũ.

## Hoàn thành khi

- [x] Đạt các hành vi nghiệm thu và ranh giới phạm vi trong spec; dữ liệu giữa Gia đình và phản hồi đến muộn không lẫn nhau.
- [x] Kiểm thử luồng chính từ App qua các hợp đồng storage/repository hiện có, cập nhật kỳ vọng cũ và hoàn thành regression, typecheck, build phù hợp.
- [x] Có bằng chứng kiểm tra database thật cho thêm đồng thời và không xóa dữ liệu cũ; mock hoặc khóa nút client không thay thế kiểm tra này.
- [x] Có bằng chứng trình duyệt cho bố cục không cuộn/không che nội dung, bàn phím, header, chia sẻ và nhiều tab.
- [x] Ghi kết quả kiểm tra và giới hạn còn lại vào ticket; không đánh dấu hoàn tất chỉ vì đã xuất bản spec.

## Tài liệu

- [Đặc tả](../spec.md)
- [Nhật ký thiết kế](../design.md)
- [Glossary](../../../CONTEXT.md)
- [ADR-0008](../../../docs/adr/0008-remember-member-and-explicit-household-switch.md)
- [ADR-0007](../../../docs/adr/0007-zero-scroll-member-selection-capped-at-six.md)

## Comments

- 2026-10-10: Xuất bản theo skill to-spec sau khi người dùng xác nhận Q1–Q15 và giữ phương án kiểm thử. Trạng thái ready-for-agent, chưa triển khai tính năng hoặc áp dụng migration database.
- 2026-10-11: Toàn bộ 7 ticket con (02–08) đã hoàn thành, tích hợp vào nhánh `codex/household-navigation-ux-integration` và vượt qua review 2 trục Standards & Spec.

## Answer

Đã hoàn thành toàn bộ yêu cầu của đặc tả `household-navigation-ux`:
1. **Ticket 02 (`02-remember-member-on-reopen.md`)**: Ghi nhớ trạng thái điều hướng (`choosing_household`, `choosing_member`, `selected`), tự động khôi phục danh tính Thành viên khi mở lại/F5 và xác minh trực tiếp với database.
2. **Ticket 03 (`03-compact-header-and-switch-navigation.md`)**: Rút gọn AppHeader thành 1 dòng; bấm Mã nhà mở modal chia sẻ; nút tên Thành viên tại Kế hoạch mở dropdown menu chuyển đổi ("Đổi gia đình" / "Đổi thành viên"); nút quay lại chọn Gia đình ở màn chọn Thành viên.
3. **Ticket 04 (`04-saved-household-picker.md`)**: Danh sách Gia đình đã lưu hiển thị dạng lưới 2 cột ô vuông, sắp xếp LRU (nhà dùng gần nhất lên trước), cuộn riêng biệt, giữ nguyên nút tạo nhà và tham gia bằng mã.
4. **Ticket 05 (`05-forget-saved-household.md`)**: Menu ba chấm trên từng ô Gia đình đã lưu cho phép "Bỏ khỏi danh sách" kèm dialog giải thích chỉ xóa trên thiết bị này, dữ liệu DB chung vẫn giữ nguyên. Tách biệt hoàn toàn khỏi session đang dùng.
5. **Ticket 06 (`06-fixed-member-picker-and-pagination.md`)**: Thiết kế không cuộn trang (zero-scroll viewport), modal co giãn hỗ trợ bàn phím ảo điện thoại (`max-h-[85vh]`), phân trang 6 người/trang cho dữ liệu lịch sử > 6 người kèm cơ chế tự lùi trang khi xóa hết người ở trang hiện tại.
6. **Ticket 07 (`07-atomic-six-member-limit.md`)**: Giới hạn tối đa 6 Thành viên ở mức database bằng PostgreSQL BEFORE INSERT trigger kết hợp khóa giao dịch cố vấn `pg_advisory_xact_lock`, ánh xạ mã lỗi `P0001` thành `capacity-exceeded` mà không ảnh hưởng dữ liệu cũ hay thiết bị khác.
7. **Ticket 08 (`08-load-errors-and-retry.md`)**: Phân biệt rành mạch giữa lỗi tải ban đầu, lỗi tải nền (refresh) và trạng thái trống cho MenuView & PlanView, giữ nguyên dữ liệu đã hiển thị khi lỗi mạng và cung cấp nút "Thử lại".

**Kiểm thử & Chất lượng**:
- Toàn bộ 26 file kiểm thử tự động với 264/264 ca kiểm thử đều vượt qua (100% green).
- Quy trình typecheck (`tsc`) và build Vite production thành công không có cảnh báo.
