import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '../../src/components/AppHeader';
import { Member } from '../../src/domain/member';

describe('AppHeader', () => {
  const member: Member = {
    id: 'm1',
    householdCode: 'BEP-892',
    name: 'Mẹ Bắp',
    avatarIcon: '🍳',
    avatarColor: 'bg-[#FEF7DC]',
    createdAt: '2026-10-07T10:00:00.000Z',
  };

  it('displays active member name and avatar icon next to household code badge', () => {
    render(
      <AppHeader
        householdCode="BEP-892"
        nickname="Mẹ Bắp"
        activeMember={member}
        activeTab="plan"
      />
    );

    expect(screen.getByTestId('household-code-badge')).toHaveTextContent('Mã: BEP-892');
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Mẹ Bắp');
    expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🍳');
  });

  it('falls back to nickname text when activeMember is not provided', () => {
    render(
      <AppHeader
        householdCode="BEP-892"
        nickname="Bố"
        activeTab="plan"
      />
    );

    expect(screen.getByTestId('household-code-badge')).toHaveTextContent('Mã: BEP-892');
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Bố');
    expect(screen.queryByTestId('active-member-avatar')).not.toBeInTheDocument();
  });

  it('triggers onSwitchMember when switch member button is tapped', async () => {
    const user = userEvent.setup();
    const handleSwitch = vi.fn();

    render(
      <AppHeader
        householdCode="BEP-892"
        nickname="Mẹ Bắp"
        activeMember={member}
        onSwitchMember={handleSwitch}
        activeTab="plan"
      />
    );

    const switchBtn = screen.getByTestId('switch-member-btn');
    expect(switchBtn).toHaveTextContent('Đổi thành viên');
    expect(switchBtn).toHaveAttribute('title', 'Đổi thành viên');
    await user.click(switchBtn);
    expect(handleSwitch).toHaveBeenCalledTimes(1);
  });
});
