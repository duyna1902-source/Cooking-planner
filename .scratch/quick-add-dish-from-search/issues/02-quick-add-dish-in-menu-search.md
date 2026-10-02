Status: ready-for-agent

# Issue 02: Quick Add Dish in Menu Search (Variant A)

## Context
Trong tab Menu (`MenuView`), khi người dùng tìm kiếm Món ăn mà từ khóa chưa trùng 100% với bất kỳ Món ăn nào trong Menu, hiển thị banner hành động màu pastel kem (`#FEF7DC`) gợi ý `+ Thêm Món ăn mới: "[tên món]" vào Menu`. Bấm vào sẽ mở `DishModal` với tên được điền sẵn.

## Acceptance Criteria
1. Khi `searchQuery.trim()` không rỗng, đối chiếu với danh sách Món ăn trong Menu theo quy tắc `trim().toLowerCase()`.
2. Nếu chưa trùng 100% với món nào:
   - Khi có kết quả tìm kiếm khớp một phần: Hiển thị banner `+ Thêm Món ăn mới: "[searchQuery.trim()]" vào Menu` ở cuối danh sách kết quả.
   - Khi không có kết quả nào (`filteredDishes.length === 0`): Hiển thị nút ở chính giữa khu vực thông báo không tìm thấy kết quả.
3. Nếu đã trùng 100% với một món có sẵn: Ẩn nút gợi ý thêm mới để tránh tạo trùng lặp Món ăn.
4. Bấm vào nút gợi ý sẽ mở `DishModal` với `initialName = searchQuery.trim()`.
5. Khi người dùng lưu thành công: Món ăn được lưu vào Menu, modal đóng lại, Menu tải lại dữ liệu và giữ nguyên giá trị `searchQuery` để Món ăn mới hiển thị ngay lập tức trong kết quả.
