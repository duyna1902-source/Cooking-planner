# 06: Chọn Thành viên không cuộn và phân trang dữ liệu cũ

**What to build:** Màn chọn người vừa một khung nhìn, form dùng được khi mở bàn phím, và Gia đình cũ hơn 6 người vẫn chọn/xóa được mọi người qua các trang.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Kiểm chứng và hoàn thiện bố cục với 0, 1, 4, 5, 6 người: tên, nút và phản hồi không bị che, nền không cuộn, vùng chạm tối thiểu 44×44.
- [x] Thu gọn phần trang trí/spacing trên màn thấp, giữ lưới thích ứng và thông báo nổi không làm dịch chuyển nút.
- [x] Hộp thoại thêm/xóa có thể cuộn khi bàn phím làm thiếu chỗ, luôn tiếp cận được các nút thao tác.
- [x] Dữ liệu 7+ người hiển thị tối đa 6 người/trang, có số trang và chuyển trang; không tự xóa hoặc giấu người.
- [x] Chọn/xóa và cập nhật realtime hoạt động ở mọi trang; xóa làm trang rỗng chuyển tới trang hợp lệ, giới hạn thêm vẫn tính tổng Gia đình.
- [x] Kiểm thử hành vi từ App cho phân trang, chọn/xóa và đồng bộ; có bằng chứng trình duyệt cho màn nhỏ, màn thấp/ngang, tên dài và bàn phím ảo.

Không phụ thuộc ticket giới hạn database: phân trang phải hoạt động với dữ liệu cũ độc lập với cơ chế chặn thêm. Ticket 03 chịu trách nhiệm lối quay về Gia đình mới; khi tích hợp, giữ nó trong bố cục đã kiểm chứng.

## Context

**Parent:** 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình.

Áp dụng đặc tả Ghi nhớ Thành viên và cải thiện điều hướng Gia đình đã chốt Q1–Q15, glossary của dự án, ADR-0008 và phần bổ sung ADR-0007. Giữ ranh giới kiểm thử đã xác nhận: App cho luồng người dùng, database thật cho cạnh tranh, trình duyệt cho bố cục và nhiều tab theo phạm vi ticket.

## Comments

- 2026-10-11: Xuất bản theo skill to-tickets sau khi người dùng chấp nhận bản chia 7 ticket và các cạnh phụ thuộc. Trạng thái ready-for-agent; chưa bắt đầu triển khai.
- 2026-10-11: Đã hoàn thành triển khai và kiểm thử theo chuẩn TDD cho Ticket 06. Trạng thái resolved.

## Answer

### 1. Triển khai
- **Zero-scroll Viewport & Touch Targets**:
  - Tinh chỉnh CSS trong `src/components/MemberSelection.css` đảm bảo `.ms-surface` và `.member-selection` hoạt động theo mô hình zero-scroll flex layout (`overflow: hidden`).
  - Đảm bảo tất cả các nút bấm (`.ms-manage`, `.ms-close`, `.ms-add`, `.ms-page-btn`, `.ms-member`) đạt kích thước vùng chạm tối thiểu 44×44px theo tiêu chuẩn accessibility.
  - Tối ưu hóa padding và khoảng cách trên màn hình thấp/nhỏ (`@media (max-height: 680px)` và `.ms-compact`) nhằm tránh tràn màn hình.
  - Toast thông báo `.ms-toast` sử dụng `position: absolute` nổi phía trên, không làm dịch chuyển các nút và thành phần lưới.
- **Scrollable Modal Dialogs**:
  - Hộp thoại `MemberDialog` (thêm thành viên và xác nhận xóa) được thiết lập `max-height: 85vh; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;`.
  - Đảm bảo khi bàn phím ảo xuất hiện trên thiết bị di động, toàn bộ nội dung hộp thoại và các nút hành động (Lưu, Hủy, Giữ lại, Xóa thành viên) đều cuộn được và luôn tiếp cận được.
- **Phân trang dữ liệu cũ (> 6 Thành viên)**:
  - Thêm `PAGE_SIZE = 6` vào `src/components/MemberSelection.tsx`.
  - Quản lý state phân trang: tính toán `totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE))` và kẹp `safePage = Math.min(page, totalPages)`.
  - Hiển thị thanh điều hướng phân trang `<nav className="ms-pagination">` với thông tin `"Trang X/Y"` cùng hai nút `"Trước"` và `"Sau"` (`aria-label="Trang trước"`, `aria-label="Trang sau"`).
  - Khi số lượng Thành viên trong Gia đình $\le 6$, thanh phân trang hoàn toàn không hiển thị.
  - Cho phép chọn Thành viên hoặc kích hoạt chế độ xóa trên bất kỳ trang nào.
  - Xử lý xóa thành viên cuối cùng của trang: tự động chuyển về trang trước (`safePage = Math.min(page, totalPages)`).
  - Giới hạn thêm thành viên tính trên tổng số thành viên của toàn bộ Gia đình (`members.length >= MAX_MEMBERS`), hiển thị thông báo đạt tối đa và ẩn nút thêm.

### 2. Kết quả kiểm thử
- **Unit tests**: `tests/components/MemberSelection.test.tsx` (24/24 passed) bao gồm 7 test case chuyên sâu cho Ticket 06:
  - Không hiển thị thanh phân trang khi $\le 6$ người.
  - Hiển thị 6 người trên trang 1 và thanh "Trang 1/2" cho 7 người.
  - Chuyển sang trang 2 khi bấm "Sau" và chọn người ở trang 2.
  - Xóa người ở trang 2 tự động fallback về trang 1 khi trang 2 rỗng.
  - Giữ nguyên trang 2 khi xóa người nhưng trang 2 vẫn còn người.
  - Ẩn nút thêm và hiện thông báo đạt tối đa khi tổng số người > 6.
  - Hộp thoại modal có container cuộn `ms-dialog` với `max-height: 85vh` và `overflow-y: auto`.
- **Integration tests**: `tests/integration/member-selection.test.tsx` (25/25 passed) bao gồm 3 integration test ở cấp App:
  - Điều hướng trang 2 và chọn thành viên vào Kế hoạch (`PlanView`).
  - Xóa thành viên ở trang 2 trên App tự động fallback về trang 1.
  - Đồng bộ realtime khi thiết bị khác xóa thành viên làm giảm số trang tự động điều chỉnh trang hiện tại an toàn.
- **Toàn bộ test suite**: `npx vitest run` chạy 20 test files, 191/191 tests passed.
- **Build production**: `npm run build` thành công, không có lỗi TypeScript hay Vite build.
