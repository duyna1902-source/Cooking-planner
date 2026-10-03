Status: resolved

# Issue 01: Fixed Viewport Shell & Internal List Scrolling

## Context
Xem `.scratch/fit-viewport-layout/spec.md`. Khung app phải cao đúng bằng vùng nhìn thấy; chỉ danh sách Món ăn cuộn bên trong.

## Acceptance Criteria
1. `App.tsx`: wrapper + shell dùng `h-[100dvh]`; trên `sm:` shell cao `min(900px, 100dvh - 2rem)`, bỏ `sm:min-h-[760px]`. `<main>` là `flex-1 min-h-0 flex flex-col` (không `overflow-y-auto`).
2. `index.css`: `html, body, #root` khóa scroll (`overflow: hidden; overscroll-behavior: none`).
3. `AppHeader.tsx`: 1 hàng; `<h1>` tiêu đề tab giữ lại nhưng `sr-only`; `flex-shrink-0`, bỏ `sticky`.
4. `BottomNav.tsx`: `flex-shrink-0`, bỏ `sticky`; padding đáy `max(0.625rem, env(safe-area-inset-bottom))`.
5. `PlanView.tsx`: root `flex-1 min-h-0`; header tuần, dải ngày, tab bữa, hàng tiêu đề bữa `flex-shrink-0`; bỏ nhãn `fullLabel` phía trên tab bữa; danh sách là vùng cuộn duy nhất (`flex-1 min-h-0 overflow-y-auto overscroll-contain`); reset `scrollTop = 0` khi `activeDate`/`activeMeal` đổi.
5b. Dải ngày: 7 ô `flex-1 min-w-0` chia đều, không `overflow-x-auto`; ô giữ `py-2`; chấm "hôm nay" luôn chiếm chỗ (trong suốt ở ngày khác); bỏ `scale-105`.
6. `MenuView.tsx`: root `flex-1 min-h-0`; tìm kiếm + tiêu đề `flex-shrink-0`; danh sách `flex-1 min-h-0 overflow-y-auto overscroll-contain`.
7. Tất cả test hiện có pass.

## Manual Verification Checklist
- [ ] DevTools 375×667, tab Kế hoạch, Bữa Tối có 8+ Món ăn: header, chuyển tuần, dải ngày, tab bữa và BottomNav luôn thấy; chỉ danh sách cuộn; thấy ≥2 thẻ.
- [ ] Cuộn danh sách xuống, đổi ngày → danh sách về đầu. Tương tự đổi bữa, đổi tuần.
- [ ] Tab Menu 375×667 với 15+ Món ăn: ô tìm kiếm + BottomNav luôn thấy; chỉ danh sách cuộn.
- [ ] Cuộn hết danh sách rồi kéo tiếp → trang không bị nảy/cuộn theo.
- [ ] Drawer chọn Món ăn ở 375×667: danh sách trong drawer cuộn được, nút xác nhận thấy được.
- [ ] Desktop 1366×768: khung điện thoại nằm gọn trong cửa sổ, không có scrollbar trang.
- [ ] (Nếu có) PWA trên iPhone thật: BottomNav không bị thanh home che.

## Comments

**Prototype (2026-10-03)** — Câu hỏi: "Khi vừa một màn hình, bố cục màn Kế hoạch nên trông thế nào?" So sánh A (xếp tầng gọn), B (gộp thanh tuần), C (điều hướng ở vùng ngón cái). **Verdict: D = bố cục + kích thước của A, dải ngày 7 cột cố định của B, ô ngày giữ cỡ A với chỗ chấm "hôm nay" luôn được giữ sẵn.** Mã nguồn prototype: nhánh `prototype/fit-viewport-layout` (commit `063f5aa`), chạy `npm run dev` rồi mở `/?variant=D`.
