import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';
import { InMemoryMemberRepository } from '../../src/services/memberRepository';
import { formatDateToISO } from '../../src/domain/plan';

describe('Member Selection Modal & Session Gate Integration (Ticket 01)', () => {
  let storage: InMemoryHouseholdStorage;
  let dishRepo: InMemoryDishRepository;
  let planRepo: InMemoryPlanRepository;
  let memberRepo: InMemoryMemberRepository;
  const householdCode = 'BEP-892';
  const today = formatDateToISO(new Date());

  beforeEach(async () => {
    storage = new InMemoryHouseholdStorage();
    dishRepo = new InMemoryDishRepository();
    planRepo = new InMemoryPlanRepository();
    memberRepo = new InMemoryMemberRepository();

    // Setup household in storage
    storage.setHouseholdCode(householdCode);

    // Pre-populate members
    await memberRepo.addMember({
      householdCode,
      name: 'Mẹ Bắp',
      avatarIcon: '🍳',
      avatarColor: 'bg-[#FEF7DC]',
    });
    await memberRepo.addMember({
      householdCode,
      name: 'Bố Tuấn',
      avatarIcon: '🍜',
      avatarColor: 'bg-[#E0F2FE]',
    });

    // Pre-populate a dish and schedule it for dinner
    const dish = await dishRepo.addDish(householdCode, {
      name: 'Thịt kho tàu',
      tag: 'Món mặn',
    });
    await planRepo.addDishesToMeal(householdCode, today, 'dinner', [dish.id]);
  });

  it('displays member selection modal when household has members and activeMember is null', async () => {
    render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    // Member selection modal is shown
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Hôm nay ai vào bếp?')).toBeInTheDocument();
    expect(screen.getByText('Mã: BEP-892')).toBeInTheDocument();
    expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
    expect(screen.getByText('Bố Tuấn')).toBeInTheDocument();

    // PlanView is blocked
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
  });

  it('tapping member card unlocks PlanView and displays active member in AppHeader', async () => {
    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });

    // Tap member card for "Mẹ Bắp"
    const memberCard = screen.getByText('Mẹ Bắp');
    await user.click(memberCard);

    // Modal is dismissed, PlanView is unlocked
    await waitFor(() => {
      expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();

    // AppHeader displays active member name and avatar icon
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Mẹ Bắp');
    expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🍳');
  });

  it('adding a comment attributes author_nickname to active member', async () => {
    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    // Select "Bố Tuấn"
    await waitFor(() => {
      expect(screen.getByText('Bố Tuấn')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bố Tuấn'));

    await waitFor(() => {
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    });

    // Open dish detail
    const dishCard = screen.getByTestId('plan-dish-card-trigger-Thịt kho tàu');
    await user.click(dishCard);

    // Wait for dish drawer and comment input
    await waitFor(() => {
      expect(screen.getByTestId('comment-input')).toBeInTheDocument();
    });

    // Enter comment and submit
    const commentInput = screen.getByTestId('comment-input');
    await user.type(commentInput, 'Bố nhớ mua thêm trứng nhé');

    const sendCommentBtn = screen.getByTestId('send-comment-btn');
    await user.click(sendCommentBtn);

    // Comment appears with author "Bố Tuấn"
    await waitFor(() => {
      expect(screen.getByText('Bố nhớ mua thêm trứng nhé')).toBeInTheDocument();
    });
    expect(screen.getByText('Bố Tuấn')).toBeInTheDocument();
  });

  it('reloading or remounting App resets activeMember to null and re-prompts member selection modal', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    // Select "Mẹ Bắp"
    await waitFor(() => {
      expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Mẹ Bắp'));
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();

    // Simulate page reload / new session by unmounting and re-rendering
    unmount();

    render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    // Member selection modal is displayed again!
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Hôm nay ai vào bếp?')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
  });

  describe('Add New Member via Bottom Drawer Integration (Ticket 02)', () => {
    it('tapping "➕ Thêm thành viên mới" opens drawer, submitting persists member, displays on grid, and allows entering Weekly Plan', async () => {
      const user = userEvent.setup();
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={memberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });

      // Tapping "➕ Thêm thành viên mới" opens MemberDrawer
      const addBtn = screen.getByTestId('open-add-member-drawer');
      expect(addBtn).toBeInTheDocument();
      await user.click(addBtn);

      expect(screen.getByTestId('member-drawer')).toBeInTheDocument();
      expect(screen.getByText('Thêm Thành Viên Mới')).toBeInTheDocument();

      // Enter name "Bé An" and choose preset 🥑
      const nameInput = screen.getByTestId('member-name-input');
      await user.type(nameInput, 'Bé An');
      await user.click(screen.getByTestId('avatar-preset-🥑'));

      // Submit new member
      await user.click(screen.getByTestId('save-member-btn'));

      // Drawer closes, new member is on grid
      await waitFor(() => {
        expect(screen.queryByTestId('member-drawer')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Bé An')).toBeInTheDocument();
      expect(screen.getByText('🥑')).toBeInTheDocument();

      // Persisted to repository
      const membersInDb = await memberRepo.getMembers(householdCode);
      const created = membersInDb.find((m) => m.name === 'Bé An');
      expect(created).toBeDefined();
      expect(created?.avatarIcon).toBe('🥑');

      // Tapping newly added member enters Weekly Plan as that member
      await user.click(screen.getByText('Bé An'));

      await waitFor(() => {
        expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
      expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Bé An');
      expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🥑');
    });

    it('shows error when submitting duplicate or empty name in drawer', async () => {
      const user = userEvent.setup();
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={memberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('open-add-member-drawer'));
      expect(screen.getByTestId('member-drawer')).toBeInTheDocument();

      // Empty name submit
      const saveBtn = screen.getByTestId('save-member-btn');
      await user.click(saveBtn);

      expect(screen.getByTestId('member-name-error')).toBeInTheDocument();
      expect(screen.getByTestId('member-name-error')).toHaveTextContent(/Vui lòng nhập tên thành viên/i);

      // Duplicate name submit (case-insensitive)
      const nameInput = screen.getByTestId('member-name-input');
      await user.type(nameInput, '   mẹ bắp   ');
      await user.click(saveBtn);

      expect(screen.getByTestId('member-name-error')).toBeInTheDocument();
      expect(screen.getByTestId('member-name-error')).toHaveTextContent(/đã tồn tại|đã có trong gia đình/i);

      // Ensure drawer is still open and duplicate was not added
      expect(screen.getByTestId('member-drawer')).toBeInTheDocument();
      const currentList = await memberRepo.getMembers(householdCode);
      expect(currentList.filter((m) => m.name.toLowerCase() === 'mẹ bắp')).toHaveLength(1);
    });
  });
});
