Status: approved

# Bản chia ticket — Ghi nhớ Thành viên và điều hướng Gia đình

Nguồn: [đặc tả đã chốt](./spec.md) và [ticket tổng 01](./issues/01-household-navigation-ux.md). Bản này đã được người dùng phê duyệt để triển khai theo quy trình implement-spec. Không sửa hoặc đóng ticket tổng. Các ticket con 02–08 được xuất bản thành từng file riêng tại `.scratch/household-navigation-ux/issues/`, mang trạng thái `ready-for-agent`.

## Nguyên tắc chia

- Mỗi ticket là một hành vi hoàn chỉnh qua UI, dữ liệu và kiểm thử; ticket nào cần database thì bao gồm cả migration, hợp đồng lỗi và phản hồi người dùng.
- Kiểm thử hành vi ưu tiên cấp App và các hợp đồng đã có; kiểm tra database thật cho cạnh tranh và trình duyệt cho bố cục/multi-tab nằm trong ticket tạo ra hành vi tương ứng.
- Không có nhu cầu refactor rộng trước khi làm tính năng. Ticket 02 mở rộng storage theo cách tương thích ngay trong luồng khôi phục; các call site cũ giữ hoạt động trong lúc chuyển đổi.
- ID con bắt đầu từ 02 vì 01 đã là ticket tổng của cùng tính năng. Số thứ tự không phải chuỗi phụ thuộc bắt buộc; chỉ các cạnh nêu rõ mới chặn bắt đầu.
- Việc nhiều ticket chạm một module được xử lý khi tích hợp, không tự tạo cạnh phụ thuộc chỉ vì trùng file.

## 02 — Ghi nhớ Thành viên khi F5 và mở lại

**What to build:** Sau khi chọn người, F5/mở lại vào Kế hoạch bằng Thành viên đã được kiểm tra với database; link tham gia và nhiều tab dùng đúng lựa chọn đã chốt.

**Blocked by:** None (can start immediately).

- [ ] Lưu và khôi phục Gia đình + định danh Thành viên qua hợp đồng storage hiện có; thông tin từ bản chỉ nhớ Mã nhà vẫn dùng được, còn Biệt danh cục bộ không dùng để tự chọn người.
- [ ] Có trạng thái tải trước khi mở nội dung; Thành viên hợp lệ được khôi phục, người đã xóa dẫn về chọn với thông báo, lỗi tải giữ lựa chọn và có Thử lại cùng lối về chọn Gia đình.
- [ ] Mô hình lưu hỗ trợ chọn Gia đình, chọn Thành viên và đã chọn người. Tạo/tham gia, chọn người và thao tác đổi Gia đình hiện có cập nhật đúng trạng thái; F5 khi đang ở các bước này không quay vào người cũ.
- [ ] Các tab đang chạy giữ riêng lựa chọn, tab mới/F5 lấy trạng thái gần nhất; tab cũ trở lại từ nền hoặc request đến muộn không tự ghi đè trạng thái mới hơn.
- [ ] Link khác Gia đình mở chọn người, link cùng Gia đình giữ lựa chọn hợp lệ; xử lý chỉ thị tham gia một lần và bảo toàn các phần URL khác.
- [ ] Kiểm thử App qua storage/repository được truyền vào cho khôi phục, xóa người, lỗi/retry, chuyển mã và phản hồi đến muộn; có kiểm tra trình duyệt cho F5/tab mới/PWA theo phạm vi đã chốt.

Ticket này chưa tạo menu tên mới hoặc các ô lịch sử; có thể chứng minh bằng chọn Thành viên và các lối tạo/tham gia/đổi Gia đình hiện có.

## 03 — Header gọn và đổi Thành viên/Gia đình trong Kế hoạch

**What to build:** Header có Mã nhà để chia sẻ và nút tên mở đúng hai thao tác đổi; màn chọn Thành viên có lối về chọn Gia đình, các bước đổi được nhớ qua F5.

**Blocked by:** 02 — Ghi nhớ Thành viên khi F5 và mở lại.

- [ ] Header gọn một hàng; Mã nhà mở hộp chia sẻ đầy đủ mã/link/sao chép, thay nút Chia sẻ riêng.
- [ ] Tên trên Kế hoạch mở đúng Đổi gia đình / Đổi thành viên; trên Menu không có menu đổi. Bỏ nhãn Online/Chế độ máy thường trực và nút đổi nằm trực tiếp ở header.
- [ ] Đổi Thành viên giữ Gia đình và mở danh sách; Đổi Gia đình mở màn chọn Gia đình. Nút về chọn Gia đình dùng được khi danh sách người đang tải, lỗi hoặc trống.
- [ ] Mỗi thao tác đổi ghi bước đang chọn ngay, không có đường Hủy tự khôi phục người cũ. F5 và tab mới tuân theo trạng thái gần nhất, kể cả bước đổi chưa hoàn tất ở tab khác.
- [ ] Tên/mã dài vẫn tiếp cận được và không làm tràn; menu dùng được bằng bàn phím, đóng khi chọn/bấm ngoài/Escape; lời hướng dẫn chia sẻ dùng thuật ngữ Thành viên.
- [ ] Kiểm thử App cho menu, đổi, quay lại, chia sẻ, tác giả sau đổi và Q15; kiểm tra trình duyệt cho header màn hẹp và nhiều tab.

Phụ thuộc 02 vì các lối đổi mới phải cập nhật trạng thái được nhớ và khôi phục đúng quy tắc, thay vì tạo một cơ chế lưu song song.

## 04 — Chọn nhanh các Gia đình đã lưu

**What to build:** Gia đình đã tạo/tham gia xuất hiện thành ô vuông biểu tượng nhà + Mã nhà; bấm ô mở chọn Thành viên và vẫn tạo/tham gia bằng mã như trước.

**Blocked by:** 02 — Ghi nhớ Thành viên khi F5 và mở lại.

- [ ] Ghi danh sách local ngay khi tạo/tham gia được chấp nhận, kể cả chưa có người; ghi nhận cả lần chủ động mở link hợp lệ hoặc chọn lại một ô.
- [ ] Chuẩn hóa mã, không trùng ô, nhà vừa vào xếp trước; giữ Mã nhà từ bản cũ trong danh sách.
- [ ] Danh sách ô hai cột được cuộn riêng khi nhiều nhà; hai nút Tạo Nhà Mới / Tham Gia Bằng Mã luôn dễ tiếp cận, kể cả danh sách trống.
- [ ] Chọn ô luôn chuyển sang chọn Thành viên, kể cả cùng Gia đình vừa dùng; lưu đúng bước cho F5 và không khôi phục người riêng theo từng Gia đình.
- [ ] Giữ luồng tạo nhà thành công/chia sẻ, validation mã và lối quay lại các bước nhập mã; mã không hợp lệ không tạo ô.
- [ ] Kiểm thử App cho ghi ngay, khôi phục lịch sử, sắp xếp/chống trùng, mã cũ và chọn lại người; kiểm tra trình duyệt cho danh sách nhiều ô.

Phụ thuộc 02 vì chọn một ô phải thay trạng thái đã nhớ, bảo đảm không tự khôi phục Thành viên cũ. Không phụ thuộc 03: có thể mở màn chọn Gia đình qua lối đổi đã có hoặc lần vào đầu.

## 05 — Bỏ Gia đình khỏi danh sách trên thiết bị

**What to build:** Menu trên ô cho quên một Gia đình sau xác nhận, giữ nguyên dữ liệu chung và cho vào lại bằng mã/link.

**Blocked by:** 04 — Chọn nhanh các Gia đình đã lưu.

- [ ] Nút ba chấm mở Bỏ khỏi danh sách; thao tác quản lý không vô tình chọn ô.
- [ ] Xác nhận nêu đúng Mã nhà và ý nghĩa chỉ quên trên thiết bị; Hủy giữ ô, xác nhận gỡ đúng ô qua F5.
- [ ] Không xóa Thành viên/Menu/Kế hoạch/bình luận hoặc đổi phiên đang mở ở tab/thiết bị khác.
- [ ] Tab cũ render, trở lại từ nền hoặc tải dữ liệu không tự thêm lại ô đã quên; chỉ chủ động tham gia lại mới lưu lại ô.
- [ ] Gỡ ô cuối vẫn có hai chức năng tạo/tham gia; vào lại bằng mã/link lưu lại đúng một ô và yêu cầu chọn người theo quy tắc đổi Gia đình.
- [ ] Kiểm thử App cho xác nhận/hủy, bảo toàn dữ liệu, gỡ ô cuối, vào lại và hai tab cùng dùng danh sách; không chỉ kiểm tra thao tác xóa một khóa storage.

Phụ thuộc 04 vì cần ô Gia đình và vòng đời ghi lịch sử thật để thực hiện và kiểm chứng thao tác quên.

## 06 — Chọn Thành viên không cuộn và phân trang dữ liệu cũ

**What to build:** Màn chọn người vừa một khung nhìn, form dùng được khi mở bàn phím, và Gia đình cũ hơn 6 người vẫn chọn/xóa được mọi người qua các trang.

**Blocked by:** None (can start immediately).

- [ ] Kiểm chứng và hoàn thiện bố cục với 0, 1, 4, 5, 6 người: tên, nút và phản hồi không bị che, nền không cuộn, vùng chạm tối thiểu 44×44.
- [ ] Thu gọn phần trang trí/spacing trên màn thấp, giữ lưới thích ứng và thông báo nổi không làm dịch chuyển nút.
- [ ] Hộp thoại thêm/xóa có thể cuộn khi bàn phím làm thiếu chỗ, luôn tiếp cận được các nút thao tác.
- [ ] Dữ liệu 7+ người hiển thị tối đa 6 người/trang, có số trang và chuyển trang; không tự xóa hoặc giấu người.
- [ ] Chọn/xóa và cập nhật realtime hoạt động ở mọi trang; xóa làm trang rỗng chuyển tới trang hợp lệ, giới hạn thêm vẫn tính tổng Gia đình.
- [ ] Kiểm thử hành vi từ App cho phân trang, chọn/xóa và đồng bộ; có bằng chứng trình duyệt cho màn nhỏ, màn thấp/ngang, tên dài và bàn phím ảo.

Không phụ thuộc ticket giới hạn database: phân trang phải hoạt động với dữ liệu cũ độc lập với cơ chế chặn thêm. Ticket 03 chịu trách nhiệm lối quay về Gia đình mới; khi tích hợp, giữ nó trong bố cục đã kiểm chứng.

## 07 — Giới hạn 6 Thành viên khi nhiều thiết bị cùng thêm

**What to build:** Hai thiết bị cùng thêm khi Gia đình có 5 người thì chỉ một lượt thành công; lượt còn lại thấy thông báo đầy và danh sách đã xác nhận.

**Blocked by:** None (can start immediately).

- [ ] Thay đổi database bảo đảm kiểm tra giới hạn và thêm không thể cùng vượt qua dưới cạnh tranh; giữ chặn sớm trên form.
- [ ] Lỗi đầy đi qua hợp đồng repository và hiện đúng thông báo trên form; không bị nhầm với tên không hợp lệ hoặc lỗi kết nối.
- [ ] Thiết bị thêm thất bại cập nhật danh sách, không báo thành công giả hoặc chèn người cục bộ chưa xác nhận.
- [ ] Migration và schema khởi tạo giữ dữ liệu cũ hơn 6, vẫn đọc/xóa được và không ảnh hưởng dữ liệu Gia đình khác hoặc bình luận.
- [ ] Có kiểm tra database thật với hai request đồng thời, đọc kết quả đã commit, cùng kiểm thử adapter và App cho phản hồi người dùng. Mock hoặc khóa nút client không đủ để nghiệm thu cạnh tranh.

Không phụ thuộc 06: có thể nghiệm thu qua form thêm hiện có với Gia đình 5–6 người; dữ liệu cũ được bảo toàn ngay cả khi phân trang chưa triển khai.

## 08 — Menu/Kế hoạch báo lỗi tải và cho Thử lại

**What to build:** Người dùng thấy rõ đang tải, tải thất bại hoặc dữ liệu thực sự trống; Thử lại phục hồi và dữ liệu đã tải không biến mất khi làm mới lỗi.

**Blocked by:** None (can start immediately).

- [ ] Menu và Kế hoạch hiện trạng thái tải; thất bại lần đầu có lỗi + Thử lại ở nội dung liên quan, không hiện trống giả.
- [ ] Làm mới lỗi giữ dữ liệu đã tải cùng thông báo/Thử lại; thành công sau đó cập nhật dữ liệu và bỏ lỗi.
- [ ] Với Kế hoạch có nhiều nguồn dữ liệu, lỗi một nguồn không được xem như tổng thể đã tải thành công và trống.
- [ ] Gia đình cũ/request đến muộn không cập nhật màn mới; phản hồi dựa trên thao tác thật, không bổ sung badge Online hoặc fallback cloud offline.
- [ ] Kiểm thử App qua repository điều khiển được lỗi/thành công cho lần đầu, làm mới, retry, dữ liệu trống thật và đổi Gia đình; giữ các thao tác Menu/Kế hoạch đang có.

Không phụ thuộc header mới: phản hồi nằm trong nội dung, có thể nghiệm thu bằng luồng chọn người hiện tại. Lỗi khôi phục Thành viên thuộc 02.

## Phụ thuộc và các ticket có thể bắt đầu

- 02 → 03.
- 02 → 04 → 05.
- 06, 07, 08 không bị ticket khác chặn.
- Ban đầu có thể nhận 02, 06, 07, 08. Sau khi 02 xong, 03 và 04 mở; 05 mở khi 04 xong.
- Mỗi ticket có kiểm thử và bằng chứng nghiệm thu của chính nó. Khi tích hợp, chạy regression, typecheck/build phù hợp và kiểm tra hành trình kết hợp giữa các phần; không dồn mọi kiểm thử vào một ticket cuối.

## Comments

- 2026-10-10: Soạn bản chia theo skill to-tickets từ đặc tả đã được xác nhận.
- 2026-10-11: Người dùng phê duyệt bản phân rã 7 tickets (02–08) và yêu cầu triển khai theo implement-spec.
