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
});
