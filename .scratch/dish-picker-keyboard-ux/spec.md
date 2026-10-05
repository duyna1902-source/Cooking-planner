Status: completed

# Đặc tả kỹ thuật: Tối ưu trải nghiệm tìm kiếm và chọn Món ăn trên thiết bị di động (Dish Picker Mobile Search UX)

## Problem Statement

Khi thành viên gia đình sử dụng điện thoại di động để lên Kế hoạch ăn uống, họ mở ngăn chọn Món ăn (Dish Picker Drawer) và nhập từ khóa vào ô tìm kiếm (ví dụ tìm theo phân loại "Món mặn"). Khi bàn phím ảo của hệ điều hành xuất hiện:
- Chiều cao khả dụng của màn hình bị giảm xuống hơn một nửa (chỉ còn khoảng 300px - 350px).
- Ngăn chọn Món ăn bị khống chế chiều cao tối đa theo tỷ lệ phần trăm nhỏ, khiến toàn bộ diện tích dọc bị các thành phần cố định chiếm hết: vạch kéo, tiêu đề kèm mô tả phụ, ô tìm kiếm, thẻ gợi ý thêm Món ăn ghim ở đáy và nút xác nhận.
- Kết quả là danh sách các Món ăn tìm thấy bị ép về kích thước gần bằng 0 hoặc bị đẩy ra ngoài vùng nhìn thấy, khiến người dùng hoàn toàn không nhìn thấy và không thể chọn được các Món ăn phù hợp trừ khi phải tìm cách đóng bàn phím.
- Đồng thời, thẻ gợi ý "Chưa có trong Menu?" hiện tại luôn hiển thị dạng thẻ lớn cố định ngay cả khi có rất nhiều Món ăn phù hợp, gây lãng phí không gian màn hình quý giá.

## Solution

Tối ưu hóa toàn diện giao diện và tương tác của ngăn chọn Món ăn trên thiết bị di động:
1. **Mở rộng chiều cao và loại bỏ giới hạn cứng**: Cho phép ngăn chọn Món ăn tận dụng tối đa chiều cao khả dụng phía trên bàn phím ảo; loại bỏ giới hạn chiều cao tối đa cứng ở danh sách Món ăn để danh sách tự co giãn lấp đầy không gian.
2. **Thu gọn phần đầu (Header) khi tìm kiếm**: Tự động ẩn dòng phụ đề hướng dẫn khi người dùng đang tìm kiếm hoặc focus ô tìm kiếm, gom tiêu đề và nút đóng thành một hàng duy nhất để nhường chỗ cho danh sách.
3. **Chuyển thẻ thêm Món ăn mới vào bên trong danh sách cuộn**: Thẻ gợi ý thêm Món ăn mới không còn ghim cố định ở đáy mà nằm ở cuối danh sách cuộn (sau Món ăn cuối cùng). Danh sách Món ăn tìm thấy sẽ hiển thị ngay sát dưới ô tìm kiếm. Khi không có kết quả nào, hiển thị dạng trạng thái rỗng (Empty State) gọn gàng ở giữa danh sách với nút tạo Món ăn mới.
4. **Tự động hạ bàn phím khi vuốt duyệt danh sách (Dismiss on scroll)**: Khi người dùng chạm và vuốt danh sách kết quả, bàn phím tự động hạ xuống giúp mở rộng lại toàn bộ màn hình mà không làm mất từ khóa tìm kiếm hay danh sách kết quả. Cho phép chạm chọn Món ăn trực tiếp ngay cả khi bàn phím đang mở.
5. **Tinh gọn nút Xác nhận ở đáy**: Nút xác nhận được tinh giản khoảng đệm để chiếm ít diện tích dọc nhất có thể.

## User Stories

1. As a family member planning meals on mobile, I want the dish picker drawer to expand to full visible viewport height above the keyboard, so that I have the maximum possible vertical space to browse dishes.
2. As a family member planning meals on mobile, I want the list of dishes to immediately appear directly below the search input, so that I can see matching dishes without closing the keyboard.
3. As a family member searching for a category like "Món mặn", I want all matching dishes to be clearly visible and scrollable, so that I can pick the ones I want for the meal.
4. As a family member searching for dishes, I want the subtitle in the drawer header to collapse when search is active, so that wasted vertical space is eliminated.
5. As a family member searching for dishes, I want the drawer header to retain the meal title and close button on a single compact line, so that I always know which meal I am picking dishes for.
6. As a family member searching for dishes, I want the quick-add dish banner to appear at the bottom of the scrollable list instead of sticky at the bottom, so that it does not occlude search results when space is tight.
7. As a family member scrolling down past all matching dishes, I want to find the quick-add dish banner at the end of the list, so that I can still create a new dish if existing matches do not satisfy my need.
8. As a family member entering a search query with zero matching dishes, I want to see a clean, centered empty state with a quick-add dish button, so that I can immediately create the missing dish without confusion.
9. As a family member entering a search query with zero matching dishes, I want a quick "Clear search" action in the empty state, so that I can reset the search query with one tap.
10. As a family member typing a search query that exactly matches an existing dish name (case-insensitive and trimmed), I want the quick-add banner to be hidden, so that our family Menu remains free of accidental duplicates.
11. As a family member browsing search results with the keyboard open, I want swiping or scrolling the dish list to automatically dismiss the soft keyboard, so that the screen expands back to full height immediately.
12. As a family member browsing search results, I want dismissing the keyboard via scrolling to preserve my search query and filter state, so that I don't lose my current search context.
13. As a family member browsing search results with the keyboard open, I want to be able to tap any dish item to select or unselect it immediately without the keyboard intercepting or dropping the tap, so that selection is frictionless.
14. As a family member selecting dishes, I want the confirm button at the bottom of the drawer to remain sticky and compact, so that I can finalize my selection at any time with a single tap.
15. As a family member clicking the quick-add button, I want the dish modal to open with the search query pre-filled, so that I do not have to retype the dish name.
16. As a family member saving a newly created dish from the picker, I want the new dish to be saved to our Menu and automatically added to the active meal along with any pre-checked dishes, so that my workflow is seamless.
17. As a family member canceling the dish modal, I want to return to the picker drawer with my previous selections and search query intact, so that accidental cancellations do not erase my work.
18. As a desktop or tablet user, I want the drawer to maintain its centered, comfortable card layout, so that the mobile optimization does not degrade the desktop experience.

## Implementation Decisions

### 1. Viewport & Sizing Dynamics in Dish Picker Drawer
- Remove the rigid height clamp on the dish list container, converting it into a purely flexible, scrollable region with boundary containment (`overscroll-contain`) that naturally absorbs whatever remaining height exists in the drawer.
- On mobile viewports, allow the drawer container to occupy the full available height above the virtual keyboard (`92dvh` / full visible viewport), while retaining standard centered modal limits on larger desktop screens.

### 2. Header Compaction
- Check whether a search query is actively entered or whether the search input has focus.
- When search is active, suppress the secondary guidance subtitle ("Tick chọn Món ăn từ Menu của gia đình") to reclaim vertical height.
- Retain the main meal title ("Chọn Món ăn cho [Bữa Tối]") and the dismiss button inline on a single row.

### 3. In-List Placement of Quick-Add Action
- Move the quick-add action from a sticky bottom banner to inside the scrollable list container:
  - **When matching dishes exist**: The quick-add prompt is rendered as a clean, styled item appended at the end of the dish list, keeping the search results directly adjacent to the search input.
  - **When zero dishes match**: Render a compact empty-state presentation in the center of the list area displaying the unfound message, a primary action button to create the new dish, and a quick-clear link.
- Preserve exact-match suppression logic: if the trimmed query matches an existing dish name exactly (case-insensitive), suppress the quick-add option.
- Maintain existing test hooks (`data-testid="picker-quick-add-banner"` and `data-testid="picker-quick-add-btn"`) to preserve testability.

### 4. Touch & Scroll Keyboard Dismissal
- Attach scroll/touch-drag event handling on the scrollable dish list container.
- When a scroll gesture occurs, trigger `blur()` on the search input element, gently collapsing the virtual keyboard while retaining search input state and scroll position.
- Ensure dish item click/touch targets are immediately responsive and not blocked by keyboard dismissal events.

### 5. Sticky Confirm Footer Compaction
- Keep the confirm button pinned at the bottom of the drawer container.
- Tidy vertical margins and button padding to minimize vertical footprint while preserving standard mobile tap target accessibility.

## Testing Decisions

### What Makes a Good Test
Tests should verify user-observable behavior through component integration seams without asserting on private internal states or specific layout measurements that headless environments cannot compute. Tests should simulate user typing, scrolling, selecting items, creating new dishes via the quick-add flow, and confirming selections into the weekly plan.

### Seams Tested
- **Primary Integration Seam**: `PlanView` integration suite (rendering `PlanView` with in-memory `DishRepository` and `PlanRepository`).
  - Opening the dish picker drawer for an active meal.
  - Searching for dishes by partial text and tag (e.g., "Món mặn").
  - Verifying matching dishes appear and are selectable.
  - Verifying the quick-add banner appears at the end of the results or in the empty state.
  - Verifying exact-match suppression.
  - Combining pre-checked dishes and newly created dishes.

### Prior Art
- `tests/integration/weekly-plan.test.tsx`: Existing tests for drawer opening, dish selection, and quick-add creation.
- `tests/integration/menu-management.test.tsx`: Prior art for in-list quick-add banner and empty state rendering.

## Out of Scope

- Changing search algorithm or ranking logic (fuzzy search, phonetic matching).
- Restructuring the global application shell or bottom navigation.
- Modifying dish creation fields or validation rules in `DishModal`.

## Further Notes

- This specification supersedes the sticky bottom banner placement originally defined in `.scratch/quick-add-dish-from-search/spec.md`, aligning the picker drawer's in-list quick-add pattern with the design already established in `MenuView`.
