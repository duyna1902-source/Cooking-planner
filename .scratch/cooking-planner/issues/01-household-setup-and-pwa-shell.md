# 01: Khởi tạo nền tảng PWA, Tạo và Tham gia Nhà

**What to build:** Người dùng mở ứng dụng trên điện thoại, có thể khởi tạo một "Nhà" mới (nhận Mã nhà ngắn ngẫu nhiên và đường link tham gia trực tiếp dạng `?join=CODE`) hoặc tham gia vào Nhà có sẵn bằng cách nhập mã hoặc bấm vào link chia sẻ. Người dùng nhập Biệt danh một lần duy nhất và được lưu cục bộ trên thiết bị. Giao diện hiển thị khung mobile-first PWA hoàn chỉnh với tone màu Dusty Blue (#5B7C99) và Pastel Cream (#FEF7DC), có thanh điều hướng chuyển đổi giữa Kế hoạch và Menu, cùng thông tin Mã nhà và Biệt danh trên đầu trang. Toàn bộ hành vi được kiểm thử bằng integration test (Vitest + RTL).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Người dùng có thể bấm "Tạo Nhà" để sinh một Mã nhà ngẫu nhiên (ví dụ `BEP-892`) và nhận link chia sẻ trực tiếp
- [ ] Người dùng truy cập qua URL có tham số `?join=CODE` hoặc nhập mã thủ công để tham gia vào Nhà của gia đình
- [ ] Người dùng nhập Biệt danh lần đầu và hệ thống lưu cục bộ trên thiết bị (localStorage)
- [ ] Khung ứng dụng Mobile PWA hiển thị chuẩn xác với tone màu chủ đạo Dusty Blue (#5B7C99) và Pastel Cream (#FEF7DC) cùng thanh điều hướng Kế hoạch / Menu
- [ ] Có bộ test tích hợp Vitest kiểm tra luồng tạo nhà, tham gia qua link và lưu biệt danh thành công
