# 03: Dismiss Keyboard on Scroll and Integration Tests

**What to build:** Automatically dismiss the mobile virtual keyboard when the user scrolls or touches the dish list container, ensure immediate tap-to-select responsiveness without keyboard event blocking, and verify all integration tests in `weekly-plan.test.tsx` pass.

**Blocked by:** 02: Responsive Drawer Viewport and Compaction

**Status:** closed

- [x] Add scroll and touch-move listeners on the dish list container to blur the search input, smoothly collapsing the virtual keyboard on mobile without resetting search state.
- [x] Ensure tapping on any dish item selects or deselects it immediately without being swallowed or delayed by the keyboard dismissal.
- [x] Verify existing and new integration tests in `weekly-plan.test.tsx` pass, asserting on in-list quick add, empty state, search filtering, and dish scheduling into the active meal.

