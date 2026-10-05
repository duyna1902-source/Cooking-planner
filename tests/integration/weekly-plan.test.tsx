import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  describe('In-List Quick Add and Empty State in Plan Picker Drawer (Ticket 01)', () => {
    it('appends quick-add prompt at the end of scrollable list when search has partial matching dishes', async () => {
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
      const searchInput = screen.getByTestId('picker-search-input');

      // Search for 'Thịt' (matches 'Thịt kho trứng', but not exact match)
      await user.type(searchInput, 'Thịt');

      // Matching dish appears
      const dishes = await dishRepo.getDishes(householdCode);
      const thitKhoTrung = dishes.find((d) => d.name === 'Thịt kho trứng')!;
      const dishItem = screen.getByTestId(`picker-dish-item-${thitKhoTrung.id}`);
      expect(dishItem).toBeInTheDocument();

      // Quick add banner appears at end of scrollable list
      const list = screen.getByTestId('picker-dish-list');
      const quickAddBanner = screen.getByTestId('picker-quick-add-banner');
      expect(list).toContainElement(dishItem);
      expect(list).toContainElement(quickAddBanner);

      // Order: quickAddBanner comes after dishItem
      expect(dishItem.compareDocumentPosition(quickAddBanner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(screen.getByTestId('picker-quick-add-btn')).toBeInTheDocument();
    });

    it('displays centered empty state with quick-add button and clear search button when zero matches found', async () => {
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
      const searchInput = screen.getByTestId('picker-search-input');

      // Search for query with zero matches
      await user.type(searchInput, 'Pizza thập cẩm');

      // Centered empty state displays unfound message
      expect(
        screen.getByText(/Không tìm thấy Món ăn nào phù hợp với/i)
      ).toBeInTheDocument();
      expect(screen.getByText('Pizza thập cẩm')).toBeInTheDocument();

      // Quick-add button is available in empty state
      const quickAddBtn = screen.getByTestId('picker-quick-add-btn');
      expect(quickAddBtn).toBeInTheDocument();
      expect(screen.getByTestId('picker-quick-add-banner')).toBeInTheDocument();

      // "Xóa tìm kiếm" button is present and clicking it resets search query
      const clearSearchBtn = screen.getByTestId('clear-search-btn');
      expect(clearSearchBtn).toHaveTextContent('Xóa tìm kiếm');
      await user.click(clearSearchBtn);

      expect((searchInput as HTMLInputElement).value).toBe('');
      expect(screen.queryByTestId('clear-search-btn')).not.toBeInTheDocument();
      // All existing dishes are shown again
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
    });

    it('shows zero-match empty state and enables quick-add when search query is entered in an empty menu', async () => {
      const emptyDishRepo = new InMemoryDishRepository();
      const user = userEvent.setup();
      render(
        <PlanView
          householdCode={householdCode}
          dishRepository={emptyDishRepo}
          planRepository={planRepo}
          initialDate={fixedDate}
        />
      );

      // Open drawer
      await user.click(screen.getByTestId('add-dish-to-plan-btn'));

      // Initially dishes list is empty, with empty query -> shows static empty menu state
      expect(screen.getByText('Menu gia đình chưa có Món ăn nào.')).toBeInTheDocument();
      expect(screen.getByText('Vui lòng vào tab Menu để thêm Món ăn trước.')).toBeInTheDocument();

      // Enter search query
      const searchInput = screen.getByTestId('picker-search-input');
      await user.type(searchInput, 'Phở bò');

      // Static empty menu state is hidden
      expect(screen.queryByText('Menu gia đình chưa có Món ăn nào.')).not.toBeInTheDocument();

      // Zero-match empty state appears with query, quick-add button, and clear search button
      expect(screen.getByText(/Không tìm thấy Món ăn nào phù hợp với/i)).toBeInTheDocument();
      expect(screen.getByText('Phở bò')).toBeInTheDocument();
      expect(screen.getByTestId('picker-quick-add-btn')).toBeInTheDocument();
      expect(screen.getByTestId('clear-search-btn')).toBeInTheDocument();

      // Clicking quick-add opens modal with query pre-filled
      await user.click(screen.getByTestId('picker-quick-add-btn'));
      const modalNameInput = screen.getByTestId('dish-name-input') as HTMLInputElement;
      expect(modalNameInput.value).toBe('Phở bò');

      // Fill in tag and save
      await user.type(screen.getByTestId('dish-tag-input'), 'Món nước');
      await user.click(screen.getByTestId('save-dish-btn'));

      // Drawer closes and newly created dish is scheduled into meal
      await waitFor(() => {
        expect(screen.queryByTestId('dish-picker-drawer')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Phở bò')).toBeInTheDocument();
      const updatedDishes = await emptyDishRepo.getDishes(householdCode);
      expect(updatedDishes).toHaveLength(1);
      expect(updatedDishes[0].name).toBe('Phở bò');
    });

    it('hides quick-add prompt when query exactly matches existing dish name (case-insensitive and trimmed)', async () => {
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
      const searchInput = screen.getByTestId('picker-search-input');

      // Type an exact match with leading/trailing spaces and different casing
      await user.type(searchInput, '  thịt kho trứng  ');

      // Matching dish is shown
      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();

      // Quick add prompt must be hidden
      expect(screen.queryByTestId('picker-quick-add-banner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('picker-quick-add-btn')).not.toBeInTheDocument();
    });

    it('combines pre-checked dishes and newly created dish, schedules both, and closes drawer', async () => {
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

      // Check an existing dish (e.g. 'Canh chua cá lóc')
      const dishes = await dishRepo.getDishes(householdCode);
      const canhChua = dishes.find((d) => d.name === 'Canh chua cá lóc')!;
      await user.click(screen.getByTestId(`picker-dish-item-${canhChua.id}`));

      // Now search for a new dish
      const searchInput = screen.getByTestId('picker-search-input');
      await user.type(searchInput, 'Gà rang muối');

      // Tap + Thêm món button on sticky banner
      const addDishBtn = screen.getByTestId('picker-quick-add-btn');
      await user.click(addDishBtn);

      // DishModal opens with prefilled name
      const modalNameInput = screen.getByTestId('dish-name-input') as HTMLInputElement;
      expect(modalNameInput.value).toBe('Gà rang muối');

      // Fill in tag and submit modal
      const modalTagInput = screen.getByTestId('dish-tag-input');
      await user.type(modalTagInput, 'Món mặn');
      await user.click(screen.getByTestId('save-dish-btn'));

      // Both DishModal and DishPickerDrawer should close
      await waitFor(() => {
        expect(screen.queryByTestId('dish-picker-drawer')).not.toBeInTheDocument();
      });

      // Both the pre-selected dish and the new dish should appear in Bữa Tối
      await waitFor(() => {
        expect(screen.getByText('Canh chua cá lóc')).toBeInTheDocument();
        expect(screen.getByText('Gà rang muối')).toBeInTheDocument();
      });

      // Newly created dish is saved in household Menu
      const updatedMenu = await dishRepo.getDishes(householdCode);
      const newDishInMenu = updatedMenu.find((d) => d.name === 'Gà rang muối');
      expect(newDishInMenu).toBeDefined();
      expect(newDishInMenu?.tag).toBe('Món mặn');
    });

    it('retains checked dishes and search query when user cancels modal', async () => {
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

      // Check an existing dish
      const dishes = await dishRepo.getDishes(householdCode);
      const canhChua = dishes.find((d) => d.name === 'Canh chua cá lóc')!;
      await user.click(screen.getByTestId(`picker-dish-item-${canhChua.id}`));

      // Search for new dish
      const searchInput = screen.getByTestId('picker-search-input');
      await user.type(searchInput, 'Mực xào chua ngọt');

      // Click + Thêm món
      await user.click(screen.getByTestId('picker-quick-add-btn'));

      // Cancel modal
      await user.click(screen.getByRole('button', { name: 'Hủy' }));

      // Drawer is still open
      expect(screen.getByTestId('dish-picker-drawer')).toBeInTheDocument();

      // Search query is preserved
      expect((searchInput as HTMLInputElement).value).toBe('Mực xào chua ngọt');

      // Clear search to inspect checked dishes
      await user.clear(searchInput);
      const checkbox = screen.getByTestId(`picker-checkbox-${canhChua.id}`);
      expect(checkbox.className).toContain('bg-[#5B7C99]');
    });
  });

  describe('Responsive Drawer Viewport and Compaction (Ticket 02)', () => {
    it('shows subtitle when drawer opens with empty search and no focus, and collapses subtitle when search is focused or query typed', async () => {
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
      const searchInput = screen.getByTestId('picker-search-input');

      // Meal title and close button are present
      expect(screen.getByRole('heading', { level: 3, name: /Chọn Món ăn cho Bữa Tối/i })).toBeInTheDocument();
      expect(screen.getByTestId('close-dish-picker-btn')).toBeInTheDocument();

      // a) With autoFocus, search input is focused initially and subtitle is collapsed
      expect(document.activeElement).toBe(searchInput);
      expect(screen.queryByTestId('picker-drawer-subtitle')).not.toBeInTheDocument();

      // b) Blurring input with empty search restores subtitle
      await user.tab();
      const subtitle = screen.getByTestId('picker-drawer-subtitle');
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveTextContent('Tick chọn Món ăn từ Menu của gia đình');

      // c) Focusing search input collapses subtitle again, meal title and close button remain visible
      await user.click(searchInput);
      expect(screen.queryByTestId('picker-drawer-subtitle')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Chọn Món ăn cho Bữa Tối/i })).toBeInTheDocument();
      expect(screen.getByTestId('close-dish-picker-btn')).toBeInTheDocument();

      // d) Typing query keeps subtitle collapsed even after blurring
      await user.type(searchInput, 'Canh');
      await user.tab(); // even when blurred, non-empty query keeps subtitle collapsed
      expect(screen.queryByTestId('picker-drawer-subtitle')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Chọn Món ăn cho Bữa Tối/i })).toBeInTheDocument();
      expect(screen.getByTestId('close-dish-picker-btn')).toBeInTheDocument();

      // e) Clearing query and blurring restores subtitle
      await user.clear(searchInput);
      await user.tab();
      expect(screen.getByTestId('picker-drawer-subtitle')).toBeInTheDocument();
    });

    it('applies responsive max height and compaction classes to drawer container, list, and confirm button', async () => {
      const user = userEvent.setup();
      render(
        <PlanView
          householdCode={householdCode}
          dishRepository={dishRepo}
          planRepository={planRepo}
          initialDate={fixedDate}
        />
      );

      await user.click(screen.getByTestId('add-dish-to-plan-btn'));

      // c) The drawer container classes include max-h-[92dvh] and sm:max-h-[85%]
      const drawerContainer = screen.getByTestId('picker-drawer-container');
      expect(drawerContainer).toHaveClass('max-h-[92dvh]');
      expect(drawerContainer).toHaveClass('sm:max-h-[85%]');

      // d) The dish list container has flex-1, min-h-0, overflow-y-auto, overscroll-contain, and does NOT have max-h-[300px]
      const dishList = screen.getByTestId('picker-dish-list');
      expect(dishList).toHaveClass('flex-1');
      expect(dishList).toHaveClass('min-h-0');
      expect(dishList).toHaveClass('overflow-y-auto');
      expect(dishList).toHaveClass('overscroll-contain');
      expect(dishList).not.toHaveClass('max-h-[300px]');

      // e) Confirm button has compact styling (py-2.5)
      const confirmBtn = screen.getByTestId('confirm-add-dishes-btn');
      expect(confirmBtn).toHaveClass('py-2.5');
    });
  });

  describe('Dismiss Keyboard on Scroll and Tap Responsiveness (Ticket 03)', () => {
    it('blurs search input on scroll or touch-move when focused, while preserving query and filtered results', async () => {
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
      const searchInput = screen.getByTestId('picker-search-input');
      const dishList = screen.getByTestId('picker-dish-list');

      // Focus and type query
      await user.type(searchInput, 'Canh');
      expect(document.activeElement).toBe(searchInput);
      expect((searchInput as HTMLInputElement).value).toBe('Canh');
      expect(screen.getByText('Canh chua cá lóc')).toBeInTheDocument();

      // Trigger scroll on dish list
      fireEvent.scroll(dishList);

      // Search input should be blurred
      expect(document.activeElement).not.toBe(searchInput);
      // Query and filtered results are retained
      expect((searchInput as HTMLInputElement).value).toBe('Canh');
      expect(screen.getByText('Canh chua cá lóc')).toBeInTheDocument();

      // Re-focus search input
      await user.click(searchInput);
      expect(document.activeElement).toBe(searchInput);

      // Trigger touch-move on dish list
      fireEvent.touchMove(dishList);

      // Search input should be blurred again
      expect(document.activeElement).not.toBe(searchInput);
      expect((searchInput as HTMLInputElement).value).toBe('Canh');
      expect(screen.getByText('Canh chua cá lóc')).toBeInTheDocument();
    });

    it('immediately selects dish on first tap while search input is focused without being swallowed and confirms into meal', async () => {
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
      const searchInput = screen.getByTestId('picker-search-input');

      // Focus and filter
      await user.type(searchInput, 'Thịt');
      expect(document.activeElement).toBe(searchInput);

      const dishes = await dishRepo.getDishes(householdCode);
      const thitKho = dishes.find((d) => d.name === 'Thịt kho trứng')!;
      const dishItem = screen.getByTestId(`picker-dish-item-${thitKho.id}`);
      const checkbox = screen.getByTestId(`picker-checkbox-${thitKho.id}`);

      // First tap directly on dish item while search is focused
      await user.click(dishItem);

      // Dish is immediately selected on the first tap
      expect(checkbox.className).toContain('bg-[#5B7C99]');
      const confirmBtn = screen.getByTestId('confirm-add-dishes-btn');
      expect(confirmBtn).toHaveTextContent('1 Món ăn');

      // Confirm button works and schedules selected dishes into the active meal
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('dish-picker-drawer')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Thịt kho trứng')).toBeInTheDocument();
      const stored = await planRepo.getPlanItems(householdCode, fixedDate, fixedDate);
      expect(stored.map((i) => i.dishId)).toContain(thitKho.id);
    });
  });
});

