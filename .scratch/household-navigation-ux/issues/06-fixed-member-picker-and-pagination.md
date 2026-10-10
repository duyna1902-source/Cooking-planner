# 06: Chọn Thành viên không cuộn và phân trang dữ liệu cũ

**What to build:** Màn chọn người vừa một khung nhìn, form dùng được khi mở bàn phím, và Gia đình cũ hơn 6 người vẫn chọn/xóa được mọi người qua các trang.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Kiểm chứng và hoàn thiện bố cục với 0, 1, 4, 5, 6 người: tên, nút và phản hồi không bị che, nền không cuộn, vùng chạm tối thiểu 44×44.
- [ ] Thu gọn phần trang trí/spacing trên màn thấp, giữ lưới thích ứng và thông báo nổi không làm dịch chuyển nút.
- [ ] Hộp thoại thêm/xóa có thể cuộn khi bàn phím làm thiếu chỗ, luôn tiếp cận được các nút thao tác.
- [ ] Dữ liệu 7+ người hiển thị tối đa 6 người/trang, có số trang và chuyển trang; không tự xóa hoặc giấu người.
- [ ] Chọn/xóa và cập nhật realtime hoạt động ở mọi trang; xóa làm trang rỗng chuyển tới trang hợp lệ, giới hạn thêm vẫn tính tổng Gia đình.
- [ ] Kiểm thử hành vi từ App cho phân trang, chọn/xóa và đồng bộ; có bằng chứng trình duyệt cho màn nhỏ, màn thấp/ngang, tên dài và bàn phím ảo.

Không phụ thuộc ticket giới hạn database: phân trang phải hoạt động với dữ liệu cũ độc lập với cơ chế chặn thêm. Ticket 03 chịu trách nhiệm lối quay về Gia đình mới; khi tích hợp, giữ nó trong bố cục đã kiểm chứng.

## Context

**Parent:** 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình.

Áp dụng đặc tả Ghi nhớ Thành viên và cải thiện điều hướng Gia đình đã chốt Q1–Q15, glossary của dự án, ADR-0008 và phần bổ sung ADR-0007. Giữ ranh giới kiểm thử đã xác nhận: App cho luồng người dùng, database thật cho cạnh tranh, trình duyệt cho bố cục và nhiều tab theo phạm vi ticket.

## Comments

- 2026-10-11: Xuất bản theo skill to-tickets sau khi người dùng chấp nhận bản chia 7 ticket và các cạnh phụ thuộc. Trạng thái ready-for-agent; chưa bắt đầu triển khai.

