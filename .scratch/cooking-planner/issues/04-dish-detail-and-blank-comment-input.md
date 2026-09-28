# 04: Chi tiết Món ăn và Ô nhập Comment dặn dò trong Kế hoạch

**What to build:** Trong màn hình Kế hoạch, khi bấm vào một Món ăn đã được xếp vào bữa, màn hình chi tiết mở ra ở dạng Bottom Drawer tối giản tuyệt đối, chỉ hiển thị đúng Tên món ăn và một ô để người dùng nhập comment (ô này ban đầu hoàn toàn trống, không có thông tin có sẵn). Người dùng có thể nhập các ghi chú dặn dò về cách nấu, chế biến, chuẩn bị nguyên liệu và bấm gửi. Các bình luận đã gửi sẽ hiển thị theo dòng thời gian kèm Biệt danh của người gửi. Khi một Món ăn bị gỡ khỏi bữa ăn trong Kế hoạch, toàn bộ các comment dặn dò của món đó trong bữa cũng được dọn sạch hoàn toàn.

**Blocked by:** 03: Lịch Kế hoạch tuần, Bữa Tối mặc định và Chọn món kèm Tìm kiếm

**Status:** completed

- [x] Bấm vào một Món ăn trong Kế hoạch hiển thị màn hình chi tiết chỉ gồm Tên món và ô nhập comment
- [x] Ô nhập comment ban đầu hoàn toàn trống, không chứa bất kỳ nội dung mặc định nào
- [x] Người dùng nhập dặn dò nấu nướng/nguyên liệu và bấm gửi thì comment xuất hiện ngay kèm Biệt danh và thời gian gửi
- [x] Các thành viên khác trong Nhà có thể đọc được các dặn dò này khi mở chi tiết món ăn
- [x] Khi người dùng gỡ Món ăn khỏi bữa ăn, hệ thống tự động xóa sạch toàn bộ comment của món đó trong bữa
- [x] Có bộ test tích hợp kiểm tra quy trình gửi comment, hiển thị dòng dặn dò và dọn sạch comment khi gỡ món
