import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';
import { TestMemberRepository, sampleMember } from '../support/memberRepository';

describe('Household Setup and PWA Shell Integration', () => {
  let storage: InMemoryHouseholdStorage;
  beforeEach(() => { storage = new InMemoryHouseholdStorage(); });
  const renderApp = (initialUrl?: string, memberRepository = new TestMemberRepository()) => render(
    <App storage={storage} memberRepository={memberRepository} initialUrl={initialUrl}
      dishRepository={new InMemoryDishRepository()} planRepository={new InMemoryPlanRepository()} />
  );

  it('creates a Gia đình with a generated code and join link before asking for Thành viên', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('create-household-button'));
    const code = screen.getByTestId('generated-code-display').textContent!.trim();
    expect(code).toMatch(/^BEP-\d{3}$/);
    expect(screen.queryByTestId('nickname-input')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('confirm-create-button'));
    expect(screen.getByText('Đã tạo Nhà thành công!')).toBeInTheDocument();
    expect((screen.getByTestId('share-url-input') as HTMLInputElement).value).toContain(`?join=${code}`);
    await user.click(screen.getByTestId('enter-app-button'));
    expect(await screen.findByText('Cả nhà bắt đầu từ bạn')).toBeInTheDocument();
    expect(storage.getHouseholdCode()).toBe(code);
    expect(storage.getNickname()).toBeNull();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
  });
  it('joins by entering a normalized Mã nhà without requesting a nickname', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('join-household-button'));
    await user.type(screen.getByTestId('household-code-input'), 'bep-321');
    expect(screen.queryByTestId('nickname-input')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('confirm-join-button'));
    expect(await screen.findByText('Cả nhà bắt đầu từ bạn')).toBeInTheDocument();
    expect(storage.getHouseholdCode()).toBe('BEP-321');
    expect(storage.getNickname()).toBeNull();
  });
  it('rejects an invalid Mã nhà and supports returning to the setup choice', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTestId('create-household-button'));
    await user.click(screen.getByText('Quay lại'));
    await user.click(screen.getByTestId('join-household-button'));
    await user.click(screen.getByTestId('confirm-join-button'));
    expect(screen.getByTestId('error-message')).toHaveTextContent('Mã nhà không hợp lệ');
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
  });
  it.each([null, 'Bà Nội'])('join links remember the target Gia đình and require selection with legacy nickname %s', async (nickname) => {
    storage.setHouseholdCode('BEP-OLD');
    if (nickname) storage.setNickname(nickname);
    renderApp('?join=BEP-NEW', new TestMemberRepository([sampleMember('An', 'BEP-NEW')]));
    expect(await screen.findByRole('button', { name: 'Chọn An' })).toBeInTheDocument();
    expect(screen.getByText('BEP-NEW')).toBeInTheDocument();
    expect(storage.getHouseholdCode()).toBe('BEP-NEW');
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nickname-input')).not.toBeInTheDocument();
  });
  it('keeps the selected Thành viên across navigation and allows changing Gia đình only from Kế hoạch', async () => {
    storage.setHouseholdCode('BEP-892');
    storage.setNickname('Legacy');
    const user = userEvent.setup();
    renderApp(undefined, new TestMemberRepository([sampleMember('Mẹ', 'BEP-892'), sampleMember('Bố', 'BEP-321')]));
    await user.click(await screen.findByRole('button', { name: 'Chọn Mẹ' }));
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByText('Kế hoạch tuần này')).toBeInTheDocument();

    // Clicking household code button opens Share modal (Ticket 03)
    await user.click(screen.getByTestId('household-code-badge'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Chia sẻ Nhà cho gia đình')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Đóng' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // In Plan tab, clicking member button opens dropdown menu
    await user.click(screen.getByTestId('member-name-badge'));
    expect(screen.getByRole('menuitem', { name: 'Đổi thành viên' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Đổi gia đình' })).toBeInTheDocument();

    // In Menu tab, member badge is display-only, no switch controls
    await user.click(screen.getByTestId('nav-menu-button'));
    expect(screen.getByTestId('menu-view')).toBeInTheDocument();
    expect(screen.getByText('Menu gia đình')).toBeInTheDocument();
    expect(screen.queryByTestId('switch-household-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('switch-member-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
    expect(screen.getByTestId('member-name-badge').tagName).toBe('SPAN');

    // Return to Plan tab and switch household through member dropdown
    await user.click(screen.getByTestId('nav-plan-button'));
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    await user.click(screen.getByTestId('member-name-badge'));
    await user.click(screen.getByRole('menuitem', { name: 'Đổi gia đình' }));
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();

    // Enter BEP-321
    await user.click(screen.getByTestId('join-household-button'));
    await user.type(screen.getByTestId('household-code-input'), 'BEP-321');
    await user.click(screen.getByTestId('confirm-join-button'));
    expect(await screen.findByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Chọn Mẹ' })).not.toBeInTheDocument();
    expect(storage.getHouseholdCode()).toBe('BEP-321');
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Chọn Bố' }));
    await waitFor(() => expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Bố'));
  });

  describe('Saved Household Picker (Ticket 04)', () => {
    it('displays saved households as 2-column square cards and keeps primary action buttons visible', async () => {
      storage.saveHousehold('BEP-111');
      storage.saveHousehold('BEP-222');
      renderApp();

      const grid = screen.getByTestId('saved-households-grid');
      expect(grid).toBeInTheDocument();
      expect(grid.className).toContain('grid-cols-2');

      const card222 = screen.getByTestId('saved-household-card-BEP-222');
      const card111 = screen.getByTestId('saved-household-card-BEP-111');
      expect(card222).toBeInTheDocument();
      expect(card111).toBeInTheDocument();
      expect(card222.className).toContain('aspect-square');

      // Primary buttons remain accessible
      expect(screen.getByTestId('create-household-button')).toBeInTheDocument();
      expect(screen.getByTestId('join-household-button')).toBeInTheDocument();
    });

    it('clicking a saved household card navigates immediately to member selection without auto-selecting member, and survives F5', async () => {
      storage.saveHousehold('BEP-333');
      const memberRepo = new TestMemberRepository([sampleMember('Chi', 'BEP-333')]);
      const user = userEvent.setup();
      renderApp(undefined, memberRepo);

      await user.click(screen.getByTestId('saved-household-card-BEP-333'));

      // Transitions to choosing_member
      expect(await screen.findByRole('button', { name: 'Chọn Chi' })).toBeInTheDocument();
      expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
      expect(storage.getNavigationState()).toEqual({
        status: 'choosing_member',
        householdCode: 'BEP-333',
      });

      // Simulating F5 reload with the same storage
      const reloaded = render(
        <App storage={storage} memberRepository={memberRepo}
          dishRepository={new InMemoryDishRepository()} planRepository={new InMemoryPlanRepository()} />
      );
      expect(await reloaded.findByRole('button', { name: 'Chọn Chi' })).toBeInTheDocument();
      expect(reloaded.queryByTestId('plan-view')).not.toBeInTheDocument();
    });

    it('clicking a saved household card re-orders it to the front of saved list', async () => {
      storage.saveHousehold('BEP-AAA');
      storage.saveHousehold('BEP-BBB');
      // Current order: BEP-BBB, BEP-AAA
      expect(storage.getSavedHouseholds()).toEqual(['BEP-BBB', 'BEP-AAA']);

      const user = userEvent.setup();
      renderApp(undefined, new TestMemberRepository());

      await user.click(screen.getByTestId('saved-household-card-BEP-AAA'));
      expect(storage.getSavedHouseholds()).toEqual(['BEP-AAA', 'BEP-BBB']);
    });

    it('saves newly created household immediately upon creation confirmation', async () => {
      const user = userEvent.setup();
      renderApp();

      await user.click(screen.getByTestId('create-household-button'));
      const code = screen.getByTestId('generated-code-display').textContent!.trim();
      await user.click(screen.getByTestId('confirm-create-button'));

      // Should be immediately in saved households
      expect(storage.getSavedHouseholds()).toContain(code);
    });

    it('saves newly joined household when code is valid, and rejects invalid code without saving', async () => {
      const user = userEvent.setup();
      renderApp();

      await user.click(screen.getByTestId('join-household-button'));
      await user.type(screen.getByTestId('household-code-input'), '!!');
      await user.click(screen.getByTestId('confirm-join-button'));

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(storage.getSavedHouseholds()).toEqual([]);

      await user.clear(screen.getByTestId('household-code-input'));
      await user.type(screen.getByTestId('household-code-input'), 'BEP-888');
      await user.click(screen.getByTestId('confirm-join-button'));

      expect(storage.getSavedHouseholds()).toEqual(['BEP-888']);
    });

    it('join link saves the household immediately to saved households', async () => {
      renderApp('?join=BEP-JOINED');
      expect(storage.getSavedHouseholds()).toEqual(['BEP-JOINED']);
    });
  });
});
