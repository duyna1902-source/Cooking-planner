---
status: accepted
---

# Thành viên chung theo Gia đình và chọn lại mỗi lần mở

Thành viên là người có tên trong danh sách chung của một Gia đình, không có mật khẩu hoặc PIN; danh sách này được lưu trong database để dùng lại giữa các lần mở và các thiết bị. Quyết định này thay thế phần Biệt danh cục bộ trong ADR-0001: thiết bị vẫn nhớ Gia đình, nhưng luôn yêu cầu chọn Thành viên trước khi mở Kế hoạch ở mỗi lần tải trang, mở tab mới hoặc khởi động lại PWA, thay vì tự khôi phục danh tính từ lần trước. Menu và Kế hoạch tiếp tục dùng chung theo Gia đình; việc quay lại tab/PWA vẫn đang chạy từ nền giữ Thành viên đã chọn, và mỗi tab chọn độc lập.

Thành viên mới chỉ xuất hiện sau khi database xác nhận đã lưu; mỗi tên là duy nhất trong Gia đình khi bỏ qua hoa/thường và khoảng trắng đầu/cuối, và danh sách đồng bộ ngay giữa các thiết bị. Khi tải, thêm hoặc xóa thất bại, giữ trạng thái phù hợp để thử lại; bản đầu không đồng bộ thay đổi Thành viên offline và không tự tạo Thành viên từ Biệt danh cục bộ cũ. Đây là ngoại lệ cho phần fallback local của ADR-0005: thao tác Thành viên yêu cầu database, không dùng local để vượt qua lỗi cloud; kiến trúc repository của Menu/Kế hoạch không thay đổi.

Màn hình chọn không có thao tác đổi Gia đình; chỉ cho đổi Gia đình từ màn hình Kế hoạch sau khi đã chọn Thành viên. Kế hoạch/Menu không có nút hoặc luồng đổi Thành viên; phiên đang chạy giữ người đã chọn. Các quyết định qua ba vòng hỏi và các chỉnh sửa prototype đã được tổng hợp thành [spec ready-for-agent](../../.scratch/household-users/spec.md) theo yêu cầu dùng to-spec.

Sau khi chọn bố cục A, người dùng bổ sung khả năng xóa Thành viên ngay trên màn hình chọn. Việc gỡ Thành viên không xóa Menu, Kế hoạch hoặc bình luận cũ; tên tác giả trong bình luận vẫn là tên đã lưu tại thời điểm gửi. Bảng member hiện đã hỗ trợ đọc/thêm; quyền xóa và việc cập nhật danh sách khi xóa sẽ được bổ sung khi triển khai chức năng thật.
