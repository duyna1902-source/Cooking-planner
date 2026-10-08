Status: awaiting-breakdown-approval

# Bản chia ticket Thành viên

Đây là bản nháp để duyệt theo skill to-tickets, chưa xuất bản các ticket con vào tracker. Ticket 01 hiện có giữ vai trò nguồn phạm vi đầy đủ và được giữ nguyên; các ticket con dùng số 02–06 để tránh đè hoặc sửa ticket cha.

Mỗi ticket bao gồm hành vi chạy được từ dữ liệu tới giao diện, kiểm thử App/adapter và cách nghiệm thu phù hợp. Ranh giới repository được bổ sung cùng luồng chọn đầu tiên; không cần bước refactor rộng tách rời trải nghiệm. Bảng member và quyền đọc/thêm đã có; quyền xóa được bổ sung cùng hành vi xóa.

## Đề xuất

1. [02 — Chọn Thành viên mỗi lần mở ứng dụng](./ticket-drafts/02-select-member-on-app-open.md)
   - Bị chặn bởi: Không; có thể bắt đầu ngay.
   - Kết quả: Khi thiết bị đã nhớ Gia đình, mở ứng dụng sẽ tải danh sách Thành viên từ database và hiển thị Bạn là ai? theo bố cục A. Chọn một người mới vào Kế hoạch/Menu và dùng tên đó cho bình luận mới. Mọi lần tải lại, tab mới hoặc PWA khởi động lại đều hỏi chọn lại; phiên đang chạy giữ lựa chọn.

2. [03 — Tạo, tham gia và đổi Gia đình qua bước chọn Thành viên](./ticket-drafts/03-household-entry-through-member-selection.md)
   - Bị chặn bởi: 02.
   - Kết quả: Người dùng mới tạo hoặc tham gia Gia đình bằng Mã nhà, rồi chọn Thành viên thay vì nhập Biệt danh riêng. Link tham gia cũng mở danh sách Gia đình đích. Người đã vào Kế hoạch có thể đổi Gia đình và phải chọn lại người thuộc Gia đình mới.

3. [04 — Thêm Thành viên và lưu danh sách qua các lần mở](./ticket-drafts/04-add-and-persist-household-member.md)
   - Bị chặn bởi: 02.
   - Kết quả: Người dùng bấm + Thêm thành viên bên dưới danh sách, nhập tên và lưu vào database của Gia đình hiện tại. Lưu thành công trở lại danh sách chưa chọn; lần mở tiếp theo hoặc thiết bị khác tải lại thấy cả người cũ và mới.

4. [05 — Xóa Thành viên ở góc màn hình chọn](./ticket-drafts/05-delete-member-from-selection.md)
   - Bị chặn bởi: 04.
   - Kết quả: Người dùng bật chế độ xóa từ nút góc trên bên phải, xác nhận đúng tên rồi gỡ Thành viên khỏi database. Xóa không ảnh hưởng nội dung chung hoặc bình luận cũ; xóa hết vẫn có thể thêm người rồi chọn để sử dụng.

5. [06 — Đồng bộ danh sách Thành viên giữa các thiết bị](./ticket-drafts/06-realtime-member-list-across-devices.md)
   - Bị chặn bởi: 03, 05.
   - Kết quả: Khi thiết bị khác thêm hoặc xóa Thành viên, màn hình chọn đang mở tự cập nhật danh sách Gia đình hiện tại. Đổi Gia đình, nhận sự kiện lặp hoặc kết quả đến muộn không làm trộn danh sách hay khôi phục người đã xóa.

## Các cạnh chặn

- 02 không có blocker.
- 03 và 04 đều phụ thuộc 02; hai phần này không chặn nhau.
- 05 phụ thuộc 04 vì nghiệm thu gồm xóa người cuối rồi thêm lại.
- 06 phụ thuộc 03 và 05 vì nghiệm thu gồm đổi Gia đình trong lúc đang đồng bộ và xóa qua luồng thật. 02/04 đã là phụ thuộc bắc cầu.

## Kiểm tra phủ đặc tả

| Phạm vi | Ticket chính |
| --- | --- |
| Chọn theo A, tải/lỗi/trống, chặn trước chọn, nhớ Gia đình và phiên độc lập | 02 |
| Tác giả bình luận mới, giữ lịch sử, không đổi Thành viên trong nội dung chính | 02, 05 |
| Tạo/tham gia/link tham gia, đổi Gia đình chỉ từ Kế hoạch | 03 |
| Thêm ở dưới, tên hợp lệ/duy nhất, lưu thật, mở lại, lỗi và chống gửi lặp | 04 |
| Xóa góc trên, xác nhận/hủy/Xong, quyền DELETE, xóa cuối rồi thêm lại | 05 |
| Đồng bộ thêm/xóa, cách ly Gia đình, sự kiện/kết quả cũ và cleanup | 06 |
| Regression/typecheck/build và kiểm thử thích hợp | Từng ticket |

## Khi được duyệt

Xuất bản một file cho mỗi ticket con vào thư mục issues với Status: ready-for-agent và các cạnh chặn tương ứng. Giữ nguyên ticket cha 01 theo yêu cầu của skill. Các bản nháp không được xem là frontier triển khai.

Nguồn: [spec](./spec.md), [ticket cha 01](./issues/01-member-selection-screen.md), [prototype A](./prototype.md).
