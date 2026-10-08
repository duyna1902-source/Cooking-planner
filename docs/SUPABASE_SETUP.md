# Hướng Dẫn Thiết Lập Supabase Realtime Trong 3 Phút 🚀

Tài liệu này hướng dẫn cách kết nối cơ sở dữ liệu Supabase Cloud hoàn toàn miễn phí để kích hoạt tính năng **Đồng bộ thời gian thực đa thiết bị** cho ứng dụng Lập Kế Hoạch Bữa Ăn Gia Đình (Cooking Planner PWA).

---

## Bước 1: Tạo Project Supabase Miễn Phí (1 phút)

1. Truy cập [https://supabase.com](https://supabase.com) và bấm **Start your project** (hoặc đăng nhập bằng tài khoản GitHub / Google).
2. Chọn **New Project** và điền thông tin:
   - **Name**: `cooking-planner` (hoặc tên tùy thích).
   - **Database Password**: Chọn một mật khẩu an toàn.
   - **Region**: Chọn vùng gần bạn nhất (ví dụ: `Singapore` cho tốc độ kết nối nhanh nhất tại Việt Nam).
   - **Pricing Plan**: Chọn **Free Plan**.
3. Bấm **Create new project** và đợi khoảng 1-2 phút để Supabase khởi tạo.

---

## Bước 2: Chạy Script Tạo Bảng & Kích Hoạt Realtime (30 giây)

1. Trong thanh điều hướng bên trái của Supabase Dashboard, chọn biểu tượng **SQL Editor** (hoặc nhấn phím tắt `Shift + S`).
2. Bấm nút **+ New query**.
3. Mở file [schema.sql](file:///d:/Project/Cooking/supabase/schema.sql) trong thư mục `supabase/schema.sql`, sao chép toàn bộ nội dung và dán vào ô soạn thảo SQL.
4. Bấm nút **Run** (hoặc `Ctrl + Enter` / `Cmd + Enter`).
5. Kết quả báo `Success. No rows returned` là cơ sở dữ liệu đã sẵn sàng với:
   - 5 bảng: `households`, `dishes`, `plan_items`, `plan_comments`, `member`.
   - Ràng buộc tự động xóa tầng (`ON DELETE CASCADE`).
   - Kênh Supabase Realtime qua WebSockets.

Với project đã có 4 bảng cũ, chạy riêng `supabase/migrations/20261008_create_member.sql` trong SQL Editor để thêm bảng `member`, ràng buộc tên duy nhất theo Mã nhà và Supabase Realtime. Migration không tạo Thành viên mẫu hoặc tự chuyển Biệt danh cũ thành Thành viên.

---

## Bước 3: Lấy Thông Tin Kết Nối (30 giây)

1. Trên menu trái, chọn biểu tượng **Project Settings** (bánh răng) -> chọn mục **API**.
2. Tại đây, bạn sẽ thấy 2 thông số:
   - **Project URL**: Có dạng `https://xxxxxxxxxxxxxxxx.supabase.co`
   - **Project API Keys**: Copy giá trị của khóa `anon` / `public`.

---

## Bước 4: Cấu Hình Biến Môi Trường (30 giây)

Tạo file `.env.local` (hoặc sửa file `.env`) tại thư mục gốc của dự án với nội dung:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Lưu ý**: Hãy thay thế `https://xxxxxxxxxxxxxxxx.supabase.co` và chuỗi token bằng giá trị thực tế lấy từ Bước 3.

---

## Bước 5: Khởi Động & Kiểm Tra

1. Chạy lệnh:
   ```bash
   npm run dev
   ```
2. Mở trình duyệt tại `http://localhost:5173`.
3. Quan sát góc trên bên phải thanh tiêu đề (AppHeader):
   - Chấm trạng thái sẽ hiển thị: **🟢 Online** (hoặc di chuột thấy tooltip *Đang đồng bộ Online*).
   - (Nếu chưa cấu hình hoặc cấu hình sai, hệ thống tự động hiển thị **🟡 Chế độ máy** và lưu trữ qua LocalStorage an toàn).
4. **Thử nghiệm Đa Thiết Bị**:
   - Mở ứng dụng trên 2 tab trình duyệt khác nhau (hoặc trên điện thoại cùng tham gia chung một `Mã nhà`).
   - Thêm một Món ăn mới hoặc bình luận dặn dò trên một máy.
   - Máy còn lại sẽ lập tức hiển thị dữ liệu mới trong tích tắc mà **không cần bấm F5 / reload trang**!
