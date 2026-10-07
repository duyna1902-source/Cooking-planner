import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberSelectModal } from '../../src/components/MemberSelectModal';
import { Member } from '../../src/domain/member';
import { InMemoryMemberRepository } from '../../src/services/memberRepository';

describe('MemberSelectModal', () => {
  const sampleMembers: Member[] = [
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

  it('renders household code badge and title "Hôm nay ai vào bếp?"', () => {
    const handleSelect = vi.fn();
    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={sampleMembers}
        onSelectMember={handleSelect}
      />
    );

    expect(screen.getByText(/BEP-892/)).toBeInTheDocument();
    expect(screen.getByText('Hôm nay ai vào bếp?')).toBeInTheDocument();
  });

  it('renders 2-column grid with member cards displaying avatar icon and bold name', () => {
    const handleSelect = vi.fn();
    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={sampleMembers}
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
    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={sampleMembers}
        onSelectMember={handleSelect}
      />
    );

    const card = screen.getByTestId('member-card-m2');
    await user.click(card);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(sampleMembers[1]);
  });

  it('renders sticky bottom button "➕ Thêm thành viên mới" and opens MemberDrawer on tap', async () => {
    const user = userEvent.setup();
    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={sampleMembers}
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
    const memberRepo = new InMemoryMemberRepository(sampleMembers);
    const handleSelect = vi.fn();
    const handleMemberAdded = vi.fn();

    render(
      <MemberSelectModal
        householdCode="BEP-892"
        members={sampleMembers}
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
});
