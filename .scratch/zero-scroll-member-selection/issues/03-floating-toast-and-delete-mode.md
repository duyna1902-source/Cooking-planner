# 03: Thông báo Toast nổi không xô lệch chiều cao & Tối ưu chế độ Xóa

**What to build:** Nâng cấp thông báo phản hồi (sau khi thêm hoặc xóa Thành viên thành công) thành dạng Toast nổi phía trên nút đáy, có vai trò trợ năng `role="status"`, tự động biến mất sau 3 giây, hoàn toàn không đẩy xô lệch các nút bên dưới. Khi người dùng bật chế độ quản lý "Xóa", thanh nút "+ Thêm thành viên" (hoặc dòng thông báo đã đạt tối đa 6 người) được ẩn đi để người dùng tập trung vào tác vụ xóa; khi bấm "Xong" hoặc khi xóa hết thì tự động thoát chế độ xóa và hiển thị lại nút tương ứng.

**Blocked by:** 01: Bố cục cố định không cuộn (Zero-Scroll) và Lưới thích ứng 2–3 cột, 02: Giới hạn tối đa 6 Thành viên và Chặn lưu ở Form

**Status:** resolved

- [x] Thông báo sau khi thêm hoặc xóa Thành viên hiển thị dạng Toast nổi (overlay) trên màn hình, không chiếm chiều cao của layout chính.
- [x] Thông báo có thuộc tính `role="status"`, hiển thị icon dấu kiểm và nội dung thông báo rõ ràng, tự động mờ dần và biến mất sau 3 giây.
- [x] Khi bật chế độ quản lý "Xóa" (bấm nút "Xóa" trên header), nút "+ Thêm thành viên" (hoặc thông báo đạt tối đa) được ẩn đi.
- [x] Khi bấm "Xong" hoặc hủy chế độ xóa, nút "+ Thêm thành viên" (hoặc thông báo đạt tối đa) xuất hiện lại bình thường.
- [x] Toàn bộ 149+ bài kiểm thử hiện có tiếp tục vượt qua 100%, không xảy ra bất kỳ lỗi hồi quy nào.

## Answer

### Implementation Details
1. **Toast Overlay Notification (`.ms-notice`, `.ms-toast`)**:
   - Re-architected feedback message into a floating overlay toast positioned with `position: absolute; bottom: 60px; left: 24px; right: 24px; z-index: 20;`.
   - Guaranteed zero layout reflow and zero vertical flex calculation disturbance.
   - Retained accessible `role="status"` with checkmark icon and informative feedback text.
   - Added subtle entry animation (`@keyframes ms-toast-in`) and click-to-dismiss behavior.
   - Added `animation: none !important;` in `@media (prefers-reduced-motion: reduce)`.

2. **Auto-Dismiss Timer (3000ms)**:
   - Added `useEffect` in `MemberSelection.tsx` watching `notice` state to schedule `setNotice('')` after 3000ms.
   - Included clean-up handling on component unmount and when notice changes or is cleared.

3. **Delete Management Mode bottom-area optimization**:
   - Conditionally rendered `.ms-add-area` (`!managing && <div className="ms-add-area">...</div>`).
   - When entering delete mode (`managing = true`), both "+ Thêm thành viên" button and 6-member capacity notice are completely removed from the DOM to focus user attention purely on deletion.
   - When exiting delete mode (tapping "Xong" or auto-exiting when the last member is deleted), `.ms-add-area` reappears with the appropriate action/notice.

### Test Verification
- Added comprehensive unit tests in `tests/components/MemberSelection.test.tsx` verifying floating toast overlay classes, role, 3-second auto-dismiss lifecycle with fake timers, delete mode bottom-area toggle, and auto-exit restoration.
- Added integration tests in `tests/integration/member-selection.test.tsx` exercising the full lifecycle through `App`.
- Ran full test suite via `npx vitest run`: all 20 test files and 178 tests passed with 0 regressions.
