# 02: Add New Member via Bottom Drawer

**What to build:**
Trên màn hình chọn Thành viên, một nút bấm lớn dạng pill mang nội dung "➕ Thêm thành viên mới" màu Dusty Blue (`#5B7C99`) được đặt cố định ở đáy màn hình. Khi người dùng bấm vào, một Bottom Drawer trượt từ dưới lên cho phép nhập tên Thành viên và chọn 1 trong 8 biểu tượng đại diện ẩm thực kèm màu pastel. Khi bấm "Xác nhận tạo thành viên", hệ thống kiểm tra tính hợp lệ (cấm để trống tên, cấm trùng tên trong cùng một gia đình), lưu vào Database/Storage và hiển thị ngay Thành viên mới trên lưới để người dùng có thể chọn vào bếp.

**Blocked by:** 01: Core Member Selection Modal & Session Gate

**Status:** resolved

- [x] Hiển thị nút "➕ Thêm thành viên mới" dạng pill tròn đầy đủ chiều ngang (`w-full py-3.5 rounded-full bg-[#5B7C99] text-white font-bold`) ghim cố định ở đáy màn hình chọn Thành viên.
- [x] Bấm vào nút sẽ kích hoạt Bottom Drawer trượt mượt mà từ dưới lên với nền mờ backdrop blur và vạch kéo bo tròn.
- [x] Drawer chứa ô nhập tên Thành viên hỗ trợ tối đa 30 ký tự, tự động cắt khoảng trắng thừa (trim) và tự động focus.
- [x] Lưới chọn 8 biểu tượng đại diện ẩm thực chuẩn bộ mẫu (🍳, 🥗, 🍜, 🥑, 🍰, 🍕, 🥕, 🍲) kèm nhãn tiếng Việt và màu nền pastel tương ứng; biểu tượng đang chọn có vòng viền xanh `#5B7C99` nổi bật.
- [x] Kiểm tra lỗi khi tên bị để trống hoặc chỉ chứa khoảng trắng: hiển thị thông báo lỗi thân thiện và chặn gửi form.
- [x] Kiểm tra lỗi trùng tên: nếu tên thành viên đã tồn tại trong cùng `household_code` (không phân biệt chữ hoa/thường), hiển thị thông báo lỗi và không cho lưu.
- [x] Khi gửi form thành công, lưu Thành viên vào Database (Supabase) hoặc LocalStorage thông qua phương thức `addMember`, đóng drawer và cập nhật ngay danh sách Thành viên trên lưới.
- [x] Thành viên mới thêm có thể bấm chọn ngay lập tức để vào màn hình Kế hoạch.
- [x] Có nút "Hủy" hoặc nút dấu ✕ để đóng drawer bất cứ lúc nào mà không thay đổi dữ liệu.
- [x] Bộ kiểm thử tự động (Unit & Integration tests) bao phủ trọn vẹn việc mở drawer, chọn biểu tượng, kiểm tra validation rỗng/trùng và lưu thành viên mới.

## Answer

Implemented the `MemberDrawer` component as a slide-up bottom sheet with backdrop overlay and drag handle. Added fixed bottom pill action "➕ Thêm thành viên mới" to `MemberSelectModal`. The drawer features a 30-character trimmed name input and an 8-preset visual kitchen avatar selector with active border indicator. Validated empty/whitespace and duplicate name conditions per household. Added members are persisted to the repository, immediately visible in the grid, and directly selectable. Covered with unit and integration tests (179 passing tests).

