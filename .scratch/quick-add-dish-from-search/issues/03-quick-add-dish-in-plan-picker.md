Status: ready-for-agent

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
