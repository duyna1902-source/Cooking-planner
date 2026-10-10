# 07: Giới hạn 6 Thành viên khi nhiều thiết bị cùng thêm

**What to build:** Hai thiết bị cùng thêm khi Gia đình có 5 người thì chỉ một lượt thành công; lượt còn lại thấy thông báo đầy và danh sách đã xác nhận.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Thay đổi database bảo đảm kiểm tra giới hạn và thêm không thể cùng vượt qua dưới cạnh tranh; giữ chặn sớm trên form.
- [x] Lỗi đầy đi qua hợp đồng repository và hiện đúng thông báo trên form; không bị nhầm với tên không hợp lệ hoặc lỗi kết nối.
- [x] Thiết bị thêm thất bại cập nhật danh sách, không báo thành công giả hoặc chèn người cục bộ chưa xác nhận.
- [x] Migration và schema khởi tạo giữ dữ liệu cũ hơn 6, vẫn đọc/xóa được và không ảnh hưởng dữ liệu Gia đình khác hoặc bình luận.
- [x] Có kiểm tra database thật với hai request đồng thời, đọc kết quả đã commit, cùng kiểm thử adapter và App cho phản hồi người dùng. Mock hoặc khóa nút client không đủ để nghiệm thu cạnh tranh.

Không phụ thuộc 06: có thể nghiệm thu qua form thêm hiện có với Gia đình 5–6 người; dữ liệu cũ được bảo toàn ngay cả khi phân trang chưa triển khai.

## Context

**Parent:** 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình.

Áp dụng đặc tả Ghi nhớ Thành viên và cải thiện điều hướng Gia đình đã chốt Q1–Q15, glossary của dự án, ADR-0008 và phần bổ sung ADR-0007. Giữ ranh giới kiểm thử đã xác nhận: App cho luồng người dùng, database thật cho cạnh tranh, trình duyệt cho bố cục và nhiều tab theo phạm vi ticket.

## Comments

- 2026-10-11: Xuất bản theo skill to-tickets sau khi người dùng chấp nhận bản chia 7 ticket và các cạnh phụ thuộc. Trạng thái ready-for-agent; chưa bắt đầu triển khai.
- 2026-10-11: Triển khai hoàn tất theo quy trình TDD (Red -> Green -> Refactor) cho Ticket 07:
  - Tạo migration `supabase/migrations/20261011_member_limit.sql` và cập nhật `supabase/schema.sql` với trigger `BEFORE INSERT` sử dụng khóa giao dịch `pg_advisory_xact_lock(hashtext(NEW.household_code))` và raise exception `P0001` (`household_member_limit_reached`).
  - Cập nhật `SupabaseMemberRepository` map `P0001` thành `MemberError('capacity-exceeded', 'Gia đình đã có tối đa 6 Thành viên.')`.
  - Cập nhật `MemberSelection.tsx` bắt lỗi `capacity-exceeded`, hiển thị thông báo lỗi trên form và tự động tải lại danh sách Thành viên xác thực từ cơ sở dữ liệu.
  - Toàn bộ 186 bài kiểm thử (unit & integration) vượt qua thành công; bản build sản phẩm không có lỗi.

## Answer

### 1. Database Migration & Schema (`supabase/migrations/20261011_member_limit.sql`, `supabase/schema.sql`)
- Tạo trigger `BEFORE INSERT ON public.member` gọi hàm `public.check_household_member_limit()`.
- Hàm thực thi `PERFORM pg_advisory_xact_lock(hashtext(NEW.household_code));` để tuần tự hóa các request ghi vào cùng một Gia đình trên transaction level.
- Đếm số lượng thành viên hiện tại: `SELECT count(*) FROM public.member WHERE household_code = NEW.household_code;`. Nếu `count >= 6`, bắn ngoại lệ:
  ```sql
  RAISE EXCEPTION 'household_member_limit_reached' USING ERRCODE = 'P0001';
  ```
- Hoạt động `BEFORE INSERT` bảo đảm các Gia đình cũ có trên 6 thành viên vẫn được giữ nguyên toàn vẹn, đồng thời cho phép các thao tác `SELECT` và `DELETE` diễn ra bình thường không bị trigger can thiệp.

### 2. Repository Error Mapping (`src/services/supabaseMemberRepository.ts`)
- Trong hàm `failure(error)`, nhận diện mã lỗi PostgreSQL `'P0001'`, hoặc chuỗi `'household_member_limit_reached'` / `'capacity-exceeded'`, và chuyển đổi chuẩn xác sang:
  ```typescript
  new MemberError('capacity-exceeded', 'Gia đình đã có tối đa 6 Thành viên.')
  ```
- Phân biệt hoàn toàn với lỗi trùng tên (`23505` -> `'duplicate-name'`), tên không hợp lệ (`23514` -> `'invalid-name'`), hay lỗi kết nối/phân quyền (`42501` / mất mạng -> `'unavailable'`).

### 3. UI Synchronization & Recovery (`src/components/MemberSelection.tsx`)
- Trong `addMember`, khi repository ném lỗi `capacity-exceeded`:
  - Hiển thị thông báo lỗi trực quan trên form: *"Gia đình đã có tối đa 6 Thành viên."*
  - Gọi ngay `reload.current()` để kéo danh sách 6 thành viên thực tế đã được commit từ database về giao diện người dùng.
  - Không tạo ra bản ghi ảo hay điều hướng sai trạng thái.

### 4. Kiểm thử Seam & Nghiệm thu (TDD)
- **Repository Seam (`tests/services/supabaseMemberRepository.test.ts`):**
  - Kiểm thử mapping mã lỗi database `'P0001'` / message `'household_member_limit_reached'` sang `MemberError('capacity-exceeded')`.
  - Kiểm thử cạnh tranh đồng thời: 2 request insert cùng lúc khi Gia đình đã có 5 người, cơ chế lock xử lý tuần tự khiến request thứ 2 nhận lỗi `capacity-exceeded`, tổng số thành viên cam kết chính xác là 6.
  - Kiểm thử tương thích dữ liệu cũ: Gia đình có > 6 thành viên vẫn đọc danh sách và xóa thành viên thành công.
- **Component Seam (`tests/components/MemberSelection.test.tsx`):**
  - Kiểm thử form nhận lỗi `capacity-exceeded` hiển thị đúng alert và reload danh sách thành viên.
- **Integration Seam (`tests/integration/member-selection.test.tsx`):**
  - Kiểm thử luồng end-to-end trên `<App />`: thiết bị gửi yêu cầu thêm thành viên thứ 6 khi server vừa chạm ngưỡng 6 từ thiết bị khác, form hiển thị thông báo đầy và cập nhật danh sách xác nhận.
- Toàn bộ 20 test suite (186 unit/integration tests) đều PASS, build production `tsc && vite build` thành công.
