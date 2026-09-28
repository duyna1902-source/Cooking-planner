import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanView } from '../../src/components/PlanView';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';

describe('Weekly Plan Integration', () => {
  let dishRepo: InMemoryDishRepository;
  let planRepo: InMemoryPlanRepository;
  const householdCode = 'BEP-892';
  const fixedDate = '2026-09-29'; // Tuesday

  beforeEach(async () => {
    dishRepo = new InMemoryDishRepository();
    planRepo = new InMemoryPlanRepository();

    // Populate some initial dishes in Menu
    await dishRepo.addDish(householdCode, { name: 'Thịt kho trứng', tag: 'Món mặn' });
    await dishRepo.addDish(householdCode, { name: 'Canh chua cá lóc', tag: 'Canh' });
    await dishRepo.addDish(householdCode, { name: 'Rau muống xào tỏi', tag: 'Xào' });
  });

  it('renders horizontal week ribbon from Thứ 2 to Chủ nhật with Bữa Tối active by default', async () => {
    render(
      <PlanView
        householdCode={householdCode}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Date ribbon exists
    const ribbon = screen.getByTestId('date-ribbon');
    expect(ribbon).toBeInTheDocument();

    // 7 days rendered (T2 to CN)
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    dayLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    // Bữa Tối is active by default
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Bữa Tối/i })).toBeInTheDocument();
    });
    const dinnerTab = screen.getByTestId('meal-tab-dinner');
    expect(dinnerTab).toHaveClass('font-bold');
    expect(screen.getByText('✨ Bữa chính')).toBeInTheDocument();
  });

  it('automatically sets Bữa Tối as default when switching between days in ribbon', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Bữa Tối/i })).toBeInTheDocument();
    });

    // Switch to Bữa Sáng first
    const breakfastTab = screen.getByTestId('meal-tab-breakfast');
    await user.click(breakfastTab);
    expect(screen.getByRole('heading', { level: 2, name: /Bữa Sáng/i })).toBeInTheDocument();

    // Now tap on a different day in the ribbon (e.g. Thứ 4 / index 2)
    const dayWedBtn = screen.getByTestId('day-btn-2');
    await user.click(dayWedBtn);

    // Dinner-first UX rule: active meal must immediately revert to Bữa Tối!
    expect(screen.getByRole('heading', { level: 2, name: /Bữa Tối/i })).toBeInTheDocument();
    expect(screen.getByTestId('meal-tab-dinner')).toHaveClass('font-bold');
  });

  it('allows switching between Bữa Sáng, Bữa Trưa, and Bữa Tối tabs', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Bữa Tối/i })).toBeInTheDocument();
    });

    // Switch to Bữa Trưa
    await user.click(screen.getByTestId('meal-tab-lunch'));
    expect(screen.getByRole('heading', { level: 2, name: /Bữa Trưa/i })).toBeInTheDocument();

    // Switch to Bữa Sáng
    await user.click(screen.getByTestId('meal-tab-breakfast'));
    expect(screen.getByRole('heading', { level: 2, name: /Bữa Sáng/i })).toBeInTheDocument();

    // Switch back to Bữa Tối
    await user.click(screen.getByTestId('meal-tab-dinner'));
    expect(screen.getByRole('heading', { level: 2, name: /Bữa Tối/i })).toBeInTheDocument();
  });

  it('opens Bottom Sheet Drawer on "+ Thêm Món ăn" and supports instant search by name and tag', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    const openDrawerBtn = screen.getByTestId('add-dish-to-plan-btn');
    await user.click(openDrawerBtn);

    // Drawer is open
    expect(screen.getByTestId('dish-picker-drawer')).toBeInTheDocument();
    expect(screen.getByText(/Chọn Món ăn cho Bữa Tối/)).toBeInTheDocument();

    // All 3 dishes visible
    expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    expect(screen.getByText('Canh chua cá lóc')).toBeInTheDocument();
    expect(screen.getByText('Rau muống xào tỏi')).toBeInTheDocument();

    // Search by name (including diacritic-free typing)
    const searchInput = screen.getByTestId('picker-search-input');
    await user.type(searchInput, 'thit');
    expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    expect(screen.queryByText('Canh chua cá lóc')).not.toBeInTheDocument();

    // Search by tag
    await user.clear(searchInput);
    await user.type(searchInput, 'Xào');
    expect(screen.getByText('Rau muống xào tỏi')).toBeInTheDocument();
    expect(screen.queryByText('Thịt kho trứng')).not.toBeInTheDocument();

    // Search with no results
    await user.clear(searchInput);
    await user.type(searchInput, 'Khong co mon');
    expect(screen.getByText(/Không tìm thấy Món ăn nào phù hợp/)).toBeInTheDocument();
  });

  it('allows ticking one or multiple Món ăn and confirms adding them to current meal', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Open drawer
    await user.click(screen.getByTestId('add-dish-to-plan-btn'));

    // Tick two dishes
    const dishes = await dishRepo.getDishes(householdCode);
    const dish1 = dishes.find((d) => d.name === 'Thịt kho trứng')!;
    const dish2 = dishes.find((d) => d.name === 'Canh chua cá lóc')!;

    await user.click(screen.getByTestId(`picker-dish-item-${dish1.id}`));
    await user.click(screen.getByTestId(`picker-dish-item-${dish2.id}`));

    // Confirm button shows 2 dishes selected
    const confirmBtn = screen.getByTestId('confirm-add-dishes-btn');
    expect(confirmBtn).toHaveTextContent('2 Món ăn');

    await user.click(confirmBtn);

    // Drawer closes
    await waitFor(() => {
      expect(screen.queryByTestId('dish-picker-drawer')).not.toBeInTheDocument();
    });

    // Dishes now appear in the meal card list
    expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    expect(screen.getByText('Canh chua cá lóc')).toBeInTheDocument();
    expect(screen.getByText('2 Món ăn')).toBeInTheDocument();

    // Persisted in planRepository
    const stored = await planRepo.getPlanItems(householdCode, fixedDate, fixedDate);
    expect(stored).toHaveLength(2);
    expect(stored.map((i) => i.dishId)).toContain(dish1.id);
    expect(stored.map((i) => i.dishId)).toContain(dish2.id);
  });

  it('allows removing a Món ăn from a meal', async () => {
    const user = userEvent.setup();

    // Pre-schedule a dish
    const dishes = await dishRepo.getDishes(householdCode);
    const dish = dishes[0];
    await planRepo.addDishesToMeal(householdCode, fixedDate, 'dinner', [dish.id]);

    render(
      <PlanView
        householdCode={householdCode}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Dish is shown
    await waitFor(() => {
      expect(screen.getByText(dish.name)).toBeInTheDocument();
    });

    // Click remove button
    const removeBtn = screen.getByTestId(`remove-dish-from-meal-${dish.id}`);
    await user.click(removeBtn);

    // Dish is removed from UI
    await waitFor(() => {
      expect(screen.queryByText(dish.name)).not.toBeInTheDocument();
    });
    expect(screen.getByText('0 Món ăn')).toBeInTheDocument();

    // Persisted in repository
    const stored = await planRepo.getPlanItems(householdCode, fixedDate, fixedDate);
    expect(stored).toHaveLength(0);
  });

  it('navigates between previous and next weeks', async () => {
    const user = userEvent.setup();
    render(
      <PlanView
        householdCode={householdCode}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Click next week button
    const nextWeekBtn = screen.getByTestId('next-week-btn');
    await user.click(nextWeekBtn);

    // Dates shifted by 7 days (next Monday is 2026-10-05)
    expect(screen.getByText('5')).toBeInTheDocument();

    // Click prev week button back to current week
    const prevWeekBtn = screen.getByTestId('prev-week-btn');
    await user.click(prevWeekBtn);
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('marks already scheduled dishes as disabled in drawer and prevents duplicate selection', async () => {
    const user = userEvent.setup();
    const dishes = await dishRepo.getDishes(householdCode);
    const scheduledDish = dishes[0]; // 'Thịt kho trứng'

    // Pre-schedule dish in dinner
    await planRepo.addDishesToMeal(householdCode, fixedDate, 'dinner', [scheduledDish.id]);

    render(
      <PlanView
        householdCode={householdCode}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(scheduledDish.name)).toBeInTheDocument();
    });

    // Open drawer
    await user.click(screen.getByTestId('add-dish-to-plan-btn'));

    // The scheduled dish should have "Đã lên lịch" badge and aria-disabled="true"
    const scheduledItem = screen.getByTestId(`picker-dish-item-${scheduledDish.id}`);
    expect(scheduledItem).toHaveAttribute('aria-disabled', 'true');
    expect(scheduledItem).toHaveTextContent('Đã lên lịch');

    // Clicking it should not select it
    await user.click(scheduledItem);
    const confirmBtn = screen.getByTestId('confirm-add-dishes-btn');
    expect(confirmBtn).toHaveTextContent('0 Món ăn');
    expect(confirmBtn).toBeDisabled();
  });
});
