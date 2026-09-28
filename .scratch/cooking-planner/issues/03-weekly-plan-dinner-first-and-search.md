# 03: Lịch Kế hoạch tuần, Bữa Tối mặc định và Chọn món kèm Tìm kiếm

**What to build:** Màn hình Kế hoạch hiển thị theo Tuần dương lịch thực tế (Thứ 2 đến Chủ nhật) với dải ngày Ribbon cuộn ngang. Khi người dùng bấm vào một ngày bất kỳ, Bữa Tối tự động được kích hoạt và hiển thị đầu tiên mà không cần bước chọn bữa phụ. Phía trên có thanh tab bo tròn mềm mại để chuyển đổi linh hoạt sang Bữa Sáng hoặc Bữa Trưa. Khi bấm "+ Thêm món", một Bottom Sheet Drawer trượt lên từ dưới, cung cấp ô tìm kiếm tức thì theo tên món/tag và danh sách Món ăn dạng checkbox bo tròn để người dùng tick chọn đưa vào bữa ăn. Người dùng cũng có thể bấm gỡ Món ăn khỏi bữa ăn.

**Blocked by:** 02: Quản lý Menu (Thêm, Sửa, Xóa Món ăn)

**Status:** ready-for-agent

- [ ] Hiển thị dải ngày tuần Ribbon cuộn ngang từ Thứ 2 đến Chủ nhật, hỗ trợ chuyển đổi ngày mượt mà
- [ ] Bữa Tối luôn là bữa mặc định được hiển thị và active ngay khi chọn một ngày
- [ ] Cung cấp thanh chuyển đổi tab bo tròn mềm mại cho phép xem và lên kế hoạch cho Bữa Sáng và Bữa Trưa
- [ ] Bấm "+ Thêm món" mở Bottom Sheet Drawer chọn món từ Menu với ô tìm kiếm tức thì theo tên món/tag
- [ ] Người dùng có thể tick chọn một hoặc nhiều Món ăn và bấm xác nhận để đưa vào bữa ăn đang chọn
- [ ] Người dùng có thể gỡ Món ăn khỏi một bữa ăn cụ thể
- [ ] Có bộ test tích hợp kiểm tra luồng mặc định Bữa Tối, tìm kiếm món ăn trong Drawer và thêm/gỡ món khỏi Kế hoạch
