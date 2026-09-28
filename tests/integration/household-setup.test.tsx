import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { InMemoryHouseholdStorage } from '../../src/services/storage';

describe('Household Setup and PWA Shell Integration', () => {
  let storage: InMemoryHouseholdStorage;

  beforeEach(() => {
    storage = new InMemoryHouseholdStorage();
  });

  it('allows a new user to create a household, receive a generated code and join link, enter nickname, and see app header', async () => {
    const user = userEvent.setup();
    render(<App storage={storage} />);

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

    // 6. Header shows household code and nickname
    expect(screen.getByTestId('household-code-badge')).toHaveTextContent(`Mã: ${generatedCode}`);
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Mẹ');

    // 7. Data is stored in storage
    expect(storage.getHouseholdCode()).toBe(generatedCode);
    expect(storage.getNickname()).toBe('Mẹ');

    // 8. Default active view is Plan (Kế hoạch)
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByText('Kế hoạch tuần này')).toBeInTheDocument();
  });

  it('allows a user to join via direct URL ?join=CODE and prompt for nickname', async () => {
    const user = userEvent.setup();
    render(<App storage={storage} initialUrl="?join=BEP-999" />);

    // Directly in Join step with pre-filled code
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('initial-code-display')).toHaveTextContent('BEP-999');

    // Enter nickname
    const nicknameInput = screen.getByTestId('nickname-input');
    await user.type(nicknameInput, 'Bố');

    // Submit join
    const confirmJoinBtn = screen.getByTestId('confirm-join-button');
    await user.click(confirmJoinBtn);

    // Enters app successfully
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('household-code-badge')).toHaveTextContent('Mã: BEP-999');
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Bố');

    // Persisted to storage
    expect(storage.getHouseholdCode()).toBe('BEP-999');
    expect(storage.getNickname()).toBe('Bố');
  });

  it('allows a user to join manually by typing code and nickname', async () => {
    const user = userEvent.setup();
    render(<App storage={storage} />);

    const joinBtn = screen.getByTestId('join-household-button');
    await user.click(joinBtn);

    const codeInput = screen.getByTestId('household-code-input');
    await user.type(codeInput, 'bep-321');

    const nicknameInput = screen.getByTestId('nickname-input');
    await user.type(nicknameInput, 'Anh Cả');

    const confirmJoinBtn = screen.getByTestId('confirm-join-button');
    await user.click(confirmJoinBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('household-code-badge')).toHaveTextContent('Mã: BEP-321');
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Anh Cả');
    expect(storage.getHouseholdCode()).toBe('BEP-321');
    expect(storage.getNickname()).toBe('Anh Cả');
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
    await user.type(screen.getByTestId('nickname-input'), 'Thành Viên');
    await user.click(screen.getByTestId('confirm-join-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Mã nhà không hợp lệ');
  });

  it('switches navigation between Kế hoạch and Menu', async () => {
    // Pre-populate storage for direct app load
    storage.setHouseholdCode('BEP-892');
    storage.setNickname('Mẹ');

    const user = userEvent.setup();
    render(<App storage={storage} />);

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

  it('automatically sets active household and does not prompt for nickname when user with existing nickname opens ?join=CODE', () => {
    // User already has nickname set locally
    storage.setNickname('Bà Nội');
    storage.setHouseholdCode('BEP-OLD');

    render(<App storage={storage} initialUrl="?join=BEP-NEW" />);

    // Does NOT show onboarding dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Automatically switches to the new household
    expect(screen.getByTestId('household-code-badge')).toHaveTextContent('Mã: BEP-NEW');
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Bà Nội');
    expect(storage.getHouseholdCode()).toBe('BEP-NEW');
    expect(storage.getNickname()).toBe('Bà Nội');
  });
});

