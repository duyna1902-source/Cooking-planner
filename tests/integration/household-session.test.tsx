import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';
import { TestMemberRepository, sampleMember, deferred } from '../support/memberRepository';
import { Member } from '../../src/domain/member';

describe('Household Navigation & Session UX (Ticket 02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('restores remembered member on F5/reopen after database verification and opens PlanView', async () => {
    const member = sampleMember('Mẹ', 'BEP-123');
    const storage = new InMemoryHouseholdStorage();
    storage.setNavigationState({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: member.id,
    });

    const memberRepo = new TestMemberRepository([member]);
    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    // Verifies against database and restores into PlanView
    expect(await screen.findByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
  });

  it('shows loading state during member verification before opening content', async () => {
    const member = sampleMember('Mẹ', 'BEP-123');
    const storage = new InMemoryHouseholdStorage();
    storage.setNavigationState({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: member.id,
    });

    const pendingMembers = deferred<Member[]>();
    const memberRepo = new TestMemberRepository();
    memberRepo.getMembers = vi.fn().mockReturnValue(pendingMembers.promise);

    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    // Shows loading feedback and does NOT show PlanView yet
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();

    // Resolve verification
    await act(async () => {
      pendingMembers.resolve([member]);
    });

    expect(await screen.findByTestId('plan-view')).toBeInTheDocument();
  });

  it('transitions to choosing_member with an explanation notice if remembered member was deleted from database', async () => {
    const remainingMember = sampleMember('Bố', 'BEP-123');
    const storage = new InMemoryHouseholdStorage();
    storage.setNavigationState({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: 'deleted-member-id',
    });

    const memberRepo = new TestMemberRepository([remainingMember]);
    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    // Clears remembered member in storage, transitions to choosing_member
    expect(await screen.findByRole('heading', { name: 'Bạn là ai?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    expect(storage.getNavigationState()).toEqual({
      status: 'choosing_member',
      householdCode: 'BEP-123',
    });

    // Displays clear notice that member was deleted
    expect(screen.getByRole('alert')).toHaveTextContent(/đã bị xóa|không còn tồn tại/i);
  });

  it('retains remembered selection on database error, shows Retry and Đổi gia đình, and recovers on retry', async () => {
    const member = sampleMember('Mẹ', 'BEP-123');
    const storage = new InMemoryHouseholdStorage();
    storage.setNavigationState({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: member.id,
    });

    const memberRepo = new TestMemberRepository([member]);
    memberRepo.getMembers = vi
      .fn()
      .mockRejectedValueOnce(new Error('Mất kết nối cơ sở dữ liệu'))
      .mockResolvedValue([member]);

    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    // Shows error alert with Retry and Change Household
    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối cơ sở dữ liệu');
    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    const switchHouseholdBtn = screen.getByRole('button', { name: /Đổi gia đình/i });
    expect(retryBtn).toBeInTheDocument();
    expect(switchHouseholdBtn).toBeInTheDocument();

    // Storage still retains the selected state (does NOT clear or wipe on error)
    expect(storage.getNavigationState()).toEqual({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: member.id,
    });

    // User clicks Thử lại -> successfully recovers to PlanView
    await userEvent.click(retryBtn);
    expect(await screen.findByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
  });

  it('allows switching to choosing_household from the verification error screen', async () => {
    const storage = new InMemoryHouseholdStorage();
    storage.setNavigationState({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: 'm-1',
    });

    const memberRepo = new TestMemberRepository();
    memberRepo.getMembers = vi.fn().mockRejectedValue(new Error('Lỗi máy chủ'));

    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Lỗi máy chủ');
    const switchHouseholdBtn = screen.getByRole('button', { name: /Đổi gia đình/i });

    await userEvent.click(switchHouseholdBtn);

    // Transitions to choosing_household
    expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
    expect(screen.getByTestId('create-household-button')).toBeInTheDocument();
    expect(screen.getByTestId('join-household-button')).toBeInTheDocument();
  });

  it('handles join link: switches to choosing_member for new code and removes join param from URL', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    const storage = new InMemoryHouseholdStorage();
    storage.setNavigationState({
      status: 'selected',
      householdCode: 'BEP-OLD',
      memberId: 'm-old',
    });

    const memberRepo = new TestMemberRepository([sampleMember('Lan', 'BEP-NEW')]);

    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        initialUrl="?join=BEP-NEW&source=invite"
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    // Switches to choosing_member for BEP-NEW
    expect(await screen.findByRole('button', { name: 'Chọn Lan' })).toBeInTheDocument();
    expect(storage.getNavigationState()).toEqual({
      status: 'choosing_member',
      householdCode: 'BEP-NEW',
    });

    // Removes join param from URL while preserving other params
    expect(replaceStateSpy).toHaveBeenCalled();
    const calledUrl = replaceStateSpy.mock.calls[0][2] as string;
    expect(calledUrl).not.toContain('join=');
    expect(calledUrl).toContain('source=invite');
  });

  it('handles join link: retains valid remembered member if join code matches current household', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    const member = sampleMember('Mẹ', 'BEP-SAME');
    const storage = new InMemoryHouseholdStorage();
    storage.setNavigationState({
      status: 'selected',
      householdCode: 'BEP-SAME',
      memberId: member.id,
    });

    const memberRepo = new TestMemberRepository([member]);

    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        initialUrl="?join=BEP-SAME"
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    // Restores PlanView with Mẹ
    expect(await screen.findByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
    expect(replaceStateSpy).toHaveBeenCalled();
  });

  it('supports explicit "Đổi thành viên" and "Đổi gia đình", persisting pending step across F5', async () => {
    const user = userEvent.setup();
    const member = sampleMember('Mẹ', 'BEP-123');
    const storage = new InMemoryHouseholdStorage();
    storage.setNavigationState({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: member.id,
    });

    const memberRepo = new TestMemberRepository([member, sampleMember('Bố', 'BEP-123')]);

    const { unmount } = render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    expect(await screen.findByTestId('plan-view')).toBeInTheDocument();

    // Click "Đổi thành viên"
    await user.click(screen.getByRole('button', { name: /Đổi thành viên/i }));
    expect(screen.getByRole('heading', { name: 'Bạn là ai?' })).toBeInTheDocument();
    expect(storage.getNavigationState()).toEqual({
      status: 'choosing_member',
      householdCode: 'BEP-123',
    });

    // Simulate F5 / reload while at choosing_member: continues at choosing_member, not returning to Mẹ
    unmount();
    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );
    expect(await screen.findByRole('heading', { name: 'Bạn là ai?' })).toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();

    // Choose Bố
    await user.click(screen.getByRole('button', { name: 'Chọn Bố' }));
    expect(await screen.findByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Bố');

    // Click "Đổi gia đình"
    await user.click(screen.getByRole('button', { name: /Đổi gia đình/i }));
    expect(storage.getNavigationState()).toEqual({ status: 'choosing_household' });
    expect(screen.getByTestId('create-household-button')).toBeInTheDocument();
  });

  it('backwards compatibility: legacy storage with only household code transitions to choosing_member without selecting nickname', async () => {
    const storage = new InMemoryHouseholdStorage('BEP-LEGACY', 'Bà Nội');
    const memberRepo = new TestMemberRepository([
      sampleMember('Bà Nội', 'BEP-LEGACY'),
      sampleMember('Cháu', 'BEP-LEGACY'),
    ]);

    render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={new InMemoryDishRepository()}
        planRepository={new InMemoryPlanRepository()}
      />
    );

    // Does NOT auto-select Bà Nội even though nickname matches name; opens choosing_member
    expect(await screen.findByRole('heading', { name: 'Bạn là ai?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn Bà Nội' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn Cháu' })).toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
  });

  it('multi-tab independence: running tabs retain separate identities; new tab uses latest saved selection', async () => {
    const user = userEvent.setup();
    const memberA = sampleMember('Tôm', 'BEP-123');
    const memberB = sampleMember('Mẹ', 'BEP-123');
    const storage = new InMemoryHouseholdStorage('BEP-123');
    const memberRepo = new TestMemberRepository([memberA, memberB]);
    const dishes = new InMemoryDishRepository();
    const plans = new InMemoryPlanRepository();

    // Tab A opens and chooses Tôm
    const tabA = render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={dishes}
        planRepository={plans}
      />
    );
    await user.click(await tabA.findByRole('button', { name: 'Chọn Tôm' }));
    expect(tabA.getByTestId('member-name-badge')).toHaveTextContent('Tôm');
    expect(storage.getNavigationState()).toEqual({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: memberA.id,
    });

    // Tab B opens (reads latest saved state: Tôm), then switches to Mẹ
    const tabB = render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={dishes}
        planRepository={plans}
      />
    );
    expect(await tabB.findByTestId('member-name-badge')).toHaveTextContent('Tôm');
    await user.click(within(tabB.container).getByRole('button', { name: /Đổi thành viên/i }));
    await user.click(within(tabB.container).getByRole('button', { name: 'Chọn Mẹ' }));
    expect(within(tabB.container).getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
    expect(storage.getNavigationState()).toEqual({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: memberB.id,
    });

    // Tab A still retains Tôm in memory
    expect(within(tabA.container).getByTestId('member-name-badge')).toHaveTextContent('Tôm');

    // Passive events on Tab A (focus / visibilitychange) do NOT overwrite storage with Tôm
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(storage.getNavigationState()).toEqual({
      status: 'selected',
      householdCode: 'BEP-123',
      memberId: memberB.id,
    });

    // A fresh tab / F5 of Tab A will restore Mẹ
    tabA.unmount();
    const reloadedTabA = render(
      <App
        storage={storage}
        memberRepository={memberRepo}
        dishRepository={dishes}
        planRepository={plans}
      />
    );
    expect(await reloadedTabA.findByTestId('member-name-badge')).toHaveTextContent('Mẹ');
    tabB.unmount();
    reloadedTabA.unmount();
  });
});
