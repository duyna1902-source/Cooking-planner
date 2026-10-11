Status: completed

# Bản chia ticket — Ghi nhớ Thành viên và điều hướng Gia đình

Nguồn: [đặc tả đã chốt](./spec.md) và [ticket tổng 01](./issues/01-household-navigation-ux.md). Toàn bộ 7 ticket con (02–08) và ticket tổng 01 đã được hoàn thành, tích hợp vào nhánh `codex/household-navigation-ux-integration` và vượt qua review 2 trục Standards & Spec.

## Tiến độ tổng quan

- **01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình (Ticket tổng)**: [x] Hoàn thành (`resolved`)
- **02 — Ghi nhớ Thành viên khi F5 và mở lại**: [x] Hoàn thành (`resolved`)
- **03 — Header gọn và đổi Thành viên/Gia đình trong Kế hoạch**: [x] Hoàn thành (`resolved`)
- **04 — Chọn nhanh các Gia đình đã lưu**: [x] Hoàn thành (`resolved`)
- **05 — Bỏ Gia đình khỏi danh sách trên thiết bị**: [x] Hoàn thành (`resolved`)
- **06 — Chọn Thành viên không cuộn và phân trang dữ liệu cũ**: [x] Hoàn thành (`resolved`)
- **07 — Giới hạn 6 Thành viên khi nhiều thiết bị cùng thêm**: [x] Hoàn thành (`resolved`)
- **08 — Menu/Kế hoạch báo lỗi tải và cho Thử lại**: [x] Hoàn thành (`resolved`)

## Chi tiết các Ticket đã triển khai

### 02 — Ghi nhớ Thành viên khi F5 và mở lại
- Ghi nhớ trạng thái điều hướng (`choosing_household`, `choosing_member`, `selected`) qua `HouseholdStorage`.
- Khôi phục phiên tự động và xác minh Thành viên với cơ sở dữ liệu qua `activeMemberRepo.getMembers(householdCode)`.
- Xử lý khi Thành viên bị xóa từ trước: thông báo rõ ràng và trở về màn chọn Thành viên.
- Dọn dẹp URL tham số `?join=...` bằng `history.replaceState` để F5 không kích hoạt lại hành vi tham gia.

### 03 — Header gọn và đổi Thành viên/Gia đình trong Kế hoạch
- AppHeader thu gọn còn một hàng, hiển thị Mã nhà dạng pill và tên Thành viên.
- Bấm Mã nhà mở modal chia sẻ Gia đình (`ShareHouseholdModal`).
- Bấm tên Thành viên tại tab Kế hoạch mở dropdown menu chuyển đổi với đúng 2 tùy chọn: "Đổi gia đình" và "Đổi thành viên".
- Màn hình chọn Thành viên bổ sung nút quay lại chọn Gia đình ("← Đổi gia đình"), hoạt động cả khi đang tải, rỗng hoặc lỗi.

### 04 — Chọn nhanh các Gia đình đã lưu
- Danh sách Gia đình đã lưu dạng lưới 2 cột ô vuông với biểu tượng nhà và Mã nhà.
- Cơ chế sắp xếp LRU (nhà vừa truy cập được đưa lên đầu danh sách), khử trùng lặp và chuẩn hóa mã.
- Vùng danh sách ô vuông cuộn riêng biệt (`max-h-48 overflow-y-auto`), hai nút "Tạo Nhà Mới" và "Tham Gia Bằng Mã" luôn hiển thị dễ tiếp cận.

### 05 — Bỏ Gia đình khỏi danh sách trên thiết bị
- Nút ba chấm trên từng thẻ Gia đình đã lưu mở tùy chọn "Bỏ khỏi danh sách" mà không kích hoạt chọn Gia đình.
- Hộp thoại xác nhận nêu rõ Mã nhà và giải thích chỉ xóa ghi nhớ trên thiết bị này, dữ liệu DB chung của gia đình vẫn giữ nguyên.
- Tách biệt hoàn toàn việc quên thẻ khỏi session đang dùng (không làm ảnh hưởng phiên ở tab khác).

### 06 — Chọn Thành viên không cuộn và phân trang dữ liệu cũ
- Bố cục zero-scroll: toàn bộ màn hình chọn Thành viên hiển thị trọn vẹn trong viewport, không phát sinh thanh cuộn dọc ngoài ý muốn.
- Hộp thoại thêm/xóa Thành viên co giãn tối đa `max-h-[85vh]` với nội dung cuộn bên trong, hỗ trợ bàn phím ảo di động mà không che nút thao tác.
- Phân trang dữ liệu lịch sử > 6 người: hiển thị 6 người/trang với thanh chuyển trang, tự động lùi về trang trước khi trang hiện tại bị xóa hết.

### 07 — Giới hạn 6 Thành viên khi nhiều thiết bị cùng thêm
- Migration PostgreSQL với hàm trigger `BEFORE INSERT` kết hợp khóa giao dịch cố vấn `pg_advisory_xact_lock(hashtext(NEW.household_code))`.
- Ánh xạ mã lỗi PostgreSQL `P0001` thành lỗi miền `capacity-exceeded` trong `SupabaseMemberRepository`.
- Không ảnh hưởng đến dữ liệu cũ đã có > 6 người (chỉ áp dụng chặn khi thêm mới).

### 08 — Menu/Kế hoạch báo lỗi tải và cho Thử lại
- Phân biệt rõ rệt giữa: lỗi tải ban đầu (hiển thị giao diện báo lỗi kèm nút "Thử lại"), lỗi tải nền / refresh (hiển thị banner báo lỗi phía trên, giữ nguyên danh sách dữ liệu cũ), và trạng thái dữ liệu trống (empty state).
- Thử lại tải dữ liệu thành công khôi phục lại trạng thái bình thường.
- Ngăn ngừa race condition bằng con trỏ request và tham chiếu Gia đình mới nhất.
