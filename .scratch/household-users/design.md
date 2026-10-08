Status: ready-for-agent

# Chọn Thành viên trong Gia đình

## Yêu cầu đã nêu

- Sau khi tham gia một gia đình xác định, hiển thị màn hình hỏi người đang sử dụng là ai, với cách chọn tương tự Netflix.
- Luôn hiển thị bước chọn người dùng trước màn hình Kế hoạch trong mỗi lần mở web.
- Lưu tên người dùng trong database và hiển thị lại danh sách đã tạo ở những lần mở sau.
- Có nút thêm người dùng bên dưới danh sách trên màn hình chọn.
- Người dùng được thêm mới phải được lưu trong database và xuất hiện cùng những người dùng đã có ở các lần mở sau.

## Các quyết định đã chốt — vòng 1

1. User là một **Thành viên** thuộc một **Gia đình**, chỉ cần tên; không có mật khẩu hoặc PIN để chọn Thành viên.
2. Các Thành viên dùng chung Menu và Kế hoạch. Theo đề xuất Q2 đã được chấp nhận, Thành viên được chọn cung cấp tên tác giả cho bình luận mới.
3. Phải chọn lại Thành viên khi tải lại trang, mở tab mới hoặc khởi động lại PWA. Quay lại một tab/PWA vẫn đang chạy từ nền không phải chọn lại. Mỗi tab chọn Thành viên độc lập.
4. Thiết bị nhớ Gia đình đã tham gia nhưng không được tự chọn Thành viên khi mở lại. Màn hình chọn Thành viên luôn xuất hiện trước các màn hình Kế hoạch. Khi mở link tham gia Gia đình khác, dùng danh sách Thành viên của Gia đình đó.

## Các quyết định đã chốt — vòng 2

5. Gia đình chưa có Thành viên hiển thị danh sách trống và lời mời thêm, không tạo sẵn người nào. Nút **+ Thêm thành viên** luôn nằm dưới danh sách. Thêm thành công trở về danh sách; người dùng bấm tên Thành viên để vào Kế hoạch.
6. Tên dài 1–30 ký tự, không được trống. Không cho trùng tên trong cùng Gia đình khi bỏ qua khác biệt hoa/thường và khoảng trắng đầu/cuối. Gia đình khác có thể dùng cùng tên.
7. Phạm vi hiện tại có thêm, chọn và xóa Thành viên. Sau khi chọn prototype A, người dùng bổ sung thao tác xóa và yêu cầu bỏ nút cùng tính năng **Đổi thành viên** trong Kế hoạch. Thành viên được giữ trong phiên đang chạy; mở lại ứng dụng vẫn phải chọn. Đổi tên chưa thuộc phạm vi.
8. Danh sách ở màn hình chọn cập nhật ngay khi thiết bị khác thêm Thành viên trong cùng Gia đình.
9. Bản đầu yêu cầu kết nối database. Tải danh sách lỗi thì giữ màn hình chọn với **Thử lại**; thêm lỗi thì giữ tên đang nhập để thử lại. Chỉ báo thêm thành công khi database xác nhận đã lưu. Không tự dùng danh sách local để vượt qua bước chọn khi cloud lỗi.
10. Không tự tạo Thành viên từ Biệt danh cục bộ của phiên bản trước. Người dùng chọn người đã có hoặc chủ động thêm mới; không sửa bình luận cũ. Theo Q13 đã chốt, không điền tên cũ vào ô thêm.

## Yêu cầu thao tác database đã được cho phép

- Người dùng yêu cầu tự vào Supabase qua browser và tạo bảng **member** trong project **cooking plan**.
- Đã dùng Supabase Dashboard qua browser để tạo **public.member** trong project **cooking-planner**, project ref **ookbaokwcahtevihobnj**. URL project khớp `VITE_SUPABASE_URL` của repo.
- Đã áp dụng [migration](../../supabase/migrations/20261008_create_member.sql) và cập nhật [schema khởi tạo](../../supabase/schema.sql). Không chuyển Biệt danh cục bộ thành bản ghi và không tạo Thành viên mẫu.
- Đã xác minh bằng truy vấn chỉ đọc: bảng tồn tại, 0 bản ghi; cột `id UUID`, `household_code TEXT`, `name TEXT`, `created_at TIMESTAMPTZ`; CHECK tên 1–30 ký tự sau trim; unique index theo `(household_code, lower(btrim(name)))`; RLS bật; policy SELECT/INSERT cho `anon`; quyền đọc/thêm có hiệu lực; bảng nằm trong publication `supabase_realtime`.
- [Ảnh xác minh trên Supabase](./supabase-member-verification.jpg).
- Bảng phân vùng theo `household_code` như dữ liệu Menu/Kế hoạch hiện có; chưa thêm khóa ngoại tới `households` vì luồng tạo/tham gia hiện chưa ghi bản ghi vào bảng đó.

## Các quyết định đã chốt — vòng 3

11. Màn hình riêng **Bạn là ai?**, mỗi Thành viên là một ô có chữ cái đầu và tên; giữ màu xanh/kem hiện tại. Thành viên mới thêm nằm cuối danh sách; nút **+ Thêm thành viên** ở bên dưới.
12. **Không cho đổi Gia đình trên màn hình chọn Thành viên. Chỉ khi đã vào màn hình Kế hoạch mới có thao tác đổi Gia đình.** Sau khi tham gia Gia đình khác, phải chọn Thành viên thuộc Gia đình đó.
13. Ô tên khi thêm Thành viên luôn bắt đầu trống, không gợi ý Biệt danh cũ.

## Tổng hợp thiết kế

- [Đặc tả tổng hợp](./spec.md) ghi luồng, phạm vi và tiêu chí nghiệm thu cho 13 quyết định đã chốt.
- Không còn câu hỏi thiết kế đang mở. Người dùng đã yêu cầu xuất bản đặc tả bằng skill `to-spec`; bản tổng hợp được cập nhật thành spec sẵn sàng triển khai, bao gồm các thay đổi sau khi chọn prototype A.

## Xem trước giao diện theo yêu cầu của người dùng

- Người dùng yêu cầu dùng skill `prototype` để xem màn hình chọn Thành viên trước khi xác nhận thiết kế.
- Đã tạo [prototype ba bố cục](./prototype.md) trên route app hiện có, chỉ bật trong development: `/?prototype=members&variant=A|B|C`.
- Prototype dùng dữ liệu minh họa trong bộ nhớ; có thể thử Gia đình trống, thêm/chọn Thành viên và bước vào Kế hoạch. Không ghi dữ liệu vào bảng member thật.
- Đã kiểm tra trực tiếp trong browser, typecheck/build thành công và mã prototype không nằm trong bundle production.
- Người dùng đã chọn **A — Lưới như Netflix**, đồng thời yêu cầu thêm nút xóa Thành viên ở góc màn hình chọn.
- Đã lưu ba phương án gốc trên nhánh **codex/prototype-household-members-20261008**, commit **f07f7af5c8cc5b8ee99402b41d33dd62c20bb83c**; không thay nhánh đang làm việc hoặc đưa các thay đổi khác vào snapshot.
- Bản xem trước hiện giữ A, bổ sung nút góc trên bên phải để bật chế độ xóa, dấu thùng rác trên từng ô và hộp xác nhận có tên người được chọn. Luồng xóa trong prototype chỉ thay dữ liệu minh họa trong bộ nhớ.
- Đã cập nhật spec theo phạm vi có xóa; cần triển khai quyền xóa và đồng bộ database trong frontend thật.
- Theo yêu cầu tiếp theo, đã bỏ nút và luồng đổi Thành viên khỏi Kế hoạch/Menu trong prototype và đặc tả. Thao tác đổi Gia đình vẫn chỉ nằm ở Kế hoạch; vào Gia đình mới phải chọn Thành viên của Gia đình đó.

## Tài liệu liên quan

- [Thuật ngữ miền](../../CONTEXT.md)
- [ADR-0001: Mã nhà và Biệt danh cục bộ](../../docs/adr/0001-household-code-and-nickname-auth.md): quyết định lưu Biệt danh cục bộ sẽ được thay thế bởi ADR-0006 cho tính năng đang thiết kế.
- [ADR-0005: Đồng bộ chế độ kép](../../docs/adr/0005-dual-mode-supabase-sync.md): cần làm rõ cách lưu danh sách người dùng và hành vi khi không có kết nối.

## Thực trạng đã kiểm tra trong code

- `src/App.tsx:55–75` khôi phục Mã nhà và Biệt danh đã lưu để đi thẳng vào ứng dụng. Khi mở link tham gia gia đình khác, Biệt danh cũ vẫn được dùng lại nếu đã có.
- `src/services/storage.ts:9–10,29–39` lưu một Biệt danh duy nhất trong localStorage, chưa phân theo gia đình.
- `src/components/DishDetailDrawer.tsx:69–77`, `src/domain/plan.ts:208–214` và `supabase/schema.sql:40–46` gắn tác giả bình luận bằng tên, chưa tham chiếu người dùng bằng ID.
- `src/components/OnboardingModal.tsx:44–70` tạo/tham gia Gia đình bằng cách sinh hoặc kiểm tra định dạng Mã nhà; hiện chưa ghi hay xác minh Gia đình qua bảng `households` trong database.
- `src/services/repositoryFactory.ts:8–43` chọn cloud khi có cấu hình Supabase, local khi không có. Khi request cloud thất bại, chưa có cơ chế tự chuyển sang local.
- `src/App.tsx:116–165` hiện gắn onboarding dạng lớp phủ trong khi Kế hoạch vẫn được mount. Luồng mới cần giữ người dùng ở bước chọn Thành viên trước khi mở nội dung chính.

## Trạng thái

Đã hoàn tất các vòng hỏi của `grill-with-docs`, chọn prototype A và ghi nhận bổ sung xóa/bỏ đổi Thành viên. Theo yêu cầu dùng `to-spec`, đã xuất bản spec và cập nhật ticket triển khai với trạng thái ready-for-agent. Đã tạo và xác minh bảng member qua browser; frontend thật và quyền xóa database còn thuộc bước triển khai.

## Comments

- 2026-10-08: Spec dùng template của to-spec, gồm Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope và Further Notes. Đề xuất kiểm thử chính từ cấp App bằng storage/repository được truyền vào, thêm kiểm tra Supabase thật cho lưu dữ liệu và đồng bộ thêm/xóa; đã gửi câu hỏi kiểm tra cách kiểm thử theo yêu cầu của skill. Không có yêu cầu đổi cách kiểm thử tại thời điểm xuất bản.
