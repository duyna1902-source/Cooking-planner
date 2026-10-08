# 01: Bố cục cố định không cuộn (Zero-Scroll) và Lưới thích ứng 2–3 cột

**What to build:** Màn hình chọn Thành viên vừa vặn hoàn toàn trong một khung nhìn không cuộn trên mọi kích thước thiết bị di động. Danh sách Thành viên tự động thích ứng: hiển thị 2 cột với avatar lớn khi có 1–4 người, và chuyển sang 3 cột với avatar vừa khi có 5–6 người. Hình vẽ minh họa cái chảo trang trí, slogan và câu quote chân trang tự động ẩn đi khi danh sách có từ 5 người trở lên hoặc trên màn hình chiều cao thấp (< 680px) để ưu tiên toàn bộ không gian cho các nút bấm Thành viên. Nút "+ Thêm thành viên" được tinh gọn thành thanh dẹt phẳng ở đáy.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Toàn bộ màn hình chọn Thành viên không bao giờ xuất hiện thanh cuộn dọc (zero-scroll), nội dung hiển thị vừa vặn trong 1 màn hình.
- [ ] Khi Gia đình có 1–4 Thành viên, danh sách hiển thị dạng lưới 2 cột với avatar lớn (~76px) và nhãn tên rõ ràng.
- [ ] Khi Gia đình có 5–6 Thành viên, danh sách tự động chuyển sang lưới 3 cột với avatar vừa (~58px) chia đều 2 hàng.
- [ ] Khi có từ 5 Thành viên trở lên hoặc màn hình có chiều cao < 680px, phần hình vẽ cái chảo trang trí và quote footer tự động ẩn để giữ layout không bị tràn.
- [ ] Nút "+ Thêm thành viên" hiển thị dạng thanh phẳng nhỏ gọn ở đáy màn hình, bỏ dòng chữ chú thích phụ.
- [ ] Người dùng vẫn có thể bấm chọn Thành viên để vào Kế hoạch và mở form thêm Thành viên bình thường.
- [ ] Kiểm thử tích hợp xác nhận giao diện thích ứng 2–3 cột và toàn bộ luồng chọn Thành viên hoạt động ổn định.
