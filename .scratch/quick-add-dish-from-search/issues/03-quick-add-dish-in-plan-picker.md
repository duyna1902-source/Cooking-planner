Status: resolved

# Issue 03: Quick Add Dish in Plan Picker Drawer (Variant A: Sticky Action Banner)

## Context
Trong Drawer chọn Món ăn của trang Kế hoạch (`DishPickerDrawer`), khi tìm kiếm món chưa có (hoặc chưa trùng 100%), hiển thị **Sticky Action Banner (Phương án A)** màu pastel kem (`#FEF7DC`, viền nét đứt `#EFE4B5`) ghim cố định phía trên nút xác nhận: `Chưa có "[tên món]" trong Menu? [ + Thêm món ]`. Khi lưu Món ăn mới thành công từ `DishModal`, Món ăn được lưu vào Menu và tự động thêm vào Bữa ăn đang chọn của ngày đó trong Kế hoạch cùng với các món đã tick chọn trước đó, sau đó đóng Drawer.

## Acceptance Criteria
1. `DishPickerDrawer` nhận thêm prop callback `onAddNewDish?: (input: DishInput) => Promise<string>` (trả về `id` của Món ăn vừa tạo).
2. Khi `searchQuery.trim()` không rỗng và chưa trùng 100% với Món ăn nào trong Menu:
   - Hiển thị **Sticky Action Banner** cố định ở phía trên nút xác nhận: gồm icon `✨`, text `Chưa có "[searchQuery.trim()]" trong Menu?`, phụ đề hướng dẫn, và nút `+ Thêm món`.
   - Ẩn banner gợi ý nếu từ khóa đã trùng 100% với một món có sẵn trong Menu (không phân biệt hoa/thường và khoảng trắng thừa).
3. Bấm nút `+ Thêm món` sẽ mở `DishModal` với `initialName = searchQuery.trim()`. Modal hiển thị đè lên trên Drawer (`z-[60]`).
4. Nếu người dùng Hủy modal: Modal đóng lại, Drawer giữ nguyên trạng thái tìm kiếm và các món đã tick chọn.
5. Nếu người dùng Lưu Món ăn trong Modal:
   - Tạo Món ăn mới qua `onAddNewDish(input)` và nhận lại ID món mới.
   - Gộp ID món mới cùng các ID món đã tick chọn trước đó (`[...selectedDishIds, newDishId]`).
   - Gọi `onConfirm` với danh sách ID gộp này để thêm vào Kế hoạch cho Bữa ăn đang chọn.
   - Đóng cả Modal và Drawer.
6. `PlanView` truyền callback `onAddNewDish` xử lý lưu qua `dishRepository.addDish`, trả về dish ID.

## Answer
- Đã thêm `onAddNewDish?: (input: DishInput) => Promise<string>` vào `DishPickerDrawerProps`.
- Đã cài đặt Sticky Action Banner Phương án A ghim phía trên nút xác nhận với màu `#FEF7DC`, viền nét đứt `#EFE4B5`, ẩn khi trùng 100%.
- Bấm `+ Thêm món` mở `DishModal` với `initialName = trimmedQuery` xếp lớp `z-[60]` trên Drawer (`z-50`).
- Hủy modal giữ nguyên trạng thái tìm kiếm và các món đã chọn.
- Lưu modal thực hiện dual assignment: lưu vào Menu qua `onAddNewDish`, gộp ID món mới với các món đã chọn, thêm vào Kế hoạch qua `onConfirm`, và đóng cả modal lẫn drawer.
- Bổ sung integration tests đầy đủ trong `tests/integration/weekly-plan.test.tsx`.
