# 07: Phân chia Người nấu theo Ngày và Chọn Thành viên kiểu Netflix

**What to build:** Xây dựng màn hình chọn hồ sơ Thành viên kiểu Netflix với tiêu đề "Ai đang sử dụng?" hiển thị danh sách avatar các thành viên trong nhà kèm nút "+ Thêm người" mỗi khi mở ứng dụng (sau khi đã có Mã nhà). Cập nhật thanh tiêu đề (AppHeader) loại bỏ chữ 'Online' cố định (thay bằng thông báo ngoại tuyến khi mất mạng), góc trên bên phải hiển thị nút hồ sơ bo tròn mềm mại mang tên người dùng hiện tại (bấm vào để quay lại màn hình chọn thành viên). Trên dải Ribbon ngày, hiển thị nhãn Người nấu dạng Floating Pill Badge phía trên ô ngày. Khi người dùng bấm vào một ngày tương lai chưa có ai phụ trách, hiển thị popup "Ai sẽ nấu ngày này?" với danh sách thành viên và nút "Để sau". Ở khu vực chi tiết ngày, cung cấp nút phân công, đổi người nấu và hủy phân công. Dữ liệu thành viên được lưu trữ trong `households.members` và phân công người nấu được lưu trữ theo ngày trong Kế hoạch.

**Blocked by:** 06: Đồng bộ dữ liệu Đa thiết bị thời gian thực với Supabase (Cross-Device Realtime Sync)

**Status:** resolved

- [x] Bổ sung trường `members: string[]` vào entity và repository `Household`, hỗ trợ thêm thành viên mới
- [x] Xây dựng màn hình chọn hồ sơ kiểu Netflix với tiêu đề "Ai đang sử dụng?", danh sách avatar thành viên và nút "+ Thêm người"
- [x] Cập nhật AppHeader: góc trái hiển thị `🏠 Mã: CODE` tối giản (bỏ hoàn toàn chữ Online); góc phải hiển thị nút Profile bo tròn mềm mại với tên thành viên đang hoạt động, bấm vào chuyển sang màn hình chọn thành viên
- [x] Hiển thị Floating Pill Badge ghi tên Người nấu phía trên đỉnh ô ngày trong dải Ribbon
- [x] Khi chọn ngày tương lai chưa phân công, hiển thị popup "Ai sẽ nấu ngày này?" kèm nút "Để sau"
- [x] Cung cấp nút phân công/đổi Người nấu và nút "Hủy phân công" trong khu vực chi tiết ngày
- [x] Lưu trữ và cập nhật phân công Người nấu theo từng ngày trong Kế hoạch
- [x] Bổ sung bộ test tích hợp kiểm tra toàn bộ luồng chọn thành viên, phân công người nấu, hiển thị trên ribbon và đổi profile
