Status: completed

# Đặc tả kỹ thuật: Thêm Món ăn mới từ ô tìm kiếm vào Menu và Kế hoạch (Phương án A - Sticky Action Banner)

## Problem Statement

Khi các thành viên gia đình đang lên Kế hoạch ăn uống hoặc đang tìm kiếm trong Menu, họ thường xuyên muốn thêm một Món ăn mới chưa từng có trước đây. Trước đây, khi gõ tìm kiếm trong Drawer chọn Món ăn của Kế hoạch mà không thấy, người dùng bị chặn lại bởi thông báo "Không tìm thấy Món ăn nào phù hợp" và buộc phải hủy bỏ phiên làm việc, chuyển qua tab Menu để thêm món mới thủ công, rồi quay lại Kế hoạch để tìm và chọn lại từ đầu. Trải nghiệm đứt gãy này gây mất thời gian và gây ức chế cho người dùng trên thiết bị di động.

## Solution

Cung cấp tính năng thêm nhanh Món ăn mới trực tiếp ngay trong luồng tìm kiếm theo thiết kế **Phương án A (Sticky Action Banner)**:
1. **Trong Drawer chọn Món ăn của Kế hoạch**: Khi người dùng gõ từ khóa tìm kiếm mà chưa trùng 100% với bất kỳ Món ăn nào có sẵn, một Thẻ Hành Động Ghim Đáy (Sticky Action Banner) với màu pastel kem (`#FEF7DC`) xuất hiện cố định ngay phía trên thanh xác nhận: `Chưa có "[tên món]" trong Menu? [ + Thêm món ]`. Bấm vào sẽ mở modal chỉnh sửa chi tiết xếp lớp nổi lên trên Drawer với trường tên được tự động điền sẵn và cắt khoảng trắng thừa. Khi nhấn Lưu, Món ăn mới được lưu vào **Menu** đồng thời tự động thêm ngay vào Bữa ăn đang chọn của ngày đó trong **Kế hoạch** (gộp cùng các Món ăn đã tick chọn trước đó) và đóng Drawer.
2. **Trong tab Menu**: Khi tìm kiếm Món ăn trong Menu mà chưa trùng 100% với món nào, hiển thị banner gợi ý thêm Món ăn mới tương tự. Khi lưu thành công, Món ăn mới được lưu vào Menu và từ khóa tìm kiếm được giữ nguyên để Món ăn mới hiển thị ngay lập tức trong danh sách kết quả.

## User Stories

1. As a family member planning meals, I want to see a sticky action banner at the bottom of the dish picker drawer when my search query does not match any existing Món ăn 100%, so that I can easily create the missing dish without leaving my planning workflow.
2. As a family member planning meals, I want the sticky action banner to display the exact dish name I typed, so that I have clear visual confirmation of what dish will be created.
3. As a family member planning meals, I want the sticky action banner to be styled with our warm pastel cream color scheme (`#FEF7DC`) and dashed border, so that it clearly distinguishes itself from the regular list of existing dishes.
4. As a family member planning meals, I want the sticky action banner to appear even when partial search matches exist, so that I can still create a new dish if existing similar dishes do not match my intent.
5. As a family member planning meals, I want the sticky action banner to be completely hidden when my search query matches an existing Món ăn name 100% (case-insensitive and trimmed), so that our family Menu remains free of accidental duplicate dishes.
6. As a family member planning meals, I want the sticky action banner to stay fixed above the confirm button even while I scroll through partial search results, so that the action is always within easy reach of my thumb on mobile.
7. As a family member planning meals, I want tapping the "+ Thêm món" button on the banner to open a dish creation modal directly over the drawer, with the dish name pre-filled and automatically trimmed of leading/trailing spaces.
8. As a family member planning meals, I want to be able to add an optional category tag (e.g. Món mặn, Canh, Xào) or refine the dish name in the modal, so that our Menu remains well categorized.
9. As a family member planning meals, I want the dish creation modal to validate the dish name before saving, so that invalid or empty names are caught with friendly validation messages.
10. As a family member planning meals, I want closing or canceling the modal to return me directly to the drawer with my search text and previously checked dishes intact, so that accidental taps do not discard my progress.
11. As a family member planning meals, I want saving the dish in the modal to automatically persist it to our household Menu and immediately schedule it for the active meal on the selected day in Kế hoạch.
12. As a family member planning meals, I want saving the dish to also include any dishes I had previously checked before searching, so that I do not have to perform multiple separate addition rounds.
13. As a family member planning meals, I want both the modal and the dish picker drawer to close automatically after saving, immediately revealing the newly planned dish in the weekly plan view.
14. As a family member browsing the Menu tab, I want to see an action banner to add a new Món ăn when searching in the Menu if the query does not match an existing dish 100%, so that the search-to-add UX is unified across the entire app.
15. As a family member browsing the Menu tab, I want saving a new dish from the search banner to preserve my current search query in the Menu, so that I immediately see my new dish reflected in the search results.
16. As a family member on a second device, I want newly created dishes and their meal plan assignments to sync in real-time, so that everyone in the household sees the up-to-date plan instantly.

## Implementation Decisions

### Layout & Visual Affordance: Variant A (Sticky Action Banner)
Following prototype validation of Variant A:
- **Banner Architecture**: In the dish picker drawer, a dedicated banner card is pinned directly above the confirm button footer. It uses the app's signature pastel cream background (`#FEF7DC`), a dashed accent border (`#EFE4B5`), and contains a spark icon `✨`, an explanatory label `Chưa có "[tên món]" trong Menu?`, and an actionable pill button `+ Thêm món`.
- **Zero-result State**: When zero dishes match the search query, the drawer list area shows the standard empty notification text, while the sticky action banner remains prominently available at the bottom for instant creation.

### Exact Match Suppression Logic
- Two dish names are an exact 100% match if `nameA.trim().toLowerCase() === nameB.trim().toLowerCase()`. Accented Vietnamese characters are preserved.
- When an exact match is detected in the Menu, the banner is suppressed to prevent creating duplicates.

### Stacking Order & Layering
- The dish creation modal is rendered with a higher stacking order (`z-[60]`) than the drawer (`z-50`).
- If the modal is dismissed/canceled, the drawer remains in its current state without re-rendering or wiping the active query.

### Dual Assignment Flow (Menu + Plan)
- When the modal form is submitted from within the drawer:
  1. The new dish is persisted to the dish repository, returning the newly created dish ID.
  2. The new dish ID is combined with all currently checked dish IDs in the drawer.
  3. The combined dish IDs are dispatched to the meal plan repository for the active date and meal.
  4. Both modal and drawer close simultaneously, and the weekly plan data is refreshed.

### Menu Tab Flow
- In the Menu management screen, if a search query is active and not an exact match, the action banner is rendered at the bottom of the filtered results.
- After saving via the modal, the search query is preserved so the newly created dish appears in the active filtered view.

## Testing Decisions

### What Makes a Good Test
Tests should verify user-observable behavior through component integration seams using `@testing-library/user-event`, without inspecting private internal component states.

### Modules Tested
1. **Weekly Plan Integration (`tests/integration/weekly-plan.test.tsx`)**:
   - Open dish picker drawer for a meal on an active date.
   - Enter a search query for a non-existent dish.
   - Verify the sticky action banner is visible with the pre-filled dish name.
   - Enter an exact matching query for an existing dish and verify the banner disappears.
   - Pre-select an existing dish, search for a new dish, tap "+ Thêm món" on the banner, enter a tag in the modal, and save.
   - Verify modal and drawer close, and both the pre-selected dish and the newly created dish appear in the active meal on Kế hoạch.
2. **Menu Management Integration (`tests/integration/menu-management.test.tsx`)**:
   - Search for a non-existent dish in the Menu view.
   - Verify the action banner is rendered.
   - Save via the modal and verify the query persists and the new dish is visible in the filtered list.

### Prior Art
- `tests/integration/weekly-plan.test.tsx`: Tests rendering `PlanView` with in-memory repositories.
- `tests/integration/menu-management.test.tsx`: Tests rendering `MenuView` with in-memory repositories.

## Out of Scope
- Direct inline editing of dish tags inside the banner without opening the modal (Variant C).
- Bulk adding multiple new dishes at once from a single search string.
- Scraped images or external web recipe fetching.

## Further Notes
- Prototype code in `prototype/index.html` serves as the primary visual reference for Variant A styling.
