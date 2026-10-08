# Spec: Màn hình chọn Thành viên cố định không cuộn (Zero-Scroll Member Selection)

Status: ready-for-agent

## Problem Statement

Hiện tại, khi một Gia đình có từ 5 Thành viên trở lên hoặc người dùng mở ứng dụng trên các thiết bị di động có chiều cao màn hình hạn chế (như iPhone SE, hoặc khi thanh công cụ của trình duyệt chiếm diện tích), màn hình chọn Thành viên bị tràn dọc và buộc người dùng phải kéo vuốt lên xuống để tìm tên mình hoặc bấm nút thêm thành viên. Điều này làm giảm trải nghiệm trực quan ("bước vào bếp nhanh chóng"), dễ che khuất nút hành động "+ Thêm thành viên", và khiến giao diện có cảm giác cồng kềnh, thiếu tính tối ưu cho thiết bị di động.

## Solution

Cải thiện toàn diện giao diện và trải nghiệm (UI/UX) của màn hình chọn Thành viên thành một bố cục cố định (zero-scroll), không bao giờ xuất hiện thanh cuộn hay yêu cầu kéo vuốt trên bất kỳ thiết bị nào, trong khi vẫn giữ nguyên vẹn 100% các tính năng hiện có:
- Mỗi Gia đình có giới hạn tối đa 6 Thành viên.
- Lưới Thành viên tự động điều chỉnh linh hoạt: hiển thị 2 cột với avatar lớn khi có 1–4 Thành viên, và tự động chuyển sang 3 cột với avatar vừa khi có 5–6 Thành viên.
- Tự động thu gọn lũy tiến (progressive compaction): ẩn hình minh họa trang trí và câu trích dẫn chân trang khi danh sách có từ 5 người trở lên hoặc khi chiều cao màn hình ngắn (< 680px) để dành trọn không gian cho danh sách.
- Nút "+ Thêm thành viên" được tinh gọn thành thanh phẳng ở đáy, tự động thay thế bằng thông báo trạng thái khi đã đủ 6 người và tự động ẩn khi đang ở chế độ xóa.
- Thông báo phản hồi sau khi thêm hoặc xóa hiển thị dạng Toast nổi tự tắt, tuyệt đối không làm trồi sụt hay xô lệch vị trí các nút bấm.

## User Stories

1. As a Thành viên in a Gia đình with 1 to 4 members, I want to see avatar cards arranged in a comfortable 2-column grid, so that I can easily recognize and tap my name without feeling crowded.
2. As a Thành viên in a Gia đình with 5 or 6 members, I want the grid to automatically switch to a balanced 3-column layout, so that all members fit cleanly onto the screen at once without any vertical scrolling.
3. As a Thành viên using a small mobile screen (such as iPhone SE or a browser with active URL bars), I want decorative artwork and footer quotes to gracefully collapse, so that the members grid and action buttons remain fully visible and touch-accessible.
4. As a new user opening an empty Gia đình, I want to see a welcoming empty state with an invitation and a direct add button, so that I can add the first Thành viên effortlessly.
5. As a Thành viên wanting to join the cooking session, I want to tap my avatar card and immediately navigate to the Kế hoạch view, so that I can start viewing meals and notes right away.
6. As a family member looking at the screen, I want each member button to maintain an ergonomic touch target size of at least 44x44px, so that I never mis-tap another person's name on a touch screen.
7. As a family organizer wanting to add a new member, I want to tap the compact "+ Thêm thành viên" button at the bottom, so that the name input dialog appears without cluttering the screen.
8. As a family organizer whose Gia đình already has 6 members, I want the add button to be replaced with a gentle status notice stating that the 6-member limit has been reached, so that I know why no further members can be added.
9. As a user attempting to add a 7th member, I want the system to reject the action with a clear message "Gia đình đã có tối đa 6 Thành viên.", so that data integrity and screen capacity limits are strictly respected.
10. As a user entering a duplicate name (case-insensitive and trimmed), I want to see an immediate validation error, so that two identical names do not exist in the same Gia đình.
11. As a user entering an invalid name (empty or longer than 30 characters), I want to see a validation error and keep my current draft, so that I can correct it easily.
12. As a family organizer needing to remove an old member, I want to tap the "Xóa" button in the header, so that all member avatars display red delete indicators.
13. As a family organizer in delete mode, I want the "+ Thêm thành viên" button to disappear while delete mode is active, so that my focus is solely on managing the current member list.
14. As a family organizer tapping a member to delete, I want to see a confirmation dialog asking for explicit confirmation, so that I do not accidentally delete anyone by mistake.
15. As a family organizer confirming a deletion, I want past Kế hoạch meals and historical comments by that member to remain intact, so that family cooking history is preserved.
16. As a family organizer finishing deletion, I want to tap "Xong" (or have delete mode auto-exit if the last member was removed), so that the screen returns to standard selection mode.
17. As a user after successfully adding a member, I want to see a floating toast notification that auto-dismisses after 3 seconds, so that I receive confirmation without my buttons jumping up and down.
18. As a user after successfully deleting a member, I want to see a floating toast notification that auto-dismisses after 3 seconds, so that I am informed without disrupting screen layout.
19. As a user experiencing network loss or database error when loading members, I want to see a clear error banner and a "Thử lại" button, so that I can recover once connectivity is restored.
20. As a user with members being added or deleted in realtime from another device, I want the screen to reactively update its grid columns and layout without overflowing or creating a scrollbar, so that the family stays in sync seamlessly.

## Implementation Decisions

### 1. Viewport Containment & Zero-Scroll Architecture
- The root member selection container enforces `overflow: hidden` (replacing the previous `overflow-y: auto` scroll container).
- The vertical hierarchy is structured as a non-scrolling flex column (`display: flex; flex-direction: column; height: 100%`) partitioned into:
  - Header: Brand logo + "Xóa"/"Xong" management action.
  - Greeting section: Title "Bạn là ai?", role prompt, and household code badge.
  - Dynamic member container: Adaptive grid taking the flexible remaining space (`flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center`).
  - Bottom action area: Fixed compact add button or capacity notice.
  - Feedback layer: Absolute floating toast overlay positioned above the bottom area without occupying layout height.

### 2. Adaptive Member Grid Modes
- **0 Members**: Centered empty state graphic and title, maintaining touch clearance for the add action.
- **1–4 Members**: 2-column grid (`grid-template-columns: repeat(2, minmax(0, 1fr))`), with generous avatar size (~76–80px) and 14px name typography.
- **5–6 Members**: 3-column grid (`grid-template-columns: repeat(3, minmax(0, 1fr))`), with compacted avatar size (~56–60px), 12–13px single/double-line name typography, and tighter gaps.

### 3. Progressive Compaction Rules
- When `members.length >= 5` OR when viewport height is constrained (< 680px):
  - Decorative greeting artwork (pan illustration and abstract shapes) is hidden.
  - Top slogan eyebrow and bottom quote text are hidden.
  - Padding and margin scales are reduced to compact variants.
  - Title and household badge remain visible and legible.

### 4. Six-Member Limit Enforcement
- Hard constraint: maximum 6 members per household.
- UI layer: When `members.length >= 6`, the add button is replaced with an accessible informative label: `"Đã đạt tối đa 6 Thành viên trong Gia đình"`. The modal trigger cannot be activated.
- Form/Submission layer: In the submission handler, if `members.length >= 6`, the form displays an inline error `"Gia đình đã có tối đa 6 Thành viên."` and does not dispatch repository calls.

### 5. Floating Toast Notification
- The notice banner (`role="status"`) is positioned as an overlay with `position: absolute; bottom: 60px; left: 24px; right: 24px; z-index: 20;`.
- Features a subtle slide/fade transition and automatically dismisses after 3 seconds or on next user interaction, guaranteeing zero layout reflow.

### 6. Delete Management Mode
- Toggled via the existing header button (`aria-pressed`).
- When active, member avatars display delete badges, and the bottom add action is hidden to maximize clarity and avoid mixed intent.

## Testing Decisions

### What makes a good test
- Tests must verify observable user behavior and accessibility contracts rather than internal DOM nesting or CSS implementation details.
- Sizing constraints are verified via component states, adaptive CSS classes/data attributes, and accessibility roles (`button`, `dialog`, `status`, `alert`, `heading`).
- The full interactive lifecycle (render -> select -> add -> limit enforcement -> delete -> toast -> realtime sync) must be exercised at the integration level.

### Testing Seams
- **Primary Seam**: The top-level `App` component (`tests/integration/member-selection.test.tsx`), using injected test repositories (`InMemoryHouseholdStorage`, `TestMemberRepository`). This tests the full user journey and regression-tests integration with `PlanView`, `MenuView`, and modal flows.
- **Unit / Responsive Layout Seam**: Direct testing of `MemberSelection` rendering under different member counts (0, 1, 4, 5, 6) verifying:
  - 2-column layout mode for <= 4 members.
  - 3-column layout mode for 5-6 members.
  - Presence of add button for < 6 members.
  - Replacement with capacity limit text when member count is 6.
  - Enforcement of error when trying to save a 7th member.
  - Toast visibility with `role="status"` without altering container structure.

### Prior Art
- `tests/integration/member-selection.test.tsx`: Existing 13 integration tests covering member selection, async saving, duplicate name validation, delete confirmation, and storage preservation.
- `tests/integration/household-setup.test.tsx`: Verification of onboarding and PWA shell interactions.

## Out of Scope

- Changing the database schema for the `member` table (the 6-member limit is enforced at application/domain level).
- Multi-household management on the member selection screen (switching households remains accessible from Plan view after selecting a member).
- Custom user avatars / photo uploads (avatars continue to use distinctive color tones and the first letter of the name).
- Offline queuing or local sync for member creations (consistent with ADR-0006, member operations require cloud confirmation).

## Further Notes

- All 149 existing tests across the test suite must continue to pass without regression.
- Keyboard navigation (Tab, Enter, Escape) and focus trapping in dialogs must remain intact.
