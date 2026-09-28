Status: ready-for-agent

# Đặc tả kỹ thuật: Ứng dụng Lập Kế Hoạch Bữa Ăn Gia Đình (Cooking Plan PWA)

## Problem Statement

Các gia đình thường xuyên gặp khó khăn trong việc thống nhất bữa ăn hàng ngày, đặc biệt là Bữa Tối. Các thành viên phải trao đổi rời rạc qua tin nhắn hoặc hỏi nhau lặp đi lặp lại câu hỏi "Hôm nay ăn gì?", dẫn đến việc đi chợ bị động, quên dặn dò cách chế biến hoặc không chuẩn bị kịp nguyên liệu. Hơn nữa, việc sử dụng các ứng dụng phức tạp đòi hỏi tạo tài khoản, mật khẩu hoặc tải từ kho ứng dụng gây rào cản lớn đối với các thành viên trong gia đình.

## Solution

Một ứng dụng web di động (Mobile-first PWA) tinh gọn, dùng chung cho cả gia đình thông qua Mã nhà (Household Code) và đường link tham gia nhanh mà không cần tạo tài khoản. Gia đình có thể tự do xây dựng **Menu** các **Món ăn** yêu thích của riêng mình và sắp xếp **Kế hoạch** ăn uống cho các ngày trong tuần. Hệ thống ưu tiên Bữa Tối (tự động hiển thị Bữa Tối khi mở chọn món), cho phép các thành viên ghi chú/bình luận dặn dò cụ thể về cách nấu, chế biến, chuẩn bị nguyên liệu cho từng Món ăn trong Kế hoạch. Dữ liệu Kế hoạch được giới hạn lịch sử trong vòng 2 tuần để giữ hệ thống luôn gọn nhẹ.

## User Stories

1. As a family member, I want to create a new household with a unique Household Code and an instant join link, so that my family can have a shared space for meal planning.
2. As a family member, I want to join an existing household by clicking a shared link or entering a Household Code, so that I can immediately collaborate with my family without signing up for an account.
3. As a family member, I want to set a nickname once upon joining a household, so that other family members can identify who wrote notes or made changes.
4. As a family member, I want the application to remember my Household Code and nickname locally on my mobile device, so that I don't have to re-enter them every time I open the app.
5. As a family member, I want to view an initially empty Menu, so that my family can build our own personalized list of dishes from scratch.
6. As a family member, I want to add a new Món ăn to our Menu with a dish name (required) and an optional category tag (free-form text), so that our family dish catalog can grow over time.
7. As a family member, I want to edit the name or tag of an existing Món ăn in the Menu, so that I can correct mistakes or update information.
8. As a family member, I want to delete a Món ăn from the Menu, so that dishes our family no longer eats are removed.
9. As a family member, I want deleting a Món ăn from the Menu to cascade and automatically remove it from all past and present Kế hoạch, so that our data remains completely consistent without orphaned records.
10. As a family member, I want to view our Kế hoạch organized by calendar weeks (Monday through Sunday), so that we can organize meals according to our weekly schedule.
11. As a family member, I want to navigate to the next week or previous weeks in Kế hoạch, so that we can plan ahead or check recent meals.
12. As a family member, I want the Kế hoạch history to be restricted to at most 2 weeks prior to the active planning date, so that the app stays fast and does not accumulate obsolete data.
13. As a family member, I want Bữa Tối to be displayed automatically whenever I tap on a day in Kế hoạch, so that I can manage our primary family meal without extra clicks.
14. As a family member, I want tab controls to switch to Bữa Sáng or Bữa Trưa for any selected day, so that we can also plan other meals when needed.
15. As a family member, I want to tap "+ Thêm món" within a meal to select one or multiple Món ăn from our Menu, so that they are scheduled for that specific meal.
16. As a family member, I want to remove a Món ăn from a meal in Kế hoạch, so that we can adjust our plan if our plans change.
17. As a family member, I want removing a Món ăn from a meal to automatically delete all associated comments for that meal instance, so that obsolete notes do not linger.
18. As a family member, I want to tap on a Món ăn in Kế hoạch to open a focused detail view showing only the dish name and an empty comment input area, so that the interface remains clean and uncluttered.
19. As a family member, I want to type notes about cooking method, preparation, or ingredients into the comment input area and submit it, so that my family knows how to cook and what to buy for that meal.
20. As a family member, I want to see previous comments for that scheduled Món ăn displayed with author nicknames and timestamps, so that we can have a clear conversation thread about that meal.
21. As a family member, I want real-time synchronization across devices, so that when someone updates the Menu, Kế hoạch, or comments, other family members see the changes instantly.
22. As a mobile phone user, I want the web app to be fully responsive and installable as a PWA, so that I can launch it from my home screen just like a native mobile app.
23. As a family member, I want to search dishes by name or category tag in the dish selection drawer, so that I can quickly find and add dishes to a meal without endless scrolling.
24. As a family member, I want to search dishes by name or category tag directly on the Menu screen, so that I can quickly locate specific dishes in our family catalog to view, edit, or manage them.

## Implementation Decisions

### Visual Identity and UI Layout
- **Design Layout**: Selected **Variant A (Ribbon Date Bar + Bottom Sheet Drawer)**. The top features a smooth horizontal date ribbon for rapid day switching; the bottom sheet drawer slides up smoothly for dish picking on mobile devices.
- **Color Palette**: Harmonious pastel scheme combining **Dusty/Slate Blue** (`#5B7C99`, deep slate `#334E68`, soft tint `#EBF1F6`) and **Soft Pastel Cream** (`#FEF7DC`, soft border `#EFE4B5`, active hover `#FDF2C7`).
- **Button Styling**: Softly rounded pill aesthetics (`rounded-full` and `rounded-2xl`) with gentle shadows.
- **Dish Search**: An instant real-time search input field positioned both at the top of the dish selection drawer (filtering dishes to add to a meal) and on the main Menu management screen (filtering the household catalog by dish name and tag).

### Architectural Shape and Technology Choices
- **Frontend & PWA**: Mobile-first Responsive Web Application built with React and Tailwind CSS, configured with a Web App Manifest and Service Worker for PWA installation on iOS and Android.
- **Backend & Data Persistence**: Supabase (PostgreSQL with Realtime subscriptions enabled).
- **Authentication**: Zero-credential shared access model. The household is identified by a short alphanumeric code (`household_code`). Individual members are distinguished by a local `nickname` stored in `localStorage` on each client device. No passwords or email sign-ins.
- **Direct Join Mechanism**: URLs containing `?join=<household_code>` automatically set the active household in storage and prompt for a nickname if one is not yet set.

### Domain Boundaries & Schema Shape
The domain model strictly adheres to the glossary defined in `CONTEXT.md`:
- **Household Context**: Owns `household_code` and creation timestamp.
- **Menu Context**:
  - Entity `Dish (Món ăn)`: Belongs to a household. Contains `id`, `name` (string, non-empty), and optional `tag` (string, free-form).
  - Does NOT contain pre-populated recipes or ingredients in the Menu catalog.
- **Kế hoạch Context**:
  - Entity `MealPlan (Kế hoạch)`: Organizes scheduled items by `date` (YYYY-MM-DD), `meal_type` (dinner, lunch, breakfast), and references `dish_id`.
  - Entity `PlanComment`: Belongs to a scheduled dish instance in a meal plan. Contains `author_nickname`, `content` (text), and `created_at`.
  - Cascade relationship: Foreign key constraint `ON DELETE CASCADE` from `Dish` to scheduled `MealPlan` items, and from scheduled `MealPlan` items to `PlanComment`.

### User Interaction Rules
- **Dinner-First UX**: On navigating to any date in Kế hoạch, the meal selection defaults immediately to Bữa Tối (`dinner`). A segmented control or tab bar is provided at the top to toggle to `breakfast` or `lunch`.
- **Minimalist Dish Detail**: Tapping a dish card in a meal plan opens a clean modal or drawer with:
  1. Header: Dish Name (and tag if present).
  2. Conversation thread: Chronological list of existing comments with author nickname and timestamp.
  3. Input box: A blank text area for drafting new cooking/ingredient comments, accompanied by a send button.
- **Two-Week Retention Policy**: Queries for past meal plans enforce a window of `current_plan_date - 14 days`. Navigating further back than 2 weeks is disabled in the UI, and background cleanup or database queries prune records older than 14 days.

## Testing Decisions

### What Makes a Good Test
Tests should evaluate external system behaviors and user workflows, not internal implementation details or private state. A good test asserts that when a user performs actions (adding a dish, assigning it to dinner, submitting a comment, or deleting a dish), the resulting UI and persisted state accurately reflect the domain requirements.

### Test Seam
- **Primary Testing Seam**: UI Integration & Component Workflow seam (using Vitest and React Testing Library).
- The testing suite exercises the entire application through user actions (rendering screens, clicking buttons, filling text inputs) against an abstracted client storage / API adapter layer.
- Tests verify:
  1. Joining a household via code and link.
  2. Adding, editing, and deleting a Món ăn in the Menu.
  3. Verifying cascade deletion of a Món ăn from Kế hoạch when removed from Menu.
  4. Viewing Kế hoạch with Bữa Tối rendered as default active meal.
  5. Switching to Bữa Sáng and Bữa Trưa.
  6. Adding a Món ăn to a meal and submitting comments.
  7. Enforcing the 2-week history navigation boundary.

### Prior Art
Initial test setup using Vitest and React Testing Library with standard user-event simulation patterns.

## Out of Scope

- Meal suggestion / recommendation engine (explicitly dropped).
- User registration, passwords, email verification, and OAuth.
- Standalone grocery / shopping list views or shopping mode.
- Meal status tracking (e.g. marked as "cooked", "in progress", or "completed").
- Preset or pre-populated library of default recipes or dishes (Menu begins completely blank).
- History access older than 2 weeks prior to the active planning date.
- Image uploads or camera capture for dishes.

## Further Notes

- The UI layout is strictly mobile-first (optimized for screen widths between 360px and 430px), centered on desktop screens.
- All domain terminology in user-facing Vietnamese strings must use exact terms: **Menu**, **Món ăn**, **Kế hoạch**.
