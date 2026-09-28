# Xóa triệt để Món ăn khỏi Kế hoạch khi xóa trong Menu

Khi một Món ăn bị xóa khỏi Menu, hệ thống sẽ tự động xóa sạch (cascade delete) Món ăn đó cùng toàn bộ các bình luận liên quan khỏi tất cả Kế hoạch hiện tại và quá khứ. Quyết định này nhằm đảm bảo tính đồng nhất tuyệt đối giữa Menu và Kế hoạch, tránh lưu lại các dữ liệu mồ côi hoặc không còn được gia đình quan tâm.
