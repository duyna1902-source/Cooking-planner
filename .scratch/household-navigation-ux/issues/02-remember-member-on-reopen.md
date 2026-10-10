# 02: Ghi nhớ Thành viên khi F5 và mở lại

**What to build:** Sau khi chọn người, F5/mở lại vào Kế hoạch bằng Thành viên đã được kiểm tra với database; link tham gia và nhiều tab dùng đúng lựa chọn đã chốt.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Lưu và khôi phục Gia đình + định danh Thành viên qua hợp đồng storage hiện có; thông tin từ bản chỉ nhớ Mã nhà vẫn dùng được, còn Biệt danh cục bộ không dùng để tự chọn người.
- [x] Có trạng thái tải trước khi mở nội dung; Thành viên hợp lệ được khôi phục, người đã xóa dẫn về chọn với thông báo, lỗi tải giữ lựa chọn và có Thử lại cùng lối về chọn Gia đình.
- [x] Mô hình lưu hỗ trợ chọn Gia đình, chọn Thành viên và đã chọn người. Tạo/tham gia, chọn người và thao tác đổi Gia đình hiện có cập nhật đúng trạng thái; F5 khi đang ở các bước này không quay vào người cũ.
- [x] Các tab đang chạy giữ riêng lựa chọn, tab mới/F5 lấy trạng thái gần nhất; tab cũ trở lại từ nền hoặc request đến muộn không tự ghi đè trạng thái mới hơn.
- [x] Link khác Gia đình mở chọn người, link cùng Gia đình giữ lựa chọn hợp lệ; xử lý chỉ thị tham gia một lần và bảo toàn các phần URL khác.
- [x] Kiểm thử App qua storage/repository được truyền vào cho khôi phục, xóa người, lỗi/retry, chuyển mã và phản hồi đến muộn; có kiểm tra trình duyệt cho F5/tab mới/PWA theo phạm vi đã chốt.

Ticket này chưa tạo menu tên mới hoặc các ô lịch sử; có thể chứng minh bằng chọn Thành viên và các lối tạo/tham gia/đổi Gia đình hiện có.

## Context

**Parent:** 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình.

Áp dụng đặc tả Ghi nhớ Thành viên và cải thiện điều hướng Gia đình đã chốt Q1–Q15, glossary của dự án, ADR-0008 và phần bổ sung ADR-0007. Giữ ranh giới kiểm thử đã xác nhận: App cho luồng người dùng, database thật cho cạnh tranh, trình duyệt cho bố cục và nhiều tab theo phạm vi ticket.

## Comments

- 2026-10-11: Xuất bản theo skill to-tickets sau khi người dùng chấp nhận bản chia 7 ticket và các cạnh phụ thuộc. Trạng thái ready-for-agent; chưa bắt đầu triển khai.
- 2026-10-11: Đã hoàn thành triển khai theo TDD (red-green-refactor) và nghiệm thu 100% tiêu chí chấp nhận theo ADR-0008.

## Answer

### Giải pháp đã thực hiện:
1. **Hợp đồng Storage (`src/services/storage.ts`)**:
   - Định nghĩa kiểu `HouseholdNavigationState` với 3 trạng thái rõ ràng:
     - `{ status: 'choosing_household' }`
     - `{ status: 'choosing_member'; householdCode: string }`
     - `{ status: 'selected'; householdCode: string; memberId: string }`
   - Bổ sung `getNavigationState()` và `setNavigationState(state)` vào interface `HouseholdStorage`, áp dụng cho cả `LocalStorageHouseholdStorage` và `InMemoryHouseholdStorage`.
   - Lưu trữ an toàn dưới key `cooking_plan_navigation_state`.
   - Tương thích ngược (backward compatibility) và an toàn (tamper-proof): nếu dữ liệu cũ chỉ có `cooking_plan_household_code`, hệ thống khôi phục trạng thái `{ status: 'choosing_member', householdCode }` và **tuyệt đối không** dùng `cooking_plan_nickname` để tự ý suy diễn Thành viên. Khi JSON bị hỏng hoặc thiếu trường, fallback an toàn về `choosing_household`.
   - `clearSession()` dọn dẹp sạch toàn bộ khóa liên quan bao gồm `cooking_plan_navigation_state`.

2. **Xác thực và Điều hướng trong `App.tsx`**:
   - Khi khởi động hoặc F5 ở trạng thái `selected`: hiển thị trạng thái đang tải (`role="status"`, `Đang kiểm tra Thành viên...`) và gọi `memberRepository.getMembers(householdCode)` để xác thực Thành viên với cơ sở dữ liệu.
   - Nếu Thành viên hợp lệ: mở trực tiếp `PlanView` mà không bắt chọn lại.
   - Nếu Thành viên đã bị xóa khỏi DB: tự động chuyển storage về `choosing_member`, mở màn hình `MemberSelection` và hiển thị thông báo giải thích (`Thành viên đã bị xóa khỏi Gia đình. Vui lòng chọn lại.`).
   - Nếu gặp lỗi kết nối/mạng: giữ nguyên định danh trong storage, hiển thị banner lỗi với nút "Thử lại" và nút "Đổi gia đình".
   - Kiểm soát race conditions / phản hồi đến muộn bằng `verificationVersionRef`: nếu người dùng đổi Gia đình hoặc Thành viên trong khi request xác thực cũ đang chạy, kết quả cũ sẽ bị bỏ qua hoàn toàn.
   - Xử lý link tham gia `?join=CODE`:
     - Nếu khác `householdCode`: chuyển về `choosing_member` với mã mới.
     - Nếu cùng `householdCode`: giữ nguyên Thành viên hợp lệ.
     - Dọn dẹp tham số `join` qua `window.history.replaceState` một lần duy nhất mà vẫn bảo toàn các query param khác.
   - Hỗ trợ đổi tường minh:
     - Nút "Đổi thành viên" trên AppHeader của màn hình Kế hoạch: cập nhật storage về `choosing_member`, đưa người dùng về chọn người; F5 lúc này vẫn ở `choosing_member`.
     - Nút "Đổi gia đình" trên AppHeader: cập nhật storage về `choosing_household`, đưa người dùng về màn hình nhập/tạo mã; F5 lúc này vẫn ở `choosing_household`.
   - Độc lập đa tab (Multi-tab independence theo ADR-0008 / Q15): các tab đang chạy duy trì phiên làm việc độc lập trong bộ nhớ, không bị tab khác ghi đè qua focus/visibilitychange; tab mới mở hoặc F5 sẽ nhận trạng thái lưu mới nhất.

3. **Kiểm thử (TDD)**:
   - `tests/services/storage.test.ts`: 8 unit test kiểm thử hợp đồng storage, tính tương thích ngược và phục hồi JSON hỏng.
   - `tests/integration/household-session.test.tsx`: 10 integration test kiểm thử toàn diện mọi kịch bản của Ticket 02.
   - Cập nhật các test cũ trong `household-setup.test.tsx` và `member-selection.test.tsx` theo chuẩn ADR-0008.
   - Toàn bộ 22 test file (199 test) pass 100%, lệnh `npm run build` hoàn thành không lỗi.
