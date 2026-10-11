Status: ready-for-agent

# Đặc tả kỹ thuật: Chuẩn hóa bố cục và căn chỉnh khu vực Thêm thành viên & Footer màn hình chọn Thành viên

## Problem Statement

Sau khi merge các tính năng điều hướng gia đình (commit `83e0d28`), tệp stylesheet `src/components/MemberSelection.css` đã vô tình bị ghi đè làm mất một số bộ chọn và thuộc tính CSS quan trọng, gây ra các lỗi hiển thị trên màn hình chọn Thành viên:

1. **Khu vực Thêm thành viên (`.ms-add-area`) bị căn lệch**:
   - Thẻ bao bọc nút `+ Thêm thành viên` (`<div className="ms-add-area">`) không còn định nghĩa CSS (`display: flex; justify-content: center; align-items: center;`), khiến nút bấm không được căn giữa trên màn hình điện thoại mà bị lệch sang trái.
   - Trạng thái khi đạt tối đa 6 người (`.ms-capacity-notice`) cũng thiếu style căn giữa và định dạng viền đồng bộ.

2. **Dòng chữ chân trang (`.ms-footer`) hiển thị chưa hợp lý**:
   - Thẻ `<footer className="ms-footer">` chứa câu quote `"Cùng nhau, bữa cơm ngon hơn."` bị mất hoàn toàn CSS, hiển thị dạng unstyled plain text trơ trọi, thiếu hai đường kẻ trang trí hai bên (`span`).
   - Không được ghim ở chân màn hình và không tự động ẩn khi danh sách đông người ($\ge 5$) hoặc viewport thấp (`max-height: 680px`), dẫn đến nguy cơ làm tràn màn hình vi phạm nguyên lý Zero-Scroll (ADR-0007).

3. **Mất các định nghĩa CSS của modal dialog và trạng thái phụ**:
   - Hộp thoại thêm/xóa thành viên (`MemberDialog`) mất các style `.ms-backdrop`, `.ms-dialog` (cuộn được trên mobile khi có bàn phím ảo), `.ms-close`, `.ms-handle`,...
   - Mất định nghĩa responsive compaction (`.ms-compact`) đã cam kết trong ADR-0007.

## Solution

Khôi phục toàn diện và chuẩn hóa các quy tắc CSS cho màn hình chọn Thành viên trong [MemberSelection.css](file:///D:/Project/Cooking/src/components/MemberSelection.css), kết hợp hài hòa với các cải tiến điều hướng mới (`.ms-back-household`, `.ms-pagination`):

1. **Căn giữa và chuẩn hóa khu vực thêm thành viên (`.ms-add-area`)**:
   - `.ms-add-area`: `padding: 10px 24px 6px; display: flex; justify-content: center; align-items: center; flex-shrink: 0;`
   - `.ms-add`: Chiều rộng `max-width: 300px`, `width: 100%`, `min-height: 44px`, bo tròn `border-radius: 99px`, nền `#f0f4f8`, viền `1px solid #d4e2ec`, chữ đậm căn giữa hoàn hảo.
   - `.ms-capacity-notice`: Căn giữa, cùng kích thước chiều cao và giới hạn `max-width: 320px`, viền `1px dashed #cddae5`, nền mềm mại `#f0f4f8`.

2. **Định vị và định dạng dòng chữ footer (`.ms-footer`)**:
   - Cố định ở đáy màn hình với `padding: 8px 20px 14px`, `flex-shrink: 0`, chữ nhỏ thanh lịch `font-size: 9px; color: #788c9a`.
   - Hai vạch trang trí mảnh hai bên `width: 20px; height: 1px; background: #e2e8ed`.
   - Cơ chế tự thu gọn thông minh (Compaction): Ẩn hoàn toàn footer khi Gia đình có $\ge 5$ thành viên (`.ms-compact .ms-footer { display: none !important; }`) hoặc khi màn hình có chiều cao thấp (`@media (max-height: 680px)`).

3. **Khôi phục toàn bộ style của hộp thoại modal và responsive**:
   - Phục hồi `.ms-backdrop`, `.ms-dialog` (với `max-height: 85vh; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain`), `.ms-close` (vùng chạm $44 \times 44\text{px}$), form inputs, nút bấm `.ms-primary`, `.ms-cancel`, `.ms-confirm-delete`.
   - Giữ nguyên nút `Đổi gia đình` (`.ms-back-household`) và thanh điều hướng phân trang (`.ms-pagination`, `.ms-page-btn`, `.ms-page-info`).

## User Stories

1. As a family member on mobile, I want the "+ Thêm thành viên" button to be perfectly centered horizontally, so that the screen looks balanced and thumb-friendly.
2. As a family member in a full household (6 members), I want the maximum capacity notice to be cleanly aligned and styled in place of the add button, so that I understand why no more members can be added.
3. As a family member, I want the warm motto "Cùng nhau, bữa cơm ngon hơn." to sit nicely at the bottom of the screen with subtle accent lines, so that the cooking atmosphere feels inviting.
4. As a family member on a smaller phone or with 5–6 members, I want the footer motto to tuck away automatically, so that member cards and action buttons never scroll off screen.
5. As a family member adding or deleting a member, I want the modal dialog to fit within the screen and scroll gracefully above the virtual keyboard, so that I can always reach the Save/Cancel actions.

## Implementation Decisions

### Bottom dock & Add button alignment (Q1, Q2)
- Khu vực `.ms-add-area` là flexbox căn giữa theo trục ngang.
- Nút `.ms-add` và nhãn `.ms-capacity-notice` có chiều rộng tối đa đồng nhất ($300\text{px}$ – $320\text{px}$), đảm bảo cân xứng hoàn hảo với lưới thành viên phía trên.
- Duy trì vùng chạm tối thiểu $44\text{px}$ theo tiêu chuẩn accessibility.

### Footer motto positioning & zero-scroll compaction (Q2)
- Footer đặt ở cuối container `.ms-surface`, không bị cuộn.
- Khi `.ms-compact` kích hoạt (khi `members.length >= 5`) hoặc khi `@media (max-height: 680px)`, `.ms-footer` cùng với `.ms-greeting-art` và `.ms-eyebrow` được ẩn bằng `display: none !important` để nhường toàn bộ không gian cho lưới 5–6 avatar thành viên.

### Full stylesheet recovery (Q3)
- Hợp nhất các class của màn hình chọn thành viên từ trước sự cố merge vào lại [MemberSelection.css](file:///D:/Project/Cooking/src/components/MemberSelection.css), loại bỏ các class mồ côi (`.ms-dock`, `.ms-capacity`) không được dùng trong mã nguồn.
- Bảo tồn toàn vẹn các bổ sung của Ticket 03 (`.ms-back-household`) và Ticket 06 (`.ms-pagination`).

## Testing Decisions

- Chạy toàn bộ test suite hiện có (`npm test`): đảm bảo 26/26 test suites (bao gồm `MemberSelection.test.tsx` và `member-selection.test.tsx`) tiếp tục pass 100%.
- Kiểm tra tính toàn vẹn của build (`npm run build`).
- Xác nhận các class `.ms-add-area`, `.ms-footer`, `.ms-compact`, `.ms-dialog` tồn tại đầy đủ trong `MemberSelection.css`.

## Out of Scope

- Thay đổi logic quản trị thành viên hoặc xử lý backend.
- Thay đổi cấu trúc DOM trong `MemberSelection.tsx` (trừ khi cần điều chỉnh nhỏ về class nếu có sai khác).
