# 02: Giới hạn tối đa 6 Thành viên và Chặn lưu ở Form

**What to build:** Giới hạn mỗi Gia đình có tối đa 6 Thành viên để bảo toàn công thái học chạm và bố cục không cuộn. Khi danh sách đã đủ 6 người, nút "+ Thêm thành viên" ở đáy được thay thế bằng thông báo trạng thái "Đã đạt tối đa 6 Thành viên trong Gia đình", ngăn mở dialog thêm. Trong dialog thêm Thành viên, nếu người dùng cố tình gửi lưu khi số lượng đã đạt 6 (ví dụ hai máy cùng mở form), hệ thống hiển thị cảnh báo lỗi "Gia đình đã có tối đa 6 Thành viên." và không lưu. Khi một Thành viên bị xóa đưa danh sách về dưới 6 người, nút "+ Thêm thành viên" tự động khôi phục lại.

**Blocked by:** 01: Bố cục cố định không cuộn (Zero-Scroll) và Lưới thích ứng 2–3 cột

**Status:** resolved

- [x] Khi danh sách Thành viên đạt đủ 6 người, nút "+ Thêm thành viên" không còn xuất hiện, thay vào đó là dòng trạng thái "Đã đạt tối đa 6 Thành viên trong Gia đình".
- [x] Khi danh sách có 6 người, không thể mở form thêm Thành viên từ giao diện.
- [x] Trong form thêm Thành viên, hàm submit kiểm tra số lượng và chặn lưu kèm thông báo "Gia đình đã có tối đa 6 Thành viên." nếu số lượng >= 6.
- [x] Khi xóa một Thành viên khiến số lượng giảm xuống còn 5 người hoặc ít hơn, nút "+ Thêm thành viên" tự động xuất hiện lại bình thường.
- [x] Kiểm thử tích hợp bao phủ kịch bản đạt ngưỡng 6 người, chặn thêm người thứ 7 và phục hồi nút thêm sau khi xóa.

## Answer

### Implementation Summary
1. **Domain Constant (`src/domain/member.ts`)**:
   - Xuất hằng số `MAX_MEMBERS_PER_HOUSEHOLD = 6` làm ranh giới nghiệp vụ chuẩn cho dung lượng tối đa của một Gia đình.

2. **Giao diện thay thế nút thêm thành viên (`src/components/MemberSelection.tsx`)**:
   - Khi `members.length >= MAX_MEMBERS_PER_HOUSEHOLD`, vùng thao tác đáy (`.ms-add-area`) tự động thay thế nút `+ Thêm thành viên` bằng thông báo trạng thái trợ năng:
     `<p className="ms-capacity-notice" role="status">Đã đạt tối đa 6 Thành viên trong Gia đình</p>`.
   - Ngăn người dùng mở dialog thêm thành viên từ giao diện khi danh sách đã đầy 6 người.

3. **Chặn lưu ở Form (`addMember` handler)**:
   - Kiểm tra điều kiện `members.length >= MAX_MEMBERS_PER_HOUSEHOLD` ngay đầu hàm `addMember`.
   - Nếu số lượng đã đạt hoặc vượt 6 (kịch bản race condition khi form mở trước đó), hiển thị thông báo lỗi inline: `"Gia đình đã có tối đa 6 Thành viên."` và trả về ngay mà không gọi `repository.addMember`.

4. **Tự động khôi phục nút thêm**:
   - Khi một Thành viên bị xóa (`deleteMember`) khiến số lượng giảm xuống dưới 6 người, nút `+ Thêm thành viên` tự động xuất hiện lại và thông báo giới hạn biến mất.

5. **Kiểu dáng Zero-Scroll (`src/components/MemberSelection.css`)**:
   - Định dạng `.ms-capacity-notice` dạng pill bo góc mềm mại, viền nét đứt tinh tế (`border: 1px dashed #cddae5`), chiều cao tối thiểu 44px khớp với nút bấm, đảm bảo không làm xô lệch hay phát sinh cuộn dọc.

6. **Kiểm thử tự động theo TDD**:
   - Bổ sung kiểm thử đơn vị & tích hợp tại các seam công khai:
     - `tests/domain/member.test.ts`: kiểm tra hằng số `MAX_MEMBERS_PER_HOUSEHOLD = 6`.
     - `tests/components/MemberSelection.test.tsx`: kiểm tra ẩn nút thêm và hiển thị notice khi có 6 người; kiểm tra chặn submit form khi có điều kiện race condition; kiểm tra phục hồi nút khi xóa.
     - `tests/integration/member-selection.test.tsx`: kiểm tra toàn bộ luồng tích hợp trong `App` (hiển thị thông báo, xóa thành viên đưa về 5 người để phục hồi nút thêm, và chặn lưu người thứ 7).
   - Toàn bộ 170 bài kiểm thử trên 20 tệp test đều vượt qua 100%.
