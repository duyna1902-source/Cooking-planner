Status: ready-for-agent

# Ghi nhớ Thành viên và cải thiện điều hướng Gia đình

## Yêu cầu đã nêu — 2026-10-10

- Màn hình chọn Thành viên nằm cố định trong khung nhìn, không cuộn lên xuống.
- Ghi nhớ Thành viên qua F5 và mở lại ứng dụng, thay yêu cầu chọn lại mỗi lần mở.
- Có nút từ màn hình chọn Thành viên quay về màn hình chọn Gia đình.
- Thiết kế lại header Kế hoạch cho gọn: bên phải là nút chỉ hiện tên Thành viên; bấm mở đúng hai mục **Đổi gia đình** và **Đổi thành viên**.
- Điều chỉnh hoặc bỏ các nhãn/nút Mã nhà, Online, Chia sẻ và Đổi gia đình đang chiếm chỗ trên header.
- Màn hình chọn Gia đình hiển thị các Gia đình đã vào bằng ô vuông để chọn lại nhanh.
- Giữ chức năng **Tạo Nhà Mới** và **Tham Gia Bằng Mã**.

Đã hoàn tất phiên `grill-with-docs`: Q1–Q15 được người dùng xác nhận, bao gồm hệ quả kết hợp quy tắc nhiều tab với bước đang chọn. Theo yêu cầu `to-spec`, [đặc tả tổng hợp](./spec.md) và [ticket triển khai](./issues/01-household-navigation-ux.md) đã được xuất bản với trạng thái ready-for-agent. Phương án kiểm thử đã được người dùng chấp nhận; tính năng chưa được triển khai trong phiên xuất bản tài liệu.

## Đối chiếu hiện trạng

- [CONTEXT.md](../../CONTEXT.md) định nghĩa **Thành viên**, **Gia đình** và **Mã nhà**; “user/member” trong yêu cầu dùng thuật ngữ **Thành viên**.
- [ADR-0006](../../docs/adr/0006-household-members-and-explicit-selection.md) yêu cầu chọn Thành viên lại khi tải trang/tab/PWA, chưa cho đổi Thành viên trong ứng dụng và chưa cho đổi Gia đình từ màn chọn Thành viên. Yêu cầu mới thay đổi ba ràng buộc này; cần cập nhật tài liệu quyết định khi chốt đầy đủ hành vi mới.
- [ADR-0007](../../docs/adr/0007-zero-scroll-member-selection-capped-at-six.md) và [spec không cuộn](../zero-scroll-member-selection/spec.md) đã quy định màn chọn cố định và tối đa 6 Thành viên. Code đã khóa cuộn màn nền và thu gọn theo số người/chiều cao; chưa kiểm chứng trực quan vấn đề người dùng đang gặp. Hộp thoại thêm/xóa hiện cho cuộn khi thiếu chỗ.
- [storage.ts](../../src/services/storage.ts) chỉ nhớ một Mã nhà. [App.tsx](../../src/App.tsx) giữ Thành viên trong phiên, reset khi khởi tạo; link `?join=CODE` ưu tiên hơn Mã nhà đã lưu.
- [AppHeader.tsx](../../src/components/AppHeader.tsx) dùng chung cho Kế hoạch và Menu, nhưng hiện chỉ Kế hoạch có thao tác đổi Gia đình. Nhãn Online lấy từ chế độ repository, không phản ánh kết nối thời gian thực.
- [OnboardingModal.tsx](../../src/components/OnboardingModal.tsx) tạo/tham gia bằng mã; chưa có lịch sử Gia đình hoặc tên Gia đình. Luồng tham gia kiểm tra định dạng mã, chưa xác minh một bản ghi Gia đình tồn tại.
- Thành viên chỉ được tải/theo dõi khi màn chọn đang mở; hiện chưa kiểm tra một Thành viên đã chọn có bị xóa từ thiết bị khác khi đang ở Kế hoạch/Menu.

## Cây quyết định

### Vòng 1 — đã chốt Q1–Q7

1. **Đã chốt — ghi nhớ khi mở lại, chọn lại khi đổi Gia đình:** F5/mở lại giữ Thành viên đã chọn. Khi chủ động đổi Gia đình, phải chọn Thành viên lại, kể cả Gia đình từng vào. Không áp dụng đề xuất tự khôi phục Thành viên riêng cho từng Gia đình khi bấm ô lịch sử. Q8 chốt lưu bước đang chọn ngay khi chủ động đổi.
2. **Đã chốt — giữ Mã nhà để chia sẻ:** Mã nhà gọn bên trái, bấm để chia sẻ; nút tên bên phải có đúng hai mục đã yêu cầu. Bỏ nút Chia sẻ riêng và badge Online thường trực; Q14 chốt thông báo tải/lỗi ở nội dung liên quan.
3. **Đã chốt — chỉ ở Kế hoạch:** menu tên Thành viên có Đổi gia đình / Đổi thành viên chỉ xuất hiện ở Kế hoạch, không mở rộng sang Menu.
4. **Đã chốt — nội dung ô Gia đình:** biểu tượng nhà + Mã nhà; xếp Gia đình vừa vào gần nhất lên đầu. Không bổ sung tên gợi nhớ trong phạm vi này.
5. **Đã chốt — Bỏ khỏi danh sách:** có thao tác quên Gia đình trên trình duyệt/thiết bị đang dùng, không xóa dữ liệu dùng chung. Danh sách ô 2 cột được cuộn riêng khi nhiều nhà; hai nút Tạo Nhà Mới / Tham Gia Bằng Mã vẫn dễ tiếp cận. Q12 chốt có hộp xác nhận trước khi bỏ.
6. **Đã chốt — thời điểm ghi lịch sử:** ghi ngay khi tạo/tham gia bằng mã được chấp nhận, không đợi chọn Thành viên. Gia đình chưa có Thành viên vẫn xuất hiện lần sau. Lưu theo Mã nhà đã chuẩn hóa, cùng một Gia đình chỉ có một ô.
7. **Đã chốt — phạm vi không cuộn:** màn chọn nền luôn cố định; hộp thoại được cuộn khi bàn phím hoặc màn hình thấp làm thiếu chỗ để người dùng vẫn thao tác được với form.

### Vòng 2 — đã chốt Q8–Q14

8. **Đã chốt — đổi dở rồi tải lại:** sau khi bấm Đổi thành viên, Đổi gia đình hoặc quay về chọn Gia đình, lưu bước đang chọn; F5/mở lại tiếp tục bước đó, không tự khôi phục người cũ. Muốn dùng lại thì bấm ô Gia đình/tên Thành viên cũ. Không bổ sung nút Hủy để bỏ qua bước chọn người.
9. **Đã chốt — kiểm tra Thành viên khi khôi phục:** kiểm tra với database; còn tồn tại thì tự vào, đã xóa thì thông báo và mở chọn Thành viên. Mất mạng/lỗi tải thì giữ thông tin đã nhớ, hiển thị Thử lại và lối về chọn Gia đình, không coi lỗi tải là người đã bị xóa. Phiên đã mở giữ cách hoạt động hiện tại; chưa bổ sung việc đẩy người dùng ra ngay khi Thành viên bị xóa từ thiết bị khác.
10. **Đã chốt — nhiều tab đã chọn Thành viên:** các tab đang mở giữ lựa chọn riêng, không tự đổi tên khi tab khác đổi; tab mới hoặc F5 lấy lựa chọn gần nhất đã lưu trên trình duyệt. Ví dụ tab A là Tôm, tab B chọn Mẹ: A vẫn là Tôm, F5 A sẽ dùng Mẹ. Q15 xác nhận quy tắc này áp dụng cả khi trạng thái gần nhất là một bước đang chọn.
11. **Đã chốt — link tham gia:** link Gia đình khác ưu tiên hơn lựa chọn đã nhớ và yêu cầu chọn Thành viên; link đúng Gia đình đang dùng giữ Thành viên hợp lệ đã nhớ. Mã link được xử lý một lần để F5 sau đó tuân theo trạng thái đã lưu.
12. **Đã chốt — xác nhận Bỏ khỏi danh sách:** nút ba chấm ở ô Gia đình mở thao tác Bỏ khỏi danh sách; hộp xác nhận nêu rõ Mã nhà và việc chỉ quên trên thiết bị. Xác nhận gỡ ô, không vào Gia đình đó. Muốn vào lại phải nhập mã hoặc dùng link; không tự thêm lại một mục đã quên từ phiên còn mở.
13. **Đã chốt — dữ liệu vượt 6 Thành viên:** giữ giới hạn 6 và chặn thêm vượt giới hạn ngay cả khi nhiều thiết bị thêm đồng thời. Nếu Gia đình cũ đã có hơn 6, dùng phân trang tối đa 6 người/trang thay vì cuộn hoặc che người còn lại. Không tự xóa Thành viên đang có.
14. **Đã chốt — bỏ Online và phản hồi tải/lỗi:** header bình thường chỉ có mã/tên; thông báo đang tải hoặc lỗi + Thử lại xuất hiện ở vùng nội dung liên quan, không thêm badge Online mới. Bao gồm việc tránh hiển thị Menu/Kế hoạch trống khi thực chất tải thất bại.

### Xác nhận cuối — đã chốt Q15

15. **Đã chốt — trạng thái gần nhất gồm bước đang chọn:** tab B bấm Đổi thành viên hoặc Đổi gia đình thì F5 tab A mở bước đó theo trạng thái B vừa lưu. Tab A chưa F5 tiếp tục phiên đang dùng. Người dùng xác nhận bản tổng hợp và yêu cầu xuất bản bằng to-spec.

### Nhánh đã đóng và việc kiểm tra khi triển khai

- Nhánh tên gợi nhớ đã đóng theo Q4: không bổ sung trong phạm vi này.
- Kiểm tra tên/mã dài, bàn phím, màn hình thấp và dữ liệu cũ vượt 6 người; không được chỉ che nội dung bằng overflow rồi xem là đạt.
- Hệ quả tổng hợp Q8 + Q10 đã được xác nhận tại Q15: trạng thái được lưu gần nhất có thể là Kế hoạch với Thành viên đã chọn, chọn Thành viên, hoặc chọn Gia đình. Tab đang mở giữ trạng thái riêng; tab mới/F5 dùng trạng thái đã lưu gần nhất. Không quay lại ghi đè trạng thái chung chỉ vì một tab cũ được đưa ra trước màn hình.

## Tài liệu tổng hợp

- [CONTEXT.md](../../CONTEXT.md) bổ sung Gia đình đã lưu, không chứa chi tiết lưu trữ hoặc bố cục.
- [ADR-0008](../../docs/adr/0008-remember-member-and-explicit-household-switch.md) ghi các quyết định Q1–Q15 về ghi nhớ/đổi Gia đình, thay phần liên quan của ADR-0006.
- ADR-0007 bổ sung xử lý bàn phím, giới hạn đồng thời và dữ liệu cũ hơn 6 Thành viên.
- [spec.md](./spec.md) tổng hợp hành vi, 78 user stories, quyết định triển khai và kiểm thử với trạng thái ready-for-agent; [ticket tổng](./issues/01-household-navigation-ux.md) được giữ nguyên. [Danh sách ticket con đã xuất bản](./ticket-plan.md) gồm 02–08 và các cạnh phụ thuộc đã được chấp nhận. Chưa triển khai hoặc chạy kiểm thử tính năng mới.

## Comments

- 2026-10-10: Đã khảo sát code và tài liệu qua hai tác vụ chỉ đọc theo hướng dẫn của skill grilling. Chưa chạy ứng dụng, chưa kiểm chứng lỗi cuộn thực tế, chưa sửa code hoặc thay các ADR hiện hành.
- 2026-10-10: Người dùng trả lời Q1–Q3: F5 nhớ người nhưng chủ động đổi Gia đình phải chọn lại; giữ Mã nhà bấm để chia sẻ; menu đổi chỉ có ở Kế hoạch. Q4–Q7 chưa được trả lời; chưa coi các đề xuất đó là đã chấp nhận.
- 2026-10-10: Người dùng chấp nhận đề xuất Q4–Q5: ô biểu tượng nhà + Mã nhà, có Bỏ khỏi danh sách chỉ trên thiết bị; danh sách hai cột, nhà gần nhất trước, được cuộn riêng. Còn chờ Q6–Q7 của vòng 1.
- 2026-10-10: Người dùng chấp nhận đề xuất Q6–Q7, hoàn tất vòng 1. Bổ sung thuật ngữ Gia đình đã lưu trong CONTEXT.md theo khái niệm đã thống nhất. Chưa chốt các tình huống khôi phục/điều hướng ở vòng tiếp theo.
- 2026-10-10: Khảo sát chỉ đọc bổ sung xác nhận không có cache cloud cho mở offline sau F5; PlanView/MenuView hiện bỏ qua lỗi tải và có thể hiện trạng thái trống; chưa có xử lý dữ liệu Thành viên >6 hoặc giới hạn database khi thêm đồng thời. Đưa các lựa chọn liên quan vào Q9, Q13, Q14, chưa mở rộng phạm vi triển khai khi chưa được chấp nhận.
- 2026-10-10: Người dùng chấp nhận Q8, Q10, Q11 theo đề xuất; Q9 trả lời có; Q12–Q13 trả lời ok. Ghi nhận Q8–Q13 đã chốt, Q14 còn chờ. Chưa triển khai code hoặc migration database.
- 2026-10-10: Người dùng trả lời Q14 có. Hoàn tất Q1–Q14; tổng hợp spec, ghi ADR và chỉ dẫn thay thế tài liệu cũ. Còn xác nhận hiểu biết chung của bản tổng hợp và hệ quả kết hợp Q8/Q10; không coi trả lời từng câu là đã cho phép triển khai trước bước kết thúc skill.
- 2026-10-10: Người dùng xác nhận Q15 và yêu cầu to-spec, sau đó chấp nhận phương án kiểm thử ở cấp App, database thật cho thêm đồng thời và trình duyệt cho bố cục/bàn phím/nhiều tab. Xuất bản spec và ticket với trạng thái ready-for-agent, hoàn tất phiên thiết kế.
- 2026-10-11: Theo yêu cầu to-tickets và câu trả lời “ok rồi”, xuất bản 7 ticket con 02–08, trạng thái ready-for-agent. Các cạnh chặn: 02 → 03, 02 → 04 → 05; 06, 07, 08 độc lập. Ticket tổng 01 không được sửa hoặc đóng.
