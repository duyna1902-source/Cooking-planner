# 08: Menu/Kế hoạch báo lỗi tải và cho Thử lại

**What to build:** Người dùng thấy rõ đang tải, tải thất bại hoặc dữ liệu thực sự trống; Thử lại phục hồi và dữ liệu đã tải không biến mất khi làm mới lỗi.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Menu và Kế hoạch hiện trạng thái tải; thất bại lần đầu có lỗi + Thử lại ở nội dung liên quan, không hiện trống giả.
- [ ] Làm mới lỗi giữ dữ liệu đã tải cùng thông báo/Thử lại; thành công sau đó cập nhật dữ liệu và bỏ lỗi.
- [ ] Với Kế hoạch có nhiều nguồn dữ liệu, lỗi một nguồn không được xem như tổng thể đã tải thành công và trống.
- [ ] Gia đình cũ/request đến muộn không cập nhật màn mới; phản hồi dựa trên thao tác thật, không bổ sung badge Online hoặc fallback cloud offline.
- [ ] Kiểm thử App qua repository điều khiển được lỗi/thành công cho lần đầu, làm mới, retry, dữ liệu trống thật và đổi Gia đình; giữ các thao tác Menu/Kế hoạch đang có.

Không phụ thuộc header mới: phản hồi nằm trong nội dung, có thể nghiệm thu bằng luồng chọn người hiện tại. Lỗi khôi phục Thành viên thuộc 02.

## Context

**Parent:** 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình.

Áp dụng đặc tả Ghi nhớ Thành viên và cải thiện điều hướng Gia đình đã chốt Q1–Q15, glossary của dự án, ADR-0008 và phần bổ sung ADR-0007. Giữ ranh giới kiểm thử đã xác nhận: App cho luồng người dùng, database thật cho cạnh tranh, trình duyệt cho bố cục và nhiều tab theo phạm vi ticket.

## Comments

- 2026-10-11: Xuất bản theo skill to-tickets sau khi người dùng chấp nhận bản chia 7 ticket và các cạnh phụ thuộc. Trạng thái ready-for-agent; chưa bắt đầu triển khai.

