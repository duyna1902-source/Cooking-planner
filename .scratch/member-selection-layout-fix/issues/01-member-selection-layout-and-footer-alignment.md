Status: resolved

# Issue 01: Chuẩn hóa bố cục và căn chỉnh khu vực Thêm thành viên & Footer màn hình chọn Thành viên

## Context
Xem `.scratch/member-selection-layout-fix/spec.md`. Sau khi merge các nhánh tính năng, tệp `src/components/MemberSelection.css` bị ghi đè một phần khiến vùng nút "+ Thêm thành viên" (`.ms-add-area`) bị mất thuộc tính flex căn giữa (nút bị lệch), dòng chữ footer `“Cùng nhau, bữa cơm ngon hơn.”` (`.ms-footer`) bị mất toàn bộ style và không tự ẩn khi danh sách đông người, cùng với các style modal dialog cuộn được trên mobile bị thiếu hụt.

## Acceptance Criteria

1. **Khu vực Thêm thành viên (`.ms-add-area`)**:
   - Thẻ `<div className="ms-add-area">` được định nghĩa flexbox: `display: flex; justify-content: center; align-items: center; padding: 10px 24px 6px; flex-shrink: 0;`.
   - Nút `.ms-add` (`+ Thêm thành viên`) được căn giữa màn hình với `max-width: 300px; width: 100%; min-height: 44px; border: 1px solid #d4e2ec; border-radius: 99px; background: #f0f4f8; color: #3b5771; font-size: 13px; font-weight: 700;`.
   - Khi gia đình có 6 thành viên, nhãn thông báo giới hạn `.ms-capacity-notice` thay thế nút thêm, được căn giữa hoàn hảo với kích thước tương thích (`max-width: 320px; min-height: 44px; border: 1px dashed #cddae5; border-radius: 99px; background: #f0f4f8; font-size: 12px; font-weight: 650; color: #627b8d;`).

2. **Dòng chữ chân trang (`.ms-footer`)**:
   - Được định dạng chuẩn: `display: flex; align-items: center; justify-content: center; gap: 10px; padding: 8px 20px 14px; font-size: 9px; color: #788c9a; flex-shrink: 0;`.
   - Hai vạch trang trí mảnh hai bên câu quote: `.ms-footer span { width: 20px; height: 1px; background: #e2e8ed; }`.
   - Cơ chế tự thu gọn zero-scroll: Tự động ẩn hoàn toàn khi có $\ge 5$ thành viên (`.ms-compact .ms-footer { display: none !important; }`) hoặc trên màn hình chiều cao thấp (`@media (max-height: 680px)`).

3. **Khôi phục toàn bộ style modal dialog và responsive**:
   - Khôi phục đầy đủ: `.ms-backdrop`, `.ms-dialog` (`max-height: 85vh; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain`), `.ms-close` ($44 \times 44\text{px}$), `.ms-dialog-art`, `.ms-danger-art`, `.ms-primary`, `.ms-error`, `.ms-cancel`, `.ms-confirm-delete`, `.ms-toast` (nổi dạng pill không làm dịch chuyển nút).
   - Bảo toàn nút `Đổi gia đình` (`.ms-back-household`) và thanh điều hướng phân trang (`.ms-pagination`, `.ms-page-btn`, `.ms-page-info`).
   - Xóa bỏ các class mồ côi (`.ms-dock`, `.ms-capacity`).

4. **Kiểm thử**:
   - Toàn bộ test suite hiện có (`npm test`) vượt qua 100% (265/265 tests).
   - `npm run build` không có lỗi TypeScript hay Vite bundler.

## Manual Verification Checklist
- [x] Mở màn hình chọn Thành viên với 1–4 người: Nút "+ Thêm thành viên" căn giữa màn hình, dòng quote "Cùng nhau, bữa cơm ngon hơn." nằm đẹp ở chân trang có 2 vạch kẻ trang trí.
- [x] Mở màn hình chọn Thành viên với 5–6 người: Bố cục chuyển sang 3 cột (`.ms-compact`), dòng quote footer tự động ẩn đi để nhường diện tích cho danh sách thành viên.
- [x] Đủ 6 người: Nút thêm chuyển thành "Đã đạt tối đa 6 Thành viên trong Gia đình", căn giữa với viền dashed.
- [x] Bấm "+ Thêm thành viên": Hộp thoại modal mở lên trơn tru, có thể cuộn được khi bàn phím ảo xuất hiện.
- [x] Nút "Đổi gia đình" ở góc trên bên trái hoạt động bình thường và giữ nguyên kích thước chạm tối thiểu 44px.

## Comments
- Đã khôi phục hoàn chỉnh các style trong `src/components/MemberSelection.css`.
- Đã thêm kiểm thử stylesheet conformance trong `tests/components/MemberSelection.test.tsx`.
- Tất cả 26 test suites (265 tests) đều pass 100%. Build production hoàn tất thành công không có cảnh báo/lỗi bundler.
