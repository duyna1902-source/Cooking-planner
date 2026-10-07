import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberSelectModal } from '../../src/components/MemberSelectModal';
import { Member } from '../../src/domain/member';
import { InMemoryMemberRepository } from '../../src/services/memberRepository';

describe('MemberSelectModal', () => {
  const getSampleMembers = (): Member[] => [
    {
      id: 'm1',
      householdCode: 'BEP-892',
      name: 'Mẹ',
      avatarIcon: '🍳',
      avatarColor: 'bg-[#FEF7DC]',
      createdAt: '2026-10-07T10:00:00.000Z',
    },
    {
      id: 'm2',
      householdCode: 'BEP-892',
      name: 'Bố',
      avatarIcon: '🍜',
      avatarColor: 'bg-[#E0F2FE]',
      createdAt: '2026-10-07T10:05:00.000Z',
    },
    {
      id: 'm3',
      householdCode: 'BEP-892',
      name: 'Bé An',
      avatarIcon: '🥑',
      avatarColor: 'bg-[#ECFCCB]',
      createdAt: '2026-10-07T10:10:00.000Z',
    },
  ];

  it('renders household code badge and title "Ai đang vào bếp?"', () => {
    const handleSelect = vi.fn();
    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={getSampleMembers()}
        onSelectMember={handleSelect}
      />
    );

    expect(screen.getByText(/BEP-892/)).toBeInTheDocument();
    expect(screen.getByText('Ai đang vào bếp?')).toBeInTheDocument();
  });

  it('renders 2-column grid with member cards displaying avatar icon and bold name', () => {
    const handleSelect = vi.fn();
    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={getSampleMembers()}
        onSelectMember={handleSelect}
      />
    );

    expect(screen.getByText('Mẹ')).toBeInTheDocument();
    expect(screen.getByText('🍳')).toBeInTheDocument();

    expect(screen.getByText('Bố')).toBeInTheDocument();
    expect(screen.getByText('🍜')).toBeInTheDocument();

    expect(screen.getByText('Bé An')).toBeInTheDocument();
    expect(screen.getByText('🥑')).toBeInTheDocument();

    const memberGrid = screen.getByTestId('member-grid');
    expect(memberGrid).toHaveClass('grid-cols-2');
  });

  it('calls onSelectMember with the clicked member when tapping a card', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const members = getSampleMembers();
    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={members}
        onSelectMember={handleSelect}
      />
    );

    const card = screen.getByTestId('member-card-m2');
    await user.click(card);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(members[1]);
  });

  it('renders sticky bottom button "➕ Thêm thành viên mới" and opens MemberDrawer on tap', async () => {
    const user = userEvent.setup();
    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={getSampleMembers()}
        onSelectMember={vi.fn()}
      />
    );

    const openBtn = screen.getByTestId('open-add-member-drawer');
    expect(openBtn).toBeInTheDocument();
    expect(openBtn).toHaveTextContent(/Thêm thành viên mới/i);

    expect(screen.queryByTestId('member-drawer')).not.toBeInTheDocument();

    await user.click(openBtn);
    expect(screen.getByTestId('member-drawer')).toBeInTheDocument();
  });

  it('adds member to repository, updates grid, closes drawer, and allows selecting new member', async () => {
    const user = userEvent.setup();
    const members = getSampleMembers();
    const memberRepo = new InMemoryMemberRepository(members);
    const handleSelect = vi.fn();
    const handleMemberAdded = vi.fn();

    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={members}
        onSelectMember={handleSelect}
        memberRepository={memberRepo}
        onMemberAdded={handleMemberAdded}
      />
    );

    // Open drawer
    await user.click(screen.getByTestId('open-add-member-drawer'));
    expect(screen.getByTestId('member-drawer')).toBeInTheDocument();

    // Type new member name
    const input = screen.getByTestId('member-name-input');
    await user.type(input, 'Bà Ngoại');

    // Select salad preset 🥗
    await user.click(screen.getByTestId('avatar-preset-🥗'));

    // Submit form
    await user.click(screen.getByTestId('save-member-btn'));

    // Drawer closes
    expect(screen.queryByTestId('member-drawer')).not.toBeInTheDocument();

    // New member appears in grid
    expect(screen.getByText('Bà Ngoại')).toBeInTheDocument();
    expect(screen.getByText('🥗')).toBeInTheDocument();

    // Member was added to repository
    const stored = await memberRepo.getMembers('BEP-892');
    expect(stored.some((m) => m.name === 'Bà Ngoại')).toBe(true);

    // onMemberAdded was called
    expect(handleMemberAdded).toHaveBeenCalledTimes(1);

    // Click new member card
    await user.click(screen.getByText('Bà Ngoại'));
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect.mock.calls[0][0].name).toBe('Bà Ngoại');
    expect(handleSelect.mock.calls[0][0].avatarIcon).toBe('🥗');
  });

  describe('Manage mode', () => {
    it('toggles manage mode on and off when clicking toggle button', async () => {
      const user = userEvent.setup();
      render(
        <MemberSelectModal
          householdCode="BEP-892"
          members={getSampleMembers()}
          onSelectMember={vi.fn()}
        />
      );

      const toggleBtn = screen.getByTestId('toggle-manage-mode');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveTextContent('Chỉnh sửa');

      // Before clicking, no delete buttons and no wiggle animation
      expect(screen.queryByTestId('delete-member-m1')).not.toBeInTheDocument();
      expect(screen.getByTestId('member-card-m1').className).not.toContain('animate-wiggle');

      // Click to toggle on
      await user.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent('Xong');
      expect(screen.getByTestId('delete-member-m1')).toBeInTheDocument();
      expect(screen.getByTestId('member-card-m1').className).toContain('animate-wiggle');

      // Click to toggle off
      await user.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent('Chỉnh sửa');
      expect(screen.queryByTestId('delete-member-m1')).not.toBeInTheDocument();
      expect(screen.getByTestId('member-card-m1').className).not.toContain('animate-wiggle');
    });

    it('tapping member card in manage mode opens MemberDrawer in edit mode to update member', async () => {
      const user = userEvent.setup();
      const members = getSampleMembers();
      const memberRepo = new InMemoryMemberRepository(members);
      const handleSelect = vi.fn();

      render(
        <MemberSelectModal
          householdCode="BEP-892"
          members={members}
          onSelectMember={handleSelect}
          memberRepository={memberRepo}
        />
      );

      // Toggle manage mode
      await user.click(screen.getByTestId('toggle-manage-mode'));

      // Click on member card "Mẹ"
      await user.click(screen.getByTestId('member-card-m1'));

      // onSelectMember should NOT be called in manage mode
      expect(handleSelect).not.toHaveBeenCalled();

      // Drawer opens in edit mode
      expect(screen.getByTestId('member-drawer')).toBeInTheDocument();
      expect(screen.getByText('Chỉnh Sửa Thành Viên')).toBeInTheDocument();
      const input = screen.getByTestId('member-name-input');
      expect(input).toHaveValue('Mẹ');

      // Edit name and choose cake preset 🍰
      await user.clear(input);
      await user.type(input, 'Mẹ Yêu');
      await user.click(screen.getByTestId('avatar-preset-🍰'));

      // Submit
      await user.click(screen.getByTestId('save-member-btn'));

      // Drawer closes, updated info rendered in grid
      expect(screen.queryByTestId('member-drawer')).not.toBeInTheDocument();
      expect(screen.getByText('Mẹ Yêu')).toBeInTheDocument();
      expect(screen.getByText('🍰')).toBeInTheDocument();

      // Updated in repository
      const membersInDb = await memberRepo.getMembers('BEP-892');
      const updated = membersInDb.find((m) => m.id === 'm1');
      expect(updated?.name).toBe('Mẹ Yêu');
      expect(updated?.avatarIcon).toBe('🍰');
    });

    it('shows confirmation dialog when clicking delete, and deletes member on confirmation', async () => {
      const user = userEvent.setup();
      const members = getSampleMembers();
      const memberRepo = new InMemoryMemberRepository(members);

      render(
        <MemberSelectModal
          householdCode="BEP-892"
          members={members}
          onSelectMember={vi.fn()}
          memberRepository={memberRepo}
        />
      );

      await user.click(screen.getByTestId('toggle-manage-mode'));

      // Click delete button on "Bố" (m2)
      const deleteBtn = screen.getByTestId('delete-member-m2');
      await user.click(deleteBtn);

      // Confirmation modal appears
      expect(screen.getByTestId('confirm-delete-modal')).toBeInTheDocument();
      expect(screen.getByText(/"Bố"/i)).toBeInTheDocument();

      // Can cancel
      const cancelBtn = screen.getByTestId('cancel-delete-member-btn');
      await user.click(cancelBtn);
      expect(screen.queryByTestId('confirm-delete-modal')).not.toBeInTheDocument();
      expect(screen.getByText('Bố')).toBeInTheDocument();

      // Click delete again and confirm
      await user.click(deleteBtn);
      const confirmBtn = screen.getByTestId('confirm-delete-member-btn');
      await user.click(confirmBtn);

      // Confirmation modal closes
      expect(screen.queryByTestId('confirm-delete-modal')).not.toBeInTheDocument();

      // "Bố" removed from grid
      expect(screen.queryByText('Bố')).not.toBeInTheDocument();

      // "Bố" removed from repository
      const membersInDb = await memberRepo.getMembers('BEP-892');
      expect(membersInDb.some((m) => m.id === 'm2')).toBe(false);
      expect(membersInDb).toHaveLength(2);
    });

    it('blocks deletion and displays safety constraint message when only 1 member remains', async () => {
      const user = userEvent.setup();
      const singleMember: Member[] = [getSampleMembers()[0]];
      const memberRepo = new InMemoryMemberRepository(singleMember);
      const deleteSpy = vi.spyOn(memberRepo, 'deleteMember');

      render(
        <MemberSelectModal
          householdCode="BEP-892"
          members={singleMember}
          onSelectMember={vi.fn()}
          memberRepository={memberRepo}
        />
      );

      await user.click(screen.getByTestId('toggle-manage-mode'));

      // Click delete button
      const deleteBtn = screen.getByTestId('delete-member-m1');
      await user.click(deleteBtn);

      // Blocks deletion and shows safety warning
      expect(screen.getByText(/Gia đình phải có ít nhất 1 thành viên/i)).toBeInTheDocument();
      expect(deleteSpy).not.toHaveBeenCalled();

      // Confirmation modal should not appear
      expect(screen.queryByTestId('confirm-delete-modal')).not.toBeInTheDocument();

      // Member still exists
      expect(screen.getByText('Mẹ')).toBeInTheDocument();
    });
  });

  describe('Realtime Subscription', () => {
    it('subscribes to memberRepository on mount, updates member list on realtime trigger, and unsubscribes on unmount', async () => {
      let triggerSubscriber: (() => void) | null = null;
      const initialMembers = getSampleMembers();
      const memberRepo = new InMemoryMemberRepository(initialMembers);

      const unsubscribeMock = vi.fn();
      memberRepo.subscribe = vi.fn().mockImplementation((_code, cb) => {
        triggerSubscriber = cb;
        return unsubscribeMock;
      });

      const { unmount } = render(
        <MemberSelectModal
          householdCode="BEP-892"
          members={initialMembers}
          onSelectMember={vi.fn()}
          memberRepository={memberRepo}
        />
      );

      // Verify subscription on mount
      expect(memberRepo.subscribe).toHaveBeenCalledWith('BEP-892', expect.any(Function));

      // Simulate external member addition in DB from another device
      const newMember: Member = {
        id: 'm4',
        householdCode: 'BEP-892',
        name: 'Chú Ba',
        avatarIcon: '🍕',
        avatarColor: 'bg-[#FFEDD5]',
        createdAt: '2026-10-07T12:00:00.000Z',
      };
      await memberRepo.addMember(newMember);

      // Trigger realtime subscriber
      if (triggerSubscriber) {
        await act(async () => {
          await (triggerSubscriber as () => Promise<void>)();
        });
      }

      // Check that "Chú Ba" is now displayed
      expect(await screen.findByText('Chú Ba')).toBeInTheDocument();
      expect(screen.getByText('🍕')).toBeInTheDocument();

      // Verify unmount cleanup
      unmount();
      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });
});
