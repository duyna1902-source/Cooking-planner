# Cooking Plan

Ứng dụng web giúp Gia đình quản lý **Menu** Món ăn và lập **Kế hoạch** ăn uống hàng tuần. Giao diện tiếng Việt được thiết kế cho điện thoại, hỗ trợ PWA và đồng bộ dữ liệu giữa các thiết bị qua Supabase Realtime.

## Tính năng

- Tạo hoặc tham gia Gia đình bằng Mã nhà; chia sẻ liên kết để cùng sử dụng Menu và Kế hoạch.
- Lưu danh sách Gia đình đã tham gia để chọn lại trên trình duyệt.
- Thêm, chọn và xóa Thành viên; mỗi Gia đình có tối đa 6 Thành viên mới theo cấu hình database hiện tại.
- Ghi nhớ Gia đình và Thành viên đang dùng, kiểm tra Thành viên trong database khi mở lại ứng dụng.
- Thêm, sửa, xóa và tìm kiếm Món ăn trong Menu.
- Lập Kế hoạch theo tuần cho bữa sáng, trưa và tối; mặc định hiển thị bữa tối.
- Gửi bình luận dặn dò cho từng Món ăn trong Kế hoạch.
- Đồng bộ Menu, Kế hoạch và danh sách Thành viên giữa các thiết bị.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện | React 18, TypeScript, Tailwind CSS, Lucide React |
| Công cụ phát triển | Vite, vite-plugin-pwa |
| Database và đồng bộ | Supabase PostgreSQL, Supabase Realtime |
| Kiểm thử | Vitest, Testing Library, jsdom |

## Cài đặt và chạy

Chuẩn bị Node.js 22 trở lên, npm và một project Supabase để sử dụng đầy đủ ứng dụng. Sau khi clone repository, mở terminal tại thư mục project.

### 1. Cài dependencies

```sh
npm ci
```

### 2. Thiết lập database

Với project Supabase mới, chạy toàn bộ nội dung [supabase/schema.sql](supabase/schema.sql) trong SQL Editor. Script tạo các bảng, quyền truy cập, giới hạn Thành viên và cấu hình Realtime.

Với database đã dùng phiên bản cũ, áp dụng các migration còn thiếu theo thứ tự:

1. [20261008_create_member.sql](supabase/migrations/20261008_create_member.sql): tạo bảng Thành viên nếu chưa có.
2. [20261008_member_delete.sql](supabase/migrations/20261008_member_delete.sql): bổ sung quyền xóa và cấu hình Realtime cho Thành viên.
3. [20261011_member_limit.sql](supabase/migrations/20261011_member_limit.sql): giới hạn thêm Thành viên khi Gia đình đã có 6 người.

Tham khảo thêm [hướng dẫn thiết lập Supabase](docs/SUPABASE_SETUP.md).

### 3. Cấu hình biến môi trường

Sao chép `.env.example` thành `.env.local`.

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS / Linux:

```sh
cp .env.example .env.local
```

Điền thông tin của project Supabase vào `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Thay các giá trị mẫu bằng Project URL và khóa `anon` / public của bạn. Các biến `VITE_*` được đưa vào mã chạy trên trình duyệt, vì vậy không dùng khóa `service_role`. `.env.local` đã được loại khỏi Git qua `.gitignore`.

**Lưu ý về chế độ local:** repository của Menu và Kế hoạch có fallback sang LocalStorage khi thiếu cấu hình Supabase, nhưng thao tác Thành viên vẫn yêu cầu database. Bạn cần cấu hình Supabase để hoàn tất luồng chọn Thành viên và vào ứng dụng chính.

### 4. Khởi động

```sh
npm run dev
```

Mở địa chỉ được Vite hiển thị trong terminal, mặc định là `http://localhost:5173`. Khởi động lại dev server sau khi thay đổi biến môi trường.

### 5. Sử dụng lần đầu

1. Tạo Gia đình hoặc nhập Mã nhà đã có.
2. Thêm hoặc chọn Thành viên trên màn hình **Bạn là ai?**.
3. Vào **Menu** để thêm Món ăn.
4. Vào **Kế hoạch**, chọn ngày và bữa ăn, rồi thêm Món ăn từ Menu.
5. Chia sẻ Mã nhà hoặc liên kết tham gia để các Thành viên sử dụng trên thiết bị khác.

## Các lệnh phát triển

| Lệnh | Mục đích |
| --- | --- |
| `npm run dev` | Chạy dev server |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm test` | Chạy bộ kiểm thử một lần |
| `npm run test:watch` | Chạy kiểm thử ở chế độ theo dõi thay đổi |
| `npm run build` | Kiểm tra TypeScript và build ứng dụng vào `dist/` |
| `npm run preview` | Xem bản build trên máy local |
| `npm run prototype:members` | Mở prototype màn chọn Thành viên tại cổng 5174 trong môi trường phát triển |

Để xem bản build:

```sh
npm run build
npm run preview
```

Khi triển khai lên dịch vụ hosting, dùng lệnh build `npm run build`, thư mục đầu ra `dist` và cấu hình hai biến môi trường Supabase trước khi build. Repository đã có [vercel.json](vercel.json) để xử lý đường dẫn SPA trên Vercel.

## Cấu trúc project

```text
src/
  components/       Giao diện Menu, Kế hoạch, Gia đình và Thành viên
  domain/           Kiểu dữ liệu và quy tắc nghiệp vụ
  hooks/            React hooks dùng chung
  services/         Repository Supabase, LocalStorage và cấu hình kết nối
  App.tsx           Luồng ứng dụng chính
  main.tsx          Điểm khởi chạy
supabase/
  schema.sql        Schema cho database mới
  migrations/       Các bản cập nhật database
tests/              Kiểm thử domain, services, components và integration
public/             Tài nguyên tĩnh
docs/               Hướng dẫn và quyết định kiến trúc
CONTEXT.md          Thuật ngữ và mô hình nghiệp vụ
```

Tìm hiểu thêm tại [CONTEXT.md](CONTEXT.md) và [các quyết định kiến trúc](docs/adr/).
