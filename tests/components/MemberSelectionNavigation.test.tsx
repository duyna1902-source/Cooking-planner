import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberSelection } from '../../src/components/MemberSelection';
import { TestMemberRepository, sampleMember } from '../support/memberRepository';

describe('MemberSelection Back Navigation (Ticket 03)', () => {
  it('renders back button to switch household and triggers onBackToHousehold when clicked', async () => {
    const user = userEvent.setup();
    const onBackToHousehold = vi.fn();
    const repository = new TestMemberRepository([sampleMember('Mẹ')]);

    render(
      <MemberSelection
        householdCode="BEP-123"
        repository={repository}
        onChoose={vi.fn()}
        onBackToHousehold={onBackToHousehold}
      />
    );

    const backBtn = await screen.findByRole('button', { name: /Đổi gia đình/i });
    expect(backBtn).toBeInTheDocument();
    await user.click(backBtn);
    expect(onBackToHousehold).toHaveBeenCalledTimes(1);
  });

  it('back button is accessible and clickable when member list is empty', async () => {
    const user = userEvent.setup();
    const onBackToHousehold = vi.fn();
    const repository = new TestMemberRepository([]);

    render(
      <MemberSelection
        householdCode="BEP-EMPTY"
        repository={repository}
        onChoose={vi.fn()}
        onBackToHousehold={onBackToHousehold}
      />
    );

    expect(await screen.findByText('Cả nhà bắt đầu từ bạn')).toBeInTheDocument();
    const backBtn = screen.getByRole('button', { name: /Đổi gia đình/i });
    expect(backBtn).toBeEnabled();
    await user.click(backBtn);
    expect(onBackToHousehold).toHaveBeenCalledTimes(1);
  });

  it('back button is accessible and clickable when member list is in error state', async () => {
    const user = userEvent.setup();
    const onBackToHousehold = vi.fn();
    const repository = new TestMemberRepository([]);
    repository.getMembers = vi.fn().mockRejectedValue(new Error('Lỗi tải dữ liệu'));

    render(
      <MemberSelection
        householdCode="BEP-ERR"
        repository={repository}
        onChoose={vi.fn()}
        onBackToHousehold={onBackToHousehold}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Lỗi tải dữ liệu');
    const backBtn = screen.getByRole('button', { name: /Đổi gia đình/i });
    expect(backBtn).toBeEnabled();
    await user.click(backBtn);
    expect(onBackToHousehold).toHaveBeenCalledTimes(1);
  });

  it('back button is accessible and clickable when member list is loading', async () => {
    const user = userEvent.setup();
    const onBackToHousehold = vi.fn();
    const repository = new TestMemberRepository([]);
    // Unresolved promise simulates ongoing loading
    repository.getMembers = vi.fn().mockReturnValue(new Promise(() => {}));

    render(
      <MemberSelection
        householdCode="BEP-LOAD"
        repository={repository}
        onChoose={vi.fn()}
        onBackToHousehold={onBackToHousehold}
      />
    );

    expect(screen.getByText('Đang tải Thành viên…')).toBeInTheDocument();
    const backBtn = screen.getByRole('button', { name: /Đổi gia đình/i });
    expect(backBtn).toBeEnabled();
    await user.click(backBtn);
    expect(onBackToHousehold).toHaveBeenCalledTimes(1);
  });
});
