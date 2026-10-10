# 04: Chọn nhanh các Gia đình đã lưu

**What to build:** Gia đình đã tạo/tham gia xuất hiện thành ô vuông biểu tượng nhà + Mã nhà; bấm ô mở chọn Thành viên và vẫn tạo/tham gia bằng mã như trước.

**Blocked by:** 02: Ghi nhớ Thành viên khi F5 và mở lại

**Status:** ready-for-agent

- [ ] Ghi danh sách local ngay khi tạo/tham gia được chấp nhận, kể cả chưa có người; ghi nhận cả lần chủ động mở link hợp lệ hoặc chọn lại một ô.
- [ ] Chuẩn hóa mã, không trùng ô, nhà vừa vào xếp trước; giữ Mã nhà từ bản cũ trong danh sách.
- [ ] Danh sách ô hai cột được cuộn riêng khi nhiều nhà; hai nút Tạo Nhà Mới / Tham Gia Bằng Mã luôn dễ tiếp cận, kể cả danh sách trống.
- [ ] Chọn ô luôn chuyển sang chọn Thành viên, kể cả cùng Gia đình vừa dùng; lưu đúng bước cho F5 và không khôi phục người riêng theo từng Gia đình.
- [ ] Giữ luồng tạo nhà thành công/chia sẻ, validation mã và lối quay lại các bước nhập mã; mã không hợp lệ không tạo ô.
- [ ] Kiểm thử App cho ghi ngay, khôi phục lịch sử, sắp xếp/chống trùng, mã cũ và chọn lại người; kiểm tra trình duyệt cho danh sách nhiều ô.
