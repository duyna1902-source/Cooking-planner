import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberSelection } from '../../src/components/MemberSelection';
import { TestMemberRepository, sampleMember } from '../support/memberRepository';

describe('MemberSelection Component (Ticket 01)', () => {
  it('renders zero-scroll layout with empty state when household has 0 members', async () => {
    const repository = new TestMemberRepository([]);
    render(
      <MemberSelection
        householdCode="BEP-123"
        repository={repository}
        onChoose={vi.fn()}
      />
    );

    expect(await screen.findByText('Cả nhà bắt đầu từ bạn')).toBeInTheDocument();
    expect(screen.getByTestId('member-selection-root')).toHaveClass('member-selection');
    expect(document.querySelector('.ms-scroll')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();
  });

  it('renders 2-column layout with artwork and footer quote for 1 member', async () => {
    const repository = new TestMemberRepository([sampleMember('Mẹ')]);
    render(
      <MemberSelection
        householdCode="BEP-123"
        repository={repository}
        onChoose={vi.fn()}
      />
    );

    expect(await screen.findByRole('button', { name: 'Chọn Mẹ' })).toBeInTheDocument();
    const root = screen.getByTestId('member-selection-root');
    expect(root).not.toHaveAttribute('data-compact');
    expect(root).not.toHaveClass('ms-compact');

    const grid = screen.getByTestId('member-grid');
    expect(grid).toHaveAttribute('data-columns', '2');
    expect(grid).toHaveClass('ms-grid-cols-2');

    expect(screen.getByTestId('ms-greeting-art')).toBeInTheDocument();
    expect(screen.getByTestId('ms-eyebrow')).toBeInTheDocument();
    expect(screen.getByTestId('ms-footer')).toBeInTheDocument();
  });

  it('renders 2-column layout with artwork and footer quote for 4 members', async () => {
    const repository = new TestMemberRepository([
      sampleMember('Mẹ'),
      sampleMember('Bố'),
      sampleMember('An'),
      sampleMember('Linh'),
    ]);
    render(
      <MemberSelection
        householdCode="BEP-123"
        repository={repository}
        onChoose={vi.fn()}
      />
    );

    expect(await screen.findByRole('button', { name: 'Chọn Linh' })).toBeInTheDocument();
    const root = screen.getByTestId('member-selection-root');
    expect(root).not.toHaveAttribute('data-compact');

    const grid = screen.getByTestId('member-grid');
    expect(grid).toHaveAttribute('data-columns', '2');
    expect(grid).toHaveAttribute('data-mode', '2-col');
    expect(grid).toHaveClass('ms-grid-cols-2');

    expect(screen.getByTestId('ms-greeting-art')).toBeInTheDocument();
    expect(screen.getByTestId('ms-footer')).toBeInTheDocument();
  });

  it('renders 3-column layout and collapses artwork and footer quote for 5 members', async () => {
    const repository = new TestMemberRepository([
      sampleMember('Mẹ'),
      sampleMember('Bố'),
      sampleMember('An'),
      sampleMember('Linh'),
      sampleMember('Bà'),
    ]);
    render(
      <MemberSelection
        householdCode="BEP-123"
        repository={repository}
        onChoose={vi.fn()}
      />
    );

    expect(await screen.findByRole('button', { name: 'Chọn Bà' })).toBeInTheDocument();
    const root = screen.getByTestId('member-selection-root');
    expect(root).toHaveAttribute('data-compact', 'true');
    expect(root).toHaveClass('ms-compact');

    const grid = screen.getByTestId('member-grid');
    expect(grid).toHaveAttribute('data-columns', '3');
    expect(grid).toHaveAttribute('data-mode', '3-col');
    expect(grid).toHaveClass('ms-grid-cols-3');

    expect(screen.queryByTestId('ms-greeting-art')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ms-eyebrow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ms-footer')).not.toBeInTheDocument();
  });

  it('renders 3-column layout and collapses artwork and footer quote for 6 members', async () => {
    const repository = new TestMemberRepository([
      sampleMember('Mẹ'),
      sampleMember('Bố'),
      sampleMember('An'),
      sampleMember('Linh'),
      sampleMember('Bà'),
      sampleMember('Ông'),
    ]);
    render(
      <MemberSelection
        householdCode="BEP-123"
        repository={repository}
        onChoose={vi.fn()}
      />
    );

    expect(await screen.findByRole('button', { name: 'Chọn Ông' })).toBeInTheDocument();
    const root = screen.getByTestId('member-selection-root');
    expect(root).toHaveAttribute('data-compact', 'true');
    expect(root).toHaveClass('ms-compact');

    const grid = screen.getByTestId('member-grid');
    expect(grid).toHaveAttribute('data-columns', '3');
    expect(grid).toHaveClass('ms-grid-cols-3');

    expect(screen.queryByTestId('ms-greeting-art')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ms-footer')).not.toBeInTheDocument();
  });

  it('calls onChoose when a member button is clicked', async () => {
    const onChoose = vi.fn();
    const mom = sampleMember('Mẹ');
    const repository = new TestMemberRepository([mom]);
    render(
      <MemberSelection
        householdCode="BEP-123"
        repository={repository}
        onChoose={onChoose}
      />
    );

    const button = await screen.findByRole('button', { name: 'Chọn Mẹ' });
    await userEvent.click(button);
    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith(mom);
  });
});
