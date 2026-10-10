# 05: Bỏ Gia đình khỏi danh sách trên thiết bị

**What to build:** Menu trên ô cho quên một Gia đình sau xác nhận, giữ nguyên dữ liệu chung và cho vào lại bằng mã/link.

**Blocked by:** 04: Chọn nhanh các Gia đình đã lưu

**Status:** resolved

- [x] Nút ba chấm mở Bỏ khỏi danh sách; thao tác quản lý không vô tình chọn ô.
- [x] Xác nhận nêu đúng Mã nhà và ý nghĩa chỉ quên trên thiết bị; Hủy giữ ô, xác nhận gỡ đúng ô qua F5.
- [x] Không xóa Thành viên/Menu/Kế hoạch/bình luận hoặc đổi phiên đang mở ở tab/thiết bị khác.
- [x] Tab cũ render, trở lại từ nền hoặc tải dữ liệu không tự thêm lại ô đã quên; chỉ chủ động tham gia lại mới lưu lại ô.
- [x] Gỡ ô cuối vẫn có hai chức năng tạo/tham gia; vào lại bằng mã/link lưu lại đúng một ô và yêu cầu chọn người theo quy tắc đổi Gia đình.
- [x] Kiểm thử App cho xác nhận/hủy, bảo toàn dữ liệu, gỡ ô cuối, vào lại và hai tab cùng dùng danh sách; không chỉ kiểm tra thao tác xóa một khóa storage.

## Answer

### 1. Seams & Implementation
- **Contract & Storage Layer (`src/services/storage.ts`):**
  - Extended `removeSavedHousehold(code)` on both `LocalStorageHouseholdStorage` and `InMemoryHouseholdStorage` to safely filter out the forgotten code from `cooking_plan_saved_households`.
  - Added navigation state safety: if the active navigation state points to the forgotten household, resets navigation state to `{ status: 'choosing_household' }`.
- **Saved Household Card & Action UI (`src/components/OnboardingModal.tsx`):**
  - Rendered household cards with `<div role="button" tabIndex={0}>` (avoiding invalid HTML `<button>` inside `<button>`), keyboard-accessible with Enter/Space.
  - Added 3-dots action button (`data-testid="household-menu-btn-{code}"`, `aria-label="Tùy chọn cho Gia đình {code}"`) with `e.stopPropagation()` so opening the menu does not trigger household card selection.
  - Added popover menu with "Bỏ khỏi danh sách" (`data-testid="forget-household-btn-{code}"`).
  - Added confirmation modal (`data-testid="forget-confirmation-dialog"`) clearly stating the target household code and explaining that this action ONLY forgets on this device, and common shared cooking data (members, dishes, plans, comments) remains completely preserved on the database and accessible anytime via code or link.
  - Provided "Hủy" (`data-testid="cancel-forget-button"`) to abort without removing, and "Bỏ khỏi danh sách" (`data-testid="confirm-forget-button"`) which calls `onForgetHousehold(code)`.
- **App Shell Integration (`src/App.tsx`):**
  - Managed `savedHouseholds` state initialized via `storage.getSavedHouseholds()`.
  - Implemented `handleForgetHousehold(code)` to update storage, clean up navigation state if active, and refresh `savedHouseholds` state.
  - Passed `onForgetHousehold={handleForgetHousehold}` and `savedHouseholds` to `OnboardingModal`.
  - Preserved original app initialization, dual-mode realtime sync, and tab switching contracts intact.

### 2. Test Coverage & Verifications
- **Unit Tests (`tests/services/storage.test.ts` & `tests/components/OnboardingModal.test.tsx`):**
  - Unit tests verifying `removeSavedHousehold` resets navigation state when active household is removed, and retains state when another household is removed.
  - Component tests verifying 3-dots button presence, stopping propagation on click, rendering confirmation dialog with code and device-only notice, cancellation behavior, confirmation execution, and removing the last card.
- **Integration Tests (`tests/integration/household-setup.test.tsx`):**
  - `clicking 3-dots button opens menu without selecting household card; canceling retains card`: Verified 3-dots does not trigger card selection or member view; canceling retains card and storage list.
  - `confirming forget removes card immediately, updates storage, and persists across reload (F5)`: Verified instant card removal and persistence across reload.
  - `preserves shared database data (members, dishes, plans) intact after device forgets household`: Verified members, dishes, and plans remain intact in repositories when removed on device.
  - `forgetting the last saved household hides saved section while keeping create and join actions fully usable`: Verified empty state handling and availability of Create and Join buttons.
  - `re-entering code or join link re-adds the forgotten household and requires explicit member selection`: Verified normalized re-addition and explicit member selection requirement.
  - `multi-tab independence: Tab A forgetting household does not disrupt running session in Tab B, and Tab B does not resurrect forgotten card in Tab A storage`: Verified multi-tab state isolation.
- **Verification Suites:**
  - `npx vitest run`: 23 test files passed, 251 tests passed.
  - `npm run build`: TypeScript compilation and Vite build succeeded with 0 errors.
