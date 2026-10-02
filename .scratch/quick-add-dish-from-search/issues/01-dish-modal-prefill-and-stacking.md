Status: resolved

# Issue 01: DishModal Prefill & Layer Stacking

## Context
Khi người dùng bấm vào gợi ý "+ Thêm Món ăn mới" từ ô tìm kiếm trong Drawer chọn Món ăn hoặc tab Menu, `DishModal` cần hiển thị với trường Tên Món ăn được điền sẵn từ từ khóa tìm kiếm (`initialName`), đồng thời có z-index cao hơn (`z-[60]`) để hiển thị đè mượt mà lên trên `DishPickerDrawer` (`z-50`).

## Acceptance Criteria
1. `DishModalProps` nhận thêm prop tùy chọn `initialName?: string`.
2. Khi modal mở ở chế độ thêm mới (`initialDish` là null/undefined):
   - Nếu có `initialName`, trường Tên Món ăn được khởi tạo bằng `initialName.trim()`.
   - Nếu không có `initialName`, trường Tên Món ăn để trống như cũ.
3. Z-index của `DishModal` được nâng lên `z-[60]` để nổi hoàn toàn trên Drawer (khi mở từ Drawer).
4. Validation và các hành vi lưu/hủy hiện có của `DishModal` không bị ảnh hưởng.

## Answer
- Đã thêm `initialName?: string` vào `DishModalProps`.
- Trong `useEffect`, nếu không có `initialDish`, khởi tạo `name` với `initialName ? initialName.trim() : ''`.
- Đã nâng z-index của `DishModal` lên `z-[60]`.
- Bổ sung unit test tại `tests/components/DishModal.test.tsx` xác nhận hoạt động.
