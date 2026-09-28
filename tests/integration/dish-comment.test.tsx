import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanView } from '../../src/components/PlanView';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';

describe('Dish Detail and Blank Comment Input Integration (Ticket 04)', () => {
  let dishRepo: InMemoryDishRepository;
  let planRepo: InMemoryPlanRepository;
  const householdCode = 'BEP-892';
  const fixedDate = '2026-09-29';
  const nickname = 'Mẹ Bắp';

  beforeEach(async () => {
    dishRepo = new InMemoryDishRepository();
    planRepo = new InMemoryPlanRepository();

    // Populate dish in menu
    const dish = await dishRepo.addDish(householdCode, { name: 'Thịt kho trứng', tag: 'Món mặn' });
    // Add dish to dinner plan
    await planRepo.addDishesToMeal(householdCode, fixedDate, 'dinner', [dish.id]);
  });

  it('opens minimalist Bottom Drawer with dish name and tag when clicking on scheduled dish card', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        nickname={nickname}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Wait for dish card to render
    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    // Click on the dish card
    const dishCard = screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng');
    await user.click(dishCard);

    // Detail drawer is displayed
    const drawer = await screen.findByTestId('dish-detail-drawer');
    expect(drawer).toBeInTheDocument();

    // Displays dish name and tag
    expect(screen.getByTestId('detail-dish-name')).toHaveTextContent('Thịt kho trứng');
    expect(screen.getByTestId('detail-dish-tag')).toHaveTextContent('Món mặn');
  });

  it('ensures comment input is initially completely blank with no pre-filled text', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        nickname={nickname}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng'));

    const input = await screen.findByTestId('comment-input');
    // Must be completely blank
    expect(input).toHaveValue('');
  });

  it('disables send button when comment input is empty or contains only whitespace', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        nickname={nickname}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng'));

    const sendBtn = await screen.findByTestId('send-comment-btn');
    const input = screen.getByTestId('comment-input');

    // Initially disabled
    expect(sendBtn).toBeDisabled();

    // Type whitespace
    await user.type(input, '    ');
    expect(sendBtn).toBeDisabled();

    // Type text
    await user.type(input, 'Mua thêm 5 quả trứng gà');
    expect(sendBtn).toBeEnabled();
  });

  it('allows user to enter cooking notes and submit, displaying comment with nickname and time', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        nickname={nickname}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng'));

    const input = await screen.findByTestId('comment-input');
    const sendBtn = screen.getByTestId('send-comment-btn');

    await user.type(input, 'Kho nước dừa, nêm nhạt một chút');
    await user.click(sendBtn);

    // Comment appears in the conversation thread
    await waitFor(() => {
      expect(screen.getByText('Kho nước dừa, nêm nhạt một chút')).toBeInTheDocument();
    });

    // Contains author nickname
    expect(screen.getByTestId('comment-author')).toHaveTextContent('Mẹ Bắp');

    // Input is reset to empty string
    expect(input).toHaveValue('');
  });

  it('displays multiple comments in chronological order', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        nickname={nickname}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng'));

    const input = await screen.findByTestId('comment-input');
    const sendBtn = screen.getByTestId('send-comment-btn');

    // First comment by Mẹ Bắp
    await user.type(input, 'Ghi chú 1: Mua dừa xiêm');
    await user.click(sendBtn);

    // Second comment by Mẹ Bắp
    await user.type(input, 'Ghi chú 2: Luộc trứng trước');
    await user.click(sendBtn);

    await waitFor(() => {
      const comments = screen.getAllByTestId(/comment-content/);
      expect(comments).toHaveLength(2);
      expect(comments[0]).toHaveTextContent('Ghi chú 1: Mua dừa xiêm');
      expect(comments[1]).toHaveTextContent('Ghi chú 2: Luộc trứng trước');
    });
  });

  it('allows other family members to read existing comments upon opening dish detail', async () => {
    const user = userEvent.setup();

    // First render with Mẹ Bắp writing a comment
    const { unmount } = render(
      <PlanView
        householdCode={householdCode}
        nickname="Mẹ Bắp"
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng'));
    const input = await screen.findByTestId('comment-input');
    await user.type(input, 'Bố Ken nhớ ướp thịt từ chiều');
    await user.click(screen.getByTestId('send-comment-btn'));

    await waitFor(() => {
      expect(screen.getByText('Bố Ken nhớ ướp thịt từ chiều')).toBeInTheDocument();
    });

    unmount();

    // Now Bố Ken opens the app and checks the dish detail
    render(
      <PlanView
        householdCode={householdCode}
        nickname="Bố Ken"
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng'));

    // Bố Ken can see Mẹ Bắp's comment
    await waitFor(() => {
      expect(screen.getByText('Bố Ken nhớ ướp thịt từ chiều')).toBeInTheDocument();
      expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
    });
  });

  it('automatically wipes all comments when dish is removed from meal in plan', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        nickname={nickname}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    // Add a comment first
    await user.click(screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng'));
    const input = await screen.findByTestId('comment-input');
    await user.type(input, 'Dặn dò quan trọng');
    await user.click(screen.getByTestId('send-comment-btn'));

    await waitFor(() => {
      expect(screen.getByText('Dặn dò quan trọng')).toBeInTheDocument();
    });

    // Close detail drawer
    await user.click(screen.getByTestId('close-dish-detail-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('dish-detail-drawer')).not.toBeInTheDocument();
    });

    // Find dish id
    const dishes = await dishRepo.getDishes(householdCode);
    const dishId = dishes[0].id;

    // Remove dish from meal
    const removeBtn = screen.getByTestId(`remove-dish-from-meal-${dishId}`);
    await user.click(removeBtn);

    // Verify dish is removed from current meal
    await waitFor(() => {
      expect(screen.queryByText('Thịt kho trứng')).not.toBeInTheDocument();
    });

    // Now re-add the dish to the meal
    await user.click(screen.getByTestId('add-dish-to-plan-btn'));
    await user.click(screen.getByTestId(`picker-dish-item-${dishId}`));
    await user.click(screen.getByTestId('confirm-add-dishes-btn'));

    // Reopen dish detail
    await waitFor(() => {
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('plan-dish-card-trigger-Thịt kho trứng'));

    // Old comment must NOT exist anymore! Thread must be empty!
    await waitFor(() => {
      expect(screen.queryByText('Dặn dò quan trọng')).not.toBeInTheDocument();
      expect(screen.getByText(/Chưa có dặn dò nào/i)).toBeInTheDocument();
    });
  });
});
