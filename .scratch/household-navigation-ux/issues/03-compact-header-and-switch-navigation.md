# 03: Header gọn và đổi Thành viên/Gia đình trong Kế hoạch

**What to build:** Header có Mã nhà để chia sẻ và nút tên mở đúng hai thao tác đổi; màn chọn Thành viên có lối về chọn Gia đình, các bước đổi được nhớ qua F5.

**Blocked by:** 02 — Ghi nhớ Thành viên khi F5 và mở lại.

**Status:** resolved

- [x] Header gọn một hàng; Mã nhà mở hộp chia sẻ đầy đủ mã/link/sao chép, thay nút Chia sẻ riêng.
- [x] Tên trên Kế hoạch mở đúng Đổi gia đình / Đổi thành viên; trên Menu không có menu đổi. Bỏ nhãn Online/Chế độ máy thường trực và nút đổi nằm trực tiếp ở header.
- [x] Đổi Thành viên giữ Gia đình và mở danh sách; Đổi Gia đình mở màn chọn Gia đình. Nút về chọn Gia đình dùng được khi danh sách người đang tải, lỗi hoặc trống.
- [x] Mỗi thao tác đổi ghi bước đang chọn ngay, không có đường Hủy tự khôi phục người cũ. F5 và tab mới tuân theo trạng thái gần nhất, kể cả bước đổi chưa hoàn tất ở tab khác.
- [x] Tên/mã dài vẫn tiếp cận được và không làm tràn; menu dùng được bằng bàn phím, đóng khi chọn/bấm ngoài/Escape; lời hướng dẫn chia sẻ dùng thuật ngữ Thành viên.
- [x] Kiểm thử App cho menu, đổi, quay lại, chia sẻ, tác giả sau đổi và Q15; kiểm tra trình duyệt cho header màn hẹp và nhiều tab.

Phụ thuộc 02 vì các lối đổi mới phải cập nhật trạng thái được nhớ và khôi phục đúng quy tắc, thay vì tạo một cơ chế lưu song song.

## Context

**Parent:** 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình.

Áp dụng đặc tả Ghi nhớ Thành viên và cải thiện điều hướng Gia đình đã chốt Q1–Q15, glossary của dự án, ADR-0008 và phần bổ sung ADR-0007. Giữ ranh giới kiểm thử đã xác nhận: App cho luồng người dùng, database thật cho cạnh tranh, trình duyệt cho bố cục và nhiều tab theo phạm vi ticket.

## Comments

- 2026-10-11: Xuất bản theo skill to-tickets sau khi người dùng chấp nhận bản chia 7 ticket và các cạnh phụ thuộc. Trạng thái ready-for-agent; chưa bắt đầu triển khai.
- 2026-10-11: Triển khai hoàn tất bởi Implementer Subagent theo quy trình TDD. Toàn bộ 212 tests (25 test files) và build production đều vượt qua 100%.

## Answer

### Implementation Summary
1. **Compact Single-Row AppHeader (`src/components/AppHeader.tsx`)**:
   - Redesigned into a single compact bar (`px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2`).
   - Left side: Pill button for Household Code (`data-testid="household-code-badge"`, `title="Mã nhà: {code}"`), clicking opens `ShareHouseholdModal` via `onOpenShare`.
   - Right side:
     - On **Plan tab**: Interactive member button (`data-testid="member-name-button"`, `aria-haspopup="menu"`, `aria-expanded`), clicking or pressing Enter/Space toggles a dropdown menu.
     - Dropdown menu (`role="menu"`) provides exactly two options:
       - "Đổi gia đình" (`role="menuitem"`, calls `onSwitchHousehold`).
       - "Đổi thành viên" (`role="menuitem"`, calls `onSwitchMember`).
     - Closes on menuitem click, clicking outside, or pressing `Escape`.
     - On **Menu tab**: Display-only badge (`data-testid="member-name-badge"`), no interactive dropdown menu.
   - Removed persistent `sync-status-badge` and direct header switch buttons.
   - Text truncation with `truncate`, `min-w-0`, and accessible titles/aria-labels.

2. **MemberSelection Back Navigation (`src/components/MemberSelection.tsx` & `.css`)**:
   - Added `onBackToHousehold?: () => void` prop.
   - Rendered `.ms-back-household` button ("Đổi gia đình", `data-testid="back-to-household-button"`) in `.ms-brand-header`.
   - Styled pill button with `min-height: 36px`, accessible focus states, and responsive styling.
   - Usable across all 4 states: loading, error, empty, and loaded list of members.

3. **App Integration & Navigation Persistence (`src/App.tsx`)**:
   - Wired `onBackToHousehold={handleSwitchHousehold}` to `<MemberSelection />`.
   - `handleSwitchHousehold` immediately transitions to `choosing_household` and sets storage state so reloads / new tabs stay in household selection without restoring previous member.

4. **Terminology Update (`src/components/ShareHouseholdModal.tsx`)**:
   - Updated copy to: *"Người thân chỉ cần mở link này trên điện thoại và chọn Thành viên để vào cùng Nhà."*

### Test Coverage & Verification
- Unit test suites created:
  - `tests/components/AppHeader.test.tsx` (8 tests): compact layout, household code button opens share modal, removal of persistent sync badge, dropdown menu on Plan tab, display-only on Menu tab, keyboard controls, click outside, truncation.
  - `tests/components/MemberSelectionNavigation.test.tsx` (4 tests): back button renders and works in loading, error, empty, and populated states.
  - `tests/components/ShareHouseholdModal.test.tsx` (1 test): verifies updated terminology.
- Integration tests updated and passing:
  - `tests/integration/household-session.test.tsx` (11 tests): verified member and household switching via header menu, back button on MemberSelection persisting across F5.
  - `tests/integration/household-setup.test.tsx` (6 tests).
  - `tests/integration/dual-mode-realtime.test.tsx` (6 tests).
  - `tests/integration/member-selection.test.tsx` (22 tests).
- Overall suite: 25 test files, 212 tests passing.
- Production build: `npm run build` succeeds cleanly.
