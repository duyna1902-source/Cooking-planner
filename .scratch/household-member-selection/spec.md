Status: completed

# Đặc tả kỹ thuật: Màn hình Chọn và Quản lý Thành viên gia đình phong cách Netflix (Household Member Selection & Management)

## Problem Statement

Hiện tại, ứng dụng chỉ lưu một Biệt danh cục bộ (`nickname`) trên từng thiết bị thông qua `localStorage` (theo ADR 0001). Khi nhiều thành viên trong gia đình dùng chung một thiết bị (ví dụ: máy tính bảng đặt cố định ở bếp, hoặc điện thoại chuyền tay nhau giữa Bố, Mẹ và Con), việc mỗi người muốn vào xem Kế hoạch, phân công nấu nướng hoặc để lại dặn dò gặp phải các trở ngại:
- Ứng dụng tự động gắn chặt với Biệt danh của người mở trước đó, không biết ai đang thực sự vào bếp.
- Muốn đổi người, người dùng phải tìm nút đổi hoặc xóa bộ nhớ trình duyệt rất phiền phức.
- Danh sách các thành viên trong nhà không được lưu tập trung vào Cơ sở dữ liệu (Database), khiến các thiết bị khác trong cùng một gia đình không biết nhà mình gồm những ai để chọn nhanh.

## Solution

Triển khai tính năng **Chọn và Quản lý Thành viên gia đình (Member Selector & Management)** lấy cảm hứng từ màn hình chọn hồ sơ của Netflix, nhưng được thiết kế tinh tế với cùng tone màu ấm cúng (Warm Kitchen Palette: Dusty Blue, Cream, Pastel) đồng điệu với màn hình Kế hoạch:
1. **Luôn xuất hiện màn hình Chọn Thành viên trước khi vào Kế hoạch**: Mỗi lần mở ứng dụng web lên (hoặc tải lại trang F5), ứng dụng luôn chặn lại ở màn hình *"Hôm nay ai vào bếp?"* để người dùng xác nhận mình là ai trước khi vào màn hình chính.
2. **Lưu trữ tập trung trên Database & Đồng bộ Realtime**: Danh sách Thành viên được lưu vào bảng `members` trong Supabase theo `household_code` (hỗ trợ Dual-Mode fallback về `localStorage` khi offline). Khi một máy thêm thành viên mới, các máy khác trong nhà lập tức nhận được dữ liệu thời gian thực.
3. **Giao diện Lưới Thẻ Đôi (Netflix Kitchen Cards - Phương án A)**: Hiển thị các thẻ Thành viên vuông lớn bo góc mềm mại (`rounded-3xl`), gồm biểu tượng món ăn ẩm thực ngộ nghĩnh (🍳, 🥗, 🍜, 🥑, 🍰, 🍕, 🥕, 🍲) trên nền màu pastel dịu mát, kèm tên in đậm to rõ bên dưới. Chạm vào tên mình là vào thẳng Kế hoạch (zero-friction, không cần mật khẩu hay mã PIN).
4. **Nút "Thêm thành viên mới" ghim ở đáy màn hình**: Thiết kế dạng nút pill lớn màu Dusty Blue (`#5B7C99`) đặt cố định ở đáy màn hình. Khi bấm, mở **Bottom Drawer** (ngăn kéo trượt từ dưới lên) cho phép nhập tên, chọn 1 trong 8 biểu tượng đại diện ẩm thực và lưu ngay vào Database.
5. **Chế độ Quản lý Thành viên (Manage Mode)**: Cho phép sửa tên, đổi biểu tượng hoặc xóa Thành viên (kèm ràng buộc bảo toàn dữ liệu: không thể xóa Thành viên cuối cùng trong nhà, và các bình luận dặn dò trước đây của Thành viên đó trong Kế hoạch vẫn được giữ nguyên tên tác giả).
6. **Tích hợp liền mạch luồng Khởi tạo (Onboarding)**: Khi tạo nhà mới, người dùng nhập tên Thành viên đầu tiên và hệ thống tự động lưu vào Database. Khi tham gia nhà cũ bằng mã hoặc link chia sẻ, hệ thống chuyển ngay tới màn hình chọn Thành viên đã có của nhà đó.

---

## User Stories

1. As a family member opening the cooking planner web app, I want to see a welcoming "Hôm nay ai vào bếp?" selection screen before entering the weekly plan, so that the app knows who is currently cooking or planning meals.
2. As a family member on the member selection screen, I want to see my household code badge clearly displayed at the top, so that I can verify I am in the correct family kitchen.
3. As a family member on the member selection screen, I want to see all registered family members displayed in a 2-column grid of rounded pastel cards, so that I can easily spot and tap my profile.
4. As a family member, I want each member card to display a distinctive kitchen icon (egg pan, salad, noodle bowl, avocado, cake, pizza, carrot, hotpot) and clear name, so that members of all ages (including young children or elderly) can recognize themselves instantly.
5. As a family member, I want tapping on my member card to immediately take me to the weekly plan view as that member without asking for passwords or PINs, so that kitchen workflow remains completely frictionless.
6. As a family member in the weekly plan view, I want the app header to show my active member name and icon alongside the household code, so that I have clear visual feedback on my current identity.
7. As a family member adding comments or cooking instructions to a meal in the plan, I want my active member name to be automatically attributed as the author of the comment, so that family members know who left the note.
8. As a family member reloading the web page (F5) or opening the web in a new session, I want the member selection screen to always appear again, so that family members sharing the same kitchen tablet or phone can easily take turns without getting stuck on someone else's identity.
9. As a family member on the member selection screen, I want a prominent "Thêm thành viên mới" pill button fixed at the bottom of the screen, so that I can conveniently tap it with my thumb on mobile.
10. As a family member tapping "Thêm thành viên mới", I want a smooth bottom drawer to slide up, so that I can enter a name and pick an avatar without leaving the page context.
11. As a family member adding a new member, I want to type a name or nickname up to 30 characters, so that my familiar family name is recorded.
12. As a family member adding a new member, I want to choose an avatar from a curated palette of 8 kitchen icons and pastel colors, so that each family member has a personalized, playful look.
13. As a family member submitting the add member form, I want the new member to be instantly saved to the database and immediately appear in the member grid, so that they are available on all devices next time.
14. As a family member adding a new member with an empty name or whitespace only, I want the app to prevent submission and display a friendly validation error, so that invalid member records cannot be created.
15. As a family member adding a new member with a name that already exists in the same household, I want the app to alert me and reject duplicates, so that no two members have identical names in our kitchen.
16. As a family member on the member selection screen, I want a "Chỉnh sửa" button at the top right, so that I can enter management mode to edit or remove members.
17. As a family member in management mode, I want the cards to exhibit a subtle wiggle animation and show edit/delete indicators, so that I know the interface is in an interactive editing state.
18. As a family member tapping a member card in management mode, I want the bottom drawer to open with that member's existing name and avatar pre-selected, so that I can update their details.
19. As a family member deleting a member in management mode, I want a confirmation dialog before deletion, so that accidental taps do not delete family members.
20. As a family member in a household with only one member remaining, I want the delete action to be disabled or rejected with an informative message, so that a household cannot become entirely memberless.
21. As a family member deleting an existing member, I want their past comments and cooking notes in the plan to remain preserved with their original author name, so that historical cooking notes and recipe instructions are never lost.
22. As a new user creating a fresh household, I want to enter my first member name during the onboarding flow, so that my new household is initialized with its founding member saved in the database.
23. As a family member joining an existing household via a share link or household code, I want to be redirected immediately to the member selection screen of that household, so that I can choose my existing name or tap "Thêm thành viên mới" if joining for the first time.
24. As a family member using the app offline or without Supabase cloud credentials, I want member management and selection to automatically fallback to LocalStorage, so that the feature functions smoothly in all environments.
25. As a family member on one phone while someone else adds a member on another phone, I want the member list on my screen to update automatically in real-time via Supabase subscriptions, so that I don't need to manually refresh the page.

---

## Implementation Decisions

### 1. Domain Modeling & Terminology
- Standardize on **Thành viên (Member)** throughout the codebase, documentation ([CONTEXT.md](file:///d:/Project/Cooking/CONTEXT.md)), and tests.
- Deprecate local standalone `nickname` in favor of a shared `Member` entity:
  ```ts
  export interface Member {
    id: string;
    householdCode: string;
    name: string;
    avatarIcon: string;
    avatarColor: string;
    createdAt: string;
  }
  ```
- Curated 8 Kitchen Avatar Presets:
  - `🍳` Chảo ốp la (Nền `#FEF7DC`, viền `#EFE4B5`)
  - `🥗` Salad tươi (Nền `#DCFCE7`, viền `#BBF7D0`)
  - `🍜` Mì thơm (Nền `#E0F2FE`, viền `#BAE6FD`)
  - `🥑` Bơ béo (Nền `#ECFCCB`, viền `#D9F99D`)
  - `🍰` Bánh kem (Nền `#FCE7F3`, viền `#FBCFE8`)
  - `🍕` Pizza nóng (Nền `#FFEDD5`, viền `#FED7AA`)
  - `🥕` Cà rốt ngọt (Nền `#FEF3C7`, viền `#FDE68A`)
  - `🍲` Lẩu gia đình (Nền `#F3E8FF`, viền `#E9D5FF`)

### 2. Database Schema & Supabase Configuration
- Add table `members` to `supabase/schema.sql`:
  ```sql
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    household_code TEXT NOT NULL REFERENCES households(code) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_icon TEXT NOT NULL DEFAULT '🍳',
    avatar_color TEXT NOT NULL DEFAULT 'bg-[#FEF7DC]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_member_name_per_household UNIQUE (household_code, name)
  );

  CREATE INDEX IF NOT EXISTS idx_members_household_code ON members(household_code);

  ALTER TABLE members ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Public access to members" ON members;
  CREATE POLICY "Public access to members" ON members FOR ALL USING (true) WITH CHECK (true);

  ALTER TABLE members REPLICA IDENTITY FULL;
  -- Add to supabase_realtime publication
  ```

### 3. Dual-Mode Member Repository Architecture
- Define `MemberRepository` interface:
  ```ts
  export interface MemberRepository {
    getMembers(householdCode: string): Promise<Member[]>;
    addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member>;
    updateMember(id: string, updates: Partial<Pick<Member, 'name' | 'avatarIcon' | 'avatarColor'>>): Promise<Member>;
    deleteMember(id: string, householdCode: string): Promise<void>;
    subscribe?(householdCode: string, onUpdate: () => void): () => void;
    isOnline?: boolean;
  }
  ```
- Implement `LocalStorageMemberRepository` for offline and test environments (`localStorage` key: `cooking_plan_members_${householdCode}`).
- Implement `SupabaseMemberRepository` with Postgres queries and realtime channels.
- Wire into `repositoryFactory.ts` to automatically instantiate the active repository alongside `dishRepository` and `planRepository`.

### 4. Lifecycle & Session State Management
- In `App.tsx`:
  - `householdCode` continues to be stored across reloads in `storage` (`cooking_plan_household_code`).
  - Active member session is ephemeral across browser app mounts/reloads:
    - State `activeMember: Member | null` initializes as `null` on every page reload / app mount.
    - If `householdCode` is set, but `activeMember === null`, `<MemberSelectModal />` is rendered blocking access to `PlanView` and `MenuView`.
    - Once the user taps their member card, `activeMember` is set in memory for the current session, unblocking the main views.
    - When a user enters a note or comment, `author_nickname` receives `activeMember.name`.

### 5. Component Structure & UI Specification (Variant A)
- **`MemberSelectModal.tsx`**:
  - Modal overlay matching app shell theme (`#FAFBFD`).
  - Header: Household code badge (`#FEF7DC`), title *"Hôm nay ai vào bếp?"*, and "Chỉnh sửa" / "Xong" toggle button.
  - 2-column responsive grid (`grid-cols-2 gap-3.5`) of member cards.
  - Each card: aspect ratio ~ 4:4.4, `rounded-3xl`, avatar circle `w-16 h-16 rounded-2xl bg-white/80`, 3xl emoji icon, bold name and subtle role/badge. Subtle wiggle animation when in management mode.
  - Sticky bottom action area: Prominent full-width pill button *"➕ Thêm thành viên mới"* in Dusty Blue (`bg-[#5B7C99] text-white shadow-md rounded-full py-3.5`).
- **`MemberDrawer.tsx`**:
  - Bottom sheet drawer with backdrop blur and drag handle pill.
  - Title: *"Thêm Thành Viên Mới"* or *"Chỉnh Sửa Thành Viên"*.
  - Input for member name with auto-trim and 30-character limit.
  - 8-preset visual grid showing icon, pastel background, and friendly Vietnamese label.
  - Confirm button *"Xác nhận tạo thành viên"* and *"Hủy"* button.

### 6. Architectural Decision Record Reference
- Governed by [ADR 0006: Quản lý Thành viên chung và Màn hình chọn Thành viên kiểu Netflix](file:///d:/Project/Cooking/docs/adr/0006-household-members-netflix-style-selector.md).

---

## Testing Decisions

### 1. Test Quality & Seam Selection
- **Highest Seam Testing (App Shell Integration)**: Tests interact with `<App />` and simulate real user actions (clicking cards, typing into drawer inputs, submitting forms, switching tabs) rather than checking component internal state.
- **Contract Testing (Repository Seam)**: Both `LocalStorageMemberRepository` and `SupabaseMemberRepository` must fulfill the identical contract suite ensuring parity between online and offline modes.
- **Pure Domain Testing**: Unit tests for validation functions (`isValidMemberName`, preset resolution, duplicate name checks).

### 2. Tested Modules
- Pure domain: `src/domain/member.ts` (validation rules, avatar presets, factory functions).
- Services: `src/services/memberRepository.ts`, `src/services/supabaseMemberRepository.ts`, `src/services/repositoryFactory.ts`.
- Components: `src/components/MemberSelectModal.tsx`, `src/components/MemberDrawer.tsx`.
- Integration: `tests/integration/member-selection.test.tsx` (full end-to-end lifecycle within `<App />`).

### 3. Prior Art in Codebase
- `tests/integration/household-setup.test.tsx`: Tests onboarding, local storage integration, and PWA shell rendering.
- `tests/integration/dish-comment.test.tsx`: Tests comment authoring, attribution, and comment retention.
- `tests/services/dualMode.test.ts`: Verifies fallback and repository resolution.

---

## Out of Scope

1. **Mã PIN / Mật khẩu cá nhân**: Không triển khai mã bảo mật cho từng thành viên (tuân thủ nguyên tắc zero-friction).
2. **Tải ảnh thật từ thiết bị**: Không hỗ trợ upload file ảnh bitmap/PNG lên storage bucket; chỉ sử dụng bộ 8 preset biểu tượng ẩm thực chất lượng cao.
3. **Phân quyền vai trò (Admin / Member)**: Mọi thành viên trong gia đình đều có quyền bình đẳng như nhau (đều có thể thêm món, chọn lịch và chỉnh sửa).
4. **Tài khoản cá nhân / Email / OAuth**: Không yêu cầu đăng ký tài khoản bên ngoài.

---

## Further Notes

- Nguyên tắc giữ nguyên bình luận cũ: Khi một Thành viên bị xóa khỏi danh sách, bảng `plan_comments` vẫn giữ nguyên `author_nickname` của họ trong lịch sử để người khác xem lại không bị mất ngữ cảnh công thức nấu.
- Màn hình chọn Thành viên được thiết kế hoàn toàn theo **Phương án A** đã được nghiệm thu thông qua prototype tương tác [prototype/index.html](file:///d:/Project/Cooking/prototype/index.html).
