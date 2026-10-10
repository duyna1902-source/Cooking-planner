Status: ready-for-agent

# Ghi nhớ Thành viên và cải thiện điều hướng Gia đình

## Problem Statement

Người dùng phải chọn lại Thành viên mỗi lần F5 hoặc mở lại ứng dụng, dù vẫn sử dụng cùng Gia đình và cùng người. Khi muốn đổi Gia đình, họ phải nhập lại Mã nhà; màn chọn Thành viên chưa có lối quay về chọn Gia đình. Header Kế hoạch chứa nhiều nhãn và nút khiến bố cục khó nhìn, trong khi chưa có thao tác đổi Thành viên ngay trong phiên.

Người dùng cũng yêu cầu màn chọn Thành viên cố định trong một khung nhìn. Bố cục hiện đã có cơ chế khóa cuộn nhưng cần kiểm chứng và hoàn thiện để nội dung không bị che trên màn hình thấp hoặc với dữ liệu cũ vượt giới hạn 6 người. Lỗi tải Menu/Kế hoạch hiện có thể bị hiểu nhầm là chưa có dữ liệu, còn nhãn Online thường trực không phản ánh kết nối thực tế.

## Solution

Ứng dụng nhớ Gia đình và Thành viên đang dùng trên trình duyệt/thiết bị; khi mở lại sẽ kiểm tra Thành viên rồi tự vào Kế hoạch. Chủ động đổi Gia đình luôn yêu cầu chọn người lại. Bước chọn đang thực hiện cũng được nhớ, và tab mới/F5 dùng trạng thái gần nhất đã lưu trong khi các tab đang chạy giữ trạng thái riêng.

Màn chọn Gia đình có các ô vuông biểu tượng nhà + Mã nhà, xếp nhà vừa vào trước, cùng thao tác Bỏ khỏi danh sách có xác nhận. Hai chức năng Tạo Nhà Mới / Tham Gia Bằng Mã tiếp tục được giữ. Màn chọn Thành viên có nút về chọn Gia đình, nền không cuộn và phân trang cho dữ liệu cũ hơn 6 người; hộp thoại được cuộn khi bàn phím làm thiếu chỗ.

Header có Mã nhà bấm để chia sẻ và, riêng tại Kế hoạch, nút tên Thành viên mở hai lựa chọn Đổi gia đình / Đổi thành viên. Thông báo tải, lỗi và Thử lại xuất hiện tại nội dung liên quan. Giới hạn thêm tối đa 6 Thành viên được bảo đảm cả khi nhiều thiết bị thao tác đồng thời.

### Phạm vi đã chốt

- Ghi nhớ trạng thái đang dùng hoặc đang chọn trên trình duyệt/thiết bị.
- Màn chọn Gia đình có lịch sử dạng ô vuông và Bỏ khỏi danh sách.
- Màn chọn Thành viên cố định, lối về chọn Gia đình, xử lý dữ liệu vượt 6 bằng phân trang.
- Header gọn, chia sẻ qua Mã nhà và menu tên Thành viên ở Kế hoạch.
- Phân biệt tải, lỗi và dữ liệu trống cho bước khôi phục, Menu và Kế hoạch.
- Bảo đảm giới hạn 6 Thành viên cả khi thêm đồng thời từ nhiều thiết bị.

## User Stories

1. As a Thành viên, I want the app to remember my selected Gia đình and Thành viên, so that I can resume without repeating the same selection.
2. As a Thành viên, I want F5 to restore my valid selection and open Kế hoạch, so that refreshing does not add unnecessary steps.
3. As a Thành viên, I want reopening the app or PWA to restore the saved state, so that returning to cooking is convenient.
4. As a Thành viên, I want a new tab to use the latest saved state, so that it starts from my most recent choice.
5. As a Thành viên, I want an already open tab to keep its selected person, so that another tab does not silently change who is using it.
6. As a Thành viên, I want refreshing an older tab to use the latest saved selection, so that persisted behavior is consistent across tabs.
7. As a Thành viên, I want a pending Đổi thành viên step to survive F5, so that the app does not automatically return to the previous person.
8. As a Thành viên, I want a pending Đổi gia đình step to survive reopening, so that I can finish choosing a Gia đình.
9. As a Thành viên, I want a new or refreshed tab to respect a selection step most recently opened in another tab, so that the latest saved state includes unfinished switching.
10. As a Thành viên, I want bringing an old tab to the foreground to preserve newer saved choices, so that passive viewing does not overwrite my navigation state.
11. As a Thành viên, I want the app to verify a remembered Thành viên before restoring it, so that the selected person still belongs to the intended Gia đình.
12. As a Thành viên, I want a loading state while my remembered selection is checked, so that I understand why Kế hoạch has not opened yet.
13. As a Thành viên, I want a remembered person who was deleted to lead back to selection with an explanation, so that I can choose a current Thành viên.
14. As a Thành viên, I want restoration to identify people by their identity within a Gia đình, so that a different person with the same name is not selected automatically.
15. As a Thành viên, I want a failed restoration check to retain my saved choice, so that I can retry without losing it.
16. As a Thành viên, I want Thử lại and a route to chọn Gia đình after a restoration error, so that I can recover or enter another Gia đình.
17. As a Thành viên, I want delayed results from a previous Gia đình to be ignored, so that they cannot replace my current selection.
18. As a Thành viên, I want new comments to use the person selected in the current tab, so that their authorship is correct.
19. As a Thành viên, I want old comments and shared cooking data preserved when people are switched or removed, so that the Gia đình keeps its history.
20. As a Thành viên, I want a name button on Kế hoạch, so that I can find the available switching actions in one place.
21. As a Thành viên, I want that button to show only my name, so that the header stays compact.
22. As a Thành viên, I want its menu to contain exactly Đổi gia đình and Đổi thành viên, so that the choices are clear.
23. As a Thành viên, I want Đổi thành viên to keep the current Gia đình and open its member list, so that I can change who is using the app.
24. As a Thành viên, I want Đổi gia đình to open the Gia đình picker, so that I can move to another shared cooking space.
25. As a Thành viên, I want to choose a person whenever I explicitly enter a Gia đình from the picker, so that switching spaces never reuses an unintended identity.
26. As a Thành viên, I want selecting the Gia đình I just left to require choosing a person again, so that explicit switching has one consistent rule.
27. As a Thành viên, I want switching actions to appear only on Kế hoạch, so that Menu retains the agreed scope.
28. As a Thành viên, I want the header Mã nhà to remain visible, so that I know which Gia đình I am using.
29. As a Thành viên, I want tapping Mã nhà to open sharing, so that a separate Chia sẻ button is unnecessary.
30. As a Thành viên, I want the sharing dialog to show the full Mã nhà and a copyable join link, so that I can invite someone accurately.
31. As a Thành viên, I want feedback after copying and instructions that mention choosing a Thành viên, so that sharing is understandable.
32. As a Thành viên, I want long names and codes to remain accessible without expanding the header into multiple rows, so that the layout stays usable on a small screen.
33. As a Thành viên, I want to operate and dismiss the name menu with keyboard or touch, so that the controls are accessible.
34. As a Thành viên, I want Online and Chế độ máy badges removed from the normal header, so that it remains focused on Gia đình and identity.
35. As a Thành viên, I want a clear route from member selection back to Gia đình selection, so that I am not trapped in the wrong Gia đình.
36. As a Thành viên, I want this route available while members are loading, missing, or failing to load, so that I can always change Gia đình.
37. As a Thành viên, I want returning to Gia đình selection to be remembered, so that F5 does not undo that action.
38. As a Thành viên, I want previously entered Gia đình displayed as square cards, so that I can enter without retyping their codes.
39. As a Thành viên, I want each saved card to show a home icon and Mã nhà, so that I can identify the intended Gia đình.
40. As a Thành viên, I want the most recently entered Gia đình first, so that the one I use is easy to find.
41. As a Thành viên, I want each normalized Mã nhà to appear only once, so that repeat visits do not clutter the list.
42. As a Thành viên, I want a Gia đình saved as soon as creation or joining is accepted, so that even one with no members is available next time.
43. As a Thành viên, I want saved Gia đình kept on the current browser or device, so that my shortcuts reflect this device's usage.
44. As a Thành viên, I want a two-column card list that can scroll independently, so that many saved Gia đình remain reachable.
45. As a Thành viên, I want Tạo Nhà Mới and Tham Gia Bằng Mã to remain easy to access, so that saved cards do not replace those functions.
46. As a Thành viên, I want those two actions available when no Gia đình are saved, so that I can start using the app.
47. As a Thành viên, I want creating a Gia đình to retain the success and sharing flow, so that I can invite others after creation.
48. As a Thành viên, I want invalid codes rejected without saving a card, so that mistakes do not create misleading shortcuts.
49. As a Thành viên, I want the card menu to offer Bỏ khỏi danh sách, so that I can remove unwanted saved Gia đình.
50. As a Thành viên, I want a confirmation naming the Mã nhà before removing its card, so that I know which shortcut will be forgotten.
51. As a Thành viên, I want canceling that confirmation to keep the card, so that an accidental action is harmless.
52. As a Thành viên, I want removing a card to leave all shared data intact, so that tidying my device does not delete a Gia đình.
53. As a Thành viên, I want card-management actions to avoid entering the Gia đình, so that they perform only the action I selected.
54. As a Thành viên, I want an old running session to avoid automatically recreating a forgotten card, so that my removal persists.
55. As a Thành viên, I want to rejoin a forgotten Gia đình by code or link, so that forgetting a shortcut is reversible.
56. As a Thành viên, I want a link for another Gia đình to open its member selection, so that the invitation takes me to the correct place.
57. As a Thành viên, I want a link for my current Gia đình to retain a valid remembered person, so that reopening the same invitation does not force an unnecessary choice.
58. As a Thành viên, I want join links handled once, so that a later F5 follows my saved state instead of repeating an old invitation.
59. As a Thành viên, I want the member-selection background to fit without vertical scrolling, so that all primary actions are visible together.
60. As a Thành viên, I want decoration and spacing to compact on short screens, so that names and controls remain reachable.
61. As a Thành viên, I want accessible touch targets and readable names, so that fitting the screen does not make selection difficult.
62. As a Thành viên, I want member dialogs to scroll when the keyboard reduces space, so that I can reach their fields and action buttons.
63. As a Thành viên, I want add/delete feedback to float without moving the grid, so that buttons do not jump during use.
64. As a Thành viên, I want an empty Gia đình to offer adding its first person, so that it remains usable.
65. As a Thành viên, I want adding a person to return to the member list without automatic selection, so that I explicitly choose who is using the app.
66. As a Thành viên, I want the six-person limit explained when reached, so that I understand why adding is unavailable.
67. As a Thành viên, I want simultaneous additions from different devices to respect the same limit, so that the Gia đình cannot accidentally exceed capacity.
68. As a Thành viên, I want a failed concurrent addition to report the limit and refresh the list, so that I see the actual confirmed result.
69. As a Thành viên, I want a legacy Gia đình with more than six people to show all people through pages, so that nobody is hidden or deleted to fit the screen.
70. As a Thành viên, I want to select and delete people on any page, so that pagination preserves the existing actions.
71. As a Thành viên, I want pagination to move to a valid page after deletion or synchronization, so that I never get stuck on an empty page.
72. As a Thành viên, I want loading indicators in Menu and Kế hoạch, so that I understand when data is being fetched.
73. As a Thành viên, I want failed initial loads to show an error and Thử lại, so that I do not mistake a connection problem for missing data.
74. As a Thành viên, I want already loaded content retained when refreshing fails, so that useful information stays visible while I retry.
75. As a Thành viên, I want empty-state messages only after successful empty loads, so that those messages are trustworthy.
76. As a Thành viên, I want the existing saved Mã nhà preserved during the update, so that I do not lose access to my Gia đình shortcut.
77. As a Thành viên, I want to choose a person once after upgrading from a version that never stored member identity, so that future restoration starts from a real selection.
78. As a Thành viên, I want legacy local nicknames ignored for automatic identity selection, so that they cannot create or select the wrong Thành viên.

## Implementation Decisions

### Modules và hợp đồng

- Cập nhật bộ điều phối App để quản lý ba trạng thái đã chốt, khôi phục có kiểm tra, xử lý link một lần và các lối đổi/quay lại. Không cần thêm một lớp đăng nhập hoặc tài khoản.
- Mở rộng hợp đồng HouseholdStorage hiện có để đọc/ghi trạng thái điều hướng và danh sách Gia đình đã lưu, cập nhật một mục theo Mã nhà, bỏ một mục và chuyển đổi dữ liệu cũ. Adapter local và adapter trong bộ nhớ phục vụ kiểm thử phải giữ cùng hành vi công khai. Tách dữ liệu lịch sử khỏi lựa chọn đang dùng để quên một ô không xóa dữ liệu chung.
- Tiếp tục dùng MemberRepository cho tải, thêm, xóa và theo dõi danh sách. Khôi phục kiểm tra định danh đã lưu trong danh sách của đúng Gia đình; lỗi đầy cần được phân biệt với lỗi tên, kết nối hoặc quyền để UI phản hồi đúng.
- Cập nhật màn chọn Gia đình để nhận danh sách đã lưu, chọn ô và bỏ ô; cập nhật màn chọn Thành viên để có lối về Gia đình, phân trang dữ liệu cũ và giữ bố cục cố định.
- Cập nhật AppHeader và hộp chia sẻ cho bố cục Mã nhà/tên cùng menu có điều kiện theo màn hình; cập nhật MenuView/PlanView để biểu diễn tải, lỗi, trống và Thử lại.
- Bổ sung migration database và cập nhật schema khởi tạo để bảo vệ giới hạn thêm 6 Thành viên nguyên tử theo Gia đình. Việc kiểm tra số lượng và thêm phải chống cạnh tranh giữa nhiều request; không chỉ đếm trước ở client hoặc dùng một kiểm tra database có thể cùng vượt qua. Không loại bỏ dữ liệu cũ vượt giới hạn và không chặn việc đọc/xóa những người đã có.

### Trạng thái và điều hướng

Trạng thái được nhớ có ba dạng: **chọn Gia đình**, **chọn Thành viên của một Gia đình**, hoặc **đã chọn Gia đình và Thành viên**. Việc ghi nhớ dùng định danh Thành viên thuộc đúng Mã nhà; tên hiển thị được lấy từ dữ liệu đã kiểm tra, không dùng tên hoặc vị trí ô để xác định người.

| Thao tác/tình huống | Kết quả |
| --- | --- |
| Lần đầu, chưa có lựa chọn | Mở chọn Gia đình. |
| F5/mở lại sau khi đã chọn người | Kiểm tra Thành viên đã nhớ; còn tồn tại thì vào Kế hoạch. |
| Đổi thành viên từ Kế hoạch | Giữ Gia đình, mở chọn Thành viên và lưu bước đó ngay. |
| Đổi gia đình từ Kế hoạch | Mở chọn Gia đình và lưu bước đó ngay. |
| Nút về chọn Gia đình ở màn Thành viên | Mở chọn Gia đình và lưu bước đó ngay. |
| F5/mở lại khi đang chọn | Tiếp tục bước chọn đã lưu, không tự quay vào người cũ. Quy tắc nhiều tab áp dụng nếu có hành động mới hơn ở tab khác. |
| Bấm một ô Gia đình đã lưu | Mở chọn Thành viên của Gia đình đó, kể cả ô cùng Gia đình vừa dùng. |
| Tạo/tham gia bằng mã được chấp nhận | Lưu/cập nhật ô Gia đình ngay; tiếp tục luồng hiện có rồi đến chọn Thành viên. |
| Chọn Thành viên hợp lệ | Lưu lựa chọn mới và mở Kế hoạch. |
| Thêm Thành viên | Giữ luồng hiện tại: lưu thành công về danh sách, người dùng bấm tên để chọn. |

Không có lối Hủy để tự khôi phục người cũ sau khi đã chủ động đổi. Người dùng có thể chọn lại ô Gia đình và Thành viên cũ. Lối quay lại giữa các bước nhập mã/tạo nhà của màn chọn Gia đình tiếp tục hoạt động.

### Kiểm tra khi khôi phục

- Trong lúc kiểm tra, hiển thị trạng thái đang tải; chưa hiển thị nội dung dưới danh tính chưa được xác minh.
- Thành viên còn tồn tại và thuộc đúng Gia đình: tự mở Kế hoạch, không yêu cầu bấm tên lại.
- Thành viên không còn tồn tại: bỏ lựa chọn người không hợp lệ, giữ Gia đình và mở chọn Thành viên với thông báo dễ hiểu. Không tự chọn người khác có cùng tên.
- Mất mạng/lỗi database: giữ thông tin đã nhớ để Thử lại; có nút về chọn Gia đình. Không coi lỗi là danh sách rỗng hoặc người đã bị xóa.
- Không thêm cơ chế tự đẩy người dùng khỏi phiên đang chạy khi Thành viên bị xóa từ thiết bị khác. Kiểm tra danh tính khi khôi phục; màn chọn tiếp tục đồng bộ danh sách như hiện tại.
- Kết quả kiểm tra đến muộn từ Gia đình/lần thao tác cũ không được thay đổi lựa chọn mới.

### Nhiều tab và trạng thái đang chọn

Q15 đã xác nhận dùng **trạng thái được lưu gần nhất bởi thao tác điều hướng/chọn của người dùng** cho mọi lần khởi tạo mới, bao gồm bước đang chọn theo Q8 và quy tắc nhiều tab theo Q10. Các tab đang mở tiếp tục giữ trạng thái riêng.

- Tab A chọn Tôm, tab B chọn Mẹ: A vẫn là Tôm; F5 A sẽ khôi phục Mẹ.
- Tab B bấm Đổi thành viên: A vẫn giữ phiên đang dùng; F5 A sẽ vào chọn Thành viên của Gia đình mà B vừa lưu.
- Tab B bấm Đổi gia đình: F5 A sẽ vào chọn Gia đình.
- Đưa tab cũ ra trước màn hình hoặc tiếp tục xem dữ liệu không tự ghi đè trạng thái đã lưu mới hơn. Chỉ một thao tác chọn/đổi rõ ràng mới thay đổi trạng thái chung.

### Link tham gia

- Link tới Gia đình khác ưu tiên hơn trạng thái đã nhớ: ghi nhận Gia đình đích và mở chọn Thành viên.
- Link tới đúng Gia đình đã chọn giữ Thành viên hợp lệ đã nhớ; vẫn kiểm tra khi khôi phục. Nếu đang ở bước chọn hoặc không có Thành viên hợp lệ thì hiển thị chọn Thành viên.
- Sau khi xử lý link, loại bỏ chỉ thị tham gia khỏi URL hiện tại để F5 không lặp lại thao tác cũ. Giữ các phần URL khác không liên quan.
- Mã không hợp lệ không được ghi thành ô Gia đình; phản hồi qua luồng tham gia hiện có.

### Chọn Gia đình

- Hiển thị danh sách **Gia đình đã lưu** bằng ô vuông hai cột, mỗi ô có biểu tượng nhà và Mã nhà. Không thêm tên gợi nhớ.
- Lưu cục bộ trên trình duyệt/thiết bị đang dùng, không đồng bộ danh sách này giữa thiết bị.
- Ghi ngay khi tạo/tham gia bằng mã được chấp nhận, kể cả chưa có Thành viên. Chọn ô hoặc mở link cũng là hành động vào Gia đình để cập nhật thứ tự.
- Chuẩn hóa Mã nhà theo quy tắc hiện có; một Gia đình chỉ có một ô. Gia đình vừa vào gần nhất xếp trước.
- Danh sách nhiều nhà được cuộn riêng; không tự giới hạn số nhà theo giới hạn Thành viên.
- Giữ hai chức năng Tạo Nhà Mới / Tham Gia Bằng Mã luôn dễ tiếp cận. Giữ bước thông báo tạo nhà thành công và khả năng chia sẻ đang có.
- Chưa có nhà đã lưu thì vẫn dùng được hai chức năng tạo/tham gia.

### Bỏ khỏi danh sách

- Nút ba chấm riêng trên ô mở Bỏ khỏi danh sách; thao tác này không kích hoạt chọn Gia đình.
- Hộp xác nhận nêu đúng Mã nhà và giải thích chỉ bỏ ghi nhớ trên thiết bị, dữ liệu Gia đình vẫn còn. Hủy giữ nguyên danh sách; xác nhận gỡ đúng ô.
- Không xóa Thành viên, Menu, Kế hoạch hoặc bình luận; không tác động phiên đang mở trên thiết bị khác.
- Muốn vào lại dùng mã hoặc link. Phiên cũ đang mở không được âm thầm thêm lại ô đã quên chỉ vì render, trở lại từ nền hoặc tải dữ liệu. Một thao tác chủ động tham gia lại được phép lưu ô lại.
- Sau khi gỡ ô cuối cùng, màn chọn vẫn có hai nút tạo/tham gia.

### Chọn Thành viên cố định

- Giữ phong cách xanh/kem, avatar và các thao tác thêm/xóa hiện có.
- Có nút rõ ràng quay về chọn Gia đình, dùng được khi danh sách đang tải, lỗi hoặc trống.
- Màn nền không cuộn dọc; thu gọn phần trang trí, khoảng cách và bố cục theo chiều cao, bảo đảm thao tác và tên vẫn tiếp cận được. Không chỉ khóa overflow rồi che nội dung bị tràn.
- Giữ lưới thích ứng 2 cột cho 1–4 người, 3 cột cho 5–6 người khi đủ chỗ; bảo đảm nút có vùng chạm tối thiểu 44×44 và không chồng lấn.
- Hộp thoại thêm/xóa có thể cuộn nội dung khi bàn phím hoặc màn hình thấp làm thiếu chỗ; màn nền vẫn cố định. Nút lưu/hủy/xác nhận luôn tiếp cận được.
- Thông báo nổi không đẩy lưới hoặc làm phát sinh cuộn.

### Giới hạn và dữ liệu cũ

- Tối đa 6 Thành viên cho thao tác thêm, được bảo đảm tại nguồn dữ liệu kể cả nhiều thiết bị thêm đồng thời. Giữ chặn sớm và thông báo rõ trên giao diện.
- Hai thiết bị cùng thêm khi đang có 5 người: chỉ một người được thêm thành công; thiết bị còn lại nhận lỗi đầy và cập nhật danh sách. Không báo thành công trước khi database xác nhận.
- Dữ liệu cũ hơn 6 người không bị xóa hoặc giấu. Hiển thị tối đa 6 người mỗi trang với nút chuyển và số trang; vẫn không cuộn màn nền.
- Giới hạn tính trên tổng số Thành viên của Gia đình, không phải số người trên trang. Vẫn được chọn/xóa người ở mọi trang.
- Xóa hoặc đồng bộ làm trang hiện tại rỗng thì chuyển tới trang còn hợp lệ; không kẹt ở trang trống. Thứ tự người tiếp tục theo quy tắc hiện có.

### Header và chia sẻ

- Giữ header gọn, cố định theo khung ứng dụng hiện tại.
- Bên trái là Mã nhà dạng gọn. Bấm mở hộp chia sẻ có mã đầy đủ, link và thao tác sao chép; phản hồi sao chép xuất hiện trong hộp chia sẻ.
- Bên phải ở Kế hoạch là nút chỉ hiển thị tên Thành viên. Bấm mở đúng hai mục Đổi gia đình và Đổi thành viên.
- Menu không có hai thao tác đổi. Nếu hiển thị tên trong header Menu thì đó là nhãn, không phải nút mở menu đổi; chia sẻ bằng Mã nhà vẫn khả dụng.
- Bỏ nút Chia sẻ riêng, chữ Đổi gia đình nằm trực tiếp trên header và nhãn Online/Chế độ máy thường trực.
- Tên/mã dài không đẩy header thành nhiều hàng hoặc che nút. Dùng rút gọn hiển thị khi cần, nhưng giá trị đầy đủ phải tiếp cận được; mã đầy đủ có trong hộp chia sẻ và tên đầy đủ ở màn chọn Thành viên.
- Menu thao tác đóng khi chọn, bấm ngoài hoặc Escape; thao tác bằng bàn phím và tên truy cập của nút phải rõ ràng.
- Cập nhật lời hướng dẫn chia sẻ sang chọn Thành viên, không còn nói nhập Biệt danh cục bộ.

### Đang tải, lỗi và dữ liệu trống

- Tách ba trạng thái đang tải, thất bại và tải thành công nhưng trống cho Menu, Kế hoạch và khôi phục Thành viên.
- Tải lần đầu thất bại: hiển thị lỗi + Thử lại tại vùng nội dung liên quan. Không hiện thông báo chưa có Món ăn chỉ vì request thất bại.
- Tải lại thất bại sau khi đã có dữ liệu: giữ nội dung đã tải trong phiên, kèm thông báo lỗi và Thử lại. Không xóa nội dung để hiển thị trạng thái trống giả.
- Chỉ hiện trạng thái trống khi dữ liệu cần thiết đã tải thành công và thực sự không có nội dung.
- Không thêm nhãn Online mới hoặc suy ra kết nối thành công từ cấu hình Supabase. Phản hồi dựa trên kết quả thao tác thật.
- Việc ghi nhớ Thành viên không tạo khả năng tải lại dữ liệu cloud offline; không bổ sung cache hoặc hàng đợi đồng bộ offline trong phạm vi này.

### Tương thích dữ liệu và ranh giới

- Khi nâng cấp từ bản chỉ nhớ một Mã nhà, giữ mã đó như một Gia đình đã lưu. Vì bản cũ không lưu định danh Thành viên, lần đầu cần chọn người; từ lựa chọn đó bắt đầu ghi nhớ theo quy tắc mới.
- Không suy ra Thành viên từ Biệt danh cục bộ cũ, tên trùng hoặc ô đầu tiên. Không sửa bình luận lịch sử.
- Giữ mô hình Thành viên dùng chung theo Gia đình, không có mật khẩu/PIN hoặc quyền cá nhân; Menu và Kế hoạch vẫn dùng chung.
- Giữ cách tạo/chuẩn hóa/tham gia bằng mã hiện có; không bổ sung hệ thống tên Gia đình hoặc xác minh bản ghi Gia đình tồn tại trong đợt này.
- Lựa chọn đang dùng và danh sách Gia đình đã lưu là hai dữ liệu có mục đích khác nhau. Quên một ô không xóa dữ liệu chung hoặc tự chuyển phiên ở một tab khác.
- Áp dụng ADR-0008 cho phần thay thế ADR-0006, cùng phần bổ sung ADR-0007; các quy tắc dữ liệu không bị thay thế tiếp tục áp dụng.

## Testing Decisions

### Ranh giới kiểm thử

- **Ranh giới chính là App**, dùng khả năng truyền HouseholdStorage, MemberRepository và các repository Menu/Kế hoạch hiện có. Kiểm tra bằng thao tác người dùng, màn hình, nút, tên tác giả và kết quả đọc qua hợp đồng công khai; không kiểm tra state riêng tư, thứ tự effect, số lần gọi nội bộ hoặc snapshot cả cây giao diện.
- Dùng lại storage/repository trong bộ nhớ giữa nhiều lần khởi tạo hoặc nhiều App để mô phỏng F5, tab mới và dữ liệu dùng chung. Dùng promise có thể điều khiển và sự kiện repository để tạo lỗi, thêm/xóa đồng thời và phản hồi đến muộn. Mở rộng các adapter kiểm thử hiện có thay vì thêm mock seam cho từng component.
- **Kiểm tra ranh giới database thật** là phần bổ sung bắt buộc cho giới hạn 6: kiểm thử hai request thêm đồng thời, đọc kết quả đã commit và lỗi công khai. Kiểm tra adapter Supabase cho ánh xạ lỗi đầy và lọc theo Gia đình; mock HTTP không đủ để chứng minh tính nguyên tử database.
- **Kiểm tra trình duyệt trên ứng dụng thật** bổ sung bằng chứng về không cuộn/không che nội dung, bàn phím ảo, tương tác chia sẻ và nhiều tab. Dùng cùng hành vi App, không tạo seam UI riêng. Component test chỉ hỗ trợ lỗi cục bộ; class CSS hoặc JSDOM không chứng minh bố cục thực tế.
- Người dùng đã xác nhận giữ phương án kiểm thử này theo yêu cầu của skill to-spec: luồng người dùng từ cấp App, database thật cho thêm đồng thời, và trình duyệt cho bố cục, bàn phím và nhiều tab.

### Các hành vi phải kiểm chứng

Các mục dưới đây là kế hoạch nghiệm thu, chưa có kết quả thực thi trong phiên xuất bản đặc tả.

1. Chọn Thành viên rồi F5/mở tab mới/mở lại PWA khôi phục đúng người khi hợp lệ; có kiểm tra database trước khi vào.
2. Đổi Thành viên, đổi Gia đình và quay về chọn Gia đình đều lưu bước đang chọn; F5 không tự quay vào người cũ.
3. Bấm ô Gia đình cũ vẫn chọn người lại; tên từ Gia đình trước không trở thành tác giả ở Gia đình mới.
4. Kiểm tra các kịch bản nhiều tab và link tham gia đúng/khác Gia đình; tab cũ và phản hồi bất đồng bộ không ghi đè lựa chọn mới ngoài ý muốn.
5. Người đã nhớ bị xóa dẫn về chọn; lỗi tải giữ thông tin đã nhớ và Thử lại hoạt động. Không nhầm lỗi với người bị xóa.
6. Lịch sử ghi cả Gia đình chưa có Thành viên, không trùng mã, đúng thứ tự gần nhất, giữ chức năng tạo/tham gia và tương thích mã đã lưu từ bản cũ.
7. Bỏ khỏi danh sách có xác nhận/hủy, không kích hoạt chọn ô, không xóa dữ liệu chung và không bị phiên cũ tự thêm lại.
8. Menu tên chỉ có ở Kế hoạch và đúng hai mục; chia sẻ qua Mã nhà hoạt động; header gọn với tên/mã dài.
9. Menu/Kế hoạch phân biệt tải/lỗi/trống; retry hoạt động; lỗi khi làm mới giữ dữ liệu đang có.
10. Màn Thành viên có 0, 1, 4, 5, 6 và 7+ người: các nút/tên tiếp cận được, nền không cuộn, trang dữ liệu cũ chuyển/chọn/xóa đúng; modal dùng được khi mở bàn phím.
11. Kiểm tra nhiều thao tác thêm đồng thời ở ranh giới database để chứng minh giới hạn 6, không chỉ dựa vào mock hoặc chặn nút phía client. Kiểm tra dữ liệu cũ không bị xóa bởi thay đổi giới hạn.
12. Cập nhật các test cũ yêu cầu chọn lại mỗi lần mở hoặc cấm đổi người; chạy regression phù hợp, typecheck/build và kiểm tra trình duyệt trên màn nhỏ/lớn, màn thấp/ngang. Dùng các kích thước đại diện 320×568, 375×667, 390×844 và desktop, cùng bàn phím ảo; không coi test class CSS là bằng chứng không tràn.

### Prior art và hồi quy

- Bộ Explicit Thành viên selection through App đã dùng storage/repository tiêm vào để kiểm tra chọn người, phản hồi đến muộn, thêm/xóa, tác giả bình luận và nhiều instance. Đổi kỳ vọng bắt chọn lại sau mọi lần mở sang quy tắc ghi nhớ mới.
- Bộ Household Setup and PWA Shell Integration có các luồng tạo/tham gia, chuẩn hóa mã, link tham gia và điều hướng Kế hoạch/Menu. Mở rộng cho ô Gia đình đã lưu, quên ô, các trạng thái đang chọn và tương thích storage cũ.
- Bộ Dual Mode and Realtime Sync Integration có cơ chế repository thử và sự kiện cập nhật. Các assertion về badge Online/Chế độ máy cần thay bằng hành vi hiển thị được chốt, trong khi lựa chọn repository và đồng bộ hiện có tiếp tục được bảo vệ.
- Bộ SupabaseMemberRepository public database contract đã kiểm tra dữ liệu xác nhận, thứ tự Thành viên, lọc thao tác theo Gia đình/ID và ánh xạ lỗi. Bổ sung lỗi giới hạn ở adapter và kiểm tra cạnh tranh ở database thật.
- Các bộ Weekly Plan Integration, Menu Management Integration và Dish Detail and Blank Comment Input Integration cung cấp prior art cho thao tác dữ liệu, nhận diện tác giả và bảo toàn bình luận. Mở rộng lỗi tải/Thử lại qua App khi có thể, tránh nhân đôi cùng một luồng ở nhiều cấp.
- Chạy kiểm thử hồi quy phù hợp, typecheck và build sau triển khai; ghi kết quả database và trình duyệt riêng. Không coi tài liệu hoặc test cũ đã qua là bằng chứng tính năng mới hoàn tất.

## Out of Scope

- Tên gợi nhớ, đổi tên Gia đình, đồng bộ danh sách Gia đình đã lưu hoặc danh tính đang dùng giữa các thiết bị.
- Nhớ một Thành viên riêng cho từng Gia đình để tự chọn khi chủ động đổi nhà.
- Menu đổi Thành viên/Gia đình ở màn Menu; tự đồng bộ danh tính vào các tab đang chạy.
- Mật khẩu/PIN, đăng nhập cá nhân, phân quyền, ảnh đại diện hoặc thay đổi mô hình dữ liệu dùng chung theo Gia đình.
- Cache dữ liệu cloud để mở offline, hàng đợi thêm/xóa Thành viên offline hoặc dùng danh tính nhớ để vượt qua lỗi kiểm tra database.
- Tự đẩy người dùng khỏi phiên đang chạy ngay khi Thành viên bị xóa ở thiết bị khác.
- Xóa dữ liệu Gia đình khi quên ô; tự xóa người trong dữ liệu cũ vượt 6; sửa tác giả bình luận lịch sử hoặc tự tạo người từ Biệt danh cục bộ.
- Thiết kế lại sinh mã/xác minh Gia đình tồn tại, thêm bảng tài khoản hoặc đổi kiến trúc repository Menu/Kế hoạch ngoài phản hồi tải/lỗi đã chốt.
- Giữ bản nháp của hộp thoại qua F5; yêu cầu ghi nhớ chỉ bao gồm ba trạng thái điều hướng đã mô tả.
- Triển khai, áp dụng migration vào dịch vụ thật, deploy hoặc tạo PR trong bước xuất bản đặc tả này.

## Further Notes

- Người dùng đã xác nhận Q1–Q15 và yêu cầu to-spec. Không còn câu hỏi thiết kế đang mở; trạng thái ready-for-agent nghĩa là sẵn sàng triển khai, không phải đã triển khai.
- Tracker của dự án là Markdown cục bộ. Đặc tả này là nguồn yêu cầu; [ticket tổng](./issues/01-household-navigation-ux.md) được giữ nguyên. [Bản chia và danh sách ticket con](./ticket-plan.md) đã được người dùng chấp nhận, các ticket 02–08 mang nhãn ready-for-agent. Ban đầu có thể nhận 02, 06, 07, 08; 03 và 04 chờ 02, 05 chờ 04.
- [Nhật ký thiết kế](./design.md), [glossary](../../CONTEXT.md) và [ADR-0008](../../docs/adr/0008-remember-member-and-explicit-household-switch.md) ghi nguồn quyết định. ADR-0008 thay phần về ghi nhớ/điều hướng của [ADR-0006](../../docs/adr/0006-household-members-and-explicit-selection.md); [ADR-0007](../../docs/adr/0007-zero-scroll-member-selection-capped-at-six.md) được bổ sung về hộp thoại, dữ liệu cũ và giới hạn đồng thời.
- Những ghi chú tham chiếu trong các đặc tả cũ tránh áp dụng lại yêu cầu luôn chọn Thành viên khi mở hoặc coi đổi Gia đình từ màn chọn là ngoài phạm vi.
- Code hiện đã có khóa cuộn nền nhưng chưa kiểm chứng trực quan vấn đề người dùng báo trong phiên này. Agent triển khai cần xác minh trên phiên bản và khung nhìn thực tế trước khi coi phần đó đã đạt.
- Chưa chạy kiểm thử tính năng, thay đổi code ứng dụng hoặc áp dụng migration khi xuất bản tài liệu. Các kế hoạch kiểm thử ở trên là tiêu chí hoàn thành cho bước triển khai.
