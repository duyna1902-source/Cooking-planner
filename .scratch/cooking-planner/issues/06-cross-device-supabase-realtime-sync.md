# 06: Đồng bộ dữ liệu Đa thiết bị thời gian thực với Supabase (Cross-Device Realtime Sync)

**What to build:** Xây dựng cơ chế đồng bộ dữ liệu đa thiết bị theo kiến trúc Chế độ kép (Dual Mode). Khi cấu hình thông tin Supabase Cloud qua biến môi trường (`VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`), ứng dụng tự động kích hoạt `SupabaseDishRepository` và `SupabasePlanRepository` để lưu trữ và phân vùng dữ liệu theo `household_code`. Hệ thống đăng ký kênh lắng nghe Supabase Realtime (WebSockets) để mọi thao tác thêm/sửa/xóa Món ăn trong Menu, xếp Kế hoạch và gửi Comment dặn dò đều tự động nhảy ngay lập tức trên các điện thoại khác trong gia đình mà không cần tải lại trang. Nếu chưa cấu hình Supabase, ứng dụng tự động fallback về `LocalStorage` an toàn. Trên thanh tiêu đề (AppHeader) hiển thị chấm tròn trạng thái (🟢 Đang đồng bộ Online / 🟡 Chế độ máy Local). Cung cấp file script SQL tạo bảng tự động và hướng dẫn chi tiết 3 phút tạo Supabase miễn phí.

**Blocked by:** 05: Cascade Delete khi xóa Món ăn khỏi Menu và Giới hạn lịch sử 2 tuần

**Status:** closed

- [x] Cung cấp file script SQL `supabase/schema.sql` khởi tạo 4 bảng (`households`, `dishes`, `plan_items`, `plan_comments`), ràng buộc ON DELETE CASCADE và kích hoạt Supabase Realtime
- [x] Xây dựng client kết nối `src/services/supabaseClient.ts` và cơ chế phát hiện cấu hình tự động
- [x] Hiện thực hóa `SupabaseDishRepository` hỗ trợ lấy danh sách, thêm, sửa, xóa Món ăn trên Cloud theo `household_code`
- [x] Hiện thực hóa `SupabasePlanRepository` hỗ trợ lập Kế hoạch, gỡ món, thêm comment và dọn dẹp lịch sử quá 2 tuần trên Cloud
- [x] Thiết lập kênh lắng nghe Realtime Websocket tự động reload dữ liệu khi có thay đổi từ thiết bị khác trong gia đình
- [x] Kiến trúc Chế độ kép (Dual Mode): Tự động dùng Supabase khi có key, tự động dùng LocalStorage khi không có key
- [x] Hiển thị chấm trạng thái kết nối (🟢 Online / 🟡 Chế độ máy) trên AppHeader
- [x] Viết tài liệu hướng dẫn tạo Supabase 3 phút bằng tiếng Việt tại `docs/SUPABASE_SETUP.md`
- [x] Bổ sung bộ test tự động kiểm tra cơ chế Dual Mode và đảm bảo 100% test hiện tại tiếp tục pass
