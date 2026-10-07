import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberSelectModal } from '../../src/components/MemberSelectModal';
import { Member } from '../../src/domain/member';

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
});
