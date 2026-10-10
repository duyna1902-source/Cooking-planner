Status: ready-for-agent

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

- Đạt các hành vi nghiệm thu và ranh giới phạm vi trong spec; dữ liệu giữa Gia đình và phản hồi đến muộn không lẫn nhau.
- Kiểm thử luồng chính từ App qua các hợp đồng storage/repository hiện có, cập nhật kỳ vọng cũ và hoàn thành regression, typecheck, build phù hợp.
- Có bằng chứng kiểm tra database thật cho thêm đồng thời và không xóa dữ liệu cũ; mock hoặc khóa nút client không thay thế kiểm tra này.
- Có bằng chứng trình duyệt cho bố cục không cuộn/không che nội dung, bàn phím, header, chia sẻ và nhiều tab.
- Ghi kết quả kiểm tra và giới hạn còn lại vào ticket; không đánh dấu hoàn tất chỉ vì đã xuất bản spec.

## Tài liệu

- [Đặc tả](../spec.md)
- [Nhật ký thiết kế](../design.md)
- [Glossary](../../../CONTEXT.md)
- [ADR-0008](../../../docs/adr/0008-remember-member-and-explicit-household-switch.md)
- [ADR-0007](../../../docs/adr/0007-zero-scroll-member-selection-capped-at-six.md)

## Comments

- 2026-10-10: Xuất bản theo skill to-spec sau khi người dùng xác nhận Q1–Q15 và giữ phương án kiểm thử. Trạng thái ready-for-agent, chưa triển khai tính năng hoặc áp dụng migration database.
