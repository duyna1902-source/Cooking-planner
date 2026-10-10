import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingModal } from '../../src/components/OnboardingModal';

describe('OnboardingModal - Saved Household Management (Ticket 05)', () => {
  it('renders a 3-dots menu button on each saved household card with proper aria-label', () => {
    render(
      <OnboardingModal
        savedHouseholds={['BEP-123', 'BEP-456']}
        onComplete={() => {}}
      />
    );

    const btn123 = screen.getByTestId('household-menu-btn-BEP-123');
    const btn456 = screen.getByTestId('household-menu-btn-BEP-456');

    expect(btn123).toBeInTheDocument();
    expect(btn123).toHaveAttribute('aria-label', 'Tùy chọn cho Gia đình BEP-123');
    expect(btn456).toBeInTheDocument();
    expect(btn456).toHaveAttribute('aria-label', 'Tùy chọn cho Gia đình BEP-456');
  });

  it('clicking the 3-dots button does NOT select the household card', async () => {
    const user = userEvent.setup();
    const handleSelectSaved = vi.fn();
    const handleComplete = vi.fn();

    render(
      <OnboardingModal
        savedHouseholds={['BEP-123']}
        onSelectSaved={handleSelectSaved}
        onComplete={handleComplete}
      />
    );

    const menuBtn = screen.getByTestId('household-menu-btn-BEP-123');
    await user.click(menuBtn);

    expect(handleSelectSaved).not.toHaveBeenCalled();
    expect(handleComplete).not.toHaveBeenCalled();

    // Menu option should be visible
    expect(screen.getByTestId('forget-household-btn-BEP-123')).toBeInTheDocument();
    expect(screen.getByText('Bỏ khỏi danh sách')).toBeInTheDocument();
  });

  it('clicking "Bỏ khỏi danh sách" opens confirmation modal showing code and device-only explanation', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingModal
        savedHouseholds={['BEP-123']}
        onComplete={() => {}}
      />
    );

    await user.click(screen.getByTestId('household-menu-btn-BEP-123'));
    await user.click(screen.getByTestId('forget-household-btn-BEP-123'));

    const dialog = screen.getByTestId('forget-confirmation-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('BEP-123');
    // Clarifies that this action ONLY forgets on this device and data remains intact on database
    expect(dialog).toHaveTextContent(/chỉ gỡ Gia đình.*trên thiết bị này/i);
    expect(dialog).toHaveTextContent(/bảo toàn.*trên cơ sở dữ liệu/i);
    expect(screen.getByTestId('cancel-forget-button')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-forget-button')).toBeInTheDocument();
  });

  it('clicking "Hủy" cancels removal, closes dialog, and keeps the household card', async () => {
    const user = userEvent.setup();
    const handleForget = vi.fn();

    render(
      <OnboardingModal
        savedHouseholds={['BEP-123']}
        onForgetHousehold={handleForget}
        onComplete={() => {}}
      />
    );

    await user.click(screen.getByTestId('household-menu-btn-BEP-123'));
    await user.click(screen.getByTestId('forget-household-btn-BEP-123'));
    expect(screen.getByTestId('forget-confirmation-dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('cancel-forget-button'));

    expect(screen.queryByTestId('forget-confirmation-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('saved-household-card-BEP-123')).toBeInTheDocument();
    expect(handleForget).not.toHaveBeenCalled();
  });

  it('confirming removal calls onForgetHousehold, closes dialog, and immediately removes the card', async () => {
    const user = userEvent.setup();
    const handleForget = vi.fn();

    render(
      <OnboardingModal
        savedHouseholds={['BEP-123', 'BEP-456']}
        onForgetHousehold={handleForget}
        onComplete={() => {}}
      />
    );

    await user.click(screen.getByTestId('household-menu-btn-BEP-123'));
    await user.click(screen.getByTestId('forget-household-btn-BEP-123'));
    await user.click(screen.getByTestId('confirm-forget-button'));

    expect(handleForget).toHaveBeenCalledWith('BEP-123');
    expect(screen.queryByTestId('forget-confirmation-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saved-household-card-BEP-123')).not.toBeInTheDocument();
    expect(screen.getByTestId('saved-household-card-BEP-456')).toBeInTheDocument();
  });

  it('forgetting the last saved household leaves creation and join buttons fully accessible', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingModal
        savedHouseholds={['BEP-999']}
        onComplete={() => {}}
      />
    );

    await user.click(screen.getByTestId('household-menu-btn-BEP-999'));
    await user.click(screen.getByTestId('forget-household-btn-BEP-999'));
    await user.click(screen.getByTestId('confirm-forget-button'));

    expect(screen.queryByTestId('saved-household-card-BEP-999')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saved-households-grid')).not.toBeInTheDocument();

    // Primary action buttons remain accessible
    expect(screen.getByTestId('create-household-button')).toBeInTheDocument();
    expect(screen.getByTestId('join-household-button')).toBeInTheDocument();
  });
});
