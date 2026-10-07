# 01: Core Member Selection Modal & Session Gate

**What to build:**
Mỗi khi người dùng mở ứng dụng web hoặc tải lại trang (F5) khi đã có Mã nhà (`household_code`), ứng dụng luôn hiển thị màn hình chọn Thành viên ("Hôm nay ai vào bếp?") phong cách Netflix trước khi vào màn hình Kế hoạch tuần. Danh sách các Thành viên trong nhà được hiển thị dạng lưới 2 cột thẻ vuông bo tròn mềm mại (`rounded-3xl`) với biểu tượng ẩm thực ngộ nghĩnh trên nền màu pastel ấm áp (đúng tone màu Kế hoạch). Khi người dùng chạm vào thẻ của mình, ứng dụng mở khóa và chuyển vào màn hình Kế hoạch với danh tính Thành viên đó (tên và icon hiển thị trên thanh tiêu đề, tự động gán vào bình luận dặn dò). Khi tải lại trang web, màn hình chọn Thành viên luôn xuất hiện trở lại.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Khi ứng dụng khởi động và phát hiện đã có `household_code` trong bộ nhớ, nếu chưa chọn Thành viên thì hiển thị màn hình chọn Thành viên ("Hôm nay ai vào bếp?") che phủ trước khi vào Kế hoạch.
- [ ] Hiển thị badge Mã nhà (`Mã: BEP-XXX`) màu kem (`#FEF7DC`) viền `#EFE4B5` và tiêu đề "Hôm nay ai vào bếp?" với màu chữ xanh `#334E68`.
- [ ] Danh sách Thành viên được tải từ `MemberRepository` (hỗ trợ cả `LocalStorageMemberRepository` và `SupabaseMemberRepository`).
- [ ] Giao diện lưới 2 cột thẻ vuông bo tròn mềm mại (`rounded-3xl`), mỗi thẻ gồm biểu tượng ẩm thực tròn lớn (🍳, 🥗, 🍜, 🥑, 🍰, 🍕, 🥕, 🍲) trên nền màu pastel tương ứng và tên Thành viên in đậm to rõ bên dưới.
- [ ] Chạm vào thẻ Thành viên sẽ lưu Thành viên vào phiên làm việc hiện tại và chuyển vào màn hình Kế hoạch (hoặc Menu) ngay lập tức mà không cần mã PIN hay mật khẩu (zero-friction).
- [ ] Trên thanh tiêu đề (`AppHeader`), tên và icon của Thành viên đang chọn hiển thị rõ ràng bên cạnh mã nhà.
- [ ] Khi viết bình luận dặn dò trong chi tiết món ăn của Kế hoạch, tên Thành viên đang hoạt động được tự động gán vào trường tác giả (`author_nickname`).
- [ ] Tải lại trang (F5) hoặc mở tab mới trong phiên khác sẽ xóa danh tính đang chọn trong bộ nhớ tạm và hiển thị lại màn hình chọn Thành viên.
- [ ] Bổ sung bảng `members` trong `supabase/schema.sql` cùng các chính sách bảo mật RLS và publication realtime.
- [ ] Bộ kiểm thử tự động (Unit & Integration tests) bao phủ trọn vẹn luồng hiển thị màn hình chọn, chọn thành viên và chuyển cảnh vào Kế hoạch.
