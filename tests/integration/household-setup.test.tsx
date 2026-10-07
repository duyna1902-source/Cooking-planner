import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { InMemoryMemberRepository } from '../../src/services/memberRepository';

describe('Household Setup and PWA Shell Integration', () => {
  let storage: InMemoryHouseholdStorage;

  beforeEach(() => {
    storage = new InMemoryHouseholdStorage();
  });

  it('allows a new user to create a household, receive a generated code and join link, enter nickname, and see app header', async () => {
    const user = userEvent.setup();
    const memberRepo = new InMemoryMemberRepository();
    const { unmount } = render(<App storage={storage} memberRepository={memberRepo} />);

    // 1. Initial screen displays Onboarding modal with Create & Join choices
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Bếp Gia Đình')).toBeInTheDocument();

    const createBtn = screen.getByTestId('create-household-button');
    await user.click(createBtn);

    // 2. Next step shows generated code and prompts for nickname
    const codeDisplay = screen.getByTestId('generated-code-display');
    const generatedCode = codeDisplay.textContent?.trim() || '';
    expect(generatedCode).toMatch(/^BEP-\d{3}$/);

    const nicknameInput = screen.getByTestId('nickname-input');
    await user.type(nicknameInput, 'Mẹ');

    const submitBtn = screen.getByTestId('confirm-create-button');
    await user.click(submitBtn);

    // 3. Success step displays the share link with ?join=CODE
    expect(screen.getByText('Đã tạo Nhà thành công!')).toBeInTheDocument();
    const shareUrlInput = screen.getByTestId('share-url-input') as HTMLInputElement;
    expect(shareUrlInput.value).toContain(`?join=${generatedCode}`);

    // 4. Enter app
    const enterAppBtn = screen.getByTestId('enter-app-button');
    await user.click(enterAppBtn);

    // 5. Modal closes, user is in the app
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 6. Header shows household code, nickname, and founding member avatar
    expect(screen.getByTestId('household-code-badge')).toHaveTextContent(`Mã: ${generatedCode}`);
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Mẹ');
    expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🍳');

    // 7. Data is stored in storage
    expect(storage.getHouseholdCode()).toBe(generatedCode);

    // 8. Founding member is saved to MemberRepository with default preset 🍳
    const savedMembers = await memberRepo.getMembers(generatedCode);
    expect(savedMembers).toHaveLength(1);
    expect(savedMembers[0].name).toBe('Mẹ');
    expect(savedMembers[0].avatarIcon).toBe('🍳');
    expect(savedMembers[0].avatarColor).toBe('bg-[#FEF7DC]');

    // 9. Default active view is Plan (Kế hoạch)
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByText('Kế hoạch tuần này')).toBeInTheDocument();

    // 10. Next session (simulating page reload): Founding member appears on MemberSelectModal
    unmount();
    render(<App storage={storage} memberRepository={memberRepo} />);

    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Ai đang vào bếp?')).toBeInTheDocument();
    expect(screen.getByText('Mẹ')).toBeInTheDocument();
    expect(screen.getByText('🍳')).toBeInTheDocument();
  });

  it('allows a user to join via direct URL ?join=CODE and prompt for member selection', async () => {
    const user = userEvent.setup();
    const memberRepo = new InMemoryMemberRepository();
    render(<App storage={storage} memberRepository={memberRepo} initialUrl="?join=BEP-999" />);

    // Directly transitions to member selection modal
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Ai đang vào bếp?')).toBeInTheDocument();
    expect(screen.getByText('Mã: BEP-999')).toBeInTheDocument();

    // Add member
    await user.click(screen.getByTestId('open-add-member-drawer'));
    await user.type(screen.getByTestId('member-name-input'), 'Bố');
    await user.click(screen.getByTestId('save-member-btn'));

    // Select member to enter app
    await user.click(await screen.findByText('Bố'));

    // Enters app successfully
    await waitFor(() => {
      expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('household-code-badge')).toHaveTextContent('Mã: BEP-999');
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Bố');

    // Persisted to storage
    expect(storage.getHouseholdCode()).toBe('BEP-999');
  });

  it('allows a user to join manually by typing code and selecting member', async () => {
    const user = userEvent.setup();
    const memberRepo = new InMemoryMemberRepository();
    render(<App storage={storage} memberRepository={memberRepo} />);

    const joinBtn = screen.getByTestId('join-household-button');
    await user.click(joinBtn);

    const codeInput = screen.getByTestId('household-code-input');
    await user.type(codeInput, 'bep-321');

    const confirmJoinBtn = screen.getByTestId('confirm-join-button');
    await user.click(confirmJoinBtn);

    // Transitions to member selection modal
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Ai đang vào bếp?')).toBeInTheDocument();

    // Add member
    await user.click(screen.getByTestId('open-add-member-drawer'));
    await user.type(screen.getByTestId('member-name-input'), 'Anh Cả');
    await user.click(screen.getByTestId('save-member-btn'));

    // Select member to enter app
    await user.click(await screen.findByText('Anh Cả'));

    await waitFor(() => {
      expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('household-code-badge')).toHaveTextContent('Mã: BEP-321');
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Anh Cả');
    expect(storage.getHouseholdCode()).toBe('BEP-321');
  });

  it('displays validation errors when nickname or code is empty/invalid', async () => {
    const user = userEvent.setup();
    render(<App storage={storage} />);

    // Test creating without nickname
    await user.click(screen.getByTestId('create-household-button'));
    await user.click(screen.getByTestId('confirm-create-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Vui lòng nhập biệt danh');

    // Go back and test join without valid code
    await user.click(screen.getByText('Quay lại'));
    await user.click(screen.getByTestId('join-household-button'));
    await user.click(screen.getByTestId('confirm-join-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Mã nhà không hợp lệ');
  });

  it('switches navigation between Kế hoạch and Menu', async () => {
    // Pre-populate storage for direct app load with existing member
    storage.setHouseholdCode('BEP-892');
    const memberRepo = new InMemoryMemberRepository([
      {
        id: 'mem_1',
        householdCode: 'BEP-892',
        name: 'Mẹ',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
        createdAt: new Date().toISOString(),
      },
    ]);

    const user = userEvent.setup();
    render(<App storage={storage} memberRepository={memberRepo} />);

    // Select member to enter Plan view
    await user.click(await screen.findByText('Mẹ'));

    // Starts in Plan view
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByText('Kế hoạch tuần này')).toBeInTheDocument();

    // Click Menu in bottom navigation
    const menuNavBtn = screen.getByTestId('nav-menu-button');
    await user.click(menuNavBtn);

    // Switches to Menu view
    expect(screen.getByTestId('menu-view')).toBeInTheDocument();
    expect(screen.getByText('Menu gia đình')).toBeInTheDocument();

    // Click Kế hoạch in bottom navigation
    const planNavBtn = screen.getByTestId('nav-plan-button');
    await user.click(planNavBtn);

    // Returns to Plan view
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
  });

  it('automatically sets active household and shows member selection when opening ?join=CODE', async () => {
    storage.setHouseholdCode('BEP-OLD');
    const memberRepo = new InMemoryMemberRepository([
      {
        id: 'mem_1',
        householdCode: 'BEP-NEW',
        name: 'Bà Nội',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
        createdAt: new Date().toISOString(),
      },
    ]);

    const user = userEvent.setup();
    render(<App storage={storage} memberRepository={memberRepo} initialUrl="?join=BEP-NEW" />);

    // Shows member selection modal for BEP-NEW
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Mã: BEP-NEW')).toBeInTheDocument();
    expect(screen.getByText('Bà Nội')).toBeInTheDocument();
    expect(storage.getHouseholdCode()).toBe('BEP-NEW');

    // Select member to enter app
    await user.click(screen.getByText('Bà Nội'));
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Bà Nội');
  });

  it('opens member selection modal with household members when joining via direct URL ?join=CODE for existing household', async () => {
    const user = userEvent.setup();
    const memberRepo = new InMemoryMemberRepository([
      {
        id: 'mem_1',
        householdCode: 'BEP-777',
        name: 'Chị Hai',
        avatarIcon: '🥗',
        avatarColor: 'bg-[#DCFCE7]',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'mem_2',
        householdCode: 'BEP-777',
        name: 'Em Út',
        avatarIcon: '🍜',
        avatarColor: 'bg-[#E0F2FE]',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<App storage={storage} memberRepository={memberRepo} initialUrl="?join=BEP-777" />);

    // Member selection modal is shown immediately with existing members
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Ai đang vào bếp?')).toBeInTheDocument();
    expect(screen.getByText('Mã: BEP-777')).toBeInTheDocument();
    expect(screen.getByText('Chị Hai')).toBeInTheDocument();
    expect(screen.getByText('Em Út')).toBeInTheDocument();

    // Selecting 'Em Út' enters Weekly Plan
    await user.click(screen.getByText('Em Út'));
    await waitFor(() => {
      expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Em Út');
    expect(storage.getHouseholdCode()).toBe('BEP-777');
  });

  it('opens member selection modal with household members when joining manually by code for existing household', async () => {
    const user = userEvent.setup();
    const memberRepo = new InMemoryMemberRepository([
      {
        id: 'mem_1',
        householdCode: 'BEP-666',
        name: 'Bác Ba',
        avatarIcon: '🥑',
        avatarColor: 'bg-[#ECFCCB]',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<App storage={storage} memberRepository={memberRepo} />);

    // Click "Tham Gia Bằng Mã"
    await user.click(screen.getByTestId('join-household-button'));

    // Type code without nickname
    await user.type(screen.getByTestId('household-code-input'), 'bep-666');
    await user.click(screen.getByTestId('confirm-join-button'));

    // Directly transitions to member selection modal for BEP-666
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Mã: BEP-666')).toBeInTheDocument();
    expect(screen.getByText('Bác Ba')).toBeInTheDocument();

    // New person taps "➕ Thêm thành viên mới" and enters
    await user.click(screen.getByTestId('open-add-member-drawer'));
    await user.type(screen.getByTestId('member-name-input'), 'Cháu Cún');
    await user.click(screen.getByTestId('avatar-preset-🍰'));
    await user.click(screen.getByTestId('save-member-btn'));

    // Cháu Cún is now on grid and can enter
    expect(await screen.findByText('Cháu Cún')).toBeInTheDocument();
    await user.click(screen.getByText('Cháu Cún'));

    await waitFor(() => {
      expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Cháu Cún');
  });
});

