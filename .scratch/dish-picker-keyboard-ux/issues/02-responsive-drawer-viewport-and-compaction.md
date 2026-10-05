# 02: Responsive Drawer Viewport and Compaction

**What to build:** Expand the dish picker drawer on mobile viewports to utilize full available height above the virtual keyboard, remove artificial maximum height clamps on the dish list so it stretches naturally, collapse the header subtitle when searching, and compact the sticky confirm button padding.

**Blocked by:** 01: In-list Quick Add and Empty State

**Status:** resolved

- [x] On mobile viewports, allow the drawer to expand up to `max-h-[92dvh]` (or full available viewport height above keyboard) while keeping comfortable `sm:max-h-[85%]` on desktop.
- [x] Remove the rigid `max-h-[300px]` limit on the dish list container, replacing it with `flex-1 min-h-0 overflow-y-auto overscroll-contain` so it naturally expands to fill all remaining height.
- [x] Hide the secondary subtitle ("Tick chọn Món ăn từ Menu của gia đình") in the drawer header whenever search is active (search query is not empty or search input has focus), keeping the main meal title and close button on one compact row.
- [x] Compact the sticky confirm button at the footer (e.g. `py-2.5`, tighter vertical padding/margins) to maximize the vertical area allocated to the dish list.

## Answer

Expanded mobile drawer maximum height to `max-h-[92dvh]` (`sm:max-h-[85%]` on larger screens) with `picker-drawer-container` test ID. Removed rigid `max-h-[300px]` limit on the dish list in favor of `flex-1 min-h-0 overflow-y-auto overscroll-contain`. Added conditional rendering to hide the subtitle (`picker-drawer-subtitle`) when search is focused or query is non-empty. Compacted footer button padding to `py-2.5` with tighter spacing. Added integration tests covering viewport constraints, dynamic list expansion, and subtitle toggling during search interactions.

