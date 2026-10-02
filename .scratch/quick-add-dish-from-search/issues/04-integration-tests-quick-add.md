Status: ready-for-agent

# Issue 04: Integration Tests for Quick Add from Search

## Context
Viết bổ sung kiểm thử tích hợp (integration tests) cho luồng thêm nhanh Món ăn từ ô tìm kiếm trong cả Kế hoạch (`PlanView`) và Menu (`MenuView`).

## Acceptance Criteria
1. Test trong `weekly-plan.test.tsx`:
   - Mở Drawer chọn món cho một Bữa ăn.
   - Tìm kiếm từ khóa không có trong Menu -> kiểm tra nút gợi ý thêm Món ăn mới xuất hiện.
   - Nhập từ khóa trùng 100% với món có sẵn -> nút gợi ý bị ẩn.
   - Tick chọn 1 món có sẵn, sau đó search và bấm thêm 1 món mới qua `DishModal`.
   - Lưu món mới thành công -> kiểm tra cả món cũ và món mới đều xuất hiện trong Bữa ăn trên Kế hoạch, Modal và Drawer đều đóng.
2. Test trong `menu-management.test.tsx`:
   - Tìm kiếm từ khóa món mới trong Menu -> bấm nút gợi ý thêm món.
   - Lưu qua `DishModal` -> kiểm tra từ khóa tìm kiếm được giữ nguyên và món mới xuất hiện trong danh sách.
3. Toàn bộ test suite chạy thành công (`npm test`).
