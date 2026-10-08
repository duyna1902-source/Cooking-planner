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
    await user.click(screen.getByTestId('quick-share-button'));
    expect(await navigator.clipboard.readText()).toContain('?join=BEP-892');
    expect(screen.queryByRole('button', { name: /Đổi thành viên/i })).not.toBeInTheDocument();
    await user.click(screen.getByTestId('nav-menu-button'));
    expect(screen.getByTestId('menu-view')).toBeInTheDocument();
    expect(screen.getByText('Menu gia đình')).toBeInTheDocument();
    expect(screen.queryByTestId('switch-household-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
    await user.click(screen.getByTestId('nav-plan-button'));
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đổi gia đình' }));
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
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
});
