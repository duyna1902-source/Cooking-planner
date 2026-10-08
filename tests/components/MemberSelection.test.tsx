import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

  describe('Six-Member Capacity Limit Enforcement (Ticket 02)', () => {
    it('replaces "+ Thêm thành viên" button with accessible capacity notice when household has 6 members', async () => {
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

      // "+ Thêm thành viên" button is absent
      expect(screen.queryByRole('button', { name: '+ Thêm thành viên' })).not.toBeInTheDocument();

      // Replaced by accessible status text
      const notice = screen.getByText('Đã đạt tối đa 6 Thành viên trong Gia đình');
      expect(notice).toBeInTheDocument();
      expect(notice).toHaveAttribute('role', 'status');

      // Add dialog cannot be opened from UI
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('guards form submission if household reaches 6 members before submit (race condition)', async () => {
      const repository = new TestMemberRepository([
        sampleMember('Mẹ'),
        sampleMember('Bố'),
        sampleMember('An'),
        sampleMember('Linh'),
        sampleMember('Bà'),
      ]);
      const addMemberSpy = vi.spyOn(repository, 'addMember');

      render(
        <MemberSelection
          householdCode="BEP-123"
          repository={repository}
          onChoose={vi.fn()}
        />
      );

      // Open add member dialog when there are 5 members
      const addBtn = await screen.findByRole('button', { name: '+ Thêm thành viên' });
      await userEvent.click(addBtn);

      const input = screen.getByRole('textbox', { name: 'Tên Thành viên' });
      await userEvent.type(input, 'Bé Út');

      // Concurrent addition: 6th member is added in background
      await act(async () => {
        await repository.addMember('BEP-123', 'Ông');
      });
      addMemberSpy.mockClear();

      // Now submit the form
      const submitBtn = screen.getByRole('button', { name: 'Lưu Thành viên' });
      await userEvent.click(submitBtn);

      // Form displays inline error and repository.addMember is NOT called
      expect(await screen.findByRole('alert')).toHaveTextContent('Gia đình đã có tối đa 6 Thành viên.');
      expect(addMemberSpy).not.toHaveBeenCalled();
    });

    it('restores "+ Thêm thành viên" button when a member is deleted so count drops to 5 or fewer', async () => {
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
      expect(screen.queryByRole('button', { name: '+ Thêm thành viên' })).not.toBeInTheDocument();
      expect(screen.getByText('Đã đạt tối đa 6 Thành viên trong Gia đình')).toBeInTheDocument();

      // Enter delete management mode
      await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));

      // Delete "Ông"
      await userEvent.click(screen.getByRole('button', { name: 'Xóa Ông' }));
      await userEvent.click(screen.getByRole('button', { name: 'Xóa thành viên', exact: true }));

      // Exit delete mode
      await userEvent.click(await screen.findByRole('button', { name: 'Xong' }));

      // Capacity notice is gone, "+ Thêm thành viên" button automatically reappears
      expect(screen.queryByText('Đã đạt tối đa 6 Thành viên trong Gia đình')).not.toBeInTheDocument();
      expect(await screen.findByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();
    });
  });

  describe('Floating Toast and Delete Management Mode (Ticket 03)', () => {
    it('renders notice as floating toast overlay with role="status" after adding a member', async () => {
      const repository = new TestMemberRepository([sampleMember('Mẹ')]);
      render(
        <MemberSelection
          householdCode="BEP-123"
          repository={repository}
          onChoose={vi.fn()}
        />
      );

      const addBtn = await screen.findByRole('button', { name: '+ Thêm thành viên' });
      await userEvent.click(addBtn);

      const input = screen.getByRole('textbox', { name: 'Tên Thành viên' });
      await userEvent.type(input, 'Bố');
      await userEvent.click(screen.getByRole('button', { name: 'Lưu Thành viên' }));

      const toast = await screen.findByRole('status');
      expect(toast).toHaveTextContent('Đã thêm Bố. Chọn một Thành viên để vào Kế hoạch.');
      expect(toast).toHaveClass('ms-toast');
      expect(toast).toHaveClass('ms-notice');
    });

    it('auto-dismisses the toast notice after 3000ms', async () => {
      vi.useFakeTimers();
      try {
        const repository = new TestMemberRepository([sampleMember('Mẹ')]);
        render(
          <MemberSelection
            householdCode="BEP-123"
            repository={repository}
            onChoose={vi.fn()}
          />
        );

        await act(async () => {
          await vi.advanceTimersByTimeAsync(50);
        });

        const addBtn = screen.getByRole('button', { name: '+ Thêm thành viên' });
        fireEvent.click(addBtn);

        const input = screen.getByRole('textbox', { name: 'Tên Thành viên' });
        fireEvent.change(input, { target: { value: 'Bố' } });
        fireEvent.click(screen.getByRole('button', { name: 'Lưu Thành viên' }));

        await act(async () => {
          await vi.advanceTimersByTimeAsync(50);
        });

        const toast = screen.getByRole('status');
        expect(toast).toBeInTheDocument();
        expect(toast).toHaveTextContent('Đã thêm Bố');

        // Advance by 2900ms - should still be visible
        act(() => {
          vi.advanceTimersByTime(2900);
        });
        expect(screen.getByRole('status')).toBeInTheDocument();

        // Advance past 3000ms - should be dismissed
        act(() => {
          vi.advanceTimersByTime(200);
        });
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('renders toast after deleting a member and auto-dismisses after 3000ms', async () => {
      vi.useFakeTimers();
      try {
        const repository = new TestMemberRepository([sampleMember('Mẹ'), sampleMember('Bố')]);
        render(
          <MemberSelection
            householdCode="BEP-123"
            repository={repository}
            onChoose={vi.fn()}
          />
        );

        await act(async () => {
          await vi.advanceTimersByTimeAsync(50);
        });

        fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
        fireEvent.click(screen.getByRole('button', { name: 'Xóa Mẹ' }));
        fireEvent.click(screen.getByRole('button', { name: 'Xóa thành viên', exact: true }));

        await act(async () => {
          await vi.advanceTimersByTimeAsync(50);
        });

        const toast = screen.getByRole('status');
        expect(toast).toHaveTextContent('Đã xóa Mẹ khỏi danh sách Thành viên.');
        expect(toast).toHaveClass('ms-toast');

        // Advance past 3000ms
        act(() => {
          vi.advanceTimersByTime(3100);
        });
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('hides the bottom "+ Thêm thành viên" action area when entering delete mode and restores it when exiting', async () => {
      const repository = new TestMemberRepository([sampleMember('Mẹ'), sampleMember('Bố')]);
      render(
        <MemberSelection
          householdCode="BEP-123"
          repository={repository}
          onChoose={vi.fn()}
        />
      );

      expect(await screen.findByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).toBeInTheDocument();

      // Enter delete mode
      const manageBtn = screen.getByRole('button', { name: 'Xóa' });
      await userEvent.click(manageBtn);

      // Bottom add area and button are hidden
      expect(screen.queryByRole('button', { name: '+ Thêm thành viên' })).not.toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).not.toBeInTheDocument();

      // Exit delete mode
      await userEvent.click(screen.getByRole('button', { name: 'Xong' }));

      // Bottom add area and button reappear
      expect(await screen.findByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).toBeInTheDocument();
    });

    it('hides capacity notice when entering delete mode with 6 members and restores it when exiting', async () => {
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

      expect(await screen.findByText('Đã đạt tối đa 6 Thành viên trong Gia đình')).toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).toBeInTheDocument();

      // Enter delete mode
      await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));

      // Capacity notice and bottom add area are completely hidden
      expect(screen.queryByText('Đã đạt tối đa 6 Thành viên trong Gia đình')).not.toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).not.toBeInTheDocument();

      // Exit delete mode
      await userEvent.click(screen.getByRole('button', { name: 'Xong' }));

      // Capacity notice reappears
      expect(await screen.findByText('Đã đạt tối đa 6 Thành viên trong Gia đình')).toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).toBeInTheDocument();
    });

    it('restores "+ Thêm thành viên" when last member is deleted and delete mode auto-exits', async () => {
      const repository = new TestMemberRepository([sampleMember('Mẹ')]);
      render(
        <MemberSelection
          householdCode="BEP-123"
          repository={repository}
          onChoose={vi.fn()}
        />
      );

      expect(await screen.findByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();

      // Enter delete mode
      await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
      expect(screen.queryByRole('button', { name: '+ Thêm thành viên' })).not.toBeInTheDocument();

      // Delete the only member
      await userEvent.click(screen.getByRole('button', { name: 'Xóa Mẹ' }));
      await userEvent.click(screen.getByRole('button', { name: 'Xóa thành viên', exact: true }));

      // Empty state reached, delete mode auto-exits, add button restored
      expect(await screen.findByText('Cả nhà bắt đầu từ bạn')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).toBeInTheDocument();
    });
  });
});
