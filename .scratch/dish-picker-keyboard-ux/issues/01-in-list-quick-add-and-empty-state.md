# 01: In-list Quick Add and Empty State

**What to build:** In the dish picker drawer, move the quick-add dish prompt from a sticky bottom banner into the scrollable list at the end of search results, and render a centered empty state with a quick-add action and clear search option when zero matches are found.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] When search query yields partial matching dishes, render matching dishes directly beneath the search input without any sticky bottom banner occluding the list.
- [x] Render the quick-add dish prompt at the very end of the scrollable list after the last matching dish.
- [x] When search query yields zero matching dishes, display a centered empty state showing "Không tìm thấy Món ăn nào phù hợp với \"...\"", a quick-add button, and a "Xóa tìm kiếm" button.
- [x] Keep the quick-add prompt hidden when the trimmed query exactly matches an existing dish name (case-insensitive).
- [x] Tapping the quick-add button opens the dish creation modal with pre-filled name, retaining seamless persistence into Menu and the active meal upon saving.
- [x] Preserve existing test IDs (`picker-quick-add-banner` and `picker-quick-add-btn`) for test compatibility.
