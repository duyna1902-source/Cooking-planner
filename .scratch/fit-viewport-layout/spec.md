Status: completed

# Đặc tả kỹ thuật: Bố cục vừa một màn hình (Fit Viewport Layout)

## Problem Statement

Trên điện thoại (trình duyệt và PWA) lẫn desktop, người dùng phải cuộn cả trang lên xuống mới thấy được thanh chuyển tuần ở trên và thanh điều hướng **Kế hoạch | Menu** ở dưới. Nguyên nhân:

- Khung app dùng `min-h-screen` (chỉ chặn chiều cao tối thiểu), nên nội dung dài làm khung giãn ra; `<main overflow-y-auto>` không bao giờ tự cuộn, cả trang cuộn thay vào đó và đẩy `BottomNav` khỏi màn hình.
- `100vh` trên trình duyệt di động bao gồm cả vùng thanh địa chỉ → luôn cao hơn vùng nhìn thấy.
- Trên desktop, khung giả lập điện thoại có `sm:min-h-[760px]` + padding → tràn trên laptop màn thấp (768px).
- PlanView lặp ngày đang chọn 3 lần và AppHeader chiếm 2 hàng, lãng phí chiều cao.

## Solution

Khung app luôn cao đúng bằng vùng nhìn thấy. Header, điều hướng tuần, dải ngày, tab bữa (Kế hoạch) / ô tìm kiếm + tiêu đề (Menu) và BottomNav được **ghim cố định**; **chỉ danh sách Món ăn cuộn bên trong**.

## User Stories

1. As a family member, I want the bottom navigation (Kế hoạch | Menu) always visible, so that I can switch screens without scrolling.
2. As a family member, I want the week navigation, date ribbon and meal tabs always visible in Kế hoạch, so that I can change day/meal while looking at a long list.
3. As a family member, I want the search box always visible in Menu, so that I can filter while browsing a long Menu.
4. As a family member using the installed PWA on iPhone, I want the bottom navigation to clear the home indicator, so that taps are not swallowed.
5. As a family member on a laptop, I want the phone-frame mockup to fit inside my browser window, so that I never scroll the whole page.
6. As a family member, I want the list to jump back to the top when I change day, meal or week, so that I always start at the beginning of the new list.

## Implementation Decisions

### Shell height (Q2, Q3)
- Mobile: app shell `h-[100dvh]` (thay `min-h-screen`), outer wrapper cũng `h-[100dvh]`.
- Desktop (`sm:`): giữ khung viền đen bo góc, chiều cao `min(900px, 100dvh - 2rem)`; bỏ `sm:min-h-[760px]`.
- `body`: `overflow: hidden; overscroll-behavior: none` (Q6). Chấp nhận mất pull-to-refresh trên Android vì dữ liệu đã sync realtime.

### Pinned vs scrolling regions (Q1)
- Shell là flex column; `<main>` là `flex-1 min-h-0 flex flex-col` (không tự cuộn).
- PlanView: header tuần, dải ngày, tab bữa, hàng tiêu đề bữa + nút "Thêm món" là `flex-shrink-0`; danh sách Món ăn là vùng duy nhất `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
- MenuView: ô tìm kiếm + hàng tiêu đề `flex-shrink-0`; danh sách `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
- AppHeader và BottomNav `flex-shrink-0` (bỏ `sticky`, không còn cần).

### Safe area (Q2)
- BottomNav thêm `padding-bottom: max(0.625rem, env(safe-area-inset-bottom))`. `viewport-fit=cover` đã có sẵn.

### Compaction (Q4, Q12)
- Bỏ nhãn `fullLabel` thứ 3 phía trên segmented control bữa ăn trong PlanView.
- AppHeader thu về 1 hàng: badge Mã nhà • nickname • Online bên trái, Chia sẻ + Đổi bên phải.
- `<h1>` "Kế hoạch tuần này / Menu gia đình" được giữ trong DOM nhưng `sr-only` (Q12): ẩn khỏi giao diện, vẫn có tiêu đề cho trình đọc màn hình, test hiện có không phải sửa.

### Date ribbon (prototype verdict, Q13)
- Bố cục và kích thước theo biến thể A; dải ngày theo biến thể B: **7 ô chia đều chiều ngang, không cuộn ngang**, luôn thấy T2 → CN (`flex-1 min-w-0`, `gap-1`, `px-3`).
- Ô ngày giữ kích thước như dải A (`py-2`, nhãn + số + chấm). **Chỗ của chấm "hôm nay" luôn được giữ sẵn** (chấm trong suốt ở ngày khác) để ô hôm nay không cao hơn các ô khác.
- Bỏ `scale-105` ở ô đang chọn (với `gap-1` sẽ đè lên ô bên cạnh).

### Scroll reset (Q7)
- Danh sách Kế hoạch `scrollTop = 0` khi `activeDate` hoặc `activeMeal` đổi (đổi tuần cũng đổi `activeDate`).
- Chuyển tab: giữ nguyên hành vi remount hiện tại.

### Overlays (Q9)
- `DishPickerDrawer` và các modal giữ `fixed inset-0`. Chỉ kiểm tra danh sách bên trong drawer tự cuộn được ở 375×667.

### Target (Q5)
- Chuẩn nhỏ nhất: iPhone SE 375×667 (Safari ~550px vùng nhìn thấy). Mọi vùng ghim hiển thị đủ và còn chỗ cho ≥2 thẻ Món ăn.

## Testing Decisions (Q10)

- Toàn bộ test hiện có phải pass (một số test có thể truy vấn tiêu đề `<h1>` đã bỏ — cập nhật nếu cần).
- Không viết test bố cục tự động (jsdom không tính layout).
- Kiểm tra thủ công theo checklist trong issue 01.

## Out of Scope

- Lớp mờ (fade) gợi ý "còn nữa" ở đáy danh sách (Q8) — xem xét lại sau dùng thử.
- Giới hạn lớp phủ drawer/modal vào trong khung điện thoại trên desktop (Q9).
- Thay đổi màu sắc, typography hay chức năng.
