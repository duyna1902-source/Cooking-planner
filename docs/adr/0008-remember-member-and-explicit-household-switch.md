---
status: accepted
---

# Nhớ Thành viên khi mở lại, chọn lại khi chủ động đổi Gia đình

Để giảm thao tác lặp lại khi sử dụng hằng ngày, ứng dụng nhớ Gia đình và Thành viên đang dùng trên trình duyệt/thiết bị, kiểm tra Thành viên còn tồn tại trong database rồi tự vào Kế hoạch khi F5, mở tab mới hoặc mở lại PWA. Khi người dùng chủ động đổi Gia đình, kể cả chọn một Gia đình đã lưu, họ phải chọn Thành viên lại; không dùng phương án nhớ và tự chọn một Thành viên riêng cho từng Gia đình. Đây là đánh đổi đã chọn giữa vào lại nhanh và xác định rõ người đang dùng khi đổi không gian Gia đình.

Quyết định này thay các phần bắt buộc chọn lại mỗi lần mở và cấm đổi Thành viên/đổi Gia đình từ màn chọn trong [ADR-0006](./0006-household-members-and-explicit-selection.md). Kế hoạch có menu tên với Đổi gia đình / Đổi thành viên; màn chọn Thành viên có lối về chọn Gia đình. Chủ động đổi sẽ lưu bước đang chọn để mở lại tiếp tục bước đó. Các tab đang mở giữ lựa chọn riêng; khi tải lại hoặc mở tab mới, dùng trạng thái gần nhất đã lưu, bao gồm cả bước đang chọn. Người dùng đã xác nhận hệ quả này tại Q15: nếu tab B mở Đổi thành viên thì F5 tab A mở màn chọn đó, còn tab A chưa F5 giữ phiên hiện tại.

Danh sách Gia đình đã lưu thuộc trình duyệt/thiết bị và ghi nhận ngay khi tạo/tham gia, gồm Mã nhà để chọn lại nhanh. Bỏ khỏi danh sách có xác nhận và chỉ xóa ghi nhớ cục bộ, không xóa Gia đình hoặc dữ liệu chung. Mã nhà vẫn là phương tiện tham gia; danh sách đã lưu và lựa chọn Thành viên không phải tài khoản hoặc cơ chế phân quyền.

Các quy tắc về danh sách Thành viên chung, yêu cầu database khi tải/thêm/xóa, tên tác giả bình luận và bảo toàn dữ liệu trong ADR-0006 tiếp tục áp dụng. Thành viên đã nhớ bị xóa thì quay về chọn; lỗi kết nối giữ thông tin đã nhớ và cho Thử lại, không dùng tên lưu để vượt qua lỗi database. Việc ghi nhớ không bổ sung chế độ đọc dữ liệu cloud offline hoặc đẩy một phiên đang chạy ra ngay khi Thành viên bị xóa ở thiết bị khác.

Các quyết định Q1–Q15 được xác nhận trong [nhật ký thiết kế](../../.scratch/household-navigation-ux/design.md); [đặc tả tổng hợp](../../.scratch/household-navigation-ux/spec.md) và ticket đã được xuất bản với trạng thái ready-for-agent. Tài liệu ghi quyết định thiết kế, không tuyên bố code hoặc database đã được cập nhật.
