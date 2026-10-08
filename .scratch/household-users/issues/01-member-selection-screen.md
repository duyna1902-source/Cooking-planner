# 01: Chọn Thành viên và lưu danh sách theo Gia đình

Type: task
Status: claimed

## What to build

Triển khai toàn bộ luồng trong [spec](../spec.md): xác định Gia đình, tải danh sách Thành viên từ database, chọn theo bố cục **A — Lưới như Netflix**, thêm tên và xóa bằng nút ở góc trên bên phải. Chỉ mở Kế hoạch/Menu sau khi chọn; tải lại web, tab mới và PWA khởi động lại đều hỏi chọn lại. Phiên vẫn đang chạy giữ lựa chọn, các tab chọn độc lập.

Tên Thành viên được lưu theo Gia đình và dùng làm tác giả bình luận mới. Kế hoạch/Menu không có nút hoặc luồng đổi Thành viên; đổi Gia đình chỉ có ở Kế hoạch và phải chọn người thuộc Gia đình đích. Không tự tạo hoặc khôi phục Thành viên từ Biệt danh cũ.

Bảng public.member đã được tạo và hỗ trợ đọc/thêm cùng Realtime. Cần bổ sung repository Thành viên, quyền/policy xóa, đồng bộ thêm/xóa, xử lý lỗi và kiểm thử. Prototype chỉ dùng dữ liệu minh họa; frontend thật của ticket này chưa được triển khai.

## Acceptance Criteria

1. Tạo/tham gia/nhớ Mã nhà/link tham gia đều dẫn tới Bạn là ai?; chưa chọn thì Kế hoạch/Menu và điều hướng chính chưa được mount.
2. Mỗi lần khởi tạo lại ứng dụng yêu cầu chọn; quay lại phiên đang chạy và điều hướng giữ người đã chọn. Các tab chọn độc lập.
3. Danh sách được tải đúng Gia đình, thứ tự tạo ổn định; thêm ở dưới, Gia đình trống không có người mặc định. Tên trim dài 1–30 ký tự, không trùng trong cùng Gia đình khi bỏ qua hoa/thường.
4. Thêm chỉ thành công sau database xác nhận, trở lại danh sách chưa chọn; mở lại/thiết bị khác thấy người cũ và mới. Thêm lỗi giữ tên, không gửi lặp.
5. Nút Xóa ở góc bật chế độ xóa; bấm ô mở xác nhận có tên, Giữ lại hủy, Xóa thành viên gỡ đúng bản ghi sau database xác nhận. Xong thoát chế độ. Xóa lỗi giữ người và cho thử lại.
6. Xóa không ảnh hưởng Menu, Kế hoạch hoặc bình luận cũ. Xóa người cuối giữ Mã nhà và cho thêm lại.
7. Thêm/xóa đồng bộ giữa thiết bị, không trùng ô hoặc lẫn Gia đình. Phản hồi/subscription cũ không thay danh sách hiện tại.
8. Lỗi tải hoặc thiếu cấu hình database giữ bước chọn và cho thử lại; không dùng danh sách local để vào Kế hoạch.
9. Không có đổi Thành viên trong Kế hoạch/Menu; đổi Gia đình chỉ có ở Kế hoạch và đưa tới bước chọn của Gia đình mới.
10. Bình luận mới dùng tên đã chọn; bình luận cũ giữ tên kể cả khi Thành viên bị xóa. Luồng Menu/Kế hoạch/chia sẻ Mã nhà tiếp tục hoạt động.
11. Có kiểm thử App qua repository được truyền vào; kiểm tra database thật cho lưu lại, tên trùng, RLS/quyền và đồng bộ xóa. Regression suite, typecheck, build và kiểm tra browser mobile đạt.

## Prototype primary source

- Verdict: người dùng chọn **A**, bổ sung nút xóa ở góc và bỏ đổi Thành viên trong Kế hoạch.
- Branch: **codex/prototype-household-members-20261008**.
- Commit: **f07f7af5c8cc5b8ee99402b41d33dd62c20bb83c**.
- Snapshot lưu ba phương án ban đầu trước khi bổ sung xóa/bỏ đổi Thành viên. Khi khác biệt, ưu tiên spec cùng bản xem trước/ảnh A cập nhật.
- Bản xem trước sau khi chọn A: [prototype.md](../prototype.md).

## Comments

- 2026-10-08: Triển khai theo implement-spec trên nhánh codex/household-users-integration; dùng ranh giới App và repository đã ghi trong spec. Các ticket con vẫn là bản nháp; ticket 01 là phạm vi triển khai đầy đủ.
- 2026-10-08: Xuất bản theo yêu cầu dùng skill to-spec, cập nhật ticket hiện có thành phạm vi đầy đủ và đặt ready-for-agent. Chưa bắt đầu triển khai frontend hoặc bổ sung quyền xóa database trong bước xuất bản đặc tả.
