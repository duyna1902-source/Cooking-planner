import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '../../src/components/AppHeader';

describe('AppHeader (Ticket 03)', () => {
  it('renders a compact header with household code button and no persistent sync badge or quick-share button', () => {
    render(
      <AppHeader
        householdCode="BEP-123"
        memberName="Mẹ"
        activeTab="plan"
      />
    );

    // Household code is rendered as an interactive button/badge
    const codeBtn = screen.getByRole('button', { name: /BEP-123/i });
    expect(codeBtn).toBeInTheDocument();

    // Persistent sync status badge is removed
    expect(screen.queryByTestId('sync-status-badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/Online/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chế độ máy/i)).not.toBeInTheDocument();

    // Separate quick-share button is removed
    expect(screen.queryByTestId('quick-share-button')).not.toBeInTheDocument();

    // Direct standalone switch buttons are removed from header
    expect(screen.queryByTestId('switch-household-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('switch-member-button')).not.toBeInTheDocument();
  });

  it('clicking the household code triggers onOpenShare', async () => {
    const user = userEvent.setup();
    const handleOpenShare = vi.fn();

    render(
      <AppHeader
        householdCode="BEP-999"
        memberName="Bố"
        activeTab="plan"
        onOpenShare={handleOpenShare}
      />
    );

    const codeBtn = screen.getByRole('button', { name: /BEP-999/i });
    await user.click(codeBtn);

    expect(handleOpenShare).toHaveBeenCalledTimes(1);
  });

  describe('Plan Tab Member Menu', () => {
    it('opens dropdown menu on member name click with EXACTLY two actions', async () => {
      const user = userEvent.setup();
      const handleChangeHousehold = vi.fn();
      const handleChangeMember = vi.fn();

      render(
        <AppHeader
          householdCode="BEP-123"
          memberName="Bố"
          activeTab="plan"
          onChangeHousehold={handleChangeHousehold}
          onChangeMember={handleChangeMember}
        />
      );

      const nameBtn = screen.getByRole('button', { name: /Bố/i });
      expect(nameBtn).toHaveAttribute('aria-haspopup', 'menu');
      expect(nameBtn).toHaveAttribute('aria-expanded', 'false');

      // Dropdown menu is not visible initially
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Click to open
      await user.click(nameBtn);
      expect(nameBtn).toHaveAttribute('aria-expanded', 'true');

      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();

      // Menu contains exactly two items
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(2);
      expect(menuItems[0]).toHaveTextContent('Đổi gia đình');
      expect(menuItems[1]).toHaveTextContent('Đổi thành viên');

      // Clicking "Đổi gia đình" triggers handler and closes menu
      await user.click(menuItems[0]);
      expect(handleChangeHousehold).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(nameBtn).toHaveAttribute('aria-expanded', 'false');

      // Re-open and click "Đổi thành viên"
      await user.click(nameBtn);
      const switchMemberItem = screen.getByRole('menuitem', { name: 'Đổi thành viên' });
      await user.click(switchMemberItem);
      expect(handleChangeMember).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('supports keyboard navigation: Enter/Space opens, Escape closes', async () => {
      const user = userEvent.setup();

      render(
        <AppHeader
          householdCode="BEP-123"
          memberName="Bố"
          activeTab="plan"
          onChangeHousehold={vi.fn()}
          onChangeMember={vi.fn()}
        />
      );

      const nameBtn = screen.getByRole('button', { name: /Bố/i });
      nameBtn.focus();

      // Enter key opens menu
      await user.keyboard('{Enter}');
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Escape key closes menu and focuses nameBtn
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(nameBtn).toHaveFocus();
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <AppHeader
            householdCode="BEP-123"
            memberName="Bố"
            activeTab="plan"
            onChangeHousehold={vi.fn()}
            onChangeMember={vi.fn()}
          />
          <button type="button">Bên ngoài</button>
        </div>
      );

      const nameBtn = screen.getByRole('button', { name: /Bố/i });
      await user.click(nameBtn);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByRole('button', { name: 'Bên ngoài' }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Menu Tab Header', () => {
    it('displays member name as text only without opening switch menu', async () => {
      const user = userEvent.setup();
      const handleChangeHousehold = vi.fn();
      const handleChangeMember = vi.fn();

      render(
        <AppHeader
          householdCode="BEP-123"
          memberName="Mẹ"
          activeTab="menu"
          onChangeHousehold={handleChangeHousehold}
          onChangeMember={handleChangeMember}
        />
      );

      // Name is present as display text
      expect(screen.getByText('Mẹ')).toBeInTheDocument();

      // No button for member name on Menu tab
      expect(screen.queryByRole('button', { name: /Mẹ/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('household code sharing still works on Menu tab', async () => {
      const user = userEvent.setup();
      const handleOpenShare = vi.fn();

      render(
        <AppHeader
          householdCode="BEP-123"
          memberName="Mẹ"
          activeTab="menu"
          onOpenShare={handleOpenShare}
        />
      );

      const codeBtn = screen.getByRole('button', { name: /BEP-123/i });
      await user.click(codeBtn);
      expect(handleOpenShare).toHaveBeenCalledTimes(1);
    });
  });

  describe('Truncation & Long Strings', () => {
    it('gracefully handles long household codes and long member names', () => {
      const longCode = 'BEP-VERY-LONG-CUSTOM-HOUSEHOLD-CODE-99999';
      const longName = 'Nguyễn Thị Bích Phượng Hoàng Lan Chi';

      render(
        <AppHeader
          householdCode={longCode}
          memberName={longName}
          activeTab="plan"
        />
      );

      const codeBtn = screen.getByRole('button', { name: new RegExp(longCode, 'i') });
      expect(codeBtn).toBeInTheDocument();
      expect(codeBtn).toHaveAttribute('title', `Mã nhà: ${longCode}`);

      const nameBtn = screen.getByRole('button', { name: new RegExp(longName, 'i') });
      expect(nameBtn).toBeInTheDocument();
      expect(nameBtn).toHaveAttribute('title', longName);
    });
  });
});
