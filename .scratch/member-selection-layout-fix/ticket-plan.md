Status: completed

# Bản chia ticket — Chuẩn hóa bố cục và căn chỉnh khu vực Thêm thành viên & Footer

Nguồn: [Đặc tả đã chốt](./spec.md).

## Danh sách Ticket

- **01 — Chuẩn hóa bố cục và căn chỉnh khu vực Thêm thành viên & Footer ([issues/01-member-selection-layout-and-footer-alignment.md](./issues/01-member-selection-layout-and-footer-alignment.md))**:
  - Trạng thái: `resolved`
  - Phạm vi: Khôi phục và hoàn thiện tệp stylesheet `src/components/MemberSelection.css`.
  - Phụ thuộc: Không có (có thể bắt đầu ngay).

## Trình tự triển khai dự kiến
1. [x] Khôi phục và tinh chỉnh toàn bộ bộ quy tắc CSS trong `src/components/MemberSelection.css` theo đúng tiêu chí Acceptance Criteria của Issue 01.
2. [x] Kiểm tra trực quan và xác nhận qua vitest test suite (`npm test`).
3. [x] Xác minh build (`npm run build`).
4. [x] Cập nhật trạng thái ticket và ticket-plan thành `resolved`/`completed`.
