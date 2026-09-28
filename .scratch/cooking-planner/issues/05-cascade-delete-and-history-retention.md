# 05: Cascade Delete khi xóa Món ăn khỏi Menu và Giới hạn lịch sử 2 tuần

**What to build:** Hoàn thiện 2 cơ chế toàn vẹn và dọn dẹp dữ liệu cốt lõi đã cam kết trong các quyết định kiến trúc:
1. Cơ chế **Cascade Delete**: Khi người dùng vào Menu và chọn xóa một Món ăn, hệ thống tự động gỡ bỏ sạch sẽ Món ăn đó cùng toàn bộ các comment liên quan khỏi tất cả Kế hoạch của các tuần (quá khứ, hiện tại và tương lai) để giữ dữ liệu đồng nhất tuyệt đối (theo ADR 0003).
2. Cơ chế **Giới hạn lịch sử 2 tuần**: Giao diện điều hướng Kế hoạch chỉ cho phép người dùng lùi về quá khứ tối đa 2 tuần tính từ ngày đang lên kế hoạch (nút lùi về trước bị khóa/vô hiệu hóa khi chạm mốc 2 tuần), đồng thời hệ thống tự động dọn dẹp các bản ghi Kế hoạch cũ hơn 2 tuần (theo ADR 0002).

**Blocked by:** 04: Chi tiết Món ăn và Ô nhập Comment dặn dò trong Kế hoạch

**Status:** ready-for-agent

- [ ] Khi một Món ăn bị xóa khỏi Menu, nó lập tức bị gỡ khỏi mọi Kế hoạch bữa ăn đã xếp ở các tuần
- [ ] Mọi bình luận dặn dò gắn với Món ăn bị xóa đó trong Kế hoạch cũng bị xóa sạch theo
- [ ] Nút điều hướng lùi tuần trên màn hình Kế hoạch bị vô hiệu hóa khi chạm giới hạn 2 tuần trước tính từ ngày đang lên plan
- [ ] Hệ thống tự động lọc bỏ và dọn dẹp các bản ghi Kế hoạch cũ hơn 14 ngày
- [ ] Có bộ test tích hợp bao phủ toàn diện tính năng Cascade Delete và chặn biên thời gian 2 tuần
