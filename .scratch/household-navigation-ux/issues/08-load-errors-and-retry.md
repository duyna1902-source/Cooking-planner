# 08: Menu/Kế hoạch báo lỗi tải và cho Thử lại

**What to build:** Người dùng thấy rõ đang tải, tải thất bại hoặc dữ liệu thực sự trống; Thử lại phục hồi và dữ liệu đã tải không biến mất khi làm mới lỗi.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Menu và Kế hoạch hiện trạng thái tải; thất bại lần đầu có lỗi + Thử lại ở nội dung liên quan, không hiện trống giả.
- [x] Làm mới lỗi giữ dữ liệu đã tải cùng thông báo/Thử lại; thành công sau đó cập nhật dữ liệu và bỏ lỗi.
- [x] Với Kế hoạch có nhiều nguồn dữ liệu, lỗi một nguồn không được xem như tổng thể đã tải thành công và trống.
- [x] Gia đình cũ/request đến muộn không cập nhật màn mới; phản hồi dựa trên thao tác thật, không bổ sung badge Online hoặc fallback cloud offline.
- [x] Kiểm thử App qua repository điều khiển được lỗi/thành công cho lần đầu, làm mới, retry, dữ liệu trống thật và đổi Gia đình; giữ các thao tác Menu/Kế hoạch đang có.

Không phụ thuộc header mới: phản hồi nằm trong nội dung, có thể nghiệm thu bằng luồng chọn người hiện tại. Lỗi khôi phục Thành viên thuộc 02.

## Context

**Parent:** 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình.

Áp dụng đặc tả Ghi nhớ Thành viên và cải thiện điều hướng Gia đình đã chốt Q1–Q15, glossary của dự án, ADR-0008 và phần bổ sung ADR-0007. Giữ ranh giới kiểm thử đã xác nhận: App cho luồng người dùng, database thật cho cạnh tranh, trình duyệt cho bố cục và nhiều tab theo phạm vi ticket.

## Comments

- 2026-10-11: Xuất bản theo skill to-tickets sau khi người dùng chấp nhận bản chia 7 ticket và các cạnh phụ thuộc. Trạng thái ready-for-agent; chưa bắt đầu triển khai.

## Answer

### Giải pháp kỹ thuật đã triển khai

1. **Quản lý trạng thái tải, lỗi và rỗng độc lập trên `MenuView`:**
   - Phân biệt rõ các trạng thái: `isLoading && !hasLoadedOnce` (đang tải lần đầu), `loadError && !hasLoadedOnce` (lỗi tải lần đầu), `loadError && hasLoadedOnce` (lỗi khi làm mới dữ liệu), và trạng thái rỗng thật sự (`hasLoadedOnce && !loadError && dishes.length === 0`).
   - Khi tải lần đầu thất bại: hiển thị container lỗi trực quan với nút "Thử lại" (`data-testid="menu-retry-btn"`), tuyệt đối không hiển thị thông điệp rỗng giả.
   - Khi làm mới thất bại (refresh): bảo toàn danh sách món ăn đang có trên màn hình, hiển thị banner cảnh báo không phá hủy (`data-testid="menu-refresh-error"`) kèm nút "Thử lại" (`data-testid="menu-refresh-retry-btn"`).
   - Khi bấm "Thử lại": gọi lại `loadDishes()`; nếu thành công, xóa bỏ thông báo lỗi và hiển thị danh sách món mới nhất.
   - Chống race condition / phản hồi đến muộn từ Gia đình cũ: sử dụng `latestHouseholdRef` và `reqIdRef` để loại bỏ các response trễ hoặc khi đã đổi sang gia đình khác.

2. **Quản lý trạng thái tải đa nguồn, lỗi và rỗng trên `PlanView`:**
   - `PlanView` phụ thuộc vào cả `dishRepository.getDishes` và `planRepository.getPlanItems`. Lỗi ở bất kỳ nguồn nào đều kích hoạt trạng thái lỗi tải kế hoạch, không bị coi là bữa ăn rỗng.
   - Khi tải lần đầu thất bại: hiển thị khu vực báo lỗi tại danh sách bữa ăn (`data-testid="plan-load-error"`) kèm nút "Thử lại" (`data-testid="plan-retry-btn"`), loại trừ trạng thái rỗng giả ("Chưa có Món ăn nào cho Bữa...").
   - Khi làm mới thất bại (qua subscription hoặc refresh): giữ nguyên danh sách món ăn đã lên lịch trong bữa, hiển thị banner cảnh báo (`data-testid="plan-refresh-error"`) kèm nút "Thử lại".
   - Bấm "Thử lại" sẽ kích hoạt lại `loadData()`; xóa cờ lỗi khi hoàn tất.
   - Chống stale response khi chuyển đổi `householdCode` trong lúc request đang in-flight.

### Kiểm thử tích hợp tự động

- **`tests/integration/menu-management.test.tsx`:**
  - Báo lỗi tải lần đầu và nút "Thử lại", ngăn chặn rỗng giả.
  - Bấm "Thử lại" kích hoạt lại repository và phục hồi danh sách món khi thành công.
  - Hiển thị trạng thái rỗng chuẩn chỉ khi load thành công và không có món nào.
  - Khi refresh lỗi, bảo toàn danh sách món đã tải và hiển thị banner thông báo kèm retry.
  - Bỏ qua response đến muộn từ mã gia đình cũ khi đã đổi gia đình mới.

- **`tests/integration/weekly-plan.test.tsx`:**
  - Lỗi tải lần đầu từ `dishRepository` hiển thị thông báo lỗi và nút "Thử lại", không hiện bữa rỗng giả.
  - Lỗi tải lần đầu từ `planRepository` hiển thị thông báo lỗi và nút "Thử lại".
  - Bấm "Thử lại" sau khi lỗi lần đầu sẽ tải lại thành công và hiển thị các món trong bữa ăn.
  - Trạng thái rỗng bữa ăn ("Chưa có Món ăn nào...") chỉ xuất hiện khi tải thành công và bữa ăn thực sự chưa có món.
  - Khi refresh lỗi, bảo toàn các món đã lên lịch của bữa ăn và hiển thị banner thông báo kèm retry.
  - Response đến muộn từ mã gia đình cũ không ghi đè dữ liệu của gia đình mới.

### Kết quả nghiệm thu
- Tất cả 20 test files với 192 tests đều PASS.
- Production build `npm run build` thành công, không có lỗi kiểu TypeScript hay Vite bundle.
