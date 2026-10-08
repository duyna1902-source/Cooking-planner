# 01: Bố cục cố định không cuộn (Zero-Scroll) và Lưới thích ứng 2–3 cột

**What to build:** Màn hình chọn Thành viên vừa vặn hoàn toàn trong một khung nhìn không cuộn trên mọi kích thước thiết bị di động. Danh sách Thành viên tự động thích ứng: hiển thị 2 cột với avatar lớn khi có 1–4 người, và chuyển sang 3 cột với avatar vừa khi có 5–6 người. Hình vẽ minh họa cái chảo trang trí, slogan và câu quote chân trang tự động ẩn đi khi danh sách có từ 5 người trở lên hoặc trên màn hình chiều cao thấp (< 680px) để ưu tiên toàn bộ không gian cho các nút bấm Thành viên. Nút "+ Thêm thành viên" được tinh gọn thành thanh dẹt phẳng ở đáy.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Toàn bộ màn hình chọn Thành viên không bao giờ xuất hiện thanh cuộn dọc (zero-scroll), nội dung hiển thị vừa vặn trong 1 màn hình.
- [x] Khi Gia đình có 1–4 Thành viên, danh sách hiển thị dạng lưới 2 cột với avatar lớn (~76px) và nhãn tên rõ ràng.
- [x] Khi Gia đình có 5–6 Thành viên, danh sách tự động chuyển sang lưới 3 cột với avatar vừa (~58px) chia đều 2 hàng.
- [x] Khi có từ 5 Thành viên trở lên hoặc màn hình có chiều cao < 680px, phần hình vẽ cái chảo trang trí và quote footer tự động ẩn để giữ layout không bị tràn.
- [x] Nút "+ Thêm thành viên" hiển thị dạng thanh phẳng nhỏ gọn ở đáy màn hình, bỏ dòng chữ chú thích phụ.
- [x] Người dùng vẫn có thể bấm chọn Thành viên để vào Kế hoạch và mở form thêm Thành viên bình thường.
- [x] Kiểm thử tích hợp xác nhận giao diện thích ứng 2–3 cột và toàn bộ luồng chọn Thành viên hoạt động ổn định.

## Answer

### Implementation Details
1. **Zero-Scroll Root Flex Layout**:
   - Replaced `.ms-scroll` scroll container with a fixed, non-scrolling flex column layout: `.member-selection` and `.ms-surface` enforce `overflow: hidden; height: 100%`.
   - Dedicated flexible member container (`.ms-member-container`) takes `flex: 1; min-height: 0` to center member grid or empty state without any vertical scrolling.
2. **Adaptive Member Grid (2 vs 3 Columns)**:
   - Evaluated `gridColumns = members.length >= 5 ? 3 : 2`.
   - 1–4 members: 2-column grid (`.ms-grid-cols-2`, `data-columns="2"`) with 76px avatar circles and 14px typography.
   - 5–6 members: 3-column grid (`.ms-grid-cols-3`, `data-columns="3"`) with 58px avatar circles, tighter gaps, and 12px typography.
   - Touch targets for member buttons are guaranteed to be >= 44x44px (`min-width: 44px; min-height: 44px`).
3. **Progressive Compaction**:
   - Compaction activates when `members.length >= 5` (`data-compact="true"` and `.ms-compact` class) and via CSS media query `@media (max-height: 680px)`.
   - Greeting artwork (`.ms-greeting-art`), slogan eyebrow (`.ms-eyebrow`), and footer quote (`.ms-footer`) are hidden in compact mode.
4. **Streamlined Flat Add Button**:
   - Redesigned "+ Thêm thành viên" into a flat pill button (`.ms-add`) at the bottom.
   - Removed secondary caption `"Mỗi người một tên. Cùng một căn bếp."`.
   - Full interactive flow (open modal, add member, tap member to choose) verified intact.

### Verification
- **TDD Workflow**: Added integration tests in `tests/integration/member-selection.test.tsx` and unit tests in `tests/components/MemberSelection.test.tsx` which initially failed (RED) and now pass (GREEN).
- **All Tests Passing**: Ran `npx vitest run`, 19 test files passed, 160/160 tests passed.
- **Production Build**: Ran `npm run build` (`tsc && vite build`), build succeeded with 0 errors.
