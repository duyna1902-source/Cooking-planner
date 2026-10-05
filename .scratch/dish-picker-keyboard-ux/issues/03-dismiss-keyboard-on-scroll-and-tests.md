# 03: Dismiss Keyboard on Scroll and Integration Tests

**What to build:** Automatically dismiss the mobile virtual keyboard when the user scrolls or touches the dish list container, ensure immediate tap-to-select responsiveness without keyboard event blocking, and verify all integration tests in `weekly-plan.test.tsx` pass.

**Blocked by:** 02: Responsive Drawer Viewport and Compaction

**Status:** resolved

- [x] Add scroll and touch-move listeners on the dish list container to blur the search input, smoothly collapsing the virtual keyboard on mobile without resetting search state.
- [x] Ensure tapping on any dish item selects or deselects it immediately without being swallowed or delayed by the keyboard dismissal.
- [x] Verify existing and new integration tests in `weekly-plan.test.tsx` pass, asserting on in-list quick add, empty state, search filtering, and dish scheduling into the active meal.

## Answer

Added `onScroll` and `onTouchMove` event handlers on the scrollable dish list container that blur the search input, smoothly collapsing the mobile virtual keyboard upon scrolling or dragging without resetting the search query. Dish item selection remains immediate and unaffected upon tap. Added comprehensive integration tests in `weekly-plan.test.tsx` asserting keyboard blur on scroll/touchmove and immediate selection behavior, and verified the entire integration suite passes cleanly.


