# Bản xem trước màn hình chọn Thành viên

**Câu hỏi đã chốt:** Người dùng chọn **A — Lưới như Netflix**. Bản xem trước hiện bổ sung nút xóa Thành viên ở góc trên bên phải theo yêu cầu mới.

Chạy `npm run prototype:members`. Mở `http://127.0.0.1:5174/?prototype=members&variant=A`.

- Bấm **Xóa** ở góc trên bên phải để bật chế độ xóa. Các ô hiện biểu tượng thùng rác.
- Bấm một ô để mở xác nhận có tên Thành viên. **Giữ lại** hủy; **Xóa thành viên** gỡ người đó khỏi dữ liệu minh họa.
- Bấm **Xong** để thoát chế độ xóa và tiếp tục chọn người.

Bấm **Gia đình trống** để xem trạng thái chưa có người, **Có Thành viên** để khôi phục mẫu. Có thể thêm Thành viên rồi bấm chọn để xem bước vào Kế hoạch; thao tác đổi Gia đình chỉ xuất hiện tại Kế hoạch. Kế hoạch và Menu giữ Thành viên đã chọn, không có nút hoặc luồng đổi Thành viên. Bản hiện tại chỉ giữ phương án A.

Đây là prototype giao diện dùng dữ liệu minh họa trong bộ nhớ, không phụ thuộc database. Tải lại đặt lại dữ liệu và yêu cầu chọn Thành viên. Trạng thái hiện tại được hiển thị ngoài khung app. Mã prototype được chặn trong build production.

Nguồn: `src/components/MemberSelection.prototype.tsx` và CSS đi kèm. Ba phương án gốc đã lưu trên nhánh throwaway **codex/prototype-household-members-20261008**, commit **f07f7af5c8cc5b8ee99402b41d33dd62c20bb83c**. Frontend thật sẽ được triển khai riêng với database và kiểm thử luồng.

**Trạng thái:** A đã được chọn; yêu cầu xóa ở góc và bỏ đổi Thành viên đã được tổng hợp vào [spec ready-for-agent](./spec.md). Prototype chưa tác động dữ liệu Thành viên thật; frontend sẽ được triển khai từ spec.

## Đã kiểm tra

- Ba phương án hiển thị trong browser trên khung điện thoại nhỏ, có thanh đổi phương án và URL tương ứng.
- Gia đình trống hiển thị lời mời thêm. Ô tên bắt đầu trống; thêm người mới trở về danh sách, vẫn cần bấm chọn để vào Kế hoạch.
- Tên ` mẹ ` bị từ chối khi đã có `Mẹ`; phím mũi tên trong ô nhập không đổi phương án.
- Sau khi chọn, Kế hoạch và Menu không có thao tác đổi Thành viên; đổi Gia đình chỉ xuất hiện ở Kế hoạch, không ở Menu hay màn hình chọn.
- Typecheck và build thành công. Bundle production không chứa mã/CSS prototype. Browser không ghi nhận lỗi console.

## Ảnh xem trước

Các ảnh cập nhật sau khi bổ sung thao tác xóa:

- [A — Nút xóa ở góc màn hình](./prototype-preview-A-delete-action.jpg)
- [Chế độ xóa](./prototype-delete-mode.jpg)
- [Xác nhận xóa có tên Thành viên](./prototype-delete-confirm.jpg)
- [Kế hoạch đã bỏ thao tác đổi Thành viên](./prototype-plan-without-member-switch.jpg)

Ảnh bố cục A và các trạng thái đã chọn trước đó:

- [A — Lưới như Netflix](./prototype-preview-A.jpg)
- [Gia đình chưa có Thành viên](./prototype-empty.jpg)
- [Thêm Thành viên](./prototype-add-member.jpg)

Mã và ảnh B/C được giữ trên nhánh snapshot ở trên.

## Kiểm tra bổ sung luồng xóa

- Nút góc trên bật chế độ xóa, từng ô hiện dấu thùng rác và không chuyển sang Kế hoạch khi bấm.
- Xác nhận hiển thị đúng tên. **Giữ lại** giữ đủ 4 Thành viên; xác nhận xóa Linh còn 3 Thành viên và không còn ô Linh.
- Xóa hết Thành viên quay lại trạng thái Gia đình trống, vẫn nhớ Mã nhà và cho thêm người. Thêm Hải sau đó trở về danh sách chưa chọn.
- Các thao tác kiểm tra chỉ ảnh hưởng dữ liệu minh họa trong bộ nhớ.

## Kiểm tra sau khi bỏ đổi Thành viên

- Kế hoạch chỉ còn nút **Đổi gia đình** trên đầu trang; Menu không có thao tác đổi Thành viên hoặc Gia đình.
- Chuyển từ Kế hoạch sang Menu vẫn giữ Thành viên đã chọn. Tải lại web trở về **Bạn là ai?** và cần bấm chọn để vào Kế hoạch.
- Typecheck thành công; đã kiểm tra trực tiếp trong browser và lưu ảnh Kế hoạch mới ở trên.
