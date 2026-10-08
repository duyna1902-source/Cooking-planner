Status: ready-for-agent

# Chọn Thành viên trước khi vào Kế hoạch

## Problem Statement

Ứng dụng hiện nhớ một Biệt danh cục bộ trên từng thiết bị và dùng lại khi mở web hoặc tham gia Gia đình khác. Nhiều người dùng chung thiết bị không có bước xác định ai đang sử dụng, tên tác giả bình luận có thể là tên của người trước, và tên đã tạo trên thiết bị này không trở thành danh sách chung của Gia đình trên thiết bị khác.

Người dùng cần danh sách Thành viên được lưu trong database theo Gia đình, cùng màn hình chọn người tương tự Netflix xuất hiện trước Kế hoạch mỗi lần mở ứng dụng.

## Solution

Sau khi xác định Gia đình từ Mã nhà đã nhớ, luồng tạo/tham gia hoặc link tham gia, ứng dụng mở màn hình riêng **Bạn là ai?** theo bố cục **A — Lưới như Netflix** đã được chọn. Mỗi ô có chữ cái đầu và tên Thành viên; nút **+ Thêm thành viên** nằm dưới danh sách. Gia đình trống mời thêm người, không tự tạo Thành viên.

Chọn một Thành viên mới mở Kế hoạch và Menu chung của Gia đình. Thiết bị nhớ Gia đình, nhưng mỗi lần tải lại web, mở tab mới hoặc khởi động lại PWA đều phải chọn Thành viên. Quay lại một phiên vẫn đang chạy giữ lựa chọn; các tab chọn độc lập.

Nút **Xóa** ở góc trên bên phải bật chế độ xóa. Bấm một ô mở xác nhận có tên Thành viên; **Giữ lại** hủy, **Xóa thành viên** gỡ người khỏi danh sách sau khi database xác nhận. Menu, Kế hoạch và bình luận cũ vẫn được giữ.

Kế hoạch và Menu không có nút hoặc luồng **Đổi thành viên**. Chỉ màn hình Kế hoạch có thao tác **Đổi gia đình**; tham gia Gia đình khác phải chọn Thành viên của Gia đình đó.

## User Stories

1. As a Thành viên, I want to choose who I am before entering Kế hoạch, so that the app identifies the person currently using the device.
2. As a Thành viên, I want my device to remember my Gia đình, so that I do not need to enter its Mã nhà every time.
3. As a Thành viên, I want reloading the web app to show member selection again, so that the previous person's identity is not reused automatically.
4. As a Thành viên, I want a newly opened browser tab to ask who I am, so that each tab has an explicit identity.
5. As a Thành viên, I want restarting the PWA to ask who I am, so that a previous session does not bypass member selection.
6. As a Thành viên, I want returning to a still-running tab or PWA to keep my selection, so that switching briefly to another app does not interrupt my work.
7. As a Thành viên using multiple tabs, I want each tab's selection to be independent, so that selecting someone in one tab does not change another tab's identity.
8. As a Thành viên opening a join link, I want to select from the linked Gia đình's members, so that I enter the intended Gia đình.
9. As a Thành viên creating or joining a Gia đình, I want to proceed to member selection without entering a local Biệt danh, so that everyone uses the same shared member list.
10. As a Thành viên, I want to see the current Mã nhà on the selection screen, so that I know which Gia đình I am entering.
11. As a Thành viên, I want names and initial-letter avatars in the chosen grid layout, so that I can quickly recognize the right person.
12. As a Thành viên, I want members listed in creation order with new members last, so that the list remains predictable.
13. As a Thành viên, I want the add-member button below the list even when it is empty, so that I always know where to add someone.
14. As the first Thành viên of a Gia đình, I want an empty state inviting me to add a member, so that no person is created on my behalf.
15. As a Thành viên adding someone, I want the name field to start blank, so that an old local Biệt danh is not used accidentally.
16. As a Thành viên adding someone, I want leading and trailing whitespace removed and names limited to 1–30 characters, so that saved names are valid and readable.
17. As a Thành viên, I want duplicate names rejected within my Gia đình regardless of case or surrounding whitespace, so that each name is easy to identify.
18. As a Thành viên, I want the same name to be allowed in another Gia đình, so that unrelated families do not restrict each other's names.
19. As a Thành viên, I want added names saved in the database and visible after reopening or using another device, so that the member list is shared and persistent.
20. As a Thành viên adding someone, I want success to return to the list without automatically selecting the new person, so that entering Kế hoạch remains an explicit choice.
21. As a Thành viên saving a name, I want repeated submission prevented while saving, so that one action does not create duplicate requests.
22. As a Thành viên whose save fails, I want my entered name retained with a retry option, so that I can recover without retyping.
23. As a Thành viên, I want the app to wait on member selection while the list loads, so that Kế hoạch and Menu cannot appear before I choose.
24. As a Thành viên whose list fails to load, I want a clear error and Thử lại, so that I can recover without mistaking the error for an empty Gia đình.
25. As a Thành viên, I want member operations to report success only after database confirmation, so that locally displayed data represents saved changes.
26. As a Thành viên on another device, I want additions to update the selection list automatically, so that I see the shared list without reloading.
27. As a Thành viên on another device, I want deletions to remove the corresponding member from the selection list automatically, so that the list does not keep obsolete entries.
28. As a Thành viên, I want an Xóa button in the upper-right corner of member selection, so that I can remove a member from that screen.
29. As a Thành viên in deletion mode, I want tapping a member to open deletion confirmation rather than Kế hoạch, so that the action matches the current mode.
30. As a Thành viên deleting someone, I want confirmation to name that person, so that I can verify whom I am removing.
31. As a Thành viên, I want Giữ lại to cancel deletion without changing the list, so that an accidental action is reversible before confirmation.
32. As a Thành viên, I want Xong to leave deletion mode and restore normal selection, so that I can continue into Kế hoạch.
33. As a Thành viên deleting someone, I want Menu, Kế hoạch and old comments preserved, so that removing a person does not erase shared cooking information.
34. As a Thành viên deleting the last member, I want the empty state to keep the Mã nhà and allow adding someone, so that the Gia đình remains usable.
35. As a Thành viên whose deletion fails, I want the member to remain listed with a retry option, so that the app does not claim an unsuccessful change.
36. As a Thành viên, I want to select a name without a password or PIN, so that member selection stays simple for use at home.
37. As a Thành viên, I want the same Menu and Kế hoạch as the rest of my Gia đình, so that we plan meals together.
38. As a Thành viên writing a new comment, I want its author to be my selected name, so that everyone knows who wrote it.
39. As a Thành viên reading history, I want old comments to keep their stored author names after a member is deleted, so that the conversation remains understandable.
40. As a Thành viên using Kế hoạch or Menu, I want the chosen identity retained without a switch-member action, so that these screens follow the agreed scope.
41. As a Thành viên, I want to change Gia đình only from Kế hoạch after member selection, so that the selection screen stays focused on choosing a person.
42. As a Thành viên changing Gia đình, I want the old selection cleared and the new Gia đình's members shown, so that an identity from the previous Gia đình is not carried over.
43. As a Thành viên, I want old Biệt danh data ignored when loading or adding members, so that no member is created or selected automatically.
44. As a Thành viên, I want delayed results and events from a previous Gia đình ignored, so that the current list never mixes families.
45. As a Thành viên on a small mobile screen, I want the grid and long lists to remain usable with scrolling, so that I can reach members and the add button.
46. As a Thành viên who has chosen a name, I want existing Menu, Kế hoạch and Mã nhà sharing flows to keep working, so that the new entry step does not disrupt cooking tasks.

## Implementation Decisions

### Luồng mở ứng dụng và phiên sử dụng

- Sửa phần điều phối ứng dụng thành ba bước: xác định Gia đình, chọn Thành viên, sử dụng Kế hoạch/Menu. Khi chưa chọn, không mount Kế hoạch, Menu hoặc điều hướng chính phía sau một lớp phủ.
- Luồng tạo/tham gia Gia đình chỉ xác định và lưu Mã nhà; bỏ yêu cầu Biệt danh cục bộ. Giữ cách sinh/chuẩn hóa Mã nhà và chia sẻ link đang có.
- Link `?join=CODE` chọn Gia đình đích theo quy tắc hiện có, ghi nhớ Mã nhà và yêu cầu chọn Thành viên của Gia đình đó, kể cả khi thiết bị có Biệt danh cũ.
- Chỉ lưu Mã nhà lâu dài. Lựa chọn Thành viên nằm trong bộ nhớ của phiên đang chạy; không khôi phục từ localStorage hoặc sessionStorage. Mỗi lần khởi tạo ứng dụng bắt đầu chưa chọn; không reset khi phiên vẫn sống trở lại từ nền.
- Bấm chọn một bản ghi trong danh sách hiện tại mở Kế hoạch. Điều hướng Kế hoạch/Menu giữ Thành viên đó. Không xây dựng callback, nút hoặc luồng đổi Thành viên trong nội dung chính.
- Đổi Gia đình chỉ khả dụng từ Kế hoạch. Hoàn tất tham gia Gia đình đích xóa lựa chọn cũ, đóng nội dung của Gia đình cũ và tải màn hình chọn mới. Không có thao tác đổi Gia đình trên Menu hoặc màn hình chọn.

### Giao diện đã chọn

- Dùng bố cục A, màu xanh/kem của ứng dụng, tiêu đề **Bạn là ai?**, avatar chữ cái đầu và tên đầy đủ. Giữ khả năng cuộn danh sách trên màn hình nhỏ.
- Thứ tự tăng dần theo thời điểm tạo; ID làm thứ tự phụ khi thời điểm bằng nhau. Thành viên mới thêm ở cuối.
- Nút **+ Thêm thành viên** nằm dưới danh sách và vẫn có khi trống. Không tạo dữ liệu mẫu trong ứng dụng thật.
- Ô thêm tên luôn trống khi mở. Hủy trở lại danh sách; lưu thành công trở lại danh sách chưa chọn. Không tự chuyển sang Kế hoạch sau khi thêm.
- Nút **Xóa** ở góc trên bên phải bật chế độ xóa, các ô có dấu thùng rác và nút góc đổi thành **Xong**. Bấm ô trong chế độ này mở xác nhận có tên người đó.
- Xác nhận gồm **Giữ lại** và **Xóa thành viên**. Hủy giữ nguyên danh sách. Thành công gỡ đúng bản ghi; có thể tiếp tục xóa hoặc bấm Xong để chọn.
- Xóa người cuối cùng trở về trạng thái trống, giữ Mã nhà và nút thêm; thoát chế độ xóa và vô hiệu hóa nút xóa khi không còn người.
- Phân biệt trạng thái tải, lỗi có Thử lại và danh sách trống. Trong lúc tải hoặc lỗi chưa có dữ liệu được xác nhận, không cho vượt qua bước chọn.

### Ranh giới dữ liệu Thành viên

- Bổ sung mô hình Thành viên gồm ID, Mã nhà, tên và thời điểm tạo; dùng ID cho lựa chọn, cập nhật và xóa, không dùng vị trí ô hoặc tên làm khóa bản ghi.
- Bổ sung một repository Thành viên theo mẫu repository đang có, được truyền vào cấp ứng dụng cùng storage và repository Menu/Kế hoạch. Đây là ranh giới thay dữ liệu trong kiểm thử; không cần lớp giả lập riêng cho từng thành phần giao diện.
- Hợp đồng công khai gồm tải danh sách theo Mã nhà, thêm tên vào Gia đình hiện tại, xóa theo Mã nhà và ID, đăng ký thay đổi danh sách và trả hàm hủy đăng ký.
- Tải trả danh sách đã sắp xếp. Thêm trả bản ghi được database xác nhận. Xóa chỉ hoàn tất sau xác nhận từ database. Lỗi phân biệt tên trùng, tên/Mã nhà không hợp lệ và lỗi kết nối/quyền để giao diện phản hồi phù hợp.
- Chuẩn hóa tên bằng bỏ khoảng trắng đầu/cuối, giữ dấu tiếng Việt; từ 1 đến 30 ký tự. Kiểm tra trùng trên giao diện để phản hồi sớm, nhưng database quyết định cuối cùng, kể cả hai thiết bị thêm cùng lúc.
- Bản thật sử dụng Supabase, không có repository Thành viên lưu local làm phương án thay thế. Khi thiếu cấu hình database hoặc cloud lỗi, giữ bước chọn với thông báo lỗi. Repository trong bộ nhớ chỉ phục vụ kiểm thử và prototype.
- Khóa gửi lặp khi thêm/xóa đang chờ. Thêm lỗi giữ tên nhập; xóa lỗi giữ bản ghi. Không báo thành công hoặc cập nhật danh sách theo giả định trước khi database xác nhận.

### Database và đồng bộ

- Dùng bảng **public.member** đã tạo trong project **cooking-planner**. Các cột là `id UUID`, `household_code TEXT`, `name TEXT`, `created_at TIMESTAMPTZ`.
- Giữ CHECK Mã nhà đã chuẩn hóa, CHECK tên đã trim dài 1–30 ký tự và unique index theo Gia đình cùng tên bỏ qua hoa/thường. Cùng tên ở Gia đình khác được phép.
- Bảng hiện có RLS, policy/quyền SELECT và INSERT cho `anon`, cùng publication Realtime. Tính năng xóa cần migration bổ sung quyền/policy DELETE và cập nhật schema khởi tạo; chưa có các phần này trong database hiện tại.
- Mọi thao tác đọc/thêm/xóa đều gắn Mã nhà hiện tại. Xóa phải lọc cả Mã nhà và ID. Tiếp tục nhận diện Gia đình bằng Mã nhà, không bổ sung đăng nhập hoặc phân quyền cá nhân.
- Không thêm khóa ngoại tới bảng Gia đình trong phạm vi này vì luồng tạo/tham gia hiện chưa tạo hay xác minh bản ghi Gia đình trong database.
- Xóa Thành viên chỉ gỡ bản ghi Thành viên; không gọi luồng xóa dây chuyền Menu/Kế hoạch/bình luận và không thêm khóa ngoại khiến lịch sử tác giả bị xóa.
- Danh sách ở màn hình chọn nhận thay đổi thêm/xóa từ thiết bị khác. Khi nhận thông báo, tải lại danh sách của Gia đình hiện tại từ database, tránh trùng bản ghi hoặc tự áp dụng dữ liệu của Gia đình khác.
- Hủy subscription khi rời màn hình hoặc đổi Gia đình; bỏ qua phản hồi tải/lưu và sự kiện thuộc Gia đình/phiên tải đã hết hiệu lực.
- Đồng bộ xóa phải được xác minh trên database thực với RLS và cấu hình Realtime hiện tại. Không coi việc dùng lại subscription thêm dữ liệu là bằng chứng luồng xóa đã hoạt động; chọn cơ chế thông báo/tải lại đáp ứng kết quả quan sát được giữa hai thiết bị.

### Bình luận và tương thích

- Tên Thành viên đang chọn cung cấp tên tác giả cho bình luận mới qua hợp đồng bình luận hiện có. Tên tác giả vẫn là bản chụp tại thời điểm gửi; không chuyển bình luận cũ sang tham chiếu ID Thành viên.
- Không đọc Biệt danh cũ để tự chọn, tạo Thành viên hoặc điền sẵn ô tên; không chuyển Biệt danh cục bộ thành bản ghi database.
- ADR-0006 thay phần Biệt danh cục bộ của ADR-0001. Yêu cầu database cho bước tải/thêm/xóa Thành viên là ngoại lệ của ADR-0005 về chế độ local; repository Menu/Kế hoạch hiện có tiếp tục được dùng sau bước chọn.
- Prototype chỉ là nguồn tham chiếu giao diện. Triển khai vào luồng ứng dụng thật với repository và kiểm thử; không đưa dữ liệu mẫu, nút thử kịch bản hoặc route prototype vào trải nghiệm production.

## Testing Decisions

### Ranh giới kiểm thử chính

Ưu tiên kiểm thử ở cấp **App** bằng Vitest, React Testing Library và user-event, dùng khả năng truyền storage, repository Menu/Kế hoạch đang có và bổ sung repository Thành viên. Quan sát màn hình, nút, tên, thông báo và dữ liệu công khai sau thao tác; không kiểm tra state React riêng tư, tên hook, thứ tự effect hoặc snapshot toàn bộ cây JSX.

Một bộ dữ liệu thử có thể dùng lại giữa hai lần render hoặc hai instance App để kiểm tra mở lại, tab độc lập và cập nhật liên thiết bị. Dùng Promise có thể điều khiển và subscription của repository kiểm thử để tạo lỗi, kết quả đến chậm và sự kiện thay đổi. Không viết kiểm thử cho prototype dùng một lần.

### Các luồng phải kiểm thử

1. **Tạo/tham gia/nhớ Gia đình/link tham gia:** mọi đường vào đều tới Bạn là ai?; không còn yêu cầu Biệt danh riêng; link tới Gia đình mới không mang danh tính cũ sang.
2. **Chặn nội dung trước chọn:** khi tải, trống, lỗi hoặc chưa chọn, không có Kế hoạch/Menu/điều hướng chính. Chọn hợp lệ mới mở Kế hoạch.
3. **Chu kỳ phiên:** unmount rồi khởi tạo lại với cùng storage và database vẫn hỏi chọn; hai App chọn độc lập; điều hướng hoặc quay lại phiên đang sống giữ người đã chọn. Kiểm tra tải lại, tab mới và PWA khởi động lại thêm bằng browser.
4. **Thêm và lưu:** ô tên trống, trim và giới hạn 1–30 ký tự; tên trùng khác hoa/thường/khoảng trắng bị từ chối; cùng tên ở Gia đình khác được phép. Thành công xuất hiện cuối danh sách nhưng chưa chọn; render lại vẫn có người cũ và mới.
5. **Thêm đồng thời/lỗi:** hai yêu cầu tên trùng chỉ tạo một bản ghi; gửi lặp bị chặn; lỗi giữ tên nhập và không báo thành công. Thiếu cấu hình database không tự mở nội dung chính.
6. **Xóa:** nút góc bật chế độ, bấm ô mở đúng xác nhận và không vào Kế hoạch; hủy không đổi dữ liệu; xác nhận gỡ đúng người; Xong trở lại chọn. Xóa người cuối vẫn nhớ Gia đình và cho thêm.
7. **Xóa lỗi và bảo toàn dữ liệu:** chỉ gỡ người khi database xác nhận; lỗi giữ bản ghi và cho thử lại. Menu, Kế hoạch và bình luận cũ giữ nguyên sau xóa.
8. **Đồng bộ/cách ly:** thêm/xóa từ instance khác cập nhật danh sách; sự kiện lặp không tạo ô trùng; Gia đình khác không lẫn vào; kết quả và sự kiện đến muộn từ Gia đình cũ không thay màn hình hiện tại.
9. **Nội dung sau chọn:** Kế hoạch/Menu không có đổi Thành viên; đổi Gia đình chỉ có ở Kế hoạch và mở bước chọn của Gia đình mới. Các thao tác Menu, Kế hoạch và chia sẻ Mã nhà tiếp tục hoạt động.
10. **Tác giả bình luận:** bình luận mới dùng tên đã chọn; bình luận cũ giữ tên sau xóa Thành viên; Biệt danh cục bộ cũ không ảnh hưởng tác giả của phiên mới.

### Kiểm tra adapter và database

- Kiểm tra hợp đồng repository Supabase cho tải/thêm/xóa, chuẩn hóa dữ liệu, lọc theo Gia đình, lỗi API/tên trùng và hủy subscription. Chỉ kiểm tra hành vi công khai và điều kiện dữ liệu cần thiết; tránh ràng buộc vào chuỗi gọi nội bộ của SDK.
- Kiểm tra database thực bằng dữ liệu thử được xác định rõ: lưu rồi tải lại từ hai phiên, tên trùng cùng Gia đình, cùng tên khác Gia đình, xóa, RLS/quyền và đồng bộ thêm/xóa. Không coi mock Supabase hoặc prototype là bằng chứng lưu thật.
- Chạy regression suite, typecheck và build khi triển khai. Kiểm tra thủ công trên browser khung mobile cho lưới, danh sách dài, nút thêm, chế độ xóa và xác nhận.

### Prior art trong repo

- Bộ **Household Setup and PWA Shell Integration** render App với storage trong bộ nhớ, tạo/tham gia Gia đình và link tham gia. Cập nhật kỳ vọng khôi phục Biệt danh theo luồng mới.
- Bộ **Dual Mode and Realtime Sync Integration** render App với repository thử, phát callback subscription rồi quan sát nội dung cập nhật. Tái sử dụng cho danh sách Thành viên và kết quả đến chậm.
- Bộ **Dish Detail and Blank Comment Input Integration** kiểm tra gửi/đọc bình luận qua giao diện. Mở rộng ở cấp App để xác minh tên tác giả từ lựa chọn.
- Các bộ **SupabaseDishRepository** và **SupabasePlanRepository** cung cấp mẫu kiểm tra lỗi, ánh xạ bản ghi và subscription ở ranh giới dịch vụ. Bổ sung trường hợp Thành viên theo hợp đồng công khai.

## Out of Scope

- Nút hoặc luồng đổi Thành viên trong Kế hoạch/Menu.
- Đổi tên Thành viên, tải ảnh đại diện, mật khẩu/PIN, đăng nhập cá nhân, vai trò hoặc quyền riêng.
- Menu/Kế hoạch riêng theo Thành viên.
- Thành viên mặc định, tự tạo từ Biệt danh cũ, hoặc tự chọn Thành viên mới thêm/lần trước.
- Đồng bộ thêm/xóa offline, lưu danh sách local để vượt qua lỗi cloud, hoặc vào Kế hoạch khi chưa chọn.
- Đổi Gia đình trên màn hình chọn Thành viên hoặc Menu.
- Chuyển bình luận cũ sang khóa ngoại Thành viên, sửa tên tác giả lịch sử hoặc xóa nội dung dùng chung khi xóa Thành viên.
- Thiết kế lại việc tạo/xác minh Gia đình trong database và thay kiến trúc repository Menu/Kế hoạch.
- Các bố cục prototype B/C, phát hành hoặc deploy ứng dụng trong bước xuất bản đặc tả này.

## Further Notes

- Đặc tả thay bản tổng hợp chờ xác nhận trước đó, tổng hợp 13 quyết định cùng yêu cầu bổ sung: chọn A, thêm xóa ở góc và bỏ đổi Thành viên. **ready-for-agent** nghĩa là sẵn sàng triển khai, chưa phải đã triển khai.
- Tracker là Markdown cục bộ. Ticket triển khai: [01 — Chọn Thành viên và lưu danh sách theo Gia đình](./issues/01-member-selection-screen.md).
- [Nhật ký quyết định](./design.md), [prototype A và kết quả kiểm tra](./prototype.md), [thuật ngữ](../../CONTEXT.md) và [ADR-0006](../../docs/adr/0006-household-members-and-explicit-selection.md) là nguồn tham chiếu.
- Ba prototype ban đầu được lưu tại nhánh **codex/prototype-household-members-20261008**, commit **f07f7af5c8cc5b8ee99402b41d33dd62c20bb83c**. Snapshot có trước thao tác xóa và yêu cầu bỏ đổi Thành viên; tài liệu/ảnh A hiện tại ghi quyết định sau đó và được ưu tiên khi có khác biệt.
- Bảng **public.member** đã tạo và xác minh qua browser trong project **cooking-planner**, ref **ookbaokwcahtevihobnj**, khớp cấu hình repo. Tại thời điểm xác minh có 0 bản ghi, hỗ trợ đọc/thêm và Realtime; chưa có quyền xóa. Xem [migration đã áp dụng](../../supabase/migrations/20261008_create_member.sql), [schema](../../supabase/schema.sql) và [ảnh xác minh](./supabase-member-verification.jpg).
- Frontend thật hiện vẫn dùng Biệt danh cục bộ và onboarding dạng lớp phủ. Prototype đã kiểm tra giao diện và typecheck/build, nhưng kiểm thử tính năng/database nêu trên là công việc cần làm khi triển khai.
