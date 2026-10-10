# 04: Chọn nhanh các Gia đình đã lưu

**What to build:** Gia đình đã tạo/tham gia xuất hiện thành ô vuông biểu tượng nhà + Mã nhà; bấm ô mở chọn Thành viên và vẫn tạo/tham gia bằng mã như trước.

**Blocked by:** 02 — Ghi nhớ Thành viên khi F5 và mở lại.

**Status:** resolved

- [x] Ghi danh sách local ngay khi tạo/tham gia được chấp nhận, kể cả chưa có người; ghi nhận cả lần chủ động mở link hợp lệ hoặc chọn lại một ô.
- [x] Chuẩn hóa mã, không trùng ô, nhà vừa vào xếp trước; giữ Mã nhà từ bản cũ trong danh sách.
- [x] Danh sách ô hai cột được cuộn riêng khi nhiều nhà; hai nút Tạo Nhà Mới / Tham Gia Bằng Mã luôn dễ tiếp cận, kể cả danh sách trống.
- [x] Chọn ô luôn chuyển sang chọn Thành viên, kể cả cùng Gia đình vừa dùng; lưu đúng bước cho F5 và không khôi phục người riêng theo từng Gia đình.
- [x] Giữ luồng tạo nhà thành công/chia sẻ, validation mã và lối quay lại các bước nhập mã; mã không hợp lệ không tạo ô.
- [x] Kiểm thử App cho ghi ngay, khôi phục lịch sử, sắp xếp/chống trùng, mã cũ và chọn lại người; kiểm tra trình duyệt cho danh sách nhiều ô.

Phụ thuộc 02 vì chọn một ô phải thay trạng thái đã nhớ, bảo đảm không tự khôi phục Thành viên cũ. Không phụ thuộc 03: có thể mở màn chọn Gia đình qua lối đổi đã có hoặc lần vào đầu.

## Context

**Parent:** 01 — Ghi nhớ Thành viên và cải thiện điều hướng Gia đình.

Áp dụng đặc tả Ghi nhớ Thành viên và cải thiện điều hướng Gia đình đã chốt Q1–Q15, glossary của dự án, ADR-0008 và phần bổ sung ADR-0007. Giữ ranh giới kiểm thử đã xác nhận: App cho luồng người dùng, database thật cho cạnh tranh, trình duyệt cho bố cục và nhiều tab theo phạm vi ticket.

## Comments

- 2026-10-11: Xuất bản theo skill to-tickets sau khi người dùng chấp nhận bản chia 7 ticket và các cạnh phụ thuộc. Trạng thái ready-for-agent; chưa bắt đầu triển khai.
- 2026-10-11: Triển khai hoàn tất bởi agent theo TDD: bổ sung hợp đồng lưu trữ `getSavedHouseholds`, `saveHousehold`, `removeSavedHousehold` trên `HouseholdStorage` (hỗ trợ LRU, deduplication, legacy fallback); giao diện lưới ô vuông 2 cột cuộn riêng (`max-h-48 overflow-y-auto`) tại `OnboardingModal`; tích hợp `App.tsx` ghi nhận tức thì khi tạo nhà, tham gia hoặc mở join link URL. Toàn bộ 210 bài kiểm thử vượt qua.

## Answer

### Giải pháp kỹ thuật

1. **Hợp đồng lưu trữ (`HouseholdStorage`, `LocalStorageHouseholdStorage`, `InMemoryHouseholdStorage`)**:
   - `getSavedHouseholds(): string[]`: Trả về danh sách Mã nhà đã lưu theo thứ tự thời gian gần nhất (LRU). Tự động fallback về legacy code `cooking_plan_household_code` nếu key `cooking_plan_saved_households` chưa từng được khởi tạo.
   - `saveHousehold(code: string): void`: Chuẩn hóa `code` (`normalizeHouseholdCode`), kiểm tra hợp lệ (`isValidHouseholdCode`), đưa mã lên đầu danh sách và loại bỏ trùng lặp. Lưu dưới dạng mảng JSON trong `localStorage` với key `cooking_plan_saved_households`.
   - `removeSavedHousehold(code: string): void`: Loại bỏ mã khỏi danh sách đã lưu.
2. **Giao diện người dùng (`OnboardingModal.tsx`)**:
   - Tại bước `choose`, nếu có `savedHouseholds`, hiển thị section **Gia đình đã lưu** với lưới 2 cột (`grid-cols-2 gap-2.5`).
   - Mỗi ô là một thẻ vuông (`aspect-square`) gồm icon Nhà (`Home`), viền mềm mại, bo tròn `rounded-2xl`, hiển thị Mã nhà in hoa rõ ràng.
   - Vùng chứa có giới hạn chiều cao và thanh cuộn độc lập (`max-h-48 overflow-y-auto pr-1`) để bảo đảm 2 nút hành động chính "Tạo Nhà Mới" (`create-household-button`) và "Tham Gia Bằng Mã" (`join-household-button`) luôn hiển thị rõ ràng và bấm được ngay dù danh sách có nhiều nhà hay không có nhà nào.
   - Khi tạo mã mới, `handleConfirmCreate` gọi ngay callback `onHouseholdCreated` để lưu tức thì Mã nhà vào danh sách mà không cần đợi người dùng bấm vào app hay chọn thành viên.
   - Nhập mã gia đình không hợp lệ bị từ chối bằng thông báo lỗi và hoàn toàn không lưu vào danh sách.
3. **Điều hướng và phiên làm việc (`App.tsx`)**:
   - Khi bấm vào một ô Gia đình đã lưu:
     - Gọi `handleOnboardingComplete(code)`, cập nhật trạng thái `storage.setNavigationState({ status: 'choosing_member', householdCode: code })`.
     - Tuyệt đối không tự động khôi phục Thành viên cũ (theo ADR-0008). Người dùng luôn được chuyển đến bước chọn Thành viên (`choosing_member`).
     - Đưa Mã nhà này lên đầu danh sách đã lưu thông qua `storage.saveHousehold(code)`.
     - Trạng thái `choosing_member` được lưu trữ bền vững qua F5.
   - Khi phát hiện tham số `?join=CODE` hợp lệ trên URL:
     - `storage.saveHousehold(detectedJoin)` được gọi ngay lập tức để lưu mã vào danh sách.
     - Tham số `?join` được gỡ bỏ khỏi URL qua `history.replaceState`.
4. **Kiểm thử xác thực**:
   - Bổ sung 5 ca kiểm thử unit trong `tests/services/storage.test.ts` kiểm chứng toàn diện LRU, deduplication, invalid code rejection, và tính tương thích ngược với legacy key.
   - Bổ sung 6 ca kiểm thử tích hợp chuyên biệt trong `tests/integration/household-setup.test.tsx` (`describe('Saved Household Picker (Ticket 04)')`) xác nhận:
     - Lưới 2 cột các ô vuông, hiển thị đầy đủ icon và mã nhà.
     - Hai nút chính "Tạo Nhà Mới" và "Tham Gia Bằng Mã" luôn sẵn sàng.
     - Bấm ô chuyển thẳng sang chọn Thành viên, không auto-restore nickname, lưu trạng thái qua F5.
     - Bấm ô sắp xếp lại ô lên đầu danh sách (LRU).
     - Tạo nhà mới lưu ngay lập tức khi xác nhận tạo.
     - Tham gia bằng mã hợp lệ thì lưu ngay, mã không hợp lệ bị từ chối và không lưu.
     - Link mời `?join=CODE` lưu ngay lập tức vào danh sách.
   - Toàn bộ suite gồm 22 file kiểm thử với 210 ca kiểm thử pass 100%, bản build Vite & TypeScript hoàn toàn thành công.
